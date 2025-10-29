import { AssetMetadataService } from "../../src/presentation/renderers/layout/helpers/AssetMetadataService";
import { TFile } from "obsidian";

describe("AssetMetadataService", () => {
  let service: AssetMetadataService;
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      metadataCache: {
        getFirstLinkpathDest: jest.fn(),
        getFileCache: jest.fn(),
      },
    };
    service = new AssetMetadataService(mockApp);
  });

  describe("getAssetLabel", () => {
    it("should return label from asset frontmatter", () => {
      const mockFile = new TFile();
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(mockFile);
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          exo__Asset_label: "Test Label",
        },
      });

      const result = service.getAssetLabel("test-path");

      expect(result).toBe("Test Label");
    });

    it("should return null when file not found", () => {
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(null);

      const result = service.getAssetLabel("test-path");

      expect(result).toBeNull();
    });

    it("should fallback to prototype label", () => {
      const mockFile = new TFile();
      const mockPrototypeFile = new TFile();
      mockApp.metadataCache.getFirstLinkpathDest
        .mockReturnValueOnce(mockFile)
        .mockReturnValueOnce(mockPrototypeFile);
      mockApp.metadataCache.getFileCache
        .mockReturnValueOnce({
          frontmatter: {
            ems__Effort_prototype: "[[prototype-path]]",
          },
        })
        .mockReturnValueOnce({
          frontmatter: {
            exo__Asset_label: "Prototype Label",
          },
        });

      const result = service.getAssetLabel("test-path");

      expect(result).toBe("Prototype Label");
    });
  });

  describe("extractFirstValue", () => {
    it("should extract string value", () => {
      const result = service.extractFirstValue("test-value");
      expect(result).toBe("test-value");
    });

    it("should extract first array element", () => {
      const result = service.extractFirstValue(["first", "second"]);
      expect(result).toBe("first");
    });

    it("should return null for empty values", () => {
      expect(service.extractFirstValue(null)).toBeNull();
      expect(service.extractFirstValue(undefined)).toBeNull();
      expect(service.extractFirstValue("")).toBeNull();
      expect(service.extractFirstValue([])).toBeNull();
    });

    it("should strip wiki link brackets", () => {
      const result = service.extractFirstValue("[[test-link]]");
      expect(result).toBe("test-link");
    });
  });

  describe("getEffortArea", () => {
    it("should return direct area", () => {
      const metadata = {
        ems__Effort_area: "direct-area",
      };

      const result = service.getEffortArea(metadata);

      expect(result).toBe("direct-area");
    });

    it("should return null for missing metadata", () => {
      const result = service.getEffortArea({});
      expect(result).toBeNull();
    });

    it("should resolve area from prototype", () => {
      const mockPrototypeFile = new TFile();
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(
        mockPrototypeFile,
      );
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: {
          ems__Effort_area: "prototype-area",
        },
      });

      const metadata = {
        ems__Effort_prototype: "[[prototype-path]]",
      };

      const result = service.getEffortArea(metadata);

      expect(result).toBe("prototype-area");
    });
  });

  describe("extractInstanceClass", () => {
    it("should extract string class", () => {
      const metadata = {
        exo__Instance_class: "Task",
      };

      const result = service.extractInstanceClass(metadata);

      expect(result).toBe("Task");
    });

    it("should extract first class from array", () => {
      const metadata = {
        exo__Instance_class: ["Task", "Project"],
      };

      const result = service.extractInstanceClass(metadata);

      expect(result).toBe("Task");
    });

    it("should strip wiki link brackets", () => {
      const metadata = {
        exo__Instance_class: "[[Task]]",
      };

      const result = service.extractInstanceClass(metadata);

      expect(result).toBe("Task");
    });

    it("should return empty string for missing class", () => {
      const metadata = {};

      const result = service.extractInstanceClass(metadata);

      expect(result).toBe("");
    });
  });
});
