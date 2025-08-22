/**
 * Query Timeout Manager with Resource Monitoring
 * Implements timeout mechanisms and resource monitoring for SPARQL queries
 *
 * Security Features:
 * - Configurable query timeouts
 * - Resource usage monitoring (memory, CPU)
 * - Query cancellation mechanisms
 * - Resource threshold enforcement
 * - Performance metrics collection
 * - Automatic timeout adjustment based on system load
 */

import { Result } from "../../domain/core/Result";

export interface TimeoutConfig {
  defaultTimeoutMs: number;
  maxTimeoutMs: number;
  complexQueryTimeoutMs: number;
  resourceCheckIntervalMs: number;
  memoryThresholdMB: number;
  cpuThresholdPercent: number;
  adaptiveTimeouts: boolean;
}

export interface QueryExecution {
  id: string;
  query: string;
  startTime: number;
  timeoutMs: number;
  complexity: "simple" | "moderate" | "complex" | "critical";
  resourceSnapshot: ResourceSnapshot;
  abortController: AbortController;
  resourceMonitor?: NodeJS.Timeout;
}

export interface ResourceSnapshot {
  memoryUsageMB: number;
  cpuUsagePercent: number;
  timestamp: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
}

export interface QueryMetrics {
  executionTimeMs: number;
  peakMemoryMB: number;
  avgCpuPercent: number;
  resourceViolations: string[];
  timeoutReason?: "time" | "memory" | "cpu" | "manual";
}

export interface SystemLoad {
  activeQueries: number;
  totalMemoryMB: number;
  availableMemoryMB: number;
  cpuLoadPercent: number;
  timestamp: number;
}

export class QueryTimeoutManager {
  private readonly activeExecutions = new Map<string, QueryExecution>();
  private readonly executionHistory: QueryMetrics[] = [];
  private readonly maxHistorySize = 1000;

  private readonly defaultConfig: TimeoutConfig = {
    defaultTimeoutMs: 30000, // 30 seconds
    maxTimeoutMs: 300000, // 5 minutes
    complexQueryTimeoutMs: 60000, // 1 minute
    resourceCheckIntervalMs: 1000, // 1 second
    memoryThresholdMB: 100, // 100 MB
    cpuThresholdPercent: 80, // 80% CPU
    adaptiveTimeouts: true,
  };

  private mergedConfig: TimeoutConfig;

  constructor(config: Partial<TimeoutConfig> = {}) {
    this.mergedConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Start query execution with timeout and resource monitoring
   */
  startExecution(
    queryId: string,
    query: string,
    complexity: QueryExecution["complexity"] = "simple",
    customTimeoutMs?: number,
  ): Result<QueryExecution> {
    try {
      if (this.activeExecutions.has(queryId)) {
        return Result.fail(`Query execution with ID ${queryId} already active`);
      }

      const timeoutMs = this.calculateTimeout(complexity, customTimeoutMs);
      const abortController = new AbortController();
      const resourceSnapshot = this.captureResourceSnapshot();

      const execution: QueryExecution = {
        id: queryId,
        query,
        startTime: Date.now(),
        timeoutMs,
        complexity,
        resourceSnapshot,
        abortController,
      };

      // Set main timeout
      const timeoutHandle = setTimeout(() => {
        this.cancelExecution(queryId, "time");
      }, timeoutMs);

      // Set up resource monitoring
      if (this.mergedConfig.adaptiveTimeouts) {
        execution.resourceMonitor = setInterval(() => {
          this.monitorExecution(queryId);
        }, this.mergedConfig.resourceCheckIntervalMs);
      }

      this.activeExecutions.set(queryId, execution);

      // Clean up on abort
      abortController.signal.addEventListener("abort", () => {
        clearTimeout(timeoutHandle);
        if (execution.resourceMonitor) {
          clearInterval(execution.resourceMonitor);
        }
      });

      return Result.ok(execution);
    } catch (error) {
      return Result.fail(`Failed to start query execution: ${error.message}`);
    }
  }

  /**
   * Complete query execution and collect metrics
   */
  completeExecution(queryId: string): Result<QueryMetrics> {
    const execution = this.activeExecutions.get(queryId);
    if (!execution) {
      return Result.fail(`No active execution found for query ID: ${queryId}`);
    }

    const endTime = Date.now();
    const executionTimeMs = endTime - execution.startTime;
    const finalSnapshot = this.captureResourceSnapshot();

    // Calculate metrics
    const metrics: QueryMetrics = {
      executionTimeMs,
      peakMemoryMB: Math.max(
        execution.resourceSnapshot.memoryUsageMB,
        finalSnapshot.memoryUsageMB,
      ),
      avgCpuPercent:
        (execution.resourceSnapshot.cpuUsagePercent +
          finalSnapshot.cpuUsagePercent) /
        2,
      resourceViolations: this.checkResourceViolations(
        execution,
        finalSnapshot,
      ),
    };

    // Clean up
    execution.abortController.abort();
    this.activeExecutions.delete(queryId);

    // Store metrics
    this.addToHistory(metrics);

    return Result.ok(metrics);
  }

  /**
   * Cancel query execution
   */
  cancelExecution(
    queryId: string,
    reason: QueryMetrics["timeoutReason"] = "manual",
  ): Result<void> {
    const execution = this.activeExecutions.get(queryId);
    if (!execution) {
      return Result.fail(`No active execution found for query ID: ${queryId}`);
    }

    // Record cancellation metrics
    const metrics: QueryMetrics = {
      executionTimeMs: Date.now() - execution.startTime,
      peakMemoryMB: execution.resourceSnapshot.memoryUsageMB,
      avgCpuPercent: execution.resourceSnapshot.cpuUsagePercent,
      resourceViolations: [],
      timeoutReason: reason,
    };

    this.addToHistory(metrics);

    // Cancel execution
    execution.abortController.abort();
    this.activeExecutions.delete(queryId);

    return Result.ok();
  }

  /**
   * Get execution status
   */
  getExecutionStatus(queryId: string): Result<{
    isActive: boolean;
    execution?: QueryExecution;
    elapsedMs?: number;
    remainingMs?: number;
  }> {
    const execution = this.activeExecutions.get(queryId);

    if (!execution) {
      return Result.ok({ isActive: false });
    }

    const now = Date.now();
    const elapsedMs = now - execution.startTime;
    const remainingMs = Math.max(0, execution.timeoutMs - elapsedMs);

    return Result.ok({
      isActive: true,
      execution,
      elapsedMs,
      remainingMs,
    });
  }

  /**
   * Monitor active execution for resource violations
   */
  private monitorExecution(queryId: string): void {
    const execution = this.activeExecutions.get(queryId);
    if (!execution) return;

    const currentSnapshot = this.captureResourceSnapshot();
    const violations = this.checkResourceViolations(execution, currentSnapshot);

    if (violations.length > 0) {
      console.warn(
        `Resource violations detected for query ${queryId}:`,
        violations,
      );

      // Cancel if critical violations
      const criticalViolations = violations.filter(
        (v) =>
          (v.includes("memory") &&
            currentSnapshot.memoryUsageMB >
              this.mergedConfig.memoryThresholdMB * 1.5) ||
          (v.includes("CPU") &&
            currentSnapshot.cpuUsagePercent >
              this.mergedConfig.cpuThresholdPercent * 1.2),
      );

      if (criticalViolations.length > 0) {
        this.cancelExecution(
          queryId,
          violations.some((v) => v.includes("memory")) ? "memory" : "cpu",
        );
      }
    }
  }

  /**
   * Calculate appropriate timeout based on complexity and system load
   */
  private calculateTimeout(
    complexity: QueryExecution["complexity"],
    customTimeoutMs?: number,
  ): number {
    if (customTimeoutMs) {
      return Math.min(customTimeoutMs, this.mergedConfig.maxTimeoutMs);
    }

    let baseTimeout: number;
    switch (complexity) {
      case "simple":
        baseTimeout = this.mergedConfig.defaultTimeoutMs * 0.5;
        break;
      case "moderate":
        baseTimeout = this.mergedConfig.defaultTimeoutMs;
        break;
      case "complex":
        baseTimeout = this.mergedConfig.complexQueryTimeoutMs;
        break;
      case "critical":
        baseTimeout = this.mergedConfig.maxTimeoutMs;
        break;
      default:
        baseTimeout = this.mergedConfig.defaultTimeoutMs;
    }

    // Adjust based on system load if adaptive timeouts enabled
    if (this.mergedConfig.adaptiveTimeouts) {
      const systemLoad = this.getSystemLoad();
      const loadFactor = this.calculateLoadFactor(systemLoad);
      baseTimeout = Math.floor(baseTimeout * loadFactor);
    }

    return Math.min(baseTimeout, this.mergedConfig.maxTimeoutMs);
  }

  /**
   * Capture current resource snapshot
   */
  private captureResourceSnapshot(): ResourceSnapshot {
    const memUsage = process.memoryUsage();

    return {
      memoryUsageMB: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
      heapUsedMB: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      externalMB: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
      cpuUsagePercent: this.getCPUUsage(),
      timestamp: Date.now(),
    };
  }

  /**
   * Get current CPU usage (simplified implementation)
   */
  private getCPUUsage(): number {
    // In a real implementation, you would use a proper CPU monitoring library
    // This is a simplified version that estimates based on process usage
    const usage = process.cpuUsage();
    const totalUsage = usage.user + usage.system;

    // Convert to percentage (this is a rough estimate)
    return Math.min(100, (totalUsage / 1000000) % 100);
  }

  /**
   * Check for resource violations
   */
  private checkResourceViolations(
    execution: QueryExecution,
    currentSnapshot: ResourceSnapshot,
  ): string[] {
    const violations: string[] = [];

    // Memory violations
    if (currentSnapshot.memoryUsageMB > this.mergedConfig.memoryThresholdMB) {
      violations.push(
        `Memory usage (${currentSnapshot.memoryUsageMB}MB) exceeds threshold (${this.mergedConfig.memoryThresholdMB}MB)`,
      );
    }

    // CPU violations
    if (
      currentSnapshot.cpuUsagePercent > this.mergedConfig.cpuThresholdPercent
    ) {
      violations.push(
        `CPU usage (${currentSnapshot.cpuUsagePercent}%) exceeds threshold (${this.mergedConfig.cpuThresholdPercent}%)`,
      );
    }

    // Memory growth violations
    const memoryGrowth =
      currentSnapshot.memoryUsageMB - execution.resourceSnapshot.memoryUsageMB;
    if (memoryGrowth > this.mergedConfig.memoryThresholdMB * 0.5) {
      violations.push(
        `Excessive memory growth (${memoryGrowth}MB) during query execution`,
      );
    }

    return violations;
  }

  /**
   * Get current system load
   */
  private getSystemLoad(): SystemLoad {
    const memUsage = process.memoryUsage();

    return {
      activeQueries: this.activeExecutions.size,
      totalMemoryMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      availableMemoryMB: Math.round(
        (memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024,
      ),
      cpuLoadPercent: this.getCPUUsage(),
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate load factor for timeout adjustment
   */
  private calculateLoadFactor(systemLoad: SystemLoad): number {
    let factor = 1.0;

    // Increase timeout if system is loaded
    if (systemLoad.activeQueries > 5) {
      factor += 0.2 * (systemLoad.activeQueries - 5);
    }

    if (systemLoad.cpuLoadPercent > 70) {
      factor += 0.3;
    }

    if (systemLoad.availableMemoryMB < 50) {
      factor += 0.5;
    }

    return Math.min(factor, 3.0); // Cap at 3x original timeout
  }

  /**
   * Add metrics to execution history
   */
  private addToHistory(metrics: QueryMetrics): void {
    this.executionHistory.push(metrics);

    // Maintain maximum history size
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStatistics(): {
    activeExecutions: number;
    totalExecutions: number;
    averageExecutionTimeMs: number;
    timeoutRate: number;
    averageMemoryUsageMB: number;
    resourceViolationRate: number;
  } {
    const totalExecutions = this.executionHistory.length;

    if (totalExecutions === 0) {
      return {
        activeExecutions: this.activeExecutions.size,
        totalExecutions: 0,
        averageExecutionTimeMs: 0,
        timeoutRate: 0,
        averageMemoryUsageMB: 0,
        resourceViolationRate: 0,
      };
    }

    const timeouts = this.executionHistory.filter(
      (m) => m.timeoutReason,
    ).length;
    const resourceViolations = this.executionHistory.filter(
      (m) => m.resourceViolations.length > 0,
    ).length;

    const avgExecutionTime =
      this.executionHistory.reduce((sum, m) => sum + m.executionTimeMs, 0) /
      totalExecutions;
    const avgMemoryUsage =
      this.executionHistory.reduce((sum, m) => sum + m.peakMemoryMB, 0) /
      totalExecutions;

    return {
      activeExecutions: this.activeExecutions.size,
      totalExecutions,
      averageExecutionTimeMs: Math.round(avgExecutionTime),
      timeoutRate: Math.round((timeouts / totalExecutions) * 100) / 100,
      averageMemoryUsageMB: Math.round(avgMemoryUsage * 100) / 100,
      resourceViolationRate:
        Math.round((resourceViolations / totalExecutions) * 100) / 100,
    };
  }

  /**
   * Cancel all active executions (emergency stop)
   */
  cancelAllExecutions(): Result<number> {
    const count = this.activeExecutions.size;

    for (const queryId of this.activeExecutions.keys()) {
      this.cancelExecution(queryId, "manual");
    }

    return Result.ok(count);
  }

  /**
   * Update timeout configuration
   */
  updateConfig(newConfig: Partial<TimeoutConfig>): void {
    this.mergedConfig = { ...this.mergedConfig, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TimeoutConfig {
    return { ...this.mergedConfig };
  }

  /**
   * Create AbortSignal for query execution
   */
  createAbortSignal(queryId: string): AbortSignal | null {
    const execution = this.activeExecutions.get(queryId);
    return execution?.abortController.signal || null;
  }
}
