import { ExecuteButtonCommandUseCase } from "../../../../src/application/use-cases/ExecuteButtonCommandUseCase";
import { IButtonRepository } from "../../../../src/domain/repositories/IButtonRepository";
import { ICommandExecutor } from "../../../../src/application/services/ICommandExecutor";
import { Result } from "../../../../src/domain/core/Result";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";
import { UIButton } from "../../../../src/domain/entities/UIButton";
import { ButtonCommand, CommandType } from "../../../../src/domain/entities/ButtonCommand";

describe("ExecuteButtonCommandUseCase", () => {
  let useCase: ExecuteButtonCommandUseCase;
  let mockButtonRepository: jest.Mocked<IButtonRepository>;
  let mockCommandExecutor: jest.Mocked<ICommandExecutor>;

  // Test data factory
  const createMockAssetId = (value: string = "123e4567-e89b-12d3-a456-426614174000"): AssetId => {
    const result = AssetId.create(value);
    if (result.isFailure) throw new Error("Failed to create AssetId");
    return result.getValue();
  };

  const createMockUIButton = (overrides: Partial<any> = {}): UIButton => {
    const buttonId = createMockAssetId("123e4567-e89b-12d3-a456-426614174001");
    const commandId = createMockAssetId("123e4567-e89b-12d3-a456-426614174002");
    
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
    const commandId = createMockAssetId("123e4567-e89b-12d3-a456-426614174002");
    
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

  beforeEach(() => {
    // Create mock repositories
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

    mockCommandExecutor = {
      execute: jest.fn(),
      registerHandler: jest.fn(),
      isSupported: jest.fn(),
      validate: jest.fn(),
    };

    useCase = new ExecuteButtonCommandUseCase(mockButtonRepository, mockCommandExecutor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Input Validation", () => {
    it("should fail when buttonId is missing", async () => {
      // Act
      const result = await useCase.execute({
        buttonId: "",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Button ID is required");
    });

    it("should fail when buttonId is undefined", async () => {
      // Act
      const result = await useCase.execute({
        buttonId: undefined as any,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Button ID is required");
    });

    it("should fail when buttonId is invalid UUID format", async () => {
      // Act
      const result = await useCase.execute({
        buttonId: "invalid-uuid",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid button ID");
    });

    it("should accept valid UUID format", async () => {
      // Arrange
      const validButtonId = "123e4567-e89b-12d3-a456-426614174001";
      mockButtonRepository.findButtonById.mockResolvedValue(
        Result.fail("Button not found")
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(mockButtonRepository.findButtonById).toHaveBeenCalledWith(
        expect.objectContaining({
          value: validButtonId
        })
      );
    });
  });

  describe("Button Loading", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";

    it("should fail when button repository fails", async () => {
      // Arrange
      mockButtonRepository.findButtonById.mockResolvedValue(
        Result.fail("Database connection error")
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Failed to load button: Database connection error");
    });

    it("should fail when button is not found", async () => {
      // Arrange
      mockButtonRepository.findButtonById.mockResolvedValue(
        Result.ok(null)
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Button not found");
    });

    it("should fail when button cannot be executed", async () => {
      // Arrange
      const disabledButton = createMockUIButton({ isEnabled: false });
      mockButtonRepository.findButtonById.mockResolvedValue(
        Result.ok(disabledButton)
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Button is disabled");
    });

    it("should load button successfully", async () => {
      // Arrange
      const button = createMockUIButton();
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(button));
      mockButtonRepository.findCommandById.mockResolvedValue(
        Result.fail("Command not found")
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(mockButtonRepository.findButtonById).toHaveBeenCalledTimes(1);
      expect(mockButtonRepository.findCommandById).toHaveBeenCalledWith(
        button.commandId
      );
    });
  });

  describe("Command Loading", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";
    let mockButton: UIButton;

    beforeEach(() => {
      mockButton = createMockUIButton();
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
    });

    it("should fail when command repository fails", async () => {
      // Arrange
      mockButtonRepository.findCommandById.mockResolvedValue(
        Result.fail("Command repository error")
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Failed to load command: Command repository error");
    });

    it("should fail when command is not found", async () => {
      // Arrange
      mockButtonRepository.findCommandById.mockResolvedValue(
        Result.ok(null)
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Command not found");
    });

    it("should load command successfully", async () => {
      // Arrange
      const command = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(command));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: command.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(mockButtonRepository.findCommandById).toHaveBeenCalledWith(
        mockButton.commandId
      );
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("Input Requirements", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";
    let mockButton: UIButton;

    beforeEach(() => {
      mockButton = createMockUIButton();
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
    });

    it("should return input schema when command requires input but none provided", async () => {
      // Arrange
      const command = createMockButtonCommand({
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true, label: "Title" }
        ]
      });
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(command));

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(false);
      expect(response.requiresInput).toBe(true);
      expect(response.inputSchema).toEqual({
        title: command.name,
        description: command.description,
        parameters: command.parameters
      });
    });

    it("should continue execution when command requires input and input is provided", async () => {
      // Arrange
      const command = createMockButtonCommand({
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true }
        ]
      });
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(command));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: command.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: { title: "Test Title" }
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(true);
      expect(response.requiresInput).toBeUndefined();
    });

    it("should not require input when command does not require it", async () => {
      // Arrange
      const command = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(command));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: command.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(true);
      expect(response.requiresInput).toBeUndefined();
    });
  });

  describe("Command Execution Context", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";
    let mockButton: UIButton;
    let mockCommand: ButtonCommand;

    beforeEach(() => {
      mockButton = createMockUIButton();
      mockCommand = createMockButtonCommand({
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true }
        ]
      });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
    });

    it("should fail when command parameter validation fails", async () => {
      // Arrange
      const invalidParameters = { title: "" }; // Empty string for required parameter

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: invalidParameters
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Invalid parameters");
    });

    it("should build proper execution context", async () => {
      // Arrange
      const validParameters = { title: "Valid Title" };
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: validParameters,
        assetId: "asset-123",
        context: {
          currentView: "test-view",
          currentClass: "test-class",
          selection: ["item1", "item2"]
        }
      });

      // Assert
      expect(mockCommandExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          command: mockCommand,
          context: expect.objectContaining({
            commandId: mockCommand.id.toString(),
            commandType: mockCommand.type,
            parameters: validParameters,
            timestamp: expect.any(Date),
            assetId: "asset-123",
            currentView: "test-view",
            currentClass: "test-class",
            selection: ["item1", "item2"]
          })
        })
      );
    });
  });

  describe("Command Execution", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";
    let mockButton: UIButton;
    let mockCommand: ButtonCommand;

    beforeEach(() => {
      mockButton = createMockUIButton();
      mockCommand = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
    });

    it("should fail when command execution fails", async () => {
      // Arrange
      mockCommandExecutor.execute.mockResolvedValue(
        Result.fail("Execution failed")
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Command execution failed: Execution failed");
    });

    it("should handle command executor throwing exception", async () => {
      // Arrange
      const error = new Error("Unexpected error");
      mockCommandExecutor.execute.mockRejectedValue(error);

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Unexpected error during command execution: Unexpected error");
    });

    it("should execute command successfully and record button click", async () => {
      // Arrange
      const executionResult = {
        commandId: mockCommand.id.toString(),
        status: "success" as const,
        output: { data: "test result" },
        executionTime: 150
      };
      mockCommandExecutor.execute.mockResolvedValue(Result.ok(executionResult));

      // Spy on button's click method
      const clickSpy = jest.spyOn(mockButton, 'click').mockReturnValue(Result.ok());

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(true);
      expect(response.message).toBe(`Command '${mockCommand.name}' executed successfully`);
      expect(response.result).toEqual(executionResult);
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it("should execute command with minimal parameters", async () => {
      // Arrange
      const executionResult = {
        commandId: mockCommand.id.toString(),
        status: "success" as const,
        executionTime: 50
      };
      mockCommandExecutor.execute.mockResolvedValue(Result.ok(executionResult));

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.success).toBe(true);
      expect(response.result).toEqual(executionResult);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";

    it("should handle null input parameters gracefully", async () => {
      // Arrange
      const mockButton = createMockUIButton();
      const mockCommand = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: null as any
      });

      // Assert
      expect(result.isSuccess).toBe(true);
    });

    it("should handle undefined context gracefully", async () => {
      // Arrange
      const mockButton = createMockUIButton();
      const mockCommand = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        context: undefined
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockCommandExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            currentView: undefined,
            currentClass: undefined,
            selection: undefined
          })
        })
      );
    });

    it("should handle command with template and script", async () => {
      // Arrange
      const mockButton = createMockUIButton();
      const mockCommand = createMockButtonCommand({
        type: CommandType.RUN_TEMPLATE,
        requiresInput: false,
        template: "## {{title}}\n{{content}}",
        script: "console.log('executed');"
      });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockCommandExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            template: mockCommand.template,
            script: mockCommand.script
          })
        })
      );
    });

    it("should handle empty string input parameters", async () => {
      // Arrange
      const mockButton = createMockUIButton();
      const mockCommand = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: {}
      });

      // Assert
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("Complex Parameter Validation Scenarios", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";
    let mockButton: UIButton;

    beforeEach(() => {
      mockButton = createMockUIButton();
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
    });

    it("should handle command with multiple required parameters", async () => {
      // Arrange
      const mockCommand = createMockButtonCommand({
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true },
          { name: "priority", type: "number", required: true },
          { name: "active", type: "boolean", required: true }
        ]
      });
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: {
          title: "Test Task",
          priority: 1,
          active: true
        }
      });

      // Assert
      expect(result.isSuccess).toBe(true);
    });

    it("should handle command with optional parameters and defaults", async () => {
      // Arrange
      const mockCommand = createMockButtonCommand({
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true },
          { name: "description", type: "string", required: false, defaultValue: "No description" }
        ]
      });
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: {
          title: "Test Task"
          // description omitted, should use default
        }
      });

      // Assert
      expect(result.isSuccess).toBe(true);
    });

    it("should fail when buildExecutionContext fails", async () => {
      // Arrange
      const mockCommand = createMockButtonCommand({
        requiresInput: true,
        parameters: [
          { name: "title", type: "string", required: true }
        ]
      });
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));

      // Mock the buildExecutionContext to fail
      jest.spyOn(mockCommand, 'buildExecutionContext').mockReturnValue(
        Result.fail("Parameter validation failed")
      );

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
        inputParameters: { title: "" } // This should cause validation to fail
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid parameters: Parameter validation failed");
    });
  });

  describe("Performance and State Management", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";

    it("should handle multiple concurrent executions", async () => {
      // Arrange
      const mockButton = createMockUIButton();
      const mockCommand = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act - Execute multiple times concurrently
      const promises = Array(5).fill(null).map(() => 
        useCase.execute({ buttonId: validButtonId })
      );
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });
      expect(mockCommandExecutor.execute).toHaveBeenCalledTimes(5);
    });

    it("should not interfere with repository state between calls", async () => {
      // Arrange
      const mockButton1 = createMockUIButton();
      const mockButton2 = createMockUIButton();
      const mockCommand = createMockButtonCommand({ requiresInput: false });

      mockButtonRepository.findButtonById
        .mockResolvedValueOnce(Result.ok(mockButton1))
        .mockResolvedValueOnce(Result.ok(mockButton2));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Act
      const result1 = await useCase.execute({ buttonId: validButtonId });
      const result2 = await useCase.execute({ buttonId: validButtonId });

      // Assert
      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(mockButtonRepository.findButtonById).toHaveBeenCalledTimes(2);
    });
  });

  describe("Integration with Domain Events", () => {
    const validButtonId = "123e4567-e89b-12d3-a456-426614174001";

    it("should trigger button click event on successful execution", async () => {
      // Arrange
      const mockButton = createMockUIButton();
      const mockCommand = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.ok({
          commandId: mockCommand.id.toString(),
          status: "success" as const,
          executionTime: 100
        })
      );

      // Spy on the button's addDomainEvent method
      const addDomainEventSpy = jest.spyOn(mockButton, 'addDomainEvent');

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(addDomainEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "ButtonClicked",
          eventData: expect.objectContaining({
            buttonId: mockButton.id.toString(),
            commandId: mockCommand.id.toString(),
            label: mockButton.label
          })
        })
      );
    });

    it("should not trigger button click event on failed execution", async () => {
      // Arrange
      const mockButton = createMockUIButton();
      const mockCommand = createMockButtonCommand({ requiresInput: false });
      mockButtonRepository.findButtonById.mockResolvedValue(Result.ok(mockButton));
      mockButtonRepository.findCommandById.mockResolvedValue(Result.ok(mockCommand));
      mockCommandExecutor.execute.mockResolvedValue(
        Result.fail("Execution failed")
      );

      // Spy on the button's addDomainEvent method
      const addDomainEventSpy = jest.spyOn(mockButton, 'addDomainEvent');

      // Act
      const result = await useCase.execute({
        buttonId: validButtonId,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(addDomainEventSpy).not.toHaveBeenCalled();
    });
  });
});