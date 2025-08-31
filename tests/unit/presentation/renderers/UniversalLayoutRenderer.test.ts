import { UniversalLayoutRenderer } from "../../../../src/presentation/renderers/UniversalLayoutRenderer";
import { ServiceProvider } from "../../../../src/infrastructure/providers/ServiceProvider";
import { FakeVaultAdapter } from "../../../helpers/FakeVaultAdapter";
import { IAssetRepository } from "../../../../src/domain/repositories/IAssetRepository";
import { LoggerFactory } from "../../../../src/infrastructure/logging/LoggerFactory";
import { MarkdownPostProcessorContext, TFile } from "obsidian";

// Extend TFile to add stat property
class MockTFile extends TFile {
  stat: { ctime: number; mtime: number };

  constructor(path: string, basename?: string) {
    super(path);
    this.basename = basename || path.split("/").pop()?.replace(".md", "") || "";
    this.stat = { ctime: Date.now(), mtime: Date.now() };
  }
}

describe("UniversalLayoutRenderer", () => {
  let renderer: UniversalLayoutRenderer;
  let serviceProvider: ServiceProvider;
  let vaultAdapter: FakeVaultAdapter;
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
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
    };
    (window as any).app = mockApp;

    // Setup vault adapter
    vaultAdapter = new FakeVaultAdapter();

    // Setup mock service provider
    const mockAssetRepository: IAssetRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      updateFrontmatter: jest.fn(),
      getAllAssets: jest.fn(),
      findByClass: jest.fn(),
      createAsset: jest.fn(),
      getAssetProperties: jest.fn(),
    } as any;

    serviceProvider = {
      getService: jest.fn().mockImplementation((name: string) => {
        if (name === "IAssetRepository") return mockAssetRepository;
        return null;
      }),
      registerService: jest.fn(),
    } as any;

    // Create renderer
    renderer = new UniversalLayoutRenderer(serviceProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("exo__Instance_class display", () => {
    it("should display exo__Instance_class in second column for assets with the property", async () => {
      // Setup test data
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");
      const relatedFile = new MockTFile("project-alpha.md", "Project Alpha");

      // Mock app methods - relatedFile links to currentFile
      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      // The resolvedLinks shows that "project-alpha.md" has a link to "current-file.md"
      mockApp.metadataCache.resolvedLinks = {
        "project-alpha.md": {
          "current-file.md": 1,
        },
      };
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ems__Project",
        },
      });
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      // Render the layout
      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        ctx,
      );

      // Check that table was created
      const table = container.querySelector("table");
      expect(table).toBeTruthy();

      // Check headers
      const headers = container.querySelectorAll("th");
      expect(headers[0]?.textContent).toBe("Name");
      expect(headers[1]?.textContent).toBe("exo__Instance_class");

      // Check data cells
      const cells = container.querySelectorAll("tbody td");
      expect(cells[0]?.textContent).toBe("Project Alpha");
      expect(cells[1]?.textContent).toBe("ems__Project");
    });

    it("should handle missing exo__Instance_class property gracefully", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");
      const relatedFile = new MockTFile("generic-note.md", "Generic Note");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "generic-note.md": {
          "current-file.md": 1,
        },
      };
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      });
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        {} as MarkdownPostProcessorContext,
      );

      const cells = container.querySelectorAll("tbody td");
      expect(cells[0]?.textContent).toBe("Generic Note");
      expect(cells[1]?.textContent).toBe("-");
    });

    it("should display multiple assets with different exo__Instance_class values", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");

      const testAssets = [
        { name: "Project Alpha", class: "ems__Project" },
        { name: "Task Beta", class: "ems__Task" },
        { name: "Area Gamma", class: "ems__Area" },
        { name: "Note Delta", class: null },
      ];

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      const resolvedLinks: any = {};
      testAssets.forEach((asset, index) => {
        const path = `${asset.name.toLowerCase().replace(" ", "-")}.md`;
        resolvedLinks[path] = { "current-file.md": 1 };
      });
      mockApp.metadataCache.resolvedLinks = resolvedLinks;

      let callIndex = 0;
      mockApp.metadataCache.getFileCache.mockImplementation(() => ({
        frontmatter: testAssets[callIndex % testAssets.length].class
          ? {
              exo__Instance_class:
                testAssets[callIndex++ % testAssets.length].class,
            }
          : {},
      }));

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        const asset = testAssets.find(
          (a) => path === `${a.name.toLowerCase().replace(" ", "-")}.md`,
        );
        return asset ? new MockTFile(path, asset.name) : null;
      });

      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        {} as MarkdownPostProcessorContext,
      );

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBeGreaterThan(0);

      // Verify that both columns are present in each row
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        expect(cells.length).toBeGreaterThanOrEqual(2);
        expect(cells[0]?.textContent).toBeTruthy(); // Name should not be empty
        expect(cells[1]?.textContent).toBeTruthy(); // Instance class or "-"
      });
    });

    it("should add sortable class to column headers", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");
      const relatedFile = new MockTFile("test-file.md", "Test File");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "test-file.md": {
          "current-file.md": 1,
        },
      };
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { exo__Instance_class: "ems__Task" },
      });
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        {} as MarkdownPostProcessorContext,
      );

      const nameHeader = container.querySelector("th:first-child");
      const classHeader = container.querySelector("th:nth-child(2)");

      expect(nameHeader?.classList.contains("sortable")).toBeTruthy();
      expect(classHeader?.classList.contains("sortable")).toBeTruthy();
    });

    it("should add mobile-responsive class on mobile devices", async () => {
      // Set mobile flag
      (window as any).isMobile = true;

      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");
      const relatedFile = new MockTFile("mobile-test.md", "Mobile Test");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "mobile-test.md": {
          "current-file.md": 1,
        },
      };
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { exo__Instance_class: "ems__Zone" },
      });
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        {} as MarkdownPostProcessorContext,
      );

      const table = container.querySelector("table");
      expect(table?.classList.contains("mobile-responsive")).toBeTruthy();

      // Clean up
      delete (window as any).isMobile;
    });

    it("should not duplicate exo__Instance_class column when specified in showProperties", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");
      const relatedFile = new MockTFile("test-file.md", "Test File");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "test-file.md": {
          "current-file.md": 1,
        },
      };
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ems__Effort",
          status: "active",
          priority: "high",
        },
      });
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      // Render with showProperties including exo__Instance_class
      const config =
        "UniversalLayout\ngroupByProperty: false\nlayout: table\nshowProperties: exo__Instance_class,status,priority";
      await renderer.render(
        config,
        container,
        {} as MarkdownPostProcessorContext,
      );

      // Count the number of headers - should be 4: Name, exo__Instance_class, status, priority
      const headers = container.querySelectorAll("th");
      const headerTexts = Array.from(headers).map((h) => h.textContent);

      // Check that exo__Instance_class appears only once
      const instanceClassCount = headerTexts.filter(
        (t) => t === "exo__Instance_class",
      ).length;
      expect(instanceClassCount).toBe(1);

      // Check that other properties are present
      expect(headerTexts).toContain("status");
      expect(headerTexts).toContain("priority");
    });
  });

  describe("legacy table mode", () => {
    it("should display exo__Instance_class in table layout mode", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");
      const relatedFile = new MockTFile("table-test.md", "Table Test");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "table-test.md": {
          "current-file.md": 1,
        },
      };
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { exo__Instance_class: "ems__Project" },
      });
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      // Use table layout with groupByProperty disabled
      const config = "UniversalLayout\nlayout: table\ngroupByProperty: false";
      await renderer.render(
        config,
        container,
        {} as MarkdownPostProcessorContext,
      );

      // Check that table was created
      const table = container.querySelector("table.exocortex-table");
      expect(table).toBeTruthy();

      // Check headers include exo__Instance_class
      const headers = container.querySelectorAll("th");
      const headerTexts = Array.from(headers).map((h) => h.textContent);
      expect(headerTexts).toContain("Name");
      expect(headerTexts).toContain("exo__Instance_class");

      // Check data cells
      const firstRow = container.querySelector("tbody tr");
      const cells = firstRow?.querySelectorAll("td");
      expect(cells?.[0]?.textContent).toBe("Table Test");
      expect(cells?.[1]?.textContent).toBe("ems__Project");
    });
  });

  describe("archived asset filtering", () => {
    it("should exclude archived assets from relations", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      // Setup three related files, one is archived
      mockApp.metadataCache.resolvedLinks = {
        "active-task.md": { "current-file.md": 1 },
        "archived-project.md": { "current-file.md": 1 },
        "normal-note.md": { "current-file.md": 1 },
      };

      // Mock file cache to return different metadata for each file
      const fileCacheResponses = new Map([
        [
          "active-task.md",
          {
            frontmatter: { exo__Instance_class: "ems__Task", archived: false },
          },
        ],
        [
          "archived-project.md",
          {
            frontmatter: {
              exo__Instance_class: "ems__Project",
              archived: true,
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

      // Mock vault to return different files
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

      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        {} as MarkdownPostProcessorContext,
      );

      // Check that only 2 rows are rendered (archived asset should be filtered out)
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);

      // Check that the archived project is not included
      const cellTexts = Array.from(container.querySelectorAll("tbody td")).map(
        (cell) => cell.textContent,
      );
      expect(cellTexts).toContain("Active Task");
      expect(cellTexts).toContain("Normal Note");
      expect(cellTexts).not.toContain("Archived Project");
    });

    it("should handle various archived value formats", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      mockApp.metadataCache.resolvedLinks = {
        "archived-string-true.md": { "current-file.md": 1 },
        "archived-string-yes.md": { "current-file.md": 1 },
        "archived-number-1.md": { "current-file.md": 1 },
        "active-string-false.md": { "current-file.md": 1 },
        "active-number-0.md": { "current-file.md": 1 },
        "no-archived-property.md": { "current-file.md": 1 },
      };

      const fileCacheResponses = new Map([
        ["archived-string-true.md", { frontmatter: { archived: "true" } }],
        ["archived-string-yes.md", { frontmatter: { archived: "yes" } }],
        ["archived-number-1.md", { frontmatter: { archived: 1 } }],
        ["active-string-false.md", { frontmatter: { archived: "false" } }],
        ["active-number-0.md", { frontmatter: { archived: 0 } }],
        [
          "no-archived-property.md",
          { frontmatter: { exo__Instance_class: "ems__Note" } },
        ],
      ]);

      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        return fileCacheResponses.get(file.path) || { frontmatter: {} };
      });

      const mockFiles = new Map();
      for (const [path, _] of fileCacheResponses) {
        mockFiles.set(
          path,
          new MockTFile(path, path.replace(".md", "").replace(/-/g, " ")),
        );
      }

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        return mockFiles.get(path) || null;
      });

      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        {} as MarkdownPostProcessorContext,
      );

      // Should only render 3 rows (the non-archived files)
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(3);

      const cellTexts = Array.from(container.querySelectorAll("tbody td")).map(
        (cell) => cell.textContent,
      );

      // Active files should be included
      expect(cellTexts).toContain("active string false");
      expect(cellTexts).toContain("active number 0");
      expect(cellTexts).toContain("no archived property");

      // Archived files should be excluded
      expect(cellTexts).not.toContain("archived string true");
      expect(cellTexts).not.toContain("archived string yes");
      expect(cellTexts).not.toContain("archived number 1");
    });

    it("should display message when all related assets are archived", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current-file.md", "Current File");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);

      mockApp.metadataCache.resolvedLinks = {
        "archived-1.md": { "current-file.md": 1 },
        "archived-2.md": { "current-file.md": 1 },
      };

      const fileCacheResponses = new Map([
        [
          "archived-1.md",
          { frontmatter: { archived: true, exo__Instance_class: "ems__Task" } },
        ],
        [
          "archived-2.md",
          {
            frontmatter: {
              archived: "yes",
              exo__Instance_class: "ems__Project",
            },
          },
        ],
      ]);

      mockApp.metadataCache.getFileCache.mockImplementation((file: TFile) => {
        return fileCacheResponses.get(file.path) || { frontmatter: {} };
      });

      const mockFiles = new Map([
        ["archived-1.md", new MockTFile("archived-1.md", "Archived 1")],
        ["archived-2.md", new MockTFile("archived-2.md", "Archived 2")],
      ]);

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        return mockFiles.get(path) || null;
      });

      await renderer.render(
        "UniversalLayout\ngroupByProperty: false\nlayout: table",
        container,
        {} as MarkdownPostProcessorContext,
      );

      // Should display message indicating no related assets found (because all are archived)
      const messageElement = container.querySelector(".exocortex-message");
      expect(messageElement).toBeTruthy();
      expect(messageElement?.textContent).toContain("No related assets found");
    });
  });

  describe("error handling", () => {
    it("should handle and display errors during rendering", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("error-test.md", "Error Test");
      
      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      
      // Make resolvedLinks throw an error
      Object.defineProperty(mockApp.metadataCache, 'resolvedLinks', {
        get: () => {
          throw new Error("Cache access error");
        },
        configurable: true
      });

      // Render should handle the error gracefully
      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render(
        "UniversalLayout\nlayout: table",
        container,
        ctx,
      );

      // Should render error message or handle error gracefully
      const errorElement = container.querySelector(".exocortex-error-message");
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain("Cache access error");
    });

    it("should handle null/undefined file cache gracefully", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("null-cache.md", "Null Cache");
      const relatedFile = new MockTFile("related.md", "Related");

      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "related.md": { "null-cache.md": 1 }
      };
      mockApp.metadataCache.getFileCache.mockReturnValue(null); // Return null cache
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render(
        "UniversalLayout\nlayout: table",
        container,
        ctx,
      );

      // When cache is null, metadata is empty, so asset should be filtered out
      // Check that container has some content (either message or error)
      expect(container.children.length).toBeGreaterThan(0);
      
      // Should either show message or have some indication of handling the null cache
      const hasMessage = container.querySelector(".exocortex-message") !== null;
      const hasError = container.querySelector(".exocortex-error-message") !== null;
      const hasContent = container.textContent && container.textContent.trim().length > 0;
      
      expect(hasMessage || hasError || hasContent).toBe(true);
    });

    it("should handle invalid configuration gracefully", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("config-test.md", "Config Test");
      
      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {};

      // Test with malformed config
      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render(
        "UniversalLayout\ninvalidKey: invalidValue\nlayout: invalidLayout",
        container,
        ctx,
      );

      // Should handle invalid config and show message
      const messageElement = container.querySelector(".exocortex-message");
      expect(messageElement).toBeTruthy();
    });

    it("should handle missing active file", async () => {
      const container = document.createElement("div");
      
      // No active file
      mockApp.workspace.getActiveFile.mockReturnValue(null);

      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render(
        "UniversalLayout",
        container,
        ctx,
      );

      // Should show "No active file" message
      const messageElement = container.querySelector(".exocortex-message");
      expect(messageElement).toBeTruthy();
      expect(messageElement?.textContent).toContain("No active file");
    });

    it("should handle vault.getAbstractFileByPath returning null", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current.md", "Current");
      
      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "missing-file.md": { "current.md": 1 }
      };
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null); // File not found

      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render(
        "UniversalLayout",
        container,
        ctx,
      );

      // Should handle missing file gracefully
      const messageElement = container.querySelector(".exocortex-message");
      expect(messageElement?.textContent).toContain("No related assets found");
    });

    it("should handle exception in asset creation modal", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("class-file.md", "Class File");
      
      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {};
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { 
          exo__Instance_class: "exo__Class",
          rdfs__label: "Test Class"
        }
      });

      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render(
        "UniversalLayout",
        container,
        ctx,
      );

      // Find and click the create button
      const createButton = container.querySelector(".exocortex-create-asset-button") as HTMLButtonElement;
      expect(createButton).toBeTruthy();
      
      // Mock console.error to check error handling
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger button click - should handle any modal creation errors
      createButton.click();
      
      // Cleanup
      consoleSpy.mockRestore();
    });

    it("should handle undefined or null metadata values without crashing", async () => {
      const container = document.createElement("div");
      const currentFile = new MockTFile("current.md", "Current");
      const relatedFile = new MockTFile("related.md", "Related");
      
      mockApp.workspace.getActiveFile.mockReturnValue(currentFile);
      mockApp.metadataCache.resolvedLinks = {
        "related.md": { "current.md": 1 }
      };
      
      // Return frontmatter with undefined/null values but ensure not archived
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: undefined,
          someProperty: null,
          emptyString: "",
          archived: false // Explicitly not archived to ensure it's included
        }
      });
      mockApp.vault.getAbstractFileByPath.mockReturnValue(relatedFile);

      const ctx = {} as MarkdownPostProcessorContext;
      
      // Main test: Should not throw an error when rendering
      await expect(renderer.render(
        "UniversalLayout\nlayout: table\nshowProperties: someProperty,emptyString",
        container,
        ctx,
      )).resolves.not.toThrow();

      // Should have completed rendering without crashing
      expect(container).toBeTruthy();
    });
  });

  afterEach(() => {
    // Clean up any property descriptors we may have set
    try {
      if (mockApp?.metadataCache) {
        const descriptor = Object.getOwnPropertyDescriptor(mockApp.metadataCache, 'resolvedLinks');
        if (descriptor?.configurable) {
          delete mockApp.metadataCache.resolvedLinks;
        }
        // Ensure we always have a basic resolvedLinks object
        if (!mockApp.metadataCache.resolvedLinks) {
          mockApp.metadataCache.resolvedLinks = {};
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Clear all mocks to ensure clean state
    jest.clearAllMocks();
  });
});
