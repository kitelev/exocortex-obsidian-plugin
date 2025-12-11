import { describe, it, expect } from "@jest/globals";
import { ExitCodes } from "../../../src/utils/ExitCodes.js";

describe("ExitCodes", () => {
  describe("enum values", () => {
    it("should have SUCCESS as 0 (Unix convention)", () => {
      expect(ExitCodes.SUCCESS).toBe(0);
    });

    it("should have GENERAL_ERROR as 1", () => {
      expect(ExitCodes.GENERAL_ERROR).toBe(1);
    });

    it("should have INVALID_ARGUMENTS as 2", () => {
      expect(ExitCodes.INVALID_ARGUMENTS).toBe(2);
    });

    it("should have FILE_NOT_FOUND as 3", () => {
      expect(ExitCodes.FILE_NOT_FOUND).toBe(3);
    });

    it("should have PERMISSION_DENIED as 4", () => {
      expect(ExitCodes.PERMISSION_DENIED).toBe(4);
    });

    it("should have OPERATION_FAILED as 5", () => {
      expect(ExitCodes.OPERATION_FAILED).toBe(5);
    });

    it("should have INVALID_STATE_TRANSITION as 6", () => {
      expect(ExitCodes.INVALID_STATE_TRANSITION).toBe(6);
    });

    it("should have TRANSACTION_FAILED as 7", () => {
      expect(ExitCodes.TRANSACTION_FAILED).toBe(7);
    });

    it("should have CONCURRENT_MODIFICATION as 8", () => {
      expect(ExitCodes.CONCURRENT_MODIFICATION).toBe(8);
    });
  });

  describe("exhaustiveness", () => {
    it("should have all expected exit codes defined", () => {
      const expectedCodes = [
        "SUCCESS",
        "GENERAL_ERROR",
        "INVALID_ARGUMENTS",
        "FILE_NOT_FOUND",
        "PERMISSION_DENIED",
        "OPERATION_FAILED",
        "INVALID_STATE_TRANSITION",
        "TRANSACTION_FAILED",
        "CONCURRENT_MODIFICATION",
      ];

      for (const code of expectedCodes) {
        expect(ExitCodes[code as keyof typeof ExitCodes]).toBeDefined();
      }
    });

    it("should have unique values for all exit codes", () => {
      const values = Object.values(ExitCodes).filter((v) => typeof v === "number");
      const uniqueValues = new Set(values);

      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe("Unix conventions", () => {
    it("should have non-negative exit codes", () => {
      const numericValues = Object.values(ExitCodes).filter((v) => typeof v === "number") as number[];

      for (const value of numericValues) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    it("should have exit codes within valid Unix range (0-255)", () => {
      const numericValues = Object.values(ExitCodes).filter((v) => typeof v === "number") as number[];

      for (const value of numericValues) {
        expect(value).toBeLessThanOrEqual(255);
      }
    });
  });
});
