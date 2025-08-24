# Exocortex Plugin API Documentation

## Overview

This document provides comprehensive API documentation for the Exocortex Obsidian Plugin, including the new logging infrastructure, BDD testing framework, and enhanced type system introduced in v4.1.0.

## Logging Infrastructure API

### ILogger Interface

The core logging interface provides structured logging capabilities with performance monitoring and security features.

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

#### LogContext

```typescript
export interface LogContext {
  [key: string]: any;
}
```

#### LogLevel Enumeration

```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
```

#### LogEntry Structure

```typescript
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  correlationId?: string;
  error?: Error;
}
```

### LoggerFactory Class

Factory class for creating and managing logger instances.

```typescript
export class LoggerFactory {
  // Create a basic logger
  static create(name?: string): ILogger;
  
  // Create logger for a specific class
  static createForClass<T>(constructor: new (...args: any[]) => T): ILogger;
  
  // Create logger with persistent context
  static createWithContext(name: string, context: Record<string, any>): ILogger;
  
  // Get existing logger by name
  static getLogger(name: string): ILogger | undefined;
  
  // Get all registered loggers
  static getAllLoggers(): Map<string, ILogger>;
  
  // Clear all registered loggers
  static clearAll(): void;
  
  // Set global configuration
  static setConfig(config: LoggerConfig): void;
  
  // Get current configuration
  static getConfig(): LoggerConfig;
}
```

### LoggerConfig Interface

Configuration options for logger behavior.

```typescript
export interface LoggerConfig {
  level: LogLevel;                    // Minimum log level to output
  enabledInProduction: boolean;       // Enable logging in production
  enabledInDevelopment: boolean;      // Enable logging in development
  formatJson: boolean;                // Output JSON format vs pretty print
  includeStackTrace: boolean;         // Include stack traces in error logs
  maxLogSize: number;                 // Maximum log entry size in characters
  performanceThreshold: number;       // Performance warning threshold in ms
  sensitiveKeys: string[];            // Keys to automatically redact
}
```

#### LoggerConfigFactory

```typescript
export class LoggerConfigFactory {
  // Create default configuration
  static createDefault(): LoggerConfig;
  
  // Create development-optimized configuration
  static createDevelopment(): LoggerConfig;
  
  // Create production-optimized configuration
  static createProduction(): LoggerConfig;
  
  // Create test-optimized configuration
  static createTest(): LoggerConfig;
}
```

### Usage Examples

#### Basic Logging

```typescript
import { LoggerFactory, LogLevel } from './infrastructure/logging';

// Create logger for a class
class AssetService {
  private logger = LoggerFactory.createForClass(AssetService);
  
  async createAsset(assetData: AssetData): Promise<Result<Asset>> {
    this.logger.info('Creating new asset', { 
      assetName: assetData.name,
      assetClass: assetData.className 
    });
    
    try {
      const asset = await this.processAssetCreation(assetData);
      this.logger.info('Asset created successfully', { assetId: asset.getId() });
      return Result.ok(asset);
    } catch (error) {
      this.logger.error('Failed to create asset', { 
        assetName: assetData.name 
      }, error);
      return Result.fail(`Asset creation failed: ${error.message}`);
    }
  }
}
```

#### Performance Monitoring

```typescript
class QueryEngine {
  private logger = LoggerFactory.createForClass(QueryEngine);
  
  async executeQuery(query: string): Promise<QueryResult> {
    this.logger.startTiming('query-execution');
    this.logger.info('Executing SPARQL query', { 
      queryLength: query.length,
      queryType: this.detectQueryType(query)
    });
    
    try {
      const result = await this.processQuery(query);
      this.logger.endTiming('query-execution', { 
        resultCount: result.length,
        success: true 
      });
      return result;
    } catch (error) {
      this.logger.endTiming('query-execution', { 
        success: false,
        error: error.message 
      });
      throw error;
    }
  }
}
```

#### Child Loggers with Context

```typescript
class RequestHandler {
  private logger = LoggerFactory.createForClass(RequestHandler);
  
  async handleRequest(request: Request): Promise<Response> {
    // Create child logger with request context
    const requestLogger = this.logger.createChildLogger({
      requestId: request.id,
      userId: request.userId,
      endpoint: request.endpoint
    });
    
    requestLogger.info('Processing request');
    
    // Use child logger throughout request lifecycle
    const result = await this.processRequest(request, requestLogger);
    
    requestLogger.info('Request completed', { 
      statusCode: result.statusCode 
    });
    
    return result;
  }
  
  private async processRequest(request: Request, logger: ILogger): Promise<Response> {
    logger.debug('Validating request data');
    // ... validation logic
    
    logger.debug('Processing business logic');
    // ... business logic
    
    return response;
  }
}
```

## BDD Testing Framework API

### World Context Interface

The BDD World provides centralized context for test scenarios.

```typescript
export interface IBDDWorld {
  // Core infrastructure
  container: DIContainer;
  vaultAdapter: FakeVaultAdapter;
  graph: IndexedGraph;
  
  // Test utilities
  testDataBuilder: TestDataBuilder;
  performanceMonitor: PerformanceMonitor;
  securityValidator: SecurityValidator;
  validationHelper: ValidationHelper;
  
  // Test state management
  testState: Map<string, any>;
  currentScenario: string;
  scenarioStartTime: number;
  
  // Error tracking
  lastError: Error | null;
  validationErrors: string[];
  securityWarnings: string[];
  
  // Performance metrics
  performanceMetrics: {
    executionTime: number;
    memoryUsage: number;
    cacheHits: number;
    cacheMisses: number;
  };
  
  // Cleanup registry
  cleanupTasks: Array<() => Promise<void> | void>;
}
```

### TestDataBuilder API

Fluent API for creating complex test data scenarios.

```typescript
export class TestDataBuilder {
  constructor(vaultAdapter: FakeVaultAdapter, graph: IndexedGraph);
  
  // Create asset builder
  asset(name: string): AssetBuilder;
  
  // Create triple builder
  triple(subject: string): TripleBuilder;
  
  // Create graph builder
  graph(): GraphBuilder;
  
  // Create scenario builder
  scenario(name: string): ScenarioBuilder;
  
  // Clear all test data
  clear(): void;
}
```

#### AssetBuilder

```typescript
export class AssetBuilder {
  // Set asset class
  withClass(className: string): AssetBuilder;
  
  // Add properties
  withProperty(key: string, value: any): AssetBuilder;
  withProperties(properties: Record<string, any>): AssetBuilder;
  
  // Convenience methods
  withPriority(priority: 'low' | 'medium' | 'high' | 'critical'): AssetBuilder;
  withStatus(status: string): AssetBuilder;
  withDescription(description: string): AssetBuilder;
  withContent(content: string): AssetBuilder;
  withTags(tags: string[]): AssetBuilder;
  
  // Build methods
  async build(): Promise<Asset>;
  async buildMultiple(count: number, namePattern?: (index: number) => string): Promise<Asset[]>;
}
```

#### TripleBuilder

```typescript
export class TripleBuilder {
  // Set predicate
  with(predicate: string): TripleBuilder;
  
  // Set object and create triple
  equals(object: string): Triple;
  literal(value: string | number | boolean): Triple;
  iri(iri: string): Triple;
}
```

#### ScenarioBuilder

```typescript
export class ScenarioBuilder {
  // Add assets to scenario
  withAsset(name: string): AssetBuilder;
  
  // Add triples to scenario
  withTriple(subject: string): TripleBuilder;
  
  // Predefined scenarios
  projectManagementScenario(): ScenarioBuilder;
  knowledgeManagementScenario(): ScenarioBuilder;
  
  // Build all scenario components
  async build(): Promise<{ assets: Asset[]; tripleCount: number }>;
}
```

### PerformanceMonitor API

Performance validation and metrics collection for BDD tests.

```typescript
export class PerformanceMonitor {
  // Time operations with automatic validation
  async timeOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T>;
  
  // Record custom measurements
  recordMeasurement(name: string, value: number): void;
  
  // Assert performance thresholds
  assertThreshold(metricName: string, value: number): void;
  
  // Get performance statistics
  getStats(): PerformanceStats;
  
  // Check threshold compliance
  checkThreshold(metricName: string, value: number): ThresholdResult;
  
  // Clear all measurements
  clear(): void;
}

interface PerformanceStats {
  measurements: Map<string, number[]>;
  averages: Map<string, number>;
  thresholds: Map<string, number>;
}

interface ThresholdResult {
  passed: boolean;
  value: number;
  threshold: number;
  message: string;
}
```

### SecurityValidator API

Comprehensive security validation for input testing.

```typescript
export class SecurityValidator {
  // General input validation
  validateInput(input: string, context?: string): SecurityValidationResult;
  
  // Specific validation methods
  validateSPARQLQuery(query: string): SecurityValidationResult;
  validateFileContent(content: string): SecurityValidationResult;
  validatePropertyValue(value: any, propertyName: string): SecurityValidationResult;
  
  // Individual security checks
  checkXSS(input: string): SecurityIssue[];
  checkSQLInjection(input: string): SecurityIssue[];
  checkPathTraversal(input: string): SecurityIssue[];
  checkSPARQLInjection(input: string): SecurityIssue[];
  checkCommandInjection(input: string): SecurityIssue[];
  
  // Severity assessment
  calculateSeverity(issues: SecurityIssue[]): SecuritySeverity;
  
  // Input sanitization
  sanitizeInput(input: string, issues: SecurityIssue[]): string;
  
  // Generate recommendations
  generateRecommendations(issues: SecurityIssue[]): string[];
}

interface SecurityValidationResult {
  isValid: boolean;
  issues: SecurityIssue[];
  severity: SecuritySeverity;
  sanitizedInput: string;
  recommendations: string[];
}

interface SecurityIssue {
  type: SecurityIssueType;
  severity: SecuritySeverity;
  description: string;
  pattern: string;
  suggestion: string;
}

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
type SecurityIssueType = 'xss' | 'sql_injection' | 'sparql_injection' | 'path_traversal' | 'command_injection' | 'dos_pattern';
```

### ValidationHelper API

Data validation and verification utilities for BDD testing.

```typescript
export class ValidationHelper {
  // Asset validation
  validateAsset(asset: Asset): ValidationResult;
  validateAssetProperties(properties: Map<string, any>, className: string): ValidationResult;
  
  // Triple validation
  validateTriple(triple: Triple): ValidationResult;
  validateTripleStructure(subject: string, predicate: string, object: string): ValidationResult;
  
  // Query validation
  validateSPARQLSyntax(query: string): ValidationResult;
  validateQueryStructure(query: string): ValidationResult;
  
  // General validation
  validateIRI(iri: string): ValidationResult;
  validateClassName(className: string): ValidationResult;
  validateUUID(uuid: string): ValidationResult;
  validateTimestamp(timestamp: string): ValidationResult;
  
  // Collection validation
  validateAssetCollection(assets: Asset[]): CollectionValidationResult;
  validateTripleCollection(triples: Triple[]): CollectionValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface CollectionValidationResult extends ValidationResult {
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
}
```

## BDD Testing Usage Examples

### Basic Scenario Testing

```typescript
// Feature file: tests/bdd/features/asset-management.feature
Feature: Asset Management
  As a knowledge worker
  I want to create and manage assets
  So that I can organize my knowledge effectively

  Scenario: Creating a new asset with valid properties
    Given I have a valid asset configuration
      | field       | value              |
      | name        | Test Project Asset |
      | class       | ems__Project       |
      | description | A test project     |
    When I create an asset through the CreateAssetUseCase
    Then the asset should be created successfully
    And the asset should have the correct properties
```

```typescript
// Step definition: tests/bdd/step-definitions/asset-management.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';

Given('I have a valid asset configuration', function(dataTable) {
  const config = dataTable.rowsHash();
  
  this.assetConfiguration = this.testDataBuilder
    .asset(config.name)
    .withClass(config.class)
    .withDescription(config.description);
    
  expect(this.assetConfiguration).to.exist;
});

When('I create an asset through the CreateAssetUseCase', async function() {
  const asset = await this.assetConfiguration.build();
  
  const result = await this.createAssetUseCase.execute({
    asset: asset,
    parentPath: '',
    templatePath: undefined
  });
  
  this.lastResult = result;
  this.currentAsset = asset;
});

Then('the asset should be created successfully', function() {
  expect(this.lastResult.isSuccess).to.be.true;
  expect(this.currentAsset).to.exist;
});
```

### Performance Testing with BDD

```typescript
// Feature with performance requirements
Scenario: Query execution performance
  Given I have a complex SPARQL query
  And the system has 1000 test assets
  When I execute the query
  Then the query should complete within 100ms
  And the memory usage should be under 50MB

// Step definitions with performance monitoring
Given('the system has {int} test assets', async function(assetCount: number) {
  const assets = await this.testDataBuilder
    .asset('Performance Test Asset')
    .withClass('ems__Task')
    .withPriority('medium')
    .buildMultiple(assetCount);
    
  expect(assets).to.have.length(assetCount);
  this.performanceMonitor.recordMeasurement('test_assets_created', assetCount);
});

When('I execute the query', async function() {
  const startTime = this.startTiming();
  
  const result = await this.performanceMonitor.timeOperation('query_execution', async () => {
    return await this.queryEngine.execute(this.complexQuery);
  });
  
  this.queryResult = result;
  this.executionTime = this.endTiming(startTime);
});

Then('the query should complete within {int}ms', function(maxTime: number) {
  this.performanceMonitor.assertThreshold('query_execution', this.executionTime);
  expect(this.executionTime).to.be.lessThan(maxTime);
});
```

### Security Testing with BDD

```typescript
// Security-focused scenario
Scenario: SQL injection protection
  Given I have a malicious SPARQL query containing SQL injection
  When I validate the query with SecurityValidator
  Then the validation should detect the security threat
  And the query should be blocked
  And recommendations should be provided

// Security step definitions
Given('I have a malicious SPARQL query containing SQL injection', function() {
  this.maliciousQuery = "SELECT * WHERE { ?s ?p 'value'; DROP TABLE users; --' }";
  expect(this.maliciousQuery).to.contain('DROP TABLE');
});

When('I validate the query with SecurityValidator', function() {
  this.securityResult = this.securityValidator.validateSPARQLQuery(this.maliciousQuery);
  expect(this.securityResult).to.exist;
});

Then('the validation should detect the security threat', function() {
  expect(this.securityResult.isValid).to.be.false;
  expect(this.securityResult.severity).to.equal('critical');
  expect(this.securityResult.issues).to.have.length.greaterThan(0);
  
  const sqlInjectionIssues = this.securityResult.issues.filter(
    issue => issue.type === 'sql_injection'
  );
  expect(sqlInjectionIssues).to.have.length.greaterThan(0);
});
```

## Type System Improvements

### Enhanced Result Pattern

```typescript
export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: string
  ) {}
  
  public static ok<U>(value: U): Result<U> {
    return new Result<U>(true, value);
  }
  
  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, undefined, error);
  }
  
  public get isSuccess(): boolean {
    return this._isSuccess;
  }
  
  public getValue(): T | null {
    return this._value || null;
  }
  
  public getError(): string {
    return this._error || '';
  }
  
  // Transform result with mapping function
  public map<U>(fn: (value: T) => U): Result<U> {
    if (!this.isSuccess) {
      return Result.fail<U>(this.getError());
    }
    try {
      return Result.ok(fn(this.getValue()!));
    } catch (error) {
      return Result.fail<U>(error.message);
    }
  }
  
  // Chain results with flatMap
  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (!this.isSuccess) {
      return Result.fail<U>(this.getError());
    }
    return fn(this.getValue()!);
  }
}
```

### Property Type Definitions

```typescript
// Domain-specific property types
export interface AssetProperties {
  [key: string]: PropertyValue;
}

export type PropertyValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | string[]
  | PropertyReference;

export interface PropertyReference {
  type: 'reference';
  target: string;
  label?: string;
}

// Type guards for runtime validation
export function isPropertyReference(value: any): value is PropertyReference {
  return typeof value === 'object' && value.type === 'reference' && typeof value.target === 'string';
}

export function isValidPropertyValue(value: any): value is PropertyValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date ||
    Array.isArray(value) && value.every(item => typeof item === 'string') ||
    isPropertyReference(value)
  );
}
```

## Best Practices

### Logging Best Practices

1. **Use appropriate log levels**: DEBUG for detailed info, INFO for general flow, WARN for issues, ERROR for failures
2. **Include contextual information**: Add relevant data to help with debugging
3. **Use performance timing**: Monitor operation performance with startTiming/endTiming
4. **Create child loggers**: Use contextual child loggers for request/operation tracking
5. **Avoid sensitive data**: Configure sensitive keys to prevent logging passwords/tokens

### BDD Testing Best Practices

1. **Write scenarios from user perspective**: Focus on business value, not technical implementation
2. **Use the Given-When-Then structure**: Clear setup, action, and verification steps
3. **Keep scenarios focused**: One scenario per feature or behavior
4. **Use test data builders**: Create reusable, maintainable test data
5. **Include performance and security tests**: Validate non-functional requirements
6. **Clean up test data**: Use the cleanup registry to maintain test isolation

### Type Safety Best Practices

1. **Use strict TypeScript mode**: Enable all strict checking options
2. **Define explicit interfaces**: Don't rely on implicit any types
3. **Use type guards**: Validate runtime types with proper guards
4. **Leverage union types**: Use discriminated unions for complex data structures
5. **Generic constraints**: Use proper generic constraints for reusable components

---

**Version**: v4.1.0  
**Last Updated**: 2025-08-24  
**Authors**: Technical Writer Agent, SWEBOK Engineer Agent