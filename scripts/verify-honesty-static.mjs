#!/usr/bin/env node
/**
 * Static honesty gate — fails CI if forbidden marketing claims reappear in source.
 * Does not require a running server.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'index.html', 'public', 'supabase/functions'];
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
  { name: 'hardcoded betaPrice 39.50', re: /betaPrice\s*:\s*39\.5/ },
  { name: 'hardcoded plan price 49', re: /\bprice\s*:\s*49\b/ },
  { name: 'unsourced $8-12/acre claim', re: /\$8-12\/acre/i },
  { name: 'unsourced $15-30/acre claim', re: /\$15-30\/acre/i },
  { name: 'instant AI health analysis claim', re: /instant AI health analysis/i },
  { name: 'instant field-specific advice claim', re: /instant field-specific advice/i },
  { name: 'results in seconds claim', re: /(?:delivers results|reads|diagnosis|analysis)\s+in seconds/i },
  { name: 'fabricated tutorial 87% confidence', re: /87%\s*confidence/i },
  { name: 'fabricated tutorial health 68%→92%', re: /Health Score 68%\s*→\s*92%/i },
  { name: 'default USDA source without estimate label', re: /source:\s*priceData\.source\s*\|\|\s*'USDA'/ },
  { name: 'exponentially smarter claim', re: /exponentially smarter/i },
  { name: 'false email invite delivery claim', re: /They'll receive an email with instructions to join/i },
  { name: 'brokered researcher notification claim', re: /You will be notified when the researcher responds/i },
  { name: 'false researcher delivery claim', re: /(?:The )?researcher will receive (?:your|the) (?:case|case details)/i },
  { name: 'every analysis makes smarter claim', re: /Every analysis makes the system smarter/i },
  { name: 'real-time ROI for every recommendation', re: /(?:real-time|realtime) return on investment for every recommendation/i },
  { name: 'instant AI-powered analysis claim', re: /Instant AI-powered analysis/i },
  { name: 'contact request implies email sent', re: /Contact request sent(?![^.\n]*(?:no email|recorded only))/i },
  { name: 'first 100 farmers lifetime 50% claim', re: /Free for First 100.*Lifetime 50%/i },
  { name: 'real-time AI + DIRT integration claim', re: /Real-time AI \+ DIRT integration/i },
  { name: 'instant smartphone analysis claim', re: /Instant smartphone analysis/i },
  { name: 'lifetime 50% discount claim', re: /lifetime 50% discount/i },
  { name: 'first 100 Louisiana farmers FREE claim', re: /first 100 Louisiana farmers with FREE/i },
  { name: 'instant visual assessment claim', re: /instant visual assessment/i },
  { name: 'FREE unlimited access claim', re: /FREE unlimited access/i },
  { name: 'real-time health indicators overlay claim', re: /real-time health indicators overlaid/i },
  { name: '24/7 AI advisor claim', re: /24\/7 (AI |agricultural |Louisiana )?advisor/i },
  { name: '24/7 farming assistant claim', re: /24\/7 Louisiana farming assistant/i },
  { name: '24/7 crop monitoring claim', re: /24\/7 crop monitoring/i },
  { name: 'first 100 louisiana delta farmers claim', re: /Limited to First 100 Louisiana Delta Farmers/i },
  { name: 'direct DIRT integration claim', re: /direct integration to MSU DIRT/i },
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
