import { PropertyCleanupService } from "../../src/infrastructure/services/PropertyCleanupService";
import { TFile, Vault } from "obsidian";

describe("PropertyCleanupService", () => {
  let service: PropertyCleanupService;
  let mockVault: jest.Mocked<Vault>;

  beforeEach(() => {
    mockVault = {
      read: jest.fn(),
      modify: jest.fn(),
    } as unknown as jest.Mocked<Vault>;

    service = new PropertyCleanupService(mockVault);
  });

  describe("cleanEmptyProperties", () => {
    it("should remove properties with empty string values", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class: "[[ems__Area]]"
exo__Asset_uid: area-123
emptyProp: ""
validProp: "some value"
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).not.toContain('emptyProp: ""');
      expect(modifiedContent).toContain("exo__Asset_uid: area-123");
      expect(modifiedContent).toContain('validProp: "some value"');
    });

    it("should remove properties with null values", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class: "[[ems__Task]]"
nullProp: null
validProp: "value"
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).not.toContain("nullProp: null");
      expect(modifiedContent).toContain('validProp: "value"');
    });

    it("should remove properties with undefined values", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class: "[[ems__Project]]"
undefinedProp: undefined
validProp: "value"
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).not.toContain("undefinedProp: undefined");
      expect(modifiedContent).toContain('validProp: "value"');
    });

    it("should remove properties with empty array values []", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class: "[[ems__Area]]"
emptyArray: []
validProp: "value"
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).not.toContain("emptyArray: []");
      expect(modifiedContent).toContain('validProp: "value"');
    });

    it("should remove properties with empty object values {}", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class: "[[ems__Task]]"
emptyObject: {}
validProp: "value"
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).not.toContain("emptyObject: {}");
      expect(modifiedContent).toContain('validProp: "value"');
    });

    it("should preserve non-empty properties", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
exo__Asset_uid: task-123
ems__Effort_status: "[[ems__EffortStatusActive]]"
emptyProp: ""
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).toContain("exo__Instance_class:");
      expect(modifiedContent).toContain('- "[[ems__Task]]"');
      expect(modifiedContent).toContain("exo__Asset_uid: task-123");
      expect(modifiedContent).toContain(
        'ems__Effort_status: "[[ems__EffortStatusActive]]"',
      );
      expect(modifiedContent).not.toContain('emptyProp: ""');
    });

    it("should handle files without frontmatter", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = "Just content, no frontmatter";

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).toBe(originalContent);
    });

    it("should preserve file content after frontmatter", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class: "[[ems__Area]]"
emptyProp: ""
---
# My Note

This is the content that should be preserved.`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).toContain("# My Note");
      expect(modifiedContent).toContain(
        "This is the content that should be preserved.",
      );
    });

    it("should handle multiple empty properties", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
validProp1: "value1"
emptyProp1: ""
emptyProp2: null
validProp2: "value2"
emptyProp3: []
emptyProp4: {}
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).toContain('validProp1: "value1"');
      expect(modifiedContent).toContain('validProp2: "value2"');
      expect(modifiedContent).not.toContain('emptyProp1: ""');
      expect(modifiedContent).not.toContain("emptyProp2: null");
      expect(modifiedContent).not.toContain("emptyProp3: []");
      expect(modifiedContent).not.toContain("emptyProp4: {}");
    });

    it("should handle empty list properties", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class: "[[ems__Task]]"
validProp: "value"
emptyList:
  - ""
  - null
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).toContain('validProp: "value"');
      expect(modifiedContent).not.toContain("emptyList:");
    });

    it("should preserve non-empty list properties", async () => {
      const mockFile = { path: "test.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
  - "[[ems__Effort]]"
validList:
  - "item1"
  - "item2"
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.cleanEmptyProperties(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];
      expect(modifiedContent).toContain("exo__Instance_class:");
      expect(modifiedContent).toContain('- "[[ems__Task]]"');
      expect(modifiedContent).toContain('- "[[ems__Effort]]"');
      expect(modifiedContent).toContain("validList:");
      expect(modifiedContent).toContain('- "item1"');
      expect(modifiedContent).toContain('- "item2"');
    });
  });
});
