/**
 * Node.js specific setup for performance testing
 * Optimizes the runtime environment for consistent performance measurement
 */

// Optimize Node.js for performance testing
if (typeof process !== 'undefined') {
  // Set CPU affinity to reduce variation (Linux only)
  if (process.platform === 'linux' && process.setScheduler) {
    try {
      // Use FIFO scheduler for more predictable timing
      process.setScheduler(process.pid, process.SCHED_FIFO, { priority: 50 });
    } catch (e) {
      // Ignore if not running with appropriate permissions
    }
  }

  // Increase event loop precision
  if (process.env.NODE_ENV !== 'production') {
    // Force V8 to optimize more aggressively
    process.env.UV_USE_IO_URING = '0'; // Disable io_uring for more predictable I/O timing
  }

  // Set memory optimization flags
  if (!process.env.NODE_OPTIONS) {
    // Optimize garbage collection for performance testing
    const nodeOptions = [
      '--expose-gc', // Allow manual garbage collection
      '--optimize-for-size', // Optimize for memory usage
      '--max-old-space-size=4096', // Set memory limit
      '--gc-interval=100' // More frequent GC to reduce variation
    ].join(' ');
    
    process.env.NODE_OPTIONS = nodeOptions;
  }
}

// High-resolution timer polyfill for older environments
if (typeof performance === 'undefined') {
  global.performance = {
    now: function() {
      const hrTime = process.hrtime();
      return hrTime[0] * 1000 + hrTime[1] / 1000000;
    }
  };
}

// Timer precision enhancement
const originalSetTimeout = global.setTimeout;
global.setTimeout = function(callback, delay, ...args) {
  // Use immediate for very short delays to reduce timer overhead
  if (delay <= 1) {
    return setImmediate(callback, ...args);
  }
  return originalSetTimeout(callback, delay, ...args);
};

// Memory pressure simulation for testing under load
global.simulateMemoryPressure = function(sizeMB = 50) {
  const data = [];
  const targetSize = sizeMB * 1024 * 1024; // Convert MB to bytes
  let currentSize = 0;

  while (currentSize < targetSize) {
    const chunk = new Array(1024).fill('x').join(''); // 1KB chunk
    data.push(chunk);
    currentSize += chunk.length;
  }

  // Keep reference to prevent GC
  setTimeout(() => {
    data.length = 0; // Clear after test
  }, 100);

  return data;
};

// CPU load simulation
global.simulateCPULoad = function(durationMs = 100) {
  const start = performance.now();
  const target = start + durationMs;
  
  while (performance.now() < target) {
    // Busy wait to consume CPU cycles
    Math.random() * Math.random();
  }
};

console.log('Performance testing environment initialized');
console.log(`Node.js version: ${process.version}`);
console.log(`V8 version: ${process.versions.v8}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`Memory limit: ${process.env.NODE_OPTIONS || 'default'}`);