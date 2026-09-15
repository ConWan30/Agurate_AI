#!/usr/bin/env node
/**
 * Tip production smoke against a host that may require a session cookie
 * (e.g. Netlify anonymous drop password gate).
 *
 * Usage:
 *   PRODUCTION_URL=https://... EXPECTED_COMMIT=$(git rev-parse HEAD) \
 *   COOKIE='name=value' node scripts/smoke-tip-with-cookie.mjs
 *
 * Or with Netlify drop password:
 *   PRODUCTION_URL=https://... NETLIFY_SITE_PASSWORD='My-Drop-Site' \
 *   EXPECTED_COMMIT=$(git rev-parse HEAD) node scripts/smoke-tip-with-cookie.mjs
 */
import { execSync } from 'node:child_process';

const base = (process.env.PRODUCTION_URL || '').replace(/\/$/, '');
const expected =
  process.env.EXPECTED_COMMIT ||
  (() => {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  })();

if (!base) {
  console.error('PRODUCTION_URL is required');
  process.exit(2);
}

const forbidden = [
  { name: '95%+ accuracy claim', re: /95%\+?\s*(accuracy|accurate)/i },
  { name: 'LSU AgCenter Validated badge', re: /LSU AgCenter Validated/i },
  { name: 'LSU-Validated badge', re: /\bLSU[- ]Validated\b/i },
  { name: 'Trusted by 100+ Farmers', re: /Trusted by 100\+?\s*Farmers/i },
  { name: 'Trusted by Louisiana Farmers', re: /Trusted by Louisiana Farmers/i },
  { name: 'Free unlimited access claim', re: /Free unlimited access/i },
  { name: '24/7 AI advisor claim', re: /24\/7 AI advisor/i },
  { name: 'fabricated James Mitchell testimonial', re: /James Mitchell/i },
  { name: 'fabricated Sarah Thompson testimonial', re: /Sarah Thompson/i },
  { name: 'fabricated Robert Davis testimonial', re: /Robert Davis/i },
  { name: 'fabricated James Collins testimonial', re: /James Collins/i },
  { name: '130+ years research claim', re: /130\+\s*Years of (?:LSU )?Research/i },
  { name: 'Built on 130+ years claim', re: /Built on 130\+ years of research/i },
  { name: 'Connect directly with LSU experts claim', re: /Connect directly with LSU AgCenter experts/i },
  { name: 'fabricated community savings total', re: /\$127K\+?\s*total savings/i },
  { name: 'fabricated $127K savings', re: /\$127,?000|\$127K/i },
];

async function sessionHeaders() {
  if (process.env.COOKIE) return { cookie: process.env.COOKIE };
  const password = process.env.NETLIFY_SITE_PASSWORD;
  if (!password) return {};
  const res = await fetch(`${base}/`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ password }),
  });
  const raw = res.headers.getSetCookie?.() || [];
  const fallback = res.headers.get('set-cookie');
  const parts = raw.length ? raw : fallback ? [fallback] : [];
  const cookie = parts.map((c) => c.split(';')[0]).join('; ');
  if (!cookie) {
    throw new Error('Netlify password POST did not return a session cookie');
  }
  return { cookie };
}

const headers = await sessionHeaders();
const failures = [];

async function check(path, assertFn) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { headers, redirect: 'follow' });
    const text = await res.text();
    await assertFn(res, text, url);
    console.log(`PASS  ${path}`);
  } catch (err) {
    failures.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
    console.error(`FAIL  ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

await check('/health.json', (res, text) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('health.json is not valid JSON');
  }
  const status = json.status ?? json.state;
  if (status !== 'ok') throw new Error(`status=${status}`);
  if (json.stage !== 'closed-beta') throw new Error(`stage=${json.stage}`);
  if (!json.commit) throw new Error('commit missing');
  if (
    expected &&
    json.commit !== expected &&
    !expected.startsWith(json.commit) &&
    !json.commit.startsWith(expected)
  ) {
    throw new Error(`commit=${json.commit} != EXPECTED_COMMIT=${expected}`);
  }
  console.log(`      health commit=${json.commit}${expected ? ' (matched tip)' : ''}`);
});

for (const route of ['/', '/beta-signup', '/auth', '/how-it-works']) {
  await check(route, async (res, text) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (route !== '/') return;
    for (const rule of forbidden) {
      if (rule.re.test(text)) throw new Error(`honesty regression: ${rule.name}`);
    }
    const assets = [...text.matchAll(/\/assets\/[^"'>\s]+\.js/g)].map((m) => m[0]);
    for (const assetPath of [...new Set(assets)].slice(0, 8)) {
      const assetRes = await fetch(`${base}${assetPath}`, { headers });
      if (!assetRes.ok) continue;
      const assetText = await assetRes.text();
      for (const rule of forbidden) {
        if (rule.re.test(assetText)) {
          throw new Error(`honesty regression in ${assetPath}: ${rule.name}`);
        }
      }
    }
    console.log(`      scanned JS assets for dishonest phrases`);
  });
}

if (failures.length) {
  console.error('\nTip smoke FAIL:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`\nTip smoke PASS for ${base}`);
console.log(
  'Still required for production-complete: migrations, leaked-password, edge deploy, DEMO_SETUP_SECRET unset policy, durable public host, authenticated Morehouse soybean scan.',
);
