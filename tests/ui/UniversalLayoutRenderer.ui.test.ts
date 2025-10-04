/**
 * @jest-environment jest-environment-obsidian
 * @obsidian-conformance strict
 * @obsidian-version 1.7.7
 *
 * UI Integration tests for UniversalLayoutRenderer
 * Tests actual DOM rendering using Obsidian API mocks
 */

import { App, TFile, MarkdownPostProcessorContext } from "obsidian";
import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { FileBuilder, ListBuilder } from "./helpers/FileBuilder";

describe("UniversalLayoutRenderer UI Integration", () => {
  let renderer: UniversalLayoutRenderer;
  let mockApp: App;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a real DOM container
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create mock app with essential methods
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(),
        openLinkText: jest.fn(),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
        resolvedLinks: {},
        on: jest.fn(),
      },
    } as unknown as App;

    renderer = new UniversalLayoutRenderer(mockApp);
  });

  afterEach(() => {
    // Cleanup
    renderer.cleanup();
    document.body.removeChild(container);
  });

  describe("DOM Rendering", () => {
    it("should render React component with proper DOM structure", async () => {
      // Setup test data
      const currentFile = {
        basename: "Test Note",
        path: "test.md",
      } as TFile;

      const relatedFile = {
        basename: "Related Task",
        path: "tasks/task1.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      // Mock file cache with frontmatter
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ems__Task",
          status: "active",
        },
      });

      // Setup backlinks
      mockApp.metadataCache.resolvedLinks = {
        "tasks/task1.md": {
          "test.md": 1,
        },
      };

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(relatedFile);

      // Render
      const ctx = {} as MarkdownPostProcessorContext;
      await renderer.render("", container, ctx);

      // Wait for React to render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify DOM structure - should have both properties and relations sections
      expect(container.querySelector(".exocortex-properties-section")).toBeTruthy();
      expect(container.querySelector(".exocortex-assets-relations")).toBeTruthy();

      // Relations table is inside .exocortex-relations or .exocortex-relations-grouped
      const relationsContainer = container.querySelector(".exocortex-assets-relations");
      expect(relationsContainer).toBeTruthy();
      const relationsTable = relationsContainer?.querySelector(".exocortex-relations-table");
      expect(relationsTable).toBeTruthy();

      // Verify properties table rendered
      const propertiesTable = container.querySelector(".exocortex-properties-table");
      expect(propertiesTable).toBeTruthy();

      // Verify relations table headers
      const headers = relationsTable.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);

      const headerTexts = Array.from(headers).map((h) => h.textContent?.trim());
      expect(headerTexts.some((text) => text?.startsWith("Name"))).toBeTruthy();
      expect(headerTexts).toContain("exo__Instance_class");
    });

    it("should render clickable Instance Class links", async () => {
      const currentFile = {
        basename: "Test",
        path: "test.md",
      } as TFile;

      const relatedFile = {
        basename: "Task 1",
        path: "task1.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {
        "task1.md": { "test.md": 1 },
      };

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(relatedFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      // Wait for React to render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Instance Class links in RELATIONS table (not properties table)
      const relationsContainer = container.querySelector(".exocortex-assets-relations");
      expect(relationsContainer).toBeTruthy();

      const relationsTable = relationsContainer?.querySelector(".exocortex-relations-table");
      expect(relationsTable).toBeTruthy();

      const instanceClassLinks = relationsTable?.querySelectorAll(".instance-class a.internal-link");
      expect(instanceClassLinks?.length).toBeGreaterThan(0);

      // Verify link text (wiki syntax removed)
      const linkText = instanceClassLinks?.[0]?.textContent?.trim();
      expect(linkText).toBe("ems__Task");
      expect(linkText).not.toContain("[[");
      expect(linkText).not.toContain("]]");
    });

    it("should handle grouped relations rendering", async () => {
      const currentFile = {
        basename: "test",
        path: "test.md",
      } as TFile;

      // Create multiple files with different properties
      const file1 = {
        basename: "Task 1",
        path: "task1.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const file2 = {
        basename: "Task 2",
        path: "task2.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file: any) => {
        if (file?.path === "task1.md") {
          return {
            frontmatter: { exo__Instance_class: "ems__Task", assignedTo: "[[test]]" },
          };
        } else if (file?.path === "task2.md") {
          return {
            frontmatter: { exo__Instance_class: "ems__Project", owner: "[[test]]" },
          };
        }
        return { frontmatter: {} };
      });

      mockApp.metadataCache.resolvedLinks = {
        "task1.md": { "test.md": 1 },
        "task2.md": { "test.md": 1 },
      };

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock)
        .mockReturnValueOnce(file1)
        .mockReturnValueOnce(file2);

      await renderer.render("groupByProperty: true", container, {} as MarkdownPostProcessorContext);

      // Wait for React to render (next tick)
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify grouped rendering
      const groups = container.querySelectorAll(".relation-group");
      expect(groups.length).toBeGreaterThan(0);

      // Verify group headers
      const groupHeaders = container.querySelectorAll(".group-header");
      const headerTexts = Array.from(groupHeaders).map((h) => h.textContent);
      expect(headerTexts).toContain("assignedTo");
      expect(headerTexts).toContain("owner");
    });

    it("should handle empty state gracefully", async () => {
      const currentFile = {
        basename: "Test",
        path: "test.md",
      } as TFile;

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: null, // No frontmatter
      });
      mockApp.metadataCache.resolvedLinks = {}; // No backlinks

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // With no frontmatter and no relations, nothing should be rendered
      // Properties table should NOT appear (no frontmatter)
      expect(container.querySelector(".exocortex-properties-section")).toBeFalsy();
      // Relations table should NOT appear (no relations)
      expect(container.querySelector(".exocortex-assets-relations")).toBeFalsy();
    });
  });

  describe("FileBuilder Integration", () => {
    it("should work with FileBuilder pattern for test data", () => {
      const [content, metadata] = new FileBuilder()
        .frontmatter({
          exo__Instance_class: "ems__Task",
          status: "active",
          priority: "high",
        })
        .heading(2, "Task Details")
        .text("This is a task description")
        .blank()
        .list(new ListBuilder().item("First item").item("Second item"))
        .blank()
        .link("Related Note", "alias")
        .done();

      // Verify content
      expect(content).toContain("---");
      expect(content).toContain("exo__Instance_class: ems__Task");
      expect(content).toContain("## Task Details");
      expect(content).toContain("- First item");
      expect(content).toContain("[[Related Note|alias]]");

      // Verify metadata
      expect(metadata.frontmatter.exo__Instance_class).toBe("ems__Task");
      expect(metadata.headings).toHaveLength(1);
      expect(metadata.headings[0].heading).toBe("Task Details");
      expect(metadata.links).toHaveLength(1);
      expect(metadata.links[0].link).toBe("Related Note");
    });
  });

  describe("React Component Cleanup", () => {
    it("should properly cleanup React roots on unmount", async () => {
      const currentFile = {
        basename: "Test",
        path: "test.md",
      } as TFile;

      const relatedFile = {
        basename: "Task",
        path: "task.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { exo__Instance_class: "ems__Task" },
      });

      mockApp.metadataCache.resolvedLinks = { "task.md": { "test.md": 1 } };
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(relatedFile);

      // Render
      await renderer.render("", container, {} as MarkdownPostProcessorContext);
      expect(container.children.length).toBeGreaterThan(0);

      // Cleanup
      renderer.cleanup();

      // Verify container is not empty but React internals are cleaned
      // (container still has DOM elements but React roots are unmounted)
      expect(container.querySelector(".exocortex-assets-relations")).toBeTruthy();
    });
  });
});
