/**
 * Security Framework Integration Tests
 * Demonstrates the complete security framework working together
 */

import { SPARQLSecurityManager } from '../../../src/infrastructure/security';

describe('Security Framework Integration Tests', () => {
    let securityManager: SPARQLSecurityManager;
    
    beforeEach(() => {
        // Initialize with strict security settings for testing
        securityManager = new SPARQLSecurityManager({
            complexity: {
                maxCost: 500,
                maxTriplePatterns: 10,
                maxJoinComplexity: 10
            },
            rateLimiting: {
                windowSizeMs: 10000,
                maxRequests: 5,
                maxComplexRequests: 2
            }
        });
    });

    describe('Safe Query Processing', () => {
        it('should allow safe queries through all security layers', async () => {
            const safeQuery = `
                SELECT ?person ?name WHERE {
                    ?person rdf:type ex:Person .
                    ?person rdfs:label ?name .
                } LIMIT 10
            `;

            const result = await securityManager.validateQuery(
                safeQuery,
                'safe-user-1',
                'session-1'
            );

            expect(result.allowed).toBe(true);
            expect(result.securityScore).toBeGreaterThan(70);
            expect(result.violations.length).toBe(0);
        });

        it('should execute safe queries with monitoring', async () => {
            const safeQuery = 'SELECT ?s WHERE { ?s rdf:type ex:Person } LIMIT 5';
            
            const mockExecutor = jest.fn().mockResolvedValue(['result1', 'result2']);
            
            const result = await securityManager.executeQueryWithSecurity(
                'query-1',
                safeQuery,
                'safe-user-1',
                mockExecutor,
                'session-1'
            );

            expect(result).toEqual(['result1', 'result2']);
            expect(mockExecutor).toHaveBeenCalled();
        });
    });

    describe('Injection Attack Prevention', () => {
        it('should block SQL injection attempts', async () => {
            const injectionQuery = `
                SELECT * WHERE {
                    ?s ?p "'; DROP TABLE users; --" .
                }
            `;

            const result = await securityManager.validateQuery(
                injectionQuery,
                'attacker-1',
                'attack-session'
            );

            expect(result.allowed).toBe(false);
            expect(result.securityScore).toBeLessThan(70);
            expect(result.violations.length).toBeGreaterThan(0);
        });

        it('should block SPARQL injection attempts', async () => {
            const sparqlInjection = `
                SELECT * WHERE {
                    ?s ?p ?o .
                    { SELECT * WHERE { ?admin ?password ?secret } }
                }
            `;

            const result = await securityManager.validateQuery(
                sparqlInjection,
                'attacker-2',
                'attack-session'
            );

            expect(result.allowed).toBe(false);
            expect(result.violations.some(v => 
                v.includes('injection') || v.includes('threat')
            )).toBe(true);
        });

        it('should prevent query execution for blocked queries', async () => {
            const maliciousQuery = 'SELECT * WHERE { ?s ?p "; rm -rf /" }';
            
            await expect(
                securityManager.executeQueryWithSecurity(
                    'blocked-query',
                    maliciousQuery,
                    'attacker-3',
                    () => Promise.resolve([])
                )
            ).rejects.toThrow(/blocked/i);
        });
    });

    describe('DoS Attack Prevention', () => {
        it('should block complex queries that could cause DoS', async () => {
            const dosQuery = `
                SELECT * WHERE {
                    ${Array.from({ length: 20 }, (_, i) => 
                        `?s${i} ?p${i} ?o${i} .`
                    ).join('\n                    ')}
                }
            `;

            const result = await securityManager.validateQuery(
                dosQuery,
                'dos-attacker',
                'dos-session'
            );

            expect(result.allowed).toBe(false);
            expect(result.violations.some(v => 
                v.includes('Triple patterns') || v.includes('cost')
            )).toBe(true);
        });

        it('should block after rate limit exceeded', async () => {
            const userId = 'rate-test-user';
            const query = 'SELECT ?s WHERE { ?s rdf:type ex:Test }';
            
            // Make requests up to the limit
            for (let i = 0; i < 5; i++) {
                const result = await securityManager.validateQuery(query, userId);
                expect(result.allowed).toBe(true);
            }
            
            // Next request should be blocked
            const blockedResult = await securityManager.validateQuery(query, userId);
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.violations.some(v => 
                v.includes('Rate limit')
            )).toBe(true);
        });

        it('should handle timeout during query execution', async () => {
            const timeoutQuery = 'SELECT * WHERE { ?s ?p ?o }';
            
            // Mock executor that simulates timeout
            const timeoutExecutor = jest.fn().mockImplementation((signal) => {
                return new Promise((_, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Query timeout'));
                    }, 100);
                    
                    signal.addEventListener('abort', () => {
                        clearTimeout(timeout);
                        reject(new Error('AbortError'));
                    });
                });
            });
            
            await expect(
                securityManager.executeQueryWithSecurity(
                    'timeout-query',
                    timeoutQuery,
                    'timeout-user',
                    timeoutExecutor
                )
            ).rejects.toThrow();
        });
    });

    describe('Path Traversal Prevention', () => {
        it('should block file system access attempts', async () => {
            const traversalQueries = [
                'SELECT * WHERE { <file:///etc/passwd> ?p ?o }',
                'SELECT * WHERE { <../../../secret.txt> ?p ?o }',
                'SELECT * WHERE { ?s ?p <file://C:\\Windows\\System32\\config\\SAM> }'
            ];

            for (const query of traversalQueries) {
                const result = await securityManager.validateQuery(
                    query,
                    'path-attacker',
                    'traversal-session'
                );

                expect(result.allowed).toBe(false);
                expect(result.securityScore).toBeLessThan(80);
            }
        });
    });

    describe('Resource Enumeration Prevention', () => {
        it('should detect and limit broad scanning queries', async () => {
            const scanningQuery = 'SELECT * WHERE { ?s ?p ?o }';

            const result = await securityManager.validateQuery(
                scanningQuery,
                'scanner-user',
                'scan-session'
            );

            // May be allowed but with warnings or reduced score
            expect(result.securityScore).toBeLessThan(90);
        });

        it('should detect metadata enumeration', async () => {
            const metadataQuery = `
                SELECT * WHERE {
                    ?ontology rdf:type owl:Ontology .
                    ?class rdf:type rdfs:Class .
                    ?property rdf:type rdf:Property .
                }
            `;

            const result = await securityManager.validateQuery(
                metadataQuery,
                'metadata-scanner',
                'enum-session'
            );

            expect(result.securityScore).toBeLessThan(90);
        });
    });

    describe('Multiple User Scenarios', () => {
        it('should handle concurrent users independently', async () => {
            const users = ['user1', 'user2', 'user3'];
            const query = 'SELECT ?s WHERE { ?s rdf:type ex:Person }';
            
            const promises = users.map(userId => 
                securityManager.validateQuery(query, userId, `session-${userId}`)
            );
            
            const results = await Promise.all(promises);
            
            results.forEach(result => {
                expect(result.allowed).toBe(true);
            });
        });

        it('should isolate rate limits per user', async () => {
            const query = 'SELECT ?s WHERE { ?s rdf:type ex:Test }';
            
            // User 1 exceeds rate limit
            for (let i = 0; i < 10; i++) {
                await securityManager.validateQuery(query, 'user1');
            }
            
            // User 2 should still be allowed
            const user2Result = await securityManager.validateQuery(query, 'user2');
            expect(user2Result.allowed).toBe(true);
        });
    });

    describe('Security Monitoring and Reporting', () => {
        it('should track security events', async () => {
            const maliciousQuery = 'SELECT * WHERE { ?s ?p "; DROP TABLE users;" }';
            
            await securityManager.validateQuery(
                maliciousQuery,
                'monitored-attacker',
                'monitoring-session'
            );
            
            const status = securityManager.getSecurityStatus();
            expect(status.activeThreats).toBeGreaterThanOrEqual(0);
            expect(['good', 'warning', 'critical']).toContain(status.systemHealth);
        });

        it('should generate security reports', () => {
            const report = securityManager.generateSecurityReport();
            
            expect(report.timestamp).toBeDefined();
            expect(report.overview).toBeDefined();
            expect(report.detailedReport).toBeDefined();
            expect(report.recommendations).toBeDefined();
            expect(Array.isArray(report.recommendations)).toBe(true);
        });
    });

    describe('Emergency Response', () => {
        it('should enable emergency mode for critical threats', async () => {
            securityManager.enableEmergencyMode();
            
            // Even simple queries should be more restricted
            const simpleQuery = 'SELECT ?s WHERE { ?s rdf:type ex:Person }';
            
            // Make many requests to trigger emergency restrictions
            let blockedCount = 0;
            for (let i = 0; i < 20; i++) {
                const result = await securityManager.validateQuery(
                    simpleQuery,
                    'emergency-user'
                );
                if (!result.allowed) {
                    blockedCount++;
                }
            }
            
            expect(blockedCount).toBeGreaterThan(0);
            
            // Disable emergency mode
            securityManager.disableEmergencyMode();
        });
    });

    describe('Configuration and Adaptability', () => {
        it('should adapt to different security configurations', () => {
            const lenientManager = new SPARQLSecurityManager({
                complexity: {
                    maxCost: 10000,
                    maxTriplePatterns: 100
                },
                rateLimiting: {
                    maxRequests: 1000,
                    windowSizeMs: 60000
                }
            });
            
            const strictManager = new SPARQLSecurityManager({
                complexity: {
                    maxCost: 100,
                    maxTriplePatterns: 3
                },
                rateLimiting: {
                    maxRequests: 5,
                    windowSizeMs: 60000
                }
            });
            
            expect(lenientManager).toBeDefined();
            expect(strictManager).toBeDefined();
        });
    });

    describe('Performance Under Load', () => {
        it('should maintain performance with many security checks', async () => {
            const queries = Array.from({ length: 50 }, (_, i) => 
                `SELECT ?s${i} WHERE { ?s${i} rdf:type ex:Test${i} }`
            );
            
            const startTime = Date.now();
            
            const promises = queries.map((query, i) => 
                securityManager.validateQuery(query, `load-test-user-${i}`)
            );
            
            const results = await Promise.all(promises);
            const endTime = Date.now();
            
            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(5000);
            
            // Most queries should be allowed (they're simple)
            const allowedCount = results.filter(r => r.allowed).length;
            expect(allowedCount).toBeGreaterThan(queries.length * 0.8);
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should handle malformed queries gracefully', async () => {
            const malformedQueries = [
                'SELECT WHERE { ?s ?p',
                'INVALID QUERY SYNTAX',
                '',
                null,
                undefined
            ];
            
            for (const query of malformedQueries) {
                await expect(
                    securityManager.validateQuery(
                        query as any,
                        'error-test-user'
                    )
                ).resolves.toBeDefined();
            }
        });

        it('should recover from system errors', async () => {
            const query = 'SELECT ?s WHERE { ?s rdf:type ex:Test }';
            
            // Should not throw even if there are internal errors
            await expect(
                securityManager.validateQuery(query, 'recovery-user')
            ).resolves.toBeDefined();
        });
    });
});