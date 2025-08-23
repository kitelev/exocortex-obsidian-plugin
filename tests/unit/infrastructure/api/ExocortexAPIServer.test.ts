import { ExocortexAPIServer } from '../../../../src/infrastructure/api/ExocortexAPIServer';
import { SPARQLEngine } from '../../../../src/application/SPARQLEngine';
import { AssetRepository } from '../../../../src/infrastructure/repositories/AssetRepository';
import { Result } from '../../../../src/domain/core/Result';
import express from 'express';
import request from 'supertest';

describe('ExocortexAPIServer - BDD Tests', () => {
    let apiServer: ExocortexAPIServer;
    let app: express.Application;
    let sparqlEngine: jest.Mocked<SPARQLEngine>;
    let assetRepository: jest.Mocked<AssetRepository>;
    const validApiKey = 'sk-valid-key-123';

    beforeEach(() => {
        // Mock dependencies
        sparqlEngine = {
            executeQuery: jest.fn(),
            validateQuery: jest.fn()
        } as any;

        assetRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByClass: jest.fn(),
            delete: jest.fn()
        } as any;

        // Create server
        apiServer = new ExocortexAPIServer(sparqlEngine, assetRepository);
        app = apiServer.createApp();
        
        // Configure test API key
        apiServer.setApiKey(validApiKey);
    });

    afterEach(() => {
        apiServer.stop();
    });

    describe('Feature: API Authentication', () => {
        describe('Scenario: Authenticate with valid API key', () => {
            it('should accept valid API key', async () => {
                // When
                const response = await request(app)
                    .get('/api/health')
                    .set('Authorization', `Bearer ${validApiKey}`);

                // Then
                expect(response.status).toBe(200);
                expect(response.body.status).toBe('healthy');
            });
        });

        describe('Scenario: Reject invalid API key', () => {
            it('should reject invalid API key', async () => {
                // When
                const response = await request(app)
                    .get('/api/health')
                    .set('Authorization', 'Bearer invalid-key');

                // Then
                expect(response.status).toBe(401);
                expect(response.body.error).toContain('Invalid API key');
            });
        });

        describe('Scenario: Reject missing API key', () => {
            it('should reject request without Authorization header', async () => {
                // When
                const response = await request(app)
                    .get('/api/health');

                // Then
                expect(response.status).toBe(401);
                expect(response.body.error).toContain('API key required');
            });
        });

        describe('Scenario: API key expiration', () => {
            it('should reject expired API key', async () => {
                // Given
                const expiredKey = 'sk-expired-key';
                apiServer.setApiKey(expiredKey, { expiresAt: Date.now() - 1000 });

                // When
                const response = await request(app)
                    .get('/api/health')
                    .set('Authorization', `Bearer ${expiredKey}`);

                // Then
                expect(response.status).toBe(401);
                expect(response.body.error).toContain('API key expired');
            });
        });
    });

    describe('Feature: API Endpoints', () => {
        describe('Scenario: Execute SPARQL query via API', () => {
            it('should execute SPARQL query and return results', async () => {
                // Given
                const queryResult = {
                    type: 'SELECT' as const,
                    variables: ['s', 'p', 'o'],
                    bindings: [
                        { s: ':Alice', p: ':knows', o: ':Bob' },
                        { s: ':Bob', p: ':knows', o: ':Charlie' }
                    ]
                };
                
                sparqlEngine.executeQuery.mockResolvedValue(Result.ok(queryResult));

                // When
                const response = await request(app)
                    .post('/api/sparql/query')
                    .set('Authorization', `Bearer ${validApiKey}`)
                    .send({
                        query: 'SELECT * WHERE { ?s ?p ?o } LIMIT 10',
                        format: 'json'
                    });

                // Then
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    type: 'SELECT',
                    variables: ['s', 'p', 'o'],
                    bindings: expect.arrayContaining([
                        expect.objectContaining({ s: ':Alice' })
                    ])
                });
                expect(response.body.bindings).toHaveLength(2);
            });

            it('should validate query before execution', async () => {
                // Given
                sparqlEngine.validateQuery.mockReturnValue(
                    Result.fail('Invalid SPARQL syntax')
                );

                // When
                const response = await request(app)
                    .post('/api/sparql/query')
                    .set('Authorization', `Bearer ${validApiKey}`)
                    .send({
                        query: 'INVALID QUERY',
                        format: 'json'
                    });

                // Then
                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Invalid SPARQL syntax');
            });
        });

        describe('Scenario: Create asset via API', () => {
            it('should create asset and return UUID', async () => {
                // Given
                const assetId = '123e4567-e89b-12d3-a456-426614174000';
                assetRepository.save.mockResolvedValue(Result.ok(assetId));

                // When
                const response = await request(app)
                    .post('/api/assets')
                    .set('Authorization', `Bearer ${validApiKey}`)
                    .send({
                        class: 'Project',
                        properties: {
                            title: 'New Project',
                            status: 'active'
                        }
                    });

                // Then
                expect(response.status).toBe(201);
                expect(response.body).toMatchObject({
                    id: assetId,
                    message: 'Asset created successfully'
                });
                expect(assetRepository.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        class: 'Project',
                        properties: expect.objectContaining({
                            title: 'New Project'
                        })
                    })
                );
            });

            it('should validate required fields', async () => {
                // When
                const response = await request(app)
                    .post('/api/assets')
                    .set('Authorization', `Bearer ${validApiKey}`)
                    .send({
                        // Missing class
                        properties: { title: 'Test' }
                    });

                // Then
                expect(response.status).toBe(400);
                expect(response.body.error).toContain('class is required');
            });
        });

        describe('Scenario: Get knowledge graph via API', () => {
            it('should return graph structure', async () => {
                // Given
                sparqlEngine.getGraph = jest.fn().mockResolvedValue(Result.ok({
                    nodes: [
                        { id: '1', label: 'Alice', type: 'Person' },
                        { id: '2', label: 'Bob', type: 'Person' }
                    ],
                    edges: [
                        { source: '1', target: '2', label: 'knows' }
                    ],
                    metadata: {
                        nodeCount: 2,
                        edgeCount: 1,
                        generated: new Date().toISOString()
                    }
                }));

                // When
                const response = await request(app)
                    .get('/api/graph?format=json')
                    .set('Authorization', `Bearer ${validApiKey}`);

                // Then
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    nodes: expect.arrayContaining([
                        expect.objectContaining({ label: 'Alice' })
                    ]),
                    edges: expect.arrayContaining([
                        expect.objectContaining({ label: 'knows' })
                    ]),
                    metadata: expect.objectContaining({
                        nodeCount: 2,
                        edgeCount: 1
                    })
                });
            });
        });

        describe('Scenario: Health check endpoint', () => {
            it('should return health status', async () => {
                // When
                const response = await request(app)
                    .get('/api/health')
                    .set('Authorization', `Bearer ${validApiKey}`);

                // Then
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    status: 'healthy',
                    uptime: expect.any(Number),
                    version: '3.17.1',
                    services: {
                        sparql: 'operational',
                        storage: 'operational',
                        cache: 'operational'
                    }
                });
            });

            it('should report degraded status when service is down', async () => {
                // Given
                sparqlEngine.healthCheck = jest.fn().mockResolvedValue(false);

                // When
                const response = await request(app)
                    .get('/api/health')
                    .set('Authorization', `Bearer ${validApiKey}`);

                // Then
                expect(response.status).toBe(200);
                expect(response.body.services.sparql).toBe('degraded');
            });
        });

        describe('Scenario: API error handling', () => {
            it('should handle invalid JSON gracefully', async () => {
                // When
                const response = await request(app)
                    .post('/api/sparql/query')
                    .set('Authorization', `Bearer ${validApiKey}`)
                    .set('Content-Type', 'application/json')
                    .send('{ invalid json');

                // Then
                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Invalid JSON');
            });

            it('should handle internal server errors', async () => {
                // Given
                sparqlEngine.executeQuery.mockRejectedValue(
                    new Error('Database connection failed')
                );

                // When
                const response = await request(app)
                    .post('/api/sparql/query')
                    .set('Authorization', `Bearer ${validApiKey}`)
                    .send({
                        query: 'SELECT * WHERE { ?s ?p ?o }',
                        format: 'json'
                    });

                // Then
                expect(response.status).toBe(500);
                expect(response.body.error).toContain('Internal server error');
                // Error should be logged but not exposed to client
                expect(response.body.error).not.toContain('Database connection');
            });
        });

        describe('Scenario: CORS support', () => {
            it('should include CORS headers', async () => {
                // When
                const response = await request(app)
                    .options('/api/health')
                    .set('Origin', 'https://example.com')
                    .set('Access-Control-Request-Method', 'GET');

                // Then
                expect(response.status).toBe(204);
                expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
                expect(response.headers['access-control-allow-methods']).toContain('GET');
                expect(response.headers['access-control-allow-methods']).toContain('POST');
                expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
                expect(response.headers['access-control-allow-headers']).toContain('Authorization');
            });

            it('should handle preflight requests', async () => {
                // When
                const response = await request(app)
                    .options('/api/sparql/query')
                    .set('Origin', 'https://app.example.com')
                    .set('Access-Control-Request-Method', 'POST')
                    .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

                // Then
                expect(response.status).toBe(204);
                expect(response.headers['access-control-allow-credentials']).toBe('true');
                expect(response.headers['access-control-max-age']).toBe('86400'); // 24 hours
            });
        });
    });

    describe('Feature: Rate Limiting', () => {
        it('should enforce rate limits per API key', async () => {
            // Given - Configure rate limit of 5 requests per second
            apiServer.configureRateLimit({ requestsPerSecond: 5 });

            // When - Make 6 requests rapidly
            const requests = [];
            for (let i = 0; i < 6; i++) {
                requests.push(
                    request(app)
                        .get('/api/health')
                        .set('Authorization', `Bearer ${validApiKey}`)
                );
            }
            const responses = await Promise.all(requests);

            // Then - Last request should be rate limited
            const statuses = responses.map(r => r.status);
            expect(statuses.filter(s => s === 200)).toHaveLength(5);
            expect(statuses.filter(s => s === 429)).toHaveLength(1);
            
            const rateLimitedResponse = responses.find(r => r.status === 429);
            expect(rateLimitedResponse?.headers['retry-after']).toBeDefined();
            expect(rateLimitedResponse?.body.error).toContain('Rate limit exceeded');
        });
    });

    describe('Feature: API Documentation', () => {
        it('should serve OpenAPI documentation', async () => {
            // When
            const response = await request(app)
                .get('/api/docs')
                .set('Authorization', `Bearer ${validApiKey}`);

            // Then
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                openapi: '3.1.0',
                info: {
                    title: 'Exocortex API',
                    version: '3.17.1'
                },
                paths: expect.objectContaining({
                    '/api/health': expect.any(Object),
                    '/api/sparql/query': expect.any(Object),
                    '/api/assets': expect.any(Object),
                    '/api/graph': expect.any(Object)
                })
            });
        });
    });
});