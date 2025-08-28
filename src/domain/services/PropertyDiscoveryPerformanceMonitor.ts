/**
 * Performance monitoring service for property discovery operations
 * Tracks metrics, detects performance issues, and provides optimization insights
 */

export interface PropertyDiscoveryMetrics {
  operationId: string;
  className: string;
  startTime: number;
  endTime: number;
  duration: number;
  propertiesFound: number;
  vaultFilesScanned: number;
  cacheHit: boolean;
  memoryUsage?: {
    before: number;
    after: number;
    delta: number;
  };
  errors?: string[];
}

export interface PerformanceThresholds {
  maxDuration: number; // Maximum acceptable duration in ms
  maxMemoryIncrease: number; // Maximum memory increase in MB
  maxVaultScanSize: number; // Maximum vault files to scan efficiently
  cacheHitRateTarget: number; // Target cache hit rate percentage
}

export class PropertyDiscoveryPerformanceMonitor {
  private metrics: PropertyDiscoveryMetrics[] = [];
  private readonly maxMetricsHistory = 100;

  private readonly defaultThresholds: PerformanceThresholds = {
    maxDuration: 200, // 200ms for property loading
    maxMemoryIncrease: 25, // 25MB memory increase
    maxVaultScanSize: 1000, // 1000 files max for efficient scanning
    cacheHitRateTarget: 80, // 80% cache hit rate target
  };

  constructor(private thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...this.defaultThresholds, ...thresholds };
  }

  /**
   * Start monitoring a property discovery operation
   */
  startOperation(className: string, vaultFilesCount: number): string {
    const operationId = this.generateOperationId();
    const startTime = Date.now();

    // Record initial memory usage if available
    let memoryBefore = 0;
    if (typeof performance !== "undefined" && (performance as any).memory) {
      memoryBefore = (performance as any).memory.usedJSHeapSize;
    }

    // Store initial metrics
    const initialMetrics: Partial<PropertyDiscoveryMetrics> = {
      operationId,
      className,
      startTime,
      vaultFilesScanned: vaultFilesCount,
      memoryUsage: {
        before: memoryBefore,
        after: 0,
        delta: 0,
      },
    };

    // Store in a temporary map for completion
    (this as any)._activeOperations =
      (this as any)._activeOperations || new Map();
    (this as any)._activeOperations.set(operationId, initialMetrics);

    return operationId;
  }

  /**
   * Complete monitoring and record final metrics
   */
  completeOperation(
    operationId: string,
    propertiesFound: number,
    cacheHit: boolean,
    errors: string[] = [],
  ): PropertyDiscoveryMetrics {
    const activeOperations = (this as any)._activeOperations || new Map();
    const initialMetrics = activeOperations.get(operationId);

    if (!initialMetrics) {
      console.warn(`No active operation found for ID: ${operationId}`);
      return this.createFallbackMetrics(
        operationId,
        propertiesFound,
        cacheHit,
        errors,
      );
    }

    const endTime = Date.now();
    const duration = endTime - initialMetrics.startTime;

    // Record final memory usage
    let memoryAfter = 0;
    if (typeof performance !== "undefined" && (performance as any).memory) {
      memoryAfter = (performance as any).memory.usedJSHeapSize;
    }

    const finalMetrics: PropertyDiscoveryMetrics = {
      ...initialMetrics,
      endTime,
      duration,
      propertiesFound,
      cacheHit,
      errors,
      memoryUsage: {
        before: initialMetrics.memoryUsage?.before || 0,
        after: memoryAfter,
        delta:
          (memoryAfter - (initialMetrics.memoryUsage?.before || 0)) /
          (1024 * 1024), // Convert to MB
      },
    } as PropertyDiscoveryMetrics;

    // Clean up active operation
    activeOperations.delete(operationId);

    // Store metrics and check performance
    this.recordMetrics(finalMetrics);
    this.checkPerformanceThresholds(finalMetrics);

    return finalMetrics;
  }

  /**
   * Record metrics and maintain history
   */
  private recordMetrics(metrics: PropertyDiscoveryMetrics): void {
    this.metrics.push(metrics);

    // Maintain max history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Check if operation meets performance thresholds
   */
  private checkPerformanceThresholds(metrics: PropertyDiscoveryMetrics): void {
    const warnings: string[] = [];

    // Check duration threshold
    if (metrics.duration > this.thresholds.maxDuration!) {
      warnings.push(
        `Property loading took ${metrics.duration}ms, exceeding ${this.thresholds.maxDuration}ms threshold`,
      );
    }

    // Check memory threshold
    if (
      metrics.memoryUsage &&
      metrics.memoryUsage.delta > this.thresholds.maxMemoryIncrease!
    ) {
      warnings.push(
        `Memory usage increased by ${metrics.memoryUsage.delta.toFixed(2)}MB, exceeding ${this.thresholds.maxMemoryIncrease}MB threshold`,
      );
    }

    // Check vault scan size
    if (metrics.vaultFilesScanned > this.thresholds.maxVaultScanSize!) {
      warnings.push(
        `Scanned ${metrics.vaultFilesScanned} vault files, exceeding ${this.thresholds.maxVaultScanSize} efficient threshold`,
      );
    }

    // Log warnings
    warnings.forEach((warning) =>
      console.warn(`[PropertyDiscoveryPerformance] ${warning}`),
    );

    // Log performance info for successful operations
    console.log(
      `[PropertyDiscoveryPerformance] Operation ${metrics.operationId} completed in ${metrics.duration}ms, ` +
        `found ${metrics.propertiesFound} properties, cache hit: ${metrics.cacheHit}`,
    );
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalOperations: number;
    averageDuration: number;
    averagePropertiesFound: number;
    cacheHitRate: number;
    performanceViolations: number;
    recentOperations: PropertyDiscoveryMetrics[];
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        averagePropertiesFound: 0,
        cacheHitRate: 0,
        performanceViolations: 0,
        recentOperations: [],
      };
    }

    const totalOperations = this.metrics.length;
    const averageDuration =
      this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const averagePropertiesFound =
      this.metrics.reduce((sum, m) => sum + m.propertiesFound, 0) /
      totalOperations;
    const cacheHits = this.metrics.filter((m) => m.cacheHit).length;
    const cacheHitRate = (cacheHits / totalOperations) * 100;

    const performanceViolations = this.metrics.filter(
      (m) =>
        m.duration > this.thresholds.maxDuration! ||
        (m.memoryUsage &&
          m.memoryUsage.delta > this.thresholds.maxMemoryIncrease!) ||
        m.vaultFilesScanned > this.thresholds.maxVaultScanSize!,
    ).length;

    return {
      totalOperations,
      averageDuration: Math.round(averageDuration),
      averagePropertiesFound: Math.round(averagePropertiesFound),
      cacheHitRate: Math.round(cacheHitRate),
      performanceViolations,
      recentOperations: this.metrics.slice(-10), // Last 10 operations
    };
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const stats = this.getPerformanceStats();
    const recommendations: string[] = [];

    if (stats.cacheHitRate < this.thresholds.cacheHitRateTarget!) {
      recommendations.push(
        `Cache hit rate is ${stats.cacheHitRate}%, consider improving caching strategy (target: ${this.thresholds.cacheHitRateTarget}%)`,
      );
    }

    if (stats.averageDuration > this.thresholds.maxDuration!) {
      recommendations.push(
        `Average operation duration is ${stats.averageDuration}ms, consider optimization (target: <${this.thresholds.maxDuration}ms)`,
      );
    }

    if (stats.performanceViolations > stats.totalOperations * 0.1) {
      recommendations.push(
        `${stats.performanceViolations} performance violations detected, consider vault optimization or caching improvements`,
      );
    }

    const highVaultScanOps = this.metrics.filter(
      (m) => m.vaultFilesScanned > this.thresholds.maxVaultScanSize!,
    ).length;
    if (highVaultScanOps > 0) {
      recommendations.push(
        `${highVaultScanOps} operations scanned large vault sizes, consider implementing property indexing`,
      );
    }

    return recommendations;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): PropertyDiscoveryMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `prop-discovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create fallback metrics when operation tracking fails
   */
  private createFallbackMetrics(
    operationId: string,
    propertiesFound: number,
    cacheHit: boolean,
    errors: string[],
  ): PropertyDiscoveryMetrics {
    const now = Date.now();
    return {
      operationId,
      className: "unknown",
      startTime: now,
      endTime: now,
      duration: 0,
      propertiesFound,
      vaultFilesScanned: 0,
      cacheHit,
      errors,
    };
  }
}

// Singleton instance for global performance monitoring
export const globalPropertyPerformanceMonitor =
  new PropertyDiscoveryPerformanceMonitor();
