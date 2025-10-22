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
import { DEFAULT_SETTINGS } from "../../src/domain/settings/ExocortexSettings";

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
        getMarkdownFiles: jest.fn().mockReturnValue([]),
      },
      metadataCache: {
        getFileCache: jest.fn(),
        getFirstLinkpathDest: jest.fn(),
        resolvedLinks: {},
        on: jest.fn(),
      },
    } as unknown as App;

    renderer = new UniversalLayoutRenderer(mockApp, { ...DEFAULT_SETTINGS, showPropertiesSection: true });
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
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
        if (path === "task1.md") return file1;
        if (path === "task2.md") return file2;
        return null;
      });

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

      // Verify button is present - find by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const createTaskBtn = Array.from(buttons).find(btn => btn.textContent === "Create Task");
      expect(createTaskBtn).toBeTruthy();
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

      // Verify button is present - find by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const createTaskBtn = Array.from(buttons).find(btn => btn.textContent === "Create Task");
      expect(createTaskBtn).toBeTruthy();
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

    it("should position Create Task button below properties table", async () => {
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

      // Verify order: properties section -> buttons section (containing action buttons) -> relations
      const children = Array.from(container.children);
      const buttonsContainerIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-buttons-section"),
      );
      const propertiesIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-properties-section"),
      );

      expect(buttonsContainerIndex).toBeGreaterThanOrEqual(0);
      expect(propertiesIndex).toBeGreaterThanOrEqual(0);
      expect(propertiesIndex).toBeLessThan(buttonsContainerIndex);

      // Verify Create Task button is inside the action buttons container (inside buttons section)
      const buttonsSection = children[buttonsContainerIndex];
      const buttons = buttonsSection.querySelectorAll(".exocortex-action-button");
      const createTaskBtn = Array.from(buttons).find(btn => btn.textContent === "Create Task");
      expect(createTaskBtn).toBeTruthy();
    });
  });

  describe("Mark Task Done Button", () => {
    it("should render Done button for Task with Doing status", async () => {
      const currentFile = {
        basename: "My Task",
        path: "tasks/my-task.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusDoing]]",
          exo__Asset_isDefinedBy: "[[Ontology/EMS]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Mark Done button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const doneBtn = Array.from(buttons).find(btn => btn.textContent === "Mark Done");
      expect(doneBtn).toBeTruthy();
    });

    it("should NOT render Done button for Task with Backlog status", async () => {
      const currentFile = {
        basename: "Backlog Task",
        path: "tasks/backlog.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-mark-done-btn");
      expect(button).toBeFalsy();
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

    it("should render Done button for Project with Doing status", async () => {
      const currentFile = {
        basename: "Project",
        path: "projects/project.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusDoing]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Mark Done button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const doneBtn = Array.from(buttons).find(btn => btn.textContent === "Mark Done");
      expect(doneBtn).toBeTruthy();
    });

    it("should NOT render Done button for Project with Backlog status", async () => {
      const currentFile = {
        basename: "Backlog Project",
        path: "projects/backlog.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-mark-done-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Done button for Project with Done status", async () => {
      const currentFile = {
        basename: "Completed Project",
        path: "projects/completed.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
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

    it("should NOT render Done button for non-Task/Project assets (Area)", async () => {
      const currentFile = {
        basename: "Area",
        path: "areas/area.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
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

  describe("Archive Task Button", () => {
    it("should render Archive button for Done Task not archived", async () => {
      const currentFile = {
        basename: "Completed Task",
        path: "tasks/completed.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusDone]]",
          archived: false,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Archive button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const archiveBtn = Array.from(buttons).find(btn => btn.textContent === "Archive");
      expect(archiveBtn).toBeTruthy();
    });

    it("should NOT render Archive button for already archived Task", async () => {
      const currentFile = {
        basename: "Archived Task",
        path: "tasks/archived.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusDone]]",
          archived: true,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-archive-task-btn");
      expect(button).toBeFalsy();
    });

    it("should render Archive button for Task with any status not archived", async () => {
      const currentFile = {
        basename: "Active Task",
        path: "tasks/active.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusActive]]",
          archived: false,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll(".exocortex-action-button");
      const archiveBtn = Array.from(buttons).find(btn => btn.textContent === "Archive");
      expect(archiveBtn).toBeTruthy();
    });

    it("should render Archive button for Done Project not archived", async () => {
      const currentFile = {
        basename: "Completed Project",
        path: "projects/completed.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusDone]]",
          archived: false,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Archive button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const archiveBtn = Array.from(buttons).find(btn => btn.textContent === "Archive");
      expect(archiveBtn).toBeTruthy();
    });

    it("should NOT render Archive button for already archived Project", async () => {
      const currentFile = {
        basename: "Archived Project",
        path: "projects/archived.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusDone]]",
          archived: true,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-archive-task-btn");
      expect(button).toBeFalsy();
    });

    it("should render Archive button for Project with any status not archived", async () => {
      const currentFile = {
        basename: "Active Project",
        path: "projects/active.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusActive]]",
          archived: false,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll(".exocortex-action-button");
      const archiveBtn = Array.from(buttons).find(btn => btn.textContent === "Archive");
      expect(archiveBtn).toBeTruthy();
    });

    it("should render Archive button for any asset type not archived (Area)", async () => {
      const currentFile = {
        basename: "Area",
        path: "areas/area.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          archived: false,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll(".exocortex-action-button");
      const archiveBtn = Array.from(buttons).find(btn => btn.textContent === "Archive");
      expect(archiveBtn).toBeTruthy();
    });
  });

  describe("Clean Empty Properties Button", () => {
    it("should render Clean button when asset has empty properties", async () => {
      const currentFile = {
        basename: "Area with Empty Props",
        path: "areas/empty-props.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "area-123",
          emptyProp: "",
          validProp: "value",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Clean Properties button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const cleanBtn = Array.from(buttons).find(btn => btn.textContent === "Clean Properties");
      expect(cleanBtn).toBeTruthy();
    });

    it("should NOT render Clean button when asset has no empty properties", async () => {
      const currentFile = {
        basename: "Area Without Empty Props",
        path: "areas/no-empty.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "area-123",
          validProp1: "value1",
          validProp2: "value2",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-clean-properties-btn");
      expect(button).toBeFalsy();
    });

    it("should render Clean button for Task with empty properties", async () => {
      const currentFile = {
        basename: "Task with Empty Props",
        path: "tasks/empty-props.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusActive]]",
          emptyProp: null,
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Clean Properties button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const cleanBtn = Array.from(buttons).find(btn => btn.textContent === "Clean Properties");
      expect(cleanBtn).toBeTruthy();
    });

    it("should render Clean button for Project with empty properties", async () => {
      const currentFile = {
        basename: "Project with Empty Props",
        path: "projects/empty-props.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusDone]]",
          emptyArray: [],
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Clean Properties button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const cleanBtn = Array.from(buttons).find(btn => btn.textContent === "Clean Properties");
      expect(cleanBtn).toBeTruthy();
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

  describe("Repair Folder Button", () => {
    it("should render Repair Folder button when asset is in wrong folder", async () => {
      const currentFile = {
        basename: "Misplaced Asset",
        path: "wrong/folder/asset.md",
        parent: { path: "wrong/folder" },
      } as TFile;

      const referencedFile = {
        basename: "Reference",
        path: "correct/folder/reference.md",
        parent: { path: "correct/folder" },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Asset_isDefinedBy: "[[Reference]]",
        },
      });

      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock) = jest
        .fn()
        .mockReturnValue(referencedFile);

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Repair Folder button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const repairBtn = Array.from(buttons).find(btn => btn.textContent === "Repair Folder");
      expect(repairBtn).toBeTruthy();
    });

    it("should NOT render Repair Folder button when asset is in correct folder", async () => {
      const currentFile = {
        basename: "Correct Asset",
        path: "correct/folder/asset.md",
        parent: { path: "correct/folder" },
      } as TFile;

      const referencedFile = {
        basename: "Reference",
        path: "correct/folder/reference.md",
        parent: { path: "correct/folder" },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Asset_isDefinedBy: "[[Reference]]",
        },
      });

      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock) = jest
        .fn()
        .mockReturnValue(referencedFile);

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-repair-folder-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Repair Folder button when exo__Asset_isDefinedBy is missing", async () => {
      const currentFile = {
        basename: "Asset",
        path: "folder/asset.md",
        parent: { path: "folder" },
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

      const button = container.querySelector(".exocortex-repair-folder-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Repair Folder button when referenced file not found", async () => {
      const currentFile = {
        basename: "Asset",
        path: "folder/asset.md",
        parent: { path: "folder" },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Asset_isDefinedBy: "[[NonExistent]]",
        },
      });

      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock) = jest
        .fn()
        .mockReturnValue(null);

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-repair-folder-btn");
      expect(button).toBeFalsy();
    });

    it("should position Repair Folder button after Clean button and after properties", async () => {
      const currentFile = {
        basename: "Misplaced",
        path: "wrong/asset.md",
        parent: { path: "wrong" },
      } as TFile;

      const referencedFile = {
        basename: "Ref",
        path: "correct/ref.md",
        parent: { path: "correct" },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Asset_isDefinedBy: "[[Ref]]",
          exo__Instance_class: "[[ems__Task]]",
          emptyProp: "",  // Add empty property to trigger Clean Properties button
        },
      });

      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock) = jest
        .fn()
        .mockReturnValue(referencedFile);

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify properties section is before buttons section
      const children = Array.from(container.children);
      const buttonsContainerIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-buttons-section"),
      );
      const propertiesIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-properties-section"),
      );

      expect(buttonsContainerIndex).toBeGreaterThanOrEqual(0);
      expect(propertiesIndex).toBeGreaterThanOrEqual(0);
      expect(propertiesIndex).toBeLessThan(buttonsContainerIndex);

      // Verify both buttons exist inside the buttons section (via action buttons container)
      const buttonsSection = children[buttonsContainerIndex];
      const buttons = buttonsSection.querySelectorAll(".exocortex-action-button");

      const cleanBtn = Array.from(buttons).find(btn => btn.textContent === "Clean Properties");
      const repairBtn = Array.from(buttons).find(btn => btn.textContent === "Repair Folder");

      expect(cleanBtn).toBeTruthy();
      expect(repairBtn).toBeTruthy();
    });

    it("should render buttons in horizontal layout container", async () => {
      const currentFile = {
        basename: "Test Asset",
        path: "test-asset.md",
        parent: { path: "wrong-folder" },
      } as TFile;

      const targetFile = {
        parent: { path: "correct-folder" },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "test-123",
          exo__Asset_isDefinedBy: "[[some-class]]",
          emptyProp: "",
        },
      });

      mockApp.metadataCache.resolvedLinks = {
        "some-class.md": { "correct-folder": 1 },
      };

      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock) = jest
        .fn()
        .mockReturnValue(targetFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(targetFile);
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Get action buttons container
      const buttonsContainer = container.querySelector(".exocortex-action-buttons-container") as HTMLElement;
      expect(buttonsContainer).toBeTruthy();

      // Verify container has correct CSS class
      expect(buttonsContainer.classList.contains("exocortex-action-buttons-container")).toBe(true);

      // Verify all expected buttons are present
      const buttons = buttonsContainer.querySelectorAll(".exocortex-action-button");
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);

      expect(buttonTexts).toContain("Create Task");
      expect(buttonTexts).toContain("Clean Properties");
      expect(buttonTexts).toContain("Repair Folder");
    });
  });

  describe("Start Effort Button", () => {
    it("should render Start Effort button for Task with Backlog status", async () => {
      const currentFile = {
        basename: "Backlog Task",
        path: "tasks/backlog-task.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Start Effort button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const startBtn = Array.from(buttons).find(btn => btn.textContent === "Start Effort");
      expect(startBtn).toBeTruthy();
    });

    it("should NOT render Start Effort button for Task with Draft status", async () => {
      const currentFile = {
        basename: "Draft Task",
        path: "tasks/draft-task.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusDraft]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-start-effort-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Start Effort button for Task with Doing status", async () => {
      const currentFile = {
        basename: "Doing Task",
        path: "tasks/doing-task.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "[[ems__EffortStatusDoing]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-start-effort-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Start Effort button for Task with Done status", async () => {
      const currentFile = {
        basename: "Done Task",
        path: "tasks/done-task.md",
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

      const button = container.querySelector(".exocortex-start-effort-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Start Effort button for Project with Backlog status", async () => {
      const currentFile = {
        basename: "Backlog Project",
        path: "projects/backlog-project.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Start Effort button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const startBtn = Array.from(buttons).find(btn => btn.textContent === "Start Effort");
      expect(startBtn).toBeFalsy();
    });

    it("should render Start Effort button for Project with ToDo status", async () => {
      const currentFile = {
        basename: "ToDo Project",
        path: "projects/todo-project.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusToDo]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find Start Effort button by text content
      const buttons = container.querySelectorAll(".exocortex-action-button");
      const startBtn = Array.from(buttons).find(btn => btn.textContent === "Start Effort");
      expect(startBtn).toBeTruthy();
    });

    it("should NOT render Start Effort button for Project with Doing status", async () => {
      const currentFile = {
        basename: "Doing Project",
        path: "projects/doing-project.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusDoing]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-start-effort-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Start Effort button for Project with Done status", async () => {
      const currentFile = {
        basename: "Done Project",
        path: "projects/done-project.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "[[ems__EffortStatusDone]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-start-effort-btn");
      expect(button).toBeFalsy();
    });

    it("should NOT render Start Effort button for non-Task/Project assets (Area)", async () => {
      const currentFile = {
        basename: "Some Area",
        path: "areas/area.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector(".exocortex-start-effort-btn");
      expect(button).toBeFalsy();
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

  describe("Prototype Label Fallback", () => {
    it("should display prototype label when asset has ems__Effort_prototype", async () => {
      const currentFile = {
        basename: "Current",
        path: "current.md",
      } as TFile;

      const taskFile = {
        basename: "Task-123",
        path: "tasks/Task-123.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const prototypeFile = {
        basename: "TaskPrototype",
        path: "prototypes/TaskPrototype.md",
      } as TFile;

      // Mock workspace and vault
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      // Mock cache for current file
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file: TFile) => {
        if (file.path === "current.md") {
          return { frontmatter: { exo__Instance_class: "ems__Area" } };
        }
        if (file.path === "tasks/Task-123.md") {
          return {
            frontmatter: {
              exo__Instance_class: "ems__Task",
              ems__Effort_prototype: "[[TaskPrototype]]",
              // No exo__Asset_label on task itself
            },
          };
        }
        if (file.path === "prototypes/TaskPrototype.md") {
          return {
            frontmatter: {
              exo__Asset_label: "Marketing Campaign Template",
            },
          };
        }
        return null;
      });

      // Mock vault file lookup
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
        if (path === "tasks/Task-123.md") return taskFile;
        if (path === "TaskPrototype.md") return prototypeFile;
        return null;
      });

      // Mock metadataCache.getFirstLinkpathDest (used by new label resolution logic)
      (mockApp.metadataCache.getFirstLinkpathDest as jest.Mock).mockImplementation((path: string) => {
        if (path === "tasks/Task-123.md" || path === "tasks/Task-123") return taskFile;
        if (path === "TaskPrototype" || path === "TaskPrototype.md") return prototypeFile;
        return null;
      });

      // Mock backlinks
      mockApp.metadataCache.resolvedLinks = {
        "tasks/Task-123.md": { "current.md": 1 },
      };

      // Render
      await renderer.render("", container, {} as MarkdownPostProcessorContext);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that prototype label is displayed (not filename)
      const assetLinks = container.querySelectorAll("a.internal-link");
      let foundPrototypeLabel = false;
      assetLinks.forEach((link) => {
        if (link.textContent === "Marketing Campaign Template") {
          foundPrototypeLabel = true;
        }
      });

      expect(foundPrototypeLabel).toBe(true);
    });
  });

  describe("Multiple Relations via Different Properties", () => {
    it("should render multiple relations when same asset links via different properties", async () => {
      // BUG: Asset A links to Asset B via property1 and property2
      // Asset B should show BOTH relations, but currently shows only one
      const currentFile = {
        basename: "AssetB",
        path: "assets/AssetB.md",
      } as TFile;

      const assetAFile = {
        basename: "AssetA",
        path: "assets/AssetA.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      // AssetA has TWO properties linking to AssetB
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file: TFile) => {
        if (file.path === "assets/AssetB.md") {
          return { frontmatter: { exo__Instance_class: "ems__Task" } };
        }
        if (file.path === "assets/AssetA.md") {
          return {
            frontmatter: {
              exo__Instance_class: "ems__Task",
              property1: "[[AssetB]]",
              property2: "[[AssetB]]",
            },
          };
        }
        return null;
      });

      // Mock backlinks - AssetA links to AssetB
      mockApp.metadataCache.resolvedLinks = {
        "assets/AssetA.md": { "assets/AssetB.md": 2 },
      };

      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(assetAFile);

      // Render with groupByProperty to see both relations
      await renderer.render("groupByProperty: true", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should show 2 groups (property1 and property2)
      const groups = container.querySelectorAll(".relation-group");
      expect(groups.length).toBe(2);

      // Should have headers for both properties
      const groupHeaders = container.querySelectorAll(".group-header");
      const headerTexts = Array.from(groupHeaders).map((h) => h.textContent);
      expect(headerTexts).toContain("property1");
      expect(headerTexts).toContain("property2");

      // Each group should have 1 row with AssetA
      const property1Group = Array.from(groups).find((g) => g.querySelector(".group-header")?.textContent === "property1");
      const property2Group = Array.from(groups).find((g) => g.querySelector(".group-header")?.textContent === "property2");

      expect(property1Group).toBeTruthy();
      expect(property2Group).toBeTruthy();

      const property1Rows = property1Group?.querySelectorAll("tbody tr");
      const property2Rows = property2Group?.querySelectorAll("tbody tr");

      expect(property1Rows?.length).toBe(1);
      expect(property2Rows?.length).toBe(1);

      // Both should show AssetA
      expect(property1Rows?.[0]?.textContent).toContain("AssetA");
      expect(property2Rows?.[0]?.textContent).toContain("AssetA");
    });
  });

  describe("Daily Tasks Table for pn__DailyNote", () => {
    it("should render Tasks table for pn__DailyNote with tasks", async () => {
      const currentFile = {
        basename: "2025-10-16 Note",
        path: "daily-notes/2025-10-16 Note.md",
      } as TFile;

      const taskFile = {
        basename: "Task 1",
        path: "tasks/task1.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      // Setup mocks in same order as passing test
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file: TFile) => {
        if (file.path === "daily-notes/2025-10-16 Note.md") {
          return {
            frontmatter: {
              exo__Instance_class: "[[pn__DailyNote]]",
              pn__DailyNote_day: "[[2025-10-16]]",
              some_property: "value",
            },
          };
        }
        if (file.path === "tasks/task1.md") {
          return {
            frontmatter: {
              exo__Instance_class: "ems__Task",
              exo__Asset_label: "Task 1",
              ems__Effort_status: "[[ems__EffortStatusDoing]]",
              ems__Effort_day: "[[2025-10-16]]",
              some_reference: "[[2025-10-16 Note]]",
            },
          };
        }
        return { frontmatter: {} };
      });

      // Mock Dataview API
      const mockDataviewApi = {
        pages: jest.fn().mockReturnValue({
          values: [
            {
              file: { path: "tasks/task1.md" },
              ems__Effort_day: "[[2025-10-16]]",
            },
          ],
        }),
      };

      (mockApp as any).plugins = {
        plugins: {
          dataview: { api: mockDataviewApi },
        },
      };

      mockApp.metadataCache.resolvedLinks = {
        "tasks/task1.md": { "daily-notes/2025-10-16 Note.md": 1 },
      };

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(taskFile);
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([taskFile]);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Tasks section header is present
      const tasksHeader = container.querySelector(".exocortex-section-header");
      expect(tasksHeader?.textContent).toBe("Tasks");

      // Verify Tasks table is present
      const tasksSection = container.querySelector(".exocortex-daily-tasks-section");
      expect(tasksSection).toBeTruthy();

      const tasksTable = tasksSection?.querySelector(".exocortex-tasks-table");
      expect(tasksTable).toBeTruthy();
    });

    it("should NOT render Tasks table for non-DailyNote assets", async () => {
      const currentFile = {
        basename: "Regular Note",
        path: "notes/regular.md",
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

      // Verify Tasks table is NOT present
      const tasksSection = container.querySelector(".exocortex-daily-tasks-section");
      expect(tasksSection).toBeFalsy();
    });

    it("should NOT render Tasks table when pn__DailyNote_day is missing", async () => {
      const currentFile = {
        basename: "Daily Note",
        path: "daily-notes/note.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[pn__DailyNote]]",
          // Missing pn__DailyNote_day
        },
      });

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify Tasks table is NOT present
      const tasksSection = container.querySelector(".exocortex-daily-tasks-section");
      expect(tasksSection).toBeFalsy();
    });

    it("should NOT render Tasks table when Dataview is not available", async () => {
      const currentFile = {
        basename: "2025-10-16 Note",
        path: "daily-notes/2025-10-16 Note.md",
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[pn__DailyNote]]",
          pn__DailyNote_day: "[[2025-10-16]]",
        },
      });

      // No Dataview API
      (mockApp as any).plugins = {};

      mockApp.metadataCache.resolvedLinks = {};
      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify Tasks table is NOT present (graceful fallback)
      const tasksSection = container.querySelector(".exocortex-daily-tasks-section");
      expect(tasksSection).toBeFalsy();
    });

    it("should render Tasks table even when vault has tasks matching the day", async () => {
      // REGRESSION TEST: Previously failed when Dataview API returned empty results.
      // This test ensures tasks are always found via vault file enumeration.
      const currentFile = {
        basename: "2025-10-16 Note",
        path: "daily-notes/2025-10-16 Note.md",
      } as TFile;

      const taskFile1 = {
        basename: "Task 1",
        path: "tasks/task1.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const taskFile2 = {
        basename: "Task 2",
        path: "tasks/task2.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      const otherDayTaskFile = {
        basename: "Other Task",
        path: "tasks/other.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      // Setup mocks with realistic data
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file: TFile) => {
        if (file.path === "daily-notes/2025-10-16 Note.md") {
          return {
            frontmatter: {
              exo__Instance_class: "[[pn__DailyNote]]",
              pn__DailyNote_day: "[[2025-10-16]]",
            },
          };
        }
        if (file.path === "tasks/task1.md") {
          return {
            frontmatter: {
              exo__Instance_class: "ems__Task",
              exo__Asset_label: "Morning standup",
              ems__Effort_status: "[[ems__EffortStatusDoing]]",
              ems__Effort_day: "[[2025-10-16]]",
              ems__Effort_startTimestamp: "2025-10-16T09:00:00",
            },
          };
        }
        if (file.path === "tasks/task2.md") {
          return {
            frontmatter: {
              exo__Instance_class: "ems__Task",
              exo__Asset_label: "Code review",
              ems__Effort_status: "[[ems__EffortStatusDone]]",
              ems__Effort_day: "[[2025-10-16]]",
              ems__Effort_endTimestamp: "2025-10-16T15:00:00",
            },
          };
        }
        if (file.path === "tasks/other.md") {
          return {
            frontmatter: {
              exo__Instance_class: "ems__Task",
              exo__Asset_label: "Different day task",
              ems__Effort_day: "[[2025-10-17]]", // Different day!
            },
          };
        }
        return { frontmatter: {} };
      });

      // Mock Dataview plugin availability (but implementation doesn't matter for this test)
      (mockApp as any).plugins = {
        plugins: {
          dataview: { api: {} },
        },
      };

      mockApp.metadataCache.resolvedLinks = {};

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
        if (path === "tasks/task1.md") return taskFile1;
        if (path === "tasks/task2.md") return taskFile2;
        if (path === "tasks/other.md") return otherDayTaskFile;
        return null;
      });

      // CRITICAL: Vault returns all task files, renderer should filter by day
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([
        taskFile1,
        taskFile2,
        otherDayTaskFile, // This should be filtered out!
      ]);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Tasks section rendered
      const tasksHeader = container.querySelector(".exocortex-section-header");
      expect(tasksHeader?.textContent).toBe("Tasks");

      const tasksSection = container.querySelector(".exocortex-daily-tasks-section");
      expect(tasksSection).toBeTruthy();

      const tasksTable = tasksSection?.querySelector(".exocortex-tasks-table");
      expect(tasksTable).toBeTruthy();

      // Verify ONLY tasks for 2025-10-16 are shown (not the 2025-10-17 task)
      const taskRows = tasksTable?.querySelectorAll("tbody tr");
      expect(taskRows?.length).toBe(2);

      // Verify task content is rendered correctly
      const rowTexts = Array.from(taskRows || []).map((row) => row.textContent);
      expect(rowTexts.some((text) => text?.includes("Morning standup"))).toBeTruthy();
      expect(rowTexts.some((text) => text?.includes("Code review"))).toBeTruthy();
      expect(rowTexts.some((text) => text?.includes("Different day task"))).toBeFalsy();
    });

    it("should position Tasks table between Properties and Relations", async () => {
      const currentFile = {
        basename: "2025-10-16 Note",
        path: "daily-notes/2025-10-16 Note.md",
      } as TFile;

      const relatedTask = {
        basename: "Task 1",
        path: "tasks/task1.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation((file: TFile) => {
        if (file.path === "daily-notes/2025-10-16 Note.md") {
          return {
            frontmatter: {
              exo__Instance_class: "[[pn__DailyNote]]",
              pn__DailyNote_day: "[[2025-10-16]]",
              some_property: "value",
            },
          };
        }
        if (file.path === "tasks/task1.md") {
          return {
            frontmatter: {
              exo__Instance_class: "ems__Task",
              ems__Effort_day: "[[2025-10-16]]",
              some_reference: "[[2025-10-16 Note]]",
            },
          };
        }
        return { frontmatter: {} };
      });

      // Mock Dataview API
      const mockDataviewApi = {
        pages: jest.fn().mockReturnValue({
          values: [{ file: { path: "tasks/task1.md" }, ems__Effort_day: "[[2025-10-16]]" }],
        }),
      };

      (mockApp as any).plugins = {
        plugins: {
          dataview: { api: mockDataviewApi },
        },
      };

      mockApp.metadataCache.resolvedLinks = {
        "tasks/task1.md": { "daily-notes/2025-10-16 Note.md": 1 },
      };

      (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(currentFile);
      (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(relatedTask);
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([relatedTask]);

      await renderer.render("", container, {} as MarkdownPostProcessorContext);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify order: Properties -> Tasks -> Relations
      const children = Array.from(container.children);
      const propertiesIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-properties-section"),
      );
      const tasksIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-daily-tasks-section"),
      );
      const relationsIndex = children.findIndex((el) =>
        el.classList.contains("exocortex-assets-relations"),
      );

      expect(propertiesIndex).toBeGreaterThanOrEqual(0);
      expect(tasksIndex).toBeGreaterThanOrEqual(0);
      expect(relationsIndex).toBeGreaterThanOrEqual(0);

      // Tasks should be BETWEEN Properties and Relations
      expect(tasksIndex).toBeGreaterThan(propertiesIndex);
      expect(tasksIndex).toBeLessThan(relationsIndex);
    });
  });
});
