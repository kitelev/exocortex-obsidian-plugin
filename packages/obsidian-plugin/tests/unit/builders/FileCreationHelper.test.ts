import { TFile } from "obsidian";
import { openCreatedFile, promptForLabel, type FileCreationResult } from "../../../src/presentation/builders/button-groups/FileCreationHelper";
import type { ILogger } from "../../../src/adapters/logging/ILogger";
import type { ObsidianApp } from "../../../src/types";

// Store original TFile for prototype chain
const OriginalTFile = TFile;

// Mock LabelInputModal class
const mockModalOpen = jest.fn();
jest.mock("../../../src/presentation/modals/LabelInputModal", () => {
  return {
    LabelInputModal: class MockLabelInputModal {
      private callback: (result: any) => void;

      constructor(
        public app: any,
        callback: (result: any) => void,
        public defaultValue: string,
        public showTaskSize: boolean
      ) {
        this.callback = callback;
        mockModalOpen(app, callback, defaultValue, showTaskSize);
      }

      open(): void {
        this.callback({
          label: "Test Label",
          size: "Medium",
          cancelled: false,
        });
      }
    },
  };
});

describe("FileCreationHelper", () => {
  describe("openCreatedFile", () => {
    let mockApp: jest.Mocked<ObsidianApp>;
    let mockLogger: jest.Mocked<ILogger>;
    let mockLeaf: any;
    let mockTFile: any;

    beforeEach(() => {
      // Create a mock that passes instanceof TFile check
      mockTFile = Object.create(OriginalTFile.prototype);
      Object.assign(mockTFile, {
        path: "test/path.md",
        name: "path.md",
        basename: "path",
        extension: "md",
        vault: {},
        parent: null,
        stat: { ctime: 0, mtime: 0, size: 0 },
      });

      mockLeaf = {
        openFile: jest.fn().mockResolvedValue(undefined),
      };

      mockApp = {
        vault: {
          getAbstractFileByPath: jest.fn().mockReturnValue(mockTFile),
        },
        workspace: {
          getLeaf: jest.fn().mockReturnValue(mockLeaf),
          setActiveLeaf: jest.fn(),
        },
      } as unknown as jest.Mocked<ObsidianApp>;

      mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
    });

    it("should open created file in current tab by default", async () => {
      const createdFile: FileCreationResult = { path: "test/path.md" };

      await openCreatedFile(
        mockApp,
        createdFile,
        {},
        mockLogger,
        "Test message"
      );

      expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith("test/path.md");
      expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith(false);
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockTFile);
      expect(mockApp.workspace.setActiveLeaf).toHaveBeenCalledWith(mockLeaf, { focus: true });
      expect(mockLogger.info).toHaveBeenCalledWith("Test message");
    });

    it("should open created file in new tab when openInNewTab is true", async () => {
      const createdFile: FileCreationResult = { path: "test/path.md" };

      await openCreatedFile(
        mockApp,
        createdFile,
        { openInNewTab: true },
        mockLogger,
        "Opened in new tab"
      );

      expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockTFile);
    });

    it("should throw error if created file not found", async () => {
      mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(null);
      const createdFile: FileCreationResult = { path: "nonexistent.md" };

      await expect(
        openCreatedFile(mockApp, createdFile, {}, mockLogger, "Test")
      ).rejects.toThrow("Created file not found: nonexistent.md");
    });

    it("should throw error if path exists but is not a TFile", async () => {
      // Return something that's not a TFile (like a folder)
      mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue({
        path: "test/folder",
        name: "folder",
        // Missing TFile properties
      });
      const createdFile: FileCreationResult = { path: "test/folder" };

      await expect(
        openCreatedFile(mockApp, createdFile, {}, mockLogger, "Test")
      ).rejects.toThrow("Created file not found: test/folder");
    });
  });

  describe("promptForLabel", () => {
    let mockApp: jest.Mocked<ObsidianApp>;

    beforeEach(() => {
      mockApp = {} as jest.Mocked<ObsidianApp>;
      jest.clearAllMocks();
    });

    it("should return label input modal result", async () => {
      const result = await promptForLabel(mockApp, "Default", true);

      expect(result).toEqual({
        label: "Test Label",
        size: "Medium",
        cancelled: false,
      });
    });

    it("should pass default value and showTaskSize to modal", async () => {
      await promptForLabel(mockApp, "Custom Default", false);

      expect(mockModalOpen).toHaveBeenCalledWith(
        mockApp,
        expect.any(Function),
        "Custom Default",
        false
      );
    });

    it("should use default values when not provided", async () => {
      await promptForLabel(mockApp);

      expect(mockModalOpen).toHaveBeenCalledWith(
        mockApp,
        expect.any(Function),
        "",
        true
      );
    });
  });
});
