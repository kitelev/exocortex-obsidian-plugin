import { Given, When, Then, DataTable, Before, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { IndexedGraph } from '../../src/domain/semantic/core/IndexedGraph';
import { Triple } from '../../src/domain/semantic/core/Triple';
import { SPARQLEngine } from '../../src/application/SPARQLEngine';
import { QueryCache } from '../../src/application/services/QueryCache';
import { Result } from '../../src/domain/core/Result';

// World context to share state between steps
interface TestWorld {
  graph: IndexedGraph;
  sparqlEngine: SPARQLEngine;
  queryCache: QueryCache;
  queryResult: any;
  startTime: number;
  endTime: number;
  lastQuery: string;
}

let world: TestWorld;

Before(function() {
  world = {
    graph: new IndexedGraph(),
    sparqlEngine: null as any,
    queryCache: new QueryCache(),
    queryResult: null,
    startTime: 0,
    endTime: 0,
    lastQuery: ''
  };
  
  // Initialize SPARQL engine with the graph
  world.sparqlEngine = new SPARQLEngine(world.graph, world.queryCache);
});

After(function() {
  // Cleanup
  world.graph.clear();
  world.queryCache.clear();
});

Given('the RDF triple store is initialized', function() {
  expect(world.graph).to.not.be.null;
  expect(world.graph.size()).to.equal(0);
});

Given('the following triples exist:', function(dataTable: DataTable) {
  const triples = dataTable.hashes();
  
  for (const row of triples) {
    const triple = Triple.create({
      subject: row.subject,
      predicate: row.predicate,
      object: row.object
    });
    
    if (triple.isSuccess) {
      world.graph.add(triple.getValue()!);
    }
  }
  
  expect(world.graph.size()).to.equal(triples.length);
});

When('I execute the SPARQL query:', async function(query: string) {
  world.lastQuery = query;
  world.startTime = Date.now();
  
  const result = await world.sparqlEngine.executeQuery(query);
  
  world.endTime = Date.now();
  
  if (result.isSuccess) {
    world.queryResult = result.getValue();
  } else {
    throw new Error(`Query failed: ${result.getError()}`);
  }
});

Then('the query should return results within {int}ms', function(maxTime: number) {
  const executionTime = world.endTime - world.startTime;
  expect(executionTime).to.be.lessThan(maxTime);
});

Then('the results should contain:', function(dataTable: DataTable) {
  const expectedResults = dataTable.hashes();
  const actualResults = world.queryResult.bindings || [];
  
  expect(actualResults).to.have.lengthOf(expectedResults.length);
  
  for (const expected of expectedResults) {
    const found = actualResults.some((actual: any) => {
      return Object.keys(expected).every(key => {
        return actual[key] === expected[key];
      });
    });
    
    expect(found).to.be.true;
  }
});

Then('the query should return triples:', function(dataTable: DataTable) {
  const expectedTriples = dataTable.hashes();
  const actualTriples = world.queryResult.triples || [];
  
  expect(actualTriples).to.have.lengthOf(expectedTriples.length);
  
  for (const expected of expectedTriples) {
    const found = actualTriples.some((actual: Triple) => {
      return actual.subject === expected.subject &&
             actual.predicate === expected.predicate &&
             actual.object === expected.object;
    });
    
    expect(found).to.be.true;
  }
});

Then('the query should return {word}', function(expectedValue: string) {
  const boolValue = expectedValue === 'true';
  expect(world.queryResult.boolean).to.equal(boolValue);
});

Given('I execute a complex SPARQL query', async function() {
  const complexQuery = `
    SELECT ?s ?p ?o WHERE {
      ?s ?p ?o .
      OPTIONAL { ?s :name ?name }
      FILTER(?o != :Private)
    }
    ORDER BY ?s
    LIMIT 100
  `;
  
  world.lastQuery = complexQuery;
  const result = await world.sparqlEngine.executeQuery(complexQuery);
  
  if (result.isSuccess) {
    world.queryResult = result.getValue();
  }
});

When('I execute the same query again', async function() {
  world.startTime = Date.now();
  
  const result = await world.sparqlEngine.executeQuery(world.lastQuery);
  
  world.endTime = Date.now();
  
  if (result.isSuccess) {
    world.queryResult = result.getValue();
  }
});

Then('the second query should use cached results', function() {
  const executionTime = world.endTime - world.startTime;
  // Cached queries should be very fast, under 10ms
  expect(executionTime).to.be.lessThan(10);
});

Then('the cache hit rate should be above {int}%', function(expectedRate: number) {
  const stats = world.queryCache.getStats();
  const hitRate = (stats.hits / (stats.hits + stats.misses)) * 100;
  
  expect(hitRate).to.be.greaterThan(expectedRate);
});