/**
 * Security Monitor with Incident Logging
 * Implements comprehensive security monitoring and incident response
 * 
 * Security Features:
 * - Real-time security event monitoring
 * - Incident classification and scoring
 * - Automated threat response
 * - Security metrics collection
 * - Alert system integration
 * - Forensic logging
 * - Compliance reporting
 */

import { Result } from '../../domain/core/Result';

export interface SecurityEvent {
    id: string;
    timestamp: number;
    type: SecurityEventType;
    severity: SecuritySeverity;
    source: string;
    userId?: string;
    sessionId?: string;
    details: SecurityEventDetails;
    metadata: SecurityEventMetadata;
}

export type SecurityEventType = 
    | 'query_blocked'
    | 'rate_limit_exceeded'
    | 'injection_attempt'
    | 'resource_violation'
    | 'timeout_exceeded'
    | 'invalid_query'
    | 'suspicious_pattern'
    | 'access_violation'
    | 'circuit_breaker_triggered'
    | 'system_overload';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEventDetails {
    query?: string;
    threatType?: string;
    violationType?: string;
    resourceUsage?: any;
    errorMessage?: string;
    clientInfo?: ClientInfo;
    actionTaken?: string;
    additionalContext?: Record<string, any>;
}

export interface SecurityEventMetadata {
    userAgent?: string;
    ipAddress?: string;
    requestId?: string;
    correlationId?: string;
    tags?: string[];
    metrics?: Record<string, number>;
}

export interface ClientInfo {
    platform: string;
    version: string;
    capabilities: string[];
}

export interface SecurityMetrics {
    totalEvents: number;
    eventsBySeverity: Record<SecuritySeverity, number>;
    eventsByType: Record<SecurityEventType, number>;
    incidentsLast24h: number;
    criticalIncidentsLast24h: number;
    criticalEvents: number; // Alias for criticalIncidentsLast24h for backward compatibility
    topThreats: Array<{ type: string; count: number }>;
    responseTimeMs: number;
    false_positives: number;
    uniqueAttackers?: number;
}

export interface SecurityAlert {
    id: string;
    timestamp: number;
    severity: SecuritySeverity;
    title: string;
    description: string;
    events: SecurityEvent[];
    recommendation: string;
    acknowledged: boolean;
    resolvedAt?: number;
}

export interface MonitorConfig {
    alertThresholds: {
        criticalEventsPerMinute: number;
        highEventsPerMinute: number;
        suspiciousPatternCount: number;
        resourceViolationCount: number;
    };
    retentionPeriodMs: number;
    enableRealTimeAlerts: boolean;
    enableForensicLogging: boolean;
    maxEventHistorySize: number;
    correlationWindowMs: number;
}

export class SecurityMonitor {
    private readonly events: SecurityEvent[] = [];
    private readonly alerts: SecurityAlert[] = [];
    private readonly eventListeners = new Map<SecurityEventType, Array<(event: SecurityEvent) => void>>();
    private alertCounter = 0;
    private eventCounter = 0;

    private readonly defaultConfig: MonitorConfig = {
        alertThresholds: {
            criticalEventsPerMinute: 5,
            highEventsPerMinute: 10,
            suspiciousPatternCount: 20,
            resourceViolationCount: 15
        },
        retentionPeriodMs: 7 * 24 * 60 * 60 * 1000, // 7 days
        enableRealTimeAlerts: true,
        enableForensicLogging: true,
        maxEventHistorySize: 10000,
        correlationWindowMs: 5 * 60 * 1000 // 5 minutes
    };

    private mergedConfig: MonitorConfig;

    constructor(config: Partial<MonitorConfig> = {}) {
        this.mergedConfig = { ...this.defaultConfig, ...config };
        
        // Start cleanup process
        setInterval(() => this.cleanup(), 60 * 60 * 1000); // Hourly cleanup
        
        // Start alert correlation process
        setInterval(() => this.correlateEvents(), this.mergedConfig.correlationWindowMs);
    }

    /**
     * Log a security event
     */
    logSecurityEvent(
        type: SecurityEventType,
        severity: SecuritySeverity,
        source: string,
        details: SecurityEventDetails,
        metadata: SecurityEventMetadata = {},
        userId?: string,
        sessionId?: string
    ): Result<SecurityEvent> {
        try {
            const event: SecurityEvent = {
                id: `evt_${++this.eventCounter}_${Date.now()}`,
                timestamp: Date.now(),
                type,
                severity,
                source,
                userId,
                sessionId,
                details: {
                    ...details,
                    actionTaken: details.actionTaken || this.determineActionTaken(type, severity)
                },
                metadata: {
                    ...metadata,
                    tags: metadata.tags || this.generateEventTags(type, severity, details)
                }
            };

            // Store event
            this.addEvent(event);

            // Trigger real-time processing
            this.processEvent(event);

            // Notify listeners
            this.notifyListeners(event);

            return Result.ok(event);
        } catch (error) {
            return Result.fail(`Failed to log security event: ${error.message}`);
        }
    }

    /**
     * Log query blocking event
     */
    logQueryBlocked(
        query: string,
        reason: string,
        threatDetails: any = {},
        userId?: string,
        sessionId?: string
    ): Result<SecurityEvent> {
        return this.logSecurityEvent(
            'query_blocked',
            this.determineSeverityFromReason(reason),
            'QueryValidator',
            {
                query: this.sanitizeQueryForLogging(query),
                threatType: reason,
                additionalContext: threatDetails
            },
            {
                tags: ['query_security', 'blocked', reason],
                metrics: { queryLength: query.length }
            },
            userId,
            sessionId
        );
    }

    /**
     * Log rate limit exceeded event
     */
    logRateLimitExceeded(
        userId: string,
        requestType: string,
        currentRate: number,
        limit: number,
        sessionId?: string
    ): Result<SecurityEvent> {
        return this.logSecurityEvent(
            'rate_limit_exceeded',
            currentRate > limit * 2 ? 'high' : 'medium',
            'RateLimiter',
            {
                violationType: requestType,
                additionalContext: { currentRate, limit, overage: currentRate - limit }
            },
            {
                tags: ['rate_limiting', requestType],
                metrics: { currentRate, limit, overagePercent: ((currentRate - limit) / limit) * 100 }
            },
            userId,
            sessionId
        );
    }

    /**
     * Log injection attempt
     */
    logInjectionAttempt(
        query: string,
        injectionType: string,
        detectedPatterns: string[],
        userId?: string,
        sessionId?: string
    ): Result<SecurityEvent> {
        return this.logSecurityEvent(
            'injection_attempt',
            'critical',
            'InjectionDetector',
            {
                query: this.sanitizeQueryForLogging(query),
                threatType: injectionType,
                additionalContext: { detectedPatterns }
            },
            {
                tags: ['injection', injectionType, 'attack'],
                metrics: { patternCount: detectedPatterns.length, queryLength: query.length }
            },
            userId,
            sessionId
        );
    }

    /**
     * Log resource violation
     */
    logResourceViolation(
        violationType: string,
        currentUsage: number,
        threshold: number,
        queryId?: string,
        userId?: string
    ): Result<SecurityEvent> {
        return this.logSecurityEvent(
            'resource_violation',
            currentUsage > threshold * 1.5 ? 'high' : 'medium',
            'ResourceMonitor',
            {
                violationType,
                additionalContext: { currentUsage, threshold, queryId }
            },
            {
                tags: ['resource', violationType],
                metrics: { currentUsage, threshold, overage: currentUsage - threshold }
            },
            userId
        );
    }

    /**
     * Log circuit breaker activation
     */
    logCircuitBreakerTriggered(
        userId: string,
        triggerReason: string,
        violationCount: number,
        sessionId?: string
    ): Result<SecurityEvent> {
        return this.logSecurityEvent(
            'circuit_breaker_triggered',
            'high',
            'CircuitBreaker',
            {
                violationType: triggerReason,
                additionalContext: { violationCount }
            },
            {
                tags: ['circuit_breaker', triggerReason],
                metrics: { violationCount }
            },
            userId,
            sessionId
        );
    }

    /**
     * Add event listener for specific event types
     */
    addEventListener(type: SecurityEventType, listener: (event: SecurityEvent) => void): void {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, []);
        }
        this.eventListeners.get(type)!.push(listener);
    }

    /**
     * Remove event listener
     */
    removeEventListener(type: SecurityEventType, listener: (event: SecurityEvent) => void): void {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Get security metrics
     */
    getSecurityMetrics(timeRangeMs: number = 24 * 60 * 60 * 1000): SecurityMetrics {
        const cutoff = Date.now() - timeRangeMs;
        const recentEvents = this.events.filter(e => e.timestamp > cutoff);

        const eventsBySeverity: Record<SecuritySeverity, number> = {
            low: 0, medium: 0, high: 0, critical: 0
        };

        const eventsByType: Record<SecurityEventType, number> = {
            query_blocked: 0, rate_limit_exceeded: 0, injection_attempt: 0,
            resource_violation: 0, timeout_exceeded: 0, invalid_query: 0,
            suspicious_pattern: 0, access_violation: 0, circuit_breaker_triggered: 0,
            system_overload: 0
        };

        let responseTimes: number[] = [];

        for (const event of recentEvents) {
            eventsBySeverity[event.severity]++;
            eventsByType[event.type]++;
            
            if (event.metadata.metrics?.responseTimeMs) {
                responseTimes.push(event.metadata.metrics.responseTimeMs);
            }
        }

        // Calculate top threats
        const threatCounts = new Map<string, number>();
        recentEvents.forEach(event => {
            const threat = event.details.threatType || event.type;
            threatCounts.set(threat, (threatCounts.get(threat) || 0) + 1);
        });

        const topThreats = Array.from(threatCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));

        const avgResponseTime = responseTimes.length > 0 
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0;

        // Calculate unique attackers
        const uniqueAttackers = new Set(
            recentEvents
                .filter(e => e.userId)
                .map(e => e.userId)
        ).size;

        return {
            totalEvents: recentEvents.length,
            eventsBySeverity,
            eventsByType,
            incidentsLast24h: recentEvents.length,
            criticalIncidentsLast24h: eventsBySeverity.critical,
            criticalEvents: eventsBySeverity.critical, // Alias for backward compatibility
            topThreats,
            responseTimeMs: Math.round(avgResponseTime),
            false_positives: this.calculateFalsePositives(recentEvents),
            uniqueAttackers: uniqueAttackers || 0
        };
    }

    /**
     * Get recent security events
     */
    getRecentEvents(limit: number = 100): SecurityEvent[] {
        return this.events
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Get recent security alerts
     */
    getRecentAlerts(limit: number = 50): SecurityAlert[] {
        return this.alerts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Acknowledge security alert
     */
    acknowledgeAlert(alertId: string): Result<void> {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) {
            return Result.fail(`Alert not found: ${alertId}`);
        }

        alert.acknowledged = true;
        return Result.ok();
    }

    /**
     * Resolve security alert
     */
    resolveAlert(alertId: string): Result<void> {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) {
            return Result.fail(`Alert not found: ${alertId}`);
        }

        alert.resolvedAt = Date.now();
        return Result.ok();
    }

    /**
     * Export security events for forensic analysis
     */
    exportEvents(
        startTime: number,
        endTime: number,
        filters: Partial<SecurityEvent> = {}
    ): SecurityEvent[] {
        return this.events.filter(event => {
            if (event.timestamp < startTime || event.timestamp > endTime) {
                return false;
            }

            for (const [key, value] of Object.entries(filters)) {
                if (event[key as keyof SecurityEvent] !== value) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Generate security report
     */
    generateSecurityReport(timeRangeMs: number = 24 * 60 * 60 * 1000): {
        summary: SecurityMetrics;
        criticalEvents: SecurityEvent[];
        recommendations: string[];
        complianceStatus: string;
    } {
        const summary = this.getSecurityMetrics(timeRangeMs);
        const cutoff = Date.now() - timeRangeMs;
        const criticalEvents = this.events.filter(e => 
            e.timestamp > cutoff && e.severity === 'critical'
        );

        const recommendations = this.generateRecommendations(summary, criticalEvents);
        const complianceStatus = this.assessComplianceStatus(summary);

        return {
            summary,
            criticalEvents,
            recommendations,
            complianceStatus
        };
    }

    /**
     * Create a security alert manually
     */
    createSecurityAlert(
        severity: SecuritySeverity,
        title: string,
        context: any = {}
    ): Result<SecurityAlert> {
        try {
            const alert: SecurityAlert = {
                id: `alert_${++this.alertCounter}_${Date.now()}`,
                timestamp: Date.now(),
                severity,
                title,
                description: context.description || `Security alert: ${title}`,
                events: context.events || [],
                recommendation: context.recommendation || this.generateRecommendationForSeverity(severity),
                acknowledged: false
            };

            this.alerts.push(alert);
            return Result.ok(alert);
        } catch (error) {
            return Result.fail(`Failed to create security alert: ${error.message}`);
        }
    }

    /**
     * Private methods
     */

    private addEvent(event: SecurityEvent): void {
        this.events.push(event);
        
        // Maintain size limit - trim to exact size if exceeded
        if (this.events.length > this.mergedConfig.maxEventHistorySize) {
            const excess = this.events.length - this.mergedConfig.maxEventHistorySize;
            this.events.splice(0, excess);
        }
    }

    private processEvent(event: SecurityEvent): void {
        // Check if immediate alert needed
        if (this.shouldTriggerAlert(event)) {
            this.createAlert(event);
        }

        // Log to console for development
        if (event.severity === 'critical' || event.severity === 'high') {
            console.warn(`Security Event [${event.severity.toUpperCase()}]:`, {
                type: event.type,
                source: event.source,
                details: event.details
            });
        }
    }

    private notifyListeners(event: SecurityEvent): void {
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Error in security event listener:', error);
                }
            });
        }
    }

    private shouldTriggerAlert(event: SecurityEvent): boolean {
        if (!this.mergedConfig.enableRealTimeAlerts) {
            return false;
        }

        // Always alert on critical events
        if (event.severity === 'critical') {
            return true;
        }

        // Check rate-based alerts
        const recentWindow = Date.now() - 60000; // 1 minute
        const recentEvents = this.events.filter(e => e.timestamp > recentWindow);
        
        const criticalCount = recentEvents.filter(e => e.severity === 'critical').length;
        const highCount = recentEvents.filter(e => e.severity === 'high').length;

        return criticalCount >= this.mergedConfig.alertThresholds.criticalEventsPerMinute ||
               highCount >= this.mergedConfig.alertThresholds.highEventsPerMinute;
    }

    private createAlert(event: SecurityEvent): void {
        const alert: SecurityAlert = {
            id: `alert_${++this.alertCounter}_${Date.now()}`,
            timestamp: Date.now(),
            severity: event.severity,
            title: this.generateAlertTitle(event),
            description: this.generateAlertDescription(event),
            events: [event],
            recommendation: this.generateRecommendation(event),
            acknowledged: false
        };

        this.alerts.push(alert);
    }

    private correlateEvents(): void {
        // Group recent events by user and type for correlation
        const windowStart = Date.now() - this.mergedConfig.correlationWindowMs;
        const recentEvents = this.events.filter(e => e.timestamp > windowStart);
        
        // Look for patterns that might indicate coordinated attacks
        const userEventCounts = new Map<string, SecurityEvent[]>();
        
        for (const event of recentEvents) {
            if (event.userId) {
                if (!userEventCounts.has(event.userId)) {
                    userEventCounts.set(event.userId, []);
                }
                userEventCounts.get(event.userId)!.push(event);
            }
        }

        // Check for suspicious patterns
        for (const [userId, events] of userEventCounts.entries()) {
            if (events.length >= this.mergedConfig.alertThresholds.suspiciousPatternCount) {
                this.logSecurityEvent(
                    'suspicious_pattern',
                    'high',
                    'SecurityMonitor',
                    {
                        additionalContext: { 
                            eventCount: events.length,
                            timeWindow: this.mergedConfig.correlationWindowMs,
                            eventTypes: [...new Set(events.map(e => e.type))]
                        }
                    },
                    { tags: ['correlation', 'suspicious_activity'] },
                    userId
                );
            }
        }
    }

    private cleanup(): void {
        const cutoff = Date.now() - this.mergedConfig.retentionPeriodMs;
        
        // Remove old events
        const oldEventCount = this.events.length;
        const keepIndex = this.events.findIndex(e => e.timestamp > cutoff);
        if (keepIndex > 0) {
            this.events.splice(0, keepIndex);
        }

        // Remove old resolved alerts
        const oldAlertCount = this.alerts.length;
        this.alerts.splice(0, this.alerts.length, 
            ...this.alerts.filter(a => 
                a.timestamp > cutoff || (!a.resolvedAt || a.resolvedAt > cutoff)
            )
        );

        console.log(`Security Monitor cleanup: removed ${oldEventCount - this.events.length} events, ${oldAlertCount - this.alerts.length} alerts`);
    }

    private sanitizeQueryForLogging(query: string): string {
        // Remove potentially sensitive data but keep structure for analysis
        return query
            .replace(/(['"][^'"]*['"])/g, "'***'")  // Replace string literals
            .replace(/\b\d+\b/g, 'NUM')             // Replace numbers
            .substring(0, 500);                      // Limit length
    }

    private determineSeverityFromReason(reason: string): SecuritySeverity {
        const criticalReasons = ['injection', 'traversal', 'command'];
        const highReasons = ['complexity', 'resource', 'timeout'];
        
        if (criticalReasons.some(r => reason.toLowerCase().includes(r))) {
            return 'critical';
        }
        if (highReasons.some(r => reason.toLowerCase().includes(r))) {
            return 'high';
        }
        return 'medium';
    }

    private determineActionTaken(type: SecurityEventType, severity: SecuritySeverity): string {
        if (severity === 'critical') {
            return 'Query blocked, user flagged for review';
        }
        if (severity === 'high') {
            return 'Query blocked, rate limit applied';
        }
        return 'Query allowed with warning';
    }

    private generateEventTags(type: SecurityEventType, severity: SecuritySeverity, details: SecurityEventDetails): string[] {
        const tags: string[] = [type, severity];
        
        if (details.threatType) {
            tags.push(details.threatType);
        }
        if (details.violationType) {
            tags.push(details.violationType);
        }
        
        return tags;
    }

    private generateAlertTitle(event: SecurityEvent): string {
        return `${event.severity.toUpperCase()}: ${event.type.replace(/_/g, ' ')} detected`;
    }

    private generateAlertDescription(event: SecurityEvent): string {
        return `Security event detected from ${event.source}: ${event.details.threatType || event.type}`;
    }

    private generateRecommendation(event: SecurityEvent): string {
        switch (event.type) {
            case 'injection_attempt':
                return 'Review query validation rules and consider blocking this user';
            case 'rate_limit_exceeded':
                return 'Monitor user behavior and consider temporary restrictions';
            case 'resource_violation':
                return 'Review query complexity limits and system resources';
            default:
                return 'Monitor situation and review security policies';
        }
    }

    private generateRecommendationForSeverity(severity: SecuritySeverity): string {
        switch (severity) {
            case 'critical':
                return 'Immediate action required - investigate and respond urgently';
            case 'high':
                return 'High priority - review and respond within 1 hour';
            case 'medium':
                return 'Medium priority - review and respond within 4 hours';
            case 'low':
                return 'Low priority - monitor and respond within 24 hours';
            default:
                return 'Monitor situation and review security policies';
        }
    }

    private generateRecommendations(metrics: SecurityMetrics, criticalEvents: SecurityEvent[]): string[] {
        const recommendations: string[] = [];

        if (metrics.criticalIncidentsLast24h > 0) {
            recommendations.push('Address critical security incidents immediately');
        }

        if (metrics.eventsBySeverity.high > 10) {
            recommendations.push('Review and tighten security policies');
        }

        if (criticalEvents.some(e => e.type === 'injection_attempt')) {
            recommendations.push('Enhance input validation and consider WAF deployment');
        }

        return recommendations;
    }

    private assessComplianceStatus(metrics: SecurityMetrics): string {
        if (metrics.criticalIncidentsLast24h === 0 && metrics.eventsBySeverity.high < 5) {
            return 'COMPLIANT';
        }
        if (metrics.criticalIncidentsLast24h < 3) {
            return 'MINOR_ISSUES';
        }
        return 'NON_COMPLIANT';
    }

    private calculateFalsePositives(events: SecurityEvent[]): number {
        // This would need actual implementation based on your feedback mechanism
        // For now, estimate based on acknowledged events that were resolved without action
        return Math.floor(events.length * 0.05); // Assume 5% false positive rate
    }
}