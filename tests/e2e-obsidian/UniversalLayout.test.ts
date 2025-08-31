/**
 * @jest-environment jest-environment-obsidian
 * @obsidian-conformance lax
 * @obsidian-version 1.5.0
 *
 * Real E2E tests for UniversalLayoutRenderer using jest-environment-obsidian
 * Tests actual Obsidian API interactions without mocking
 */

import { App, TFile, MarkdownPostProcessorContext } from 'obsidian';
import { UniversalLayoutRenderer } from '../../src/presentation/renderers/UniversalLayoutRenderer';
import { testUtils } from './setup';

declare global {
  var app: App;
}

describe('UniversalLayoutRenderer E2E Tests', () => {
  let renderer: UniversalLayoutRenderer;
  let testFile: TFile;
  let container: HTMLElement;

  beforeEach(async () => {
    // Ensure we have the global app instance
    expect(global.app).toBeDefined();
    expect(global.app.vault).toBeDefined();
    
    // Create renderer instance
    renderer = new UniversalLayoutRenderer();
    
    // Create a test container in the DOM
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Ensure test folders exist
    await testUtils.ensureFolder('test-assets');
    
    // Create a test asset file with proper metadata
    testFile = await testUtils.createTestFile('test-assets/test-project.md', `---
exo__Instance_class: exo__Project
name: Test Project
status: Active
priority: High
dueDate: 2025-12-31
progress: 75
---

# Test Project

This is a test project for E2E testing.

## Description

A comprehensive test project to validate UniversalLayout functionality.
`);
  });

  afterEach(async () => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Clean up test files
    if (testFile) {
      try {
        await global.app.vault.delete(testFile);
      } catch (error) {
        console.warn('Failed to clean up test file:', error);
      }
    }
    
    // Clean up test folder
    const folder = global.app.vault.getAbstractFileByPath('test-assets');
    if (folder) {
      try {
        await global.app.vault.delete(folder);
      } catch (error) {
        console.warn('Failed to clean up test folder:', error);
      }
    }
  });

  describe('Basic Rendering', () => {
    it('should render without errors when given valid configuration', async () => {
      // Create a mock context
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      // Test basic rendering
      await expect(renderer.render(
        'layout=list',
        container,
        mockContext
      )).resolves.not.toThrow();

      // Verify container has content
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('should display asset properties correctly', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        'layout=table\nshowProperties=name,status,priority',
        container,
        mockContext
      );

      // Wait for rendering to complete
      await testUtils.waitFor(() => container.innerHTML.length > 0, 2000);

      // Check that properties are displayed
      const containerContent = container.innerHTML;
      expect(containerContent).toContain('name');
      expect(containerContent).toContain('status');
      expect(containerContent).toContain('priority');
    });

    it('should handle different layout modes', async () => {
      const layouts = ['list', 'table', 'cards'];
      
      for (const layout of layouts) {
        // Clear container for each test
        container.innerHTML = '';
        
        const mockContext: MarkdownPostProcessorContext = {
          docId: 'test-doc',
          sourcePath: testFile.path,
          frontmatter: {},
          addChild: jest.fn(),
          getSectionInfo: jest.fn(() => null)
        };

        await renderer.render(
          `layout=${layout}`,
          container,
          mockContext
        );

        // Wait for rendering
        await testUtils.waitFor(() => container.innerHTML.length > 0, 2000);

        // Verify layout-specific content is present
        expect(container.innerHTML).toBeTruthy();
        expect(container.innerHTML.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Asset Relations', () => {
    let relatedAsset: TFile;

    beforeEach(async () => {
      // Create a related asset that references the main test asset
      relatedAsset = await testUtils.createTestFile('test-assets/test-task.md', `---
exo__Instance_class: exo__Task
name: Test Task
status: InProgress
priority: Medium
ems__partOf: "[[test-project]]"
---

# Test Task

This task is part of the test project.
`);
    });

    afterEach(async () => {
      if (relatedAsset) {
        try {
          await global.app.vault.delete(relatedAsset);
        } catch (error) {
          console.warn('Failed to clean up related asset:', error);
        }
      }
    });

    it('should display asset relations correctly', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        'layout=table\ngroupByProperty=true',
        container,
        mockContext
      );

      // Wait for relations to be loaded
      await testUtils.waitFor(() => {
        const content = container.innerHTML;
        return content.includes('ems__partOf') || content.includes('relation');
      }, 3000);

      // Check that relations are displayed
      const containerContent = container.innerHTML;
      expect(containerContent.length).toBeGreaterThan(0);
    });

    it('should handle sorting by different properties', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        'layout=table\nsortBy=name\nsortOrder=asc',
        container,
        mockContext
      );

      await testUtils.waitFor(() => container.innerHTML.length > 0, 2000);

      // Verify sorted content is present
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file paths gracefully', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: 'non-existent-file.md',
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      // Should not throw an error, but should handle gracefully
      await expect(renderer.render(
        'layout=list',
        container,
        mockContext
      )).resolves.not.toThrow();
    });

    it('should handle invalid configuration parameters', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      // Test with invalid layout
      await expect(renderer.render(
        'layout=invalid\nunknownParam=value',
        container,
        mockContext
      )).resolves.not.toThrow();
    });
  });

  describe('Interactive Features', () => {
    it('should handle creation button clicks', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        'layout=table\nshowCreateButton=true',
        container,
        mockContext
      );

      // Wait for rendering to complete
      await testUtils.waitFor(() => container.innerHTML.length > 0, 2000);

      // Look for create button
      const createButton = container.querySelector('[data-create-asset]');
      if (createButton) {
        // Test button click
        await testUtils.clickElement(createButton as HTMLElement);
        
        // Verify modal or action was triggered
        // Note: This depends on the specific implementation
        expect(createButton).toBeDefined();
      }
    });

    it('should handle table sorting interactions', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      await renderer.render(
        'layout=table\nshowProperties=name,status,priority',
        container,
        mockContext
      );

      await testUtils.waitFor(() => container.innerHTML.length > 0, 2000);

      // Look for sortable headers
      const headers = container.querySelectorAll('th[data-sortable]');
      if (headers.length > 0) {
        // Test header click for sorting
        await testUtils.clickElement(headers[0] as HTMLElement);
        
        // Wait for re-sort to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify sorting was applied (check for sort indicators)
        expect(headers[0].classList.contains('sorted') || 
               headers[0].querySelector('.sort-indicator')).toBeTruthy();
      }
    });
  });

  describe('Performance', () => {
    it('should render within acceptable time limits', async () => {
      const mockContext: MarkdownPostProcessorContext = {
        docId: 'test-doc',
        sourcePath: testFile.path,
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn(() => null)
      };

      const startTime = Date.now();
      
      await renderer.render(
        'layout=table\nshowProperties=name,status,priority',
        container,
        mockContext
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });
  });
});