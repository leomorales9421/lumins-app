import { test, expect } from '@playwright/test';

test.describe('Board Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app');
  });

  test('should create a new board', async ({ page }) => {
    // Click create board button
    await page.click('button:has-text("Nuevo tablero")');
    
    // Fill board form
    await page.fill('input[placeholder="Nombre del tablero"]', 'Test Board');
    await page.fill('textarea[placeholder="Descripción"]', 'Test Description');
    
    // Submit form
    await page.click('button:has-text("Crear tablero")');
    
    // Should navigate to board detail page
    await page.waitForURL(/\/boards\/.*/);
    
    // Check board title
    await expect(page.locator('h1')).toContainText('Test Board');
  });

  test('should create a new list in board', async ({ page }) => {
    // Assume we're on a board page (create one first)
    await page.goto('/app');
    await page.click('button:has-text("Nuevo tablero")');
    await page.fill('input[placeholder="Nombre del tablero"]', 'Test Board for List');
    await page.click('button:has-text("Crear tablero")');
    await page.waitForURL(/\/boards\/.*/);
    
    // Click add list button
    await page.click('button:has-text("Añadir lista")');
    
    // Fill list title
    await page.fill('input[placeholder="Título de la lista..."]', 'Test List');
    
    // Press Enter to create
    await page.keyboard.press('Enter');
    
    // Check if list was created
    await expect(page.locator('h3')).toContainText('Test List');
  });

  test('should create a new card in list', async ({ page }) => {
    // Create board and list first
    await page.goto('/app');
    await page.click('button:has-text("Nuevo tablero")');
    await page.fill('input[placeholder="Nombre del tablero"]', 'Test Board for Card');
    await page.click('button:has-text("Crear tablero")');
    await page.waitForURL(/\/boards\/.*/);
    
    // Create list
    await page.click('button:has-text("Añadir lista")');
    await page.fill('input[placeholder="Título de la lista..."]', 'Test List for Card');
    await page.keyboard.press('Enter');
    
    // Click add card button in the list
    await page.click('button:has-text("Añadir tarjeta")');
    
    // Fill card title
    await page.fill('input[placeholder="Título de la tarjeta..."]', 'Test Card');
    
    // Press Enter to create
    await page.keyboard.press('Enter');
    
    // Check if card was created
    await expect(page.locator('div').filter({ hasText: 'Test Card' }).first()).toBeVisible();
  });

  test('should switch to metrics tab', async ({ page }) => {
    // Create a board first
    await page.goto('/app');
    await page.click('button:has-text("Nuevo tablero")');
    await page.fill('input[placeholder="Nombre del tablero"]', 'Test Board for Metrics');
    await page.click('button:has-text("Crear tablero")');
    await page.waitForURL(/\/boards\/.*/);
    
    // Click metrics tab
    await page.click('button:has-text("Métricas")');
    
    // Check if metrics content is visible
    await expect(page.locator('h2')).toContainText('Métricas del Tablero');
    
    // Check for metrics sections
    await expect(page.locator('text=Tarjetas')).toBeVisible();
    await expect(page.locator('text=Listas')).toBeVisible();
    await expect(page.locator('text=Miembros')).toBeVisible();
  });
});
