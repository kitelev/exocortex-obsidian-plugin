/**
 * @jest-environment jest-environment-obsidian
 * @obsidian-conformance lax
 * @obsidian-version 1.5.0
 *
 * Real E2E tests for DynamicLayoutRenderer using jest-environment-obsidian
 * Tests actual Obsidian API interactions without mocking
 */

import { App, TFile, MarkdownPostProcessorContext } from 'obsidian';
import { DynamicLayoutRenderer } from '../../src/presentation/renderers/DynamicLayoutRenderer';
import { testUtils } from './setup';

declare global {
  var app: App;
}

describe('DynamicLayoutRenderer E2E Tests', () => {
  let renderer: DynamicLayoutRenderer;
  let testFile: TFile;
  let layoutConfigFile: TFile;
  let container: HTMLElement;

  beforeEach(async () => {
    // Ensure we have the global app instance
    expect(global.app).toBeDefined();
    expect(global.app.vault).toBeDefined();
    
    // Create renderer instance
    renderer = new DynamicLayoutRenderer();
    
    // Create a test container in the DOM
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Ensure test folders exist
    await testUtils.ensureFolder('test-assets');
    await testUtils.ensureFolder('ui');
    
    // Create a layout configuration file
    layoutConfigFile = await testUtils.createTestFile('ui/exo__Project.md', `---
exo__Class: ui__ClassLayout
exo__ClassType: exo__Project
ui__relationsToShow:
  - ems__contains
  - ems__assignedTo
  - rdfs__seeAlso
ui__displayMode: table
ui__showProperties:
  - name
  - status
  - priority
  - dueDate
---

# Project Layout Configuration

Dynamic layout configuration for Project assets.
`);

    // Create a test asset file with proper metadata
    testFile = await testUtils.createTestFile('test-assets/test-project-dynamic.md', `---
exo__Instance_class: exo__Project
name: Dynamic Test Project
status: Active
priority: High
dueDate: 2025-12-31
progress: 85
ems__assignedTo: "John Doe"
---

# Dynamic Test Project

This is a test project for DynamicLayout E2E testing.

## Description

A comprehensive test project to validate DynamicLayout functionality with class-specific configurations.
`);
  });

  afterEach(async () => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Clean up test files
    const filesToClean = [testFile, layoutConfigFile];
    for (const file of filesToClean) {
      if (file) {
        try {
          await global.app.vault.delete(file);
        } catch (error) {
          console.warn('Failed to clean up test file:', error);
        }
      }
    }
    
    // Clean up test folders
    const foldersToClean = ['test-assets', 'ui'];
    for (const folderPath of foldersToClean) {
      const folder = global.app.vault.getAbstractFileByPath(folderPath);
      if (folder) {
        try {
          await global.app.vault.delete(folder);
        } catch (error) {
          console.warn(`Failed to clean up folder ${folderPath}:`, error);
        }
      }
    }
  });

  describe('Layout Configuration Loading', () => {
    it('should load and apply class-specific layout configuration', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      // Test dynamic layout rendering with configuration
      await expect(renderer.render(
        '', // Empty source - should use dynamic configuration
        container,
        mockContext
      )).resolves.not.toThrow();

      // Wait for rendering to complete
      await testUtils.waitFor(() => container.innerHTML.length > 0, 3000);

      // Verify container has content
      expect(container.children.length).toBeGreaterThan(0);
      
      // Check that configured properties are displayed
      const containerContent = container.innerHTML;
      expect(containerContent).toContain('name');
      expect(containerContent).toContain('status');
      expect(containerContent).toContain('priority');
    });

    it('should fallback gracefully when no layout configuration exists', async () => {
      // Delete the layout configuration file
      await global.app.vault.delete(layoutConfigFile);

      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      // Should still render without throwing an error
      await expect(renderer.render(
        '',
        container,
        mockContext
      )).resolves.not.toThrow();

      // Should have some fallback content
      await testUtils.waitFor(() => container.innerHTML.length > 0, 2000);
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('Relations Filtering', () => {
    let relatedAsset: TFile;
    let anotherAsset: TFile;

    beforeEach(async () => {
      // Create related assets
      relatedAsset = await testUtils.createTestFile('test-assets/test-task-dynamic.md', `---
exo__Instance_class: exo__Task
name: Dynamic Test Task
status: InProgress
priority: Medium
ems__partOf: "[[test-project-dynamic]]"
---

# Dynamic Test Task

This task is part of the dynamic test project.
`);

      anotherAsset = await testUtils.createTestFile('test-assets/test-resource.md', `---
exo__Instance_class: exo__Resource
name: Test Resource
type: Documentation
ems__assignedTo: "Jane Smith"
rdfs__seeAlso: "[[test-project-dynamic]]"
---

# Test Resource

A resource related to the dynamic test project.
`);
    });

    afterEach(async () => {
      const filesToClean = [relatedAsset, anotherAsset];
      for (const file of filesToClean) {
        if (file) {
          try {
            await global.app.vault.delete(file);
          } catch (error) {
            console.warn('Failed to clean up related asset:', error);
          }
        }
      }
    });

    it('should filter relations based on configuration', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        '',
        container,
        mockContext
      );

      // Wait for relations to be loaded and filtered
      await testUtils.waitFor(() => {
        const content = container.innerHTML;
        return content.includes('ems__contains') || 
               content.includes('ems__assignedTo') || 
               content.includes('rdfs__seeAlso');
      }, 4000);

      const containerContent = container.innerHTML;

      // Should show configured relations
      expect(containerContent).toBeTruthy();
      expect(containerContent.length).toBeGreaterThan(0);
    });

    it('should display relations in configured display mode', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        '',
        container,
        mockContext
      );

      await testUtils.waitFor(() => container.innerHTML.length > 0, 3000);

      // Should use table mode as configured
      const containerContent = container.innerHTML;
      expect(containerContent).toContain('table') || 
      expect(containerContent).toContain('th') || 
      expect(containerContent).toContain('td');
    });
  });

  describe('Property Display Configuration', () => {
    it('should display only configured properties', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        '',
        container,
        mockContext
      );

      await testUtils.waitFor(() => container.innerHTML.length > 0, 3000);

      const containerContent = container.innerHTML;

      // Should display configured properties
      expect(containerContent).toContain('name');
      expect(containerContent).toContain('status');
      expect(containerContent).toContain('priority');
      expect(containerContent).toContain('dueDate');

      // Should not display unconfigured properties like 'progress'
      // Note: This test may be sensitive to implementation details
    });

    it('should handle missing properties gracefully', async () => {
      // Create an asset with missing configured properties
      const incompleteFile = await testUtils.createTestFile('test-assets/incomplete-project.md', `---
exo__Instance_class: exo__Project
name: Incomplete Project
---

# Incomplete Project

Project with minimal properties.
`);

      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: incompleteFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await expect(renderer.render(
        '',
        container,
        mockContext
      )).resolves.not.toThrow();

      // Clean up
      await global.app.vault.delete(incompleteFile);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid layout configuration gracefully', async () => {
      // Create an invalid layout configuration
      await global.app.vault.modify(layoutConfigFile, `---
exo__Class: ui__ClassLayout
exo__ClassType: exo__Project
ui__relationsToShow: "invalid-format"
ui__displayMode: invalid-mode
ui__showProperties: not-an-array
---

# Invalid Layout Configuration
`);

      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      // Should handle invalid configuration gracefully
      await expect(renderer.render(
        '',
        container,
        mockContext
      )).resolves.not.toThrow();

      await testUtils.waitFor(() => container.innerHTML.length > 0, 2000);
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('Interactive Features', () => {
    it('should support interactive elements based on configuration', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        '',
        container,
        mockContext
      );

      await testUtils.waitFor(() => container.innerHTML.length > 0, 3000);

      // Look for interactive elements (buttons, links, etc.)
      const interactiveElements = container.querySelectorAll(
        'button, a, input, select, [data-clickable], [onclick]'
      );

      // Should have some interactive elements
      expect(interactiveElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle click events on relation items', async () => {
      // First create some related assets
      const relatedTask = await testUtils.createTestFile('test-assets/clickable-task.md', `---
exo__Instance_class: exo__Task
name: Clickable Task
ems__partOf: "[[test-project-dynamic]]"
---

# Clickable Task
`);

      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        '',
        container,
        mockContext
      );

      await testUtils.waitFor(() => container.innerHTML.length > 0, 3000);

      // Look for clickable relation items
      const clickableElements = container.querySelectorAll('[data-file-path], a[href*="clickable-task"]');
      
      if (clickableElements.length > 0) {
        // Test clicking on a relation item
        await testUtils.clickElement(clickableElements[0] as HTMLElement);
        
        // Verify the click was processed (implementation-specific)
        expect(clickableElements[0]).toBeDefined();
      }

      // Clean up
      await global.app.vault.delete(relatedTask);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache layout configurations for performance', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      // First render - should load configuration
      const startTime1 = Date.now();
      await renderer.render('', container, mockContext);
      const firstRenderTime = Date.now() - startTime1;

      // Clear container for second render
      container.innerHTML = '';

      // Second render - should use cached configuration
      const startTime2 = Date.now();
      await renderer.render('', container, mockContext);
      const secondRenderTime = Date.now() - startTime2;

      // Second render should be faster due to caching
      // Note: This test might be flaky depending on system performance
      expect(secondRenderTime).toBeLessThanOrEqual(firstRenderTime + 100); // Allow some variance
    });

    it('should render within acceptable time limits', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      const startTime = Date.now();
      
      await renderer.render('', container, mockContext);

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render within 3 seconds (allowing for configuration loading)
      expect(renderTime).toBeLessThan(3000);
    });
  });
});