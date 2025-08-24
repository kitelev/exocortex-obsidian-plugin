import { loadFeature, defineFeature } from 'jest-cucumber';
import { BDDWorld } from './support/world';
import path from 'path';

const feature = loadFeature(path.join(__dirname, 'features/query-execution.feature'));

defineFeature(feature, test => {
  let world: BDDWorld;

  beforeEach(async () => {
    world = new BDDWorld({} as any);
    await world.initialize('Query Execution Test');
  });

  afterEach(async () => {
    await world.cleanup();
  });

  test('SPARQL query execution with results', ({ given, when, then, and }) => {
    given('a knowledge graph with test data', async () => {
      // Create test triples for query testing
      await world.setupTestGraph([
        { subject: ':project1', predicate: 'rdf:type', object: 'ems:Project' },
        { subject: ':project1', predicate: 'rdfs:label', object: '"Test Project 1"' },
        { subject: ':project1', predicate: 'ems:priority', object: '"high"' },
        { subject: ':project2', predicate: 'rdf:type', object: 'ems:Project' },
        { subject: ':project2', predicate: 'rdfs:label', object: '"Test Project 2"' },
        { subject: ':project2', predicate: 'ems:priority', object: '"medium"' }
      ]);

      expect(world.graph.size()).toBe(6);
    });

    given('the query engine is initialized', () => {
      expect(world.queryEngine).toBeDefined();
    });

    when(/^I execute the SPARQL query:$/, async (query) => {
      const startTime = world.startTiming();
      
      try {
        const result = await world.queryEngine.execute(query.trim());
        const executionTime = world.endTiming(startTime);
        
        world.setState('queryResult', result);
        world.recordPerformance('queryExecutionTime', executionTime);
      } catch (error) {
        world.lastError = error as Error;
        world.setState('queryResult', { error: error.message });
      }
    });

    then(/^I should get (\d+) results?$/, (expectedCount) => {
      const result = world.getState('queryResult');
      expect(result).toBeDefined();
      expect(result.error).toBeUndefined();
      
      if (result.bindings) {
        expect(result.bindings.length).toBe(parseInt(expectedCount));
      } else if (result.results) {
        expect(result.results.length).toBe(parseInt(expectedCount));
      }
    });

    and('each result should have the expected structure', () => {
      const result = world.getState('queryResult');
      const bindings = result.bindings || result.results || [];
      
      bindings.forEach((binding: any) => {
        expect(binding).toHaveProperty('project');
        expect(binding).toHaveProperty('label');
        expect(binding).toHaveProperty('priority');
      });
    });

    and(/^the query should execute within (\d+)ms$/, (maxTime) => {
      const executionTime = world.performanceMetrics.queryExecutionTime;
      expect(executionTime).toBeLessThan(parseInt(maxTime));
    });
  });

  test('Query block rendering in Obsidian', ({ given, when, then, and }) => {
    given(/^I have a note with a query block:$/, async (queryBlock) => {
      const noteContent = `# Test Note\n\nSome content here.\n\n${queryBlock.trim()}\n\nMore content.`;
      
      await world.vaultAdapter.createFile('test-query.md', noteContent);
      world.setState('queryBlock', queryBlock.trim());
    });

    given('the QueryBlockRenderer is active', () => {
      const renderer = world.container.resolve('QueryBlockRenderer');
      expect(renderer).toBeDefined();
      world.setState('queryRenderer', renderer);
    });

    when('the note is opened and rendered', async () => {
      const startTime = world.startTiming();
      const queryBlock = world.getState('queryBlock');
      const renderer = world.getState('queryRenderer');
      
      try {
        // Extract query from block
        const queryMatch = queryBlock.match(/```sparql\n([\s\S]*?)\n```/);
        const query = queryMatch ? queryMatch[1] : '';
        
        const container = world.createMockContainer();
        const result = await renderer.render(container, query, {});
        
        const renderTime = world.endTiming(startTime);
        world.recordPerformance('renderTime', renderTime);
        world.setState('renderResult', result);
        
      } catch (error) {
        world.lastError = error as Error;
      }
    });

    then('the query should be executed successfully', () => {
      const result = world.getState('renderResult');
      expect(result).toBeDefined();
      expect(world.lastError).toBeUndefined();
    });

    and('the results should be displayed in a table format', () => {
      const result = world.getState('renderResult');
      const container = world.getState('mockContainer');
      
      // Verify table structure was created
      expect(container.innerHTML).toContain('<table');
      expect(container.innerHTML).toContain('<thead');
      expect(container.innerHTML).toContain('<tbody');
    });

    and(/^the rendering should complete within (\d+)ms$/, (maxTime) => {
      const renderTime = world.performanceMetrics.renderTime;
      expect(renderTime).toBeLessThan(parseInt(maxTime));
    });
  });

  test('Error handling for invalid queries', ({ given, when, then, and }) => {
    given(/^I have an invalid SPARQL query:$/, (invalidQuery) => {
      world.setState('invalidQuery', invalidQuery.trim());
    });

    when('I attempt to execute the query', async () => {
      const query = world.getState('invalidQuery');
      
      try {
        const result = await world.queryEngine.execute(query);
        world.setState('queryResult', result);
      } catch (error) {
        world.lastError = error as Error;
        world.setState('queryError', error.message);
      }
    });

    then('the query should fail with a syntax error', () => {
      const error = world.getState('queryError');
      expect(error).toBeDefined();
      expect(error).toMatch(/syntax|invalid|parse|error/i);
    });

    and('the error message should be user-friendly', () => {
      const error = world.getState('queryError');
      expect(error).not.toContain('undefined');
      expect(error).not.toContain('null');
      expect(error.length).toBeGreaterThan(5);
    });

    and('the system should remain stable', () => {
      // Verify the query engine is still functional
      expect(world.queryEngine).toBeDefined();
      expect(typeof world.queryEngine.execute).toBe('function');
    });
  });

  test('Query caching and performance optimization', ({ given, when, then, and }) => {
    given(/^I have a complex query that takes time to execute$/, () => {
      const complexQuery = `
        SELECT ?project ?label ?priority ?task ?taskLabel WHERE {
          ?project rdf:type ems:Project .
          ?project rdfs:label ?label .
          ?project ems:priority ?priority .
          ?project ems:hasTask ?task .
          ?task rdfs:label ?taskLabel .
        }
      `;
      world.setState('complexQuery', complexQuery.trim());
    });

    when('I execute the query for the first time', async () => {
      const query = world.getState('complexQuery');
      const startTime = world.startTiming();
      
      const result = await world.queryEngine.execute(query);
      const firstExecutionTime = world.endTiming(startTime);
      
      world.setState('firstResult', result);
      world.recordPerformance('firstExecutionTime', firstExecutionTime);
    });

    and('I execute the same query again', async () => {
      const query = world.getState('complexQuery');
      const startTime = world.startTiming();
      
      const result = await world.queryEngine.execute(query);
      const secondExecutionTime = world.endTiming(startTime);
      
      world.setState('secondResult', result);
      world.recordPerformance('secondExecutionTime', secondExecutionTime);
    });

    then('the second execution should be faster due to caching', () => {
      const firstTime = world.performanceMetrics.firstExecutionTime;
      const secondTime = world.performanceMetrics.secondExecutionTime;
      
      expect(secondTime).toBeLessThan(firstTime);
    });

    and('both results should be identical', () => {
      const firstResult = world.getState('firstResult');
      const secondResult = world.getState('secondResult');
      
      expect(JSON.stringify(firstResult)).toBe(JSON.stringify(secondResult));
    });

    and(/^the cached result should be served within (\d+)ms$/, (maxTime) => {
      const secondTime = world.performanceMetrics.secondExecutionTime;
      expect(secondTime).toBeLessThan(parseInt(maxTime));
    });
  });

  test('Large dataset query performance', ({ given, when, then }) => {
    given(/^I have a large dataset with (\d+) triples$/, async (tripleCount) => {
      const count = parseInt(tripleCount);
      const triples = [];
      
      // Generate test triples
      for (let i = 0; i < count; i++) {
        triples.push({
          subject: `:entity${i}`,
          predicate: 'rdf:type',
          object: 'ems:TestEntity'
        });
        triples.push({
          subject: `:entity${i}`,
          predicate: 'rdfs:label',
          object: `"Test Entity ${i}"`
        });
      }
      
      await world.setupTestGraph(triples);
      world.setState('totalTriples', count * 2);
    });

    when(/^I execute a query that scans the entire dataset$/, async () => {
      const query = `
        SELECT ?entity ?label WHERE {
          ?entity rdf:type ems:TestEntity .
          ?entity rdfs:label ?label .
        }
      `;
      
      const startTime = world.startTiming();
      const result = await world.queryEngine.execute(query);
      const executionTime = world.endTiming(startTime);
      
      world.setState('queryResult', result);
      world.recordPerformance('scanExecutionTime', executionTime);
    });

    then(/^the query should complete within (\d+) seconds?$/, (maxSeconds) => {
      const executionTime = world.performanceMetrics.scanExecutionTime;
      expect(executionTime).toBeLessThan(parseInt(maxSeconds) * 1000);
    });
  });
});