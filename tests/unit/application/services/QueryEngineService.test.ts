import { QueryEngineService } from '../../../../src/application/services/QueryEngineService';
import { QueryEngineConfig } from '../../../../src/domain/entities/QueryEngineConfig';
import { Result } from '../../../../src/domain/core/Result';
import { IQueryEngine, QueryEngineType, QueryResult, QueryContext } from '../../../../src/domain/ports/IQueryEngine';

// Mock query engine factory
const mockQueryEngineFactory = {
    createQueryEngine: jest.fn(),
    getAvailableEngines: jest.fn(() => ['dataview', 'native', 'sparql']),
    isEngineAvailable: jest.fn(() => true),
    getDiagnostics: jest.fn(() => ({}))
};

// Mock query engine
const mockQueryEngine: jest.Mocked<IQueryEngine> = {
    getType: jest.fn(() => 'dataview'),
    isAvailable: jest.fn(() => true),
    executeQuery: jest.fn(),
    renderQuery: jest.fn(),
    getPages: jest.fn(),
    getPageMetadata: jest.fn(),
    validateQuery: jest.fn(() => Result.ok(true))
};

describe('QueryEngineService', () => {
    let service: QueryEngineService;
    let config: QueryEngineConfig;

    beforeEach(() => {
        config = QueryEngineConfig.create({
            preferredEngine: 'dataview',
            fallbackEngine: 'native',
            autoDetect: true,
            enableCache: true,
            cacheTimeout: 5,
            maxCacheSize: 100
        }).getValue()!;

        service = new QueryEngineService(mockQueryEngineFactory, config);

        // Reset mocks
        jest.clearAllMocks();
        mockQueryEngineFactory.createQueryEngine.mockResolvedValue(Result.ok(mockQueryEngine));
    });

    afterEach(() => {
        service.clearCache();
    });

    describe('Initialization', () => {
        it('should initialize with provided config', () => {
            expect(service).toBeInstanceOf(QueryEngineService);
            
            const diagnostics = service.getDiagnostics();
            expect(diagnostics.config.preferred).toBe('dataview');
            expect(diagnostics.config.fallback).toBe('native');
        });

        it('should initialize with default config', () => {
            const defaultService = new QueryEngineService(mockQueryEngineFactory);
            const diagnostics = defaultService.getDiagnostics();
            
            expect(diagnostics.config).toBeDefined();
        });
    });

    describe('Query Execution', () => {
        const mockQueryResult: QueryResult = {
            success: true,
            data: [{ name: 'Test', value: 123 }],
            metadata: { source: 'test' },
            executionTime: 50,
            fromCache: false
        };

        beforeEach(() => {
            mockQueryEngine.executeQuery.mockResolvedValue(Result.ok(mockQueryResult));
        });

        it('should execute query with preferred engine', async () => {
            const query = 'LIST FROM "folder"';
            const context: QueryContext = { currentFile: 'test.md' };

            const result = await service.executeQuery(query, context);

            expect(result.isSuccess).toBe(true);
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledWith('dataview');
            expect(mockQueryEngine.executeQuery).toHaveBeenCalledWith(query, context);
        });

        it('should use engine preference override', async () => {
            const query = 'SELECT ?s ?p ?o WHERE { ?s ?p ?o }';
            
            await service.executeQuery(query, undefined, 'sparql');
            
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledWith('sparql');
        });

        it('should cache successful results', async () => {
            const query = 'LIST FROM "folder"';
            
            // First execution
            const result1 = await service.executeQuery(query);
            expect(result1.isSuccess).toBe(true);
            expect(mockQueryEngine.executeQuery).toHaveBeenCalledTimes(1);
            
            // Second execution should use cache
            const result2 = await service.executeQuery(query);
            expect(result2.isSuccess).toBe(true);
            expect(mockQueryEngine.executeQuery).toHaveBeenCalledTimes(1); // Not called again
        });

        it('should not cache failed results', async () => {
            const query = 'INVALID QUERY';
            mockQueryEngine.executeQuery.mockResolvedValue(Result.fail('Query failed'));
            
            // First execution
            const result1 = await service.executeQuery(query);
            expect(result1.isSuccess).toBe(false);
            
            // Second execution should try again
            const result2 = await service.executeQuery(query);
            expect(mockQueryEngine.executeQuery).toHaveBeenCalledTimes(2);
        });

        it('should respect cache timeout', async () => {
            jest.useFakeTimers();
            
            const query = 'LIST FROM "folder"';
            
            // First execution
            await service.executeQuery(query);
            expect(mockQueryEngine.executeQuery).toHaveBeenCalledTimes(1);
            
            // Advance time beyond cache timeout
            jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
            
            // Second execution should not use expired cache
            await service.executeQuery(query);
            expect(mockQueryEngine.executeQuery).toHaveBeenCalledTimes(2);
            
            jest.useRealTimers();
        });

        it('should include context in cache key', async () => {
            const query = 'LIST FROM "folder"';
            const context1: QueryContext = { currentFile: 'file1.md' };
            const context2: QueryContext = { currentFile: 'file2.md' };
            
            await service.executeQuery(query, context1);
            await service.executeQuery(query, context2);
            
            // Should execute twice due to different contexts
            expect(mockQueryEngine.executeQuery).toHaveBeenCalledTimes(2);
        });
    });

    describe('Engine Fallback', () => {
        it('should fallback to alternative engine on failure', async () => {
            const mockFallbackEngine: jest.Mocked<IQueryEngine> = {
                ...mockQueryEngine,
                getType: jest.fn(() => 'native')
            };

            // Primary engine fails
            mockQueryEngineFactory.createQueryEngine
                .mockResolvedValueOnce(Result.fail('Primary engine failed'))
                .mockResolvedValueOnce(Result.ok(mockFallbackEngine));

            mockFallbackEngine.executeQuery.mockResolvedValue(Result.ok({
                success: true,
                data: [],
                metadata: {},
                executionTime: 100,
                fromCache: false
            }));

            const query = 'LIST FROM "folder"';
            const result = await service.executeQuery(query);

            expect(result.isSuccess).toBe(true);
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledWith('dataview');
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledWith('native');
        });

        it('should auto-detect available engine when configured engines fail', async () => {
            const mockAutoEngine: jest.Mocked<IQueryEngine> = {
                ...mockQueryEngine,
                getType: jest.fn(() => 'sparql')
            };

            // All configured engines fail
            mockQueryEngineFactory.createQueryEngine
                .mockResolvedValueOnce(Result.fail('Primary failed'))
                .mockResolvedValueOnce(Result.fail('Fallback failed'))
                .mockResolvedValueOnce(Result.ok(mockAutoEngine));

            mockAutoEngine.executeQuery.mockResolvedValue(Result.ok({
                success: true,
                data: [],
                metadata: {},
                executionTime: 100,
                fromCache: false
            }));

            const query = 'LIST FROM "folder"';
            const result = await service.executeQuery(query);

            expect(result.isSuccess).toBe(true);
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledTimes(3);
        });

        it('should fail when no engines are available', async () => {
            mockQueryEngineFactory.createQueryEngine
                .mockResolvedValue(Result.fail('No engines available'));

            const query = 'LIST FROM "folder"';
            const result = await service.executeQuery(query);

            expect(result.isSuccess).toBe(false);
            expect(result.getError()).toBe('No query engines available');
        });
    });

    describe('Engine Reuse', () => {
        it('should reuse current engine if available and matches', async () => {
            const query1 = 'LIST FROM "folder1"';
            const query2 = 'LIST FROM "folder2"';
            
            await service.executeQuery(query1);
            await service.executeQuery(query2);
            
            // Should only create engine once
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledTimes(1);
        });

        it('should create new engine if type changed', async () => {
            const mockSparqlEngine: jest.Mocked<IQueryEngine> = {
                ...mockQueryEngine,
                getType: jest.fn(() => 'sparql')
            };

            mockQueryEngineFactory.createQueryEngine
                .mockResolvedValueOnce(Result.ok(mockQueryEngine))
                .mockResolvedValueOnce(Result.ok(mockSparqlEngine));

            await service.executeQuery('LIST FROM "folder"');
            await service.executeQuery('SELECT ?s WHERE { ?s ?p ?o }', undefined, 'sparql');
            
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledTimes(2);
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenNthCalledWith(1, 'dataview');
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenNthCalledWith(2, 'sparql');
        });

        it('should create new engine if current engine becomes unavailable', async () => {
            await service.executeQuery('LIST FROM "folder"');
            
            // Make current engine unavailable
            mockQueryEngine.isAvailable.mockReturnValue(false);
            
            await service.executeQuery('LIST FROM "folder2"');
            
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledTimes(2);
        });
    });

    describe('Render Query', () => {
        it('should render query to container', async () => {
            const container = document.createElement('div');
            const query = 'LIST FROM "folder"';
            
            mockQueryEngine.renderQuery.mockResolvedValue(Result.ok(undefined));
            
            const result = await service.renderQuery(container, query);
            
            expect(result.isSuccess).toBe(true);
            expect(mockQueryEngine.renderQuery).toHaveBeenCalledWith(container, query, undefined);
        });

        it('should show error in container when engine fails', async () => {
            const container = document.createElement('div');
            const query = 'INVALID QUERY';
            
            mockQueryEngineFactory.createQueryEngine.mockResolvedValue(Result.fail('Engine failed'));
            
            const result = await service.renderQuery(container, query);
            
            expect(result.isSuccess).toBe(false);
            expect(container.querySelector('.exocortex-error')).toBeTruthy();
            expect(container.textContent).toContain('Query Engine Error: Engine failed');
        });
    });

    describe('Get Pages', () => {
        it('should get pages from engine', async () => {
            const pages = [
                { path: 'file1.md', name: 'File 1' },
                { path: 'file2.md', name: 'File 2' }
            ];
            
            mockQueryEngine.getPages.mockResolvedValue(Result.ok(pages));
            
            const result = await service.getPages('folder');
            
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual(pages);
            expect(mockQueryEngine.getPages).toHaveBeenCalledWith('folder');
        });

        it('should handle engine errors for getPages', async () => {
            mockQueryEngineFactory.createQueryEngine.mockResolvedValue(Result.fail('Engine not available'));
            
            const result = await service.getPages('folder');
            
            expect(result.isSuccess).toBe(false);
        });
    });

    describe('Get Page Metadata', () => {
        it('should get page metadata from engine', async () => {
            const metadata = {
                frontmatter: { title: 'Test Page', tags: ['test'] },
                size: 1024,
                created: new Date(),
                modified: new Date()
            };
            
            mockQueryEngine.getPageMetadata.mockResolvedValue(Result.ok(metadata));
            
            const result = await service.getPageMetadata('file.md');
            
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual(metadata);
            expect(mockQueryEngine.getPageMetadata).toHaveBeenCalledWith('file.md');
        });
    });

    describe('Query Validation', () => {
        it('should validate query syntax', async () => {
            mockQueryEngine.validateQuery.mockReturnValue(Result.ok(true));
            
            const result = await service.validateQuery('LIST FROM "folder"');
            
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toBe(true);
            expect(mockQueryEngine.validateQuery).toHaveBeenCalledWith('LIST FROM "folder"');
        });

        it('should handle validation with specific engine type', async () => {
            const mockSparqlEngine: jest.Mocked<IQueryEngine> = {
                ...mockQueryEngine,
                getType: jest.fn(() => 'sparql'),
                validateQuery: jest.fn(() => Result.ok(false))
            };
            
            mockQueryEngineFactory.createQueryEngine.mockResolvedValue(Result.ok(mockSparqlEngine));
            
            const result = await service.validateQuery('INVALID SPARQL', 'sparql');
            
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toBe(false);
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledWith('sparql');
        });
    });

    describe('Engine Information', () => {
        it('should get available engines', () => {
            const engines = service.getAvailableEngines();
            
            expect(engines).toEqual(['dataview', 'native', 'sparql']);
            expect(mockQueryEngineFactory.getAvailableEngines).toHaveBeenCalled();
        });

        it('should check engine availability', () => {
            const isAvailable = service.isEngineAvailable('dataview');
            
            expect(isAvailable).toBe(true);
            expect(mockQueryEngineFactory.isEngineAvailable).toHaveBeenCalledWith('dataview');
        });
    });

    describe('Configuration Management', () => {
        it('should update configuration', () => {
            const newConfig = QueryEngineConfig.create({
                preferredEngine: 'sparql',
                enableCache: false
            }).getValue()!;
            
            service.updateConfig(newConfig);
            
            const diagnostics = service.getDiagnostics();
            expect(diagnostics.config.preferred).toBe('sparql');
            expect(diagnostics.config.cacheEnabled).toBe(false);
        });

        it('should clear cache when caching disabled', () => {
            const clearCacheSpy = jest.spyOn(service, 'clearCache');
            
            const newConfig = QueryEngineConfig.create({
                enableCache: false
            }).getValue()!;
            
            service.updateConfig(newConfig);
            
            expect(clearCacheSpy).toHaveBeenCalled();
        });

        it('should reset current engine on config update', async () => {
            // Execute query to create current engine
            await service.executeQuery('LIST FROM "folder"');
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledTimes(1);
            
            // Update config
            const newConfig = QueryEngineConfig.create({
                preferredEngine: 'native'
            }).getValue()!;
            service.updateConfig(newConfig);
            
            // Next query should create new engine
            await service.executeQuery('LIST FROM "folder"');
            expect(mockQueryEngineFactory.createQueryEngine).toHaveBeenCalledTimes(2);
        });
    });

    describe('Cache Management', () => {
        it('should clear all caches', async () => {
            // Add something to cache
            await service.executeQuery('LIST FROM "folder"');
            
            const statsBefore = service.getCacheStats();
            expect(statsBefore.size).toBeGreaterThan(0);
            
            service.clearCache();
            
            const statsAfter = service.getCacheStats();
            expect(statsAfter.size).toBe(0);
        });

        it('should provide cache statistics', async () => {
            await service.executeQuery('LIST FROM "folder1"');
            await service.executeQuery('LIST FROM "folder2"');
            
            const stats = service.getCacheStats();
            
            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBe(100);
            expect(typeof stats.hitRate).toBe('number');
        });

        it('should respect cache size limit', async () => {
            // Update config with small cache size
            const smallCacheConfig = QueryEngineConfig.create({
                maxCacheSize: 2
            }).getValue()!;
            service.updateConfig(smallCacheConfig);
            
            // Add more queries than cache size
            await service.executeQuery('LIST FROM "folder1"');
            await service.executeQuery('LIST FROM "folder2"');
            await service.executeQuery('LIST FROM "folder3"');
            
            const stats = service.getCacheStats();
            expect(stats.size).toBeLessThanOrEqual(2);
        });
    });

    describe('Diagnostics', () => {
        it('should provide comprehensive diagnostics', async () => {
            await service.executeQuery('LIST FROM "folder"');
            
            const diagnostics = service.getDiagnostics();
            
            expect(diagnostics).toMatchObject({
                currentEngine: 'dataview',
                availableEngines: ['dataview', 'native', 'sparql'],
                config: {
                    preferred: 'dataview',
                    fallback: 'native',
                    autoDetect: true,
                    cacheEnabled: true
                },
                cache: {
                    size: expect.any(Number),
                    hitRate: expect.any(Number),
                    maxSize: 100
                },
                factory: {}
            });
        });

        it('should show null current engine when none active', () => {
            const diagnostics = service.getDiagnostics();
            
            expect(diagnostics.currentEngine).toBeNull();
        });
    });

    describe('Error Handling', () => {
        it('should handle factory errors gracefully', async () => {
            mockQueryEngineFactory.createQueryEngine.mockResolvedValue(
                Result.fail('Factory initialization failed')
            );
            
            const result = await service.executeQuery('LIST FROM "folder"');
            
            expect(result.isSuccess).toBe(false);
            expect(result.getError()).toContain('Factory initialization failed');
        });

        it('should handle engine execution errors', async () => {
            mockQueryEngine.executeQuery.mockResolvedValue(
                Result.fail('Query execution failed')
            );
            
            const result = await service.executeQuery('LIST FROM "folder"');
            
            expect(result.isSuccess).toBe(false);
            expect(result.getError()).toBe('Query execution failed');
        });

        it('should handle validation errors', async () => {
            mockQueryEngineFactory.createQueryEngine.mockResolvedValue(
                Result.fail('Validation failed')
            );
            
            const result = await service.validateQuery('INVALID');
            
            expect(result.isSuccess).toBe(false);
        });
    });

    describe('Offline Operation', () => {
        it('should work without network connectivity', async () => {
            // Simulate offline environment
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });
            
            const result = await service.executeQuery('LIST FROM "folder"');
            
            expect(result.isSuccess).toBe(true);
            expect(mockQueryEngine.executeQuery).toHaveBeenCalled();
        });

        it('should cache queries for offline replay', async () => {
            // Execute query while online
            await service.executeQuery('LIST FROM "folder"');
            
            // Go offline
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });
            
            // Should still work from cache
            const result = await service.executeQuery('LIST FROM "folder"');
            expect(result.isSuccess).toBe(true);
        });
    });
});