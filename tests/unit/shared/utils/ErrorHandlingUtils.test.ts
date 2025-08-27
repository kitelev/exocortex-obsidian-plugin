import { ErrorHandlingUtils } from "../../../../src/shared/utils/ErrorHandlingUtils";
import { Notice } from "obsidian";

// Mock Obsidian Notice
jest.mock("obsidian");

describe("ErrorHandlingUtils", () => {
  let consoleSpy: {
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
  };
  let mockNotice: jest.SpyInstance;

  beforeEach(() => {
    // Setup console spies
    consoleSpy = {
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
      warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
    };

    // Mock Notice to avoid console noise and track calls
    mockNotice = jest
      .spyOn(require("obsidian"), "Notice")
      .mockImplementation(() => ({}));
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();

    // Restore Notice mock
    if (mockNotice) {
      mockNotice.mockRestore();
    }
  });

  describe("handleRepositoryError", () => {
    it("should log error and show notice with basic parameters", () => {
      // Arrange
      const operation = "save asset";
      const error = new Error("Database connection failed");

      // Act
      ErrorHandlingUtils.handleRepositoryError(operation, error);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "save asset failed: Database connection failed",
        { error, context: undefined },
      );
      expect(mockNotice).toHaveBeenCalledWith(
        "Error: save asset failed: Database connection failed",
        5000,
      );
    });

    it("should include context in logging when provided", () => {
      // Arrange
      const operation = "delete asset";
      const error = new Error("Permission denied");
      const context = { userId: "123", assetId: "abc-456" };

      // Act
      ErrorHandlingUtils.handleRepositoryError(operation, error, context);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "delete asset failed: Permission denied",
        { error, context },
      );
      expect(mockNotice).toHaveBeenCalledWith(
        "Error: delete asset failed: Permission denied",
        5000,
      );
    });

    it("should handle errors with empty messages", () => {
      // Arrange
      const operation = "update asset";
      const error = new Error("");

      // Act
      ErrorHandlingUtils.handleRepositoryError(operation, error);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith("update asset failed: ", {
        error,
        context: undefined,
      });
      expect(mockNotice).toHaveBeenCalledWith(
        "Error: update asset failed: ",
        5000,
      );
    });

    it("should handle custom error types", () => {
      // Arrange
      const operation = "validate asset";
      const customError = new TypeError("Invalid asset type");

      // Act
      ErrorHandlingUtils.handleRepositoryError(operation, customError);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "validate asset failed: Invalid asset type",
        { error: customError, context: undefined },
      );
    });
  });

  describe("handleRenderingError", () => {
    let mockContainer: HTMLElement;

    beforeEach(() => {
      // Setup mock container
      mockContainer = document.createElement("div");
      mockContainer.empty = jest.fn();
      mockContainer.createEl = jest
        .fn()
        .mockReturnValue(document.createElement("div"));
    });

    it("should log error and show notice without container", () => {
      // Arrange
      const component = "AssetRenderer";
      const error = new Error("Template not found");

      // Act
      ErrorHandlingUtils.handleRenderingError(component, error);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "AssetRenderer rendering failed: Template not found",
        error,
      );
      expect(mockNotice).toHaveBeenCalledWith(
        "Rendering error in AssetRenderer",
        3000,
      );
    });

    it("should clear container and show fallback message", () => {
      // Arrange
      const component = "LayoutRenderer";
      const error = new Error("Layout file corrupted");
      const fallbackMessage = "Unable to render layout";

      // Act
      ErrorHandlingUtils.handleRenderingError(
        component,
        error,
        mockContainer,
        fallbackMessage,
      );

      // Assert
      expect(mockContainer.empty).toHaveBeenCalled();
      expect(mockContainer.createEl).toHaveBeenCalledWith("div", {
        text: "Unable to render layout",
        cls: "exocortex-error-fallback",
      });
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "LayoutRenderer rendering failed: Layout file corrupted",
        error,
      );
      expect(mockNotice).toHaveBeenCalledWith(
        "Rendering error in LayoutRenderer",
        3000,
      );
    });

    it("should use default fallback message when none provided", () => {
      // Arrange
      const component = "ButtonRenderer";
      const error = new Error("Button config invalid");

      // Act
      ErrorHandlingUtils.handleRenderingError(component, error, mockContainer);

      // Assert
      expect(mockContainer.createEl).toHaveBeenCalledWith("div", {
        text: "Content could not be displayed",
        cls: "exocortex-error-fallback",
      });
    });

    it("should handle container without DOM extension methods", () => {
      // Arrange
      const basicContainer = document.createElement("div");
      // Remove mock methods to simulate standard DOM element
      delete (basicContainer as any).empty;
      delete (basicContainer as any).createEl;

      const component = "QueryRenderer";
      const error = new Error("Query syntax error");

      // Act & Assert - should not throw
      expect(() => {
        ErrorHandlingUtils.handleRenderingError(
          component,
          error,
          basicContainer,
        );
      }).not.toThrow();
    });
  });

  describe("handleValidationError", () => {
    it("should log warning and show notice with expected format", () => {
      // Arrange
      const field = "email";
      const value = "invalid-email";
      const expectedFormat = "user@domain.com";

      // Act
      ErrorHandlingUtils.handleValidationError(field, value, expectedFormat);

      // Assert
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Invalid email: "invalid-email". Expected format: user@domain.com',
      );
      expect(mockNotice).toHaveBeenCalledWith(
        'Invalid email: "invalid-email". Expected format: user@domain.com',
        4000,
      );
    });

    it("should handle validation error without expected format", () => {
      // Arrange
      const field = "age";
      const value = -5;

      // Act
      ErrorHandlingUtils.handleValidationError(field, value);

      // Assert
      expect(consoleSpy.warn).toHaveBeenCalledWith('Invalid age: "-5"');
      expect(mockNotice).toHaveBeenCalledWith('Invalid age: "-5"', 4000);
    });

    it("should handle complex values", () => {
      // Arrange
      const field = "config";
      const value = { invalid: true, data: [1, 2, 3] };

      // Act
      ErrorHandlingUtils.handleValidationError(field, value);

      // Assert
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Invalid config: "[object Object]"',
      );
    });

    it("should handle null and undefined values", () => {
      // Arrange & Act
      ErrorHandlingUtils.handleValidationError("name", null);
      ErrorHandlingUtils.handleValidationError("description", undefined);

      // Assert
      expect(consoleSpy.warn).toHaveBeenCalledWith('Invalid name: "null"');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Invalid description: "undefined"',
      );
    });
  });

  describe("safeAsync", () => {
    it("should return result when operation succeeds", async () => {
      // Arrange
      const operation = jest.fn().mockResolvedValue("success");
      const errorContext = "test operation";

      // Act
      const result = await ErrorHandlingUtils.safeAsync(
        operation,
        errorContext,
      );

      // Assert
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it("should return undefined when operation fails without fallback", async () => {
      // Arrange
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Operation failed"));
      const errorContext = "test operation";

      // Act
      const result = await ErrorHandlingUtils.safeAsync(
        operation,
        errorContext,
      );

      // Assert
      expect(result).toBeUndefined();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "test operation failed:",
        new Error("Operation failed"),
      );
    });

    it("should return fallback when operation fails with fallback provided", async () => {
      // Arrange
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Network timeout"));
      const errorContext = "fetch data";
      const fallback = { data: "default" };

      // Act
      const result = await ErrorHandlingUtils.safeAsync(
        operation,
        errorContext,
        fallback,
      );

      // Assert
      expect(result).toBe(fallback);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "fetch data failed:",
        new Error("Network timeout"),
      );
    });

    it("should handle operation that throws synchronously", async () => {
      // Arrange
      const operation = jest.fn().mockImplementation(() => {
        throw new Error("Immediate error");
      });
      const errorContext = "sync operation";

      // Act
      const result = await ErrorHandlingUtils.safeAsync(
        operation,
        errorContext,
      );

      // Assert
      expect(result).toBeUndefined();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "sync operation failed:",
        new Error("Immediate error"),
      );
    });

    it("should handle null and undefined fallbacks explicitly", async () => {
      // Arrange
      const operation = jest.fn().mockRejectedValue(new Error("Failed"));

      // Act
      const resultWithNull = await ErrorHandlingUtils.safeAsync(
        operation,
        "test",
        null,
      );
      const resultWithUndefined = await ErrorHandlingUtils.safeAsync(
        operation,
        "test",
        undefined,
      );

      // Assert
      expect(resultWithNull).toBeNull();
      expect(resultWithUndefined).toBeUndefined();
    });
  });

  describe("safeSync", () => {
    it("should return result when operation succeeds", () => {
      // Arrange
      const operation = jest.fn().mockReturnValue("sync success");
      const errorContext = "sync operation";

      // Act
      const result = ErrorHandlingUtils.safeSync(operation, errorContext);

      // Assert
      expect(result).toBe("sync success");
      expect(operation).toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it("should return undefined when operation fails without fallback", () => {
      // Arrange
      const operation = jest.fn().mockImplementation(() => {
        throw new Error("Sync operation failed");
      });
      const errorContext = "sync operation";

      // Act
      const result = ErrorHandlingUtils.safeSync(operation, errorContext);

      // Assert
      expect(result).toBeUndefined();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "sync operation failed:",
        new Error("Sync operation failed"),
      );
    });

    it("should return fallback when operation fails with fallback provided", () => {
      // Arrange
      const operation = jest.fn().mockImplementation(() => {
        throw new Error("Computation error");
      });
      const errorContext = "calculate value";
      const fallback = 0;

      // Act
      const result = ErrorHandlingUtils.safeSync(
        operation,
        errorContext,
        fallback,
      );

      // Assert
      expect(result).toBe(0);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "calculate value failed:",
        new Error("Computation error"),
      );
    });

    it("should handle operations that return falsy values", () => {
      // Arrange
      const operation = jest.fn().mockReturnValue(false);

      // Act
      const result = ErrorHandlingUtils.safeSync(operation, "test");

      // Assert
      expect(result).toBe(false);
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe("createError", () => {
    it("should create error with code and context", () => {
      // Arrange
      const code = "VALIDATION_ERROR";
      const message = "Field validation failed";
      const context = { field: "email", value: "invalid" };

      // Act
      const error = ErrorHandlingUtils.createError(code, message, context);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Field validation failed");
      expect((error as any).code).toBe("VALIDATION_ERROR");
      expect((error as any).context).toBe(context);
    });

    it("should create error without context", () => {
      // Arrange
      const code = "NETWORK_ERROR";
      const message = "Connection failed";

      // Act
      const error = ErrorHandlingUtils.createError(code, message);

      // Assert
      expect(error.message).toBe("Connection failed");
      expect((error as any).code).toBe("NETWORK_ERROR");
      expect((error as any).context).toBeUndefined();
    });

    it("should handle empty strings", () => {
      // Arrange & Act
      const error = ErrorHandlingUtils.createError("", "");

      // Assert
      expect(error.message).toBe("");
      expect((error as any).code).toBe("");
    });
  });

  describe("isErrorOfType", () => {
    it("should return true for matching error code", () => {
      // Arrange
      const error = ErrorHandlingUtils.createError(
        "VALIDATION_ERROR",
        "Test error",
      );

      // Act & Assert
      expect(ErrorHandlingUtils.isErrorOfType(error, "VALIDATION_ERROR")).toBe(
        true,
      );
    });

    it("should return false for non-matching error code", () => {
      // Arrange
      const error = ErrorHandlingUtils.createError(
        "NETWORK_ERROR",
        "Test error",
      );

      // Act & Assert
      expect(ErrorHandlingUtils.isErrorOfType(error, "VALIDATION_ERROR")).toBe(
        false,
      );
    });

    it("should return false for standard errors without code", () => {
      // Arrange
      const error = new Error("Standard error");

      // Act & Assert
      expect(ErrorHandlingUtils.isErrorOfType(error, "VALIDATION_ERROR")).toBe(
        false,
      );
    });

    it("should handle null and undefined errors", () => {
      // Arrange & Act & Assert
      expect(ErrorHandlingUtils.isErrorOfType(null, "TEST")).toBe(false);
      expect(ErrorHandlingUtils.isErrorOfType(undefined, "TEST")).toBe(false);
    });

    it("should handle non-error objects", () => {
      // Arrange & Act & Assert
      expect(ErrorHandlingUtils.isErrorOfType("string", "TEST")).toBe(false);
      expect(ErrorHandlingUtils.isErrorOfType(123, "TEST")).toBe(false);
      expect(ErrorHandlingUtils.isErrorOfType({}, "TEST")).toBe(false);
    });

    it("should handle objects with code property", () => {
      // Arrange
      const objectWithCode = { code: "CUSTOM_ERROR", message: "Custom" };

      // Act & Assert
      expect(
        ErrorHandlingUtils.isErrorOfType(objectWithCode, "CUSTOM_ERROR"),
      ).toBe(true);
      expect(
        ErrorHandlingUtils.isErrorOfType(objectWithCode, "OTHER_ERROR"),
      ).toBe(false);
    });
  });

  describe("formatErrorForLogging", () => {
    it("should format error with all properties", () => {
      // Arrange
      const error = new Error("Test error");
      error.stack = "Error stack trace";
      const context = { operation: "test", userId: "123" };

      // Act
      const formatted = ErrorHandlingUtils.formatErrorForLogging(
        error,
        context,
      );

      // Assert
      expect(formatted).toEqual({
        message: "Test error",
        stack: "Error stack trace",
        name: "Error",
        code: undefined,
        context: { operation: "test", userId: "123" },
        timestamp: expect.any(String),
      });
      expect(new Date(formatted.timestamp)).toBeInstanceOf(Date);
    });

    it("should format custom error with code", () => {
      // Arrange
      const error = ErrorHandlingUtils.createError(
        "CUSTOM_CODE",
        "Custom error",
      );

      // Act
      const formatted = ErrorHandlingUtils.formatErrorForLogging(error);

      // Assert
      expect(formatted).toEqual({
        message: "Custom error",
        stack: expect.any(String),
        name: "Error",
        code: "CUSTOM_CODE",
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it("should handle error without stack trace", () => {
      // Arrange
      const error = new Error("No stack");
      error.stack = undefined;

      // Act
      const formatted = ErrorHandlingUtils.formatErrorForLogging(error);

      // Assert
      expect(formatted.stack).toBeUndefined();
      expect(formatted.message).toBe("No stack");
    });

    it("should handle TypeError and other error types", () => {
      // Arrange
      const typeError = new TypeError("Type error message");
      const rangeError = new RangeError("Range error message");

      // Act
      const formattedType = ErrorHandlingUtils.formatErrorForLogging(typeError);
      const formattedRange =
        ErrorHandlingUtils.formatErrorForLogging(rangeError);

      // Assert
      expect(formattedType.name).toBe("TypeError");
      expect(formattedType.message).toBe("Type error message");
      expect(formattedRange.name).toBe("RangeError");
      expect(formattedRange.message).toBe("Range error message");
    });

    it("should include timestamp in ISO format", () => {
      // Arrange
      const error = new Error("Timestamp test");
      const before = new Date();

      // Act
      const formatted = ErrorHandlingUtils.formatErrorForLogging(error);
      const after = new Date();

      // Assert
      const timestamp = new Date(formatted.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(formatted.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete error flow from creation to formatting", () => {
      // Arrange
      const code = "REPOSITORY_ERROR";
      const message = "Failed to save asset";
      const context = { assetId: "123", operation: "save" };

      // Act - Create error
      const error = ErrorHandlingUtils.createError(code, message, context);

      // Act - Check error type
      const isCorrectType = ErrorHandlingUtils.isErrorOfType(error, code);

      // Act - Format for logging
      const formatted = ErrorHandlingUtils.formatErrorForLogging(error, {
        additional: "info",
      });

      // Assert
      expect(isCorrectType).toBe(true);
      expect(formatted.code).toBe(code);
      expect(formatted.message).toBe(message);
      expect(formatted.context).toEqual({ additional: "info" });
    });

    it("should handle error pipeline with safe operations", async () => {
      // Arrange
      const failingOperation = async () => {
        throw ErrorHandlingUtils.createError(
          "ASYNC_ERROR",
          "Async operation failed",
        );
      };

      // Act - Use safe async with error handling
      const result = await ErrorHandlingUtils.safeAsync(
        failingOperation,
        "test async operation",
        "fallback result",
      );

      // Assert
      expect(result).toBe("fallback result");
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "test async operation failed:",
        expect.objectContaining({
          message: "Async operation failed",
          code: "ASYNC_ERROR",
        }),
      );
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    it("should handle very long error messages", () => {
      // Arrange
      const longMessage = "a".repeat(10000);
      const error = new Error(longMessage);

      // Act & Assert
      expect(() => {
        ErrorHandlingUtils.handleRepositoryError("test", error);
      }).not.toThrow();
    });

    it("should handle circular reference in context", () => {
      // Arrange
      const context: any = { name: "circular" };
      context.self = context;
      const error = new Error("Test error");

      // Act & Assert
      expect(() => {
        ErrorHandlingUtils.formatErrorForLogging(error, context);
      }).not.toThrow();
    });

    it("should handle operations that modify global state", () => {
      // Arrange
      const operation = jest.fn().mockImplementation(() => {
        // Modify global state as side effect
        (global as any).testState = "modified";
        throw new Error("State modification error");
      });

      // Act
      const result = ErrorHandlingUtils.safeSync(
        operation,
        "state test",
        "fallback",
      );

      // Assert
      expect(result).toBe("fallback");
      expect((global as any).testState).toBe("modified"); // Side effect should still occur
    });
  });
});
