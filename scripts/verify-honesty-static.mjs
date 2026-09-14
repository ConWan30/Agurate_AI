#!/usr/bin/env node
/**
 * Static honesty gate — fails CI if forbidden marketing claims reappear in source.
 * Does not require a running server.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'index.html', 'public'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.md', '.json']);

const FORBIDDEN = [
  { name: '95% accuracy claim', re: /95%\+?\s*(accurate|AI\s*Accuracy)/i },
  { name: 'Trusted by Louisiana Farmers', re: /Trusted by Louisiana Farmers/i },
  { name: 'LSU-Validated badge', re: /\bLSU[- ]Validated\b/i },
  { name: 'decades of LSU research power claim', re: /powered by decades of LSU research/i },
  { name: 'brokered LSU matching claim', re: /matching you with LSU researchers/i },
  { name: 'faster insurance payouts claim', re: /Faster insurance payouts/i },
  { name: '130+ years research claim', re: /Built on 130\+ years of research/i },
  { name: 'Expert help in <24hrs claim', re: /Expert help in <24hrs/i },
  { name: '85-95% accuracy band', re: /\b85-95%\b/ },
  { name: '40% faster claims claim', re: /40%\s*faster/i },
  { name: '15-25% more payouts claim', re: /15-25%\s*more/i },
  { name: 'fabricated community savings total', re: /\$127K\+?\s*total savings/i },
  { name: 'fabricated tutorial ROI dollars', re: /\$8,247|\$12,400|\$15,200/ },
  { name: 'LSU AgCenter Access brokerage claim', re: /LSU AgCenter Access/i },
  { name: 'fabricated James Collins testimonial', re: /paid for itself in the first month.*James Collins|James Collins.*paid for itself/i },
  { name: 'insurance claim automation claim', re: /Insurance claim automation/i },
  { name: 'direct LSU inquiry brokerage claim', re: /Submit inquiries directly to experts/i },
  { name: 'LSU researcher access plan claim', re: /LSU researcher access/i },
  { name: 'instant health assessment claim', re: /instant health assessment/i },
  { name: 'fabricated 94% confidence claim', re: /\b94%\b/ },
  { name: 'fabricated $15K savings placeholder', re: /\$15K/i },
  { name: 'unsourced $20-50 per acre claim', re: /\$20-50\s*per\s*acre/i },
  { name: '80% faster than traditional claim', re: /80%\s*faster\s*than\s*traditional/i },
  { name: 'hardcoded beta $39.50 price', re: /\$39\.50/ },
  { name: 'hardcoded beta $49/mo price', re: /\$49\/mo/ },
  { name: 'hardcoded $790/year plan price', re: /\$790\/year/i },
  { name: 'hardcoded $158/year plan price', re: /\$158\/year/i },
  { name: '80% lifetime discount claim', re: /80%\s*lifetime\s*discount/i },
  { name: 'presented fictional James as real farmer', re: /a real Louisiana Delta farmer/i },
];

/** Positive partnership claims only (negations / disclaimers are allowed). */
const PARTNERSHIP_POSITIVE = [
  /\bwe are an official LSU partner\b/i,
  /\bofficial LSU partner(?:ship)?\b(?![^.!?\n]*(?:not|do not|don't|never|no claim))/i,
  /\bLSU[- ]powered\b/i,
  /\bpartnered with LSU\b/i,
];

function walk(entry, files = []) {
  const full = path.join(ROOT, entry);
  if (!fs.existsSync(full)) return files;
  const stat = fs.statSync(full);
  if (stat.isFile()) {
    files.push(full);
    return files;
  }
  for (const name of fs.readdirSync(full)) {
    if (
      name === 'node_modules' ||
      name === 'dist' ||
      name === '__tests__' ||
      name === 'e2e' ||
      name.startsWith('.')
    ) {
      continue;
    }
    walk(path.join(entry, name), files);
  }
  return files;
}

function lineLooksLikeDisclaimer(line) {
  return /\b(not|never|no claim|do not|don't|isn't|is not|are not|aren't)\b/i.test(line);
}

const files = SCAN_DIRS.flatMap((d) => walk(d)).filter((f) => {
  const ext = path.extname(f).toLowerCase();
  if (!EXTENSIONS.has(ext)) return false;
  if (/\.(test|spec)\.(t|j)sx?$/.test(f)) return false;
  return true;
});

const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of FORBIDDEN) {
    if (rule.re.test(text)) {
      hits.push({ file: path.relative(ROOT, file), rule: rule.name });
    }
  }

  for (const line of text.split(/\n/)) {
    if (!/official LSU partner|LSU[- ]powered|partnered with LSU/i.test(line)) continue;
    if (lineLooksLikeDisclaimer(line)) continue;
    if (PARTNERSHIP_POSITIVE.some((re) => re.test(line))) {
      hits.push({
        file: path.relative(ROOT, file),
        rule: 'positive LSU partnership claim',
      });
    }
  }
}

if (hits.length) {
  console.error('Honesty static verify failed:');
  for (const hit of hits) {
    console.error(`  - ${hit.file}: ${hit.rule}`);
  }
  process.exit(1);
}

console.log(`Honesty static verify passed (${files.length} files scanned).`);
