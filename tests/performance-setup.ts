/**
 * Performance test environment setup
 * Configures optimal conditions for reliable performance testing
 */

// Force garbage collection if available (Node.js with --expose-gc flag)
if (global.gc) {
  beforeEach(() => {
    global.gc();
  });
}

// Increase timer precision for better measurements
if (typeof process !== 'undefined' && process.hrtime) {
  // Use high-resolution time when available
  const originalNow = performance.now;
  let baseTime = Date.now();
  let hrBaseTime = process.hrtime();
  
  performance.now = function(): number {
    const hrTime = process.hrtime(hrBaseTime);
    return hrTime[0] * 1000 + hrTime[1] / 1000000;
  };
}

// Warm up JavaScript engine
beforeAll(() => {
  // Execute some operations to warm up V8 JIT compiler
  const warmupOperations = 1000;
  const warmupData: any[] = [];
  
  for (let i = 0; i < warmupOperations; i++) {
    warmupData.push({ id: i, value: `item_${i}` });
  }
  
  // Perform various operations to trigger JIT compilation
  warmupData.forEach(item => item.value.toUpperCase());
  warmupData.filter(item => item.id % 2 === 0);
  warmupData.map(item => ({ ...item, computed: item.id * 2 }));
  
  // Allow some time for optimizations
  return new Promise(resolve => setTimeout(resolve, 100));
});

// Configure Jest environment for performance testing
beforeEach(() => {
  // Reset any global state that might affect performance
  if (typeof global !== 'undefined') {
    // Clear any global caches or state
    if (global.__performanceCache) {
      global.__performanceCache.clear();
    }
  }
});

// Performance test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePerformanceWithin(maxMs: number): R;
      toHaveConsistentTiming(maxCoefficientOfVariation: number): R;
      toBeFasterThan(comparisonMs: number): R;
    }
  }
}

// Custom Jest matchers for performance testing
expect.extend({
  toHavePerformanceWithin(received: number, maxMs: number) {
    const pass = received <= maxMs;
    return {
      message: () => 
        pass 
          ? `Expected ${received}ms to be greater than ${maxMs}ms`
          : `Expected ${received}ms to be within ${maxMs}ms`,
      pass,
    };
  },

  toHaveConsistentTiming(received: number[], maxCoefficientOfVariation: number) {
    const avg = received.reduce((a, b) => a + b, 0) / received.length;
    const variance = received.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / received.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;
    
    const pass = cv <= maxCoefficientOfVariation;
    
    return {
      message: () =>
        pass
          ? `Expected coefficient of variation ${cv.toFixed(3)} to be greater than ${maxCoefficientOfVariation}`
          : `Expected coefficient of variation ${cv.toFixed(3)} to be less than or equal to ${maxCoefficientOfVariation}`,
      pass,
    };
  },

  toBeFasterThan(received: number, comparisonMs: number) {
    const pass = received < comparisonMs;
    return {
      message: () =>
        pass
          ? `Expected ${received}ms to be slower than ${comparisonMs}ms`
          : `Expected ${received}ms to be faster than ${comparisonMs}ms`,
      pass,
    };
  },
});

// Performance measurement utilities
export const measurePerformance = <T>(
  operation: () => T,
  warmupRuns: number = 5,
  measurementRuns: number = 50
): { result: T; times: number[]; stats: { avg: number; min: number; max: number; stdDev: number } } => {
  // Warmup phase
  let lastResult: T;
  for (let i = 0; i < warmupRuns; i++) {
    lastResult = operation();
  }

  // Measurement phase
  const times: number[] = [];
  for (let i = 0; i < measurementRuns; i++) {
    const start = performance.now();
    lastResult = operation();
    times.push(performance.now() - start);
  }

  // Calculate statistics
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);

  return {
    result: lastResult!,
    times,
    stats: { avg, min, max, stdDev }
  };
};

export const comparePerformance = <T1, T2>(
  operation1: () => T1,
  operation2: () => T2,
  runs: number = 50
): {
  operation1: { avg: number; times: number[] };
  operation2: { avg: number; times: number[] };
  ratio: number;
  faster: 'operation1' | 'operation2';
} => {
  const result1 = measurePerformance(operation1, 5, runs);
  const result2 = measurePerformance(operation2, 5, runs);

  const ratio = result1.stats.avg / result2.stats.avg;
  const faster = result1.stats.avg < result2.stats.avg ? 'operation1' : 'operation2';

  return {
    operation1: { avg: result1.stats.avg, times: result1.times },
    operation2: { avg: result2.stats.avg, times: result2.times },
    ratio: Math.max(ratio, 1 / ratio), // Always >= 1
    faster
  };
};