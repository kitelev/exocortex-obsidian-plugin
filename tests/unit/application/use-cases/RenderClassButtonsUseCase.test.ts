import { RenderClassButtonsUseCase } from "../../../../src/application/use-cases/RenderClassButtonsUseCase";
import { IClassViewRepository } from "../../../../src/domain/repositories/IClassViewRepository";
import { IButtonRepository } from "../../../../src/domain/repositories/IButtonRepository";
import { Result } from "../../../../src/domain/core/Result";
import { ClassName } from "../../../../src/domain/value-objects/ClassName";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";
import { ClassView, DisplayOptions } from "../../../../src/domain/aggregates/ClassView";
import { UIButton } from "../../../../src/domain/entities/UIButton";
import { ButtonCommand, CommandType } from "../../../../src/domain/entities/ButtonCommand";

describe("RenderClassButtonsUseCase", () => {
  let useCase: RenderClassButtonsUseCase;
  let mockClassViewRepository: jest.Mocked<IClassViewRepository>;
  let mockButtonRepository: jest.Mocked<IButtonRepository>;

  // Test data factory
  const createMockAssetId = (value: string = "123e4567-e89b-12d3-a456-426614174000"): AssetId => {
    const result = AssetId.create(value);
    if (result.isFailure) throw new Error(`Failed to create AssetId: ${result.error}`);
    return result.getValue();
  };

  const createMockClassName = (value: string = "exo__Task"): ClassName => {
    const result = ClassName.create(value);
    if (result.isFailure) throw new Error("Failed to create ClassName");
    return result.getValue();
  };

  const createMockUIButton = (overrides: Partial<any> = {}): UIButton => {
    const buttonId = overrides.buttonId ? createMockAssetId(overrides.buttonId) : AssetId.generate();
    const commandId = overrides.commandId ? createMockAssetId(overrides.commandId) : AssetId.generate();
    
    const result = UIButton.create({
      id: buttonId,
      label: "Test Button",
      commandId,
      order: 1,
      isEnabled: true,
      tooltip: "Test tooltip",
      ...overrides
    });
    
    if (result.isFailure) throw new Error("Failed to create UIButton");
    return result.getValue();
  };

  const createMockButtonCommand = (overrides: Partial<any> = {}): ButtonCommand => {
    const commandId = overrides.id ? createMockAssetId(overrides.id.toString()) : AssetId.generate();
    
    const result = ButtonCommand.create({
      id: commandId,
      type: CommandType.CREATE_ASSET,
      name: "Create Asset",
      description: "Creates a new asset",
      requiresInput: false,
      parameters: [],
      ...overrides
    });
    
    if (result.isFailure) throw new Error("Failed to create ButtonCommand");
    return result.getValue();
  };

  const createMockClassView = (overrides: Partial<any> = {}): ClassView => {
    const id = overrides.id ? createMockAssetId(overrides.id.toString()) : AssetId.generate();
    const className = createMockClassName("exo__Task");
    const buttons = overrides.buttons || [createMockUIButton()];
    
    const result = ClassView.create({
      id,
      className,
      buttons,
      layoutTemplate: "default",
      displayOptions: {
        showProperties: true,
        showRelations: true,
        showBacklinks: true,
        showButtons: true,
        buttonPosition: "top",
        ...overrides.displayOptions
      } as DisplayOptions,
      ...overrides
    });
    
    if (result.isFailure) throw new Error("Failed to create ClassView");
    return result.getValue();
  };

  beforeEach(() => {
    // Create mock repositories
    mockClassViewRepository = {
      findByClassName: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
    };

    mockButtonRepository = {
      findButtonById: jest.fn(),
      findCommandById: jest.fn(),
      findAllButtons: jest.fn(),
      findAllCommands: jest.fn(),
      findButtonsByCommandId: jest.fn(),
      saveButton: jest.fn(),
      saveCommand: jest.fn(),
      deleteButton: jest.fn(),
      deleteCommand: jest.fn(),
    };

    useCase = new RenderClassButtonsUseCase(mockClassViewRepository, mockButtonRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Input Validation", () => {
    it("should fail when className is missing", async () => {
      // Act
      const result = await useCase.execute({
        className: "",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Class name is required");
    });

    it("should fail when className is undefined", async () => {
      // Act
      const result = await useCase.execute({
        className: undefined as any,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Class name is required");
    });

    it("should fail when className is invalid format", async () => {
      // Act
      const result = await useCase.execute({
        className: "invalid-class-name",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Invalid class name format");
    });

    it("should accept valid className format", async () => {
      // Arrange
      const validClassName = "exo__Task";
      mockClassViewRepository.findByClassName.mockResolvedValue(
        Result.ok(null)
      );

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(mockClassViewRepository.findByClassName).toHaveBeenCalledWith(
        expect.objectContaining({
          value: validClassName
        })
      );
    });
  });

  describe("ClassView Repository Interactions", () => {
    const validClassName = "exo__Task";

    it("should fail when ClassView repository fails", async () => {
      // Arrange
      mockClassViewRepository.findByClassName.mockResolvedValue(
        Result.fail("Database connection error")
      );

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Failed to load class view: Database connection error");
    });

    it("should return empty buttons when ClassView is not found", async () => {
      // Arrange
      mockClassViewRepository.findByClassName.mockResolvedValue(
        Result.ok(null)
      );

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toEqual([]);
      expect(response.displayOptions).toEqual({
        position: "top",
        showButtons: false,
      });
    });

    it("should return empty buttons when buttons are disabled in display options", async () => {
      // Arrange
      const classView = createMockClassView({
        displayOptions: {
          showButtons: false,
          buttonPosition: "bottom"
        }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(
        Result.ok(classView)
      );

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toEqual([]);
      expect(response.displayOptions).toEqual({
        position: "bottom",
        showButtons: false,
      });
    });
  });

  describe("Button Loading and Filtering", () => {
    const validClassName = "exo__Task";
    let mockClassView: ClassView;
    let mockButton1: UIButton;
    let mockButton2: UIButton;
    let mockButton3: UIButton;

    beforeEach(() => {
      mockButton1 = createMockUIButton({ 
        order: 1, 
        isEnabled: true
      });
      mockButton2 = createMockUIButton({ 
        order: 2, 
        isEnabled: true
      });
      mockButton3 = createMockUIButton({ 
        order: 3, 
        isEnabled: false
      });

      mockClassView = createMockClassView({
        buttons: [mockButton1, mockButton2, mockButton3],
        displayOptions: { showButtons: true, buttonPosition: "top" }
      });
    });

    it("should only load commands for enabled buttons", async () => {
      // Arrange
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
      mockButtonRepository.findCommandById.mockResolvedValue(
        Result.ok(createMockButtonCommand())
      );

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert - Should only call findCommandById for enabled buttons
      expect(mockButtonRepository.findCommandById).toHaveBeenCalledTimes(2);
      expect(mockButtonRepository.findCommandById).toHaveBeenCalledWith(mockButton1.commandId);
      expect(mockButtonRepository.findCommandById).toHaveBeenCalledWith(mockButton2.commandId);
      expect(mockButtonRepository.findCommandById).not.toHaveBeenCalledWith(mockButton3.commandId);
    });

    it("should skip buttons when command loading fails", async () => {
      // Arrange
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
      mockButtonRepository.findCommandById
        .mockResolvedValueOnce(Result.ok(createMockButtonCommand())) // For button1
        .mockResolvedValueOnce(Result.fail("Command not found")); // For button2

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1); // Only button1 should be included
      expect(consoleSpy).toHaveBeenCalledWith(
        `Failed to load command for button ${mockButton2.id.toString()}: Command not found`
      );

      consoleSpy.mockRestore();
    });

    it("should skip buttons when command is null", async () => {
      // Arrange
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
      mockButtonRepository.findCommandById
        .mockResolvedValueOnce(Result.ok(createMockButtonCommand())) // For button1
        .mockResolvedValueOnce(Result.ok(null)); // For button2

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1); // Only button1 should be included
      expect(consoleSpy).toHaveBeenCalledWith(
        `Command not found for button ${mockButton2.id.toString()}`
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Command Execution Context Filtering", () => {
    const validClassName = "exo__Task";
    let mockClassView: ClassView;
    let mockButton: UIButton;

    beforeEach(() => {
      mockButton = createMockUIButton({ isEnabled: true });
      mockClassView = createMockClassView({
        buttons: [mockButton],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
    });

    it("should include button when command can execute in current context", async () => {
      // Arrange
      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
        context: { hasSelection: true }
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1);
      expect(mockCommand.canExecute).toHaveBeenCalledWith({
        currentClass: validClassName,
        hasSelection: true
      });
    });

    it("should exclude button when command cannot execute in current context", async () => {
      // Arrange
      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(false);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
        context: { hasSelection: false }
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(0);
      expect(mockCommand.canExecute).toHaveBeenCalledWith({
        currentClass: validClassName,
        hasSelection: false
      });
    });

    it("should handle undefined context gracefully", async () => {
      // Arrange
      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
        context: undefined
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1);
      expect(mockCommand.canExecute).toHaveBeenCalledWith({
        currentClass: validClassName,
        hasSelection: false
      });
    });
  });

  describe("Button Render Data Generation", () => {
    const validClassName = "exo__Task";
    let mockClassView: ClassView;
    let mockButton: UIButton;
    let mockCommand: ButtonCommand;

    beforeEach(() => {
      mockButton = createMockUIButton({
        label: "Create Task",
        tooltip: "Create a new task",
        order: 5,
        isEnabled: true
      });
      mockCommand = createMockButtonCommand({
        type: CommandType.CREATE_CHILD_TASK,
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true }
        ]
      });
      mockClassView = createMockClassView({
        buttons: [mockButton],
        displayOptions: { showButtons: true, buttonPosition: "floating" }
      });

      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
    });

    it("should generate proper button render data", async () => {
      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1);
      
      const buttonData = response.buttons[0];
      expect(buttonData).toEqual({
        buttonId: mockButton.id.toString(),
        label: mockButton.label,
        tooltip: mockButton.tooltip,
        isEnabled: mockButton.isEnabled,
        order: mockButton.order,
        command: {
          id: mockCommand.id.toString(),
          type: mockCommand.type,
          requiresInput: mockCommand.requiresInput,
          parameters: mockCommand.parameters
        }
      });
    });

    it("should include proper display options", async () => {
      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.displayOptions).toEqual({
        position: "floating",
        showButtons: true
      });
    });
  });

  describe("Button Sorting", () => {
    const validClassName = "exo__Task";
    let mockClassView: ClassView;

    it("should sort buttons by order", async () => {
      // Arrange
      const button1 = createMockUIButton({ 
        order: 3
      });
      const button2 = createMockUIButton({ 
        order: 1
      });
      const button3 = createMockUIButton({ 
        order: 2
      });

      mockClassView = createMockClassView({
        buttons: [button1, button2, button3], // Unsorted order
        displayOptions: { showButtons: true }
      });

      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
      
      // Create commands that can execute
      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(3);
      
      // Should be sorted by order: button2 (1), button3 (2), button1 (3)
      expect(response.buttons[0].buttonId).toBe(button2.id.toString());
      expect(response.buttons[1].buttonId).toBe(button3.id.toString());
      expect(response.buttons[2].buttonId).toBe(button1.id.toString());
    });

    it("should handle different order values gracefully", async () => {
      // Arrange
      const button1 = createMockUIButton({ 
        order: 1
      });
      const button2 = createMockUIButton({ 
        order: 2
      });

      mockClassView = createMockClassView({
        buttons: [button1, button2],
        displayOptions: { showButtons: true }
      });

      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
      
      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(2);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    const validClassName = "exo__Task";

    it("should handle empty button list", async () => {
      // Arrange
      const mockClassView = createMockClassView({
        buttons: [],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toEqual([]);
      expect(response.displayOptions.showButtons).toBe(true);
    });

    it("should handle all buttons being disabled", async () => {
      // Arrange
      const disabledButton = createMockUIButton({ isEnabled: false });
      const mockClassView = createMockClassView({
        buttons: [disabledButton],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toEqual([]);
    });

    it("should handle all commands being non-executable", async () => {
      // Arrange
      const mockButton = createMockUIButton({ isEnabled: true });
      const mockClassView = createMockClassView({
        buttons: [mockButton],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(false);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toEqual([]);
    });

    it("should handle mixed button states correctly", async () => {
      // Arrange
      const enabledButton = createMockUIButton({ 
        isEnabled: true,
        order: 1
      });
      const disabledButton = createMockUIButton({ 
        isEnabled: false,
        order: 2
      });
      
      const mockClassView = createMockClassView({
        buttons: [enabledButton, disabledButton],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1);
      expect(response.buttons[0].buttonId).toBe(enabledButton.id.toString());
      expect(mockButtonRepository.findCommandById).toHaveBeenCalledTimes(1);
      expect(mockButtonRepository.findCommandById).toHaveBeenCalledWith(enabledButton.commandId);
    });
  });

  describe("Performance and Concurrency", () => {
    const validClassName = "exo__Task";

    it("should handle large number of buttons efficiently", async () => {
      // Arrange  
      const buttons = Array.from({ length: 15 }, (_, index) => 
        createMockUIButton({
          order: index
        })
      );
      
      const mockClassView = createMockClassView({
        buttons,
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const startTime = Date.now();
      const result = await useCase.execute({
        className: validClassName,
      });
      const executionTime = Date.now() - startTime;

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(15);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle multiple concurrent requests", async () => {
      // Arrange
      const mockButton = createMockUIButton({ isEnabled: true });
      const mockClassView = createMockClassView({
        buttons: [mockButton],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act - Execute multiple requests concurrently
      const promises = Array(10).fill(null).map(() => 
        useCase.execute({ className: validClassName })
      );
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().buttons).toHaveLength(1);
      });
    });
  });

  describe("Complex Button Configurations", () => {
    const validClassName = "exo__Task";

    it("should handle buttons with complex command parameters", async () => {
      // Arrange
      const complexCommand = createMockButtonCommand({
        type: CommandType.RUN_TEMPLATE,
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true, label: "Task Title" },
          { name: "priority", type: "number", required: false, defaultValue: 1 },
          { name: "tags", type: "array", required: false }
        ],
        template: "# {{title}}\nPriority: {{priority}}\nTags: {{tags}}"
      });

      const mockButton = createMockUIButton({ isEnabled: true });
      const mockClassView = createMockClassView({
        buttons: [mockButton],
        displayOptions: { showButtons: true }
      });

      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
      jest.spyOn(complexCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(complexCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1);
      expect(response.buttons[0].command.parameters).toEqual(complexCommand.parameters);
      expect(response.buttons[0].command.requiresInput).toBe(true);
    });

    it("should handle different button positions", async () => {
      // Arrange
      const positions: Array<"top" | "bottom" | "floating"> = ["top", "bottom", "floating"];
      
      for (const position of positions) {
        const mockButton = createMockUIButton({ isEnabled: true });
        const mockClassView = createMockClassView({
          buttons: [mockButton],
          displayOptions: { showButtons: true, buttonPosition: position }
        });

        mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));
        const mockCommand = createMockButtonCommand();
        jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
        mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

        // Act
        const result = await useCase.execute({
          className: validClassName,
        });

        // Assert
        expect(result.isSuccess).toBe(true);
        const response = result.getValue();
        expect(response.displayOptions.position).toBe(position);
        
        // Clean up mocks for next iteration
        jest.clearAllMocks();
      }
    });
  });

  describe("Asset ID and Context Handling", () => {
    const validClassName = "exo__Task";

    it("should handle requests with assetId", async () => {
      // Arrange
      const mockButton = createMockUIButton({ isEnabled: true });
      const mockClassView = createMockClassView({
        buttons: [mockButton],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
        assetId: "123e4567-e89b-12d3-a456-426614174000"
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.buttons).toHaveLength(1);
    });

    it("should handle full context object", async () => {
      // Arrange
      const mockButton = createMockUIButton({ isEnabled: true });
      const mockClassView = createMockClassView({
        buttons: [mockButton],
        displayOptions: { showButtons: true }
      });
      mockClassViewRepository.findByClassName.mockResolvedValue(Result.ok(mockClassView));

      const mockCommand = createMockButtonCommand();
      jest.spyOn(mockCommand, 'canExecute').mockReturnValue(true);
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Act
      const result = await useCase.execute({
        className: validClassName,
        context: {
          hasSelection: true,
          currentUser: "test-user"
        }
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockCommand.canExecute).toHaveBeenCalledWith({
        currentClass: validClassName,
        hasSelection: true
      });
    });
  });
});