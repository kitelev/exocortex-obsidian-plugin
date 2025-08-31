import { test, expect, Page, ElectronApplication } from '@playwright/test';
import path from 'path';
import { _electron as electron } from 'playwright';

/**
 * Real E2E Tests for UniversalLayout
 * Tests actual plugin functionality in real Obsidian
 */
test.describe('UniversalLayout - Real Tests', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  
  test.beforeAll(async () => {
    // Launch real Obsidian application
    console.log('🚀 Launching Obsidian desktop application...');
    
    const obsidianPath = process.platform === 'darwin'
      ? '/Applications/Obsidian.app/Contents/MacOS/Obsidian'
      : process.platform === 'win32'
      ? 'C:\\Program Files\\Obsidian\\Obsidian.exe'
      : '/usr/bin/obsidian';
    
    const vaultPath = process.env.TEST_VAULT_PATH || 
      path.join(__dirname, '../test-vault');
    
    electronApp = await electron.launch({
      executablePath: obsidianPath,
      args: [
        '--no-sandbox',
        '--disable-gpu-sandbox',
        `--vault=${vaultPath}`,
      ],
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: '1',
      },
    });
    
    // Wait for Obsidian to load
    page = await electronApp.firstWindow();
    await page.waitForTimeout(3000); // Give Obsidian time to initialize
    
    console.log('✅ Obsidian launched successfully');
  });
  
  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });
  
  test('should render UniversalLayout for Person class', async () => {
    // Step 1: Open the test file
    await page.screenshot({ 
      path: 'test-results/01-obsidian-initial.png',
      fullPage: true 
    });
    
    // Open command palette
    await page.keyboard.press('Control+P');
    await page.waitForTimeout(500);
    
    // Search for test file
    await page.keyboard.type('John Doe');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // Step 2: Take screenshot of opened file
    await page.screenshot({ 
      path: 'test-results/02-person-file-opened.png',
      fullPage: true 
    });
    
    // Step 3: Check for UniversalLayout elements
    const layoutContainer = await page.locator('.universal-layout-container');
    await expect(layoutContainer).toBeVisible({ timeout: 10000 });
    
    // Step 4: Verify property blocks are rendered
    const propertyBlocks = await page.locator('.property-block');
    const blockCount = await propertyBlocks.count();
    expect(blockCount).toBeGreaterThan(0);
    
    // Step 5: Take screenshot of rendered layout
    await page.screenshot({ 
      path: 'test-results/03-universal-layout-rendered.png',
      fullPage: true 
    });
    
    // Step 6: Verify specific properties are displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john.doe@example.com')).toBeVisible();
    await expect(page.locator('text=Developer')).toBeVisible();
    await expect(page.locator('text=Engineering')).toBeVisible();
    
    console.log(`✅ UniversalLayout rendered with ${blockCount} property blocks`);
  });
  
  test('should render UniversalLayout for Project class', async () => {
    // Open command palette
    await page.keyboard.press('Control+P');
    await page.waitForTimeout(500);
    
    // Search for project file
    await page.keyboard.type('Exocortex Development');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/04-project-file-opened.png',
      fullPage: true 
    });
    
    // Check for layout elements
    const layoutContainer = await page.locator('.universal-layout-container');
    await expect(layoutContainer).toBeVisible({ timeout: 10000 });
    
    // Verify project-specific properties
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=2024-01-01')).toBeVisible();
    await expect(page.locator('text=2024-12-31')).toBeVisible();
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/05-project-layout-rendered.png',
      fullPage: true 
    });
    
    console.log('✅ UniversalLayout rendered for Project class');
  });
  
  test('should update layout when properties change', async () => {
    // Switch to edit mode
    await page.keyboard.press('Control+E');
    await page.waitForTimeout(1000);
    
    // Find and modify a property
    await page.keyboard.press('Control+F');
    await page.keyboard.type('status: In Progress');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    
    // Select and replace text
    await page.keyboard.press('Control+A');
    await page.keyboard.type('status: Completed');
    
    // Switch back to preview mode
    await page.keyboard.press('Control+E');
    await page.waitForTimeout(1000);
    
    // Verify the layout updated
    await expect(page.locator('text=Completed')).toBeVisible();
    
    // Take screenshot of updated layout
    await page.screenshot({ 
      path: 'test-results/06-layout-updated.png',
      fullPage: true 
    });
    
    console.log('✅ UniversalLayout updates when properties change');
  });
});

/**
 * Performance Tests
 */
test.describe('UniversalLayout Performance', () => {
  test('should render within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to test file
    await page.goto('obsidian://open?vault=test-vault&file=John%20Doe.md');
    
    // Wait for layout to render
    await page.waitForSelector('.universal-layout-container', { 
      timeout: 5000 
    });
    
    const renderTime = Date.now() - startTime;
    
    // Assert performance
    expect(renderTime).toBeLessThan(3000); // Should render within 3 seconds
    
    console.log(`✅ UniversalLayout rendered in ${renderTime}ms`);
  });
});