import { DailyTasksRenderer } from "../../src/presentation/renderers/DailyTasksRenderer";
import { TFile } from "obsidian";
import { ExocortexSettings } from "../../src/domain/settings/ExocortexSettings";
import { ILogger } from "../../src/infrastructure/logging/ILogger";
import { MetadataExtractor } from "../../src/infrastructure/utilities/MetadataExtractor";
import { ReactRenderer } from "../../src/presentation/utils/ReactRenderer";

describe("DailyTasksRenderer", () => {
  let renderer: DailyTasksRenderer;
  let mockApp: any;
  let mockSettings: ExocortexSettings;
  let mockPlugin: any;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMetadataExtractor: jest.Mocked<MetadataExtractor>;
  let mockReactRenderer: jest.Mocked<ReactRenderer>;
  let mockRefresh: jest.Mock;

  const createMockElement = (): any => {
    const el: any = document.createElement("div");
    el.createDiv = (opts?: any) => {
      const div: any = document.createElement("div");
      if (opts?.cls) div.className = opts.cls;
      el.appendChild(div);
      div.createEl = (tag: string, opts?: any) => {
        const element = document.createElement(tag);
        if (opts?.cls) element.className = opts.cls;
        if (opts?.text) element.textContent = opts.text;
        div.appendChild(element);
        return element;
      };
      div.createDiv = el.createDiv;
      div.createSpan = (opts?: any) => {
        const span = document.createElement("span");
        if (opts?.text) span.textContent = opts.text;
        div.appendChild(span);
        return span;
      };
      return div;
    };
    return el;
  };

  beforeEach(() => {
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
      },
      metadataCache: {
        getFileCache: jest.fn(),
        getFirstLinkpathDest: jest.fn(),
      },
      workspace: {
        getLeaf: jest.fn().mockReturnValue({
          openLinkText: jest.fn(),
        }),
        openLinkText: jest.fn(),
      },
    };

    mockSettings = {
      activeFocusArea: null,
      showEffortArea: true,
      showEffortVotes: true,
    } as ExocortexSettings;

    mockPlugin = {
      saveSettings: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    mockMetadataExtractor = {
      extractMetadata: jest.fn(),
      extractInstanceClass: jest.fn(),
      extractStatus: jest.fn(),
      extractIsArchived: jest.fn(),
    } as any;

    mockReactRenderer = {
      render: jest.fn(),
      unmount: jest.fn(),
    } as any;

    mockRefresh = jest.fn();

    renderer = new DailyTasksRenderer(
      mockApp,
      mockSettings,
      mockPlugin,
      mockLogger,
      mockMetadataExtractor,
      mockReactRenderer,
      mockRefresh,
    );
  });

  describe("render", () => {
    it("should not render for non-daily-note files", async () => {
      const mockFile = { path: "test.md", parent: { path: "Tasks" }, basename: "TestTask" } as TFile;
      const metadata = { exo__Instance_class: "[[ems__Task]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue("[[ems__Task]]");

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockEl.children.length).toBe(0);
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should not render when pn__DailyNote_day is missing", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = { exo__Instance_class: "[[pn__DailyNote]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue("[[pn__DailyNote]]");

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith("No pn__DailyNote_day found for daily note");
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should not render when no tasks found for the day", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue("[[pn__DailyNote]]");
      mockApp.vault.getMarkdownFiles.mockReturnValue([]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith("No tasks found for day: 2025-10-20");
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should render tasks section when tasks exist", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task"
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]"
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[pn__DailyNote]]");

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockEl.querySelector(".exocortex-daily-tasks-section")).toBeTruthy();
      expect(mockEl.querySelector("h3")).toBeTruthy();
      expect(mockEl.querySelector("h3")?.textContent).toBe("Tasks");
      expect(mockReactRenderer.render).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Rendered 1 tasks"));
    });

    it("should filter out projects from daily tasks", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      const projectFile = {
        path: "project.md",
        basename: "test-project"
      } as TFile;

      const projectMetadata = {
        exo__Instance_class: "[[ems__Project]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusToDo]]"
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(projectMetadata);

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[pn__DailyNote]]");

      mockApp.vault.getMarkdownFiles.mockReturnValue([projectFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith("No tasks found for day: 2025-10-20");
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should handle pn__DailyNote_day without brackets", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "2025-10-20"
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task"
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "2025-10-20",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]"
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[pn__DailyNote]]");

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Rendered 1 tasks"));
    });

    it("should handle instance class without brackets", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "pn__DailyNote",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue("pn__DailyNote");

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should handle array of instance classes", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: ["[[pn__DailyNote]]", "[[other]]"],
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(["[[pn__DailyNote]]", "[[other]]"]);

      mockApp.vault.getMarkdownFiles.mockReturnValue([]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should handle task with blockers", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task"
      } as TFile;

      const blockerFile = {
        path: "blocker.md",
        basename: "blocker-task"
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_blocker: "[[blocker-task]]"
      };

      const blockerMetadata = {
        ems__Effort_status: "[[ems__EffortStatusBacklog]]"
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[pn__DailyNote]]");

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(blockerFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: blockerMetadata
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isBlocked).toBe(true);
    });

    it("should mark task as not blocked when blocker is done", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task"
      } as TFile;

      const blockerFile = {
        path: "blocker.md",
        basename: "blocker-task"
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_blocker: "[[blocker-task]]"
      };

      const blockerMetadata = {
        ems__Effort_status: "[[ems__EffortStatusDone]]"
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[pn__DailyNote]]");

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(blockerFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: blockerMetadata
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isBlocked).toBe(false);
    });

    it("should limit results to 50 tasks", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      const taskFiles = Array.from({ length: 60 }, (_, i) => ({
        path: `task-${i}.md`,
        basename: `task-${i}`
      } as TFile));

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]"
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata);

      taskFiles.forEach(() => {
        mockMetadataExtractor.extractMetadata.mockReturnValueOnce(taskMetadata);
      });

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[pn__DailyNote]]");

      mockApp.vault.getMarkdownFiles.mockReturnValue(taskFiles);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(50);
    });

    it("should handle error gracefully", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue("[[pn__DailyNote]]");
      mockApp.vault.getMarkdownFiles.mockImplementation(() => {
        throw new Error("Vault error");
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith("No tasks found for day: 2025-10-20");
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should format timestamps correctly", async () => {
      const mockFile = { path: "test.md", parent: { path: "DailyNotes" }, basename: "2025-10-20" } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]"
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task"
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00.000Z",
        ems__Effort_endTimestamp: "2025-10-20T17:00:00.000Z"
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass
        .mockReturnValueOnce("[[pn__DailyNote]]");

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].startTime).toBeTruthy();
      expect(tasks[0].endTime).toBeTruthy();
    });
  });
});
