/**
 * FrontmatterService Test Suite
 *
 * Tests for centralized YAML frontmatter manipulation service.
 * Validates DRY principle adherence and edge case handling.
 *
 * @module tests/infrastructure/services
 */

import { FrontmatterService } from "../../../src/infrastructure/services/FrontmatterService";

describe("FrontmatterService", () => {
  let service: FrontmatterService;

  beforeEach(() => {
    service = new FrontmatterService();
  });

  describe("parse", () => {
    it("should parse existing frontmatter", () => {
      // Arrange
      const content = "---\nfoo: bar\nstatus: draft\n---\nBody content";

      // Act
      const result = service.parse(content);

      // Assert
      expect(result.exists).toBe(true);
      expect(result.content).toBe("foo: bar\nstatus: draft");
      expect(result.originalContent).toBe(content);
    });

    it("should handle content without frontmatter", () => {
      // Arrange
      const content = "Just body content without frontmatter";

      // Act
      const result = service.parse(content);

      // Assert
      expect(result.exists).toBe(false);
      expect(result.content).toBe("");
      expect(result.originalContent).toBe(content);
    });

    it("should handle empty content", () => {
      // Arrange
      const content = "";

      // Act
      const result = service.parse(content);

      // Assert
      expect(result.exists).toBe(false);
      expect(result.content).toBe("");
    });

    it("should handle multiline frontmatter values", () => {
      // Arrange
      const content = `---
title: My Title
description: |
  Line 1
  Line 2
---
Body`;

      // Act
      const result = service.parse(content);

      // Assert
      expect(result.exists).toBe(true);
      expect(result.content).toContain("title: My Title");
      expect(result.content).toContain("description: |");
    });
  });

  describe("updateProperty", () => {
    it("should update existing property value", () => {
      // Arrange
      const content = "---\nstatus: draft\n---\nBody";

      // Act
      const result = service.updateProperty(content, "status", "published");

      // Assert
      expect(result).toBe("---\nstatus: published\n---\nBody");
    });

    it("should add new property to existing frontmatter", () => {
      // Arrange
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.updateProperty(content, "status", "draft");

      // Assert
      expect(result).toBe("---\nfoo: bar\nstatus: draft\n---\nBody");
    });

    it("should create frontmatter when missing", () => {
      // Arrange
      const content = "Body content";

      // Act
      const result = service.updateProperty(content, "status", "draft");

      // Assert
      expect(result).toBe("---\nstatus: draft\n---\nBody content");
    });

    it("should handle complex property values with quotes", () => {
      // Arrange
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.updateProperty(
        content,
        "ems__Effort_status",
        '"[[ems__EffortStatusDraft]]"',
      );

      // Assert
      expect(result).toContain(
        'ems__Effort_status: "[[ems__EffortStatusDraft]]"',
      );
    });

    it("should handle property names with special characters", () => {
      // Arrange
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.updateProperty(
        content,
        "ems__Effort_status",
        "value",
      );

      // Assert
      expect(result).toContain("ems__Effort_status: value");
    });

    it("should preserve other properties when updating", () => {
      // Arrange
      const content = "---\nfoo: bar\nstatus: draft\nbaz: qux\n---\nBody";

      // Act
      const result = service.updateProperty(content, "status", "published");

      // Assert
      expect(result).toContain("foo: bar");
      expect(result).toContain("status: published");
      expect(result).toContain("baz: qux");
    });

    it("should handle empty frontmatter", () => {
      // Arrange
      const content = "---\n\n---\nBody";

      // Act
      const result = service.updateProperty(content, "status", "draft");

      // Assert
      expect(result).toBe("---\nstatus: draft\n---\nBody");
    });
  });

  describe("addProperty", () => {
    it("should add property using updateProperty", () => {
      // Arrange
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.addProperty(content, "new_prop", "value");

      // Assert
      expect(result).toContain("new_prop: value");
    });
  });

  describe("removeProperty", () => {
    it("should remove existing property", () => {
      // Arrange
      const content = "---\nfoo: bar\nstatus: draft\n---\nBody";

      // Act
      const result = service.removeProperty(content, "status");

      // Assert
      expect(result).toBe("---\nfoo: bar\n---\nBody");
      expect(result).not.toContain("status");
    });

    it("should handle removing non-existent property", () => {
      // Arrange
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.removeProperty(content, "nonexistent");

      // Assert
      expect(result).toBe(content);
    });

    it("should handle content without frontmatter", () => {
      // Arrange
      const content = "Body content";

      // Act
      const result = service.removeProperty(content, "status");

      // Assert
      expect(result).toBe(content);
    });

    it("should handle property names with special characters", () => {
      // Arrange
      const content = "---\nems__Effort_status: draft\nfoo: bar\n---\nBody";

      // Act
      const result = service.removeProperty(content, "ems__Effort_status");

      // Assert
      expect(result).not.toContain("ems__Effort_status");
      expect(result).toContain("foo: bar");
    });

    it("should remove property with complex value", () => {
      // Arrange
      const content =
        '---\nfoo: bar\nstatus: "[[StatusDraft]]"\nbaz: qux\n---\nBody';

      // Act
      const result = service.removeProperty(content, "status");

      // Assert
      expect(result).not.toContain("status");
      expect(result).toContain("foo: bar");
      expect(result).toContain("baz: qux");
    });
  });

  describe("hasProperty", () => {
    it("should return true for existing property", () => {
      // Arrange
      const frontmatter = "foo: bar\nstatus: draft";

      // Act
      const result = service.hasProperty(frontmatter, "status");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for non-existent property", () => {
      // Arrange
      const frontmatter = "foo: bar";

      // Act
      const result = service.hasProperty(frontmatter, "status");

      // Assert
      expect(result).toBe(false);
    });

    it("should handle property names with special characters", () => {
      // Arrange
      const frontmatter = "ems__Effort_status: draft";

      // Act
      const result = service.hasProperty(frontmatter, "ems__Effort_status");

      // Assert
      expect(result).toBe(true);
    });

    it("should not match partial property names", () => {
      // Arrange
      const frontmatter = "status_draft: value";

      // Act
      const result = service.hasProperty(frontmatter, "status");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("createFrontmatter", () => {
    it("should create frontmatter block with single property", () => {
      // Arrange
      const content = "Body content";
      const properties = { status: "draft" };

      // Act
      const result = service.createFrontmatter(content, properties);

      // Assert
      expect(result).toBe("---\nstatus: draft\n---\nBody content");
    });

    it("should create frontmatter block with multiple properties", () => {
      // Arrange
      const content = "Body content";
      const properties = { status: "draft", priority: "high", version: 1 };

      // Act
      const result = service.createFrontmatter(content, properties);

      // Assert
      expect(result).toContain("---\n");
      expect(result).toContain("status: draft");
      expect(result).toContain("priority: high");
      expect(result).toContain("version: 1");
      expect(result).toContain("\n---\nBody content");
    });

    it("should handle empty properties object", () => {
      // Arrange
      const content = "Body content";
      const properties = {};

      // Act
      const result = service.createFrontmatter(content, properties);

      // Assert
      expect(result).toBe("---\n\n---\nBody content");
    });

    it("should preserve content that starts with newline", () => {
      // Arrange
      const content = "\nBody content";
      const properties = { status: "draft" };

      // Act
      const result = service.createFrontmatter(content, properties);

      // Assert
      expect(result).toBe("---\nstatus: draft\n---\nBody content");
    });

    it("should handle complex property values", () => {
      // Arrange
      const content = "Body";
      const properties = {
        status: '"[[StatusDraft]]"',
        array: "[1, 2, 3]",
      };

      // Act
      const result = service.createFrontmatter(content, properties);

      // Assert
      expect(result).toContain('status: "[[StatusDraft]]"');
      expect(result).toContain("array: [1, 2, 3]");
    });
  });

  describe("getPropertyValue", () => {
    it("should get value of existing property", () => {
      // Arrange
      const frontmatter = "foo: bar\nstatus: draft\nbaz: qux";

      // Act
      const result = service.getPropertyValue(frontmatter, "status");

      // Assert
      expect(result).toBe("draft");
    });

    it("should return null for non-existent property", () => {
      // Arrange
      const frontmatter = "foo: bar";

      // Act
      const result = service.getPropertyValue(frontmatter, "status");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle property with quoted value", () => {
      // Arrange
      const frontmatter = 'status: "[[StatusDraft]]"';

      // Act
      const result = service.getPropertyValue(frontmatter, "status");

      // Assert
      expect(result).toBe('"[[StatusDraft]]"');
    });

    it("should handle property with spaces in value", () => {
      // Arrange
      const frontmatter = "title: My Cool Title";

      // Act
      const result = service.getPropertyValue(frontmatter, "title");

      // Assert
      expect(result).toBe("My Cool Title");
    });

    it("should trim whitespace from value", () => {
      // Arrange
      const frontmatter = "status:   draft   ";

      // Act
      const result = service.getPropertyValue(frontmatter, "status");

      // Assert
      expect(result).toBe("draft");
    });

    it("should handle property names with special characters", () => {
      // Arrange
      const frontmatter = "ems__Effort_status: doing";

      // Act
      const result = service.getPropertyValue(
        frontmatter,
        "ems__Effort_status",
      );

      // Assert
      expect(result).toBe("doing");
    });
  });

  describe("Integration: Real-world scenarios", () => {
    it("should handle TaskStatusService use case: update status", () => {
      // Arrange
      const content = `---
ems__Effort_status: "[[ems__EffortStatusDraft]]"
ems__Effort_created: 2025-10-24T10:00:00
---
# Task Description`;

      // Act - simulate moving to backlog
      const result = service.updateProperty(
        content,
        "ems__Effort_status",
        '"[[ems__EffortStatusBacklog]]"',
      );

      // Assert
      expect(result).toContain(
        'ems__Effort_status: "[[ems__EffortStatusBacklog]]"',
      );
      expect(result).toContain("ems__Effort_created: 2025-10-24T10:00:00");
      expect(result).toContain("# Task Description");
    });

    it("should handle TaskCreationService use case: create task frontmatter", () => {
      // Arrange
      const content = "# Task Title\n\nTask body content";
      const properties = {
        ems__Effort_status: '"[[ems__EffortStatusDraft]]"',
        ems__Effort_created: "2025-10-24T10:00:00",
        ems__Effort_area: '"[[MyArea]]"',
      };

      // Act
      const result = service.createFrontmatter(content, properties);

      // Assert
      expect(result).toContain(
        'ems__Effort_status: "[[ems__EffortStatusDraft]]"',
      );
      expect(result).toContain("ems__Effort_created: 2025-10-24T10:00:00");
      expect(result).toContain('ems__Effort_area: "[[MyArea]]"');
      expect(result).toContain("# Task Title");
    });

    it("should handle status rollback: remove status property", () => {
      // Arrange
      const content = `---
ems__Effort_status: "[[ems__EffortStatusDoing]]"
ems__Effort_created: 2025-10-24T10:00:00
ems__Effort_day: "[[2025-10-24]]"
---
Body`;

      // Act
      const result = service.removeProperty(content, "ems__Effort_status");

      // Assert
      expect(result).not.toContain("ems__Effort_status");
      expect(result).toContain("ems__Effort_created");
      expect(result).toContain("ems__Effort_day");
    });

    it("should handle multiple sequential updates", () => {
      // Arrange
      let content = "Body";

      // Act - simulate workflow: draft -> backlog -> analysis -> doing
      content = service.updateProperty(
        content,
        "ems__Effort_status",
        '"[[ems__EffortStatusDraft]]"',
      );
      content = service.updateProperty(
        content,
        "ems__Effort_status",
        '"[[ems__EffortStatusBacklog]]"',
      );
      content = service.updateProperty(
        content,
        "ems__Effort_status",
        '"[[ems__EffortStatusAnalysis]]"',
      );
      content = service.updateProperty(
        content,
        "ems__Effort_status",
        '"[[ems__EffortStatusDoing]]"',
      );

      // Assert
      expect(content).toContain(
        'ems__Effort_status: "[[ems__EffortStatusDoing]]"',
      );
      // Should only have one status line
      const statusMatches = content.match(/ems__Effort_status:/g);
      expect(statusMatches).toHaveLength(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle frontmatter with only delimiters", () => {
      // Arrange - Use valid empty frontmatter format (---\n\n---)
      const content = "---\n\n---\nBody";

      // Act
      const result = service.updateProperty(content, "status", "draft");

      // Assert
      expect(result).toBe("---\nstatus: draft\n---\nBody");
    });

    it("should handle content with multiple --- sequences", () => {
      // Arrange - only first --- pair should be frontmatter
      const content = "---\nfoo: bar\n---\nBody with --- separator";

      // Act
      const result = service.updateProperty(content, "status", "draft");

      // Assert
      expect(result).toContain("foo: bar");
      expect(result).toContain("status: draft");
      expect(result).toContain("Body with --- separator");
    });

    it("should handle property value with colon", () => {
      // Arrange
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.updateProperty(
        content,
        "url",
        "https://example.com",
      );

      // Assert
      expect(result).toContain("url: https://example.com");
    });

    it("should handle very long property values", () => {
      // Arrange
      const longValue = "a".repeat(1000);
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.updateProperty(content, "long_prop", longValue);

      // Assert
      expect(result).toContain(`long_prop: ${longValue}`);
    });

    it("should handle Unicode characters in property values", () => {
      // Arrange
      const content = "---\nfoo: bar\n---\nBody";

      // Act
      const result = service.updateProperty(content, "title", "Задача 🚀");

      // Assert
      expect(result).toContain("title: Задача 🚀");
    });
  });
});
