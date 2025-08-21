/**
 * EMERGENCY MEMORY OPTIMIZATION SETUP
 * Based on proven memory cascade resolution patterns
 * 
 * This setup file implements emergency memory management for CI environments
 * experiencing JavaScript heap exhaustion failures.
 */

// Emergency: Global memory monitoring
const EMERGENCY_MODE = process.env.CI_EMERGENCY_MODE === 'true';
const MEMORY_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB
const MEMORY_CRITICAL_THRESHOLD = 200 * 1024 * 1024; // 200MB

let initialMemory: number;
let testMemoryBaseline: number;

// Emergency memory tracking utilities
declare global {
  namespace globalThis {
    var emergencyMemoryTools: {
      checkHeapStatus: () => { usage: number; usedMB: number } | null;
      forceGarbageCollection: () => void;
      trackMemoryLeaks: () => () => number;
      logMemoryWarning: (test: string, usage: number) => void;
    };
  }
}

// Initialize emergency memory tools
globalThis.emergencyMemoryTools = {
  checkHeapStatus: () => {
    if ((performance as any).memory) {
      const { usedJSHeapSize, jsHeapSizeLimit } = (performance as any).memory;
      const usage = (usedJSHeapSize / jsHeapSizeLimit * 100);
      const usedMB = usedJSHeapSize / 1024 / 1024;
      
      if (EMERGENCY_MODE && usage > 80) {
        console.warn(`🚨 MEMORY WARNING: ${usage.toFixed(2)}% (${usedMB.toFixed(2)}MB)`);
      }
      
      return { usage, usedMB };
    }
    return null;
  },
  
  forceGarbageCollection: () => {
    if (global.gc) {
      global.gc();
      if (EMERGENCY_MODE) {
        console.warn('🗑️ EMERGENCY: Forced garbage collection executed');
      }
    }
  },
  
  trackMemoryLeaks: () => {
    const baseline = process.memoryUsage().heapUsed;
    return () => {
      const current = process.memoryUsage().heapUsed;
      const diff = (current - baseline) / 1024 / 1024;
      
      if (EMERGENCY_MODE && Math.abs(diff) > 10) {
        console.warn(`📊 MEMORY DELTA: ${diff.toFixed(2)}MB`);
      }
      
      return diff;
    };
  },
  
  logMemoryWarning: (testName: string, memoryUsage: number) => {
    if (EMERGENCY_MODE) {
      const usageMB = memoryUsage / 1024 / 1024;
      console.warn(`⚠️ MEMORY WARNING in ${testName}: ${usageMB.toFixed(2)}MB`);
    }
  }
};

// Emergency: Setup memory monitoring before each test
beforeEach(() => {
  testMemoryBaseline = process.memoryUsage().heapUsed;
  
  if (EMERGENCY_MODE) {
    // Clear any accumulated state
    jest.clearAllMocks();
    
    // Check memory before test
    const currentMemory = process.memoryUsage().heapUsed;
    if (currentMemory > MEMORY_CRITICAL_THRESHOLD + (initialMemory || 0)) {
      globalThis.emergencyMemoryTools.forceGarbageCollection();
    }
  }
});

// Emergency: Memory cleanup after each test
afterEach(() => {
  if (EMERGENCY_MODE) {
    const memoryAfterTest = process.memoryUsage().heapUsed;
    const memoryIncrease = memoryAfterTest - testMemoryBaseline;
    
    // Log memory warnings for tests that use excessive memory
    if (memoryIncrease > MEMORY_WARNING_THRESHOLD) {
      const testName = expect.getState().currentTestName || 'unknown test';
      globalThis.emergencyMemoryTools.logMemoryWarning(testName, memoryIncrease);
    }
    
    // Force cleanup for tests that increase memory significantly
    if (memoryIncrease > MEMORY_CRITICAL_THRESHOLD) {
      globalThis.emergencyMemoryTools.forceGarbageCollection();
    }
    
    // Clear Jest mocks to prevent accumulation
    jest.clearAllMocks();
    jest.restoreAllMocks();
  }
});

// Emergency: Global setup
beforeAll(() => {
  initialMemory = process.memoryUsage().heapUsed;
  
  if (EMERGENCY_MODE) {
    console.warn('🚨 EMERGENCY MEMORY SETUP ACTIVATED');
    console.warn(`📊 Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    
    // Set up emergency timeouts
    jest.setTimeout(60000); // 60 second timeout for emergency mode
    
    // Initial garbage collection
    globalThis.emergencyMemoryTools.forceGarbageCollection();
  }
});

// Emergency: Final cleanup
afterAll(() => {
  if (EMERGENCY_MODE) {
    const finalMemory = process.memoryUsage().heapUsed;
    const totalIncrease = finalMemory - (initialMemory || 0);
    const totalIncreaseMB = totalIncrease / 1024 / 1024;
    
    console.warn(`📊 EMERGENCY MEMORY REPORT:`);
    console.warn(`   Initial: ${((initialMemory || 0) / 1024 / 1024).toFixed(2)}MB`);
    console.warn(`   Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    console.warn(`   Total increase: ${totalIncreaseMB.toFixed(2)}MB`);
    
    if (totalIncreaseMB > 50) {
      console.warn(`⚠️ WARNING: Significant memory increase detected`);
    }
    
    // Final cleanup
    globalThis.emergencyMemoryTools.forceGarbageCollection();
  }
});

// Emergency: Unhandled rejection handler to prevent memory leaks
process.on('unhandledRejection', (reason) => {
  if (EMERGENCY_MODE) {
    console.warn('🚨 EMERGENCY: Unhandled rejection:', reason);
    globalThis.emergencyMemoryTools.forceGarbageCollection();
  }
});

export {};