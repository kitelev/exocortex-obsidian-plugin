import { ObsidianAssetRepository } from "../../../src/infrastructure/repositories/ObsidianAssetRepository";
import { Asset } from "../../../src/domain/entities/Asset";
import { AssetId } from "../../../src/domain/value-objects/AssetId";
import { ClassName } from "../../../src/domain/value-objects/ClassName";
import { OntologyPrefix } from "../../../src/domain/value-objects/OntologyPrefix";
import { App, TFile } from "obsidian";

describe("ObsidianAssetRepository", () => {
  let repository: ObsidianAssetRepository;
  let mockApp: Partial<App>;
  let mockVault: any;
  let mockMetadataCache: any;

  beforeEach(() => {
    mockVault = {
      getMarkdownFiles: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
      modify: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    mockMetadataCache = {
      getFileCache: jest.fn(),
    };

    mockApp = {
      vault: mockVault as any,
      metadataCache: mockMetadataCache as any,
    };

    repository = new ObsidianAssetRepository(mockApp as App);
  });

  describe("findByFilename", () => {
    it("should find asset by filename with .md extension", async () => {
      const mockFile = new TFile("MyAsset.md");

      const mockFrontmatter = {
        exo__Asset_uid: "test-uuid",
        exo__Asset_label: "My Asset",
        exo__Instance_class: ["[[exo__TestClass]]"],
        exo__Asset_isDefinedBy: "[[exo]]",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });

      const asset = await repository.findByFilename("MyAsset.md");

      expect(asset).not.toBeNull();
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(
        "MyAsset.md",
      );
    });

    it("should find asset by filename without .md extension", async () => {
      const mockFile = new TFile("MyAsset.md");

      const mockFrontmatter = {
        exo__Asset_uid: "test-uuid",
        exo__Asset_label: "My Asset",
        exo__Instance_class: ["[[exo__TestClass]]"],
        exo__Asset_isDefinedBy: "[[exo]]",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });

      const asset = await repository.findByFilename("MyAsset");

      expect(asset).not.toBeNull();
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(
        "MyAsset.md",
      );
    });

    it.skip("should search all files if not found by path", async () => {
      // Create file with matching name
      const mockFile1 = new TFile("MyAsset.md");
      const mockFile2 = new TFile("OtherAsset.md");
      const mockFiles = [mockFile2, mockFile1]; // The one we want is second

      const mockFrontmatter = {
        exo__Asset_uid: "test-uuid",
        exo__Asset_label: "My Asset",
        exo__Instance_class: ["[[exo__TestClass]]"],
        exo__Asset_isDefinedBy: "[[exo]]",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);

      // Mock getFileCache to return frontmatter only for the right file
      mockMetadataCache.getFileCache.mockImplementation((file) => {
        if (file && file.name === "MyAsset.md") {
          return { frontmatter: mockFrontmatter };
        }
        return null;
      });

      const asset = await repository.findByFilename("MyAsset.md");

      expect(asset).not.toBeNull();
      expect(mockVault.getMarkdownFiles).toHaveBeenCalled();
    });

    it("should return null if asset not found", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue([]);

      const asset = await repository.findByFilename("NonExistent.md");

      expect(asset).toBeNull();
    });

    it("should handle special characters in filename", async () => {
      const mockFile = new TFile("John O'Brien.md");

      const mockFrontmatter = {
        exo__Asset_uid: "test-uuid",
        exo__Asset_label: "John O'Brien",
        exo__Instance_class: ["[[exo__Person]]"],
        exo__Asset_isDefinedBy: "[[exo]]",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });

      const asset = await repository.findByFilename("John O'Brien");

      expect(asset).not.toBeNull();
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(
        "John O'Brien.md",
      );
    });
  });

  describe("findById", () => {
    it("should find asset by UUID", async () => {
      const mockFiles = [new TFile("Asset1.md"), new TFile("Asset2.md")];

      const targetFrontmatter = {
        exo__Asset_uid: "target-uuid",
        exo__Asset_label: "Target Asset",
        exo__Instance_class: ["[[exo__Asset]]"],
        exo__Asset_isDefinedBy: "[[exo]]",
      };

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file: any) => {
        if (file.path === "Asset2.md") {
          return { frontmatter: targetFrontmatter };
        }
        return {
          frontmatter: {
            exo__Asset_uid: "other-uuid",
            exo__Asset_label: "Other Asset",
            exo__Instance_class: ["[[exo__Asset]]"],
            exo__Asset_isDefinedBy: "[[exo]]",
          },
        };
      });

      const assetId = AssetId.create("target-uuid").getValue()!;
      const asset = await repository.findById(assetId);

      expect(asset).not.toBeNull();
      expect(asset?.getId().toString()).toBe("target-uuid");
    });
  });

  describe("save", () => {
    it("should save asset with correct filename", async () => {
      const asset = Asset.create({
        id: AssetId.generate(),
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
        properties: {},
      }).getValue()!;

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue([]);

      await repository.save(asset);

      expect(mockVault.create).toHaveBeenCalledWith(
        "Test Asset.md",
        expect.stringContaining("exo__Asset_uid"),
      );
    });

    it("should update existing asset and preserve content", async () => {
      const asset = Asset.create({
        id: AssetId.generate(),
        label: "Existing Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
        properties: {},
      }).getValue()!;

      const mockFile = new TFile("Existing Asset.md");
      const existingContent = `---
exo__Asset_uid: old-id
exo__Asset_label: Existing Asset
---

# Some content

This content should be preserved`;

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockVault.read.mockResolvedValue(existingContent);

      await repository.save(asset);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("# Some content"),
      );
      expect(mockVault.create).not.toHaveBeenCalled();
    });
  });

  describe("updateFrontmatterByPath", () => {
    it("should update frontmatter for file with existing frontmatter", async () => {
      const filePath = "test/file.md";
      const mockFile = new TFile(filePath);
      const originalContent = `---
title: Original Title
status: pending
---

# Content

This is the body content.`;

      const expectedContent = `---
title: Original Title
status: completed
---

# Content

This is the body content.`;

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(originalContent);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          title: "Original Title",
          status: "pending",
        },
      } as any);

      await repository.updateFrontmatterByPath(filePath, {
        status: "completed",
      });

      expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
    });

    it("should create frontmatter for file without frontmatter", async () => {
      const filePath = "test/file.md";
      const mockFile = new TFile(filePath);
      const originalContent = `# Content

This is a file without frontmatter.`;

      const expectedContent = `---
status: completed
---
# Content

This is a file without frontmatter.`;

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(originalContent);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      } as any);

      await repository.updateFrontmatterByPath(filePath, {
        status: "completed",
      });

      expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
    });

    it("should handle special characters in values correctly", async () => {
      const filePath = "test/file.md";
      const mockFile = new TFile(filePath);
      const originalContent = `---
title: Test
---

Content`;

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(originalContent);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          title: "Test",
        },
      } as any);

      await repository.updateFrontmatterByPath(filePath, {
        description: "Value with: colon",
        tags: ["tag1", "tag2"],
        link: "[[Some Page]]",
        number: 42,
        boolean: true,
      });

      const modifyCall = mockVault.modify.mock.calls[0];
      const modifiedContent = modifyCall[1];

      // Check that special characters are properly quoted
      expect(modifiedContent).toContain('description: "Value with: colon"');
      expect(modifiedContent).toContain("tags:\n  - tag1\n  - tag2");
      expect(modifiedContent).toContain('link: "[[Some Page]]"');
      expect(modifiedContent).toContain("number: 42");
      expect(modifiedContent).toContain("boolean: true");
    });

    it("should throw error if file not found", async () => {
      const filePath = "nonexistent/file.md";
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await expect(
        repository.updateFrontmatterByPath(filePath, { status: "completed" }),
      ).rejects.toThrow("File not found: nonexistent/file.md");
    });

    it("should skip null and undefined values", async () => {
      const filePath = "test/file.md";
      const mockFile = new TFile(filePath);
      const originalContent = `---
title: Test
existing: value
---

Content`;

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(originalContent);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          title: "Test",
          existing: "value",
        },
      } as any);

      await repository.updateFrontmatterByPath(filePath, {
        nullValue: null,
        undefinedValue: undefined,
        validValue: "test",
      });

      const modifyCall = mockVault.modify.mock.calls[0];
      const modifiedContent = modifyCall[1];

      // Check that null/undefined are not included
      expect(modifiedContent).not.toContain("nullValue");
      expect(modifiedContent).not.toContain("undefinedValue");
      expect(modifiedContent).toContain("validValue: test");
      expect(modifiedContent).toContain("existing: value");
    });
  });

  describe("findByClass", () => {
    it("should find assets by class name", async () => {
      const mockFiles = [
        new TFile("Asset1.md"),
        new TFile("Asset2.md"),
        new TFile("Asset3.md"),
      ];

      const targetClass = "exo__TestClass";
      const className = ClassName.create(targetClass).getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file: any) => {
        if (file.path === "Asset1.md") {
          return {
            frontmatter: {
              exo__Asset_uid: "asset-1",
              exo__Asset_label: "Asset 1",
              exo__Instance_class: ["[[exo__TestClass]]"],
              exo__Asset_isDefinedBy: "[[exo]]",
            },
          };
        }
        if (file.path === "Asset3.md") {
          return {
            frontmatter: {
              exo__Asset_uid: "asset-3",
              exo__Asset_label: "Asset 3",
              exo__Instance_class: ["[[exo__TestClass]]"],
              exo__Asset_isDefinedBy: "[[exo]]",
            },
          };
        }
        return {
          frontmatter: {
            exo__Asset_uid: "asset-2",
            exo__Asset_label: "Asset 2",
            exo__Instance_class: ["[[exo__OtherClass]]"],
            exo__Asset_isDefinedBy: "[[exo]]",
          },
        };
      });

      const assets = await repository.findByClass(className);

      expect(assets).toHaveLength(2);
      expect(assets[0].getId().toString()).toBe("asset-1");
      expect(assets[1].getId().toString()).toBe("asset-3");
    });

    it("should find assets with class name without brackets", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const className = ClassName.create("exo__TestClass").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-1",
          exo__Asset_label: "Asset 1",
          exo__Instance_class: ["exo__TestClass"], // No brackets
          exo__Asset_isDefinedBy: "[[exo]]",
        },
      });

      const assets = await repository.findByClass(className);

      expect(assets).toHaveLength(1);
      expect(assets[0].getId().toString()).toBe("asset-1");
    });

    it("should handle array of classes", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const className = ClassName.create("exo__TestClass").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-1",
          exo__Asset_label: "Asset 1",
          exo__Instance_class: ["[[exo__OtherClass]]", "[[exo__TestClass]]"],
          exo__Asset_isDefinedBy: "[[exo]]",
        },
      });

      const assets = await repository.findByClass(className);

      expect(assets).toHaveLength(1);
      expect(assets[0].getId().toString()).toBe("asset-1");
    });

    it("should handle single class as string", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const className = ClassName.create("exo__TestClass").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-1",
          exo__Asset_label: "Asset 1",
          exo__Instance_class: "[[exo__TestClass]]", // Single string, not array
          exo__Asset_isDefinedBy: "[[exo]]",
        },
      });

      const assets = await repository.findByClass(className);

      expect(assets).toHaveLength(1);
      expect(assets[0].getId().toString()).toBe("asset-1");
    });

    it("should return empty array when no assets match class", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const className = ClassName.create("exo__NonexistentClass").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-1",
          exo__Asset_label: "Asset 1",
          exo__Instance_class: ["[[exo__TestClass]]"],
          exo__Asset_isDefinedBy: "[[exo]]",
        },
      });

      const assets = await repository.findByClass(className);

      expect(assets).toEqual([]);
    });

    it("should skip files without frontmatter", async () => {
      const mockFiles = [new TFile("Asset1.md"), new TFile("Asset2.md")];
      const className = ClassName.create("exo__TestClass").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file: any) => {
        if (file.path === "Asset1.md") {
          return null; // No frontmatter
        }
        return {
          frontmatter: {
            exo__Asset_uid: "asset-2",
            exo__Asset_label: "Asset 2",
            exo__Instance_class: ["[[exo__TestClass]]"],
            exo__Asset_isDefinedBy: "[[exo]]",
          },
        };
      });

      const assets = await repository.findByClass(className);

      expect(assets).toHaveLength(1);
      expect(assets[0].getId().toString()).toBe("asset-2");
    });

    it("should skip assets that fail to parse", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const className = ClassName.create("exo__TestClass").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: ["[[exo__TestClass]]"],
          // Missing required fields to cause Asset.fromFrontmatter to return null
        },
      });

      // Mock Asset.fromFrontmatter to return null
      jest.spyOn(Asset, "fromFrontmatter").mockReturnValue(null);

      const assets = await repository.findByClass(className);

      expect(assets).toEqual([]);

      // Restore original implementation
      jest.restoreAllMocks();
    });
  });

  describe("findByOntology", () => {
    it("should find assets by ontology prefix", async () => {
      const mockFiles = [new TFile("Asset1.md"), new TFile("Asset2.md")];
      const ontologyPrefix = OntologyPrefix.create("exo").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file: any) => {
        if (file.path === "Asset1.md") {
          return {
            frontmatter: {
              exo__Asset_uid: "asset-1",
              exo__Asset_label: "Asset 1",
              exo__Instance_class: ["[[exo__TestClass]]"],
              exo__Asset_isDefinedBy: "[[exo]]",
            },
          };
        }
        return {
          frontmatter: {
            exo__Asset_uid: "asset-2",
            exo__Asset_label: "Asset 2",
            exo__Instance_class: ["[[ems__Task]]"],
            exo__Asset_isDefinedBy: "[[ems]]",
          },
        };
      });

      const assets = await repository.findByOntology(ontologyPrefix);

      expect(assets).toHaveLength(1);
      expect(assets[0].getId().toString()).toBe("asset-1");
    });

    it("should handle ontology with exclamation mark", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const ontologyPrefix = OntologyPrefix.create("exo").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-1",
          exo__Asset_label: "Asset 1",
          exo__Instance_class: ["[[exo__TestClass]]"],
          exo__Asset_isDefinedBy: "[[!exo]]", // With exclamation mark
        },
      });

      const assets = await repository.findByOntology(ontologyPrefix);

      expect(assets).toHaveLength(1);
      expect(assets[0].getId().toString()).toBe("asset-1");
    });

    it("should return empty array when no assets match ontology", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const ontologyPrefix = OntologyPrefix.create("nonexistent").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-1",
          exo__Asset_label: "Asset 1",
          exo__Instance_class: ["[[exo__TestClass]]"],
          exo__Asset_isDefinedBy: "[[exo]]",
        },
      });

      const assets = await repository.findByOntology(ontologyPrefix);

      expect(assets).toEqual([]);
    });

    it("should skip files without frontmatter", async () => {
      const mockFiles = [new TFile("Asset1.md")];
      const ontologyPrefix = OntologyPrefix.create("exo").getValue()!;

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue(null);

      const assets = await repository.findByOntology(ontologyPrefix);

      expect(assets).toEqual([]);
    });
  });

  describe("delete", () => {
    it("should delete existing asset", async () => {
      const assetId = AssetId.create("test-id").getValue()!;
      const mockFile = new TFile("Test Asset.md");

      // Mock findById to return an asset
      const mockAsset = Asset.create({
        id: assetId,
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
      }).getValue()!;

      jest.spyOn(repository, "findById").mockResolvedValue(mockAsset);
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

      await repository.delete(assetId);

      expect(mockVault.delete).toHaveBeenCalledWith(mockFile);
    });

    it("should not delete when asset not found", async () => {
      const assetId = AssetId.create("nonexistent-id").getValue()!;

      jest.spyOn(repository, "findById").mockResolvedValue(null);

      await repository.delete(assetId);

      expect(mockVault.delete).not.toHaveBeenCalled();
    });

    it("should not delete when file not found", async () => {
      const assetId = AssetId.create("test-id").getValue()!;

      const mockAsset = Asset.create({
        id: assetId,
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
      }).getValue()!;

      jest.spyOn(repository, "findById").mockResolvedValue(mockAsset);
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await repository.delete(assetId);

      expect(mockVault.delete).not.toHaveBeenCalled();
    });
  });

  describe("exists", () => {
    it("should return true when asset exists", async () => {
      const assetId = AssetId.create("test-id").getValue()!;
      const mockAsset = Asset.create({
        id: assetId,
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
      }).getValue()!;

      jest.spyOn(repository, "findById").mockResolvedValue(mockAsset);

      const exists = await repository.exists(assetId);

      expect(exists).toBe(true);
    });

    it("should return false when asset does not exist", async () => {
      const assetId = AssetId.create("nonexistent-id").getValue()!;

      jest.spyOn(repository, "findById").mockResolvedValue(null);

      const exists = await repository.exists(assetId);

      expect(exists).toBe(false);
    });
  });

  describe("findAll", () => {
    it("should return all assets with asset UIDs", async () => {
      const mockFiles = [
        new TFile("Asset1.md"),
        new TFile("Asset2.md"),
        new TFile("NoAssetUID.md"),
      ];

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file: any) => {
        if (file.path === "Asset1.md") {
          return {
            frontmatter: {
              exo__Asset_uid: "asset-1",
              exo__Asset_label: "Asset 1",
              exo__Instance_class: ["[[exo__TestClass]]"],
              exo__Asset_isDefinedBy: "[[exo]]",
            },
          };
        }
        if (file.path === "Asset2.md") {
          return {
            frontmatter: {
              exo__Asset_uid: "asset-2",
              exo__Asset_label: "Asset 2",
              exo__Instance_class: ["[[exo__TestClass]]"],
              exo__Asset_isDefinedBy: "[[exo]]",
            },
          };
        }
        // NoAssetUID.md has no asset UID
        return {
          frontmatter: {
            title: "Some Note",
            tags: ["note"],
          },
        };
      });

      const assets = await repository.findAll();

      expect(assets).toHaveLength(2);
      expect(assets[0].getId().toString()).toBe("asset-1");
      expect(assets[1].getId().toString()).toBe("asset-2");
    });

    it("should skip files without frontmatter", async () => {
      const mockFiles = [new TFile("Asset1.md")];

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue(null);

      const assets = await repository.findAll();

      expect(assets).toEqual([]);
    });

    it("should skip assets that fail to parse", async () => {
      const mockFiles = [new TFile("Asset1.md")];

      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "asset-1",
          // Missing required fields
        },
      });

      // Mock Asset.fromFrontmatter to return null
      jest.spyOn(Asset, "fromFrontmatter").mockReturnValue(null);

      const assets = await repository.findAll();

      expect(assets).toEqual([]);

      // Restore original implementation
      jest.restoreAllMocks();
    });
  });

  describe("save - additional scenarios", () => {
    it("should find existing file by asset ID when stored path is invalid", async () => {
      const asset = Asset.create({
        id: AssetId.generate(),
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
        properties: {},
      }).getValue()!;

      // Set invalid stored path
      (asset as any).props.filePath = "invalid/path.md";

      const mockFile = new TFile("Test Asset.md");
      const assetId = asset.toFrontmatter()["exo__Asset_uid"];

      mockVault.getAbstractFileByPath.mockReturnValueOnce(null); // Invalid path
      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: assetId,
        },
      });
      mockVault.read.mockResolvedValue(`---
exo__Asset_uid: ${assetId}
---

# Content`);

      await repository.save(asset);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("# Content"),
      );
    });

    it("should handle array properties in frontmatter", async () => {
      const asset = Asset.create({
        id: AssetId.generate(),
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
        properties: {
          tags: ["tag1", "[[Tag 2]]", "tag3"],
          categories: ["Category A"],
        },
      }).getValue()!;

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue([]);

      await repository.save(asset);

      const createCall = mockVault.create.mock.calls[0];
      const content = createCall[1];

      expect(content).toContain("tags:");
      expect(content).toContain("  - tag1");
      expect(content).toContain('  - "[[Tag 2]]"');
      expect(content).toContain("  - tag3");
      expect(content).toContain("categories:");
      expect(content).toContain("  - Category A");
    });

    it("should handle object properties in frontmatter", async () => {
      const asset = Asset.create({
        id: AssetId.generate(),
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
        properties: {
          metadata: { type: "test", version: 1 },
          config: { enabled: true },
        },
      }).getValue()!;

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue([]);

      await repository.save(asset);

      const createCall = mockVault.create.mock.calls[0];
      const content = createCall[1];

      expect(content).toContain('metadata: {"type":"test","version":1}');
      expect(content).toContain('config: {"enabled":true}');
    });

    it("should handle wiki links in scalar properties", async () => {
      const asset = Asset.create({
        id: AssetId.generate(),
        label: "Test Asset",
        className: ClassName.create("TestClass").getValue()!,
        ontology: OntologyPrefix.create("test").getValue()!,
        properties: {
          linkedAsset: "[[Other Asset]]",
          normalProperty: "normal value",
        },
      }).getValue()!;

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue([]);

      await repository.save(asset);

      const createCall = mockVault.create.mock.calls[0];
      const content = createCall[1];

      expect(content).toContain('linkedAsset: "[[Other Asset]]"');
      expect(content).toContain("normalProperty: normal value");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle malformed frontmatter in updateFrontmatterByPath", async () => {
      const filePath = "test/file.md";
      const mockFile = new TFile(filePath);
      const malformedContent = `---
title: Test
status incomplete
---

Content`; // Missing colon

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(malformedContent);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          title: "Test",
          // Parser might handle malformed YAML differently
        },
      } as any);

      await repository.updateFrontmatterByPath(filePath, {
        status: "completed",
      });

      // Should still work, using the current frontmatter from cache
      expect(mockVault.modify).toHaveBeenCalled();
    });

    it("should handle content without frontmatter in updateFrontmatterByPath", async () => {
      const filePath = "test/file.md";
      const mockFile = new TFile(filePath);
      const contentWithoutFrontmatter = `# Title

Some content without frontmatter.`;

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(contentWithoutFrontmatter);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      } as any);

      await repository.updateFrontmatterByPath(filePath, {
        status: "completed",
      });

      const modifyCall = mockVault.modify.mock.calls[0];
      const modifiedContent = modifyCall[1];

      expect(modifiedContent).toContain("---\nstatus: completed\n---");
      expect(modifiedContent).toContain(
        "# Title\n\nSome content without frontmatter.",
      );
    });

    it("should handle complex YAML values that need quoting", async () => {
      const filePath = "test/file.md";
      const mockFile = new TFile(filePath);

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("---\n---\n\nContent");
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      } as any);

      await repository.updateFrontmatterByPath(filePath, {
        colonValue: "value: with colon",
        hashValue: "value # with hash",
        bracketValue: "value [with] brackets",
        braceValue: "value {with} braces",
        pipeValue: "value | with pipe",
        angleValue: "value > with angle",
        atValue: "value @ with at",
        tickValue: "value ` with tick",
        quoteValue: 'value "with" quotes',
        apostropheValue: "value 'with' apostrophes",
        leadingSpaceValue: " leading space",
        trailingSpaceValue: "trailing space ",
        booleanValue: true,
        numberValue: 42,
      });

      const modifyCall = mockVault.modify.mock.calls[0];
      const modifiedContent = modifyCall[1];

      // Values that need quoting
      expect(modifiedContent).toContain('colonValue: "value: with colon"');
      expect(modifiedContent).toContain('hashValue: "value # with hash"');
      expect(modifiedContent).toContain(
        'bracketValue: "value [with] brackets"',
      );
      expect(modifiedContent).toContain('braceValue: "value {with} braces"');
      expect(modifiedContent).toContain('pipeValue: "value | with pipe"');
      expect(modifiedContent).toContain('angleValue: "value > with angle"');
      expect(modifiedContent).toContain('atValue: "value @ with at"');
      expect(modifiedContent).toContain('tickValue: "value ` with tick"');
      expect(modifiedContent).toContain(
        'quoteValue: "value \\"with\\" quotes"',
      );
      expect(modifiedContent).toContain(
        "apostropheValue: \"value 'with' apostrophes\"",
      );
      expect(modifiedContent).toContain('leadingSpaceValue: " leading space"');
      expect(modifiedContent).toContain(
        'trailingSpaceValue: "trailing space "',
      );

      // Values that don't need quoting
      expect(modifiedContent).toContain("booleanValue: true");
      expect(modifiedContent).toContain("numberValue: 42");
    });

    it("should preserve file path in asset after findByFilename", async () => {
      const mockFile = new TFile("assets/MyAsset.md");

      const mockFrontmatter = {
        exo__Asset_uid: "test-uuid",
        exo__Asset_label: "My Asset",
        exo__Instance_class: ["[[exo__TestClass]]"],
        exo__Asset_isDefinedBy: "[[exo]]",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: mockFrontmatter,
      });

      const asset = await repository.findByFilename("assets/MyAsset.md");

      expect(asset).not.toBeNull();
      expect((asset as any).props.filePath).toBe("assets/MyAsset.md");
    });

    it("should handle search fallback in findByFilename", async () => {
      // Create TFile with correct name property
      const mockFile1 = Object.assign(new TFile("other/Asset.md"), {
        name: "Asset.md",
      });
      const mockFile2 = Object.assign(new TFile("assets/MyAsset.md"), {
        name: "MyAsset.md",
      });
      const mockFiles = [mockFile1, mockFile2];

      const mockFrontmatter = {
        exo__Asset_uid: "test-uuid",
        exo__Asset_label: "My Asset",
        exo__Instance_class: ["[[exo__TestClass]]"],
        exo__Asset_isDefinedBy: "[[exo]]",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file: any) => {
        if (file.name === "MyAsset.md") {
          return { frontmatter: mockFrontmatter };
        }
        return null;
      });

      const asset = await repository.findByFilename("MyAsset.md");

      expect(asset).not.toBeNull();
      expect(mockVault.getMarkdownFiles).toHaveBeenCalled();
    });
  });
});
