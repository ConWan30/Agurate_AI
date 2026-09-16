#!/usr/bin/env node
/**
 * Authenticated Morehouse Parish × soybean scan verifier.
 *
 * Requires:
 *   AGURATE_PILOT_TEST_EMAIL
 *   AGURATE_PILOT_TEST_PASSWORD
 * Optional:
 *   VITE_SUPABASE_URL / SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY / ANON / SUPABASE_ANON_KEY
 *   SCAN_IMAGE_PATH — local image (defaults to a tiny generated PNG)
 *
 * Pass (fail-closed honesty):
 *   - Real numeric health_score + assessment_id from analyze-crop, OR
 *   - Clear non-empty error — never a silent invented score
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const email = process.env.AGURATE_PILOT_TEST_EMAIL || '';
const password = process.env.AGURATE_PILOT_TEST_PASSWORD || '';
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const anon =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.ANON ||
  process.env.SUPABASE_ANON_KEY ||
  '';

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
}
function pass(msg) {
  console.log(`PASS  ${msg}`);
}

if (!email || !password) {
  fail('AGURATE_PILOT_TEST_EMAIL and AGURATE_PILOT_TEST_PASSWORD are required');
}
if (!url || !anon) {
  fail('Supabase URL + publishable/anon key are required');
}

function tinyPngBytes() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

const imagePath =
  process.env.SCAN_IMAGE_PATH ||
  (() => {
    const p = join(tmpdir(), `agurate-morehouse-scan-${randomUUID()}.png`);
    writeFileSync(p, tinyPngBytes());
    return p;
  })();
if (!existsSync(imagePath)) fail(`SCAN_IMAGE_PATH not found: ${imagePath}`);

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (authError || !authData.user) {
  fail(`sign-in failed: ${authError?.message || 'no user'}`);
}
pass(`signed in as ${authData.user.id}`);

let fieldId;
{
  const { data: fields, error } = await supabase
    .from('fields')
    .select('id, crop_type, name')
    .eq('user_id', authData.user.id)
    .limit(20);
  if (error) fail(`fields select failed: ${error.message}`);
  const soybean = (fields || []).find((f) => {
    const c = String(f.crop_type || '').toLowerCase();
    return c === 'soybean' || c === 'soybeans';
  });
  if (soybean) {
    fieldId = soybean.id;
    pass(`using existing soybean field ${fieldId}`);
  } else {
    const { data: created, error: insertError } = await supabase
      .from('fields')
      .insert({
        user_id: authData.user.id,
        name: `Morehouse pilot scan ${new Date().toISOString().slice(0, 10)}`,
        crop_type: 'soybean',
        location_lat: 32.7785,
        location_lng: -91.8723,
        acreage: 1,
      })
      .select('id')
      .single();
    if (insertError || !created) {
      fail(`field insert failed: ${insertError?.message || 'no row'}`);
    }
    fieldId = created.id;
    pass(`created soybean field ${fieldId}`);
  }
}

const bytes = readFileSync(imagePath);
const storagePath = `${authData.user.id}/pilot-scan-${Date.now()}.png`;
const { error: uploadError } = await supabase.storage
  .from('crop-images')
  .upload(storagePath, bytes, { contentType: 'image/png', upsert: false });
if (uploadError) fail(`storage upload failed: ${uploadError.message}`);
pass(`uploaded ${storagePath}`);

const { data: signed, error: signedError } = await supabase.storage
  .from('crop-images')
  .createSignedUrl(storagePath, 3600);
if (signedError || !signed?.signedUrl) {
  fail(`signed URL failed: ${signedError?.message || 'missing url'}`);
}

// Payload keys match src/pages/Scanner.tsx + analyze-crop edge schema.
const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-crop', {
  body: {
    imageUrl: signed.signedUrl,
    cropType: 'soybean',
    fieldId,
    storagePath,
    photoLocationLat: 32.7785,
    photoLocationLng: -91.8723,
    gpsAccuracyMeters: 25,
    capturedOffline: false,
  },
});

if (aiError) {
  pass(`analyze-crop returned clear error (fail-closed): ${aiError.message}`);
  console.log(
    'NOTE  Authenticated Morehouse soybean scan path exercised; clear error is acceptable when AI cannot score.',
  );
  process.exit(0);
}
if (aiResult?.error) {
  pass(`analyze-crop returned clear error payload (fail-closed): ${aiResult.error}`);
  process.exit(0);
}

const score = aiResult?.health_score ?? aiResult?.healthScore;
if (score == null || Number.isNaN(Number(score))) {
  fail(
    `analyze-crop returned no health_score and no error (invent risk): ${JSON.stringify(aiResult)?.slice(0, 400)}`,
  );
}
if (!aiResult?.assessment_id) {
  fail('health_score present but assessment_id missing (persist path incomplete)');
}
pass(
  `analyze-crop health_score=${score} assessment_id=${aiResult.assessment_id} (Morehouse soybean authenticated path)`,
);
console.log('Authenticated Morehouse soybean scan PASS');
