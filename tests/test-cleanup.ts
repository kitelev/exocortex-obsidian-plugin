/**
 * Global Test Cleanup System
 * Prevents memory leaks and ensures proper test isolation
 */

// Track global state for cleanup
interface GlobalTestState {
  timers: Set<NodeJS.Timeout>;
  intervals: Set<NodeJS.Timeout>;
  eventListeners: Map<
    EventTarget,
    Array<{ type: string; listener: EventListener }>
  >;
  domNodes: Set<Element>;
  mockInstances: Set<any>;
}

const globalTestState: GlobalTestState = {
  timers: new Set(),
  intervals: new Set(),
  eventListeners: new Map(),
  domNodes: new Set(),
  mockInstances: new Set(),
};

// Override setTimeout to track timers
const originalSetTimeout = global.setTimeout;
global.setTimeout = ((...args: any[]) => {
  const timer = originalSetTimeout.apply(global, args as [Function, number]);
  globalTestState.timers.add(timer);
  return timer;
}) as typeof setTimeout;

// Override setInterval to track intervals
const originalSetInterval = global.setInterval;
global.setInterval = ((...args: any[]) => {
  const interval = originalSetInterval.apply(
    global,
    args as [Function, number],
  );
  globalTestState.intervals.add(interval);
  return interval;
}) as typeof setInterval;

// Override clearTimeout
const originalClearTimeout = global.clearTimeout;
global.clearTimeout = ((timer: NodeJS.Timeout) => {
  globalTestState.timers.delete(timer);
  return originalClearTimeout(timer);
}) as typeof clearTimeout;

// Override clearInterval
const originalClearInterval = global.clearInterval;
global.clearInterval = ((interval: NodeJS.Timeout) => {
  globalTestState.intervals.delete(interval);
  return originalClearInterval(interval);
}) as typeof clearInterval;

// Track DOM event listeners
if (
  typeof EventTarget !== "undefined" &&
  EventTarget.prototype.addEventListener
) {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (!globalTestState.eventListeners.has(this)) {
      globalTestState.eventListeners.set(this, []);
    }
    globalTestState.eventListeners.get(this)!.push({ type, listener });
    return originalAddEventListener.call(this, type, listener, options);
  };
}

// Track DOM nodes created during tests
if (typeof document !== "undefined" && document.createElement) {
  const originalCreateElement = document.createElement;
  document.createElement = function <K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions,
  ): HTMLElementTagNameMap[K] {
    const element = originalCreateElement.call(this, tagName, options);
    globalTestState.domNodes.add(element);
    return element;
  };
}

/**
 * Memory-safe mock factory
 */
export class MemorySafeMockFactory {
  private static instances = new Map<string, any>();

  static createMock<T>(identifier: string, mockImplementation: () => T): T {
    if (this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }

    const mock = mockImplementation();
    this.instances.set(identifier, mock);
    globalTestState.mockInstances.add(mock);
    return mock;
  }

  static clearMock(identifier: string): void {
    if (this.instances.has(identifier)) {
      const mock = this.instances.get(identifier);
      globalTestState.mockInstances.delete(mock);
      this.instances.delete(identifier);
    }
  }

  static clearAllMocks(): void {
    this.instances.clear();
    globalTestState.mockInstances.clear();
  }
}

/**
 * Force cleanup of all test resources
 */
export function forceCleanupTestResources(): void {
  // Clear all timers
  globalTestState.timers.forEach((timer) => {
    try {
      clearTimeout(timer);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  globalTestState.timers.clear();

  // Clear all intervals
  globalTestState.intervals.forEach((interval) => {
    try {
      clearInterval(interval);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  globalTestState.intervals.clear();

  // Remove all event listeners
  globalTestState.eventListeners.forEach((listeners, target) => {
    listeners.forEach(({ type, listener }) => {
      try {
        target.removeEventListener(type, listener);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });
  globalTestState.eventListeners.clear();

  // Clean up DOM nodes
  if (typeof document !== "undefined") {
    globalTestState.domNodes.forEach((node) => {
      try {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    globalTestState.domNodes.clear();

    // Clear document body
    if (document.body) {
      document.body.innerHTML = "";
    }
  }

  // Clear mock instances
  MemorySafeMockFactory.clearAllMocks();

  // Force garbage collection if available
  if (typeof global.gc === "function") {
    try {
      global.gc();
    } catch (e) {
      // Ignore GC errors
    }
  }
}

/**
 * Memory usage tracker for tests
 */
export class MemoryTracker {
  private static snapshots: Array<{
    test: string;
    memory: NodeJS.MemoryUsage;
    timestamp: number;
  }> = [];

  static takeSnapshot(testName: string): NodeJS.MemoryUsage {
    const memory = process.memoryUsage();
    this.snapshots.push({
      test: testName,
      memory,
      timestamp: Date.now(),
    });

    // Keep only last 10 snapshots to prevent memory buildup
    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }

    return memory;
  }

  static getMemoryIncrease(from: string, to: string): number {
    const fromSnapshot = this.snapshots.find((s) => s.test === from);
    const toSnapshot = this.snapshots.find((s) => s.test === to);

    if (!fromSnapshot || !toSnapshot) {
      return 0;
    }

    return toSnapshot.memory.heapUsed - fromSnapshot.memory.heapUsed;
  }

  static reportMemoryUsage(): void {
    if (process.env.JEST_VERBOSE || process.env.MEMORY_DEBUG) {
      console.log("Memory Usage Report:");
      this.snapshots.forEach((snapshot) => {
        const mb = (snapshot.memory.heapUsed / 1024 / 1024).toFixed(2);
        console.log(`  ${snapshot.test}: ${mb}MB`);
      });
    }
  }

  static clearSnapshots(): void {
    this.snapshots.length = 0;
  }
}

// Global setup and teardown
beforeEach(() => {
  // Clear any hanging resources before each test
  forceCleanupTestResources();

  // Take memory snapshot
  const testName = expect.getState()?.currentTestName || "unknown";
  MemoryTracker.takeSnapshot(`before-${testName}`);
});

afterEach(() => {
  // Clear all resources after each test
  forceCleanupTestResources();

  // Take memory snapshot
  const testName = expect.getState()?.currentTestName || "unknown";
  MemoryTracker.takeSnapshot(`after-${testName}`);

  // Report excessive memory usage
  const increase = MemoryTracker.getMemoryIncrease(
    `before-${testName}`,
    `after-${testName}`,
  );
  const warningThreshold = process.env.CI ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB in CI, 50MB locally

  if (increase > warningThreshold) {
    console.warn(
      `Warning: Test "${testName}" used ${(increase / 1024 / 1024).toFixed(2)}MB of memory`,
    );
  }
});

afterAll(() => {
  // Final cleanup and memory report
  forceCleanupTestResources();
  MemoryTracker.reportMemoryUsage();
  MemoryTracker.clearSnapshots();
});

// Export utilities for use in tests
export { globalTestState, forceCleanupTestResources };
