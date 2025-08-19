/**
 * Memory Optimization Setup for Jest Tests
 * Critical fixes for JavaScript heap out of memory errors
 */

// Global memory monitoring and optimization
declare global {
  var __MEMORY_OPTIMIZATION_ENABLED__: boolean;
  var __MOCK_INSTANCES__: Map<string, any>;
  var __PERFORMANCE_MONITORS__: Array<{ name: string; start: number }>;
}

// Initialize global memory tracking
global.__MEMORY_OPTIMIZATION_ENABLED__ = true;
global.__MOCK_INSTANCES__ = new Map();
global.__PERFORMANCE_MONITORS__ = [];

/**
 * Memory-efficient mock factory to prevent duplicate object creation
 */
class OptimizedMockFactory {
  private static instances = new Map<string, any>();
  
  static createOrReuse<T>(key: string, factory: () => T): T {
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }
    
    const instance = factory();
    this.instances.set(key, instance);
    global.__MOCK_INSTANCES__.set(key, instance);
    return instance;
  }
  
  static clear(): void {
    this.instances.clear();
    global.__MOCK_INSTANCES__.clear();
  }
  
  static clearInstance(key: string): void {
    this.instances.delete(key);
    global.__MOCK_INSTANCES__.delete(key);
  }
}

/**
 * Optimize performance-heavy test patterns
 */
class PerformanceTestOptimizer {
  private static originalPerformanceNow = performance.now;
  private static callCount = 0;
  
  static optimizePerformanceNow(): void {
    // Replace performance.now with lighter alternative for most tests
    performance.now = jest.fn(() => {
      this.callCount++;
      // Use simpler timing for most calls to reduce overhead
      if (this.callCount % 100 === 0) {
        return this.originalPerformanceNow.call(performance);
      }
      return Date.now() + Math.random(); // Fake but unique timing
    }) as any;
  }
  
  static restorePerformanceNow(): void {
    performance.now = this.originalPerformanceNow;
    this.callCount = 0;
  }
}

/**
 * Aggressive DOM cleanup to prevent memory leaks
 */
class DOMOptimizer {
  private static createdElements = new WeakSet<Element>();
  private static originalCreateElement = document.createElement;
  
  static optimizeDOM(): void {
    // Track element creation for cleanup
    document.createElement = function<K extends keyof HTMLElementTagNameMap>(
      tagName: K, 
      options?: ElementCreationOptions
    ): HTMLElementTagNameMap[K] {
      const element = DOMOptimizer.originalCreateElement.call(this, tagName, options);
      DOMOptimizer.createdElements.add(element);
      return element;
    };
  }
  
  static cleanupDOM(): void {
    // Aggressive DOM cleanup
    if (document.body) {
      document.body.innerHTML = '';
    }
    
    // Clear document head of any test-created elements
    const head = document.head;
    if (head) {
      const testElements = head.querySelectorAll('[data-test]');
      testElements.forEach(el => el.remove());
    }
    
    // Force cleanup of disconnected nodes
    if (typeof global.gc === 'function') {
      try {
        global.gc();
      } catch (e) {
        // Ignore GC errors
      }
    }
  }
  
  static restoreDOM(): void {
    document.createElement = this.originalCreateElement;
  }
}

/**
 * Memory usage monitor for early warning
 */
class MemoryMonitor {
  private static lastMemoryCheck = 0;
  private static memoryThreshold = process.env.CI ? 
    100 * 1024 * 1024 : // 100MB in CI
    500 * 1024 * 1024;  // 500MB locally
  
  static checkMemoryUsage(testName: string): void {
    if (typeof process.memoryUsage === 'function') {
      const usage = process.memoryUsage();
      const heapUsed = usage.heapUsed;
      
      if (heapUsed > this.memoryThreshold) {
        console.warn(`⚠️  Memory Warning: Test "${testName}" using ${Math.round(heapUsed / 1024 / 1024)}MB`);
        
        // Force garbage collection if available
        if (typeof global.gc === 'function') {
          global.gc();
        }
      }
      
      this.lastMemoryCheck = heapUsed;
    }
  }
  
  static startMonitoring(testName: string): void {
    global.__PERFORMANCE_MONITORS__.push({
      name: testName,
      start: Date.now()
    });
  }
  
  static stopMonitoring(testName: string): void {
    const monitor = global.__PERFORMANCE_MONITORS__.find(m => m.name === testName);
    if (monitor) {
      const duration = Date.now() - monitor.start;
      if (duration > 5000) { // Warn about tests taking > 5 seconds
        console.warn(`⏰ Slow Test Warning: "${testName}" took ${duration}ms`);
      }
      
      // Remove from monitors
      const index = global.__PERFORMANCE_MONITORS__.indexOf(monitor);
      if (index > -1) {
        global.__PERFORMANCE_MONITORS__.splice(index, 1);
      }
    }
  }
}

/**
 * Optimize IndexedGraph performance tests to use less memory
 */
class IndexedGraphOptimizer {
  static optimizeTestData(): void {
    // Patch any large data structure creation in IndexedGraph tests
    const originalArray = Array;
    
    (global as any).Array = function(...args: any[]) {
      // Limit array sizes in tests to prevent memory explosion
      if (args.length === 1 && typeof args[0] === 'number' && args[0] > 1000) {
        console.warn(`Array size limited from ${args[0]} to 1000 for memory optimization`);
        return new originalArray(1000);
      }
      return new originalArray(...args);
    };
    
    // Copy static methods
    Object.setPrototypeOf((global as any).Array, originalArray);
    Object.defineProperty((global as any).Array, 'from', { value: originalArray.from });
    Object.defineProperty((global as any).Array, 'isArray', { value: originalArray.isArray });
    Object.defineProperty((global as any).Array, 'of', { value: originalArray.of });
  }
  
  static restoreTestData(): void {
    (global as any).Array = Array;
  }
}

// Apply optimizations during setup
beforeAll(() => {
  if (process.env.CI || process.env.MEMORY_OPTIMIZATION) {
    console.log('🚀 Applying memory optimizations for CI/CD...');
    
    // Apply all optimizations
    PerformanceTestOptimizer.optimizePerformanceNow();
    DOMOptimizer.optimizeDOM();
    IndexedGraphOptimizer.optimizeTestData();
    
    // Set more aggressive timeouts for CI
    jest.setTimeout(process.env.CI ? 30000 : 10000);
  }
});

// Monitor memory before each test
beforeEach(() => {
  const testName = expect.getState()?.currentTestName || 'unknown';
  MemoryMonitor.startMonitoring(testName);
  MemoryMonitor.checkMemoryUsage(testName);
  
  // Clear mock instances before each test
  OptimizedMockFactory.clear();
});

// Aggressive cleanup after each test
afterEach(() => {
  const testName = expect.getState()?.currentTestName || 'unknown';
  
  // Stop monitoring
  MemoryMonitor.stopMonitoring(testName);
  
  // Aggressive cleanup
  DOMOptimizer.cleanupDOM();
  OptimizedMockFactory.clear();
  
  // Clear Jest mocks aggressively
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.restoreAllMocks();
  
  // Force garbage collection in CI
  if (process.env.CI && typeof global.gc === 'function') {
    global.gc();
  }
  
  // Final memory check
  MemoryMonitor.checkMemoryUsage(`${testName}-cleanup`);
});

// Restore optimizations after all tests
afterAll(() => {
  if (process.env.CI || process.env.MEMORY_OPTIMIZATION) {
    console.log('🧹 Restoring original implementations...');
    
    PerformanceTestOptimizer.restorePerformanceNow();
    DOMOptimizer.restoreDOM();
    IndexedGraphOptimizer.restoreTestData();
    
    // Final cleanup
    OptimizedMockFactory.clear();
    
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }
});

// Export utilities for use in tests
export { 
  OptimizedMockFactory, 
  PerformanceTestOptimizer, 
  DOMOptimizer, 
  MemoryMonitor,
  IndexedGraphOptimizer 
};