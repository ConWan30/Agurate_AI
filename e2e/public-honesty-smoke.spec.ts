import { test, expect } from '@playwright/test';

const pages = [
  {
    path: '/',
    mustInclude: [/decision aid|research-informed|LSU AgCenter/i],
    mustExclude: [/95%\+ accurate/i, /Trusted by Louisiana Farmers/i, /LSU-Validated/i],
  },
  {
    path: '/beta-signup',
    mustInclude: [/Closed beta|Louisiana Delta|research framing/i],
    mustExclude: [/95% AI Accuracy/i, /Trusted by Louisiana Farmers/i],
  },
  {
    path: '/how-it-works',
    mustInclude: [/How .* Works|research-informed|Public specialist/i],
    mustExclude: [/Expert help in <24hrs/i, /12-18% yield/i, /85-95%/],
  },
  {
    path: '/auth',
    mustInclude: [/LSU AgCenter research|research/i],
    mustExclude: [/Built on 130\+ years of research/i, /Built on LSU AgCenter research/i],
  },
];

test.describe('Public honesty smoke', () => {
  for (const pageCheck of pages) {
    test(`${pageCheck.path} keeps closed-beta honesty copy`, async ({ page }) => {
      await page.goto(pageCheck.path);
      await page.waitForLoadState('networkidle');
      const text = await page.locator('body').innerText();

      for (const pattern of pageCheck.mustInclude) {
        expect(text, `expected ${pattern} on ${pageCheck.path}`).toMatch(pattern);
      }
      for (const pattern of pageCheck.mustExclude) {
        expect(text, `did not expect ${pattern} on ${pageCheck.path}`).not.toMatch(pattern);
      }
    });
  }

  test('static readiness assets are served', async ({ request }) => {
    for (const path of ['/robots.txt', '/sitemap.xml', '/health.json']) {
      const res = await request.get(path);
      expect(res.ok(), path).toBeTruthy();
    }

    const health = await request.get('/health.json');
    const body = await health.json();
    expect(body.status).toBe('ok');
    expect(body.stage).toBe('closed-beta');
    expect(typeof body.commit).toBe('string');
    expect(body.commit.length).toBeGreaterThan(6);
  });
});
