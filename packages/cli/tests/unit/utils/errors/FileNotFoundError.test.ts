import { describe, it, expect } from "@jest/globals";
import { FileNotFoundError } from "../../../../src/utils/errors/FileNotFoundError.js";
import { ExitCodes } from "../../../../src/utils/ExitCodes.js";
import { ErrorCode } from "../../../../src/responses/index.js";

describe("FileNotFoundError", () => {
  describe("constructor", () => {
    it("should create error with filepath message", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error.message).toBe("File not found: /path/to/file.md");
    });

    it("should set correct exit code", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error.exitCode).toBe(ExitCodes.FILE_NOT_FOUND);
    });

    it("should set correct error code", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error.errorCode).toBe(ErrorCode.VALIDATION_FILE_NOT_FOUND);
    });

    it("should include filepath in context", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error.context).toBeDefined();
      expect(error.context?.filepath).toBe("/path/to/file.md");
    });

    it("should merge additional context", () => {
      const error = new FileNotFoundError("/path/to/file.md", { operation: "read" });

      expect(error.context?.filepath).toBe("/path/to/file.md");
      expect(error.context?.operation).toBe("read");
    });

    it("should have helpful guidance", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error.guidance).toContain("Verify the file path");
      expect(error.guidance).toContain(".md extension");
    });

    it("should have recovery hint with suggestion", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error.recoveryHint).toBeDefined();
      expect(error.recoveryHint?.suggestion).toContain("ls -la");
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      expect(error.name).toBe("FileNotFoundError");
    });
  });

  describe("format()", () => {
    it("should format error for display", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      const formatted = error.format();

      expect(formatted).toContain("❌ FileNotFoundError");
      expect(formatted).toContain("File not found: /path/to/file.md");
      expect(formatted).toContain("💡");
    });
  });

  describe("toStructuredResponse()", () => {
    it("should return structured response", () => {
      const error = new FileNotFoundError("/path/to/file.md");

      const response = error.toStructuredResponse();

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.VALIDATION_FILE_NOT_FOUND);
      expect(response.error.exitCode).toBe(ExitCodes.FILE_NOT_FOUND);
    });
  });
});
