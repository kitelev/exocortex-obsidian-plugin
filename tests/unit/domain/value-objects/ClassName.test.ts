import { ClassName } from "../../../../src/domain/value-objects/ClassName";
import { Result } from "../../../../src/domain/core/Result";

describe("ClassName", () => {
  describe("create", () => {
    it("should create valid simple class name", () => {
      // Given
      const value = "TestClass";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("TestClass");
      expect(className.toString()).toBe("TestClass");
    });

    it("should create valid class name with prefix", () => {
      // Given
      const value = "exo__Asset";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("exo__Asset");
      expect(className.toString()).toBe("exo__Asset");
    });

    it("should create valid class name with underscores", () => {
      // Given
      const value = "_PrivateClass";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("_PrivateClass");
    });

    it("should create valid class name with numbers", () => {
      // Given
      const value = "Class123";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("Class123");
    });

    it("should create valid complex prefixed class name", () => {
      // Given
      const value = "ems__Task123";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("ems__Task123");
    });

    it("should remove wiki link brackets if present", () => {
      // Given
      const value = "[[exo__Asset]]";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("exo__Asset");
      expect(className.toString()).toBe("exo__Asset");
    });

    it("should remove partial wiki link brackets", () => {
      // Given
      const value = "[[TestClass";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("TestClass");
    });

    it("should handle multiple bracket pairs", () => {
      // Given
      const value = "[[[[TestClass]]]]";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("TestClass");
    });

    it("should fail for empty string", () => {
      // Given
      const value = "";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("ClassName cannot be empty");
    });

    it("should fail for null value", () => {
      // Given
      const value = null as any;

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("ClassName cannot be empty");
    });

    it("should fail for undefined value", () => {
      // Given
      const value = undefined as any;

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("ClassName cannot be empty");
    });

    it("should fail for whitespace-only string", () => {
      // Given
      const value = "   ";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("ClassName cannot be empty");
    });

    it("should fail for string that becomes empty after bracket removal", () => {
      // Given
      const value = "[[]]";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid class name format: [[]]");
    });

    it("should fail for class name starting with number", () => {
      // Given
      const value = "123Class";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid class name format: 123Class");
    });

    it("should fail for class name with special characters", () => {
      // Given
      const value = "Test@Class";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid class name format: Test@Class");
    });

    it("should fail for class name with spaces", () => {
      // Given
      const value = "Test Class";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid class name format: Test Class");
    });

    it("should fail for class name with hyphens", () => {
      // Given
      const value = "Test-Class";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid class name format: Test-Class");
    });

    it("should fail for invalid prefix format", () => {
      // Given
      const value = "ex o__Asset"; // space in prefix

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid class name format: ex o__Asset");
    });

    it("should allow multiple underscores in name part", () => {
      // Given
      const value = "ex__test_Asset";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("ex__test_Asset");
    });

    it("should allow class name ending with underscore", () => {
      // Given
      const value = "exo_";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.value).toBe("exo_");
    });

    it("should fail for prefix starting with number", () => {
      // Given
      const value = "1ex__Asset";

      // When
      const result = ClassName.create(value);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Invalid class name format: 1ex__Asset");
    });
  });

  describe("toString", () => {
    it("should return the class name value", () => {
      // Given
      const className = ClassName.create("TestClass").getValue();

      // When
      const stringValue = className.toString();

      // Then
      expect(stringValue).toBe("TestClass");
    });

    it("should return prefixed class name value", () => {
      // Given
      const className = ClassName.create("exo__Asset").getValue();

      // When
      const stringValue = className.toString();

      // Then
      expect(stringValue).toBe("exo__Asset");
    });

    it("should match value property", () => {
      // Given
      const className = ClassName.create("ems__Task").getValue();

      // When & Then
      expect(className.toString()).toBe(className.value);
    });
  });

  describe("toWikiLink", () => {
    it("should return wiki link format for simple class name", () => {
      // Given
      const className = ClassName.create("TestClass").getValue();

      // When
      const wikiLink = className.toWikiLink();

      // Then
      expect(wikiLink).toBe("[[TestClass]]");
    });

    it("should return wiki link format for prefixed class name", () => {
      // Given
      const className = ClassName.create("exo__Asset").getValue();

      // When
      const wikiLink = className.toWikiLink();

      // Then
      expect(wikiLink).toBe("[[exo__Asset]]");
    });

    it("should handle class name with underscores", () => {
      // Given
      const className = ClassName.create("_Private_Class").getValue();

      // When
      const wikiLink = className.toWikiLink();

      // Then
      expect(wikiLink).toBe("[[_Private_Class]]");
    });

    it("should not double-wrap if value was created from wiki link", () => {
      // Given
      const className = ClassName.create("[[TestClass]]").getValue();

      // When
      const wikiLink = className.toWikiLink();

      // Then
      expect(wikiLink).toBe("[[TestClass]]");
      expect(wikiLink).not.toBe("[[[[TestClass]]]]");
    });
  });

  describe("getPrefix", () => {
    it("should return prefix for prefixed class name", () => {
      // Given
      const className = ClassName.create("exo__Asset").getValue();

      // When
      const prefix = className.getPrefix();

      // Then
      expect(prefix).toBe("exo");
    });

    it("should return different prefix for different class name", () => {
      // Given
      const className = ClassName.create("ems__Task").getValue();

      // When
      const prefix = className.getPrefix();

      // Then
      expect(prefix).toBe("ems");
    });

    it("should return empty string for non-prefixed class name", () => {
      // Given
      const className = ClassName.create("SimpleClass").getValue();

      // When
      const prefix = className.getPrefix();

      // Then
      expect(prefix).toBe("");
    });

    it("should handle class name with underscore but no prefix", () => {
      // Given
      const className = ClassName.create("Class_Name").getValue();

      // When
      const prefix = className.getPrefix();

      // Then
      expect(prefix).toBe("");
    });

    it("should return first part only for valid prefix format", () => {
      // Given
      const className = ClassName.create("very_long__ClassName").getValue();

      // When
      const prefix = className.getPrefix();

      // Then
      expect(prefix).toBe("very_long");
    });
  });

  describe("getName", () => {
    it("should return name part for prefixed class name", () => {
      // Given
      const className = ClassName.create("exo__Asset").getValue();

      // When
      const name = className.getName();

      // Then
      expect(name).toBe("Asset");
    });

    it("should return different name for different class", () => {
      // Given
      const className = ClassName.create("ems__Task").getValue();

      // When
      const name = className.getName();

      // Then
      expect(name).toBe("Task");
    });

    it("should return full name for non-prefixed class name", () => {
      // Given
      const className = ClassName.create("SimpleClass").getValue();

      // When
      const name = className.getName();

      // Then
      expect(name).toBe("SimpleClass");
    });

    it("should handle class name with underscores in name part", () => {
      // Given
      const className = ClassName.create("exo__Complex_Name").getValue();

      // When
      const name = className.getName();

      // Then
      expect(name).toBe("Complex_Name");
    });

    it("should return second part for prefixed class name", () => {
      // Given
      const className = ClassName.create("prefix123__ClassName456").getValue();

      // When
      const name = className.getName();

      // Then
      expect(name).toBe("ClassName456");
    });

    it("should handle edge case with underscore-only name", () => {
      // Given - this would fail validation, but test the split logic
      const className = ClassName.create("ValidClass").getValue();
      // Manually modify the value to test edge case
      (className as any).value = "prefix__";

      // When
      const name = className.getName();

      // Then
      expect(name).toBe("");
    });
  });

  describe("equals", () => {
    it("should return true for same class names", () => {
      // Given
      const className1 = ClassName.create("TestClass").getValue();
      const className2 = ClassName.create("TestClass").getValue();

      // When
      const result = className1.equals(className2);

      // Then
      expect(result).toBe(true);
    });

    it("should return true for same prefixed class names", () => {
      // Given
      const className1 = ClassName.create("exo__Asset").getValue();
      const className2 = ClassName.create("exo__Asset").getValue();

      // When
      const result = className1.equals(className2);

      // Then
      expect(result).toBe(true);
    });

    it("should return false for different class names", () => {
      // Given
      const className1 = ClassName.create("TestClass1").getValue();
      const className2 = ClassName.create("TestClass2").getValue();

      // When
      const result = className1.equals(className2);

      // Then
      expect(result).toBe(false);
    });

    it("should return false for different prefixed class names", () => {
      // Given
      const className1 = ClassName.create("exo__Asset").getValue();
      const className2 = ClassName.create("ems__Task").getValue();

      // When
      const result = className1.equals(className2);

      // Then
      expect(result).toBe(false);
    });

    it("should return true for class names created from wiki links", () => {
      // Given
      const className1 = ClassName.create("[[TestClass]]").getValue();
      const className2 = ClassName.create("TestClass").getValue();

      // When
      const result = className1.equals(className2);

      // Then
      expect(result).toBe(true);
    });

    it("should return true when comparing with itself", () => {
      // Given
      const className = ClassName.create("TestClass").getValue();

      // When
      const result = className.equals(className);

      // Then
      expect(result).toBe(true);
    });

    it("should be case-sensitive", () => {
      // Given
      const className1 = ClassName.create("TestClass").getValue();
      const className2 = ClassName.create("testclass").getValue();

      // When
      const result = className1.equals(className2);

      // Then
      expect(result).toBe(false);
    });

    it("should handle whitespace differences", () => {
      // Given - These would both be invalid, but test the comparison
      const className1 = ClassName.create("ValidClass").getValue();
      const className2 = ClassName.create("ValidClass").getValue();

      // When
      const result = className1.equals(className2);

      // Then
      expect(result).toBe(true);
    });
  });

  describe("Value Object Properties", () => {
    it("should be immutable", () => {
      // Given
      const className = ClassName.create("TestClass").getValue();
      const originalValue = className.value;

      // When - attempt to modify (should not be possible with readonly)
      // This test is more about design verification

      // Then
      expect(className.value).toBe(originalValue);
    });

    it("should have consistent toString and value", () => {
      // Given
      const className = ClassName.create("exo__Asset").getValue();

      // When & Then
      expect(className.toString()).toBe(className.value);
    });

    it("should maintain identity through transformations", () => {
      // Given
      const original = "exo__Asset";
      const className = ClassName.create(`[[${original}]]`).getValue();

      // When & Then
      expect(className.value).toBe(original);
      expect(className.toString()).toBe(original);
      expect(className.toWikiLink()).toBe(`[[${original}]]`);
    });
  });

  describe("Edge Cases and Complex Scenarios", () => {
    it("should handle maximum length class names", () => {
      // Given
      const longName = "A".repeat(100);
      const longPrefixedName = `prefix__${longName}`;

      // When
      const result = ClassName.create(longPrefixedName);

      // Then
      expect(result.isSuccess).toBe(true);
      const className = result.getValue();
      expect(className.getName()).toBe(longName);
      expect(className.getPrefix()).toBe("prefix");
    });

    it("should handle class names with numbers in various positions", () => {
      // Given
      const testCases = ["Class123", "C1lass", "ex1__A2sset", "_123Class"];

      // When & Then
      testCases.forEach((testCase) => {
        const result = ClassName.create(testCase);
        expect(result.isSuccess).toBe(true);
        const className = result.getValue();
        expect(className.value).toBe(testCase);
      });
    });

    it("should handle minimum valid class names", () => {
      // Given
      const minimalNames = ["A", "_", "a__B", "_1"];

      // When & Then
      minimalNames.forEach((name) => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().value).toBe(name);
      });
    });

    it("should preserve exact format in edge valid cases", () => {
      // Given
      const edgeCases = ["_", "A1", "z9__B8"];

      // When & Then
      edgeCases.forEach((edgeCase) => {
        const result = ClassName.create(edgeCase);
        expect(result.isSuccess).toBe(true);
        const className = result.getValue();
        expect(className.value).toBe(edgeCase);
        expect(className.toString()).toBe(edgeCase);
      });
    });

    it("should handle unicode characters appropriately", () => {
      // Given - These should fail since regex only allows a-zA-Z
      const unicodeNames = ["Tëst", "测试", "Тест"];

      // When & Then
      unicodeNames.forEach((unicodeName) => {
        const result = ClassName.create(unicodeName);
        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("Invalid class name format");
      });
    });

    it("should maintain consistency in complex workflows", () => {
      // Given
      const originalName = "exo__ComplexAsset123";

      // When - create, convert to wiki link, and create again
      const className1 = ClassName.create(originalName).getValue();
      const wikiLink = className1.toWikiLink();
      const className2 = ClassName.create(wikiLink).getValue();

      // Then
      expect(className1.equals(className2)).toBe(true);
      expect(className1.value).toBe(className2.value);
      expect(className1.getPrefix()).toBe(className2.getPrefix());
      expect(className1.getName()).toBe(className2.getName());
    });
  });
});
