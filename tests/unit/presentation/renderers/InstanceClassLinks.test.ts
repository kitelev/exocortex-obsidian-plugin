import { BaseAssetRelationsRenderer } from "../../../../src/presentation/renderers/BaseAssetRelationsRenderer";
import { App, TFile } from "obsidian";

// Create a test class that exposes protected methods
class TestableBaseAssetRelationsRenderer extends BaseAssetRelationsRenderer {
  constructor(app: App) {
    super(app);
  }

  // Expose protected method for testing
  public testRenderInstanceClassLinks(
    container: HTMLElement,
    metadata: Record<string, any>,
  ): void {
    this.renderInstanceClassLinks(container, metadata);
  }

  // Required abstract method implementation
  async render(): Promise<void> {
    // Not used in tests
  }
}

describe("Instance Class Links Rendering", () => {
  let renderer: TestableBaseAssetRelationsRenderer;
  let mockApp: any;
  let container: HTMLElement;

  beforeEach(() => {
    // Setup mock app
    mockApp = {
      workspace: {
        openLinkText: jest.fn(),
        getLeaf: jest.fn().mockReturnValue({
          openFile: jest.fn(),
        }),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
      metadataCache: {
        resolvedLinks: {},
        getFileCache: jest.fn(),
      },
    };

    renderer = new TestableBaseAssetRelationsRenderer(mockApp);
    container = document.createElement("div");

    // Mock Obsidian's HTMLElement extensions
    (container as any).createSpan = jest.fn((options: any) => {
      const span = document.createElement("span");
      if (options.text) span.textContent = options.text;
      if (options.cls) span.className = options.cls;
      container.appendChild(span);
      return span;
    });

    (container as any).createEl = jest.fn((tag: string, options: any = {}) => {
      const element = document.createElement(tag);
      if (options.text) element.textContent = options.text;
      if (options.cls) element.className = options.cls;
      if (options.href) element.setAttribute("href", options.href);
      container.appendChild(element);
      return element;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Single instance class values", () => {
    it("should render single wiki-link as clickable link", () => {
      const metadata = {
        exo__Instance_class: "[[ems__Project]]",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector("a.instance-class-link");
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe("ems__Project");
      expect(link?.getAttribute("href")).toBe("ems__Project.md");
    });

    it("should render plain text as clickable link", () => {
      const metadata = {
        exo__Instance_class: "ems__Task",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector("a.instance-class-link");
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe("ems__Task");
      expect(link?.getAttribute("href")).toBe("ems__Task.md");
    });

    it("should handle piped links with custom text", () => {
      const metadata = {
        exo__Instance_class: "[[ems__CustomClass|My Custom Class]]",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector("a.instance-class-link");
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe("My Custom Class");
      expect(link?.getAttribute("href")).toBe("ems__CustomClass.md");
    });

    it("should display dash for missing instance class", () => {
      const metadata = {};

      renderer.testRenderInstanceClassLinks(container, metadata);

      const span = container.querySelector("span.no-instance-class");
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe("-");
    });

    it("should display dash for null instance class", () => {
      const metadata = {
        exo__Instance_class: null,
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const span = container.querySelector("span.no-instance-class");
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe("-");
    });
  });

  describe("Array instance class values", () => {
    it("should render multiple wiki-links as separate clickable links", () => {
      const metadata = {
        exo__Instance_class: [
          "[[ems__Task]]",
          "[[ems__Effort]]",
          "[[ems__Milestone]]",
        ],
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const links = container.querySelectorAll("a.instance-class-link");
      expect(links.length).toBe(3);
      expect(links[0].textContent).toBe("ems__Task");
      expect(links[1].textContent).toBe("ems__Effort");
      expect(links[2].textContent).toBe("ems__Milestone");

      // Check separators
      const separators = container.querySelectorAll("span.separator");
      expect(separators.length).toBe(2);
      expect(separators[0].textContent).toBe(", ");
    });

    it("should handle mixed format links in array", () => {
      const metadata = {
        exo__Instance_class: [
          "[[ems__Project]]",
          "ems__Task",
          "[[ems__Area|Custom Area]]",
        ],
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const links = container.querySelectorAll("a.instance-class-link");
      expect(links.length).toBe(3);
      expect(links[0].textContent).toBe("ems__Project");
      expect(links[1].textContent).toBe("ems__Task");
      expect(links[2].textContent).toBe("Custom Area");
      expect(links[2].getAttribute("href")).toBe("ems__Area.md");
    });

    it("should display dash for empty array", () => {
      const metadata = {
        exo__Instance_class: [],
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const span = container.querySelector("span.no-instance-class");
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe("-");
    });
  });

  describe("Click event handling", () => {
    it("should handle regular click", () => {
      const metadata = {
        exo__Instance_class: "[[ems__Project]]",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector(
        "a.instance-class-link",
      ) as HTMLElement;
      const event = new MouseEvent("click", { bubbles: true });
      link.dispatchEvent(event);

      expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
        "ems__Project",
        "",
        false,
      );
    });

    it("should handle Ctrl+Click for new tab", () => {
      const metadata = {
        exo__Instance_class: "[[ems__Task]]",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector(
        "a.instance-class-link",
      ) as HTMLElement;
      const event = new MouseEvent("click", {
        bubbles: true,
        ctrlKey: true,
      });
      link.dispatchEvent(event);

      expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
        "ems__Task",
        "",
        true,
      );
    });

    it("should handle Shift+Click for split pane", () => {
      const metadata = {
        exo__Instance_class: "[[ems__Area]]",
      };

      // Create a mock TFile instance
      const mockFile = Object.create(TFile.prototype);
      mockFile.path = "ems__Area.md";
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

      // Mock the leaf
      const mockLeaf = {
        openFile: jest.fn(),
      };
      mockApp.workspace.getLeaf.mockReturnValue(mockLeaf);

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector(
        "a.instance-class-link",
      ) as HTMLElement;
      const event = new MouseEvent("click", {
        bubbles: true,
        shiftKey: true,
      });
      link.dispatchEvent(event);

      expect(mockApp.workspace.getLeaf).toHaveBeenCalledWith("split");
      expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith(
        "ems__Area.md",
      );
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
    });

    it("should handle middle mouse button click", () => {
      const metadata = {
        exo__Instance_class: "[[ems__Zone]]",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector(
        "a.instance-class-link",
      ) as HTMLElement;
      const event = new MouseEvent("auxclick", {
        bubbles: true,
        button: 1,
      });
      link.dispatchEvent(event);

      expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
        "ems__Zone",
        "",
        true,
      );
    });
  });

  describe("Special characters and edge cases", () => {
    it("should handle links with special characters", () => {
      const metadata = {
        exo__Instance_class: "[[ems__Project-2024]]",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector("a.instance-class-link");
      expect(link?.textContent).toBe("ems__Project-2024");
      expect(link?.getAttribute("href")).toBe("ems__Project-2024.md");
    });

    it("should handle links with paths", () => {
      const metadata = {
        exo__Instance_class: "[[folder/ems__Task]]",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector("a.instance-class-link");
      expect(link?.textContent).toBe("folder/ems__Task");
      expect(link?.getAttribute("href")).toBe("folder/ems__Task.md");
    });

    it("should handle already .md suffixed links", () => {
      const metadata = {
        exo__Instance_class: "ems__Project.md",
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const link = container.querySelector("a.instance-class-link");
      // Should not add double .md suffix
      expect(link?.getAttribute("href")).toBe("ems__Project.md");
    });

    it("should handle very long arrays gracefully", () => {
      const longArray = Array.from(
        { length: 20 },
        (_, i) => `[[ems__Class${i}]]`,
      );
      const metadata = {
        exo__Instance_class: longArray,
      };

      renderer.testRenderInstanceClassLinks(container, metadata);

      const links = container.querySelectorAll("a.instance-class-link");
      expect(links.length).toBe(20);

      // Check all links are rendered
      links.forEach((link, i) => {
        expect(link.textContent).toBe(`ems__Class${i}`);
      });

      // Check separators
      const separators = container.querySelectorAll("span.separator");
      expect(separators.length).toBe(19);
    });
  });
});
