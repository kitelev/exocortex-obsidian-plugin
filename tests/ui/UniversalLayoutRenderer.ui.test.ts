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

      // Wait for React to render
      await new Promise((resolve) => setTimeout(resolve, 50));

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

    it("should filter archived notes from relations", async () => {
      const currentFile = {
        basename: "My Project",
        path: "project.md",
      } as TFile;

      // Create three related files - two active, one archived
      const activeFile1 = {
        basename: "Active",
        path: "active1.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const archivedFile = {
        basename: "Archived",
        path: "archived.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const activeFile2 = {
        basename: "Also Active",
        path: "active2.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      // Mock file cache - archived file has exo__Asset_isArchived: true
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file: any) => {
        if (file?.path === "active1.md") {
          return { frontmatter: { exo__Asset_isArchived: false } };
        } else if (file?.path === "archived.md") {
          return { frontmatter: { exo__Asset_isArchived: true } };
        } else if (file?.path === "active2.md") {
          return { frontmatter: { exo__Asset_isArchived: false } };
        }
        return { frontmatter: {} };
      });

      // Setup backlinks - all three files link to current file
      mockApp.metadataCache.resolvedLinks = {
        "active1.md": { "project.md": 1 },
        "archived.md": { "project.md": 1 },
        "active2.md": { "project.md": 1 },
      };

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock)
        .mockReturnValueOnce(activeFile1)
        .mockReturnValueOnce(archivedFile)
        .mockReturnValueOnce(activeFile2);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      // Wait for React to render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify relations table rendered
      const relationsContainer = container.querySelector(".exocortex-assets-relations");
      expect(relationsContainer).toBeTruthy();

      const relationsTable = relationsContainer?.querySelector(".exocortex-relations-table");
      expect(relationsTable).toBeTruthy();

      // Verify only 2 rows (active files only)
      const rows = relationsTable?.querySelectorAll("tbody tr");
      expect(rows?.length).toBe(2);

      // Verify active files are present
      const rowTexts = Array.from(rows || []).map((row) => row.textContent);
      expect(rowTexts.some((text) => text?.includes("Active"))).toBeTruthy();
      expect(rowTexts.some((text) => text?.includes("Also Active"))).toBeTruthy();

      // Verify archived file is NOT present
      expect(rowTexts.some((text) => text?.includes("Archived"))).toBeFalsy();
    });
  });

  describe("Create Task Button", () => {
    it("should render Create Task button for Area assets", async () => {
      const currentFile = {
        basename: "My Project Area",
        path: "areas/project.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_isDefinedBy: "[[Ontology/EMS]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {}; // No relations
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      // Wait for React to render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify button is present
      const button = container.querySelector(".exocortex-create-task-btn");
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe("Create Task");
    });

    it("should render Create Task button for Project assets", async () => {
      const currentFile = {
        basename: "Website Redesign",
        path: "projects/redesign.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          exo__Asset_isDefinedBy: "[[Ontology/EMS]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {}; // No relations
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      // Wait for React to render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify button is present
      const button = container.querySelector(".exocortex-create-task-btn");
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe("Create Task");
    });

    it("should NOT render Create Task button for non-Area/Project assets", async () => {
      const currentFile = {
        basename: "Regular Task",
        path: "tasks/task1.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify button is NOT present
      const button = container.querySelector(".exocortex-create-task-btn");
      expect(button).toBeFalsy();
    });

    it("should position Create Task button above properties table", async () => {
      const currentFile = {
        basename: "Area",
        path: "area.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "area-123",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify order: button wrapper -> properties section -> relations
      const children = Array.from(container.children);
      const buttonIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-create-task-wrapper"),
      );
      const propertiesIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-properties-section"),
      );

      expect(buttonIndex).toBeGreaterThanOrEqual(0);
      expect(propertiesIndex).toBeGreaterThanOrEqual(0);
      expect(buttonIndex).toBeLessThan(propertiesIndex);
    });
  });

  describe("Mark Task Done Button", () => {
    it("should render Done button for Task without status", async () => {
      const currentFile = {
        basename: "My Task",
        path: "tasks/my-task.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          exo__Asset_isDefinedBy: "[[Ontology/EMS]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-mark-done-btn");
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe("Done");
    });

    it("should render Done button for Task with non-Done status", async () => {
      const currentFile = {
        basename: "Active Task",
        path: "tasks/active.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusActive]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-mark-done-btn");
      expect(button).toBeTruthy();
    });

    it("should NOT render Done button for Task with Done status", async () => {
      const currentFile = {
        basename: "Completed Task",
        path: "tasks/completed.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusDone]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-mark-done-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Done button for non-Task assets", async () => {
      const currentFile = {
        basename: "Project",
        path: "projects/project.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-mark-done-btn");
      expect(button).toBeFalsy();
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
