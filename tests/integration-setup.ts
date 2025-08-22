/**
 * Integration Test Setup
 * Additional setup for integration tests to prevent timeouts and memory issues
 */

// Force garbage collection between tests if available
if (global.gc) {
  afterEach(() => {
    global.gc();
  });
}

// Set longer timeouts for integration tests
jest.setTimeout(120000);

// Mock timers for faster test execution
beforeEach(() => {
  // Only use fake timers when explicitly needed by individual tests
  jest.clearAllTimers();
});

afterEach(() => {
  // Clean up any pending timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Enhanced memory cleanup
afterEach(() => {
  // Clear any intervals or timeouts
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
    clearInterval(i);
  }

  // Clear any event listeners on global objects
  if (typeof window !== "undefined") {
    // Remove all event listeners from window
    const clonedWindow = window.cloneNode ? window.cloneNode(false) : window;
    if (clonedWindow !== window) {
      Object.setPrototypeOf(window, Object.getPrototypeOf(clonedWindow));
    }
  }

  // Force DOM cleanup
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  }
});

// Prevent memory leaks from unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  console.warn("Unhandled Rejection at:", promise, "reason:", reason);
});

// Enhanced platform mock reset for integration tests
beforeEach(() => {
  // Reset platform mocks to default state
  delete process.env.TEST_PLATFORM;

  // Reset any cached platform detection
  if (typeof window !== "undefined" && (window as any).__PLATFORM_REFRESH__) {
    (window as any).__PLATFORM_REFRESH__();
  }
});

// Global error handling for integration tests
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn((message, ...args) => {
    // Only suppress expected test errors, log unexpected ones
    if (typeof message === "string" && message.includes("Warning:")) {
      return; // Suppress React/JSDOM warnings
    }
    originalError(message, ...args);
  });
});

afterEach(() => {
  console.error = originalError;
});
