import { setWorldConstructor, World } from '@cucumber/cucumber';
import { IndexedGraph } from '../../src/domain/semantic/core/IndexedGraph';
import { SPARQLEngine } from '../../src/application/SPARQLEngine';
import { QueryCache } from '../../src/application/services/QueryCache';
import { AssetRepository } from '../../src/infrastructure/repositories/AssetRepository';
import { ObsidianVaultAdapter } from '../../src/infrastructure/adapters/ObsidianVaultAdapter';

export interface ExocortexWorld extends World {
  // Core components
  graph: IndexedGraph;
  sparqlEngine: SPARQLEngine;
  queryCache: QueryCache;
  assetRepository: AssetRepository;
  vaultAdapter: ObsidianVaultAdapter;
  
  // Test state
  queryResult: any;
  lastQuery: string;
  startTime: number;
  endTime: number;
  currentAsset: any;
  apiResponse: any;
  apiStatus: number;
  
  // Test helpers
  reset(): void;
  setupTestData(): void;
}

class CustomWorld extends World implements ExocortexWorld {
  graph: IndexedGraph;
  sparqlEngine: SPARQLEngine;
  queryCache: QueryCache;
  assetRepository: AssetRepository;
  vaultAdapter: ObsidianVaultAdapter;
  
  queryResult: any;
  lastQuery: string;
  startTime: number;
  endTime: number;
  currentAsset: any;
  apiResponse: any;
  apiStatus: number;

  constructor(options: any) {
    super(options);
    
    // Initialize components
    this.graph = new IndexedGraph();
    this.queryCache = new QueryCache();
    this.sparqlEngine = new SPARQLEngine(this.graph, this.queryCache);
    
    // Mock vault adapter for testing
    this.vaultAdapter = {
      read: jest.fn(),
      write: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      list: jest.fn()
    } as any;
    
    this.assetRepository = new AssetRepository(this.vaultAdapter);
    
    // Initialize test state
    this.reset();
  }

  reset(): void {
    this.graph.clear();
    this.queryCache.clear();
    this.queryResult = null;
    this.lastQuery = '';
    this.startTime = 0;
    this.endTime = 0;
    this.currentAsset = null;
    this.apiResponse = null;
    this.apiStatus = 0;
  }

  setupTestData(): void {
    // Add common test data
    const testTriples = [
      { subject: ':Alice', predicate: ':knows', object: ':Bob' },
      { subject: ':Bob', predicate: ':knows', object: ':Charlie' },
      { subject: ':Alice', predicate: ':worksAt', object: ':Acme' },
      { subject: ':Bob', predicate: ':worksAt', object: ':Acme' },
      { subject: ':Charlie', predicate: ':worksAt', object: ':Beta' }
    ];

    for (const triple of testTriples) {
      this.graph.add({
        subject: triple.subject,
        predicate: triple.predicate,
        object: triple.object
      } as any);
    }
  }
}

setWorldConstructor(CustomWorld);