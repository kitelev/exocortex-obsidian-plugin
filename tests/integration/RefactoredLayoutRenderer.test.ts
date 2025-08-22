import { RefactoredLayoutRenderer } from "../../src/presentation/renderers/RefactoredLayoutRenderer";
import { FakeLayoutCoordinator } from "../__fakes__/FakeLayoutCoordinator";
import {
  LayoutMother,
  RenderContextMother,
} from "../__builders__/LayoutMother";
import { Result } from "../../src/domain/core/Result";

describe("RefactoredLayoutRenderer Integration Tests", () => {
  let renderer: RefactoredLayoutRenderer;
  let fakeCoordinator: FakeLayoutCoordinator;

  beforeEach(() => {
    fakeCoordinator = new FakeLayoutCoordinator();
    renderer = new RefactoredLayoutRenderer(fakeCoordinator);
  });

  afterEach(() => {
    fakeCoordinator.clear();
  });

  describe("renderLayout", () => {
    it("should delegate to layout coordinator and return success result", async () => {
      // Arrange
      const layout = LayoutMother.simple();
      const context = RenderContextMother.simple();

      // Act
      const result = await renderer.renderLayout(layout, context);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(fakeCoordinator.wasLayoutRendered(layout.id.toString())).toBe(
        true,
      );

      const renderResult = result.getValue();
      expect(renderResult.layoutId).toBe(layout.id.toString());
      expect(renderResult.fallbackUsed).toBe(false);
    });

    it("should handle layout coordinator failures gracefully", async () => {
      // Arrange
      const layout = LayoutMother.simple();
      const context = RenderContextMother.simple();
      fakeCoordinator.setLayoutRenderingFailure(true);

      // Act
      const result = await renderer.renderLayout(layout, context);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Fake layout rendering failure");
    });

    it("should validate null layout input", async () => {
      // Arrange
      const context = RenderContextMother.simple();

      // Act
      const result = await renderer.renderLayout(null as any, context);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Layout cannot be null or undefined");
    });

    it("should validate render context", async () => {
      // Arrange
      const layout = LayoutMother.simple();

      // Act
      const result = await renderer.renderLayout(layout, null as any);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(
        "Valid render context with containerId is required",
      );
    });

    it("should handle complex layouts with multiple blocks", async () => {
      // Arrange
      const layout = LayoutMother.complex();
      const context = RenderContextMother.withFrontmatter({
        exo__Instance_class: "ComplexClass",
      });

      // Act
      const result = await renderer.renderLayout(layout, context);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(fakeCoordinator.wasLayoutRendered(layout.id.toString())).toBe(
        true,
      );

      const renderResult = result.getValue();
      expect(renderResult.blocksRendered.length).toBeGreaterThan(0);
      expect(renderResult.totalRenderTime).toBeGreaterThan(0);
    });
  });

  describe("renderDefaultLayout", () => {
    it("should delegate to coordinator for default layout", async () => {
      // Arrange
      const context = RenderContextMother.forAsset("/test/asset.md");

      // Act
      const result = await renderer.renderDefaultLayout(context);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(fakeCoordinator.wasDefaultLayoutRendered()).toBe(true);

      const renderResult = result.getValue();
      expect(renderResult.layoutId).toBe("default");
      expect(renderResult.fallbackUsed).toBe(true);
    });

    it("should handle coordinator failure for default layout", async () => {
      // Arrange
      const context = RenderContextMother.simple();
      fakeCoordinator.setDefaultRenderingFailure(true);

      // Act
      const result = await renderer.renderDefaultLayout(context);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Fake default layout rendering failure");
    });

    it("should validate context for default layout", async () => {
      // Act
      const result = await renderer.renderDefaultLayout({} as any);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(
        "Valid render context with containerId is required",
      );
    });
  });

  describe("SOLID Principles Compliance", () => {
    it("should demonstrate Single Responsibility Principle", () => {
      // Renderer only coordinates, doesn't handle rendering details
      expect(renderer).toBeInstanceOf(RefactoredLayoutRenderer);
      expect(typeof renderer.renderLayout).toBe("function");
      expect(typeof renderer.renderDefaultLayout).toBe("function");

      // No direct DOM manipulation or block rendering logic
      expect("renderBlock" in renderer).toBe(false);
      expect("createElement" in renderer).toBe(false);
    });

    it("should demonstrate Dependency Inversion Principle", () => {
      // Depends on abstraction (ILayoutCoordinator), not concrete implementation
      const customCoordinator = new FakeLayoutCoordinator();
      const customRenderer = new RefactoredLayoutRenderer(customCoordinator);

      expect(customRenderer).toBeInstanceOf(RefactoredLayoutRenderer);
    });

    it("should demonstrate Interface Segregation Principle", () => {
      // Uses segregated interface (ILayoutRenderer) instead of fat interface
      const layout = LayoutMother.simple();
      const context = RenderContextMother.simple();

      // Should only expose rendering methods, not block-level operations
      expect("renderBlock" in renderer).toBe(false);
      expect("createElement" in renderer).toBe(false);
    });
  });

  describe("Error Handling Robustness", () => {
    it("should handle unexpected coordinator exceptions", async () => {
      // Arrange
      const layout = LayoutMother.simple();
      const context = RenderContextMother.simple();

      // Mock an exception in coordinator
      jest
        .spyOn(fakeCoordinator, "coordinateLayout")
        .mockRejectedValue(new Error("Unexpected coordinator error"));

      // Act
      const result = await renderer.renderLayout(layout, context);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Layout rendering failed");
    });

    it("should preserve context information in error cases", async () => {
      // Arrange
      const layout = LayoutMother.simple();
      const context = RenderContextMother.create()
        .withContainerId("specific-container")
        .withAssetPath("/specific/path.md")
        .build();

      fakeCoordinator.setLayoutRenderingFailure(true);

      // Act
      const result = await renderer.renderLayout(layout, context);

      // Assert
      expect(result.isFailure).toBe(true);

      // Verify context was passed correctly before failure
      const lastContext = fakeCoordinator.getLastRenderContext();
      expect(lastContext?.containerId).toBe("specific-container");
      expect(lastContext?.assetPath).toBe("/specific/path.md");
    });
  });
});
