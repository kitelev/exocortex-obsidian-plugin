import { AssetRelationUtils } from "../../../../src/shared/utils/AssetRelationUtils";

// Test helper function
const createRelation = (title: string, className?: any, customProp?: any, metadata?: any) => ({
  title,
  metadata: {
    exo__Instance_class: className,
    customProperty: customProp,
    ...metadata
  }
});

describe("AssetRelationUtils - Comprehensive Branch Coverage", () => {
  describe("isAssetArchived - All Condition Branches", () => {
    it("should return false for undefined metadata", () => {
      expect(AssetRelationUtils.isAssetArchived(undefined as any)).toBe(false);
    });

    it("should return false for null metadata", () => {
      expect(AssetRelationUtils.isAssetArchived(null as any)).toBe(false);
    });

    it("should return false for undefined archived property", () => {
      const metadata = { otherProperty: "value" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
    });

    it("should return false for null archived property", () => {
      const metadata = { archived: null };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
    });

    it("should return true for boolean true", () => {
      const metadata = { archived: true };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return false for boolean false", () => {
      const metadata = { archived: false };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
    });

    it("should return true for string 'true'", () => {
      const metadata = { archived: "true" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return true for string 'TRUE'", () => {
      const metadata = { archived: "TRUE" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return true for string 'yes'", () => {
      const metadata = { archived: "yes" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return true for string 'YES'", () => {
      const metadata = { archived: "YES" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return true for string '1'", () => {
      const metadata = { archived: "1" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return false for string 'false'", () => {
      const metadata = { archived: "false" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
    });

    it("should return false for string 'no'", () => {
      const metadata = { archived: "no" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
    });

    it("should return false for string '0'", () => {
      const metadata = { archived: "0" };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
    });

    it("should handle string with whitespace", () => {
      const metadata = { archived: "  true  " };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return true for non-zero number", () => {
      const metadata = { archived: 1 };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return true for negative number", () => {
      const metadata = { archived: -1 };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(true);
    });

    it("should return false for zero", () => {
      const metadata = { archived: 0 };
      expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
    });

    it("should return false for any other type", () => {
      const testCases = [
        { archived: [] },
        { archived: {} },
        { archived: () => true },
        { archived: Symbol("test") },
      ];

      testCases.forEach(metadata => {
        expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(false);
      });
    });

    it("should handle edge cases in string comparison", () => {
      const stringTests = [
        { value: "True", expected: true },
        { value: "tRuE", expected: true },
        { value: "Yes", expected: true },
        { value: "yEs", expected: true },
        { value: " 1 ", expected: true },
        { value: "false", expected: false },
        { value: "False", expected: false },
        { value: "No", expected: false },
        { value: "0", expected: false },
        { value: "2", expected: false },
        { value: "maybe", expected: false },
        { value: "", expected: false },
      ];

      stringTests.forEach(({ value, expected }) => {
        const metadata = { archived: value };
        expect(AssetRelationUtils.isAssetArchived(metadata)).toBe(expected);
      });
    });
  });

  describe("findReferencingProperty - All Search Branches", () => {
    it("should find property with direct basename reference", () => {
      const metadata = {
        propertyA: "Some text [[TargetFile]] more text",
        propertyB: "Other content"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("propertyA");
    });

    it("should find property with full path reference", () => {
      const metadata = {
        propertyA: "Some text",
        propertyB: "Content [[path/to/TargetFile.md]] end"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("propertyB");
    });

    it("should find property with path without .md extension", () => {
      const metadata = {
        propertyA: "Content [[path/to/TargetFile]] text"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("propertyA");
    });

    it("should find property with piped link - basename", () => {
      const metadata = {
        propertyA: "Text [[TargetFile|Display Name]] text"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("propertyA");
    });

    it("should find property with piped link - full path", () => {
      const metadata = {
        propertyA: "Text [[path/to/TargetFile.md|Display Name]] text"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("propertyA");
    });

    it("should find property with piped link - path without extension", () => {
      const metadata = {
        propertyA: "Text [[path/to/TargetFile|Display Name]] text"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("propertyA");
    });

    it("should skip null/undefined values", () => {
      const metadata = {
        nullProperty: null,
        undefinedProperty: undefined,
        validProperty: "[[TargetFile]]"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "TargetFile.md"
      );
      
      expect(result).toBe("validProperty");
    });

    it("should skip falsy values", () => {
      const metadata = {
        emptyString: "",
        zeroNumber: 0,
        falseBool: false,
        validProperty: "[[TargetFile]]"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "TargetFile.md"
      );
      
      expect(result).toBe("validProperty");
    });

    it("should convert non-string values to string", () => {
      const metadata = {
        numberValue: 12345,
        objectValue: { toString: () => "[[TargetFile]]" },
        dateValue: new Date("2024-01-01"),
        validProperty: "no match here"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "TargetFile.md"
      );
      
      expect(result).toBe("objectValue");
    });

    it("should search in array values - direct reference", () => {
      const metadata = {
        tags: ["tag1", "[[TargetFile]]", "tag3"],
        other: "no match"
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "TargetFile.md"
      );
      
      expect(result).toBe("tags");
    });

    it("should search in array values - path reference", () => {
      const metadata = {
        related: ["[[other/file]]", "[[path/to/TargetFile.md]]"],
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("related");
    });

    it("should search in array values - path without extension", () => {
      const metadata = {
        links: ["[[first]]", "[[path/to/TargetFile]]", "[[last]]"],
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("links");
    });

    it("should search in array values - piped links", () => {
      const metadata = {
        references: [
          "[[TargetFile|Display]]",
          "[[other|file]]"
        ],
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "TargetFile.md"
      );
      
      expect(result).toBe("references");
    });

    it("should return undefined when no reference found", () => {
      const metadata = {
        propertyA: "No references here",
        propertyB: "[[OtherFile]]",
        arrayProperty: ["tag1", "tag2"]
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "TargetFile.md"
      );
      
      expect(result).toBeUndefined();
    });

    it("should handle complex nested scenarios", () => {
      const metadata = {
        simple: "[[OtherFile]]",
        mixed: "Text before [[TargetFile|Alias]] text after",
        arrayMixed: [
          "[[NotTarget]]",
          "Text [[path/to/TargetFile]] end",
          "[[Another]]"
        ]
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "path/to/TargetFile.md"
      );
      
      expect(result).toBe("mixed"); // Should find first match
    });

    it("should convert array items to string for search", () => {
      const metadata = {
        mixedArray: [
          123,
          { toString: () => "[[TargetFile]]" },
          null,
          "regular string"
        ]
      };
      
      const result = AssetRelationUtils.findReferencingProperty(
        metadata, 
        "TargetFile", 
        "TargetFile.md"
      );
      
      expect(result).toBe("mixedArray");
    });
  });

  describe("getPropertyValue - Property Access Branches", () => {
    it("should get value from metadata when present", () => {
      const relation = {
        metadata: { targetProp: "metadata value" },
        targetProp: "direct value"
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "targetProp");
      expect(result).toBe("metadata value"); // Metadata takes precedence
    });

    it("should get value from direct properties when metadata missing", () => {
      const relation = {
        targetProp: "direct value"
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "targetProp");
      expect(result).toBe("direct value");
    });

    it("should get value from direct properties when metadata null", () => {
      const relation = {
        metadata: null,
        targetProp: "direct value"
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "targetProp");
      expect(result).toBe("direct value");
    });

    it("should get value from direct properties when property not in metadata", () => {
      const relation = {
        metadata: { otherProp: "other" },
        targetProp: "direct value"
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "targetProp");
      expect(result).toBe("direct value");
    });

    it("should return undefined when property not found anywhere", () => {
      const relation = {
        metadata: { otherProp: "other" },
        differentProp: "value"
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "targetProp");
      expect(result).toBeUndefined();
    });

    it("should handle nested property access with dot notation", () => {
      const relation = {
        nested: {
          level1: {
            level2: "deep value"
          }
        }
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "nested.level1.level2");
      expect(result).toBe("deep value");
    });

    it("should handle partial nested property access", () => {
      const relation = {
        nested: {
          level1: "partial value"
        }
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "nested.level1");
      expect(result).toBe("partial value");
    });

    it("should return undefined for missing nested property", () => {
      const relation = {
        nested: {
          level1: {}
        }
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "nested.level1.missing");
      expect(result).toBeUndefined();
    });

    it("should return undefined for deeply nested missing property", () => {
      const relation = {
        level1: {
          level2: null
        }
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "level1.level2.level3");
      expect(result).toBeUndefined();
    });

    it("should handle null values in nested path", () => {
      const relation = {
        nested: null
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "nested.property");
      expect(result).toBeUndefined();
    });

    it("should handle undefined values in nested path", () => {
      const relation = {
        nested: undefined
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "nested.property");
      expect(result).toBeUndefined();
    });

    it("should break on first undefined in nested path", () => {
      const relation = {
        level1: {
          level2: undefined,
          // This would normally contain level3, but level2 is undefined
        }
      };
      
      const result = AssetRelationUtils.getPropertyValue(relation, "level1.level2.level3");
      expect(result).toBeUndefined();
    });

    it("should handle complex nested objects", () => {
      const relation = {
        metadata: {
          nested: {
            deep: {
              value: "metadata nested"
            }
          }
        },
        nested: {
          deep: {
            value: "direct nested"
          }
        }
      };
      
      // Should find in metadata first
      const result = AssetRelationUtils.getPropertyValue(relation, "nested");
      expect(result.deep.value).toBe("metadata nested");
    });
  });

  describe("sortRelations - Sorting Branch Coverage", () => {

    describe("Name Column Sorting", () => {
      it("should sort by Name column ascending", () => {
        const relations = [
          createRelation("Charlie"),
          createRelation("Alice"),
          createRelation("Bob")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "Name", "asc");
        
        expect(sorted[0].title).toBe("Alice");
        expect(sorted[1].title).toBe("Bob");
        expect(sorted[2].title).toBe("Charlie");
      });

      it("should sort by Name column descending", () => {
        const relations = [
          createRelation("Alice"),
          createRelation("Charlie"),
          createRelation("Bob")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "Name", "desc");
        
        expect(sorted[0].title).toBe("Charlie");
        expect(sorted[1].title).toBe("Bob");
        expect(sorted[2].title).toBe("Alice");
      });

      it("should handle empty/null titles", () => {
        const relations = [
          createRelation("Valid"),
          createRelation(""),
          createRelation(null as any),
          createRelation(undefined as any)
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "Name", "asc");
        
        expect(sorted[0].title).toBe("Valid");
        // Empty/null titles should be sorted to the end
        expect([null, undefined, ""]).toContain(sorted[1].title);
        expect([null, undefined, ""]).toContain(sorted[2].title);
        expect([null, undefined, ""]).toContain(sorted[3].title);
      });

      it("should perform case insensitive sorting", () => {
        const relations = [
          createRelation("charlie"),
          createRelation("Alice"),
          createRelation("BOB")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "Name", "asc");
        
        expect(sorted[0].title).toBe("Alice");
        expect(sorted[1].title).toBe("BOB");
        expect(sorted[2].title).toBe("charlie");
      });
    });

    describe("Class Column Sorting", () => {
      it("should sort by exo__Instance_class ascending", () => {
        const relations = [
          createRelation("Item1", "[[ems__Task]]"),
          createRelation("Item2", "[[exo__Asset]]"),
          createRelation("Item3", "[[crm__Contact]]")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "exo__Instance_class", "asc");
        
        expect(sorted[0].metadata.exo__Instance_class).toBe("[[crm__Contact]]");
        expect(sorted[1].metadata.exo__Instance_class).toBe("[[ems__Task]]");
        expect(sorted[2].metadata.exo__Instance_class).toBe("[[exo__Asset]]");
      });

      it("should sort by exo__Instance_class descending", () => {
        const relations = [
          createRelation("Item1", "[[crm__Contact]]"),
          createRelation("Item2", "[[exo__Asset]]"),
          createRelation("Item3", "[[ems__Task]]")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "exo__Instance_class", "desc");
        
        expect(sorted[0].metadata.exo__Instance_class).toBe("[[exo__Asset]]");
        expect(sorted[1].metadata.exo__Instance_class).toBe("[[ems__Task]]");
        expect(sorted[2].metadata.exo__Instance_class).toBe("[[crm__Contact]]");
      });

      it("should handle array class values", () => {
        const relations = [
          createRelation("Item1", ["[[ems__Task]]", "[[other]]"]),
          createRelation("Item2", ["[[exo__Asset]]"]),
          createRelation("Item3", "[[crm__Contact]]")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "exo__Instance_class", "asc");
        
        // Should use first item in array for sorting
        expect(sorted[0].metadata.exo__Instance_class).toBe("[[crm__Contact]]");
        expect(sorted[1].metadata.exo__Instance_class[0]).toBe("[[ems__Task]]");
        expect(sorted[2].metadata.exo__Instance_class[0]).toBe("[[exo__Asset]]");
      });

      it("should handle empty array class values", () => {
        const relations = [
          createRelation("Item1", []),
          createRelation("Item2", "[[exo__Asset]]")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "exo__Instance_class", "asc");
        
        expect(sorted[0].metadata.exo__Instance_class).toBe("[[exo__Asset]]");
        expect(sorted[1].metadata.exo__Instance_class).toEqual([]);
      });

      it("should handle missing class metadata", () => {
        const relations = [
          createRelation("Item1"),
          createRelation("Item2", "[[exo__Asset]]")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "exo__Instance_class", "asc");
        
        expect(sorted[0].metadata.exo__Instance_class).toBe("[[exo__Asset]]");
        expect(sorted[1].metadata.exo__Instance_class).toBeUndefined();
      });

      it("should handle bracket notation property access", () => {
        const relations = [
          { metadata: { "exo__Instance_class": "[[ems__Task]]" }, title: "Item1" },
          { metadata: { "exo__Instance_class": "[[exo__Asset]]" }, title: "Item2" }
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "exo__Instance_class", "asc");
        
        expect(sorted[0].metadata["exo__Instance_class"]).toBe("[[ems__Task]]");
        expect(sorted[1].metadata["exo__Instance_class"]).toBe("[[exo__Asset]]");
      });
    });

    describe("Custom Property Sorting", () => {
      it("should sort by custom property ascending", () => {
        const relations = [
          createRelation("Item1", undefined, "Charlie"),
          createRelation("Item2", undefined, "Alice"),
          createRelation("Item3", undefined, "Bob")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("Alice");
        expect(sorted[1].metadata.customProperty).toBe("Bob");
        expect(sorted[2].metadata.customProperty).toBe("Charlie");
      });

      it("should sort by custom property descending", () => {
        const relations = [
          createRelation("Item1", undefined, "Alice"),
          createRelation("Item2", undefined, "Charlie"),
          createRelation("Item3", undefined, "Bob")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "desc");
        
        expect(sorted[0].metadata.customProperty).toBe("Charlie");
        expect(sorted[1].metadata.customProperty).toBe("Bob");
        expect(sorted[2].metadata.customProperty).toBe("Alice");
      });

      it("should handle undefined values in custom properties", () => {
        const relations = [
          createRelation("Item1", undefined, "Value"),
          createRelation("Item2"), // No custom property
          createRelation("Item3", undefined, undefined)
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("Value");
        // Undefined values should be sorted to end
        expect(sorted[1].metadata.customProperty).toBeUndefined();
        expect(sorted[2].metadata.customProperty).toBeUndefined();
      });

      it("should handle null values in custom properties", () => {
        const relations = [
          createRelation("Item1", undefined, "Value"),
          createRelation("Item2", undefined, null)
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("Value");
        expect(sorted[1].metadata.customProperty).toBe(null);
      });

      it("should handle array values in custom properties", () => {
        const relations = [
          createRelation("Item1", undefined, ["Charlie", "Delta"]),
          createRelation("Item2", undefined, ["Alice", "Beta"]),
          createRelation("Item3", undefined, "Bob")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        // Should use first item in array for sorting
        expect(sorted[0].metadata.customProperty[0]).toBe("Alice");
        expect(sorted[1].metadata.customProperty).toBe("Bob");
        expect(sorted[2].metadata.customProperty[0]).toBe("Charlie");
      });

      it("should handle empty array in custom properties", () => {
        const relations = [
          createRelation("Item1", undefined, "Value"),
          createRelation("Item2", undefined, [])
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("Value");
        expect(sorted[1].metadata.customProperty).toEqual([]);
      });
    });

    describe("Edge Cases in Sorting Logic", () => {
      it("should handle both aValue and bValue undefined", () => {
        const relations = [
          createRelation("Item1"),
          createRelation("Item2")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "missingProperty", "asc");
        
        // Order should remain stable when both values are undefined
        expect(sorted[0].title).toBe("Item1");
        expect(sorted[1].title).toBe("Item2");
      });

      it("should handle aValue undefined, bValue defined", () => {
        const relations = [
          createRelation("Item1"), // No custom property
          createRelation("Item2", undefined, "Defined")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("Defined");
        expect(sorted[1].metadata.customProperty).toBeUndefined();
      });

      it("should handle aValue defined, bValue undefined", () => {
        const relations = [
          createRelation("Item1", undefined, "Defined"),
          createRelation("Item2") // No custom property
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("Defined");
        expect(sorted[1].metadata.customProperty).toBeUndefined();
      });

      it("should handle empty string values", () => {
        const relations = [
          createRelation("Item1", undefined, ""),
          createRelation("Item2", undefined, "Value")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("Value");
        expect(sorted[1].metadata.customProperty).toBe("");
      });

      it("should perform case insensitive comparison", () => {
        const relations = [
          createRelation("Item1", undefined, "ZEBRA"),
          createRelation("Item2", undefined, "apple"),
          createRelation("Item3", undefined, "Banana")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        expect(sorted[0].metadata.customProperty).toBe("apple");
        expect(sorted[1].metadata.customProperty).toBe("Banana");
        expect(sorted[2].metadata.customProperty).toBe("ZEBRA");
      });

      it("should return new array without modifying original", () => {
        const relations = [
          createRelation("Charlie"),
          createRelation("Alice"),
          createRelation("Bob")
        ];
        const originalOrder = relations.map(r => r.title);
        
        const sorted = AssetRelationUtils.sortRelations(relations, "Name", "asc");
        
        // Original array should be unchanged
        expect(relations.map(r => r.title)).toEqual(originalOrder);
        
        // Sorted array should be different
        expect(sorted.map(r => r.title)).toEqual(["Alice", "Bob", "Charlie"]);
        expect(sorted).not.toBe(relations); // Different array reference
      });
    });

    describe("Complex Sorting Scenarios", () => {
      it("should handle mixed data types in sorting", () => {
        const relations = [
          createRelation("Item1", undefined, 100),
          createRelation("Item2", undefined, "50"),
          createRelation("Item3", undefined, true),
          createRelation("Item4", undefined, { toString: () => "25" })
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        // All values converted to string and compared lexicographically
        expect(sorted.map(r => String(r.metadata.customProperty))).toEqual([
          "100", "25", "50", "true"
        ]);
      });

      it("should handle identical values", () => {
        const relations = [
          createRelation("Item1", undefined, "Same"),
          createRelation("Item2", undefined, "Same"),
          createRelation("Item3", undefined, "Same")
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "customProperty", "asc");
        
        // Order should be stable for identical values
        expect(sorted.map(r => r.title)).toEqual(["Item1", "Item2", "Item3"]);
      });

      it("should handle nested property access in sorting", () => {
        const relations = [
          { title: "Item1", nested: { prop: "Charlie" } },
          { title: "Item2", nested: { prop: "Alice" } },
          { title: "Item3", nested: { prop: "Bob" } }
        ];
        
        const sorted = AssetRelationUtils.sortRelations(relations, "nested.prop", "asc");
        
        expect(sorted[0].nested.prop).toBe("Alice");
        expect(sorted[1].nested.prop).toBe("Bob");
        expect(sorted[2].nested.prop).toBe("Charlie");
      });
    });
  });

  describe("Integration and Performance", () => {
    it("should handle large datasets efficiently", () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        createRelation(`Item${i}`, `[[class${i % 10}]]`, `value${i}`)
      );
      
      const start = Date.now();
      const sorted = AssetRelationUtils.sortRelations(largeDataset, "Name", "asc");
      const duration = Date.now() - start;
      
      expect(sorted).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should be reasonably fast
      
      // Verify sorting is correct for a sample
      expect(sorted[0].title).toBe("Item0");
      expect(sorted[1].title).toBe("Item1");
    });

    it("should preserve object references during sorting", () => {
      const originalRelations = [
        createRelation("Charlie"),
        createRelation("Alice")
      ];
      
      const sorted = AssetRelationUtils.sortRelations(originalRelations, "Name", "asc");
      
      // Objects should be the same references, just reordered
      expect(sorted[0]).toBe(originalRelations[1]); // Alice was second, now first
      expect(sorted[1]).toBe(originalRelations[0]); // Charlie was first, now second
    });
  });
});