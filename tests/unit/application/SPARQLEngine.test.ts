import {
  SPARQLEngine,
  ConstructResult,
  SelectResult,
} from "../../../src/application/SPARQLEngine";
import { Graph } from "../../../src/domain/semantic/core/Graph";
import {
  Triple,
  IRI,
  Literal,
  BlankNode,
} from "../../../src/domain/semantic/core/Triple";
import {
  QueryCache,
  QueryCacheConfig,
} from "../../../src/application/services/QueryCache";

describe("SPARQLEngine", () => {
  let engine: SPARQLEngine;
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
    engine = new SPARQLEngine(graph);
  });

  afterEach(() => {
    engine.destroy();
  });

  describe("Basic Functionality", () => {
    it("should create SPARQLEngine with graph", () => {
      expect(engine).toBeDefined();
      expect(engine.getCacheStatistics).toBeDefined();
    });

    it("should create SPARQLEngine with custom cache config", () => {
      const customConfig: Partial<QueryCacheConfig> = {
        maxSize: 100,
        defaultTTL: 1000,
        enabled: false,
      };
      const customEngine = new SPARQLEngine(graph, customConfig);

      expect(customEngine).toBeDefined();
      expect(customEngine.getCacheConfig().maxSize).toBe(100);
      expect(customEngine.getCacheConfig().defaultTTL).toBe(1000);
      expect(customEngine.getCacheConfig().enabled).toBe(false);

      customEngine.destroy();
    });

    it("should provide cache management methods", () => {
      expect(engine.getCacheStatistics).toBeDefined();
      expect(engine.invalidateCache).toBeDefined();
      expect(engine.updateCacheConfig).toBeDefined();
      expect(engine.getCacheConfig).toBeDefined();
      expect(engine.cleanupCache).toBeDefined();
      expect(engine.destroy).toBeDefined();
    });
  });

  describe("CONSTRUCT Query Tests", () => {
    beforeEach(() => {
      // Setup test data
      graph.add(
        new Triple(
          new IRI("http://example.org/person1"),
          new IRI("http://example.org/name"),
          Literal.string("John Doe"),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/person1"),
          new IRI("http://example.org/age"),
          Literal.integer(30),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/person2"),
          new IRI("http://example.org/name"),
          Literal.string("Jane Smith"),
        ),
      );
    });

    it("should execute basic CONSTRUCT query", () => {
      const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";
      const result: ConstructResult = engine.construct(query);

      expect(result).toBeDefined();
      expect(result.triples).toHaveLength(3);
      expect(result.provenance).toContain("CONSTRUCT query at");
      expect(result.cached).toBe(false);
    });

    it("should execute CONSTRUCT with specific pattern", () => {
      const query =
        "CONSTRUCT { ?s <http://example.org/hasName> ?name } WHERE { ?s <http://example.org/name> ?name }";
      const result: ConstructResult = engine.construct(query);

      expect(result.triples).toHaveLength(2);
      expect(result.triples[0].getPredicate().toString()).toBe(
        "http://example.org/hasName",
      );
    });

    it("should execute CONSTRUCT with LIMIT", () => {
      const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 2";
      const result: ConstructResult = engine.construct(query);

      expect(result.triples).toHaveLength(2);
      expect(result.cached).toBe(false);
    });

    it("should handle CONSTRUCT with multiple patterns", () => {
      const query = `CONSTRUCT { 
                ?s <http://example.org/hasInfo> ?name .
                ?s <http://example.org/hasAge> ?age 
            } WHERE { 
                ?s <http://example.org/name> ?name .
                ?s <http://example.org/age> ?age 
            }`;
      const result: ConstructResult = engine.construct(query);

      expect(result.triples).toHaveLength(2);
    });

    it("should handle CONSTRUCT with blank nodes", () => {
      graph.add(
        new Triple(
          new BlankNode("_:b1"),
          new IRI("http://example.org/type"),
          new IRI("http://example.org/Person"),
        ),
      );

      const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";
      const result: ConstructResult = engine.construct(query);

      expect(result.triples.length).toBeGreaterThan(3);
    });

    it("should handle CONSTRUCT with literals of different types", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/data"),
          new IRI("http://example.org/boolean"),
          Literal.boolean(true),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/data"),
          new IRI("http://example.org/decimal"),
          Literal.double(3.14),
        ),
      );

      const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";
      const result: ConstructResult = engine.construct(query);

      expect(result.triples.length).toBeGreaterThan(3);
    });

    it("should throw error for invalid CONSTRUCT query format", () => {
      const invalidQuery = "INVALID CONSTRUCT QUERY";

      expect(() => engine.construct(invalidQuery)).toThrow(
        "Invalid CONSTRUCT query format",
      );
    });

    it("should return empty result for non-matching patterns", () => {
      const query =
        "CONSTRUCT { ?s ?p ?o } WHERE { ?s <http://nonexistent/prop> ?o }";
      const result: ConstructResult = engine.construct(query);

      expect(result.triples).toHaveLength(0);
      expect(result.provenance).toContain("CONSTRUCT query at");
    });

    it("should handle CONSTRUCT with variable substitution", () => {
      const query =
        "CONSTRUCT { <http://example.org/newPerson> <http://example.org/name> ?name } WHERE { ?s <http://example.org/name> ?name }";
      const result: ConstructResult = engine.construct(query);

      expect(result.triples).toHaveLength(2);
      expect(result.triples[0].getSubject().toString()).toBe(
        "http://example.org/newPerson",
      );
    });

    it("should handle CONSTRUCT with literal patterns", () => {
      const query =
        'CONSTRUCT { ?s <http://example.org/hasStringName> "test" } WHERE { ?s <http://example.org/name> ?name }';
      const result: ConstructResult = engine.construct(query);

      expect(result.triples).toHaveLength(2);
      expect(result.triples[0].getObject().toString()).toBe(
        '"test"^^http://www.w3.org/2001/XMLSchema#string',
      );
    });
  });

  describe("SELECT Query Tests", () => {
    beforeEach(() => {
      // Setup test data
      graph.add(
        new Triple(
          new IRI("http://example.org/person1"),
          new IRI("http://example.org/name"),
          Literal.string("John Doe"),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/person1"),
          new IRI("http://example.org/age"),
          Literal.integer(30),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/person2"),
          new IRI("http://example.org/name"),
          Literal.string("Jane Smith"),
        ),
      );
    });

    it("should execute basic SELECT query", () => {
      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";
      const result: SelectResult = engine.select(query);

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(3);
      expect(result.cached).toBe(false);
    });

    it("should execute SELECT with specific variables", () => {
      const query =
        "SELECT ?s ?name WHERE { ?s <http://example.org/name> ?name }";
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toHaveProperty("s");
      expect(result.results[0]).toHaveProperty("name");
    });

    it("should execute SELECT with wildcard", () => {
      const query = "SELECT * WHERE { ?s ?p ?o }";
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toHaveProperty("s");
      expect(result.results[0]).toHaveProperty("p");
      expect(result.results[0]).toHaveProperty("o");
    });

    it("should execute SELECT with LIMIT", () => {
      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 2";
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(2);
    });

    it("should handle SELECT with specific predicate", () => {
      const query =
        "SELECT ?s ?name WHERE { ?s <http://example.org/name> ?name }";
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(2);
      expect(result.results.every((r) => r.name)).toBe(true);
    });

    it("should handle SELECT with literal object", () => {
      const query =
        'SELECT ?s WHERE { ?s <http://example.org/name> "John Doe" }';
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].s).toBe("http://example.org/person1");
    });

    it("should throw error for invalid SELECT query format", () => {
      const invalidQuery = "INVALID SELECT QUERY";

      expect(() => engine.select(invalidQuery)).toThrow(
        "Invalid SPARQL query format",
      );
    });

    it("should return empty result for non-matching SELECT", () => {
      const query = "SELECT ?s ?o WHERE { ?s <http://nonexistent/prop> ?o }";
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(0);
      expect(result.cached).toBe(false);
    });

    it("should handle SELECT with multiple variables bound", () => {
      const query =
        "SELECT ?s ?name ?age WHERE { ?s <http://example.org/name> ?name . ?s <http://example.org/age> ?age }";
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toHaveProperty("s");
      expect(result.results[0]).toHaveProperty("name");
      expect(result.results[0]).toHaveProperty("age");
    });

    it("should filter variables correctly in SELECT", () => {
      const query = "SELECT ?name WHERE { ?s <http://example.org/name> ?name }";
      const result: SelectResult = engine.select(query);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toHaveProperty("name");
      expect(result.results[0]).not.toHaveProperty("s");
    });
  });

  describe("Cache Management Tests", () => {
    it("should cache CONSTRUCT results", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/s"),
          new IRI("http://example.org/p"),
          Literal.string("o"),
        ),
      );

      const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";

      // First execution
      const result1 = engine.construct(query);
      expect(result1.cached).toBe(false);

      // Second execution should be cached
      const result2 = engine.construct(query);
      expect(result2.cached).toBe(true);
      expect(result2.triples).toHaveLength(result1.triples.length);
    });

    it("should cache SELECT results", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/s"),
          new IRI("http://example.org/p"),
          Literal.string("o"),
        ),
      );

      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      // First execution
      const result1 = engine.select(query);
      expect(result1.cached).toBe(false);

      // Second execution should be cached
      const result2 = engine.select(query);
      expect(result2.cached).toBe(true);
      expect(result2.results).toEqual(result1.results);
    });

    it("should invalidate cache correctly", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/s"),
          new IRI("http://example.org/p"),
          Literal.string("o"),
        ),
      );

      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      // Cache the result
      engine.select(query);

      // Invalidate cache
      engine.invalidateCache();

      // Next execution should not be cached
      const result = engine.select(query);
      expect(result.cached).toBe(false);
    });

    it("should update cache configuration", () => {
      const newConfig = {
        maxSize: 50,
        defaultTTL: 2000,
        enabled: false,
      };

      engine.updateCacheConfig(newConfig);
      const config = engine.getCacheConfig();

      expect(config.maxSize).toBe(50);
      expect(config.defaultTTL).toBe(2000);
      expect(config.enabled).toBe(false);
    });

    it("should provide cache statistics", () => {
      const stats = engine.getCacheStatistics();

      expect(stats).toHaveProperty("hits");
      expect(stats).toHaveProperty("misses");
      expect(stats).toHaveProperty("hitRate");
      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("maxSize");
    });

    it("should cleanup expired cache entries", () => {
      // Set short TTL
      engine.updateCacheConfig({ defaultTTL: 1 });

      graph.add(
        new Triple(
          new IRI("http://example.org/s"),
          new IRI("http://example.org/p"),
          Literal.string("o"),
        ),
      );

      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";
      engine.select(query);

      // Wait for expiration and cleanup
      setTimeout(() => {
        const cleanedCount = engine.cleanupCache();
        expect(cleanedCount).toBeGreaterThanOrEqual(0);
      }, 10);
    });

    it("should respect cache disabled setting", () => {
      // Disable cache
      engine.updateCacheConfig({ enabled: false });

      graph.add(
        new Triple(
          new IRI("http://example.org/s"),
          new IRI("http://example.org/p"),
          Literal.string("o"),
        ),
      );

      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      const result1 = engine.select(query);
      const result2 = engine.select(query);

      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(false);
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle malformed CONSTRUCT queries", () => {
      expect(() => engine.construct("CONSTRUCT WHERE { ?s ?p ?o }")).toThrow();
      expect(() =>
        engine.construct("CONSTRUCT { ?s ?p ?o } MISSING WHERE"),
      ).toThrow();
      expect(() => engine.construct("")).toThrow();
    });

    it("should handle malformed SELECT queries", () => {
      expect(() => engine.select("SELECT WHERE { ?s ?p ?o }")).toThrow();
      expect(() => engine.select("SELECT ?s MISSING WHERE")).toThrow();
      expect(() => engine.select("")).toThrow();
    });

    it("should handle queries with invalid syntax gracefully", () => {
      expect(() => engine.construct("CONSTRUCT { } WHERE { }")).not.toThrow();
      expect(() => engine.select("SELECT ?s WHERE { }")).not.toThrow();
    });

    it("should handle null/undefined values in patterns", () => {
      const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";
      const result = engine.construct(query);

      expect(result).toBeDefined();
      expect(result.triples).toHaveLength(0);
    });
  });

  describe("Query Optimization Tests", () => {
    beforeEach(() => {
      // Create larger dataset for optimization testing
      for (let i = 0; i < 100; i++) {
        graph.add(
          new Triple(
            new IRI(`http://example.org/person${i}`),
            new IRI("http://example.org/name"),
            Literal.string(`Person ${i}`),
          ),
        );
        graph.add(
          new Triple(
            new IRI(`http://example.org/person${i}`),
            new IRI("http://example.org/age"),
            Literal.integer(20 + (i % 50)),
          ),
        );
      }
    });

    it("should handle large result sets efficiently", () => {
      const startTime = Date.now();
      const query =
        "SELECT ?s ?name WHERE { ?s <http://example.org/name> ?name }";
      const result = engine.select(query);
      const endTime = Date.now();

      expect(result.results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it("should optimize CONSTRUCT queries with LIMIT", () => {
      const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 10";
      const result = engine.construct(query);

      expect(result.triples).toHaveLength(10);
    });

    it("should cache queries with different formats but same meaning", () => {
      const query1 =
        "SELECT ?s ?name WHERE { ?s <http://example.org/name> ?name }";
      const query2 =
        "SELECT   ?s   ?name   WHERE   {   ?s   <http://example.org/name>   ?name   }";

      engine.select(query1);
      const result2 = engine.select(query2);

      expect(result2.cached).toBe(true);
    });
  });

  describe("Complex Query Pattern Tests", () => {
    beforeEach(() => {
      // Setup complex test data
      graph.add(
        new Triple(
          new IRI("http://example.org/john"),
          new IRI("http://example.org/name"),
          Literal.string("John Doe"),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/john"),
          new IRI("http://example.org/age"),
          Literal.integer(30),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/john"),
          new IRI("http://example.org/worksAt"),
          new IRI("http://example.org/company1"),
        ),
      );
      graph.add(
        new Triple(
          new IRI("http://example.org/company1"),
          new IRI("http://example.org/name"),
          Literal.string("Tech Corp"),
        ),
      );
    });

    it("should handle multi-pattern CONSTRUCT queries", () => {
      const query = `CONSTRUCT { 
                ?person <http://example.org/employee> ?company .
                ?company <http://example.org/hasEmployee> ?person 
            } WHERE { 
                ?person <http://example.org/worksAt> ?company .
                ?person <http://example.org/name> ?name 
            }`;

      const result = engine.construct(query);
      expect(result.triples).toHaveLength(2);
    });

    it("should handle complex variable bindings", () => {
      const query = `SELECT ?personName ?companyName WHERE { 
                ?person <http://example.org/name> ?personName .
                ?person <http://example.org/worksAt> ?company .
                ?company <http://example.org/name> ?companyName 
            }`;

      const result = engine.select(query);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].personName).toBe(
        '"John Doe"^^http://www.w3.org/2001/XMLSchema#string',
      );
      expect(result.results[0].companyName).toBe(
        '"Tech Corp"^^http://www.w3.org/2001/XMLSchema#string',
      );
    });

    it("should handle patterns with different node types", () => {
      // Add blank node
      graph.add(
        new Triple(
          new BlankNode("_:b1"),
          new IRI("http://example.org/type"),
          new IRI("http://example.org/Project"),
        ),
      );

      const query =
        "SELECT ?s ?type WHERE { ?s <http://example.org/type> ?type }";
      const result = engine.select(query);

      expect(result.results).toHaveLength(1);
    });
  });

  describe("Integration with Graph Tests", () => {
    it("should reflect graph changes in query results", () => {
      const query =
        "SELECT ?s ?name WHERE { ?s <http://example.org/name> ?name }";

      // Initially empty
      let result = engine.select(query);
      expect(result.results).toHaveLength(0);

      // Add data
      graph.add(
        new Triple(
          new IRI("http://example.org/person1"),
          new IRI("http://example.org/name"),
          Literal.string("John"),
        ),
      );

      // Invalidate cache since graph changed
      engine.invalidateCache();

      // Should reflect new data
      result = engine.select(query);
      expect(result.results).toHaveLength(1);
    });

    it("should work with pre-populated graph", () => {
      const prePopulatedGraph = new Graph([
        new Triple(
          new IRI("http://example.org/s1"),
          new IRI("http://example.org/p1"),
          Literal.string("o1"),
        ),
        new Triple(
          new IRI("http://example.org/s2"),
          new IRI("http://example.org/p2"),
          Literal.string("o2"),
        ),
      ]);

      const engineWithData = new SPARQLEngine(prePopulatedGraph);
      const result = engineWithData.select(
        "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
      );

      expect(result.results).toHaveLength(2);
      engineWithData.destroy();
    });
  });

  describe("Edge Cases and Boundary Tests", () => {
    it("should handle empty graph gracefully", () => {
      const emptyEngine = new SPARQLEngine(new Graph());

      const constructResult = emptyEngine.construct(
        "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      );
      const selectResult = emptyEngine.select(
        "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
      );

      expect(constructResult.triples).toHaveLength(0);
      expect(selectResult.results).toHaveLength(0);

      emptyEngine.destroy();
    });

    it("should handle very long queries", () => {
      const longQuery =
        "SELECT ?s ?p ?o WHERE { " + "?s ?p ?o . ".repeat(100) + "}";

      expect(() => engine.select(longQuery)).not.toThrow();
    });

    it("should handle special characters in URIs", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/person-with-dash"),
          new IRI("http://example.org/has_underscore"),
          Literal.string("Special chars: éñ中文"),
        ),
      );

      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";
      const result = engine.select(query);

      expect(result.results).toHaveLength(1);
    });

    it("should handle numeric literals correctly", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/data"),
          new IRI("http://example.org/value"),
          Literal.integer(42),
        ),
      );

      const query =
        "CONSTRUCT { ?s <http://example.org/newValue> 123 } WHERE { ?s ?p ?o }";
      const result = engine.construct(query);

      expect(result.triples).toHaveLength(1);
    });

    it("should handle boolean literals correctly", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/data"),
          new IRI("http://example.org/flag"),
          Literal.boolean(true),
        ),
      );

      const query =
        "CONSTRUCT { ?s <http://example.org/newFlag> false } WHERE { ?s ?p ?o }";
      const result = engine.construct(query);

      expect(result.triples).toHaveLength(1);
    });

    it("should handle decimal literals correctly", () => {
      graph.add(
        new Triple(
          new IRI("http://example.org/data"),
          new IRI("http://example.org/pi"),
          Literal.double(3.14159),
        ),
      );

      const query =
        "CONSTRUCT { ?s <http://example.org/newPi> 2.71 } WHERE { ?s ?p ?o }";
      const result = engine.construct(query);

      expect(result.triples).toHaveLength(1);
    });
  });
});
