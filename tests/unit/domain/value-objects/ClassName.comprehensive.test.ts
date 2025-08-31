import { ClassName } from "../../../../src/domain/value-objects/ClassName";

describe("ClassName - Comprehensive Branch Coverage", () => {
  describe("create - Validation Branches", () => {
    it("should fail for null value", () => {
      const result = ClassName.create(null as any);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("ClassName cannot be empty");
    });

    it("should fail for undefined value", () => {
      const result = ClassName.create(undefined as any);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("ClassName cannot be empty");
    });

    it("should fail for empty string", () => {
      const result = ClassName.create("");
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("ClassName cannot be empty");
    });

    it("should fail for whitespace-only string", () => {
      const result = ClassName.create("   ");
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("ClassName cannot be empty");
    });

    it("should succeed for valid simple class name", () => {
      const result = ClassName.create("Asset");
      
      expect(result.isSuccess).toBe(true);
      const className = result.getValue()!;
      expect(className.toString()).toBe("Asset");
    });

    it("should succeed for valid prefixed class name", () => {
      const result = ClassName.create("exo__Asset");
      
      expect(result.isSuccess).toBe(true);
      const className = result.getValue()!;
      expect(className.toString()).toBe("exo__Asset");
    });

    it("should remove wiki link brackets", () => {
      const result = ClassName.create("[[exo__Asset]]");
      
      expect(result.isSuccess).toBe(true);
      const className = result.getValue()!;
      expect(className.toString()).toBe("exo__Asset");
    });

    it("should remove wiki link brackets but not single brackets", () => {
      const testCases = [
        { input: "[[exo__Asset", expected: "exo__Asset" },
        { input: "exo__Asset]]", expected: "exo__Asset" },
        { input: "[[]]exo__Asset[[]]", expected: "exo__Asset" },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = ClassName.create(input);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.toString()).toBe(expected);
      });
    });

    it("should fail for invalid format with single brackets", () => {
      const result = ClassName.create("[exo__Asset]");
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Invalid class name format: [exo__Asset]");
    });

    it("should fail for invalid format - starting with number", () => {
      const result = ClassName.create("123Invalid");
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Invalid class name format: 123Invalid");
    });

    it("should fail for invalid format - starting with special character", () => {
      const result = ClassName.create("@Invalid");
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Invalid class name format: @Invalid");
    });

    it("should fail for invalid format - containing spaces", () => {
      const result = ClassName.create("Invalid Name");
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Invalid class name format: Invalid Name");
    });

    it("should fail for invalid format - containing special characters", () => {
      const invalidNames = [
        "Invalid-Name",
        "Invalid.Name",
        "Invalid+Name",
        "Invalid Name",
        "Invalid@Name",
        "Invalid#Name",
      ];

      invalidNames.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe(`Invalid class name format: ${name}`);
      });
    });

    it("should succeed for valid formats", () => {
      const validNames = [
        "SimpleClass",
        "_PrivateClass",
        "prefix__ClassName",
        "Exo__Asset_123",
        "UPPERCASE_CLASS",
        "mixedCase_123",
        "_underscore__class",
      ];

      validNames.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.toString()).toBe(name);
      });
    });

    it("should test invalid prefix format cases that actually fail", () => {
      const invalidPrefixed = [
        "123__ClassName", // Prefix starts with number
        "pre-fix__ClassName", // Prefix contains dash  
        "prefix__-Name", // Class part starts with invalid character
      ];

      invalidPrefixed.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe(`Invalid class name format: ${name}`);
      });
    });

    it("should accept some edge cases that are actually valid", () => {
      const actuallyValid = [
        "__ClassName", // Starting with __ is valid per regex
        "prefix__", // Ending with __ is valid per regex
      ];

      actuallyValid.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(true);
      });
    });
  });

  describe("getPrefix - Branch Coverage", () => {
    it("should return prefix for prefixed class name", () => {
      const className = ClassName.create("exo__Asset").getValue()!;
      
      expect(className.getPrefix()).toBe("exo");
    });

    it("should return empty string for non-prefixed class name", () => {
      const className = ClassName.create("Asset").getValue()!;
      
      expect(className.getPrefix()).toBe("");
    });

    it("should handle multiple underscores correctly", () => {
      // Split only takes first two parts
      const className = ClassName.create("exo__Asset__Special").getValue()!;
      
      expect(className.getPrefix()).toBe("exo");
      expect(className.getName()).toBe("Asset"); // Only takes parts[1]
    });

    it("should handle single underscore (not prefix separator)", () => {
      const className = ClassName.create("Asset_Type").getValue()!;
      
      expect(className.getPrefix()).toBe("");
      expect(className.getName()).toBe("Asset_Type");
    });

    it("should handle edge case with underscore at start", () => {
      const className = ClassName.create("_PrivateClass").getValue()!;
      
      expect(className.getPrefix()).toBe("");
      expect(className.getName()).toBe("_PrivateClass");
    });
  });

  describe("getName - Branch Coverage", () => {
    it("should return class name part for prefixed class", () => {
      const className = ClassName.create("exo__Asset").getValue()!;
      
      expect(className.getName()).toBe("Asset");
    });

    it("should return full name for non-prefixed class", () => {
      const className = ClassName.create("Asset").getValue()!;
      
      expect(className.getName()).toBe("Asset");
    });

    it("should handle complex prefixed names", () => {
      const testCases = [
        { input: "prefix__ClassName", expectedPrefix: "prefix", expectedName: "ClassName" },
        { input: "a__b", expectedPrefix: "a", expectedName: "b" },
        { input: "long_prefix__VeryLongClassName123", expectedPrefix: "long_prefix", expectedName: "VeryLongClassName123" },
      ];

      testCases.forEach(({ input, expectedPrefix, expectedName }) => {
        const className = ClassName.create(input).getValue()!;
        expect(className.getPrefix()).toBe(expectedPrefix);
        expect(className.getName()).toBe(expectedName);
      });
    });
  });

  describe("equals - Comparison Branch Coverage", () => {
    it("should return true for identical class names", () => {
      const className1 = ClassName.create("exo__Asset").getValue()!;
      const className2 = ClassName.create("exo__Asset").getValue()!;
      
      expect(className1.equals(className2)).toBe(true);
    });

    it("should return false for different class names", () => {
      const className1 = ClassName.create("exo__Asset").getValue()!;
      const className2 = ClassName.create("ems__Task").getValue()!;
      
      expect(className1.equals(className2)).toBe(false);
    });

    it("should return false for same content but different case", () => {
      const className1 = ClassName.create("exo__Asset").getValue()!;
      const className2 = ClassName.create("exo__asset").getValue()!;
      
      expect(className1.equals(className2)).toBe(false);
    });

    it("should handle edge cases in comparison", () => {
      const testCases = [
        { name1: "Asset", name2: "Asset", expected: true },
        { name1: "Asset", name2: "asset", expected: false },
        { name1: "_Class", name2: "_Class", expected: true },
        { name1: "a__b", name2: "a__b", expected: true },
        { name1: "a__b", name2: "a__c", expected: false },
      ];

      testCases.forEach(({ name1, name2, expected }) => {
        const className1 = ClassName.create(name1).getValue()!;
        const className2 = ClassName.create(name2).getValue()!;
        expect(className1.equals(className2)).toBe(expected);
      });
    });
  });

  describe("toWikiLink - Output Formatting", () => {
    it("should wrap simple class name in wiki link brackets", () => {
      const className = ClassName.create("Asset").getValue()!;
      
      expect(className.toWikiLink()).toBe("[[Asset]]");
    });

    it("should wrap prefixed class name in wiki link brackets", () => {
      const className = ClassName.create("exo__Asset").getValue()!;
      
      expect(className.toWikiLink()).toBe("[[exo__Asset]]");
    });

    it("should handle special characters in class name", () => {
      const className = ClassName.create("Special_Class_123").getValue()!;
      
      expect(className.toWikiLink()).toBe("[[Special_Class_123]]");
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    it("should handle minimal valid class names", () => {
      const minimalNames = ["a", "_", "A", "z"];
      
      minimalNames.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.toString()).toBe(name);
      });
    });

    it("should handle maximum complexity valid names", () => {
      const complexNames = [
        "VeryLongPrefixName__VeryLongClassNameWith123Numbers",
        "_private__class_with_underscores_123",
        "ALLCAPS__CLASSNAME",
      ];

      complexNames.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.toString()).toBe(name);
      });
    });

    it("should preserve original formatting after bracket removal", () => {
      const testCases = [
        { input: "[[exo__Asset]]", expected: "exo__Asset" },
        { input: "[[exo__Asset", expected: "exo__Asset" }, // Partial brackets
        { input: "exo__Asset]]", expected: "exo__Asset" }, // Partial brackets
        { input: "[[]]exo__Asset[[]]", expected: "exo__Asset" }, // Multiple brackets
      ];

      testCases.forEach(({ input, expected }) => {
        const result = ClassName.create(input);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()!.toString()).toBe(expected);
      });
    });

    it("should handle regex edge cases", () => {
      const edgeCases = [
        { name: "Class__", expected: true }, // Ends with __ - actually valid per regex
        { name: "__Class", expected: true }, // Starts with __ - actually valid per regex  
        { name: "Class____Name", expected: true }, // Multiple underscores - valid per regex
        { name: "pre_fix__ClassName", expected: true }, // Underscore in prefix is OK
        { name: "prefix__class_name", expected: true }, // Underscore in class name is OK
      ];

      edgeCases.forEach(({ name, expected }) => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(expected);
      });
    });

    it("should handle boundary conditions in string processing", () => {
      const boundaryCases = [
        "a__b", // Minimal prefixed
        "A__B", // Uppercase minimal
        "_a__b", // Prefix starting with underscore
        "a__b_", // Class ending with underscore
        "a1__b2", // Numbers in both parts
      ];

      boundaryCases.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(true);
        
        const className = result.getValue()!;
        const parts = name.split("__");
        if (parts.length > 1) {
          expect(className.getPrefix()).toBe(parts[0]);
          expect(className.getName()).toBe(parts[1]);
        } else {
          expect(className.getPrefix()).toBe("");
          expect(className.getName()).toBe(name);
        }
      });
    });
  });

  describe("Split Logic - getPrefix and getName Branches", () => {
    it("should handle no prefix scenario (no __)", () => {
      const simpleNames = ["Asset", "Task", "Person", "_Private", "Class123"];
      
      simpleNames.forEach(name => {
        const className = ClassName.create(name).getValue()!;
        expect(className.getPrefix()).toBe("");
        expect(className.getName()).toBe(name);
      });
    });

    it("should handle single prefix scenario (one __)", () => {
      const prefixedNames = [
        { name: "exo__Asset", prefix: "exo", className: "Asset" },
        { name: "ems__Task", prefix: "ems", className: "Task" },
        { name: "_private__Class", prefix: "_private", className: "Class" },
        { name: "a__b", prefix: "a", className: "b" },
      ];

      prefixedNames.forEach(({ name, prefix, className: expectedName }) => {
        const className = ClassName.create(name).getValue()!;
        expect(className.getPrefix()).toBe(prefix);
        expect(className.getName()).toBe(expectedName);
      });
    });

    it("should handle multiple __ in class name (not prefix separator)", () => {
      // Split only takes first two parts
      const className = ClassName.create("exo__Asset__Special__Type").getValue()!;
      
      expect(className.getPrefix()).toBe("exo");
      expect(className.getName()).toBe("Asset"); // Only takes parts[1]
    });

    it("should handle edge case with empty parts after split", () => {
      // These should be caught by validation, but test split logic
      const validName = "prefix__validClass";
      const className = ClassName.create(validName).getValue()!;
      
      const parts = validName.split("__");
      expect(parts.length).toBeGreaterThan(1);
      expect(className.getPrefix()).toBe(parts[0]);
      expect(className.getName()).toBe(parts[1]);
    });
  });

  describe("toString and toWikiLink - Output Branches", () => {
    it("should preserve exact value in toString", () => {
      const testValues = [
        "Asset",
        "exo__Asset", 
        "_Private",
        "Complex_Class_123",
        "prefix__Complex_Class_Name",
      ];

      testValues.forEach(value => {
        const className = ClassName.create(value).getValue()!;
        expect(className.toString()).toBe(value);
      });
    });

    it("should format toWikiLink correctly for all types", () => {
      const testCases = [
        { name: "Asset", expected: "[[Asset]]" },
        { name: "exo__Asset", expected: "[[exo__Asset]]" },
        { name: "_Private", expected: "[[_Private]]" },
        { name: "Complex_Name_123", expected: "[[Complex_Name_123]]" },
      ];

      testCases.forEach(({ name, expected }) => {
        const className = ClassName.create(name).getValue()!;
        expect(className.toWikiLink()).toBe(expected);
      });
    });
  });

  describe("equals - All Comparison Branches", () => {
    it("should compare identical values", () => {
      const className1 = ClassName.create("exo__Asset").getValue()!;
      const className2 = ClassName.create("exo__Asset").getValue()!;
      
      expect(className1.equals(className2)).toBe(true);
    });

    it("should compare different values", () => {
      const className1 = ClassName.create("exo__Asset").getValue()!;
      const className2 = ClassName.create("ems__Task").getValue()!;
      
      expect(className1.equals(className2)).toBe(false);
    });

    it("should be case sensitive in comparison", () => {
      const className1 = ClassName.create("exo__Asset").getValue()!;
      const className2 = ClassName.create("exo__asset").getValue()!;
      
      expect(className1.equals(className2)).toBe(false);
    });

    it("should handle edge cases in string comparison", () => {
      const edgeCases = [
        { name1: "a", name2: "a", expected: true },
        { name1: "a", name2: "b", expected: false },
        { name1: "_", name2: "_", expected: true },
        { name1: "prefix__class", name2: "prefix__class", expected: true },
        { name1: "prefix__class", name2: "prefix__Class", expected: false },
      ];

      edgeCases.forEach(({ name1, name2, expected }) => {
        const className1 = ClassName.create(name1).getValue()!;
        const className2 = ClassName.create(name2).getValue()!;
        expect(className1.equals(className2)).toBe(expected);
      });
    });
  });

  describe("Regex Validation - Complete Pattern Coverage", () => {
    it("should test all regex pattern branches", () => {
      const regexTests = [
        // Valid patterns - first character
        { name: "A", expected: true }, // Letter start
        { name: "_", expected: true }, // Underscore start
        
        // Invalid patterns - first character  
        { name: "1Class", expected: false }, // Number start
        { name: "-Class", expected: false }, // Dash start
        { name: ".Class", expected: false }, // Dot start
        
        // Valid patterns - body characters
        { name: "Class123", expected: true }, // Letters + numbers
        { name: "Class_Name", expected: true }, // With underscores
        { name: "CLASS", expected: true }, // All caps
        { name: "class", expected: true }, // All lowercase
        
        // Valid patterns - with prefix
        { name: "pre__Class", expected: true },
        { name: "_pre__Class", expected: true }, // Underscore prefix start
        { name: "pre123__Class456", expected: true }, // Numbers in both parts
        
        // Invalid patterns - prefix part
        { name: "123__Class", expected: false }, // Number prefix start
        { name: "-pre__Class", expected: false }, // Invalid prefix start
        
        // Invalid patterns - class part  
        { name: "pre__-Class", expected: false }, // Invalid class start
        { name: "pre__-Class", expected: false }, // Invalid class start
        
        // Edge cases - adjust based on actual regex behavior
        { name: "a__", expected: true }, // Valid per regex
        { name: "__Class", expected: true }, // Valid per regex
        { name: "pre__class__extra", expected: true }, // Valid per regex
      ];

      regexTests.forEach(({ name, expected }) => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(expected);
        if (!expected) {
          expect(result.getError()).toBe(`Invalid class name format: ${name}`);
        }
      });
    });

    it("should handle unicode and special characters", () => {
      const unicodeTests = [
        { name: "Café", expected: false }, // Accented characters
        { name: "クラス", expected: false }, // Japanese characters
        { name: "Class-Name", expected: false }, // Dash
        { name: "Class Name", expected: false }, // Space
        { name: "Class.Name", expected: false }, // Dot
        { name: "Class+Name", expected: false }, // Plus
        { name: "Class@Name", expected: false }, // At symbol
      ];

      unicodeTests.forEach(({ name, expected }) => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(expected);
      });
    });
  });

  describe("Integration and Real-World Scenarios", () => {
    it("should handle common Exocortex class names", () => {
      const commonClasses = [
        "exo__Asset",
        "exo__Ontology", 
        "ems__Task",
        "ems__Person",
        "ems__Project",
        "ems__Area",
        "crm__Contact",
        "crm__Company",
        "kb__Article",
        "kb__Topic",
      ];

      commonClasses.forEach(name => {
        const result = ClassName.create(name);
        expect(result.isSuccess).toBe(true);
        
        const className = result.getValue()!;
        expect(className.toString()).toBe(name);
        expect(className.toWikiLink()).toBe(`[[${name}]]`);
        
        // Verify prefix/name split
        const parts = name.split("__");
        expect(className.getPrefix()).toBe(parts[0]);
        expect(className.getName()).toBe(parts[1]);
      });
    });

    it("should handle round-trip conversion", () => {
      const originalNames = [
        "exo__Asset",
        "SimpleClass",
        "_PrivateClass",
        "Complex_Class_123",
      ];

      originalNames.forEach(original => {
        const className = ClassName.create(original).getValue()!;
        const toString = className.toString();
        const recreated = ClassName.create(toString).getValue()!;
        
        expect(recreated.toString()).toBe(original);
        expect(className.equals(recreated)).toBe(true);
      });
    });

    it("should handle wiki link round-trip", () => {
      const className = ClassName.create("exo__Asset").getValue()!;
      const wikiLink = className.toWikiLink();
      const recreated = ClassName.create(wikiLink).getValue()!;
      
      expect(recreated.toString()).toBe("exo__Asset");
      expect(className.equals(recreated)).toBe(true);
    });
  });
});