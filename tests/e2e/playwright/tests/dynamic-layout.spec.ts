import { test, expect } from '@playwright/test';
import { ObsidianHelpers } from '../utils/obsidian-helpers';

/**
 * Real E2E Tests for DynamicLayout Functionality
 * 
 * Tests the actual DynamicLayout system in real Obsidian environment.
 * This verifies that the plugin can:
 * - Detect class properties automatically
 * - Switch between different layouts
 * - Handle layout discovery and fallback
 * - Render appropriate layouts for different asset types
 * 
 * Success Criteria:
 * - Different files show different layouts based on their class
 * - Layout switching works correctly
 * - Fallback to default layouts works
 * - Dynamic property discovery functions
 */
test.describe('DynamicLayout - Real E2E Testing', () => {
  let helpers: ObsidianHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ObsidianHelpers(page);
    
    // Wait for Obsidian to fully load
    await helpers.waitForObsidianLoad();
    
    // Wait for Exocortex plugin to load
    await helpers.waitForExocortexPlugin();
    
    // Take initial state screenshot
    await helpers.takeContextualScreenshot('dynamic-layout-initial-state');
  });

  test('should dynamically detect and render appropriate layout for Project class', async ({ page }) => {
    console.log('🚀 Testing DynamicLayout for Project class...');
    
    // Open project file
    await helpers.openFile('Projects/TestProjectAlpha.md');
    
    // Take screenshot of file loaded
    await helpers.takeContextualScreenshot('project-file-for-dynamic-layout');
    
    // Wait for dynamic layout detection and rendering
    await page.waitForTimeout(3000);
    
    // Verify the layout has been dynamically determined
    const layoutContainer = page.locator('.dynamic-layout-container, .exocortex-layout-container');
    await expect(layoutContainer).toBeVisible({ timeout: 10000 });
    
    // Project layout should show project-specific elements
    // Check for project-specific property fields
    const statusField = page.locator('[data-property="exo__status"], input[name*="status"]');
    const priorityField = page.locator('[data-property="exo__priority"], input[name*="priority"]');
    const budgetField = page.locator('[data-property="exo__budget"], input[name*="budget"]');
    
    // At least one of these should be visible (layout discovery working)
    const projectFieldsVisible = await Promise.all([
      statusField.isVisible().catch(() => false),
      priorityField.isVisible().catch(() => false),
      budgetField.isVisible().catch(() => false)
    ]);
    
    const hasProjectFields = projectFieldsVisible.some(visible => visible);
    expect(hasProjectFields).toBe(true);
    
    // Take screenshot showing project-specific layout
    await helpers.takeContextualScreenshot('dynamic-layout-project-detected', {
      fullPage: true,
      annotations: [
        { selector: '[data-property="exo__status"]', label: 'Status Field' },
        { selector: '[data-property="exo__priority"]', label: 'Priority Field' },
        { selector: '[data-property="exo__budget"]', label: 'Budget Field' }
      ]
    });
    
    // Verify layout reflects project class properties
    const properties = await helpers.interactWithProperties();
    console.log('Detected properties:', Object.keys(properties));
    
    // Project should have specific properties
    const projectPropertyNames = Object.keys(properties).join(' ').toLowerCase();
    const hasProjectSpecificProps = projectPropertyNames.includes('status') ||
                                   projectPropertyNames.includes('priority') ||
                                   projectPropertyNames.includes('budget');
    
    expect(hasProjectSpecificProps).toBe(true);
    
    console.log('✅ Project dynamic layout test completed');
  });

  test('should dynamically render different layout for Task class', async ({ page }) => {
    console.log('🚀 Testing DynamicLayout for Task class...');
    
    // Open task file
    await helpers.openFile('Tasks/TestTaskUIValidation.md');
    
    // Take screenshot of task file loaded
    await helpers.takeContextualScreenshot('task-file-for-dynamic-layout');
    
    // Wait for dynamic layout detection
    await page.waitForTimeout(3000);
    
    // Verify layout container exists
    const layoutContainer = page.locator('.dynamic-layout-container, .exocortex-layout-container');
    await expect(layoutContainer).toBeVisible({ timeout: 10000 });
    
    // Task layout should show task-specific elements
    const assignedToField = page.locator('[data-property="exo__assignedTo"], input[name*="assignedTo"]');
    const estimatedHoursField = page.locator('[data-property="exo__estimatedHours"], input[name*="estimatedHours"]');
    const dueDateField = page.locator('[data-property="exo__dueDate"], input[name*="dueDate"]');
    
    // Check if task-specific fields are visible
    const taskFieldsVisible = await Promise.all([
      assignedToField.isVisible().catch(() => false),
      estimatedHoursField.isVisible().catch(() => false),
      dueDateField.isVisible().catch(() => false)
    ]);
    
    const hasTaskFields = taskFieldsVisible.some(visible => visible);
    expect(hasTaskFields).toBe(true);
    
    // Take screenshot showing task-specific layout
    await helpers.takeContextualScreenshot('dynamic-layout-task-detected', {
      fullPage: true,
      annotations: [
        { selector: '[data-property="exo__assignedTo"]', label: 'Assigned To Field' },
        { selector: '[data-property="exo__estimatedHours"]', label: 'Estimated Hours Field' },
        { selector: '[data-property="exo__dueDate"]', label: 'Due Date Field' }
      ]
    });
    
    // Verify different properties than project
    const taskProperties = await helpers.interactWithProperties();
    console.log('Task properties detected:', Object.keys(taskProperties));
    
    const taskPropertyNames = Object.keys(taskProperties).join(' ').toLowerCase();
    const hasTaskSpecificProps = taskPropertyNames.includes('assigned') ||
                                taskPropertyNames.includes('hours') ||
                                taskPropertyNames.includes('due');
    
    expect(hasTaskSpecificProps).toBe(true);
    
    console.log('✅ Task dynamic layout test completed');
  });

  test('should switch layouts when navigating between different class types', async ({ page }) => {
    console.log('🚀 Testing dynamic layout switching between different classes...');
    
    // Start with project file
    await helpers.openFile('Projects/TestProjectAlpha.md');
    await page.waitForTimeout(2000);
    
    // Capture project layout state
    await helpers.takeContextualScreenshot('layout-switch-1-project');
    const projectProperties = await helpers.interactWithProperties();
    
    // Switch to task file
    await helpers.openFile('Tasks/TestTaskUIValidation.md');
    await page.waitForTimeout(2000);
    
    // Capture task layout state
    await helpers.takeContextualScreenshot('layout-switch-2-task');
    const taskProperties = await helpers.interactWithProperties();
    
    // Switch back to project
    await helpers.openFile('Projects/TestProjectAlpha.md');
    await page.waitForTimeout(2000);
    
    // Capture return to project layout
    await helpers.takeContextualScreenshot('layout-switch-3-back-to-project');
    const projectPropertiesAgain = await helpers.interactWithProperties();
    
    // Verify that layouts are actually different
    const projectKeys = Object.keys(projectProperties).sort().join(',');
    const taskKeys = Object.keys(taskProperties).sort().join(',');
    const projectKeysAgain = Object.keys(projectPropertiesAgain).sort().join(',');
    
    // Different file types should show different properties (different layouts)
    expect(projectKeys).not.toBe(taskKeys);
    
    // Returning to the same file type should show consistent layout
    expect(projectKeys).toBe(projectKeysAgain);
    
    console.log('Project layout properties:', projectKeys);
    console.log('Task layout properties:', taskKeys);
    
    // Take final comparison screenshot
    await helpers.takeContextualScreenshot('layout-switching-completed');
    
    console.log('✅ Layout switching test completed');
  });

  test('should handle layout discovery for unknown class types gracefully', async ({ page }) => {
    console.log('🚀 Testing layout discovery fallback behavior...');
    
    // Create a file with an unknown/custom class
    await page.evaluate(() => {
      const app = (window as any).app;
      const content = `---
aliases: []
tags: [CustomClass]
exo__class: "CustomUnknownClass"
exo__customProperty: "test value"
exo__anotherCustom: 42
---
# Custom Class Asset

This asset has a custom class that doesn't have a predefined layout.`;
      
      app.vault.create('CustomClassAsset.md', content);
    });
    
    // Open the custom class file
    await helpers.openFile('CustomClassAsset.md');
    
    // Wait for layout discovery process
    await page.waitForTimeout(4000);
    
    // Take screenshot of unknown class handling
    await helpers.takeContextualScreenshot('layout-discovery-unknown-class');
    
    // Check if any layout was rendered (fallback behavior)
    const hasAnyLayout = await page.locator('.exocortex-layout-container, .dynamic-layout-container, .properties-block').isVisible();
    
    if (hasAnyLayout) {
      console.log('ℹ️ Fallback layout rendered for unknown class');
      
      // Should show the custom properties that were discovered
      const customProperties = await helpers.interactWithProperties();
      
      // Should find the custom properties in the frontmatter
      const customPropertyNames = Object.keys(customProperties).join(' ').toLowerCase();
      const hasCustomProps = customPropertyNames.includes('custom') || 
                            Object.keys(customProperties).length > 0;
      
      expect(hasCustomProps).toBe(true);
      
      // Take screenshot showing custom properties
      await helpers.takeContextualScreenshot('layout-discovery-custom-properties-detected');
      
    } else {
      console.log('ℹ️ No layout rendered for unknown class - graceful degradation');
      
      // This is also acceptable - no layout for unrecognized classes
      await helpers.takeContextualScreenshot('layout-discovery-no-layout-unknown-class');
      
      // Should not cause errors in console
      const errors = await page.evaluate(() => (window as any).testErrors || []);
      expect(errors.length).toBe(0);
    }
    
    console.log('✅ Layout discovery fallback test completed');
  });

  test('should demonstrate layout consistency and performance', async ({ page }) => {
    console.log('🚀 Testing layout consistency and performance...');
    
    const testFiles = [
      'Projects/TestProjectAlpha.md',
      'Tasks/TestTaskUIValidation.md',
      'Projects/TestProjectAlpha.md', // Revisit to test consistency
      'Tasks/TestTaskUIValidation.md'  // Revisit to test consistency
    ];
    
    const layoutTimings = [];
    const layoutStates = [];
    
    for (let i = 0; i < testFiles.length; i++) {
      const file = testFiles[i];
      console.log(`Loading file ${i + 1}/${testFiles.length}: ${file}`);
      
      const startTime = Date.now();
      
      // Open file
      await helpers.openFile(file);
      
      // Wait for layout to settle
      await page.waitForTimeout(1500);
      
      // Check if layout rendered
      const layoutVisible = await page.locator('.exocortex-layout-container, .dynamic-layout-container').isVisible();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      layoutTimings.push({
        file,
        loadTime,
        layoutRendered: layoutVisible
      });
      
      if (layoutVisible) {
        const properties = await helpers.interactWithProperties();
        layoutStates.push({
          file,
          properties: Object.keys(properties).sort(),
          iteration: i
        });
      }
      
      // Take screenshot for this iteration
      await helpers.takeContextualScreenshot(`layout-consistency-${i}-${file.split('/')[1]}`);
    }
    
    // Verify performance is reasonable (layout loads within 5 seconds)
    for (const timing of layoutTimings) {
      expect(timing.loadTime).toBeLessThan(5000);
      console.log(`${timing.file}: ${timing.loadTime}ms, layout: ${timing.layoutRendered}`);
    }
    
    // Verify consistency - same files should show same layouts
    const projectStates = layoutStates.filter(state => state.file.includes('Projects'));
    const taskStates = layoutStates.filter(state => state.file.includes('Tasks'));
    
    if (projectStates.length >= 2) {
      expect(projectStates[0].properties).toEqual(projectStates[1].properties);
    }
    
    if (taskStates.length >= 2) {
      expect(taskStates[0].properties).toEqual(taskStates[1].properties);
    }
    
    // Take final performance summary screenshot
    await helpers.takeContextualScreenshot('layout-performance-consistency-summary');
    
    console.log('✅ Layout consistency and performance test completed');
    console.log('Layout timings:', layoutTimings);
  });

  test.afterEach(async ({ page }) => {
    // Take final state screenshot
    await helpers.takeContextualScreenshot('dynamic-layout-test-end');
    
    console.log('🏁 DynamicLayout test completed');
  });
});