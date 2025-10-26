import { FolderRepairService } from "../../src/infrastructure/services/FolderRepairService";
import { TFile, Vault } from "obsidian";

describe("FolderRepairService", () => {
  let service: FolderRepairService;
  let mockVault: jest.Mocked<Vault>;
  let mockApp: any;

  beforeEach(() => {
    mockVault = {
      getAbstractFileByPath: jest.fn(),
      createFolder: jest.fn(),
      rename: jest.fn(),
    } as any;

    mockApp = {
      metadataCache: {
        getFirstLinkpathDest: jest.fn(),
      },
    };

    service = new FolderRepairService(mockVault, mockApp);
  });

  describe("getExpectedFolder", () => {
    test("should return null when exo__Asset_isDefinedBy is missing", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = {};

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBeNull();
    });

    test("should return null when exo__Asset_isDefinedBy is null", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: null };

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBeNull();
    });

    test("should extract reference from [[Reference]] format", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: "[[SomeAsset]]" };

      const referencedFile = {
        path: "path/to/SomeAsset.md",
        parent: { path: "path/to" },
      } as TFile;

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(referencedFile);

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBe("path/to");
      expect(mockApp.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith(
        "SomeAsset",
        "file.md",
      );
    });

    test("should extract reference from quoted [[Reference]] format", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: '"[[SomeAsset]]"' };

      const referencedFile = {
        path: "path/to/SomeAsset.md",
        parent: { path: "path/to" },
      } as TFile;

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(referencedFile);

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBe("path/to");
      expect(mockApp.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith(
        "SomeAsset",
        "file.md",
      );
    });

    test("should extract reference from plain text format", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: "SomeAsset" };

      const referencedFile = {
        path: "path/to/SomeAsset.md",
        parent: { path: "path/to" },
      } as TFile;

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(referencedFile);

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBe("path/to");
    });

    test("should return null when referenced file not found", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: "[[NonExistent]]" };

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(null);

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBeNull();
    });

    test("should handle file in root folder (no parent)", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: "[[RootAsset]]" };

      const referencedFile = {
        path: "RootAsset.md",
        parent: null,
      } as TFile;

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(referencedFile);

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBe("");
    });

    test("should return null for non-string exo__Asset_isDefinedBy", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: 123 };

      const result = await service.getExpectedFolder(file, metadata);

      expect(result).toBeNull();
    });
  });

  describe("repairFolder", () => {
    test("should move file to expected folder", async () => {
      const file = {
        path: "old/path/file.md",
        name: "file.md",
      } as TFile;

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await service.repairFolder(file, "new/path");

      expect(mockVault.createFolder).toHaveBeenCalledWith("new/path");
      expect(mockVault.rename).toHaveBeenCalledWith(file, "new/path/file.md");
    });

    test("should throw error when target file already exists", async () => {
      const file = {
        path: "old/path/file.md",
        name: "file.md",
      } as TFile;

      const existingFile = { path: "new/path/file.md" } as TFile;
      mockVault.getAbstractFileByPath.mockReturnValue(existingFile);

      await expect(
        service.repairFolder(file, "new/path"),
      ).rejects.toThrow("Cannot move file: new/path/file.md already exists");
    });

    test("should create folder if it does not exist", async () => {
      const file = {
        path: "old/path/file.md",
        name: "file.md",
      } as TFile;

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await service.repairFolder(file, "new/path");

      expect(mockVault.createFolder).toHaveBeenCalledWith("new/path");
    });

    test("should not create folder if it already exists", async () => {
      const file = {
        path: "old/path/file.md",
        name: "file.md",
      } as TFile;

      // Mock existing folder with children property (duck typing)
      const existingFolder = {
        path: "new/path",
        children: [],
      };

      mockVault.getAbstractFileByPath.mockImplementation((path: string) => {
        if (path === "new/path") return existingFolder as any;
        return null;
      });

      await service.repairFolder(file, "new/path");

      expect(mockVault.createFolder).not.toHaveBeenCalled();
      expect(mockVault.rename).toHaveBeenCalledWith(file, "new/path/file.md");
    });

    test("should handle empty folder path (root)", async () => {
      const file = {
        path: "old/path/file.md",
        name: "file.md",
      } as TFile;

      mockVault.getAbstractFileByPath.mockReturnValue(null);

      await service.repairFolder(file, "");

      expect(mockVault.createFolder).not.toHaveBeenCalled();
      expect(mockVault.rename).toHaveBeenCalledWith(file, "/file.md");
    });
  });

  describe("extractReference", () => {
    test("should extract reference from [[Name]]", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: "[[TestAsset]]" };

      const referencedFile = {
        path: "test.md",
        parent: { path: "folder" },
      } as TFile;

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(referencedFile);

      await service.getExpectedFolder(file, metadata);

      expect(mockApp.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith(
        "TestAsset",
        "file.md",
      );
    });

    test("should extract reference from quoted wiki-link", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: '"[[TestAsset]]"' };

      const referencedFile = {
        path: "test.md",
        parent: { path: "folder" },
      } as TFile;

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(referencedFile);

      await service.getExpectedFolder(file, metadata);

      expect(mockApp.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith(
        "TestAsset",
        "file.md",
      );
    });

    test("should handle whitespace around reference", async () => {
      const file = { path: "file.md" } as TFile;
      const metadata = { exo__Asset_isDefinedBy: "  [[TestAsset]]  " };

      const referencedFile = {
        path: "test.md",
        parent: { path: "folder" },
      } as TFile;

      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(referencedFile);

      await service.getExpectedFolder(file, metadata);

      expect(mockApp.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith(
        "TestAsset",
        "file.md",
      );
    });
  });
});
