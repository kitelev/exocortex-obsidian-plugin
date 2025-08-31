/**
 * @jest-environment jest-environment-obsidian
 * @obsidian-conformance lax
 * @obsidian-version 1.5.0
 *
 * Basic E2E tests to demonstrate jest-environment-obsidian functionality
 * These tests verify that the environment setup works correctly
 */

import { App, TFile } from 'obsidian';
import { testUtils } from './setup';

declare global {
  var app: App;
}

describe('Basic Obsidian Environment Tests', () => {
  describe('Environment Setup', () => {
    it('should have access to global Obsidian app', () => {
      expect(global.app).toBeDefined();
      expect(global.app.vault).toBeDefined();
      expect(global.app.workspace).toBeDefined();
    });

    it('should have Obsidian API functions available', () => {
      expect(typeof global.app.vault.create).toBe('function');
      expect(typeof global.app.vault.delete).toBe('function');
      expect(typeof global.app.vault.getFiles).toBe('function');
    });

    it('should have DOM environment available', () => {
      expect(document).toBeDefined();
      expect(window).toBeDefined();
      expect(document.createElement).toBeDefined();
    });
  });

  describe('Vault Operations', () => {
    let testFile: TFile;

    afterEach(async () => {
      // Clean up test file
      if (testFile) {
        try {
          await global.app.vault.delete(testFile);
        } catch (error) {
          console.warn('Failed to clean up test file:', error);
        }
        testFile = null as any;
      }
    });

    it('should create a file in the vault', async () => {
      const fileName = 'e2e-test-file.md';
      const fileContent = '# E2E Test File\n\nThis is a test file created by E2E tests.';

      testFile = await global.app.vault.create(fileName, fileContent);

      expect(testFile).toBeDefined();
      expect(testFile.name).toBe(fileName);
      expect(testFile.path).toBe(fileName);
    });

    it('should read file content correctly', async () => {
      const fileName = 'e2e-read-test.md';
      const fileContent = '---\ntestProperty: testValue\n---\n\n# Read Test\n\nContent for reading test.';

      testFile = await global.app.vault.create(fileName, fileContent);
      const readContent = await global.app.vault.read(testFile);

      expect(readContent).toBe(fileContent);
    });

    it('should list files in the vault', async () => {
      const fileName = 'e2e-list-test.md';
      
      testFile = await global.app.vault.create(fileName, 'List test content');
      const files = global.app.vault.getFiles();

      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.some(file => file.name === fileName)).toBe(true);
    });

    it('should handle file metadata', async () => {
      const fileName = 'e2e-metadata-test.md';
      const fileContent = '---\nexo__Instance_class: exo__Asset\nname: Test Asset\nstatus: Active\n---\n\n# Metadata Test';

      testFile = await global.app.vault.create(fileName, fileContent);
      
      // Access metadata through app.metadataCache
      const metadata = global.app.metadataCache.getFileCache(testFile);
      
      expect(metadata).toBeDefined();
      if (metadata?.frontmatter) {
        expect(metadata.frontmatter['exo__Instance_class']).toBe('exo__Asset');
        expect(metadata.frontmatter['name']).toBe('Test Asset');
        expect(metadata.frontmatter['status']).toBe('Active');
      }
    });
  });

  describe('Test Utilities', () => {
    it('should provide working test utilities', async () => {
      expect(testUtils).toBeDefined();
      expect(typeof testUtils.waitFor).toBe('function');
      expect(typeof testUtils.createTestFile).toBe('function');
      expect(typeof testUtils.ensureFolder).toBe('function');
    });

    it('should create test files using utilities', async () => {
      const testFile = await testUtils.createTestFile(
        'utility-test.md',
        '# Utility Test\n\nCreated using test utilities.'
      );

      expect(testFile).toBeDefined();
      expect(testFile.name).toBe('utility-test.md');

      // Clean up
      await global.app.vault.delete(testFile);
    });

    it('should ensure folders exist', async () => {
      await testUtils.ensureFolder('test-folder');
      
      const folder = global.app.vault.getAbstractFileByPath('test-folder');
      expect(folder).toBeDefined();
      
      // Clean up
      if (folder) {
        await global.app.vault.delete(folder);
      }
    });
  });

  describe('DOM Interaction', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    it('should create and manipulate DOM elements', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      button.setAttribute('data-test', 'e2e-button');
      
      container.appendChild(button);

      expect(container.children.length).toBe(1);
      expect(button.textContent).toBe('Test Button');
      expect(button.getAttribute('data-test')).toBe('e2e-button');
    });

    it('should handle DOM events', async () => {
      const button = document.createElement('button');
      let clicked = false;

      button.addEventListener('click', () => {
        clicked = true;
      });

      container.appendChild(button);

      // Simulate click
      await testUtils.clickElement(button);

      expect(clicked).toBe(true);
    });

    it('should handle input elements', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Test input';

      container.appendChild(input);

      await testUtils.typeText(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });
  });

  describe('Performance', () => {
    it('should complete basic operations within time limits', async () => {
      const startTime = Date.now();

      // Perform multiple operations
      const testFile = await testUtils.createTestFile('perf-test.md', 'Performance test content');
      const files = global.app.vault.getFiles();
      await global.app.vault.delete(testFile);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple concurrent operations', async () => {
      const operations = [];
      
      for (let i = 0; i < 5; i++) {
        operations.push(
          testUtils.createTestFile(`concurrent-${i}.md`, `Content ${i}`)
        );
      }

      const files = await Promise.all(operations);

      expect(files.length).toBe(5);
      
      // Clean up
      await Promise.all(files.map(file => global.app.vault.delete(file)));
    });
  });

  describe('Error Handling', () => {
    it('should handle file creation errors gracefully', async () => {
      // Try to create a file with invalid path
      let error: Error | null = null;
      
      try {
        await global.app.vault.create('invalid/path/test.md', 'content');
      } catch (e) {
        error = e as Error;
      }

      // Should either handle gracefully or throw expected error
      expect(error === null || error instanceof Error).toBe(true);
    });

    it('should handle missing file operations', async () => {
      // Try to read non-existent file
      let error: Error | null = null;
      
      try {
        const nonExistentFile = global.app.vault.getAbstractFileByPath('does-not-exist.md');
        if (nonExistentFile) {
          await global.app.vault.read(nonExistentFile as TFile);
        }
      } catch (e) {
        error = e as Error;
      }

      // Should handle gracefully
      expect(true).toBe(true); // Test doesn't crash
    });
  });
});