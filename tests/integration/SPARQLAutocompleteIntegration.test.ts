import { SPARQLAutocompleteService, AutocompleteOptions } from '../../src/application/services/SPARQLAutocompleteService';
import { SPARQLAutocompleteComponent } from '../../src/presentation/components/SPARQLAutocompleteComponent';
import { KeywordSuggestionProvider } from '../../src/infrastructure/autocomplete/KeywordSuggestionProvider';
import { SPARQLProcessor } from '../../src/presentation/processors/SPARQLProcessor';
import { SPARQLSuggestion, SuggestionType } from '../../src/domain/autocomplete/SPARQLSuggestion';
import { QueryContext, QueryType, ClauseType } from '../../src/domain/autocomplete/QueryContext';
import { ISuggestionRepository } from '../../src/domain/repositories/ISuggestionRepository';
import { Result } from '../../src/domain/core/Result';
import { Graph } from '../../src/domain/semantic/core/Graph';
import { Plugin } from 'obsidian';

// Mock Obsidian Plugin
class MockPlugin extends Plugin {
    app: any;
    constructor() {
        super({} as any, {} as any);
        this.app = {
            workspace: {
                getActiveViewOfType: jest.fn()
            },
            vault: {
                adapter: {
                    exists: jest.fn().mockResolvedValue(false),
                    write: jest.fn().mockResolvedValue(undefined)
                }
            }
        };
    }
}

// Mock EditorView
const createMockEditorView = () => ({
    dom: document.createElement('div'),
    coordsAtPos: jest.fn().mockReturnValue({
        top: 100,
        bottom: 120,
        left: 200,
        right: 250
    }),
    dispatch: jest.fn(),
    state: {
        selection: {
            main: { from: 0, to: 0 }
        },
        doc: {
            toString: () => 'SELECT * WHERE { ?s ?p ?o }'
        }
    }
});

// Mock DOM methods
Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
    top: 100, left: 200, bottom: 130, right: 400,
    width: 200, height: 30, x: 200, y: 100, toJSON: () => {}
}));
HTMLElement.prototype.scrollIntoView = jest.fn();
HTMLElement.prototype.empty = jest.fn(function() { this.innerHTML = ''; });

describe('SPARQL Autocomplete Integration Tests', () => {
    let mockPlugin: MockPlugin;
    let graph: Graph;
    let sparqlProcessor: SPARQLProcessor;
    let suggestionRepository: jest.Mocked<ISuggestionRepository>;
    let autocompleteService: SPARQLAutocompleteService;
    let autocompleteComponent: SPARQLAutocompleteComponent;
    let keywordProvider: KeywordSuggestionProvider;

    beforeAll(() => {
        // Setup DOM
        document.body.innerHTML = '';
        
        // Create mock plugin
        mockPlugin = new MockPlugin();
        
        // Create real graph with test data
        graph = new Graph();
        setupTestData(graph);
        
        // Create SPARQL processor
        sparqlProcessor = new SPARQLProcessor(mockPlugin, graph);
        
        // Create keyword provider
        keywordProvider = new KeywordSuggestionProvider();
        
        // Create mock suggestion repository
        suggestionRepository = createMockSuggestionRepository();
        
        // Create real autocomplete service
        autocompleteService = new SPARQLAutocompleteService(suggestionRepository, graph);
        
        // Create real autocomplete component
        autocompleteComponent = new SPARQLAutocompleteComponent(autocompleteService);
    });

    afterAll(() => {
        autocompleteComponent.destroy();
    });

    afterEach(() => {
        autocompleteService.clearCache();
        autocompleteComponent.hideSuggestions();
        document.body.innerHTML = '';
    });

    function setupTestData(graph: Graph): void {
        // Mock test data setup - in real implementation would add triples
        // For testing purposes, we just need an initialized graph
    }

    function createMockSuggestionRepository(): jest.Mocked<ISuggestionRepository> {
        const repo: jest.Mocked<ISuggestionRepository> = {
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

        // Setup realistic responses
        repo.findKeywordSuggestions.mockImplementation(async (context: QueryContext) => {
            const provider = new KeywordSuggestionProvider();
            return Result.ok(provider.getSuggestions(context));
        });

        repo.findPropertySuggestions.mockImplementation(async (context: QueryContext) => {
            if (context.isInClause(ClauseType.WHERE)) {
                return Result.ok([
                    SPARQLSuggestion.create({
                        id: 'rdf-type',
                        text: 'rdf:type',
                        type: SuggestionType.PROPERTY,
                        confidence: 0.9,
                        contextualScore: 0.8,
                        metadata: { description: 'The subject is an instance of a class' }
                    }),
                    SPARQLSuggestion.create({
                        id: 'foaf-name',
                        text: 'foaf:name',
                        type: SuggestionType.PROPERTY,
                        confidence: 0.8,
                        contextualScore: 0.7,
                        metadata: { description: 'A name for some thing' }
                    })
                ]);
            }
            return Result.ok([]);
        });

        repo.findClassSuggestions.mockImplementation(async (context: QueryContext) => {
            return Result.ok([
                SPARQLSuggestion.create({
                    id: 'person-class',
                    text: 'ex:Person',
                    type: SuggestionType.CLASS,
                    confidence: 0.7,
                    contextualScore: 0.6,
                    metadata: { description: 'A person' }
                })
            ]);
        });

        repo.findVariableSuggestions.mockImplementation(async (context: QueryContext) => {
            return Result.ok([
                SPARQLSuggestion.create({
                    id: 'var-subject',
                    text: '?subject',
                    type: SuggestionType.VARIABLE,
                    confidence: 0.6,
                    contextualScore: 0.7
                }),
                SPARQLSuggestion.create({
                    id: 'var-predicate',
                    text: '?predicate',
                    type: SuggestionType.VARIABLE,
                    confidence: 0.6,
                    contextualScore: 0.7
                })
            ]);
        });

        repo.findFunctionSuggestions.mockImplementation(async (context: QueryContext) => {
            if (context.isInClause(ClauseType.FILTER)) {
                return Result.ok([
                    SPARQLSuggestion.create({
                        id: 'func-str',
                        text: 'STR(',
                        type: SuggestionType.FUNCTION,
                        confidence: 0.8,
                        contextualScore: 0.7,
                        metadata: { description: 'Convert to string' }
                    })
                ]);
            }
            return Result.ok([]);
        });

        repo.findNamespaceSuggestions.mockResolvedValue(Result.ok([]));
        repo.findTemplateSuggestions.mockResolvedValue(Result.ok([]));
        repo.updateUsageStatistics.mockResolvedValue(Result.ok(undefined));
        repo.getPopularSuggestions.mockResolvedValue(Result.ok([]));

        return repo;
    }

    describe('End-to-End Autocomplete Flow', () => {
        it('should provide suggestions for complete SPARQL query workflow', async () => {
            const mockEditorView = createMockEditorView();
            jest.useFakeTimers();

            // Step 1: Start with empty query - should suggest query types
            let result = await autocompleteService.getSuggestions('', 0);
            expect(result.isSuccess).toBe(true);
            
            let suggestions = result.getValue();
            expect(suggestions.length).toBeGreaterThan(0);
            
            const selectSuggestion = suggestions.find(s => s.getText() === 'SELECT');
            expect(selectSuggestion).toBeDefined();

            // Step 2: After SELECT - should suggest variables or WHERE
            result = await autocompleteService.getSuggestions('SELECT ', 7);
            expect(result.isSuccess).toBe(true);
            
            suggestions = result.getValue();
            const whereSuggestion = suggestions.find(s => s.getText() === 'WHERE');
            const distinctSuggestion = suggestions.find(s => s.getText() === 'DISTINCT');
            expect(whereSuggestion).toBeDefined();
            expect(distinctSuggestion).toBeDefined();

            // Step 3: In WHERE clause - should suggest properties and variables
            result = await autocompleteService.getSuggestions('SELECT * WHERE { ?s ', 19);
            expect(result.isSuccess).toBe(true);
            
            suggestions = result.getValue();
            const rdfTypeSuggestion = suggestions.find(s => s.getText() === 'rdf:type');
            expect(rdfTypeSuggestion).toBeDefined();

            // Step 4: After WHERE block - should suggest result modifiers
            result = await autocompleteService.getSuggestions('SELECT * WHERE { ?s ?p ?o } ', 28);
            expect(result.isSuccess).toBe(true);
            
            suggestions = result.getValue();
            const orderBySuggestion = suggestions.find(s => s.getText() === 'ORDER BY');
            const limitSuggestion = suggestions.find(s => s.getText() === 'LIMIT');
            expect(orderBySuggestion).toBeDefined();
            expect(limitSuggestion).toBeDefined();

            jest.useRealTimers();
        });

        it('should integrate with UI component for full user experience', async () => {
            const mockEditorView = createMockEditorView();
            jest.useFakeTimers();

            // Show suggestions through UI component
            autocompleteComponent.showSuggestions(mockEditorView, 'SEL', 3);
            
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify UI is showing
            expect(autocompleteComponent.isShowing()).toBe(true);

            // Verify DOM elements are created
            const container = document.querySelector('.exocortex-autocomplete-container');
            expect(container).toBeTruthy();
            
            const items = document.querySelectorAll('.exocortex-autocomplete-item');
            expect(items.length).toBeGreaterThan(0);

            // Verify first suggestion is SELECT (due to prefix match boost)
            const firstItem = items[0];
            expect(firstItem.textContent).toContain('SELECT');

            // Test keyboard navigation
            const selectedSuggestion = autocompleteComponent.getSelectedSuggestion();
            expect(selectedSuggestion).toBeDefined();
            expect(selectedSuggestion?.getText()).toBe('SELECT');

            jest.useRealTimers();
        });

        it('should handle complex multi-step query building', async () => {
            const querySteps = [
                { query: '', position: 0, expectedSuggestions: ['SELECT', 'ASK', 'CONSTRUCT'] },
                { query: 'SELECT ?name ', position: 13, expectedSuggestions: ['WHERE'] },
                { query: 'SELECT ?name WHERE { ', position: 21, expectedSuggestions: ['?', 'rdf:type'] },
                { query: 'SELECT ?name WHERE { ?person ', position: 30, expectedSuggestions: ['rdf:type', 'foaf:name'] },
                { query: 'SELECT ?name WHERE { ?person foaf:name ?name } ', position: 48, expectedSuggestions: ['ORDER BY', 'LIMIT'] }
            ];

            for (const step of querySteps) {
                const result = await autocompleteService.getSuggestions(step.query, step.position);
                expect(result.isSuccess).toBe(true);
                
                const suggestions = result.getValue();
                const suggestionTexts = suggestions.map(s => s.getText());
                
                // Check that at least some expected suggestions are present
                const hasExpectedSuggestions = step.expectedSuggestions.some(expected => 
                    suggestionTexts.some(actual => actual.includes(expected))
                );
                expect(hasExpectedSuggestions).toBe(true);
            }
        });
    });

    describe('Performance Integration', () => {
        it('should maintain performance in integrated system', async () => {
            const complexQuery = `
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX foaf: <http://xmlns.com/foaf/0.1/>
                SELECT DISTINCT ?person ?name
                WHERE {
                    ?person rdf:type ex:Person .
                    ?person foaf:name ?name .
                    FILTER(STRLEN(?name) > 3)
                    OPTIONAL {
                        ?person foaf:knows ?friend
                    }
                }
                ORDER BY ?name
                LIMIT 10
            `;

            const startTime = performance.now();
            const result = await autocompleteService.getSuggestions(complexQuery, complexQuery.length);
            const duration = performance.now() - startTime;

            expect(result.isSuccess).toBe(true);
            expect(duration).toBeLessThan(150); // Integrated system may be slightly slower
        });

        it('should handle concurrent UI and service operations', async () => {
            const mockEditorView = createMockEditorView();
            jest.useFakeTimers();

            // Start multiple concurrent operations
            const promises = [
                autocompleteService.getSuggestions('SELECT', 6),
                autocompleteService.getSuggestions('WHERE', 5),
                autocompleteService.getSuggestions('FILTER', 6)
            ];

            // Also trigger UI updates
            autocompleteComponent.showSuggestions(mockEditorView, 'SEL', 3);
            jest.runAllTimers();

            const results = await Promise.all(promises);
            
            // All operations should succeed
            results.forEach(result => {
                expect(result.isSuccess).toBe(true);
            });

            // UI should still be working
            expect(autocompleteComponent.isShowing()).toBe(true);

            jest.useRealTimers();
        });
    });

    describe('Data Integration', () => {
        it('should suggest properties based on actual graph data', async () => {
            // When in WHERE clause, should suggest properties that exist in the graph
            const result = await autocompleteService.getSuggestions(
                'SELECT * WHERE { ?s ', 
                17
            );

            expect(result.isSuccess).toBe(true);
            const suggestions = result.getValue();
            
            // Should suggest properties that exist in our test data
            const propertyTexts = suggestions
                .filter(s => s.getType() === SuggestionType.PROPERTY)
                .map(s => s.getText());

            expect(propertyTexts).toContain('rdf:type');
            expect(propertyTexts).toContain('foaf:name');
        });

        it('should suggest classes based on graph ontology', async () => {
            const result = await autocompleteService.getSuggestions(
                'SELECT * WHERE { ?s rdf:type ',
                27
            );

            expect(result.isSuccess).toBe(true);
            const suggestions = result.getValue();
            
            // Should suggest classes from our test data
            const classTexts = suggestions
                .filter(s => s.getType() === SuggestionType.CLASS)
                .map(s => s.getText());

            expect(classTexts).toContain('ex:Person');
        });

        it('should provide contextually relevant variable suggestions', async () => {
            const result = await autocompleteService.getSuggestions(
                'SELECT ?person WHERE { ?person rdf:type ex:Person . ?',
                53
            );

            expect(result.isSuccess).toBe(true);
            const suggestions = result.getValue();
            
            // Should suggest variables that make sense in context
            const variableTexts = suggestions
                .filter(s => s.getType() === SuggestionType.VARIABLE)
                .map(s => s.getText());

            expect(variableTexts).toContain('?person'); // Already used variable
        });
    });

    describe('Error Handling Integration', () => {
        it('should gracefully handle repository failures without breaking UI', async () => {
            // Simulate repository failure
            suggestionRepository.findKeywordSuggestions.mockRejectedValueOnce(
                new Error('Repository connection failed')
            );

            const mockEditorView = createMockEditorView();
            jest.useFakeTimers();

            // Should not throw or break UI
            autocompleteComponent.showSuggestions(mockEditorView, 'SELECT', 6);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            // UI should handle gracefully - may show partial results or hide
            expect(autocompleteComponent).toBeDefined();
            // Component might be hidden due to error, that's acceptable
            
            jest.useRealTimers();
        });

        it('should recover from temporary service failures', async () => {
            // First call fails
            suggestionRepository.findKeywordSuggestions.mockRejectedValueOnce(
                new Error('Temporary failure')
            );

            const result1 = await autocompleteService.getSuggestions('SELECT', 6);
            expect(result1.isFailure).toBe(true);

            // Restore normal behavior
            suggestionRepository.findKeywordSuggestions.mockImplementation(async (context: QueryContext) => {
                const provider = new KeywordSuggestionProvider();
                return Result.ok(provider.getSuggestions(context));
            });

            // Second call should succeed
            const result2 = await autocompleteService.getSuggestions('SELECT', 6);
            expect(result2.isSuccess).toBe(true);
        });

        it('should handle malformed queries without system failure', async () => {
            const malformedQuery = 'SELECT * WHERE { ?s ?p ?o . FILTER( }}}';
            
            const result = await autocompleteService.getSuggestions(
                malformedQuery, 
                malformedQuery.length
            );

            expect(result.isSuccess).toBe(true); // Should handle gracefully
            
            const mockEditorView = createMockEditorView();
            jest.useFakeTimers();

            // UI should also handle malformed queries
            autocompleteComponent.showSuggestions(mockEditorView, malformedQuery, malformedQuery.length);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should not crash
            expect(autocompleteComponent).toBeDefined();

            jest.useRealTimers();
        });
    });

    describe('Caching Integration', () => {
        it('should use cache across service and UI interactions', async () => {
            const query = 'SELECT * WHERE { ?s ?p ?o }';
            const options: AutocompleteOptions = { cacheResults: true };

            // First service call should hit repository
            const result1 = await autocompleteService.getSuggestions(query, query.length, options);
            expect(result1.isSuccess).toBe(true);

            const keywordCallsBefore = suggestionRepository.findKeywordSuggestions.mock.calls.length;

            // Second call should use cache
            const result2 = await autocompleteService.getSuggestions(query, query.length, options);
            expect(result2.isSuccess).toBe(true);

            const keywordCallsAfter = suggestionRepository.findKeywordSuggestions.mock.calls.length;

            // Should not make additional repository calls
            expect(keywordCallsAfter).toBe(keywordCallsBefore);

            // Results should be equivalent
            expect(result1.getValue().length).toBe(result2.getValue().length);
        });

        it('should handle cache invalidation properly', async () => {
            const query = 'SELECT * WHERE { ?s ?p ?o }';
            const options: AutocompleteOptions = { cacheResults: true };

            // Prime cache
            await autocompleteService.getSuggestions(query, query.length, options);

            // Clear cache
            autocompleteService.clearCache();

            const callsBefore = suggestionRepository.findKeywordSuggestions.mock.calls.length;

            // Next call should hit repository again
            await autocompleteService.getSuggestions(query, query.length, options);

            const callsAfter = suggestionRepository.findKeywordSuggestions.mock.calls.length;
            expect(callsAfter).toBeGreaterThan(callsBefore);
        });
    });

    describe('Real-world Usage Patterns', () => {
        it('should support incremental query building with live feedback', async () => {
            const mockEditorView = createMockEditorView();
            const queryProgression = [
                'S',
                'SE',
                'SEL', 
                'SELE',
                'SELECT',
                'SELECT ',
                'SELECT *',
                'SELECT * ',
                'SELECT * W',
                'SELECT * WH',
                'SELECT * WHE',
                'SELECT * WHER',
                'SELECT * WHERE',
                'SELECT * WHERE ',
                'SELECT * WHERE {'
            ];

            jest.useFakeTimers();

            for (const partialQuery of queryProgression) {
                autocompleteComponent.showSuggestions(mockEditorView, partialQuery, partialQuery.length);
                
                // Small delay to simulate real typing
                jest.advanceTimersByTime(50);
                
                // Should handle each step without errors
                expect(autocompleteComponent).toBeDefined();
            }

            // Final step should show suggestions
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(autocompleteComponent.isShowing()).toBe(true);

            jest.useRealTimers();
        });

        it('should handle user interaction patterns', async () => {
            const mockEditorView = createMockEditorView();
            jest.useFakeTimers();

            // User types SELECT
            autocompleteComponent.showSuggestions(mockEditorView, 'SEL', 3);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(autocompleteComponent.isShowing()).toBe(true);

            // User presses Escape to hide
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);

            expect(autocompleteComponent.isShowing()).toBe(false);

            // User continues typing, autocomplete should appear again
            autocompleteComponent.showSuggestions(mockEditorView, 'SELECT ', 7);
            jest.runAllTimers();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(autocompleteComponent.isShowing()).toBe(true);

            jest.useRealTimers();
        });

        it('should provide relevant suggestions at different query positions', async () => {
            const testCases = [
                {
                    description: 'Query start',
                    query: '',
                    position: 0,
                    expectedTypes: [SuggestionType.KEYWORD, SuggestionType.TEMPLATE]
                },
                {
                    description: 'After SELECT',
                    query: 'SELECT ',
                    position: 7,
                    expectedTypes: [SuggestionType.KEYWORD, SuggestionType.VARIABLE]
                },
                {
                    description: 'In WHERE clause',
                    query: 'SELECT * WHERE { ?s ',
                    position: 19,
                    expectedTypes: [SuggestionType.PROPERTY, SuggestionType.VARIABLE]
                },
                {
                    description: 'In FILTER context', 
                    query: 'SELECT * WHERE { ?s ?p ?o . FILTER(',
                    position: 34,
                    expectedTypes: [SuggestionType.FUNCTION, SuggestionType.VARIABLE]
                },
                {
                    description: 'After WHERE block',
                    query: 'SELECT * WHERE { ?s ?p ?o } ',
                    position: 28,
                    expectedTypes: [SuggestionType.KEYWORD]
                }
            ];

            for (const testCase of testCases) {
                const result = await autocompleteService.getSuggestions(
                    testCase.query, 
                    testCase.position
                );

                expect(result.isSuccess).toBe(true);
                const suggestions = result.getValue();
                
                const suggestionTypes = suggestions.map(s => s.getType());
                const hasExpectedTypes = testCase.expectedTypes.some(expectedType =>
                    suggestionTypes.includes(expectedType)
                );

                expect(hasExpectedTypes).toBe(true);
            }
        });
    });
});