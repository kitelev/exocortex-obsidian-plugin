import { Result } from '../../../domain/core/Result';
import {
  AgentPerformanceMetrics,
  AgentQualityMetrics,
  PerformanceAnalysis,
  TrendAnalysis,
  Alert,
  AgentSummary,
  AgentState
} from '../types/AgentTypes';

export interface PerformanceSnapshot {
  agentId: string;
  timestamp: Date;
  metrics: AgentPerformanceMetrics;
  quality: AgentQualityMetrics;
  context: PerformanceContext;
}

export interface PerformanceContext {
  taskType: string;
  complexity: number;
  duration: number;
  resourcesUsed: string[];
  environmentConditions: Record<string, any>;
}

export interface PerformanceThresholds {
  responseTime: {
    target: number;
    warning: number;
    critical: number;
  };
  errorRate: {
    target: number;
    warning: number;
    critical: number;
  };
  successRate: {
    target: number;
    warning: number;
    critical: number;
  };
  resourceUsage: {
    memory: { target: number; warning: number; critical: number; };
    cpu: { target: number; warning: number; critical: number; };
  };
}

export interface MetricTrend {
  metric: string;
  values: { timestamp: Date; value: number }[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  confidence: number;
}

export class AgentPerformanceMonitor {
  private snapshots: Map<string, PerformanceSnapshot[]> = new Map();
  private thresholds: PerformanceThresholds;
  private alertHistory: Map<string, Alert[]> = new Map();

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      responseTime: {
        target: 30,
        warning: 60,
        critical: 120
      },
      errorRate: {
        target: 0.02,
        warning: 0.05,
        critical: 0.10
      },
      successRate: {
        target: 0.95,
        warning: 0.90,
        critical: 0.80
      },
      resourceUsage: {
        memory: { target: 512, warning: 1024, critical: 2048 },
        cpu: { target: 50, warning: 75, critical: 90 }
      },
      ...thresholds
    };
  }

  recordPerformance(
    agentId: string,
    metrics: AgentPerformanceMetrics,
    quality: AgentQualityMetrics,
    context: PerformanceContext
  ): Result<void> {
    try {
      const snapshot: PerformanceSnapshot = {
        agentId,
        timestamp: new Date(),
        metrics,
        quality,
        context
      };

      // Store snapshot
      if (!this.snapshots.has(agentId)) {
        this.snapshots.set(agentId, []);
      }
      
      const agentSnapshots = this.snapshots.get(agentId)!;
      agentSnapshots.push(snapshot);

      // Keep only last 1000 snapshots per agent
      if (agentSnapshots.length > 1000) {
        agentSnapshots.splice(0, agentSnapshots.length - 1000);
      }

      // Check for alerts
      const alerts = this.checkThresholds(snapshot);
      if (alerts.length > 0) {
        this.recordAlerts(agentId, alerts);
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to record performance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  analyzePerformance(
    agentId: string,
    timeWindow: number = 3600000 // 1 hour default
  ): Result<PerformanceAnalysis> {
    try {
      const snapshots = this.getRecentSnapshots(agentId, timeWindow);
      if (snapshots.length === 0) {
        return Result.fail(`No performance data available for agent ${agentId}`);
      }

      const analysis: PerformanceAnalysis = {
        bottlenecks: this.identifyBottlenecks(snapshots),
        optimizations: this.suggestOptimizations(snapshots),
        trends: this.analyzeTrends(snapshots),
        alerts: this.getActiveAlerts(agentId)
      };

      return Result.ok(analysis);
    } catch (error) {
      return Result.fail(`Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getAgentHealthScore(agentId: string): Result<number> {
    try {
      const recentSnapshots = this.getRecentSnapshots(agentId, 1800000); // 30 minutes
      if (recentSnapshots.length === 0) {
        return Result.fail(`No recent performance data for agent ${agentId}`);
      }

      const latestSnapshot = recentSnapshots[recentSnapshots.length - 1];
      const healthScore = this.calculateHealthScore(latestSnapshot);

      return Result.ok(healthScore);
    } catch (error) {
      return Result.fail(`Health score calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  generatePerformanceReport(agentId: string, period: 'hour' | 'day' | 'week'): Result<string> {
    try {
      const timeWindow = this.getTimeWindow(period);
      const snapshots = this.getRecentSnapshots(agentId, timeWindow);
      
      if (snapshots.length === 0) {
        return Result.fail(`No data available for the specified period`);
      }

      const report = this.buildPerformanceReport(agentId, snapshots, period);
      return Result.ok(report);
    } catch (error) {
      return Result.fail(`Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  predictPerformance(
    agentId: string,
    horizon: number = 3600000 // 1 hour
  ): Result<AgentPerformanceMetrics> {
    try {
      const historicalData = this.getRecentSnapshots(agentId, horizon * 24); // Use 24x horizon for prediction
      if (historicalData.length < 10) {
        return Result.fail('Insufficient data for performance prediction');
      }

      const prediction = this.generatePerformancePrediction(historicalData, horizon);
      return Result.ok(prediction);
    } catch (error) {
      return Result.fail(`Performance prediction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  compareAgents(agentIds: string[], timeWindow: number = 3600000): Result<Record<string, number>> {
    try {
      const comparison: Record<string, number> = {};

      for (const agentId of agentIds) {
        const healthScore = this.getAgentHealthScore(agentId);
        if (healthScore.isSuccess) {
          comparison[agentId] = healthScore.getValue()!;
        }
      }

      return Result.ok(comparison);
    } catch (error) {
      return Result.fail(`Agent comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getRecentSnapshots(agentId: string, timeWindow: number): PerformanceSnapshot[] {
    const allSnapshots = this.snapshots.get(agentId) || [];
    const cutoff = new Date(Date.now() - timeWindow);
    
    return allSnapshots.filter(snapshot => snapshot.timestamp >= cutoff);
  }

  private checkThresholds(snapshot: PerformanceSnapshot): Alert[] {
    const alerts: Alert[] = [];
    const { metrics, quality } = snapshot;

    // Response time alerts
    if (metrics.averageResponseTime > this.thresholds.responseTime.critical) {
      alerts.push(this.createAlert('critical', 'Response time critical', 'averageResponseTime', 
        this.thresholds.responseTime.critical, metrics.averageResponseTime, 'Investigate performance bottlenecks'));
    } else if (metrics.averageResponseTime > this.thresholds.responseTime.warning) {
      alerts.push(this.createAlert('warning', 'Response time elevated', 'averageResponseTime',
        this.thresholds.responseTime.warning, metrics.averageResponseTime, 'Monitor for degradation'));
    }

    // Error rate alerts
    if (metrics.errorRate > this.thresholds.errorRate.critical) {
      alerts.push(this.createAlert('critical', 'Error rate critical', 'errorRate',
        this.thresholds.errorRate.critical, metrics.errorRate, 'Immediate investigation required'));
    } else if (metrics.errorRate > this.thresholds.errorRate.warning) {
      alerts.push(this.createAlert('warning', 'Error rate elevated', 'errorRate',
        this.thresholds.errorRate.warning, metrics.errorRate, 'Review recent changes'));
    }

    // Success rate alerts
    if (metrics.successRate < this.thresholds.successRate.critical) {
      alerts.push(this.createAlert('critical', 'Success rate critical', 'successRate',
        this.thresholds.successRate.critical, metrics.successRate, 'Investigate failures'));
    }

    // Resource usage alerts
    if (metrics.memoryUsage > this.thresholds.resourceUsage.memory.critical) {
      alerts.push(this.createAlert('critical', 'Memory usage critical', 'memoryUsage',
        this.thresholds.resourceUsage.memory.critical, metrics.memoryUsage, 'Check for memory leaks'));
    }

    if (metrics.cpuUsage > this.thresholds.resourceUsage.cpu.critical) {
      alerts.push(this.createAlert('critical', 'CPU usage critical', 'cpuUsage',
        this.thresholds.resourceUsage.cpu.critical, metrics.cpuUsage, 'Optimize processing efficiency'));
    }

    return alerts;
  }

  private createAlert(
    level: Alert['level'],
    message: string,
    metric: string,
    threshold: number,
    current: number,
    action: string
  ): Alert {
    return {
      level,
      message,
      metric,
      threshold,
      current,
      action
    };
  }

  private recordAlerts(agentId: string, alerts: Alert[]): void {
    if (!this.alertHistory.has(agentId)) {
      this.alertHistory.set(agentId, []);
    }
    
    const agentAlerts = this.alertHistory.get(agentId)!;
    agentAlerts.push(...alerts);

    // Keep only last 100 alerts per agent
    if (agentAlerts.length > 100) {
      agentAlerts.splice(0, agentAlerts.length - 100);
    }
  }

  private getActiveAlerts(agentId: string): Alert[] {
    const alerts = this.alertHistory.get(agentId) || [];
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    // Return alerts from the last hour
    return alerts.filter(alert => {
      // Since alerts don't have timestamps in the interface, we'll return recent ones
      return true; // In real implementation, add timestamp to Alert interface
    });
  }

  private identifyBottlenecks(snapshots: PerformanceSnapshot[]): string[] {
    const bottlenecks: string[] = [];
    
    if (snapshots.length === 0) return bottlenecks;

    const avgResponseTime = this.calculateAverage(snapshots, s => s.metrics.averageResponseTime);
    const avgErrorRate = this.calculateAverage(snapshots, s => s.metrics.errorRate);
    const avgMemoryUsage = this.calculateAverage(snapshots, s => s.metrics.memoryUsage);
    const avgCpuUsage = this.calculateAverage(snapshots, s => s.metrics.cpuUsage);

    if (avgResponseTime > this.thresholds.responseTime.warning) {
      bottlenecks.push(`Response time (${avgResponseTime.toFixed(1)}s) exceeds target`);
    }

    if (avgErrorRate > this.thresholds.errorRate.warning) {
      bottlenecks.push(`Error rate (${(avgErrorRate * 100).toFixed(1)}%) above acceptable threshold`);
    }

    if (avgMemoryUsage > this.thresholds.resourceUsage.memory.warning) {
      bottlenecks.push(`Memory usage (${avgMemoryUsage.toFixed(0)}MB) high`);
    }

    if (avgCpuUsage > this.thresholds.resourceUsage.cpu.warning) {
      bottlenecks.push(`CPU usage (${avgCpuUsage.toFixed(1)}%) elevated`);
    }

    return bottlenecks;
  }

  private suggestOptimizations(snapshots: PerformanceSnapshot[]): string[] {
    const optimizations: string[] = [];
    
    if (snapshots.length === 0) return optimizations;

    const avgResponseTime = this.calculateAverage(snapshots, s => s.metrics.averageResponseTime);
    const avgRetryRate = this.calculateAverage(snapshots, s => s.metrics.retryRate);
    const avgMemoryUsage = this.calculateAverage(snapshots, s => s.metrics.memoryUsage);

    if (avgResponseTime > this.thresholds.responseTime.target) {
      optimizations.push('Implement caching to reduce response times');
      optimizations.push('Optimize query complexity and indexing');
    }

    if (avgRetryRate > 0.05) {
      optimizations.push('Improve error handling to reduce retry attempts');
      optimizations.push('Add circuit breaker pattern for external dependencies');
    }

    if (avgMemoryUsage > this.thresholds.resourceUsage.memory.target) {
      optimizations.push('Implement memory pooling for object reuse');
      optimizations.push('Review data structures for memory efficiency');
    }

    // Quality-based optimizations
    const latestQuality = snapshots[snapshots.length - 1].quality;
    if (latestQuality.maintainability.testability < 0.8) {
      optimizations.push('Increase test coverage for better maintainability');
    }

    if (latestQuality.efficiency.timeBehavior < 0.8) {
      optimizations.push('Profile and optimize algorithmic complexity');
    }

    return optimizations;
  }

  private analyzeTrends(snapshots: PerformanceSnapshot[]): TrendAnalysis[] {
    if (snapshots.length < 10) return [];

    const trends: TrendAnalysis[] = [];
    
    // Analyze response time trend
    const responseTimes = snapshots.map(s => s.metrics.averageResponseTime);
    trends.push(this.calculateTrend('averageResponseTime', responseTimes));

    // Analyze error rate trend
    const errorRates = snapshots.map(s => s.metrics.errorRate);
    trends.push(this.calculateTrend('errorRate', errorRates));

    // Analyze success rate trend
    const successRates = snapshots.map(s => s.metrics.successRate);
    trends.push(this.calculateTrend('successRate', successRates));

    return trends;
  }

  private calculateTrend(metric: string, values: number[]): TrendAnalysis {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    // Simple linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    // Predict next value
    const prediction = slope * n + intercept;

    let direction: TrendAnalysis['direction'];
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'improving' : 'degrading';
      // Note: for metrics like errorRate, positive slope means degrading
      if (metric === 'errorRate' || metric === 'averageResponseTime') {
        direction = slope > 0 ? 'degrading' : 'improving';
      }
    }

    return {
      metric,
      direction,
      rate: Math.abs(slope),
      prediction
    };
  }

  private calculateHealthScore(snapshot: PerformanceSnapshot): number {
    const { metrics, quality } = snapshot;
    
    // Performance score (0-1)
    const responseTimeScore = Math.max(0, 1 - (metrics.averageResponseTime / this.thresholds.responseTime.critical));
    const errorRateScore = Math.max(0, 1 - (metrics.errorRate / this.thresholds.errorRate.critical));
    const successRateScore = metrics.successRate;
    const memoryScore = Math.max(0, 1 - (metrics.memoryUsage / this.thresholds.resourceUsage.memory.critical));
    const cpuScore = Math.max(0, 1 - (metrics.cpuUsage / this.thresholds.resourceUsage.cpu.critical));

    const performanceScore = (responseTimeScore + errorRateScore + successRateScore + memoryScore + cpuScore) / 5;

    // Quality score (0-1)
    const qualityScore = (
      (quality.functionality.completeness + quality.functionality.correctness + quality.functionality.appropriateness) / 3 +
      (quality.reliability.maturity + quality.reliability.availability + quality.reliability.faultTolerance + quality.reliability.recoverability) / 4 +
      (quality.usability.understandability + quality.usability.learnability + quality.usability.operability) / 3 +
      (quality.efficiency.timeBehavior + quality.efficiency.resourceUtilization) / 2 +
      (quality.maintainability.analyzability + quality.maintainability.changeability + quality.maintainability.stability + quality.maintainability.testability) / 4
    ) / 5;

    // Combined health score (weighted average)
    const healthScore = (performanceScore * 0.6) + (qualityScore * 0.4);
    
    return Math.max(0, Math.min(1, healthScore));
  }

  private calculateAverage(snapshots: PerformanceSnapshot[], selector: (s: PerformanceSnapshot) => number): number {
    if (snapshots.length === 0) return 0;
    return snapshots.reduce((sum, s) => sum + selector(s), 0) / snapshots.length;
  }

  private getTimeWindow(period: 'hour' | 'day' | 'week'): number {
    switch (period) {
      case 'hour': return 3600000;
      case 'day': return 86400000;
      case 'week': return 604800000;
      default: return 3600000;
    }
  }

  private buildPerformanceReport(agentId: string, snapshots: PerformanceSnapshot[], period: string): string {
    const latest = snapshots[snapshots.length - 1];
    const healthScore = this.calculateHealthScore(latest);
    const analysis = this.analyzePerformance(agentId).getValue();

    return `# Performance Report: ${agentId}
**Period**: Last ${period}
**Generated**: ${new Date().toISOString()}

## Health Score: ${(healthScore * 100).toFixed(1)}%

## Current Metrics
- **Response Time**: ${latest.metrics.averageResponseTime.toFixed(1)}s
- **Success Rate**: ${(latest.metrics.successRate * 100).toFixed(1)}%
- **Error Rate**: ${(latest.metrics.errorRate * 100).toFixed(2)}%
- **Memory Usage**: ${latest.metrics.memoryUsage.toFixed(0)}MB
- **CPU Usage**: ${latest.metrics.cpuUsage.toFixed(1)}%

## Performance Analysis
${analysis ? `
### Bottlenecks
${analysis.bottlenecks.map(b => `- ${b}`).join('\n')}

### Optimization Suggestions
${analysis.optimizations.map(o => `- ${o}`).join('\n')}

### Trends
${analysis.trends.map(t => `- **${t.metric}**: ${t.direction} (rate: ${t.rate.toFixed(3)})`).join('\n')}

### Active Alerts
${analysis.alerts.map(a => `- **${a.level.toUpperCase()}**: ${a.message}`).join('\n')}
` : 'No analysis available'}

## Data Points
Total snapshots analyzed: ${snapshots.length}
Time range: ${snapshots[0].timestamp.toISOString()} to ${latest.timestamp.toISOString()}
`;
  }

  private generatePerformancePrediction(
    historicalData: PerformanceSnapshot[],
    horizon: number
  ): AgentPerformanceMetrics {
    // Simple prediction based on trend analysis
    const responseTimes = historicalData.map(s => s.metrics.averageResponseTime);
    const errorRates = historicalData.map(s => s.metrics.errorRate);
    const successRates = historicalData.map(s => s.metrics.successRate);
    const memoryUsage = historicalData.map(s => s.metrics.memoryUsage);
    const cpuUsage = historicalData.map(s => s.metrics.cpuUsage);

    const responseTimeTrend = this.calculateTrend('averageResponseTime', responseTimes);
    const errorRateTrend = this.calculateTrend('errorRate', errorRates);
    const successRateTrend = this.calculateTrend('successRate', successRates);
    const memoryTrend = this.calculateTrend('memoryUsage', memoryUsage);
    const cpuTrend = this.calculateTrend('cpuUsage', cpuUsage);

    const latest = historicalData[historicalData.length - 1].metrics;

    return {
      averageResponseTime: Math.max(0, responseTimeTrend.prediction),
      p95ResponseTime: Math.max(0, responseTimeTrend.prediction * 1.5),
      p99ResponseTime: Math.max(0, responseTimeTrend.prediction * 2),
      throughput: latest.throughput, // Assume stable
      errorRate: Math.max(0, Math.min(1, errorRateTrend.prediction)),
      successRate: Math.max(0, Math.min(1, successRateTrend.prediction)),
      retryRate: latest.retryRate, // Assume stable
      memoryUsage: Math.max(0, memoryTrend.prediction),
      cpuUsage: Math.max(0, Math.min(100, cpuTrend.prediction)),
      apiCalls: latest.apiCalls, // Assume stable
      tasksCompleted: latest.tasksCompleted, // Assume stable
      userSatisfaction: latest.userSatisfaction, // Assume stable
      valueDelivered: latest.valueDelivered // Assume stable
    };
  }
}