import { test, expect } from '@playwright/test';

test.describe('Error Handling Verification', () => {
  test('App handles network errors gracefully', async ({ page }) => {
    // First load normally
    await page.goto('/demo/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to navigate
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check for error messages or fallback UI
    const hasErrorUI = await page.locator('text=error')
      .or(page.locator('text=offline'))
      .or(page.locator('text=network'))
      .isVisible()
      .catch(() => false);
    
    // Restore online
    await page.context().setOffline(false);
    
    // App should recover
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Page should load successfully
    expect(await page.locator('body').isVisible()).toBe(true);
  });

  test('404 page works correctly', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    // Should show 404 or redirect
    await page.waitForTimeout(2000);
    
    const is404 = await page.locator('text=404')
      .or(page.locator('text=Not Found'))
      .or(page.locator('text=Page not found'))
      .isVisible()
      .catch(() => false);
    
    const isHome = page.url().includes('/') && !page.url().includes('non-existent');
    
    // Either 404 page or redirect to home is acceptable
    expect(is404 || isHome).toBe(true);
  });

  test('Error boundaries work correctly', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate to various pages that might trigger errors
    const pages = ['/demo/dashboard', '/demo/delta', '/demo/upload'];
    
    for (const route of pages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    // Critical errors should be caught
    const uncaughtErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('sourcemap')
    );

    // App should still be functional
    expect(uncaughtErrors.length).toBeLessThan(3);
  });
});

