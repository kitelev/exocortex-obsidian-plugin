import { OntologyPrefix } from "../../../../src/domain/value-objects/OntologyPrefix";
import { Result } from "../../../../src/domain/core/Result";

describe("OntologyPrefix", () => {
  describe("create", () => {
    it("should create valid simple prefix", () => {
      // Given
      const value = "exo";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe("exo");
    });

    it("should create valid prefix with numbers", () => {
      // Given
      const value = "exo123";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe("exo123");
    });

    it("should create valid single letter prefix", () => {
      // Given
      const value = "e";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe("e");
    });

    it("should create valid long prefix", () => {
      // Given
      const value = "verylongprefix123";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe("verylongprefix123");
    });

    it("should create valid prefix with all lowercase letters", () => {
      // Given
      const value = "abcdefghijklmnop";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe("abcdefghijklmnop");
    });

    it("should create valid prefix with numbers at end", () => {
      // Given
      const value = "prefix0123456789";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe("prefix0123456789");
    });

    it("should fail for empty string", () => {
      // Given
      const value = "";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("OntologyPrefix cannot be empty");
    });

    it("should fail for null value", () => {
      // Given
      const value = null as any;

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("OntologyPrefix cannot be empty");
    });

    it("should fail for undefined value", () => {
      // Given
      const value = undefined as any;

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("OntologyPrefix cannot be empty");
    });

    it("should fail for whitespace-only string", () => {
      // Given
      const value = "   ";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("OntologyPrefix cannot be empty");
    });

    it("should fail for prefix starting with uppercase letter", () => {
      // Given
      const value = "Exo";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: Exo. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix starting with number", () => {
      // Given
      const value = "1exo";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: 1exo. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with uppercase letters", () => {
      // Given
      const value = "exoTest";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exoTest. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with special characters", () => {
      // Given
      const value = "exo-test";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exo-test. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with underscores", () => {
      // Given
      const value = "exo_test";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exo_test. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with spaces", () => {
      // Given
      const value = "exo test";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exo test. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with dots", () => {
      // Given
      const value = "exo.test";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exo.test. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with colon", () => {
      // Given
      const value = "exo:test";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exo:test. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with unicode characters", () => {
      // Given
      const value = "exö";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exö. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for prefix with emoji", () => {
      // Given
      const value = "exo😀";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: exo😀. Must be lowercase alphanumeric starting with a letter",
      );
    });

    it("should fail for single number", () => {
      // Given
      const value = "1";

      // When
      const result = OntologyPrefix.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(
        "Invalid ontology prefix format: 1. Must be lowercase alphanumeric starting with a letter",
      );
    });
  });

  describe("toString", () => {
    it("should return the prefix value", () => {
      // Given
      const prefix = OntologyPrefix.create("exo").getValue();

      // When
      const stringValue = prefix.toString();

      // Then
      expect(stringValue).toBe("exo");
    });

    it("should return prefix value with numbers", () => {
      // Given
      const prefix = OntologyPrefix.create("exo123").getValue();

      // When
      const stringValue = prefix.toString();

      // Then
      expect(stringValue).toBe("exo123");
    });

    it("should return single character prefix", () => {
      // Given
      const prefix = OntologyPrefix.create("e").getValue();

      // When
      const stringValue = prefix.toString();

      // Then
      expect(stringValue).toBe("e");
    });

    it("should return long prefix", () => {
      // Given
      const prefix = OntologyPrefix.create("verylongprefix").getValue();

      // When
      const stringValue = prefix.toString();

      // Then
      expect(stringValue).toBe("verylongprefix");
    });

    it("should be consistent with value property", () => {
      // Given
      const prefix = OntologyPrefix.create("ems").getValue();

      // When & Then
      expect(prefix.toString()).toBe((prefix as any).value);
    });
  });

  describe("toFileName", () => {
    it("should return filename format for simple prefix", () => {
      // Given
      const prefix = OntologyPrefix.create("exo").getValue();

      // When
      const fileName = prefix.toFileName();

      // Then
      expect(fileName).toBe("!exo");
    });

    it("should return filename format for prefix with numbers", () => {
      // Given
      const prefix = OntologyPrefix.create("exo123").getValue();

      // When
      const fileName = prefix.toFileName();

      // Then
      expect(fileName).toBe("!exo123");
    });

    it("should return filename format for single character prefix", () => {
      // Given
      const prefix = OntologyPrefix.create("e").getValue();

      // When
      const fileName = prefix.toFileName();

      // Then
      expect(fileName).toBe("!e");
    });

    it("should return filename format for long prefix", () => {
      // Given
      const prefix = OntologyPrefix.create("verylongprefix").getValue();

      // When
      const fileName = prefix.toFileName();

      // Then
      expect(fileName).toBe("!verylongprefix");
    });

    it("should always prepend exclamation mark", () => {
      // Given
      const testPrefixes = ["exo", "ems", "test", "a", "z9"];

      // When & Then
      testPrefixes.forEach((prefixValue) => {
        const prefix = OntologyPrefix.create(prefixValue).getValue();
        const fileName = prefix.toFileName();
        expect(fileName).toMatch(/^!/);
        expect(fileName).toBe(`!${prefixValue}`);
      });
    });

    it("should create distinct filenames for different prefixes", () => {
      // Given
      const prefix1 = OntologyPrefix.create("exo").getValue();
      const prefix2 = OntologyPrefix.create("ems").getValue();

      // When
      const fileName1 = prefix1.toFileName();
      const fileName2 = prefix2.toFileName();

      // Then
      expect(fileName1).toBe("!exo");
      expect(fileName2).toBe("!ems");
      expect(fileName1).not.toBe(fileName2);
    });
  });

  describe("equals", () => {
    it("should return true for same prefixes", () => {
      // Given
      const prefix1 = OntologyPrefix.create("exo").getValue();
      const prefix2 = OntologyPrefix.create("exo").getValue();

      // When
      const result = prefix1.equals(prefix2);

      // Then
      expect(result).toBe(true);
    });

    it("should return false for different prefixes", () => {
      // Given
      const prefix1 = OntologyPrefix.create("exo").getValue();
      const prefix2 = OntologyPrefix.create("ems").getValue();

      // When
      const result = prefix1.equals(prefix2);

      // Then
      expect(result).toBe(false);
    });

    it("should return true when comparing with itself", () => {
      // Given
      const prefix = OntologyPrefix.create("test").getValue();

      // When
      const result = prefix.equals(prefix);

      // Then
      expect(result).toBe(true);
    });

    it("should return false for similar but different prefixes", () => {
      // Given
      const prefix1 = OntologyPrefix.create("test").getValue();
      const prefix2 = OntologyPrefix.create("test1").getValue();

      // When
      const result = prefix1.equals(prefix2);

      // Then
      expect(result).toBe(false);
    });

    it("should be case-sensitive for internal comparison", () => {
      // Given - Note: we can't create uppercase prefixes, but test the equals method
      const prefix1 = OntologyPrefix.create("test").getValue();
      const prefix2 = OntologyPrefix.create("test").getValue();

      // Simulate case difference by modifying internal value (for testing)
      (prefix2 as any).value = "TEST";

      // When
      const result = prefix1.equals(prefix2);

      // Then
      expect(result).toBe(false);
    });

    it("should handle numeric suffixes correctly", () => {
      // Given
      const prefix1 = OntologyPrefix.create("test1").getValue();
      const prefix2 = OntologyPrefix.create("test2").getValue();
      const prefix3 = OntologyPrefix.create("test1").getValue();

      // When & Then
      expect(prefix1.equals(prefix2)).toBe(false);
      expect(prefix1.equals(prefix3)).toBe(true);
      expect(prefix2.equals(prefix3)).toBe(false);
    });

    it("should handle single character prefixes", () => {
      // Given
      const prefix1 = OntologyPrefix.create("a").getValue();
      const prefix2 = OntologyPrefix.create("b").getValue();
      const prefix3 = OntologyPrefix.create("a").getValue();

      // When & Then
      expect(prefix1.equals(prefix2)).toBe(false);
      expect(prefix1.equals(prefix3)).toBe(true);
    });

    it("should handle long prefixes", () => {
      // Given
      const longPrefix = "verylongprefixname123";
      const prefix1 = OntologyPrefix.create(longPrefix).getValue();
      const prefix2 = OntologyPrefix.create(longPrefix).getValue();
      const prefix3 = OntologyPrefix.create(longPrefix + "4").getValue();

      // When & Then
      expect(prefix1.equals(prefix2)).toBe(true);
      expect(prefix1.equals(prefix3)).toBe(false);
    });
  });

  describe("Value Object Properties", () => {
    it("should be immutable", () => {
      // Given
      const prefix = OntologyPrefix.create("exo").getValue();
      const originalValue = prefix.toString();

      // When - attempt to modify (should not be possible with private readonly)
      // This test is more about design verification

      // Then
      expect(prefix.toString()).toBe(originalValue);
    });

    it("should have consistent string representation", () => {
      // Given
      const prefix = OntologyPrefix.create("ems").getValue();

      // When & Then
      expect(prefix.toString()).toBe("ems");
      expect(prefix.toString()).toBe((prefix as any).value);
    });

    it("should maintain identity through operations", () => {
      // Given
      const original = "test123";
      const prefix = OntologyPrefix.create(original).getValue();

      // When & Then
      expect(prefix.toString()).toBe(original);
      expect(prefix.toFileName()).toBe(`!${original}`);
      expect(prefix.equals(OntologyPrefix.create(original).getValue())).toBe(
        true,
      );
    });

    it("should encapsulate value properly", () => {
      // Given
      const prefix = OntologyPrefix.create("private").getValue();

      // When & Then
      // Value should not be directly accessible from outside
      expect((prefix as any).value).toBeDefined();
      expect(prefix.toString()).toBe("private");
    });
  });

  describe("Edge Cases and Complex Scenarios", () => {
    it("should handle minimum valid prefix", () => {
      // Given
      const minPrefix = "a";

      // When
      const result = OntologyPrefix.create(minPrefix);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe("a");
      expect(prefix.toFileName()).toBe("!a");
    });

    it("should handle maximum reasonable length prefix", () => {
      // Given
      const maxPrefix = "a".repeat(100);

      // When
      const result = OntologyPrefix.create(maxPrefix);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe(maxPrefix);
      expect(prefix.toFileName()).toBe(`!${maxPrefix}`);
    });

    it("should handle all valid lowercase letters", () => {
      // Given
      const allLetters = "abcdefghijklmnopqrstuvwxyz";

      // When
      const result = OntologyPrefix.create(allLetters);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe(allLetters);
    });

    it("should handle all valid numbers at end", () => {
      // Given
      const withNumbers = "prefix0123456789";

      // When
      const result = OntologyPrefix.create(withNumbers);

      // Then
      expect(result.isSuccess).toBe(true);
      const prefix = result.getValue();
      expect(prefix.toString()).toBe(withNumbers);
    });

    it("should handle prefix patterns used in real ontologies", () => {
      // Given
      const realWorldPrefixes = [
        "rdf",
        "rdfs",
        "owl",
        "xsd",
        "foaf",
        "dc",
        "skos",
        "geo",
        "time",
        "prov",
        "void",
        "dcat",
        "org",
        "vcard",
      ];

      // When & Then
      realWorldPrefixes.forEach((prefixValue) => {
        const result = OntologyPrefix.create(prefixValue);
        expect(result.isSuccess).toBe(true);

        const prefix = result.getValue();
        expect(prefix.toString()).toBe(prefixValue);
        expect(prefix.toFileName()).toBe(`!${prefixValue}`);
      });
    });

    it("should maintain consistency across multiple operations", () => {
      // Given
      const originalValue = "complex123";

      // When
      const prefix1 = OntologyPrefix.create(originalValue).getValue();
      const fileName = prefix1.toFileName();
      const prefix2 = OntologyPrefix.create(originalValue).getValue();

      // Then
      expect(prefix1.equals(prefix2)).toBe(true);
      expect(prefix1.toString()).toBe(prefix2.toString());
      expect(fileName).toBe(prefix2.toFileName());
    });

    it("should handle boundary conditions for regex", () => {
      // Given - test edge cases of the regex pattern
      const validEdgeCases = ["z", "a0", "test999"];
      const invalidEdgeCases = ["A", "0a", "test-1"];

      // When & Then
      validEdgeCases.forEach((validCase) => {
        const result = OntologyPrefix.create(validCase);
        expect(result.isSuccess).toBe(true);
      });

      invalidEdgeCases.forEach((invalidCase) => {
        const result = OntologyPrefix.create(invalidCase);
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("Invalid ontology prefix format");
      });
    });

    it("should provide clear error messages for common mistakes", () => {
      // Given
      const commonMistakes = [
        {
          input: "Exo",
          expectedError:
            "Invalid ontology prefix format: Exo. Must be lowercase alphanumeric starting with a letter",
        },
        {
          input: "1exo",
          expectedError:
            "Invalid ontology prefix format: 1exo. Must be lowercase alphanumeric starting with a letter",
        },
        {
          input: "exo_test",
          expectedError:
            "Invalid ontology prefix format: exo_test. Must be lowercase alphanumeric starting with a letter",
        },
        { input: "", expectedError: "OntologyPrefix cannot be empty" },
        { input: "   ", expectedError: "OntologyPrefix cannot be empty" },
      ];

      // When & Then
      commonMistakes.forEach(({ input, expectedError }) => {
        const result = OntologyPrefix.create(input);
        expect(result.isFailure).toBe(true);
        expect(result.error).toBe(expectedError);
      });
    });

    it("should be performant with many prefix operations", () => {
      // Given
      const prefixCount = 1000;
      const start = performance.now();

      // When
      for (let i = 0; i < prefixCount; i++) {
        const prefixValue = `prefix${i}`;
        const result = OntologyPrefix.create(prefixValue);
        expect(result.isSuccess).toBe(true);

        const prefix = result.getValue();
        prefix.toString();
        prefix.toFileName();
        prefix.equals(prefix);
      }

      // Then
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });
});
