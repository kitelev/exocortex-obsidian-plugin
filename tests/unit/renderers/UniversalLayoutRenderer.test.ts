import { UniversalLayoutRenderer } from "../../../src/presentation/renderers/UniversalLayoutRenderer";
import { ServiceProvider } from "../../../src/infrastructure/providers/ServiceProvider";
import { IAssetRepository } from "../../../src/domain/repositories/IAssetRepository";
import { TFile, MarkdownPostProcessorContext } from "obsidian";

describe("UniversalLayoutRenderer - Assets Relations", () => {
  let renderer: UniversalLayoutRenderer;
  let mockServiceProvider: jest.Mocked<ServiceProvider>;
  let mockAssetRepository: jest.Mocked<IAssetRepository>;
  let mockApp: any;
  let mockEl: HTMLElement;
  let mockCtx: MarkdownPostProcessorContext;

  beforeEach(() => {
    // Create mock HTML element
    mockEl = document.createElement("div");

    // Create mock app with workspace and metadata cache
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(),
        openLinkText: jest.fn(),
      },
      metadataCache: {
        resolvedLinks: {},
        getFileCache: jest.fn(),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
    };

    // Set up global window.app
    (window as any).app = mockApp;

    // Create mock repository
    mockAssetRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      updateFrontmatter: jest.fn(),
    } as any;

    // Create mock service provider
    mockServiceProvider = {
      getService: jest.fn((serviceName: string) => {
        if (serviceName === "IAssetRepository") {
          return mockAssetRepository;
        }
        return null;
      }),
    } as any;

    // Create renderer instance
    renderer = new UniversalLayoutRenderer(mockServiceProvider);

    // Create mock context
    mockCtx = {} as MarkdownPostProcessorContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Assets Relations Feature", () => {
    it("should group assets by property name", async () => {
      // Setup current file
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      // Setup files that reference current file
      const parentFile = {
        path: "parent.md",
        basename: "parent",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const childFile = {
        path: "child.md",
        basename: "child",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const relatedFile = {
        path: "related.md",
        basename: "related",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      // Setup metadata cache with different property references
      mockApp.metadataCache.resolvedLinks = {
        "parent.md": { "current.md": 1 },
        "child.md": { "current.md": 1 },
        "related.md": { "current.md": 1 },
      };

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        switch (path) {
          case "parent.md":
            return parentFile;
          case "child.md":
            return childFile;
          case "related.md":
            return relatedFile;
          default:
            return null;
        }
      });

      // Setup file caches with different frontmatter properties
      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        switch (file.path) {
          case "parent.md":
            return {
              frontmatter: {
                child: "[[current]]",
              },
            };
          case "child.md":
            return {
              frontmatter: {
                parent: "[[current]]",
              },
            };
          case "related.md":
            return {
              frontmatter: {
                related: "[[current]]",
              },
            };
          default:
            return null;
        }
      });

      // Render with default config (Assets Relations enabled)
      await renderer.render("UniversalLayout", mockEl, mockCtx);

      // Verify H2 headers are created for each property
      const headers = mockEl.querySelectorAll("h2");
      expect(headers.length).toBe(3);
      
      const headerTexts = Array.from(headers).map(h => h.textContent);
      expect(headerTexts).toContain("child");
      expect(headerTexts).toContain("parent");
      expect(headerTexts).toContain("related");

      // Verify groups are created
      const groups = mockEl.querySelectorAll(".exocortex-relation-group");
      expect(groups.length).toBe(3);

      // Verify items are in correct groups
      const lists = mockEl.querySelectorAll(".exocortex-relation-list");
      expect(lists.length).toBe(3);
    });

    it("should show Untyped Relations for body links", async () => {
      // Setup current file
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      // Setup files that reference current file
      const bodyLinkFile = {
        path: "bodylink.md",
        basename: "bodylink",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const propertyLinkFile = {
        path: "propertylink.md",
        basename: "propertylink",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      // Setup metadata cache
      mockApp.metadataCache.resolvedLinks = {
        "bodylink.md": { "current.md": 1 },
        "propertylink.md": { "current.md": 1 },
      };

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        switch (path) {
          case "bodylink.md":
            return bodyLinkFile;
          case "propertylink.md":
            return propertyLinkFile;
          default:
            return null;
        }
      });

      // Setup file caches - bodylink has no frontmatter reference
      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        switch (file.path) {
          case "bodylink.md":
            return {
              frontmatter: {
                // No reference to current in frontmatter
                someOtherProp: "value",
              },
            };
          case "propertylink.md":
            return {
              frontmatter: {
                parent: "[[current]]",
              },
            };
          default:
            return null;
        }
      });

      // Render
      await renderer.render("UniversalLayout", mockEl, mockCtx);

      // Verify Untyped Relations section exists
      const headers = Array.from(mockEl.querySelectorAll("h2")).map(h => h.textContent);
      expect(headers).toContain("Untyped Relations");
      expect(headers).toContain("parent");

      // Verify Untyped Relations appears last
      const lastHeader = mockEl.querySelectorAll("h2")[headers.length - 1];
      expect(lastHeader.textContent).toBe("Untyped Relations");
    });

    it("should render legacy list view when groupByProperty is false", async () => {
      // Setup current file
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      // Setup a referencing file
      const referencingFile = {
        path: "ref.md",
        basename: "ref",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.metadataCache.resolvedLinks = {
        "ref.md": { "current.md": 1 },
      };

      mockApp.vault.getAbstractFileByPath.mockReturnValue(referencingFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { parent: "[[current]]" },
      });

      // Render with groupByProperty disabled
      const config = `UniversalLayout
groupByProperty: false`;
      
      await renderer.render(config, mockEl, mockCtx);

      // Should not have relation groups
      const groups = mockEl.querySelectorAll(".exocortex-relation-group");
      expect(groups.length).toBe(0);

      // Should have legacy list structure
      const list = mockEl.querySelector(".exocortex-list");
      expect(list).toBeTruthy();
    });

    it("should handle multiple references in array properties", async () => {
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      const multiRefFile = {
        path: "multiref.md",
        basename: "multiref",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.metadataCache.resolvedLinks = {
        "multiref.md": { "current.md": 1 },
      };

      mockApp.vault.getAbstractFileByPath.mockReturnValue(multiRefFile);
      
      // File has array property with reference
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          tags: ["tag1", "[[current]]", "tag2"],
        },
      });

      await renderer.render("UniversalLayout", mockEl, mockCtx);

      // Should detect the reference in array
      const headers = Array.from(mockEl.querySelectorAll("h2")).map(h => h.textContent);
      expect(headers).toContain("tags");
    });

    it("should show message when no relations found", async () => {
      const currentFile = {
        path: "isolated.md",
        basename: "isolated",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {};

      await renderer.render("UniversalLayout", mockEl, mockCtx);

      // Should show no relations message
      const message = mockEl.querySelector(".exocortex-message");
      expect(message).toBeTruthy();
      expect(message?.textContent).toContain("No related assets found");
    });

    it("should handle table layout with relation type column", async () => {
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      const referencingFile = {
        path: "ref.md",
        basename: "ref",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.metadataCache.resolvedLinks = {
        "ref.md": { "current.md": 1 },
      };

      mockApp.vault.getAbstractFileByPath.mockReturnValue(referencingFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { parent: "[[current]]" },
      });

      // Render with table layout and groupByProperty disabled
      const config = `UniversalLayout
layout: table
groupByProperty: false`;
      
      await renderer.render(config, mockEl, mockCtx);

      // Should have table with relation type column
      const table = mockEl.querySelector(".exocortex-table");
      expect(table).toBeTruthy();

      const headers = Array.from(table!.querySelectorAll("th")).map(th => th.textContent);
      expect(headers).toContain("Relation Type");

      // Check that relation type is shown
      const relationType = mockEl.querySelector(".relation-type");
      expect(relationType?.textContent).toBe("parent");
    });

    it("should handle cards layout with relation badge", async () => {
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      const referencingFile = {
        path: "ref.md",
        basename: "ref",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.metadataCache.resolvedLinks = {
        "ref.md": { "current.md": 1 },
      };

      mockApp.vault.getAbstractFileByPath.mockReturnValue(referencingFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { workflow: "[[current]]" },
      });

      // Render with cards layout and groupByProperty disabled
      const config = `UniversalLayout
layout: cards
groupByProperty: false`;
      
      await renderer.render(config, mockEl, mockCtx);

      // Should have card with relation badge
      const card = mockEl.querySelector(".exocortex-card");
      expect(card).toBeTruthy();

      const badge = mockEl.querySelector(".exocortex-relation-badge");
      expect(badge?.textContent).toBe("workflow");
    });
  });

  describe("Configuration Parsing", () => {
    it("should default to Assets Relations mode", async () => {
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {};

      // Render with no configuration
      await renderer.render("", mockEl, mockCtx);

      // Should attempt to render assets relations (even if none found)
      const relationsContainer = mockEl.querySelector(".exocortex-assets-relations");
      expect(relationsContainer).toBeTruthy();
    });

    it("should respect showProperties configuration", async () => {
      const currentFile = {
        path: "current.md",
        basename: "current",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      const referencingFile = {
        path: "ref.md",
        basename: "ref",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.metadataCache.resolvedLinks = {
        "ref.md": { "current.md": 1 },
      };

      mockApp.vault.getAbstractFileByPath.mockReturnValue(referencingFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          parent: "[[current]]",
          status: "active",
          priority: "high",
        },
      });

      // Render with showProperties
      const config = `UniversalLayout
showProperties: status, priority`;
      
      await renderer.render(config, mockEl, mockCtx);

      // Should show the configured properties
      const properties = mockEl.querySelectorAll(".exocortex-property");
      expect(properties.length).toBeGreaterThan(0);
      
      const propertyTexts = Array.from(properties).map(p => p.textContent);
      expect(propertyTexts.some(t => t?.includes("status"))).toBe(true);
      expect(propertyTexts.some(t => t?.includes("priority"))).toBe(true);
    });
  });
});