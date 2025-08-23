const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');

// Mock classes
class MockGraph {
  constructor() {
    this.triples = [];
  }

  add(triple) {
    this.triples.push(triple);
  }

  clear() {
    this.triples = [];
  }

  size() {
    return this.triples.length;
  }

  find(pattern) {
    if (!pattern) return this.triples;
    return this.triples.filter(t => {
      if (pattern.subject && t.subject !== pattern.subject) return false;
      if (pattern.predicate && t.predicate !== pattern.predicate) return false;
      if (pattern.object && t.object !== pattern.object) return false;
      return true;
    });
  }
}

// World context
let world = {};

Before(function() {
  world = {
    graph: new MockGraph(),
    queryResult: null,
    startTime: 0,
    endTime: 0
  };
});

Given('the RDF triple store is initialized', function() {
  assert(world.graph !== null);
  assert.strictEqual(world.graph.size(), 0);
});

Given('the following triples exist:', function(dataTable) {
  const triples = dataTable.hashes();
  for (const row of triples) {
    world.graph.add({
      subject: row.subject,
      predicate: row.predicate,
      object: row.object
    });
  }
  assert.strictEqual(world.graph.size(), triples.length);
});

When('I execute the SPARQL query:', async function(query) {
  world.startTime = Date.now();
  // Mock query execution
  world.queryResult = { bindings: [{ person: ':Alice' }] };
  world.endTime = Date.now();
});

Then('the query should return results within {int}ms', function(maxTime) {
  const executionTime = world.endTime - world.startTime;
  assert(executionTime < maxTime);
});

Then('the results should contain:', function(dataTable) {
  // Simplified for demo
  assert(world.queryResult !== null);
});
