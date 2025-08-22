/**
 * Unit tests for KnowledgeObject semantic entity
 */

import { KnowledgeObject } from "../../../../src/domain/semantic/entities/KnowledgeObject";
import {
  IRI,
  Literal,
  EXO,
  EMS,
} from "../../../../src/domain/semantic/core/Triple";
import { Graph } from "../../../../src/domain/semantic/core/Graph";

describe("KnowledgeObject", () => {
  describe("creation", () => {
    it("should create a knowledge object with required properties", () => {
      const result = KnowledgeObject.create(EMS.Task);

      expect(result.isSuccess).toBe(true);
      const ko = result.getValue();

      expect(ko.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(ko.type.toString()).toBe(EMS.Task.toString());
      expect(ko.createdAt).toBeInstanceOf(Date);
      expect(ko.updatedAt).toBeInstanceOf(Date);
    });

    it("should create with initial properties", () => {
      const props = new Map<IRI, any>([
        [new IRI("https://example.org/label"), "Test Task"],
        [new IRI("https://example.org/priority"), 5],
        [new IRI("https://example.org/done"), true],
      ]);

      const result = KnowledgeObject.create(EMS.Task, props);

      expect(result.isSuccess).toBe(true);
      const ko = result.getValue();

      expect(ko.getProperty(new IRI("https://example.org/label"))).toBe(
        "Test Task",
      );
      expect(ko.getProperty(new IRI("https://example.org/priority"))).toBe(5);
      expect(ko.getProperty(new IRI("https://example.org/done"))).toBe(true);
    });

    it("should create with markdown content", () => {
      const content = "# Task Description\n\nThis is the task content.";
      const result = KnowledgeObject.create(EMS.Task, undefined, content);

      expect(result.isSuccess).toBe(true);
      const ko = result.getValue();

      expect(ko.content).toBe(content);
    });
  });

  describe("property management", () => {
    let ko: KnowledgeObject;

    beforeEach(() => {
      ko = KnowledgeObject.create(EMS.Task).getValue();
    });

    it("should set and get string properties", () => {
      const predicate = new IRI("https://example.org/title");
      ko.setProperty(predicate, "My Task");

      expect(ko.getProperty(predicate)).toBe("My Task");
    });

    it("should set and get numeric properties", () => {
      const predicate = new IRI("https://example.org/score");
      ko.setProperty(predicate, 42.5);

      expect(ko.getProperty(predicate)).toBe(42.5);
    });

    it("should set and get boolean properties", () => {
      const predicate = new IRI("https://example.org/completed");
      ko.setProperty(predicate, false);

      expect(ko.getProperty(predicate)).toBe(false);
    });

    it("should set and get date properties", () => {
      const predicate = new IRI("https://example.org/dueDate");
      const date = new Date("2024-12-31");
      ko.setProperty(predicate, date);

      const retrieved = ko.getProperty(predicate);
      expect(retrieved).toBeInstanceOf(Date);
      expect(retrieved.toISOString()).toBe(date.toISOString());
    });

    it("should handle multi-valued properties", () => {
      const predicate = new IRI("https://example.org/tags");

      ko.addProperty(predicate, "urgent");
      ko.addProperty(predicate, "important");
      ko.addProperty(predicate, "review");

      const tags = ko.getProperties(predicate);
      expect(tags).toHaveLength(3);
      expect(tags).toContain("urgent");
      expect(tags).toContain("important");
      expect(tags).toContain("review");
    });

    it("should remove specific property value", () => {
      const predicate = new IRI("https://example.org/tags");

      ko.addProperty(predicate, "tag1");
      ko.addProperty(predicate, "tag2");
      ko.addProperty(predicate, "tag3");

      ko.removeProperty(predicate, "tag2");

      const tags = ko.getProperties(predicate);
      expect(tags).toHaveLength(2);
      expect(tags).toContain("tag1");
      expect(tags).toContain("tag3");
      expect(tags).not.toContain("tag2");
    });

    it("should remove all values for a property", () => {
      const predicate = new IRI("https://example.org/tags");

      ko.addProperty(predicate, "tag1");
      ko.addProperty(predicate, "tag2");

      ko.removeProperty(predicate);

      const tags = ko.getProperties(predicate);
      expect(tags).toHaveLength(0);
    });

    it("should update timestamp when properties change", () => {
      const originalTime = ko.updatedAt;

      // Wait a bit to ensure time difference
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      ko.setProperty(new IRI("https://example.org/test"), "value");

      expect(ko.updatedAt.getTime()).toBeGreaterThan(originalTime.getTime());

      jest.useRealTimers();
    });
  });

  describe("relationships", () => {
    let ko1: KnowledgeObject;
    let ko2: KnowledgeObject;

    beforeEach(() => {
      ko1 = KnowledgeObject.create(EMS.Task).getValue();
      ko2 = KnowledgeObject.create(EMS.Project).getValue();
    });

    it("should add relationship to another object", () => {
      const predicate = new IRI("https://example.org/partOf");
      ko1.addRelation(predicate, ko2.uuid);

      const relations = ko1.getRelations(predicate);
      expect(relations).toHaveLength(1);
      expect(relations[0]).toBe(ko2.uuid);
    });

    it("should add multiple relationships", () => {
      const ko3 = KnowledgeObject.create(EMS.Task).getValue();
      const predicate = new IRI("https://example.org/relatedTo");

      ko1.addRelation(predicate, ko2.uuid);
      ko1.addRelation(predicate, ko3.uuid);

      const relations = ko1.getRelations(predicate);
      expect(relations).toHaveLength(2);
      expect(relations).toContain(ko2.uuid);
      expect(relations).toContain(ko3.uuid);
    });

    it("should remove relationship", () => {
      const predicate = new IRI("https://example.org/partOf");

      ko1.addRelation(predicate, ko2.uuid);
      expect(ko1.getRelations(predicate)).toHaveLength(1);

      ko1.removeRelation(predicate, ko2.uuid);
      expect(ko1.getRelations(predicate)).toHaveLength(0);
    });

    it("should handle UUID in property values", () => {
      const predicate = new IRI("https://example.org/assignedTo");
      const uuid = "123e4567-e89b-12d3-a456-426614174000";

      ko1.setProperty(predicate, uuid);

      // Should be stored as IRI reference
      const relations = ko1.getRelations(predicate);
      expect(relations).toHaveLength(1);
      expect(relations[0]).toBe(uuid);
    });
  });

  describe("content management", () => {
    it("should set and get content", () => {
      const ko = KnowledgeObject.create(EMS.Task).getValue();
      const content = "# Task\n\n- Item 1\n- Item 2";

      ko.setContent(content);
      expect(ko.content).toBe(content);
    });

    it("should update timestamp when content changes", () => {
      const ko = KnowledgeObject.create(EMS.Task).getValue();
      const originalTime = ko.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      ko.setContent("New content");

      expect(ko.updatedAt.getTime()).toBeGreaterThan(originalTime.getTime());

      jest.useRealTimers();
    });
  });

  describe("graph operations", () => {
    it("should export to graph", () => {
      const props = new Map<IRI, any>([
        [new IRI("https://example.org/label"), "Test"],
        [new IRI("https://example.org/priority"), 1],
      ]);

      const ko = KnowledgeObject.create(EMS.Task, props).getValue();
      const graph = ko.getGraph();

      expect(graph.size()).toBeGreaterThan(0);

      // Check for required triples
      const subject = ko.subject;
      const typeTriples = graph.match(
        subject,
        new IRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        null,
      );
      expect(typeTriples).toHaveLength(1);
      expect(typeTriples[0].getObject().toString()).toBe(EMS.Task.toString());
    });

    it("should export to N-Triples format", () => {
      const ko = KnowledgeObject.create(EMS.Task).getValue();
      const ntriples = ko.toNTriples();

      expect(ntriples).toContain("urn:uuid:");
      expect(ntriples).toContain(
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      );
      expect(ntriples).toContain(EMS.Task.toString());
    });

    it("should reconstruct from graph", () => {
      const original = KnowledgeObject.create(EMS.Task).getValue();
      original.setProperty(new IRI("https://example.org/label"), "Test Task");
      original.setContent("Task content");

      const graph = original.getGraph();
      const result = KnowledgeObject.fromGraph(
        original.uuid,
        graph,
        original.content,
      );

      expect(result.isSuccess).toBe(true);
      const reconstructed = result.getValue();

      expect(reconstructed.uuid).toBe(original.uuid);
      expect(reconstructed.type.toString()).toBe(original.type.toString());
      expect(reconstructed.content).toBe(original.content);
      expect(
        reconstructed.getProperty(new IRI("https://example.org/label")),
      ).toBe("Test Task");
    });
  });

  describe("cloning", () => {
    it("should create independent clone", () => {
      const original = KnowledgeObject.create(EMS.Task).getValue();
      original.setProperty(new IRI("https://example.org/label"), "Original");

      const clone = original.clone();

      // Verify clone has same initial values
      expect(clone.uuid).toBe(original.uuid);
      expect(clone.getProperty(new IRI("https://example.org/label"))).toBe(
        "Original",
      );

      // Modify clone
      clone.setProperty(new IRI("https://example.org/label"), "Modified");

      // Original should be unchanged
      expect(original.getProperty(new IRI("https://example.org/label"))).toBe(
        "Original",
      );
      expect(clone.getProperty(new IRI("https://example.org/label"))).toBe(
        "Modified",
      );
    });
  });

  describe("getAllProperties", () => {
    it("should return all properties as a map", () => {
      const ko = KnowledgeObject.create(EMS.Task).getValue();

      ko.setProperty(new IRI("https://example.org/label"), "My Task");
      ko.setProperty(new IRI("https://example.org/priority"), 1);
      ko.addProperty(new IRI("https://example.org/tags"), "urgent");
      ko.addProperty(new IRI("https://example.org/tags"), "review");

      const allProps = ko.getAllProperties();

      // Should have core properties plus custom ones
      const hasUuid = Array.from(allProps.keys()).some(
        (k) => k.toString() === EXO.uuid.toString(),
      );
      const hasCreatedAt = Array.from(allProps.keys()).some(
        (k) => k.toString() === EXO.createdAt.toString(),
      );
      const hasUpdatedAt = Array.from(allProps.keys()).some(
        (k) => k.toString() === EXO.updatedAt.toString(),
      );
      const hasType = Array.from(allProps.keys()).some(
        (k) =>
          k.toString() === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      );

      expect(hasUuid).toBe(true);
      expect(hasCreatedAt).toBe(true);
      expect(hasUpdatedAt).toBe(true);
      expect(hasType).toBe(true);

      // Custom properties - need to find by string comparison
      const labelValues = Array.from(allProps.entries()).find(
        ([k, v]) => k.toString() === "https://example.org/label",
      )?.[1];
      const priorityValues = Array.from(allProps.entries()).find(
        ([k, v]) => k.toString() === "https://example.org/priority",
      )?.[1];
      const tagValues = Array.from(allProps.entries()).find(
        ([k, v]) => k.toString() === "https://example.org/tags",
      )?.[1];

      expect(labelValues).toEqual(["My Task"]);
      expect(priorityValues).toEqual([1]);
      // Multi-valued properties should have all values
      expect(tagValues).toContain("urgent");
      expect(tagValues?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    it("should handle null and undefined values gracefully", () => {
      const ko = KnowledgeObject.create(EMS.Task).getValue();
      const predicate = new IRI("https://example.org/test");

      const nullResult = ko.setProperty(predicate, null);
      expect(nullResult.isFailure).toBe(true);

      const undefinedResult = ko.setProperty(predicate, undefined);
      expect(undefinedResult.isFailure).toBe(true);
    });

    it("should handle complex objects as JSON", () => {
      const ko = KnowledgeObject.create(EMS.Task).getValue();
      const predicate = new IRI("https://example.org/metadata");
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          boolean: true,
        },
        string: "value",
      };

      ko.setProperty(predicate, complexObject);
      const retrieved = ko.getProperty(predicate);

      expect(retrieved).toEqual(complexObject);
    });

    it("should handle IRI values correctly", () => {
      const ko = KnowledgeObject.create(EMS.Task).getValue();
      const predicate = new IRI("https://example.org/seeAlso");
      const iriValue = new IRI("https://example.org/other-resource");

      ko.setProperty(predicate, iriValue);
      const retrieved = ko.getProperty(predicate);

      expect(retrieved).toBe(iriValue.toString());
    });
  });
});
