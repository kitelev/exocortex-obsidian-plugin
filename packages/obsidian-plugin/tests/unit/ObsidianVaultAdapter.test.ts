import { ObsidianVaultAdapter } from "../../src/adapters/ObsidianVaultAdapter";
import { Vault, TFile, TFolder, MetadataCache, App, FileManager } from "obsidian";
import { IFile, IFolder, IFrontmatter } from "@exocortex/core";

describe("ObsidianVaultAdapter", () => {
  let adapter: ObsidianVaultAdapter;
  let mockVault: jest.Mocked<Vault>;
  let mockMetadataCache: jest.Mocked<MetadataCache>;
  let mockApp: jest.Mocked<App>;
  let mockFileManager: jest.Mocked<FileManager>;
  let mockTFile: TFile;
  let mockTFolder: TFolder;

  beforeEach(() => {
    // Create proper instances of TFile and TFolder
    mockTFile = Object.create(TFile.prototype);
    Object.assign(mockTFile, {
      path: "test/file.md",
      basename: "file",
      name: "file.md",
      parent: null,
    });

    mockTFolder = Object.create(TFolder.prototype);
    Object.assign(mockTFolder, {
      path: "test",
      name: "test",
    });

    mockFileManager = {
      trashFile: jest.fn(),
      renameFile: jest.fn(),
      processFrontMatter: jest.fn(),
    } as unknown as jest.Mocked<FileManager>;

    mockVault = {
      read: jest.fn(),
      create: jest.fn(),
      modify: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      getMarkdownFiles: jest.fn(),
      createFolder: jest.fn(),
      process: jest.fn(),
    } as unknown as jest.Mocked<Vault>;

    mockMetadataCache = {
      getFileCache: jest.fn(),
      getFirstLinkpathDest: jest.fn(),
    } as unknown as jest.Mocked<MetadataCache>;

    mockApp = {
      fileManager: mockFileManager,
    } as unknown as jest.Mocked<App>;

    adapter = new ObsidianVaultAdapter(mockVault, mockMetadataCache, mockApp);
  });

  describe("read", () => {
    it("should read file content", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockVault.read.mockResolvedValue("File content");

      const content = await adapter.read(file);

      expect(content).toBe("File content");
      expect(mockVault.read).toHaveBeenCalledWith(mockTFile);
    });

    it("should use cached file when available", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      // First read to cache the file
      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockVault.read.mockResolvedValue("Content 1");
      await adapter.read(file);

      // Second read should use cached file
      mockVault.read.mockResolvedValue("Content 2");
      const content = await adapter.read(file);

      expect(content).toBe("Content 2");
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledTimes(1);
    });
  });

  describe("create", () => {
    it("should create a new file", async () => {
      const createdFile = Object.create(TFile.prototype);
      Object.assign(createdFile, {
        path: "new/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      });

      mockVault.create.mockResolvedValue(createdFile);

      const result = await adapter.create("new/file.md", "New content");

      expect(result).toEqual({
        path: "new/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      });
      expect(mockVault.create).toHaveBeenCalledWith("new/file.md", "New content");
    });

    it("should create file with parent folder", async () => {
      const createdFile = Object.create(TFile.prototype);
      Object.assign(createdFile, {
        path: "folder/file.md",
        basename: "file",
        name: "file.md",
        parent: mockTFolder,
      });

      mockVault.create.mockResolvedValue(createdFile);

      const result = await adapter.create("folder/file.md", "Content");

      expect(result.parent).toEqual({
        path: "test",
        name: "test",
      });
    });
  });

  describe("modify", () => {
    it("should modify existing file", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);

      await adapter.modify(file, "Modified content");

      expect(mockVault.modify).toHaveBeenCalledWith(mockTFile, "Modified content");
    });

    it("should throw error if file not found", async () => {
      const file: IFile = {
        path: "nonexistent.md",
        basename: "nonexistent",
        name: "nonexistent.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await expect(adapter.modify(file, "Content")).rejects.toThrow(
        "File not found: nonexistent.md"
      );
    });
  });

  describe("delete", () => {
    it("should delete file using trash", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);

      await adapter.delete(file);

      expect(mockFileManager.trashFile).toHaveBeenCalledWith(mockTFile);
    });

    it("should throw error if file not found", async () => {
      const file: IFile = {
        path: "nonexistent.md",
        basename: "nonexistent",
        name: "nonexistent.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await expect(adapter.delete(file)).rejects.toThrow(
        "File not found: nonexistent.md"
      );
    });
  });

  describe("exists", () => {
    it("should return true if file exists", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);

      const exists = await adapter.exists("test/file.md");

      expect(exists).toBe(true);
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("test/file.md");
    });

    it("should return false if file does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const exists = await adapter.exists("nonexistent.md");

      expect(exists).toBe(false);
    });
  });

  describe("getAbstractFileByPath", () => {
    it("should return IFile for TFile", () => {
      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);

      const result = adapter.getAbstractFileByPath("test/file.md");

      expect(result).toEqual({
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      });
    });

    it("should return IFolder for TFolder", () => {
      mockVault.getAbstractFileByPath.mockReturnValue(mockTFolder);

      const result = adapter.getAbstractFileByPath("test");

      expect(result).toEqual({
        path: "test",
        name: "test",
      });
    });

    it("should return null if file not found", () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const result = adapter.getAbstractFileByPath("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getAllFiles", () => {
    it("should return all markdown files", () => {
      const file1 = Object.create(TFile.prototype);
      Object.assign(file1, {
        path: "file1.md",
        basename: "file1",
        name: "file1.md",
        parent: null,
      });

      const file2 = Object.create(TFile.prototype);
      Object.assign(file2, {
        path: "folder/file2.md",
        basename: "file2",
        name: "file2.md",
        parent: mockTFolder,
      });

      mockVault.getMarkdownFiles.mockReturnValue([file1, file2]);

      const files = adapter.getAllFiles();

      expect(files).toHaveLength(2);
      expect(files[0]).toEqual({
        path: "file1.md",
        basename: "file1",
        name: "file1.md",
        parent: null,
      });
      expect(files[1]).toEqual({
        path: "folder/file2.md",
        basename: "file2",
        name: "file2.md",
        parent: {
          path: "test",
          name: "test",
        },
      });
    });

    it("should return empty array if no files", () => {
      mockVault.getMarkdownFiles.mockReturnValue([]);

      const files = adapter.getAllFiles();

      expect(files).toEqual([]);
    });
  });

  describe("getFrontmatter", () => {
    it("should return frontmatter from cache", () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      const frontmatter = {
        title: "Test",
        status: "draft",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter,
      } as any);

      const result = adapter.getFrontmatter(file);

      expect(result).toEqual(frontmatter);
      expect(mockMetadataCache.getFileCache).toHaveBeenCalledWith(mockTFile);
    });

    it("should return null if no frontmatter", () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockMetadataCache.getFileCache.mockReturnValue({} as any);

      const result = adapter.getFrontmatter(file);

      expect(result).toBeNull();
    });

    it("should return null if no cache", () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockMetadataCache.getFileCache.mockReturnValue(null);

      const result = adapter.getFrontmatter(file);

      expect(result).toBeNull();
    });
  });

  describe("updateFrontmatter", () => {
    it("should update frontmatter with new values", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      const currentFrontmatter = {
        title: "Old Title",
        status: "draft",
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: currentFrontmatter,
      } as any);

      mockFileManager.processFrontMatter.mockImplementation(
        async (file, processor) => {
          const fm = { ...currentFrontmatter };
          processor(fm);
        }
      );

      await adapter.updateFrontmatter(file, (current) => ({
        ...current,
        status: "published",
        newProp: "value",
      }));

      expect(mockFileManager.processFrontMatter).toHaveBeenCalledWith(
        mockTFile,
        expect.any(Function)
      );

      // Verify processor function
      const processor = mockFileManager.processFrontMatter.mock.calls[0][1];
      const testFm = { title: "Test" };
      processor(testFm);
      expect(testFm).toEqual({
        title: "Old Title",
        status: "published",
        newProp: "value",
      });
    });

    it("should handle empty frontmatter", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockMetadataCache.getFileCache.mockReturnValue(null);

      mockFileManager.processFrontMatter.mockImplementation(
        async (file, processor) => {
          const fm = {};
          processor(fm);
        }
      );

      await adapter.updateFrontmatter(file, () => ({
        title: "New Title",
        status: "draft",
      }));

      expect(mockFileManager.processFrontMatter).toHaveBeenCalled();

      // Verify processor function
      const processor = mockFileManager.processFrontMatter.mock.calls[0][1];
      const testFm = {};
      processor(testFm);
      expect(testFm).toEqual({
        title: "New Title",
        status: "draft",
      });
    });
  });

  describe("rename", () => {
    it("should rename file", async () => {
      const file: IFile = {
        path: "old/path.md",
        basename: "path",
        name: "path.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);

      await adapter.rename(file, "new/path.md");

      expect(mockFileManager.renameFile).toHaveBeenCalledWith(
        mockTFile,
        "new/path.md"
      );
    });

    it("should throw error if file not found", async () => {
      const file: IFile = {
        path: "nonexistent.md",
        basename: "nonexistent",
        name: "nonexistent.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await expect(adapter.rename(file, "new.md")).rejects.toThrow(
        "File not found: nonexistent.md"
      );
    });
  });

  describe("createFolder", () => {
    it("should create folder", async () => {
      await adapter.createFolder("new/folder");

      expect(mockVault.createFolder).toHaveBeenCalledWith("new/folder");
    });
  });

  describe("getFirstLinkpathDest", () => {
    it("should return linked file", () => {
      const linkedFile = Object.create(TFile.prototype);
      Object.assign(linkedFile, {
        path: "linked.md",
        basename: "linked",
        name: "linked.md",
        parent: null,
      });

      mockMetadataCache.getFirstLinkpathDest.mockReturnValue(linkedFile);

      const result = adapter.getFirstLinkpathDest("[[Linked]]", "source.md");

      expect(result).toEqual({
        path: "linked.md",
        basename: "linked",
        name: "linked.md",
        parent: null,
      });
      expect(mockMetadataCache.getFirstLinkpathDest).toHaveBeenCalledWith(
        "[[Linked]]",
        "source.md"
      );
    });

    it("should return null if no linked file", () => {
      mockMetadataCache.getFirstLinkpathDest.mockReturnValue(null);

      const result = adapter.getFirstLinkpathDest("[[Nonexistent]]", "source.md");

      expect(result).toBeNull();
    });
  });

  describe("process", () => {
    it("should process file content", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockVault.process.mockImplementation(async (file, fn) => {
        return fn("Original content");
      });

      const result = await adapter.process(file, (content) =>
        content.toUpperCase()
      );

      expect(result).toBe("ORIGINAL CONTENT");
      expect(mockVault.process).toHaveBeenCalledWith(
        mockTFile,
        expect.any(Function)
      );
    });

    it("should throw error if file not found", async () => {
      const file: IFile = {
        path: "nonexistent.md",
        basename: "nonexistent",
        name: "nonexistent.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await expect(
        adapter.process(file, (content) => content)
      ).rejects.toThrow("File not found: nonexistent.md");
    });
  });

  describe("toTFile", () => {
    it("should convert IFile to TFile", () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);

      const result = adapter.toTFile(file);

      expect(result).toBe(mockTFile);
    });

    it("should throw error if file not found", () => {
      const file: IFile = {
        path: "nonexistent.md",
        basename: "nonexistent",
        name: "nonexistent.md",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      expect(() => adapter.toTFile(file)).toThrow(
        "File not found: nonexistent.md"
      );
    });

    it("should throw error if path points to folder", () => {
      const file: IFile = {
        path: "folder",
        basename: "folder",
        name: "folder",
        parent: null,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFolder);

      expect(() => adapter.toTFile(file)).toThrow(
        "File not found: folder"
      );
    });
  });

  describe("caching", () => {
    it("should cache files across different methods", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      // First method call caches the file
      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockVault.read.mockResolvedValue("Content");
      await adapter.read(file);

      // Reset mock to verify caching
      mockVault.getAbstractFileByPath.mockClear();

      // Second method call should use cached file
      await adapter.modify(file, "New content");

      // Should not call getAbstractFileByPath again
      expect(mockVault.getAbstractFileByPath).not.toHaveBeenCalled();
      expect(mockVault.modify).toHaveBeenCalledWith(mockTFile, "New content");
    });

    it("should handle multiple files in cache", async () => {
      const file1: IFile = {
        path: "file1.md",
        basename: "file1",
        name: "file1.md",
        parent: null,
      };

      const file2: IFile = {
        path: "file2.md",
        basename: "file2",
        name: "file2.md",
        parent: null,
      };

      const tFile1 = Object.create(TFile.prototype);
      Object.assign(tFile1, { ...mockTFile, path: "file1.md" });
      const tFile2 = Object.create(TFile.prototype);
      Object.assign(tFile2, { ...mockTFile, path: "file2.md" });

      // Cache both files
      mockVault.getAbstractFileByPath.mockReturnValueOnce(tFile1);
      mockVault.read.mockResolvedValue("Content 1");
      await adapter.read(file1);

      mockVault.getAbstractFileByPath.mockReturnValueOnce(tFile2);
      mockVault.read.mockResolvedValue("Content 2");
      await adapter.read(file2);

      // Reset mock
      mockVault.getAbstractFileByPath.mockClear();

      // Both should use cached versions
      await adapter.delete(file1);
      await adapter.delete(file2);

      expect(mockVault.getAbstractFileByPath).not.toHaveBeenCalled();
      expect(mockFileManager.trashFile).toHaveBeenCalledWith(tFile1);
      expect(mockFileManager.trashFile).toHaveBeenCalledWith(tFile2);
    });
  });

  describe("edge cases", () => {
    it("should handle file with special characters in path", async () => {
      const file: IFile = {
        path: "test/file (with) [special] {chars}.md",
        basename: "file (with) [special] {chars}",
        name: "file (with) [special] {chars}.md",
        parent: null,
      };

      const specialFile = Object.create(TFile.prototype);
      Object.assign(specialFile, {
        ...mockTFile,
        path: "test/file (with) [special] {chars}.md",
        basename: "file (with) [special] {chars}",
        name: "file (with) [special] {chars}.md",
      });

      mockVault.getAbstractFileByPath.mockReturnValue(specialFile);
      mockVault.read.mockResolvedValue("Content");

      const content = await adapter.read(file);

      expect(content).toBe("Content");
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(
        "test/file (with) [special] {chars}.md"
      );
    });

    it("should handle deeply nested folders", () => {
      const deepFolder = Object.create(TFolder.prototype);
      Object.assign(deepFolder, {
        path: "a/b/c/d",
        name: "d",
      });

      const file = Object.create(TFile.prototype);
      Object.assign(file, {
        path: "a/b/c/d/file.md",
        basename: "file",
        name: "file.md",
        parent: deepFolder,
      });

      mockVault.getAbstractFileByPath.mockReturnValue(file);

      const result = adapter.getAbstractFileByPath("a/b/c/d/file.md");

      expect(result).toEqual({
        path: "a/b/c/d/file.md",
        basename: "file",
        name: "file.md",
        parent: {
          path: "a/b/c/d",
          name: "d",
        },
      });
    });

    it("should handle empty path", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      const exists = await adapter.exists("");
      expect(exists).toBe(false);
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith("");
    });

    it("should handle frontmatter with special values", async () => {
      const file: IFile = {
        path: "test/file.md",
        basename: "file",
        name: "file.md",
        parent: null,
      };

      const specialFrontmatter = {
        "special-key": "value",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          key: "value",
        },
        null: null,
        undefined: undefined,
      };

      mockVault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockMetadataCache.getFileCache.mockReturnValue({
        frontmatter: specialFrontmatter,
      } as any);

      const result = adapter.getFrontmatter(file);

      expect(result).toEqual(specialFrontmatter);
    });
  });
});