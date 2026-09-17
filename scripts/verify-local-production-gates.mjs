#!/usr/bin/env node
/**
 * Runs in-repo production gates that do not require Supabase/deploy credentials.
 * Exits non-zero if any gate fails. Always prints the remaining platform blockers.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const GATES = [
  { name: 'public routes', cmd: 'npm', args: ['run', 'verify:public-routes'] },
  { name: 'lint', cmd: 'npm', args: ['run', 'lint', '--', '--max-warnings=110'] },
  { name: 'AI transport', cmd: 'npm', args: ['run', 'test:edge'] },
  { name: 'typecheck', cmd: 'npm', args: ['run', 'typecheck'] },
  { name: 'unit tests', cmd: 'npm', args: ['run', 'test:ci'] },
  { name: 'honesty static', cmd: 'npm', args: ['run', 'verify:honesty:static'] },
  { name: 'lock migrations', cmd: 'npm', args: ['run', 'verify:lock-migrations'] },
  { name: 'edge typecheck', cmd: 'npm', args: ['run', 'check:edge'] },
  { name: 'production build', cmd: 'npm', args: ['run', 'build'], env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY:
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example',
  } },
  { name: 'health stamp', cmd: 'npm', args: ['run', 'verify:health-stamp'] },
  {
    name: 'honesty e2e',
    cmd: 'npm',
    args: ['run', 'test:e2e:honesty'],
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY:
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example',
      // Allow reuse when a prior gate left :8080 occupied; CI installs a fresh server.
      PLAYWRIGHT_REUSE_SERVER: '1',
    },
  },
];

function latestMigrationId() {
  const dir = path.join(ROOT, 'supabase', 'migrations');
  if (!existsSync(dir)) return '(none)';
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  return files.at(-1)?.replace(/\.sql$/, '') ?? '(none)';
}

function runGate({ name, cmd, args, env }) {
  process.stdout.write(`\n▶ ${name}\n`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${name} failed (exit ${result.status ?? 'unknown'})`);
    return false;
  }
  console.log(`✓ ${name}`);
  return true;
}

const started = Date.now();
const results = GATES.map((gate) => ({ name: gate.name, ok: runGate(gate) }));
const failed = results.filter((r) => !r.ok);
const tipMigration = latestMigrationId();

console.log('\n=== Local production gates ===');
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
}
console.log(`Latest migration in repo: ${tipMigration}`);
console.log(`Elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`);

console.log(`
=== Platform gates (credentials required — not run here) ===
1. Apply Supabase migrations through ${tipMigration}
2. Enable Auth → Leaked Password Protection
3. Deploy edge functions (supabase functions deploy)
4. Set DEMO_SETUP_SECRET (or leave unset to keep demo setup disabled)
5. Publish/deploy the web app
6. Smoke-test production: /, /beta-signup, /auth, /how-it-works

See docs/OPERATOR-PLATFORM-HANDOFF.md for exact commands.
`);

if (failed.length) {
  process.exit(1);
}

console.log('All local production gates passed. Production-complete still requires platform gates above.');
