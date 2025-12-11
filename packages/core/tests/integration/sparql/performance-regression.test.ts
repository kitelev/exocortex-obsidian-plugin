/**
 * Performance Regression Tests for SPARQL Engine
 *
 * These tests ensure that the SPARQL query pipeline maintains acceptable
 * performance characteristics as the codebase evolves.
 *
 * @see Issue #750 - Add Integration Tests for SPARQL Engine
 */

import { SPARQLParser } from "../../../src/infrastructure/sparql/SPARQLParser";
import { AlgebraTranslator } from "../../../src/infrastructure/sparql/algebra/AlgebraTranslator";
import { AlgebraOptimizer } from "../../../src/infrastructure/sparql/algebra/AlgebraOptimizer";
import { QueryExecutor } from "../../../src/infrastructure/sparql/executors/QueryExecutor";
import { InMemoryTripleStore } from "../../../src/infrastructure/rdf/InMemoryTripleStore";
import { Triple } from "../../../src/domain/models/rdf/Triple";
import { IRI } from "../../../src/domain/models/rdf/IRI";
import { Literal } from "../../../src/domain/models/rdf/Literal";

describe("SPARQL Performance Regression Tests", () => {
  let parser: SPARQLParser;
  let translator: AlgebraTranslator;
  let optimizer: AlgebraOptimizer;
  let tripleStore: InMemoryTripleStore;
  let executor: QueryExecutor;

  const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
  const EX = "http://example.org/";
  const XSD = "http://www.w3.org/2001/XMLSchema#";

  const rdfIRI = (local: string) => new IRI(`${RDF}${local}`);
  const exIRI = (local: string) => new IRI(`${EX}${local}`);
  const xsdIRI = (local: string) => new IRI(`${XSD}${local}`);

  /**
   * Helper to execute a full query pipeline with timing
   */
  async function executeQueryWithTiming(query: string) {
    const start = performance.now();

    const ast = parser.parse(query);
    const parseTime = performance.now() - start;

    const algebra = translator.translate(ast);
    const translateTime = performance.now() - start - parseTime;

    const optimizedAlgebra = optimizer.optimize(algebra);
    const optimizeTime = performance.now() - start - parseTime - translateTime;

    const results = await executor.executeAll(optimizedAlgebra);
    const executeTime = performance.now() - start - parseTime - translateTime - optimizeTime;

    const totalTime = performance.now() - start;

    return {
      results,
      timing: {
        parseTime,
        translateTime,
        optimizeTime,
        executeTime,
        totalTime,
      },
    };
  }

  /**
   * Generate a large dataset for performance testing
   */
  async function generateLargeDataset(count: number) {
    const triples: Triple[] = [];

    for (let i = 0; i < count; i++) {
      const subject = exIRI(`entity${i}`);

      // Type triple
      triples.push(new Triple(subject, rdfIRI("type"), exIRI("Entity")));

      // Label
      triples.push(
        new Triple(subject, exIRI("label"), new Literal(`Entity ${i}`))
      );

      // Numeric property
      triples.push(
        new Triple(
          subject,
          exIRI("value"),
          new Literal(String(i % 100), xsdIRI("integer"))
        )
      );

      // Category (10 categories)
      triples.push(
        new Triple(subject, exIRI("category"), exIRI(`category${i % 10}`))
      );

      // Parent relationship (tree structure)
      if (i > 0) {
        triples.push(
          new Triple(subject, exIRI("parent"), exIRI(`entity${Math.floor(i / 10)}`))
        );
      }
    }

    // Add category labels
    for (let i = 0; i < 10; i++) {
      triples.push(
        new Triple(exIRI(`category${i}`), rdfIRI("type"), exIRI("Category"))
      );
      triples.push(
        new Triple(
          exIRI(`category${i}`),
          exIRI("label"),
          new Literal(`Category ${i}`)
        )
      );
    }

    await tripleStore.addAll(triples);
  }

  beforeEach(() => {
    parser = new SPARQLParser();
    translator = new AlgebraTranslator();
    optimizer = new AlgebraOptimizer();
    tripleStore = new InMemoryTripleStore();
    executor = new QueryExecutor(tripleStore);
  });

  describe("Query parsing performance", () => {
    it("should parse simple query under 10ms", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        SELECT ?s ?label
        WHERE {
          ?s ex:label ?label .
        }
      `;

      const start = performance.now();
      parser.parse(query);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });

    it("should parse complex query with multiple patterns under 20ms", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label ?category ?value
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:label ?label .
          ?entity ex:category ?cat .
          ?cat ex:label ?category .
          ?entity ex:value ?value .
          FILTER(?value > 50)
        }
        ORDER BY DESC(?value)
        LIMIT 100
      `;

      const start = performance.now();
      parser.parse(query);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(20);
    });

    it("should parse query with UNION and subquery under 30ms", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label ?type
        WHERE {
          {
            SELECT ?entity ?label
            WHERE {
              ?entity rdf:type ex:Entity .
              ?entity ex:label ?label .
            }
          }
          {
            { BIND("TypeA" AS ?type) }
            UNION
            { BIND("TypeB" AS ?type) }
          }
        }
      `;

      const start = performance.now();
      parser.parse(query);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(30);
    });
  });

  describe("Algebra translation performance", () => {
    it("should translate simple query under 5ms", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        SELECT ?s ?label
        WHERE {
          ?s ex:label ?label .
        }
      `;

      const ast = parser.parse(query);

      const start = performance.now();
      translator.translate(ast);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });

    it("should translate complex aggregation query under 10ms", () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?category (COUNT(?entity) AS ?count) (AVG(?value) AS ?avgValue)
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:category ?cat .
          ?cat ex:label ?category .
          ?entity ex:value ?value .
        }
        GROUP BY ?category
        HAVING (COUNT(?entity) > 5)
        ORDER BY DESC(?count)
      `;

      const ast = parser.parse(query);

      const start = performance.now();
      translator.translate(ast);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });

  describe("Query execution performance with 1000 entities", () => {
    beforeEach(async () => {
      await generateLargeDataset(1000);
    });

    it("should execute simple SELECT under 100ms", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:label ?label .
        }
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      expect(results).toHaveLength(1000);
      expect(timing.totalTime).toBeLessThan(100);
    });

    it("should execute FILTER query under 150ms", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?value
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:value ?value .
          FILTER(?value > 90)
        }
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      // Values 91-99 repeated (1000/100 = 10 times each, 9 values = 90 results)
      expect(results).toHaveLength(90);
      expect(timing.totalTime).toBeLessThan(150);
    });

    it("should execute JOIN query under 200ms", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label ?categoryLabel
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:label ?label .
          ?entity ex:category ?cat .
          ?cat ex:label ?categoryLabel .
        }
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      expect(results).toHaveLength(1000);
      expect(timing.totalTime).toBeLessThan(200);
    });

    it("should execute GROUP BY query under 250ms", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?categoryLabel (COUNT(?entity) AS ?count)
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:category ?cat .
          ?cat ex:label ?categoryLabel .
        }
        GROUP BY ?categoryLabel
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      expect(results).toHaveLength(10); // 10 categories
      expect(timing.totalTime).toBeLessThan(250);
    });

    it("should execute ORDER BY with LIMIT efficiently", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?value
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:value ?value .
        }
        ORDER BY DESC(?value)
        LIMIT 10
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      expect(results).toHaveLength(10);
      // Values should be highest first (99, 99, 99, ...)
      expect(Number((results[0].get("value") as Literal).value)).toBe(99);
      expect(timing.totalTime).toBeLessThan(150);
    });

    it("should execute UNION query under 200ms", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label
        WHERE {
          {
            ?entity rdf:type ex:Entity .
            ?entity ex:label ?label .
            ?entity ex:value ?v .
            FILTER(?v > 95)
          }
          UNION
          {
            ?entity rdf:type ex:Category .
            ?entity ex:label ?label .
          }
        }
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      // Entities with value > 95 (96-99 = 4 values * 10 each = 40) + 10 categories
      expect(results).toHaveLength(50);
      expect(timing.totalTime).toBeLessThan(200);
    });

    it("should execute DISTINCT efficiently", async () => {
      // Note: DISTINCT on projected values may have varying support
      // Testing that query completes efficiently
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT DISTINCT ?entity ?value
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:value ?value .
        }
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      // Each entity has unique URI, so DISTINCT returns all 1000
      expect(results).toHaveLength(1000);
      expect(timing.totalTime).toBeLessThan(200);
    });
  });

  describe("Query optimization effectiveness", () => {
    beforeEach(async () => {
      await generateLargeDataset(500);
    });

    it("should benefit from FILTER CONTAINS optimization", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:label ?label .
          FILTER(CONTAINS(?label, "Entity 42"))
        }
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      // Only "Entity 42", "Entity 420", "Entity 421", etc. match
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(20);
      expect(timing.totalTime).toBeLessThan(100);
    });

    it("should optimize multiple FILTER conditions", async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?value
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:value ?value .
          FILTER(?value > 80 && ?value < 90)
        }
      `;

      const { results, timing } = await executeQueryWithTiming(query);

      // Values 81-89 = 9 values * 5 each = 45 results
      expect(results).toHaveLength(45);
      expect(timing.totalTime).toBeLessThan(100);
    });
  });

  describe("Memory efficiency", () => {
    it("should handle large result sets without excessive memory", async () => {
      await generateLargeDataset(5000);

      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label ?value
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:label ?label .
          ?entity ex:value ?value .
        }
      `;

      // Execute query - should complete without memory issues
      const { results, timing } = await executeQueryWithTiming(query);

      expect(results).toHaveLength(5000);
      expect(timing.totalTime).toBeLessThan(500); // Still reasonably fast
    });
  });

  describe("Concurrent query execution", () => {
    beforeEach(async () => {
      await generateLargeDataset(200);
    });

    it("should handle multiple concurrent queries", async () => {
      const queries = [
        `PREFIX ex: <http://example.org/> PREFIX rdf: <${RDF}> SELECT ?e WHERE { ?e rdf:type ex:Entity }`,
        `PREFIX ex: <http://example.org/> SELECT (COUNT(*) AS ?c) WHERE { ?e ex:label ?l }`,
        `PREFIX ex: <http://example.org/> SELECT ?l WHERE { ?e ex:label ?l } LIMIT 10`,
        `PREFIX ex: <http://example.org/> PREFIX rdf: <${RDF}> SELECT ?e ?v WHERE { ?e rdf:type ex:Entity . ?e ex:value ?v }`,
      ];

      const start = performance.now();

      // Execute all queries concurrently
      const results = await Promise.all(
        queries.map((q) => executeQueryWithTiming(q))
      );

      const totalTime = performance.now() - start;

      // All queries should complete successfully
      expect(results[0].results).toHaveLength(200);
      expect(results[1].results).toHaveLength(1);
      expect(results[2].results).toHaveLength(10);
      expect(results[3].results).toHaveLength(200); // All 200 entities with values

      // Total time should be reasonable (not 4x sequential time)
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe("Query complexity scaling", () => {
    it("should scale linearly with data size for simple queries", async () => {
      // Test with 100 entities
      await generateLargeDataset(100);

      const query = `
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?entity ?label
        WHERE {
          ?entity rdf:type ex:Entity .
          ?entity ex:label ?label .
        }
      `;

      const { timing: timing100 } = await executeQueryWithTiming(query);

      // Clear and add 1000 entities
      await tripleStore.clear();
      await generateLargeDataset(1000);

      const { timing: timing1000 } = await executeQueryWithTiming(query);

      // Time should scale roughly linearly (with some overhead)
      // 10x data should be less than 20x time
      expect(timing1000.executeTime / timing100.executeTime).toBeLessThan(20);
    });
  });
});
