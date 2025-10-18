/**
 * Unit tests for TaskCreationService
 * Tests frontmatter generation, file naming, and UUID/timestamp formats
 */

import { TaskCreationService } from "../../src/infrastructure/services/TaskCreationService";

describe("TaskCreationService", () => {
  let service: TaskCreationService;
  let mockVault: any;

  beforeEach(() => {
    mockVault = {
      create: jest.fn().mockResolvedValue({ path: "test-task.md" }),
    };
    service = new TaskCreationService(mockVault);
  });

  describe("generateTaskFrontmatter", () => {
    it("should generate frontmatter with all required properties for Area", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "My Area",
        "ems__Area",
      );

      expect(frontmatter.exo__Instance_class).toEqual(['"[[ems__Task]]"']);
      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[Ontology/EMS]]"');
      expect(frontmatter.ems__Effort_area).toBe('"[[My Area]]"');
      expect(frontmatter.exo__Asset_uid).toBeDefined();
      expect(frontmatter.exo__Asset_createdAt).toBeDefined();
    });

    it("should generate frontmatter with all required properties for Project", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "My Project",
        "ems__Project",
      );

      expect(frontmatter.exo__Instance_class).toEqual(['"[[ems__Task]]"']);
      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[Ontology/EMS]]"');
      expect(frontmatter.ems__Effort_parent).toBe('"[[My Project]]"');
      expect(frontmatter.exo__Asset_uid).toBeDefined();
      expect(frontmatter.exo__Asset_createdAt).toBeDefined();
    });

    it("should use provided UUID for exo__Asset_uid", () => {
      const testUid = "12345678-1234-4123-8123-123456789abc";
      const frontmatter = service.generateTaskFrontmatter({}, "Test Area", "ems__Area", undefined, testUid);

      expect(frontmatter.exo__Asset_uid).toBe(testUid);
    });

    it("should generate valid UUIDv4 when no UUID provided", () => {
      const frontmatter = service.generateTaskFrontmatter({}, "Test Area", "ems__Area");

      // UUIDv4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where x is any hex digit, y is one of [89ab]
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(frontmatter.exo__Asset_uid).toMatch(uuidPattern);
    });

    it("should generate ISO 8601 timestamp for exo__Asset_createdAt", () => {
      const frontmatter = service.generateTaskFrontmatter({}, "Test Area", "ems__Area");

      // ISO 8601 format without milliseconds: YYYY-MM-DDTHH:MM:SS
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
      expect(frontmatter.exo__Asset_createdAt).toMatch(isoPattern);
    });

    it("should copy exo__Asset_isDefinedBy from source metadata", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Custom/Ontology]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Area",
        "ems__Area",
      );

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[Custom/Ontology]]"');
    });

    it("should handle array format for exo__Asset_isDefinedBy", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: ['"[[!toos]]"'],
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Area",
        "ems__Area",
      );

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[!toos]]"');
    });

    it("should add quotes to exo__Asset_isDefinedBy when missing", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: "[[!toos]]", // Without quotes
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Area",
        "ems__Area",
      );

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[!toos]]"');
    });

    it("should add quotes to array exo__Asset_isDefinedBy when missing", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: ["[[!toos]]"], // Array without quotes
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Area",
        "ems__Area",
      );

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[!toos]]"');
    });

    it("should default to empty quotes when exo__Asset_isDefinedBy is missing", () => {
      const sourceMetadata = {}; // No exo__Asset_isDefinedBy

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Area",
        "ems__Area",
      );

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('""');
    });

    it("should create quoted wiki-link to source Area in ems__Effort_area", () => {
      const frontmatter = service.generateTaskFrontmatter(
        {},
        "Sprint Planning",
        "ems__Area",
      );

      expect(frontmatter.ems__Effort_area).toBe('"[[Sprint Planning]]"');
    });

    it("should create quoted wiki-link to source Project in ems__Effort_parent", () => {
      const frontmatter = service.generateTaskFrontmatter(
        {},
        "Website Redesign",
        "ems__Project",
      );

      expect(frontmatter.ems__Effort_parent).toBe('"[[Website Redesign]]"');
    });

    it("should handle Area names with parentheses", () => {
      const frontmatter = service.generateTaskFrontmatter(
        { exo__Asset_isDefinedBy: '"[[!toos]]"' },
        "Sales Offering People Management (Area)",
        "ems__Area",
      );

      expect(frontmatter.ems__Effort_area).toBe(
        '"[[Sales Offering People Management (Area)]]"',
      );
    });

    it("should handle Project names with parentheses", () => {
      const frontmatter = service.generateTaskFrontmatter(
        { exo__Asset_isDefinedBy: '"[[!toos]]"' },
        "Q4 2025 Planning (Project)",
        "ems__Project",
      );

      expect(frontmatter.ems__Effort_parent).toBe('"[[Q4 2025 Planning (Project)]]"');
    });

    it("should handle wiki-link formatted source class", () => {
      const frontmatter = service.generateTaskFrontmatter(
        {},
        "Test",
        "[[ems__Project]]",
      );

      expect(frontmatter.ems__Effort_parent).toBe('"[[Test]]"');
    });

    it("should maintain property order: isDefinedBy, uid, createdAt, Instance_class, effort property", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Test Project",
        "ems__Project",
      );

      const keys = Object.keys(frontmatter);
      expect(keys).toEqual([
        "exo__Asset_isDefinedBy",
        "exo__Asset_uid",
        "exo__Asset_createdAt",
        "exo__Instance_class",
        "ems__Effort_status",
        "ems__Effort_parent",
      ]);
    });

    it("should include exo__Asset_label when label parameter is provided", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "My Area",
        "ems__Area",
        "Test Label",
      );

      expect(frontmatter.exo__Asset_label).toBe("Test Label");
    });

    it("should NOT include exo__Asset_label when label parameter is empty string", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "My Area",
        "ems__Area",
        "",
      );

      expect(frontmatter.exo__Asset_label).toBeUndefined();
    });

    it("should NOT include exo__Asset_label when label parameter is undefined", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "My Area",
        "ems__Area",
      );

      expect(frontmatter.exo__Asset_label).toBeUndefined();
    });

    it("should trim whitespace from label parameter", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "My Area",
        "ems__Area",
        "  Test Label  ",
      );

      expect(frontmatter.exo__Asset_label).toBe("Test Label");
    });

    it("should NOT include exo__Asset_label when label is only whitespace", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "My Area",
        "ems__Area",
        "   ",
      );

      expect(frontmatter.exo__Asset_label).toBeUndefined();
    });
  });

  describe("buildFileContent", () => {
    it("should generate correct YAML format with array for exo__Instance_class (Area)", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!toos]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Sales Offering People Management (Area)",
        "ems__Area",
      );

      // Access private method through TypeScript any
      const content = (service as any).buildFileContent(frontmatter);

      // Should contain YAML array format with bullet
      expect(content).toContain('exo__Instance_class:\n  - "[[ems__Task]]"');
      // Should contain quoted wiki-links
      expect(content).toContain('exo__Asset_isDefinedBy: "[[!toos]]"');
      expect(content).toContain(
        'ems__Effort_area: "[[Sales Offering People Management (Area)]]"',
      );
      // Should have frontmatter delimiters
      expect(content).toMatch(/^---\n[\s\S]+\n---\n\n$/);
    });

    it("should generate correct YAML format for Project with ems__Effort_parent", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!toos]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Website Redesign (Project)",
        "ems__Project",
      );

      const content = (service as any).buildFileContent(frontmatter);

      expect(content).toContain('exo__Instance_class:\n  - "[[ems__Task]]"');
      expect(content).toContain('exo__Asset_isDefinedBy: "[[!toos]]"');
      expect(content).toContain('ems__Effort_parent: "[[Website Redesign (Project)]]"');
      expect(content).toMatch(/^---\n[\s\S]+\n---\n\n$/);
    });

    it("should handle multiple array items correctly", () => {
      const frontmatter = {
        exo__Instance_class: ['"[[ems__Task]]"', '"[[ems__Effort]]"'],
        exo__Asset_uid: "test-uuid",
      };

      const content = (service as any).buildFileContent(frontmatter);

      expect(content).toContain('exo__Instance_class:\n  - "[[ems__Task]]"\n  - "[[ems__Effort]]"');
    });
  });

  describe("generateTaskFileName (deprecated)", () => {
    it("should generate filename with timestamp format (backward compatibility)", () => {
      const fileName = service.generateTaskFileName();

      // Format: Task-YYYY-MM-DDTHH-MM-SS.md
      const fileNamePattern = /^Task-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/;
      expect(fileName).toMatch(fileNamePattern);
    });

    it("should replace colons with hyphens for filesystem compatibility", () => {
      const fileName = service.generateTaskFileName();

      // Should not contain colons
      expect(fileName).not.toContain(":");
      // Should contain hyphens instead
      expect(fileName).toContain("-");
    });

    it("should end with .md extension", () => {
      const fileName = service.generateTaskFileName();

      expect(fileName.endsWith(".md")).toBe(true);
    });
  });

  describe("createTask", () => {
    it("should create file with UUID-based filename", async () => {
      const mockSourceFile = {
        basename: "Test Area",
        parent: { path: "03 Knowledge/user" },
      } as any;

      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!user]]"',
      };

      await service.createTask(mockSourceFile, sourceMetadata, "ems__Area");

      expect(mockVault.create).toHaveBeenCalledTimes(1);
      const [filePath] = mockVault.create.mock.calls[0];

      // Should match: 03 Knowledge/user/{uuid}.md
      expect(filePath).toMatch(/^03 Knowledge\/user\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.md$/);
    });

    it("should use same UUID for filename and exo__Asset_uid", async () => {
      const mockSourceFile = {
        basename: "Test Area",
        parent: { path: "03 Knowledge/user" },
      } as any;

      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!user]]"',
      };

      await service.createTask(mockSourceFile, sourceMetadata, "ems__Area");

      const [filePath, content] = mockVault.create.mock.calls[0];

      // Extract UUID from filepath
      const filenameMatch = filePath.match(/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.md$/);
      expect(filenameMatch).not.toBeNull();
      const filenameUid = filenameMatch![1];

      // Extract UUID from frontmatter
      const uidMatch = content.match(/exo__Asset_uid: ([0-9a-f-]+)/);
      expect(uidMatch).not.toBeNull();
      const frontmatterUid = uidMatch![1];

      // They should match
      expect(filenameUid).toBe(frontmatterUid);
    });

    it("should copy Algorithm section when creating from TaskPrototype", async () => {
      const prototypeContent = `---
exo__Asset_isDefinedBy: "[[!toos]]"
---

## Description

Task prototype description here.

## Algorithm

Step 1: Do something
Step 2: Do something else
Step 3: Finish

## Notes

Some additional notes.`;

      mockVault.read = jest.fn().mockResolvedValue(prototypeContent);

      const mockSourceFile = {
        basename: "Test Prototype",
        parent: { path: "03 Knowledge/user" },
      } as any;

      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!toos]]"',
      };

      await service.createTask(mockSourceFile, sourceMetadata, "ems__TaskPrototype");

      const [, content] = mockVault.create.mock.calls[0];

      // Should contain Algorithm section
      expect(content).toContain("## Algorithm");
      expect(content).toContain("Step 1: Do something");
      expect(content).toContain("Step 2: Do something else");
      expect(content).toContain("Step 3: Finish");
      // Should NOT contain Description or Notes sections
      expect(content).not.toContain("## Description");
      expect(content).not.toContain("## Notes");
    });

    it("should NOT copy Algorithm section when creating from Area", async () => {
      const mockSourceFile = {
        basename: "Test Area",
        parent: { path: "03 Knowledge/user" },
      } as any;

      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!user]]"',
      };

      await service.createTask(mockSourceFile, sourceMetadata, "ems__Area");

      const [, content] = mockVault.create.mock.calls[0];

      // Should NOT contain Algorithm section
      expect(content).not.toContain("## Algorithm");
      // Should end with empty line after frontmatter
      expect(content).toMatch(/---\n\n$/);
    });

    it("should handle TaskPrototype without Algorithm section gracefully", async () => {
      const prototypeContent = `---
exo__Asset_isDefinedBy: "[[!toos]]"
---

## Description

Task prototype without algorithm.`;

      mockVault.read = jest.fn().mockResolvedValue(prototypeContent);

      const mockSourceFile = {
        basename: "Test Prototype",
        parent: { path: "03 Knowledge/user" },
      } as any;

      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!toos]]"',
      };

      await service.createTask(mockSourceFile, sourceMetadata, "ems__TaskPrototype");

      const [, content] = mockVault.create.mock.calls[0];

      // Should NOT contain Algorithm section since source doesn't have it
      expect(content).not.toContain("## Algorithm");
      expect(content).toMatch(/---\n\n$/);
    });
  });

  describe("extractH2Section", () => {
    it("should extract content between H2 headings", () => {
      const markdown = `## First Section

Content of first section.

## Second Section

Content of second section.
Multiple lines here.

## Third Section

Content of third section.`;

      const result = (service as any).extractH2Section(markdown, "Second Section");

      expect(result).toBe("Content of second section.\nMultiple lines here.");
    });

    it("should extract content when H2 is followed by H1", () => {
      const markdown = `## Algorithm

Step 1: First step
Step 2: Second step

# Main Heading

Other content.`;

      const result = (service as any).extractH2Section(markdown, "Algorithm");

      expect(result).toBe("Step 1: First step\nStep 2: Second step");
    });

    it("should return null when section not found", () => {
      const markdown = `## First Section

Content here.

## Second Section

More content.`;

      const result = (service as any).extractH2Section(markdown, "Missing Section");

      expect(result).toBeNull();
    });

    it("should return null when section is empty", () => {
      const markdown = `## Algorithm

## Next Section

Content here.`;

      const result = (service as any).extractH2Section(markdown, "Algorithm");

      expect(result).toBeNull();
    });

    it("should handle section at end of document", () => {
      const markdown = `## First Section

Some content.

## Algorithm

Final step 1
Final step 2`;

      const result = (service as any).extractH2Section(markdown, "Algorithm");

      expect(result).toBe("Final step 1\nFinal step 2");
    });

    it("should trim whitespace from extracted content", () => {
      const markdown = `## Algorithm



Step with spaces


## Next Section`;

      const result = (service as any).extractH2Section(markdown, "Algorithm");

      expect(result).toBe("Step with spaces");
    });
  });
});
