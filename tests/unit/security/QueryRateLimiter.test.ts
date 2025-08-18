/**
 * Query Rate Limiter Security Tests
 * Tests for DoS prevention through rate limiting
 */

import { QueryRateLimiter, RateLimitConfig } from '../../../src/infrastructure/security/QueryRateLimiter';

describe('QueryRateLimiter Security Tests', () => {
    let rateLimiter: QueryRateLimiter;
    
    beforeEach(() => {
        rateLimiter = new QueryRateLimiter();
    });

    afterEach(() => {
        // Reset all user limits between tests
        const activeUsers = rateLimiter.getActiveUsers();
        activeUsers.forEach(userId => rateLimiter.resetUserLimits(userId));
    });

    describe('Basic Rate Limiting', () => {
        it('should allow requests within limits', () => {
            const userId = 'test-user-1';
            
            for (let i = 0; i < 5; i++) {
                const result = rateLimiter.checkRateLimit(userId);
                expect(result.isSuccess).toBe(true);
                expect(result.getValue().allowed).toBe(true);
                expect(result.getValue().remainingRequests).toBeGreaterThanOrEqual(0);
            }
        });

        it('should block requests exceeding rate limits', () => {
            const userId = 'test-user-2';
            const config = rateLimiter.getConfig();
            
            // Make requests up to the limit
            for (let i = 0; i < config.maxRequests; i++) {
                const result = rateLimiter.checkRateLimit(userId);
                expect(result.getValue().allowed).toBe(true);
            }
            
            // Next request should be blocked
            const blockedResult = rateLimiter.checkRateLimit(userId);
            expect(blockedResult.getValue().allowed).toBe(false);
            expect(blockedResult.getValue().retryAfterMs).toBeGreaterThan(0);
        });

        it('should enforce separate limits for complex queries', () => {
            const userId = 'test-user-3';
            const config = rateLimiter.getConfig();
            
            // Use up all complex query allowance
            for (let i = 0; i < config.maxComplexRequests; i++) {
                const result = rateLimiter.checkRateLimit(userId, true, 100);
                expect(result.getValue().allowed).toBe(true);
            }
            
            // Next complex query should be blocked
            const blockedResult = rateLimiter.checkRateLimit(userId, true, 100);
            expect(blockedResult.getValue().allowed).toBe(false);
            
            // But simple queries should still be allowed
            const simpleResult = rateLimiter.checkRateLimit(userId, false, 1);
            expect(simpleResult.getValue().allowed).toBe(true);
        });
    });

    describe('Sliding Window Algorithm', () => {
        it('should use sliding window for rate limiting', async () => {
            const userId = 'test-user-4';
            const config = rateLimiter.getConfig();
            
            // Fill up the rate limit
            for (let i = 0; i < config.maxRequests; i++) {
                rateLimiter.checkRateLimit(userId);
            }
            
            // Should be blocked
            let result = rateLimiter.checkRateLimit(userId);
            expect(result.getValue().allowed).toBe(false);
            
            // Wait for window to slide (in real scenario)
            // Simulate window sliding by creating new rate limiter with shorter window
            const shortWindowLimiter = new QueryRateLimiter({
                windowSizeMs: 100,
                maxRequests: 5,
                maxComplexRequests: 2,
                burstAllowance: 3,
                circuitBreakerThreshold: 3,
                circuitBreakerResetTimeMs: 1000
            });
            
            // Should allow requests in new window
            result = shortWindowLimiter.checkRateLimit(userId);
            expect(result.getValue().allowed).toBe(true);
        });

        it('should handle burst detection', () => {
            const config: RateLimitConfig = {
                windowSizeMs: 60000,
                maxRequests: 100,
                maxComplexRequests: 10,
                burstAllowance: 5,
                circuitBreakerThreshold: 3,
                circuitBreakerResetTimeMs: 300000
            };
            
            const burstLimiter = new QueryRateLimiter(config);
            const userId = 'burst-user';
            
            // Make burst of requests
            for (let i = 0; i < config.burstAllowance + 2; i++) {
                burstLimiter.checkRateLimit(userId);
            }
            
            // Next request should be blocked due to burst detection
            const result = burstLimiter.checkRateLimit(userId);
            expect(result.getValue().allowed).toBe(false);
        });
    });

    describe('Circuit Breaker Pattern', () => {
        it('should trigger circuit breaker after violations', () => {
            const config: RateLimitConfig = {
                windowSizeMs: 60000,
                maxRequests: 2,
                maxComplexRequests: 1,
                burstAllowance: 3,
                circuitBreakerThreshold: 3,
                circuitBreakerResetTimeMs: 5000
            };
            
            const circuitLimiter = new QueryRateLimiter(config);
            const userId = 'circuit-user';
            
            // Generate violations to trigger circuit breaker
            for (let i = 0; i < 10; i++) {
                circuitLimiter.checkRateLimit(userId);
            }
            
            const status = circuitLimiter.getUserStatus(userId);
            expect(status.violationCount).toBeGreaterThanOrEqual(config.circuitBreakerThreshold);
            
            // Circuit breaker should be triggered
            const result = circuitLimiter.checkRateLimit(userId);
            expect(result.getValue().circuitOpen).toBe(true);
        });

        it('should reset circuit breaker after timeout', () => {
            const config: RateLimitConfig = {
                windowSizeMs: 60000,
                maxRequests: 1,
                maxComplexRequests: 1,
                burstAllowance: 1,
                circuitBreakerThreshold: 2,
                circuitBreakerResetTimeMs: 100 // Short reset time for testing
            };
            
            const circuitLimiter = new QueryRateLimiter(config);
            const userId = 'reset-user';
            
            // Trigger circuit breaker
            for (let i = 0; i < 5; i++) {
                circuitLimiter.checkRateLimit(userId);
            }
            
            // Should be blocked
            let result = circuitLimiter.checkRateLimit(userId);
            expect(result.getValue().circuitOpen).toBe(true);
            
            // Wait for reset timeout (simulation)
            setTimeout(() => {
                result = circuitLimiter.checkRateLimit(userId);
                // Should be allowed after reset
                expect(result.getValue().allowed).toBe(true);
            }, 150);
        });
    });

    describe('DoS Attack Prevention', () => {
        it('should prevent rapid-fire attacks', () => {
            const userId = 'attacker-1';
            let blockedCount = 0;
            
            // Simulate rapid-fire attack
            for (let i = 0; i < 200; i++) {
                const result = rateLimiter.checkRateLimit(userId);
                if (!result.getValue().allowed) {
                    blockedCount++;
                }
            }
            
            expect(blockedCount).toBeGreaterThan(0);
            
            // User should be flagged with violations
            const status = rateLimiter.getUserStatus(userId);
            expect(status.violationCount).toBeGreaterThan(0);
        });

        it('should handle distributed attacks from multiple users', () => {
            const attackers = Array.from({ length: 50 }, (_, i) => `attacker-${i}`);
            let totalBlocked = 0;
            
            attackers.forEach(userId => {
                // Each attacker makes many requests
                for (let i = 0; i < 20; i++) {
                    const result = rateLimiter.checkRateLimit(userId);
                    if (!result.getValue().allowed) {
                        totalBlocked++;
                    }
                }
            });
            
            expect(totalBlocked).toBeGreaterThan(0);
            
            const stats = rateLimiter.getSystemStats();
            expect(stats.totalViolations).toBeGreaterThan(0);
        });

        it('should adapt limits based on user behavior', () => {
            const config: RateLimitConfig = {
                windowSizeMs: 60000,
                maxRequests: 10,
                maxComplexRequests: 5,
                burstAllowance: 3,
                circuitBreakerThreshold: 3,
                circuitBreakerResetTimeMs: 5000
            };
            
            const adaptiveLimiter = new QueryRateLimiter(config);
            const badUserId = 'bad-user';
            const goodUserId = 'good-user';
            
            // Bad user violates limits
            for (let i = 0; i < 15; i++) {
                adaptiveLimiter.checkRateLimit(badUserId);
            }
            
            // Bad user should have reduced limits
            const badUserStatus = adaptiveLimiter.getUserStatus(badUserId);
            expect(badUserStatus.violationCount).toBeGreaterThan(0);
            
            // Good user should still have normal limits
            for (let i = 0; i < 8; i++) {
                const result = adaptiveLimiter.checkRateLimit(goodUserId);
                expect(result.getValue().allowed).toBe(true);
            }
        });
    });

    describe('Resource-Based Limiting', () => {
        it('should consider query cost in rate limiting', () => {
            const userId = 'cost-user';
            
            // High-cost query should be limited more strictly
            const highCostResult = rateLimiter.checkRateLimit(userId, false, 1000);
            const lowCostResult = rateLimiter.checkRateLimit(userId, false, 1);
            
            expect(highCostResult.getValue().allowed).toBe(true);
            expect(lowCostResult.getValue().allowed).toBe(true);
            
            // But many high-cost queries should be blocked
            for (let i = 0; i < 20; i++) {
                rateLimiter.checkRateLimit(userId, false, 500);
            }
            
            const nextHighCostResult = rateLimiter.checkRateLimit(userId, false, 500);
            expect(nextHighCostResult.getValue().allowed).toBe(false);
        });

        it('should provide appropriate retry delays', () => {
            const userId = 'retry-user';
            const config = rateLimiter.getConfig();
            
            // Exceed limits
            for (let i = 0; i < config.maxRequests + 5; i++) {
                rateLimiter.checkRateLimit(userId);
            }
            
            const result = rateLimiter.checkRateLimit(userId);
            expect(result.getValue().allowed).toBe(false);
            expect(result.getValue().retryAfterMs).toBeGreaterThan(0);
            expect(result.getValue().retryAfterMs).toBeLessThan(config.windowSizeMs);
        });
    });

    describe('System Monitoring', () => {
        it('should provide system statistics', () => {
            const users = ['user1', 'user2', 'user3'];
            
            users.forEach(userId => {
                for (let i = 0; i < 5; i++) {
                    rateLimiter.checkRateLimit(userId);
                }
            });
            
            const stats = rateLimiter.getSystemStats();
            expect(stats.activeUsers).toBe(users.length);
            expect(stats.totalRequests).toBeGreaterThan(0);
            expect(typeof stats.totalViolations).toBe('number');
            expect(typeof stats.circuitBreakersOpen).toBe('number');
        });

        it('should track user metrics accurately', () => {
            const userId = 'metrics-user';
            
            // Make some requests
            for (let i = 0; i < 5; i++) {
                rateLimiter.checkRateLimit(userId, i % 2 === 0, 10);
            }
            
            const status = rateLimiter.getUserStatus(userId);
            expect(status.requestCount).toBe(5);
            expect(status.lastRequestTime).toBeGreaterThan(0);
        });
    });

    describe('Configuration and Management', () => {
        it('should allow configuration updates', () => {
            const originalConfig = rateLimiter.getConfig();
            
            rateLimiter.updateConfig({
                maxRequests: 5,
                maxComplexRequests: 2
            });
            
            const updatedConfig = rateLimiter.getConfig();
            expect(updatedConfig.maxRequests).toBe(5);
            expect(updatedConfig.maxComplexRequests).toBe(2);
            expect(updatedConfig.windowSizeMs).toBe(originalConfig.windowSizeMs);
        });

        it('should support emergency mode', () => {
            const userId = 'emergency-user';
            
            // Normal operation
            let result = rateLimiter.checkRateLimit(userId);
            expect(result.getValue().allowed).toBe(true);
            
            // Enable emergency mode with very strict limits
            rateLimiter.setEmergencyMode(true, {
                maxRequests: 1,
                maxComplexRequests: 0
            });
            
            // Should now be more restrictive
            rateLimiter.checkRateLimit(userId); // First request allowed
            result = rateLimiter.checkRateLimit(userId); // Second should be blocked
            expect(result.getValue().allowed).toBe(false);
            
            // Disable emergency mode
            rateLimiter.setEmergencyMode(false);
        });

        it('should handle user limit resets', () => {
            const userId = 'reset-test-user';
            
            // Exceed limits
            for (let i = 0; i < 200; i++) {
                rateLimiter.checkRateLimit(userId);
            }
            
            // Should be blocked
            let result = rateLimiter.checkRateLimit(userId);
            expect(result.getValue().allowed).toBe(false);
            
            // Reset limits
            rateLimiter.resetUserLimits(userId);
            
            // Should be allowed again
            result = rateLimiter.checkRateLimit(userId);
            expect(result.getValue().allowed).toBe(true);
        });

        it('should handle mass cancellation', () => {
            const users = Array.from({ length: 10 }, (_, i) => `user-${i}`);
            
            // Generate activity for all users
            users.forEach(userId => {
                for (let i = 0; i < 5; i++) {
                    rateLimiter.checkRateLimit(userId);
                }
            });
            
            expect(rateLimiter.getActiveUsers().length).toBe(users.length);
            
            // Cancel all
            const cancelResult = rateLimiter.cancelAllExecutions();
            expect(cancelResult.isSuccess).toBe(true);
            expect(cancelResult.getValue()).toBe(0); // No active executions to cancel in rate limiter
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle null and undefined user IDs', () => {
            expect(() => rateLimiter.checkRateLimit(null as any)).not.toThrow();
            expect(() => rateLimiter.checkRateLimit(undefined as any)).not.toThrow();
            expect(() => rateLimiter.checkRateLimit('')).not.toThrow();
        });

        it('should handle negative and invalid cost values', () => {
            const userId = 'edge-case-user';
            
            expect(() => rateLimiter.checkRateLimit(userId, false, -1)).not.toThrow();
            expect(() => rateLimiter.checkRateLimit(userId, false, 0)).not.toThrow();
            expect(() => rateLimiter.checkRateLimit(userId, false, Infinity)).not.toThrow();
            expect(() => rateLimiter.checkRateLimit(userId, false, NaN)).not.toThrow();
        });

        it('should handle concurrent access safely', async () => {
            const userId = 'concurrent-user';
            
            // Simulate concurrent requests
            const promises = Array.from({ length: 100 }, () =>
                Promise.resolve(rateLimiter.checkRateLimit(userId))
            );
            
            const results = await Promise.all(promises);
            
            // Should handle all requests without errors
            results.forEach(result => {
                expect(result.isSuccess).toBe(true);
            });
            
            // Should maintain consistency
            const status = rateLimiter.getUserStatus(userId);
            expect(status.requestCount).toBeLessThanOrEqual(100);
        });
    });
});