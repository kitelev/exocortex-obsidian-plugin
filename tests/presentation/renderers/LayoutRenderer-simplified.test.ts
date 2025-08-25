import { TFile } from "obsidian";
import { LayoutRenderer } from "../../../src/presentation/renderers/LayoutRenderer";
import { IClassLayoutRepository } from "../../../src/domain/repositories/IClassLayoutRepository";
import { ClassLayout } from "../../../src/domain/entities/ClassLayout";
import { ClassName } from "../../../src/domain/value-objects/ClassName";
import { AssetId } from "../../../src/domain/value-objects/AssetId";
import { Result } from "../../../src/domain/core/Result";
import { App, Vault } from "../../__mocks__/obsidian";

// Mock dependencies
const mockApp = new App();

const mockLayoutRepository: jest.Mocked<IClassLayoutRepository> = {
  findByClass: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findEnabledByClass: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe("LayoutRenderer - Simplified Configuration Integration", () => {
  let renderer: LayoutRenderer;
  let container: HTMLElement;
  let mockFile: TFile;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create renderer
    renderer = new LayoutRenderer(mockApp as any, mockLayoutRepository);

    // Create DOM container
    container = document.createElement("div");

    // Create mock file
    mockFile = {
      path: "test.md",
      basename: "test",
      stat: { ctime: 0, mtime: 0, size: 0 },
    } as TFile;

    // Setup default app mocks
    jest.spyOn(mockApp.metadataCache, 'getBacklinksForFile').mockReturnValue({
      data: new Map(),
      count: () => 0,
      keys: () => [],
    });

    jest.spyOn(mockApp.vault, 'getAbstractFileByPath').mockReturnValue(null);
    jest.spyOn(mockApp.metadataCache, 'getFileCache').mockReturnValue({
      frontmatter: {},
      sections: [],
      headings: [],
      links: [],
      embeds: [],
      tags: [],
    });
    jest.spyOn(mockApp.workspace, 'openLinkText').mockReturnValue(undefined);
  });

  describe("Simplified Layout Detection", () => {
    it("should detect simplified configuration and render simplified layout", async () => {
      // Setup: Frontmatter with simplified configuration
      const metadata = {
        frontmatter: {
          "exo__Instance_class": "ems__Project",
          "ui__LayoutBlock_display_properties": [
            "[[ems__Effort_status]]",
            "[[ems__Effort_priority]]",
          ],
        },
      };

      // Mock: No custom layout found to trigger default layout path
      mockLayoutRepository.findEnabledByClass.mockResolvedValue([]);

      // Mock: Simplified renderer dependencies - empty backlinks for simple test
      jest.spyOn(mockApp.metadataCache, 'getBacklinksForFile').mockReturnValue({
        data: new Map(),
        count: () => 0,
        keys: () => [],
      });

      // Act
      await renderer.renderLayout(container, mockFile, metadata, null);

      // Assert: Check that simplified layout was rendered
      expect(container.children.length).toBeGreaterThan(0);
      
      // Should have simplified layout container
      const simplifiedLayout = container.querySelector(
        ".exocortex-simplified-layout"
      );
      expect(simplifiedLayout).toBeTruthy();

      // Should have header
      const header = container.querySelector(".exocortex-block-header");
      expect(header).toBeTruthy();
      expect(header?.textContent).toBe("Related Assets");
    });

    it("should fall back to complex layout when simplified config is not present", async () => {
      // Setup: Normal frontmatter without simplified config
      const metadata = {
        frontmatter: {
          "exo__Instance_class": "ems__Project",
        },
      };

      // Mock: Return complex layout
      const assetId = AssetId.generate();
      const classNameResult = ClassName.create("ems__Project");
      
      expect(classNameResult.isSuccess).toBe(true);
      
      const mockComplexLayout = ClassLayout.create({
        id: assetId,
        targetClass: classNameResult.getValue(),
        blocks: [],
        isEnabled: true,
        priority: 1,
      }).getValue();

      mockLayoutRepository.findEnabledByClass.mockResolvedValue([mockComplexLayout]);

      // Act
      await renderer.renderLayout(container, mockFile, metadata, null);

      // Assert: Should not render simplified layout
      const simplifiedLayout = container.querySelector(
        ".exocortex-simplified-layout"
      );
      expect(simplifiedLayout).toBeFalsy();

      // Should have layout info for complex layout
      const layoutInfo = container.querySelector(".exocortex-layout-info");
      expect(layoutInfo).toBeTruthy();
    });

    it("should handle simplified config in default layout when no custom layout exists", async () => {
      // Setup: Frontmatter with simplified config but no custom layout
      const metadata = {
        frontmatter: {
          "exo__Instance_class": "ems__Project",
          "ui__LayoutBlock_display_properties": [
            "[[ems__Effort_status]]",
          ],
        },
      };

      // Mock: No custom layout found
      mockLayoutRepository.findEnabledByClass.mockResolvedValue([]);

      // Mock simplified renderer dependencies
      mockApp.metadataCache.getBacklinksForFile.mockReturnValue({
        data: new Map(),
      });

      // Act
      await renderer.renderLayout(container, mockFile, metadata, null);

      // Assert: Should render simplified layout even in default case
      const simplifiedLayout = container.querySelector(
        ".exocortex-simplified-layout"
      );
      expect(simplifiedLayout).toBeTruthy();
    });

    it("should handle invalid simplified configuration gracefully", async () => {
      // Setup: Invalid simplified configuration
      const metadata = {
        frontmatter: {
          "exo__Instance_class": "ems__Project",
          "ui__LayoutBlock_display_properties": "invalid-not-array",
        },
      };

      // Mock: No custom layout found
      mockLayoutRepository.findEnabledByClass.mockResolvedValue([]);

      // Act
      await renderer.renderLayout(container, mockFile, metadata, null);

      // Assert: Should fall back to normal default layout
      const dynamicBacklinks = container.querySelector(
        ".exocortex-block-dynamic-backlinks"
      );
      expect(dynamicBacklinks).toBeTruthy();

      // Should not render simplified layout
      const simplifiedLayout = container.querySelector(
        ".exocortex-simplified-layout"
      );
      expect(simplifiedLayout).toBeFalsy();
    });

    it("should handle empty simplified configuration gracefully", async () => {
      // Setup: Empty simplified configuration
      const metadata = {
        frontmatter: {
          "exo__Instance_class": "ems__Project",
          "ui__LayoutBlock_display_properties": [],
        },
      };

      // Mock: No custom layout found
      mockLayoutRepository.findEnabledByClass.mockResolvedValue([]);

      // Act
      await renderer.renderLayout(container, mockFile, metadata, null);

      // Assert: Empty array should fall back to normal default layout
      const dynamicBacklinks = container.querySelector(
        ".exocortex-block-dynamic-backlinks"
      );
      expect(dynamicBacklinks).toBeTruthy();

      // Should not render simplified layout
      const simplifiedLayout = container.querySelector(
        ".exocortex-simplified-layout"
      );
      expect(simplifiedLayout).toBeFalsy();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in simplified layout creation gracefully", async () => {
      // Setup: Configuration that will cause SimplifiedLayoutBlock creation to fail
      const metadata = {
        frontmatter: {
          "exo__Instance_class": "ems__Project",
          "ui__LayoutBlock_display_properties": [
            "invalid-property-format", // Invalid format - missing [[ ]]
          ],
        },
      };

      // Mock: No custom layout found
      mockLayoutRepository.findEnabledByClass.mockResolvedValue([]);

      // Act
      await renderer.renderLayout(container, mockFile, metadata, null);

      // Assert: Should render error message
      const errorElement = container.querySelector(".exocortex-error");
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain("Invalid simplified layout configuration");
      expect(errorElement?.textContent).toContain("Invalid property reference format");
    });
  });
});