import { UniversalLayoutRenderer } from "../../src/presentation/renderers/UniversalLayoutRenderer";
import { ExocortexSettings } from "../../src/domain/settings/ExocortexSettings";

describe("UniversalLayoutRenderer", () => {
  let mockApp: any;
  let mockSettings: ExocortexSettings;
  let mockPlugin: any;

  beforeEach(() => {
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        modify: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue({ frontmatter: {} }),
        getFirstLinkpathDest: jest.fn(),
      },
      workspace: {
        getActiveFile: jest.fn(),
        getLeaf: jest.fn().mockReturnValue({
          openLinkText: jest.fn(),
        }),
        openLinkText: jest.fn(),
      },
    };

    mockSettings = {
      showPropertiesSection: false,
      showLayoutByDefault: true,
      showArchivedAssets: false,
    } as ExocortexSettings;

    mockPlugin = {
      saveSettings: jest.fn(),
    };
  });

  it("should create renderer instance", () => {
    const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin);
    expect(renderer).toBeDefined();
  });

  it("should cleanup without errors", () => {
    const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin);
    expect(() => renderer.cleanup()).not.toThrow();
  });

  it("should invalidate backlinks cache without errors", () => {
    const renderer = new UniversalLayoutRenderer(mockApp, mockSettings, mockPlugin);
    expect(() => renderer.invalidateBacklinksCache()).not.toThrow();
  });
});
