#!/usr/bin/env node
/**
 * Production smoke verifier for platform-gate evidence.
 *
 * Usage:
 *   PRODUCTION_URL=https://your.host npm run verify:production-smoke
 *   PRODUCTION_URL=https://your.host EXPECTED_COMMIT=$(git rev-parse HEAD) npm run verify:production-smoke
 *
 * Checks:
 *   - /health.json status/stage/commit tip match
 *   - public routes return HTTP 200: /, /beta-signup, /auth, /how-it-works
 *   - homepage HTML must not contain known dishonest marketing phrases
 *
 * Does NOT claim production-complete — only verifies live publish tip match,
 * public routes, and a live honesty regression check.
 */
import { execSync } from 'node:child_process';

const base = (process.env.PRODUCTION_URL || '').replace(/\/$/, '');
const expectedCommit =
  process.env.EXPECTED_COMMIT ||
  (() => {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  })();

if (!base) {
  console.error('PRODUCTION_URL is required (e.g. https://your-app.lovable.app)');
  process.exit(2);
}

const failures = [];

/** Live homepage must not reintroduce these known dishonest phrases. */
const LIVE_FORBIDDEN = [
  { name: '95%+ accuracy claim', re: /95%\+?\s*(accuracy|accurate)/i },
  { name: 'LSU AgCenter Validated badge', re: /LSU AgCenter Validated/i },
  { name: 'Trusted by 100+ Farmers', re: /Trusted by 100\+?\s*Farmers/i },
  { name: 'Free unlimited access claim', re: /Free unlimited access/i },
  { name: '24/7 AI advisor claim', re: /24\/7 AI advisor/i },
  { name: 'fabricated James Mitchell testimonial', re: /James Mitchell/i },
  { name: 'fabricated Sarah Thompson testimonial', re: /Sarah Thompson/i },
  { name: 'fabricated Robert Davis testimonial', re: /Robert Davis/i },
  { name: '130+ years research claim', re: /130\+\s*Years of (?:LSU )?Research/i },
  { name: 'Connect directly with LSU experts claim', re: /Connect directly with LSU AgCenter experts/i },
];

async function check(path, assertFn) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    assertFn(res, text, url);
    console.log(`PASS  ${path}`);
  } catch (err) {
    failures.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
    console.error(`FAIL  ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

await check('/health.json', (res, text, url) => {
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('health.json is not valid JSON');
  }
  const status = json.status ?? json.state;
  if (status !== 'ok') throw new Error(`status=${status} (expected ok)`);
  if (json.stage !== 'closed-beta') throw new Error(`stage=${json.stage} (expected closed-beta)`);
  if (!json.commit || json.commit === 'unknown') {
    throw new Error(`commit missing/unknown (got ${json.commit})`);
  }
  if (
    expectedCommit &&
    json.commit !== expectedCommit &&
    !expectedCommit.startsWith(json.commit) &&
    !json.commit.startsWith(expectedCommit)
  ) {
    throw new Error(`commit=${json.commit} does not match EXPECTED_COMMIT=${expectedCommit}`);
  }
  console.log(`      health commit=${json.commit}${expectedCommit ? ' (matched tip)' : ''}`);
});

for (const route of ['/', '/beta-signup', '/auth', '/how-it-works']) {
  await check(route, (res, text, url) => {
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    if (route === '/') {
      for (const rule of LIVE_FORBIDDEN) {
        if (rule.re.test(text)) {
          throw new Error(`live honesty regression: ${rule.name}`);
        }
      }
    }
  });
}

if (failures.length) {
  console.error(`\nProduction smoke FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('\nPlatform publish/smoke gate is NOT evidenced.');
  process.exit(1);
}

console.log('\nProduction smoke PASS for public routes + /health.json + live honesty phrases.');
console.log(
  'Still required for production-complete (manual): migrations, leaked-password protection, edge deploy, DEMO_SETUP_SECRET policy, authenticated scan path.'
);
