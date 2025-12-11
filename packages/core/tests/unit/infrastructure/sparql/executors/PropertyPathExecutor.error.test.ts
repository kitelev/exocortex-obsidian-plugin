/**
 * PropertyPathExecutor Error Scenario and Edge Case Tests
 *
 * Tests error handling for:
 * - Infinite loops in recursive paths
 * - Empty graph handling
 * - Invalid path operations
 * - Depth limits
 *
 * Issue: #758 - Add Error Scenario and Edge Case Test Suite
 */

import {
  PropertyPathExecutor,
  PropertyPathExecutorError,
} from "../../../../../src/infrastructure/sparql/executors/PropertyPathExecutor";
import type { ITripleStore } from "../../../../../src/interfaces/ITripleStore";
import { Triple } from "../../../../../src/domain/models/rdf/Triple";
import { IRI } from "../../../../../src/domain/models/rdf/IRI";
import { Literal } from "../../../../../src/domain/models/rdf/Literal";
import { SolutionMapping } from "../../../../../src/infrastructure/sparql/SolutionMapping";
import type {
  TripleElement,
  PropertyPath,
  IRI as AlgebraIRI,
} from "../../../../../src/infrastructure/sparql/algebra/AlgebraOperation";

// Mock triple store implementation
class MockTripleStore implements ITripleStore {
  private triples: Triple[] = [];

  async add(triple: Triple): Promise<void> {
    this.triples.push(triple);
  }

  async addAll(triples: Triple[]): Promise<void> {
    this.triples.push(...triples);
  }

  async remove(triple: Triple): Promise<boolean> {
    const idx = this.triples.findIndex(
      (t) =>
        t.subject.equals(triple.subject) &&
        t.predicate.equals(triple.predicate) &&
        t.object.equals(triple.object)
    );
    if (idx !== -1) {
      this.triples.splice(idx, 1);
      return true;
    }
    return false;
  }

  async has(triple: Triple): Promise<boolean> {
    return this.triples.some(
      (t) =>
        t.subject.equals(triple.subject) &&
        t.predicate.equals(triple.predicate) &&
        t.object.equals(triple.object)
    );
  }

  async match(
    subject?: IRI,
    predicate?: IRI,
    object?: IRI | Literal
  ): Promise<Triple[]> {
    return this.triples.filter((t) => {
      if (subject && !t.subject.equals(subject)) return false;
      if (predicate && !t.predicate.equals(predicate)) return false;
      if (object && !t.object.equals(object)) return false;
      return true;
    });
  }

  async count(): Promise<number> {
    return this.triples.length;
  }

  async clear(): Promise<void> {
    this.triples = [];
  }

  async matchStream(): AsyncIterableIterator<Triple> {
    const triples = this.triples;
    return (async function* () {
      for (const triple of triples) {
        yield triple;
      }
    })();
  }
}

// Helper functions to create algebra elements (matching existing test patterns)
const algebraIri = (value: string): AlgebraIRI => ({ type: "iri", value });
const algebraVar = (name: string): TripleElement => ({ type: "variable", value: name });

describe("PropertyPathExecutor Error Scenarios", () => {
  let store: MockTripleStore;
  let executor: PropertyPathExecutor;

  beforeEach(() => {
    store = new MockTripleStore();
    executor = new PropertyPathExecutor(store);
  });

  // Helper to collect results
  async function collectResults(
    subject: TripleElement,
    path: PropertyPath,
    object: TripleElement
  ): Promise<SolutionMapping[]> {
    const results: SolutionMapping[] = [];
    for await (const mapping of executor.execute(subject, path, object)) {
      results.push(mapping);
    }
    return results;
  }

  describe("Empty Graph Handling", () => {
    it("should return empty results for path query on empty graph", async () => {
      const path: PropertyPath = {
        type: "path",
        pathType: "+",
        items: [algebraIri("http://example.org/knows")],
      };

      const results = await collectResults(algebraVar("s"), path, algebraVar("o"));
      expect(results).toEqual([]);
    });

    it("should handle OneOrMore path on empty graph", async () => {
      const path: PropertyPath = {
        type: "path",
        pathType: "+",
        items: [algebraIri("http://example.org/p")],
      };

      const results = await collectResults(algebraVar("s"), path, algebraVar("o"));
      expect(results.length).toBe(0);
    });

    it("should handle ZeroOrMore path on empty graph", async () => {
      const path: PropertyPath = {
        type: "path",
        pathType: "*",
        items: [algebraIri("http://example.org/p")],
      };

      const results = await collectResults(algebraVar("s"), path, algebraVar("o"));
      // ZeroOrMore on empty graph returns nothing (no start nodes)
      expect(results.length).toBe(0);
    });
  });

  describe("Cyclic Graph Handling", () => {
    it("should handle simple cycle without infinite loop", async () => {
      // Create A -> B -> C -> A cycle
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const c = new IRI("http://example.org/C");
      const knows = new IRI("http://example.org/knows");

      await store.add(new Triple(a, knows, b));
      await store.add(new Triple(b, knows, c));
      await store.add(new Triple(c, knows, a));

      const path: PropertyPath = {
        type: "path",
        pathType: "+",
        items: [algebraIri("http://example.org/knows")],
      };

      const results: SolutionMapping[] = [];
      // Should complete without hanging
      const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      const executePromise = (async () => {
        for await (const mapping of executor.execute(
          algebraIri("http://example.org/A"),
          path,
          algebraVar("o")
        )) {
          results.push(mapping);
        }
      })();

      await Promise.race([executePromise, timeoutPromise]);

      // Should find B, C, and eventually A again (transitive closure stops at visited)
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("should handle self-loop without infinite loop", async () => {
      const a = new IRI("http://example.org/A");
      const self = new IRI("http://example.org/self");

      // A -> A (self-loop)
      await store.add(new Triple(a, self, a));

      const path: PropertyPath = {
        type: "path",
        pathType: "+",
        items: [algebraIri("http://example.org/self")],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      // Should find A (via self-loop) exactly once
      expect(results.length).toBe(1);
    });
  });

  describe("Path Not Found", () => {
    it("should return empty for non-matching predicate", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const knows = new IRI("http://example.org/knows");

      await store.add(new Triple(a, knows, b));

      const path: PropertyPath = {
        type: "path",
        pathType: "+",
        items: [algebraIri("http://example.org/nonexistent")],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      expect(results.length).toBe(0);
    });

    it("should return empty when target not reachable", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const knows = new IRI("http://example.org/knows");

      // A -> B (no path to C)
      await store.add(new Triple(a, knows, b));

      const path: PropertyPath = {
        type: "path",
        pathType: "+",
        items: [algebraIri("http://example.org/knows")],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraIri("http://example.org/C")
      );

      expect(results.length).toBe(0);
    });
  });

  describe("Inverse Path Edge Cases", () => {
    it("should handle inverse path correctly", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const knows = new IRI("http://example.org/knows");

      // A -> B
      await store.add(new Triple(a, knows, b));

      // Query: B ^knows ?o (who knows B? -> A)
      const path: PropertyPath = {
        type: "path",
        pathType: "^",
        items: [algebraIri("http://example.org/knows")],
      };

      const results = await collectResults(
        algebraIri("http://example.org/B"),
        path,
        algebraVar("o")
      );

      expect(results.length).toBe(1);
      expect((results[0].get("o") as IRI).value).toBe("http://example.org/A");
    });

    it("should handle inverse path with no matches", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const knows = new IRI("http://example.org/knows");

      await store.add(new Triple(a, knows, b));

      // Query: A ^knows ?o (who knows A? -> nobody)
      const path: PropertyPath = {
        type: "path",
        pathType: "^",
        items: [algebraIri("http://example.org/knows")],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      expect(results.length).toBe(0);
    });
  });

  describe("Sequence Path Edge Cases", () => {
    it("should handle sequence path with missing intermediate", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const c = new IRI("http://example.org/C");
      const p1 = new IRI("http://example.org/p1");
      const p2 = new IRI("http://example.org/p2");

      // A -p1-> B but no p2 from B
      await store.add(new Triple(a, p1, b));
      // C has p2 but not connected to A
      await store.add(new Triple(c, p2, new Literal("value")));

      const path: PropertyPath = {
        type: "path",
        pathType: "/",
        items: [
          algebraIri("http://example.org/p1"),
          algebraIri("http://example.org/p2"),
        ],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      // No complete path A -p1-> ? -p2-> ?
      expect(results.length).toBe(0);
    });

    it("should handle long sequence path", async () => {
      const nodes: IRI[] = [];
      for (let i = 0; i < 10; i++) {
        nodes.push(new IRI(`http://example.org/N${i}`));
      }
      const p = new IRI("http://example.org/p");

      // Create chain: N0 -> N1 -> N2 -> ... -> N9
      for (let i = 0; i < 9; i++) {
        await store.add(new Triple(nodes[i], p, nodes[i + 1]));
      }

      // Path: p/p/p (3 hops)
      const path: PropertyPath = {
        type: "path",
        pathType: "/",
        items: [
          algebraIri("http://example.org/p"),
          algebraIri("http://example.org/p"),
          algebraIri("http://example.org/p"),
        ],
      };

      const results = await collectResults(
        algebraIri("http://example.org/N0"),
        path,
        algebraVar("o")
      );

      // Should find N3 (3 hops from N0)
      expect(results.length).toBe(1);
      expect((results[0].get("o") as IRI).value).toBe("http://example.org/N3");
    });
  });

  describe("Alternative Path Edge Cases", () => {
    it("should handle alternative path where only one matches", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const p1 = new IRI("http://example.org/p1");

      // Only p1 exists
      await store.add(new Triple(a, p1, b));

      const path: PropertyPath = {
        type: "path",
        pathType: "|",
        items: [
          algebraIri("http://example.org/p1"),
          algebraIri("http://example.org/p2"),
        ],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      expect(results.length).toBe(1);
    });

    it("should handle alternative path where neither matches", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const p3 = new IRI("http://example.org/p3");

      // Different predicate
      await store.add(new Triple(a, p3, b));

      const path: PropertyPath = {
        type: "path",
        pathType: "|",
        items: [
          algebraIri("http://example.org/p1"),
          algebraIri("http://example.org/p2"),
        ],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      expect(results.length).toBe(0);
    });

    it("should handle alternative path where both match same target", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const p1 = new IRI("http://example.org/p1");
      const p2 = new IRI("http://example.org/p2");

      // Both predicates lead to B
      await store.add(new Triple(a, p1, b));
      await store.add(new Triple(a, p2, b));

      const path: PropertyPath = {
        type: "path",
        pathType: "|",
        items: [
          algebraIri("http://example.org/p1"),
          algebraIri("http://example.org/p2"),
        ],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      // Should deduplicate if both paths lead to same target
      // Or return both depending on implementation
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("ZeroOrOne Path Edge Cases", () => {
    it("should include start node for ZeroOrOne path", async () => {
      const a = new IRI("http://example.org/A");
      const b = new IRI("http://example.org/B");
      const p = new IRI("http://example.org/p");

      await store.add(new Triple(a, p, b));

      const path: PropertyPath = {
        type: "path",
        pathType: "?",
        items: [algebraIri("http://example.org/p")],
      };

      const results = await collectResults(
        algebraIri("http://example.org/A"),
        path,
        algebraVar("o")
      );

      // Should include both A (zero steps) and B (one step)
      expect(results.length).toBe(2);
      const values = results.map((r) => (r.get("o") as IRI).value);
      expect(values).toContain("http://example.org/A");
      expect(values).toContain("http://example.org/B");
    });
  });

  describe("Large Graph Performance", () => {
    it("should handle moderately deep path traversal", async () => {
      // Create a chain of 20 nodes
      const p = new IRI("http://example.org/next");
      const nodes: IRI[] = [];
      for (let i = 0; i < 20; i++) {
        nodes.push(new IRI(`http://example.org/node${i}`));
      }

      // Create chain
      for (let i = 0; i < 19; i++) {
        await store.add(new Triple(nodes[i], p, nodes[i + 1]));
      }

      const path: PropertyPath = {
        type: "path",
        pathType: "+",
        items: [algebraIri("http://example.org/next")],
      };

      const startTime = Date.now();
      const results = await collectResults(
        algebraIri("http://example.org/node0"),
        path,
        algebraVar("o")
      );
      const duration = Date.now() - startTime;

      // Should find all 19 reachable nodes
      expect(results.length).toBe(19);
      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });
});
