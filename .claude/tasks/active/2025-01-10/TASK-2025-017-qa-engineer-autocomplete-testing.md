# Task: QA Engineer - SPARQL Autocomplete Testing Strategy

**Task ID**: TASK-2025-017
**Agent**: QA Engineer
**Priority**: High
**Status**: pending
**Created**: 2025-01-10
**Deadline**: 2025-01-15

## Context

Develop comprehensive testing strategy for SPARQL Autocomplete functionality. This includes unit tests, integration tests, performance tests, accessibility tests, and user acceptance testing to ensure the feature meets quality standards.

## Testing Objectives

### Primary Goals
- Ensure autocomplete suggestions are accurate and contextually relevant
- Verify performance meets < 100ms response time requirement
- Validate accessibility compliance (WCAG 2.1 AA)
- Confirm seamless integration with existing SPARQL workflow
- Prevent regressions in current functionality

### Quality Gates
- All tests pass with 0 failures
- Code coverage ≥ 70% for new code
- Performance benchmarks met
- Accessibility audit passes
- User acceptance criteria satisfied

## Test Strategy Overview

### Testing Pyramid

```
              ┌─────────────────────┐
              │   E2E Tests (10%)   │  ← User workflows
              │  - Real usage       │
              │  - Browser testing  │
              └─────────────────────┘
                       │
               ┌─────────────────────┐
               │ Integration (30%)   │  ← Component interaction
               │ - API integration   │
               │ - UI integration    │
               │ - Performance       │
               └─────────────────────┘
                       │
                ┌─────────────────────┐
                │  Unit Tests (60%)   │  ← Individual components
                │ - Logic validation  │
                │ - Edge cases        │
                │ - Error handling    │
                └─────────────────────┘
```

## Test Planning

### Test Scope

#### In Scope
- Suggestion generation (all types: keywords, properties, variables, templates, namespaces)
- Context analysis and cursor position handling
- UI interaction and keyboard navigation
- Performance under various data sizes
- Accessibility features
- Integration with existing SPARQL processing
- Caching behavior
- Error handling and recovery

#### Out of Scope
- SPARQL query execution (already tested)
- Graph operations (already tested)
- Obsidian core functionality
- Browser compatibility beyond Electron

### Test Environment Setup

#### Unit Test Environment
```typescript
// /tests/unit/sparql/autocomplete/
// Use existing Jest configuration
describe('AutocompleteEngine', () => {
  let engine: AutocompleteEngine;
  let mockGraph: jest.Mocked<Graph>;
  let mockProviders: jest.Mocked<SuggestionProvider>[];

  beforeEach(() => {
    mockGraph = createMockGraph();
    mockProviders = [
      createMockKeywordProvider(),
      createMockPropertyProvider()
    ];
    engine = new AutocompleteEngine(
      new ContextAnalyzer(),
      mockProviders,
      new InMemoryCache()
    );
  });
});
```

#### Integration Test Environment
```typescript
// /tests/integration/sparql/autocomplete/
// Use existing integration test patterns
describe('SPARQL Autocomplete Integration', () => {
  let plugin: ExocortexPlugin;
  let testVault: FakeVaultAdapter;
  let processor: EnhancedSPARQLProcessor;

  beforeEach(async () => {
    testVault = new FakeVaultAdapter();
    plugin = await createTestPlugin(testVault);
    processor = plugin.getAutocompleteProcessor();
  });
});
```

## Detailed Test Plans

### 1. Unit Tests

#### 1.1 Context Analyzer Tests
```typescript
// /tests/unit/sparql/autocomplete/ContextAnalyzer.test.ts
describe('ContextAnalyzer', () => {
  let analyzer: ContextAnalyzer;

  beforeEach(() => {
    analyzer = new ContextAnalyzer();
  });

  describe('Token Extraction', () => {
    it('should extract current token at cursor position', () => {
      const query = 'SELECT ?subj|ect WHERE';
      const result = analyzer.analyze(query, 12); // cursor at |
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().currentToken).toBe('subject');
    });

    it('should handle empty token at whitespace', () => {
      const query = 'SELECT | WHERE';
      const result = analyzer.analyze(query, 7);
      
      expect(result.getValue().currentToken).toBeUndefined();
    });

    it('should extract preceding tokens correctly', () => {
      const query = 'SELECT ?s WHERE ?s ?p |';
      const result = analyzer.analyze(query, 23);
      
      expect(result.getValue().precedingTokens).toContain('?p');
      expect(result.getValue().precedingTokens).toContain('WHERE');
    });
  });

  describe('Clause Context Detection', () => {
    test.each([
      ['SELECT ?s WHERE', 13, ClauseType.WHERE],
      ['SELECT ?s', 9, ClauseType.SELECT],
      ['SELECT ?s WHERE { ?s ?p ?o } FILTER', 35, ClauseType.FILTER],
      ['SELECT ?s WHERE { ?s ?p ?o } ORDER BY', 37, ClauseType.ORDER_BY]
    ])('should detect %s at position %d as %s', (query, pos, expected) => {
      const result = analyzer.analyze(query, pos);
      expect(result.getValue().clauseContext).toBe(expected);
    });
  });

  describe('Variable Extraction', () => {
    it('should extract all variables from query', () => {
      const query = 'SELECT ?subject ?predicate WHERE { ?subject ?predicate ?object }';
      const result = analyzer.analyze(query, 30);
      
      const variables = result.getValue().variables;
      expect(variables.has('subject')).toBe(true);
      expect(variables.has('predicate')).toBe(true);
      expect(variables.has('object')).toBe(true);
    });

    it('should handle duplicate variables', () => {
      const query = 'SELECT ?s WHERE { ?s ?p ?o . ?s ?p2 ?o2 }';
      const result = analyzer.analyze(query, 20);
      
      const variables = result.getValue().variables;
      expect(variables.size).toBe(5); // s, p, o, p2, o2
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed queries gracefully', () => {
      const query = 'SELECT WHERE { ? ?';
      const result = analyzer.analyze(query, 15);
      
      expect(result.isSuccess).toBe(true);
      // Should not crash on malformed input
    });

    it('should handle cursor at end of query', () => {
      const query = 'SELECT ?s WHERE { ?s ?p ?o }';
      const result = analyzer.analyze(query, query.length);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should handle cursor at beginning of query', () => {
      const query = 'SELECT ?s WHERE { ?s ?p ?o }';
      const result = analyzer.analyze(query, 0);
      
      expect(result.isSuccess).toBe(true);
    });
  });
});
```

#### 1.2 Suggestion Provider Tests
```typescript
// /tests/unit/sparql/autocomplete/providers/KeywordSuggestionProvider.test.ts
describe('KeywordSuggestionProvider', () => {
  let provider: KeywordSuggestionProvider;

  beforeEach(() => {
    provider = new KeywordSuggestionProvider();
  });

  describe('Applicability', () => {
    it('should be applicable in all contexts', () => {
      const context = createContext('SELECT', ClauseType.SELECT);
      expect(provider.isApplicable(context)).toBe(true);
    });
  });

  describe('Suggestion Generation', () => {
    it('should suggest SELECT keywords at query start', async () => {
      const context = createContext('SEL', ClauseType.SELECT);
      const result = await provider.getSuggestions(context);
      
      expect(result.isSuccess).toBe(true);
      const suggestions = result.getValue();
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          text: 'SELECT',
          type: SuggestionType.KEYWORD
        })
      );
    });

    it('should filter suggestions by current token', async () => {
      const context = createContext('FILT', ClauseType.WHERE);
      const result = await provider.getSuggestions(context);
      
      const suggestions = result.getValue();
      expect(suggestions.some(s => s.text === 'FILTER')).toBe(true);
      expect(suggestions.some(s => s.text === 'SELECT')).toBe(false);
    });

    it('should provide context-appropriate suggestions', async () => {
      const context = createContext('', ClauseType.WHERE);
      const result = await provider.getSuggestions(context);
      
      const suggestions = result.getValue();
      const suggestionTexts = suggestions.map(s => s.text);
      expect(suggestionTexts).toContain('OPTIONAL');
      expect(suggestionTexts).toContain('FILTER');
      expect(suggestionTexts).not.toContain('SELECT'); // Not in WHERE
    });
  });

  describe('Relevance Scoring', () => {
    it('should score exact matches higher', async () => {
      const context = createContext('SELECT', ClauseType.SELECT);
      const result = await provider.getSuggestions(context);
      
      const selectSuggestion = result.getValue()
        .find(s => s.text === 'SELECT');
      expect(selectSuggestion?.relevanceScore).toBeGreaterThan(0.8);
    });

    it('should score partial matches lower', async () => {
      const context = createContext('SEL', ClauseType.SELECT);
      const result = await provider.getSuggestions(context);
      
      const selectSuggestion = result.getValue()
        .find(s => s.text === 'SELECT');
      expect(selectSuggestion?.relevanceScore).toBeLessThan(0.8);
    });
  });
});

// /tests/unit/sparql/autocomplete/providers/PropertySuggestionProvider.test.ts
describe('PropertySuggestionProvider', () => {
  let provider: PropertySuggestionProvider;
  let mockGraph: jest.Mocked<Graph>;

  beforeEach(() => {
    mockGraph = createMockGraph();
    provider = new PropertySuggestionProvider(mockGraph);
  });

  describe('Property Extraction', () => {
    it('should extract properties from graph', async () => {
      // Mock graph with test properties
      mockGraph.getPredicates.mockReturnValue([
        new IRI('exo:hasTitle'),
        new IRI('exo:hasDescription'),
        new IRI('rdfs:label')
      ]);

      const context = createContext('exo:', ClauseType.WHERE);
      const result = await provider.getSuggestions(context);
      
      expect(result.isSuccess).toBe(true);
      const suggestions = result.getValue();
      expect(suggestions.some(s => s.text.includes('hasTitle'))).toBe(true);
      expect(suggestions.some(s => s.text.includes('hasDescription'))).toBe(true);
    });

    it('should filter by namespace prefix', async () => {
      mockGraph.getPredicates.mockReturnValue([
        new IRI('exo:hasTitle'),
        new IRI('rdfs:label'),
        new IRI('owl:sameAs')
      ]);

      const context = createContext('rdfs:', ClauseType.WHERE);
      const result = await provider.getSuggestions(context);
      
      const suggestions = result.getValue();
      expect(suggestions.some(s => s.text.includes('label'))).toBe(true);
      expect(suggestions.some(s => s.text.includes('hasTitle'))).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache property lists for performance', async () => {
      const context = createContext('exo:', ClauseType.WHERE);
      
      // First call
      await provider.getSuggestions(context);
      // Second call
      await provider.getSuggestions(context);
      
      // Graph should only be queried once
      expect(mockGraph.getPredicates).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache when graph changes', async () => {
      const context = createContext('exo:', ClauseType.WHERE);
      
      await provider.getSuggestions(context);
      
      // Simulate graph change
      provider.onGraphChanged();
      
      await provider.getSuggestions(context);
      
      expect(mockGraph.getPredicates).toHaveBeenCalledTimes(2);
    });
  });
});
```

#### 1.3 Autocomplete Engine Tests
```typescript
// /tests/unit/sparql/autocomplete/AutocompleteEngine.test.ts
describe('AutocompleteEngine', () => {
  let engine: AutocompleteEngine;
  let mockAnalyzer: jest.Mocked<ContextAnalyzer>;
  let mockProviders: jest.Mocked<SuggestionProvider>[];
  let mockCache: jest.Mocked<SuggestionCache>;

  beforeEach(() => {
    mockAnalyzer = createMockContextAnalyzer();
    mockProviders = [
      createMockKeywordProvider(),
      createMockPropertyProvider()
    ];
    mockCache = createMockSuggestionCache();
    
    engine = new AutocompleteEngine(mockAnalyzer, mockProviders, mockCache);
  });

  describe('Suggestion Aggregation', () => {
    it('should combine suggestions from multiple providers', async () => {
      mockProviders[0].getSuggestions.mockResolvedValue(
        Result.ok([createSuggestion('SELECT', SuggestionType.KEYWORD)])
      );
      mockProviders[1].getSuggestions.mockResolvedValue(
        Result.ok([createSuggestion('exo:hasTitle', SuggestionType.PROPERTY)])
      );

      const result = await engine.getSuggestions('SEL', 3);
      
      expect(result.isSuccess).toBe(true);
      const suggestions = result.getValue();
      expect(suggestions).toHaveLength(2);
      expect(suggestions.some(s => s.type === SuggestionType.KEYWORD)).toBe(true);
      expect(suggestions.some(s => s.type === SuggestionType.PROPERTY)).toBe(true);
    });

    it('should handle provider failures gracefully', async () => {
      mockProviders[0].getSuggestions.mockResolvedValue(
        Result.ok([createSuggestion('SELECT', SuggestionType.KEYWORD)])
      );
      mockProviders[1].getSuggestions.mockResolvedValue(
        Result.fail('Provider failed')
      );

      const result = await engine.getSuggestions('SEL', 3);
      
      expect(result.isSuccess).toBe(true);
      const suggestions = result.getValue();
      expect(suggestions).toHaveLength(1);
    });
  });

  describe('Ranking Algorithm', () => {
    it('should rank suggestions by relevance score', async () => {
      const highRelevance = createSuggestion('SELECT', SuggestionType.KEYWORD, 0.9);
      const lowRelevance = createSuggestion('CONSTRUCT', SuggestionType.KEYWORD, 0.3);
      
      mockProviders[0].getSuggestions.mockResolvedValue(
        Result.ok([lowRelevance, highRelevance])
      );

      const result = await engine.getSuggestions('S', 1);
      const suggestions = result.getValue();
      
      expect(suggestions[0]).toBe(highRelevance);
      expect(suggestions[1]).toBe(lowRelevance);
    });

    it('should limit suggestions to configured maximum', async () => {
      const manySuggestions = Array.from({ length: 100 }, (_, i) =>
        createSuggestion(`suggestion${i}`, SuggestionType.KEYWORD)
      );
      
      mockProviders[0].getSuggestions.mockResolvedValue(
        Result.ok(manySuggestions)
      );

      const result = await engine.getSuggestions('s', 1);
      const suggestions = result.getValue();
      
      expect(suggestions.length).toBeLessThanOrEqual(50); // Default max
    });
  });

  describe('Caching', () => {
    it('should return cached results when available', async () => {
      const cachedSuggestions = [createSuggestion('SELECT', SuggestionType.KEYWORD)];
      mockCache.get.mockReturnValue(cachedSuggestions);

      const result = await engine.getSuggestions('SEL', 3);
      
      expect(result.getValue()).toBe(cachedSuggestions);
      expect(mockProviders[0].getSuggestions).not.toHaveBeenCalled();
    });

    it('should cache results after generation', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockProviders[0].getSuggestions.mockResolvedValue(
        Result.ok([createSuggestion('SELECT', SuggestionType.KEYWORD)])
      );

      await engine.getSuggestions('SEL', 3);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(Number)
      );
    });
  });
});
```

### 2. Integration Tests

#### 2.1 End-to-End Autocomplete Flow
```typescript
// /tests/integration/sparql/autocomplete/AutocompleteFlow.test.ts
describe('SPARQL Autocomplete Integration', () => {
  let plugin: ExocortexPlugin;
  let testVault: FakeVaultAdapter;
  let processor: EnhancedSPARQLProcessor;

  beforeEach(async () => {
    testVault = new FakeVaultAdapter();
    // Add test data to vault
    await testVault.create('test-asset.md', `
---
title: Test Asset
type: Asset
hasDescription: Test description
---
# Test Asset
This is a test asset.
    `);

    plugin = await createTestPlugin(testVault);
    await plugin.onload();
    processor = plugin.getAutocompleteProcessor();
  });

  describe('Property Suggestion Integration', () => {
    it('should suggest properties from vault data', async () => {
      const engine = processor.getAutocompleteEngine();
      
      const result = await engine.getSuggestions('SELECT ?s WHERE { ?s exo:', 31);
      
      expect(result.isSuccess).toBe(true);
      const suggestions = result.getValue();
      
      const propertySuggestions = suggestions.filter(s => s.type === SuggestionType.PROPERTY);
      expect(propertySuggestions.some(s => s.text.includes('hasDescription'))).toBe(true);
    });

    it('should update suggestions when vault data changes', async () => {
      // Add new asset with different property
      await testVault.create('new-asset.md', `
---
title: New Asset
hasCategory: Test Category
---
      `);

      // Trigger graph reload
      await processor.reloadGraph();

      const engine = processor.getAutocompleteEngine();
      const result = await engine.getSuggestions('SELECT ?s WHERE { ?s exo:', 31);
      
      const suggestions = result.getValue();
      expect(suggestions.some(s => s.text.includes('hasCategory'))).toBe(true);
    });
  });

  describe('Template Integration', () => {
    it('should provide built-in templates', async () => {
      const engine = processor.getAutocompleteEngine();
      
      const result = await engine.getSuggestions('', 0);
      
      const templateSuggestions = result.getValue()
        .filter(s => s.type === SuggestionType.TEMPLATE);
      
      expect(templateSuggestions.length).toBeGreaterThan(0);
      expect(templateSuggestions.some(s => s.text.includes('Asset Query'))).toBe(true);
    });

    it('should expand templates correctly', async () => {
      const template = 'SELECT ?asset ?title WHERE { ?asset exo:hasTitle ?title }';
      
      // Mock template insertion
      const mockInsert = jest.fn();
      const engine = processor.getAutocompleteEngine();
      
      const templateSuggestion = {
        text: 'Asset Query Template',
        type: SuggestionType.TEMPLATE,
        insertText: template,
        relevanceScore: 0.8
      };

      // Simulate template selection
      await engine.applyTemplate(templateSuggestion, mockInsert);
      
      expect(mockInsert).toHaveBeenCalledWith(template);
    });
  });
});
```

#### 2.2 Performance Integration Tests
```typescript
// /tests/integration/sparql/autocomplete/Performance.test.ts
describe('Autocomplete Performance', () => {
  let plugin: ExocortexPlugin;
  let processor: EnhancedSPARQLProcessor;

  beforeEach(async () => {
    // Create large dataset for performance testing
    const testVault = new FakeVaultAdapter();
    await createLargeDataset(testVault, 1000); // 1000 assets
    
    plugin = await createTestPlugin(testVault);
    await plugin.onload();
    processor = plugin.getAutocompleteProcessor();
  });

  it('should respond to suggestions within 100ms', async () => {
    const engine = processor.getAutocompleteEngine();
    
    const startTime = performance.now();
    const result = await engine.getSuggestions('SELECT ?s WHERE { ?s exo:', 31);
    const endTime = performance.now();
    
    expect(result.isSuccess).toBe(true);
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle concurrent requests efficiently', async () => {
    const engine = processor.getAutocompleteEngine();
    
    const requests = Array.from({ length: 10 }, () =>
      engine.getSuggestions('SELECT ?s WHERE { ?s exo:', 31)
    );
    
    const startTime = performance.now();
    const results = await Promise.all(requests);
    const endTime = performance.now();
    
    expect(results.every(r => r.isSuccess)).toBe(true);
    expect(endTime - startTime).toBeLessThan(500); // 10 requests in 500ms
  });

  it('should cache effectively under load', async () => {
    const engine = processor.getAutocompleteEngine();
    
    // First request (cache miss)
    const start1 = performance.now();
    await engine.getSuggestions('SELECT ?s WHERE { ?s exo:', 31);
    const time1 = performance.now() - start1;
    
    // Second request (cache hit)
    const start2 = performance.now();
    await engine.getSuggestions('SELECT ?s WHERE { ?s exo:', 31);
    const time2 = performance.now() - start2;
    
    expect(time2).toBeLessThan(time1 * 0.5); // Cache should be much faster
  });
});
```

### 3. UI Interaction Tests

#### 3.1 Keyboard Navigation Tests
```typescript
// /tests/integration/sparql/autocomplete/UI.test.ts
describe('Autocomplete UI Interaction', () => {
  let mockEditor: MockCodeMirrorEditor;
  let provider: SPARQLAutocompleteProvider;
  let engine: AutocompleteEngine;

  beforeEach(() => {
    mockEditor = new MockCodeMirrorEditor();
    engine = createTestAutocompleteEngine();
    provider = new SPARQLAutocompleteProvider(engine, DEFAULT_CONFIG);
    provider.initialize(mockEditor);
  });

  describe('Keyboard Navigation', () => {
    it('should show suggestions on Ctrl+Space', async () => {
      mockEditor.setValue('SEL');
      mockEditor.setCursor(0, 3);
      
      await mockEditor.triggerKeyDown({
        key: ' ',
        ctrlKey: true,
        preventDefault: jest.fn()
      });
      
      expect(provider.isShowingSuggestions()).toBe(true);
    });

    it('should navigate suggestions with arrow keys', async () => {
      // Show suggestions first
      await provider.showSuggestions(['SELECT', 'CONSTRUCT'], { line: 0, ch: 3 });
      
      // Navigate down
      await mockEditor.triggerKeyDown({
        key: 'ArrowDown',
        preventDefault: jest.fn()
      });
      
      expect(provider.getSelectedIndex()).toBe(1);
      
      // Navigate up
      await mockEditor.triggerKeyDown({
        key: 'ArrowUp',
        preventDefault: jest.fn()
      });
      
      expect(provider.getSelectedIndex()).toBe(0);
    });

    it('should apply suggestion on Enter', async () => {
      mockEditor.setValue('SEL');
      mockEditor.setCursor(0, 3);
      
      await provider.showSuggestions([{
        text: 'SELECT',
        type: SuggestionType.KEYWORD,
        insertText: 'SELECT',
        relevanceScore: 1.0
      }], { line: 0, ch: 3 });
      
      await mockEditor.triggerKeyDown({
        key: 'Enter',
        preventDefault: jest.fn()
      });
      
      expect(mockEditor.getValue()).toBe('SELECT');
    });

    it('should close suggestions on Escape', async () => {
      await provider.showSuggestions(['SELECT'], { line: 0, ch: 3 });
      
      await mockEditor.triggerKeyDown({
        key: 'Escape',
        preventDefault: jest.fn()
      });
      
      expect(provider.isShowingSuggestions()).toBe(false);
    });
  });

  describe('Mouse Interaction', () => {
    it('should apply suggestion on click', async () => {
      const suggestions = [{
        text: 'SELECT',
        type: SuggestionType.KEYWORD,
        insertText: 'SELECT',
        relevanceScore: 1.0
      }];
      
      await provider.showSuggestions(suggestions, { line: 0, ch: 3 });
      
      const suggestionWidget = provider.getSuggestionWidget();
      await suggestionWidget.clickSuggestion(0);
      
      expect(mockEditor.getValue()).toContain('SELECT');
    });

    it('should highlight suggestion on hover', async () => {
      await provider.showSuggestions(['SELECT', 'CONSTRUCT'], { line: 0, ch: 3 });
      
      const widget = provider.getSuggestionWidget();
      widget.hoverSuggestion(1);
      
      expect(widget.getHighlightedIndex()).toBe(1);
    });
  });
});
```

### 4. Accessibility Tests

#### 4.1 Screen Reader Compatibility
```typescript
// /tests/integration/sparql/autocomplete/Accessibility.test.ts
describe('Autocomplete Accessibility', () => {
  let container: HTMLElement;
  let widget: SuggestionWidget;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    widget = new SuggestionWidget(DEFAULT_UI_CONFIG);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('ARIA Attributes', () => {
    it('should have proper listbox role', async () => {
      const suggestions = [createSuggestion('SELECT', SuggestionType.KEYWORD)];
      widget.show(suggestions, { line: 0, ch: 0 });
      
      const listbox = widget.getElement();
      expect(listbox.getAttribute('role')).toBe('listbox');
      expect(listbox.getAttribute('aria-label')).toBe('SPARQL suggestions');
    });

    it('should mark selected option correctly', async () => {
      const suggestions = [
        createSuggestion('SELECT', SuggestionType.KEYWORD),
        createSuggestion('CONSTRUCT', SuggestionType.KEYWORD)
      ];
      
      widget.show(suggestions, { line: 0, ch: 0 });
      widget.selectNext();
      
      const options = widget.getElement().querySelectorAll('[role="option"]');
      expect(options[0].getAttribute('aria-selected')).toBe('false');
      expect(options[1].getAttribute('aria-selected')).toBe('true');
    });

    it('should provide accessible descriptions', async () => {
      const suggestion = createSuggestion('SELECT', SuggestionType.KEYWORD, 1.0, 'SPARQL keyword for selecting variables');
      widget.show([suggestion], { line: 0, ch: 0 });
      
      const option = widget.getElement().querySelector('[role="option"]');
      const describedBy = option.getAttribute('aria-describedby');
      const description = document.getElementById(describedBy);
      
      expect(description.textContent).toContain('SPARQL keyword');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be fully keyboard navigable', async () => {
      const suggestions = [
        createSuggestion('SELECT', SuggestionType.KEYWORD),
        createSuggestion('WHERE', SuggestionType.KEYWORD),
        createSuggestion('FILTER', SuggestionType.KEYWORD)
      ];
      
      widget.show(suggestions, { line: 0, ch: 0 });
      
      // Test full navigation cycle
      expect(widget.getSelectedIndex()).toBe(0);
      
      widget.selectNext();
      expect(widget.getSelectedIndex()).toBe(1);
      
      widget.selectNext();
      expect(widget.getSelectedIndex()).toBe(2);
      
      widget.selectNext(); // Should wrap to 0 or stay at 2
      expect(widget.getSelectedIndex()).toBeLessThanOrEqual(2);
      
      widget.selectPrevious();
      expect(widget.getSelectedIndex()).toBe(1);
    });

    it('should handle focus management correctly', async () => {
      widget.show([createSuggestion('SELECT', SuggestionType.KEYWORD)], { line: 0, ch: 0 });
      
      const focusableElements = widget.getElement().querySelectorAll('[tabindex], button, input');
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // First element should be focusable
      const firstElement = focusableElements[0] as HTMLElement;
      expect(firstElement.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Color and Contrast', () => {
    it('should meet WCAG contrast requirements', async () => {
      widget.show([createSuggestion('SELECT', SuggestionType.KEYWORD)], { line: 0, ch: 0 });
      
      const option = widget.getElement().querySelector('.suggestion-item');
      const styles = window.getComputedStyle(option);
      
      // This would require actual color contrast calculation
      // For now, check that colors are set
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });

    it('should not rely solely on color for information', async () => {
      const suggestions = [
        createSuggestion('SELECT', SuggestionType.KEYWORD),
        createSuggestion('exo:hasTitle', SuggestionType.PROPERTY)
      ];
      
      widget.show(suggestions, { line: 0, ch: 0 });
      
      const options = widget.getElement().querySelectorAll('.suggestion-item');
      
      // Check for non-color indicators (icons, text labels)
      options.forEach(option => {
        const typeIndicator = option.querySelector('.suggestion-type');
        const typeLabel = option.querySelector('.suggestion-type-label');
        
        expect(typeIndicator || typeLabel).toBeTruthy();
      });
    });
  });
});
```

### 5. Performance Tests

#### 5.1 Load Testing
```typescript
// /tests/performance/sparql/autocomplete/LoadTest.test.ts
describe('Autocomplete Performance Under Load', () => {
  let engine: AutocompleteEngine;
  let largeGraph: Graph;

  beforeEach(async () => {
    // Create graph with 10,000 triples for load testing
    largeGraph = await createLargeGraph(10000);
    engine = new AutocompleteEngine(
      new ContextAnalyzer(),
      [new PropertySuggestionProvider(largeGraph)],
      new LRUCache(1000)
    );
  });

  it('should maintain performance with large datasets', async () => {
    const iterations = 100;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = await engine.getSuggestions('SELECT ?s WHERE { ?s exo:', 31);
      const end = performance.now();
      
      expect(result.isSuccess).toBe(true);
      times.push(end - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const p95Time = times.sort()[Math.floor(times.length * 0.95)];
    
    expect(avgTime).toBeLessThan(50); // Average under 50ms
    expect(p95Time).toBeLessThan(100); // 95th percentile under 100ms
  });

  it('should handle memory efficiently', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Generate many suggestions to test memory usage
    for (let i = 0; i < 1000; i++) {
      await engine.getSuggestions(`SELECT ?s${i} WHERE { ?s${i} exo:`, 35);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should not increase memory by more than 50MB
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  it('should handle concurrent requests without degradation', async () => {
    const concurrentRequests = 50;
    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      engine.getSuggestions(`SELECT ?s${i} WHERE { ?s${i} exo:`, 35)
    );
    
    const start = performance.now();
    const results = await Promise.all(requests);
    const end = performance.now();
    
    expect(results.every(r => r.isSuccess)).toBe(true);
    expect(end - start).toBeLessThan(1000); // All requests in 1 second
  });
});
```

### 6. User Acceptance Tests

#### 6.1 User Journey Tests
```typescript
// /tests/acceptance/sparql/autocomplete/UserJourneys.test.ts
describe('SPARQL Autocomplete User Journeys', () => {
  let plugin: ExocortexPlugin;
  let mockEditor: MockCodeMirrorEditor;

  beforeEach(async () => {
    plugin = await createTestPlugin();
    mockEditor = new MockCodeMirrorEditor();
    await plugin.enableAutocomplete(mockEditor);
  });

  describe('New User Experience', () => {
    it('should help new user write first query', async () => {
      // User starts typing
      mockEditor.setValue('S');
      await mockEditor.triggerInput();
      
      // Should show suggestions
      expect(plugin.getAutocompleteProvider().isShowingSuggestions()).toBe(true);
      
      // User selects SELECT
      await mockEditor.triggerKeyDown({ key: 'Enter' });
      expect(mockEditor.getValue()).toContain('SELECT');
      
      // Continue with WHERE
      mockEditor.appendValue(' ');
      await mockEditor.triggerInput();
      
      // Should suggest WHERE clause keywords
      const suggestions = plugin.getAutocompleteProvider().getCurrentSuggestions();
      expect(suggestions.some(s => s.text === 'WHERE')).toBe(true);
    });

    it('should provide helpful templates for beginners', async () => {
      // User triggers autocomplete at empty query
      await mockEditor.triggerKeyDown({ key: ' ', ctrlKey: true });
      
      const suggestions = plugin.getAutocompleteProvider().getCurrentSuggestions();
      const templates = suggestions.filter(s => s.type === SuggestionType.TEMPLATE);
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.text.includes('Asset Query'))).toBe(true);
    });
  });

  describe('Expert User Experience', () => {
    it('should provide advanced property suggestions', async () => {
      mockEditor.setValue('SELECT ?s WHERE { ?s exo:');
      await mockEditor.triggerInput();
      
      const suggestions = plugin.getAutocompleteProvider().getCurrentSuggestions();
      const properties = suggestions.filter(s => s.type === SuggestionType.PROPERTY);
      
      expect(properties.length).toBeGreaterThan(5);
      expect(properties.every(p => p.text.startsWith('exo:'))).toBe(true);
    });

    it('should maintain high performance during complex queries', async () => {
      const complexQuery = `
        SELECT ?asset ?title ?description ?category
        WHERE {
          ?asset exo:hasTitle ?title .
          ?asset exo:hasDescription ?description .
          OPTIONAL { ?asset exo:hasCategory ?category }
          FILTER(REGEX(?title, "
      `;
      
      mockEditor.setValue(complexQuery);
      
      const start = performance.now();
      await mockEditor.triggerInput();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100);
      expect(plugin.getAutocompleteProvider().isShowingSuggestions()).toBe(true);
    });
  });
});
```

## Test Automation

### Continuous Integration Tests
```yaml
# .github/workflows/test-autocomplete.yml
name: SPARQL Autocomplete Tests

on:
  push:
    paths:
      - 'src/**/*autocomplete*'
      - 'src/domain/sparql/**'
      - 'tests/**/*autocomplete*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run autocomplete unit tests
        run: npm run test -- --testPathPattern=autocomplete
      
      - name: Run performance tests
        run: npm run test:performance -- autocomplete
      
      - name: Run accessibility tests
        run: npm run test:a11y -- autocomplete
      
      - name: Check coverage
        run: npm run coverage -- --coverageDirectory=coverage/autocomplete
```

### Test Data Management
```typescript
// /tests/helpers/autocomplete/TestDataBuilder.ts
export class AutocompleteTestDataBuilder {
  static createMockGraph(propertyCount: number = 10): Graph {
    const graph = new Graph();
    
    for (let i = 0; i < propertyCount; i++) {
      graph.add(new Triple(
        new IRI(`exo:asset${i}`),
        new IRI(`exo:property${i}`),
        Literal.string(`value${i}`)
      ));
    }
    
    return graph;
  }

  static createTestContext(
    query: string,
    position: number,
    clause: ClauseType = ClauseType.SELECT
  ): QueryContext {
    return {
      queryText: query,
      cursorPosition: position,
      currentToken: this.extractToken(query, position),
      precedingTokens: [],
      clauseContext: clause,
      variables: new Set(),
      namespaces: new Map()
    };
  }

  static createSuggestion(
    text: string,
    type: SuggestionType,
    relevanceScore: number = 1.0,
    description?: string
  ): Suggestion {
    return {
      text,
      type,
      insertText: text,
      relevanceScore,
      description
    };
  }
}
```

## Success Criteria

### Test Coverage Goals
- [ ] Unit test coverage ≥ 70% for all autocomplete components
- [ ] Integration test coverage for all major user workflows
- [ ] Performance tests validate <100ms response time requirement
- [ ] Accessibility tests pass WCAG 2.1 AA compliance
- [ ] All error scenarios handled gracefully

### Quality Gates
- [ ] Zero critical bugs in autocomplete functionality
- [ ] Zero regressions in existing SPARQL processing
- [ ] All acceptance criteria from Product Manager satisfied
- [ ] Performance benchmarks met under load testing
- [ ] Cross-browser compatibility verified

### User Experience Validation
- [ ] New users can write successful queries within 5 minutes
- [ ] Expert users show improved query writing speed
- [ ] Suggestion accuracy >90% for common scenarios
- [ ] User satisfaction score >4.5/5 in feedback

This comprehensive testing strategy ensures the SPARQL Autocomplete feature meets high quality standards while maintaining the reliability of the existing plugin functionality.