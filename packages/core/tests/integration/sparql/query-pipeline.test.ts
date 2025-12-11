/**
 * Integration tests for SPARQL Query Pipeline
 *
 * Tests the full query pipeline: Parse -> Translate -> Optimize -> Execute -> Format
 *
 * These tests verify that all components work together correctly to produce
 * accurate results for real-world query patterns used in Exocortex.
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
import type { AskOperation, ConstructOperation } from "../../../src/infrastructure/sparql/algebra/AlgebraOperation";

describe("SPARQL Query Pipeline Integration", () => {
  let parser: SPARQLParser;
  let translator: AlgebraTranslator;
  let optimizer: AlgebraOptimizer;
  let tripleStore: InMemoryTripleStore;
  let executor: QueryExecutor;

  // Namespace helpers
  const EXO = "https://exocortex.my/ontology/exo#";
  const EMS = "https://exocortex.my/ontology/ems#";
  const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
  const XSD = "http://www.w3.org/2001/XMLSchema#";

  const exoIRI = (local: string) => new IRI(`${EXO}${local}`);
  const emsIRI = (local: string) => new IRI(`${EMS}${local}`);
  const rdfIRI = (local: string) => new IRI(`${RDF}${local}`);
  const xsdIRI = (local: string) => new IRI(`${XSD}${local}`);

  /**
   * Helper to execute a full query pipeline
   */
  async function executeQuery(query: string) {
    const ast = parser.parse(query);
    const algebra = translator.translate(ast);
    const optimizedAlgebra = optimizer.optimize(algebra);
    return executor.executeAll(optimizedAlgebra);
  }

  beforeEach(async () => {
    parser = new SPARQLParser();
    translator = new AlgebraTranslator();
    optimizer = new AlgebraOptimizer();
    tripleStore = new InMemoryTripleStore();
    executor = new QueryExecutor(tripleStore);

    // Load test ontology data representing Exocortex structure
    await loadTestData();
  });

  /**
   * Load test data representing a typical Exocortex knowledge base
   */
  async function loadTestData() {
    await tripleStore.addAll([
      // === Tasks ===
      // Task 1: Active task with effort tracking
      new Triple(
        new IRI("http://vault/task1"),
        rdfIRI("type"),
        emsIRI("Task")
      ),
      new Triple(
        new IRI("http://vault/task1"),
        exoIRI("Asset_label"),
        new Literal("Implement SPARQL Engine")
      ),
      new Triple(
        new IRI("http://vault/task1"),
        emsIRI("Task_status"),
        new Literal("in_progress")
      ),
      new Triple(
        new IRI("http://vault/task1"),
        emsIRI("Effort_startTimestamp"),
        new Literal("2025-12-10T09:00:00Z", xsdIRI("dateTime"))
      ),
      new Triple(
        new IRI("http://vault/task1"),
        emsIRI("Effort_endTimestamp"),
        new Literal("2025-12-10T12:00:00Z", xsdIRI("dateTime"))
      ),
      new Triple(
        new IRI("http://vault/task1"),
        emsIRI("Task_parent"),
        new IRI("http://vault/project1")
      ),

      // Task 2: Completed task
      new Triple(
        new IRI("http://vault/task2"),
        rdfIRI("type"),
        emsIRI("Task")
      ),
      new Triple(
        new IRI("http://vault/task2"),
        exoIRI("Asset_label"),
        new Literal("Write Documentation")
      ),
      new Triple(
        new IRI("http://vault/task2"),
        emsIRI("Task_status"),
        new Literal("completed")
      ),
      new Triple(
        new IRI("http://vault/task2"),
        emsIRI("Task_parent"),
        new IRI("http://vault/project1")
      ),

      // Task 3: Pending task in different project
      new Triple(
        new IRI("http://vault/task3"),
        rdfIRI("type"),
        emsIRI("Task")
      ),
      new Triple(
        new IRI("http://vault/task3"),
        exoIRI("Asset_label"),
        new Literal("Review Pull Requests")
      ),
      new Triple(
        new IRI("http://vault/task3"),
        emsIRI("Task_status"),
        new Literal("pending")
      ),
      new Triple(
        new IRI("http://vault/task3"),
        emsIRI("Task_parent"),
        new IRI("http://vault/project2")
      ),

      // Task 4: Sleep task with prototype reference
      new Triple(
        new IRI("http://vault/task4"),
        rdfIRI("type"),
        emsIRI("Task")
      ),
      new Triple(
        new IRI("http://vault/task4"),
        exoIRI("Asset_label"),
        new Literal("Sleep 2025-12-10")
      ),
      new Triple(
        new IRI("http://vault/task4"),
        exoIRI("Asset_prototype"),
        new IRI("http://vault/proto-sleep")
      ),
      new Triple(
        new IRI("http://vault/task4"),
        emsIRI("Effort_startTimestamp"),
        new Literal("2025-12-10T23:00:00Z", xsdIRI("dateTime"))
      ),
      new Triple(
        new IRI("http://vault/task4"),
        emsIRI("Effort_endTimestamp"),
        new Literal("2025-12-11T07:00:00Z", xsdIRI("dateTime"))
      ),

      // === Projects ===
      new Triple(
        new IRI("http://vault/project1"),
        rdfIRI("type"),
        emsIRI("Project")
      ),
      new Triple(
        new IRI("http://vault/project1"),
        exoIRI("Asset_label"),
        new Literal("Exocortex Development")
      ),
      new Triple(
        new IRI("http://vault/project1"),
        emsIRI("Project_area"),
        new IRI("http://vault/area1")
      ),

      new Triple(
        new IRI("http://vault/project2"),
        rdfIRI("type"),
        emsIRI("Project")
      ),
      new Triple(
        new IRI("http://vault/project2"),
        exoIRI("Asset_label"),
        new Literal("Code Reviews")
      ),
      new Triple(
        new IRI("http://vault/project2"),
        emsIRI("Project_area"),
        new IRI("http://vault/area1")
      ),

      // === Areas ===
      new Triple(
        new IRI("http://vault/area1"),
        rdfIRI("type"),
        emsIRI("Area")
      ),
      new Triple(
        new IRI("http://vault/area1"),
        exoIRI("Asset_label"),
        new Literal("Software Engineering")
      ),

      // === Prototypes ===
      new Triple(
        new IRI("http://vault/proto-sleep"),
        rdfIRI("type"),
        exoIRI("Prototype")
      ),
      new Triple(
        new IRI("http://vault/proto-sleep"),
        exoIRI("Asset_label"),
        new Literal("Sleep")
      ),

      // === Notes ===
      new Triple(
        new IRI("http://vault/note1"),
        rdfIRI("type"),
        exoIRI("Note")
      ),
      new Triple(
        new IRI("http://vault/note1"),
        exoIRI("Asset_label"),
        new Literal("SPARQL Query Patterns")
      ),
      new Triple(
        new IRI("http://vault/note1"),
        exoIRI("Note_linkedTo"),
        new IRI("http://vault/task1")
      ),
    ]);
  }

  describe("SELECT queries", () => {
    it("should execute simple SELECT with type filter", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(4);
      const labels = results.map((r) => (r.get("label") as Literal).value).sort();
      expect(labels).toContain("Implement SPARQL Engine");
      expect(labels).toContain("Write Documentation");
      expect(labels).toContain("Review Pull Requests");
      expect(labels).toContain("Sleep 2025-12-10");
    });

    it("should execute SELECT with FILTER on literal", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          ?task ems:Task_status ?status .
          FILTER(?status = "completed")
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(1);
      expect((results[0].get("label") as Literal).value).toBe("Write Documentation");
    });

    it("should execute SELECT with FILTER CONTAINS", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          FILTER(CONTAINS(?label, "SPARQL"))
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(1);
      expect((results[0].get("label") as Literal).value).toBe("Implement SPARQL Engine");
    });

    it("should execute SELECT with OPTIONAL pattern (when optional matches)", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label ?parent
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          OPTIONAL { ?task ems:Task_parent ?parent }
        }
      `;

      const results = await executeQuery(query);

      // Tasks with optional parent pattern
      expect(results.length).toBeGreaterThanOrEqual(3);

      // Tasks with parents should have parent bound
      const taskWithParent = results.find(
        (r) => (r.get("task") as IRI).value === "http://vault/task1"
      );
      if (taskWithParent) {
        expect(taskWithParent.get("parent")).toBeDefined();
      }
    });

    it("should execute SELECT with ORDER BY and LIMIT", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
        }
        ORDER BY ?label
        LIMIT 2
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(2);
      // Alphabetically first two labels
      expect((results[0].get("label") as Literal).value).toBe("Implement SPARQL Engine");
      expect((results[1].get("label") as Literal).value).toBe("Review Pull Requests");
    });

    it("should execute SELECT with DISTINCT", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT DISTINCT ?type
        WHERE {
          ?entity rdf:type ?type .
        }
      `;

      const results = await executeQuery(query);

      // Should return distinct types: Task, Project, Area, Prototype, Note
      expect(results.length).toBeGreaterThanOrEqual(5);

      const types = results.map((r) => (r.get("type") as IRI).value);
      expect(types).toContain("https://exocortex.my/ontology/ems#Task");
      expect(types).toContain("https://exocortex.my/ontology/ems#Project");
      expect(types).toContain("https://exocortex.my/ontology/ems#Area");
    });
  });

  describe("JOIN operations", () => {
    it("should execute multi-pattern JOIN (implicit join)", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?taskLabel ?project ?projectLabel
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?taskLabel .
          ?task ems:Task_parent ?project .
          ?project exo:Asset_label ?projectLabel .
        }
      `;

      const results = await executeQuery(query);

      // task1, task2, task3 have parents (task4 has prototype, not parent)
      expect(results).toHaveLength(3);

      const projectLabels = new Set(results.map((r) => (r.get("projectLabel") as Literal).value));
      expect(projectLabels.has("Exocortex Development")).toBe(true);
      expect(projectLabels.has("Code Reviews")).toBe(true);
    });

    it("should execute 3-level hierarchy JOIN (Task -> Project -> Area)", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?taskLabel ?areaLabel
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?taskLabel .
          ?task ems:Task_parent ?project .
          ?project ems:Project_area ?area .
          ?area exo:Asset_label ?areaLabel .
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect((r.get("areaLabel") as Literal).value).toBe("Software Engineering");
      });
    });
  });

  describe("UNION queries", () => {
    it("should combine results from multiple type patterns", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?entity ?label
        WHERE {
          {
            ?entity rdf:type ems:Task .
            ?entity exo:Asset_label ?label
          }
          UNION
          {
            ?entity rdf:type ems:Project .
            ?entity exo:Asset_label ?label
          }
        }
      `;

      const results = await executeQuery(query);

      // 4 tasks + 2 projects = 6
      expect(results).toHaveLength(6);

      const labels = results.map((r) => (r.get("label") as Literal).value);
      expect(labels).toContain("Implement SPARQL Engine");
      expect(labels).toContain("Exocortex Development");
    });

    it("should handle 3-branch UNION (Tasks, Projects, Areas)", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?entity ?label
        WHERE {
          {
            ?entity rdf:type ems:Task .
            ?entity exo:Asset_label ?label .
          }
          UNION
          {
            ?entity rdf:type ems:Project .
            ?entity exo:Asset_label ?label .
          }
          UNION
          {
            ?entity rdf:type ems:Area .
            ?entity exo:Asset_label ?label .
          }
        }
      `;

      const results = await executeQuery(query);

      // 4 tasks + 2 projects + 1 area = 7
      expect(results).toHaveLength(7);

      // Verify we have results from all three types
      const labels = results.map((r) => (r.get("label") as Literal).value);
      expect(labels).toContain("Implement SPARQL Engine"); // Task
      expect(labels).toContain("Exocortex Development"); // Project
      expect(labels).toContain("Software Engineering"); // Area
    });
  });

  describe("Aggregation queries", () => {
    it("should execute COUNT aggregation", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>

        SELECT (COUNT(?task) AS ?taskCount)
        WHERE {
          ?task rdf:type ems:Task .
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(1);
      expect((results[0].get("taskCount") as Literal).value).toBe("4");
    });

    it("should execute GROUP BY with COUNT", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?status (COUNT(?task) AS ?count)
        WHERE {
          ?task rdf:type ems:Task .
          ?task ems:Task_status ?status .
        }
        GROUP BY ?status
      `;

      const results = await executeQuery(query);

      // Statuses: in_progress, completed, pending (task4 has no status)
      expect(results).toHaveLength(3);

      const countByStatus: Record<string, string> = {};
      results.forEach((r) => {
        const status = (r.get("status") as Literal).value;
        const count = (r.get("count") as Literal).value;
        countByStatus[status] = count;
      });

      expect(countByStatus["in_progress"]).toBe("1");
      expect(countByStatus["completed"]).toBe("1");
      expect(countByStatus["pending"]).toBe("1");
    });

    it("should execute GROUP BY with JOIN to resolve labels", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?projectLabel (COUNT(?task) AS ?taskCount)
        WHERE {
          ?task rdf:type ems:Task .
          ?task ems:Task_parent ?project .
          ?project exo:Asset_label ?projectLabel .
        }
        GROUP BY ?projectLabel
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(2);

      const countByProject: Record<string, string> = {};
      results.forEach((r) => {
        const label = (r.get("projectLabel") as Literal).value;
        const count = (r.get("taskCount") as Literal).value;
        countByProject[label] = count;
      });

      expect(countByProject["Exocortex Development"]).toBe("2");
      expect(countByProject["Code Reviews"]).toBe("1");
    });
  });

  describe("SELECT with computed values", () => {
    it("should retrieve numeric values from triples", async () => {
      // Add numeric data
      await tripleStore.add(
        new Triple(
          new IRI("http://vault/task1"),
          emsIRI("Task_priority"),
          new Literal("5", xsdIRI("integer"))
        )
      );

      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label ?priority
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          ?task ems:Task_priority ?priority .
        }
      `;

      const results = await executeQuery(query);

      expect(results.length).toBeGreaterThanOrEqual(1);
      const taskWithPriority = results.find(
        (r) => r.get("priority") !== undefined
      );
      if (taskWithPriority) {
        expect((taskWithPriority.get("priority") as Literal).value).toBe("5");
      }
    });

    it("should filter numeric values in WHERE clause", async () => {
      // Add priority to multiple tasks
      await tripleStore.addAll([
        new Triple(
          new IRI("http://vault/task1"),
          emsIRI("Task_priority"),
          new Literal("1", xsdIRI("integer"))
        ),
        new Triple(
          new IRI("http://vault/task2"),
          emsIRI("Task_priority"),
          new Literal("5", xsdIRI("integer"))
        ),
        new Triple(
          new IRI("http://vault/task3"),
          emsIRI("Task_priority"),
          new Literal("10", xsdIRI("integer"))
        ),
      ]);

      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label ?priority
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          ?task ems:Task_priority ?priority .
          FILTER(?priority > 3)
        }
      `;

      const results = await executeQuery(query);

      expect(results.length).toBeGreaterThanOrEqual(2);
      results.forEach((r) => {
        const priority = parseInt((r.get("priority") as Literal).value, 10);
        expect(priority).toBeGreaterThan(3);
      });
    });
  });

  describe("Subqueries", () => {
    it("should execute subquery for pre-filtering", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label ?projectLabel
        WHERE {
          {
            SELECT ?project ?projectLabel
            WHERE {
              ?project rdf:type ems:Project .
              ?project exo:Asset_label ?projectLabel .
              FILTER(CONTAINS(?projectLabel, "Exocortex"))
            }
          }
          ?task ems:Task_parent ?project .
          ?task exo:Asset_label ?label .
        }
      `;

      const results = await executeQuery(query);

      // Only tasks from "Exocortex Development" project
      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect((r.get("projectLabel") as Literal).value).toBe("Exocortex Development");
      });
    });
  });

  describe("VALUES clause", () => {
    it("should filter using VALUES with single variable", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          ?task ems:Task_status ?status .
          VALUES ?status { "completed" "pending" }
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(2);
      const labels = results.map((r) => (r.get("label") as Literal).value);
      expect(labels).toContain("Write Documentation");
      expect(labels).toContain("Review Pull Requests");
    });

    it("should filter using VALUES with IRI values", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?entity ?label
        WHERE {
          ?entity rdf:type ?type .
          ?entity exo:Asset_label ?label .
          VALUES ?type { ems:Task ems:Project }
        }
      `;

      const results = await executeQuery(query);

      // 4 tasks + 2 projects = 6
      expect(results).toHaveLength(6);
    });
  });

  describe("FILTER NOT EXISTS alternative to MINUS", () => {
    it("should filter results using FILTER NOT EXISTS", async () => {
      // Test that we can exclude patterns using FILTER NOT EXISTS
      // This is an alternative to MINUS that works for excluding patterns
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          FILTER NOT EXISTS { ?task ems:Task_parent ?parent }
        }
      `;

      const results = await executeQuery(query);

      // Only task4 (Sleep) has no parent
      expect(results).toHaveLength(1);
      expect((results[0].get("label") as Literal).value).toBe("Sleep 2025-12-10");
    });
  });

  describe("ASK queries", () => {
    it("should return true when pattern matches", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>

        ASK WHERE {
          ?task rdf:type ems:Task .
          ?task ems:Task_status "completed"
        }
      `;

      const ast = parser.parse(query);
      const algebra = translator.translate(ast);
      const optimizedAlgebra = optimizer.optimize(algebra);

      expect(executor.isAskQuery(optimizedAlgebra)).toBe(true);
      const result = await executor.executeAsk(optimizedAlgebra as AskOperation);
      expect(result).toBe(true);
    });

    it("should return false when pattern does not match", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>

        ASK WHERE {
          ?task rdf:type ems:Task .
          ?task ems:Task_status "archived"
        }
      `;

      const ast = parser.parse(query);
      const algebra = translator.translate(ast);
      const optimizedAlgebra = optimizer.optimize(algebra);

      const result = await executor.executeAsk(optimizedAlgebra as AskOperation);
      expect(result).toBe(false);
    });
  });

  describe("CONSTRUCT queries", () => {
    it("should construct new triples from matched patterns", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>
        PREFIX ex: <http://example.org/>

        CONSTRUCT {
          ?task ex:hasLabel ?label .
          ?task ex:isCompleted "true" .
        }
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          ?task ems:Task_status "completed" .
        }
      `;

      const ast = parser.parse(query);
      const algebra = translator.translate(ast);
      const optimizedAlgebra = optimizer.optimize(algebra);

      expect(executor.isConstructQuery(optimizedAlgebra)).toBe(true);
      const triples = await executor.executeConstruct(optimizedAlgebra as ConstructOperation);

      // 1 completed task = 2 triples (hasLabel + isCompleted)
      expect(triples).toHaveLength(2);

      const hasLabel = triples.find((t) => t.predicate.value.includes("hasLabel"));
      expect(hasLabel).toBeDefined();
      expect((hasLabel!.object as Literal).value).toBe("Write Documentation");

      const isCompleted = triples.find((t) => t.predicate.value.includes("isCompleted"));
      expect(isCompleted).toBeDefined();
      expect((isCompleted!.object as Literal).value).toBe("true");
    });
  });

  describe("Complex real-world queries", () => {
    it("should find all tasks in a specific area via project hierarchy", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?taskLabel ?projectLabel ?areaLabel
        WHERE {
          ?area rdf:type ems:Area .
          ?area exo:Asset_label ?areaLabel .
          FILTER(?areaLabel = "Software Engineering")

          ?project ems:Project_area ?area .
          ?project exo:Asset_label ?projectLabel .

          ?task ems:Task_parent ?project .
          ?task exo:Asset_label ?taskLabel .
        }
        ORDER BY ?projectLabel ?taskLabel
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect((r.get("areaLabel") as Literal).value).toBe("Software Engineering");
      });
    });

    it("should find tasks with prototype and compute duration", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?taskLabel ?protoLabel ?start ?end
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?taskLabel .
          ?task exo:Asset_prototype ?proto .
          ?proto exo:Asset_label ?protoLabel .
          ?task ems:Effort_startTimestamp ?start .
          ?task ems:Effort_endTimestamp ?end .
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(1);
      expect((results[0].get("taskLabel") as Literal).value).toBe("Sleep 2025-12-10");
      expect((results[0].get("protoLabel") as Literal).value).toBe("Sleep");
      expect((results[0].get("start") as Literal).value).toBe("2025-12-10T23:00:00Z");
      expect((results[0].get("end") as Literal).value).toBe("2025-12-11T07:00:00Z");
    });

    it("should find notes linked to tasks", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?noteLabel ?taskLabel
        WHERE {
          ?note rdf:type exo:Note .
          ?note exo:Asset_label ?noteLabel .
          ?note exo:Note_linkedTo ?task .
          ?task exo:Asset_label ?taskLabel .
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(1);
      expect((results[0].get("noteLabel") as Literal).value).toBe("SPARQL Query Patterns");
      expect((results[0].get("taskLabel") as Literal).value).toBe("Implement SPARQL Engine");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should return empty results for non-matching patterns", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>

        SELECT ?task
        WHERE {
          ?task rdf:type ems:NonExistentType .
        }
      `;

      const results = await executeQuery(query);
      expect(results).toHaveLength(0);
    });

    it("should handle empty triple store gracefully", async () => {
      await tripleStore.clear();

      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>

        SELECT ?task
        WHERE {
          ?task rdf:type ems:Task .
        }
      `;

      const results = await executeQuery(query);
      expect(results).toHaveLength(0);
    });

    it("should handle queries with unbound variables in OPTIONAL", async () => {
      const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ems: <https://exocortex.my/ontology/ems#>
        PREFIX exo: <https://exocortex.my/ontology/exo#>

        SELECT ?task ?label ?nonExistentProp
        WHERE {
          ?task rdf:type ems:Task .
          ?task exo:Asset_label ?label .
          OPTIONAL { ?task exo:NonExistentProperty ?nonExistentProp }
        }
      `;

      const results = await executeQuery(query);

      expect(results).toHaveLength(4);
      results.forEach((r) => {
        expect(r.get("label")).toBeDefined();
        expect(r.get("nonExistentProp")).toBeUndefined();
      });
    });
  });
});
