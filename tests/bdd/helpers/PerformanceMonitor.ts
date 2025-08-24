/**
 * Performance Monitor for BDD Tests
 * 
 * Provides comprehensive performance monitoring capabilities for BDD tests.
 * Follows ISO/IEC 25010 performance efficiency standards.
 */
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();
  private measurements: Map<string, number[]> = new Map();
  private memoryBaseline: number;
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  
  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
    this.initializeDefaultThresholds();
  }
  
  /**
   * Start timing a specific operation
   */
  startTimer(operationName: string): void {
    this.timers.set(operationName, performance.now());
  }
  
  /**
   * End timing and record measurement
   */
  endTimer(operationName: string): number {
    const startTime = this.timers.get(operationName);
    if (!startTime) {
      throw new Error(`Timer '${operationName}' was not started`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.recordMeasurement(operationName, duration);
    this.timers.delete(operationName);
    
    return duration;
  }
  
  /**
   * Time an async operation
   */
  async timeOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(operationName);
    try {
      const result = await operation();
      this.endTimer(operationName);
      return result;
    } catch (error) {
      this.timers.delete(operationName); // Cleanup on error
      throw error;
    }
  }
  
  /**
   * Time a synchronous operation
   */
  timeSync<T>(operationName: string, operation: () => T): T {
    this.startTimer(operationName);
    try {
      const result = operation();
      this.endTimer(operationName);
      return result;
    } catch (error) {
      this.timers.delete(operationName);
      throw error;
    }
  }
  
  /**
   * Record a performance measurement
   */
  recordMeasurement(metricName: string, value: number): void {
    if (!this.measurements.has(metricName)) {
      this.measurements.set(metricName, []);
    }
    this.measurements.get(metricName)!.push(value);
  }
  
  /**
   * Get performance statistics for a metric
   */
  getStats(metricName: string): PerformanceStats | null {
    const measurements = this.measurements.get(metricName);
    if (!measurements || measurements.length === 0) {
      return null;
    }
    
    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    
    return {
      count: measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      stdDev: this.calculateStandardDeviation(measurements)
    };
  }
  
  /**
   * Check if performance meets threshold requirements
   */
  checkThreshold(metricName: string, value: number): PerformanceCheck {
    const threshold = this.thresholds.get(metricName);
    if (!threshold) {
      return { passed: true, message: 'No threshold defined' };
    }
    
    const checks: Array<{ passed: boolean; message: string }> = [];
    
    if (threshold.maxValue !== undefined) {
      const passed = value <= threshold.maxValue;
      checks.push({
        passed,
        message: passed 
          ? `✓ ${metricName}: ${value}ms ≤ ${threshold.maxValue}ms` 
          : `✗ ${metricName}: ${value}ms > ${threshold.maxValue}ms (exceeded by ${value - threshold.maxValue}ms)`
      });
    }
    
    if (threshold.minValue !== undefined) {
      const passed = value >= threshold.minValue;
      checks.push({
        passed,
        message: passed 
          ? `✓ ${metricName}: ${value}ms ≥ ${threshold.minValue}ms` 
          : `✗ ${metricName}: ${value}ms < ${threshold.minValue}ms`
      });
    }
    
    const allPassed = checks.every(check => check.passed);
    const message = checks.map(check => check.message).join(', ');
    
    return { passed: allPassed, message };
  }
  
  /**
   * Set performance threshold for a metric
   */
  setThreshold(metricName: string, threshold: PerformanceThreshold): void {
    this.thresholds.set(metricName, threshold);
  }
  
  /**
   * Assert that a metric meets its threshold
   */
  assertThreshold(metricName: string, value: number): void {
    const check = this.checkThreshold(metricName, value);
    if (!check.passed) {
      throw new Error(`Performance threshold failed: ${check.message}`);
    }
  }
  
  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    
    // Browser environment - use performance.memory if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    return 0;
  }
  
  /**
   * Get memory usage delta from baseline
   */
  getMemoryDelta(): number {
    return this.getCurrentMemoryUsage() - this.memoryBaseline;
  }
  
  /**
   * Check for memory leaks
   */
  checkMemoryLeak(maxIncreaseMB: number = 50): PerformanceCheck {
    const delta = this.getMemoryDelta();
    const passed = delta <= maxIncreaseMB;
    
    return {
      passed,
      message: passed 
        ? `✓ Memory usage within limits: +${delta.toFixed(2)}MB` 
        : `✗ Potential memory leak detected: +${delta.toFixed(2)}MB (limit: ${maxIncreaseMB}MB)`
    };
  }
  
  /**
   * Create a performance report
   */
  generateReport(): PerformanceReport {
    const metrics: Record<string, PerformanceStats> = {};
    const thresholdChecks: Record<string, PerformanceCheck> = {};
    
    for (const [metricName, measurements] of this.measurements) {
      const stats = this.getStats(metricName);
      if (stats) {
        metrics[metricName] = stats;
        
        // Check threshold against mean value
        thresholdChecks[metricName] = this.checkThreshold(metricName, stats.mean);
      }
    }
    
    const memoryCheck = this.checkMemoryLeak();
    
    return {
      metrics,
      thresholdChecks,
      memoryUsage: {
        baseline: this.memoryBaseline,
        current: this.getCurrentMemoryUsage(),
        delta: this.getMemoryDelta()
      },
      memoryCheck,
      summary: this.generateSummary(thresholdChecks, memoryCheck)
    };
  }
  
  /**
   * Reset all measurements
   */
  reset(): void {
    this.timers.clear();
    this.measurements.clear();
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }
  
  /**
   * Initialize default performance thresholds
   */
  private initializeDefaultThresholds(): void {
    // Asset management thresholds
    this.setThreshold('asset_creation', { maxValue: 200 }); // 200ms max
    this.setThreshold('asset_update', { maxValue: 150 });   // 150ms max
    this.setThreshold('asset_query', { maxValue: 100 });    // 100ms max
    
    // Query execution thresholds
    this.setThreshold('sparql_simple', { maxValue: 50 });   // 50ms max
    this.setThreshold('sparql_complex', { maxValue: 200 }); // 200ms max
    this.setThreshold('sparql_cache_hit', { maxValue: 10 }); // 10ms max
    
    // UI rendering thresholds
    this.setThreshold('layout_render', { maxValue: 300 });  // 300ms max
    this.setThreshold('property_edit', { maxValue: 100 });  // 100ms max
    this.setThreshold('modal_open', { maxValue: 200 });     // 200ms max
    
    // Batch operations
    this.setThreshold('batch_create_100', { maxValue: 5000 }); // 5s for 100 assets
    this.setThreshold('batch_update_100', { maxValue: 3000 }); // 3s for 100 updates
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquareDiff);
  }
  
  /**
   * Generate performance summary
   */
  private generateSummary(
    thresholdChecks: Record<string, PerformanceCheck>,
    memoryCheck: PerformanceCheck
  ): PerformanceSummary {
    const total = Object.keys(thresholdChecks).length + 1; // +1 for memory check
    const passed = Object.values(thresholdChecks).filter(check => check.passed).length + 
                   (memoryCheck.passed ? 1 : 0);
    
    const failures = Object.entries(thresholdChecks)
      .filter(([_, check]) => !check.passed)
      .map(([metric, check]) => `${metric}: ${check.message}`)
      .concat(memoryCheck.passed ? [] : [`Memory: ${memoryCheck.message}`]);
    
    return {
      totalChecks: total,
      passedChecks: passed,
      failedChecks: total - passed,
      overallPassed: failures.length === 0,
      failures
    };
  }
}

// Type definitions
export interface PerformanceThreshold {
  maxValue?: number;
  minValue?: number;
  description?: string;
}

export interface PerformanceStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stdDev: number;
}

export interface PerformanceCheck {
  passed: boolean;
  message: string;
}

export interface PerformanceReport {
  metrics: Record<string, PerformanceStats>;
  thresholdChecks: Record<string, PerformanceCheck>;
  memoryUsage: {
    baseline: number;
    current: number;
    delta: number;
  };
  memoryCheck: PerformanceCheck;
  summary: PerformanceSummary;
}

export interface PerformanceSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  overallPassed: boolean;
  failures: string[];
}