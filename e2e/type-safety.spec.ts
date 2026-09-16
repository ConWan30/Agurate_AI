import { test, expect } from '@playwright/test';

test.describe('TypeScript Type Safety Verification', () => {
  test('Retired Delta route renders deferred page without type errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demo/delta');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check for type-related errors
    const typeErrors = errors.filter(
      (error) =>
        error.includes('TypeError') ||
        error.includes('Cannot read property') ||
        error.includes('undefined is not an object') ||
        error.includes('is not a function') ||
        error.includes('Cannot read properties of')
    );

    if (typeErrors.length > 0) {
      console.log('Type-related errors found:', typeErrors);
    }

    expect(typeErrors.length).toBe(0);
  });

  test('Retired assistant chat interface is not active', async ({ page }) => {
    await page.goto('/demo/delta');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    await expect(page.getByRole('heading', { name: /Not in the active public toolset/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('textarea')).toHaveCount(0);
  });

  test('No runtime type errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('TypeError') || text.includes('undefined')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/demo/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const typeErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('sourcemap')
    );

    expect(typeErrors.length).toBe(0);
  });
});

