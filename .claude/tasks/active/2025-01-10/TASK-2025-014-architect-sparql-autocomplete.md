# Task: Architect Agent - SPARQL Autocomplete System Design

**Task ID**: TASK-2025-014
**Agent**: Architect Agent
**Priority**: High
**Status**: pending
**Created**: 2025-01-10
**Deadline**: 2025-01-12

## Context

Design the system architecture for SPARQL Autocomplete functionality in the Exocortex plugin. The system must integrate with existing SPARQL processing infrastructure while providing fast, context-aware suggestions.

## Current Architecture Analysis

### Existing SPARQL Infrastructure
- **SPARQLProcessor**: Main entry point for processing code blocks
- **SPARQLEngine**: Query execution (application layer)
- **SPARQLEngine** (domain): Core query processing logic
- **Graph**: Triple store with indexing capabilities
- **SPARQLSanitizer**: Query validation and security

### Integration Points Identified
1. **Presentation Layer**: SPARQLProcessor processes markdown code blocks
2. **Domain Layer**: Graph contains properties and namespaces for suggestions
3. **Application Layer**: SPARQLEngine has query parsing capabilities
4. **Infrastructure**: Obsidian editor APIs for UI integration

## System Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
├─────────────────────────────────────────────────────────────┤
│  SPARQLAutocompleteProvider                                 │
│  ├─ EditorIntegration (Obsidian CodeMirror)                │
│  ├─ SuggestionRenderer                                      │
│  └─ KeyboardEventHandler                                    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
├─────────────────────────────────────────────────────────────┤
│  AutocompleteEngine                                         │
│  ├─ SuggestionAggregator                                   │
│  ├─ ContextAnalyzer                                        │
│  ├─ QueryParser (lightweight)                              │
│  └─ SuggestionCache                                        │
│                                                             │
│  SuggestionProviders:                                       │
│  ├─ KeywordSuggestionProvider                              │
│  ├─ PropertySuggestionProvider                             │
│  ├─ VariableSuggestionProvider                             │
│  ├─ TemplateSuggestionProvider                             │
│  └─ NamespaceSuggestionProvider                            │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Suggestion (Value Object)                                  │
│  SuggestionType (Enum)                                     │
│  QueryContext (Entity)                                     │
│  AutocompleteKnowledge (Entity)                            │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
├─────────────────────────────────────────────────────────────┤
│  PropertyExtractor (reads from Graph)                       │
│  NamespaceRegistry                                          │
│  TemplateRepository                                         │
│  SuggestionCache (LRU)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. SPARQLAutocompleteProvider (Presentation)
```typescript
interface SPARQLAutocompleteProvider {
  initialize(editor: Editor, sparqlProcessor: SPARQLProcessor): void;
  onKeyPress(event: KeyboardEvent): Promise<void>;
  showSuggestions(suggestions: Suggestion[], position: EditorPosition): void;
  hideSuggestions(): void;
  selectSuggestion(suggestion: Suggestion): void;
}
```

**Responsibilities:**
- Integrate with Obsidian editor (CodeMirror)
- Handle keyboard events (Ctrl+Space, arrow navigation, Enter/Tab)
- Render suggestion popup with proper styling
- Apply selected suggestions to editor

#### 2. AutocompleteEngine (Application)
```typescript
interface AutocompleteEngine {
  getSuggestions(
    query: string, 
    cursorPosition: number,
    context: QueryContext
  ): Promise<Suggestion[]>;
}

class AutocompleteEngineImpl {
  constructor(
    private suggestionProviders: SuggestionProvider[],
    private contextAnalyzer: ContextAnalyzer,
    private cache: SuggestionCache
  ) {}
}
```

**Responsibilities:**
- Coordinate between different suggestion providers
- Analyze query context at cursor position
- Cache suggestions for performance
- Rank and filter suggestions by relevance

#### 3. SuggestionProviders (Application)

**KeywordSuggestionProvider**
```typescript
class KeywordSuggestionProvider implements SuggestionProvider {
  private keywords = [
    'SELECT', 'CONSTRUCT', 'ASK', 'DESCRIBE',
    'WHERE', 'OPTIONAL', 'UNION', 'FILTER',
    'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
    'DISTINCT', 'REDUCED'
  ];

  getSuggestions(context: QueryContext): Suggestion[] {
    // Return context-appropriate keywords
  }
}
```

**PropertySuggestionProvider**
```typescript
class PropertySuggestionProvider implements SuggestionProvider {
  constructor(private graph: Graph) {}

  async getSuggestions(context: QueryContext): Promise<Suggestion[]> {
    // Extract properties from graph based on context
    // Use subject type to filter relevant properties
  }
}
```

#### 4. Domain Models

```typescript
interface Suggestion {
  readonly text: string;
  readonly type: SuggestionType;
  readonly description?: string;
  readonly insertText: string;
  readonly cursorOffset?: number;
  readonly relevanceScore: number;
}

enum SuggestionType {
  KEYWORD = 'keyword',
  PROPERTY = 'property',
  VARIABLE = 'variable',
  TEMPLATE = 'template',
  NAMESPACE = 'namespace',
  FUNCTION = 'function'
}

interface QueryContext {
  readonly queryText: string;
  readonly cursorPosition: number;
  readonly currentToken?: string;
  readonly precedingTokens: string[];
  readonly clauseContext: ClauseType;
  readonly variables: Set<string>;
}

enum ClauseType {
  SELECT, WHERE, FILTER, ORDER_BY, GROUP_BY, HAVING
}
```

### Data Flow

```
User types → KeyboardEvent → AutocompleteProvider
                                    ↓
                            ContextAnalyzer analyzes query
                                    ↓
                            AutocompleteEngine requests suggestions
                                    ↓
                      Multiple SuggestionProviders generate suggestions
                                    ↓
                            Results aggregated and cached
                                    ↓
                            Suggestions rendered in UI
                                    ↓
                            User selects → Text inserted
```

## Performance Architecture

### Caching Strategy
```typescript
interface SuggestionCache {
  // Context-aware cache with invalidation
  get(key: CacheKey): Suggestion[] | undefined;
  set(key: CacheKey, suggestions: Suggestion[], ttl?: number): void;
  invalidatePattern(pattern: string): void;
}

interface CacheKey {
  readonly queryPrefix: string;
  readonly context: QueryContext;
  readonly timestamp: number;
}
```

### Optimization Techniques
1. **Debouncing**: Wait 150ms after last keystroke before suggestions
2. **Incremental Parsing**: Only reparse changed portions of query
3. **LRU Cache**: Cache property lists, namespace mappings
4. **Worker Threads**: Offload heavy property extraction to background
5. **Smart Prefetching**: Pre-cache common suggestions on plugin load

## Integration Patterns

### 1. Editor Integration
```typescript
// Extend existing SPARQLProcessor
class EnhancedSPARQLProcessor extends SPARQLProcessor {
  private autocompleteProvider: SPARQLAutocompleteProvider;

  async processCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Existing processing logic
    await super.processCodeBlock(source, el, ctx);
    
    // Add autocomplete capabilities
    if (this.isEditMode(el)) {
      await this.enableAutocomplete(el, ctx);
    }
  }
}
```

### 2. Dependency Injection
```typescript
// Register in DIContainer
container.register('AutocompleteEngine', AutocompleteEngineImpl);
container.register('PropertySuggestionProvider', PropertySuggestionProvider);
// ... other providers
```

## Security Considerations

### Query Safety
- Reuse existing SPARQLSanitizer for suggestion validation
- Prevent injection of malicious suggestions
- Validate property names against graph schema

### Performance Safety
- Limit suggestion count (max 50 items)
- Timeout for slow suggestion providers (500ms)
- Memory limits for cache size

## Testing Strategy

### Unit Testing
- Individual suggestion providers
- Context analysis logic
- Caching mechanisms

### Integration Testing
- Editor integration
- Full suggestion pipeline
- Performance benchmarks

### UI Testing
- Keyboard navigation
- Visual rendering
- Accessibility compliance

## Migration Plan

### Phase 1: Core Infrastructure (Week 1)
- Domain models (Suggestion, QueryContext)
- AutocompleteEngine framework
- Basic KeywordSuggestionProvider

### Phase 2: Editor Integration (Week 1-2)
- SPARQLAutocompleteProvider
- Obsidian editor integration
- Basic UI rendering

### Phase 3: Enhanced Suggestions (Week 2-3)
- PropertySuggestionProvider (from Graph)
- NamespaceSuggestionProvider
- VariableSuggestionProvider

### Phase 4: Advanced Features (Week 3-4)
- TemplateSuggestionProvider
- Performance optimizations
- Caching implementation

## Risk Mitigation

### Technical Risks
1. **Obsidian API Limitations**
   - Risk: Limited editor access for autocomplete
   - Mitigation: Research CodeMirror extensions, fallback approaches

2. **Performance Impact**
   - Risk: Autocomplete slows down typing
   - Mitigation: Async processing, aggressive caching, debouncing

3. **Complex Context Analysis**
   - Risk: Difficulty parsing SPARQL for context
   - Mitigation: Start with simple patterns, iterate based on feedback

## Success Criteria

- [ ] Suggestion response time < 100ms (95th percentile)
- [ ] Zero blocking of UI thread
- [ ] Supports all MVP suggestion types
- [ ] Integrates seamlessly with existing SPARQL workflow
- [ ] Passes all accessibility tests
- [ ] Memory usage < 10MB for cache

## Dependencies

### Internal
- Graph implementation for property extraction
- SPARQLEngine for query parsing patterns
- SPARQLProcessor for editor integration

### External
- Obsidian Editor API
- CodeMirror extensions (if needed)
- TypeScript 4.9+ for type safety

## Next Steps

1. **Implementation**: SWEBOK Engineer implements core architecture
2. **UI Design**: UX Designer creates interaction patterns
3. **Testing**: QA Engineer develops test suite
4. **Documentation**: Technical Writer documents APIs

This architecture provides a solid foundation for SPARQL autocomplete while maintaining clean separation of concerns and high performance.