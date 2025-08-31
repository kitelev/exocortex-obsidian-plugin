import { PropertyValue, PropertyValueType } from "../../../../src/domain/value-objects/PropertyValue";

describe("PropertyValue", () => {
  describe("create - Type Detection", () => {
    it("should detect string type", () => {
      const result = PropertyValue.create("test string");
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.STRING);
      expect(propertyValue.getValue()).toBe("test string");
    });

    it("should detect number type", () => {
      const result = PropertyValue.create(42);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.NUMBER);
      expect(propertyValue.getValue()).toBe(42);
    });

    it("should detect boolean type", () => {
      const result = PropertyValue.create(true);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.BOOLEAN);
      expect(propertyValue.getValue()).toBe(true);
    });

    it("should detect Date type", () => {
      const date = new Date();
      const result = PropertyValue.create(date);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.DATE);
      expect(propertyValue.getValue()).toBe(date);
    });

    it("should detect array type", () => {
      const array = [1, 2, 3];
      const result = PropertyValue.create(array);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.ARRAY);
      expect(propertyValue.getValue()).toEqual(array);
    });

    it("should detect object type", () => {
      const object = { key: "value" };
      const result = PropertyValue.create(object);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.OBJECT);
      expect(propertyValue.getValue()).toEqual(object);
    });

    it("should detect WikiLink reference type", () => {
      const wikiLink = "[[Asset Name]]";
      const result = PropertyValue.create(wikiLink);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.REFERENCE);
      expect(propertyValue.isReference()).toBe(true);
      expect(propertyValue.getReferenceTarget()).toBe("Asset Name");
    });

    it("should detect IRI type", () => {
      const iri = "https://example.com/resource";
      const result = PropertyValue.create(iri);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.IRI);
      expect(propertyValue.isIRI()).toBe(true);
    });

    it("should detect date string as DATE type", () => {
      const dateString = "2024-01-01T12:00:00";
      const result = PropertyValue.create(dateString);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.DATE);
    });

    it("should detect custom protocol IRI", () => {
      const customIRI = "custom://example.com/resource";
      const result = PropertyValue.create(customIRI);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.IRI);
    });
  });

  describe("create - Null/Undefined Handling", () => {
    it("should fail for null value", () => {
      const result = PropertyValue.create(null);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Property value cannot be null or undefined");
    });

    it("should fail for undefined value", () => {
      const result = PropertyValue.create(undefined);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Property value cannot be null or undefined");
    });
  });

  describe("createTyped - Type Conversion", () => {
    it("should convert string to number type", () => {
      const result = PropertyValue.createTyped("42", PropertyValueType.NUMBER);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.NUMBER);
      expect(propertyValue.getValue()).toBe(42);
    });

    it("should convert string to boolean type", () => {
      const result = PropertyValue.createTyped("true", PropertyValueType.BOOLEAN);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.BOOLEAN);
      expect(propertyValue.getValue()).toBe(true);
    });

    it("should convert string to date type", () => {
      const result = PropertyValue.createTyped("2024-01-01T12:00:00", PropertyValueType.DATE);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.DATE);
      expect(propertyValue.getValue()).toBeInstanceOf(Date);
    });

    it("should fail for non-array when expecting array type", () => {
      const result = PropertyValue.createTyped("single", PropertyValueType.ARRAY);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Expected array");
    });

    it("should preserve array for array type", () => {
      const originalArray = [1, 2, 3];
      const result = PropertyValue.createTyped(originalArray, PropertyValueType.ARRAY);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.ARRAY);
      expect(propertyValue.getValue()).toEqual([1, 2, 3]);
      expect(propertyValue.getValue()).not.toBe(originalArray); // Should be copy
    });

    it("should convert date instance for date type", () => {
      const originalDate = new Date("2024-01-01");
      const result = PropertyValue.createTyped(originalDate, PropertyValueType.DATE);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.DATE);
      expect(propertyValue.getValue()).toBe(originalDate);
    });

    it("should fail for non-string when expecting REFERENCE type", () => {
      const result = PropertyValue.createTyped(123, PropertyValueType.REFERENCE);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Expected string, got number");
    });

    it("should fail for non-string when expecting IRI type", () => {
      const result = PropertyValue.createTyped(123, PropertyValueType.IRI);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Expected string, got number");
    });

    it("should preserve value for OBJECT type", () => {
      const object = { key: "value", nested: { prop: 123 } };
      const result = PropertyValue.createTyped(object, PropertyValueType.OBJECT);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getType()).toBe(PropertyValueType.OBJECT);
      expect(propertyValue.getValue()).toEqual(object);
    });
  });

  describe("Validation - String Constraints", () => {
    it("should fail when string is too short", () => {
      const result = PropertyValue.create("ab", { minLength: 5 });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("String too short, minimum 5");
    });

    it("should fail when string is too long", () => {
      const result = PropertyValue.create("toolong", { maxLength: 3 });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("String too long, maximum 3");
    });

    it("should fail when string doesn't match pattern", () => {
      const pattern = /^[A-Z][a-z]+$/;
      const result = PropertyValue.create("lowercase", { pattern });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("String does not match required pattern");
    });

    it("should succeed when string meets all constraints", () => {
      const pattern = /^[A-Z][a-z]+$/;
      const result = PropertyValue.create("Valid", { 
        minLength: 3, 
        maxLength: 10, 
        pattern 
      });
      
      expect(result.isSuccess).toBe(true);
    });

    it("should fail for non-string when expecting string type", () => {
      const result = PropertyValue.createTyped(123, PropertyValueType.STRING);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Expected string, got number");
    });
  });

  describe("Validation - Number Constraints", () => {
    it("should fail for invalid number", () => {
      const result = PropertyValue.createTyped("not-a-number", PropertyValueType.NUMBER);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Invalid number");
    });

    it("should fail when number is below minimum", () => {
      const result = PropertyValue.create(5, { min: 10 });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Number too small, minimum 10");
    });

    it("should fail when number is above maximum", () => {
      const result = PropertyValue.create(15, { max: 10 });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Number too large, maximum 10");
    });

    it("should succeed when number meets constraints", () => {
      const result = PropertyValue.create(7, { min: 5, max: 10 });
      
      expect(result.isSuccess).toBe(true);
    });

    it("should handle edge case numbers", () => {
      const testCases = [
        { value: 0, constraints: { min: 0 }, expected: true },
        { value: -1, constraints: { min: 0 }, expected: false },
        { value: 10, constraints: { max: 10 }, expected: true },
        { value: 11, constraints: { max: 10 }, expected: false },
      ];

      testCases.forEach(({ value, constraints, expected }) => {
        const result = PropertyValue.create(value, constraints);
        expect(result.isSuccess).toBe(expected);
      });
    });
  });

  describe("Validation - Date Constraints", () => {
    it("should fail for invalid date string", () => {
      const result = PropertyValue.createTyped("not-a-date", PropertyValueType.DATE);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Invalid date");
    });

    it("should succeed for valid date string", () => {
      const result = PropertyValue.createTyped("2024-01-01T12:00:00", PropertyValueType.DATE);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getValue()).toBeInstanceOf(Date);
    });

    it("should succeed for Date instance", () => {
      const date = new Date();
      const result = PropertyValue.createTyped(date, PropertyValueType.DATE);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getValue()).toBe(date);
    });
  });

  describe("Validation - Array Constraints", () => {
    it("should fail for non-array when expecting array", () => {
      const result = PropertyValue.createTyped("not-array", PropertyValueType.ARRAY);
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Expected array");
    });

    it("should fail when array has too few items", () => {
      const result = PropertyValue.create([1, 2], { minItems: 5 });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Array too short, minimum 5 items");
    });

    it("should fail when array has too many items", () => {
      const result = PropertyValue.create([1, 2, 3, 4], { maxItems: 2 });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("Array too long, maximum 2 items");
    });

    it("should succeed when array meets constraints", () => {
      const result = PropertyValue.create([1, 2, 3], { minItems: 2, maxItems: 5 });
      
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("getValue - Immutability", () => {
    it("should return copy of array to maintain immutability", () => {
      const originalArray = [1, 2, 3];
      const result = PropertyValue.create(originalArray);
      const propertyValue = result.getValue()!;
      
      const retrievedArray = propertyValue.getValue();
      expect(retrievedArray).toEqual(originalArray);
      expect(retrievedArray).not.toBe(originalArray); // Different reference
      
      // Modifying retrieved array shouldn't affect property value
      retrievedArray.push(4);
      expect(propertyValue.getValue()).toEqual([1, 2, 3]);
    });

    it("should return copy of object to maintain immutability", () => {
      const originalObject = { key: "value", nested: { prop: 123 } };
      const result = PropertyValue.create(originalObject);
      const propertyValue = result.getValue()!;
      
      const retrievedObject = propertyValue.getValue();
      expect(retrievedObject).toEqual(originalObject);
      expect(retrievedObject).not.toBe(originalObject); // Different reference
      
      // Modifying retrieved object shouldn't affect property value
      retrievedObject.key = "modified";
      expect(propertyValue.getValue().key).toBe("value");
    });

    it("should return direct value for primitive types", () => {
      const testCases = [
        "string",
        42,
        true,
        new Date(),
      ];

      testCases.forEach(value => {
        const result = PropertyValue.create(value);
        const propertyValue = result.getValue()!;
        expect(propertyValue.getValue()).toBe(value);
      });
    });
  });

  describe("Reference Handling", () => {
    it("should extract reference target from WikiLink", () => {
      const wikiLink = "[[Target Asset]]";
      const result = PropertyValue.create(wikiLink);
      const propertyValue = result.getValue()!;
      
      expect(propertyValue.isReference()).toBe(true);
      expect(propertyValue.getReferenceTarget()).toBe("Target Asset");
    });

    it("should return null for non-reference type", () => {
      const result = PropertyValue.create("regular string");
      const propertyValue = result.getValue()!;
      
      expect(propertyValue.isReference()).toBe(false);
      expect(propertyValue.getReferenceTarget()).toBe(null);
    });

    it("should handle malformed WikiLink", () => {
      // Force create as reference type to test getReferenceTarget logic
      const result = PropertyValue.createTyped("[[incomplete", PropertyValueType.REFERENCE);
      const propertyValue = result.getValue()!;
      
      expect(propertyValue.isReference()).toBe(true);
      expect(propertyValue.getReferenceTarget()).toBe(null); // No match
    });

    it("should handle empty WikiLink", () => {
      const result = PropertyValue.create("[[]]");
      const propertyValue = result.getValue()!;
      
      expect(propertyValue.isReference()).toBe(true);
      expect(propertyValue.getReferenceTarget()).toBe("");
    });
  });

  describe("IRI Handling", () => {
    it("should identify IRI correctly", () => {
      const testCases = [
        { value: "https://example.com", expected: true },
        { value: "http://example.com", expected: true },
        { value: "ftp://example.com", expected: true },
        { value: "custom://example.com", expected: true },
        { value: "mailto:test@example.com", expected: true },
        { value: "regular string", expected: false },
      ];

      testCases.forEach(({ value, expected }) => {
        const result = PropertyValue.create(value);
        const propertyValue = result.getValue()!;
        expect(propertyValue.isIRI()).toBe(expected);
      });
    });
  });

  describe("toString Conversion", () => {
    it("should convert Date to ISO string without milliseconds", () => {
      const date = new Date("2024-01-01T12:00:00.123Z");
      const result = PropertyValue.create(date);
      const propertyValue = result.getValue()!;
      
      const stringValue = propertyValue.toString();
      expect(stringValue).toBe("2024-01-01T12:00:00");
      expect(stringValue).not.toContain(".123");
    });

    it("should convert non-Date values to string", () => {
      const testCases = [
        { value: 42, expected: "42" },
        { value: true, expected: "true" },
        { value: [1, 2, 3], expected: "1,2,3" },
        { value: { key: "value" }, expected: "[object Object]" },
      ];

      testCases.forEach(({ value, expected }) => {
        const result = PropertyValue.create(value);
        const propertyValue = result.getValue()!;
        expect(propertyValue.toString()).toBe(expected);
      });
    });
  });

  describe("equals Comparison", () => {
    it("should return false for different types", () => {
      const stringValue = PropertyValue.create("42").getValue()!;
      const numberValue = PropertyValue.create(42).getValue()!;
      
      expect(stringValue.equals(numberValue)).toBe(false);
    });

    it("should return true for same primitive values", () => {
      const value1 = PropertyValue.create("test").getValue()!;
      const value2 = PropertyValue.create("test").getValue()!;
      
      expect(value1.equals(value2)).toBe(true);
    });

    it("should return false for different primitive values", () => {
      const value1 = PropertyValue.create("test1").getValue()!;
      const value2 = PropertyValue.create("test2").getValue()!;
      
      expect(value1.equals(value2)).toBe(false);
    });

    it("should compare arrays using JSON serialization", () => {
      const array1 = PropertyValue.create([1, 2, 3]).getValue()!;
      const array2 = PropertyValue.create([1, 2, 3]).getValue()!;
      const array3 = PropertyValue.create([3, 2, 1]).getValue()!;
      
      expect(array1.equals(array2)).toBe(true);
      expect(array1.equals(array3)).toBe(false);
    });

    it("should compare objects using JSON serialization", () => {
      const obj1 = PropertyValue.create({ a: 1, b: 2 }).getValue()!;
      const obj2 = PropertyValue.create({ a: 1, b: 2 }).getValue()!;
      const obj3 = PropertyValue.create({ b: 2, a: 1 }).getValue()!; // Different order
      
      expect(obj1.equals(obj2)).toBe(true);
      expect(obj1.equals(obj3)).toBe(false); // JSON stringify may not normalize order consistently
    });

    it("should handle complex nested object comparison", () => {
      const complex1 = PropertyValue.create({
        level1: {
          level2: {
            array: [1, 2, { nested: "value" }]
          }
        }
      }).getValue()!;
      
      const complex2 = PropertyValue.create({
        level1: {
          level2: {
            array: [1, 2, { nested: "value" }]
          }
        }
      }).getValue()!;
      
      const complex3 = PropertyValue.create({
        level1: {
          level2: {
            array: [1, 2, { nested: "different" }]
          }
        }
      }).getValue()!;
      
      expect(complex1.equals(complex2)).toBe(true);
      expect(complex1.equals(complex3)).toBe(false);
    });
  });

  describe("withConstraints", () => {
    it("should create new PropertyValue with additional constraints", () => {
      const original = PropertyValue.create("test").getValue()!;
      const result = original.withConstraints({ minLength: 2, maxLength: 10 });
      
      expect(result.isSuccess).toBe(true);
      const updated = result.getValue()!;
      expect(updated.getConstraints()).toEqual({ minLength: 2, maxLength: 10 });
    });

    it("should merge existing constraints with new ones", () => {
      const original = PropertyValue.create("test", { minLength: 1 }).getValue()!;
      const result = original.withConstraints({ maxLength: 10 });
      
      expect(result.isSuccess).toBe(true);
      const updated = result.getValue()!;
      expect(updated.getConstraints()).toEqual({ minLength: 1, maxLength: 10 });
    });

    it("should fail when new constraints make value invalid", () => {
      const original = PropertyValue.create("test").getValue()!;
      const result = original.withConstraints({ minLength: 10 });
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe("String too short, minimum 10");
    });

    it("should override existing constraints", () => {
      const original = PropertyValue.create("test", { minLength: 1 }).getValue()!;
      const result = original.withConstraints({ minLength: 2 });
      
      expect(result.isSuccess).toBe(true);
      const updated = result.getValue()!;
      expect(updated.getConstraints().minLength).toBe(2);
    });
  });

  describe("Edge Cases and Error Paths", () => {
    it("should handle empty string patterns", () => {
      const emptyStringCases = [
        { type: PropertyValueType.STRING, value: "", expected: true },
        { type: PropertyValueType.REFERENCE, value: "", expected: true },
        { type: PropertyValueType.IRI, value: "", expected: true },
      ];

      emptyStringCases.forEach(({ type, value, expected }) => {
        const result = PropertyValue.createTyped(value, type);
        expect(result.isSuccess).toBe(expected);
      });
    });

    it("should handle boundary constraint values", () => {
      const boundaryTests = [
        { value: "test", constraints: { minLength: 4 }, expected: true }, // Exact min
        { value: "test", constraints: { maxLength: 4 }, expected: true }, // Exact max
        { value: 10, constraints: { min: 10 }, expected: true }, // Exact min
        { value: 10, constraints: { max: 10 }, expected: true }, // Exact max
        { value: [], constraints: { minItems: 0 }, expected: true }, // Empty array, min 0
        { value: [1], constraints: { maxItems: 1 }, expected: true }, // Single item, max 1
      ];

      boundaryTests.forEach(({ value, constraints, expected }) => {
        const result = PropertyValue.create(value, constraints);
        expect(result.isSuccess).toBe(expected);
      });
    });

    it("should handle constraints not applicable to type", () => {
      // String constraints on number (should be ignored in validation)
      const result = PropertyValue.create(42, { minLength: 5 });
      expect(result.isSuccess).toBe(true);
      
      // Number constraints on string (should be ignored)
      const result2 = PropertyValue.create("test", { min: 10 });
      expect(result2.isSuccess).toBe(true);
    });

    it("should handle special number values", () => {
      const specialNumbers = [
        { value: Infinity, expected: true },
        { value: -Infinity, expected: true },
        { value: NaN, expected: false }, // NaN should fail validation
        { value: 0, expected: true },
        { value: -0, expected: true },
      ];

      specialNumbers.forEach(({ value, expected }) => {
        const result = PropertyValue.createTyped(value, PropertyValueType.NUMBER);
        expect(result.isSuccess).toBe(expected);
      });
    });

    it("should handle complex validation scenarios", () => {
      // Test combination of multiple failing constraints
      const result = PropertyValue.create("a", { 
        minLength: 5, 
        maxLength: 3,  // Contradictory constraints
        pattern: /^[A-Z]+$/ 
      });
      
      expect(result.isFailure).toBe(true);
      // Should fail on first constraint that fails
      expect(result.getError()).toBe("String too short, minimum 5");
    });
  });

  describe("Type Detection Edge Cases", () => {
    it("should prioritize WikiLink over IRI detection", () => {
      const wikiLinkWithURL = "[[https://example.com]]";
      const result = PropertyValue.create(wikiLinkWithURL);
      const propertyValue = result.getValue()!;
      
      expect(propertyValue.getType()).toBe(PropertyValueType.REFERENCE);
      expect(propertyValue.isReference()).toBe(true);
      expect(propertyValue.getReferenceTarget()).toBe("https://example.com");
    });

    it("should prioritize WikiLink over date detection", () => {
      const wikiLinkWithDate = "[[2024-01-01T12:00:00]]";
      const result = PropertyValue.create(wikiLinkWithDate);
      const propertyValue = result.getValue()!;
      
      expect(propertyValue.getType()).toBe(PropertyValueType.REFERENCE);
      expect(propertyValue.isReference()).toBe(true);
    });

    it("should prioritize IRI over date detection", () => {
      const iriWithDate = "https://example.com/2024-01-01T12:00:00";
      const result = PropertyValue.create(iriWithDate);
      const propertyValue = result.getValue()!;
      
      expect(propertyValue.getType()).toBe(PropertyValueType.IRI);
      expect(propertyValue.isIRI()).toBe(true);
    });

    it("should handle various IRI protocols", () => {
      const iriProtocols = [
        "http://example.com",
        "https://example.com",
        "ftp://example.com",
        "mailto:test@example.com",
        "file://path/to/file",
        "urn:isbn:123456789",
        "data:text/plain;base64,SGVsbG8=",
      ];

      iriProtocols.forEach(iri => {
        const result = PropertyValue.create(iri);
        const propertyValue = result.getValue()!;
        expect(propertyValue.getType()).toBe(PropertyValueType.IRI);
        expect(propertyValue.isIRI()).toBe(true);
      });
    });

    it("should handle edge cases in date detection", () => {
      const datePatterns = [
        { value: "2024-01-01T12:00:00", expected: PropertyValueType.DATE },
        { value: "2024-01-01T12:00:00.123", expected: PropertyValueType.DATE },
        { value: "2024-01-01T12:00:00Z", expected: PropertyValueType.DATE },
        { value: "2024-01-01T12:00:00+05:00", expected: PropertyValueType.DATE },
        { value: "2024-1-1T1:1:1", expected: PropertyValueType.STRING }, // Invalid format
        { value: "text-without-protocol", expected: PropertyValueType.STRING },
      ];

      datePatterns.forEach(({ value, expected }) => {
        const result = PropertyValue.create(value);
        const propertyValue = result.getValue()!;
        expect(propertyValue.getType()).toBe(expected);
      });
    });
  });

  describe("Constraints Deep Copy", () => {
    it("should return copy of constraints to prevent mutation", () => {
      const constraints = { minLength: 5, maxLength: 10, pattern: /test/ };
      const result = PropertyValue.create("testing", constraints);
      const propertyValue = result.getValue()!;
      
      const retrievedConstraints = propertyValue.getConstraints();
      expect(retrievedConstraints).toEqual(constraints);
      expect(retrievedConstraints).not.toBe(constraints); // Different reference
      
      // Modifying retrieved constraints shouldn't affect property value
      retrievedConstraints.minLength = 1;
      expect(propertyValue.getConstraints().minLength).toBe(5);
    });

    it("should handle empty constraints", () => {
      const result = PropertyValue.create("test");
      const propertyValue = result.getValue()!;
      
      const constraints = propertyValue.getConstraints();
      expect(constraints).toEqual({});
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large arrays efficiently", () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      const result = PropertyValue.create(largeArray);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getValue()).toHaveLength(10000);
    });

    it("should handle large objects efficiently", () => {
      const largeObject: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      
      const result = PropertyValue.create(largeObject);
      expect(result.isSuccess).toBe(true);
      
      const propertyValue = result.getValue()!;
      expect(Object.keys(propertyValue.getValue())).toHaveLength(1000);
    });

    it("should handle long strings efficiently", () => {
      const longString = "x".repeat(100000);
      const result = PropertyValue.create(longString);
      
      expect(result.isSuccess).toBe(true);
      const propertyValue = result.getValue()!;
      expect(propertyValue.getValue()).toHaveLength(100000);
    });
  });
});