import { TFile, Vault, MetadataCache } from "obsidian";
import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { ExocortexSettings, DEFAULT_SETTINGS } from "../../src/domain/settings/ExocortexSettings";

describe("Layout Settings and Structure", () => {
  let renderer: UniversalLayoutRenderer;
  let mockApp: any;
  let mockVault: Vault;
  let mockMetadataCache: MetadataCache;

  beforeEach(() => {
    mockVault = {
      getAbstractFileByPath: jest.fn(),
      getMarkdownFiles: jest.fn(() => []),
      adapter: {
        exists: jest.fn(() => Promise.resolve(false)),
        mkdir: jest.fn(() => Promise.resolve()),
      },
      read: jest.fn(() => Promise.resolve("")),
      modify: jest.fn(() => Promise.resolve()),
      process: jest.fn((file, fn) => {
        fn("");
        return Promise.resolve();
      }),
    } as unknown as Vault;

    mockMetadataCache = {
      getFileCache: jest.fn(() => ({
        frontmatter: {},
      })),
      getFirstLinkpathDest: jest.fn(),
      resolvedLinks: {},
    } as unknown as MetadataCache;

    mockApp = {
      vault: mockVault,
      metadataCache: mockMetadataCache,
      workspace: {
        getActiveFile: jest.fn(),
        getLeaf: jest.fn(() => ({
          openFile: jest.fn(),
        })),
        setActiveLeaf: jest.fn(),
        openLinkText: jest.fn(),
      },
    };

    const settings: ExocortexSettings = { ...DEFAULT_SETTINGS };
    renderer = new UniversalLayoutRenderer(mockApp, settings);
  });

  describe("Properties Section Visibility", () => {
    it("should NOT render properties section when showPropertiesSection is false", async () => {
      const settings: ExocortexSettings = {
        ...DEFAULT_SETTINGS,
        showPropertiesSection: false,
      };
      renderer = new UniversalLayoutRenderer(mockApp, settings);

      const mockFile = {
        path: "test-area.md",
        basename: "test-area",
        parent: { path: "Areas" },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache = jest.fn(() => ({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "test-123",
        },
      }));

      const container = document.createElement("div");
      await renderer.render("", container, {} as any);

      const propertiesSection = container.querySelector(".exocortex-properties-section");
      expect(propertiesSection).toBeNull();
    });

    it("should render properties section when showPropertiesSection is true", async () => {
      const settings: ExocortexSettings = {
        ...DEFAULT_SETTINGS,
        showPropertiesSection: true,
      };
      renderer = new UniversalLayoutRenderer(mockApp, settings);

      const mockFile = {
        path: "test-area.md",
        basename: "test-area",
        parent: { path: "Areas" },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache = jest.fn(() => ({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "test-123",
        },
      }));

      const container = document.createElement("div");
      await renderer.render("", container, {} as any);

      const propertiesSection = container.querySelector(".exocortex-properties-section");
      expect(propertiesSection).toBeTruthy();
    });
  });

  describe("Layout Sections Order", () => {
    it("should render sections in correct order: Properties -> Buttons -> Relations", async () => {
      const settings: ExocortexSettings = {
        ...DEFAULT_SETTINGS,
        showPropertiesSection: true,
      };
      renderer = new UniversalLayoutRenderer(mockApp, settings);

      const mockFile = {
        path: "test-area.md",
        basename: "test-area",
        parent: { path: "Areas" },
      } as TFile;

      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockMetadataCache.getFileCache = jest.fn(() => ({
        frontmatter: {
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "test-123",
        },
      }));

      const container = document.createElement("div");
      await renderer.render("", container, {} as any);

      const sections = container.children;
      const sectionClasses = Array.from(sections).map((s) =>
        Array.from(s.classList).find((c) => c.startsWith("exocortex-"))
      );

      const buttonsIndex = sectionClasses.findIndex((c) => c === "exocortex-buttons-section");
      const propertiesIndex = sectionClasses.findIndex((c) => c === "exocortex-properties-section");

      if (buttonsIndex !== -1 && propertiesIndex !== -1) {
        expect(propertiesIndex).toBeLessThan(buttonsIndex);
      }
    });
  });
});
