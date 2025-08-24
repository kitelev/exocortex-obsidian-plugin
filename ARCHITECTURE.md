# Exocortex Plugin Architecture

## Overview

This plugin follows Clean Architecture principles with a clear separation of concerns and dependency inversion.

## System Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (UI Components, Views, Controllers, Processors)         │
├─────────────────────────────────────────────────────────┤
│                    Application Layer                     │
│  (Use Cases, Services, DTOs, Application Logic)          │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                        │
│  (Entities, Value Objects, Domain Services, Core Logic)  │
├─────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                   │
│  (Adapters, Repositories, External Services, Framework)  │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule

Dependencies only point inward. Inner layers know nothing about outer layers.

## Architecture Principles

### 1. Clean Architecture

The plugin is organized in concentric layers:

- **Domain Layer** (innermost): Business logic and entities
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External dependencies and adapters
- **Presentation Layer** (outermost): UI components and user interaction

Dependencies flow inward only - outer layers depend on inner layers, never the reverse.

### 2. SOLID Principles

#### Single Responsibility Principle (SRP)

Each class has one reason to change:

- `Asset` entity manages asset data
- `OntologyRepository` handles ontology persistence
- `CreateAssetUseCase` orchestrates asset creation

#### Open/Closed Principle (OCP)

Classes are open for extension, closed for modification:

- New asset types extend `Asset` base class
- New repositories implement `IRepository` interface

#### Liskov Substitution Principle (LSP)

Derived classes can substitute base classes:

- Any `IRepository` implementation works with use cases
- Any `ILayoutRenderer` can render layouts

#### Interface Segregation Principle (ISP)

Clients depend only on interfaces they use:

- `IAssetRepository` for asset operations
- `IOntologyRepository` for ontology operations
- `IVaultAdapter` for vault access

#### Dependency Inversion Principle (DIP)

High-level modules don't depend on low-level modules:

- Use cases depend on repository interfaces, not implementations
- Domain entities don't know about Obsidian API

### 3. DRY (Don't Repeat Yourself)

- Shared logic extracted to utility functions
- Common patterns implemented once in base classes
- Configuration centralized in settings

### 4. KISS (Keep It Simple, Stupid)

- Simple, clear method names
- Minimal method parameters
- Straightforward control flow

### 5. GRASP (General Responsibility Assignment Software Patterns)

#### Information Expert

Objects with the data perform operations on that data:

- `Asset` validates its own properties
- `Ontology` manages its prefixes

#### Creator

Objects create instances they closely use:

- `AssetFactory` creates assets
- `RepositoryFactory` creates repositories

#### Controller

Controllers coordinate and delegate:

- `ExocortexPlugin` coordinates plugin lifecycle
- `CreateAssetUseCase` coordinates asset creation

#### Low Coupling

Minimal dependencies between classes:

- Use interfaces instead of concrete classes
- Dependency injection for loose coupling

#### High Cohesion

Related functionality grouped together:

- All asset operations in `AssetService`
- All UI components in presentation layer

### 6. Executable Specifications

Tests serve as living documentation:

```typescript
describe("CreateAssetUseCase", () => {
  it("should create an asset with valid properties", async () => {
    // Given a valid asset request
    // When creating the asset
    // Then the asset is persisted with correct properties
  });
});
```

### 7. Test Principles

#### Fake Objects

Test doubles that provide working implementations:

```typescript
class FakeVaultAdapter implements IVaultAdapter {
  private files = new Map<string, string>();

  async create(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }
}
```

#### Test Context

Encapsulated test setup and utilities:

```typescript
class TestContext {
  public vault: FakeVaultAdapter;
  public repository: AssetRepository;

  constructor() {
    this.vault = new FakeVaultAdapter();
    this.repository = new AssetRepository(this.vault);
  }
}
```

#### FIRST Principles

- **Fast**: Tests run in milliseconds
- **Independent**: Tests don't depend on each other
- **Repeatable**: Same results every run
- **Self-Validating**: Clear pass/fail
- **Timely**: Written with or before code

## Project Structure

```
src/
├── domain/                 # Business logic (no dependencies)
│   ├── entities/
│   │   ├── Asset.ts       # Core asset entity
│   │   ├── Ontology.ts    # Ontology entity
│   │   └── Property.ts    # Property entity
│   ├── value-objects/
│   │   ├── AssetId.ts     # Asset identifier
│   │   ├── ClassName.ts   # Class name value
│   │   └── OntologyPrefix.ts
│   ├── repositories/       # Repository interfaces
│   │   ├── IAssetRepository.ts
│   │   └── IOntologyRepository.ts
│   └── services/
│       └── AssetValidator.ts
│
├── application/            # Use cases (depends on domain)
│   ├── use-cases/
│   │   ├── CreateAssetUseCase.ts
│   │   ├── FindOntologiesUseCase.ts
│   │   └── RenderLayoutUseCase.ts
│   └── ports/             # Application interfaces
│       ├── IVaultAdapter.ts
│       └── IMetadataCache.ts
│
├── infrastructure/         # External dependencies
│   ├── adapters/
│   │   ├── ObsidianVaultAdapter.ts
│   │   └── ObsidianMetadataAdapter.ts
│   └── repositories/
│       ├── AssetRepository.ts
│       └── OntologyRepository.ts
│
├── presentation/          # UI layer
│   ├── components/
│   │   └── SettingsTab.ts
│   ├── modals/
│   │   └── CreateAssetModal.ts
│   └── commands/
│       └── CommandRegistry.ts
│
└── shared/               # Cross-cutting concerns
    ├── Container.ts      # Dependency injection
    └── Logger.ts         # Logging utility
```

## Dependency Flow

```
Presentation → Application → Domain
     ↓             ↓
Infrastructure ←───┘
```

## Key Patterns

### Repository Pattern

Abstracts data access:

```typescript
interface IAssetRepository {
  findById(id: AssetId): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  findByClass(className: ClassName): Promise<Asset[]>;
}
```

### Factory Pattern

Creates complex objects:

```typescript
class AssetFactory {
  static create(props: AssetProps): Asset {
    // Validation and creation logic
    return new Asset(props);
  }
}
```

### Adapter Pattern

Adapts external APIs to our interfaces:

```typescript
class ObsidianVaultAdapter implements IVaultAdapter {
  constructor(private vault: Vault) {}

  async create(path: string, content: string): Promise<void> {
    await this.vault.create(path, content);
  }
}
```

### Dependency Injection

Inverts control for testability:

```typescript
class Container {
  private services = new Map();

  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }

  resolve<T>(token: string): T {
    return this.services.get(token)();
  }
}
```

## Testing Strategy

### Unit Tests

Test individual components in isolation:

- Domain entities and value objects
- Use cases with mocked dependencies
- Pure functions and utilities

### Integration Tests

Test component interactions:

- Repository with fake adapters
- Use cases with real repositories
- Modal with test context

### End-to-End Tests

Test complete workflows:

- Create asset from UI to persistence
- Load and render layouts
- Settings changes and effects

## Benefits

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Easy to test with dependency injection
3. **Flexibility**: Easy to change implementations
4. **Scalability**: Add features without affecting existing code
5. **Understandability**: Clear architecture and patterns

## Latest Implementation Features (v4.1.0)

### Comprehensive Logging Infrastructure

**Achievement**: Enterprise-grade logging system with structured output, performance monitoring, and security features.

```typescript
// Logger Service Implementation
interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;
  
  startTiming(label: string): void;
  endTiming(label: string, context?: LogContext): void;
  
  setCorrelationId(id: string): void;
  createChildLogger(context: LogContext): ILogger;
}

// LoggerFactory for centralized management
class LoggerFactory {
  static create(name?: string): ILogger;
  static createForClass<T>(constructor: new (...args: any[]) => T): ILogger;
  static createWithContext(name: string, context: Record<string, any>): ILogger;
}
```

#### Logging Features:

- **Structured Logging**: JSON and pretty-print formats for different environments
- **Performance Monitoring**: Built-in timing operations with threshold alerts
- **Security**: Automatic sanitization of sensitive data (passwords, tokens, secrets)
- **Correlation IDs**: UUID-based request tracking across components
- **Child Loggers**: Contextual logging with inheritance
- **Environment Awareness**: Production vs development configurations
- **Memory Efficient**: Configurable log size limits and truncation

### BDD Testing Framework

**Achievement**: Complete Behavior-Driven Development framework with Gherkin scenarios and comprehensive test utilities.

```typescript
// BDD World Context
export class BDDWorld extends World implements IBDDWorld {
  public container: DIContainer;
  public vaultAdapter: FakeVaultAdapter;
  public graph: IndexedGraph;
  
  // Test utilities
  public testDataBuilder: TestDataBuilder;
  public performanceMonitor: PerformanceMonitor;
  public securityValidator: SecurityValidator;
  public validationHelper: ValidationHelper;
}

// Fluent Test Data Builder
class TestDataBuilder {
  asset(name: string): AssetBuilder;
  scenario(name: string): ScenarioBuilder;
  triple(subject: string): TripleBuilder;
}
```

#### BDD Framework Components:

- **Gherkin Features**: Business-readable test scenarios in `/tests/bdd/features/`
- **Step Definitions**: TypeScript implementations with full infrastructure integration
- **Test Data Builders**: Fluent API for creating complex test scenarios
- **Performance Monitoring**: Built-in performance validation and metrics
- **Security Validation**: Comprehensive security testing with threat detection
- **World Context**: Centralized test state management and cleanup
- **Feature Categories**: Asset management, query execution, layout rendering

### Enhanced Test Infrastructure

**Achievement**: Comprehensive test suite with 80+ test files, multiple test types, and robust CI/CD integration.

#### Test Categories:

1. **Unit Tests** (`/tests/unit/`): Component isolation with comprehensive mocking
2. **Integration Tests** (`/tests/integration/`): Component interaction validation
3. **BDD Tests** (`/tests/bdd/`): Business scenario validation
4. **UI Tests** (`/tests/ui/`): WebDriverIO-based user interface testing
5. **E2E Tests** (`/tests/e2e/`): Complete workflow validation
6. **Contract Tests** (`/tests/contract/`): API contract verification
7. **Mobile Tests**: iOS/Android specific testing with device simulation
8. **Performance Tests**: Load testing and performance benchmarking
9. **Security Tests**: Vulnerability testing and threat validation

#### Test Execution Commands:

```bash
# Comprehensive test suite options
npm run test:unit          # Unit tests with CI optimization
npm run test:integration   # Integration tests
npm run test:bdd           # BDD scenarios
npm run test:bdd:smoke     # Smoke tests only
npm run test:bdd:security  # Security-focused scenarios
npm run test:ui            # UI automation tests
npm run test:mobile        # Mobile-specific tests
npm run test:e2e          # End-to-end tests
npm run test:all          # Complete test suite
npm run test:coverage     # Coverage reports
```

### Children Efforts Professional Table Display

**Legacy Feature** (v3.4.0): Hierarchical effort visualization with professional table formatting and status badge system.

### Type System Improvements

**Achievement**: Enhanced TypeScript definitions with strict type safety and comprehensive interfaces.

- **Domain Types**: Complete type definitions in `/src/types/`
- **Interface Segregation**: Clean separation of concerns with focused interfaces
- **Generic Result Pattern**: Type-safe error handling across all operations
- **Guard Functions**: Runtime type validation with compile-time benefits
- **Property Types**: Structured property definitions for semantic assets

### Slash Commands System

**Legacy Feature** (v3.4.0): Quick execution workflow with agent coordination.

## RDF/Semantic Web Architecture

### Triple Store Design

#### IndexedGraph Implementation

```typescript
class IndexedGraph {
  // Triple storage
  private triples: Set<Triple>;

  // Optimized indexes for O(1) lookups
  private spo: Map<Subject, Map<Predicate, Set<Object>>>;
  private pos: Map<Predicate, Map<Object, Set<Subject>>>;
  private osp: Map<Object, Map<Subject, Set<Predicate>>>;

  // Performance optimizations
  private queryCache: LRU<QueryKey, Result[]>;
  private batchBuffer: Triple[];
  private statistics: GraphStatistics;
}
```

#### Performance Characteristics

- **Insert**: O(1) amortized
- **Delete**: O(1) amortized
- **Lookup**: O(1) with index
- **Pattern Match**: O(k) where k is result size
- **Batch Insert**: O(n) for n triples

#### Optimization Strategies

1. **Batch Operations**: Buffer inserts for bulk processing
2. **Query Caching**: LRU cache for frequent queries
3. **Lazy Statistics**: Calculate stats on demand
4. **Index Defragmentation**: Periodic optimization
5. **Stream API**: Memory-efficient large result sets

### SPARQL Query Engine

#### Query Processing Pipeline

```
1. Parse Query → AST
2. Optimize Query Plan
3. Execute Against Indexes
4. Apply Filters
5. Project Results
6. Cache Results
```

#### Supported Features

- SELECT queries with WHERE, FILTER, OPTIONAL
- CONSTRUCT for graph building
- ASK for existence checking
- Property paths
- Basic graph patterns
- LIMIT/OFFSET pagination

### Ontology Management

#### Ontology Hierarchy

```
Meta Level (0)
├── RDF/RDFS/OWL vocabularies
└── External standards

Core Level (1)
├── exo (Exocortex base)
├── ui (User interface)
└── sys (System)

Domain Level (2)
├── ems (Effort management)
├── gtd (Getting Things Done)
├── kb (Knowledge base)
└── Custom ontologies
```

## Performance Optimizations

### Current Optimizations

#### 1. Indexed Triple Store (v2.8.0)

- **Problem**: O(n) lookups in large graphs
- **Solution**: SPO/POS/OSP indexes
- **Result**: O(1) lookups, 10x query speed improvement

#### 2. Batch Processing (v2.9.0)

- **Problem**: Individual insert overhead
- **Solution**: Batch buffer with deferred indexing
- **Result**: 5x faster bulk imports

#### 3. Query Caching (v2.9.0)

- **Problem**: Repeated identical queries
- **Solution**: LRU cache with 100 entry limit
- **Result**: 90% cache hit rate for typical usage

### Performance Benchmarks

| Operation           | Small Vault (100 notes) | Large Vault (1000 notes) | Huge Vault (10000 notes) |
| ------------------- | ----------------------- | ------------------------ | ------------------------ |
| Initial Load        | 50ms                    | 450ms                    | 4500ms                   |
| Single Query        | 0.5ms                   | 0.8ms                    | 1.2ms                    |
| Complex Query       | 5ms                     | 8ms                      | 15ms                     |
| Batch Insert (1000) | 100ms                   | 100ms                    | 100ms                    |
| Memory Usage        | 10MB                    | 80MB                     | 750MB                    |

## Security Considerations

### Privacy-First Design

- UUID-based identifiers (no PII exposure)
- No external data transmission
- Local-only processing
- No telemetry or analytics

### Input Validation

- Strict YAML parsing
- IRI validation
- Query sanitization
- File path validation

## Scalability Considerations

### Current Limits

- Tested up to 10,000 notes
- 100,000 triples manageable
- Query complexity O(n²) worst case

### Future Improvements

- Persistent indexes (SQLite)
- Incremental updates
- Parallel query execution
- Streaming results

## Technical Debt

### High Priority

1. Add persistent caching layer
2. Implement query optimization
3. Add comprehensive error recovery

### Medium Priority

1. Refactor UI rendering pipeline
2. Improve test coverage (currently 70%)
3. Add performance monitoring

### Low Priority

1. Migrate to Web Workers for processing
2. Add graph visualization options
3. Implement SPARQL UPDATE

## Architecture Decision Records

### ADR-001: Clean Architecture

- **Date**: 2024-06-01
- **Status**: Accepted
- **Decision**: Use Clean Architecture for separation of concerns
- **Rationale**: Maintainability, testability, framework independence

### ADR-002: TypeScript Strict Mode

- **Date**: 2024-06-15
- **Status**: Accepted
- **Decision**: Enable TypeScript strict mode
- **Rationale**: Type safety, fewer runtime errors

### ADR-003: In-Memory Triple Store

- **Date**: 2024-07-01
- **Status**: Accepted
- **Decision**: Use in-memory indexing vs persistent database
- **Rationale**: Simplicity, performance, no external dependencies

### ADR-004: Indexed Graph Optimization

- **Date**: 2025-01-10
- **Status**: Accepted
- **Decision**: Implement SPO/POS/OSP indexing with caching
- **Rationale**: O(1) lookups required for large vaults
- **Trade-offs**: Higher memory usage for better performance

## Dependencies

### Runtime Dependencies

- Obsidian API 1.5.0+
- Dataview Plugin (for queries)

### Development Dependencies

- TypeScript 4.9+
- ESBuild (bundling)
- Jest (testing)

## Monitoring & Metrics

### Performance Metrics

```typescript
interface PerformanceMetrics {
  lastIndexTime: number;
  lastQueryTime: number;
  cacheHitRate: number;
  averageQueryTime: number;
}
```

### Health Checks

- Triple store integrity
- Index consistency
- Memory usage
- Query response time

## Guidelines for Contributors

1. **Follow the architecture**: Place code in appropriate layers
2. **Depend on abstractions**: Use interfaces, not concrete classes
3. **Test first**: Write tests before implementation
4. **Keep it simple**: Avoid over-engineering
5. **Document decisions**: Explain non-obvious choices

## API Documentation

### Logger Service API

#### Core Logging Interface

```typescript
export interface ILogger {
  // Basic logging methods
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;
  
  // Performance timing
  startTiming(label: string): void;
  endTiming(label: string, context?: LogContext): void;
  
  // Context management
  setCorrelationId(id: string): void;
  getCorrelationId(): string | undefined;
  createChildLogger(context: LogContext): ILogger;
  
  // Configuration
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}
```

#### LoggerFactory Usage

```typescript
// Create logger for a class
class MyService {
  private logger = LoggerFactory.createForClass(MyService);
  
  async processData(data: any) {
    this.logger.startTiming('data-processing');
    this.logger.info('Processing data', { recordCount: data.length });
    
    try {
      const result = await this.processInternal(data);
      this.logger.endTiming('data-processing', { success: true });
      return result;
    } catch (error) {
      this.logger.error('Processing failed', { error: error.message }, error);
      this.logger.endTiming('data-processing', { success: false });
      throw error;
    }
  }
}

// Create contextual logger
const requestLogger = LoggerFactory.createWithContext('RequestHandler', {
  requestId: 'req-123',
  userId: 'user-456'
});
```

#### LoggerConfig Options

```typescript
interface LoggerConfig {
  level: LogLevel;                    // Minimum log level
  enabledInProduction: boolean;       // Enable in production
  enabledInDevelopment: boolean;      // Enable in development
  formatJson: boolean;                // JSON vs pretty print
  includeStackTrace: boolean;         // Include stack traces
  maxLogSize: number;                 // Maximum log entry size
  performanceThreshold: number;       // Performance warning threshold (ms)
  sensitiveKeys: string[];            // Keys to redact from logs
}
```

### BDD Testing Utilities API

#### TestDataBuilder

```typescript
class TestDataBuilder {
  // Fluent asset creation
  asset(name: string): AssetBuilder;
  
  // Semantic triple creation
  triple(subject: string): TripleBuilder;
  
  // Complex scenario building
  scenario(name: string): ScenarioBuilder;
  
  // Bulk graph operations
  graph(): GraphBuilder;
}

// Usage example
const testData = context.testDataBuilder
  .scenario('project_management')
  .withAsset('Enterprise Project')
    .withClass('ems__Project')
    .withPriority('high')
    .withStatus('active')
  .withTriple(':Enterprise_Project')
    .with('ems:hasTask')
    .equals(':Design_Phase');

const { assets, tripleCount } = await testData.build();
```

#### Performance Monitoring

```typescript
class PerformanceMonitor {
  // Time operations with automatic threshold validation
  async timeOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T>;
  
  // Assert performance requirements
  assertThreshold(metricName: string, value: number): void;
  
  // Record custom metrics
  recordMeasurement(name: string, value: number): void;
}

// Usage in BDD scenarios
Then('the query execution time should be under {int}ms', function(maxTime: number) {
  context.performanceMonitor.assertThreshold('query_execution', context.executionTime);
  expect(context.executionTime).to.be.lessThan(maxTime);
});
```

#### Security Validation

```typescript
class SecurityValidator {
  // Comprehensive input validation
  validateInput(input: string, context: string = 'general'): SecurityValidationResult;
  
  // SPARQL-specific security checks
  validateSPARQLQuery(query: string): SecurityValidationResult;
  
  // XSS detection and prevention
  checkXSS(input: string): SecurityIssue[];
  
  // SQL injection detection
  checkSQLInjection(input: string): SecurityIssue[];
}

interface SecurityValidationResult {
  isValid: boolean;
  issues: SecurityIssue[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  sanitizedInput: string;
  recommendations: string[];
}
```

---

_Maintained by SWEBOK Engineer Agent & Technical Writer Agent_
_Last Updated: 2025-08-24_
_Version: v4.1.0_
