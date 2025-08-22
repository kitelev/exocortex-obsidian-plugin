import { CustomLayoutRenderingStrategy } from "../../../../src/presentation/strategies/CustomLayoutRenderingStrategy";
import { IBlockRendererFactory } from "../../../../src/presentation/factories/IBlockRendererFactory";
import { LayoutMother } from "../../../__builders__/LayoutMother";
import { Result } from "../../../../src/domain/core/Result";

describe("CustomLayoutRenderingStrategy", () => {
  let strategy: CustomLayoutRenderingStrategy;
  let mockBlockRendererFactory: jest.Mocked<IBlockRendererFactory>;
  let mockBlockRenderer: any;

  beforeEach(() => {
    // Mock block renderer
    mockBlockRenderer = {
      render: jest.fn().mockResolvedValue(Result.ok()),
    };

    // Mock block renderer factory
    mockBlockRendererFactory = {
      createRenderer: jest.fn().mockReturnValue(Result.ok(mockBlockRenderer)),
      getSupportedBlockTypes: jest
        .fn()
        .mockReturnValue(["properties", "backlinks"]),
    } as jest.Mocked<IBlockRendererFactory>;

    strategy = new CustomLayoutRenderingStrategy(mockBlockRendererFactory);
  });

  describe("Strategy Selection", () => {
    it("should handle non-null layouts", () => {
      const layout = LayoutMother.simple();

      expect(strategy.canHandle(layout)).toBe(true);
    });

    it("should not handle null layouts", () => {
      expect(strategy.canHandle(null)).toBe(false);
    });

    it("should not handle undefined layouts", () => {
      expect(strategy.canHandle(undefined as any)).toBe(false);
    });
  });

  describe("Layout Rendering", () => {
    it("should render layout with visible blocks", async () => {
      const layout = LayoutMother.create()
        .withPropertiesBlock("props", "Properties")
        .withBacklinksBlock("backlinks", "Backlinks")
        .build();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: { title: "Test" } },
        dataviewApi: null,
      };

      const result = await strategy.render(context, layout);

      expect(result.isSuccess).toBe(true);

      // Should create block containers
      const blocks = container.querySelectorAll("[data-block-id]");
      expect(blocks.length).toBe(2);

      // Should call block renderers
      expect(mockBlockRendererFactory.createRenderer).toHaveBeenCalledWith(
        "properties",
      );
      expect(mockBlockRendererFactory.createRenderer).toHaveBeenCalledWith(
        "backlinks",
      );
      expect(mockBlockRenderer.render).toHaveBeenCalledTimes(2);
    });

    it("should handle blocks with titles and headers", async () => {
      const layout = LayoutMother.create()
        .withPropertiesBlock("props", "Custom Properties Title")
        .build();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: { title: "Test" } },
        dataviewApi: null,
      };

      await strategy.render(context, layout);

      const header = container.querySelector(".exocortex-block-header");
      expect(header).toBeTruthy();
      expect(header?.textContent).toBe("Custom Properties Title");
    });

    it("should handle collapsible blocks", async () => {
      const layout = LayoutMother.withCollapsibleBlocks();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: { title: "Test" } },
        dataviewApi: null,
      };

      await strategy.render(context, layout);

      const collapsibleHeaders = container.querySelectorAll(".is-collapsible");
      expect(collapsibleHeaders.length).toBeGreaterThan(0);
    });

    it("should add layout metadata information", async () => {
      const layout = LayoutMother.simple();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: { title: "Test" } },
        dataviewApi: null,
      };

      await strategy.render(context, layout);

      const layoutInfo = container.querySelector(".exocortex-layout-info");
      expect(layoutInfo).toBeTruthy();
      expect(layoutInfo?.getAttribute("data-layout-id")).toBe(
        layout.id.toString(),
      );
      expect(layoutInfo?.getAttribute("data-layout-class")).toBe(
        layout.targetClass.value,
      );
    });
  });

  describe("Error Handling", () => {
    it("should fail when layout is null", async () => {
      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: {} },
        dataviewApi: null,
      };

      const result = await strategy.render(context, null as any);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Layout is required");
    });

    it("should fail when container is missing", async () => {
      const layout = LayoutMother.simple();
      const context = {
        container: null as any,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: {} },
        dataviewApi: null,
      };

      const result = await strategy.render(context, layout);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Container is required");
    });

    it("should fail when metadata is missing", async () => {
      const layout = LayoutMother.simple();
      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: null as any,
        dataviewApi: null,
      };

      const result = await strategy.render(context, layout);

      expect(result.isFailure).toBe(true);
    });

    it("should handle unknown block types gracefully", async () => {
      // Mock factory to return failure for unknown block type
      mockBlockRendererFactory.createRenderer.mockReturnValue(
        Result.fail("Unknown block type"),
      );

      const layout = LayoutMother.create()
        .withPropertiesBlock("props", "Properties")
        .build();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: {} },
        dataviewApi: null,
      };

      const result = await strategy.render(context, layout);

      // Should succeed overall but show error for individual block
      expect(result.isSuccess).toBe(true);

      // Should show error in block content
      const errorText = container.querySelector(".exocortex-error");
      expect(errorText).toBeTruthy();
    });

    it("should handle block rendering failures gracefully", async () => {
      // Mock block renderer to fail
      mockBlockRenderer.render.mockResolvedValue(
        Result.fail("Block rendering failed"),
      );

      const layout = LayoutMother.create()
        .withPropertiesBlock("props", "Properties")
        .build();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: {} },
        dataviewApi: null,
      };

      const result = await strategy.render(context, layout);

      // Should succeed overall but show error for individual block
      expect(result.isSuccess).toBe(true);

      // Should create block container even if rendering fails
      const blocks = container.querySelectorAll("[data-block-id]");
      expect(blocks.length).toBe(1);
    });
  });

  describe("Block Structure Creation", () => {
    it("should create proper block container structure", async () => {
      const layout = LayoutMother.create()
        .withPropertiesBlock("test-props", "Test Properties")
        .build();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: {} },
        dataviewApi: null,
      };

      await strategy.render(context, layout);

      // Check block container structure
      const blockContainer = container.querySelector(
        '[data-block-id="test-props"]',
      );
      expect(blockContainer).toBeTruthy();
      expect(blockContainer?.classList.contains("exocortex-block")).toBe(true);
      expect(
        blockContainer?.classList.contains("exocortex-block-properties"),
      ).toBe(true);

      // Check header
      const header = blockContainer?.querySelector(".exocortex-block-header");
      expect(header).toBeTruthy();
      expect(header?.textContent).toBe("Test Properties");

      // Check content container
      const content = blockContainer?.querySelector(".exocortex-block-content");
      expect(content).toBeTruthy();
    });

    it("should handle blocks without titles", async () => {
      const layout = LayoutMother.create()
        .withBlock({
          id: "no-title",
          type: "properties",
          title: "",
          order: 0,
          config: { type: "properties" },
          isVisible: true,
        })
        .build();

      const container = document.createElement("div");
      const context = {
        container,
        file: { path: "test.md" } as any,
        metadata: { frontmatter: {} },
        dataviewApi: null,
      };

      await strategy.render(context, layout);

      const blockContainer = container.querySelector(
        '[data-block-id="no-title"]',
      );
      expect(blockContainer).toBeTruthy();

      // Should not create header for empty title
      const header = blockContainer?.querySelector(".exocortex-block-header");
      expect(header).toBeFalsy();
    });
  });
});
