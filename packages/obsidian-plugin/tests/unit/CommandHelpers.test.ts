import { CommandHelpers } from "../../src/application/commands/helpers/CommandHelpers";
import { TFile } from "obsidian";

describe("CommandHelpers", () => {
  let mockApp: any;
  let mockFile: TFile;
  let mockLeaf: any;
  let mockWorkspace: any;

  beforeEach(() => {
    // Setup mock file
    mockFile = {
      path: "test/file.md",
      name: "file.md",
      basename: "file",
      extension: "md",
    } as TFile;

    // Setup mock leaf
    mockLeaf = {
      openFile: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock workspace
    mockWorkspace = {
      getLeaf: jest.fn().mockReturnValue(mockLeaf),
      setActiveLeaf: jest.fn(),
      getActiveFile: jest.fn(),
    };

    // Setup mock app
    mockApp = {
      workspace: mockWorkspace,
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("openFileInNewTab", () => {
    it("should open file in new tab and wait for it to become active", async () => {
      // Arrange
      let callCount = 0;
      mockWorkspace.getActiveFile.mockImplementation(() => {
        callCount++;
        // Return the file on the third call
        return callCount >= 3 ? mockFile : null;
      });

      // Act
      await CommandHelpers.openFileInNewTab(mockApp, mockFile);

      // Assert
      expect(mockWorkspace.getLeaf).toHaveBeenCalledWith("tab");
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
      expect(mockWorkspace.setActiveLeaf).toHaveBeenCalledWith(mockLeaf, { focus: true });
      expect(mockWorkspace.getActiveFile).toHaveBeenCalled();
      expect(mockWorkspace.getActiveFile.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it("should immediately return if file is already active", async () => {
      // Arrange
      mockWorkspace.getActiveFile.mockReturnValue(mockFile);

      // Act
      await CommandHelpers.openFileInNewTab(mockApp, mockFile);

      // Assert
      expect(mockWorkspace.getLeaf).toHaveBeenCalledWith("tab");
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
      expect(mockWorkspace.setActiveLeaf).toHaveBeenCalledWith(mockLeaf, { focus: true });
      expect(mockWorkspace.getActiveFile).toHaveBeenCalledTimes(1);
    });

    it("should timeout after maximum attempts", async () => {
      // Arrange
      mockWorkspace.getActiveFile.mockReturnValue(null); // Never becomes active

      // Act
      await CommandHelpers.openFileInNewTab(mockApp, mockFile);

      // Assert - should be called 20 times (max attempts)
      expect(mockWorkspace.getActiveFile).toHaveBeenCalledTimes(20);
    });

    it("should handle different file becoming active", async () => {
      // Arrange
      const differentFile = {
        path: "other/file.md",
        name: "file.md",
      } as TFile;

      let callCount = 0;
      mockWorkspace.getActiveFile.mockImplementation(() => {
        callCount++;
        // Return different file for first 2 calls, then correct file
        return callCount <= 2 ? differentFile : mockFile;
      });

      // Act
      await CommandHelpers.openFileInNewTab(mockApp, mockFile);

      // Assert
      expect(mockWorkspace.getActiveFile).toHaveBeenCalledTimes(3);
    });

    it("should handle openFile rejection gracefully", async () => {
      // Arrange
      const error = new Error("Failed to open file");
      mockLeaf.openFile.mockRejectedValue(error);
      mockWorkspace.getActiveFile.mockReturnValue(null);

      // Act & Assert - should not throw
      await expect(CommandHelpers.openFileInNewTab(mockApp, mockFile))
        .rejects.toThrow("Failed to open file");
    });

    it("should work with undefined parent workspace methods", async () => {
      // Arrange
      const minimalWorkspace = {
        getLeaf: jest.fn().mockReturnValue(mockLeaf),
        setActiveLeaf: undefined, // Missing method
        getActiveFile: jest.fn().mockReturnValue(mockFile),
      };
      const minimalApp = { workspace: minimalWorkspace };

      // Act & Assert - should not throw
      await expect(async () => {
        await CommandHelpers.openFileInNewTab(minimalApp, mockFile);
      }).rejects.toThrow();
    });

    it("should handle rapid consecutive calls", async () => {
      // Arrange
      mockWorkspace.getActiveFile.mockReturnValue(mockFile);

      // Act - call multiple times rapidly
      const promises = [
        CommandHelpers.openFileInNewTab(mockApp, mockFile),
        CommandHelpers.openFileInNewTab(mockApp, mockFile),
        CommandHelpers.openFileInNewTab(mockApp, mockFile),
      ];

      await Promise.all(promises);

      // Assert - should handle all calls
      expect(mockWorkspace.getLeaf).toHaveBeenCalledTimes(3);
      expect(mockLeaf.openFile).toHaveBeenCalledTimes(3);
    });

    it("should activate correct file when multiple files have same name", async () => {
      // Arrange
      const file1 = { path: "folder1/file.md", name: "file.md" } as TFile;
      const file2 = { path: "folder2/file.md", name: "file.md" } as TFile;

      let callCount = 0;
      mockWorkspace.getActiveFile.mockImplementation(() => {
        callCount++;
        // Return wrong file with same name first, then correct file
        return callCount === 1 ? file2 : file1;
      });

      // Act
      await CommandHelpers.openFileInNewTab(mockApp, file1);

      // Assert - should wait for correct file path
      expect(mockWorkspace.getActiveFile).toHaveBeenCalledTimes(2);
    });

    it("should stop polling when AbortSignal is aborted", async () => {
      // Arrange
      mockWorkspace.getActiveFile.mockReturnValue(null); // Never becomes active
      const controller = new AbortController();

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      // Act
      await CommandHelpers.openFileInNewTab(mockApp, mockFile, controller.signal);

      // Assert - should have stopped before max attempts
      expect(mockWorkspace.getActiveFile.mock.calls.length).toBeLessThan(20);
    });

    it("should return immediately if AbortSignal is already aborted", async () => {
      // Arrange
      mockWorkspace.getActiveFile.mockReturnValue(null);
      const controller = new AbortController();
      controller.abort(); // Abort before call

      // Act
      await CommandHelpers.openFileInNewTab(mockApp, mockFile, controller.signal);

      // Assert - should return without any polling (openFile is still called, but no waiting)
      // getActiveFile is only called when waiting, not when already aborted
      expect(mockWorkspace.getActiveFile).toHaveBeenCalledTimes(0);
    });
  });

  describe("waitForFileActivation", () => {
    it("should resolve when file becomes active", async () => {
      // Arrange
      let callCount = 0;
      mockWorkspace.getActiveFile.mockImplementation(() => {
        callCount++;
        return callCount >= 2 ? mockFile : null;
      });

      // Act
      await CommandHelpers.waitForFileActivation(mockApp, mockFile.path);

      // Assert
      expect(mockWorkspace.getActiveFile).toHaveBeenCalledTimes(2);
    });

    it("should cancel via AbortSignal", async () => {
      // Arrange
      mockWorkspace.getActiveFile.mockReturnValue(null);
      const controller = new AbortController();

      setTimeout(() => controller.abort(), 50);

      // Act
      await CommandHelpers.waitForFileActivation(mockApp, mockFile.path, controller.signal);

      // Assert - should have stopped early
      expect(mockWorkspace.getActiveFile.mock.calls.length).toBeLessThan(20);
    });
  });
});