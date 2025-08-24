import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { DIContainer } from '../../../src/infrastructure/container/DIContainer';
import { FakeVaultAdapter } from '../../helpers/FakeVaultAdapter';
import { createMockVault } from '../../__mocks__/obsidian';
import { IndexedGraph } from '../../../src/domain/semantic/core/IndexedGraph';
import { TestDataBuilder } from '../helpers/TestDataBuilder';
import { PerformanceMonitor } from '../helpers/PerformanceMonitor';
import { SecurityValidator } from '../helpers/SecurityValidator';
import { ValidationHelper } from '../helpers/ValidationHelper';

/**
 * BDD World Context
 * 
 * Provides a centralized context for all BDD test scenarios.
 * Follows the Page Object Model pattern for maintainable tests.
 */
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

export class BDDWorld extends World implements IBDDWorld {
  public container!: DIContainer;
  public vaultAdapter!: FakeVaultAdapter;
  public graph!: IndexedGraph;
  
  public testDataBuilder!: TestDataBuilder;
  public performanceMonitor!: PerformanceMonitor;
  public securityValidator!: SecurityValidator;
  public validationHelper!: ValidationHelper;
  
  public testState: Map<string, any> = new Map();
  public currentScenario: string = '';
  public scenarioStartTime: number = 0;
  
  public lastError: Error | null = null;
  public validationErrors: string[] = [];
  public securityWarnings: string[] = [];
  
  public performanceMetrics = {
    executionTime: 0,
    memoryUsage: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  
  public cleanupTasks: Array<() => Promise<void> | void> = [];
  
  constructor(options: IWorldOptions) {
    super(options);
  }
  
  /**
   * Initialize the BDD world context
   */
  async initialize(scenarioName: string): Promise<void> {
    this.currentScenario = scenarioName;
    this.scenarioStartTime = Date.now();
    
    // Initialize core infrastructure
    await this.initializeInfrastructure();
    
    // Initialize test utilities
    this.initializeTestUtilities();
    
    // Clear state
    this.clearState();
  }
  
  /**
   * Initialize core infrastructure components
   */
  private async initializeInfrastructure(): Promise<void> {
    // Create mock vault
    const vault = createMockVault();
    this.vaultAdapter = new FakeVaultAdapter(vault);
    
    // Initialize DI container
    this.container = new DIContainer();
    await this.container.initialize();
    
    // Register test adapters
    this.container.registerInstance('IVaultAdapter', this.vaultAdapter);
    
    // Initialize semantic graph
    this.graph = new IndexedGraph();
    this.container.registerInstance('IndexedGraph', this.graph);
    
    this.registerForCleanup(() => this.vaultAdapter.clear());
    this.registerForCleanup(() => this.graph.clear());
  }
  
  /**
   * Initialize test utility classes
   */
  private initializeTestUtilities(): void {
    this.testDataBuilder = new TestDataBuilder(this.vaultAdapter, this.graph);
    this.performanceMonitor = new PerformanceMonitor();
    this.securityValidator = new SecurityValidator();
    this.validationHelper = new ValidationHelper();
  }
  
  /**
   * Clear test state
   */
  private clearState(): void {
    this.testState.clear();
    this.lastError = null;
    this.validationErrors = [];
    this.securityWarnings = [];
    this.performanceMetrics = {
      executionTime: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
  
  /**
   * Register a cleanup task to run after scenario
   */
  registerForCleanup(task: () => Promise<void> | void): void {
    this.cleanupTasks.push(task);
  }
  
  /**
   * Set test state value
   */
  setState(key: string, value: any): void {
    this.testState.set(key, value);
  }
  
  /**
   * Get test state value
   */
  getState<T = any>(key: string, defaultValue?: T): T {
    return this.testState.get(key) ?? defaultValue;
  }
  
  /**
   * Record performance metric
   */
  recordPerformance(metric: keyof BDDWorld['performanceMetrics'], value: number): void {
    this.performanceMetrics[metric] = value;
  }
  
  /**
   * Add validation error
   */
  addValidationError(error: string): void {
    this.validationErrors.push(error);
  }
  
  /**
   * Add security warning
   */
  addSecurityWarning(warning: string): void {
    this.securityWarnings.push(warning);
  }
  
  /**
   * Start performance timing
   */
  startTiming(): number {
    return Date.now();
  }
  
  /**
   * End performance timing and record
   */
  endTiming(startTime: number): number {
    const endTime = Date.now();
    const duration = endTime - startTime;
    this.recordPerformance('executionTime', duration);
    return duration;
  }
  
  /**
   * Clean up after scenario
   */
  async cleanup(): Promise<void> {
    // Run cleanup tasks in reverse order
    for (const task of this.cleanupTasks.reverse()) {
      try {
        await task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
    
    this.cleanupTasks = [];
    
    // Log performance summary
    this.logPerformanceSummary();
  }
  
  /**
   * Log performance summary for the scenario
   */
  private logPerformanceSummary(): void {
    const totalTime = Date.now() - this.scenarioStartTime;
    
    console.log(`\n📊 Performance Summary for: ${this.currentScenario}`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Execution Time: ${this.performanceMetrics.executionTime}ms`);
    console.log(`   Memory Usage: ${this.performanceMetrics.memoryUsage}MB`);
    console.log(`   Cache Hits: ${this.performanceMetrics.cacheHits}`);
    console.log(`   Cache Misses: ${this.performanceMetrics.cacheMisses}`);
    
    if (this.validationErrors.length > 0) {
      console.log(`   Validation Errors: ${this.validationErrors.length}`);
    }
    
    if (this.securityWarnings.length > 0) {
      console.log(`   Security Warnings: ${this.securityWarnings.length}`);
    }
  }
  
  /**
   * Assert that no errors occurred
   */
  assertNoErrors(): void {
    if (this.lastError) {
      throw new Error(`Unexpected error: ${this.lastError.message}`);
    }
    
    if (this.validationErrors.length > 0) {
      throw new Error(`Validation errors: ${this.validationErrors.join(', ')}`);
    }
  }
  
  /**
   * Assert performance requirements
   */
  assertPerformance(requirements: Partial<BDDWorld['performanceMetrics']>): void {
    if (requirements.executionTime && this.performanceMetrics.executionTime > requirements.executionTime) {
      throw new Error(`Execution time ${this.performanceMetrics.executionTime}ms exceeds limit ${requirements.executionTime}ms`);
    }
    
    if (requirements.memoryUsage && this.performanceMetrics.memoryUsage > requirements.memoryUsage) {
      throw new Error(`Memory usage ${this.performanceMetrics.memoryUsage}MB exceeds limit ${requirements.memoryUsage}MB`);
    }
  }
  
  /**
   * Create a scoped context for a specific feature
   */
  createFeatureContext<T extends Record<string, any>>(featureName: string, initialState: T): T & { cleanup: () => void } {
    const contextKey = `feature_${featureName}`;
    this.setState(contextKey, initialState);
    
    return {
      ...initialState,
      cleanup: () => {
        this.testState.delete(contextKey);
      }
    };
  }
}

// Register the world constructor
setWorldConstructor(BDDWorld);