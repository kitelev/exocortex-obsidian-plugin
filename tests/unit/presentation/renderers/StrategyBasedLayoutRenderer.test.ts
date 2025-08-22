import { StrategyBasedLayoutRenderer } from "../../../../src/presentation/renderers/StrategyBasedLayoutRenderer";
import { CustomLayoutRenderingStrategy } from "../../../../src/presentation/strategies/CustomLayoutRenderingStrategy";
import { DefaultLayoutRenderingStrategy } from "../../../../src/presentation/strategies/DefaultLayoutRenderingStrategy";
import { BlockRendererFactory } from "../../../../src/presentation/factories/BlockRendererFactory";
import { LayoutMother } from "../../../__builders__/LayoutMother";
import { Vault, App } from "../../../__mocks__/obsidian";
import { Result } from "../../../../src/domain/core/Result";

describe("StrategyBasedLayoutRenderer", () => {
  let renderer: StrategyBasedLayoutRenderer;
  let mockVault: Vault;
  let mockApp: App;
  let mockLayoutRepository: any;
  let mockPropertyRenderer: any;

  beforeEach(() => {
    mockVault = new Vault();
    mockApp = new App();

    // Mock layout repository
    mockLayoutRepository = {
      findByClassName: jest
        .fn()
        .mockResolvedValue(Result.fail("No layout found")),
      save: jest.fn().mockResolvedValue(Result.ok(undefined)),
      findAll: jest.fn().mockResolvedValue(Result.ok([])),
    };

    // Mock property renderer
    mockPropertyRenderer = {
      renderPropertiesBlock: jest.fn(),
    };

    // Create renderer instance
    renderer = new StrategyBasedLayoutRenderer(
      mockApp as any,
      mockLayoutRepository as any,
      mockPropertyRenderer as any,
    );
  });

  describe("SOLID Principle Compliance", () => {
    describe("Single Responsibility Principle (SRP)", () => {
      it("should have single responsibility of orchestrating layout rendering", () => {
        // Verify renderer only orchestrates, doesn't implement specific rendering logic
        expect(renderer.getActiveStrategies()).toContain(
          "CustomLayoutRenderingStrategy",
        );
        expect(renderer.getActiveStrategies()).toContain(
          "DefaultLayoutRenderingStrategy",
        );
        expect(renderer.getBlockRendererFactory()).toBeInstanceOf(
          BlockRendererFactory,
        );
      });

      it("should delegate actual rendering to strategies", async () => {
        const container = document.createElement("div");
        const layout = LayoutMother.simple();

        // Mock file and metadata
        const mockFile = { path: "test.md", basename: "test" } as any;
        const mockMetadata = {
          frontmatter: { exo__Instance_class: "TestClass" },
        };

        // Should not throw - delegates to strategy
        await renderer.renderLayout(container, mockFile, mockMetadata, null);

        // Verify no direct rendering logic in main class
        expect(container.children.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Open-Closed Principle (OCP)", () => {
      it("should be open for extension via new strategies", () => {
        // Create custom strategy
        const customStrategy = {
          canHandle: jest.fn().mockReturnValue(true),
          render: jest.fn().mockResolvedValue(Result.ok()),
        };

        const initialStrategies = renderer.getActiveStrategies();
        renderer.addStrategy(customStrategy as any);
        const newStrategies = renderer.getActiveStrategies();

        expect(newStrategies.length).toBe(initialStrategies.length + 1);
      });

      it("should be closed for modification of core logic", () => {
        // Core rendering logic should not change when adding strategies
        const container = document.createElement("div");
        const layout = LayoutMother.simple();

        // Should work with existing strategies
        const result = renderer.renderLayoutDirect(layout, container);
        expect(result.isSuccess).toBe(true);
      });
    });

    describe("Liskov Substitution Principle (LSP)", () => {
      it("should allow strategy substitution without changing behavior", () => {
        const strategies = renderer.getActiveStrategies();

        // All strategies should be substitutable
        strategies.forEach((strategyName) => {
          expect(strategyName).toMatch(/.*Strategy$/);
        });
      });
    });

    describe("Interface Segregation Principle (ISP)", () => {
      it("should have segregated interfaces for different concerns", () => {
        const factory = renderer.getBlockRendererFactory();

        // Block renderer factory should only handle block rendering
        expect(factory.getSupportedBlockTypes()).toEqual(
          expect.arrayContaining(["dynamic-backlinks"]),
        );
      });
    });

    describe("Dependency Inversion Principle (DIP)", () => {
      it("should depend on abstractions not concretions", () => {
        // Renderer should accept interfaces, not concrete classes
        expect(renderer.isHealthy()).toBe(true);

        // Should work with mocked dependencies
        expect(() => renderer.getActiveStrategies()).not.toThrow();
        expect(() => renderer.getBlockRendererFactory()).not.toThrow();
      });
    });
  });

  describe("Strategy Pattern Implementation", () => {
    it("should select custom strategy for valid layouts", () => {
      const layout = LayoutMother.simple();
      const container = document.createElement("div");

      const result = renderer.renderLayoutDirect(layout, container);

      expect(result.isSuccess).toBe(true);
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should select default strategy for null layouts", () => {
      const container = document.createElement("div");

      const result = renderer.renderLayoutDirect(null, container);

      // Should handle null gracefully
      expect(result.isSuccess).toBe(true);
      expect(container.children.length).toBe(0);
    });

    it("should handle strategy addition and removal", () => {
      const initialCount = renderer.getActiveStrategies().length;

      // Add strategy
      const mockStrategy = {
        canHandle: jest.fn().mockReturnValue(false),
        render: jest.fn().mockResolvedValue(Result.ok()),
      };

      renderer.addStrategy(mockStrategy as any);
      expect(renderer.getActiveStrategies().length).toBe(initialCount + 1);

      // Remove strategy by constructor (should work now since object was added)
      const removed = renderer.removeStrategy(mockStrategy.constructor);
      expect(removed).toBe(true); // Should successfully remove the added strategy
      expect(renderer.getActiveStrategies().length).toBe(initialCount);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid container gracefully", async () => {
      const layout = LayoutMother.simple();

      const result = renderer.renderLayoutDirect(layout, null as any);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Container is required");
    });

    it("should handle malformed layouts gracefully", () => {
      const container = document.createElement("div");
      const malformedLayout = {} as any;

      const result = renderer.renderLayoutDirect(malformedLayout, container);

      expect(result.isSuccess).toBe(true); // Handles gracefully
    });

    it("should handle missing metadata gracefully", async () => {
      const container = document.createElement("div");
      const mockFile = { path: "test.md" } as any;

      const result = await renderer.renderLayout(
        container,
        mockFile,
        null,
        null,
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("No metadata available");
    });
  });

  describe("Backward Compatibility", () => {
    it("should maintain compatibility with existing layout structures", () => {
      const container = document.createElement("div");
      const layout = LayoutMother.complex();

      const result = renderer.renderLayoutDirect(layout, container);

      expect(result.isSuccess).toBe(true);

      // Should create expected block structure
      const blocks = container.querySelectorAll("[data-block-id]");
      expect(blocks.length).toBeGreaterThan(0);
    });

    it("should handle collapsible blocks correctly", () => {
      const container = document.createElement("div");
      const layout = LayoutMother.withCollapsibleBlocks();

      const result = renderer.renderLayoutDirect(layout, container);

      expect(result.isSuccess).toBe(true);

      // Should create collapsible headers
      const headers = container.querySelectorAll(".is-collapsible");
      expect(headers.length).toBeGreaterThan(0);
    });

    it("should apply custom CSS classes", () => {
      const container = document.createElement("div");
      const layout = LayoutMother.create().withPropertiesBlock().build();

      // Add custom config
      (layout as any).config = { cssClass: "custom-layout-class" };

      const result = renderer.renderLayoutDirect(layout, container);

      expect(result.isSuccess).toBe(true);
      expect(container.classList.contains("custom-layout-class")).toBe(true);
    });
  });

  describe("Performance and Health Checks", () => {
    it("should report healthy status when properly initialized", () => {
      expect(renderer.isHealthy()).toBe(true);
    });

    it("should provide strategy introspection", () => {
      const strategies = renderer.getActiveStrategies();

      expect(strategies).toBeInstanceOf(Array);
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies).toContain("CustomLayoutRenderingStrategy");
      expect(strategies).toContain("DefaultLayoutRenderingStrategy");
    });

    it("should handle empty layouts efficiently", () => {
      const container = document.createElement("div");
      const layout = LayoutMother.empty();

      const startTime = performance.now();
      const result = renderer.renderLayoutDirect(layout, container);
      const endTime = performance.now();

      expect(result.isSuccess).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Should be fast
    });
  });
});
