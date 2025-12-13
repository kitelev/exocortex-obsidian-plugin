import { flushPromises } from "./helpers/testHelpers";
import { CreateInstanceCommand } from "../../src/application/commands/CreateInstanceCommand";
import { App, TFile, Notice, WorkspaceLeaf, EventRef } from "obsidian";
import {
  TaskCreationService,
  CommandVisibilityContext,
  LoggingService,
  WikiLinkHelpers,
  AssetClass
} from "@exocortex/core";
import { LabelInputModal } from "../../src/presentation/modals/LabelInputModal";
import { DynamicAssetCreationModal } from "../../src/presentation/modals/DynamicAssetCreationModal";
import { ObsidianVaultAdapter } from "../../src/adapters/ObsidianVaultAdapter";
import { ExocortexPluginInterface } from "../../src/types";

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));
jest.mock("../../src/presentation/modals/LabelInputModal");
jest.mock("../../src/presentation/modals/DynamicAssetCreationModal");
jest.mock("@exocortex/core", () => ({
  ...jest.requireActual("@exocortex/core"),
  canCreateInstance: jest.fn(),
  LoggingService: {
    error: jest.fn(),
  },
  WikiLinkHelpers: {
    normalize: jest.fn(),
  },
  AssetClass: {
    MEETING_PROTOTYPE: "MeetingPrototype",
  },
}));

describe("CreateInstanceCommand", () => {
  let command: CreateInstanceCommand;
  let mockApp: jest.Mocked<App>;
  let mockTaskCreationService: jest.Mocked<TaskCreationService>;
  let mockVaultAdapter: jest.Mocked<ObsidianVaultAdapter>;
  let mockPlugin: jest.Mocked<ExocortexPluginInterface>;
  let mockFile: jest.Mocked<TFile>;
  let mockContext: CommandVisibilityContext;
  let mockLeaf: jest.Mocked<WorkspaceLeaf>;
  let mockTFile: jest.Mocked<TFile>;
  let fileOpenCallbacks: Array<(file: TFile | null) => void>;
  let mockEventRef: EventRef;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset event callbacks
    fileOpenCallbacks = [];
    mockEventRef = {} as EventRef;

    // Setup WikiLinkHelpers mock
    const { WikiLinkHelpers } = require("@exocortex/core");
    WikiLinkHelpers.normalize.mockImplementation((str: string) => str);

    // Create mock leaf
    mockLeaf = {
      openFile: jest.fn(),
    } as unknown as jest.Mocked<WorkspaceLeaf>;

    // Create mock TFile for created file
    mockTFile = {
      path: "new-instance.md",
      basename: "new-instance",
    } as jest.Mocked<TFile>;

    // Create mock app with event listener support
    mockApp = {
      workspace: {
        getLeaf: jest.fn().mockReturnValue(mockLeaf),
        setActiveLeaf: jest.fn(),
        getActiveFile: jest.fn().mockReturnValue(mockTFile),
        on: jest.fn((event: string, callback: (file: TFile | null) => void) => {
          if (event === "file-open") {
            fileOpenCallbacks.push(callback);
          }
          return mockEventRef;
        }),
        offref: jest.fn((ref: EventRef) => {
          // Remove the callback associated with this ref
          fileOpenCallbacks = [];
        }),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue({
          frontmatter: { key: "value" },
        }),
      },
    } as unknown as jest.Mocked<App>;

    // Create mock services
    mockTaskCreationService = {
      createTask: jest.fn(),
    } as unknown as jest.Mocked<TaskCreationService>;

    mockVaultAdapter = {
      toTFile: jest.fn().mockReturnValue(mockTFile),
    } as unknown as jest.Mocked<ObsidianVaultAdapter>;

    // Create mock plugin with settings (toggle OFF by default)
    mockPlugin = {
      settings: {
        useDynamicPropertyFields: false,
      },
    } as unknown as jest.Mocked<ExocortexPluginInterface>;

    // Create mock file
    mockFile = {
      path: "test-file.md",
      basename: "test-file",
    } as jest.Mocked<TFile>;

    // Create mock context
    mockContext = {
      instanceClass: "Task",
      status: "Active",
      archived: false,
      isDraft: false,
    };

    // Create command instance
    command = new CreateInstanceCommand(mockApp, mockTaskCreationService, mockVaultAdapter, mockPlugin);
  });

  afterEach(() => {
    // Clean up any remaining timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("id and name", () => {
    it("should have correct id and name", () => {
      expect(command.id).toBe("create-instance");
      expect(command.name).toBe("Create instance");
    });
  });

  describe("checkCallback", () => {
    const mockCanCreateInstance = require("@exocortex/core").canCreateInstance;

    it("should return false when context is null", () => {
      const result = command.checkCallback(true, mockFile, null);
      expect(result).toBe(false);
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
    });

    it("should return false when canCreateInstance returns false", () => {
      mockCanCreateInstance.mockReturnValue(false);
      const result = command.checkCallback(true, mockFile, mockContext);
      expect(result).toBe(false);
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
    });

    it("should return true when canCreateInstance returns true and checking is true", () => {
      mockCanCreateInstance.mockReturnValue(true);
      const result = command.checkCallback(true, mockFile, mockContext);
      expect(result).toBe(true);
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
    });

    it("should execute command when checking is false and canCreateInstance returns true", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      // Mock modal to return label and task size
      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test Instance", taskSize: "medium" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(LabelInputModal).toHaveBeenCalledWith(
        mockApp,
        expect.any(Function),
        "",
        true
      );
      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        { key: "value" },
        "Task",
        "Test Instance",
        "medium"
      );
      expect(mockVaultAdapter.toTFile).toHaveBeenCalledWith(createdFile);
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockTFile);
      expect(mockApp.workspace.setActiveLeaf).toHaveBeenCalledWith(mockLeaf, { focus: true });
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should handle modal cancellation", async () => {
      mockCanCreateInstance.mockReturnValue(true);

      // Mock modal to return null (cancelled)
      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: null, taskSize: null }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(LabelInputModal).toHaveBeenCalled();
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });

    it("should handle service error and show error notice", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const error = new Error("Failed to create task");
      mockTaskCreationService.createTask.mockRejectedValue(error);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test", taskSize: "small" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(mockTaskCreationService.createTask).toHaveBeenCalled();
      expect(LoggingService.error).toHaveBeenCalledWith("Create instance error", error);
      expect(Notice).toHaveBeenCalledWith("Failed to create instance: Failed to create task");
    });

    it("should handle array instanceClass", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const arrayContext = {
        ...mockContext,
        instanceClass: ["Task", "Project"],
      };
      const createdFile = { basename: "new-task", path: "new-task.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "My Task", taskSize: "large" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, arrayContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        { key: "value" },
        "Task", // First class in array
        "My Task",
        "large"
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-task");
    });

    it("should not show task size for MeetingPrototype", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const meetingContext = {
        ...mockContext,
        instanceClass: AssetClass.MEETING_PROTOTYPE,
      };
      const createdFile = { basename: "new-meeting", path: "new-meeting.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback, title, showTaskSize) => ({
        open: jest.fn(() => {
          // Verify showTaskSize is false
          expect(showTaskSize).toBe(false);
          setTimeout(() => callback({ label: "Meeting", taskSize: undefined }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, meetingContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(LabelInputModal).toHaveBeenCalledWith(
        mockApp,
        expect.any(Function),
        "",
        false // showTaskSize should be false for MeetingPrototype
      );
    });

    it("should wait for file to become active using event listener", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      // File is NOT active initially
      mockApp.workspace.getActiveFile = jest.fn().mockReturnValue(null);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          // Use real setTimeout behavior
          Promise.resolve().then(() => callback({ label: "Test", taskSize: "small" }));
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Let the modal callback execute
      await flushPromises();

      // Verify event listener was registered
      expect(mockApp.workspace.on).toHaveBeenCalledWith("file-open", expect.any(Function));

      // Simulate the file-open event firing with our target file
      expect(fileOpenCallbacks.length).toBeGreaterThan(0);
      fileOpenCallbacks[0](mockTFile);

      // Let promises resolve
      await flushPromises();

      // Verify cleanup was called
      expect(mockApp.workspace.offref).toHaveBeenCalledWith(mockEventRef);
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should resolve immediately if file is already active", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      // File is already active
      mockApp.workspace.getActiveFile = jest.fn().mockReturnValue(mockTFile);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          Promise.resolve().then(() => callback({ label: "Test", taskSize: "small" }));
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      await flushPromises();

      // Event listener should NOT be registered since file is already active
      expect(mockApp.workspace.on).not.toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should ignore file-open events for wrong files", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      // File is NOT active initially
      mockApp.workspace.getActiveFile = jest.fn().mockReturnValue(null);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          Promise.resolve().then(() => callback({ label: "Test", taskSize: "small" }));
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      await flushPromises();

      // Verify event listener was registered
      expect(mockApp.workspace.on).toHaveBeenCalledWith("file-open", expect.any(Function));

      // Simulate a file-open event for a DIFFERENT file - should not trigger cleanup
      const wrongFile = { path: "different-file.md", basename: "different-file" } as TFile;
      fileOpenCallbacks[0](wrongFile);
      await flushPromises();

      // offref should NOT have been called yet (wrong file)
      expect(mockApp.workspace.offref).not.toHaveBeenCalled();

      // Now fire the correct file event
      fileOpenCallbacks[0](mockTFile);
      await flushPromises();

      // NOW cleanup should have been called
      expect(mockApp.workspace.offref).toHaveBeenCalledWith(mockEventRef);
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should handle missing frontmatter metadata", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({});
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test", taskSize: "medium" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        {}, // Empty metadata
        "Task", // sourceClass still comes from context.instanceClass
        "Test",
        "medium"
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should handle null cache from metadataCache", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue(null);
      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Test", taskSize: "small" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        {}, // Empty metadata
        "Task", // sourceClass still comes from context.instanceClass
        "Test",
        "small"
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should use DynamicAssetCreationModal when useDynamicPropertyFields is true", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      // Enable dynamic property fields
      mockPlugin.settings.useDynamicPropertyFields = true;

      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      // Mock DynamicAssetCreationModal to return label and propertyValues
      (DynamicAssetCreationModal as jest.Mock).mockImplementation((app, className, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({
            label: "Dynamic Instance",
            taskSize: "medium",
            openInNewTab: false,
            propertyValues: { exo__Asset_label: "Dynamic Instance" }
          }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      // Verify DynamicAssetCreationModal was used with correct class name
      expect(DynamicAssetCreationModal).toHaveBeenCalledWith(
        mockApp,
        "Task",
        expect.any(Function)
      );
      expect(LabelInputModal).not.toHaveBeenCalled();

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        { key: "value" },
        "Task",
        "Dynamic Instance",
        "medium"
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-instance");
    });

    it("should use LabelInputModal when useDynamicPropertyFields is false", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      // Disable dynamic property fields (default)
      mockPlugin.settings.useDynamicPropertyFields = false;

      const createdFile = { basename: "new-instance", path: "new-instance.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (LabelInputModal as jest.Mock).mockImplementation((app, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({ label: "Static Instance", taskSize: "small" }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(LabelInputModal).toHaveBeenCalled();
      expect(DynamicAssetCreationModal).not.toHaveBeenCalled();
      expect(mockTaskCreationService.createTask).toHaveBeenCalled();
    });

    it("should use DynamicAssetCreationModal for ems__Effort class when toggle ON", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      mockPlugin.settings.useDynamicPropertyFields = true;

      // Use ems__Effort as the instance class
      const effortContext = {
        ...mockContext,
        instanceClass: "ems__Effort",
      };

      const createdFile = { basename: "new-effort", path: "new-effort.md" };
      mockTaskCreationService.createTask.mockResolvedValue(createdFile as any);

      (DynamicAssetCreationModal as jest.Mock).mockImplementation((app, className, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({
            label: "My Effort",
            taskSize: null,
            openInNewTab: false,
            propertyValues: {}
          }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, effortContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      // Verify DynamicAssetCreationModal was used with ems__Effort class name
      expect(DynamicAssetCreationModal).toHaveBeenCalledWith(
        mockApp,
        "ems__Effort",
        expect.any(Function)
      );

      expect(mockTaskCreationService.createTask).toHaveBeenCalledWith(
        mockFile,
        { key: "value" },
        "ems__Effort",
        "My Effort",
        null
      );
      expect(Notice).toHaveBeenCalledWith("Instance created: new-effort");
    });

    it("should handle DynamicAssetCreationModal cancellation", async () => {
      mockCanCreateInstance.mockReturnValue(true);
      mockPlugin.settings.useDynamicPropertyFields = true;

      // Mock modal to return null (cancelled)
      (DynamicAssetCreationModal as jest.Mock).mockImplementation((app, className, callback) => ({
        open: jest.fn(() => {
          setTimeout(() => callback({
            label: null,
            taskSize: null,
            openInNewTab: false,
            propertyValues: {}
          }), 0);
        }),
      }));

      const result = command.checkCallback(false, mockFile, mockContext);
      expect(result).toBe(true);

      // Wait for async execution
      await flushPromises();

      expect(DynamicAssetCreationModal).toHaveBeenCalled();
      expect(mockTaskCreationService.createTask).not.toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });
  });
});