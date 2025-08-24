import { FileOperationUtils } from "../../../../src/shared/utils/FileOperationUtils";
import { App, TFile, Vault, MetadataCache } from "obsidian";

// Mock Obsidian API
jest.mock("obsidian");

describe("FileOperationUtils", () => {
  let mockApp: App;
  let mockVault: jest.Mocked<Vault>;
  let mockMetadataCache: jest.Mocked<MetadataCache>;

  beforeEach(() => {
    // Setup mock vault
    mockVault = {
      getAbstractFileByPath: jest.fn(),
      getMarkdownFiles: jest.fn(),
      read: jest.fn(),
      modify: jest.fn(),
      create: jest.fn(),
    } as any;

    // Setup mock metadata cache
    mockMetadataCache = {
      getFileCache: jest.fn(),
    } as any;

    // Setup mock app
    mockApp = {
      vault: mockVault,
      metadataCache: mockMetadataCache,
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("buildYamlFrontmatter", () => {
    it("should build basic YAML frontmatter correctly", () => {
      // Arrange
      const frontmatter = {
        title: "Test Document",
        author: "Test Author",
        version: 1,
        published: true,
      };

      // Act
      const result = FileOperationUtils.buildYamlFrontmatter(frontmatter);

      // Assert
      expect(result).toEqual([
        "---",
        "title: Test Document",
        "author: Test Author",
        "version: 1",
        "published: true",
        "---",
      ]);
    });

    it("should handle array values correctly", () => {
      // Arrange
      const frontmatter = {
        tags: ["test", "document", "yaml"],
        categories: ["work"],
      };

      // Act
      const result = FileOperationUtils.buildYamlFrontmatter(frontmatter);

      // Assert
      expect(result).toEqual([
        "---",
        "tags:",
        "  - test",
        "  - document",
        "  - yaml",
        "categories:",
        "  - work",
        "---",
      ]);
    });

    it("should handle values that need quotes", () => {
      // Arrange
      const frontmatter = {
        description: "A document with: special characters",
        link: "[[Some Link]]",
        email: "test@example.com",
        path: "/some/path",
        hash: "#hashtag",
        bracket: "[test]",
        brace: "{test}",
        pipe: "test|value",
        greater: "test>value",
        backtick: "test`value",
        quote: 'test"value',
        apostrophe: "test'value",
        leadingSpace: " test",
        trailingSpace: "test ",
      };

      // Act
      const result = FileOperationUtils.buildYamlFrontmatter(frontmatter);

      // Assert
      expect(result).toContain('description: "A document with: special characters"');
      expect(result).toContain('link: "[[Some Link]]"');
      expect(result).toContain('email: "test@example.com"');
      expect(result).toContain('path: /some/path'); // path doesn't need quotes
      expect(result).toContain('hash: "#hashtag"');
      expect(result).toContain('bracket: "[test]"');
      expect(result).toContain('brace: "{test}"');
      expect(result).toContain('pipe: "test|value"');
      expect(result).toContain('greater: "test>value"');
      expect(result).toContain('backtick: "test`value"');
      expect(result).toContain('quote: "test\\"value"'); // escaped quotes
      expect(result).toContain('apostrophe: "test\'value"');
      expect(result).toContain('leadingSpace: " test"');
      expect(result).toContain('trailingSpace: "test "');
    });

    it("should handle object values correctly", () => {
      // Arrange
      const frontmatter = {
        metadata: { type: "document", version: "1.0" },
        settings: { enabled: true, count: 5 },
      };

      // Act
      const result = FileOperationUtils.buildYamlFrontmatter(frontmatter);

      // Assert
      expect(result).toContain('metadata: {"type":"document","version":"1.0"}');
      expect(result).toContain('settings: {"enabled":true,"count":5}');
    });

    it("should skip null and undefined values", () => {
      // Arrange
      const frontmatter = {
        title: "Test",
        author: null,
        editor: undefined,
        version: 1,
      };

      // Act
      const result = FileOperationUtils.buildYamlFrontmatter(frontmatter);

      // Assert
      expect(result).toEqual([
        "---",
        "title: Test",
        "version: 1",
        "---",
      ]);
    });

    it("should handle array with values needing quotes", () => {
      // Arrange
      const frontmatter = {
        links: ["[[Page 1]]", "normal-link", "link with: colon"],
        emails: ["test@example.com"],
      };

      // Act
      const result = FileOperationUtils.buildYamlFrontmatter(frontmatter);

      // Assert
      expect(result).toContain('links:');
      expect(result).toContain('  - "[[Page 1]]"');
      expect(result).toContain('  - normal-link');
      expect(result).toContain('  - "link with: colon"');
      expect(result).toContain('emails:');
      expect(result).toContain('  - "test@example.com"');
    });

    it("should handle empty object", () => {
      // Arrange
      const frontmatter = {};

      // Act
      const result = FileOperationUtils.buildYamlFrontmatter(frontmatter);

      // Assert
      expect(result).toEqual(["---", "---"]);
    });
  });

  describe("extractBodyContent", () => {
    it("should extract body content from content with frontmatter", () => {
      // Arrange
      const content = `---
title: Test Document
author: Test Author
---
This is the body content.

It has multiple paragraphs.`;

      // Act
      const result = FileOperationUtils.extractBodyContent(content);

      // Assert
      expect(result).toBe(`This is the body content.

It has multiple paragraphs.`);
    });

    it("should return entire content when no frontmatter exists", () => {
      // Arrange
      const content = `This is just body content.

No frontmatter here.`;

      // Act
      const result = FileOperationUtils.extractBodyContent(content);

      // Assert
      expect(result).toBe(content);
    });

    it("should handle malformed frontmatter gracefully", () => {
      // Arrange
      const content = `---
title: Test Document
This is malformed frontmatter without closing ---

Body content here.`;

      // Act
      const result = FileOperationUtils.extractBodyContent(content);

      // Assert
      expect(result).toBe(content); // Returns original content
    });

    it("should handle empty content", () => {
      // Arrange
      const content = "";

      // Act
      const result = FileOperationUtils.extractBodyContent(content);

      // Assert
      expect(result).toBe("");
    });

    it("should handle content with only frontmatter", () => {
      // Arrange
      const content = `---
title: Test Document
---
`;

      // Act
      const result = FileOperationUtils.extractBodyContent(content);

      // Assert
      expect(result).toBe("");
    });

    it("should handle frontmatter with complex YAML", () => {
      // Arrange
      const content = `---
title: Test Document
tags:
  - test
  - document
metadata:
  created: 2023-01-01
  author: Test
---

# Main Content

This is the actual document body.`;

      // Act
      const result = FileOperationUtils.extractBodyContent(content);

      // Assert
      expect(result).toBe(`
# Main Content

This is the actual document body.`);
    });
  });

  describe("findFileWithFallback", () => {
    let mockFiles: TFile[];

    beforeEach(() => {
      mockFiles = [
        new TFile("documents/test1.md"),
        new TFile("documents/test2.md"),
        new TFile("projects/project1.md"),
      ];
    });

    it("should find file by stored path", () => {
      // Arrange
      const criteria = { storedPath: "documents/test1.md" };
      mockVault.getAbstractFileByPath.mockReturnValue(mockFiles[0]);

      // Act
      const result = FileOperationUtils.findFileWithFallback(mockApp, criteria);

      // Assert
      expect(result).toBe(mockFiles[0]);
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("documents/test1.md");
    });

    it("should fallback to finding by UID when stored path fails", () => {
      // Arrange
      const criteria = { storedPath: "nonexistent.md", uid: "test-uid-123" };
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation((file) => {
        if (file === mockFiles[1]) {
          return { frontmatter: { "exo__Asset_uid": "test-uid-123" } };
        }
        return { frontmatter: {} };
      });

      // Act
      const result = FileOperationUtils.findFileWithFallback(mockApp, criteria);

      // Assert
      expect(result).toBe(mockFiles[1]);
      expect(mockVault.getMarkdownFiles).toHaveBeenCalled();
    });

    it("should fallback to finding by filename when UID fails", () => {
      // Arrange
      const criteria = {
        storedPath: "nonexistent.md",
        uid: "nonexistent-uid",
        filename: "test1",
      };
      mockVault.getAbstractFileByPath
        .mockReturnValueOnce(null) // stored path fails
        .mockReturnValueOnce(mockFiles[0]); // filename succeeds
      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({ frontmatter: {} });

      // Act
      const result = FileOperationUtils.findFileWithFallback(mockApp, criteria);

      // Assert
      expect(result).toBe(mockFiles[0]);
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("test1.md");
    });

    it("should handle filename with .md extension", () => {
      // Arrange
      const criteria = { filename: "test1.md" };
      mockVault.getAbstractFileByPath.mockReturnValue(mockFiles[0]);

      // Act
      const result = FileOperationUtils.findFileWithFallback(mockApp, criteria);

      // Assert
      expect(result).toBe(mockFiles[0]);
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("test1.md");
    });

    it("should return null when no criteria match", () => {
      // Arrange
      const criteria = {
        storedPath: "nonexistent.md",
        uid: "nonexistent-uid",
        filename: "nonexistent",
      };
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockReturnValue({ frontmatter: {} });

      // Act
      const result = FileOperationUtils.findFileWithFallback(mockApp, criteria);

      // Assert
      expect(result).toBeNull();
    });

    it("should handle empty criteria", () => {
      // Arrange
      const criteria = {};

      // Act
      const result = FileOperationUtils.findFileWithFallback(mockApp, criteria);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("updateFileWithFrontmatter", () => {
    it("should update file with new frontmatter and preserve body", async () => {
      // Arrange
      const file = new TFile("test.md");
      const existingContent = `---
old_title: Old Title
---
This is the body content.`;
      const newFrontmatter = { title: "New Title", author: "Test Author" };

      mockVault.read.mockResolvedValue(existingContent);
      mockVault.modify.mockResolvedValue(undefined);

      // Act
      await FileOperationUtils.updateFileWithFrontmatter(mockApp, file, newFrontmatter);

      // Assert
      expect(mockVault.read).toHaveBeenCalledWith(file);
      expect(mockVault.modify).toHaveBeenCalledWith(
        file,
        `---
title: New Title
author: Test Author
---
This is the body content.`
      );
    });

    it("should handle file without existing frontmatter", async () => {
      // Arrange
      const file = new TFile("test.md");
      const existingContent = "Just body content here.";
      const newFrontmatter = { title: "New Title" };

      mockVault.read.mockResolvedValue(existingContent);
      mockVault.modify.mockResolvedValue(undefined);

      // Act
      await FileOperationUtils.updateFileWithFrontmatter(mockApp, file, newFrontmatter);

      // Assert
      expect(mockVault.modify).toHaveBeenCalledWith(
        file,
        `---
title: New Title
---
Just body content here.`
      );
    });
  });

  describe("createFileWithFrontmatter", () => {
    it("should create new file with frontmatter", async () => {
      // Arrange
      const filename = "new-document.md";
      const frontmatter = { title: "New Document", author: "Test Author" };
      mockVault.create.mockResolvedValue(new TFile(filename));

      // Act
      await FileOperationUtils.createFileWithFrontmatter(mockApp, filename, frontmatter);

      // Assert
      expect(mockVault.create).toHaveBeenCalledWith(
        filename,
        `---
title: New Document
author: Test Author
---
`
      );
    });

    it("should create file with empty frontmatter", async () => {
      // Arrange
      const filename = "empty.md";
      const frontmatter = {};
      mockVault.create.mockResolvedValue(new TFile(filename));

      // Act
      await FileOperationUtils.createFileWithFrontmatter(mockApp, filename, frontmatter);

      // Assert
      expect(mockVault.create).toHaveBeenCalledWith(
        filename,
        `---
---
`
      );
    });
  });

  describe("getFilesWithProperty", () => {
    let mockFiles: TFile[];

    beforeEach(() => {
      mockFiles = [
        new TFile("doc1.md"),
        new TFile("doc2.md"),
        new TFile("doc3.md"),
      ];
      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
    });

    it("should return files with specific property and value", () => {
      // Arrange
      mockMetadataCache.getFileCache.mockImplementation((file) => {
        if (file === mockFiles[0]) {
          return { frontmatter: { type: "document", status: "draft" } };
        }
        if (file === mockFiles[1]) {
          return { frontmatter: { type: "document", status: "published" } };
        }
        return { frontmatter: { type: "note" } };
      });

      // Act
      const result = FileOperationUtils.getFilesWithProperty(mockApp, "type", "document");

      // Assert
      expect(result).toEqual([mockFiles[0], mockFiles[1]]);
    });

    it("should return files with property regardless of value", () => {
      // Arrange
      mockMetadataCache.getFileCache.mockImplementation((file) => {
        if (file === mockFiles[0]) {
          return { frontmatter: { author: "John Doe" } };
        }
        if (file === mockFiles[1]) {
          return { frontmatter: { author: "Jane Smith" } };
        }
        return { frontmatter: {} };
      });

      // Act
      const result = FileOperationUtils.getFilesWithProperty(mockApp, "author");

      // Assert
      expect(result).toEqual([mockFiles[0], mockFiles[1]]);
    });

    it("should handle files without frontmatter", () => {
      // Arrange
      mockMetadataCache.getFileCache.mockImplementation(() => ({
        frontmatter: undefined,
      }));

      // Act
      const result = FileOperationUtils.getFilesWithProperty(mockApp, "type", "document");

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle files with null frontmatter", () => {
      // Arrange
      mockMetadataCache.getFileCache.mockReturnValue(null);

      // Act
      const result = FileOperationUtils.getFilesWithProperty(mockApp, "type", "document");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("mergeFrontmatter", () => {
    it("should merge frontmatter objects correctly", () => {
      // Arrange
      const existing = { title: "Old Title", author: "John Doe", version: 1 };
      const updates = { title: "New Title", category: "test" };

      // Act
      const result = FileOperationUtils.mergeFrontmatter(existing, updates);

      // Assert
      expect(result).toEqual({
        title: "New Title", // updated
        author: "John Doe", // preserved
        version: 1, // preserved
        category: "test", // added
      });
    });

    it("should handle empty objects", () => {
      // Arrange & Act
      const result1 = FileOperationUtils.mergeFrontmatter({}, { title: "Test" });
      const result2 = FileOperationUtils.mergeFrontmatter({ title: "Test" }, {});
      const result3 = FileOperationUtils.mergeFrontmatter({}, {});

      // Assert
      expect(result1).toEqual({ title: "Test" });
      expect(result2).toEqual({ title: "Test" });
      expect(result3).toEqual({});
    });

    it("should handle overwriting with different types", () => {
      // Arrange
      const existing = { count: 5, tags: ["old"] };
      const updates = { count: "five", tags: "new" };

      // Act
      const result = FileOperationUtils.mergeFrontmatter(existing, updates);

      // Assert
      expect(result).toEqual({ count: "five", tags: "new" });
    });
  });

  describe("isReferencingAsset", () => {
    it("should detect references in various formats", () => {
      // Arrange & Act & Assert
      expect(FileOperationUtils.isReferencingAsset("test-asset", "test-asset")).toBe(true);
      expect(FileOperationUtils.isReferencingAsset("test-asset.md", "test-asset")).toBe(true);
      expect(FileOperationUtils.isReferencingAsset("[[test-asset]]", "test-asset")).toBe(true);
      expect(FileOperationUtils.isReferencingAsset("link to test-asset here", "test-asset")).toBe(true);
    });

    it("should handle array of references", () => {
      // Arrange
      const references = ["[[other-asset]]", "test-asset", "[[third-asset]]"];

      // Act & Assert
      expect(FileOperationUtils.isReferencingAsset(references, "test-asset")).toBe(true);
      expect(FileOperationUtils.isReferencingAsset(references, "other-asset")).toBe(true);
      expect(FileOperationUtils.isReferencingAsset(references, "nonexistent")).toBe(false);
    });

    it("should handle bracketed references correctly", () => {
      // Arrange & Act & Assert
      expect(FileOperationUtils.isReferencingAsset("[[test-asset]]", "test-asset")).toBe(true);
      expect(FileOperationUtils.isReferencingAsset("[[test-asset.md]]", "test-asset")).toBe(true);
    });

    it("should return false for non-matching references", () => {
      // Arrange & Act & Assert
      expect(FileOperationUtils.isReferencingAsset("other-asset", "test-asset")).toBe(false);
      expect(FileOperationUtils.isReferencingAsset("[[other-asset]]", "test-asset")).toBe(false);
      expect(FileOperationUtils.isReferencingAsset("", "test-asset")).toBe(false);
      expect(FileOperationUtils.isReferencingAsset(null, "test-asset")).toBe(false);
      expect(FileOperationUtils.isReferencingAsset(undefined, "test-asset")).toBe(false);
    });

    it("should handle edge cases", () => {
      // Arrange & Act & Assert
      expect(FileOperationUtils.isReferencingAsset([], "test-asset")).toBe(false);
      expect(FileOperationUtils.isReferencingAsset([null, undefined], "test-asset")).toBe(false);
      expect(FileOperationUtils.isReferencingAsset(123, "test-asset")).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle vault read errors gracefully", async () => {
      // Arrange
      const file = new TFile("test.md");
      const frontmatter = { title: "Test" };
      mockVault.read.mockRejectedValue(new Error("File not found"));

      // Act & Assert
      await expect(
        FileOperationUtils.updateFileWithFrontmatter(mockApp, file, frontmatter)
      ).rejects.toThrow("File not found");
    });

    it("should handle vault create errors gracefully", async () => {
      // Arrange
      const filename = "test.md";
      const frontmatter = { title: "Test" };
      mockVault.create.mockRejectedValue(new Error("Permission denied"));

      // Act & Assert
      await expect(
        FileOperationUtils.createFileWithFrontmatter(mockApp, filename, frontmatter)
      ).rejects.toThrow("Permission denied");
    });

    it("should handle metadata cache errors gracefully", () => {
      // Arrange
      const mockFiles = [new TFile("test.md")];
      mockVault.getMarkdownFiles.mockReturnValue(mockFiles);
      mockMetadataCache.getFileCache.mockImplementation(() => {
        throw new Error("Cache error");
      });

      // Act & Assert
      expect(() => {
        FileOperationUtils.getFilesWithProperty(mockApp, "type", "document");
      }).toThrow("Cache error");
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large frontmatter objects efficiently", () => {
      // Arrange
      const largeFrontmatter: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeFrontmatter[`property_${i}`] = `value_${i}`;
      }

      // Act & Assert
      expect(() => {
        FileOperationUtils.buildYamlFrontmatter(largeFrontmatter);
      }).not.toThrow();
    });

    it("should handle files with very long content", () => {
      // Arrange
      const longContent = "a".repeat(100000);
      const contentWithFrontmatter = `---\ntitle: Test\n---\n${longContent}`;

      // Act
      const result = FileOperationUtils.extractBodyContent(contentWithFrontmatter);

      // Assert
      expect(result).toBe(longContent);
    });

    it("should handle many files efficiently", () => {
      // Arrange
      const manyFiles = Array.from({ length: 1000 }, (_, i) => new TFile(`file${i}.md`));
      mockVault.getMarkdownFiles.mockReturnValue(manyFiles);
      mockMetadataCache.getFileCache.mockReturnValue({ frontmatter: { type: "document" } });

      // Act & Assert
      expect(() => {
        FileOperationUtils.getFilesWithProperty(mockApp, "type", "document");
      }).not.toThrow();
    });
  });
});