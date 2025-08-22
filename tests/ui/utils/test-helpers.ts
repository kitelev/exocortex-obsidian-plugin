/**
 * UI Test Helper Utilities
 *
 * Common utilities for handling UI tests in headless Chrome environment.
 * These utilities provide robust waiting, retry logic, and error handling
 * specifically designed for the challenges of headless browser testing.
 */

import {
  testConfig,
  TEST_TIMEOUTS,
  TEST_RETRIES,
  IS_CI,
  DEBUG_ENABLED,
} from "../config/test-config";

export class UITestHelpers {
  /**
   * Take a screenshot for debugging purposes
   *
   * @param name Screenshot name/identifier
   * @returns Promise that resolves when screenshot is taken
   */
  static async takeDebugScreenshot(name: string): Promise<void> {
    try {
      if (testConfig.isDebuggingEnabled("screenshots")) {
        console.log(`📸 Taking debug screenshot: ${name}`);
        // In CI, we may not have screenshot capability, so just log
        await browser.executeObsidian(() => {
          console.log(`Screenshot requested: ${name}`);
          console.log("Document title:", document.title);
          console.log(
            "Modal count:",
            document.querySelectorAll(".modal").length,
          );
          console.log("Body classes:", document.body.className);
        });
      }
    } catch (error) {
      console.warn(`Failed to take screenshot '${name}':`, error.message);
    }
  }

  /**
   * Log DOM state for debugging
   *
   * @param context Description of when this is being called
   * @returns Promise that resolves when logging is complete
   */
  static async logDOMState(context: string): Promise<void> {
    try {
      await browser.executeObsidian((obsidianContext, ctx) => {
        console.log(`=== DOM State (${ctx}) ===`);

        const modals = document.querySelectorAll(".modal");
        console.log(`Modals found: ${modals.length}`);

        modals.forEach((modal, i) => {
          console.log(`Modal ${i}:`);
          console.log(
            `  - Visible: ${window.getComputedStyle(modal).display !== "none"}`,
          );
          console.log(`  - Classes: ${modal.className}`);
          console.log(`  - Children: ${modal.children.length}`);

          const h2 = modal.querySelector("h2");
          if (h2) console.log(`  - Title: '${h2.textContent}'`);

          const inputs = modal.querySelectorAll("input");
          console.log(`  - Inputs: ${inputs.length}`);

          const selects = modal.querySelectorAll("select");
          console.log(`  - Selects: ${selects.length}`);
        });

        console.log(`=== End DOM State (${ctx}) ===`);
      }, context);
    } catch (error) {
      console.warn(`Failed to log DOM state for '${context}':`, error.message);
    }
  }
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
    timeout: number = TEST_TIMEOUTS.ELEMENT,
    interval: number = 100,
  ): Promise<boolean> {
    const endTime = Date.now() + timeout;
    let lastError = null;

    while (Date.now() < endTime) {
      try {
        const exists = await browser.executeObsidian((obsidianContext, sel) => {
          const element = document.querySelector(sel);
          if (element) {
            console.log(`Element found: ${sel}`);
            return true;
          }
          return false;
        }, selector);

        if (exists) {
          if (DEBUG_ENABLED)
            console.log(
              `✓ Element '${selector}' found after ${Date.now() - (endTime - timeout)}ms`,
            );
          return true;
        }
      } catch (error) {
        lastError = error;
        if (DEBUG_ENABLED)
          console.log(`Error checking element '${selector}':`, error.message);
      }

      await browser.pause(interval);
    }

    if (DEBUG_ENABLED) {
      console.log(`✗ Element '${selector}' not found within ${timeout}ms`);
      if (lastError) console.log("Last error:", lastError.message);
    }

    return false;
  }

  /**
   * Wait for Obsidian modal to appear
   *
   * @param timeout Maximum time to wait in milliseconds
   * @returns Promise that resolves to true if modal found, false otherwise
   */
  static async waitForModal(
    timeout: number = TEST_TIMEOUTS.MODAL,
  ): Promise<boolean> {
    return await this.waitForElement(".modal", timeout);
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
    timeout: number = TEST_TIMEOUTS.CONTENT,
  ): Promise<boolean> {
    const endTime = Date.now() + timeout;
    let attempts = 0;

    while (Date.now() < endTime) {
      attempts++;

      try {
        const hasContent = await browser.executeObsidian(
          (obsidianContext, sel) => {
            const modal = document.querySelector(".modal");
            if (!modal) {
              console.log("Modal not found when checking for content");
              return false;
            }

            const content = modal.querySelector(sel);
            if (content) {
              console.log(`Modal content found: ${sel}`);
              return true;
            }

            // Debug: log what we do have in the modal
            if (attempts % 20 === 0) {
              // Log every 2 seconds
              const allElements = Array.from(modal.querySelectorAll("*"))
                .map((el) => el.tagName.toLowerCase())
                .slice(0, 10); // Limit output
              console.log(
                `Modal elements (attempt ${attempts}):`,
                allElements.join(", "),
              );
            }

            return false;
          },
          contentSelector,
        );

        if (hasContent) {
          if (DEBUG_ENABLED)
            console.log(
              `✓ Modal content '${contentSelector}' found after ${attempts} attempts`,
            );
          return true;
        }
      } catch (error) {
        if (DEBUG_ENABLED && attempts % 50 === 0) {
          console.log(
            `Error checking modal content '${contentSelector}' (attempt ${attempts}):`,
            error.message,
          );
        }
      }

      await browser.pause(100);
    }

    if (DEBUG_ENABLED) {
      console.log(
        `✗ Modal content '${contentSelector}' not found within ${timeout}ms (${attempts} attempts)`,
      );
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
    maxAttempts: number = TEST_RETRIES.OPERATIONS,
    delay: number = 1000,
    backoffMultiplier: number = 1,
  ): Promise<T> {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (DEBUG_ENABLED && attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt}/${maxAttempts}`);
        }

        const result = await operation();

        if (DEBUG_ENABLED && attempt > 1) {
          console.log(`✓ Operation succeeded on attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        if (DEBUG_ENABLED) {
          console.log(
            `✗ Attempt ${attempt}/${maxAttempts} failed:`,
            error.message,
          );
        }

        if (attempt < maxAttempts) {
          const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);

          if (DEBUG_ENABLED || attempt === 1) {
            console.log(
              `Retrying in ${waitTime}ms... (${maxAttempts - attempt} attempts left)`,
            );
          }

          await browser.pause(waitTime);
        }
      }
    }

    if (DEBUG_ENABLED) {
      console.log(
        `💥 All ${maxAttempts} attempts failed. Final error:`,
        lastError?.message,
      );
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
    timeout: number = 10000,
  ): Promise<boolean> {
    const promises = selectors.map((selector) =>
      this.waitForElement(selector, timeout),
    );

    const results = await Promise.all(promises);
    return results.every((result) => result === true);
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
    timeout: number = 10000,
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
    await this.retryOperation(
      async () => {
        await browser.executeObsidian(() => {
          const modals = document.querySelectorAll(".modal");
          modals.forEach((modal) => {
            const closeButton = modal.querySelector(".modal-close-button");
            if (closeButton) {
              (closeButton as HTMLElement).click();
            } else {
              // Fallback: press Escape
              const event = new KeyboardEvent("keydown", {
                key: "Escape",
                keyCode: 27,
                which: 27,
              });
              document.dispatchEvent(event);
            }
          });
        });
      },
      maxAttempts,
      500,
    );

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
    timeout: number = 10000,
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
    timeout: number = 10000,
  ): Promise<T> {
    const modalExists = await this.waitForModal(timeout);
    if (!modalExists) {
      throw new Error("Modal not found within timeout");
    }

    return await operation();
  }

  /**
   * Check if currently running in CI environment
   *
   * @returns true if running in CI environment
   */
  static isCI(): boolean {
    const ci = !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.BUILD_NUMBER ||
      process.env.JENKINS_URL
    );

    // Log CI detection once
    if (ci && !this._ciLogged) {
      console.log("🤖 CI environment detected");
      console.log(
        `Environment vars: CI=${process.env.CI}, GITHUB_ACTIONS=${process.env.GITHUB_ACTIONS}`,
      );
      this._ciLogged = true;
    }

    return ci;
  }

  private static _ciLogged = false;

  /**
   * Check if modal exists without waiting
   *
   * @returns Promise that resolves to true if modal exists, false otherwise
   */
  static async isModalOpen(): Promise<boolean> {
    try {
      return await browser.executeObsidian(() => {
        return document.querySelector(".modal") !== null;
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
        console.log("No modal to close - skipping close operation");
        return true;
      }

      await this.retryOperation(
        async () => {
          await browser.executeObsidian(() => {
            const modal = document.querySelector(".modal");
            if (!modal) {
              return; // Modal already closed
            }

            // Try multiple close strategies
            const closeButton = modal.querySelector(".modal-close-button");
            if (closeButton) {
              (closeButton as HTMLElement).click();
            } else {
              // Fallback: press Escape key
              const event = new KeyboardEvent("keydown", {
                key: "Escape",
                keyCode: 27,
                which: 27,
              });
              document.dispatchEvent(event);
            }
          });
        },
        maxAttempts,
        500,
      );

      // Wait for modal to disappear
      await browser.pause(1000);

      // Verify modal is closed
      const stillOpen = await this.isModalOpen();
      return !stillOpen;
    } catch (error) {
      console.warn("Error during safe modal close:", error.message);
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
    elementCount: number;
    hasTitle: boolean;
    hasInputs: boolean;
    hasSelects: boolean;
    className: string | null;
    error?: string;
  }> {
    try {
      return await browser.executeObsidian(() => {
        const modal = document.querySelector(".modal");

        if (!modal) {
          // Check if there are any elements that might be modals
          const possibleModals = document.querySelectorAll(
            '[class*="modal"], .dialog, .popup',
          );
          console.log(
            `No .modal found, but found ${possibleModals.length} possible modal elements`,
          );

          return {
            exists: false,
            hasCloseButton: false,
            isVisible: false,
            content: null,
            elementCount: 0,
            hasTitle: false,
            hasInputs: false,
            hasSelects: false,
            className: null,
          };
        }

        const closeButton = modal.querySelector(".modal-close-button");
        const style = window.getComputedStyle(modal);
        const isVisible =
          style.display !== "none" && style.visibility !== "hidden";
        const elements = modal.querySelectorAll("*");
        const title = modal.querySelector("h1, h2, h3, .modal-title");
        const inputs = modal.querySelectorAll("input");
        const selects = modal.querySelectorAll("select");

        // Log modal structure for debugging
        const structure = Array.from(elements)
          .slice(0, 15) // First 15 elements
          .map(
            (el) =>
              `${el.tagName.toLowerCase()}${el.className ? "." + el.className : ""}`,
          )
          .join(", ");

        console.log("Modal structure:", structure);

        return {
          exists: true,
          hasCloseButton: closeButton !== null,
          isVisible,
          content: modal.textContent?.substring(0, 200) || null,
          elementCount: elements.length,
          hasTitle: title !== null,
          hasInputs: inputs.length > 0,
          hasSelects: selects.length > 0,
          className: modal.className || null,
        };
      });
    } catch (error) {
      return {
        exists: false,
        hasCloseButton: false,
        isVisible: false,
        content: null,
        elementCount: 0,
        hasTitle: false,
        hasInputs: false,
        hasSelects: false,
        className: null,
        error: error.message,
      };
    }
  }
}
