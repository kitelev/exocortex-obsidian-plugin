import { SPARQLAutocompleteService, AutocompleteOptions } from '../../../../src/application/services/SPARQLAutocompleteService';
import { SPARQLSuggestion, SuggestionType } from '../../../../src/domain/autocomplete/SPARQLSuggestion';
import { ISuggestionRepository } from '../../../../src/domain/repositories/ISuggestionRepository';
import { Result } from '../../../../src/domain/core/Result';
import { Graph } from '../../../../src/domain/semantic/core/Graph';

interface PerformanceBenchmark {
    operation: string;
    iterations: number;
    maxDuration: number;
    actualDuration: number;
    averagePerOp: number;
    passed: boolean;
}

describe('SPARQLAutocompleteService Performance Tests', () => {
    let service: SPARQLAutocompleteService;
    let mockSuggestionRepository: jest.Mocked<ISuggestionRepository>;
    let mockGraph: jest.Mocked<Graph>;
    let performanceResults: PerformanceBenchmark[] = [];

    beforeAll(() => {
        // Create realistic mock suggestions for performance testing
        const createMockSuggestions = (count: number, type: SuggestionType): SPARQLSuggestion[] => {
            return Array.from({ length: count }, (_, i) => 
                SPARQLSuggestion.create({
                    id: `${type}-${i}`,
                    text: `${type}_ITEM_${i}`,
                    insertText: `${type}_ITEM_${i} `,
                    type,
                    confidence: Math.random() * 0.5 + 0.5,
                    contextualScore: Math.random() * 0.5 + 0.5,
                    metadata: {
                        description: `Description for ${type} item ${i}`,
                        examples: [`Example ${i}A`, `Example ${i}B`]
                    }
                })
            );
        };

        // Create mock repository with realistic response times
        mockSuggestionRepository = {
            findKeywordSuggestions: jest.fn(),
            findPropertySuggestions: jest.fn(),
            findClassSuggestions: jest.fn(),
            findVariableSuggestions: jest.fn(),
            findNamespaceSuggestions: jest.fn(),
            findFunctionSuggestions: jest.fn(),
            findTemplateSuggestions: jest.fn(),
            updateUsageStatistics: jest.fn(),
            getPopularSuggestions: jest.fn()
        };

        // Setup repository responses with realistic delays
        const setupRepositoryResponses = () => {
            mockSuggestionRepository.findKeywordSuggestions.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 5)); // 0-5ms delay
                return Result.ok(createMockSuggestions(20, SuggestionType.KEYWORD));
            });

            mockSuggestionRepository.findPropertySuggestions.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 10)); // 0-10ms delay
                return Result.ok(createMockSuggestions(50, SuggestionType.PROPERTY));
            });

            mockSuggestionRepository.findClassSuggestions.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 8)); // 0-8ms delay
                return Result.ok(createMockSuggestions(30, SuggestionType.CLASS));
            });

            mockSuggestionRepository.findVariableSuggestions.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 3)); // 0-3ms delay
                return Result.ok(createMockSuggestions(15, SuggestionType.VARIABLE));
            });

            mockSuggestionRepository.findNamespaceSuggestions.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 4)); // 0-4ms delay
                return Result.ok(createMockSuggestions(10, SuggestionType.NAMESPACE));
            });

            mockSuggestionRepository.findFunctionSuggestions.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 6)); // 0-6ms delay
                return Result.ok(createMockSuggestions(25, SuggestionType.FUNCTION));
            });

            mockSuggestionRepository.findTemplateSuggestions.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 7)); // 0-7ms delay
                return Result.ok(createMockSuggestions(12, SuggestionType.TEMPLATE));
            });
        };

        setupRepositoryResponses();

        mockGraph = {
            getTriples: jest.fn(),
            size: jest.fn().mockReturnValue(1000)
        } as any;

        service = new SPARQLAutocompleteService(mockSuggestionRepository, mockGraph);
    });

    afterAll(() => {
        // Output performance benchmark results
        console.log('\n=== SPARQL Autocomplete Performance Benchmark Results ===');
        performanceResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.operation}:`);
            console.log(`  Iterations: ${result.iterations}`);
            console.log(`  Total time: ${result.actualDuration.toFixed(2)}ms`);
            console.log(`  Average per operation: ${result.averagePerOp.toFixed(2)}ms`);
            console.log(`  Requirement: <${result.maxDuration}ms per operation`);
            console.log('');
        });

        const passedTests = performanceResults.filter(r => r.passed).length;
        const totalTests = performanceResults.length;
        console.log(`Performance Summary: ${passedTests}/${totalTests} benchmarks passed`);
    });

    const runBenchmark = async (
        operation: string,
        iterations: number,
        maxDurationPerOp: number,
        testFunction: () => Promise<void>
    ): Promise<void> => {
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            await testFunction();
        }
        
        const totalDuration = performance.now() - startTime;
        const averagePerOp = totalDuration / iterations;
        const passed = averagePerOp <= maxDurationPerOp;

        const benchmark: PerformanceBenchmark = {
            operation,
            iterations,
            maxDuration: maxDurationPerOp,
            actualDuration: totalDuration,
            averagePerOp,
            passed
        };

        performanceResults.push(benchmark);
        
        expect(averagePerOp).toBeLessThanOrEqual(maxDurationPerOp);
    };

    describe('Response Time Requirements', () => {
        it('should complete simple queries within 50ms', async () => {
            await runBenchmark(
                'Simple Query Suggestions',
                20,
                50,
                async () => {
                    const result = await service.getSuggestions('SELECT', 6);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });

        it('should complete complex queries within 100ms', async () => {
            const complexQuery = `
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT DISTINCT ?subject ?label
                WHERE {
                    ?subject rdf:type ?class .
                    ?subject rdfs:label ?label .
                    FILTER(LANG(?label) = "en")
                    OPTIONAL {
                        ?subject rdfs:comment ?comment
                    }
                }
                ORDER BY ?label
                LIMIT 100
            `;

            await runBenchmark(
                'Complex Query Suggestions',
                10,
                100,
                async () => {
                    const result = await service.getSuggestions(complexQuery, complexQuery.length);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });

        it('should handle empty queries within 25ms', async () => {
            await runBenchmark(
                'Empty Query Suggestions',
                50,
                25,
                async () => {
                    const result = await service.getSuggestions('', 0);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });

        it('should handle partial keyword matching within 30ms', async () => {
            await runBenchmark(
                'Partial Keyword Matching',
                30,
                30,
                async () => {
                    const result = await service.getSuggestions('SEL', 3);
                    expect(result.isSuccess).toBe(true);
                    expect(result.getValue().length).toBeGreaterThan(0);
                }
            );
        });

        it('should handle WHERE clause context within 75ms', async () => {
            const whereQuery = 'SELECT * WHERE { ?s ';
            
            await runBenchmark(
                'WHERE Clause Context',
                15,
                75,
                async () => {
                    const result = await service.getSuggestions(whereQuery, whereQuery.length);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });

        it('should handle FILTER context within 60ms', async () => {
            const filterQuery = 'SELECT * WHERE { ?s ?p ?o . FILTER(';
            
            await runBenchmark(
                'FILTER Context Suggestions',
                20,
                60,
                async () => {
                    const result = await service.getSuggestions(filterQuery, filterQuery.length);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });
    });

    describe('Caching Performance', () => {
        it('should serve cached results within 5ms', async () => {
            const query = 'SELECT * WHERE { ?s ?p ?o }';
            const options: AutocompleteOptions = { cacheResults: true };

            // Prime the cache
            await service.getSuggestions(query, query.length, options);

            await runBenchmark(
                'Cached Result Retrieval',
                100,
                5,
                async () => {
                    const result = await service.getSuggestions(query, query.length, options);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });

        it('should handle cache miss and population within 100ms', async () => {
            service.clearCache(); // Ensure fresh start

            await runBenchmark(
                'Cache Miss and Population',
                10,
                100,
                async () => {
                    const query = `SELECT * WHERE { ?s ?p ?o${Math.random()} }`; // Unique query each time
                    const result = await service.getSuggestions(query, query.length, { cacheResults: true });
                    expect(result.isSuccess).toBe(true);
                }
            );
        });
    });

    describe('Concurrent Request Handling', () => {
        it('should handle concurrent requests efficiently', async () => {
            const concurrentRequests = 10;
            const maxTotalTime = 200; // Max 200ms for all concurrent requests

            const startTime = performance.now();
            
            const promises = Array.from({ length: concurrentRequests }, (_, i) => 
                service.getSuggestions(`SELECT${i}`, 6)
            );

            const results = await Promise.all(promises);
            const totalTime = performance.now() - startTime;

            results.forEach(result => {
                expect(result.isSuccess).toBe(true);
            });

            expect(totalTime).toBeLessThan(maxTotalTime);

            performanceResults.push({
                operation: 'Concurrent Request Handling',
                iterations: concurrentRequests,
                maxDuration: maxTotalTime,
                actualDuration: totalTime,
                averagePerOp: totalTime / concurrentRequests,
                passed: totalTime < maxTotalTime
            });
        });

        it('should maintain performance under load', async () => {
            const loadTestRequests = 50;
            const queries = [
                'SELECT',
                'SELECT * WHERE',
                'PREFIX rdf:',
                'CONSTRUCT {',
                'ASK WHERE',
                'DESCRIBE ?s',
                'SELECT DISTINCT',
                'FILTER(',
                'OPTIONAL {',
                'ORDER BY'
            ];

            await runBenchmark(
                'High Load Performance',
                loadTestRequests,
                80,
                async () => {
                    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
                    const result = await service.getSuggestions(randomQuery, randomQuery.length);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });
    });

    describe('Memory and Resource Efficiency', () => {
        it('should handle large result sets efficiently', async () => {
            // Setup repository to return large result sets
            mockSuggestionRepository.findPropertySuggestions.mockResolvedValueOnce(
                Result.ok(Array.from({ length: 500 }, (_, i) => 
                    SPARQLSuggestion.create({
                        id: `large-prop-${i}`,
                        text: `property${i}`,
                        type: SuggestionType.PROPERTY,
                        confidence: 0.5,
                        contextualScore: 0.5
                    })
                ))
            );

            await runBenchmark(
                'Large Result Set Processing',
                5,
                150,
                async () => {
                    const result = await service.getSuggestions('SELECT * WHERE { ?s ', 17);
                    expect(result.isSuccess).toBe(true);
                    // Should be limited by maxSuggestions
                    expect(result.getValue().length).toBeLessThanOrEqual(20);
                }
            );
        });

        it('should handle frequent cache operations efficiently', async () => {
            const options: AutocompleteOptions = { cacheResults: true };

            await runBenchmark(
                'Frequent Cache Operations',
                100,
                20,
                async () => {
                    const query = `SELECT${Math.floor(Math.random() * 10)}`;
                    const result = await service.getSuggestions(query, query.length, options);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });
    });

    describe('Context Analysis Performance', () => {
        it('should analyze simple contexts quickly', async () => {
            await runBenchmark(
                'Simple Context Analysis',
                100,
                10,
                async () => {
                    const result = await service.getSuggestions('SELECT ?var', 11);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });

        it('should analyze complex contexts within limits', async () => {
            const complexContext = `
                PREFIX ex: <http://example.org/>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?subject ?predicate ?object ?label ?comment
                WHERE {
                    ?subject rdf:type ?class .
                    ?subject ?predicate ?object .
                    OPTIONAL { ?subject rdfs:label ?label }
                    OPTIONAL { ?subject rdfs:comment ?comment }
                    FILTER(?predicate != rdf:type)
                    FILTER(LANG(?label) = "en" || !BOUND(?label))
                    {
                        SELECT ?class WHERE {
                            ?class rdf:type rdfs:Class
                        }
                    }
                }
                GROUP BY ?subject ?predicate ?object
                HAVING(COUNT(?label) > 0)
                ORDER BY ?subject ?predicate
                LIMIT 100
                OFFSET 0
            `;

            await runBenchmark(
                'Complex Context Analysis',
                10,
                120,
                async () => {
                    const result = await service.getSuggestions(complexContext, complexContext.length);
                    expect(result.isSuccess).toBe(true);
                }
            );
        });
    });

    describe('Ranking and Scoring Performance', () => {
        it('should rank suggestions efficiently', async () => {
            // Setup large suggestion sets to test ranking performance
            const largeSuggestionSet = Array.from({ length: 200 }, (_, i) => 
                SPARQLSuggestion.create({
                    id: `ranking-test-${i}`,
                    text: `ITEM_${i}`,
                    type: SuggestionType.KEYWORD,
                    confidence: Math.random(),
                    contextualScore: Math.random()
                })
            );

            mockSuggestionRepository.findKeywordSuggestions.mockResolvedValueOnce(
                Result.ok(largeSuggestionSet)
            );

            await runBenchmark(
                'Suggestion Ranking Performance',
                10,
                80,
                async () => {
                    const options: AutocompleteOptions = { 
                        maxSuggestions: 20,
                        contextBoost: true
                    };
                    const result = await service.getSuggestions('', 0, options);
                    expect(result.isSuccess).toBe(true);
                    expect(result.getValue().length).toBeLessThanOrEqual(20);
                }
            );
        });

        it('should handle deduplication efficiently', async () => {
            // Create suggestions with duplicates
            const duplicateSuggestions = [
                ...Array.from({ length: 50 }, () => 
                    SPARQLSuggestion.create({
                        id: 'duplicate-1',
                        text: 'SELECT',
                        type: SuggestionType.KEYWORD,
                        confidence: 0.9,
                        contextualScore: 0.8
                    })
                ),
                ...Array.from({ length: 50 }, () => 
                    SPARQLSuggestion.create({
                        id: 'duplicate-2',
                        text: 'WHERE',
                        type: SuggestionType.KEYWORD,
                        confidence: 0.8,
                        contextualScore: 0.9
                    })
                )
            ];

            mockSuggestionRepository.findKeywordSuggestions.mockResolvedValueOnce(
                Result.ok(duplicateSuggestions)
            );

            await runBenchmark(
                'Deduplication Performance',
                10,
                50,
                async () => {
                    const result = await service.getSuggestions('', 0);
                    expect(result.isSuccess).toBe(true);
                    // Should have deduplicated results
                    const uniqueTexts = new Set(result.getValue().map(s => s.getText()));
                    expect(uniqueTexts.size).toBe(result.getValue().length);
                }
            );
        });
    });

    describe('Edge Case Performance', () => {
        it('should handle empty results quickly', async () => {
            mockSuggestionRepository.findKeywordSuggestions.mockResolvedValueOnce(Result.ok([]));
            mockSuggestionRepository.findPropertySuggestions.mockResolvedValueOnce(Result.ok([]));
            mockSuggestionRepository.findClassSuggestions.mockResolvedValueOnce(Result.ok([]));

            await runBenchmark(
                'Empty Results Handling',
                50,
                15,
                async () => {
                    const result = await service.getSuggestions('UNKNOWN_KEYWORD', 13);
                    expect(result.isSuccess).toBe(true);
                    expect(result.getValue()).toHaveLength(0);
                }
            );
        });

        it('should handle repository errors without significant delay', async () => {
            mockSuggestionRepository.findKeywordSuggestions.mockRejectedValueOnce(
                new Error('Repository error')
            );

            await runBenchmark(
                'Error Handling Performance',
                20,
                100,
                async () => {
                    const result = await service.getSuggestions('SELECT', 6);
                    // Should either succeed with partial results or fail gracefully
                    expect(result).toBeDefined();
                }
            );
        });

        it('should handle malformed queries efficiently', async () => {
            const malformedQueries = [
                'SELECT * WHERE { ?s ?p ?o . FILTER( }}}',
                'CONSTRUCT { ?s ?p } WHERE { ?s ?p ?o . }}}',
                'ASK { ?s ?p ?o . OPTIONAL { ?s ?p',
                'SELECT ?var WHERE { ?var ?pred ?obj . UNION'
            ];

            await runBenchmark(
                'Malformed Query Handling',
                malformedQueries.length * 5,
                60,
                async () => {
                    const query = malformedQueries[Math.floor(Math.random() * malformedQueries.length)];
                    const result = await service.getSuggestions(query, query.length);
                    expect(result.isSuccess).toBe(true); // Should handle gracefully
                }
            );
        });
    });
});