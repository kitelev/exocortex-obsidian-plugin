import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for inline property editing
 * These tests require a running Obsidian instance with the plugin installed
 */

test.describe('Inline Property Editing', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to test vault
        await page.goto('obsidian://open?vault=TestVault');
        await page.waitForTimeout(2000); // Wait for Obsidian to load
    });

    test('should edit dropdown property without "Asset not found" error', async ({ page }) => {
        // Open a test asset
        await page.click('text=TestTask.md');
        await page.waitForSelector('.exocortex-properties-container');

        // Click on assignee property to edit
        await page.click('.exocortex-property-value-readonly:has-text("Alice")');
        
        // Select new value from dropdown
        await page.selectOption('select', 'Bob');
        
        // Save the change
        await page.click('button[aria-label="Save (Enter)"]');
        
        // Verify no error message appears
        await expect(page.locator('.notice:has-text("Asset not found")')).not.toBeVisible();
        
        // Verify success message
        await expect(page.locator('.notice:has-text("Property updated")')).toBeVisible();
        
        // Verify the value was updated
        await expect(page.locator('.exocortex-property-value-readonly')).toContainText('Bob');
    });

    test('should handle special characters in asset names', async ({ page }) => {
        // Open asset with special characters
        await page.click('text="John O\'Brien.md"');
        await page.waitForSelector('.exocortex-properties-container');

        // Edit a property
        await page.click('.exocortex-property-value-readonly').first();
        await page.fill('input[type="text"]', 'Updated Value');
        await page.press('Enter');

        // Verify update succeeded
        await expect(page.locator('.notice:has-text("Property updated")')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
        // Open test asset
        await page.click('text=RequiredFieldTest.md');
        
        // Try to clear a required field
        await page.click('.exocortex-property-item:has-text("Required Field") .exocortex-property-value-readonly');
        await page.fill('input', '');
        await page.press('Enter');
        
        // Verify validation error
        await expect(page.locator('.exocortex-property-error')).toContainText('Required Field is required');
        
        // Verify value not changed
        await page.press('Escape');
        await expect(page.locator('.exocortex-property-value-readonly')).not.toContainText('(empty)');
    });

    test('should cancel edit on Escape key', async ({ page }) => {
        // Open test asset
        await page.click('text=TestAsset.md');
        
        // Start editing
        const originalValue = await page.locator('.exocortex-property-value-readonly').first().textContent();
        await page.click('.exocortex-property-value-readonly').first();
        
        // Type new value but cancel
        await page.fill('input', 'New Value');
        await page.press('Escape');
        
        // Verify original value restored
        await expect(page.locator('.exocortex-property-value-readonly').first()).toHaveText(originalValue!);
    });

    test('should handle empty optional fields', async ({ page }) => {
        // Open test asset
        await page.click('text=OptionalFieldTest.md');
        
        // Clear an optional field
        await page.click('.exocortex-property-item:has-text("Optional Field") .exocortex-property-value-readonly');
        await page.fill('input', '');
        await page.press('Enter');
        
        // Verify update succeeded
        await expect(page.locator('.notice:has-text("Property updated")')).toBeVisible();
        
        // Verify field shows empty
        await expect(page.locator('.exocortex-property-value-readonly')).toContainText('(empty)');
    });

    test('performance: should update within 500ms', async ({ page }) => {
        // Open test asset
        await page.click('text=PerformanceTest.md');
        
        // Start timing
        const startTime = Date.now();
        
        // Edit and save
        await page.click('.exocortex-property-value-readonly').first();
        await page.fill('input', 'Quick Update');
        await page.press('Enter');
        
        // Wait for success message
        await page.waitForSelector('.notice:has-text("Property updated")');
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Verify performance
        expect(duration).toBeLessThan(500);
    });

    test('should handle concurrent edits gracefully', async ({ page, context }) => {
        // Open same asset in two tabs
        const page2 = await context.newPage();
        
        await page.goto('obsidian://open?vault=TestVault&file=ConcurrentTest.md');
        await page2.goto('obsidian://open?vault=TestVault&file=ConcurrentTest.md');
        
        // Edit in first tab
        await page.click('.exocortex-property-value-readonly').first();
        await page.fill('input', 'Edit from Tab 1');
        await page.press('Enter');
        
        // Edit in second tab
        await page2.click('.exocortex-property-value-readonly').first();
        await page2.fill('input', 'Edit from Tab 2');
        await page2.press('Enter');
        
        // Both should succeed (last write wins)
        await expect(page.locator('.notice:has-text("Property updated")')).toBeVisible();
        await expect(page2.locator('.notice:has-text("Property updated")')).toBeVisible();
    });
});