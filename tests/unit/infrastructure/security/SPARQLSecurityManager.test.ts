import { SPARQLSecurityManager } from '../../../../src/infrastructure/security/SPARQLSecurityManager';
import { EnhancedSPARQLValidator } from '../../../../src/infrastructure/security/EnhancedSPARQLValidator';
import { QueryComplexityAnalyzer } from '../../../../src/infrastructure/security/QueryComplexityAnalyzer';
import { QueryRateLimiter } from '../../../../src/infrastructure/security/QueryRateLimiter';
import { QueryTimeoutManager } from '../../../../src/infrastructure/security/QueryTimeoutManager';
import { SecurityMonitor } from '../../../../src/infrastructure/security/SecurityMonitor';
import { Result } from '../../../../src/domain/core/Result';

describe('SPARQLSecurityManager - BDD Tests', () => {
    let securityManager: SPARQLSecurityManager;
    let validator: EnhancedSPARQLValidator;
    let complexityAnalyzer: QueryComplexityAnalyzer;
    let rateLimiter: QueryRateLimiter;
    let timeoutManager: QueryTimeoutManager;
    let monitor: SecurityMonitor;

    beforeEach(() => {
        validator = new EnhancedSPARQLValidator();
        complexityAnalyzer = new QueryComplexityAnalyzer();
        rateLimiter = new QueryRateLimiter();
        timeoutManager = new QueryTimeoutManager();
        monitor = new SecurityMonitor();
        
        securityManager = new SPARQLSecurityManager(
            validator,
            complexityAnalyzer,
            rateLimiter,
            timeoutManager,
            monitor
        );
    });

    describe('Feature: SPARQL Security Validation', () => {
        describe('Scenario: Prevent SPARQL injection', () => {
            it('should reject query with injection attempt', async () => {
                // Given
                const maliciousQuery = `
                    SELECT * WHERE { 
                        ?s ?p ?o . 
                    } ; DROP GRAPH <http://example.com>
                `;

                // When
                const result = await securityManager.validateQuery(maliciousQuery);

                // Then
                expect(result.isSuccess).toBe(false);
                expect(result.getError()).toContain('injection');
                expect(monitor.getIncidents()).toHaveLength(1);
                expect(monitor.getIncidents()[0].type).toBe('injection_attempt');
            });

            it('should detect and block DROP operations', async () => {
                const queries = [
                    'SELECT * WHERE { ?s ?p ?o } ; DROP GRAPH <test>',
                    'DROP GRAPH <http://example.com>',
                    'CLEAR GRAPH <http://example.com>'
                ];

                for (const query of queries) {
                    const result = await securityManager.validateQuery(query);
                    expect(result.isSuccess).toBe(false);
                    expect(result.getError()).toContain('Unauthorized operation');
                }
            });
        });

        describe('Scenario: Block excessive query complexity', () => {
            it('should reject query exceeding complexity threshold', async () => {
                // Given - Create a complex query with many patterns
                const complexQuery = generateComplexQuery(100); // 100 triple patterns
                
                // When
                const result = await securityManager.validateQuery(complexQuery);
                
                // Then
                expect(result.isSuccess).toBe(false);
                expect(result.getError()).toContain('Query too complex');
                
                const analysis = complexityAnalyzer.analyze(complexQuery);
                expect(analysis.score).toBeGreaterThan(1000);
                expect(analysis.triplePatterns).toBe(100);
            });

            it('should provide detailed complexity metrics', () => {
                const query = `
                    SELECT * WHERE {
                        ?s ?p ?o .
                        OPTIONAL { ?s :name ?name }
                        FILTER(?price > 100)
                    }
                `;

                const metrics = complexityAnalyzer.analyze(query);
                
                expect(metrics).toMatchObject({
                    triplePatterns: 2,
                    optionalClauses: 1,
                    filters: 1,
                    estimatedCost: expect.any(Number)
                });
            });
        });

        describe('Scenario: Enforce rate limiting', () => {
            it('should block requests exceeding rate limit', async () => {
                // Given - Configure rate limit of 10 requests per second
                rateLimiter.configure({ requestsPerSecond: 10 });
                const clientId = 'test-client';

                // When - Make 11 requests rapidly
                const results = [];
                for (let i = 0; i < 11; i++) {
                    results.push(rateLimiter.checkLimit(clientId));
                }

                // Then - First 10 should pass, 11th should fail
                expect(results.slice(0, 10).every(r => r.isSuccess)).toBe(true);
                expect(results[10].isSuccess).toBe(false);
                expect(results[10].getError()).toContain('Rate limit exceeded');
            });

            it('should reset rate limit after time window', async () => {
                rateLimiter.configure({ 
                    requestsPerSecond: 10,
                    windowMs: 100 // 100ms window for testing
                });
                const clientId = 'test-client';

                // Exhaust rate limit
                for (let i = 0; i < 10; i++) {
                    rateLimiter.checkLimit(clientId);
                }

                // Should be blocked
                expect(rateLimiter.checkLimit(clientId).isSuccess).toBe(false);

                // Wait for window to reset
                await new Promise(resolve => setTimeout(resolve, 150));

                // Should be allowed again
                expect(rateLimiter.checkLimit(clientId).isSuccess).toBe(true);
            });
        });

        describe('Scenario: Query timeout enforcement', () => {
            it('should terminate long-running queries', async () => {
                // Given
                timeoutManager.configure({ maxExecutionTime: 100 }); // 100ms timeout

                // When - Execute a query that would take 200ms
                const longRunningQuery = async () => {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    return Result.ok('completed');
                };

                const result = await timeoutManager.executeWithTimeout(
                    'test-query',
                    longRunningQuery
                );

                // Then
                expect(result.isSuccess).toBe(false);
                expect(result.getError()).toContain('timeout');
            });

            it('should free resources on timeout', async () => {
                const resourceTracker = timeoutManager.getResourceTracker();
                
                const query = async () => {
                    resourceTracker.allocate('memory', 1000);
                    await new Promise(resolve => setTimeout(resolve, 200));
                };

                await timeoutManager.executeWithTimeout('test', query);
                
                expect(resourceTracker.getAllocated('memory')).toBe(0);
            });
        });

        describe('Scenario: Emergency mode activation', () => {
            it('should activate emergency mode on multiple incidents', () => {
                // Given - Simulate 10 security incidents
                for (let i = 0; i < 10; i++) {
                    monitor.reportIncident({
                        type: 'injection_attempt',
                        severity: 'high',
                        timestamp: Date.now(),
                        details: `Incident ${i}`
                    });
                }

                // Then
                expect(monitor.isEmergencyMode()).toBe(true);
                expect(monitor.getAlerts()).toContainEqual(
                    expect.objectContaining({
                        type: 'emergency_mode_activated',
                        severity: 'critical'
                    })
                );
            });

            it('should block non-admin queries in emergency mode', async () => {
                // Given
                monitor.activateEmergencyMode();
                
                // When - Non-admin query
                const result = await securityManager.validateQuery(
                    'SELECT * WHERE { ?s ?p ?o }',
                    { isAdmin: false }
                );

                // Then
                expect(result.isSuccess).toBe(false);
                expect(result.getError()).toContain('Emergency mode');
            });

            it('should allow admin queries in emergency mode', async () => {
                // Given
                monitor.activateEmergencyMode();
                
                // When - Admin query
                const result = await securityManager.validateQuery(
                    'SELECT * WHERE { ?s ?p ?o }',
                    { isAdmin: true }
                );

                // Then
                expect(result.isSuccess).toBe(true);
            });
        });

        describe('Scenario: Security incident logging', () => {
            it('should log incidents with complete details', () => {
                // When
                const incident = {
                    type: 'injection_attempt' as const,
                    severity: 'high' as const,
                    sourceIp: '192.168.1.100',
                    query: 'DROP GRAPH <test>',
                    timestamp: Date.now()
                };
                
                monitor.reportIncident(incident);

                // Then
                const logs = monitor.getIncidentLogs();
                expect(logs).toHaveLength(1);
                expect(logs[0]).toMatchObject({
                    timestamp: expect.any(String), // ISO-8601
                    threat_type: 'injection_attempt',
                    source_ip: '192.168.1.100',
                    query: expect.stringContaining('DROP'), // Sanitized
                    action_taken: 'blocked'
                });
            });

            it('should ensure logs are tamper-proof', () => {
                monitor.reportIncident({
                    type: 'dos_attempt',
                    severity: 'medium',
                    timestamp: Date.now()
                });

                const logs = monitor.getIncidentLogs();
                const originalLog = logs[0];
                
                // Attempt to modify
                originalLog.threat_type = 'modified';
                
                // Get logs again - should be unchanged
                const newLogs = monitor.getIncidentLogs();
                expect(newLogs[0].threat_type).toBe('dos_attempt');
            });
        });

        describe('Scenario: Whitelist trusted queries', () => {
            it('should bypass security checks for whitelisted queries', async () => {
                // Given
                const trustedQuery = 'SELECT * WHERE { ?s :type :Project }';
                securityManager.whitelistQuery(trustedQuery);

                // When - Execute with rate limiting exhausted
                for (let i = 0; i < 100; i++) {
                    await securityManager.validateQuery('OTHER QUERY');
                }
                
                const result = await securityManager.validateQuery(trustedQuery);

                // Then - Should still succeed
                expect(result.isSuccess).toBe(true);
            });

            it('should still apply resource limits to whitelisted queries', async () => {
                // Given
                const trustedQuery = 'SELECT * WHERE { ?s ?p ?o }';
                securityManager.whitelistQuery(trustedQuery);
                timeoutManager.configure({ maxExecutionTime: 50 });

                // When - Query that would timeout
                const result = await timeoutManager.executeWithTimeout(
                    trustedQuery,
                    async () => {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        return Result.ok('done');
                    }
                );

                // Then
                expect(result.isSuccess).toBe(false);
                expect(result.getError()).toContain('timeout');
            });
        });
    });
});

// Helper function to generate complex queries for testing
function generateComplexQuery(tripleCount: number): string {
    const patterns = [];
    for (let i = 0; i < tripleCount; i++) {
        patterns.push(`?s${i} ?p${i} ?o${i} .`);
    }
    return `SELECT * WHERE { ${patterns.join(' ')} }`;
}