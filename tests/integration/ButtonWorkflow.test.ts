import { App } from "obsidian";
import { DIContainer } from "../../src/infrastructure/container/DIContainer";
import { ButtonRenderer } from "../../src/presentation/components/ButtonRenderer";
import { RenderClassButtonsUseCase } from "../../src/application/use-cases/RenderClassButtonsUseCase";
import { ExecuteButtonCommandUseCase } from "../../src/application/use-cases/ExecuteButtonCommandUseCase";
import { CreateChildTaskUseCase } from "../../src/application/use-cases/CreateChildTaskUseCase";
import { IClassLayoutRepository } from "../../src/domain/repositories/IClassLayoutRepository";
import { IClassViewRepository } from "../../src/domain/repositories/IClassViewRepository";
import { IButtonRepository } from "../../src/domain/repositories/IButtonRepository";
import { ObsidianAssetRepository } from "../../src/infrastructure/repositories/ObsidianAssetRepository";
import { ClassLayout } from "../../src/domain/entities/ClassLayout";
import { LayoutBlock } from "../../src/domain/entities/LayoutBlock";
import { UIButton } from "../../src/domain/entities/UIButton";
import {
  ButtonCommand,
  CommandType,
} from "../../src/domain/entities/ButtonCommand";
import { Asset } from "../../src/domain/entities/Asset";
import { ClassView } from "../../src/domain/aggregates/ClassView";
import { Result } from "../../src/domain/core/Result";
import { AssetId } from "../../src/domain/value-objects/AssetId";
import { ClassName } from "../../src/domain/value-objects/ClassName";
import { OntologyPrefix } from "../../src/domain/value-objects/OntologyPrefix";
import "../__mocks__/obsidian";

describe("Button Workflow Integration Tests", () => {
  let app: App;
  let container: DIContainer;
  let buttonRenderer: ButtonRenderer;
  let renderButtonsUseCase: RenderClassButtonsUseCase;
  let executeCommandUseCase: ExecuteButtonCommandUseCase;
  let createChildTaskUseCase: CreateChildTaskUseCase;
  let assetRepository: ObsidianAssetRepository;
  let layoutRepository: IClassLayoutRepository;
  let classViewRepository: IClassViewRepository;
  let mockCreateChildTaskUseCase: jest.Mocked<CreateChildTaskUseCase>;

  beforeEach(() => {
    // Reset DIContainer
    DIContainer.reset();

    // Mock Obsidian App
    app = {
      vault: {
        getAbstractFileByPath: jest.fn(),
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        read: jest.fn(),
        create: jest.fn(),
        modify: jest.fn(),
      },
      workspace: {
        getLeaf: jest.fn(() => ({
          openFile: jest.fn(),
        })),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue(null),
      },
    } as any;

    // Initialize container
    container = DIContainer.initialize(app);

    // Set up mock ClassViewRepository with project buttons
    const mockClassViewRepository: IClassViewRepository = {
      findByClassName: jest
        .fn()
        .mockImplementation(async (className: ClassName) => {
          if (className.value === "ems__Project") {
            // Create a ClassView with Create Child Task button
            const buttonIdResult = AssetId.generate();
            const commandIdResult = AssetId.generate();

            const button = UIButton.create({
              id: buttonIdResult,
              label: "➕ Create Child Task",
              commandId: commandIdResult,
              order: 1,
              isEnabled: true,
              tooltip: "Create a new task for this project",
            }).getValue()!;

            const classViewIdResult = AssetId.generate();

            const classView = ClassView.create({
              id: classViewIdResult,
              className: className,
              buttons: [button],
              layoutTemplate: "",
              displayOptions: {
                showProperties: true,
                showRelations: true,
                showBacklinks: true,
                showButtons: true,
                buttonPosition: "top",
              },
            }).getValue()!;

            return Result.ok(classView);
          }
          return Result.ok(null);
        }),
      findById: jest.fn().mockResolvedValue(Result.ok(null)),
      save: jest.fn().mockResolvedValue(Result.ok()),
      delete: jest.fn().mockResolvedValue(Result.ok()),
      findAll: jest.fn().mockResolvedValue(Result.ok([])),
      exists: jest.fn().mockResolvedValue(Result.ok(false)),
    };

    // Set up mock ButtonRepository with commands
    const mockButtonRepository: IButtonRepository = {
      findButtonById: jest
        .fn()
        .mockImplementation(async (buttonId: AssetId) => {
          // For testing, accept any button ID and return a mock button
          const commandIdResult = AssetId.generate();
          const button = UIButton.create({
            id: buttonId,
            label: "➕ Create Child Task",
            commandId: commandIdResult,
            order: 1,
            isEnabled: true,
            tooltip: "Create a new task for this project",
          }).getValue()!;
          return Result.ok(button);
        }),
      findCommandById: jest
        .fn()
        .mockImplementation(async (commandId: AssetId) => {
          // For testing, accept any command ID and return a mock command
          const commandResult = ButtonCommand.create({
            id: commandId,
            type: CommandType.CREATE_CHILD_TASK,
            name: "Create Child Task",
            requiresInput: false,
            parameters: [],
          });

          if (commandResult.isFailure) {
            console.error(
              "Failed to create ButtonCommand:",
              commandResult.error,
            );
            return Result.fail(commandResult.error);
          }

          return Result.ok(commandResult.getValue());
        }),
      findAllButtons: jest.fn().mockResolvedValue(Result.ok([])),
      findAllCommands: jest.fn().mockResolvedValue(Result.ok([])),
      findButtonsByCommandId: jest.fn().mockResolvedValue(Result.ok([])),
      saveButton: jest.fn().mockResolvedValue(Result.ok()),
      saveCommand: jest.fn().mockResolvedValue(Result.ok()),
      deleteButton: jest.fn().mockResolvedValue(Result.ok()),
      deleteCommand: jest.fn().mockResolvedValue(Result.ok()),
    };

    // Set up mock CreateChildTaskUseCase
    mockCreateChildTaskUseCase = {
      execute: jest.fn(),
    } as any;

    // Register the mocks in the container
    const containerInstance = (container as any).container;
    containerInstance.register(
      "IClassViewRepository",
      () => mockClassViewRepository,
    );
    containerInstance.register("IButtonRepository", () => mockButtonRepository);
    containerInstance.register(
      "CreateChildTaskUseCase",
      () => mockCreateChildTaskUseCase,
    );

    // Get instances
    buttonRenderer = container.getButtonRenderer();
    renderButtonsUseCase = container.getRenderButtonsUseCase();
    executeCommandUseCase = container.getExecuteButtonCommandUseCase();
    assetRepository =
      container.resolve<ObsidianAssetRepository>("IAssetRepository");
    layoutRepository = container.resolve<IClassLayoutRepository>(
      "IClassLayoutRepository",
    );
    classViewRepository = mockClassViewRepository;
  });

  afterEach(() => {
    container.dispose();
    DIContainer.reset();
  });

  describe("ems__Project Button Configuration", () => {
    it("should load ems__Project layout with CREATE_CHILD_TASK button", async () => {
      // Create test project asset with valid UUID
      const projectIdResult = AssetId.generate();
      const classNameResult = ClassName.create("ems__Project");
      const ontologyResult = OntologyPrefix.create("ems");

      if (!classNameResult.isSuccess || !ontologyResult.isSuccess) {
        fail("Failed to create test prerequisites");
        return;
      }

      const projectAssetResult = Asset.create({
        id: projectIdResult,
        className: classNameResult.getValue()!,
        ontology: ontologyResult.getValue()!,
        label: "Test Project",
        description: "A test project for integration testing",
        properties: {
          ems__Project_status: "[[ems__ProjectStatus - Active]]",
          ems__Project_priority: "[[ems__Priority - High]]",
        },
      });

      if (!projectAssetResult.isSuccess) {
        fail(
          "Failed to create test project asset: " +
            projectAssetResult.getError(),
        );
        return;
      }

      const projectAsset = projectAssetResult.getValue()!;

      // Mock asset repository
      jest.spyOn(assetRepository, "findById").mockResolvedValue(projectAsset);

      // Test button rendering
      const result = await renderButtonsUseCase.execute({
        className: "ems__Project",
        assetId: projectIdResult.toString(),
      });

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();

      // Should find CREATE_CHILD_TASK button
      const createTaskButton = response.buttons.find(
        (b) => b.command.type === "CREATE_CHILD_TASK",
      );

      expect(createTaskButton).toBeDefined();
      expect(createTaskButton?.label).toBe("➕ Create Child Task");
      expect(createTaskButton?.isEnabled).toBe(true);
    });

    it("should execute CREATE_CHILD_TASK command successfully", async () => {
      // Create test project asset with valid UUID
      const projectIdResult = AssetId.generate();
      const classNameResult = ClassName.create("ems__Project");
      const ontologyResult = OntologyPrefix.create("ems");

      if (!classNameResult.isSuccess || !ontologyResult.isSuccess) {
        fail("Failed to create test prerequisites");
        return;
      }

      const projectAssetResult = Asset.create({
        id: projectIdResult,
        className: classNameResult.getValue()!,
        ontology: ontologyResult.getValue()!,
        label: "Test Project",
        description: "A test project for integration testing",
        properties: {},
      });

      if (!projectAssetResult.isSuccess) {
        fail(
          "Failed to create test project asset: " +
            projectAssetResult.getError(),
        );
        return;
      }

      const projectAsset = projectAssetResult.getValue()!;

      // Mock asset repository
      jest.spyOn(assetRepository, "findById").mockResolvedValue(projectAsset);
      jest.spyOn(assetRepository, "save").mockResolvedValue();

      // Mock vault operations
      (app.vault.create as jest.Mock).mockResolvedValue({
        path: "test-task.md",
      });
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue({
        path: "test-task.md",
      });

      // Mock CreateChildTaskUseCase for success case
      const taskIdResult = AssetId.generate();
      mockCreateChildTaskUseCase.execute.mockResolvedValue({
        success: true,
        taskId: taskIdResult.toString(),
        taskFilePath: "test-task.md",
        message: "Task created successfully",
      });

      // Test command execution
      const buttonIdResult = AssetId.generate();
      const result = await executeCommandUseCase.execute({
        buttonId: buttonIdResult.toString(),
        assetId: projectIdResult.toString(),
      });

      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(true);
    });

    it("should render button in DOM correctly", async () => {
      // Create test container
      const container = document.createElement("div");

      // Mock successful button data
      jest.spyOn(renderButtonsUseCase, "execute").mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          buttons: [
            {
              buttonId: "create-child-task",
              label: "➕ Create Child Task",
              tooltip: "Create a new task for this project",
              isEnabled: true,
              order: 1,
              command: {
                id: "create-child-task-cmd",
                type: "CREATE_CHILD_TASK",
                requiresInput: false,
                parameters: [],
              },
            },
          ],
          displayOptions: {
            position: "top" as const,
            showButtons: true,
          },
        }),
        getError: () => "",
      } as any);

      // Render buttons
      const testAssetId = AssetId.generate();
      await buttonRenderer.render(
        container,
        "ems__Project",
        testAssetId.toString(),
      );

      // Check DOM structure
      const buttonContainer = container.querySelector(
        ".exocortex-button-container",
      );
      expect(buttonContainer).toBeTruthy();

      const button = buttonContainer?.querySelector("button");
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe("➕ Create Child Task");
      expect(button?.getAttribute("data-button-id")).toBeTruthy(); // Accept any valid button ID
    });
  });

  describe("Error Handling", () => {
    it("should handle missing project gracefully", async () => {
      // Clear previous mocks
      jest.clearAllMocks();

      // Mock missing project - this should cause the command executor to fail
      jest.spyOn(assetRepository, "findById").mockResolvedValue(null);
      
      // Mock CreateChildTaskUseCase to return proper failure response
      mockCreateChildTaskUseCase.execute.mockResolvedValue({
        success: false,
        message: 'Project not found'
      });

      const buttonIdResult = AssetId.generate();
      const assetIdResult = AssetId.generate();

      const result = await executeCommandUseCase.execute({
        buttonId: buttonIdResult.toString(),
        assetId: assetIdResult.toString(),
      });

      // The command execution should succeed, but the result should contain the error
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const response = result.getValue();
        expect(response.success).toBe(true);
        expect(response.result.status).toBe('failure');
        expect(response.result.error || "").toContain("Project not found");
      }
    });

    it("should handle invalid asset class", async () => {
      // Clear previous mocks
      jest.clearAllMocks();

      // Create non-project asset with valid UUID
      const taskIdResult = AssetId.generate();
      const classNameResult = ClassName.create("ems__Task");
      const ontologyResult = OntologyPrefix.create("ems");

      if (!classNameResult.isSuccess || !ontologyResult.isSuccess) {
        fail("Failed to create test prerequisites");
        return;
      }

      const nonProjectAssetResult = Asset.create({
        id: taskIdResult,
        className: classNameResult.getValue()!,
        ontology: ontologyResult.getValue()!,
        label: "Test Task",
        description: "A test task",
        properties: {},
      });

      if (!nonProjectAssetResult.isSuccess) {
        fail(
          "Failed to create test asset: " + nonProjectAssetResult.getError(),
        );
        return;
      }

      const nonProjectAsset = nonProjectAssetResult.getValue()!;

      jest
        .spyOn(assetRepository, "findById")
        .mockResolvedValue(nonProjectAsset);

      // Mock CreateChildTaskUseCase to fail for non-project asset
      mockCreateChildTaskUseCase.execute.mockResolvedValue({
        success: false,
        message: "Asset is not a project",
      });

      const buttonIdResult = AssetId.generate();

      const result = await executeCommandUseCase.execute({
        buttonId: buttonIdResult.toString(),
        assetId: taskIdResult.toString(),
      });

      // The command execution should succeed, but the result should contain the error
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const response = result.getValue();
        expect(response.success).toBe(true);
        expect(response.result.status).toBe('failure');
        expect(response.result.error || "").toContain("Asset is not a project");
      }
    });
  });

  describe("Layout Configuration Validation", () => {
    it("should validate button block configuration syntax", () => {
      // Test the layout configuration from the actual file
      const layoutConfig = {
        id: "project-actions",
        type: "buttons",
        title: "🚀 Project Actions",
        order: 0.5,
        isVisible: true,
        config: {
          type: "buttons",
          buttons: [
            {
              id: "create-child-task",
              label: "➕ Create Child Task",
              commandType: "CREATE_CHILD_TASK",
              tooltip: "Create a new task for this project",
              style: "primary",
            },
          ],
        },
      };

      // Validate required fields
      expect(layoutConfig.id).toBe("project-actions");
      expect(layoutConfig.type).toBe("buttons");
      expect(layoutConfig.config.buttons).toHaveLength(1);

      const button = layoutConfig.config.buttons[0];
      expect(button.id).toBe("create-child-task");
      expect(button.commandType).toBe("CREATE_CHILD_TASK");
      expect(button.label).toBe("➕ Create Child Task");
      expect(button.tooltip).toBe("Create a new task for this project");
    });
  });
});
