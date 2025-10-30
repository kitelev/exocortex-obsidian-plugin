import { DailyNavigationRenderer } from "../../src/presentation/renderers/DailyNavigationRenderer";
import { TFile } from "obsidian";
import { ILogger } from "../../src/infrastructure/logging/ILogger";
import { MetadataExtractor } from "@exocortex/core";

describe("DailyNavigationRenderer", () => {
  let renderer: DailyNavigationRenderer;
  let mockApp: any;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMetadataExtractor: jest.Mocked<MetadataExtractor>;

  const createMockElement = (): any => {
    const el: any = document.createElement("div");
    el.createDiv = (opts?: any) => {
      const div: any = document.createElement("div");
      if (opts?.cls) div.className = opts.cls;
      el.appendChild(div);
      div.createSpan = (opts?: any) => {
        const span: any = document.createElement("span");
        if (opts?.cls) span.className = opts.cls;
        div.appendChild(span);
        span.createEl = (tag: string, opts?: any) => {
          const element = document.createElement(tag);
          if (opts?.cls) element.className = opts.cls;
          if (opts?.text) element.textContent = opts.text;
          if (opts?.attr) {
            Object.entries(opts.attr).forEach(([key, value]) => {
              element.setAttribute(key, value as string);
            });
          }
          span.appendChild(element);
          return element;
        };
        return span;
      };
      return div;
    };
    return el;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {};

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    mockMetadataExtractor = {
      extractMetadata: jest.fn(),
      extractInstanceClass: jest.fn(),
      extractStatus: jest.fn(),
      extractIsArchived: jest.fn(),
    } as any;

    renderer = new DailyNavigationRenderer(
      mockApp,
      mockLogger,
      mockMetadataExtractor,
    );
  });

  describe("render", () => {
    it("should render navigation links for DailyNote with valid date", () => {
      // Arrange
      const mockFile = { path: "Daily Notes/2025-10-16.md" } as TFile;
      const mockMetadata = {
        exo__Instance_class: ["[[pn__DailyNote]]"],
        pn__DailyNote_day: "[[2025-10-16]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(mockMetadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[pn__DailyNote]]",
      ]);

      const mockElement = createMockElement();

      // Act
      renderer.render(mockElement, mockFile);

      // Assert
      const navContainer = mockElement.querySelector(
        ".exocortex-daily-navigation",
      );
      expect(navContainer).toBeTruthy();

      const prevLink = mockElement.querySelector(".exocortex-nav-prev a");
      expect(prevLink).toBeTruthy();
      expect(prevLink.textContent).toBe("← 2025-10-15");
      expect(prevLink.getAttribute("data-href")).toBe("2025-10-15");

      const nextLink = mockElement.querySelector(".exocortex-nav-next a");
      expect(nextLink).toBeTruthy();
      expect(nextLink.textContent).toBe("2025-10-17 →");
      expect(nextLink.getAttribute("data-href")).toBe("2025-10-17");
    });

    it("should not render for non-DailyNote assets", () => {
      // Arrange
      const mockFile = { path: "Tasks/Task-001.md" } as TFile;
      const mockMetadata = {
        exo__Instance_class: ["[[ems__Task]]"],
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(mockMetadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[ems__Task]]",
      ]);

      const mockElement = createMockElement();

      // Act
      renderer.render(mockElement, mockFile);

      // Assert
      const navContainer = mockElement.querySelector(
        ".exocortex-daily-navigation",
      );
      expect(navContainer).toBeFalsy();
    });

    it("should handle missing pn__DailyNote_day property gracefully", () => {
      // Arrange
      const mockFile = { path: "Daily Notes/2025-10-16.md" } as TFile;
      const mockMetadata = {
        exo__Instance_class: ["[[pn__DailyNote]]"],
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(mockMetadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[pn__DailyNote]]",
      ]);

      const mockElement = createMockElement();

      // Act
      renderer.render(mockElement, mockFile);

      // Assert
      const navContainer = mockElement.querySelector(
        ".exocortex-daily-navigation",
      );
      expect(navContainer).toBeFalsy();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No pn__DailyNote_day found for daily note",
      );
    });

    it("should handle month boundaries correctly", () => {
      // Arrange
      const mockFile = { path: "Daily Notes/2025-11-01.md" } as TFile;
      const mockMetadata = {
        exo__Instance_class: ["[[pn__DailyNote]]"],
        pn__DailyNote_day: "[[2025-11-01]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(mockMetadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[pn__DailyNote]]",
      ]);

      const mockElement = createMockElement();

      // Act
      renderer.render(mockElement, mockFile);

      // Assert
      const prevLink = mockElement.querySelector(".exocortex-nav-prev a");
      expect(prevLink.textContent).toBe("← 2025-10-31");

      const nextLink = mockElement.querySelector(".exocortex-nav-next a");
      expect(nextLink.textContent).toBe("2025-11-02 →");
    });

    it("should handle year boundaries correctly", () => {
      // Arrange
      const mockFile = { path: "Daily Notes/2026-01-01.md" } as TFile;
      const mockMetadata = {
        exo__Instance_class: ["[[pn__DailyNote]]"],
        pn__DailyNote_day: "[[2026-01-01]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(mockMetadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[pn__DailyNote]]",
      ]);

      const mockElement = createMockElement();

      // Act
      renderer.render(mockElement, mockFile);

      // Assert
      const prevLink = mockElement.querySelector(".exocortex-nav-prev a");
      expect(prevLink.textContent).toBe("← 2025-12-31");

      const nextLink = mockElement.querySelector(".exocortex-nav-next a");
      expect(nextLink.textContent).toBe("2026-01-02 →");
    });

    it("should recognize DailyNote without brackets", () => {
      // Arrange
      const mockFile = { path: "Daily Notes/2025-10-16.md" } as TFile;
      const mockMetadata = {
        exo__Instance_class: "pn__DailyNote",
        pn__DailyNote_day: "[[2025-10-16]]",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(mockMetadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue(
        "pn__DailyNote",
      );

      const mockElement = createMockElement();

      // Act
      renderer.render(mockElement, mockFile);

      // Assert
      const navContainer = mockElement.querySelector(
        ".exocortex-daily-navigation",
      );
      expect(navContainer).toBeTruthy();
    });

    it("should handle invalid date format gracefully", () => {
      // Arrange
      const mockFile = { path: "Daily Notes/invalid.md" } as TFile;
      const mockMetadata = {
        exo__Instance_class: ["[[pn__DailyNote]]"],
        pn__DailyNote_day: "invalid-date",
      };

      mockMetadataExtractor.extractMetadata.mockReturnValue(mockMetadata);
      mockMetadataExtractor.extractInstanceClass.mockReturnValue([
        "[[pn__DailyNote]]",
      ]);

      const mockElement = createMockElement();

      // Act
      renderer.render(mockElement, mockFile);

      // Assert
      const navContainer = mockElement.querySelector(
        ".exocortex-daily-navigation",
      );
      expect(navContainer).toBeFalsy();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Could not parse date from pn__DailyNote_day",
      );
    });
  });
});
