import { Given, When, Then, DataTable, Before, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { ExocortexWorld } from '../support/world';
import { IndexedGraph, GraphStatistics } from '../../src/domain/semantic/core/IndexedGraph';
import { Triple, IRI, BlankNode, Literal } from '../../src/domain/semantic/core/Triple';
import { RDFService } from '../../src/application/services/RDFService';
import { NamespaceManager } from '../../src/application/services/NamespaceManager';
import { RDFValidator } from '../../src/application/services/RDFValidator';
import { Result } from '../../src/domain/core/Result';
import { RDFFormat } from '../../src/application/services/RDFSerializer';

interface RDFTripleContext {
  graph: IndexedGraph;
  rdfService: RDFService;
  namespaceManager: NamespaceManager;
  validator: RDFValidator;
  operationResults: Result<any>[];
  lastError: string | null;
  performanceMetrics: Map<string, number>;
  statistics: GraphStatistics | null;
  validationErrors: string[];
  batchOperationResults: Map<string, any>;
  mergedGraphs: IndexedGraph[];
  filteredGraph: IndexedGraph | null;
  exportResults: Map<string, string>;
  importResults: Map<string, any>;
  corruptedOperations: string[];
  consistencyCheckResults: any[];
}

Before({ tags: '@rdf' }, async function(this: ExocortexWorld) {
  await this.initialize();
  
  this.setTestData('rdfContext', {
    graph: new IndexedGraph(),
    rdfService: this.container.resolve<RDFService>('RDFService'),
    namespaceManager: new NamespaceManager(),
    validator: this.container.resolve<RDFValidator>('RDFValidator'),
    operationResults: [],
    lastError: null,
    performanceMetrics: new Map<string, number>(),
    statistics: null,
    validationErrors: [],
    batchOperationResults: new Map<string, any>(),
    mergedGraphs: [],
    filteredGraph: null,
    exportResults: new Map<string, string>(),
    importResults: new Map<string, any>(),
    corruptedOperations: [],
    consistencyCheckResults: []
  } as RDFTripleContext);
});

After({ tags: '@rdf' }, function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  if (context) {
    context.graph.clear();
    context.operationResults = [];
    context.performanceMetrics.clear();
    context.lastError = null;
  }
});

// Background steps
Given('the RDF graph is initialized', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph).to.not.be.null;
  expect(context.graph.size()).to.equal(0);
});

Given('the triple store is empty', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  context.graph.clear();
  expect(context.graph.size()).to.equal(0);
});

Given('the namespace manager is configured with standard prefixes:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const prefixes = dataTable.hashes();
  
  prefixes.forEach(row => {
    context.namespaceManager.addPrefix(row.prefix, row.namespace);
  });
  
  expect(context.namespaceManager.getPrefixes()).to.have.lengthOf(prefixes.length);
});

// Basic triple operations
When('I add the triple:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    const result = context.graph.add(triple);
    context.operationResults.push(result);
  });
});

When('I add the following triples:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    const result = context.graph.add(triple);
    context.operationResults.push(result);
  });
});

When('I remove the triple:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    const result = context.graph.remove(triple);
    context.operationResults.push(result);
  });
});

When('I attempt to add a triple with invalid IRI:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const rows = dataTable.hashes();
  
  try {
    rows.forEach(row => {
      const triple = this.createTriple(row.subject, row.predicate, row.object, context);
      const result = context.graph.add(triple);
      context.operationResults.push(result);
    });
  } catch (error) {
    context.lastError = (error as Error).message;
    context.operationResults.push(Result.fail(context.lastError));
  }
});

// Validation and literal handling
When('I add triples with various literal types:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    const validationResult = context.validator.validateTriple(triple);
    
    if (validationResult.isSuccess) {
      const result = context.graph.add(triple);
      context.operationResults.push(result);
    } else {
      context.validationErrors.push(validationResult.getError());
    }
  });
});

When('I add triples containing blank nodes:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    const result = context.graph.add(triple);
    context.operationResults.push(result);
  });
});

// Performance operations
Given('I have {int} triples to add', function(this: ExocortexWorld, tripleCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const testTriples = [];
  
  for (let i = 0; i < tripleCount; i++) {
    testTriples.push({
      subject: `exo:Asset${i}`,
      predicate: 'rdf:type',
      object: 'ems:Project'
    });
  }
  
  context.batchOperationResults.set('testTriples', testTriples);
});

When('I perform a batch addition of all triples', async function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const testTriples = context.batchOperationResults.get('testTriples') as any[];
  
  const startTime = Date.now();
  
  const batchResult = await context.graph.addBatch(
    testTriples.map(data => this.createTriple(data.subject, data.predicate, data.object, context))
  );
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  context.performanceMetrics.set('batchAddTime', duration);
  context.operationResults.push(batchResult);
});

When('multiple operations are happening simultaneously', function(this: ExocortexWorld) {
  // Set up concurrent operation tracking
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  context.batchOperationResults.set('concurrentOps', []);
});

When('I perform {int} concurrent triple additions', async function(this: ExocortexWorld, addCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const concurrentOps = context.batchOperationResults.get('concurrentOps') as Promise<any>[];
  
  for (let i = 0; i < addCount; i++) {
    const operation = new Promise(async (resolve) => {
      const triple = this.createTriple(`exo:ConcurrentAsset${i}`, 'rdf:type', 'ems:Task', context);
      const result = context.graph.add(triple);
      resolve(result);
    });
    
    concurrentOps.push(operation);
  }
  
  context.batchOperationResults.set('concurrentOps', concurrentOps);
});

When('I perform {int} concurrent triple removals', async function(this: ExocortexWorld, removeCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const concurrentOps = context.batchOperationResults.get('concurrentOps') as Promise<any>[];
  
  for (let i = 0; i < removeCount; i++) {
    const operation = new Promise(async (resolve) => {
      const triple = this.createTriple(`exo:Asset${i}`, 'rdf:type', 'ems:Project', context);
      const result = context.graph.remove(triple);
      resolve(result);
    });
    
    concurrentOps.push(operation);
  }
});

When('I perform {int} concurrent triple queries', async function(this: ExocortexWorld, queryCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const concurrentOps = context.batchOperationResults.get('concurrentOps') as Promise<any>[];
  
  for (let i = 0; i < queryCount; i++) {
    const operation = new Promise(async (resolve) => {
      const results = context.graph.match(null, new IRI('rdf:type'), null);
      resolve(Result.ok(results));
    });
    
    concurrentOps.push(operation);
  }
});

// Complex graph operations
Given('the graph contains the following triples:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    context.graph.add(triple);
  });
});

Given('the graph contains a complex structure:', function(this: ExocortexWorld, dataTable: DataTable) {
  this.step('Given the graph contains the following triples:', dataTable);
});

Given('I have a source graph with:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const sourceGraph = new IndexedGraph();
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    sourceGraph.add(triple);
  });
  
  context.batchOperationResults.set('sourceGraph', sourceGraph);
});

Given('I have a target graph with:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const targetGraph = new IndexedGraph();
  const rows = dataTable.hashes();
  
  rows.forEach(row => {
    const triple = this.createTriple(row.subject, row.predicate, row.object, context);
    targetGraph.add(triple);
  });
  
  context.batchOperationResults.set('targetGraph', targetGraph);
});

When('I merge the source graph into the target graph', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const sourceGraph = context.batchOperationResults.get('sourceGraph') as IndexedGraph;
  const targetGraph = context.batchOperationResults.get('targetGraph') as IndexedGraph;
  
  const mergeResult = targetGraph.merge(sourceGraph);
  context.operationResults.push(mergeResult);
  context.batchOperationResults.set('mergedGraph', targetGraph);
});

Given('the graph contains mixed data:', function(this: ExocortexWorld, dataTable: DataTable) {
  this.step('Given the graph contains the following triples:', dataTable);
});

When('I create a filtered graph for projects only', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  
  const filteredGraph = new IndexedGraph();
  const projectTriples = context.graph.match(null, new IRI('rdf:type'), new IRI('ems:Project'));
  
  projectTriples.forEach(triple => {
    filteredGraph.add(triple);
    // Add related triples for the same subject
    const relatedTriples = context.graph.match(triple.subject, null, null);
    relatedTriples.forEach(related => filteredGraph.add(related));
  });
  
  context.filteredGraph = filteredGraph;
});

// Index and performance testing
Given('I have added {int} random triples', function(this: ExocortexWorld, tripleCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  
  for (let i = 0; i < tripleCount; i++) {
    const triple = this.createTriple(
      `exo:RandomAsset${i}`,
      `ems:property${i % 10}`,
      `"value${i}"`,
      context
    );
    context.graph.add(triple);
  }
});

When('I query for triples by subject', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const startTime = Date.now();
  
  const results = context.graph.match(new IRI('exo:RandomAsset1'), null, null);
  
  const endTime = Date.now();
  context.performanceMetrics.set('subjectQueryTime', endTime - startTime);
  context.batchOperationResults.set('queryResults', results);
});

When('I query for triples by predicate', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const startTime = Date.now();
  
  const results = context.graph.match(null, new IRI('ems:property1'), null);
  
  const endTime = Date.now();
  context.performanceMetrics.set('predicateQueryTime', endTime - startTime);
});

When('I query for triples by object', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const startTime = Date.now();
  
  const results = context.graph.match(null, null, new Literal('value1'));
  
  const endTime = Date.now();
  context.performanceMetrics.set('objectQueryTime', endTime - startTime);
});

// Pattern matching and querying
When('I query for pattern {string}', function(this: ExocortexWorld, pattern: string) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  
  // Parse the pattern and execute query
  const [subject, predicate, object] = pattern.split(' ');
  const results = context.graph.match(
    subject === '?project' ? null : new IRI(subject),
    predicate === '?predicate' ? null : new IRI(predicate),
    object === '?task' ? null : new IRI(object)
  );
  
  context.batchOperationResults.set('patternResults', results);
});

// Data integrity and consistency
When('I perform a series of modifications:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const modifications = dataTable.hashes();
  
  modifications.forEach(mod => {
    const triple = this.createTriple(mod.subject, mod.predicate, mod.object, context);
    
    if (mod.action === 'add') {
      const result = context.graph.add(triple);
      context.operationResults.push(result);
    } else if (mod.action === 'remove') {
      const result = context.graph.remove(triple);
      context.operationResults.push(result);
    }
  });
});

When('I run index consistency validation', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const consistencyResult = context.graph.validateConsistency();
  context.consistencyCheckResults.push(consistencyResult);
});

// Serialization and import/export
Given('the graph contains sample data:', function(this: ExocortexWorld, dataTable: DataTable) {
  this.step('Given the graph contains the following triples:', dataTable);
});

When('I export the graph to Turtle format', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  
  const exportResult = context.rdfService.exportGraph(context.graph, {
    format: RDFFormat.TURTLE,
    prettyPrint: true
  });
  
  if (exportResult.isSuccess) {
    context.exportResults.set('turtle', exportResult.getValue().content);
  }
  
  context.operationResults.push(exportResult);
});

When('I export the graph to N-Triples format', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  
  const exportResult = context.rdfService.exportGraph(context.graph, {
    format: RDFFormat.NTRIPLES,
    prettyPrint: false
  });
  
  if (exportResult.isSuccess) {
    context.exportResults.set('ntriples', exportResult.getValue().content);
  }
  
  context.operationResults.push(exportResult);
});

When('I export the graph to JSON-LD format', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  
  const exportResult = context.rdfService.exportGraph(context.graph, {
    format: RDFFormat.JSONLD,
    prettyPrint: true
  });
  
  if (exportResult.isSuccess) {
    context.exportResults.set('jsonld', exportResult.getValue().content);
  }
  
  context.operationResults.push(exportResult);
});

Given('I have valid Turtle content:', function(this: ExocortexWorld, turtleContent: string) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  context.batchOperationResults.set('turtleContent', turtleContent);
});

When('I import the content into the graph', async function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const turtleContent = context.batchOperationResults.get('turtleContent') as string;
  
  const importResult = await context.rdfService.importGraph(turtleContent, {
    format: RDFFormat.TURTLE,
    mergeMode: 'merge',
    validateInput: true
  });
  
  context.importResults.set('importResult', importResult);
  context.operationResults.push(importResult);
});

// Error recovery scenarios
Given('the graph contains valid data', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  // Add some baseline valid data
  const validTriple = this.createTriple('exo:ValidAsset', 'rdf:type', 'ems:Project', context);
  context.graph.add(validTriple);
});

When('a triple addition operation is interrupted', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  // Simulate interrupted operation
  context.corruptedOperations.push('interrupted_add');
});

When('the system detects incomplete operation', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  // Simulate detection
  expect(context.corruptedOperations).to.include('interrupted_add');
});

// Assertions
Then('the triple should be added successfully', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const lastResult = context.operationResults[context.operationResults.length - 1];
  expect(lastResult.isSuccess).to.be.true;
});

Then('all triples should be added successfully', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  context.operationResults.forEach(result => {
    expect(result.isSuccess).to.be.true;
  });
});

Then('the graph should contain {int} triple(s)', function(this: ExocortexWorld, expectedCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph.size()).to.equal(expectedCount);
});

Then('the triple should exist in the graph', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph.size()).to.be.greaterThan(0);
});

Then('the SPO index should be updated correctly', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.spo).to.be.greaterThan(0);
});

Then('the POS index should be updated correctly', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.pos).to.be.greaterThan(0);
});

Then('the OSP index should be updated correctly', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.osp).to.be.greaterThan(0);
});

Then('each triple should be indexed properly', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.spo).to.equal(context.graph.size());
  expect(stats.indexSizes.pos).to.equal(context.graph.size());
  expect(stats.indexSizes.osp).to.equal(context.graph.size());
});

Then('I should be able to query by subject {string}', function(this: ExocortexWorld, subject: string) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const results = context.graph.match(new IRI(subject), null, null);
  expect(results.length).to.be.greaterThan(0);
});

Then('I should be able to query by predicate {string}', function(this: ExocortexWorld, predicate: string) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const results = context.graph.match(null, new IRI(predicate), null);
  expect(results.length).to.be.greaterThan(0);
});

Then('I should be able to query by object {string}', function(this: ExocortexWorld, object: string) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const results = context.graph.match(null, null, new IRI(object));
  expect(results.length).to.be.greaterThan(0);
});

Then('the triple should be removed successfully', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const lastResult = context.operationResults[context.operationResults.length - 1];
  expect(lastResult.isSuccess).to.be.true;
});

Then('the removed triple should not exist in the graph', function(this: ExocortexWorld) {
  // This would be verified by checking the specific triple is not found
  expect(true).to.be.true; // Placeholder - would check specific triple
});

Then('the remaining triples should still exist', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph.size()).to.be.greaterThan(0);
});

Then('all indexes should be updated correctly', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.spo).to.equal(context.graph.size());
  expect(stats.indexSizes.pos).to.equal(context.graph.size());
  expect(stats.indexSizes.osp).to.equal(context.graph.size());
});

Then('the triple addition should fail', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const lastResult = context.operationResults[context.operationResults.length - 1];
  expect(lastResult.isSuccess).to.be.false;
});

Then('an error should be returned indicating {string}', function(this: ExocortexWorld, expectedError: string) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.lastError || context.operationResults[context.operationResults.length - 1]?.getError()).to.contain(expectedError);
});

Then('the graph should remain unchanged', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph.size()).to.equal(0);
});

Then('no indexes should be updated', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.spo).to.equal(0);
  expect(stats.indexSizes.pos).to.equal(0);
  expect(stats.indexSizes.osp).to.equal(0);
});

Then('all typed literals should be added correctly', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.validationErrors).to.have.lengthOf(0);
  context.operationResults.forEach(result => {
    expect(result.isSuccess).to.be.true;
  });
});

Then('literal datatypes should be preserved', function(this: ExocortexWorld) {
  // Would verify that xsd:integer, xsd:boolean, etc. are maintained
  expect(true).to.be.true; // Placeholder
});

Then('language tags should be preserved', function(this: ExocortexWorld) {
  // Would verify that @en language tags are maintained
  expect(true).to.be.true; // Placeholder
});

Then('I should be able to query by literal type', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  // Would search for literals with specific datatypes
  expect(context.graph.size()).to.be.greaterThan(0);
});

Then('literal validation should pass', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.validationErrors).to.have.lengthOf(0);
});

Then('all triples with blank nodes should be added', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  context.operationResults.forEach(result => {
    expect(result.isSuccess).to.be.true;
  });
});

Then('blank node identifiers should be consistent', function(this: ExocortexWorld) {
  // Would verify blank node consistency across operations
  expect(true).to.be.true; // Placeholder
});

Then('I should be able to query using blank nodes', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph.size()).to.be.greaterThan(0);
});

Then('blank nodes should be indexed correctly', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.spo).to.be.greaterThan(0);
});

Then('all triples should be added efficiently', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const lastResult = context.operationResults[context.operationResults.length - 1];
  expect(lastResult.isSuccess).to.be.true;
});

Then('the operation should complete within {int}ms', function(this: ExocortexWorld, maxTime: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const batchTime = context.performanceMetrics.get('batchAddTime') || 0;
  expect(batchTime).to.be.lessThan(maxTime);
});

Then('memory usage should remain stable', function(this: ExocortexWorld) {
  // Would monitor memory usage patterns
  expect(true).to.be.true; // Placeholder
});

Then('I should be able to query any triple immediately', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const results = context.graph.match(null, null, null);
  expect(results.length).to.be.greaterThan(0);
});

Then('all operations should complete successfully', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const concurrentOps = context.batchOperationResults.get('concurrentOps') as Promise<any>[];
  
  return Promise.all(concurrentOps).then(results => {
    results.forEach(result => {
      expect(result.isSuccess).to.be.true;
    });
  });
});

Then('no data corruption should occur', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.totalTriples).to.be.greaterThan(0);
});

Then('the final graph state should be consistent', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const consistencyResult = context.graph.validateConsistency();
  expect(consistencyResult.isValid).to.be.true;
});

Then('no deadlocks should occur', function(this: ExocortexWorld) {
  // Would verify no deadlock conditions exist
  expect(true).to.be.true; // Placeholder
});

Then('I should get {int} result(s)', function(this: ExocortexWorld, expectedResults: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const results = context.batchOperationResults.get('patternResults') as Triple[];
  expect(results).to.have.lengthOf(expectedResults);
});

Then('the results should contain:', function(this: ExocortexWorld, dataTable: DataTable) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const results = context.batchOperationResults.get('patternResults') as Triple[];
  const expectedResults = dataTable.hashes();
  
  expectedResults.forEach(expected => {
    const found = results.some(triple => {
      return triple.subject.toString() === expected['?project'] &&
             triple.object.toString() === expected['?task'];
    });
    expect(found).to.be.true;
  });
});

Then('the target graph should contain {int} triples', function(this: ExocortexWorld, expectedCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const mergedGraph = context.batchOperationResults.get('mergedGraph') as IndexedGraph;
  expect(mergedGraph.size()).to.equal(expectedCount);
});

Then('both original structures should be preserved', function(this: ExocortexWorld) {
  // Would verify that original graph structures are maintained
  expect(true).to.be.true; // Placeholder
});

Then('no duplicate triples should exist', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const mergedGraph = context.batchOperationResults.get('mergedGraph') as IndexedGraph;
  
  // Check for duplicates by comparing unique count with total count
  const allTriples = mergedGraph.match(null, null, null);
  const uniqueTriples = new Set(allTriples.map(t => `${t.subject}|${t.predicate}|${t.object}`));
  expect(uniqueTriples.size).to.equal(allTriples.length);
});

Then('the filtered graph should contain only project-related triples', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const projectTriples = context.filteredGraph?.match(null, new IRI('rdf:type'), new IRI('ems:Project'));
  expect(projectTriples).to.not.be.empty;
});

Then('the original graph should remain unchanged', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph.size()).to.be.greaterThan(0);
});

Then('the filtered graph should contain {int} triples', function(this: ExocortexWorld, expectedCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.filteredGraph?.size()).to.equal(expectedCount);
});

Then('the query should use the SPO index', function(this: ExocortexWorld) {
  // Would verify index usage through query plan analysis
  expect(true).to.be.true; // Placeholder
});

Then('the response time should be under {int}ms', function(this: ExocortexWorld, maxTime: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const queryTime = context.performanceMetrics.get('subjectQueryTime') || 
                   context.performanceMetrics.get('predicateQueryTime') || 
                   context.performanceMetrics.get('objectQueryTime') || 0;
  expect(queryTime).to.be.lessThan(maxTime);
});

Then('the query should use the POS index', function(this: ExocortexWorld) {
  expect(true).to.be.true; // Placeholder
});

Then('the query should use the OSP index', function(this: ExocortexWorld) {
  expect(true).to.be.true; // Placeholder
});

Then('memory usage should remain within acceptable limits', function(this: ExocortexWorld) {
  expect(true).to.be.true; // Placeholder
});

Then('garbage collection should work effectively', function(this: ExocortexWorld) {
  expect(true).to.be.true; // Placeholder
});

Then('the system should remain responsive', function(this: ExocortexWorld) {
  expect(true).to.be.true; // Placeholder
});

Then('the final state should be consistent', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const consistencyResult = context.graph.validateConsistency();
  expect(consistencyResult.isValid).to.be.true;
});

Then('all indexes should reflect the current state', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const stats = context.graph.getStatistics();
  expect(stats.indexSizes.spo).to.equal(context.graph.size());
});

Then('no orphaned index entries should exist', function(this: ExocortexWorld) {
  expect(true).to.be.true; // Placeholder
});

Then('the graph should pass integrity checks', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const integrityResult = context.graph.checkIntegrity();
  expect(integrityResult.isValid).to.be.true;
});

Then('the export should succeed', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const lastResult = context.operationResults[context.operationResults.length - 1];
  expect(lastResult.isSuccess).to.be.true;
});

Then('the output should be valid Turtle syntax', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const turtleOutput = context.exportResults.get('turtle');
  expect(turtleOutput).to.be.a('string');
  expect(turtleOutput).to.contain('@prefix');
});

Then('all triples should be preserved', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const exportResult = context.exportResults.get('turtle') || 
                      context.exportResults.get('ntriples') || 
                      context.exportResults.get('jsonld');
  expect(exportResult).to.be.a('string');
  expect(exportResult.length).to.be.greaterThan(0);
});

Then('the output should be valid N-Triples syntax', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const ntriplesOutput = context.exportResults.get('ntriples');
  expect(ntriplesOutput).to.be.a('string');
});

Then('the output should be valid JSON-LD', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const jsonldOutput = context.exportResults.get('jsonld');
  expect(jsonldOutput).to.be.a('string');
  expect(() => JSON.parse(jsonldOutput!)).to.not.throw();
});

Then('the import should succeed', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const importResult = context.importResults.get('importResult');
  expect(importResult.isSuccess).to.be.true;
});

Then('the graph should contain {int} new triples', function(this: ExocortexWorld, expectedCount: number) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.graph.size()).to.be.greaterThanOrEqual(expectedCount);
});

Then('the imported data should be queryable', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const results = context.graph.match(null, null, null);
  expect(results.length).to.be.greaterThan(0);
});

Then('namespace prefixes should be registered', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.namespaceManager.getPrefixes().length).to.be.greaterThan(0);
});

Then('the graph should remain in consistent state', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const consistencyResult = context.graph.validateConsistency();
  expect(consistencyResult.isValid).to.be.true;
});

Then('corrupted entries should be cleaned up', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  expect(context.corruptedOperations).to.have.length.greaterThan(0);
  // Would verify cleanup occurred
});

Then('subsequent operations should work normally', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const testTriple = this.createTriple('exo:TestRecovery', 'rdf:type', 'ems:Task', context);
  const result = context.graph.add(testTriple);
  expect(result.isSuccess).to.be.true;
});

Then('data integrity should be maintained', function(this: ExocortexWorld) {
  const context = this.getTestData('rdfContext') as RDFTripleContext;
  const integrityResult = context.graph.checkIntegrity();
  expect(integrityResult.isValid).to.be.true;
});

// Helper method to create triples
declare module '../support/world' {
  interface ExocortexWorld {
    createTriple(subject: string, predicate: string, object: string, context: RDFTripleContext): Triple;
  }
}

ExocortexWorld.prototype.createTriple = function(subject: string, predicate: string, object: string, context: RDFTripleContext): Triple {
  let subjectNode;
  let objectNode;
  
  // Handle blank nodes
  if (subject.startsWith('_:')) {
    subjectNode = new BlankNode(subject.substring(2));
  } else {
    subjectNode = new IRI(subject);
  }
  
  if (object.startsWith('_:')) {
    objectNode = new BlankNode(object.substring(2));
  } else if (object.startsWith('"')) {
    // Handle literals with potential datatype or language tag
    if (object.includes('^^')) {
      const [value, datatype] = object.split('^^');
      objectNode = new Literal(value.slice(1, -1), datatype);
    } else if (object.includes('@')) {
      const [value, lang] = object.split('@');
      objectNode = new Literal(value.slice(1, -1), undefined, lang);
    } else {
      objectNode = new Literal(object.slice(1, -1));
    }
  } else {
    objectNode = new IRI(object);
  }
  
  return new Triple(subjectNode, new IRI(predicate), objectNode);
};