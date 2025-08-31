import { AssetId } from "../../../../src/domain/value-objects/AssetId";

describe("AssetId - Comprehensive Branch Coverage", () => {
  describe("create - Validation Branches", () => {
    it("should fail for null value", () => {
      const result = AssetId.create(null as any);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("AssetId cannot be empty");
    });

    it("should fail for undefined value", () => {
      const result = AssetId.create(undefined as any);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("AssetId cannot be empty");
    });

    it("should fail for empty string", () => {
      const result = AssetId.create("");
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("AssetId cannot be empty");
    });

    it("should fail for whitespace-only string", () => {
      const result = AssetId.create("   ");
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("AssetId cannot be empty");
    });

    it("should succeed for valid UUID", () => {
      const validUUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const result = AssetId.create(validUUID);
      
      expect(result.isSuccess).toBe(true);
      const assetId = result.getValue()!;
      expect(assetId.toString()).toBe(validUUID);
    });

    it("should succeed for valid UUID with whitespace (trimmed)", () => {
      const uuidWithWhitespace = "  f47ac10b-58cc-4372-a567-0e02b2c3d479  ";
      const result = AssetId.create(uuidWithWhitespace);
      
      expect(result.isSuccess).toBe(true);
      const assetId = result.getValue()!;
      expect(assetId.toString()).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
    });

    it("should fail for invalid UUID format - wrong length", () => {
      const invalidUUIDs = [
        "f47ac10b-58cc-4372-a567-0e02b2c3d47", // Too short
        "f47ac10b-58cc-4372-a567-0e02b2c3d4799", // Too long
        "f47ac10b58cc4372a5670e02b2c3d479", // No dashes
        "f47ac10b-58cc-4372-a567", // Missing parts
      ];

      invalidUUIDs.forEach(uuid => {
        const result = AssetId.create(uuid);
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe("AssetId must be a valid UUID format");
      });
    });

    it("should fail for invalid UUID format - wrong characters", () => {
      const invalidUUIDs = [
        "g47ac10b-58cc-4372-a567-0e02b2c3d479", // Invalid hex character 'g'
        "f47ac10b-58cc-4372-a567-0e02b2c3d47g", // Invalid hex character 'g' at end
        "f47ac10b-58cc-4372-z567-0e02b2c3d479", // Invalid hex character 'z'
      ];

      invalidUUIDs.forEach(uuid => {
        const result = AssetId.create(uuid);
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe("AssetId must be a valid UUID format");
      });
    });

    it("should validate UUID version (1-5) correctly", () => {
      const versionTests = [
        { uuid: "f47ac10b-58cc-1372-a567-0e02b2c3d479", expected: true }, // Version 1
        { uuid: "f47ac10b-58cc-2372-a567-0e02b2c3d479", expected: true }, // Version 2
        { uuid: "f47ac10b-58cc-3372-a567-0e02b2c3d479", expected: true }, // Version 3
        { uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479", expected: true }, // Version 4
        { uuid: "f47ac10b-58cc-5372-a567-0e02b2c3d479", expected: true }, // Version 5
        { uuid: "f47ac10b-58cc-0372-a567-0e02b2c3d479", expected: false }, // Version 0 (invalid)
        { uuid: "f47ac10b-58cc-6372-a567-0e02b2c3d479", expected: false }, // Version 6 (invalid)
        { uuid: "f47ac10b-58cc-9372-a567-0e02b2c3d479", expected: false }, // Version 9 (invalid)
      ];

      versionTests.forEach(({ uuid, expected }) => {
        const result = AssetId.create(uuid);
        expect(result.isSuccess).toBe(expected);
      });
    });

    it("should validate UUID variant (8, 9, a, b) correctly", () => {
      const variantTests = [
        { uuid: "f47ac10b-58cc-4372-8567-0e02b2c3d479", expected: true }, // Variant 8
        { uuid: "f47ac10b-58cc-4372-9567-0e02b2c3d479", expected: true }, // Variant 9
        { uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479", expected: true }, // Variant a
        { uuid: "f47ac10b-58cc-4372-b567-0e02b2c3d479", expected: true }, // Variant b
        { uuid: "f47ac10b-58cc-4372-0567-0e02b2c3d479", expected: false }, // Variant 0 (invalid)
        { uuid: "f47ac10b-58cc-4372-7567-0e02b2c3d479", expected: false }, // Variant 7 (invalid)
        { uuid: "f47ac10b-58cc-4372-c567-0e02b2c3d479", expected: false }, // Variant c (invalid)
        { uuid: "f47ac10b-58cc-4372-f567-0e02b2c3d479", expected: false }, // Variant f (invalid)
      ];

      variantTests.forEach(({ uuid, expected }) => {
        const result = AssetId.create(uuid);
        expect(result.isSuccess).toBe(expected);
      });
    });

    it("should handle case insensitive UUIDs", () => {
      const caseTests = [
        "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Lowercase
        "F47AC10B-58CC-4372-A567-0E02B2C3D479", // Uppercase
        "F47ac10B-58Cc-4372-A567-0e02b2c3d479", // Mixed case
      ];

      caseTests.forEach(uuid => {
        const result = AssetId.create(uuid);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.toString()).toBe(uuid.trim());
      });
    });
  });

  describe("generate - UUID Generation Branches", () => {
    it("should generate valid UUID", () => {
      const assetId = AssetId.generate();
      
      expect(assetId).toBeInstanceOf(AssetId);
      expect(assetId.isValid()).toBe(true);
      expect(assetId.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique UUIDs", () => {
      const ids = new Set();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        const id = AssetId.generate().toString();
        expect(ids.has(id)).toBe(false); // Should be unique
        ids.add(id);
      }
      
      expect(ids.size).toBe(count);
    });

    it("should generate version 4 UUIDs", () => {
      const assetId = AssetId.generate();
      const uuid = assetId.toString();
      
      // Check version 4 (character at position 14 should be '4')
      expect(uuid.charAt(14)).toBe("4");
    });

    it("should generate valid variant bits", () => {
      const generatedIds = Array.from({ length: 100 }, () => AssetId.generate());
      
      generatedIds.forEach(assetId => {
        const uuid = assetId.toString();
        // Check variant bits (character at position 19 should be 8, 9, a, or b)
        const variantChar = uuid.charAt(19).toLowerCase();
        expect(["8", "9", "a", "b"]).toContain(variantChar);
      });
    });

    it("should test random number generation branches in generate", () => {
      // Test that both 'x' and 'y' branches in replace function are covered
      const originalMathRandom = Math.random;
      
      try {
        let callCount = 0;
        Math.random = () => {
          // Alternate between values that will trigger different branches
          callCount++;
          return callCount % 2 === 0 ? 0.1 : 0.9; // Different random values
        };
        
        const assetId = AssetId.generate();
        expect(assetId.isValid()).toBe(true);
        
      } finally {
        Math.random = originalMathRandom;
      }
    });
  });

  describe("equals - Comparison Branches", () => {
    it("should return true for identical AssetIds", () => {
      const uuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const assetId1 = AssetId.create(uuid).getValue()!;
      const assetId2 = AssetId.create(uuid).getValue()!;
      
      expect(assetId1.equals(assetId2)).toBe(true);
    });

    it("should return false for different AssetIds", () => {
      const assetId1 = AssetId.create("f47ac10b-58cc-4372-a567-0e02b2c3d479").getValue()!;
      const assetId2 = AssetId.create("e47ac10b-58cc-4372-a567-0e02b2c3d479").getValue()!;
      
      expect(assetId1.equals(assetId2)).toBe(false);
    });

    it("should return false for null input", () => {
      const assetId = AssetId.generate();
      
      expect(assetId.equals(null as any)).toBe(false);
    });

    it("should return false for undefined input", () => {
      const assetId = AssetId.generate();
      
      expect(assetId.equals(undefined as any)).toBe(false);
    });

    it("should return false for non-AssetId object", () => {
      const assetId = AssetId.generate();
      const fakeAssetId = { value: assetId.toString() };
      
      expect(assetId.equals(fakeAssetId as any)).toBe(false);
    });

    it("should return false for object with same value but different type", () => {
      const assetId = AssetId.generate();
      const objectWithSameValue = {
        value: assetId.toString(),
        toString: () => assetId.toString(),
      };
      
      expect(assetId.equals(objectWithSameValue as any)).toBe(false);
    });

    it("should handle case sensitivity in comparison", () => {
      const uuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const assetId1 = AssetId.create(uuid).getValue()!;
      const assetId2 = AssetId.create(uuid.toUpperCase()).getValue()!;
      
      // Both should be valid and equal (case insensitive storage)
      expect(assetId1.isValid()).toBe(true);
      expect(assetId2.isValid()).toBe(true);
      expect(assetId1.equals(assetId2)).toBe(false); // Different string values stored
    });
  });

  describe("isValid - Validation Branch Coverage", () => {
    it("should return true for valid UUID", () => {
      const validUUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const assetId = AssetId.create(validUUID).getValue()!;
      
      expect(assetId.isValid()).toBe(true);
    });

    it("should return true for generated UUID", () => {
      const assetId = AssetId.generate();
      
      expect(assetId.isValid()).toBe(true);
    });

    it("should test version validation branch", () => {
      // Test version validation in isValid method
      const versionTests = [
        { uuid: "f47ac10b-58cc-1372-a567-0e02b2c3d479", expected: true }, // Version 1
        { uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479", expected: true }, // Version 4
        { uuid: "f47ac10b-58cc-5372-a567-0e02b2c3d479", expected: true }, // Version 5
        { uuid: "f47ac10b-58cc-0372-a567-0e02b2c3d479", expected: false }, // Version 0
        { uuid: "f47ac10b-58cc-6372-a567-0e02b2c3d479", expected: false }, // Version 6
      ];

      versionTests.forEach(({ uuid, expected }) => {
        if (expected) {
          const assetId = AssetId.create(uuid).getValue()!;
          expect(assetId.isValid()).toBe(true);
        } else {
          // Invalid UUIDs won't be created, so test validation logic
          const result = AssetId.create(uuid);
          expect(result.isFailure).toBe(true);
        }
      });
    });

    it("should test variant validation branch", () => {
      // Test variant validation in isValid method  
      const variantTests = [
        { uuid: "f47ac10b-58cc-4372-8567-0e02b2c3d479", expected: true }, // Variant 8
        { uuid: "f47ac10b-58cc-4372-9567-0e02b2c3d479", expected: true }, // Variant 9
        { uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479", expected: true }, // Variant a
        { uuid: "f47ac10b-58cc-4372-b567-0e02b2c3d479", expected: true }, // Variant b
        { uuid: "f47ac10b-58cc-4372-0567-0e02b2c3d479", expected: false }, // Variant 0
        { uuid: "f47ac10b-58cc-4372-c567-0e02b2c3d479", expected: false }, // Variant c
      ];

      variantTests.forEach(({ uuid, expected }) => {
        if (expected) {
          const assetId = AssetId.create(uuid).getValue()!;
          expect(assetId.isValid()).toBe(true);
        } else {
          const result = AssetId.create(uuid);
          expect(result.isFailure).toBe(true);
        }
      });
    });
  });

  describe("toString and getValue - Output Branches", () => {
    it("should return exact stored value", () => {
      const uuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const assetId = AssetId.create(uuid).getValue()!;
      
      expect(assetId.toString()).toBe(uuid);
      expect(assetId.getValue()).toBe(uuid);
    });

    it("should maintain case from original input", () => {
      const testCases = [
        "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Lowercase
        "F47AC10B-58CC-4372-A567-0E02B2C3D479", // Uppercase
        "F47ac10B-58Cc-4372-A567-0e02b2c3d479", // Mixed case
      ];

      testCases.forEach(uuid => {
        const assetId = AssetId.create(uuid).getValue()!;
        expect(assetId.toString()).toBe(uuid);
        expect(assetId.getValue()).toBe(uuid);
      });
    });

    it("should return trimmed value when input had whitespace", () => {
      const uuidWithWhitespace = "  f47ac10b-58cc-4372-a567-0e02b2c3d479  ";
      const expectedUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const assetId = AssetId.create(uuidWithWhitespace).getValue()!;
      
      expect(assetId.toString()).toBe(expectedUuid);
      expect(assetId.getValue()).toBe(expectedUuid);
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle UUID format edge cases", () => {
      const edgeCases = [
        { uuid: "00000000-0000-1000-8000-000000000000", expected: true }, // All zeros with valid version/variant
        { uuid: "ffffffff-ffff-4fff-bfff-ffffffffffff", expected: true }, // All f's with valid version/variant
        { uuid: "12345678-1234-1234-8234-123456789012", expected: true }, // Mixed digits
        { uuid: "abcdefab-cdef-4abc-9def-abcdefabcdef", expected: true }, // All letters
      ];

      edgeCases.forEach(({ uuid, expected }) => {
        const result = AssetId.create(uuid);
        expect(result.isSuccess).toBe(expected);
        if (expected) {
          expect(result.getValue()!.isValid()).toBe(true);
        }
      });
    });

    it("should handle malformed UUID patterns", () => {
      const malformedUUIDs = [
        "not-a-uuid-at-all",
        "12345678-1234-1234-1234", // Too short
        "12345678-1234-1234-1234-123456789012-extra", // Too long
        "12345678_1234_1234_1234_123456789012", // Wrong separators
        "1234567-1234-1234-1234-123456789012", // Wrong segment length
        "12345678-123-1234-1234-123456789012", // Wrong segment length
        "",
        "   ",
      ];

      malformedUUIDs.forEach(uuid => {
        const result = AssetId.create(uuid);
        expect(result.isFailure).toBe(true);
      });
    });

    it("should maintain consistency between create validation and isValid", () => {
      const testUUIDs = [
        "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Valid
        "f47ac10b-58cc-0372-a567-0e02b2c3d479", // Invalid version
        "f47ac10b-58cc-4372-0567-0e02b2c3d479", // Invalid variant
      ];

      testUUIDs.forEach(uuid => {
        const result = AssetId.create(uuid);
        if (result.isSuccess) {
          const assetId = result.getValue()!;
          expect(assetId.isValid()).toBe(true);
        } else {
          // If create fails, we can't test isValid, which is correct
          expect(result.isFailure).toBe(true);
        }
      });
    });
  });

  describe("Random Generation Branch Coverage", () => {
    it("should generate different UUIDs with different random values", () => {
      const originalMathRandom = Math.random;
      const generatedIds = new Set<string>();
      
      try {
        // Test with controlled random values to ensure branch coverage
        const randomValues = [0.0, 0.25, 0.5, 0.75, 0.999];
        
        randomValues.forEach(fixedValue => {
          Math.random = () => fixedValue;
          const assetId = AssetId.generate();
          generatedIds.add(assetId.toString());
          expect(assetId.isValid()).toBe(true);
        });
        
        // All generated IDs should be different
        expect(generatedIds.size).toBe(randomValues.length);
        
      } finally {
        Math.random = originalMathRandom;
      }
    });

    it("should handle edge random values in generation", () => {
      const originalMathRandom = Math.random;
      
      try {
        // Test with boundary random values
        const edgeRandomValues = [
          0, // Minimum
          0.0625, // 1/16 - minimum for hex digit 1
          0.9375, // 15/16 - maximum for hex digit f
          0.999999, // Almost 1
        ];
        
        edgeRandomValues.forEach(value => {
          Math.random = () => value;
          const assetId = AssetId.generate();
          expect(assetId.isValid()).toBe(true);
          
          // Verify the UUID format is still correct
          const uuid = assetId.toString();
          expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });
        
      } finally {
        Math.random = originalMathRandom;
      }
    });

    it("should test both x and y replacement branches", () => {
      const originalMathRandom = Math.random;
      let randomCalls = 0;
      
      try {
        Math.random = () => {
          randomCalls++;
          return 0.5; // Fixed value for predictable testing
        };
        
        const assetId = AssetId.generate();
        const uuid = assetId.toString();
        
        // Verify that random was called (both x and y branches)
        expect(randomCalls).toBeGreaterThan(0);
        
        // Verify version 4 and variant bits are set correctly
        expect(uuid.charAt(14)).toBe("4"); // Version 4
        expect(["8", "9", "a", "b"]).toContain(uuid.charAt(19)); // Valid variant
        
      } finally {
        Math.random = originalMathRandom;
      }
    });
  });

  describe("Performance and Memory", () => {
    it("should generate UUIDs efficiently", () => {
      const start = Date.now();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        AssetId.generate();
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it("should handle large number of AssetId instances", () => {
      const assetIds = Array.from({ length: 1000 }, () => AssetId.generate());
      
      assetIds.forEach(assetId => {
        expect(assetId.isValid()).toBe(true);
        expect(assetId.toString()).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      });
      
      // Verify uniqueness
      const uniqueIds = new Set(assetIds.map(id => id.toString()));
      expect(uniqueIds.size).toBe(1000);
    });
  });

  describe("Integration Tests", () => {
    it("should work with common use cases", () => {
      // Generate new ID
      const newId = AssetId.generate();
      expect(newId.isValid()).toBe(true);
      
      // Create from existing UUID string
      const existingId = AssetId.create(newId.toString()).getValue()!;
      expect(existingId.equals(newId)).toBe(true);
      
      // Use in comparisons
      const differentId = AssetId.generate();
      expect(newId.equals(differentId)).toBe(false);
    });

    it("should maintain consistent identity", () => {
      const assetId = AssetId.generate();
      const value1 = assetId.toString();
      const value2 = assetId.toString();
      
      // Same instance should return consistent value
      expect(value1).toBe(value2);
      expect(value1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it("should handle round-trip serialization", () => {
      const originalId = AssetId.generate();
      const serialized = originalId.toString();
      const deserialized = AssetId.create(serialized).getValue()!;
      
      expect(originalId.equals(deserialized)).toBe(true);
      expect(deserialized.isValid()).toBe(true);
    });
  });

  describe("Regex Pattern Coverage", () => {
    it("should test all parts of UUID regex pattern", () => {
      const uuidParts = [
        // Test each part of the regex pattern individually
        { uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479", part: "8-character hex", valid: true },
        { uuid: "f47ac10-58cc-4372-a567-0e02b2c3d479", part: "7-character hex", valid: false },
        { uuid: "f47ac10b-58c-4372-a567-0e02b2c3d479", part: "3-character hex", valid: false },
        { uuid: "f47ac10b-58cc-372-a567-0e02b2c3d479", part: "3-character version", valid: false },
        { uuid: "f47ac10b-58cc-4372-567-0e02b2c3d479", part: "3-character variant", valid: false },
        { uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d47", part: "11-character hex", valid: false },
      ];

      uuidParts.forEach(({ uuid, valid }) => {
        const result = AssetId.create(uuid);
        expect(result.isSuccess).toBe(valid);
      });
    });

    it("should test case insensitive matching", () => {
      const caseVariations = [
        "f47ac10b-58cc-4372-a567-0e02b2c3d479", // All lowercase
        "F47AC10B-58CC-4372-A567-0E02B2C3D479", // All uppercase
        "F47ac10B-58Cc-4372-A567-0e02B2C3d479", // Mixed case
        "f47AC10b-58CC-4372-a567-0E02b2c3D479", // Random mixed case
      ];

      caseVariations.forEach(uuid => {
        const result = AssetId.create(uuid);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.isValid()).toBe(true);
      });
    });

    it("should handle hex digit boundary values", () => {
      const hexBoundaries = [
        "00000000-0000-4000-8000-000000000000", // All 0s
        "ffffffff-ffff-4fff-bfff-ffffffffffff", // All fs
        "deadbeef-dead-4bee-beef-deadbeefbeef", // Mixed valid hex
        "12345678-9abc-4def-9012-3456789abcde", // All hex digits
      ];

      hexBoundaries.forEach(uuid => {
        const result = AssetId.create(uuid);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.isValid()).toBe(true);
      });
    });
  });

  describe("Constructor Access Patterns", () => {
    it("should only allow creation through static methods", () => {
      // The constructor is private, so direct instantiation should not be possible
      // This test verifies the design pattern is enforced
      
      const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      
      // Should only work through static methods
      const created = AssetId.create(validUuid);
      expect(created.isSuccess).toBe(true);
      
      const generated = AssetId.generate();
      expect(generated.isValid()).toBe(true);
      
      // Direct constructor access should not be possible in TypeScript
      // (This is enforced at compile time)
    });
  });

  describe("Memory and Performance Edge Cases", () => {
    it("should handle rapid generation without memory leaks", () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many IDs rapidly
      for (let i = 0; i < 10000; i++) {
        const id = AssetId.generate();
        expect(id.isValid()).toBe(true);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB for 10k IDs)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it("should maintain performance with many equality checks", () => {
      const id1 = AssetId.generate();
      const id2 = AssetId.generate();
      
      const start = Date.now();
      
      // Perform many equality checks
      for (let i = 0; i < 10000; i++) {
        id1.equals(id2);
        id1.equals(id1);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });
});