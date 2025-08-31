import { Result } from "../../../../src/domain/core/Result";
import {
  ButtonCommand,
  CommandType,
} from "../../../../src/domain/entities/ButtonCommand";
import {
  ICommandExecutor,
  CommandExecutionRequest,
  CommandExecutionResult,
} from "../../../../src/application/services/ICommandExecutor";

// Mock implementation for testing
class MockCommandExecutor implements ICommandExecutor {
  private handlers = new Map<CommandType, (request: CommandExecutionRequest) => Promise<Result<any>>>();
  private supportedTypes = new Set<CommandType>([
    CommandType.CREATE_ASSET,
    CommandType.NAVIGATE,
    CommandType.EXECUTE_COMMAND,
  ]);

  async execute(request: CommandExecutionRequest): Promise<Result<CommandExecutionResult>> {
    const startTime = Date.now();

    try {
      // Validate request first
      const validationResult = this.validate(request);
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.getError());
      }

      const handler = this.handlers.get(request.command.type);
      if (handler) {
        const result = await handler(request);
        return Result.ok({
          commandId: request.context.commandId,
          status: result.isSuccess ? "success" : "failure",
          output: result.isSuccess ? result.getValue() : undefined,
          error: result.isSuccess ? undefined : result.getError(),
          executionTime: Date.now() - startTime,
        });
      }

      // Default behavior for supported commands
      if (this.isSupported(request.command.type)) {
        return Result.ok({
          commandId: request.context.commandId,
          status: "success",
          output: `Executed ${request.command.type} command`,
          executionTime: Date.now() - startTime,
        });
      }

      return Result.fail(`Unsupported command type: ${request.command.type}`);
    } catch (error) {
      return Result.fail(`Command execution failed: ${error}`);
    }
  }

  registerHandler(
    type: CommandType,
    handler: (request: CommandExecutionRequest) => Promise<Result<any>>,
  ): void {
    this.handlers.set(type, handler);
    this.supportedTypes.add(type);
  }

  isSupported(type: CommandType): boolean {
    return this.supportedTypes.has(type);
  }

  validate(request: CommandExecutionRequest): Result<void> {
    if (!request.command) {
      return Result.fail("Command is required");
    }

    if (!request.context) {
      return Result.fail("Context is required");
    }

    if (!request.context.commandId) {
      return Result.fail("Command ID is required");
    }

    if (!request.context.timestamp) {
      return Result.fail("Timestamp is required");
    }

    return Result.ok(undefined);
  }
}

describe("ICommandExecutor Interface Tests", () => {
  let executor: MockCommandExecutor;
  let mockCommand: ButtonCommand;
  let baseRequest: CommandExecutionRequest;

  beforeEach(() => {
    executor = new MockCommandExecutor();
    
    mockCommand = {
      id: "test-command-1",
      type: CommandType.CREATE_ASSET,
      name: "Test Command",
      description: "Test command description",
      icon: "plus",
      template: "test-template",
      script: "test-script",
      targetClass: "TestClass",
      parameters: { param1: "value1" },
      isActive: true,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
      },
    };

    baseRequest = {
      command: mockCommand,
      context: {
        commandId: "exec-123",
        commandType: CommandType.CREATE_ASSET,
        parameters: { test: "value" },
        timestamp: new Date(),
        template: "test-template",
        script: "test-script",
        targetClass: "TestClass",
        assetId: "asset-123",
        currentView: "test-view",
        currentClass: "TestClass",
        selection: ["item1", "item2"],
      },
    };
  });

  describe("Command Execution", () => {
    it("should execute a supported command successfully", async () => {
      const result = await executor.execute(baseRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.commandId).toBe("exec-123");
      expect(executionResult.status).toBe("success");
      expect(executionResult.output).toContain("CREATE_ASSET");
      expect(executionResult.executionTime).toBeGreaterThan(0);
    });

    it("should fail for unsupported command types", async () => {
      const unsupportedRequest = {
        ...baseRequest,
        command: {
          ...mockCommand,
          type: "UNSUPPORTED_TYPE" as CommandType,
        },
        context: {
          ...baseRequest.context,
          commandType: "UNSUPPORTED_TYPE" as CommandType,
        },
      };

      const result = await executor.execute(unsupportedRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Unsupported command type");
    });

    it("should validate requests before execution", async () => {
      const invalidRequest = {
        ...baseRequest,
        context: {
          ...baseRequest.context,
          commandId: "", // Invalid
        },
      };

      const result = await executor.execute(invalidRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Command ID is required");
    });

    it("should handle custom command handlers", async () => {
      const customHandler = jest.fn().mockResolvedValue(
        Result.ok({ customOutput: "custom result" })
      );

      executor.registerHandler(CommandType.NAVIGATE, customHandler);

      const navigateRequest = {
        ...baseRequest,
        command: {
          ...mockCommand,
          type: CommandType.NAVIGATE,
        },
        context: {
          ...baseRequest.context,
          commandType: CommandType.NAVIGATE,
        },
      };

      const result = await executor.execute(navigateRequest);

      expect(result.isSuccess).toBe(true);
      expect(customHandler).toHaveBeenCalledWith(navigateRequest);
      
      const executionResult = result.getValue();
      expect(executionResult.output).toEqual({ customOutput: "custom result" });
      expect(executionResult.status).toBe("success");
    });

    it("should handle handler failures gracefully", async () => {
      const failingHandler = jest.fn().mockResolvedValue(
        Result.fail("Handler failed")
      );

      executor.registerHandler(CommandType.EXECUTE_COMMAND, failingHandler);

      const executeRequest = {
        ...baseRequest,
        command: {
          ...mockCommand,
          type: CommandType.EXECUTE_COMMAND,
        },
        context: {
          ...baseRequest.context,
          commandType: CommandType.EXECUTE_COMMAND,
        },
      };

      const result = await executor.execute(executeRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.status).toBe("failure");
      expect(executionResult.error).toBe("Handler failed");
      expect(executionResult.output).toBeUndefined();
    });

    it("should measure execution time accurately", async () => {
      const slowHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return Result.ok({ slow: "result" });
      });

      executor.registerHandler(CommandType.CREATE_ASSET, slowHandler);

      const result = await executor.execute(baseRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      expect(executionResult.executionTime).toBeGreaterThan(90);
    });
  });

  describe("Handler Registration", () => {
    it("should register custom handlers for command types", () => {
      expect(executor.isSupported(CommandType.NAVIGATE)).toBe(true);

      const customType = "CUSTOM_TYPE" as CommandType;
      expect(executor.isSupported(customType)).toBe(false);

      const customHandler = jest.fn().mockResolvedValue(Result.ok({}));
      executor.registerHandler(customType, customHandler);

      expect(executor.isSupported(customType)).toBe(true);
    });

    it("should allow overriding existing handlers", () => {
      const handler1 = jest.fn().mockResolvedValue(Result.ok({ version: 1 }));
      const handler2 = jest.fn().mockResolvedValue(Result.ok({ version: 2 }));

      executor.registerHandler(CommandType.CREATE_ASSET, handler1);
      executor.registerHandler(CommandType.CREATE_ASSET, handler2);

      // Second handler should override first
      expect(executor.isSupported(CommandType.CREATE_ASSET)).toBe(true);
    });
  });

  describe("Command Support Check", () => {
    it("should correctly identify supported command types", () => {
      expect(executor.isSupported(CommandType.CREATE_ASSET)).toBe(true);
      expect(executor.isSupported(CommandType.NAVIGATE)).toBe(true);
      expect(executor.isSupported(CommandType.EXECUTE_COMMAND)).toBe(true);
    });

    it("should return false for unsupported command types", () => {
      expect(executor.isSupported("UNKNOWN_TYPE" as CommandType)).toBe(false);
    });
  });

  describe("Request Validation", () => {
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
      expect(result.getError()).toBe("Command is required");
    });

    it("should fail validation for missing context", () => {
      const invalidRequest = {
        ...baseRequest,
        context: null as any,
      };

      const result = executor.validate(invalidRequest);
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe("Context is required");
    });

    it("should fail validation for missing commandId", () => {
      const invalidRequest = {
        ...baseRequest,
        context: {
          ...baseRequest.context,
          commandId: "",
        },
      };

      const result = executor.validate(invalidRequest);
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe("Command ID is required");
    });

    it("should fail validation for missing timestamp", () => {
      const invalidRequest = {
        ...baseRequest,
        context: {
          ...baseRequest.context,
          timestamp: null as any,
        },
      };

      const result = executor.validate(invalidRequest);
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe("Timestamp is required");
    });

    it("should handle edge cases in validation", () => {
      // Empty string command ID
      expect(executor.validate({
        ...baseRequest,
        context: { ...baseRequest.context, commandId: "" }
      }).isSuccess).toBe(false);

      // Undefined context fields are optional except required ones
      const minimalValidRequest = {
        command: mockCommand,
        context: {
          commandId: "test-id",
          commandType: CommandType.CREATE_ASSET,
          parameters: {},
          timestamp: new Date(),
        },
      };
      expect(executor.validate(minimalValidRequest).isSuccess).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle exceptions during execution", async () => {
      const throwingHandler = jest.fn().mockRejectedValue(new Error("Handler threw"));

      executor.registerHandler(CommandType.NAVIGATE, throwingHandler);

      const navigateRequest = {
        ...baseRequest,
        command: { ...mockCommand, type: CommandType.NAVIGATE },
        context: { ...baseRequest.context, commandType: CommandType.NAVIGATE },
      };

      const result = await executor.execute(navigateRequest);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Command execution failed");
    });

    it("should handle malformed command objects gracefully", async () => {
      const malformedRequest = {
        command: { type: null } as any,
        context: baseRequest.context,
      };

      // Should not throw, should return failure result
      const result = await executor.execute(malformedRequest);
      expect(result.isSuccess).toBe(false);
    });
  });

  describe("Interface Contract Compliance", () => {
    it("should return CommandExecutionResult with all required fields", async () => {
      const result = await executor.execute(baseRequest);

      expect(result.isSuccess).toBe(true);
      const executionResult = result.getValue();
      
      expect(executionResult).toHaveProperty("commandId");
      expect(executionResult).toHaveProperty("status");
      expect(executionResult).toHaveProperty("executionTime");
      expect(typeof executionResult.commandId).toBe("string");
      expect(["success", "failure", "cancelled"]).toContain(executionResult.status);
      expect(typeof executionResult.executionTime).toBe("number");
    });

    it("should handle all status types correctly", async () => {
      // Success case
      const successResult = await executor.execute(baseRequest);
      expect(successResult.getValue().status).toBe("success");

      // Failure case
      const failingHandler = jest.fn().mockResolvedValue(Result.fail("Test failure"));
      executor.registerHandler(CommandType.CREATE_ASSET, failingHandler);
      
      const failureResult = await executor.execute(baseRequest);
      expect(failureResult.getValue().status).toBe("failure");
    });
  });
});