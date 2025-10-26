/**
 * CommandManager Unit Tests
 *
 * Comprehensive test coverage for command registration, visibility checks,
 * and execution paths. Tests all 26 commands with various file contexts.
 */

import { CommandManager } from "../../src/application/services/CommandManager";
import { TFile, Notice } from "obsidian";

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));

describe("CommandManager", () => {
  let mockApp: any;
  let mockPlugin: any;
  let commandManager: CommandManager;
  let mockFile: TFile;
  let registeredCommands: Map<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();
    registeredCommands = new Map();

    mockFile = {
      basename: "test-file",
      path: "test/path.md",
      parent: { path: "test" },
    } as unknown as TFile;

    const mockGetFileCache = jest.fn().mockReturnValue({
      frontmatter: {},
    });

    mockApp = {
      vault: {
        modify: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(mockFile),
        read: jest.fn().mockResolvedValue("---\n---"),
      },
      metadataCache: {
        getFileCache: mockGetFileCache,
      },
      workspace: {
        getActiveFile: jest.fn().mockReturnValue(mockFile),
        getLeaf: jest.fn().mockReturnValue({
          openFile: jest.fn().mockResolvedValue(undefined),
        }),
        setActiveLeaf: jest.fn(),
      },
    };

    mockPlugin = {
      addCommand: jest.fn((command: any) => {
        registeredCommands.set(command.id, command);
      }),
      settings: {
        showPropertiesSection: true,
        layoutVisible: true,
        showArchivedAssets: false,
      },
      saveSettings: jest.fn().mockResolvedValue(undefined),
      refreshLayout: jest.fn(),
    };

    commandManager = new CommandManager(mockApp);
  });

  describe("Constructor", () => {
    it("should be instantiable with App", () => {
      const mockApp = {} as any;
      const commandManager = new CommandManager(mockApp);

      expect(commandManager).toBeDefined();
      expect(commandManager).toBeInstanceOf(CommandManager);
    });
  });

  describe("Service Dependencies", () => {
    it("should initialize with required services", () => {
      const mockApp = {
        vault: {},
        metadataCache: {},
        workspace: {},
      } as any;

      const commandManager = new CommandManager(mockApp);

      expect(commandManager).toBeDefined();
    });
  });

  describe("registerAllCommands", () => {
    it("should not throw when registering commands", () => {
      expect(() => {
        commandManager.registerAllCommands(mockPlugin);
      }).not.toThrow();

      expect(mockPlugin.addCommand).toHaveBeenCalledTimes(26);
    });

    it("should register commands with correct IDs", () => {
      const registeredCommandIds: string[] = [];
      mockPlugin.addCommand = jest.fn((command: any) => {
        registeredCommandIds.push(command.id);
      });

      commandManager.registerAllCommands(mockPlugin);

      expect(registeredCommandIds).toContain("create-task");
      expect(registeredCommandIds).toContain("create-project");
      expect(registeredCommandIds).toContain("create-instance");
      expect(registeredCommandIds).toContain("create-related-task");
      expect(registeredCommandIds).toContain("set-draft-status");
      expect(registeredCommandIds).toContain("move-to-backlog");
      expect(registeredCommandIds).toContain("move-to-analysis");
      expect(registeredCommandIds).toContain("move-to-todo");
      expect(registeredCommandIds).toContain("start-effort");
      expect(registeredCommandIds).toContain("plan-on-today");
      expect(registeredCommandIds).toContain("plan-for-evening");
      expect(registeredCommandIds).toContain("shift-day-backward");
      expect(registeredCommandIds).toContain("shift-day-forward");
      expect(registeredCommandIds).toContain("mark-done");
      expect(registeredCommandIds).toContain("trash-effort");
      expect(registeredCommandIds).toContain("archive-task");
      expect(registeredCommandIds).toContain("clean-properties");
      expect(registeredCommandIds).toContain("repair-folder");
      expect(registeredCommandIds).toContain("rename-to-uid");
      expect(registeredCommandIds).toContain("vote-on-effort");
      expect(registeredCommandIds).toContain("copy-label-to-aliases");
      expect(registeredCommandIds).toContain("reload-layout");
      expect(registeredCommandIds).toContain("add-supervision");
      expect(registeredCommandIds).toContain("toggle-properties-visibility");
      expect(registeredCommandIds).toContain("toggle-layout-visibility");
      expect(registeredCommandIds).toContain("toggle-archived-assets-visibility");
    });

    it("should register commands with correct names", () => {
      const registeredNames: string[] = [];
      mockPlugin.addCommand = jest.fn((command: any) => {
        registeredNames.push(command.name);
      });

      commandManager.registerAllCommands(mockPlugin);

      expect(registeredNames).toContain("Create task");
      expect(registeredNames).toContain("Create project");
      expect(registeredNames).toContain("Create instance");
      expect(registeredNames).toContain("Create related task");
      expect(registeredNames).toContain("Set draft status");
      expect(registeredNames).toContain("Move to backlog");
      expect(registeredNames).toContain("Move to analysis");
      expect(registeredNames).toContain("Move to to-do");
      expect(registeredNames).toContain("Start effort");
      expect(registeredNames).toContain("Plan on today");
      expect(registeredNames).toContain("Plan for evening (19:00)");
      expect(registeredNames).toContain("Shift day backward");
      expect(registeredNames).toContain("Shift day forward");
      expect(registeredNames).toContain("Mark as done");
      expect(registeredNames).toContain("Trash");
      expect(registeredNames).toContain("Archive task");
      expect(registeredNames).toContain("Clean empty properties");
      expect(registeredNames).toContain("Repair folder");
      expect(registeredNames).toContain("Rename to uid");
      expect(registeredNames).toContain("Vote on effort");
      expect(registeredNames).toContain("Copy label to aliases");
      expect(registeredNames).toContain("Reload layout");
      expect(registeredNames).toContain("Add supervision");
      expect(registeredNames).toContain("Toggle properties visibility");
      expect(registeredNames).toContain("Toggle layout visibility");
      expect(registeredNames).toContain("Toggle archived assets visibility");
    });

    it("should register commands with checkCallback or callback function", () => {
      const registeredCommands: any[] = [];
      mockPlugin.addCommand = jest.fn((command: any) => {
        registeredCommands.push(command);
      });

      commandManager.registerAllCommands(mockPlugin);

      registeredCommands.forEach((command) => {
        const hasCheckCallback = typeof command.checkCallback === "function";
        const hasCallback = typeof command.callback === "function";
        expect(hasCheckCallback || hasCallback).toBe(true);
      });
    });

    it("should store reload layout callback", () => {
      const mockCallback = jest.fn();
      commandManager.registerAllCommands(mockPlugin, mockCallback);

      const reloadCommand = registeredCommands.get("reload-layout");
      expect(reloadCommand).toBeDefined();
      expect(typeof reloadCommand.callback).toBe("function");

      reloadCommand.callback();
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe("Command Visibility - No Active File", () => {
    beforeEach(() => {
      mockApp.workspace.getActiveFile.mockReturnValue(null);
      commandManager.registerAllCommands(mockPlugin);
    });

    const checkCallbackCommands = [
      "create-task",
      "create-project",
      "create-instance",
      "create-related-task",
      "set-draft-status",
      "move-to-backlog",
      "move-to-analysis",
      "move-to-todo",
      "start-effort",
      "plan-on-today",
      "plan-for-evening",
      "shift-day-backward",
      "shift-day-forward",
      "mark-done",
      "trash-effort",
      "archive-task",
      "clean-properties",
      "repair-folder",
      "rename-to-uid",
      "vote-on-effort",
      "copy-label-to-aliases",
    ];

    checkCallbackCommands.forEach((commandId) => {
      it(`should return false for ${commandId} when no active file`, () => {
        const command = registeredCommands.get(commandId);
        expect(command).toBeDefined();
        const result = command.checkCallback(true);
        expect(result).toBe(false);
      });
    });
  });

  describe("Create Task Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Area class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
        },
      });

      const command = registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should be visible for Project class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
        },
      });

      const command = registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should be visible even for archived Area", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_isArchived: true,
        },
      });

      const command = registeredCommands.get("create-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Create Project Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Area class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
        },
      });

      const command = registeredCommands.get("create-project");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should be visible for Project class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
        },
      });

      const command = registeredCommands.get("create-project");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Create Instance Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task Prototype class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__TaskPrototype]]",
        },
      });

      const command = registeredCommands.get("create-instance");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("create-instance");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Create Related Task Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task class", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("create-related-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for archived Task", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          exo__Asset_isArchived: true,
        },
      });

      const command = registeredCommands.get("create-related-task");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Set Draft Status Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task without status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("set-draft-status");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with Draft status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDraft",
        },
      });

      const command = registeredCommands.get("set-draft-status");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Move To Backlog Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with Draft status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDraft",
        },
      });

      const command = registeredCommands.get("move-to-backlog");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with Backlog status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = registeredCommands.get("move-to-backlog");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Move To Analysis Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Project with Backlog status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = registeredCommands.get("move-to-analysis");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Move To ToDo Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Project with Analysis status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Project]]",
          ems__Effort_status: "ems__EffortStatusAnalysis",
        },
      });

      const command = registeredCommands.get("move-to-todo");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Start Effort Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with Backlog status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = registeredCommands.get("start-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with In Progress status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDoing",
        },
      });

      const command = registeredCommands.get("start-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Plan On Today Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with ToDo status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusToDo",
        },
      });

      const command = registeredCommands.get("plan-on-today");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Plan For Evening Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with Backlog status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusBacklog",
        },
      });

      const command = registeredCommands.get("plan-for-evening");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Shift Day Backward Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with effort day", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_day: "2025-01-20",
        },
      });

      const command = registeredCommands.get("shift-day-backward");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task without effort day", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("shift-day-backward");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Shift Day Forward Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with effort day", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_day: "2025-01-20",
        },
      });

      const command = registeredCommands.get("shift-day-forward");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Mark Done Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with In Progress status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDoing",
        },
      });

      const command = registeredCommands.get("mark-done");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for Task with Done status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDone",
        },
      });

      const command = registeredCommands.get("mark-done");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Trash Effort Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task not trashed", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("trash-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for trashed Task", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusTrashed",
        },
      });

      const command = registeredCommands.get("trash-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Archive Task Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for Task with Done status", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDone",
        },
      });

      const command = registeredCommands.get("archive-task");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for archived Task", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          ems__Effort_status: "ems__EffortStatusDone",
          exo__Asset_isArchived: true,
        },
      });

      const command = registeredCommands.get("archive-task");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Clean Properties Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for file with empty properties", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          empty_prop: "",
          null_prop: null,
        },
      });

      const command = registeredCommands.get("clean-properties");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for file without empty properties", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("clean-properties");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should not be visible for file without frontmatter", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: null,
      });

      const command = registeredCommands.get("clean-properties");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Repair Folder Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for file with isDefinedBy property", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_isDefinedBy: "[[ems__Area]]",
        },
      });

      const command = registeredCommands.get("repair-folder");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for file without isDefinedBy property", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      });

      const command = registeredCommands.get("repair-folder");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Rename To UID Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible when filename differs from UID", () => {
      mockFile = {
        basename: "wrong-name",
        path: "test/wrong-name.md",
        parent: { path: "test" },
      } as unknown as TFile;
      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "correct-uid",
        },
      });

      const command = registeredCommands.get("rename-to-uid");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible when filename matches UID", () => {
      mockFile = {
        basename: "matching-uid",
        path: "test/matching-uid.md",
        parent: { path: "test" },
      } as unknown as TFile;
      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_uid: "matching-uid",
        },
      });

      const command = registeredCommands.get("rename-to-uid");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Vote On Effort Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for non-archived Task", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
        },
      });

      const command = registeredCommands.get("vote-on-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for archived Task", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[ems__Task]]",
          exo__Asset_isArchived: true,
        },
      });

      const command = registeredCommands.get("vote-on-effort");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });
  });

  describe("Copy Label To Aliases Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be visible for file with label", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "Test Label",
        },
      });

      const command = registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });

    it("should not be visible for file without label", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {},
      });

      const command = registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should not be visible for file with empty label", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "",
        },
      });

      const command = registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(false);
    });

    it("should be visible when label not in aliases", () => {
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "Test Label",
          aliases: ["Other Alias"],
        },
      });

      const command = registeredCommands.get("copy-label-to-aliases");
      const result = command.checkCallback(true);
      expect(result).toBe(true);
    });
  });

  describe("Reload Layout Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be always available", () => {
      const command = registeredCommands.get("reload-layout");
      expect(command).toBeDefined();
      expect(typeof command.callback).toBe("function");
    });

    it("should call reload callback when executed", () => {
      const mockCallback = jest.fn();
      commandManager.registerAllCommands(mockPlugin, mockCallback);

      const command = registeredCommands.get("reload-layout");
      command.callback();

      expect(mockCallback).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Layout reloaded");
    });

    it("should show failure notice when callback not set", () => {
      commandManager.registerAllCommands(mockPlugin);

      const command = registeredCommands.get("reload-layout");
      command.callback();

      expect(Notice).toHaveBeenCalledWith("Failed to reload layout");
    });
  });

  describe("Add Supervision Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be always available", () => {
      const command = registeredCommands.get("add-supervision");
      expect(command).toBeDefined();
      expect(typeof command.callback).toBe("function");
    });
  });

  describe("Toggle Properties Visibility Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be always available", () => {
      const command = registeredCommands.get("toggle-properties-visibility");
      expect(command).toBeDefined();
      expect(typeof command.callback).toBe("function");
    });

    it("should toggle properties visibility when executed", async () => {
      const command = registeredCommands.get("toggle-properties-visibility");

      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
      await command.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(false);

      await command.callback();
      expect(mockPlugin.settings.showPropertiesSection).toBe(true);
    });

    it("should save settings when toggled", async () => {
      const command = registeredCommands.get("toggle-properties-visibility");
      await command.callback();

      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    it("should refresh layout when toggled", async () => {
      const command = registeredCommands.get("toggle-properties-visibility");
      await command.callback();

      expect(mockPlugin.refreshLayout).toHaveBeenCalled();
    });

    it("should show notice when toggled to shown", async () => {
      mockPlugin.settings.showPropertiesSection = false;
      const command = registeredCommands.get("toggle-properties-visibility");
      await command.callback();

      expect(Notice).toHaveBeenCalledWith("Properties section shown");
    });

    it("should show notice when toggled to hidden", async () => {
      mockPlugin.settings.showPropertiesSection = true;
      const command = registeredCommands.get("toggle-properties-visibility");
      await command.callback();

      expect(Notice).toHaveBeenCalledWith("Properties section hidden");
    });
  });

  describe("Toggle Layout Visibility Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be always available", () => {
      const command = registeredCommands.get("toggle-layout-visibility");
      expect(command).toBeDefined();
      expect(typeof command.callback).toBe("function");
    });

    it("should toggle layout visibility when executed", async () => {
      const command = registeredCommands.get("toggle-layout-visibility");

      expect(mockPlugin.settings.layoutVisible).toBe(true);
      await command.callback();
      expect(mockPlugin.settings.layoutVisible).toBe(false);

      await command.callback();
      expect(mockPlugin.settings.layoutVisible).toBe(true);
    });

    it("should save settings when toggled", async () => {
      const command = registeredCommands.get("toggle-layout-visibility");
      await command.callback();

      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    it("should refresh layout when toggled", async () => {
      const command = registeredCommands.get("toggle-layout-visibility");
      await command.callback();

      expect(mockPlugin.refreshLayout).toHaveBeenCalled();
    });

    it("should show notice when toggled to shown", async () => {
      mockPlugin.settings.layoutVisible = false;
      const command = registeredCommands.get("toggle-layout-visibility");
      await command.callback();

      expect(Notice).toHaveBeenCalledWith("Layout shown");
    });

    it("should show notice when toggled to hidden", async () => {
      mockPlugin.settings.layoutVisible = true;
      const command = registeredCommands.get("toggle-layout-visibility");
      await command.callback();

      expect(Notice).toHaveBeenCalledWith("Layout hidden");
    });
  });

  describe("Toggle Archived Assets Visibility Command", () => {
    beforeEach(() => {
      commandManager.registerAllCommands(mockPlugin);
    });

    it("should be always available", () => {
      const command = registeredCommands.get("toggle-archived-assets-visibility");
      expect(command).toBeDefined();
      expect(typeof command.callback).toBe("function");
    });

    it("should toggle archived assets visibility when executed", async () => {
      const command = registeredCommands.get("toggle-archived-assets-visibility");

      expect(mockPlugin.settings.showArchivedAssets).toBe(false);
      await command.callback();
      expect(mockPlugin.settings.showArchivedAssets).toBe(true);

      await command.callback();
      expect(mockPlugin.settings.showArchivedAssets).toBe(false);
    });

    it("should save settings when toggled", async () => {
      const command = registeredCommands.get("toggle-archived-assets-visibility");
      await command.callback();

      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    it("should refresh layout when toggled", async () => {
      const command = registeredCommands.get("toggle-archived-assets-visibility");
      await command.callback();

      expect(mockPlugin.refreshLayout).toHaveBeenCalled();
    });

    it("should show notice when toggled to shown", async () => {
      mockPlugin.settings.showArchivedAssets = false;
      const command = registeredCommands.get("toggle-archived-assets-visibility");
      await command.callback();

      expect(Notice).toHaveBeenCalledWith("Archived assets shown");
    });

    it("should show notice when toggled to hidden", async () => {
      mockPlugin.settings.showArchivedAssets = true;
      const command = registeredCommands.get("toggle-archived-assets-visibility");
      await command.callback();

      expect(Notice).toHaveBeenCalledWith("Archived assets hidden");
    });
  });
});
