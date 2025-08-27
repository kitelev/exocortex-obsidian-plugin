import {
  BaseAssetRelationsRenderer,
  AssetRelation,
} from "../../../../src/presentation/renderers/BaseAssetRelationsRenderer";
import { App, MarkdownPostProcessorContext, TFile } from "obsidian";

// Extend TFile to add stat property for testing
class MockTFile extends TFile {
  stat: { ctime: number; mtime: number };

  constructor(path: string, basename?: string) {
    super(path);
    this.basename = basename || path.split("/").pop()?.replace(".md", "") || "";
    this.stat = { ctime: Date.now(), mtime: Date.now() };
  }
}

// Create a concrete implementation of BaseAssetRelationsRenderer for testing
class TestableRenderer extends BaseAssetRelationsRenderer {
  async render(
    source: string,
    container: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    // Simple test implementation
    const file = this.getCurrentFile(ctx);
    if (file) {
      const relations = await this.collectAllRelations(file);
      container.createDiv({ text: `Found ${relations.length} relations` });
    }
  }

  // Expose protected methods for testing
  public testIsAssetArchived(metadata: Record<string, any>): boolean {
    return this.isAssetArchived(metadata);
  }

  public async testCollectAllRelations(file: TFile): Promise<AssetRelation[]> {
    return this.collectAllRelations(file);
  }
}

describe("BaseAssetRelationsRenderer - Archived Asset Filtering", () => {
  let renderer: TestableRenderer;
  let mockApp: any;

  beforeEach(() => {
    // Setup mock app
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(),
        openLinkText: jest.fn(),
      },
      metadataCache: {
        resolvedLinks: {},
        getFileCache: jest.fn(),
        getFirstLinkpathDest: jest.fn(),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
    };

    renderer = new TestableRenderer(mockApp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("isAssetArchived", () => {
    it("should return false for metadata without archived property", () => {
      const metadata = { title: "Test", exo__Instance_class: "ems__Task" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(false);
    });

    it("should return false for archived: false", () => {
      const metadata = { archived: false };
      expect(renderer.testIsAssetArchived(metadata)).toBe(false);
    });

    it("should return true for archived: true", () => {
      const metadata = { archived: true };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return true for archived: 'true' (string)", () => {
      const metadata = { archived: "true" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return true for archived: 'TRUE' (uppercase string)", () => {
      const metadata = { archived: "TRUE" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return true for archived: 'yes'", () => {
      const metadata = { archived: "yes" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return true for archived: 'YES' (uppercase)", () => {
      const metadata = { archived: "YES" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return true for archived: '1' (string)", () => {
      const metadata = { archived: "1" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return true for archived: 1 (number)", () => {
      const metadata = { archived: 1 };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return true for archived: 42 (non-zero number)", () => {
      const metadata = { archived: 42 };
      expect(renderer.testIsAssetArchived(metadata)).toBe(true);
    });

    it("should return false for archived: 0 (zero number)", () => {
      const metadata = { archived: 0 };
      expect(renderer.testIsAssetArchived(metadata)).toBe(false);
    });

    it("should return false for archived: 'false' (string)", () => {
      const metadata = { archived: "false" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(false);
    });

    it("should return false for archived: 'no' (string)", () => {
      const metadata = { archived: "no" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(false);
    });

    it("should return false for archived: '' (empty string)", () => {
      const metadata = { archived: "" };
      expect(renderer.testIsAssetArchived(metadata)).toBe(false);
    });

    it("should handle whitespace in string values", () => {
      const metadata1 = { archived: "  true  " };
      const metadata2 = { archived: "  yes  " };
      const metadata3 = { archived: "  1  " };

      expect(renderer.testIsAssetArchived(metadata1)).toBe(true);
      expect(renderer.testIsAssetArchived(metadata2)).toBe(true);
      expect(renderer.testIsAssetArchived(metadata3)).toBe(true);
    });

    it("should return false for null or undefined values", () => {
      const metadata1 = { archived: null };
      const metadata2 = { archived: undefined };

      expect(renderer.testIsAssetArchived(metadata1)).toBe(false);
      expect(renderer.testIsAssetArchived(metadata2)).toBe(false);
    });

    it("should return false for unexpected types", () => {
      const metadata1 = { archived: [] };
      const metadata2 = { archived: {} };
      const metadata3 = { archived: () => {} };

      expect(renderer.testIsAssetArchived(metadata1)).toBe(false);
      expect(renderer.testIsAssetArchived(metadata2)).toBe(false);
      expect(renderer.testIsAssetArchived(metadata3)).toBe(false);
    });
  });

  describe("collectAllRelations - archived filtering", () => {
    it("should exclude archived assets from relations", async () => {
      const currentFile = new MockTFile("current-file.md", "Current File");

      // Setup resolved links - three files link to current file
      mockApp.metadataCache.resolvedLinks = {
        "active-task.md": { "current-file.md": 1 },
        "archived-project.md": { "current-file.md": 1 },
        "normal-note.md": { "current-file.md": 1 },
      };

      // Setup file cache responses
      const fileCacheResponses = new Map([
        [
          "active-task.md",
          {
            frontmatter: { archived: false, exo__Instance_class: "ems__Task" },
          },
        ],
        [
          "archived-project.md",
          {
            frontmatter: {
              archived: true,
              exo__Instance_class: "ems__Project",
            },
          },
        ],
        [
          "normal-note.md",
          { frontmatter: { exo__Instance_class: "ems__Note" } },
        ],
      ]);

      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        return fileCacheResponses.get(file.path) || { frontmatter: {} };
      });

      // Setup vault file responses
      const mockFiles = new Map([
        ["active-task.md", new MockTFile("active-task.md", "Active Task")],
        [
          "archived-project.md",
          new MockTFile("archived-project.md", "Archived Project"),
        ],
        ["normal-note.md", new MockTFile("normal-note.md", "Normal Note")],
      ]);

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        return mockFiles.get(path) || null;
      });

      const relations = await renderer.testCollectAllRelations(currentFile);

      // Should only return 2 relations (active-task and normal-note), archived-project should be filtered out
      expect(relations.length).toBe(2);

      const relationPaths = relations.map((r) => r.path);
      expect(relationPaths).toContain("active-task.md");
      expect(relationPaths).toContain("normal-note.md");
      expect(relationPaths).not.toContain("archived-project.md");
    });

    it("should include all assets when none are archived", async () => {
      const currentFile = new MockTFile("current-file.md", "Current File");

      mockApp.metadataCache.resolvedLinks = {
        "task1.md": { "current-file.md": 1 },
        "task2.md": { "current-file.md": 1 },
        "project1.md": { "current-file.md": 1 },
      };

      const fileCacheResponses = new Map([
        [
          "task1.md",
          {
            frontmatter: { archived: false, exo__Instance_class: "ems__Task" },
          },
        ],
        ["task2.md", { frontmatter: { exo__Instance_class: "ems__Task" } }],
        [
          "project1.md",
          {
            frontmatter: {
              archived: false,
              exo__Instance_class: "ems__Project",
            },
          },
        ],
      ]);

      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        return fileCacheResponses.get(file.path) || { frontmatter: {} };
      });

      const mockFiles = new Map([
        ["task1.md", new MockTFile("task1.md", "Task 1")],
        ["task2.md", new MockTFile("task2.md", "Task 2")],
        ["project1.md", new MockTFile("project1.md", "Project 1")],
      ]);

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        return mockFiles.get(path) || null;
      });

      const relations = await renderer.testCollectAllRelations(currentFile);

      expect(relations.length).toBe(3);
      const relationTitles = relations.map((r) => r.title);
      expect(relationTitles).toContain("Task 1");
      expect(relationTitles).toContain("Task 2");
      expect(relationTitles).toContain("Project 1");
    });

    it("should handle various archived value formats", async () => {
      const currentFile = new MockTFile("current-file.md", "Current File");

      mockApp.metadataCache.resolvedLinks = {
        "archived-true.md": { "current-file.md": 1 },
        "archived-yes.md": { "current-file.md": 1 },
        "archived-1.md": { "current-file.md": 1 },
        "active-false.md": { "current-file.md": 1 },
        "active-no.md": { "current-file.md": 1 },
        "active-0.md": { "current-file.md": 1 },
      };

      const fileCacheResponses = new Map([
        ["archived-true.md", { frontmatter: { archived: "true" } }],
        ["archived-yes.md", { frontmatter: { archived: "yes" } }],
        ["archived-1.md", { frontmatter: { archived: 1 } }],
        ["active-false.md", { frontmatter: { archived: "false" } }],
        ["active-no.md", { frontmatter: { archived: "no" } }],
        ["active-0.md", { frontmatter: { archived: 0 } }],
      ]);

      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        return fileCacheResponses.get(file.path) || { frontmatter: {} };
      });

      const mockFiles = new Map();
      for (const [path, _] of fileCacheResponses) {
        mockFiles.set(path, new MockTFile(path, path.replace(".md", "")));
      }

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        return mockFiles.get(path) || null;
      });

      const relations = await renderer.testCollectAllRelations(currentFile);

      // Should only return the 3 active files (false, no, 0)
      expect(relations.length).toBe(3);

      const relationPaths = relations.map((r) => r.path);
      expect(relationPaths).toContain("active-false.md");
      expect(relationPaths).toContain("active-no.md");
      expect(relationPaths).toContain("active-0.md");

      // Archived files should be filtered out
      expect(relationPaths).not.toContain("archived-true.md");
      expect(relationPaths).not.toContain("archived-yes.md");
      expect(relationPaths).not.toContain("archived-1.md");
    });

    it("should maintain sorting order after filtering", async () => {
      const currentFile = new MockTFile("current-file.md", "Current File");
      const now = Date.now();

      mockApp.metadataCache.resolvedLinks = {
        "old-file.md": { "current-file.md": 1 },
        "archived-newer.md": { "current-file.md": 1 },
        "newest-file.md": { "current-file.md": 1 },
      };

      const fileCacheResponses = new Map([
        ["old-file.md", { frontmatter: {} }],
        ["archived-newer.md", { frontmatter: { archived: true } }],
        ["newest-file.md", { frontmatter: {} }],
      ]);

      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        return fileCacheResponses.get(file.path) || { frontmatter: {} };
      });

      const mockFiles = new Map([
        [
          "old-file.md",
          Object.assign(new MockTFile("old-file.md", "Old File"), {
            stat: { ctime: now - 3000, mtime: now - 3000 },
          }),
        ],
        [
          "archived-newer.md",
          Object.assign(new MockTFile("archived-newer.md", "Archived Newer"), {
            stat: { ctime: now - 1000, mtime: now - 1000 },
          }),
        ],
        [
          "newest-file.md",
          Object.assign(new MockTFile("newest-file.md", "Newest File"), {
            stat: { ctime: now, mtime: now },
          }),
        ],
      ]);

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        return mockFiles.get(path) || null;
      });

      const relations = await renderer.testCollectAllRelations(currentFile);

      // Should return 2 relations, sorted by modification time (newest first)
      expect(relations.length).toBe(2);
      expect(relations[0].title).toBe("Newest File");
      expect(relations[1].title).toBe("Old File");
    });
  });
});
