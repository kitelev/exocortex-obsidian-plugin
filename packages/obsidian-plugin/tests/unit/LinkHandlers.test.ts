import { LinkHandlers } from "../../src/presentation/renderers/helpers/LinkHandlers";
import { Keymap } from "obsidian";
import { createMockApp } from "./helpers/testHelpers";

jest.mock("obsidian", () => ({
  Keymap: {
    isModEvent: jest.fn(),
  },
}));

describe("LinkHandlers", () => {
  let mockApp: any;
  let mockLeaf: any;

  beforeEach(() => {
    mockLeaf = {
      openLinkText: jest.fn().mockResolvedValue(undefined),
    };

    mockApp = createMockApp({
      workspace: {
        getLeaf: jest.fn().mockReturnValue(mockLeaf),
        openLinkText: jest.fn().mockResolvedValue(undefined),
      },
    });

    jest.clearAllMocks();
  });

  describe("createLinkClickHandler", () => {
    it("should return a function that handles link clicks", () => {
      const handler = LinkHandlers.createLinkClickHandler(mockApp);
      expect(typeof handler).toBe("function");
    });

    describe("when no modifier key is pressed", () => {
      beforeEach(() => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(false);
      });

      it("should open link in current pane", async () => {
        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await handler("test/path.md", mockEvent);

        expect(Keymap.isModEvent).toHaveBeenCalledWith({});
        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
          "test/path.md",
          "",
          false
        );
        expect(mockApp.workspace.getLeaf).not.toHaveBeenCalled();
        expect(mockLeaf.openLinkText).not.toHaveBeenCalled();
      });

      it("should handle different path formats", async () => {
        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await handler("folder/subfolder/file.md", mockEvent);

        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
          "folder/subfolder/file.md",
          "",
          false
        );
      });
    });

    describe("when modifier key is pressed", () => {
      beforeEach(() => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(true);
      });

      it("should open link in new tab", async () => {
        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await handler("test/path.md", mockEvent);

        expect(Keymap.isModEvent).toHaveBeenCalledWith({});
        expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
        expect(mockLeaf.openLinkText).toHaveBeenCalledWith("test/path.md", "");
        expect(mockApp.workspace.openLinkText).not.toHaveBeenCalled();
      });

      it("should handle Cmd key on macOS", async () => {
        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = {
          nativeEvent: {
            metaKey: true,
            ctrlKey: false,
          } as MouseEvent,
        } as React.MouseEvent;

        (Keymap.isModEvent as jest.Mock).mockImplementation((event: MouseEvent) => {
          return event.metaKey === true;
        });

        await handler("macos/file.md", mockEvent);

        expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
        expect(mockLeaf.openLinkText).toHaveBeenCalledWith("macos/file.md", "");
      });

      it("should handle Ctrl key on Windows/Linux", async () => {
        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = {
          nativeEvent: {
            metaKey: false,
            ctrlKey: true,
          } as MouseEvent,
        } as React.MouseEvent;

        (Keymap.isModEvent as jest.Mock).mockImplementation((event: MouseEvent) => {
          return event.ctrlKey === true;
        });

        await handler("windows/file.md", mockEvent);

        expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("tab");
        expect(mockLeaf.openLinkText).toHaveBeenCalledWith("windows/file.md", "");
      });
    });

    describe("error handling", () => {
      it("should propagate errors from workspace.openLinkText", async () => {
        const error = new Error("Failed to open link");
        mockApp.workspace.openLinkText.mockRejectedValue(error);
        (Keymap.isModEvent as jest.Mock).mockReturnValue(false);

        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await expect(handler("error/file.md", mockEvent)).rejects.toThrow(
          "Failed to open link"
        );
      });

      it("should propagate errors from leaf.openLinkText", async () => {
        const error = new Error("Failed to open in new tab");
        mockLeaf.openLinkText.mockRejectedValue(error);
        (Keymap.isModEvent as jest.Mock).mockReturnValue(true);

        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await expect(handler("error/file.md", mockEvent)).rejects.toThrow(
          "Failed to open in new tab"
        );
      });
    });

    describe("edge cases", () => {
      it("should handle empty path", async () => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(false);

        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        await handler("", mockEvent);

        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith("", "", false);
      });

      it("should handle special characters in path", async () => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(false);

        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const mockEvent = { nativeEvent: {} } as React.MouseEvent;

        const specialPath = "path with spaces/[brackets]/file (1).md";
        await handler(specialPath, mockEvent);

        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
          specialPath,
          "",
          false
        );
      });

      it("should handle React synthetic events properly", async () => {
        (Keymap.isModEvent as jest.Mock).mockReturnValue(false);

        const handler = LinkHandlers.createLinkClickHandler(mockApp);
        const nativeEvent = new MouseEvent("click");
        const syntheticEvent = {
          nativeEvent,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        } as unknown as React.MouseEvent;

        await handler("react/file.md", syntheticEvent);

        expect(Keymap.isModEvent).toHaveBeenCalledWith(nativeEvent);
        expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
          "react/file.md",
          "",
          false
        );
      });
    });
  });
});