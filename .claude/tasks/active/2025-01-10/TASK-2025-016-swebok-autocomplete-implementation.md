# Task: SWEBOK Engineer - SPARQL Autocomplete Implementation

**Task ID**: TASK-2025-016
**Agent**: SWEBOK Engineer
**Priority**: High
**Status**: pending
**Created**: 2025-01-10
**Deadline**: 2025-01-15

## Context

Implement the SPARQL Autocomplete system based on the architecture designed by the Architect Agent and UI specifications from the UX Designer. This includes core autocomplete engine, suggestion providers, and editor integration.

## Technical Requirements

### Architecture Compliance
- Follow Clean Architecture patterns established in codebase
- Integrate with existing DI container
- Maintain SOLID principles
- Use Result<T> pattern for error handling
- Follow TypeScript strict mode requirements

### Performance Requirements
- Suggestion response time < 100ms (95th percentile)
- Non-blocking UI thread
- Memory efficient caching
- Graceful degradation under load

## Implementation Tasks

### Phase 1: Core Domain Models

#### 1.1 Domain Value Objects
Create `/src/domain/sparql/` directory structure:

```typescript
// /src/domain/sparql/Suggestion.ts
export interface Suggestion {
  readonly text: string;
  readonly type: SuggestionType;
  readonly description?: string;
  readonly insertText: string;
  readonly cursorOffset?: number;
  readonly relevanceScore: number;
  readonly category?: string;
}

export enum SuggestionType {
  KEYWORD = 'keyword',
  PROPERTY = 'property',
  VARIABLE = 'variable',
  TEMPLATE = 'template',
  NAMESPACE = 'namespace',
  FUNCTION = 'function'
}

// /src/domain/sparql/QueryContext.ts
export interface QueryContext {
  readonly queryText: string;
  readonly cursorPosition: number;
  readonly currentToken?: string;
  readonly precedingTokens: string[];
  readonly clauseContext: ClauseType;
  readonly variables: Set<string>;
  readonly namespaces: Map<string, string>;
}

export enum ClauseType {
  SELECT, CONSTRUCT, ASK, DESCRIBE,
  WHERE, OPTIONAL, UNION, FILTER,
  ORDER_BY, GROUP_BY, HAVING
}
```

#### 1.2 Domain Entities
```typescript
// /src/domain/sparql/AutocompleteKnowledge.ts
export class AutocompleteKnowledge extends Entity<string> {
  private constructor(
    id: string,
    private readonly properties: Map<string, PropertyInfo>,
    private readonly namespaces: Map<string, string>,
    private readonly templates: QueryTemplate[]
  ) {
    super(id);
  }

  public static create(
    properties: Map<string, PropertyInfo>,
    namespaces: Map<string, string>,
    templates: QueryTemplate[]
  ): Result<AutocompleteKnowledge> {
    // Validation and creation logic
  }
}

interface PropertyInfo {
  uri: string;
  label: string;
  description?: string;
  usageCount: number;
  domainTypes?: string[];
  rangeTypes?: string[];
}

interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
}
```

### Phase 2: Application Layer Services

#### 2.1 Context Analyzer
```typescript
// /src/application/services/sparql/ContextAnalyzer.ts
export class ContextAnalyzer {
  public analyze(queryText: string, cursorPosition: number): Result<QueryContext> {
    try {
      const currentToken = this.extractCurrentToken(queryText, cursorPosition);
      const precedingTokens = this.extractPrecedingTokens(queryText, cursorPosition);
      const clauseContext = this.determineClauseContext(precedingTokens);
      const variables = this.extractVariables(queryText);
      const namespaces = this.extractNamespaces(queryText);

      return Result.ok({
        queryText,
        cursorPosition,
        currentToken,
        precedingTokens,
        clauseContext,
        variables,
        namespaces
      });
    } catch (error) {
      return Result.fail(`Context analysis failed: ${error.message}`);
    }
  }

  private extractCurrentToken(queryText: string, position: number): string | undefined {
    // Implementation for extracting token at cursor
  }

  private determineClauseContext(tokens: string[]): ClauseType {
    // Implementation for determining current SPARQL clause
  }
}
```

#### 2.2 Suggestion Providers
```typescript
// /src/application/services/sparql/providers/SuggestionProvider.ts
export interface SuggestionProvider {
  getSuggestions(context: QueryContext): Promise<Result<Suggestion[]>>;
  getType(): SuggestionType;
  isApplicable(context: QueryContext): boolean;
}

// /src/application/services/sparql/providers/KeywordSuggestionProvider.ts
export class KeywordSuggestionProvider implements SuggestionProvider {
  private readonly keywords = new Map<ClauseType, string[]>([
    [ClauseType.SELECT, ['SELECT', 'DISTINCT', 'REDUCED', '*']],
    [ClauseType.WHERE, ['WHERE', 'OPTIONAL', 'UNION', 'FILTER', 'BIND']],
    // ... more mappings
  ]);

  public async getSuggestions(context: QueryContext): Promise<Result<Suggestion[]>> {
    try {
      const applicableKeywords = this.getApplicableKeywords(context);
      const filteredKeywords = this.filterByInput(applicableKeywords, context.currentToken);
      
      const suggestions = filteredKeywords.map(keyword => ({
        text: keyword,
        type: SuggestionType.KEYWORD,
        description: this.getKeywordDescription(keyword),
        insertText: keyword,
        relevanceScore: this.calculateRelevance(keyword, context)
      }));

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Keyword suggestion failed: ${error.message}`);
    }
  }
}

// /src/application/services/sparql/providers/PropertySuggestionProvider.ts
export class PropertySuggestionProvider implements SuggestionProvider {
  constructor(
    private readonly graph: Graph,
    private readonly propertyCache: Map<string, PropertyInfo[]> = new Map()
  ) {}

  public async getSuggestions(context: QueryContext): Promise<Result<Suggestion[]>> {
    try {
      const properties = await this.extractProperties(context);
      const filteredProperties = this.filterByInput(properties, context.currentToken);
      
      const suggestions = filteredProperties.map(property => ({
        text: this.formatProperty(property),
        type: SuggestionType.PROPERTY,
        description: property.description || `Property used ${property.usageCount} times`,
        insertText: this.formatProperty(property),
        relevanceScore: this.calculatePropertyRelevance(property, context)
      }));

      return Result.ok(suggestions);
    } catch (error) {
      return Result.fail(`Property suggestion failed: ${error.message}`);
    }
  }

  private async extractProperties(context: QueryContext): Promise<PropertyInfo[]> {
    // Cache properties by subject type if available
    const cacheKey = this.getCacheKey(context);
    if (this.propertyCache.has(cacheKey)) {
      return this.propertyCache.get(cacheKey)!;
    }

    // Extract properties from graph
    const properties = this.extractPropertiesFromGraph(context);
    this.propertyCache.set(cacheKey, properties);
    
    return properties;
  }
}
```

#### 2.3 Autocomplete Engine
```typescript
// /src/application/services/sparql/AutocompleteEngine.ts
export class AutocompleteEngine {
  constructor(
    private readonly contextAnalyzer: ContextAnalyzer,
    private readonly suggestionProviders: SuggestionProvider[],
    private readonly cache: SuggestionCache,
    private readonly config: AutocompleteConfig = DEFAULT_CONFIG
  ) {}

  public async getSuggestions(
    queryText: string,
    cursorPosition: number
  ): Promise<Result<Suggestion[]>> {
    try {
      // Check cache first
      const cacheKey = this.createCacheKey(queryText, cursorPosition);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return Result.ok(cached);
      }

      // Analyze context
      const contextResult = this.contextAnalyzer.analyze(queryText, cursorPosition);
      if (contextResult.isFailure) {
        return Result.fail(contextResult.errorValue());
      }

      const context = contextResult.getValue();

      // Get suggestions from all applicable providers
      const suggestionPromises = this.suggestionProviders
        .filter(provider => provider.isApplicable(context))
        .map(provider => provider.getSuggestions(context));

      const results = await Promise.all(suggestionPromises);
      
      // Combine and rank suggestions
      const allSuggestions: Suggestion[] = [];
      for (const result of results) {
        if (result.isSuccess) {
          allSuggestions.push(...result.getValue());
        }
      }

      const rankedSuggestions = this.rankSuggestions(allSuggestions, context);
      const finalSuggestions = rankedSuggestions.slice(0, this.config.maxSuggestions);

      // Cache results
      this.cache.set(cacheKey, finalSuggestions, this.config.cacheTTL);

      return Result.ok(finalSuggestions);
    } catch (error) {
      return Result.fail(`Autocomplete engine failed: ${error.message}`);
    }
  }

  private rankSuggestions(suggestions: Suggestion[], context: QueryContext): Suggestion[] {
    return suggestions
      .sort((a, b) => {
        // Primary sort by relevance score
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Secondary sort by alphabetical order
        return a.text.localeCompare(b.text);
      });
  }
}
```

### Phase 3: Presentation Layer Integration

#### 3.1 Editor Integration
```typescript
// /src/presentation/services/SPARQLAutocompleteProvider.ts
export class SPARQLAutocompleteProvider {
  private suggestionWidget?: SuggestionWidget;
  private currentEditor?: Editor;

  constructor(
    private readonly autocompleteEngine: AutocompleteEngine,
    private readonly config: AutocompleteUIConfig
  ) {}

  public initialize(editor: Editor): void {
    this.currentEditor = editor;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (!this.currentEditor) return;

    // Keyboard event handlers
    this.currentEditor.on('keydown', this.handleKeyDown.bind(this));
    this.currentEditor.on('input', this.handleInput.bind(this));
    this.currentEditor.on('blur', this.handleBlur.bind(this));
  }

  private async handleInput(event: InputEvent): void {
    const cursor = this.currentEditor!.getCursor();
    const query = this.currentEditor!.getValue();

    // Debounce input
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }

    this.inputTimeout = setTimeout(async () => {
      await this.showSuggestions(query, cursor);
    }, this.config.debounceMs);
  }

  private async handleKeyDown(event: KeyboardEvent): void {
    // Handle autocomplete shortcuts
    if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
      event.preventDefault();
      const cursor = this.currentEditor!.getCursor();
      const query = this.currentEditor!.getValue();
      await this.showSuggestions(query, cursor);
      return;
    }

    // Handle suggestion navigation
    if (this.suggestionWidget?.isVisible()) {
      switch (event.code) {
        case 'ArrowUp':
          event.preventDefault();
          this.suggestionWidget.selectPrevious();
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.suggestionWidget.selectNext();
          break;
        case 'Enter':
        case 'Tab':
          event.preventDefault();
          await this.applySuggestion();
          break;
        case 'Escape':
          this.hideSuggestions();
          break;
      }
    }
  }

  private async showSuggestions(query: string, cursor: EditorPosition): Promise<void> {
    try {
      const position = this.calculateCursorPosition(query, cursor);
      const result = await this.autocompleteEngine.getSuggestions(query, position);

      if (result.isFailure) {
        console.warn('Autocomplete failed:', result.errorValue());
        return;
      }

      const suggestions = result.getValue();
      if (suggestions.length === 0) {
        this.hideSuggestions();
        return;
      }

      if (!this.suggestionWidget) {
        this.suggestionWidget = new SuggestionWidget(this.config.ui);
      }

      this.suggestionWidget.show(suggestions, cursor);
    } catch (error) {
      console.error('Error showing suggestions:', error);
    }
  }
}
```

#### 3.2 Suggestion Widget
```typescript
// /src/presentation/components/SuggestionWidget.ts
export class SuggestionWidget {
  private container?: HTMLElement;
  private suggestions: Suggestion[] = [];
  private selectedIndex = 0;

  constructor(private readonly config: SuggestionUIConfig) {}

  public show(suggestions: Suggestion[], position: EditorPosition): void {
    this.suggestions = suggestions;
    this.selectedIndex = 0;
    
    if (!this.container) {
      this.createContainer();
    }

    this.render();
    this.position(position);
    this.container!.style.display = 'block';
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.className = 'exocortex-suggestions';
    this.container.setAttribute('role', 'listbox');
    this.container.setAttribute('aria-label', 'SPARQL suggestions');
    
    // Add to editor container
    const editorContainer = document.querySelector('.cm-editor');
    if (editorContainer) {
      editorContainer.appendChild(this.container);
    }
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'exocortex-suggestions__header';
    header.innerHTML = `
      <span class="exocortex-suggestions__title">📝 Suggestions</span>
      <button class="exocortex-suggestions__close" aria-label="Close suggestions">⨯</button>
    `;
    this.container.appendChild(header);

    // Create suggestion list
    const list = document.createElement('div');
    list.className = 'exocortex-suggestions__list';
    
    this.suggestions.forEach((suggestion, index) => {
      const item = this.createSuggestionItem(suggestion, index);
      list.appendChild(item);
    });

    this.container.appendChild(list);

    // Add description area
    const description = document.createElement('div');
    description.className = 'exocortex-suggestions__description';
    this.updateDescription();
    this.container.appendChild(description);
  }

  private createSuggestionItem(suggestion: Suggestion, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = `exocortex-suggestions__item${index === this.selectedIndex ? ' selected' : ''}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', index === this.selectedIndex ? 'true' : 'false');
    
    const icon = this.getTypeIcon(suggestion.type);
    const typeLabel = this.getTypeLabel(suggestion.type);
    
    item.innerHTML = `
      <span class="suggestion-type ${suggestion.type}">${icon}</span>
      <span class="suggestion-text">${this.escapeHtml(suggestion.text)}</span>
      <span class="suggestion-type-label">${typeLabel}</span>
    `;

    item.addEventListener('click', () => {
      this.selectedIndex = index;
      this.applySuggestion();
    });

    return item;
  }

  public selectNext(): void {
    this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
    this.updateSelection();
  }

  public selectPrevious(): void {
    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    this.updateSelection();
  }

  public getSelectedSuggestion(): Suggestion | null {
    return this.suggestions[this.selectedIndex] || null;
  }
}
```

### Phase 4: Integration with Existing Code

#### 4.1 Enhanced SPARQL Processor
```typescript
// Extend existing SPARQLProcessor
export class EnhancedSPARQLProcessor extends SPARQLProcessor {
  private autocompleteProvider?: SPARQLAutocompleteProvider;

  constructor(
    plugin: Plugin,
    graph: Graph,
    focusService?: ExoFocusService,
    cacheConfig?: Partial<QueryCacheConfig>,
    private readonly autocompleteEngine?: AutocompleteEngine
  ) {
    super(plugin, graph, focusService, cacheConfig);
  }

  async processCodeBlock(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    // Call parent implementation
    await super.processCodeBlock(source, el, ctx);

    // Add autocomplete if in edit mode
    if (this.autocompleteEngine && this.isEditableContext(ctx)) {
      await this.enableAutocomplete(el, ctx);
    }
  }

  private async enableAutocomplete(el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
    // Find the editor instance
    const editor = this.findCodeMirrorEditor(el);
    if (editor) {
      if (!this.autocompleteProvider) {
        this.autocompleteProvider = new SPARQLAutocompleteProvider(
          this.autocompleteEngine!,
          DEFAULT_AUTOCOMPLETE_CONFIG
        );
      }
      this.autocompleteProvider.initialize(editor);
    }
  }
}
```

#### 4.2 Dependency Injection Setup
```typescript
// /src/infrastructure/container/DIContainer.ts
// Add autocomplete services to container

export class DIContainer {
  private setupAutocompleteServices(): void {
    // Context analyzer
    this.container.register('ContextAnalyzer', ContextAnalyzer);

    // Suggestion providers
    this.container.register('KeywordSuggestionProvider', KeywordSuggestionProvider);
    this.container.register('PropertySuggestionProvider', PropertySuggestionProvider, {
      dependencies: ['Graph']
    });
    this.container.register('VariableSuggestionProvider', VariableSuggestionProvider);
    this.container.register('NamespaceSuggestionProvider', NamespaceSuggestionProvider);
    this.container.register('TemplateSuggestionProvider', TemplateSuggestionProvider);

    // Autocomplete engine
    this.container.register('AutocompleteEngine', AutocompleteEngine, {
      dependencies: [
        'ContextAnalyzer',
        'SuggestionProviders',
        'SuggestionCache'
      ]
    });

    // UI provider
    this.container.register('SPARQLAutocompleteProvider', SPARQLAutocompleteProvider, {
      dependencies: ['AutocompleteEngine']
    });
  }
}
```

## Implementation Standards

### Code Quality
- Follow existing TypeScript ESLint configuration
- Maintain 70%+ test coverage
- Use Result<T> pattern for error handling
- Implement proper logging with console.debug/warn/error

### Performance Standards
- Debounce user input (150ms default)
- Cache suggestions with LRU eviction
- Lazy load suggestion providers
- Use AbortController for cancelled requests

### Error Handling
```typescript
// Example error handling pattern
public async getSuggestions(context: QueryContext): Promise<Result<Suggestion[]>> {
  try {
    // Implementation
    return Result.ok(suggestions);
  } catch (error) {
    console.warn('Suggestion provider failed:', error);
    return Result.fail(`${this.getType()} suggestions failed: ${error.message}`);
  }
}
```

## Testing Requirements

### Unit Tests
- Test each suggestion provider independently
- Test context analyzer with various SPARQL queries
- Test autocomplete engine ranking algorithms
- Mock dependencies using existing patterns

### Integration Tests
- Test full autocomplete pipeline
- Test editor integration
- Test caching behavior
- Test error handling and recovery

### Performance Tests
- Benchmark suggestion response times
- Test with large property sets (>1000 properties)
- Test memory usage under load
- Test UI responsiveness

## Configuration

### Default Configuration
```typescript
export const DEFAULT_AUTOCOMPLETE_CONFIG: AutocompleteConfig = {
  debounceMs: 150,
  maxSuggestions: 50,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  cacheSize: 1000,
  enableKeywords: true,
  enableProperties: true,
  enableVariables: true,
  enableTemplates: true,
  enableNamespaces: true,
  ui: {
    maxHeight: 300,
    maxWidth: 400,
    showDescriptions: true,
    showIcons: true
  }
};
```

## Migration Strategy

### Phase 1: Core Implementation (Week 1)
- Domain models and interfaces
- Context analyzer
- Keyword suggestion provider
- Basic autocomplete engine

### Phase 2: Property Integration (Week 2)
- Property suggestion provider
- Graph integration
- Caching implementation
- Performance optimization

### Phase 3: UI Integration (Week 2-3)
- Suggestion widget
- Editor integration
- Keyboard navigation
- Visual styling

### Phase 4: Advanced Features (Week 3-4)
- Template suggestions
- Variable suggestions
- Namespace completion
- Polish and optimization

## Success Criteria

### Functional Requirements
- [ ] All suggestion types implemented and working
- [ ] Context-aware suggestions based on cursor position
- [ ] Keyboard navigation (arrow keys, Enter, Escape)
- [ ] Property extraction from graph working correctly
- [ ] Template system functional

### Performance Requirements
- [ ] Suggestion response time < 100ms (95th percentile)
- [ ] Memory usage < 50MB for autocomplete cache
- [ ] No UI blocking during suggestion generation
- [ ] Smooth typing experience (no lag)

### Quality Requirements
- [ ] 70%+ test coverage
- [ ] No TypeScript errors or warnings
- [ ] Passes all existing tests
- [ ] Follows existing code patterns and standards

## Dependencies

### Internal Dependencies
- Graph implementation for property extraction
- Existing SPARQL processing infrastructure
- DI container for service registration
- Result<T> pattern for error handling

### External Dependencies
- Obsidian Editor API
- CodeMirror extensions (if needed)
- No new external dependencies (reuse existing)

## Deliverables

1. **Core Implementation**
   - [ ] Domain models (Suggestion, QueryContext, etc.)
   - [ ] Context analyzer service
   - [ ] Suggestion provider interfaces and implementations
   - [ ] Autocomplete engine with ranking

2. **UI Implementation**
   - [ ] Suggestion widget component
   - [ ] Editor integration service
   - [ ] CSS styling for suggestions popup
   - [ ] Keyboard navigation handling

3. **Integration**
   - [ ] Enhanced SPARQL processor
   - [ ] DI container configuration
   - [ ] Configuration system
   - [ ] Performance optimizations

4. **Testing**
   - [ ] Unit tests for all components
   - [ ] Integration tests for full pipeline
   - [ ] Performance benchmarks
   - [ ] UI interaction tests

This implementation provides a robust, performant, and user-friendly SPARQL autocomplete system that integrates seamlessly with the existing Exocortex plugin architecture.