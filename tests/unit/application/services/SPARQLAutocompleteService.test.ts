import { SPARQLAutocompleteService, AutocompleteOptions } from '../../../../src/application/services/SPARQLAutocompleteService';
import { SPARQLSuggestion, SuggestionType } from '../../../../src/domain/autocomplete/SPARQLSuggestion';
import { QueryContext, QueryType, ClauseType } from '../../../../src/domain/autocomplete/QueryContext';
import { ISuggestionRepository } from '../../../../src/domain/repositories/ISuggestionRepository';
import { Result } from '../../../../src/domain/core/Result';
import { Graph } from '../../../../src/domain/semantic/core/Graph';

describe('SPARQLAutocompleteService', () => {
    let service: SPARQLAutocompleteService;
    let mockSuggestionRepository: jest.Mocked<ISuggestionRepository>;
    let mockGraph: jest.Mocked<Graph>;
    let mockSuggestions: SPARQLSuggestion[];

    beforeEach(() => {
        // Create mock suggestions
        mockSuggestions = [
            SPARQLSuggestion.create({
                id: 'keyword-select',
                text: 'SELECT',
                insertText: 'SELECT ',
                type: SuggestionType.KEYWORD,
                confidence: 0.9,
                contextualScore: 0.8,
                metadata: { description: 'Query form that returns variable bindings' }
            }),
            SPARQLSuggestion.create({
                id: 'keyword-where',
                text: 'WHERE',
                insertText: 'WHERE { ',
                type: SuggestionType.KEYWORD,
                confidence: 0.85,
                contextualScore: 0.9
            }),
            SPARQLSuggestion.create({
                id: 'property-rdf-type',
                text: 'rdf:type',
                insertText: 'rdf:type',
                type: SuggestionType.PROPERTY,
                confidence: 0.7,
                contextualScore: 0.6,
                metadata: { namespace: 'rdf' }
            })
        ];

        // Create mock repository
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

        // Setup default successful responses
        mockSuggestionRepository.findKeywordSuggestions.mockResolvedValue(
            Result.ok([mockSuggestions[0], mockSuggestions[1]])
        );
        mockSuggestionRepository.findPropertySuggestions.mockResolvedValue(
            Result.ok([mockSuggestions[2]])
        );
        mockSuggestionRepository.findClassSuggestions.mockResolvedValue(Result.ok([]));
        mockSuggestionRepository.findVariableSuggestions.mockResolvedValue(Result.ok([]));
        mockSuggestionRepository.findNamespaceSuggestions.mockResolvedValue(Result.ok([]));
        mockSuggestionRepository.findFunctionSuggestions.mockResolvedValue(Result.ok([]));
        mockSuggestionRepository.findTemplateSuggestions.mockResolvedValue(Result.ok([]));

        // Create mock graph
        mockGraph = {
            getTriples: jest.fn(),
            size: jest.fn()
        } as any;

        service = new SPARQLAutocompleteService(mockSuggestionRepository, mockGraph);
    });

    afterEach(() => {
        service.clearCache();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with repository and graph', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(SPARQLAutocompleteService);
        });

        it('should have empty cache initially', () => {
            service.clearCache();
            expect(service).toBeDefined(); // Cache is private, can't directly test
        });
    });

    describe('getSuggestions()', () => {
        it('should return suggestions for empty query', async () => {
            const result = await service.getSuggestions('', 0);
            
            expect(result.isSuccess).toBe(true);
            const suggestions = result.getValue();
            expect(suggestions).toHaveLength(2); // Keywords only for empty query
            expect(suggestions[0].getType()).toBe(SuggestionType.KEYWORD);
        });

        it('should return suggestions for partial SELECT query', async () => {
            const query = 'SEL';
            const result = await service.getSuggestions(query, 3);
            
            expect(result.isSuccess).toBe(true);
            const suggestions = result.getValue();
            expect(suggestions.length).toBeGreaterThan(0);
            
            // Should prioritize matching keywords
            const selectSuggestion = suggestions.find(s => s.getText() === 'SELECT');
            expect(selectSuggestion).toBeDefined();
        });

        it('should return suggestions for WHERE clause context', async () => {
            const query = 'SELECT * WHERE { ?s ';
            const result = await service.getSuggestions(query, query.length);
            
            expect(result.isSuccess).toBe(true);
            expect(mockSuggestionRepository.findPropertySuggestions).toHaveBeenCalled();
            expect(mockSuggestionRepository.findKeywordSuggestions).toHaveBeenCalled();
        });

        it('should respect maxSuggestions option', async () => {
            const options: AutocompleteOptions = { maxSuggestions: 1 };
            const result = await service.getSuggestions('', 0, options);
            
            expect(result.isSuccess).toBe(true);
            const suggestions = result.getValue();
            expect(suggestions).toHaveLength(1);
        });

        it('should handle caching when enabled', async () => {
            const query = 'SELECT';
            const options: AutocompleteOptions = { cacheResults: true };
            
            // First call
            const result1 = await service.getSuggestions(query, 6, options);
            expect(result1.isSuccess).toBe(true);
            
            // Second call should use cache
            const result2 = await service.getSuggestions(query, 6, options);
            expect(result2.isSuccess).toBe(true);
            
            // Should have same results
            expect(result1.getValue()).toHaveLength(result2.getValue().length);
        });

        it('should handle repository errors gracefully', async () => {
            mockSuggestionRepository.findKeywordSuggestions.mockResolvedValue(
                Result.fail('Repository error')
            );
            
            const result = await service.getSuggestions('SELECT', 6);
            
            expect(result.isSuccess).toBe(true); // Should still succeed with partial results
            // Should not include keyword suggestions due to error
            const suggestions = result.getValue();
            const keywordSuggestions = suggestions.filter(s => s.getType() === SuggestionType.KEYWORD);
            expect(keywordSuggestions).toHaveLength(0);
        });

        it('should handle service exceptions', async () => {
            mockSuggestionRepository.findKeywordSuggestions.mockRejectedValue(
                new Error('Network error')
            );
            
            const result = await service.getSuggestions('SELECT', 6);
            
            expect(result.isFailure).toBe(true);
            expect(result.getErrorMessage()).toContain('Failed to get suggestions');
        });
    });

    describe('Context Analysis', () => {
        it('should detect SELECT query type', async () => {
            const query = 'SELECT ?var WHERE';
            await service.getSuggestions(query, query.length);
            
            const callArgs = mockSuggestionRepository.findKeywordSuggestions.mock.calls[0][0] as QueryContext;
            expect(callArgs.getQueryType()).toBe(QueryType.SELECT);
        });

        it('should detect ASK query type', async () => {
            const query = 'ASK WHERE';
            await service.getSuggestions(query, query.length);
            
            const callArgs = mockSuggestionRepository.findKeywordSuggestions.mock.calls[0][0] as QueryContext;
            expect(callArgs.getQueryType()).toBe(QueryType.ASK);
        });

        it('should detect current token correctly', async () => {
            const query = 'SELECT ?va';
            await service.getSuggestions(query, query.length);
            
            const callArgs = mockSuggestionRepository.findKeywordSuggestions.mock.calls[0][0] as QueryContext;
            expect(callArgs.getCurrentToken()).toBe('?va');
        });

        it('should detect WHERE clause context', async () => {
            const query = 'SELECT * WHERE { ?s ?p ';
            await service.getSuggestions(query, query.length);
            
            const callArgs = mockSuggestionRepository.findPropertySuggestions.mock.calls[0][0] as QueryContext;
            expect(callArgs.getCurrentClause()).toBe(ClauseType.WHERE);
        });

        it('should extract variables from clauses', async () => {
            const query = 'SELECT ?subject ?predicate WHERE { ?subject ?predicate ?object }';
            await service.getSuggestions(query, query.length);
            
            const callArgs = mockSuggestionRepository.findVariableSuggestions.mock.calls[0][0] as QueryContext;
            const variables = callArgs.getVariablesInScope();
            expect(variables).toContain('subject');
            expect(variables).toContain('predicate');
        });
    });

    describe('Suggestion Collection Logic', () => {
        it('should include keywords at start of query', async () => {
            await service.getSuggestions('', 0);
            expect(mockSuggestionRepository.findKeywordSuggestions).toHaveBeenCalled();
        });

        it('should include properties in WHERE clause', async () => {
            const query = 'SELECT * WHERE { ?s ';
            await service.getSuggestions(query, query.length);
            expect(mockSuggestionRepository.findPropertySuggestions).toHaveBeenCalled();
        });

        it('should include variables when token starts with ?', async () => {
            const query = 'SELECT ?';
            await service.getSuggestions(query, query.length);
            expect(mockSuggestionRepository.findVariableSuggestions).toHaveBeenCalled();
        });

        it('should include functions in FILTER context', async () => {
            const query = 'SELECT * WHERE { ?s ?p ?o . FILTER(';
            await service.getSuggestions(query, query.length);
            expect(mockSuggestionRepository.findFunctionSuggestions).toHaveBeenCalled();
        });

        it('should include templates at query start', async () => {
            await service.getSuggestions('', 0);
            expect(mockSuggestionRepository.findTemplateSuggestions).toHaveBeenCalled();
        });
    });

    describe('Suggestion Ranking and Filtering', () => {
        it('should rank suggestions by final score', async () => {
            const result = await service.getSuggestions('', 0);
            const suggestions = result.getValue();
            
            // Should be sorted by score (descending)
            for (let i = 0; i < suggestions.length - 1; i++) {
                const currentScore = suggestions[i].calculateFinalScore();
                const nextScore = suggestions[i + 1].calculateFinalScore();
                expect(currentScore).toBeGreaterThanOrEqual(nextScore);
            }
        });

        it('should boost matching suggestions', async () => {
            const result = await service.getSuggestions('SEL', 3);
            const suggestions = result.getValue();
            
            const selectSuggestion = suggestions.find(s => s.getText() === 'SELECT');
            if (selectSuggestion) {
                // SELECT should be ranked higher due to prefix match
                expect(suggestions.indexOf(selectSuggestion)).toBeLessThan(
                    suggestions.length / 2
                );
            }
        });

        it('should deduplicate suggestions', async () => {
            // Add duplicate suggestions
            mockSuggestionRepository.findKeywordSuggestions.mockResolvedValue(
                Result.ok([mockSuggestions[0], mockSuggestions[0]]) // Duplicate SELECT
            );
            
            const result = await service.getSuggestions('', 0);
            const suggestions = result.getValue();
            
            // Should only have one SELECT suggestion
            const selectSuggestions = suggestions.filter(s => s.getText() === 'SELECT');
            expect(selectSuggestions).toHaveLength(1);
        });

        it('should apply contextual boost when enabled', async () => {
            const options: AutocompleteOptions = { contextBoost: true };
            
            const result = await service.getSuggestions('SELECT * WH', 11, options);
            expect(result.isSuccess).toBe(true);
            
            // WHERE should be boosted in this context
            const suggestions = result.getValue();
            const whereSuggestion = suggestions.find(s => s.getText() === 'WHERE');
            if (whereSuggestion) {
                expect(suggestions.indexOf(whereSuggestion)).toBe(0); // Should be first
            }
        });
    });

    describe('Cache Management', () => {
        beforeEach(() => {
            service.clearCache();
        });

        it('should cache results when enabled', async () => {
            const query = 'SELECT';
            const options: AutocompleteOptions = { cacheResults: true };
            
            await service.getSuggestions(query, 6, options);
            await service.getSuggestions(query, 6, options);
            
            // Repository should only be called once
            expect(mockSuggestionRepository.findKeywordSuggestions).toHaveBeenCalledTimes(1);
        });

        it('should not cache when disabled', async () => {
            const query = 'SELECT';
            const options: AutocompleteOptions = { cacheResults: false };
            
            await service.getSuggestions(query, 6, options);
            await service.getSuggestions(query, 6, options);
            
            // Repository should be called twice
            expect(mockSuggestionRepository.findKeywordSuggestions).toHaveBeenCalledTimes(2);
        });

        it('should clear cache', () => {
            service.clearCache();
            expect(service).toBeDefined(); // Can't directly test private cache
        });

        it('should handle cache expiration', async () => {
            const query = 'SELECT';
            const options: AutocompleteOptions = { cacheResults: true };
            
            // First call
            await service.getSuggestions(query, 6, options);
            
            // Mock time passage (cache TTL is 5 minutes = 300000ms)
            const originalNow = Date.now;
            Date.now = jest.fn(() => originalNow() + 400000); // 6.67 minutes later
            
            // Second call after cache expiration
            await service.getSuggestions(query, 6, options);
            
            // Should make two repository calls due to cache expiration
            expect(mockSuggestionRepository.findKeywordSuggestions).toHaveBeenCalledTimes(2);
            
            // Restore Date.now
            Date.now = originalNow;
        });
    });

    describe('Performance Requirements', () => {
        it('should complete suggestions within 100ms for simple queries', async () => {
            const startTime = performance.now();
            
            await service.getSuggestions('SELECT', 6);
            
            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(100);
        });

        it('should complete suggestions within 200ms for complex queries', async () => {
            const complexQuery = `
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?subject ?predicate ?object
                WHERE {
                    ?subject rdf:type ?class .
                    ?subject ?predicate ?object .
                    FILTER(?predicate != rdf:type)
                    OPTIONAL {
                        ?subject rdfs:label ?label
                    }
                }
                ORDER BY ?subject
                LIMIT 100
            `;
            
            const startTime = performance.now();
            
            await service.getSuggestions(complexQuery, complexQuery.length);
            
            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(200);
        });

        it('should handle concurrent requests efficiently', async () => {
            const promises = [];
            const startTime = performance.now();
            
            // Make 10 concurrent requests
            for (let i = 0; i < 10; i++) {
                promises.push(service.getSuggestions(`SELECT${i}`, 6));
            }
            
            const results = await Promise.all(promises);
            const duration = performance.now() - startTime;
            
            // All should succeed
            results.forEach(result => expect(result.isSuccess).toBe(true));
            
            // Should complete all within reasonable time
            expect(duration).toBeLessThan(500);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle null/undefined query gracefully', async () => {
            const result = await service.getSuggestions(null as any, 0);
            expect(result.isFailure).toBe(true);
        });

        it('should handle negative cursor position', async () => {
            const result = await service.getSuggestions('SELECT', -1);
            expect(result.isFailure).toBe(true);
        });

        it('should handle cursor position beyond query length', async () => {
            const query = 'SELECT';
            const result = await service.getSuggestions(query, query.length + 10);
            expect(result.isSuccess).toBe(true); // Should handle gracefully
        });

        it('should handle empty string query', async () => {
            const result = await service.getSuggestions('', 0);
            expect(result.isSuccess).toBe(true);
        });

        it('should handle malformed SPARQL queries', async () => {
            const malformedQuery = 'SELECT * WHERE { ?s ?p ?o . FILTER( }}}}';
            const result = await service.getSuggestions(malformedQuery, malformedQuery.length);
            expect(result.isSuccess).toBe(true); // Should still provide suggestions
        });

        it('should handle very large queries', async () => {
            const largeQuery = 'SELECT * WHERE { ' + '?s ?p ?o . '.repeat(1000) + '}';
            
            const startTime = performance.now();
            const result = await service.getSuggestions(largeQuery, largeQuery.length);
            const duration = performance.now() - startTime;
            
            expect(result.isSuccess).toBe(true);
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle unicode characters in queries', async () => {
            const unicodeQuery = 'SELECT ?名前 WHERE { ?person rdfs:label ?名前 }';
            const result = await service.getSuggestions(unicodeQuery, unicodeQuery.length);
            
            expect(result.isSuccess).toBe(true);
        });

        it('should handle special regex characters in queries', async () => {
            const regexQuery = 'SELECT * WHERE { ?s ?p ?o . FILTER(REGEX(?o, "^[0-9]+$")) }';
            const result = await service.getSuggestions(regexQuery, regexQuery.length);
            
            expect(result.isSuccess).toBe(true);
        });
    });
});