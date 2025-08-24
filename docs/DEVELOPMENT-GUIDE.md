# Exocortex Plugin Development Guide

## Overview

This guide provides comprehensive information for developers working on the Exocortex Obsidian Plugin, including new features introduced in v4.1.0: logging infrastructure, BDD testing framework, and enhanced development workflows.

## Quick Start for Developers

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Obsidian 1.5.0 or higher for testing
- Git for version control

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/kitelev/exocortex-obsidian-plugin.git
cd exocortex-obsidian-plugin

# Install dependencies
npm install

# Verify setup with tests
npm run test:unit

# Build the plugin
npm run build

# Start development server
npm run dev
```

### Development Workflow

```bash
# Start development with hot reload
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch

# For BDD development
npm run test:bdd:watch

# Run all quality checks
npm run check:all
```

## New Features in v4.1.0

### 1. Logging Infrastructure

**Purpose**: Enterprise-grade logging system with performance monitoring and security features.

**Location**: `/src/infrastructure/logging/`

#### Key Components

- **ILogger**: Core logging interface with timing and context support
- **LoggerFactory**: Centralized logger creation and management
- **LoggerConfig**: Configurable logging behavior
- **Security**: Automatic sanitization of sensitive data

#### Quick Usage

```typescript
import { LoggerFactory } from '../infrastructure/logging/LoggerFactory';

class MyService {
  private logger = LoggerFactory.createForClass(MyService);
  
  async processData(data: any) {
    this.logger.startTiming('data-processing');
    this.logger.info('Processing started', { recordCount: data.length });
    
    try {
      const result = await this.doProcessing(data);
      this.logger.endTiming('data-processing', { success: true });
      return result;
    } catch (error) {
      this.logger.error('Processing failed', { data: data.id }, error);
      this.logger.endTiming('data-processing', { success: false });
      throw error;
    }
  }
}
```

#### Configuration Options

```typescript
// Development configuration
const devConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  enabledInProduction: false,
  enabledInDevelopment: true,
  formatJson: false,
  includeStackTrace: true,
  maxLogSize: 2000,
  performanceThreshold: 100,
  sensitiveKeys: ['password', 'token', 'secret', 'key']
};

// Production configuration
const prodConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabledInProduction: true,
  enabledInDevelopment: true,
  formatJson: true,
  includeStackTrace: false,
  maxLogSize: 1000,
  performanceThreshold: 200,
  sensitiveKeys: ['password', 'token', 'secret', 'key', 'auth']
};
```

### 2. BDD Testing Framework

**Purpose**: Behavior-Driven Development with business-readable scenarios and comprehensive test utilities.

**Location**: `/tests/bdd/`

#### Framework Structure

```
tests/bdd/
├── features/              # Gherkin feature files
│   ├── asset-management.feature
│   ├── query-execution.feature
│   └── layout-rendering.feature
├── step-definitions/      # Step implementations
│   ├── asset-management.steps.ts
│   └── query-execution.steps.ts
├── helpers/              # Test utilities
│   ├── TestDataBuilder.ts
│   ├── PerformanceMonitor.ts
│   ├── SecurityValidator.ts
│   └── ValidationHelper.ts
└── support/             # World context and setup
    └── world.ts
```

#### Writing BDD Tests

**1. Create Feature File**

```gherkin
# tests/bdd/features/my-feature.feature
@asset-management @core
Feature: Asset Creation
  As a knowledge worker
  I want to create semantic assets
  So that I can organize my knowledge

  Background:
    Given the Exocortex plugin is initialized
    And the ontology repository is available

  @smoke @high-priority
  Scenario: Creating a project asset
    Given I have project data:
      | field       | value              |
      | name        | Enterprise Project |
      | class       | ems__Project       |
      | priority    | high               |
      | status      | active             |
    When I create the asset
    Then the asset should be created successfully
    And it should have the correct properties
    And it should be indexed in the semantic graph
```

**2. Implement Step Definitions**

```typescript
// tests/bdd/step-definitions/my-feature.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { BDDWorld } from '../support/world';

Given('I have project data:', function(this: BDDWorld, dataTable) {
  const data = dataTable.rowsHash();
  
  // Use TestDataBuilder for consistent data creation
  this.assetBuilder = this.testDataBuilder
    .asset(data.name)
    .withClass(data.class)
    .withPriority(data.priority)
    .withStatus(data.status);
    
  // Log the setup for debugging
  const logger = LoggerFactory.createWithContext('BDD_Step', {
    scenario: this.currentScenario,
    step: 'project_data_setup'
  });
  logger.info('Project data configured', data);
});

When('I create the asset', async function(this: BDDWorld) {
  // Performance monitoring
  const startTime = this.startTiming();
  
  // Create the asset using builder
  this.currentAsset = await this.assetBuilder.build();
  
  // Execute use case
  this.lastResult = await this.createAssetUseCase.execute({
    asset: this.currentAsset,
    parentPath: '',
    templatePath: undefined
  });
  
  // Record performance
  this.endTiming(startTime);
});

Then('the asset should be created successfully', function(this: BDDWorld) {
  expect(this.lastResult.isSuccess).to.be.true;
  expect(this.currentAsset).to.exist;
  
  // Verify no validation errors
  this.assertNoErrors();
});
```

**3. Advanced Testing with Test Utilities**

```typescript
// Using PerformanceMonitor
Then('the operation should complete within {int}ms', function(maxTime: number) {
  this.performanceMonitor.assertThreshold('asset_creation', this.executionTime);
  expect(this.executionTime).to.be.lessThan(maxTime);
});

// Using SecurityValidator
When('I validate user input {string}', function(userInput: string) {
  this.securityResult = this.securityValidator.validateInput(userInput);
  
  if (!this.securityResult.isValid) {
    this.addSecurityWarning(`Blocked suspicious input: ${this.securityResult.severity}`);
  }
});

// Using TestDataBuilder for complex scenarios
Given('I have a complete project hierarchy', async function() {
  const scenario = await this.testDataBuilder
    .scenario('project_hierarchy')
    .withAsset('Main Project')
      .withClass('ems__Project')
      .withStatus('active')
    .withAsset('Design Phase')
      .withClass('ems__Task')
      .withStatus('completed')
    .withAsset('Development Phase')
      .withClass('ems__Task')
      .withStatus('in-progress')
    .withTriple(':Main_Project')
      .with('ems:hasTask')
      .equals(':Design_Phase')
    .withTriple(':Main_Project')
      .with('ems:hasTask')
      .equals(':Development_Phase')
    .build();
    
  expect(scenario.assets).to.have.length(3);
  expect(scenario.tripleCount).to.be.greaterThan(0);
});
```

#### Running BDD Tests

```bash
# Run all BDD tests
npm run test:bdd

# Run specific test categories
npm run test:bdd:smoke      # Critical scenarios only
npm run test:bdd:security   # Security-focused tests
npm run test:bdd:api        # API integration tests

# Development with watch mode
npm run test:bdd:watch

# With coverage reporting
npm run test:bdd:coverage

# Advanced execution with tags
./scripts/run-bdd-tests.sh performance
./scripts/run-bdd-tests.sh mobile
```

### 3. Enhanced Test Infrastructure

**Purpose**: Comprehensive testing across multiple categories with robust tooling.

#### Test Categories

```
tests/
├── unit/              # Component isolation tests
├── integration/       # Component interaction tests  
├── bdd/              # Business scenario tests
├── ui/               # User interface automation
├── e2e/              # End-to-end workflow tests
├── contract/         # API contract validation
└── performance/      # Load and stress testing
```

#### Test Execution Strategy

```bash
# Development Testing (Fast)
npm run test:unit            # Unit tests only
npm run test:watch           # TDD with watch mode

# Integration Testing (Medium)
npm run test:integration     # Component interactions
npm run test:bdd            # Business scenarios

# Full Testing (Comprehensive)
npm run test:all            # All test categories
npm run test:coverage       # With coverage reporting

# Specialized Testing
npm run test:ui             # UI automation
npm run test:mobile         # Mobile-specific tests
npm run test:performance    # Performance benchmarks
npm run test:security       # Security validation
```

#### Performance Testing

```typescript
// Example performance test
describe('Performance Requirements', () => {
  const performanceMonitor = new PerformanceMonitor();
  
  it('should handle 1000 assets under 500ms', async () => {
    // Setup test data
    const assets = await createTestAssets(1000);
    
    // Measure performance
    const duration = await performanceMonitor.timeOperation('bulk_processing', async () => {
      return await processor.processAssets(assets);
    });
    
    // Assert requirements
    expect(duration).to.be.lessThan(500);
    
    // Log performance metrics
    logger.info('Performance test completed', {
      operation: 'bulk_processing',
      assetCount: assets.length,
      duration: `${duration}ms`,
      throughput: `${(assets.length / duration * 1000).toFixed(2)} assets/sec`
    });
  });
});
```

## Development Best Practices

### 1. Code Organization

Follow Clean Architecture principles:

```
src/
├── domain/              # Business logic (no external dependencies)
│   ├── entities/       # Domain entities
│   ├── value-objects/  # Immutable value objects
│   ├── services/       # Domain services
│   └── repositories/   # Repository interfaces
├── application/        # Use cases and application services
│   ├── use-cases/     # Business operations
│   └── services/      # Application-level services
├── infrastructure/    # External integrations
│   ├── repositories/ # Data access implementations
│   ├── logging/      # Logging infrastructure
│   └── adapters/     # External system adapters
└── presentation/     # UI and user interaction
    ├── components/   # UI components
    ├── modals/      # User dialogs
    └── renderers/   # Content renderers
```

### 2. Error Handling

Use the Result pattern consistently:

```typescript
// Good: Result pattern
async function createAsset(data: AssetData): Promise<Result<Asset>> {
  try {
    const validation = validateAssetData(data);
    if (!validation.isValid) {
      return Result.fail(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    const asset = await buildAsset(data);
    await persistAsset(asset);
    
    return Result.ok(asset);
  } catch (error) {
    logger.error('Asset creation failed', { data: data.name }, error);
    return Result.fail(`Failed to create asset: ${error.message}`);
  }
}

// Usage
const result = await createAsset(assetData);
if (result.isSuccess) {
  const asset = result.getValue();
  // Handle success
} else {
  const error = result.getError();
  // Handle error
}
```

### 3. Testing Guidelines

#### Unit Testing

- Test individual components in isolation
- Mock all external dependencies
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names

```typescript
describe('AssetRepository', () => {
  let repository: AssetRepository;
  let mockVaultAdapter: jest.Mocked<IVaultAdapter>;
  
  beforeEach(() => {
    mockVaultAdapter = createMockVaultAdapter();
    repository = new AssetRepository(mockVaultAdapter);
  });
  
  describe('createAsset', () => {
    it('should create asset with valid data and return success result', async () => {
      // Arrange
      const validAsset = createTestAsset();
      mockVaultAdapter.createFile.mockResolvedValue(Result.ok(undefined));
      
      // Act
      const result = await repository.createAsset(validAsset);
      
      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockVaultAdapter.createFile).toHaveBeenCalledWith(
        expect.stringContaining(validAsset.getName()),
        expect.any(String)
      );
    });
  });
});
```

#### Integration Testing

- Test component interactions
- Use minimal mocking
- Focus on data flow between components

```typescript
describe('Asset Creation Workflow', () => {
  let container: DIContainer;
  let vaultAdapter: FakeVaultAdapter;
  
  beforeEach(async () => {
    container = new DIContainer();
    vaultAdapter = new FakeVaultAdapter();
    
    container.registerInstance('IVaultAdapter', vaultAdapter);
    await container.initialize();
  });
  
  it('should create asset through complete workflow', async () => {
    // Get services from container
    const useCase = container.resolve<CreateAssetUseCase>('CreateAssetUseCase');
    const repository = container.resolve<IAssetRepository>('IAssetRepository');
    
    // Execute workflow
    const assetData = createTestAssetData();
    const result = await useCase.execute(assetData);
    
    // Verify end-to-end behavior
    expect(result.isSuccess).toBe(true);
    
    const persistedAsset = await repository.findById(result.getValue().getId());
    expect(persistedAsset).toBeDefined();
  });
});
```

### 4. Logging Guidelines

#### When to Log

- **DEBUG**: Detailed flow information, variable values
- **INFO**: General application flow, business events
- **WARN**: Unexpected situations that don't break functionality
- **ERROR**: Error conditions that prevent normal operation

#### What to Include

```typescript
class AssetService {
  private logger = LoggerFactory.createForClass(AssetService);
  
  async createAsset(data: AssetData): Promise<Result<Asset>> {
    // Log start of operation with context
    this.logger.info('Creating asset', {
      assetName: data.name,
      assetClass: data.className,
      operation: 'create_asset'
    });
    
    // Use timing for performance monitoring
    this.logger.startTiming('asset_creation');
    
    try {
      // Log significant steps
      this.logger.debug('Validating asset data');
      const validation = await this.validateAssetData(data);
      
      if (!validation.isValid) {
        this.logger.warn('Asset validation failed', {
          errors: validation.errors,
          assetName: data.name
        });
        return Result.fail(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      this.logger.debug('Building asset entity');
      const asset = await this.buildAsset(data);
      
      this.logger.debug('Persisting asset');
      await this.persistAsset(asset);
      
      // Log successful completion
      this.logger.info('Asset created successfully', {
        assetId: asset.getId(),
        assetName: asset.getName()
      });
      
      this.logger.endTiming('asset_creation', { success: true });
      return Result.ok(asset);
      
    } catch (error) {
      // Log errors with context
      this.logger.error('Asset creation failed', {
        assetName: data.name,
        error: error.message
      }, error);
      
      this.logger.endTiming('asset_creation', { success: false });
      return Result.fail(`Failed to create asset: ${error.message}`);
    }
  }
}
```

### 5. Performance Considerations

#### Monitoring Performance

```typescript
class QueryEngine {
  private logger = LoggerFactory.createForClass(QueryEngine);
  private performanceMonitor = new PerformanceMonitor();
  
  async executeQuery(query: string): Promise<QueryResult> {
    // Monitor execution time
    const result = await this.performanceMonitor.timeOperation(
      'query_execution',
      async () => {
        return await this.processQuery(query);
      }
    );
    
    // Log performance metrics
    this.logger.info('Query executed', {
      queryHash: this.hashQuery(query),
      resultCount: result.length,
      executionTime: this.performanceMonitor.getLastMeasurement('query_execution'),
      cacheHit: this.wasCacheHit(query)
    });
    
    return result;
  }
}
```

#### Performance Testing

```typescript
// Performance test example
describe('Query Performance', () => {
  it('should execute simple queries under 10ms', async () => {
    const query = 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10';
    
    const startTime = performance.now();
    const result = await queryEngine.execute(query);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(10);
    expect(result.length).toBeLessThanOrEqual(10);
  });
  
  it('should handle 1000 concurrent queries', async () => {
    const queries = Array(1000).fill().map(() => createTestQuery());
    
    const startTime = performance.now();
    const results = await Promise.all(queries.map(q => queryEngine.execute(q)));
    const duration = performance.now() - startTime;
    
    expect(results).toHaveLength(1000);
    expect(duration).toBeLessThan(5000); // 5 seconds for 1000 queries
  });
});
```

## Debugging and Troubleshooting

### 1. Debug Configuration

```typescript
// Enable debug logging
const debugConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  enabledInDevelopment: true,
  formatJson: false,
  includeStackTrace: true,
  performanceThreshold: 50,
  sensitiveKeys: []
};

LoggerFactory.setConfig(debugConfig);
```

### 2. Common Issues and Solutions

#### Issue: Tests Failing Intermittently

**Solution**: Use proper async/await and cleanup

```typescript
// Bad: Missing await
it('should create asset', () => {
  const result = repository.createAsset(asset); // Missing await
  expect(result.isSuccess).toBe(true);
});

// Good: Proper async handling
it('should create asset', async () => {
  const result = await repository.createAsset(asset);
  expect(result.isSuccess).toBe(true);
});

// Good: Proper cleanup
afterEach(() => {
  // Clear any timers, mocks, or state
  jest.clearAllTimers();
  jest.clearAllMocks();
  testDataBuilder.clear();
});
```

#### Issue: Memory Leaks in Tests

**Solution**: Use cleanup registry and proper resource management

```typescript
class TestHelper {
  private cleanupTasks: Array<() => void> = [];
  
  registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task);
  }
  
  async cleanup(): Promise<void> {
    for (const task of this.cleanupTasks.reverse()) {
      try {
        await task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
    this.cleanupTasks = [];
  }
}
```

### 3. Debugging Tools

#### Console Debugging

```typescript
// Use structured logging instead of console.log
const logger = LoggerFactory.createForClass(MyClass);

// Instead of: console.log('Processing', data);
logger.debug('Processing data', { 
  dataType: typeof data,
  dataSize: JSON.stringify(data).length,
  timestamp: Date.now()
});
```

#### Test Debugging

```bash
# Run specific test file with debug output
DEBUG=true npm test -- --testPathPattern="AssetRepository.test.ts"

# Run BDD tests with debug logging
DEBUG_BDD=true npm run test:bdd

# Run tests with verbose output
npm test -- --verbose
```

## Continuous Integration

### GitHub Actions Workflow

The project uses GitHub Actions for CI/CD with the following stages:

1. **Setup**: Install dependencies and setup environment
2. **Quality Checks**: TypeScript compilation, linting, formatting
3. **Testing**: All test categories with coverage reporting
4. **Build**: Production build verification
5. **Release**: Automated versioning and release creation

### Local CI Simulation

```bash
# Run the full CI pipeline locally
./scripts/validate-ci.sh

# Individual CI steps
npm run check:all          # Quality checks
npm run test:ci            # CI test suite
npm run build              # Production build
npm run validate           # Plugin validation
```

## Release Process

### Versioning

The project follows Semantic Versioning (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Creating a Release

```bash
# Patch release (bug fixes)
npm version patch
git push origin main --tags

# Minor release (new features)
npm version minor
git push origin main --tags

# Major release (breaking changes)
npm version major
git push origin main --tags
```

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Performance benchmarks within limits
- [ ] Security validation passed
- [ ] BDD scenarios cover new features
- [ ] Mobile compatibility verified

## Contributing

### Code Review Guidelines

1. **Functionality**: Code works as intended
2. **Tests**: Adequate test coverage (unit, integration, BDD)
3. **Documentation**: Code is well-documented
4. **Performance**: No performance regressions
5. **Security**: Security considerations addressed
6. **Architecture**: Follows established patterns

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run full test suite locally
4. Update documentation
5. Create pull request with clear description
6. Address review feedback
7. Merge after approval

---

**Version**: v4.1.0  
**Last Updated**: 2025-08-24  
**Authors**: Technical Writer Agent, SWEBOK Engineer Agent

For more detailed information, see:
- [API Documentation](API-DOCUMENTATION.md)
- [Architecture Guide](../ARCHITECTURE.md)
- [Test Patterns](../CLAUDE-test-patterns.md)
- [BDD Testing Guide](BDD-TESTING-GUIDE.md)