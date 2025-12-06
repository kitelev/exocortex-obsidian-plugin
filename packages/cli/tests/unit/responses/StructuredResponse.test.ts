import { describe, it, expect } from "@jest/globals";
import {
  ErrorCategory,
  ErrorCode,
  getErrorCategory,
  ResponseBuilder,
} from "../../../src/responses/index";
import { ExitCodes } from "../../../src/utils/ExitCodes";

describe("StructuredResponse", () => {
  describe("ErrorCategory", () => {
    it("should have all required categories", () => {
      expect(ErrorCategory.VALIDATION).toBe("validation");
      expect(ErrorCategory.PERMISSION).toBe("permission");
      expect(ErrorCategory.STATE).toBe("state");
      expect(ErrorCategory.INTERNAL).toBe("internal");
    });
  });

  describe("ErrorCode", () => {
    it("should have validation error codes", () => {
      expect(ErrorCode.VALIDATION_FILE_NOT_FOUND).toBe("VALIDATION_FILE_NOT_FOUND");
      expect(ErrorCode.VALIDATION_INVALID_PATH).toBe("VALIDATION_INVALID_PATH");
      expect(ErrorCode.VALIDATION_INVALID_ARGUMENTS).toBe("VALIDATION_INVALID_ARGUMENTS");
      expect(ErrorCode.VALIDATION_MISSING_REQUIRED).toBe("VALIDATION_MISSING_REQUIRED");
      expect(ErrorCode.VALIDATION_VAULT_NOT_FOUND).toBe("VALIDATION_VAULT_NOT_FOUND");
    });

    it("should have permission error codes", () => {
      expect(ErrorCode.PERMISSION_DENIED).toBe("PERMISSION_DENIED");
      expect(ErrorCode.PERMISSION_READ_ONLY).toBe("PERMISSION_READ_ONLY");
    });

    it("should have state error codes", () => {
      expect(ErrorCode.STATE_INVALID_TRANSITION).toBe("STATE_INVALID_TRANSITION");
      expect(ErrorCode.STATE_CONCURRENT_MODIFICATION).toBe("STATE_CONCURRENT_MODIFICATION");
      expect(ErrorCode.STATE_ASSET_NOT_TASK).toBe("STATE_ASSET_NOT_TASK");
    });

    it("should have internal error codes", () => {
      expect(ErrorCode.INTERNAL_TRANSACTION_FAILED).toBe("INTERNAL_TRANSACTION_FAILED");
      expect(ErrorCode.INTERNAL_OPERATION_FAILED).toBe("INTERNAL_OPERATION_FAILED");
      expect(ErrorCode.INTERNAL_UNKNOWN).toBe("INTERNAL_UNKNOWN");
    });
  });

  describe("getErrorCategory", () => {
    it("should return VALIDATION for validation error codes", () => {
      expect(getErrorCategory(ErrorCode.VALIDATION_FILE_NOT_FOUND)).toBe(ErrorCategory.VALIDATION);
      expect(getErrorCategory(ErrorCode.VALIDATION_INVALID_ARGUMENTS)).toBe(ErrorCategory.VALIDATION);
      expect(getErrorCategory(ErrorCode.VALIDATION_VAULT_NOT_FOUND)).toBe(ErrorCategory.VALIDATION);
    });

    it("should return PERMISSION for permission error codes", () => {
      expect(getErrorCategory(ErrorCode.PERMISSION_DENIED)).toBe(ErrorCategory.PERMISSION);
      expect(getErrorCategory(ErrorCode.PERMISSION_READ_ONLY)).toBe(ErrorCategory.PERMISSION);
    });

    it("should return STATE for state error codes", () => {
      expect(getErrorCategory(ErrorCode.STATE_INVALID_TRANSITION)).toBe(ErrorCategory.STATE);
      expect(getErrorCategory(ErrorCode.STATE_CONCURRENT_MODIFICATION)).toBe(ErrorCategory.STATE);
    });

    it("should return INTERNAL for internal error codes", () => {
      expect(getErrorCategory(ErrorCode.INTERNAL_TRANSACTION_FAILED)).toBe(ErrorCategory.INTERNAL);
      expect(getErrorCategory(ErrorCode.INTERNAL_UNKNOWN)).toBe(ErrorCategory.INTERNAL);
    });
  });

  describe("ResponseBuilder", () => {
    describe("success()", () => {
      it("should create a success response with data", () => {
        const data = { command: "start", filepath: "/path/to/file.md" };
        const response = ResponseBuilder.success(data);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.meta).toBeUndefined();
      });

      it("should create a success response with metadata", () => {
        const data = { count: 10 };
        const meta = { durationMs: 100, itemCount: 10 };
        const response = ResponseBuilder.success(data, meta);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.meta).toEqual(meta);
      });

      it("should handle complex data types", () => {
        const data = {
          query: "SELECT ?s WHERE { ?s ?p ?o }",
          count: 5,
          bindings: [{ s: "value1" }, { s: "value2" }],
        };
        const response = ResponseBuilder.success(data);

        expect(response.data).toEqual(data);
      });
    });

    describe("error()", () => {
      it("should create an error response with required fields", () => {
        const response = ResponseBuilder.error(
          ErrorCode.VALIDATION_FILE_NOT_FOUND,
          "File not found",
          ExitCodes.FILE_NOT_FOUND,
        );

        expect(response.success).toBe(false);
        expect(response.error.code).toBe(ErrorCode.VALIDATION_FILE_NOT_FOUND);
        expect(response.error.category).toBe(ErrorCategory.VALIDATION);
        expect(response.error.message).toBe("File not found");
        expect(response.error.exitCode).toBe(ExitCodes.FILE_NOT_FOUND);
      });

      it("should include recovery hint when provided", () => {
        const response = ResponseBuilder.error(
          ErrorCode.VALIDATION_FILE_NOT_FOUND,
          "File not found",
          ExitCodes.FILE_NOT_FOUND,
          {
            recovery: {
              message: "Check file path",
              suggestion: "ls -la",
            },
          },
        );

        expect(response.error.recovery).toBeDefined();
        expect(response.error.recovery?.message).toBe("Check file path");
        expect(response.error.recovery?.suggestion).toBe("ls -la");
      });

      it("should include context when provided", () => {
        const response = ResponseBuilder.error(
          ErrorCode.VALIDATION_FILE_NOT_FOUND,
          "File not found",
          ExitCodes.FILE_NOT_FOUND,
          {
            context: {
              filepath: "/path/to/file.md",
              vaultRoot: "/vault",
            },
          },
        );

        expect(response.error.context).toBeDefined();
        expect(response.error.context?.filepath).toBe("/path/to/file.md");
        expect(response.error.context?.vaultRoot).toBe("/vault");
      });

      it("should include stack trace when provided", () => {
        const response = ResponseBuilder.error(
          ErrorCode.INTERNAL_UNKNOWN,
          "Unknown error",
          ExitCodes.GENERAL_ERROR,
          {
            stack: "Error: Unknown error\n    at test.ts:1:1",
          },
        );

        expect(response.error.stack).toBeDefined();
        expect(response.error.stack).toContain("at test.ts:1:1");
      });

      it("should not include optional fields when not provided", () => {
        const response = ResponseBuilder.error(
          ErrorCode.INTERNAL_UNKNOWN,
          "Error",
          ExitCodes.GENERAL_ERROR,
        );

        expect(response.error.recovery).toBeUndefined();
        expect(response.error.context).toBeUndefined();
        expect(response.error.stack).toBeUndefined();
      });
    });
  });

  describe("JSON serialization", () => {
    it("should serialize success response correctly", () => {
      const response = ResponseBuilder.success({ result: "ok" });
      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.data.result).toBe("ok");
    });

    it("should serialize error response correctly", () => {
      const response = ResponseBuilder.error(
        ErrorCode.PERMISSION_DENIED,
        "Access denied",
        ExitCodes.PERMISSION_DENIED,
        {
          recovery: { message: "Check permissions" },
        },
      );
      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe("PERMISSION_DENIED");
      expect(parsed.error.category).toBe("permission");
      expect(parsed.error.recovery.message).toBe("Check permissions");
    });
  });
});
