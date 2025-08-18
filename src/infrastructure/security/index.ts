/**
 * SPARQL Security Framework - Main Export Module
 * 
 * This module provides a unified interface to all security components
 * for the Exocortex plugin's SPARQL query system.
 * 
 * Security Components:
 * - QueryComplexityAnalyzer: DoS prevention through complexity analysis
 * - QueryRateLimiter: Rate limiting with sliding window algorithm
 * - EnhancedSPARQLValidator: Advanced validation and injection prevention
 * - QueryTimeoutManager: Timeout management with resource monitoring
 * - SecurityMonitor: Real-time monitoring and incident logging
 */

// Core Security Components
import { QueryComplexityAnalyzer } from './QueryComplexityAnalyzer';
import { QueryRateLimiter } from './QueryRateLimiter';
import { EnhancedSPARQLValidator } from './EnhancedSPARQLValidator';
import { QueryTimeoutManager } from './QueryTimeoutManager';
import { SecurityMonitor, SecuritySeverity } from './SecurityMonitor';

export { QueryComplexityAnalyzer } from './QueryComplexityAnalyzer';
export type {
    ComplexityMetrics,
    ComplexityThresholds,
    QueryAnalysisResult
} from './QueryComplexityAnalyzer';

export { QueryRateLimiter } from './QueryRateLimiter';
export type {
    RateLimitConfig,
    RateLimitResult,
    UserMetrics
} from './QueryRateLimiter';

export { EnhancedSPARQLValidator } from './EnhancedSPARQLValidator';
export type {
    ValidationRule,
    EnhancedValidationResult,
    ThreatDetection
} from './EnhancedSPARQLValidator';

export { QueryTimeoutManager } from './QueryTimeoutManager';
export type {
    TimeoutConfig,
    QueryExecution,
    QueryMetrics,
    ResourceSnapshot
} from './QueryTimeoutManager';

export { SecurityMonitor } from './SecurityMonitor';
export type {
    SecurityEvent,
    SecurityEventType,
    SecuritySeverity,
    SecurityMetrics,
    SecurityAlert,
    MonitorConfig
} from './SecurityMonitor';

/**
 * Integrated Security Manager
 * 
 * Provides a single interface that coordinates all security components
 * for comprehensive SPARQL query protection.
 */
export class SPARQLSecurityManager {
    private complexityAnalyzer: QueryComplexityAnalyzer;
    private rateLimiter: QueryRateLimiter;
    private validator: EnhancedSPARQLValidator;
    private timeoutManager: QueryTimeoutManager;
    private monitor: SecurityMonitor;

    constructor(config: {
        complexity?: any;
        rateLimiting?: any;
        validation?: any;
        timeout?: any;
        monitoring?: any;
    } = {}) {
        this.complexityAnalyzer = new QueryComplexityAnalyzer(config.complexity);
        this.rateLimiter = new QueryRateLimiter(config.rateLimiting);
        this.validator = new EnhancedSPARQLValidator();
        this.timeoutManager = new QueryTimeoutManager(config.timeout);
        this.monitor = new SecurityMonitor(config.monitoring);
    }

    /**
     * Comprehensive security check for SPARQL queries
     * 
     * @param query - The SPARQL query to analyze
     * @param userId - User identifier
     * @param sessionId - Session identifier
     * @returns Security validation result
     */
    async validateQuery(
        query: string,
        userId: string,
        sessionId?: string
    ): Promise<{
        allowed: boolean;
        securityScore: number;
        violations: string[];
        recommendations: string[];
        metrics: any;
    }> {
        try {
            // 1. Validate query structure and detect threats
            const validationResult = this.validator.enhancedValidate(query);
            if (!validationResult.isSuccess) {
                this.monitor.logQueryBlocked(query, 'validation_failed', {}, userId, sessionId);
                return {
                    allowed: false,
                    securityScore: 0,
                    violations: [validationResult.getError()],
                    recommendations: ['Query failed basic validation'],
                    metrics: {}
                };
            }

            const validation = validationResult.getValue();

            // 2. Analyze query complexity
            const complexityResult = this.complexityAnalyzer.analyzeQuery(query);
            if (!complexityResult.isSuccess) {
                this.monitor.logQueryBlocked(query, 'complexity_analysis_failed', {}, userId, sessionId);
                return {
                    allowed: false,
                    securityScore: 0,
                    violations: [complexityResult.getError()],
                    recommendations: ['Query complexity analysis failed'],
                    metrics: {}
                };
            }

            const complexity = complexityResult.getValue();

            // 3. Check rate limits
            const isComplex = complexity.metrics.riskLevel === 'high' || complexity.metrics.riskLevel === 'critical';
            const rateLimitResult = this.rateLimiter.checkRateLimit(
                userId,
                isComplex,
                complexity.metrics.estimatedCost
            );

            if (!rateLimitResult.isSuccess) {
                this.monitor.logRateLimitExceeded(userId, 'query_check', 0, 0, sessionId);
                return {
                    allowed: false,
                    securityScore: validation.securityScore,
                    violations: [rateLimitResult.getError()],
                    recommendations: ['Rate limit service unavailable'],
                    metrics: complexity.metrics
                };
            }

            const rateLimit = rateLimitResult.getValue();

            // Compile all violations
            const allViolations: string[] = [];
            
            if (!validation.allowed) {
                allViolations.push(...validation.detectedThreats.map(t => t.description));
            }
            
            if (!complexity.allowed) {
                allViolations.push(...complexity.violations);
            }
            
            if (!rateLimit.allowed) {
                allViolations.push(`Rate limit exceeded. Retry after ${rateLimit.retryAfterMs}ms`);
            }

            // Determine final decision
            const finallyAllowed = allViolations.length === 0;

            // Log security events
            if (!finallyAllowed) {
                const primaryViolation = validation.detectedThreats.length > 0 
                    ? validation.detectedThreats[0].type 
                    : 'policy_violation';
                
                this.monitor.logQueryBlocked(
                    query,
                    primaryViolation,
                    {
                        threats: validation.detectedThreats,
                        complexityViolations: complexity.violations,
                        rateLimitViolation: !rateLimit.allowed
                    },
                    userId,
                    sessionId
                );
            }

            // Generate comprehensive recommendations
            const recommendations = [
                ...this.validator.generateSecurityRecommendations(validation),
                ...complexity.recommendations
            ];

            if (!rateLimit.allowed) {
                recommendations.push(`Wait ${Math.round(rateLimit.retryAfterMs! / 1000)} seconds before retry`);
            }

            return {
                allowed: finallyAllowed,
                securityScore: Math.min(validation.securityScore, complexity.allowed ? 100 : 50),
                violations: allViolations,
                recommendations,
                metrics: {
                    validation: validation,
                    complexity: complexity.metrics,
                    rateLimit: {
                        remainingRequests: rateLimit.remainingRequests,
                        resetTime: rateLimit.resetTime
                    }
                }
            };

        } catch (error) {
            this.monitor.logSecurityEvent(
                'system_overload',
                'high',
                'SPARQLSecurityManager',
                { errorMessage: error.message },
                {},
                userId,
                sessionId
            );

            return {
                allowed: false,
                securityScore: 0,
                violations: ['Security validation failed due to system error'],
                recommendations: ['Contact system administrator'],
                metrics: {}
            };
        }
    }

    /**
     * Start query execution with timeout and monitoring
     */
    async executeQueryWithSecurity(
        queryId: string,
        query: string,
        userId: string,
        executeFunction: (signal: AbortSignal) => Promise<any>,
        sessionId?: string
    ): Promise<any> {
        // First validate the query
        const validation = await this.validateQuery(query, userId, sessionId);
        if (!validation.allowed) {
            throw new Error(`Query blocked: ${validation.violations.join(', ')}`);
        }

        // Determine complexity level for timeout
        const complexityLevel = validation.metrics.complexity.riskLevel === 'critical' ? 'critical' :
                               validation.metrics.complexity.riskLevel === 'high' ? 'complex' :
                               validation.metrics.complexity.riskLevel === 'medium' ? 'moderate' : 'simple';

        // Start execution with timeout
        const executionResult = this.timeoutManager.startExecution(
            queryId,
            query,
            complexityLevel
        );

        if (!executionResult.isSuccess) {
            throw new Error(`Failed to start query execution: ${executionResult.getError()}`);
        }

        const execution = executionResult.getValue();

        try {
            // Execute the query with timeout
            const result = await executeFunction(execution.abortController.signal);
            
            // Complete successfully
            const metrics = this.timeoutManager.completeExecution(queryId);
            if (metrics.isSuccess) {
                const executionMetrics = metrics.getValue();
                // Query completed successfully - no security event needed
            }

            return result;

        } catch (error) {
            // Handle execution failure
            let timeoutReason: 'time' | 'memory' | 'cpu' | 'manual' = 'manual';
            
            if (error.name === 'AbortError') {
                timeoutReason = 'time';
            } else if (error.message.includes('memory')) {
                timeoutReason = 'memory';
            } else if (error.message.includes('cpu')) {
                timeoutReason = 'cpu';
            }

            this.timeoutManager.cancelExecution(queryId, timeoutReason);
            
            this.monitor.logSecurityEvent(
                'timeout_exceeded',
                'medium',
                'SPARQLSecurityManager',
                {
                    errorMessage: `${error.message} (timeout reason: ${timeoutReason})`
                },
                {},
                userId,
                sessionId
            );

            throw error;
        }
    }

    /**
     * Get comprehensive security metrics
     */
    getSecurityStatus(): {
        monitor: any;
        rateLimiter: any;
        timeoutManager: any;
        activeThreats: number;
        systemHealth: 'good' | 'warning' | 'critical';
    } {
        const monitorMetrics = this.monitor.getSecurityMetrics();
        const rateLimiterStats = this.rateLimiter.getSystemStats();
        const timeoutStats = this.timeoutManager.getExecutionStatistics();

        let systemHealth: 'good' | 'warning' | 'critical' = 'good';
        
        if (monitorMetrics.criticalIncidentsLast24h > 0 || rateLimiterStats.circuitBreakersOpen > 0) {
            systemHealth = 'critical';
        } else if (monitorMetrics.eventsBySeverity.high > 10 || timeoutStats.timeoutRate > 0.1) {
            systemHealth = 'warning';
        }

        return {
            monitor: monitorMetrics,
            rateLimiter: rateLimiterStats,
            timeoutManager: timeoutStats,
            activeThreats: monitorMetrics.criticalIncidentsLast24h + monitorMetrics.eventsBySeverity.high,
            systemHealth
        };
    }

    /**
     * Emergency security override
     */
    enableEmergencyMode(): void {
        // Set very strict limits
        this.rateLimiter.setEmergencyMode(true, {
            maxRequests: 10,
            maxComplexRequests: 2,
            windowSizeMs: 60000
        });

        // Reduce complexity thresholds
        this.complexityAnalyzer.updateThresholds({
            maxCost: 100,
            maxTriplePatterns: 5,
            maxJoinComplexity: 3
        });

        // Reduce timeouts
        this.timeoutManager.updateConfig({
            defaultTimeoutMs: 10000,
            maxTimeoutMs: 30000
        });

        this.monitor.logSecurityEvent(
            'system_overload',
            'critical',
            'SPARQLSecurityManager',
            { actionTaken: 'Emergency mode activated' }
        );
    }

    /**
     * Disable emergency mode
     */
    disableEmergencyMode(): void {
        this.rateLimiter.setEmergencyMode(false);
        
        this.monitor.logSecurityEvent(
            'system_overload',
            'medium',
            'SPARQLSecurityManager',
            { actionTaken: 'Emergency mode deactivated' }
        );
    }

    /**
     * Generate comprehensive security report
     */
    generateSecurityReport(): any {
        return {
            timestamp: new Date().toISOString(),
            overview: this.getSecurityStatus(),
            detailedReport: this.monitor.generateSecurityReport(),
            recommendations: this.generateSystemRecommendations()
        };
    }

    private generateSystemRecommendations(): string[] {
        const status = this.getSecurityStatus();
        const recommendations: string[] = [];

        if (status.systemHealth === 'critical') {
            recommendations.push('Immediate action required: System under attack or severe load');
            recommendations.push('Consider enabling emergency mode');
        } else if (status.systemHealth === 'warning') {
            recommendations.push('Monitor system closely for potential issues');
            recommendations.push('Review recent security events');
        }

        if (status.rateLimiter.circuitBreakersOpen > 0) {
            recommendations.push('Circuit breakers active - investigate user behavior');
        }

        if (status.timeoutManager.timeoutRate > 0.05) {
            recommendations.push('High timeout rate detected - review query complexity limits');
        }

        if (recommendations.length === 0) {
            recommendations.push('System security status is normal');
        }

        return recommendations;
    }
}

// Legacy compatibility exports
export { SPARQLSanitizer } from '../../application/services/SPARQLSanitizer';
export type { SanitizationResult } from '../../application/services/SPARQLSanitizer';