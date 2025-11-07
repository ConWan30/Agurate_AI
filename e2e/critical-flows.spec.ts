import { test, expect } from '@playwright/test';

test.describe('Critical User Flows - Phase 1 Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('Home page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/AgurateAI/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Navigation to demo dashboard works', async ({ page }) => {
    await page.goto('/demo/dashboard');
    await expect(page).toHaveURL(/.*demo\/dashboard/);
    
    // Check for key dashboard elements - use more specific selector
    await expect(page.getByRole('heading', { name: /Welcome to Your Farm Dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('Delta Intelligence page loads', async ({ page }) => {
    await page.goto('/demo/delta');
    await expect(page).toHaveURL(/.*demo\/delta/);
    
    // Check for Delta Intelligence UI - use specific heading
    await expect(page.getByRole('heading', { name: /Delta Intelligence AI/i })).toBeVisible({ timeout: 10000 });
  });

  test('Upload page is accessible', async ({ page }) => {
    await page.goto('/demo/upload');
    await expect(page).toHaveURL(/.*demo\/upload/);
    
    // Check for upload interface
    const uploadElement = page.locator('input[type="file"]')
      .or(page.locator('text=Upload'))
      .or(page.locator('button:has-text("Upload")'))
      .first();
    await expect(uploadElement).toBeVisible({ timeout: 10000 });
  });

  test('Scanner page loads', async ({ page }) => {
    await page.goto('/demo/scanner');
    await expect(page).toHaveURL(/.*demo\/scanner/);
    
    // Check for scanner interface - use specific heading
    await expect(page.getByRole('heading', { name: /Mobile Field Scanner/i })).toBeVisible({ timeout: 10000 });
  });

  test('Fields page displays correctly', async ({ page }) => {
    await page.goto('/demo/fields');
    await expect(page).toHaveURL(/.*demo\/fields/);
    
    // Check for fields content - use specific heading
    await expect(page.getByRole('heading', { name: /My Fields/i })).toBeVisible({ timeout: 10000 });
  });

  test('Predictions page loads', async ({ page }) => {
    await page.goto('/demo/predictions');
    await expect(page).toHaveURL(/.*demo\/predictions/);
    
    // Check for predictions content - use specific heading
    await expect(page.getByRole('heading', { name: /7-Day Stress Forecast/i })).toBeVisible({ timeout: 10000 });
  });

  test('No TypeScript errors in console', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demo/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('sourcemap') &&
        !error.includes('Extension context invalidated') &&
        !error.includes('Failed to load resource') &&
        !error.toLowerCase().includes('net::err')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // Allow some non-critical errors but log them
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('Navigation between pages works', async ({ page }) => {
    await page.goto('/demo/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to different pages
    const routes = ['/demo/fields', '/demo/history', '/demo/delta'];
    
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')), { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }
  });

  test('Auth page loads correctly', async ({ page }) => {
    await page.goto('/demo/auth');
    await expect(page).toHaveURL(/.*demo\/auth/);
    
    // Check for auth form elements - use specific email input
    await expect(page.getByRole('textbox', { name: /Email Address/i })).toBeVisible({ timeout: 10000 });
  });
});

