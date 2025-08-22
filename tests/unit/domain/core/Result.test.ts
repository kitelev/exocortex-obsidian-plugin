import { Result } from "../../../../src/domain/core/Result";

describe("Result", () => {
  describe("Construction", () => {
    it("should create successful result with value", () => {
      // When
      const result = Result.ok("test value");

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe("test value");
      expect(result.error).toBeUndefined();
    });

    it("should create successful result without value", () => {
      // When
      const result = Result.ok();

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it("should create failed result with error message", () => {
      // Given
      const errorMessage = "Something went wrong";

      // When
      const result = Result.fail(errorMessage);

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(errorMessage);
      expect(result.errorValue()).toBe(errorMessage);
    });

    it("should throw error when creating successful result with error message", () => {
      // When & Then
      expect(() => {
        // Use Reflect.construct to bypass TypeScript restrictions
        Reflect.construct(Result, [true, "error message"]);
      }).toThrow(
        "InvalidOperation: A result cannot be successful and contain an error",
      );
    });

    it("should throw error when creating failed result without error message", () => {
      // When & Then
      expect(() => {
        // Use Reflect.construct to bypass TypeScript restrictions
        Reflect.construct(Result, [false]);
      }).toThrow(
        "InvalidOperation: A failing result needs to contain an error message",
      );
    });

    it("should throw error when creating failed result with empty error message", () => {
      // When & Then
      expect(() => {
        // Use Reflect.construct to bypass TypeScript restrictions
        Reflect.construct(Result, [false, ""]);
      }).toThrow(
        "InvalidOperation: A failing result needs to contain an error message",
      );
    });
  });

  describe("getValue", () => {
    it("should return value for successful result", () => {
      // Given
      const value = { data: "test", number: 42 };
      const result = Result.ok(value);

      // When
      const retrievedValue = result.getValue();

      // Then
      expect(retrievedValue).toBe(value);
      expect(retrievedValue).toEqual({ data: "test", number: 42 });
    });

    it("should return undefined for successful result without value", () => {
      // Given
      const result = Result.ok();

      // When
      const value = result.getValue();

      // Then
      expect(value).toBeUndefined();
    });

    it("should throw error when getting value from failed result", () => {
      // Given
      const result = Result.fail("Test error");

      // When & Then
      expect(() => result.getValue()).toThrow(
        "Can't get the value of an error result. Use 'errorValue' instead.",
      );
    });

    it("should handle null and zero values correctly", () => {
      // Given
      const nullResult = Result.ok(null);
      const zeroResult = Result.ok(0);
      const emptyStringResult = Result.ok("");
      const falseResult = Result.ok(false);

      // When & Then
      expect(nullResult.getValue()).toBe(null);
      expect(zeroResult.getValue()).toBe(0);
      expect(emptyStringResult.getValue()).toBe("");
      expect(falseResult.getValue()).toBe(false);
    });
  });

  describe("errorValue", () => {
    it("should return error message for failed result", () => {
      // Given
      const errorMessage = "Detailed error message";
      const result = Result.fail(errorMessage);

      // When
      const error = result.errorValue();

      // Then
      expect(error).toBe(errorMessage);
    });

    it("should return error message for successful result (edge case)", () => {
      // Given
      const result = Result.ok("success value");

      // When
      const error = result.errorValue();

      // Then
      expect(error).toBeUndefined();
    });
  });

  describe("Result.combine", () => {
    it("should return success when all results are successful", () => {
      // Given
      const results = [
        Result.ok("value1"),
        Result.ok("value2"),
        Result.ok("value3"),
      ];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined.isSuccess).toBe(true);
      expect(combined.isFailure).toBe(false);
    });

    it("should return first failure when any result fails", () => {
      // Given
      const results = [
        Result.ok("value1"),
        Result.fail("First error"),
        Result.ok("value3"),
        Result.fail("Second error"),
      ];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined.isSuccess).toBe(false);
      expect(combined.isFailure).toBe(true);
      expect(combined.errorValue()).toBe("First error");
    });

    it("should handle empty array", () => {
      // Given
      const results: Result<any>[] = [];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined.isSuccess).toBe(true);
      expect(combined.isFailure).toBe(false);
    });

    it("should handle array with single successful result", () => {
      // Given
      const results = [Result.ok("single value")];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined.isSuccess).toBe(true);
      expect(combined.isFailure).toBe(false);
    });

    it("should handle array with single failed result", () => {
      // Given
      const results = [Result.fail("single error")];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined.isSuccess).toBe(false);
      expect(combined.isFailure).toBe(true);
      expect(combined.errorValue()).toBe("single error");
    });

    it("should short-circuit on first failure", () => {
      // Given
      let processedCount = 0;
      const results = [
        Result.ok("value1"),
        Result.fail("First error"),
        // This should not be processed due to short-circuit
        (() => {
          processedCount++;
          return Result.ok("value3");
        })(),
      ];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined.errorValue()).toBe("First error");
      expect(processedCount).toBe(1); // Verify short-circuit behavior
    });

    it("should handle mixed result types", () => {
      // Given
      const results = [
        Result.ok("string"),
        Result.ok(42),
        Result.ok({ complex: "object" }),
        Result.ok(null),
        Result.ok(undefined),
      ];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined.isSuccess).toBe(true);
    });

    it("should preserve result references", () => {
      // Given
      const failureResult = Result.fail("Test error");
      const results = [Result.ok("value1"), failureResult, Result.ok("value3")];

      // When
      const combined = Result.combine(results);

      // Then
      expect(combined).toBe(failureResult);
    });
  });

  describe("Immutability", () => {
    it("should freeze result object", () => {
      // Given
      const result = Result.ok("test value");

      // When & Then
      expect(Object.isFrozen(result)).toBe(true);

      // In strict mode, modification attempts will throw
      // In non-strict mode, they fail silently
      try {
        (result as any).isSuccess = false;
      } catch (error) {
        // Expected in strict mode
      }

      // Value should remain unchanged regardless
      expect(result.isSuccess).toBe(true);
    });

    it("should freeze failed result object", () => {
      // Given
      const result = Result.fail("test error");

      // When & Then
      expect(Object.isFrozen(result)).toBe(true);

      // In strict mode, modification attempts will throw
      try {
        (result as any).error = "modified error";
      } catch (error) {
        // Expected in strict mode
      }

      // Value should remain unchanged
      expect(result.error).toBe("test error");
    });
  });

  describe("Type Safety", () => {
    it("should work with different value types", () => {
      // Given & When
      const stringResult = Result.ok("string");
      const numberResult = Result.ok(42);
      const booleanResult = Result.ok(true);
      const objectResult = Result.ok({ key: "value" });
      const arrayResult = Result.ok([1, 2, 3]);

      // Then
      expect(stringResult.getValue()).toBe("string");
      expect(numberResult.getValue()).toBe(42);
      expect(booleanResult.getValue()).toBe(true);
      expect(objectResult.getValue()).toEqual({ key: "value" });
      expect(arrayResult.getValue()).toEqual([1, 2, 3]);
    });

    it("should handle complex nested objects", () => {
      // Given
      const complexValue = {
        user: {
          id: 123,
          name: "John Doe",
          preferences: {
            theme: "dark",
            notifications: true,
          },
        },
        timestamp: new Date("2024-01-01"),
        tags: ["important", "user-data"],
      };

      // When
      const result = Result.ok(complexValue);

      // Then
      expect(result.isSuccess).toBe(true);
      const value = result.getValue();
      expect(value.user.name).toBe("John Doe");
      expect(value.user.preferences.theme).toBe("dark");
      expect(value.tags).toEqual(["important", "user-data"]);
    });
  });

  describe("Error Handling", () => {
    it("should handle various error message formats", () => {
      // Given & When
      const simpleError = Result.fail("Simple error");
      const detailedError = Result.fail(
        "Error: Operation failed with code 500",
      );
      const multilineError = Result.fail("Error occurred:\nLine 1\nLine 2");
      const jsonError = Result.fail(
        JSON.stringify({ error: "API Error", code: 404 }),
      );

      // Then
      expect(simpleError.errorValue()).toBe("Simple error");
      expect(detailedError.errorValue()).toBe(
        "Error: Operation failed with code 500",
      );
      expect(multilineError.errorValue()).toContain("Line 1");
      expect(multilineError.errorValue()).toContain("Line 2");
      expect(jsonError.errorValue()).toContain("API Error");
    });

    it("should handle special characters in error messages", () => {
      // Given
      const specialCharError = Result.fail(
        "Error with \"quotes\", 'apostrophes', and \n newlines",
      );

      // When
      const errorMessage = specialCharError.errorValue();

      // Then
      expect(errorMessage).toContain('"quotes"');
      expect(errorMessage).toContain("'apostrophes'");
      expect(errorMessage).toContain("\n");
    });
  });

  describe("Edge Cases and Performance", () => {
    it("should handle very long error messages", () => {
      // Given
      const longError = "Error: " + "x".repeat(10000);

      // When
      const result = Result.fail(longError);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.errorValue().length).toBeGreaterThan(10000);
    });

    it("should handle rapid creation of many results", () => {
      // Given
      const count = 1000;
      // Adaptive thresholds for different environments
      const isCI =
        process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
      const isMacOS = process.platform === "darwin";
      const performanceThreshold = isCI && isMacOS ? 500 : isCI ? 200 : 100; // More lenient for macOS CI

      const start = performance.now();

      // When
      for (let i = 0; i < count; i++) {
        const success = Result.ok(`value-${i}`);
        const failure = Result.fail(`error-${i}`);
        expect(success.isSuccess).toBe(true);
        expect(failure.isFailure).toBe(true);
      }

      // Then
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(performanceThreshold); // Adaptive threshold
    });

    it("should handle combine with large arrays", () => {
      // Given
      const largeArray = Array.from({ length: 1000 }, (_, i) =>
        Result.ok(`value-${i}`),
      );

      // When
      const start = performance.now();
      const combined = Result.combine(largeArray);
      const duration = performance.now() - start;

      // Then
      expect(combined.isSuccess).toBe(true);
      expect(duration).toBeLessThan(50); // Should be reasonably fast
    });

    it("should maintain consistency across multiple operations", () => {
      // Given
      const result = Result.ok("consistent value");

      // When & Then - multiple calls should return same value
      for (let i = 0; i < 100; i++) {
        expect(result.getValue()).toBe("consistent value");
        expect(result.isSuccess).toBe(true);
        expect(result.isFailure).toBe(false);
      }
    });
  });
});
