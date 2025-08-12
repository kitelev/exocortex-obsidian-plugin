/**
 * UI Test Helper Utilities
 * 
 * Common utilities for handling UI tests in headless Chrome environment.
 * These utilities provide robust waiting, retry logic, and error handling
 * specifically designed for the challenges of headless browser testing.
 */

export class UITestHelpers {
  /**
   * Wait for a DOM element to appear within the specified timeout
   * 
   * @param selector CSS selector for the element
   * @param timeout Maximum time to wait in milliseconds
   * @param interval Check interval in milliseconds
   * @returns Promise that resolves to true if element found, false otherwise
   */
  static async waitForElement(
    selector: string, 
    timeout: number = 10000,
    interval: number = 100
  ): Promise<boolean> {
    const endTime = Date.now() + timeout;
    
    while (Date.now() < endTime) {
      const exists = await browser.executeObsidian((obsidianContext, sel) => {
        return document.querySelector(sel) !== null;
      }, selector);
      
      if (exists) return true;
      await browser.pause(interval);
    }
    
    return false;
  }
  
  /**
   * Wait for Obsidian modal to appear
   * 
   * @param timeout Maximum time to wait in milliseconds
   * @returns Promise that resolves to true if modal found, false otherwise
   */
  static async waitForModal(timeout: number = 10000): Promise<boolean> {
    return await this.waitForElement('.modal', timeout);
  }
  
  /**
   * Wait for specific content within a modal
   * 
   * @param contentSelector CSS selector for content within the modal
   * @param timeout Maximum time to wait in milliseconds
   * @returns Promise that resolves to true if content found, false otherwise
   */
  static async waitForModalContent(
    contentSelector: string,
    timeout: number = 10000
  ): Promise<boolean> {
    const endTime = Date.now() + timeout;
    
    while (Date.now() < endTime) {
      const hasContent = await browser.executeObsidian((obsidianContext, sel) => {
        const modal = document.querySelector('.modal');
        if (!modal) return false;
        return modal.querySelector(sel) !== null;
      }, contentSelector);
      
      if (hasContent) return true;
      await browser.pause(100);
    }
    
    return false;
  }
  
  /**
   * Retry an operation with exponential backoff
   * 
   * @param operation Function to retry
   * @param maxAttempts Maximum number of retry attempts
   * @param delay Base delay between attempts in milliseconds
   * @param backoffMultiplier Multiplier for exponential backoff (default: 1 = linear)
   * @returns Promise that resolves to the operation result
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    backoffMultiplier: number = 1
  ): Promise<T> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
          console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
          await browser.pause(waitTime);
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Wait for multiple elements to appear
   * 
   * @param selectors Array of CSS selectors
   * @param timeout Maximum time to wait for all elements
   * @returns Promise that resolves to true if all elements found, false otherwise
   */
  static async waitForElements(
    selectors: string[],
    timeout: number = 10000
  ): Promise<boolean> {
    const promises = selectors.map(selector => 
      this.waitForElement(selector, timeout)
    );
    
    const results = await Promise.all(promises);
    return results.every(result => result === true);
  }
  
  /**
   * Wait for element and get its text content
   * 
   * @param selector CSS selector for the element
   * @param timeout Maximum time to wait in milliseconds
   * @returns Promise that resolves to element text or null if not found
   */
  static async waitForElementText(
    selector: string,
    timeout: number = 10000
  ): Promise<string | null> {
    const exists = await this.waitForElement(selector, timeout);
    if (!exists) return null;
    
    return await browser.executeObsidian((obsidianContext, sel) => {
      const element = document.querySelector(sel);
      return element ? element.textContent : null;
    }, selector);
  }
  
  /**
   * Close all open modals with retry logic
   * 
   * @param maxAttempts Maximum number of attempts to close modals
   * @returns Promise that resolves when all modals are closed
   */
  static async closeAllModals(maxAttempts: number = 3): Promise<void> {
    await this.retryOperation(async () => {
      await browser.executeObsidian(() => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
          const closeButton = modal.querySelector('.modal-close-button');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          } else {
            // Fallback: press Escape
            const event = new KeyboardEvent('keydown', {
              key: 'Escape',
              keyCode: 27,
              which: 27
            });
            document.dispatchEvent(event);
          }
        });
      });
    }, maxAttempts, 500);
    
    await browser.pause(1000);
  }
  
  /**
   * Wait for an element to disappear from the DOM
   * 
   * @param selector CSS selector for the element
   * @param timeout Maximum time to wait in milliseconds
   * @returns Promise that resolves to true if element disappeared, false otherwise
   */
  static async waitForElementToDisappear(
    selector: string,
    timeout: number = 10000
  ): Promise<boolean> {
    const endTime = Date.now() + timeout;
    
    while (Date.now() < endTime) {
      const exists = await browser.executeObsidian((obsidianContext, sel) => {
        return document.querySelector(sel) !== null;
      }, selector);
      
      if (!exists) return true;
      await browser.pause(100);
    }
    
    return false;
  }
  
  /**
   * Execute operation with modal context (ensures modal exists first)
   * 
   * @param operation Function to execute with modal context
   * @param timeout Maximum time to wait for modal
   * @returns Promise that resolves to the operation result
   */
  static async withModal<T>(
    operation: () => Promise<T>,
    timeout: number = 10000
  ): Promise<T> {
    const modalExists = await this.waitForModal(timeout);
    if (!modalExists) {
      throw new Error('Modal not found within timeout');
    }
    
    return await operation();
  }

  /**
   * Check if currently running in CI environment
   * 
   * @returns true if running in CI environment
   */
  static isCI(): boolean {
    return !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.BUILD_NUMBER ||
      process.env.JENKINS_URL
    );
  }

  /**
   * Check if modal exists without waiting
   * 
   * @returns Promise that resolves to true if modal exists, false otherwise
   */
  static async isModalOpen(): Promise<boolean> {
    try {
      return await browser.executeObsidian(() => {
        return document.querySelector('.modal') !== null;
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Safely close modal only if it exists
   * 
   * @param maxAttempts Maximum number of attempts to close modal
   * @returns Promise that resolves to true if modal was closed or didn't exist, false if failed to close
   */
  static async safeCloseModal(maxAttempts: number = 3): Promise<boolean> {
    try {
      const modalExists = await this.isModalOpen();
      
      if (!modalExists) {
        console.log('No modal to close - skipping close operation');
        return true;
      }

      await this.retryOperation(async () => {
        await browser.executeObsidian(() => {
          const modal = document.querySelector('.modal');
          if (!modal) {
            return; // Modal already closed
          }
          
          // Try multiple close strategies
          const closeButton = modal.querySelector('.modal-close-button');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          } else {
            // Fallback: press Escape key
            const event = new KeyboardEvent('keydown', {
              key: 'Escape',
              keyCode: 27,
              which: 27
            });
            document.dispatchEvent(event);
          }
        });
      }, maxAttempts, 500);

      // Wait for modal to disappear
      await browser.pause(1000);

      // Verify modal is closed
      const stillOpen = await this.isModalOpen();
      return !stillOpen;
      
    } catch (error) {
      console.warn('Error during safe modal close:', error.message);
      return false;
    }
  }

  /**
   * Get detailed modal state information for debugging
   * 
   * @returns Promise that resolves to modal state object
   */
  static async getModalState(): Promise<{
    exists: boolean;
    hasCloseButton: boolean;
    isVisible: boolean;
    content: string | null;
    error?: string;
  }> {
    try {
      return await browser.executeObsidian(() => {
        const modal = document.querySelector('.modal');
        
        if (!modal) {
          return {
            exists: false,
            hasCloseButton: false,
            isVisible: false,
            content: null
          };
        }

        const closeButton = modal.querySelector('.modal-close-button');
        const style = window.getComputedStyle(modal);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
        
        return {
          exists: true,
          hasCloseButton: closeButton !== null,
          isVisible,
          content: modal.textContent?.substring(0, 100) || null
        };
      });
    } catch (error) {
      return {
        exists: false,
        hasCloseButton: false,
        isVisible: false,
        content: null,
        error: error.message
      };
    }
  }
}