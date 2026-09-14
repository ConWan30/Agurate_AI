#!/usr/bin/env node
/**
 * Asserts dist/health.json was stamped with the current tip commit.
 * Run after `npm run build`.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const healthPath = path.join(root, 'dist', 'health.json');

if (!existsSync(healthPath)) {
  console.error(`FAIL  ${healthPath} missing — run production build first`);
  process.exit(1);
}

let expected = process.env.EXPECTED_COMMIT || process.env.GITHUB_SHA || '';
if (!expected) {
  try {
    expected = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    expected = '';
  }
}

let health;
try {
  health = JSON.parse(readFileSync(healthPath, 'utf8'));
} catch {
  console.error('FAIL  dist/health.json is not valid JSON');
  process.exit(1);
}

const status = health.status ?? health.state;
if (status !== 'ok') {
  console.error(`FAIL  health.status=${status} (expected ok)`);
  process.exit(1);
}

const commit = health.commit ?? health.commitSha;
if (!commit || commit === 'unknown') {
  console.error(`FAIL  health.commit missing/unknown (got ${commit})`);
  process.exit(1);
}

if (
  expected &&
  commit !== expected &&
  !expected.startsWith(commit) &&
  !commit.startsWith(expected)
) {
  console.error(`FAIL  health.commit=${commit} does not match tip ${expected}`);
  process.exit(1);
}

console.log(`PASS  dist/health.json commit=${commit}${expected ? ' (matched tip)' : ''}`);
