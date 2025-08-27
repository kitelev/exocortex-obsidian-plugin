import { ValidationUtils } from "../../../../src/shared/utils/ValidationUtils";

describe("ValidationUtils", () => {
  describe("isNonEmptyString", () => {
    it("should return true for valid non-empty strings", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isNonEmptyString("hello")).toBe(true);
      expect(ValidationUtils.isNonEmptyString("a")).toBe(true);
      expect(ValidationUtils.isNonEmptyString("  test  ")).toBe(true);
      expect(ValidationUtils.isNonEmptyString("123")).toBe(true);
      expect(ValidationUtils.isNonEmptyString("test\nwith\nnewlines")).toBe(
        true,
      );
    });

    it("should return false for empty or invalid strings", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isNonEmptyString("")).toBe(false);
      expect(ValidationUtils.isNonEmptyString("   ")).toBe(false);
      expect(ValidationUtils.isNonEmptyString("\t\n  ")).toBe(false);
      expect(ValidationUtils.isNonEmptyString(null)).toBe(false);
      expect(ValidationUtils.isNonEmptyString(undefined)).toBe(false);
      expect(ValidationUtils.isNonEmptyString(123)).toBe(false);
      expect(ValidationUtils.isNonEmptyString({})).toBe(false);
      expect(ValidationUtils.isNonEmptyString([])).toBe(false);
    });
  });

  describe("isNonEmptyArray", () => {
    it("should return true for non-empty arrays", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isNonEmptyArray([1])).toBe(true);
      expect(ValidationUtils.isNonEmptyArray(["a", "b"])).toBe(true);
      expect(ValidationUtils.isNonEmptyArray([null, undefined])).toBe(true);
      expect(ValidationUtils.isNonEmptyArray([{}])).toBe(true);
    });

    it("should return false for empty arrays or non-arrays", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isNonEmptyArray([])).toBe(false);
      expect(ValidationUtils.isNonEmptyArray("string")).toBe(false);
      expect(ValidationUtils.isNonEmptyArray(123)).toBe(false);
      expect(ValidationUtils.isNonEmptyArray({})).toBe(false);
      expect(ValidationUtils.isNonEmptyArray(null)).toBe(false);
      expect(ValidationUtils.isNonEmptyArray(undefined)).toBe(false);
    });
  });

  describe("hasRequiredProperties", () => {
    it("should return true when all required properties exist", () => {
      // Arrange
      const obj = { name: "test", age: 25, email: "test@example.com" };
      const requiredProps = ["name", "age"];

      // Act & Assert
      expect(ValidationUtils.hasRequiredProperties(obj, requiredProps)).toBe(
        true,
      );
    });

    it("should return true for empty required properties list", () => {
      // Arrange
      const obj = { name: "test" };
      const requiredProps: string[] = [];

      // Act & Assert
      expect(ValidationUtils.hasRequiredProperties(obj, requiredProps)).toBe(
        true,
      );
    });

    it("should return false when required properties are missing", () => {
      // Arrange
      const obj = { name: "test" };
      const requiredProps = ["name", "age"];

      // Act & Assert
      expect(ValidationUtils.hasRequiredProperties(obj, requiredProps)).toBe(
        false,
      );
    });

    it("should return false when required properties are null or undefined", () => {
      // Arrange
      const objWithNull = { name: "test", age: null };
      const objWithUndefined = { name: "test", age: undefined };
      const requiredProps = ["name", "age"];

      // Act & Assert
      expect(
        ValidationUtils.hasRequiredProperties(objWithNull, requiredProps),
      ).toBe(false);
      expect(
        ValidationUtils.hasRequiredProperties(objWithUndefined, requiredProps),
      ).toBe(false);
    });

    it("should return false for non-objects", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.hasRequiredProperties(null, ["prop"])).toBe(false);
      expect(ValidationUtils.hasRequiredProperties(undefined, ["prop"])).toBe(
        false,
      );
      expect(ValidationUtils.hasRequiredProperties("string", ["prop"])).toBe(
        false,
      );
      expect(ValidationUtils.hasRequiredProperties(123, ["prop"])).toBe(false);
      expect(ValidationUtils.hasRequiredProperties([], ["prop"])).toBe(false);
    });
  });

  describe("isValidFilename", () => {
    it("should return true for valid filenames", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidFilename("document.txt")).toBe(true);
      expect(ValidationUtils.isValidFilename("my-file_123.md")).toBe(true);
      expect(ValidationUtils.isValidFilename("simple")).toBe(true);
      expect(ValidationUtils.isValidFilename("file with spaces.pdf")).toBe(
        true,
      );
      expect(ValidationUtils.isValidFilename("测试文件.txt")).toBe(true);
    });

    it("should return false for filenames with invalid characters", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidFilename("file<name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename("file>name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename("file:name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename('file"name.txt')).toBe(false);
      expect(ValidationUtils.isValidFilename("file/name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename("file\\name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename("file|name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename("file?name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename("file*name.txt")).toBe(false);
      expect(ValidationUtils.isValidFilename("file\x00name.txt")).toBe(false);
    });

    it("should return false for empty or invalid input", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidFilename("")).toBe(false);
      expect(ValidationUtils.isValidFilename("   ")).toBe(false);
      expect(ValidationUtils.isValidFilename(null as any)).toBe(false);
      expect(ValidationUtils.isValidFilename(undefined as any)).toBe(false);
    });
  });

  describe("isValidAssetId", () => {
    it("should return true for valid UUID v4 strings", () => {
      // Arrange & Act & Assert
      expect(
        ValidationUtils.isValidAssetId("123e4567-e89b-42d3-a456-426614174000"),
      ).toBe(true);
      expect(
        ValidationUtils.isValidAssetId("00000000-0000-4000-8000-000000000000"),
      ).toBe(true);
      expect(
        ValidationUtils.isValidAssetId("FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF"),
      ).toBe(true);
    });

    it("should return false for invalid UUID formats", () => {
      // Arrange & Act & Assert
      expect(
        ValidationUtils.isValidAssetId("123e4567-e89b-12d3-a456-426614174000"),
      ).toBe(false); // wrong version
      expect(
        ValidationUtils.isValidAssetId("123e4567-e89b-42d3-c456-426614174000"),
      ).toBe(false); // wrong variant
      expect(
        ValidationUtils.isValidAssetId("123e4567-e89b-42d3-a456-42661417400"),
      ).toBe(false); // too short
      expect(
        ValidationUtils.isValidAssetId("123e4567-e89b-42d3-a456-4266141740000"),
      ).toBe(false); // too long
      expect(ValidationUtils.isValidAssetId("not-a-uuid")).toBe(false);
      expect(ValidationUtils.isValidAssetId("")).toBe(false);
      expect(
        ValidationUtils.isValidAssetId("123e4567e89b42d3a456426614174000"),
      ).toBe(false); // missing hyphens
    });
  });

  describe("isValidOntologyPrefix", () => {
    it("should return true for valid ontology prefixes", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidOntologyPrefix("exo")).toBe(true);
      expect(ValidationUtils.isValidOntologyPrefix("myOntology")).toBe(true);
      expect(ValidationUtils.isValidOntologyPrefix("test_123")).toBe(true);
      expect(ValidationUtils.isValidOntologyPrefix("a")).toBe(true);
      expect(ValidationUtils.isValidOntologyPrefix("schema_v2")).toBe(true);
    });

    it("should return false for invalid ontology prefixes", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidOntologyPrefix("123invalid")).toBe(false); // starts with number
      expect(ValidationUtils.isValidOntologyPrefix("_invalid")).toBe(false); // starts with underscore
      expect(ValidationUtils.isValidOntologyPrefix("invalid-name")).toBe(false); // contains hyphen
      expect(ValidationUtils.isValidOntologyPrefix("invalid name")).toBe(false); // contains space
      expect(ValidationUtils.isValidOntologyPrefix("invalid.name")).toBe(false); // contains dot
      expect(ValidationUtils.isValidOntologyPrefix("")).toBe(false);
      expect(ValidationUtils.isValidOntologyPrefix("   ")).toBe(false);
    });
  });

  describe("isValidClassName", () => {
    it("should return true for valid class names", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidClassName("Asset")).toBe(true);
      expect(ValidationUtils.isValidClassName("MyClass")).toBe(true);
      expect(ValidationUtils.isValidClassName("test_class")).toBe(true);
      expect(ValidationUtils.isValidClassName("Class123")).toBe(true);
      expect(ValidationUtils.isValidClassName("Class__Subclass")).toBe(true);
      expect(ValidationUtils.isValidClassName("a")).toBe(true);
    });

    it("should return false for invalid class names", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidClassName("123Class")).toBe(false); // starts with number
      expect(ValidationUtils.isValidClassName("_Class")).toBe(false); // starts with underscore
      expect(ValidationUtils.isValidClassName("Class-Name")).toBe(false); // contains hyphen
      expect(ValidationUtils.isValidClassName("Class Name")).toBe(false); // contains space
      expect(ValidationUtils.isValidClassName("Class.Name")).toBe(false); // contains dot
      expect(ValidationUtils.isValidClassName("Class___Name")).toBe(true); // triple underscore allowed by pattern
      expect(ValidationUtils.isValidClassName("")).toBe(false);
      expect(ValidationUtils.isValidClassName("   ")).toBe(false);
    });
  });

  describe("isInRange", () => {
    it("should return true for values within range", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isInRange(5, 1, 10)).toBe(true);
      expect(ValidationUtils.isInRange(1, 1, 10)).toBe(true); // min boundary
      expect(ValidationUtils.isInRange(10, 1, 10)).toBe(true); // max boundary
      expect(ValidationUtils.isInRange(0, -5, 5)).toBe(true);
      expect(ValidationUtils.isInRange(-3, -5, 5)).toBe(true);
    });

    it("should return false for values outside range", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isInRange(0, 1, 10)).toBe(false);
      expect(ValidationUtils.isInRange(11, 1, 10)).toBe(false);
      expect(ValidationUtils.isInRange(-6, -5, 5)).toBe(false);
      expect(ValidationUtils.isInRange(6, -5, 5)).toBe(false);
    });

    it("should return false for non-numeric values", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isInRange("5" as any, 1, 10)).toBe(false);
      expect(ValidationUtils.isInRange(null as any, 1, 10)).toBe(false);
      expect(ValidationUtils.isInRange(undefined as any, 1, 10)).toBe(false);
      expect(ValidationUtils.isInRange({} as any, 1, 10)).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid email addresses", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidEmail("test@example.com")).toBe(true);
      expect(ValidationUtils.isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(ValidationUtils.isValidEmail("test+tag@example.org")).toBe(true);
      expect(ValidationUtils.isValidEmail("a@b.c")).toBe(true);
    });

    it("should return false for invalid email addresses", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidEmail("invalid")).toBe(false);
      expect(ValidationUtils.isValidEmail("@example.com")).toBe(false);
      expect(ValidationUtils.isValidEmail("test@")).toBe(false);
      expect(ValidationUtils.isValidEmail("test@example")).toBe(false);
      expect(ValidationUtils.isValidEmail("test.example.com")).toBe(false);
      expect(ValidationUtils.isValidEmail("")).toBe(false);
      expect(ValidationUtils.isValidEmail("   ")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should return true for valid URLs", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidUrl("https://example.com")).toBe(true);
      expect(ValidationUtils.isValidUrl("http://example.com/path")).toBe(true);
      expect(ValidationUtils.isValidUrl("ftp://files.example.com")).toBe(true);
      expect(
        ValidationUtils.isValidUrl(
          "https://sub.domain.example.com:8080/path?query=value#hash",
        ),
      ).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidUrl("not-a-url")).toBe(false);
      expect(ValidationUtils.isValidUrl("://missing-protocol")).toBe(false);
      expect(ValidationUtils.isValidUrl("http://")).toBe(false);
      expect(ValidationUtils.isValidUrl("")).toBe(false);
      expect(ValidationUtils.isValidUrl("   ")).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    it("should remove control characters and normalize whitespace", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.sanitizeString("  hello   world  ")).toBe(
        "hello world",
      );
      expect(ValidationUtils.sanitizeString("test\x00string")).toBe(
        "teststring",
      );
      expect(ValidationUtils.sanitizeString("test\x1fcontrol")).toBe(
        "testcontrol",
      );
      expect(ValidationUtils.sanitizeString("test\x7fdelete")).toBe(
        "testdelete",
      );
      expect(ValidationUtils.sanitizeString("multi\n\nline\t\tstring")).toBe(
        "multilinestring",
      ); // newlines/tabs are control chars
    });

    it("should handle edge cases", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.sanitizeString("")).toBe("");
      expect(ValidationUtils.sanitizeString("   ")).toBe("");
      expect(ValidationUtils.sanitizeString("normal")).toBe("normal");
    });

    it("should handle invalid inputs", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.sanitizeString(null as any)).toBe("");
      expect(ValidationUtils.sanitizeString(undefined as any)).toBe("");
      expect(ValidationUtils.sanitizeString(123 as any)).toBe("");
    });
  });

  describe("isValidJson", () => {
    it("should return true for valid JSON strings", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidJson('{"name": "test"}')).toBe(true);
      expect(ValidationUtils.isValidJson("[1, 2, 3]")).toBe(true);
      expect(ValidationUtils.isValidJson('"string"')).toBe(true);
      expect(ValidationUtils.isValidJson("123")).toBe(true);
      expect(ValidationUtils.isValidJson("true")).toBe(true);
      expect(ValidationUtils.isValidJson("null")).toBe(true);
    });

    it("should return false for invalid JSON strings", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidJson("{'name': 'test'}")).toBe(false); // single quotes
      expect(ValidationUtils.isValidJson("{name: 'test'}")).toBe(false); // unquoted key
      expect(ValidationUtils.isValidJson("[1, 2, 3,]")).toBe(false); // trailing comma
      expect(ValidationUtils.isValidJson("undefined")).toBe(false);
      expect(ValidationUtils.isValidJson("")).toBe(false);
      expect(ValidationUtils.isValidJson("   ")).toBe(false);
    });
  });

  describe("conformsToSchema", () => {
    it("should return true when object conforms to schema", () => {
      // Arrange
      const obj = { name: "test", age: 25, email: "test@example.com" };
      const schema = {
        required: ["name", "age"],
        optional: ["email"],
        types: { name: "string", age: "number", email: "string" },
      };

      // Act & Assert
      expect(ValidationUtils.conformsToSchema(obj, schema)).toBe(true);
    });

    it("should return false when required properties are missing", () => {
      // Arrange
      const obj = { name: "test" };
      const schema = { required: ["name", "age"] };

      // Act & Assert
      expect(ValidationUtils.conformsToSchema(obj, schema)).toBe(false);
    });

    it("should return false when types don't match", () => {
      // Arrange
      const obj = { name: "test", age: "25" };
      const schema = {
        required: ["name", "age"],
        types: { name: "string", age: "number" },
      };

      // Act & Assert
      expect(ValidationUtils.conformsToSchema(obj, schema)).toBe(false);
    });

    it("should handle schema without required properties", () => {
      // Arrange
      const obj = { name: "test" };
      const schema = { types: { name: "string" } };

      // Act & Assert
      expect(ValidationUtils.conformsToSchema(obj, schema)).toBe(true);
    });

    it("should return false for non-objects", () => {
      // Arrange
      const schema = { required: ["name"] };

      // Act & Assert
      expect(ValidationUtils.conformsToSchema(null, schema)).toBe(false);
      expect(ValidationUtils.conformsToSchema("string", schema)).toBe(false);
      expect(ValidationUtils.conformsToSchema(123, schema)).toBe(false);
    });
  });

  describe("createValidationError", () => {
    it("should create error with all details", () => {
      // Arrange & Act
      const error = ValidationUtils.createValidationError(
        "email",
        "invalid-email",
        "must be valid email format",
        "user registration",
      );

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(
        "Validation failed for email in user registration: must be valid email format. Got: invalid-email",
      );
      expect((error as any).field).toBe("email");
      expect((error as any).value).toBe("invalid-email");
      expect((error as any).rule).toBe("must be valid email format");
      expect((error as any).context).toBe("user registration");
    });

    it("should create error without context", () => {
      // Arrange & Act
      const error = ValidationUtils.createValidationError(
        "age",
        -5,
        "must be positive",
      );

      // Assert
      expect(error.message).toBe(
        "Validation failed for age: must be positive. Got: -5",
      );
      expect((error as any).context).toBeUndefined();
    });
  });

  describe("Edge Cases and Performance", () => {
    it("should handle very large strings efficiently", () => {
      // Arrange
      const largeString = "a".repeat(10000);

      // Act & Assert
      expect(() => ValidationUtils.isNonEmptyString(largeString)).not.toThrow();
      expect(ValidationUtils.isNonEmptyString(largeString)).toBe(true);
    });

    it("should handle deeply nested objects", () => {
      // Arrange
      const deepObj = { level1: { level2: { level3: { value: "test" } } } };
      const schema = { required: ["level1"] };

      // Act & Assert
      expect(ValidationUtils.conformsToSchema(deepObj, schema)).toBe(true);
    });

    it("should handle arrays with mixed types", () => {
      // Arrange
      const mixedArray = [1, "string", null, undefined, {}, []];

      // Act & Assert
      expect(ValidationUtils.isNonEmptyArray(mixedArray)).toBe(true);
    });

    it("should handle unicode characters in validation", () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidFilename("测试文件.txt")).toBe(true);
      expect(ValidationUtils.isNonEmptyString("🚀 emoji")).toBe(true);
      expect(ValidationUtils.sanitizeString("café naïve")).toBe("café naïve");
    });
  });
});
