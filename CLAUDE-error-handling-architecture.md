# Better Error Messages - Technical Architecture Document

## Executive Summary

This document outlines the technical architecture for implementing Better Error Messages in the Exocortex Obsidian Plugin, following IEEE SWEBOK v3 standards and Clean Architecture principles. The system centralizes error handling, implements comprehensive error tracking with line/column numbers for SPARQL queries, and provides intelligent fix suggestions.

## 1. Current State Analysis

### 1.1 Existing Error Handling Patterns
- **Result<T> Pattern**: Well-implemented monadic error handling in `/src/domain/core/Result.ts`
- **Fragmented Error Messages**: 803+ error occurrences across 80+ files
- **Basic Validation**: Limited to RDFValidator and SPARQLSanitizer
- **Manual Error Construction**: No standardized error categorization or context

### 1.2 Key Findings
- String-based error messages lack structure and context
- No centralized error tracking or analytics
- Missing line/column information for SPARQL parsing errors
- No intelligent error recovery or fix suggestions
- Performance impact unknown for error handling operations

## 2. Architecture Design

### 2.1 Clean Architecture Layers

```typescript
// Domain Layer - Error Entities
interface IDomainError {
  readonly id: ErrorId;
  readonly code: ErrorCode;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  readonly message: string;
  readonly context: ErrorContext;
  readonly timestamp: Date;
  readonly stack?: string;
}

// Application Layer - Error Use Cases
interface IErrorHandlingService {
  captureError(error: Error, context: ErrorContext): Promise<Result<void>>;
  categorizeError(error: Error): ErrorCategory;
  generateFixSuggestions(error: IDomainError): FixSuggestion[];
  getErrorStatistics(): ErrorStatistics;
}

// Infrastructure Layer - Error Storage
interface IErrorRepository {
  store(error: IDomainError): Promise<Result<void>>;
  findByCategory(category: ErrorCategory): Promise<IDomainError[]>;
  findByTimeRange(start: Date, end: Date): Promise<IDomainError[]>;
}
```

### 2.2 Error Categorization System

```typescript
export enum ErrorCategory {
  // Domain Errors
  VALIDATION = 'VALIDATION',
  BUSINESS_RULE = 'BUSINESS_RULE',
  
  // Technical Errors
  SPARQL_SYNTAX = 'SPARQL_SYNTAX',
  SPARQL_SEMANTIC = 'SPARQL_SEMANTIC',
  RDF_PARSING = 'RDF_PARSING',
  FILE_SYSTEM = 'FILE_SYSTEM',
  NETWORK = 'NETWORK',
  
  // System Errors
  DEPENDENCY_INJECTION = 'DEPENDENCY_INJECTION',
  CONFIGURATION = 'CONFIGURATION',
  RESOURCE_EXHAUSTION = 'RESOURCE_EXHAUSTION',
  
  // Unknown
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}
```

## 3. Core Components Architecture

### 3.1 Enhanced Result<T, E> Pattern

```typescript
/**
 * Enhanced Result pattern with rich error information
 * Extends the existing Result<T> to include detailed error context
 */
export class Result<T, E extends IDomainError = IDomainError> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot get value from failed result. Error: ${this._error?.message}`);
    }
    return this._value!;
  }

  public getError(): E | undefined {
    return this._error;
  }

  public static ok<U>(value?: U): Result<U, never> {
    return new Result<U, never>(true, value, undefined);
  }

  public static fail<F extends IDomainError>(error: F): Result<never, F> {
    return new Result<never, F>(false, undefined, error);
  }

  // Enhanced error mapping and chaining methods
  public mapError<F extends IDomainError>(mapper: (error: E) => F): Result<T, F> {
    if (this.isSuccess) return Result.ok(this._value);
    return Result.fail(mapper(this._error!));
  }

  public chain<U, F extends IDomainError>(
    mapper: (value: T) => Result<U, F>
  ): Result<U, E | F> {
    if (this.isFailure) return Result.fail(this._error!);
    return mapper(this._value!);
  }
}
```

### 3.2 Centralized Error Handler Service

```typescript
/**
 * Centralized Error Handler Service
 * Implements comprehensive error handling following Clean Architecture
 */
export class ErrorHandlerService implements IErrorHandlingService {
  private readonly errorRepository: IErrorRepository;
  private readonly errorCategorizer: IErrorCategorizer;
  private readonly fixSuggestionEngine: IFixSuggestionEngine;
  private readonly performanceProfiler: IPerformanceProfiler;

  constructor(
    errorRepository: IErrorRepository,
    errorCategorizer: IErrorCategorizer,
    fixSuggestionEngine: IFixSuggestionEngine,
    performanceProfiler: IPerformanceProfiler
  ) {
    this.errorRepository = errorRepository;
    this.errorCategorizer = errorCategorizer;
    this.fixSuggestionEngine = fixSuggestionEngine;
    this.performanceProfiler = performanceProfiler;
  }

  async captureError(
    error: Error, 
    context: ErrorContext
  ): Promise<Result<DomainError, SystemError>> {
    const startTime = performance.now();
    
    try {
      // 1. Create domain error from raw error
      const domainError = await this.createDomainError(error, context);
      
      // 2. Categorize the error
      const category = await this.errorCategorizer.categorize(domainError);
      const categorizedError = domainError.withCategory(category);
      
      // 3. Generate fix suggestions
      const suggestions = await this.fixSuggestionEngine.generateSuggestions(categorizedError);
      const enrichedError = categorizedError.withSuggestions(suggestions);
      
      // 4. Store error for analytics
      await this.errorRepository.store(enrichedError);
      
      // 5. Track performance
      const duration = performance.now() - startTime;
      this.performanceProfiler.recordErrorHandling(duration);
      
      if (duration > 10) { // Performance constraint: < 10ms
        console.warn(`Error handling took ${duration}ms, exceeding 10ms threshold`);
      }
      
      return Result.ok(enrichedError);
      
    } catch (systemError) {
      const duration = performance.now() - startTime;
      this.performanceProfiler.recordErrorHandling(duration);
      
      return Result.fail(new SystemError(
        'ERROR_HANDLER_FAILURE',
        `Failed to handle error: ${systemError.message}`,
        { originalError: error, context, duration }
      ));
    }
  }

  private async createDomainError(
    error: Error, 
    context: ErrorContext
  ): Promise<DomainError> {
    return new DomainError({
      id: ErrorId.generate(),
      code: this.extractErrorCode(error),
      severity: this.determineSeverity(error, context),
      message: error.message,
      context,
      timestamp: new Date(),
      stack: error.stack,
      originalError: error
    });
  }

  private extractErrorCode(error: Error): ErrorCode {
    // Extract structured error codes from error messages
    const codeMatch = error.message.match(/^([A-Z_]+):\s*/);
    return codeMatch ? new ErrorCode(codeMatch[1]) : ErrorCode.UNKNOWN;
  }

  private determineSeverity(error: Error, context: ErrorContext): ErrorSeverity {
    // Determine severity based on error type and context
    if (error instanceof ValidationError) return ErrorSeverity.WARN;
    if (error instanceof SPARQLSyntaxError) return ErrorSeverity.ERROR;
    if (error instanceof SystemError) return ErrorSeverity.FATAL;
    if (context.userInitiated) return ErrorSeverity.ERROR;
    return ErrorSeverity.WARN;
  }
}
```

### 3.3 SPARQL Error Tracking with Line/Column Numbers

```typescript
/**
 * SPARQL-specific error handling with precise location tracking
 */
export class SPARQLErrorTracker {
  private readonly lexer: SPARQLLexer;
  private readonly parser: SPARQLParser;

  constructor() {
    this.lexer = new SPARQLLexer();
    this.parser = new SPARQLParser();
  }

  parseWithErrorTracking(query: string): Result<ParsedQuery, SPARQLError> {
    try {
      const tokens = this.lexer.tokenize(query);
      const ast = this.parser.parse(tokens);
      return Result.ok(new ParsedQuery(ast, tokens));
      
    } catch (error) {
      if (error instanceof SPARQLParseError) {
        const location = this.calculateErrorLocation(query, error.position);
        const sparqlError = new SPARQLError({
          code: ErrorCode.SPARQL_SYNTAX_ERROR,
          message: error.message,
          query,
          location,
          suggestions: this.generateSPARQLSuggestions(error, location, query)
        });
        return Result.fail(sparqlError);
      }
      
      // Fallback for unexpected errors
      return Result.fail(new SPARQLError({
        code: ErrorCode.SPARQL_UNKNOWN_ERROR,
        message: error.message,
        query,
        location: { line: 1, column: 1, offset: 0 }
      }));
    }
  }

  private calculateErrorLocation(query: string, offset: number): SourceLocation {
    let line = 1;
    let column = 1;
    let currentOffset = 0;
    
    for (let i = 0; i < Math.min(offset, query.length); i++) {
      if (query[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
      currentOffset++;
    }
    
    return new SourceLocation(line, column, offset);
  }

  private generateSPARQLSuggestions(
    error: SPARQLParseError, 
    location: SourceLocation, 
    query: string
  ): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    // Common SPARQL syntax errors and their fixes
    if (error.expected?.includes('WHERE')) {
      suggestions.push(new FixSuggestion({
        type: 'SYNTAX_FIX',
        title: 'Add WHERE clause',
        description: 'SPARQL queries require a WHERE clause to specify patterns',
        fix: {
          type: 'INSERT_TEXT',
          location: location,
          text: 'WHERE {\n  \n}'
        },
        confidence: 0.9
      }));
    }
    
    if (error.token?.type === 'IDENTIFIER' && !error.token.value.startsWith('?')) {
      suggestions.push(new FixSuggestion({
        type: 'VARIABLE_FIX',
        title: 'Add variable prefix',
        description: 'Variables in SPARQL must start with ?',
        fix: {
          type: 'REPLACE_TEXT',
          location: location,
          oldText: error.token.value,
          newText: `?${error.token.value}`
        },
        confidence: 0.8
      }));
    }
    
    return suggestions;
  }
}
```

### 3.4 Fix Suggestion Engine

```typescript
/**
 * Intelligent fix suggestion engine
 * Analyzes errors and provides actionable solutions
 */
export class FixSuggestionEngine implements IFixSuggestionEngine {
  private readonly ruleEngine: IFixRuleEngine;
  private readonly mlSuggestionService: IMLSuggestionService;
  private readonly patternMatcher: IPatternMatcher;

  constructor(
    ruleEngine: IFixRuleEngine,
    mlSuggestionService: IMLSuggestionService,
    patternMatcher: IPatternMatcher
  ) {
    this.ruleEngine = ruleEngine;
    this.mlSuggestionService = mlSuggestionService;
    this.patternMatcher = patternMatcher;
  }

  async generateSuggestions(error: DomainError): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    
    // 1. Rule-based suggestions (deterministic)
    const ruleSuggestions = await this.ruleEngine.generateSuggestions(error);
    suggestions.push(...ruleSuggestions);
    
    // 2. Pattern-matching suggestions (heuristic)
    const patternSuggestions = await this.patternMatcher.findSimilarErrors(error);
    suggestions.push(...patternSuggestions);
    
    // 3. ML-based suggestions (if available)
    if (this.mlSuggestionService.isAvailable()) {
      const mlSuggestions = await this.mlSuggestionService.predict(error);
      suggestions.push(...mlSuggestions);
    }
    
    // 4. Sort by confidence and relevance
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Limit to top 5 suggestions
  }
}

/**
 * Rule-based fix suggestion engine
 */
export class RuleBasedFixEngine implements IFixRuleEngine {
  private readonly rules: Map<ErrorCode, FixRule[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // SPARQL syntax error rules
    this.addRule(ErrorCode.SPARQL_SYNTAX_ERROR, {
      pattern: /missing WHERE clause/i,
      suggestion: {
        type: 'SYNTAX_FIX',
        title: 'Add WHERE clause',
        description: 'SPARQL SELECT and CONSTRUCT queries require a WHERE clause',
        fix: {
          type: 'INSERT_TEMPLATE',
          template: 'WHERE {\n  # Add your triple patterns here\n  ?s ?p ?o .\n}'
        },
        confidence: 0.95
      }
    });

    this.addRule(ErrorCode.SPARQL_SYNTAX_ERROR, {
      pattern: /undefined prefix/i,
      suggestion: {
        type: 'PREFIX_FIX',
        title: 'Define missing prefix',
        description: 'Add PREFIX declaration for undefined namespace',
        fix: {
          type: 'INSERT_AT_TOP',
          template: 'PREFIX ${prefix}: <${namespace}>'
        },
        confidence: 0.9
      }
    });

    // RDF validation error rules
    this.addRule(ErrorCode.INVALID_IRI, {
      pattern: /Invalid IRI.*scheme/i,
      suggestion: {
        type: 'IRI_FIX',
        title: 'Fix IRI format',
        description: 'IRIs must have a valid scheme (e.g., http:, https:)',
        fix: {
          type: 'REPLACE_PATTERN',
          pattern: /^([^:]+)$/,
          replacement: 'https://example.org/$1'
        },
        confidence: 0.8
      }
    });
  }

  private addRule(errorCode: ErrorCode, rule: FixRule): void {
    const rules = this.rules.get(errorCode) || [];
    rules.push(rule);
    this.rules.set(errorCode, rules);
  }

  async generateSuggestions(error: DomainError): Promise<FixSuggestion[]> {
    const rules = this.rules.get(error.code) || [];
    const suggestions: FixSuggestion[] = [];

    for (const rule of rules) {
      if (rule.pattern.test(error.message)) {
        suggestions.push(new FixSuggestion({
          ...rule.suggestion,
          context: error.context
        }));
      }
    }

    return suggestions;
  }
}
```

## 4. Integration with Existing Architecture

### 4.1 DIContainer Integration

```typescript
/**
 * Enhanced DIContainer registration for error handling services
 */
export class DIContainer {
  // ... existing code ...

  private registerErrorHandlingServices(): void {
    // Core error handling
    this.container.register<IErrorRepository>(
      'IErrorRepository',
      () => new InMemoryErrorRepository() // or ObsidianErrorRepository for persistence
    );

    this.container.register<IErrorCategorizer>(
      'IErrorCategorizer',
      () => new RuleBasedErrorCategorizer()
    );

    this.container.register<IFixSuggestionEngine>(
      'IFixSuggestionEngine',
      () => new FixSuggestionEngine(
        new RuleBasedFixEngine(),
        new MLSuggestionService(),
        new PatternMatcher()
      )
    );

    this.container.register<IPerformanceProfiler>(
      'IPerformanceProfiler',
      () => new PerformanceProfiler()
    );

    this.container.register<ErrorHandlerService>(
      'ErrorHandlerService',
      () => new ErrorHandlerService(
        this.resolve<IErrorRepository>('IErrorRepository'),
        this.resolve<IErrorCategorizer>('IErrorCategorizer'),
        this.resolve<IFixSuggestionEngine>('IFixSuggestionEngine'),
        this.resolve<IPerformanceProfiler>('IPerformanceProfiler')
      )
    );

    // SPARQL-specific error handling
    this.container.register<SPARQLErrorTracker>(
      'SPARQLErrorTracker',
      () => new SPARQLErrorTracker()
    );
  }
}
```

### 4.2 Enhanced SPARQLProcessor Integration

```typescript
/**
 * Enhanced SPARQL Processor with centralized error handling
 */
export class SPARQLProcessor {
  private readonly errorHandler: ErrorHandlerService;
  private readonly sparqlErrorTracker: SPARQLErrorTracker;

  constructor(
    plugin: Plugin,
    graph: Graph,
    errorHandler: ErrorHandlerService,
    sparqlErrorTracker: SPARQLErrorTracker,
    focusService?: ExoFocusService
  ) {
    // ... existing initialization ...
    this.errorHandler = errorHandler;
    this.sparqlErrorTracker = sparqlErrorTracker;
  }

  async executeQuery(sparql: string): Promise<Result<QueryResult, DomainError>> {
    try {
      // 1. Parse with error tracking
      const parseResult = this.sparqlErrorTracker.parseWithErrorTracking(sparql);
      if (parseResult.isFailure) {
        const error = parseResult.getError()!;
        await this.errorHandler.captureError(error, {
          component: 'SPARQLProcessor',
          operation: 'parseQuery',
          userInitiated: true,
          query: sparql
        });
        return Result.fail(error);
      }

      // 2. Execute query with existing logic
      const query = parseResult.getValue();
      // ... existing execution logic ...

    } catch (error) {
      // Capture unexpected errors
      const result = await this.errorHandler.captureError(error, {
        component: 'SPARQLProcessor',
        operation: 'executeQuery',
        userInitiated: true,
        query: sparql
      });

      if (result.isSuccess) {
        const domainError = result.getValue();
        return Result.fail(domainError);
      } else {
        // Fallback if error handler itself fails
        return Result.fail(new DomainError({
          code: ErrorCode.SYSTEM_ERROR,
          message: `Query execution failed: ${error.message}`,
          severity: ErrorSeverity.ERROR
        }));
      }
    }
  }

  private createErrorMessage(error: DomainError): HTMLElement {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'sparql-error enhanced';
    
    // Main error display
    const title = document.createElement('h4');
    title.textContent = error.code.toString();
    errorDiv.appendChild(title);
    
    const message = document.createElement('p');
    message.textContent = error.message;
    errorDiv.appendChild(message);
    
    // Location information for SPARQL errors
    if (error instanceof SPARQLError && error.location) {
      const location = document.createElement('div');
      location.className = 'error-location';
      location.textContent = `Line ${error.location.line}, Column ${error.location.column}`;
      errorDiv.appendChild(location);
    }
    
    // Fix suggestions
    if (error.suggestions && error.suggestions.length > 0) {
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'error-suggestions';
      
      const suggestionsTitle = document.createElement('h5');
      suggestionsTitle.textContent = 'Suggested Fixes:';
      suggestionsDiv.appendChild(suggestionsTitle);
      
      const suggestionsList = document.createElement('ul');
      for (const suggestion of error.suggestions) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${suggestion.title}</strong>: ${suggestion.description}`;
        
        if (suggestion.fix.type === 'REPLACE_TEXT') {
          const applyButton = document.createElement('button');
          applyButton.textContent = 'Apply Fix';
          applyButton.onclick = () => this.applySuggestion(suggestion);
          li.appendChild(applyButton);
        }
        
        suggestionsList.appendChild(li);
      }
      suggestionsDiv.appendChild(suggestionsList);
      errorDiv.appendChild(suggestionsDiv);
    }
    
    return errorDiv;
  }

  private async applySuggestion(suggestion: FixSuggestion): Promise<void> {
    // Implementation for applying suggested fixes
    // This would integrate with the Obsidian editor API
  }
}
```

## 5. Performance Analysis and Optimization

### 5.1 Performance Requirements
- **Error Capture**: < 10ms overhead for error processing
- **Memory Usage**: < 50MB for error storage and analytics
- **CPU Impact**: < 5% additional CPU usage during normal operation

### 5.2 Optimization Strategies

```typescript
/**
 * Performance-optimized error handling
 */
export class PerformanceOptimizedErrorHandler {
  private readonly errorQueue: AsyncQueue<DomainError>;
  private readonly metricsCollector: MetricsCollector;
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.errorQueue = new AsyncQueue<DomainError>(1000); // Buffer 1000 errors
    this.metricsCollector = new MetricsCollector();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      timeout: 60000 // 1 minute
    });
  }

  async captureError(error: Error, context: ErrorContext): Promise<Result<void, SystemError>> {
    const startTime = performance.now();
    
    // Fast path for circuit breaker
    if (this.circuitBreaker.isOpen()) {
      return Result.fail(new SystemError('CIRCUIT_BREAKER_OPEN', 'Error handling temporarily disabled'));
    }

    try {
      // Quick validation and queuing
      const domainError = this.createDomainErrorFast(error, context);
      await this.errorQueue.enqueue(domainError);
      
      // Record performance metrics
      const duration = performance.now() - startTime;
      this.metricsCollector.recordLatency('error_capture', duration);
      
      if (duration > 10) {
        this.metricsCollector.recordSlowOperation('error_capture', duration);
      }
      
      return Result.ok();
      
    } catch (systemError) {
      this.circuitBreaker.recordFailure();
      const duration = performance.now() - startTime;
      this.metricsCollector.recordError('error_capture', duration);
      
      return Result.fail(new SystemError(
        'ERROR_CAPTURE_FAILED',
        `Failed to capture error: ${systemError.message}`
      ));
    }
  }

  private createDomainErrorFast(error: Error, context: ErrorContext): DomainError {
    // Optimized error creation - minimal processing
    return new DomainError({
      id: ErrorId.generateFast(), // Use faster UUID generation
      code: this.extractErrorCodeFast(error),
      severity: ErrorSeverity.ERROR, // Default severity for fast path
      message: error.message,
      context,
      timestamp: new Date()
      // Skip stack trace collection in fast path
    });
  }

  // Background processing of queued errors
  private async processErrorQueue(): Promise<void> {
    while (true) {
      try {
        const errors = await this.errorQueue.dequeue(10); // Process in batches
        await this.processErrorBatch(errors);
      } catch (error) {
        console.error('Error processing queue:', error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Backoff
      }
    }
  }
}

/**
 * Metrics collection for performance monitoring
 */
export class MetricsCollector {
  private readonly metrics: Map<string, PerformanceMetric> = new Map();

  recordLatency(operation: string, duration: number): void {
    const metric = this.getOrCreateMetric(operation);
    metric.addSample(duration);
  }

  recordError(operation: string, duration: number): void {
    const metric = this.getOrCreateMetric(`${operation}_errors`);
    metric.addSample(duration);
  }

  getMetrics(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: new Date(),
      operations: []
    };

    for (const [name, metric] of this.metrics) {
      report.operations.push({
        name,
        count: metric.count,
        averageLatency: metric.getAverage(),
        p95Latency: metric.getPercentile(95),
        p99Latency: metric.getPercentile(99),
        maxLatency: metric.getMax()
      });
    }

    return report;
  }

  private getOrCreateMetric(name: string): PerformanceMetric {
    let metric = this.metrics.get(name);
    if (!metric) {
      metric = new PerformanceMetric(name);
      this.metrics.set(name, metric);
    }
    return metric;
  }
}
```

## 6. Testing Strategy

### 6.1 Unit Testing Architecture

```typescript
describe('ErrorHandlerService', () => {
  let errorHandler: ErrorHandlerService;
  let mockRepository: jest.Mocked<IErrorRepository>;
  let mockCategorizer: jest.Mocked<IErrorCategorizer>;
  let mockSuggestionEngine: jest.Mocked<IFixSuggestionEngine>;
  let mockProfiler: jest.Mocked<IPerformanceProfiler>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockCategorizer = createMockCategorizer();
    mockSuggestionEngine = createMockSuggestionEngine();
    mockProfiler = createMockProfiler();

    errorHandler = new ErrorHandlerService(
      mockRepository,
      mockCategorizer,
      mockSuggestionEngine,
      mockProfiler
    );
  });

  describe('captureError', () => {
    it('should categorize and store error with suggestions', async () => {
      // Given
      const error = new Error('Test error');
      const context = createTestContext();
      const expectedCategory = ErrorCategory.VALIDATION;
      const expectedSuggestions = [createTestSuggestion()];

      mockCategorizer.categorize.mockResolvedValue(expectedCategory);
      mockSuggestionEngine.generateSuggestions.mockResolvedValue(expectedSuggestions);
      mockRepository.store.mockResolvedValue(Result.ok());

      // When
      const result = await errorHandler.captureError(error, context);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(mockCategorizer.categorize).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' })
      );
      expect(mockSuggestionEngine.generateSuggestions).toHaveBeenCalled();
      expect(mockRepository.store).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expectedCategory,
          suggestions: expectedSuggestions
        })
      );
    });

    it('should complete within performance threshold', async () => {
      // Given
      const error = new Error('Performance test error');
      const context = createTestContext();
      
      // When
      const startTime = performance.now();
      await errorHandler.captureError(error, context);
      const duration = performance.now() - startTime;

      // Then
      expect(duration).toBeLessThan(10); // 10ms threshold
    });
  });
});
```

### 6.2 Integration Testing

```typescript
describe('SPARQL Error Integration', () => {
  let sparqlProcessor: SPARQLProcessor;
  let errorHandler: ErrorHandlerService;
  let errorTracker: SPARQLErrorTracker;

  beforeEach(() => {
    const container = DIContainer.getInstance();
    sparqlProcessor = container.resolve('SPARQLProcessor');
    errorHandler = container.resolve('ErrorHandlerService');
    errorTracker = container.resolve('SPARQLErrorTracker');
  });

  it('should provide line/column information for syntax errors', async () => {
    // Given
    const invalidQuery = `
      SELECT ?s ?p ?o
      WHRE {
        ?s ?p ?o .
      }
    `.trim();

    // When
    const result = await sparqlProcessor.executeQuery(invalidQuery);

    // Then
    expect(result.isFailure).toBe(true);
    const error = result.getError() as SPARQLError;
    expect(error.location).toBeDefined();
    expect(error.location.line).toBe(2); // "WHRE" is on line 2
    expect(error.location.column).toBe(7); // Position of "WHRE"
    expect(error.suggestions).toContain(
      expect.objectContaining({
        title: expect.stringMatching(/WHERE/i)
      })
    );
  });
});
```

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Enhanced Result<T, E> Pattern**
   - Extend existing Result class with error type parameter
   - Maintain backward compatibility
   - Add error mapping and chaining methods

2. **Core Error Entities**
   - Implement DomainError, SystemError classes
   - Create ErrorCode, ErrorSeverity enums
   - Design ErrorContext value object

### Phase 2: Core Services (Week 3-4)
1. **ErrorHandlerService**
   - Implement centralized error capturing
   - Basic categorization system
   - Integration with DIContainer

2. **Error Repository**
   - In-memory implementation first
   - Basic error storage and retrieval
   - Performance optimization

### Phase 3: SPARQL Integration (Week 5-6)
1. **SPARQLErrorTracker**
   - Line/column number calculation
   - Token-based error reporting
   - Integration with existing SPARQLProcessor

2. **SPARQL Fix Suggestions**
   - Rule-based suggestion engine
   - Common syntax error patterns
   - Auto-fix capabilities

### Phase 4: Intelligence & Polish (Week 7-8)
1. **Advanced Fix Suggestions**
   - Pattern matching engine
   - Confidence scoring
   - User feedback integration

2. **Performance Optimization**
   - Async error processing
   - Circuit breaker patterns
   - Metrics collection

## 8. Risk Analysis & Mitigation

### 8.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation | High | Medium | Async processing, circuit breakers, performance monitoring |
| Memory leaks from error storage | Medium | Medium | Bounded error queues, periodic cleanup, configurable retention |
| Complex error categorization | Medium | Low | Start with simple rules, incremental complexity |
| Integration breaking changes | High | Low | Maintain backward compatibility, feature flags |

### 8.2 Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Error handling causing errors | High | Low | Comprehensive testing, fallback mechanisms |
| User confusion from detailed errors | Medium | Medium | Progressive disclosure, user-friendly formatting |
| Storage quota issues | Medium | Medium | Configurable retention, local-first storage |

## 9. Success Metrics

### 9.1 Performance Metrics
- **Error Processing Latency**: < 10ms average
- **Memory Usage**: < 50MB for error system
- **CPU Overhead**: < 5% during normal operation

### 9.2 User Experience Metrics
- **Error Resolution Rate**: > 70% of errors provide actionable suggestions
- **Time to Understand Error**: < 30 seconds average
- **Fix Success Rate**: > 60% of suggested fixes resolve the issue

### 9.3 System Metrics
- **Error Categorization Accuracy**: > 90%
- **False Positive Rate**: < 10% for fix suggestions
- **System Reliability**: 99.9% uptime for error handling

## 10. Conclusion

This architecture provides a comprehensive, performance-conscious error handling system that transforms the user experience from cryptic error messages to intelligent, actionable feedback. The design follows Clean Architecture principles, maintains backward compatibility, and provides a foundation for future enhancements like machine learning-based suggestions and advanced analytics.

The modular design allows for incremental implementation, starting with core functionality and progressively adding intelligence and polish. Performance constraints are built into the architecture from the ground up, ensuring the error handling system enhances rather than degrades the overall user experience.

---

*This document follows IEEE SWEBOK v3 standards for software architecture documentation and will be maintained as the system evolves.*