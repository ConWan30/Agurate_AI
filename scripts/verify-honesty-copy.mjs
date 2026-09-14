import { chromium } from '@playwright/test';
import fs from 'fs';

const outDir = '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(outDir, { recursive: true });

const checks = [
  {
    name: 'home',
    path: '/',
    mustInclude: ['FREE BETA', 'decision aid', 'Be one of the first voices', 'Framed around LSU AgCenter research'],
    mustExclude: ['95%+ accurate', 'Trusted by Louisiana Farmers', 'LSU-Validated'],
  },
  {
    name: 'beta-signup',
    path: '/beta-signup',
    mustInclude: ['Closed beta for Louisiana Delta farmers', 'Research framing only', 'Not scientifically validated'],
    mustExclude: ['95% AI Accuracy', 'Trusted by Louisiana Farmers'],
  },
  {
    name: 'how-it-works',
    path: '/how-it-works',
    mustInclude: ['Confidence-aware', 'Closed beta'],
    mustExclude: ['85-95%', '80-90%'],
  },
  {
    name: 'auth',
    path: '/auth',
    mustInclude: ['Research-informed', 'Framed around public LSU AgCenter research'],
    mustExclude: ['Built on 130+ years of research'],
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];

for (const check of checks) {
  await page.goto(`http://127.0.0.1:5173${check.path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const text = await page.locator('body').innerText();
  const missing = check.mustInclude.filter((s) => !text.includes(s));
  const presentBad = check.mustExclude.filter((s) => text.includes(s));
  const shot = `${outDir}/honesty-${check.name}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  results.push({
    page: check.name,
    pass: missing.length === 0 && presentBad.length === 0,
    missing,
    presentBad,
    screenshot: shot,
  });
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass);
process.exit(failed.length ? 1 : 0);
