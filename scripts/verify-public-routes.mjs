#!/usr/bin/env node
/**
 * Fails if public marketing routes in App.tsx drift from robots.txt / sitemap.xml.
 * Public routes are those rendered outside ProtectedRoute in src/App.tsx.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');
const ROBOTS = fs.readFileSync(path.join(ROOT, 'public', 'robots.txt'), 'utf8');
const SITEMAP = fs.readFileSync(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8');

/** Routes that must remain publicly crawlable / smoke-tested. */
const REQUIRED_PUBLIC = [
  '/',
  '/auth',
  '/how-it-works',
  '/install',
];

function extractAppPaths(source) {
  return [...source.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
}

function extractRobotAllows(robots) {
  return robots
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('Allow:'))
    .map((l) => l.replace(/^Allow:\s*/, '').trim());
}

function extractSitemapPaths(sitemap) {
  return [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) =>
    m[1] === '' ? '/' : m[1]
  );
}

const appPaths = new Set(extractAppPaths(APP));
const robotAllows = new Set(extractRobotAllows(ROBOTS));
const sitemapPaths = new Set(extractSitemapPaths(SITEMAP));

const errors = [];

for (const route of REQUIRED_PUBLIC) {
  if (!appPaths.has(route)) {
    errors.push(`App.tsx missing required public route ${route}`);
  }
  if (!robotAllows.has(route)) {
    errors.push(`robots.txt missing Allow for ${route}`);
  }
  if (!sitemapPaths.has(route)) {
    errors.push(`sitemap.xml missing loc for ${route}`);
  }
}

// Protected-looking top-level routes should not be Allow-listed.
for (const allow of robotAllows) {
  if (allow === '/') continue;
  if (REQUIRED_PUBLIC.includes(allow)) continue;
  if (allow.startsWith('/demo')) {
    errors.push(`robots.txt should not Allow demo route ${allow}`);
  }
}

if (errors.length) {
  console.error('Public route alignment failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `Public route alignment OK (${REQUIRED_PUBLIC.length} routes checked against App, robots.txt, sitemap.xml).`
);
