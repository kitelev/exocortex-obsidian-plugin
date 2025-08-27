import { UniversalLayoutRenderer } from "../../../../src/presentation/renderers/UniversalLayoutRenderer";
import { ServiceProvider } from "../../../../src/infrastructure/providers/ServiceProvider";
import { App, TFile, MarkdownPostProcessorContext } from "obsidian";
import { EnhancedCreateAssetModal } from "../../../../src/presentation/modals/EnhancedCreateAssetModal";

// Mock the EnhancedCreateAssetModal
jest.mock(
  "../../../../src/presentation/modals/EnhancedCreateAssetModal",
  () => ({
    EnhancedCreateAssetModal: jest.fn().mockImplementation(() => ({
      open: jest.fn(),
      close: jest.fn(),
    })),
  }),
);

describe("UniversalLayoutRenderer - Creation Button Feature", () => {
  let renderer: UniversalLayoutRenderer;
  let mockApp: App;
  let mockServiceProvider: ServiceProvider;
  let mockContainer: HTMLElement;
  let mockContext: MarkdownPostProcessorContext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock app
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        getAbstractFileByPath: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue(null),
        resolvedLinks: {},
      },
      workspace: {
        getActiveFile: jest.fn(),
        openLinkText: jest.fn(),
      },
    } as any;

    // Add app to window for the renderer
    (window as any).app = mockApp;

    // Setup mock service provider
    mockServiceProvider = {
      getService: jest.fn().mockReturnValue({
        findById: jest.fn(),
        save: jest.fn(),
      }),
    } as any;

    // Create renderer
    renderer = new UniversalLayoutRenderer(mockServiceProvider);

    // Setup mock container
    mockContainer = {
      createDiv: jest.fn().mockReturnValue({
        createEl: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
        }),
        createDiv: jest.fn(),
      }),
      createEl: jest.fn(),
      empty: jest.fn(),
      innerHTML: "",
      setAttribute: jest.fn(),
    } as any;

    mockContext = {} as MarkdownPostProcessorContext;
  });

  describe("Creation button rendering", () => {
    it("should render creation button when viewing a class file", async () => {
      const mockClassFile = {
        basename: "ems__Area",
        path: "classes/ems__Area.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile = jest
        .fn()
        .mockReturnValue(mockClassFile);

      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "exo__Class",
          rdfs__label: "Area",
        },
      });

      const mockButtonContainer = {
        createEl: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
        }),
      };

      const createDivSpy = jest.fn().mockReturnValue(mockButtonContainer);
      mockContainer.createDiv = createDivSpy;

      await renderer.render("UniversalLayout", mockContainer, mockContext);

      // Check that button container was created
      expect(createDivSpy).toHaveBeenCalledWith({
        cls: "exocortex-creation-button-container",
      });

      // Check that button was created with correct label
      expect(mockButtonContainer.createEl).toHaveBeenCalledWith("button", {
        text: "Create Area",
        cls: "exocortex-create-asset-button",
      });
    });

    it("should not render creation button for non-class files", async () => {
      const mockAssetFile = {
        basename: "Some Asset",
        path: "assets/Some Asset.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile = jest
        .fn()
        .mockReturnValue(mockAssetFile);

      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "ems__Area", // Not a class
          rdfs__label: "Some Asset",
        },
      });

      const createDivSpy = jest.fn();
      mockContainer.createDiv = createDivSpy;

      await renderer.render("UniversalLayout", mockContainer, mockContext);

      // Should not create button container
      const buttonContainerCall = createDivSpy.mock.calls.find(
        (call) => call[0]?.cls === "exocortex-creation-button-container",
      );
      expect(buttonContainerCall).toBeUndefined();
    });

    it("should use custom button label when configured", async () => {
      const mockClassFile = {
        basename: "test__CustomClass",
        path: "classes/test__CustomClass.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile = jest
        .fn()
        .mockReturnValue(mockClassFile);

      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "exo__Class",
          rdfs__label: "Custom Class",
          exo__Class_createButtonLabel: "Add New Item",
        },
      });

      const mockButtonContainer = {
        createEl: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
        }),
      };

      mockContainer.createDiv = jest.fn().mockReturnValue(mockButtonContainer);

      await renderer.render("UniversalLayout", mockContainer, mockContext);

      // Check button was created with custom label
      expect(mockButtonContainer.createEl).toHaveBeenCalledWith("button", {
        text: "Add New Item",
        cls: "exocortex-create-asset-button",
      });
    });

    it("should handle wikilink format in exo__Instance_class", async () => {
      const mockClassFile = {
        basename: "test__Class",
        path: "classes/test__Class.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile = jest
        .fn()
        .mockReturnValue(mockClassFile);

      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[exo__Class]]", // Wikilink format
          rdfs__label: "Test Class",
        },
      });

      const mockButtonContainer = {
        createEl: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
        }),
      };

      mockContainer.createDiv = jest.fn().mockReturnValue(mockButtonContainer);

      await renderer.render("UniversalLayout", mockContainer, mockContext);

      // Should still create button
      expect(mockButtonContainer.createEl).toHaveBeenCalledWith("button", {
        text: "Create Test Class",
        cls: "exocortex-create-asset-button",
      });
    });

    it("should open EnhancedCreateAssetModal when button is clicked", async () => {
      const mockClassFile = {
        basename: "ems__Area",
        path: "classes/ems__Area.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile = jest
        .fn()
        .mockReturnValue(mockClassFile);

      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "exo__Class",
          rdfs__label: "Area",
        },
      });

      let buttonClickHandler: Function | null = null;
      const mockButton = {
        addEventListener: jest.fn((event, handler) => {
          if (event === "click") {
            buttonClickHandler = handler;
          }
        }),
      };

      const mockButtonContainer = {
        createEl: jest.fn().mockReturnValue(mockButton),
      };

      mockContainer.createDiv = jest.fn().mockReturnValue(mockButtonContainer);

      await renderer.render("UniversalLayout", mockContainer, mockContext);

      // Simulate button click
      expect(buttonClickHandler).toBeTruthy();
      await buttonClickHandler!();

      // Check modal was created
      expect(EnhancedCreateAssetModal).toHaveBeenCalledWith(
        mockApp,
        "ems__Area",
      );
    });
  });

  describe("Button label generation", () => {
    it("should humanize class names correctly", async () => {
      const testCases = [
        { className: "ems__Area", expected: "Create Area" },
        { className: "test__CustomClass", expected: "Create Custom Class" },
        { className: "exo__Asset", expected: "Create Asset" },
        { className: "ui__ClassLayout", expected: "Create Class Layout" },
      ];

      for (const testCase of testCases) {
        const mockClassFile = {
          basename: testCase.className,
          path: `classes/${testCase.className}.md`,
          stat: { ctime: Date.now(), mtime: Date.now() },
        } as TFile;

        mockApp.workspace.getActiveFile = jest
          .fn()
          .mockReturnValue(mockClassFile);

        mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
          frontmatter: {
            exo__Instance_class: "exo__Class",
          },
        });

        const mockButtonContainer = {
          createEl: jest.fn().mockReturnValue({
            addEventListener: jest.fn(),
          }),
        };

        mockContainer.createDiv = jest
          .fn()
          .mockReturnValue(mockButtonContainer);

        await renderer.render("UniversalLayout", mockContainer, mockContext);

        expect(mockButtonContainer.createEl).toHaveBeenCalledWith("button", {
          text: testCase.expected,
          cls: "exocortex-create-asset-button",
        });

        // Reset for next test
        jest.clearAllMocks();
      }
    });
  });

  describe("Integration with asset relations", () => {
    it("should render button before asset relations", async () => {
      const mockClassFile = {
        basename: "test__Class",
        path: "classes/test__Class.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.workspace.getActiveFile = jest
        .fn()
        .mockReturnValue(mockClassFile);

      mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
        frontmatter: {
          exo__Instance_class: "exo__Class",
        },
      });

      // Setup some mock related assets
      const mockRelatedAsset = {
        basename: "Test Asset",
        path: "assets/Test Asset.md",
        stat: { ctime: Date.now(), mtime: Date.now() },
      } as TFile;

      mockApp.metadataCache.resolvedLinks = {
        "assets/Test Asset.md": {
          "classes/test__Class.md": 1,
        },
      };

      mockApp.vault.getAbstractFileByPath = jest
        .fn()
        .mockReturnValue(mockRelatedAsset);

      const callOrder: string[] = [];

      const mockButtonContainer = {
        createEl: jest.fn(() => {
          callOrder.push("button");
          return { addEventListener: jest.fn() };
        }),
      };

      const mockRelationsContainer = {
        createEl: jest.fn(() => {
          callOrder.push("relations");
          return { createEl: jest.fn(), createDiv: jest.fn() };
        }),
        createDiv: jest.fn(),
      };

      mockContainer.createDiv = jest.fn((config) => {
        if (config?.cls === "exocortex-creation-button-container") {
          return mockButtonContainer;
        } else if (config?.cls === "exocortex-assets-relations") {
          return mockRelationsContainer;
        }
        return { createEl: jest.fn(), createDiv: jest.fn() };
      });

      await renderer.render("UniversalLayout", mockContainer, mockContext);

      // Button should be created before relations (or relations not created if no assets found)
      if (callOrder.includes("relations")) {
        expect(callOrder.indexOf("button")).toBeLessThan(
          callOrder.indexOf("relations"),
        );
      } else {
        // At least verify button was created
        expect(callOrder).toContain("button");
      }
    });
  });
});
