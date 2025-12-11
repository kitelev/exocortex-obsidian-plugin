import { describe, it, expect } from "@jest/globals";
import { VaultNotFoundError } from "../../../../src/utils/errors/VaultNotFoundError.js";
import { ExitCodes } from "../../../../src/utils/ExitCodes.js";
import { ErrorCode } from "../../../../src/responses/index.js";

describe("VaultNotFoundError", () => {
  describe("constructor", () => {
    it("should create error with vault path message", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error.message).toBe("Vault not found: /path/to/vault");
    });

    it("should set correct exit code", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error.exitCode).toBe(ExitCodes.FILE_NOT_FOUND);
    });

    it("should set correct error code", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error.errorCode).toBe(ErrorCode.VALIDATION_VAULT_NOT_FOUND);
    });

    it("should include vaultPath in context", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error.context).toBeDefined();
      expect(error.context?.vaultPath).toBe("/path/to/vault");
    });

    it("should merge additional context", () => {
      const error = new VaultNotFoundError("/path/to/vault", { operation: "init" });

      expect(error.context?.vaultPath).toBe("/path/to/vault");
      expect(error.context?.operation).toBe("init");
    });

    it("should have helpful guidance", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error.guidance).toContain("vault directory");
      expect(error.guidance).toContain("Path spelling");
    });

    it("should have recovery hint", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error.recoveryHint).toBeDefined();
      expect(error.recoveryHint?.suggestion).toContain("--vault");
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      expect(error.name).toBe("VaultNotFoundError");
    });
  });

  describe("format()", () => {
    it("should format error for display", () => {
      const error = new VaultNotFoundError("/path/to/vault");

      const formatted = error.format();

      expect(formatted).toContain("❌ VaultNotFoundError");
      expect(formatted).toContain("Vault not found: /path/to/vault");
    });
  });
});
