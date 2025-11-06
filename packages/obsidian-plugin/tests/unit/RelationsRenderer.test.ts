import React from "react";
import { RelationsRenderer } from "../../src/presentation/renderers/layout/RelationsRenderer";
import { Keymap, TFile } from "obsidian";
import {
  createMockApp,
  createMockElement,
  createMockReactRenderer,
  createMockMetadataService,
  createMockMetadata,
  createMockAssetRelation,
  createMockBacklinksCacheManager,
} from "./helpers/testHelpers";

jest.mock("obsidian", () => {
  class MockTFile {
    path: string = "";
    name: string = "";
    basename: string = "";
    extension: string = "";
    parent: any = null;
    vault: any = null;
    stat: any = null;
  }

  return {
    Keymap: {
      isModEvent: jest.fn(),
    },
    TFile: MockTFile,
  };
});

function createTestTFile(path: string): TFile {
  const basename = path.split("/").pop()?.replace(/\.md$/, "") || "";
  const file = new TFile();
  (file as any).path = path;
  (file as any).basename = basename;
  (file as any).name = basename + ".md";
  (file as any).extension = "md";
  (file as any).parent = null;
  (file as any).vault = null;
  (file as any).stat = { ctime: Date.now(), mtime: Date.now(), size: 0 };
  return file;
}

jest.mock("../../src/presentation/components/AssetRelationsTable", () => ({
  AssetRelationsTableWithToggle: jest.fn(() => null),
}));

jest.mock("@exocortex/core", () => ({
  ...jest.requireActual("@exocortex/core"),
  MetadataHelpers: {
    isAssetArchived: jest.fn().mockImplementation((metadata) => {
      return metadata?.exo__Asset_isArchived === true || metadata?.archived === true;
    }),
    findAllReferencingProperties: jest.fn().mockReturnValue([]),
    getPropertyValue: jest.fn().mockImplementation((relation, propertyName) => {
      if (propertyName === "title") return relation.title;
      if (propertyName === "created") return relation.created;
      if (propertyName === "modified") return relation.modified;
      return relation.metadata?.[propertyName];
    }),
  },
}));

jest.mock("../../src/presentation/utils/BlockerHelpers", () => ({
  BlockerHelpers: {
    isEffortBlocked: jest.fn().mockReturnValue(false),
  },
}));

describe("RelationsRenderer", () => {
  let renderer: RelationsRenderer;
  let mockApp: any;
  let mockReactRenderer: any;
  let mockMetadataService: any;
  let mockBacklinksCacheManager: any;
  let mockElement: any;
  let mockFile: any;
  let mockLeaf: any;
  let mockPlugin: any;
  let mockSettings: any;
  let mockRefresh: jest.Mock;
  const { MetadataHelpers } = require("@exocortex/core");
  const { BlockerHelpers } = require("../../src/presentation/utils/BlockerHelpers");

  beforeEach(() => {
    mockLeaf = {
      openLinkText: jest.fn().mockResolvedValue(undefined),
    };

    mockApp = createMockApp({
      workspace: {
        getLeaf: jest.fn().mockReturnValue(mockLeaf),
        openLinkText: jest.fn().mockResolvedValue(undefined),
      },
    });

    mockReactRenderer = createMockReactRenderer();
    mockMetadataService = createMockMetadataService();
    mockBacklinksCacheManager = createMockBacklinksCacheManager();

    mockSettings = {
      showArchivedAssets: false,
      showEffortVotes: false,
    };

    mockPlugin = {
      settings: mockSettings,
      saveSettings: jest.fn().mockResolvedValue(undefined),
    };

    mockRefresh = jest.fn().mockResolvedValue(undefined);

    renderer = new RelationsRenderer(
      mockApp,
      mockSettings,
      mockReactRenderer,
      mockBacklinksCacheManager,
      mockMetadataService,
      mockPlugin,
      mockRefresh,
    );

    mockElement = createMockElement();
    mockFile = createTestTFile("test/target-file.md");

    jest.clearAllMocks();
    jest.spyOn(React, "createElement");
    jest.spyOn(mockElement, "createDiv");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAssetRelations", () => {
    describe("when no backlinks exist", () => {
      it("should return empty array when backlinksCacheManager returns null", async () => {
        mockBacklinksCacheManager.getBacklinks.mockReturnValue(null);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(mockBacklinksCacheManager.getBacklinks).toHaveBeenCalledWith(mockFile.path);
        expect(result).toEqual([]);
      });

      it("should return empty array when backlinksCacheManager returns empty array", async () => {
        mockBacklinksCacheManager.getBacklinks.mockReturnValue([]);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toEqual([]);
      });
    });

    describe("when backlinks exist", () => {
      let sourceFile: any;
      let sourceMetadata: any;

      beforeEach(() => {
        sourceFile = createTestTFile("source/file.md");
        sourceMetadata = createMockMetadata({
          exo__Asset_label: "Source Asset",
          exo__Instance_class: "ems__Task",
        });

        mockBacklinksCacheManager.getBacklinks.mockReturnValue([sourceFile.path]);
        mockApp.vault.getAbstractFileByPath.mockReturnValue(sourceFile);
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: sourceMetadata,
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue("Resolved Label");
      });

      it("should skip non-TFile sources", async () => {
        mockApp.vault.getAbstractFileByPath.mockReturnValue({ isFolder: true });

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toEqual([]);
      });

      it("should create body link relation when no referencing properties", async () => {
        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          file: sourceFile,
          path: sourceFile.path,
          title: sourceFile.basename,
          propertyName: undefined,
          isBodyLink: true,
          isArchived: false,
          isBlocked: false,
          metadata: expect.objectContaining({
            exo__Asset_label: "Resolved Label",
          }),
        });
      });

      it("should include resolved asset label in enriched metadata", async () => {
        mockMetadataService.getAssetLabel.mockReturnValue("Custom Asset Label");

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result[0].metadata.exo__Asset_label).toBe("Custom Asset Label");
        expect(mockMetadataService.getAssetLabel).toHaveBeenCalledWith(sourceFile.path);
      });

      it("should preserve original metadata when no label resolved", async () => {
        mockMetadataService.getAssetLabel.mockReturnValue(null);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result[0].metadata).toEqual(sourceMetadata);
      });

      it("should set stat timestamps correctly", async () => {
        const ctime = 1704067200000;
        const mtime = 1704153600000;
        sourceFile.stat = { ctime, mtime, size: 100 };

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result[0].created).toBe(ctime);
        expect(result[0].modified).toBe(mtime);
      });

      it("should check effort blocking status", async () => {
        BlockerHelpers.isEffortBlocked.mockReturnValue(true);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(BlockerHelpers.isEffortBlocked).toHaveBeenCalledWith(mockApp, sourceMetadata);
        expect(result[0].isBlocked).toBe(true);
      });
    });

    describe("when archiving is configured", () => {
      let sourceFile: any;

      beforeEach(() => {
        sourceFile = createTestTFile("source/archived-file.md");
        mockBacklinksCacheManager.getBacklinks.mockReturnValue([sourceFile.path]);
        mockApp.vault.getAbstractFileByPath.mockReturnValue(sourceFile);
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);
      });

      it("should filter archived assets when showArchivedAssets is false", async () => {
        const archivedMetadata = createMockMetadata({ exo__Asset_isArchived: true });
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: archivedMetadata,
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(true);
        mockSettings.showArchivedAssets = false;

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toEqual([]);
      });

      it("should include archived assets when showArchivedAssets is true", async () => {
        const archivedMetadata = createMockMetadata({ exo__Asset_isArchived: true });
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: archivedMetadata,
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(true);
        mockSettings.showArchivedAssets = true;

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(1);
        expect(result[0].isArchived).toBe(true);
      });

      it("should mark non-archived assets correctly", async () => {
        const metadata = createMockMetadata({ exo__Asset_isArchived: false });
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: metadata,
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(false);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result[0].isArchived).toBe(false);
      });
    });

    describe("when referencing properties exist", () => {
      let sourceFile: any;
      let sourceMetadata: any;

      beforeEach(() => {
        sourceFile = createTestTFile("source/file.md");
        sourceMetadata = createMockMetadata();

        mockBacklinksCacheManager.getBacklinks.mockReturnValue([sourceFile.path]);
        mockApp.vault.getAbstractFileByPath.mockReturnValue(sourceFile);
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: sourceMetadata,
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);
      });

      it("should create property-based relations for each referencing property", async () => {
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([
          "ems__Effort_parent",
          "ems__Effort_area",
        ]);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          propertyName: "ems__Effort_parent",
          isBodyLink: false,
        });
        expect(result[1]).toMatchObject({
          propertyName: "ems__Effort_area",
          isBodyLink: false,
        });
      });

      it("should not create body link when properties exist", async () => {
        MetadataHelpers.findAllReferencingProperties.mockReturnValue(["ems__Effort_parent"]);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(1);
        expect(result[0].isBodyLink).toBe(false);
      });

      it("should create relation for single property", async () => {
        MetadataHelpers.findAllReferencingProperties.mockReturnValue(["custom_property"]);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(1);
        expect(result[0].propertyName).toBe("custom_property");
      });

      it("should handle many referencing properties", async () => {
        const properties = [
          "property1",
          "property2",
          "property3",
          "property4",
          "property5",
        ];
        MetadataHelpers.findAllReferencingProperties.mockReturnValue(properties);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(5);
        properties.forEach((prop, idx) => {
          expect(result[idx].propertyName).toBe(prop);
        });
      });
    });

    describe("when multiple backlinks exist", () => {
      it("should process all backlinks", async () => {
        const file1 = createTestTFile("source/file1.md");
        const file2 = createTestTFile("source/file2.md");
        const file3 = createTestTFile("source/file3.md");

        mockBacklinksCacheManager.getBacklinks.mockReturnValue([
          file1.path,
          file2.path,
          file3.path,
        ]);

        const fileMap = new Map([
          [file1.path, file1],
          [file2.path, file2],
          [file3.path, file3],
        ]);

        mockApp.vault.getAbstractFileByPath.mockImplementation((path) => fileMap.get(path));
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: createMockMetadata(),
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(3);
        expect(result[0].path).toBe(file1.path);
        expect(result[1].path).toBe(file2.path);
        expect(result[2].path).toBe(file3.path);
      });

      it("should accumulate relations from multiple files with multiple properties", async () => {
        const file1 = createTestTFile("source/file1.md");
        const file2 = createTestTFile("source/file2.md");

        mockBacklinksCacheManager.getBacklinks.mockReturnValue([file1.path, file2.path]);

        mockApp.vault.getAbstractFileByPath.mockImplementation((path) => {
          return path === file1.path ? file1 : file2;
        });

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: createMockMetadata(),
        });

        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        MetadataHelpers.findAllReferencingProperties.mockReturnValueOnce([
          "prop1",
          "prop2",
        ]);
        MetadataHelpers.findAllReferencingProperties.mockReturnValueOnce([
          "prop3",
        ]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(3);
      });
    });

    describe("when sorting is configured", () => {
      let file1: any;
      let file2: any;
      let file3: any;

      beforeEach(() => {
        file1 = createTestTFile("source/z-file.md");
        file2 = createTestTFile("source/a-file.md");
        file3 = createTestTFile("source/m-file.md");
        file1.stat = { ctime: 1704067200000, mtime: 1704153600000, size: 100 };
        file2.stat = { ctime: 1704067200001, mtime: 1704153600001, size: 100 };
        file3.stat = { ctime: 1704067200002, mtime: 1704153600002, size: 100 };

        mockBacklinksCacheManager.getBacklinks.mockReturnValue([
          file1.path,
          file2.path,
          file3.path,
        ]);

        const fileMap = new Map([
          [file1.path, file1],
          [file2.path, file2],
          [file3.path, file3],
        ]);

        mockApp.vault.getAbstractFileByPath.mockImplementation((path) => fileMap.get(path));
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: createMockMetadata(),
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);
      });

      it("should sort by title in ascending order", async () => {
        MetadataHelpers.getPropertyValue.mockImplementation((relation, prop) => {
          if (prop === "title") return relation.title;
          return undefined;
        });

        const result = await renderer.getAssetRelations(mockFile, {
          sortBy: "title",
          sortOrder: "asc",
        });

        expect(result[0].title).toBe("a-file");
        expect(result[1].title).toBe("m-file");
        expect(result[2].title).toBe("z-file");
      });

      it("should sort by title in descending order", async () => {
        MetadataHelpers.getPropertyValue.mockImplementation((relation, prop) => {
          if (prop === "title") return relation.title;
          return undefined;
        });

        const result = await renderer.getAssetRelations(mockFile, {
          sortBy: "title",
          sortOrder: "desc",
        });

        expect(result[0].title).toBe("z-file");
        expect(result[1].title).toBe("m-file");
        expect(result[2].title).toBe("a-file");
      });

      it("should default to ascending order when not specified", async () => {
        MetadataHelpers.getPropertyValue.mockImplementation((relation, prop) => {
          if (prop === "title") return relation.title;
          return undefined;
        });

        const result = await renderer.getAssetRelations(mockFile, {
          sortBy: "title",
        });

        expect(result[0].title).toBe("a-file");
        expect(result[1].title).toBe("m-file");
        expect(result[2].title).toBe("z-file");
      });

      it("should sort by created timestamp", async () => {
        MetadataHelpers.getPropertyValue.mockImplementation((relation, prop) => {
          if (prop === "created") return relation.created;
          return undefined;
        });

        const result = await renderer.getAssetRelations(mockFile, {
          sortBy: "created",
          sortOrder: "asc",
        });

        expect(result[0].created).toBe(1704067200000);
        expect(result[1].created).toBe(1704067200001);
        expect(result[2].created).toBe(1704067200002);
      });

      it("should sort by modified timestamp", async () => {
        MetadataHelpers.getPropertyValue.mockImplementation((relation, prop) => {
          if (prop === "modified") return relation.modified;
          return undefined;
        });

        const result = await renderer.getAssetRelations(mockFile, {
          sortBy: "modified",
          sortOrder: "desc",
        });

        expect(result[0].modified).toBe(1704153600002);
        expect(result[1].modified).toBe(1704153600001);
        expect(result[2].modified).toBe(1704153600000);
      });

      it("should handle custom metadata properties for sorting", async () => {
        mockApp.metadataCache.getFileCache.mockImplementation((file) => ({
          frontmatter: createMockMetadata({
            priority: file.basename === "z-file" ? 1 : file.basename === "m-file" ? 2 : 3,
          }),
        }));

        MetadataHelpers.getPropertyValue.mockImplementation((relation, prop) => {
          if (prop === "priority") return relation.metadata?.priority;
          return undefined;
        });

        const result = await renderer.getAssetRelations(mockFile, {
          sortBy: "priority",
          sortOrder: "asc",
        });

        expect(result[0].metadata.priority).toBe(1);
        expect(result[1].metadata.priority).toBe(2);
        expect(result[2].metadata.priority).toBe(3);
      });

      it("should not sort when sortBy is undefined", async () => {
        const originalOrder = [file1.path, file2.path, file3.path];

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result[0].path).toBe(originalOrder[0]);
        expect(result[1].path).toBe(originalOrder[1]);
        expect(result[2].path).toBe(originalOrder[2]);
      });
    });

    describe("edge cases", () => {
      it("should handle missing metadata cache", async () => {
        const sourceFile = createTestTFile("source/file.md");
        mockBacklinksCacheManager.getBacklinks.mockReturnValue([sourceFile.path]);
        mockApp.vault.getAbstractFileByPath.mockReturnValue(sourceFile);
        mockApp.metadataCache.getFileCache.mockReturnValue(null);
        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(1);
        expect(result[0].metadata).toEqual({});
      });

      it("should handle file with empty basename", async () => {
        const sourceFile = createTestTFile("source/file.md");
        sourceFile.basename = "";
        mockBacklinksCacheManager.getBacklinks.mockReturnValue([sourceFile.path]);
        mockApp.vault.getAbstractFileByPath.mockReturnValue(sourceFile);
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: createMockMetadata(),
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("");
      });

      it("should handle metadata with null value", async () => {
        const sourceFile = createTestTFile("source/file.md");
        mockBacklinksCacheManager.getBacklinks.mockReturnValue([sourceFile.path]);
        mockApp.vault.getAbstractFileByPath.mockReturnValue(sourceFile);
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: { ...createMockMetadata(), custom: null },
        });
        MetadataHelpers.isAssetArchived.mockReturnValue(false);
        MetadataHelpers.findAllReferencingProperties.mockReturnValue([]);
        BlockerHelpers.isEffortBlocked.mockReturnValue(false);
        mockMetadataService.getAssetLabel.mockReturnValue(null);

        const result = await renderer.getAssetRelations(mockFile, {});

        expect(result).toHaveLength(1);
      });
    });
  });

  describe("render", () => {
    it("should not render anything when relations array is empty", async () => {
      await renderer.render(mockElement, [], {});

      expect(mockElement.createDiv).not.toHaveBeenCalled();
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should create container with correct class", async () => {
      const relations = [createMockAssetRelation()];

      await renderer.render(mockElement, relations, {});

      expect(mockElement.createDiv).toHaveBeenCalledWith({
        cls: "exocortex-assets-relations",
      });
    });

    it("should render AssetRelationsTableWithToggle component", async () => {
      const relations = [createMockAssetRelation()];

      await renderer.render(mockElement, relations, {});

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          relations,
          groupByProperty: true,
        }),
      );
    });

    it("should pass correct sort configuration to component", async () => {
      const relations = [createMockAssetRelation()];

      await renderer.render(mockElement, relations, {
        sortBy: "custom_sort",
        sortOrder: "desc",
      });

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sortBy: "custom_sort",
          sortOrder: "desc",
        }),
      );
    });

    it("should default sortBy to 'title' when not provided", async () => {
      const relations = [createMockAssetRelation()];

      await renderer.render(mockElement, relations, {});

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sortBy: "title",
          sortOrder: "asc",
        }),
      );
    });

    it("should default sortOrder to 'asc' when not provided", async () => {
      const relations = [createMockAssetRelation()];

      await renderer.render(mockElement, relations, {
        sortBy: "modified",
      });

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sortOrder: "asc",
        }),
      );
    });

    it("should pass empty array for showProperties when not provided", async () => {
      const relations = [createMockAssetRelation()];

      await renderer.render(mockElement, relations, {});

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          showProperties: [],
        }),
      );
    });

    it("should pass showProperties when provided", async () => {
      const relations = [createMockAssetRelation()];
      const showProperties = ["prop1", "prop2"];

      await renderer.render(mockElement, relations, {
        showProperties,
      });

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          showProperties,
        }),
      );
    });

    it("should configure group specific properties", async () => {
      const relations = [createMockAssetRelation()];

      await renderer.render(mockElement, relations, {});

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          groupSpecificProperties: {
            ems__Effort_parent: ["ems__Effort_status"],
            ems__Effort_area: ["ems__Effort_status"],
          },
        }),
      );
    });

    it("should pass showEffortVotes setting", async () => {
      const relations = [createMockAssetRelation()];
      mockSettings.showEffortVotes = true;

      await renderer.render(mockElement, relations, {});

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          showEffortVotes: true,
        }),
      );
    });

    it("should pass showEffortVotes as false by default", async () => {
      const relations = [createMockAssetRelation()];
      mockSettings.showEffortVotes = false;

      await renderer.render(mockElement, relations, {});

      expect(React.createElement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          showEffortVotes: false,
        }),
      );
    });

    describe("onToggleEffortVotes callback", () => {
      it("should toggle showEffortVotes setting", async () => {
        const relations = [createMockAssetRelation()];
        mockSettings.showEffortVotes = false;

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onToggleEffortVotes = createElementCall[1].onToggleEffortVotes;

        await onToggleEffortVotes();

        expect(mockSettings.showEffortVotes).toBe(true);
      });

      it("should save settings after toggling", async () => {
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onToggleEffortVotes = createElementCall[1].onToggleEffortVotes;

        await onToggleEffortVotes();

        expect(mockPlugin.saveSettings).toHaveBeenCalled();
      });

      it("should refresh layout after toggling", async () => {
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onToggleEffortVotes = createElementCall[1].onToggleEffortVotes;

        await onToggleEffortVotes();

        expect(mockRefresh).toHaveBeenCalled();
      });

      it("should toggle back to false", async () => {
        const relations = [createMockAssetRelation()];
        mockSettings.showEffortVotes = true;

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onToggleEffortVotes = createElementCall[1].onToggleEffortVotes;

        await onToggleEffortVotes();

        expect(mockSettings.showEffortVotes).toBe(false);
      });
    });

    describe("onAssetClick callback", () => {
      it("should open link in current pane when no modifier key pressed", async () => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(false);
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onAssetClick = createElementCall[1].onAssetClick;

        const mockEvent = { nativeEvent: {} } as React.MouseEvent;
        await onAssetClick("test/path.md", mockEvent);

        expect(Keymap.isModEvent).toHaveBeenCalledWith({});
        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
          "test/path.md",
          "",
          false,
        );
        expect(mockApp.workspace.getLeaf).not.toHaveBeenCalled();
      });

      it("should open link in new tab when modifier key is pressed", async () => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(true);
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onAssetClick = createElementCall[1].onAssetClick;

        const mockEvent = { nativeEvent: {} } as React.MouseEvent;
        await onAssetClick("test/path.md", mockEvent);

        expect(Keymap.isModEvent).toHaveBeenCalledWith({});
        expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
        expect(mockLeaf.openLinkText).toHaveBeenCalledWith("test/path.md", "");
        expect(mockApp.workspace.openLinkText).not.toHaveBeenCalled();
      });

      it("should propagate errors from openLinkText", async () => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(false);
        const error = new Error("Failed to open link");
        mockApp.workspace.openLinkText.mockRejectedValue(error);
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onAssetClick = createElementCall[1].onAssetClick;

        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await expect(onAssetClick("test/path.md", mockEvent)).rejects.toThrow(
          "Failed to open link",
        );
      });

      it("should propagate errors from leaf.openLinkText", async () => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(true);
        const error = new Error("Failed to open in new tab");
        mockLeaf.openLinkText.mockRejectedValue(error);
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onAssetClick = createElementCall[1].onAssetClick;

        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await expect(onAssetClick("test/path.md", mockEvent)).rejects.toThrow(
          "Failed to open in new tab",
        );
      });

      it("should handle Cmd key on macOS", async () => {
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onAssetClick = createElementCall[1].onAssetClick;

        const mockEvent = {
          nativeEvent: {
            metaKey: true,
            ctrlKey: false,
          } as MouseEvent,
        } as React.MouseEvent;

        (Keymap.isModEvent as jest.Mock).mockImplementation((event: MouseEvent) => {
          return event.metaKey === true;
        });

        await onAssetClick("macos/file.md", mockEvent);

        expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
      });

      it("should handle Ctrl key on Windows/Linux", async () => {
        const relations = [createMockAssetRelation()];

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const onAssetClick = createElementCall[1].onAssetClick;

        const mockEvent = {
          nativeEvent: {
            metaKey: false,
            ctrlKey: true,
          } as MouseEvent,
        } as React.MouseEvent;

        (Keymap.isModEvent as jest.Mock).mockImplementation((event: MouseEvent) => {
          return event.ctrlKey === true;
        });

        await onAssetClick("windows/file.md", mockEvent);

        expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
      });
    });

    describe("getAssetLabel callback", () => {
      it("should delegate to metadataService.getAssetLabel", async () => {
        const relations = [createMockAssetRelation()];
        mockMetadataService.getAssetLabel.mockReturnValue("Asset Label");

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const getAssetLabel = createElementCall[1].getAssetLabel;

        const result = getAssetLabel("some/path.md");

        expect(mockMetadataService.getAssetLabel).toHaveBeenCalledWith("some/path.md");
        expect(result).toBe("Asset Label");
      });

      it("should return null when label not found", async () => {
        const relations = [createMockAssetRelation()];
        mockMetadataService.getAssetLabel.mockReturnValue(null);

        await renderer.render(mockElement, relations, {});

        const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
        const getAssetLabel = createElementCall[1].getAssetLabel;

        const result = getAssetLabel("unknown/path.md");

        expect(result).toBe(null);
      });
    });

    it("should render multiple relations with single container", async () => {
      const relations = [
        createMockAssetRelation(),
        createMockAssetRelation(),
        createMockAssetRelation(),
      ];

      await renderer.render(mockElement, relations, {});

      expect(mockElement.createDiv).toHaveBeenCalledTimes(1);
      expect(React.createElement).toHaveBeenCalledTimes(1);
      expect(mockReactRenderer.render).toHaveBeenCalledTimes(1);
    });

    it("should pass relations array to React component", async () => {
      const relations = [
        createMockAssetRelation({ path: "file1.md" }),
        createMockAssetRelation({ path: "file2.md" }),
      ];

      await renderer.render(mockElement, relations, {});

      const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
      expect(createElementCall[1].relations).toBe(relations);
    });

    it("should call reactRenderer.render with container and component", async () => {
      const relations = [createMockAssetRelation()];
      const mockContainer = document.createElement("div");
      mockElement.createDiv.mockReturnValue(mockContainer);

      await renderer.render(mockElement, relations, {});

      expect(mockReactRenderer.render).toHaveBeenCalledWith(
        mockContainer,
        expect.anything(),
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete workflow with archived filtering and sorting", async () => {
      const file1 = createTestTFile("source/z-file.md");
      const file2 = createTestTFile("source/a-file.md");
      file1.stat = { ctime: 1704067200001, mtime: 1704153600001, size: 100 };
      file2.stat = { ctime: 1704067200000, mtime: 1704153600000, size: 100 };

      mockBacklinksCacheManager.getBacklinks.mockReturnValue([file1.path, file2.path]);

      const fileMap = new Map([
        [file1.path, file1],
        [file2.path, file2],
      ]);

      mockApp.vault.getAbstractFileByPath.mockImplementation((path) => fileMap.get(path));

      // File 1 is archived, File 2 is not
      mockApp.metadataCache.getFileCache.mockImplementation((file) => ({
        frontmatter: createMockMetadata({
          exo__Asset_isArchived: file.path === file1.path,
        }),
      }));

      MetadataHelpers.isAssetArchived.mockImplementation(
        (metadata) => metadata.exo__Asset_isArchived === true,
      );
      MetadataHelpers.findAllReferencingProperties.mockReturnValue([
        "ems__Effort_parent",
      ]);
      BlockerHelpers.isEffortBlocked.mockReturnValue(false);
      mockMetadataService.getAssetLabel.mockReturnValue(null);

      // First, include archived assets
      mockSettings.showArchivedAssets = true;
      const relationsWithArchived = await renderer.getAssetRelations(mockFile, {
        sortBy: "title",
        sortOrder: "asc",
      });

      expect(relationsWithArchived).toHaveLength(2);

      // Now exclude archived
      mockSettings.showArchivedAssets = false;
      const relationsWithoutArchived = await renderer.getAssetRelations(mockFile, {
        sortBy: "title",
        sortOrder: "asc",
      });

      expect(relationsWithoutArchived).toHaveLength(1);
      expect(relationsWithoutArchived[0].path).toBe(file2.path);
    });

    it("should handle effort blocking with property-based relations", async () => {
      const sourceFile = createTestTFile("source/blocked-file.md");
      const metadata = createMockMetadata({ ems__Effort_blocker: "[[other-file]]" });

      mockBacklinksCacheManager.getBacklinks.mockReturnValue([sourceFile.path]);
      mockApp.vault.getAbstractFileByPath.mockReturnValue(sourceFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: metadata,
      });

      MetadataHelpers.isAssetArchived.mockReturnValue(false);
      MetadataHelpers.findAllReferencingProperties.mockReturnValue([
        "ems__Effort_parent",
        "ems__Effort_area",
      ]);
      BlockerHelpers.isEffortBlocked.mockReturnValue(true);
      mockMetadataService.getAssetLabel.mockReturnValue("Blocked Effort");

      const result = await renderer.getAssetRelations(mockFile, {});

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.isBlocked)).toBe(true);
      expect(result.every((r) => !r.isBodyLink)).toBe(true);
    });

    it("should handle render with all options configured", async () => {
      const relations = [
        createMockAssetRelation({ isBlocked: true, isArchived: false }),
        createMockAssetRelation({ isBlocked: false, isArchived: true }),
      ];

      (Keymap.isModEvent as jest.Mock).mockReturnValue(false);
      mockSettings.showEffortVotes = true;

      await renderer.render(mockElement, relations, {
        sortBy: "modified",
        sortOrder: "desc",
        showProperties: ["custom_prop1", "custom_prop2"],
      });

      const createElementCall = (React.createElement as jest.Mock).mock.calls[0];
      const componentProps = createElementCall[1];

      expect(componentProps).toMatchObject({
        relations,
        sortBy: "modified",
        sortOrder: "desc",
        showProperties: ["custom_prop1", "custom_prop2"],
        showEffortVotes: true,
        groupByProperty: true,
      });
    });
  });
});
