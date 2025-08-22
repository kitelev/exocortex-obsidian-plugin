/**
 * Performance profiling utilities for IndexedGraph operations
 * Provides detailed performance analysis and monitoring
 */

export interface PerformanceSample {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  standardDeviation: number;
  coefficientOfVariation: number;
}

export interface PerformanceReport {
  timestamp: string;
  duration: number;
  totalSamples: number;
  operations: PerformanceMetrics[];
  hotspots: string[];
  recommendations: string[];
}

/**
 * High-precision performance profiler for graph operations
 */
export class GraphPerformanceProfiler {
  private samples: PerformanceSample[] = [];
  private isRecording = false;
  private startTime = 0;

  /**
   * Start recording performance samples
   */
  startRecording(): void {
    this.isRecording = true;
    this.startTime = performance.now();
    this.samples = [];
  }

  /**
   * Stop recording and generate report
   */
  stopRecording(): PerformanceReport {
    this.isRecording = false;
    const endTime = performance.now();

    return {
      timestamp: new Date().toISOString(),
      duration: endTime - this.startTime,
      totalSamples: this.samples.length,
      operations: this.calculateMetrics(),
      hotspots: this.identifyHotspots(),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Profile a function execution
   */
  profile<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    const start = performance.now();

    try {
      const result = fn();

      if (this.isRecording) {
        this.recordSample({
          operation,
          duration: performance.now() - start,
          timestamp: start,
          metadata,
        });
      }

      return result;
    } catch (error) {
      if (this.isRecording) {
        this.recordSample({
          operation: `${operation}_ERROR`,
          duration: performance.now() - start,
          timestamp: start,
          metadata: { ...metadata, error: error.message },
        });
      }
      throw error;
    }
  }

  /**
   * Profile an async function execution
   */
  async profileAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();

      if (this.isRecording) {
        this.recordSample({
          operation,
          duration: performance.now() - start,
          timestamp: start,
          metadata,
        });
      }

      return result;
    } catch (error) {
      if (this.isRecording) {
        this.recordSample({
          operation: `${operation}_ERROR`,
          duration: performance.now() - start,
          timestamp: start,
          metadata: { ...metadata, error: error.message },
        });
      }
      throw error;
    }
  }

  /**
   * Record a manual performance sample
   */
  recordSample(sample: PerformanceSample): void {
    if (this.isRecording) {
      this.samples.push(sample);
    }
  }

  /**
   * Calculate statistical metrics for all operations
   */
  private calculateMetrics(): PerformanceMetrics[] {
    const operationGroups = new Map<string, number[]>();

    // Group samples by operation
    for (const sample of this.samples) {
      if (!operationGroups.has(sample.operation)) {
        operationGroups.set(sample.operation, []);
      }
      operationGroups.get(sample.operation)!.push(sample.duration);
    }

    const metrics: PerformanceMetrics[] = [];

    for (const [operation, durations] of operationGroups) {
      durations.sort((a, b) => a - b);

      const count = durations.length;
      const totalTime = durations.reduce((sum, d) => sum + d, 0);
      const avgTime = totalTime / count;
      const minTime = durations[0];
      const maxTime = durations[count - 1];

      // Percentiles
      const p50 = durations[Math.floor(count * 0.5)];
      const p95 = durations[Math.floor(count * 0.95)];
      const p99 = durations[Math.floor(count * 0.99)];

      // Standard deviation
      const variance =
        durations.reduce((sum, d) => sum + Math.pow(d - avgTime, 2), 0) / count;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = standardDeviation / avgTime;

      metrics.push({
        operation,
        count,
        totalTime,
        avgTime,
        minTime,
        maxTime,
        p50,
        p95,
        p99,
        standardDeviation,
        coefficientOfVariation,
      });
    }

    return metrics.sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Identify performance hotspots
   */
  private identifyHotspots(): string[] {
    const metrics = this.calculateMetrics();
    const hotspots: string[] = [];

    // Operations taking more than 80% of total time
    const totalTime = metrics.reduce((sum, m) => sum + m.totalTime, 0);
    const threshold = totalTime * 0.1; // 10% threshold

    for (const metric of metrics) {
      if (metric.totalTime > threshold || metric.avgTime > 5.0) {
        hotspots.push(
          `${metric.operation} (${metric.totalTime.toFixed(2)}ms total, ${metric.avgTime.toFixed(2)}ms avg)`,
        );
      }
    }

    return hotspots;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const metrics = this.calculateMetrics();
    const recommendations: string[] = [];

    for (const metric of metrics) {
      // High variation indicates inconsistent performance
      if (metric.coefficientOfVariation > 1.0) {
        recommendations.push(
          `${metric.operation}: High performance variation (CV: ${metric.coefficientOfVariation.toFixed(2)}). Consider caching or optimization.`,
        );
      }

      // Slow operations
      if (metric.avgTime > 5.0) {
        recommendations.push(
          `${metric.operation}: Slow average performance (${metric.avgTime.toFixed(2)}ms). Consider algorithmic optimization.`,
        );
      }

      // Operations with slow outliers
      if (metric.p99 > metric.p50 * 5) {
        recommendations.push(
          `${metric.operation}: Slow outliers detected (P99: ${metric.p99.toFixed(2)}ms vs P50: ${metric.p50.toFixed(2)}ms). Investigate worst-case scenarios.`,
        );
      }
    }

    return recommendations;
  }

  /**
   * Export samples for external analysis
   */
  exportSamples(): PerformanceSample[] {
    return [...this.samples];
  }

  /**
   * Clear all recorded samples
   */
  clear(): void {
    this.samples = [];
  }

  /**
   * Get current sample count
   */
  getSampleCount(): number {
    return this.samples.length;
  }
}

/**
 * Global profiler instance for easy access
 */
export const globalProfiler = new GraphPerformanceProfiler();

/**
 * Decorator for automatic method profiling
 */
export function profileMethod(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const operationName =
      operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return globalProfiler.profile(operationName, () =>
        originalMethod.apply(this, args),
      );
    };

    return descriptor;
  };
}

/**
 * Decorator for automatic async method profiling
 */
export function profileAsyncMethod(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const operationName =
      operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return globalProfiler.profileAsync(operationName, () =>
        originalMethod.apply(this, args),
      );
    };

    return descriptor;
  };
}
