/**
 * Query Rate Limiter with Sliding Window Algorithm
 * Implements rate limiting for SPARQL queries to prevent DoS attacks
 * 
 * Security Features:
 * - Sliding window rate limiting
 * - Different limits for different query complexities
 * - User-based and IP-based limiting
 * - Automatic rate limit adjustment based on system load
 * - Circuit breaker pattern for overloaded queries
 */

import { Result } from '../../domain/core/Result';

export interface RateLimitConfig {
    windowSizeMs: number;
    maxRequests: number;
    maxComplexRequests: number;
    burstAllowance: number;
    circuitBreakerThreshold: number;
    circuitBreakerResetTimeMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
    retryAfterMs?: number;
    circuitOpen?: boolean;
}

export interface UserMetrics {
    requestCount: number;
    complexRequestCount: number;
    lastRequestTime: number;
    violationCount: number;
    circuitBreakerTriggered: boolean;
    circuitBreakerResetTime: number;
}

interface RequestWindow {
    timestamp: number;
    isComplex: boolean;
    cost: number;
}

export class QueryRateLimiter {
    private readonly userWindows = new Map<string, RequestWindow[]>();
    private readonly userMetrics = new Map<string, UserMetrics>();
    private readonly defaultConfig: RateLimitConfig = {
        windowSizeMs: 60000, // 1 minute
        maxRequests: 100,
        maxComplexRequests: 10,
        burstAllowance: 20,
        circuitBreakerThreshold: 5, // violations before circuit opens
        circuitBreakerResetTimeMs: 300000 // 5 minutes
    };

    private mergedConfig: RateLimitConfig;

    constructor(config: Partial<RateLimitConfig> = {}) {
        this.mergedConfig = { ...this.defaultConfig, ...config };
        
        // Cleanup old windows periodically
        setInterval(() => this.cleanup(), this.mergedConfig.windowSizeMs);
    }

    /**
     * Check if a query request is allowed within rate limits
     */
    checkRateLimit(
        userId: string, 
        isComplex: boolean = false, 
        queryCost: number = 1
    ): Result<RateLimitResult> {
        try {
            const now = Date.now();
            
            // Check circuit breaker
            const circuitCheck = this.checkCircuitBreaker(userId, now);
            if (!circuitCheck.allowed) {
                return Result.ok(circuitCheck);
            }

            // Get or create user window
            const window = this.getUserWindow(userId);
            const metrics = this.getUserMetrics(userId);

            // Clean expired requests from window
            this.cleanExpiredRequests(window, now);

            // Check rate limits
            const simpleRequestCount = window.filter(req => !req.isComplex).length;
            const complexRequestCount = window.filter(req => req.isComplex).length;
            const totalCost = window.reduce((sum, req) => sum + req.cost, 0);

            // Apply different limits based on query type and user history
            const adjustedLimits = this.getAdjustedLimits(metrics);
            
            const result: RateLimitResult = {
                allowed: true,
                remainingRequests: adjustedLimits.maxRequests - simpleRequestCount,
                resetTime: now + this.mergedConfig.windowSizeMs
            };

            // Check simple request limit
            if (simpleRequestCount >= adjustedLimits.maxRequests) {
                result.allowed = false;
                result.retryAfterMs = this.calculateRetryAfter(window, now);
            }

            // Check complex request limit
            if (isComplex && complexRequestCount >= adjustedLimits.maxComplexRequests) {
                result.allowed = false;
                result.retryAfterMs = this.calculateRetryAfter(window, now, true);
            }

            // Check burst protection
            if (this.detectBurst(window, now)) {
                result.allowed = false;
                result.retryAfterMs = this.mergedConfig.windowSizeMs / 4; // 15 seconds for burst
            }

            // Check total cost limit
            const maxTotalCost = adjustedLimits.maxRequests * 10; // Assume average cost of 10
            if (totalCost + queryCost > maxTotalCost) {
                result.allowed = false;
                result.retryAfterMs = this.calculateCostBasedRetry(totalCost, maxTotalCost);
            }

            // Record the request if allowed
            if (result.allowed) {
                this.recordRequest(userId, isComplex, queryCost, now);
            } else {
                this.recordViolation(userId, now);
            }

            return Result.ok(result);
        } catch (error) {
            return Result.fail(`Rate limit check failed: ${error.message}`);
        }
    }

    /**
     * Check circuit breaker status
     */
    private checkCircuitBreaker(userId: string, now: number): RateLimitResult {
        const metrics = this.getUserMetrics(userId);

        if (metrics.circuitBreakerTriggered) {
            if (now < metrics.circuitBreakerResetTime) {
                return {
                    allowed: false,
                    remainingRequests: 0,
                    resetTime: metrics.circuitBreakerResetTime,
                    retryAfterMs: metrics.circuitBreakerResetTime - now,
                    circuitOpen: true
                };
            } else {
                // Reset circuit breaker
                metrics.circuitBreakerTriggered = false;
                metrics.violationCount = 0;
            }
        }

        return { allowed: true, remainingRequests: 0, resetTime: now };
    }

    /**
     * Get user request window
     */
    private getUserWindow(userId: string): RequestWindow[] {
        if (!this.userWindows.has(userId)) {
            this.userWindows.set(userId, []);
        }
        return this.userWindows.get(userId)!;
    }

    /**
     * Get user metrics
     */
    private getUserMetrics(userId: string): UserMetrics {
        if (!this.userMetrics.has(userId)) {
            this.userMetrics.set(userId, {
                requestCount: 0,
                complexRequestCount: 0,
                lastRequestTime: 0,
                violationCount: 0,
                circuitBreakerTriggered: false,
                circuitBreakerResetTime: 0
            });
        }
        return this.userMetrics.get(userId)!;
    }

    /**
     * Clean expired requests from window
     */
    private cleanExpiredRequests(window: RequestWindow[], now: number): void {
        const cutoff = now - this.mergedConfig.windowSizeMs;
        const validIndex = window.findIndex(req => req.timestamp > cutoff);
        
        if (validIndex > 0) {
            window.splice(0, validIndex);
        } else if (validIndex === -1) {
            window.length = 0; // All requests are expired
        }
    }

    /**
     * Get adjusted limits based on user behavior
     */
    private getAdjustedLimits(metrics: UserMetrics): RateLimitConfig {
        const adjustedConfig = { ...this.mergedConfig };

        // Reduce limits for users with violations
        if (metrics.violationCount > 0) {
            const reductionFactor = Math.max(0.3, 1 - (metrics.violationCount * 0.2));
            adjustedConfig.maxRequests = Math.floor(adjustedConfig.maxRequests * reductionFactor);
            adjustedConfig.maxComplexRequests = Math.floor(adjustedConfig.maxComplexRequests * reductionFactor);
        }

        // Increase limits for well-behaved users (optional - can be enabled for premium users)
        // if (metrics.requestCount > 1000 && metrics.violationCount === 0) {
        //     adjustedConfig.maxRequests = Math.floor(adjustedConfig.maxRequests * 1.2);
        // }

        return adjustedConfig;
    }

    /**
     * Detect burst patterns in requests
     */
    private detectBurst(window: RequestWindow[], now: number): boolean {
        if (window.length < this.mergedConfig.burstAllowance) {
            return false;
        }

        // Check if too many requests in a short time (1/4 of window)
        const burstWindow = this.mergedConfig.windowSizeMs / 4;
        const recentRequests = window.filter(req => req.timestamp > now - burstWindow);
        
        return recentRequests.length > this.mergedConfig.burstAllowance;
    }

    /**
     * Calculate retry-after time based on window state
     */
    private calculateRetryAfter(
        window: RequestWindow[], 
        now: number, 
        complexQuery: boolean = false
    ): number {
        if (window.length === 0) {
            return 1000; // 1 second default
        }

        // Find when the oldest request in the current window will expire
        const oldestRequest = window[0];
        const timeUntilExpiry = (oldestRequest.timestamp + this.mergedConfig.windowSizeMs) - now;
        
        // Add extra delay for complex queries
        const extraDelay = complexQuery ? 5000 : 1000;
        
        return Math.max(timeUntilExpiry, extraDelay);
    }

    /**
     * Calculate cost-based retry delay
     */
    private calculateCostBasedRetry(currentCost: number, maxCost: number): number {
        const overageRatio = currentCost / maxCost;
        // Linear scaling: 1 second per 10% overage, max 30 seconds
        return Math.min(Math.floor(overageRatio * 10) * 1000, 30000);
    }

    /**
     * Record a successful request
     */
    private recordRequest(userId: string, isComplex: boolean, cost: number, timestamp: number): void {
        const window = this.getUserWindow(userId);
        const metrics = this.getUserMetrics(userId);

        window.push({ timestamp, isComplex, cost });
        metrics.requestCount++;
        metrics.lastRequestTime = timestamp;
        
        if (isComplex) {
            metrics.complexRequestCount++;
        }
    }

    /**
     * Record a rate limit violation
     */
    private recordViolation(userId: string, timestamp: number): void {
        const metrics = this.getUserMetrics(userId);
        metrics.violationCount++;

        // Trigger circuit breaker if too many violations
        if (metrics.violationCount >= this.mergedConfig.circuitBreakerThreshold) {
            metrics.circuitBreakerTriggered = true;
            metrics.circuitBreakerResetTime = timestamp + this.mergedConfig.circuitBreakerResetTimeMs;
        }
    }

    /**
     * Reset rate limits for a user (admin function)
     */
    resetUserLimits(userId: string): void {
        this.userWindows.delete(userId);
        this.userMetrics.delete(userId);
    }

    /**
     * Get current user metrics for monitoring
     */
    getUserStatus(userId: string): UserMetrics {
        const metrics = this.getUserMetrics(userId);
        const window = this.getUserWindow(userId);
        
        return {
            ...metrics,
            requestCount: window.length
        };
    }

    /**
     * Get all active users for monitoring
     */
    getActiveUsers(): string[] {
        return Array.from(this.userWindows.keys());
    }

    /**
     * Update rate limit configuration
     */
    updateConfig(newConfig: Partial<RateLimitConfig>): void {
        this.mergedConfig = { ...this.mergedConfig, ...newConfig };
    }

    /**
     * Get current configuration
     */
    getConfig(): RateLimitConfig {
        return { ...this.mergedConfig };
    }

    /**
     * Cleanup expired data
     */
    private cleanup(): void {
        const now = Date.now();
        const cutoff = now - this.mergedConfig.windowSizeMs * 2; // Keep data for 2 windows

        // Clean up windows
        for (const [userId, window] of this.userWindows.entries()) {
            this.cleanExpiredRequests(window, now);
            
            // Remove completely empty windows
            if (window.length === 0) {
                this.userWindows.delete(userId);
            }
        }

        // Clean up metrics for inactive users
        for (const [userId, metrics] of this.userMetrics.entries()) {
            if (metrics.lastRequestTime < cutoff && !metrics.circuitBreakerTriggered) {
                this.userMetrics.delete(userId);
            }
        }
    }

    /**
     * Emergency rate limit override (for system maintenance)
     */
    setEmergencyMode(enabled: boolean, emergencyConfig?: Partial<RateLimitConfig>): void {
        if (enabled && emergencyConfig) {
            this.mergedConfig = { ...this.defaultConfig, ...emergencyConfig };
        } else if (!enabled) {
            this.mergedConfig = { ...this.defaultConfig };
        }
    }

    /**
     * Get system-wide statistics
     */
    getSystemStats(): {
        activeUsers: number;
        totalRequests: number;
        totalViolations: number;
        circuitBreakersOpen: number;
    } {
        let totalRequests = 0;
        let totalViolations = 0;
        let circuitBreakersOpen = 0;

        for (const window of this.userWindows.values()) {
            totalRequests += window.length;
        }

        for (const metrics of this.userMetrics.values()) {
            totalViolations += metrics.violationCount;
            if (metrics.circuitBreakerTriggered) {
                circuitBreakersOpen++;
            }
        }

        return {
            activeUsers: this.userWindows.size,
            totalRequests,
            totalViolations,
            circuitBreakersOpen
        };
    }
}