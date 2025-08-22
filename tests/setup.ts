/**
 * Jest Test Setup
 * Configures the testing environment for CI and local development
 */

// Note: jest-dom is not available, using custom DOM extensions

// Setup DOM globals that might be missing in CI
Object.defineProperty(global, "ResizeObserver", {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

// Mock HTMLElement methods that might not exist in JSDOM
if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  HTMLElement.prototype.scrollTo = jest.fn();
  HTMLElement.prototype.focus = jest.fn();
  HTMLElement.prototype.blur = jest.fn();

  // Add addClass/removeClass methods for compatibility with Obsidian
  HTMLElement.prototype.addClass = function (className: string) {
    this.classList.add(className);
    return this;
  };

  HTMLElement.prototype.removeClass = function (className: string) {
    this.classList.remove(className);
    return this;
  };

  HTMLElement.prototype.toggleClass = function (
    className: string,
    force?: boolean,
  ) {
    this.classList.toggle(className, force);
    return this;
  };

  HTMLElement.prototype.hasClass = function (className: string) {
    return this.classList.contains(className);
  };
}

// Mock window.matchMedia if it doesn't exist
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.getComputedStyle
Object.defineProperty(window, "getComputedStyle", {
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn().mockReturnValue(""),
    setProperty: jest.fn(),
    removeProperty: jest.fn(),
  })),
});

// Suppress console logs during tests unless explicitly enabled
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  if (process.env.CI && !process.env.JEST_VERBOSE) {
    // Suppress logs in CI unless verbose mode is enabled
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterEach(() => {
  // Restore console methods after each test
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Global CI environment detection
(global as any).isCI =
  process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

// Note: Removed automatic fake timers as they can cause timeout issues in CI
// Individual tests should use jest.useFakeTimers() when needed
