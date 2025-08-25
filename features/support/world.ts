import { setWorldConstructor, World } from '@cucumber/cucumber';
import { App, Plugin, TFile, Vault } from 'obsidian';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';
import { IAssetRepository } from '../../src/domain/repositories/IAssetRepository';
import { IButtonCommandRepository } from '../../src/domain/repositories/IButtonCommandRepository';
import { IClassLayoutRepository } from '../../src/domain/repositories/IClassLayoutRepository';
import { IOntologyRepository } from '../../src/domain/repositories/IOntologyRepository';
import { IQueryEngineFactory } from '../../src/infrastructure/query-engines/IQueryEngineFactory';
import { IObsidianService } from '../../src/infrastructure/services/IObsidianService';
import { RDFGraph } from '../../src/domain/semantic/RDFGraph';
import { ExocortexPlugin } from '../../src/main';

export interface TestContext {
  app: App;
  plugin: ExocortexPlugin;
  vault: Vault;
  container: DIContainer;
  rdfGraph?: RDFGraph;
  currentFile?: TFile;
  lastResult?: any;
  lastError?: Error | null;
  testData: Map<string, any>;
  performanceMetrics: Map<string, number>;
}

export class ExocortexWorld extends World {
  public app!: App;
  public plugin!: ExocortexPlugin;
  public vault!: Vault;
  public container!: DIContainer;
  public rdfGraph?: RDFGraph;
  public currentFile?: TFile;
  public lastResult?: any;
  public lastError?: Error | null;
  public testData: Map<string, any>;
  public performanceMetrics: Map<string, number>;

  // Repository access
  public assetRepository!: IAssetRepository;
  public buttonCommandRepository!: IButtonCommandRepository;
  public classLayoutRepository!: IClassLayoutRepository;
  public ontologyRepository!: IOntologyRepository;
  public queryEngineFactory!: IQueryEngineFactory;
  public obsidianService!: IObsidianService;

  constructor(options: any) {
    super(options);
    this.testData = new Map();
    this.performanceMetrics = new Map();
  }

  async initialize() {
    // Initialize mock Obsidian app and plugin
    const mockApp = global.app || (await import('../../tests/__mocks__/obsidian')).app;
    const mockVault = mockApp.vault;
    
    this.app = mockApp as any;
    this.vault = mockVault as any;
    
    // Initialize plugin
    this.plugin = new ExocortexPlugin(this.app, {} as any);
    await this.plugin.onload();
    
    // Get container and repositories
    this.container = this.plugin.container;
    this.assetRepository = this.container.resolve<IAssetRepository>('IAssetRepository');
    this.buttonCommandRepository = this.container.resolve<IButtonCommandRepository>('IButtonCommandRepository');
    this.classLayoutRepository = this.container.resolve<IClassLayoutRepository>('IClassLayoutRepository');
    this.ontologyRepository = this.container.resolve<IOntologyRepository>('IOntologyRepository');
    this.queryEngineFactory = this.container.resolve<IQueryEngineFactory>('IQueryEngineFactory');
    this.obsidianService = this.container.resolve<IObsidianService>('IObsidianService');
    
    // Initialize RDF graph if needed
    this.rdfGraph = new RDFGraph();
  }

  async cleanup() {
    // Clean up test data
    this.testData.clear();
    this.performanceMetrics.clear();
    
    // Reset RDF graph
    if (this.rdfGraph) {
      this.rdfGraph = new RDFGraph();
    }
    
    // Reset errors
    this.lastError = null;
    this.lastResult = undefined;
    
    // Unload plugin
    if (this.plugin) {
      await this.plugin.onunload();
    }
  }

  recordPerformance(operation: string, duration: number) {
    this.performanceMetrics.set(operation, duration);
  }

  getPerformance(operation: string): number | undefined {
    return this.performanceMetrics.get(operation);
  }

  setTestData(key: string, value: any) {
    this.testData.set(key, value);
  }

  getTestData(key: string): any {
    return this.testData.get(key);
  }
}

setWorldConstructor(ExocortexWorld);