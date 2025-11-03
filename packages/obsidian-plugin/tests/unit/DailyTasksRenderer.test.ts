import { DailyTasksRenderer } from "../../src/presentation/renderers/DailyTasksRenderer";
import { TFile, Keymap } from "obsidian";
import { ExocortexSettings } from "../../src/domain/settings/ExocortexSettings";
import { ILogger } from "../../src/infrastructure/logging/ILogger";
import { MetadataExtractor } from "@exocortex/core";
import { ReactRenderer } from "../../src/presentation/utils/ReactRenderer";
import { AssetMetadataService } from "../../src/presentation/renderers/layout/helpers/AssetMetadataService";

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Keymap: {
    isModEvent: jest.fn(),
  },
}));

describe("DailyTasksRenderer", () => {
  let renderer: DailyTasksRenderer;
  let mockApp: any;
  let mockSettings: ExocortexSettings;
  let mockPlugin: any;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMetadataExtractor: jest.Mocked<MetadataExtractor>;
  let mockReactRenderer: jest.Mocked<ReactRenderer>;
  let mockRefresh: jest.Mock;
  let mockMetadataService: jest.Mocked<AssetMetadataService>;

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
    jest.clearAllMocks();

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

    // Create a real AssetMetadataService instance for tests
    const realMetadataService = new AssetMetadataService(mockApp);
    
    mockMetadataService = {
      getAssetLabel: jest.fn((path) => realMetadataService.getAssetLabel(path)),
      extractFirstValue: jest.fn((value) => realMetadataService.extractFirstValue(value)),
      getEffortArea: jest.fn((metadata, visited) => realMetadataService.getEffortArea(metadata, visited)),
      extractInstanceClass: jest.fn((metadata) => realMetadataService.extractInstanceClass(metadata)),
    } as any;

    renderer = new DailyTasksRenderer(
      mockApp,
      mockSettings,
      mockPlugin,
      mockLogger,
      mockMetadataExtractor,
      mockReactRenderer,
      mockRefresh,
      mockMetadataService,
    );
  });

  describe("render", () => {
    it("should not render for non-daily-note files", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "Tasks" },
        basename: "TestTask",
      } as TFile;
      const metadata = { exo__Instance_class: "[[ems__Task]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[ems__Task]]",
      );

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockEl.children.length).toBe(0);
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it.skip("should render active focus area indicator when focus area is set", async () => {
      mockSettings.activeFocusArea = "Development";

      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: "[[Development]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const focusIndicator = mockEl.querySelector(
        ".exocortex-active-focus-indicator",
      );
      expect(focusIndicator).toBeTruthy();
      expect(focusIndicator?.textContent).toContain("Development");
    });

    it("should not render focus area indicator when no active focus", async () => {
      mockSettings.activeFocusArea = null;

      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const focusIndicator = mockEl.querySelector(
        ".exocortex-active-focus-indicator",
      );
      expect(focusIndicator).toBeNull();
    });

    it("should not render when pn__DailyNote_day is missing", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = { exo__Instance_class: "[[pn__DailyNote]]" };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No pn__DailyNote_day found for daily note",
      );
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should not render when no tasks found for the day", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );
      mockApp.vault.getMarkdownFiles.mockReturnValue([]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No tasks found for day: 2025-10-20",
      );
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should render tasks section when tasks exist", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(
        mockEl.querySelector(".exocortex-daily-tasks-section"),
      ).toBeTruthy();
      expect(mockEl.querySelector("h3")).toBeTruthy();
      expect(mockEl.querySelector("h3")?.textContent).toBe("Tasks");
      expect(mockReactRenderer.render).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Rendered 1 tasks"),
      );
    });

    it("should filter out projects from daily tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const projectFile = {
        path: "project.md",
        basename: "test-project",
      } as TFile;

      const projectMetadata = {
        exo__Instance_class: "[[ems__Project]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusToDo]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(projectMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([projectFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No tasks found for day: 2025-10-20",
      );
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should handle pn__DailyNote_day without brackets", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "2025-10-20",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "2025-10-20",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Rendered 1 tasks"),
      );
    });

    it("should handle instance class without brackets", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "pn__DailyNote",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "pn__DailyNote",
      );

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should handle array of instance classes", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: ["[[pn__DailyNote]]", "[[other]]"],
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[pn__DailyNote]]",
        "[[other]]",
      ]);

      mockApp.vault.getMarkdownFiles.mockReturnValue([]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should handle task with blockers", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const blockerFile = {
        path: "blocker.md",
        basename: "blocker-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_blocker: "[[blocker-task]]",
      };

      const blockerMetadata = {
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(blockerFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: blockerMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isBlocked).toBe(true);
    });

    it("should mark task as not blocked when blocker is done", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const blockerFile = {
        path: "blocker.md",
        basename: "blocker-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_blocker: "[[blocker-task]]",
      };

      const blockerMetadata = {
        ems__Effort_status: "[[ems__EffortStatusDone]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(blockerFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: blockerMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isBlocked).toBe(false);
    });

    it("should limit results to 50 tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFiles = Array.from(
        { length: 60 },
        (_, i) =>
          ({
            path: `task-${i}.md`,
            basename: `task-${i}`,
          }) as TFile,
      );

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValueOnce(metadata);

      taskFiles.forEach(() => {
        mockMetadataExtractor.extractMetadata.mockReturnValueOnce(taskMetadata);
      });

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue(taskFiles);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(50);
    });

    it("should handle error gracefully", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(metadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "[[pn__DailyNote]]",
      );
      mockApp.vault.getMarkdownFiles.mockImplementation(() => {
        throw new Error("Vault error");
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No tasks found for day: 2025-10-20",
      );
      expect(mockReactRenderer.render).not.toHaveBeenCalled();
    });

    it("should format timestamps correctly", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00.000Z",
        ems__Effort_endTimestamp: "2025-10-20T17:00:00.000Z",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

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

  describe("React component callbacks", () => {
    it("should toggle showEffortArea and refresh", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const onToggleEffortArea = renderCall[1].props.onToggleEffortArea;

      expect(mockSettings.showEffortArea).toBe(true);
      await onToggleEffortArea();

      expect(mockSettings.showEffortArea).toBe(false);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("should toggle showEffortVotes and refresh", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const onToggleEffortVotes = renderCall[1].props.onToggleEffortVotes;

      expect(mockSettings.showEffortVotes).toBe(true);
      await onToggleEffortVotes();

      expect(mockSettings.showEffortVotes).toBe(false);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("should handle task click without modifier key", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const onTaskClick = renderCall[1].props.onTaskClick;

      const mockEvent = {
        nativeEvent: {},
      } as React.MouseEvent;

      (Keymap.isModEvent as jest.Mock).mockReturnValue(false);
      await onTaskClick("task.md", mockEvent);

      expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
        "task.md",
        "",
        false,
      );
    });

    it("should handle task click with modifier key (new tab)", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockLeaf = {
        openLinkText: jest.fn(),
      };
      mockApp.workspace.getLeaf.mockReturnValue(mockLeaf);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const onTaskClick = renderCall[1].props.onTaskClick;

      const mockEvent = {
        nativeEvent: {
          ctrlKey: true,
        },
      } as React.MouseEvent;

      (Keymap.isModEvent as jest.Mock).mockReturnValue(true);
      await onTaskClick("task.md", mockEvent);

      expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
      expect(mockLeaf.openLinkText).toHaveBeenCalledWith("task.md", "");
    });
  });

  describe("getDailyTasks filtering", () => {
    it("should filter tasks without ems__Effort_day", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile1 = {
        path: "task1.md",
        basename: "task1",
      } as TFile;

      const taskFile2 = {
        path: "task2.md",
        basename: "task2",
      } as TFile;

      const taskMetadata1 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      const taskMetadata2 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata1)
        .mockReturnValueOnce(taskMetadata2);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile1, taskFile2]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].path).toBe("task2.md");
    });

    it("should filter tasks for different days", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile1 = {
        path: "task1.md",
        basename: "task1",
      } as TFile;

      const taskFile2 = {
        path: "task2.md",
        basename: "task2",
      } as TFile;

      const taskMetadata1 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-21]]",
        ems__Effort_startTimestamp: "2025-10-21T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      const taskMetadata2 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata1)
        .mockReturnValueOnce(taskMetadata2);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile1, taskFile2]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].path).toBe("task2.md");
    });

    it("should filter out projects from daily tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const projectFile = {
        path: "project.md",
        basename: "project",
      } as TFile;

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const projectMetadata = {
        exo__Instance_class: ["[[ems__Project]]"],
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(projectMetadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([projectFile, taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].path).toBe("task.md");
    });

    it.skip("should filter by active focus area", async () => {
      mockSettings.activeFocusArea = "Development";

      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile1 = {
        path: "task1.md",
        basename: "task1",
      } as TFile;

      const taskFile2 = {
        path: "task2.md",
        basename: "task2",
      } as TFile;

      const taskMetadata1 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: "[[Development]]",
      };

      const taskMetadata2 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: "[[Marketing]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata1)
        .mockReturnValueOnce(taskMetadata2);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile1, taskFile2]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].path).toBe("task1.md");
    });

    it("should include child areas when filtering by focus area", async () => {
      mockSettings.activeFocusArea = "Engineering";

      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile1 = {
        path: "task1.md",
        basename: "task1",
      } as TFile;

      const taskFile2 = {
        path: "task2.md",
        basename: "task2",
      } as TFile;

      const areaFile = {
        path: "Frontend.md",
        basename: "Frontend",
      } as TFile;

      const taskMetadata1 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: "[[Frontend]]",
      };

      const taskMetadata2 = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: "[[Marketing]]",
      };

      const areaMetadata = {
        ems__Area_parent: "[[Engineering]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata1)
        .mockReturnValueOnce(taskMetadata2)
        .mockReturnValueOnce(areaMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles
        .mockReturnValueOnce([taskFile1, taskFile2])
        .mockReturnValueOnce([areaFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].path).toBe("task1.md");
    });
  });

  describe("timestamp formatting", () => {
    it("should format valid timestamps correctly", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00.000Z",
        ems__Effort_endTimestamp: "2025-10-20T17:00:00.000Z",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].startTime).toBeTruthy();
      expect(tasks[0].endTime).toBeTruthy();
    });

    it("should handle invalid timestamps gracefully", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_plannedStartTimestamp: "2025-10-20T09:00:00", // Valid timestamp for filtering
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
        ems__Effort_startTimestamp: "invalid",
        ems__Effort_endTimestamp: "also-invalid",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].startTime).toBe("");
      expect(tasks[0].endTime).toBe("");
    });

    it("should handle null/undefined timestamps", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
        ems__Effort_plannedEndTimestamp: "2025-10-20T18:00:00", // Valid timestamp for filtering, but not used for display
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].startTime).toBe("");
      expect(tasks[0].endTime).toBe("");
    });

    it("should fallback to planned timestamps when actual not available", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "test-task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusToDo]]",
        ems__Effort_plannedStartTimestamp: "2025-10-20T10:00:00.000Z",
        ems__Effort_plannedEndTimestamp: "2025-10-20T12:00:00.000Z",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

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

  describe("task properties", () => {
    it("should correctly identify meeting tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "meeting.md",
        basename: "meeting",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: ["[[ems__Task]]", "[[ems__Meeting]]"],
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusToDo]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isMeeting).toBe(true);
    });

    it("should correctly identify done tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusDone]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isDone).toBe(true);
      expect(tasks[0].isTrashed).toBe(false);
      expect(tasks[0].isDoing).toBe(false);
    });

    it("should correctly identify trashed tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusTrashed]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isTrashed).toBe(true);
      expect(tasks[0].isDone).toBe(false);
      expect(tasks[0].isDoing).toBe(false);
    });

    it("should correctly identify doing tasks", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isDoing).toBe(true);
      expect(tasks[0].isDone).toBe(false);
      expect(tasks[0].isTrashed).toBe(false);
    });

    it("should use exo__Asset_label when available", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task-filename",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        exo__Asset_label: "Custom Task Label",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].label).toBe("Custom Task Label");
    });

    it("should fallback to basename when no label", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task-filename",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].label).toBe("task-filename");
    });
  });

  describe("extractFirstValue", () => {
    it("should extract string value without brackets", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: "[[Development]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(taskMetadata);
      expect(result).toBe("Development");
    });

    it("should extract first value from array", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: ["[[Development]]", "[[Backend]]"],
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(taskMetadata);
      expect(result).toBe("Development");
    });

    it("should return null for empty value", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(taskMetadata);
      expect(result).toBeNull();
    });

    it("should return null for empty array", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: [],
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(taskMetadata);
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only string", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_area: "   ",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(taskMetadata);
      expect(result).toBeNull();
    });
  });

  describe("getEffortArea with prototype resolution", () => {
    it.skip("should resolve area from prototype when not set directly", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const prototypeFile = {
        path: "prototype.md",
        basename: "prototype",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_prototype: "[[prototype]]",
      };

      const prototypeMetadata = {
        ems__Effort_area: "[[Development]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(prototypeFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: prototypeMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(taskMetadata);
      expect(result).toBe("Development");
    });

    it("should resolve area from parent when not set directly", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const parentFile = new TFile();
      Object.assign(parentFile, { path: "parent.md", basename: "parent" });

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_parent: "[[parent]]",
      };

      const parentMetadata = {
        ems__Effort_area: "[[QA]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(parentFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: parentMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const props = renderCall[1].props;
      const tasks = props.tasks;

      expect(tasks).toHaveLength(1);
      expect(props.showEffortArea).toBe(true);

      const resolvedArea = props.getEffortArea(tasks[0].metadata);

      expect(resolvedArea).toBe("QA");
      expect(mockMetadataService.getEffortArea).toHaveBeenCalledWith(
        tasks[0].metadata,
      );
    });

    it("should prevent infinite loops with circular references", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_parent: "[[task]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(taskFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: taskMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(taskMetadata);
      expect(result).toBeNull();
    });

    it("should return null for invalid metadata", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getEffortArea = renderCall[1].props.getEffortArea;
      const result = getEffortArea(null);
      expect(result).toBeNull();
    });
  });

  describe("getAssetLabel with prototype fallback", () => {
    it.skip("should return label from file when available", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const linkedFile = {
        path: "linked.md",
        basename: "linked",
      } as TFile;

      const linkedMetadata = {
        exo__Asset_label: "Linked Label",
      };

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(linkedFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: linkedMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getAssetLabel = renderCall[1].props.getAssetLabel;
      const result = getAssetLabel("linked");
      expect(result).toBe("Linked Label");
    });

    it.skip("should fallback to prototype label when direct label not available", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const linkedFile = {
        path: "linked.md",
        basename: "linked",
      } as TFile;

      const prototypeFile = {
        path: "prototype.md",
        basename: "prototype",
      } as TFile;

      const linkedMetadata = {
        ems__Effort_prototype: "[[prototype]]",
      };

      const prototypeMetadata = {
        exo__Asset_label: "Prototype Label",
      };

      mockApp.metadataCache.getFirstLinkpathDest
        .mockReturnValueOnce(linkedFile)
        .mockReturnValueOnce(prototypeFile);

      mockApp.metadataCache.getFileCache
        .mockReturnValueOnce({ frontmatter: linkedMetadata })
        .mockReturnValueOnce({ frontmatter: prototypeMetadata });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getAssetLabel = renderCall[1].props.getAssetLabel;
      const result = getAssetLabel("linked");
      expect(result).toBe("Prototype Label");
    });

    it("should return null when file not found", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(null);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getAssetLabel = renderCall[1].props.getAssetLabel;
      const result = getAssetLabel("nonexistent");
      expect(result).toBeNull();
    });

    it.skip("should try adding .md extension when file not found", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const linkedFile = {
        path: "linked.md",
        basename: "linked",
      } as TFile;

      const linkedMetadata = {
        exo__Asset_label: "Found with .md",
      };

      mockApp.metadataCache.getFirstLinkpathDest
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(linkedFile);

      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: linkedMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getAssetLabel = renderCall[1].props.getAssetLabel;
      const result = getAssetLabel("linked");
      expect(result).toBe("Found with .md");
    });

    it("should return null when label is whitespace only", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const linkedFile = {
        path: "linked.md",
        basename: "linked",
      } as TFile;

      const linkedMetadata = {
        exo__Asset_label: "   ",
      };

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(linkedFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: linkedMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      const renderCall = mockReactRenderer.render.mock.calls[0];
      const getAssetLabel = renderCall[1].props.getAssetLabel;
      const result = getAssetLabel("linked");
      expect(result).toBeNull();
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle blocker with trashed status", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const blockerFile = {
        path: "blocker.md",
        basename: "blocker",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_blocker: "[[blocker]]",
      };

      const blockerMetadata = {
        ems__Effort_status: "[[ems__EffortStatusTrashed]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(blockerFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: blockerMetadata,
      });

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isBlocked).toBe(false);
    });

    it("should handle blocker file not found", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "[[ems__EffortStatusBacklog]]",
        ems__Effort_blocker: "[[nonexistent]]",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(null);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks[0].isBlocked).toBe(false);
    });

    it("should handle mixed instance class formats", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "ems__Task",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_startTimestamp: "2025-10-20T09:00:00",
        ems__Effort_status: "ems__EffortStatusBacklog",
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

      mockApp.vault.getMarkdownFiles.mockReturnValue([taskFile]);

      const mockEl = createMockElement();
      await renderer.render(mockEl, mockFile);

      expect(mockReactRenderer.render).toHaveBeenCalled();
      const renderCall = mockReactRenderer.render.mock.calls[0];
      const tasks = renderCall[1].props.tasks;
      expect(tasks.length).toBe(1);
    });

    it("should handle numeric timestamp values", async () => {
      const mockFile = {
        path: "test.md",
        parent: { path: "DailyNotes" },
        basename: "2025-10-20",
      } as TFile;
      const metadata = {
        exo__Instance_class: "[[pn__DailyNote]]",
        pn__DailyNote_day: "[[2025-10-20]]",
      };

      const taskFile = {
        path: "task.md",
        basename: "task",
      } as TFile;

      const taskMetadata = {
        exo__Instance_class: "[[ems__Task]]",
        ems__Effort_day: "[[2025-10-20]]",
        ems__Effort_status: "[[ems__EffortStatusDoing]]",
        ems__Effort_startTimestamp: 1760932800000, // 2025-10-20T09:00:00
        ems__Effort_endTimestamp: 1760961600000, // 2025-10-20T17:00:00
      };

      mockMetadataExtractor.extractMetadata
        .mockReturnValueOnce(metadata)
        .mockReturnValueOnce(taskMetadata);

      mockMetadataExtractor.extractInstanceClass.mockReturnValueOnce(
        "[[pn__DailyNote]]",
      );

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
