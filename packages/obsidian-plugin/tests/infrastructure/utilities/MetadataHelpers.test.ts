import { MetadataHelpers } from "../../../src/infrastructure/utilities/MetadataHelpers";

describe("MetadataHelpers", () => {
  describe("findAllReferencingProperties", () => {
    it("should find single property referencing file", () => {
      const metadata = {
        ems__Effort_parent: "[[ParentTask]]",
        exo__Asset_label: "Task Label",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "ParentTask",
      );
      expect(properties).toEqual(["ems__Effort_parent"]);
    });

    it("should find multiple properties referencing same file", () => {
      const metadata = {
        ems__Effort_parent: "[[Task123]]",
        exo__Asset_prototype: "[[Task123]]",
        exo__Asset_label: "Some Label",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "Task123",
      );
      expect(properties).toEqual([
        "ems__Effort_parent",
        "exo__Asset_prototype",
      ]);
    });

    it("should find references in arrays", () => {
      const metadata = {
        ems__Task_blocks: ["[[Task1]]", "[[Task2]]", "[[Task3]]"],
        exo__Asset_label: "Blocker",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "Task2",
      );
      expect(properties).toEqual(["ems__Task_blocks"]);
    });

    it("should return empty array when no references found", () => {
      const metadata = {
        exo__Asset_label: "No References",
        ems__Effort_status: "ems__EffortStatusDoing",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "NonExistent",
      );
      expect(properties).toEqual([]);
    });

    it("should handle references without brackets", () => {
      const metadata = {
        exo__Asset_isDefinedBy: "SomeArea",
        exo__Asset_label: "Label",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "SomeArea",
      );
      expect(properties).toEqual(["exo__Asset_isDefinedBy"]);
    });

    it("should handle file names with .md extension", () => {
      const metadata = {
        ems__Effort_parent: "[[ParentTask.md]]",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "ParentTask.md",
      );
      expect(properties).toEqual(["ems__Effort_parent"]);
    });

    it("should handle empty metadata", () => {
      const properties = MetadataHelpers.findAllReferencingProperties(
        {},
        "Task",
      );
      expect(properties).toEqual([]);
    });
  });

  describe("findReferencingProperty", () => {
    it("should find first property referencing file", () => {
      const metadata = {
        ems__Effort_parent: "[[ParentTask]]",
        exo__Asset_label: "Task Label",
      };

      const property = MetadataHelpers.findReferencingProperty(
        metadata,
        "ParentTask",
      );
      expect(property).toBe("ems__Effort_parent");
    });

    it("should return first matching property when multiple match", () => {
      const metadata = {
        ems__Effort_parent: "[[Task123]]",
        exo__Asset_prototype: "[[Task123]]",
      };

      const property = MetadataHelpers.findReferencingProperty(
        metadata,
        "Task123",
      );
      expect(property).toBeDefined();
      expect(["ems__Effort_parent", "exo__Asset_prototype"]).toContain(
        property,
      );
    });

    it("should return undefined when no reference found", () => {
      const metadata = {
        exo__Asset_label: "No References",
      };

      const property = MetadataHelpers.findReferencingProperty(
        metadata,
        "NonExistent",
      );
      expect(property).toBeUndefined();
    });

    it("should find references in arrays", () => {
      const metadata = {
        ems__Task_blocks: ["[[Task1]]", "[[Task2]]"],
      };

      const property = MetadataHelpers.findReferencingProperty(
        metadata,
        "Task2",
      );
      expect(property).toBe("ems__Task_blocks");
    });

    it("should handle empty metadata", () => {
      const property = MetadataHelpers.findReferencingProperty({}, "Task");
      expect(property).toBeUndefined();
    });
  });

  describe("containsReference", () => {
    it("should detect wikilink reference", () => {
      const result = MetadataHelpers.containsReference(
        "[[TaskName]]",
        "TaskName",
      );
      expect(result).toBe(true);
    });

    it("should detect plain text reference", () => {
      const result = MetadataHelpers.containsReference("TaskName", "TaskName");
      expect(result).toBe(true);
    });

    it("should detect reference in string with .md extension", () => {
      const result = MetadataHelpers.containsReference(
        "[[TaskName]]",
        "TaskName.md",
      );
      expect(result).toBe(true);
    });

    it("should detect reference in array", () => {
      const result = MetadataHelpers.containsReference(
        ["[[Task1]]", "[[Task2]]"],
        "Task2",
      );
      expect(result).toBe(true);
    });

    it("should detect nested references in arrays", () => {
      const result = MetadataHelpers.containsReference(
        [["[[Task1]]"], "Other"],
        "Task1",
      );
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
      const result = MetadataHelpers.containsReference(
        "[[OtherTask]]",
        "TaskName",
      );
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
      const result = MetadataHelpers.containsReference(
        "This contains TaskName in text",
        "TaskName",
      );
      expect(result).toBe(true);
    });

    it("should handle complex array structures", () => {
      const result = MetadataHelpers.containsReference(
        [null, "[[Task1]]", undefined, "Other", "[[Task2]]"],
        "Task2",
      );
      expect(result).toBe(true);
    });
  });

  describe("isAssetArchived", () => {
    it("should return true for legacy exo__Asset_isArchived field", () => {
      const result = MetadataHelpers.isAssetArchived({
        exo__Asset_isArchived: true,
      });
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
      expect(MetadataHelpers.isAssetArchived({ archived: "False" })).toBe(
        false,
      );
    });

    it("should handle strings with whitespace", () => {
      expect(MetadataHelpers.isAssetArchived({ archived: " true " })).toBe(
        true,
      );
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
      const result = MetadataHelpers.isAssetArchived({
        exo__Asset_label: "Test",
      });
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
      expect(MetadataHelpers.isAssetArchived({ archived: "maybe" })).toBe(
        false,
      );
      expect(MetadataHelpers.isAssetArchived({ archived: "archived" })).toBe(
        false,
      );
    });
  });

  describe("getPropertyValue", () => {
    const mockRelation = {
      title: "Test Title",
      created: 1234567890,
      modified: 1234567900,
      path: "test/path.md",
      metadata: {
        exo__Asset_label: "Test Label",
        ems__Effort_status: "ems__EffortStatusDoing",
        custom_property: "Custom Value",
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
      const result = MetadataHelpers.getPropertyValue(
        mockRelation,
        "exo__Asset_label",
      );
      expect(result).toBe("Test Label");
    });

    it("should return metadata value for another custom property", () => {
      const result = MetadataHelpers.getPropertyValue(
        mockRelation,
        "custom_property",
      );
      expect(result).toBe("Custom Value");
    });

    it("should return undefined for non-existent property", () => {
      const result = MetadataHelpers.getPropertyValue(
        mockRelation,
        "non_existent",
      );
      expect(result).toBeUndefined();
    });

    it("should handle relation without metadata", () => {
      const relationWithoutMetadata = {
        title: "Title",
        created: 123,
        modified: 456,
        path: "path.md",
      };

      const result = MetadataHelpers.getPropertyValue(
        relationWithoutMetadata,
        "exo__Asset_label",
      );
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

      const result = MetadataHelpers.getPropertyValue(
        relationEmptyMetadata,
        "custom_property",
      );
      expect(result).toBeUndefined();
    });

    it("should handle null metadata value", () => {
      const relationNullValue = {
        title: "Title",
        created: 123,
        modified: 456,
        path: "path.md",
        metadata: {
          null_property: null,
        },
      };

      const result = MetadataHelpers.getPropertyValue(
        relationNullValue,
        "null_property",
      );
      expect(result).toBeNull();
    });

    it("should preserve falsy values from metadata", () => {
      const relationFalsyValues = {
        title: "Title",
        created: 123,
        modified: 456,
        path: "path.md",
        metadata: {
          zero: 0,
          false: false,
          empty: "",
        },
      };

      expect(
        MetadataHelpers.getPropertyValue(relationFalsyValues, "zero"),
      ).toBe(0);
      expect(
        MetadataHelpers.getPropertyValue(relationFalsyValues, "false"),
      ).toBe(false);
      expect(
        MetadataHelpers.getPropertyValue(relationFalsyValues, "empty"),
      ).toBe("");
    });
  });

  describe("ensureQuoted", () => {
    it("should add quotes if missing", () => {
      const result = MetadataHelpers.ensureQuoted("value");
      expect(result).toBe('"value"');
    });

    it("should preserve existing quotes", () => {
      const result = MetadataHelpers.ensureQuoted('"value"');
      expect(result).toBe('"value"');
    });

    it("should handle empty string", () => {
      const result = MetadataHelpers.ensureQuoted("");
      expect(result).toBe('""');
    });

    it("should handle special case empty quoted string", () => {
      const result = MetadataHelpers.ensureQuoted('""');
      expect(result).toBe('""');
    });

    it("should handle value with only opening quote", () => {
      const result = MetadataHelpers.ensureQuoted('"value');
      expect(result).toBe('""value"');
    });

    it("should handle value with only closing quote", () => {
      const result = MetadataHelpers.ensureQuoted('value"');
      expect(result).toBe('"value""');
    });

    it("should handle value with quotes in middle", () => {
      const result = MetadataHelpers.ensureQuoted('val"ue');
      expect(result).toBe('"val"ue"');
    });

    it("should handle value with multiple quotes", () => {
      const result = MetadataHelpers.ensureQuoted('""value""');
      expect(result).toBe('""value""');
    });

    it("should handle whitespace", () => {
      const result = MetadataHelpers.ensureQuoted("  value  ");
      expect(result).toBe('"  value  "');
    });

    it("should handle wikilink", () => {
      const result = MetadataHelpers.ensureQuoted("[[TaskName]]");
      expect(result).toBe('"[[TaskName]]"');
    });

    it("should handle already quoted wikilink", () => {
      const result = MetadataHelpers.ensureQuoted('"[[TaskName]]"');
      expect(result).toBe('"[[TaskName]]"');
    });
  });

  describe("buildFileContent", () => {
    it("should build with frontmatter and body", () => {
      const frontmatter = {
        exo__Asset_label: "Test Task",
        ems__Effort_status: "ems__EffortStatusDoing",
      };
      const body = "This is the task description.";

      const result = MetadataHelpers.buildFileContent(frontmatter, body);

      expect(result).toContain("---");
      expect(result).toContain("exo__Asset_label: Test Task");
      expect(result).toContain("ems__Effort_status: ems__EffortStatusDoing");
      expect(result).toContain("This is the task description.");
    });

    it("should build with frontmatter only", () => {
      const frontmatter = {
        exo__Asset_label: "Test Task",
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toMatch(/^---\nexo__Asset_label: Test Task\n---\n\n$/);
    });

    it("should format frontmatter correctly", () => {
      const frontmatter = {
        title: "Test",
        archived: true,
        votes: 5,
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain("title: Test");
      expect(result).toContain("archived: true");
      expect(result).toContain("votes: 5");
    });

    it("should preserve body content", () => {
      const frontmatter = { title: "Test" };
      const body = "Line 1\nLine 2\nLine 3";

      const result = MetadataHelpers.buildFileContent(frontmatter, body);

      expect(result).toContain("Line 1\nLine 2\nLine 3");
    });

    it("should handle empty body", () => {
      const frontmatter = { title: "Test" };
      const body = "";

      const result = MetadataHelpers.buildFileContent(frontmatter, body);

      expect(result).toMatch(/^---\ntitle: Test\n---\n\n$/);
    });

    it("should handle complex frontmatter objects", () => {
      const frontmatter = {
        string: "value",
        number: 42,
        boolean: true,
        null: null,
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain("string: value");
      expect(result).toContain("number: 42");
      expect(result).toContain("boolean: true");
      expect(result).toContain("null: null");
    });

    it("should handle array properties", () => {
      const frontmatter = {
        tags: ["tag1", "tag2", "tag3"],
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain("tags:");
      expect(result).toContain("  - tag1");
      expect(result).toContain("  - tag2");
      expect(result).toContain("  - tag3");
    });

    it("should handle mixed scalar and array properties", () => {
      const frontmatter = {
        title: "Test",
        tags: ["tag1", "tag2"],
        archived: false,
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain("title: Test");
      expect(result).toContain("tags:");
      expect(result).toContain("  - tag1");
      expect(result).toContain("  - tag2");
      expect(result).toContain("archived: false");
    });

    it("should handle empty array", () => {
      const frontmatter = {
        tags: [],
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain("tags:");
    });

    it("should handle array with wikilinks", () => {
      const frontmatter = {
        blocks: ["[[Task1]]", "[[Task2]]"],
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain("blocks:");
      expect(result).toContain("  - [[Task1]]");
      expect(result).toContain("  - [[Task2]]");
    });

    it("should handle body with frontmatter delimiters", () => {
      const frontmatter = { title: "Test" };
      const body = "Some content\n---\nMore content";

      const result = MetadataHelpers.buildFileContent(frontmatter, body);

      expect(result).toContain("Some content\n---\nMore content");
    });

    it("should handle special characters in values", () => {
      const frontmatter = {
        description: "Test: with special & characters!",
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain("description: Test: with special & characters!");
    });

    it("should handle multiline body", () => {
      const frontmatter = { title: "Test" };
      const body = "Line 1\n\nLine 2\n\nLine 3";

      const result = MetadataHelpers.buildFileContent(frontmatter, body);

      const lines = result.split("\n");
      expect(lines[lines.length - 2]).toBe("Line 3");
    });

    it("should format correctly for file writing", () => {
      const frontmatter = {
        exo__Asset_label: "Test Task",
        ems__Effort_status: "ems__EffortStatusDoing",
      };
      const body = "Task description";

      const result = MetadataHelpers.buildFileContent(frontmatter, body);

      expect(result.startsWith("---\n")).toBe(true);
      expect(result).toContain("\n---\n");
      expect(result.endsWith("Task description\n")).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("should work together for finding and checking archived properties", () => {
      const metadata = {
        ems__Effort_parent: "[[ParentTask]]",
        archived: true,
        exo__Asset_label: "Archived Task",
      };

      const properties = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "ParentTask",
      );
      const isArchived = MetadataHelpers.isAssetArchived(metadata);

      expect(properties).toEqual(["ems__Effort_parent"]);
      expect(isArchived).toBe(true);
    });

    it("should handle complex metadata with multiple references", () => {
      const metadata = {
        ems__Effort_parent: "[[Task1]]",
        ems__Task_blocks: ["[[Task2]]", "[[Task3]]", "[[Task1]]"],
        archived: "yes",
      };

      const propertiesTask1 = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "Task1",
      );
      const propertiesTask2 = MetadataHelpers.findAllReferencingProperties(
        metadata,
        "Task2",
      );

      expect(propertiesTask1).toEqual([
        "ems__Effort_parent",
        "ems__Task_blocks",
      ]);
      expect(propertiesTask2).toEqual(["ems__Task_blocks"]);
      expect(MetadataHelpers.isAssetArchived(metadata)).toBe(true);
    });

    it("should build file content with ensured quoted values", () => {
      const frontmatter = {
        exo__Asset_label: MetadataHelpers.ensureQuoted("Test Task"),
        exo__Asset_isDefinedBy: MetadataHelpers.ensureQuoted("[[SomeArea]]"),
      };

      const result = MetadataHelpers.buildFileContent(frontmatter);

      expect(result).toContain('exo__Asset_label: "Test Task"');
      expect(result).toContain('exo__Asset_isDefinedBy: "[[SomeArea]]"');
    });
  });
});
