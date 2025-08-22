import { Graph } from "../../../../../src/domain/semantic/core/Graph";
import {
  Triple,
  IRI,
  BlankNode,
  Literal,
} from "../../../../../src/domain/semantic/core/Triple";

describe("Graph", () => {
  let graph: Graph;
  let subject1: IRI;
  let subject2: IRI;
  let predicate1: IRI;
  let predicate2: IRI;
  let object1: IRI;
  let object2: Literal;
  let triple1: Triple;
  let triple2: Triple;
  let triple3: Triple;

  beforeEach(() => {
    graph = new Graph();
    subject1 = new IRI("http://example.org/subject1");
    subject2 = new IRI("http://example.org/subject2");
    predicate1 = new IRI("http://example.org/predicate1");
    predicate2 = new IRI("http://example.org/predicate2");
    object1 = new IRI("http://example.org/object1");
    object2 = new Literal("test value");

    triple1 = new Triple(subject1, predicate1, object1);
    triple2 = new Triple(subject1, predicate2, object2);
    triple3 = new Triple(subject2, predicate1, object1);
  });

  describe("Construction", () => {
    it("should create empty graph", () => {
      // When
      const emptyGraph = new Graph();

      // Then
      expect(emptyGraph.size()).toBe(0);
      expect(emptyGraph.isEmpty()).toBe(true);
      expect(emptyGraph.toArray()).toEqual([]);
    });

    it("should create graph with initial triples", () => {
      // Given
      const triples = [triple1, triple2];

      // When
      const initializedGraph = new Graph(triples);

      // Then
      expect(initializedGraph.size()).toBe(2);
      expect(initializedGraph.isEmpty()).toBe(false);
      expect(initializedGraph.has(triple1)).toBe(true);
      expect(initializedGraph.has(triple2)).toBe(true);
    });

    it("should handle duplicate triples in constructor", () => {
      // Given
      const triples = [triple1, triple1, triple2];

      // When
      const graph = new Graph(triples);

      // Then
      expect(graph.size()).toBe(2); // Duplicates ignored
      expect(graph.has(triple1)).toBe(true);
      expect(graph.has(triple2)).toBe(true);
    });
  });

  describe("add", () => {
    it("should add single triple", () => {
      // When
      graph.add(triple1);

      // Then
      expect(graph.size()).toBe(1);
      expect(graph.has(triple1)).toBe(true);
    });

    it("should not add duplicate triples", () => {
      // Given
      graph.add(triple1);

      // When
      graph.add(triple1);

      // Then
      expect(graph.size()).toBe(1);
    });

    it("should add multiple different triples", () => {
      // When
      graph.add(triple1);
      graph.add(triple2);
      graph.add(triple3);

      // Then
      expect(graph.size()).toBe(3);
      expect(graph.has(triple1)).toBe(true);
      expect(graph.has(triple2)).toBe(true);
      expect(graph.has(triple3)).toBe(true);
    });

    it("should update internal indexes when adding triples", () => {
      // When
      graph.add(triple1);

      // Then - verify indexes are created by checking matches
      const subjectMatches = graph.match(subject1);
      const predicateMatches = graph.match(null, predicate1);
      const objectMatches = graph.match(null, null, object1);

      expect(subjectMatches).toContain(triple1);
      expect(predicateMatches).toContain(triple1);
      expect(objectMatches).toContain(triple1);
    });
  });

  describe("remove", () => {
    beforeEach(() => {
      graph.add(triple1);
      graph.add(triple2);
      graph.add(triple3);
    });

    it("should remove existing triple", () => {
      // When
      graph.remove(triple1);

      // Then
      expect(graph.size()).toBe(2);
      expect(graph.has(triple1)).toBe(false);
      expect(graph.has(triple2)).toBe(true);
      expect(graph.has(triple3)).toBe(true);
    });

    it("should not affect size when removing non-existent triple", () => {
      // Given
      const nonExistentTriple = new Triple(
        new IRI("http://example.org/nonexistent"),
        predicate1,
        object1,
      );

      // When
      graph.remove(nonExistentTriple);

      // Then
      expect(graph.size()).toBe(3);
    });

    it("should clean up indexes when removing triples", () => {
      // Given
      expect(graph.match(subject1).length).toBe(2); // triple1 and triple2

      // When
      graph.remove(triple1);
      graph.remove(triple2);

      // Then
      expect(graph.match(subject1).length).toBe(0);
      expect(graph.match(null, predicate1).length).toBe(1); // only triple3
    });

    it("should remove all occurrences of a triple", () => {
      // Given - add same triple multiple times (shouldn't happen, but test edge case)
      const originalSize = graph.size();

      // When
      graph.remove(triple1);

      // Then
      expect(graph.size()).toBe(originalSize - 1);
      expect(graph.has(triple1)).toBe(false);
    });
  });

  describe("has", () => {
    beforeEach(() => {
      graph.add(triple1);
      graph.add(triple2);
    });

    it("should return true for existing triple", () => {
      // When & Then
      expect(graph.has(triple1)).toBe(true);
      expect(graph.has(triple2)).toBe(true);
    });

    it("should return false for non-existing triple", () => {
      // Given
      const nonExistentTriple = new Triple(
        new IRI("http://example.org/nonexistent"),
        predicate1,
        object1,
      );

      // When & Then
      expect(graph.has(nonExistentTriple)).toBe(false);
    });

    it("should handle triples with blank nodes", () => {
      // Given
      const blankSubject = new BlankNode();
      const blankObject = new BlankNode();
      const blankTriple = new Triple(blankSubject, predicate1, blankObject);

      // When
      graph.add(blankTriple);

      // Then
      expect(graph.has(blankTriple)).toBe(true);
    });
  });

  describe("match", () => {
    beforeEach(() => {
      graph.add(triple1); // subject1, predicate1, object1
      graph.add(triple2); // subject1, predicate2, object2
      graph.add(triple3); // subject2, predicate1, object1
    });

    it("should match exact triple (S P O)", () => {
      // When
      const matches = graph.match(subject1, predicate1, object1);

      // Then
      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(triple1);
    });

    it("should match by subject and predicate (S P ?)", () => {
      // When
      const matches = graph.match(subject1, predicate1);

      // Then
      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(triple1);
    });

    it("should match by predicate and object (? P O)", () => {
      // When
      const matches = graph.match(null, predicate1, object1);

      // Then
      expect(matches).toHaveLength(2);
      expect(matches).toContain(triple1);
      expect(matches).toContain(triple3);
    });

    it("should match by subject and object (S ? O)", () => {
      // When
      const matches = graph.match(subject1, null, object1);

      // Then
      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(triple1);
    });

    it("should match by subject only (S ? ?)", () => {
      // When
      const matches = graph.match(subject1);

      // Then
      expect(matches).toHaveLength(2);
      expect(matches).toContain(triple1);
      expect(matches).toContain(triple2);
    });

    it("should match by predicate only (? P ?)", () => {
      // When
      const matches = graph.match(null, predicate1);

      // Then
      expect(matches).toHaveLength(2);
      expect(matches).toContain(triple1);
      expect(matches).toContain(triple3);
    });

    it("should match by object only (? ? O)", () => {
      // When
      const matches = graph.match(null, null, object1);

      // Then
      expect(matches).toHaveLength(2);
      expect(matches).toContain(triple1);
      expect(matches).toContain(triple3);
    });

    it("should return all triples for wildcard query (? ? ?)", () => {
      // When
      const matches = graph.match();

      // Then
      expect(matches).toHaveLength(3);
      expect(matches).toContain(triple1);
      expect(matches).toContain(triple2);
      expect(matches).toContain(triple3);
    });

    it("should return empty array for no matches", () => {
      // Given
      const nonExistentSubject = new IRI("http://example.org/nonexistent");

      // When
      const matches = graph.match(nonExistentSubject);

      // Then
      expect(matches).toEqual([]);
    });
  });

  describe("subjects", () => {
    beforeEach(() => {
      graph.add(triple1); // subject1
      graph.add(triple2); // subject1
      graph.add(triple3); // subject2
    });

    it("should return all unique subjects", () => {
      // When
      const subjects = graph.subjects();

      // Then
      expect(subjects.size).toBe(2);
      expect(subjects.has(subject1)).toBe(true);
      expect(subjects.has(subject2)).toBe(true);
    });

    it("should return empty set for empty graph", () => {
      // Given
      const emptyGraph = new Graph();

      // When
      const subjects = emptyGraph.subjects();

      // Then
      expect(subjects.size).toBe(0);
    });

    it("should handle blank node subjects", () => {
      // Given
      const blankSubject = new BlankNode();
      const tripleWithBlank = new Triple(blankSubject, predicate1, object1);
      graph.add(tripleWithBlank);

      // When
      const subjects = graph.subjects();

      // Then
      expect(subjects.size).toBe(3); // subject1, subject2, blankSubject
      expect(subjects.has(blankSubject)).toBe(true);
    });
  });

  describe("predicates", () => {
    beforeEach(() => {
      graph.add(triple1); // predicate1
      graph.add(triple2); // predicate2
      graph.add(triple3); // predicate1
    });

    it("should return all unique predicates", () => {
      // When
      const predicates = graph.predicates();

      // Then
      expect(predicates.size).toBe(2);
      expect(predicates.has(predicate1)).toBe(true);
      expect(predicates.has(predicate2)).toBe(true);
    });

    it("should return empty set for empty graph", () => {
      // Given
      const emptyGraph = new Graph();

      // When
      const predicates = emptyGraph.predicates();

      // Then
      expect(predicates.size).toBe(0);
    });
  });

  describe("objects", () => {
    beforeEach(() => {
      graph.add(triple1); // object1 (IRI)
      graph.add(triple2); // object2 (Literal)
      graph.add(triple3); // object1 (IRI)
    });

    it("should return all unique objects", () => {
      // When
      const objects = graph.objects();

      // Then
      expect(objects.size).toBe(2);
      expect(objects.has(object1)).toBe(true);
      expect(objects.has(object2)).toBe(true);
    });

    it("should handle different object types", () => {
      // Given
      const blankObject = new BlankNode();
      const tripleWithBlank = new Triple(subject1, predicate1, blankObject);
      graph.add(tripleWithBlank);

      // When
      const objects = graph.objects();

      // Then
      expect(objects.size).toBe(3); // object1, object2, blankObject
      expect(objects.has(blankObject)).toBe(true);
    });
  });

  describe("size and isEmpty", () => {
    it("should return 0 for empty graph", () => {
      // When & Then
      expect(graph.size()).toBe(0);
      expect(graph.isEmpty()).toBe(true);
    });

    it("should return correct size after adding triples", () => {
      // When
      graph.add(triple1);
      graph.add(triple2);

      // Then
      expect(graph.size()).toBe(2);
      expect(graph.isEmpty()).toBe(false);
    });

    it("should return correct size after removing triples", () => {
      // Given
      graph.add(triple1);
      graph.add(triple2);
      graph.add(triple3);

      // When
      graph.remove(triple2);

      // Then
      expect(graph.size()).toBe(2);
      expect(graph.isEmpty()).toBe(false);
    });
  });

  describe("clear", () => {
    beforeEach(() => {
      graph.add(triple1);
      graph.add(triple2);
      graph.add(triple3);
    });

    it("should remove all triples", () => {
      // When
      graph.clear();

      // Then
      expect(graph.size()).toBe(0);
      expect(graph.isEmpty()).toBe(true);
      expect(graph.toArray()).toEqual([]);
    });

    it("should clear all indexes", () => {
      // When
      graph.clear();

      // Then
      expect(graph.match()).toEqual([]);
      expect(graph.subjects().size).toBe(0);
      expect(graph.predicates().size).toBe(0);
      expect(graph.objects().size).toBe(0);
    });

    it("should allow adding triples after clear", () => {
      // When
      graph.clear();
      graph.add(triple1);

      // Then
      expect(graph.size()).toBe(1);
      expect(graph.has(triple1)).toBe(true);
    });
  });

  describe("merge", () => {
    it("should merge another graph", () => {
      // Given
      graph.add(triple1);
      const otherGraph = new Graph([triple2, triple3]);

      // When
      graph.merge(otherGraph);

      // Then
      expect(graph.size()).toBe(3);
      expect(graph.has(triple1)).toBe(true);
      expect(graph.has(triple2)).toBe(true);
      expect(graph.has(triple3)).toBe(true);
    });

    it("should handle overlapping triples", () => {
      // Given
      graph.add(triple1);
      graph.add(triple2);
      const otherGraph = new Graph([triple2, triple3]);

      // When
      graph.merge(otherGraph);

      // Then
      expect(graph.size()).toBe(3); // triple2 not duplicated
      expect(graph.has(triple1)).toBe(true);
      expect(graph.has(triple2)).toBe(true);
      expect(graph.has(triple3)).toBe(true);
    });

    it("should merge empty graph", () => {
      // Given
      graph.add(triple1);
      const emptyGraph = new Graph();

      // When
      graph.merge(emptyGraph);

      // Then
      expect(graph.size()).toBe(1);
      expect(graph.has(triple1)).toBe(true);
    });

    it("should not affect original graph being merged", () => {
      // Given
      const otherGraph = new Graph([triple2]);

      // When
      graph.merge(otherGraph);
      graph.add(triple1);

      // Then
      expect(otherGraph.size()).toBe(1);
      expect(otherGraph.has(triple1)).toBe(false);
    });
  });

  describe("filter", () => {
    beforeEach(() => {
      graph.add(triple1); // subject1, predicate1, object1
      graph.add(triple2); // subject1, predicate2, object2
      graph.add(triple3); // subject2, predicate1, object1
    });

    it("should create filtered graph by subject", () => {
      // When
      const filtered = graph.filter(subject1);

      // Then
      expect(filtered.size()).toBe(2);
      expect(filtered.has(triple1)).toBe(true);
      expect(filtered.has(triple2)).toBe(true);
      expect(filtered.has(triple3)).toBe(false);
    });

    it("should create filtered graph by predicate", () => {
      // When
      const filtered = graph.filter(null, predicate1);

      // Then
      expect(filtered.size()).toBe(2);
      expect(filtered.has(triple1)).toBe(true);
      expect(filtered.has(triple2)).toBe(false);
      expect(filtered.has(triple3)).toBe(true);
    });

    it("should create filtered graph by object", () => {
      // When
      const filtered = graph.filter(null, null, object1);

      // Then
      expect(filtered.size()).toBe(2);
      expect(filtered.has(triple1)).toBe(true);
      expect(filtered.has(triple2)).toBe(false);
      expect(filtered.has(triple3)).toBe(true);
    });

    it("should not modify original graph", () => {
      // When
      const filtered = graph.filter(subject1);
      filtered.add(new Triple(subject2, predicate2, object2));

      // Then
      expect(graph.size()).toBe(3); // Original unchanged
      expect(filtered.size()).toBe(3); // Filtered graph has new triple
    });
  });

  describe("toArray", () => {
    it("should return empty array for empty graph", () => {
      // When
      const array = graph.toArray();

      // Then
      expect(array).toEqual([]);
    });

    it("should return all triples as array", () => {
      // Given
      graph.add(triple1);
      graph.add(triple2);

      // When
      const array = graph.toArray();

      // Then
      expect(array).toHaveLength(2);
      expect(array).toContain(triple1);
      expect(array).toContain(triple2);
    });

    it("should return new array instance", () => {
      // Given
      graph.add(triple1);

      // When
      const array1 = graph.toArray();
      const array2 = graph.toArray();

      // Then
      expect(array1).not.toBe(array2);
      expect(array1).toEqual(array2);
    });
  });

  describe("toString", () => {
    it("should return empty string for empty graph", () => {
      // When
      const str = graph.toString();

      // Then
      expect(str).toBe("");
    });

    it("should return string representation of triples", () => {
      // Given
      graph.add(triple1);

      // When
      const str = graph.toString();

      // Then
      expect(str).toContain(triple1.toString());
    });

    it("should separate multiple triples with newlines", () => {
      // Given
      graph.add(triple1);
      graph.add(triple2);

      // When
      const str = graph.toString();

      // Then
      expect(str).toContain("\n");
      expect(str.split("\n")).toHaveLength(2);
    });
  });

  describe("clone", () => {
    beforeEach(() => {
      graph.add(triple1);
      graph.add(triple2);
    });

    it("should create identical copy", () => {
      // When
      const cloned = graph.clone();

      // Then
      expect(cloned.size()).toBe(graph.size());
      expect(cloned.has(triple1)).toBe(true);
      expect(cloned.has(triple2)).toBe(true);
      expect(cloned.equals(graph)).toBe(true);
    });

    it("should create independent copy", () => {
      // Given
      const cloned = graph.clone();

      // When
      cloned.add(triple3);
      graph.remove(triple1);

      // Then
      expect(cloned.has(triple3)).toBe(true);
      expect(graph.has(triple3)).toBe(false);
      expect(cloned.has(triple1)).toBe(true);
      expect(graph.has(triple1)).toBe(false);
    });
  });

  describe("equals", () => {
    let graph1: Graph;
    let graph2: Graph;

    beforeEach(() => {
      graph1 = new Graph();
      graph2 = new Graph();
    });

    it("should return true for empty graphs", () => {
      // When & Then
      expect(graph1.equals(graph2)).toBe(true);
    });

    it("should return true for graphs with same triples", () => {
      // Given
      graph1.add(triple1);
      graph1.add(triple2);
      graph2.add(triple2);
      graph2.add(triple1);

      // When & Then
      expect(graph1.equals(graph2)).toBe(true);
    });

    it("should return false for graphs with different sizes", () => {
      // Given
      graph1.add(triple1);
      graph2.add(triple1);
      graph2.add(triple2);

      // When & Then
      expect(graph1.equals(graph2)).toBe(false);
    });

    it("should return false for graphs with different triples", () => {
      // Given
      graph1.add(triple1);
      graph2.add(triple2);

      // When & Then
      expect(graph1.equals(graph2)).toBe(false);
    });

    it("should return true for graph compared with itself", () => {
      // Given
      graph1.add(triple1);
      graph1.add(triple2);

      // When & Then
      expect(graph1.equals(graph1)).toBe(true);
    });

    it("should handle large graphs efficiently", () => {
      // Given
      for (let i = 0; i < 100; i++) {
        const subject = new IRI(`http://example.org/s${i}`);
        const predicate = new IRI(`http://example.org/p${i}`);
        const object = new IRI(`http://example.org/o${i}`);
        const triple = new Triple(subject, predicate, object);
        graph1.add(triple);
        graph2.add(triple);
      }

      // When
      const start = performance.now();
      const result = graph1.equals(graph2);
      const duration = performance.now() - start;

      // Then
      expect(result).toBe(true);
      expect(duration).toBeLessThan(100); // Should be reasonably fast
    });
  });

  describe("Edge Cases and Performance", () => {
    it("should handle triples with very long IRIs", () => {
      // Given
      const longIRI = "http://example.org/" + "a".repeat(10000);
      const longSubject = new IRI(longIRI);
      const longTriple = new Triple(longSubject, predicate1, object1);

      // When
      graph.add(longTriple);

      // Then
      expect(graph.has(longTriple)).toBe(true);
      expect(graph.match(longSubject)).toContain(longTriple);
    });

    it("should handle many blank nodes", () => {
      // Given
      const blankTriples: Triple[] = [];
      for (let i = 0; i < 100; i++) {
        const subject = new BlankNode();
        const object = new BlankNode();
        blankTriples.push(new Triple(subject, predicate1, object));
      }

      // When
      blankTriples.forEach((t) => graph.add(t));

      // Then
      expect(graph.size()).toBe(100);
      blankTriples.forEach((t) => {
        expect(graph.has(t)).toBe(true);
      });
    });

    it("should handle complex literal objects", () => {
      // Given
      const complexLiterals = [
        new Literal("simple string"),
        new Literal("string with \n newlines \t tabs"),
        new Literal('{"json": "value"}'),
        new Literal("<xml>content</xml>"),
        new Literal("unicode: 你好世界 🌍"),
        Literal.integer(42),
        Literal.double(3.14159),
        Literal.boolean(true),
        Literal.dateTime(new Date()),
        Literal.langString("Hello", "en"),
      ];

      // When
      complexLiterals.forEach((literal, i) => {
        const triple = new Triple(
          new IRI(`http://example.org/s${i}`),
          predicate1,
          literal,
        );
        graph.add(triple);
      });

      // Then
      expect(graph.size()).toBe(complexLiterals.length);
      expect(graph.objects().size).toBe(complexLiterals.length);
    });

    it("should maintain performance with large graphs", () => {
      // Given
      const tripleCount = 1000;
      const start = performance.now();

      // When - add many triples
      for (let i = 0; i < tripleCount; i++) {
        const subject = new IRI(`http://example.org/s${i}`);
        const predicate = new IRI(`http://example.org/p${i % 10}`); // Reuse some predicates
        const object = new IRI(`http://example.org/o${i % 20}`); // Reuse some objects
        graph.add(new Triple(subject, predicate, object));
      }

      const addDuration = performance.now() - start;

      // Then - verify operations are still efficient
      expect(graph.size()).toBe(tripleCount);
      expect(addDuration).toBeLessThan(1000); // Should be reasonably fast

      // Test query performance
      const queryStart = performance.now();
      const matches = graph.match(null, new IRI("http://example.org/p0"));
      const queryDuration = performance.now() - queryStart;

      expect(matches.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(100);
    });
  });
});
