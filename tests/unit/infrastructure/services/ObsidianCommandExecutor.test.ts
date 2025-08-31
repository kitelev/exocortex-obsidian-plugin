import { ObsidianCommandExecutor } from "../../../../src/infrastructure/services/ObsidianCommandExecutor";
import { IAssetRepository } from "../../../../src/domain/repositories/IAssetRepository";
import { 
  CommandExecutionRequest, 
  CommandExecutionResult 
} from "../../../../src/application/services/ICommandExecutor";
import { CommandType } from "../../../../src/domain/entities/ButtonCommand";
import { Result } from "../../../../src/domain/core/Result";
import { Asset } from "../../../../src/domain/entities/Asset";
import { App, Notice, TFile, TFolder, Modal } from "obsidian";

// Mock Obsidian components
jest.mock("obsidian", () => ({
  Notice: jest.fn(),
  Modal: jest.fn().mockImplementation(function(this: any, app: any) {
    this.app = app;
    this.contentEl = {
      createEl: jest.fn().mockReturnValue({
        addEventListener: jest.fn(),
      }),
      createDiv: jest.fn().mockReturnValue({
        createEl: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
        }),
      }),
      empty: jest.fn(),
    };
    this.open = jest.fn();
    this.close = jest.fn();
    return this;
  }),
  TFile: jest.fn(),
  TFolder: jest.fn(),
}));

describe("ObsidianCommandExecutor", () => {
  let executor: ObsidianCommandExecutor;
  let mockApp: jest.Mocked<App>;
  let mockAssetRepository: jest.Mocked<IAssetRepository>;
  let mockCreateChildTaskUseCase: any;
  let mockCreateChildAreaUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      vault: {
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        modify: jest.fn(),
        delete: jest.fn(),
      },
      workspace: {
        getLeaf: jest.fn().mockReturnValue({
          openFile: jest.fn(),
        }),
      },
      internalPlugins: {
        getPluginById: jest.fn().mockReturnValue({
          instance: {
            openGlobalSearch: jest.fn(),
          },
        }),
      },
    } as any;

    mockAssetRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      updateFrontmatter: jest.fn(),
      findByFilename: jest.fn(),
      findByProperty: jest.fn(),
      findByClass: jest.fn(),
      list: jest.fn(),
    };

    mockCreateChildTaskUseCase = {
      execute: jest.fn(),
    };

    mockCreateChildAreaUseCase = {
      execute: jest.fn(),
    };

    executor = new ObsidianCommandExecutor(
      mockApp,
      mockAssetRepository,
      mockCreateChildTaskUseCase,
      mockCreateChildAreaUseCase
    );
  });

  describe("Service Initialization", () => {
    it("should initialize with required dependencies", () => {
      expect(executor).toBeDefined();
      expect(executor.isSupported(CommandType.CREATE_ASSET)).toBe(true);
      expect(executor.isSupported(CommandType.OPEN_ASSET)).toBe(true);
      expect(executor.isSupported(CommandType.DELETE_ASSET)).toBe(true);
    });

    it("should initialize without optional use cases", () => {
      const minimalExecutor = new ObsidianCommandExecutor(mockApp, mockAssetRepository);
      expect(minimalExecutor).toBeDefined();
      expect(minimalExecutor.isSupported(CommandType.CREATE_ASSET)).toBe(true);
    });

    it("should register all default command handlers", () => {
      const supportedCommands = [
        CommandType.CREATE_ASSET,
        CommandType.OPEN_ASSET,
        CommandType.DELETE_ASSET,
        CommandType.RUN_TEMPLATE,
        CommandType.EXECUTE_SEARCH,
        CommandType.TRIGGER_WORKFLOW,
        CommandType.CUSTOM,
        CommandType.CREATE_CHILD_TASK,
        CommandType.CREATE_CHILD_AREA,
      ];

      supportedCommands.forEach(command => {
        expect(executor.isSupported(command)).toBe(true);
      });
    });
  });

  describe("Request Validation", () => {
    const baseRequest: CommandExecutionRequest = {
      command: {
        id: "test-command",
        type: CommandType.CREATE_ASSET,
        name: "Test Command",
        description: "Test description",
        icon: "plus",
        template: "test-template",
        script: "test-script",
        targetClass: "TestClass",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "test-cmd-123",
        commandType: CommandType.CREATE_ASSET,
        parameters: { title: "Test Asset" },
        timestamp: new Date(),
      },
    };

    it("should validate complete valid requests", () => {
      const result = executor.validate(baseRequest);
      expect(result.isSuccess).toBe(true);
    });

    it("should fail validation for missing command", () => {
      const invalidRequest = {
        ...baseRequest,
        command: null as any,
      };

      const result = executor.validate(invalidRequest);
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Command is required");
    });

    it("should fail validation for missing context", () => {
      const invalidRequest = {
        ...baseRequest,
        context: null as any,
      };

      const result = executor.validate(invalidRequest);
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Execution context is required");
    });

    it("should validate commands requiring input parameters", () => {
      const commandRequiringInput = {
        ...baseRequest,
        command: {
          ...baseRequest.command,
          requiresInput: true,
        },
        context: {
          ...baseRequest.context,
          parameters: {},
        },
      };

      const result = executor.validate(commandRequiringInput);
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Command requires input parameters");
    });

    it("should validate commands with required input parameters present", () => {
      const commandWithInput = {
        ...baseRequest,
        command: {
          ...baseRequest.command,
          requiresInput: true,
        },
        context: {
          ...baseRequest.context,
          parameters: { title: "Test Asset" },
        },
      };

      const result = executor.validate(commandWithInput);
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("Command Execution", () => {
    const baseRequest: CommandExecutionRequest = {
      command: {
        id: "test-command",
        type: CommandType.CREATE_ASSET,
        name: "Test Command",
        description: "Test description",
        icon: "plus",
        template: "test-template",
        script: "test-script",
        targetClass: "TestClass",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "test-cmd-123",
        commandType: CommandType.CREATE_ASSET,
        parameters: { title: "Test Asset" },
        timestamp: new Date(),
      },
    };

    it("should execute supported commands successfully", async () => {
      mockAssetRepository.save.mockResolvedValue();
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null); // No existing file

      const result = await executor.execute(baseRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("success");
      expect(executionResult.commandId).toBe("test-cmd-123");
      expect(executionResult.executionTime).toBeGreaterThan(0);
    });

    it("should fail for unsupported command types", async () => {
      const unsupportedRequest = {
        ...baseRequest,
        command: {
          ...baseRequest.command,
          type: "UNSUPPORTED_COMMAND" as CommandType,
        },
      };

      const result = await executor.execute(unsupportedRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("No handler registered");
    });

    it("should handle validation failures", async () => {
      const invalidRequest = {
        ...baseRequest,
        command: null as any,
      };

      const result = await executor.execute(invalidRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Command is required");
    });

    it("should handle handler exceptions", async () => {
      mockAssetRepository.save.mockRejectedValue(new Error("Database error"));

      const result = await executor.execute(baseRequest);

      expect(result.isSuccess).toBe(true); // Returns success with failure status
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toContain("Unexpected error");
    });

    it("should measure execution time accurately", async () => {
      mockAssetRepository.save.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const result = await executor.execute(baseRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.executionTime).toBeGreaterThan(90);
    });
  });

  describe("CREATE_ASSET Command Handler", () => {
    const createAssetRequest: CommandExecutionRequest = {
      command: {
        id: "create-asset",
        type: CommandType.CREATE_ASSET,
        name: "Create Asset",
        description: "Create a new asset",
        icon: "plus",
        template: "",
        script: "",
        targetClass: "TestClass",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "create-asset-123",
        commandType: CommandType.CREATE_ASSET,
        parameters: {
          title: "New Test Asset",
          className: "exo__TestClass",
          description: "A test asset",
          properties: { testProp: "testValue" },
        },
        timestamp: new Date(),
      },
    };

    it("should create asset successfully", async () => {
      mockAssetRepository.save.mockResolvedValue();
      const mockFile = { path: "New Test Asset.md" } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

      const result = await executor.execute(createAssetRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockAssetRepository.save).toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith('Asset "New Test Asset" created successfully');
    });

    it("should handle asset creation with minimal parameters", async () => {
      const minimalRequest = {
        ...createAssetRequest,
        context: {
          ...createAssetRequest.context,
          parameters: { title: "Minimal Asset" },
        },
      };

      mockAssetRepository.save.mockResolvedValue();

      const result = await executor.execute(minimalRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockAssetRepository.save).toHaveBeenCalled();
    });

    it("should use default title when none provided", async () => {
      const noTitleRequest = {
        ...createAssetRequest,
        context: {
          ...createAssetRequest.context,
          parameters: {},
        },
      };

      mockAssetRepository.save.mockResolvedValue();

      const result = await executor.execute(noTitleRequest);

      expect(result.isSuccess).toBe(true);
      expect(Notice).toHaveBeenCalledWith('Asset "Untitled" created successfully');
    });

    it("should sanitize file names", async () => {
      const unsafeNameRequest = {
        ...createAssetRequest,
        context: {
          ...createAssetRequest.context,
          parameters: { title: 'Unsafe/Name\\With:*Characters?"<>|' },
        },
      };

      mockAssetRepository.save.mockResolvedValue();

      const result = await executor.execute(unsafeNameRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockAssetRepository.save).toHaveBeenCalled();
    });

    it("should handle asset save failures", async () => {
      mockAssetRepository.save.mockRejectedValue(new Error("Save failed"));

      const result = await executor.execute(createAssetRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
    });

    it("should open created file when it exists", async () => {
      const mockFile = { path: "New Test Asset.md" } as TFile;
      mockAssetRepository.save.mockResolvedValue();
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

      await executor.execute(createAssetRequest);

      expect(mockApp.workspace.getLeaf).toHaveBeenCalled();
    });
  });

  describe("OPEN_ASSET Command Handler", () => {
    const openAssetRequest: CommandExecutionRequest = {
      command: {
        id: "open-asset",
        type: CommandType.OPEN_ASSET,
        name: "Open Asset",
        description: "Open an existing asset",
        icon: "open",
        template: "",
        script: "",
        targetClass: "",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "open-asset-123",
        commandType: CommandType.OPEN_ASSET,
        parameters: { assetId: "test-asset" },
        timestamp: new Date(),
      },
    };

    it("should open existing asset successfully", async () => {
      const mockFile = { path: "test-asset.md" } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

      const result = await executor.execute(openAssetRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith(true);
      const executionResult = result.getValue();
      expect(executionResult.output).toEqual({ opened: "test-asset" });
    });

    it("should fail when asset ID is missing", async () => {
      const noAssetIdRequest = {
        ...openAssetRequest,
        context: {
          ...openAssetRequest.context,
          parameters: {},
        },
      };

      const result = await executor.execute(noAssetIdRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Asset ID is required for OPEN_ASSET command");
    });

    it("should fail when asset file does not exist", async () => {
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

      const result = await executor.execute(openAssetRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Asset not found: test-asset");
    });

    it("should handle asset ID from context.assetId", async () => {
      const contextAssetIdRequest = {
        ...openAssetRequest,
        context: {
          ...openAssetRequest.context,
          assetId: "context-asset",
          parameters: {},
        },
      };

      const mockFile = { path: "context-asset.md" } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

      const result = await executor.execute(contextAssetIdRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.output).toEqual({ opened: "context-asset" });
    });
  });

  describe("DELETE_ASSET Command Handler", () => {
    const deleteAssetRequest: CommandExecutionRequest = {
      command: {
        id: "delete-asset",
        type: CommandType.DELETE_ASSET,
        name: "Delete Asset",
        description: "Delete an existing asset",
        icon: "trash",
        template: "",
        script: "",
        targetClass: "",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "delete-asset-123",
        commandType: CommandType.DELETE_ASSET,
        parameters: { assetId: "test-asset" },
        timestamp: new Date(),
      },
    };

    it("should delete asset after confirmation", async () => {
      const mockFile = { path: "test-asset.md" } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockApp.vault.delete.mockResolvedValue();

      // Mock the confirmation modal to return true
      const originalExecutor = Object.getPrototypeOf(executor);
      const confirmActionSpy = jest.spyOn(originalExecutor, 'confirmAction' as any)
        .mockResolvedValue(true);

      const result = await executor.execute(deleteAssetRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockApp.vault.delete).toHaveBeenCalledWith(mockFile);
      expect(Notice).toHaveBeenCalledWith('Asset "test-asset" deleted');

      confirmActionSpy.mockRestore();
    });

    it("should cancel deletion when user declines confirmation", async () => {
      const mockFile = { path: "test-asset.md" } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

      // Mock the confirmation modal to return false
      const originalExecutor = Object.getPrototypeOf(executor);
      const confirmActionSpy = jest.spyOn(originalExecutor, 'confirmAction' as any)
        .mockResolvedValue(false);

      const result = await executor.execute(deleteAssetRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.output).toEqual({ cancelled: true });
      expect(mockApp.vault.delete).not.toHaveBeenCalled();

      confirmActionSpy.mockRestore();
    });

    it("should fail when asset does not exist", async () => {
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

      const result = await executor.execute(deleteAssetRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Asset not found: test-asset");
    });
  });

  describe("RUN_TEMPLATE Command Handler", () => {
    const runTemplateRequest: CommandExecutionRequest = {
      command: {
        id: "run-template",
        type: CommandType.RUN_TEMPLATE,
        name: "Run Template",
        description: "Apply template to asset",
        icon: "template",
        template: "test-template",
        script: "",
        targetClass: "",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "run-template-123",
        commandType: CommandType.RUN_TEMPLATE,
        parameters: { 
          template_name: "test-template",
          variable1: "value1",
        },
        assetId: "target-asset",
        timestamp: new Date(),
      },
    };

    it("should apply template successfully", async () => {
      const templateFile = { path: "templates/test-template.md" } as TFile;
      const targetFile = { path: "target-asset.md" } as TFile;
      
      mockApp.vault.getAbstractFileByPath
        .mockReturnValueOnce(templateFile)
        .mockReturnValueOnce(targetFile);
      
      mockApp.vault.read
        .mockResolvedValueOnce("Template content with {{variable1}}")
        .mockResolvedValueOnce("Existing content");
      
      mockApp.vault.modify.mockResolvedValue();

      const result = await executor.execute(runTemplateRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockApp.vault.modify).toHaveBeenCalledWith(
        targetFile,
        expect.stringContaining("Template content with value1")
      );
      expect(Notice).toHaveBeenCalledWith('Template "test-template" applied successfully');
    });

    it("should fail when template is not found", async () => {
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

      const result = await executor.execute(runTemplateRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Template not found: test-template");
    });

    it("should fail when target asset is not found", async () => {
      const templateFile = { path: "templates/test-template.md" } as TFile;
      
      mockApp.vault.getAbstractFileByPath
        .mockReturnValueOnce(templateFile)
        .mockReturnValueOnce(null);

      const result = await executor.execute(runTemplateRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Target asset not found: target-asset");
    });

    it("should process template variables including dates", async () => {
      const templateFile = { path: "templates/test-template.md" } as TFile;
      const targetFile = { path: "target-asset.md" } as TFile;
      
      mockApp.vault.getAbstractFileByPath
        .mockReturnValueOnce(templateFile)
        .mockReturnValueOnce(targetFile);
      
      const templateContent = "{{variable1}} - {{date}} - {{time}} - {{datetime}}";
      mockApp.vault.read
        .mockResolvedValueOnce(templateContent)
        .mockResolvedValueOnce("Existing content");
      
      mockApp.vault.modify.mockResolvedValue();

      await executor.execute(runTemplateRequest);

      expect(mockApp.vault.modify).toHaveBeenCalledWith(
        targetFile,
        expect.stringMatching(/value1 - \d{4}-\d{2}-\d{2} - \d{2}:\d{2}:\d{2} - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });
  });

  describe("EXECUTE_SEARCH Command Handler", () => {
    const executeSearchRequest: CommandExecutionRequest = {
      command: {
        id: "execute-search",
        type: CommandType.EXECUTE_SEARCH,
        name: "Execute Search",
        description: "Execute a search query",
        icon: "search",
        template: "",
        script: "",
        targetClass: "",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "execute-search-123",
        commandType: CommandType.EXECUTE_SEARCH,
        parameters: { query: "test search query" },
        timestamp: new Date(),
      },
    };

    it("should execute search successfully", async () => {
      const result = await executor.execute(executeSearchRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockApp.internalPlugins.getPluginById).toHaveBeenCalledWith("global-search");
      const executionResult = result.getValue();
      expect(executionResult.output).toEqual({ query: "test search query" });
    });

    it("should fail when query is missing", async () => {
      const noQueryRequest = {
        ...executeSearchRequest,
        context: {
          ...executeSearchRequest.context,
          parameters: {},
        },
      };

      const result = await executor.execute(noQueryRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Search query is required");
    });
  });

  describe("CUSTOM Command Handler (Security)", () => {
    const customCommandRequest: CommandExecutionRequest = {
      command: {
        id: "custom-command",
        type: CommandType.CUSTOM,
        name: "Custom Command",
        description: "Custom script command",
        icon: "code",
        template: "",
        script: "console.log('test')",
        targetClass: "",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "custom-command-123",
        commandType: CommandType.CUSTOM,
        parameters: {},
        script: "console.log('malicious code')",
        timestamp: new Date(),
      },
    };

    it("should reject custom script execution for security", async () => {
      const result = await executor.execute(customCommandRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toContain("Script execution is disabled for security");
    });

    it("should fail when no script is provided", async () => {
      const noScriptRequest = {
        ...customCommandRequest,
        context: {
          ...customCommandRequest.context,
          script: undefined,
        },
      };

      const result = await executor.execute(noScriptRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Script is required for custom commands");
    });
  });

  describe("CREATE_CHILD_TASK Command Handler", () => {
    const createChildTaskRequest: CommandExecutionRequest = {
      command: {
        id: "create-child-task",
        type: CommandType.CREATE_CHILD_TASK,
        name: "Create Child Task",
        description: "Create a child task",
        icon: "task",
        template: "",
        script: "",
        targetClass: "",
        parameters: {},
        isActive: true,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        },
      },
      context: {
        commandId: "create-child-task-123",
        commandType: CommandType.CREATE_CHILD_TASK,
        parameters: {},
        assetId: "project-asset",
        currentView: "current-file.md",
        selection: ["selected text"],
        timestamp: new Date(),
      },
    };

    it("should create child task successfully", async () => {
      const mockTaskResult = {
        success: true,
        message: "Task created successfully",
        taskId: "new-task-123",
        taskFilePath: "tasks/new-task-123.md",
      };

      mockCreateChildTaskUseCase.execute.mockResolvedValue(mockTaskResult);

      const mockTaskFile = { path: "tasks/new-task-123.md" } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockTaskFile);

      const result = await executor.execute(createChildTaskRequest);

      expect(result.isSuccess).toBe(true);
      expect(mockCreateChildTaskUseCase.execute).toHaveBeenCalledWith({
        projectAssetId: "project-asset",
        context: {
          activeFile: "current-file.md",
          selection: "selected text",
        },
      });
      expect(Notice).toHaveBeenCalledWith("Task created successfully");
    });

    it("should fail when use case is not initialized", async () => {
      const executorWithoutUseCase = new ObsidianCommandExecutor(
        mockApp, 
        mockAssetRepository
      );

      const result = await executorWithoutUseCase.execute(createChildTaskRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("CreateChildTaskUseCase not initialized");
    });

    it("should fail when use case execution fails", async () => {
      mockCreateChildTaskUseCase.execute.mockResolvedValue({
        success: false,
        message: "Task creation failed",
      });

      const result = await executor.execute(createChildTaskRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Task creation failed");
    });
  });

  describe("Handler Registration and Management", () => {
    it("should allow registering custom handlers", () => {
      const customHandler = jest.fn().mockResolvedValue(Result.ok({ custom: "result" }));
      const customType = "CUSTOM_TYPE" as CommandType;

      executor.registerHandler(customType, customHandler);

      expect(executor.isSupported(customType)).toBe(true);
    });

    it("should allow overriding existing handlers", () => {
      const newHandler = jest.fn().mockResolvedValue(Result.ok({ new: "result" }));

      executor.registerHandler(CommandType.CREATE_ASSET, newHandler);

      expect(executor.isSupported(CommandType.CREATE_ASSET)).toBe(true);
    });

    it("should correctly report supported command types", () => {
      expect(executor.isSupported(CommandType.CREATE_ASSET)).toBe(true);
      expect(executor.isSupported("NON_EXISTENT" as CommandType)).toBe(false);
    });
  });

  describe("Utility Methods", () => {
    it("should sanitize file names correctly", () => {
      // Access private method through prototype
      const sanitizeFileName = (executor as any).sanitizeFileName.bind(executor);

      expect(sanitizeFileName("normal-name")).toBe("normal-name");
      expect(sanitizeFileName("name/with\\slashes")).toBe("name-with-slashes");
      expect(sanitizeFileName('name:with*forbidden?"<>|chars')).toBe("name-with-forbidden--chars");
      expect(sanitizeFileName("  spaced name  ")).toBe("spaced name");
    });

    it("should process templates correctly", () => {
      // Access private method through prototype  
      const processTemplate = (executor as any).processTemplate.bind(executor);

      const template = "Hello {{name}}, today is {{date}} at {{time}}";
      const params = { name: "World" };

      const result = processTemplate(template, params);

      expect(result).toContain("Hello World");
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/); // Date pattern
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // Time pattern
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed requests gracefully", async () => {
      const malformedRequest = {
        command: { type: null },
        context: { commandId: null },
      } as any;

      const result = await executor.execute(malformedRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should handle null/undefined parameters", async () => {
      const nullParamsRequest = {
        command: {
          id: "test-command",
          type: CommandType.CREATE_ASSET,
          name: "Test Command",
          description: "Test description",
          icon: "plus",
          template: "",
          script: "",
          targetClass: "",
          parameters: null,
          isActive: true,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: "1.0.0",
          },
        },
        context: {
          commandId: "test-cmd-123",
          commandType: CommandType.CREATE_ASSET,
          parameters: null,
          timestamp: new Date(),
        },
      } as any;

      mockAssetRepository.save.mockResolvedValue();

      const result = await executor.execute(nullParamsRequest);

      expect(result.isSuccess).toBe(true);
    });

    it("should handle app service failures", async () => {
      mockApp.vault.getAbstractFileByPath.mockImplementation(() => {
        throw new Error("Vault error");
      });

      const openAssetRequest: CommandExecutionRequest = {
        command: {
          id: "open-asset",
          type: CommandType.OPEN_ASSET,
          name: "Open Asset",
          description: "Open an existing asset",
          icon: "open",
          template: "",
          script: "",
          targetClass: "",
          parameters: {},
          isActive: true,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: "1.0.0",
          },
        },
        context: {
          commandId: "open-asset-123",
          commandType: CommandType.OPEN_ASSET,
          parameters: { assetId: "test-asset" },
          timestamp: new Date(),
        },
      };

      const result = await executor.execute(openAssetRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toContain("Unexpected error");
    });
  });
});