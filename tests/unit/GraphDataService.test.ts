import { GraphDataService } from "../../src/infrastructure/services/GraphDataService";
import type { TFile } from "obsidian";

describe("GraphDataService", () => {
  let service: GraphDataService;
  let mockApp: any;
  let mockMetadataCache: any;
  let mockVault: any;

  beforeEach(() => {
    mockVault = {
      getMarkdownFiles: jest.fn().mockReturnValue([]),
    };

    mockMetadataCache = {
      getFileCache: jest.fn(),
      getFirstLinkpathDest: jest.fn(),
    };

    mockApp = {
      vault: mockVault,
      metadataCache: mockMetadataCache,
    };

    service = new GraphDataService(mockApp, mockMetadataCache);
  });

  describe("buildGraphData", () => {
    it("should return empty graph for empty vault", () => {
      const result = service.buildGraphData();

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it("should create nodes with labels from exo__Asset_label", () => {
      const mockFile: TFile = {
        path: "test.md",
        basename: "test",
      } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "Human Readable Label",
          exo__Asset_class: "ems__Area",
        },
      });

      const result = service.buildGraphData();

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].path).toBe("test.md");
      expect(result.nodes[0].label).toBe("Human Readable Label");
      expect(result.nodes[0].title).toBe("test");
      expect(result.nodes[0].assetClass).toBe("ems__Area");
    });

    it("should fallback to basename when no exo__Asset_label", () => {
      const mockFile: TFile = {
        path: "550e8400-e29b-41d4-a716-446655440000.md",
        basename: "550e8400-e29b-41d4-a716-446655440000",
      } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      });

      const result = service.buildGraphData();

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].label).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should resolve prototype label for effort instances", () => {
      const instanceFile: TFile = {
        path: "instance.md",
        basename: "instance",
      } as TFile;

      const prototypeFile: TFile = {
        path: "prototype.md",
        basename: "prototype",
      } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([instanceFile]);

      mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
        if (file.path === "instance.md") {
          return {
            frontmatter: {
              ems__Effort_prototype: "[[prototype]]",
            },
          };
        }
        if (file.path === "prototype.md") {
          return {
            frontmatter: {
              exo__Asset_label: "Prototype Label",
            },
          };
        }
        return null;
      });

      mockMetadataCache.getFirstLinkpathDest.mockReturnValue(prototypeFile);

      const result = service.buildGraphData();

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].label).toBe("Prototype Label");
    });

    it("should mark archived nodes based on exo__Asset_archived true", () => {
      const mockFile: TFile = {
        path: "archived.md",
        basename: "archived",
      } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_archived: true,
        },
      });

      const result = service.buildGraphData();

      expect(result.nodes[0].isArchived).toBe(true);
    });

    it("should mark archived nodes based on ems__Effort_archived_date", () => {
      const mockFile: TFile = {
        path: "archived.md",
        basename: "archived",
      } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          ems__Effort_archived_date: "2024-01-01",
        },
      });

      const result = service.buildGraphData();

      expect(result.nodes[0].isArchived).toBe(true);
    });

    it("should create edges from file links", () => {
      const sourceFile: TFile = {
        path: "source.md",
        basename: "source",
      } as TFile;

      const targetFile: TFile = {
        path: "target.md",
        basename: "target",
      } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([sourceFile, targetFile]);

      mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
        if (file.path === "source.md") {
          return {
            frontmatter: {},
            links: [{ link: "target", position: { start: {}, end: {} } }],
          };
        }
        return { frontmatter: {} };
      });

      mockMetadataCache.getFirstLinkpathDest.mockImplementation((link: string) => {
        if (link === "target") {
          return targetFile;
        }
        return null;
      });

      const result = service.buildGraphData();

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe("source.md");
      expect(result.edges[0].target).toBe("target.md");
      expect(result.edges[0].type).toBe("forward-link");
    });

    it("should handle multiple nodes and edges", () => {
      const file1: TFile = { path: "1.md", basename: "1" } as TFile;
      const file2: TFile = { path: "2.md", basename: "2" } as TFile;
      const file3: TFile = { path: "3.md", basename: "3" } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([file1, file2, file3]);

      mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
        if (file.path === "1.md") {
          return {
            frontmatter: { exo__Asset_label: "First" },
            links: [{ link: "2", position: { start: {}, end: {} } }],
          };
        }
        if (file.path === "2.md") {
          return {
            frontmatter: { exo__Asset_label: "Second" },
            links: [{ link: "3", position: { start: {}, end: {} } }],
          };
        }
        return { frontmatter: { exo__Asset_label: "Third" } };
      });

      mockMetadataCache.getFirstLinkpathDest.mockImplementation((link: string) => {
        if (link === "2") return file2;
        if (link === "3") return file3;
        return null;
      });

      const result = service.buildGraphData();

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
    });

    it("should ignore links to non-existent files", () => {
      const mockFile: TFile = {
        path: "source.md",
        basename: "source",
      } as TFile;

      mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
        links: [{ link: "nonexistent", position: { start: {}, end: {} } }],
      });

      mockMetadataCache.getFirstLinkpathDest.mockReturnValue(null);

      const result = service.buildGraphData();

      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(0);
    });
  });
});
