import { test, expect, Page, ElectronApplication } from '@playwright/test';
import path from 'path';
import fs from 'fs-extra';
import { _electron as electron } from 'playwright';

/**
 * Real E2E Tests for CreateAssetModal
 * Tests actual modal functionality in real Obsidian
 */
test.describe('CreateAssetModal - Real Tests', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  const vaultPath = process.env.TEST_VAULT_PATH || 
    path.join(__dirname, '../test-vault');
  
  test.beforeAll(async () => {
    // Launch real Obsidian application
    console.log('🚀 Launching Obsidian for CreateAssetModal tests...');
    
    const obsidianPath = process.platform === 'darwin'
      ? '/Applications/Obsidian.app/Contents/MacOS/Obsidian'
      : process.platform === 'win32'
      ? 'C:\\Program Files\\Obsidian\\Obsidian.exe'
      : '/usr/bin/obsidian';
    
    electronApp = await electron.launch({
      executablePath: obsidianPath,
      args: [
        '--no-sandbox',
        '--disable-gpu-sandbox',
        `--vault=${vaultPath}`,
      ],
    });
    
    page = await electronApp.firstWindow();
    await page.waitForTimeout(3000);
    
    console.log('✅ Obsidian ready for modal testing');
  });
  
  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });
  
  test('should open CreateAssetModal via command palette', async () => {
    // Step 1: Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/modal-01-initial.png',
      fullPage: true 
    });
    
    // Step 2: Open command palette
    await page.keyboard.press('Control+Shift+P');
    await page.waitForTimeout(500);
    
    // Step 3: Search for create asset command
    await page.keyboard.type('Create Asset');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/modal-02-command-search.png',
      fullPage: true 
    });
    
    // Step 4: Execute command
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Step 5: Verify modal opened
    const modal = await page.locator('.modal-container');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ 
      path: 'test-results/modal-03-opened.png',
      fullPage: true 
    });
    
    console.log('✅ CreateAssetModal opened successfully');
  });
  
  test('should display class selection dropdown', async () => {
    // Find class dropdown
    const classDropdown = await page.locator('select[name="assetClass"], #asset-class-select');
    await expect(classDropdown).toBeVisible();
    
    // Get available options
    const options = await classDropdown.locator('option').allTextContents();
    
    expect(options).toContain('Person');
    expect(options).toContain('Project');
    
    await page.screenshot({ 
      path: 'test-results/modal-04-class-dropdown.png',
      fullPage: true 
    });
    
    console.log(`✅ Class dropdown has ${options.length} options`);
  });
  
  test('should show property fields when class is selected', async () => {
    // Select Person class
    const classDropdown = await page.locator('select[name="assetClass"], #asset-class-select');
    await classDropdown.selectOption('Person');
    await page.waitForTimeout(500);
    
    // Check for property fields
    const nameField = await page.locator('input[name="name"], #property-name');
    const emailField = await page.locator('input[name="email"], #property-email');
    const roleField = await page.locator('input[name="role"], #property-role');
    const departmentField = await page.locator('input[name="department"], #property-department');
    
    await expect(nameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(roleField).toBeVisible();
    await expect(departmentField).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/modal-05-person-fields.png',
      fullPage: true 
    });
    
    console.log('✅ Person property fields displayed');
  });
  
  test('should create new asset file', async () => {
    const assetName = `Test Person ${Date.now()}`;
    
    // Fill in the form
    await page.fill('input[name="name"], #property-name', assetName);
    await page.fill('input[name="email"], #property-email', 'test@example.com');
    await page.fill('input[name="role"], #property-role', 'Tester');
    await page.fill('input[name="department"], #property-department', 'QA');
    
    await page.screenshot({ 
      path: 'test-results/modal-06-filled-form.png',
      fullPage: true 
    });
    
    // Click create button
    const createButton = await page.locator('button:has-text("Create"), .modal-button-primary');
    await createButton.click();
    await page.waitForTimeout(2000);
    
    // Verify modal closed
    const modal = await page.locator('.modal-container');
    await expect(modal).not.toBeVisible();
    
    // Verify file was created
    const expectedFilePath = path.join(vaultPath, 'Assets', `${assetName}.md`);
    const fileExists = await fs.pathExists(expectedFilePath);
    expect(fileExists).toBe(true);
    
    if (fileExists) {
      const fileContent = await fs.readFile(expectedFilePath, 'utf-8');
      expect(fileContent).toContain('exo__Instance_class: Person');
      expect(fileContent).toContain(`name: ${assetName}`);
      expect(fileContent).toContain('email: test@example.com');
      expect(fileContent).toContain('role: Tester');
      expect(fileContent).toContain('department: QA');
    }
    
    await page.screenshot({ 
      path: 'test-results/modal-07-asset-created.png',
      fullPage: true 
    });
    
    console.log(`✅ Asset created: ${assetName}`);
  });
  
  test('should switch property fields when changing class', async () => {
    // Open modal again
    await page.keyboard.press('Control+Shift+P');
    await page.waitForTimeout(500);
    await page.keyboard.type('Create Asset');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Select Project class
    const classDropdown = await page.locator('select[name="assetClass"], #asset-class-select');
    await classDropdown.selectOption('Project');
    await page.waitForTimeout(500);
    
    // Check for project-specific fields
    const nameField = await page.locator('input[name="name"], #property-name');
    const statusField = await page.locator('input[name="status"], select[name="status"], #property-status');
    const startDateField = await page.locator('input[name="startDate"], #property-startDate');
    const endDateField = await page.locator('input[name="endDate"], #property-endDate');
    const descriptionField = await page.locator('textarea[name="description"], #property-description');
    
    await expect(nameField).toBeVisible();
    await expect(statusField).toBeVisible();
    await expect(startDateField).toBeVisible();
    await expect(endDateField).toBeVisible();
    await expect(descriptionField).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/modal-08-project-fields.png',
      fullPage: true 
    });
    
    console.log('✅ Property fields updated for Project class');
  });
  
  test('should validate required fields', async () => {
    // Try to create without filling required fields
    const createButton = await page.locator('button:has-text("Create"), .modal-button-primary');
    await createButton.click();
    await page.waitForTimeout(500);
    
    // Check for validation error
    const errorMessage = await page.locator('.error-message, .validation-error');
    const modalStillOpen = await page.locator('.modal-container').isVisible();
    
    expect(modalStillOpen).toBe(true); // Modal should stay open
    
    await page.screenshot({ 
      path: 'test-results/modal-09-validation.png',
      fullPage: true 
    });
    
    console.log('✅ Validation prevents creating asset without required fields');
  });
  
  test('should cancel modal without creating asset', async () => {
    // Click cancel button
    const cancelButton = await page.locator('button:has-text("Cancel"), .modal-button-cancel');
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    // Verify modal closed
    const modal = await page.locator('.modal-container');
    await expect(modal).not.toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/modal-10-cancelled.png',
      fullPage: true 
    });
    
    console.log('✅ Modal cancelled without creating asset');
  });
});

/**
 * Modal Performance Tests
 */
test.describe('CreateAssetModal Performance', () => {
  test('should open modal quickly', async ({ page }) => {
    const startTime = Date.now();
    
    // Trigger modal
    await page.keyboard.press('Control+Shift+P');
    await page.keyboard.type('Create Asset');
    await page.keyboard.press('Enter');
    
    // Wait for modal
    await page.waitForSelector('.modal-container', { timeout: 3000 });
    
    const openTime = Date.now() - startTime;
    expect(openTime).toBeLessThan(2000); // Should open within 2 seconds
    
    console.log(`✅ Modal opened in ${openTime}ms`);
  });
});