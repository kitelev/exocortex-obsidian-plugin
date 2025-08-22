import { SPARQLEngine } from "../../src/application/SPARQLEngine";
import { Graph } from "../../src/domain/semantic/core/Graph";
import { Triple, IRI, Literal } from "../../src/domain/semantic/core/Triple";

describe("SPARQLEngine CONSTRUCT Queries", () => {
  let engine: SPARQLEngine;
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
    engine = new SPARQLEngine(graph);

    // Add test data
    graph.add(
      new Triple(new IRI("ex:task1"), new IRI("rdf:type"), new IRI("ems:Task")),
    );
    graph.add(
      new Triple(
        new IRI("ex:task1"),
        new IRI("ems:deadline"),
        Literal.string("2025-08-10"),
      ),
    );
    graph.add(
      new Triple(
        new IRI("ex:task1"),
        new IRI("ems:status"),
        Literal.string("pending"),
      ),
    );

    graph.add(
      new Triple(new IRI("ex:task2"), new IRI("rdf:type"), new IRI("ems:Task")),
    );
    graph.add(
      new Triple(
        new IRI("ex:task2"),
        new IRI("ems:deadline"),
        Literal.string("2025-08-08"),
      ),
    );
    graph.add(
      new Triple(
        new IRI("ex:task2"),
        new IRI("ems:status"),
        Literal.string("pending"),
      ),
    );

    graph.add(
      new Triple(new IRI("ex:task3"), new IRI("rdf:type"), new IRI("ems:Task")),
    );
    graph.add(
      new Triple(
        new IRI("ex:task3"),
        new IRI("ems:assignedTo"),
        new IRI("ex:person1"),
      ),
    );
    graph.add(
      new Triple(
        new IRI("ex:task3"),
        new IRI("ems:partOf"),
        new IRI("ex:project1"),
      ),
    );
  });

  describe("Basic CONSTRUCT", () => {
    test("should generate new triples from CONSTRUCT template", () => {
      const query = `
                CONSTRUCT {
                    ?task ems:urgency "high" .
                }
                WHERE {
                    ?task rdf:type ems:Task .
                }
            `;

      const result = engine.construct(query);

      expect(result.triples).toHaveLength(3); // 3 tasks
      expect(result.triples[0].getSubject().toString()).toEqual("ex:task1");
      expect(result.triples[0].getPredicate().toString()).toEqual(
        "ems:urgency",
      );
      expect(result.triples[0].getObject().toString()).toEqual(
        '"high"^^http://www.w3.org/2001/XMLSchema#string',
      );
      expect(result.provenance).toContain("CONSTRUCT query at");
    });

    test("should handle empty WHERE results", () => {
      const query = `
                CONSTRUCT {
                    ?task ems:urgency "critical" .
                }
                WHERE {
                    ?task rdf:type ems:NonExistent .
                }
            `;

      const result = engine.construct(query);

      expect(result.triples).toHaveLength(0);
    });

    test("should support multiple template patterns", () => {
      const query = `
                CONSTRUCT {
                    ?task ems:urgency "high" .
                    ?task ems:needsReview true .
                }
                WHERE {
                    ?task ems:status "pending" .
                }
            `;

      const result = engine.construct(query);

      expect(result.triples).toHaveLength(4); // 2 tasks * 2 properties
      // Check first task's urgency
      const task1Urgency = result.triples.find(
        (t) =>
          t.getSubject().toString() === "ex:task1" &&
          t.getPredicate().toString() === "ems:urgency",
      );
      expect(task1Urgency).toBeDefined();
      expect(task1Urgency?.getObject().toString()).toEqual(
        '"high"^^http://www.w3.org/2001/XMLSchema#string',
      );

      // Check first task's needsReview
      const task1Review = result.triples.find(
        (t) =>
          t.getSubject().toString() === "ex:task1" &&
          t.getPredicate().toString() === "ems:needsReview",
      );
      expect(task1Review).toBeDefined();
      expect(task1Review?.getObject().toString()).toEqual(
        '"true"^^http://www.w3.org/2001/XMLSchema#boolean',
      );
    });
  });

  describe("Relationship Inference", () => {
    test("should infer relationships from existing data", () => {
      const query = `
                CONSTRUCT {
                    ?person ems:contributesTo ?project .
                }
                WHERE {
                    ?task ems:assignedTo ?person .
                    ?task ems:partOf ?project .
                }
            `;

      const result = engine.construct(query);

      expect(result.triples).toHaveLength(1);
      expect(result.triples[0].getSubject().toString()).toEqual("ex:person1");
      expect(result.triples[0].getPredicate().toString()).toEqual(
        "ems:contributesTo",
      );
      expect(result.triples[0].getObject().toString()).toEqual("ex:project1");
    });
  });

  describe("CONSTRUCT with LIMIT", () => {
    test("should respect LIMIT clause", () => {
      const query = `
                CONSTRUCT {
                    ?task ems:processed true .
                }
                WHERE {
                    ?task rdf:type ems:Task .
                } LIMIT 2
            `;

      const result = engine.construct(query);

      expect(result.triples).toHaveLength(2);
    });
  });

  describe("Invalid CONSTRUCT queries", () => {
    test("should throw error for invalid format", () => {
      const query = "CONSTRUCT WHERE { ?s ?p ?o }";

      expect(() => engine.construct(query)).toThrow(
        "Invalid CONSTRUCT query format",
      );
    });

    test("should handle malformed templates gracefully", () => {
      const query = `
                CONSTRUCT {
                    ?task
                }
                WHERE {
                    ?task rdf:type ems:Task .
                }
            `;

      const result = engine.construct(query);

      expect(result.triples).toHaveLength(0); // Invalid template ignored
    });
  });

  describe("Integration with Graph", () => {
    test("generated triples can be queried with SELECT", () => {
      // First, run CONSTRUCT to generate new triples
      const constructQuery = `
                CONSTRUCT {
                    ?task ems:priority "high" .
                }
                WHERE {
                    ?task ems:deadline ?date .
                }
            `;

      const constructResult = engine.construct(constructQuery);

      // Add generated triples to graph
      for (const triple of constructResult.triples) {
        graph.add(triple);
      }

      // Now query the generated triples
      const selectQuery = `
                SELECT ?task ?priority
                WHERE {
                    ?task ems:priority ?priority .
                }
            `;

      const selectResult = engine.select(selectQuery);

      expect(selectResult.results).toHaveLength(2); // task1 and task2 have deadlines
      expect(selectResult.results[0].priority).toBe(
        '"high"^^http://www.w3.org/2001/XMLSchema#string',
      );
    });
  });
});
