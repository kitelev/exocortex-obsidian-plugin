import { MetadataHelpers } from "../../../src/infrastructure/utilities/MetadataHelpers";

describe("MetadataHelpers", () => {
  describe("findAllReferencingProperties", () => {
    it("should find single property referencing file", () => {
      const metadata = {
        "ems__Effort_parent": "[[ParentTask]]",
        "exo__Asset_label": "Task Label",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(metadata, "ParentTask");
      expect(properties).toEqual(["ems__Effort_parent"]);
    });

    it("should find multiple properties referencing same file", () => {
      const metadata = {
        "ems__Effort_parent": "[[Task123]]",
        "ems__Effort_prototype": "[[Task123]]",
        "exo__Asset_label": "Some Label",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(metadata, "Task123");
      expect(properties).toEqual(["ems__Effort_parent", "ems__Effort_prototype"]);
    });

    it("should find references in arrays", () => {
      const metadata = {
        "ems__Task_blocks": ["[[Task1]]", "[[Task2]]", "[[Task3]]"],
        "exo__Asset_label": "Blocker",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(metadata, "Task2");
      expect(properties).toEqual(["ems__Task_blocks"]);
    });

    it("should return empty array when no references found", () => {
      const metadata = {
        "exo__Asset_label": "No References",
        "ems__Effort_status": "ems__EffortStatusDoing",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(metadata, "NonExistent");
      expect(properties).toEqual([]);
    });

    it("should handle references without brackets", () => {
      const metadata = {
        "exo__Asset_isDefinedBy": "SomeArea",
        "exo__Asset_label": "Label",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(metadata, "SomeArea");
      expect(properties).toEqual(["exo__Asset_isDefinedBy"]);
    });

    it("should handle file names with .md extension", () => {
      const metadata = {
        "ems__Effort_parent": "[[ParentTask.md]]",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(metadata, "ParentTask.md");
      expect(properties).toEqual(["ems__Effort_parent"]);
    });

    it("should handle empty metadata", () => {
      const properties = MetadataHelpers.findAllReferencingProperties({}, "Task");
      expect(properties).toEqual([]);
    });
  });

  describe("findReferencingProperty", () => {
    it("should find first property referencing file", () => {
      const metadata = {
        "ems__Effort_parent": "[[ParentTask]]",
        "exo__Asset_label": "Task Label",
      };

      const property = MetadataHelpers.findReferencingProperty(metadata, "ParentTask");
      expect(property).toBe("ems__Effort_parent");
    });

    it("should return first matching property when multiple match", () => {
      const metadata = {
        "ems__Effort_parent": "[[Task123]]",
        "ems__Effort_prototype": "[[Task123]]",
      };

      const property = MetadataHelpers.findReferencingProperty(metadata, "Task123");
      expect(property).toBeDefined();
      expect(["ems__Effort_parent", "ems__Effort_prototype"]).toContain(property);
    });

    it("should return undefined when no reference found", () => {
      const metadata = {
        "exo__Asset_label": "No References",
      };

      const property = MetadataHelpers.findReferencingProperty(metadata, "NonExistent");
      expect(property).toBeUndefined();
    });

    it("should find references in arrays", () => {
      const metadata = {
        "ems__Task_blocks": ["[[Task1]]", "[[Task2]]"],
      };

      const property = MetadataHelpers.findReferencingProperty(metadata, "Task2");
      expect(property).toBe("ems__Task_blocks");
    });

    it("should handle empty metadata", () => {
      const property = MetadataHelpers.findReferencingProperty({}, "Task");
      expect(property).toBeUndefined();
    });
  });

  describe("containsReference", () => {
    it("should detect wikilink reference", () => {
      const result = MetadataHelpers.containsReference("[[TaskName]]", "TaskName");
      expect(result).toBe(true);
    });

    it("should detect plain text reference", () => {
      const result = MetadataHelpers.containsReference("TaskName", "TaskName");
      expect(result).toBe(true);
    });

    it("should detect reference in string with .md extension", () => {
      const result = MetadataHelpers.containsReference("[[TaskName]]", "TaskName.md");
      expect(result).toBe(true);
    });

    it("should detect reference in array", () => {
      const result = MetadataHelpers.containsReference(["[[Task1]]", "[[Task2]]"], "Task2");
      expect(result).toBe(true);
    });

    it("should detect nested references in arrays", () => {
      const result = MetadataHelpers.containsReference([["[[Task1]]"], "Other"], "Task1");
      expect(result).toBe(true);
    });

    it("should return false for null value", () => {
      const result = MetadataHelpers.containsReference(null, "Task");
      expect(result).toBe(false);
    });

    it("should return false for undefined value", () => {
      const result = MetadataHelpers.containsReference(undefined, "Task");
      expect(result).toBe(false);
    });

    it("should return false when no reference found", () => {
      const result = MetadataHelpers.containsReference("[[OtherTask]]", "TaskName");
      expect(result).toBe(false);
    });

    it("should return false for empty array", () => {
      const result = MetadataHelpers.containsReference([], "Task");
      expect(result).toBe(false);
    });

    it("should return false for empty string", () => {
      const result = MetadataHelpers.containsReference("", "Task");
      expect(result).toBe(false);
    });

    it("should handle partial matches in strings", () => {
      const result = MetadataHelpers.containsReference("This contains TaskName in text", "TaskName");
      expect(result).toBe(true);
    });

    it("should handle complex array structures", () => {
      const result = MetadataHelpers.containsReference(
        [null, "[[Task1]]", undefined, "Other", "[[Task2]]"],
        "Task2"
      );
      expect(result).toBe(true);
    });
  });

  describe("isAssetArchived", () => {
    it("should return true for legacy exo__Asset_isArchived field", () => {
      const result = MetadataHelpers.isAssetArchived({ exo__Asset_isArchived: true });
      expect(result).toBe(true);
    });

    it("should return true for archived boolean true", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: true });
      expect(result).toBe(true);
    });

    it("should return false for archived boolean false", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: false });
      expect(result).toBe(false);
    });

    it("should return true for archived string 'true'", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: "true" });
      expect(result).toBe(true);
    });

    it("should return true for archived string 'yes'", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: "yes" });
      expect(result).toBe(true);
    });

    it("should return true for archived string '1'", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: "1" });
      expect(result).toBe(true);
    });

    it("should return true for archived number 1", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: 1 });
      expect(result).toBe(true);
    });

    it("should return false for archived number 0", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: 0 });
      expect(result).toBe(false);
    });

    it("should return false for archived string 'false'", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: "false" });
      expect(result).toBe(false);
    });

    it("should return false for archived string 'no'", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: "no" });
      expect(result).toBe(false);
    });

    it("should handle case-insensitive strings", () => {
      expect(MetadataHelpers.isAssetArchived({ archived: "TRUE" })).toBe(true);
      expect(MetadataHelpers.isAssetArchived({ archived: "YES" })).toBe(true);
      expect(MetadataHelpers.isAssetArchived({ archived: "False" })).toBe(false);
    });

    it("should handle strings with whitespace", () => {
      expect(MetadataHelpers.isAssetArchived({ archived: " true " })).toBe(true);
      expect(MetadataHelpers.isAssetArchived({ archived: " yes " })).toBe(true);
    });

    it("should return false for null archived value", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: null });
      expect(result).toBe(false);
    });

    it("should return false for undefined archived value", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: undefined });
      expect(result).toBe(false);
    });

    it("should return false for empty metadata", () => {
      const result = MetadataHelpers.isAssetArchived({});
      expect(result).toBe(false);
    });

    it("should return false for missing archived field", () => {
      const result = MetadataHelpers.isAssetArchived({ exo__Asset_label: "Test" });
      expect(result).toBe(false);
    });

    it("should prioritize legacy field over standard field", () => {
      const result = MetadataHelpers.isAssetArchived({
        exo__Asset_isArchived: true,
        archived: false,
      });
      expect(result).toBe(true);
    });

    it("should handle number 2 as archived", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: 2 });
      expect(result).toBe(true);
    });

    it("should handle negative numbers as archived", () => {
      const result = MetadataHelpers.isAssetArchived({ archived: -1 });
      expect(result).toBe(true);
    });

    it("should return false for invalid string values", () => {
      expect(MetadataHelpers.isAssetArchived({ archived: "maybe" })).toBe(false);
      expect(MetadataHelpers.isAssetArchived({ archived: "archived" })).toBe(false);
    });
  });

  describe("getPropertyValue", () => {
    const mockRelation = {
      title: "Test Title",
      created: 1234567890,
      modified: 1234567900,
      path: "test/path.md",
      metadata: {
        "exo__Asset_label": "Test Label",
        "ems__Effort_status": "ems__EffortStatusDoing",
        "custom_property": "Custom Value",
      },
    };

    it("should return title for 'Name' property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "Name");
      expect(result).toBe("Test Title");
    });

    it("should return title for 'title' property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "title");
      expect(result).toBe("Test Title");
    });

    it("should return created timestamp for 'created' property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "created");
      expect(result).toBe(1234567890);
    });

    it("should return modified timestamp for 'modified' property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "modified");
      expect(result).toBe(1234567900);
    });

    it("should return path for 'path' property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "path");
      expect(result).toBe("test/path.md");
    });

    it("should return metadata value for custom property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "exo__Asset_label");
      expect(result).toBe("Test Label");
    });

    it("should return metadata value for another custom property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "custom_property");
      expect(result).toBe("Custom Value");
    });

    it("should return undefined for non-existent property", () => {
      const result = MetadataHelpers.getPropertyValue(mockRelation, "non_existent");
      expect(result).toBeUndefined();
    });

    it("should handle relation without metadata", () => {
      const relationWithoutMetadata = {
        title: "Title",
        created: 123,
        modified: 456,
        path: "path.md",
      };

      const result = MetadataHelpers.getPropertyValue(relationWithoutMetadata, "exo__Asset_label");
      expect(result).toBeUndefined();
    });

    it("should handle empty metadata object", () => {
      const relationEmptyMetadata = {
        title: "Title",
        created: 123,
        modified: 456,
        path: "path.md",
        metadata: {},
      };

      const result = MetadataHelpers.getPropertyValue(relationEmptyMetadata, "custom_property");
      expect(result).toBeUndefined();
    });

    it("should handle null metadata value", () => {
      const relationNullValue = {
        title: "Title",
        created: 123,
        modified: 456,
        path: "path.md",
        metadata: {
          "null_property": null,
        },
      };

      const result = MetadataHelpers.getPropertyValue(relationNullValue, "null_property");
      expect(result).toBeNull();
    });

    it("should preserve falsy values from metadata", () => {
      const relationFalsyValues = {
        title: "Title",
        created: 123,
        modified: 456,
        path: "path.md",
        metadata: {
          "zero": 0,
          "false": false,
          "empty": "",
        },
      };

      expect(MetadataHelpers.getPropertyValue(relationFalsyValues, "zero")).toBe(0);
      expect(MetadataHelpers.getPropertyValue(relationFalsyValues, "false")).toBe(false);
      expect(MetadataHelpers.getPropertyValue(relationFalsyValues, "empty")).toBe("");
    });
  });

  describe("integration scenarios", () => {
    it("should work together for finding and checking archived properties", () => {
      const metadata = {
        "ems__Effort_parent": "[[ParentTask]]",
        "archived": true,
        "exo__Asset_label": "Archived Task",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(metadata, "ParentTask");
      const isArchived = MetadataHelpers.isAssetArchived(metadata);

      expect(properties).toEqual(["ems__Effort_parent"]);
      expect(isArchived).toBe(true);
    });

    it("should handle complex metadata with multiple references", () => {
      const metadata = {
        "ems__Effort_parent": "[[Task1]]",
        "ems__Task_blocks": ["[[Task2]]", "[[Task3]]", "[[Task1]]"],
        "archived": "yes",
      };

      const propertiesTask1 = MetadataHelpers.findAllReferencingProperties(metadata, "Task1");
      const propertiesTask2 = MetadataHelpers.findAllReferencingProperties(metadata, "Task2");

      expect(propertiesTask1).toEqual(["ems__Effort_parent", "ems__Task_blocks"]);
      expect(propertiesTask2).toEqual(["ems__Task_blocks"]);
      expect(MetadataHelpers.isAssetArchived(metadata)).toBe(true);
    });
  });
});
