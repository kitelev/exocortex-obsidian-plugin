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
    it("should generate frontmatter with all required properties", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Ontology/EMS]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(sourceMetadata, "My Area");

      expect(frontmatter.exo__Instance_class).toEqual(['"[[ems__Task]]"']);
      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[Ontology/EMS]]"');
      expect(frontmatter.exo__Effort_area).toBe('"[[My Area]]"');
      expect(frontmatter.exo__Asset_uid).toBeDefined();
      expect(frontmatter.exo__Asset_createdAt).toBeDefined();
    });

    it("should generate valid UUIDv4 for exo__Asset_uid", () => {
      const frontmatter = service.generateTaskFrontmatter({}, "Test Area");

      // UUIDv4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where x is any hex digit, y is one of [89ab]
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(frontmatter.exo__Asset_uid).toMatch(uuidPattern);
    });

    it("should generate ISO 8601 timestamp for exo__Asset_createdAt", () => {
      const frontmatter = service.generateTaskFrontmatter({}, "Test Area");

      // ISO 8601 format without milliseconds: YYYY-MM-DDTHH:MM:SS
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
      expect(frontmatter.exo__Asset_createdAt).toMatch(isoPattern);
    });

    it("should copy exo__Asset_isDefinedBy from source metadata", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[Custom/Ontology]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(sourceMetadata, "Area");

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[Custom/Ontology]]"');
    });

    it("should handle array format for exo__Asset_isDefinedBy", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: ['"[[!toos]]"'],
      };

      const frontmatter = service.generateTaskFrontmatter(sourceMetadata, "Area");

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('"[[!toos]]"');
    });

    it("should default to empty quotes when exo__Asset_isDefinedBy is missing", () => {
      const sourceMetadata = {}; // No exo__Asset_isDefinedBy

      const frontmatter = service.generateTaskFrontmatter(sourceMetadata, "Area");

      expect(frontmatter.exo__Asset_isDefinedBy).toBe('""');
    });

    it("should create quoted wiki-link to source Area in exo__Effort_area", () => {
      const frontmatter = service.generateTaskFrontmatter({}, "Sprint Planning");

      expect(frontmatter.exo__Effort_area).toBe('"[[Sprint Planning]]"');
    });

    it("should handle Area names with parentheses", () => {
      const frontmatter = service.generateTaskFrontmatter(
        { exo__Asset_isDefinedBy: '"[[!toos]]"' },
        "Sales Offering People Management (Area)",
      );

      expect(frontmatter.exo__Effort_area).toBe('"[[Sales Offering People Management (Area)]]"');
    });
  });

  describe("buildFileContent", () => {
    it("should generate correct YAML format with array for exo__Instance_class", () => {
      const sourceMetadata = {
        exo__Asset_isDefinedBy: '"[[!toos]]"',
      };

      const frontmatter = service.generateTaskFrontmatter(
        sourceMetadata,
        "Sales Offering People Management (Area)",
      );

      // Access private method through TypeScript any
      const content = (service as any).buildFileContent(frontmatter);

      // Should contain YAML array format with bullet
      expect(content).toContain('exo__Instance_class:\n  - "[[ems__Task]]"');
      // Should contain quoted wiki-links
      expect(content).toContain('exo__Asset_isDefinedBy: "[[!toos]]"');
      expect(content).toContain('exo__Effort_area: "[[Sales Offering People Management (Area)]]"');
      // Should have frontmatter delimiters
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

  describe("generateTaskFileName", () => {
    it("should generate filename with timestamp format", () => {
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
});
