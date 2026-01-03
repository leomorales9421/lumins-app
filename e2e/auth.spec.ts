import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Check if we're on the login page
    await expect(page).toHaveTitle(/Login/);
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Should redirect to app page
    await page.waitForURL('/app');
    
    // Check if we're on the boards page
    await expect(page.locator('h1')).toContainText('Tableros');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-red-400')).toBeVisible();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/app');
    
    // Should redirect to login page
    await page.waitForURL('/login');
  });
});
