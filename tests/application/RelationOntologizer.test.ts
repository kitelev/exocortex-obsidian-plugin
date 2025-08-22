import { RelationOntologizer } from "../../src/application/services/RelationOntologizer";
import {
  RelationAsset,
  RelationAssetHelper,
} from "../../src/domain/entities/RelationAsset";
import { App, TFile } from "obsidian";

describe("RelationOntologizer", () => {
  let ontologizer: RelationOntologizer;
  let mockApp: any;
  let mockFile: TFile;

  beforeEach(() => {
    // Setup mock app
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        create: jest.fn(),
        modify: jest.fn(),
        read: jest.fn(),
        createFolder: jest.fn(),
        getAbstractFileByPath: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
      },
    };

    ontologizer = new RelationOntologizer(mockApp);

    // Setup mock file
    mockFile = {
      basename: "TestAsset",
      path: "test/TestAsset.md",
      name: "TestAsset.md",
      extension: "md",
    } as TFile;
  });

  describe("Asset Ontologization", () => {
    test("should extract object properties as relations", async () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-123",
          exo__Asset_relates: ["[[Project A]]", "[[Task B]]"],
          ems__Task_project: "[[Project C]]",
          ems__Task_assignedTo: "[[Person D]]",
          title: "Test Asset", // Should be ignored (not object property)
          status: "active", // Should be ignored
        },
      });

      const relations = await ontologizer.ontologizeAsset(mockFile);

      expect(relations).toHaveLength(4);

      // Check first relation
      expect(relations[0].subject).toBe("asset-123");
      expect(relations[0].predicate).toBe("exo__Asset_relates");
      expect(relations[0].object).toBe("Project A");
      expect(relations[0].type).toBe("adapter__Relation");

      // Check that all relations have required fields
      relations.forEach((rel) => {
        expect(rel.uid).toBeDefined();
        expect(rel.createdAt).toBeInstanceOf(Date);
        expect(rel.isDefinedBy).toBeDefined();
        expect(rel.provenance).toContain("ontologized from");
      });
    });

    test("should handle assets without UID", async () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_relates: "[[Other Asset]]",
        },
      });

      const relations = await ontologizer.ontologizeAsset(mockFile);

      expect(relations).toHaveLength(1);
      expect(relations[0].subject).toBe("TestAsset"); // Uses basename as fallback
    });

    test("should skip meta properties", async () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-123",
          exo__Asset_createdAt: "2025-01-01",
          exo__Instance_class: "[[ems__Task]]",
          tags: ["tag1", "tag2"],
        },
      });

      const relations = await ontologizer.ontologizeAsset(mockFile);

      expect(relations).toHaveLength(0); // All are meta properties
    });

    test("should handle empty frontmatter", async () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: null,
      });

      const relations = await ontologizer.ontologizeAsset(mockFile);

      expect(relations).toHaveLength(0);
    });
  });

  describe("RelationAssetHelper", () => {
    test("should create relation with all fields", () => {
      const relation = RelationAssetHelper.create({
        subject: "task-1",
        predicate: "ems__Task_project",
        object: "project-1",
        confidence: 0.9,
        provenance: "test",
      });

      expect(relation.uid).toBeDefined();
      expect(relation.type).toBe("adapter__Relation");
      expect(relation.subject).toBe("task-1");
      expect(relation.predicate).toBe("ems__Task_project");
      expect(relation.object).toBe("project-1");
      expect(relation.confidence).toBe(0.9);
      expect(relation.provenance).toBe("test");
      expect(relation.isDefinedBy).toBe("ems");
    });

    test("should create bidirectional relations", () => {
      const [forward, inverse] = RelationAssetHelper.createBidirectional({
        subject: "task-1",
        predicate: "ems__Task_project",
        object: "project-1",
      });

      // Check forward relation
      expect(forward.subject).toBe("task-1");
      expect(forward.object).toBe("project-1");
      expect(forward.predicate).toBe("ems__Task_project");
      expect(forward.inverseOf).toBe(inverse.uid);

      // Check inverse relation
      expect(inverse.subject).toBe("project-1");
      expect(inverse.object).toBe("task-1");
      expect(inverse.predicate).toBe("ems__Project_hasTasks");
      expect(inverse.inverseOf).toBe(forward.uid);
    });

    test("should get correct inverse predicates", () => {
      expect(RelationAssetHelper.getInversePredicate("ems__Task_project")).toBe(
        "ems__Project_hasTasks",
      );

      expect(RelationAssetHelper.getInversePredicate("ems__partOf")).toBe(
        "ems__hasPart",
      );

      expect(RelationAssetHelper.getInversePredicate("exo__subClassOf")).toBe(
        "exo__superClassOf",
      );

      // Test unknown predicate
      expect(
        RelationAssetHelper.getInversePredicate("custom__unknownProp"),
      ).toBe("custom__inverseOf_unknownProp");
    });

    test("should extract ontology from predicate", () => {
      expect(RelationAssetHelper.extractOntology("ems__Task_project")).toBe(
        "ems",
      );
      expect(RelationAssetHelper.extractOntology("exo__Asset_relates")).toBe(
        "exo",
      );
      expect(RelationAssetHelper.extractOntology("rdf:type")).toBe("rdf");
      expect(RelationAssetHelper.extractOntology("unknownProp")).toBe("exo");
    });

    test("should convert to frontmatter", () => {
      const relation: RelationAsset = {
        uid: "rel-123",
        type: "adapter__Relation",
        subject: "task-1",
        predicate: "ems__Task_project",
        object: "project-1",
        createdAt: new Date("2025-01-01T10:00:00Z"),
        isDefinedBy: "ems",
        confidence: 0.95,
        provenance: "manual",
        inverseOf: "rel-456",
      };

      const frontmatter = RelationAssetHelper.toFrontmatter(relation);

      expect(frontmatter["exo__Instance_class"]).toBe("[[adapter__Relation]]");
      expect(frontmatter["exo__Asset_uid"]).toBe("rel-123");
      expect(frontmatter["adapter__Relation_subject"]).toBe("[[task-1]]");
      expect(frontmatter["adapter__Relation_predicate"]).toBe(
        "ems__Task_project",
      );
      expect(frontmatter["adapter__Relation_object"]).toBe("[[project-1]]");
      expect(frontmatter["adapter__Relation_confidence"]).toBe(0.95);
      expect(frontmatter["adapter__Relation_inverseOf"]).toBe("rel-456");
    });

    test("should generate valid filename", () => {
      const relation: RelationAsset = {
        uid: "rel-123",
        type: "adapter__Relation",
        subject: "Very Long Task Name That Should Be Truncated",
        predicate: "ems__Task_project",
        object: "Project With Special!@#$%^&*() Characters",
        createdAt: new Date("2025-01-01T10:00:00Z"),
        isDefinedBy: "ems",
      };

      const filename = RelationAssetHelper.generateFilename(relation);

      expect(filename).toContain("Relation_");
      expect(filename).toContain("ems__Task_project");
      expect(filename).toContain(".md");
      expect(filename.length).toBeLessThan(255); // Max filename length
    });
  });

  describe("Vault Migration", () => {
    test("should migrate entire vault", async () => {
      const mockFiles = [
        { path: "file1.md", basename: "file1" } as TFile,
        { path: "file2.md", basename: "file2" } as TFile,
        { path: "99 Relations/existing.md", basename: "existing" } as TFile, // Should skip
      ];

      mockApp.vault.getMarkdownFiles.mockReturnValue(mockFiles);

      // Mock file1 with relations
      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        if (file.basename === "file1") {
          return {
            frontmatter: {
              exo__Asset_relates: "[[file2]]",
            },
          };
        }
        return { frontmatter: {} };
      });

      // Mock file content for cleaning
      mockApp.vault.read.mockResolvedValue(`---
exo__Asset_relates: "[[file2]]"
title: "File 1"
---

# Content`);

      const progressCallback = jest.fn();
      const result = await ontologizer.migrateVault(progressCallback);

      expect(result.assetsProcessed).toBe(3);
      expect(result.relationsCreated).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Check progress callback was called
      expect(progressCallback).toHaveBeenCalledWith(1, 3);
      expect(progressCallback).toHaveBeenCalledWith(2, 3);
    });
  });
});
