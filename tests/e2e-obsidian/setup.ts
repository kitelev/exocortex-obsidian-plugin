/**
 * Setup file for jest-environment-obsidian E2E tests
 * This file configures the real Obsidian environment for testing
 */

import { App, TFile, Plugin } from 'obsidian';

declare global {
  var app: App;
  var plugin: Plugin;
}

// Global setup that runs before each test
beforeEach(async () => {
  // Ensure we have a clean slate for each test
  if (global.app && global.app.vault) {
    // Clean up any test files from previous tests
    const testFiles = global.app.vault.getFiles().filter(file => 
      file.path.includes('test-') || file.path.includes('spec-')
    );
    
    for (const file of testFiles) {
      try {
        await global.app.vault.delete(file);
      } catch (error) {
        // Ignore errors during cleanup
        console.warn(`Failed to delete test file ${file.path}:`, error);
      }
    }
  }
});

// Global cleanup that runs after each test
afterEach(async () => {
  // Additional cleanup if needed
  if (global.app && global.app.workspace) {
    // Close any open modals or dialogs
    const activeModal = (global.app as any).modal;
    if (activeModal && activeModal.close) {
      activeModal.close();
    }
  }
});

// Test utilities that can be used across E2E tests
export const testUtils = {
  /**
   * Wait for a condition to be true
   */
  async waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!condition()) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
  },

  /**
   * Create a test file in the vault
   */
  async createTestFile(path: string, content: string): Promise<TFile> {
    if (!global.app) {
      throw new Error('Obsidian app not available');
    }
    return await global.app.vault.create(path, content);
  },

  /**
   * Get or create a test vault folder
   */
  async ensureFolder(path: string): Promise<void> {
    if (!global.app) {
      throw new Error('Obsidian app not available');
    }
    
    if (!global.app.vault.getAbstractFileByPath(path)) {
      await global.app.vault.createFolder(path);
    }
  },

  /**
   * Wait for an element to appear in the DOM
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkForElement = () => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for element ${selector} after ${timeout}ms`));
          return;
        }
        
        setTimeout(checkForElement, 100);
      };
      
      checkForElement();
    });
  },

  /**
   * Simulate user interaction with an element
   */
  async clickElement(element: HTMLElement): Promise<void> {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
    
    // Wait a bit for the click to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  /**
   * Type text into an input element
   */
  async typeText(element: HTMLInputElement | HTMLTextAreaElement, text: string): Promise<void> {
    element.focus();
    element.value = text;
    
    // Trigger input events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait a bit for the input to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};