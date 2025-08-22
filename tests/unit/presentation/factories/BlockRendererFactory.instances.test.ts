import { App } from "obsidian";
import { BlockRendererFactory } from "../../../../src/presentation/factories/BlockRendererFactory";

// Mock Obsidian API
jest.mock("obsidian", () => ({
  App: jest.fn(),
}));

// Mock the dynamic backlinks renderer dependency
jest.mock(
  "../../../../src/presentation/renderers/DynamicBacklinksBlockRenderer",
);

describe("BlockRendererFactory - Dynamic Backlinks Integration", () => {
  let factory: BlockRendererFactory;
  let mockApp: jest.Mocked<App>;

  beforeEach(() => {
    mockApp = {} as jest.Mocked<App>;

    factory = new BlockRendererFactory(mockApp);
  });

  describe("dynamic-backlinks block type support", () => {
    it("should only include dynamic-backlinks in supported block types", () => {
      const supportedTypes = factory.getSupportedBlockTypes();

      expect(supportedTypes).toContain("dynamic-backlinks");
      expect(supportedTypes.length).toBe(1); // Should have only dynamic-backlinks
    });

    it("should create renderer for dynamic-backlinks block type", () => {
      const result = factory.createRenderer("dynamic-backlinks");

      expect(result.isSuccess).toBe(true);

      const renderer = result.getValue();
      expect(renderer).toBeDefined();
    });

    it("should fail for unsupported block types", () => {
      const queryResult = factory.createRenderer("query" as any);
      const backlinksResult = factory.createRenderer("backlinks" as any);
      const instancesResult = factory.createRenderer("instances" as any);

      expect(queryResult.isSuccess).toBe(false);
      expect(backlinksResult.isSuccess).toBe(false);
      expect(instancesResult.isSuccess).toBe(false);

      expect(queryResult.getError()).toContain(
        "No renderer found for block type: query",
      );
      expect(backlinksResult.getError()).toContain(
        "No renderer found for block type: backlinks",
      );
      expect(instancesResult.getError()).toContain(
        "No renderer found for block type: instances",
      );
    });

    it("should fail for unsupported block types", () => {
      const result = factory.createRenderer("unsupported-type" as any);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain(
        "No renderer found for block type: unsupported-type",
      );
    });

    it("should allow runtime registration of custom renderers", () => {
      const customRenderer = {
        render: jest.fn().mockResolvedValue(undefined),
      };

      // Register custom renderer
      factory.registerRenderer(
        "custom-dynamic-backlinks" as any,
        customRenderer,
      );

      // Should now be able to create the custom renderer
      const result = factory.createRenderer("custom-dynamic-backlinks" as any);
      expect(result.isSuccess).toBe(true);
    });

    it("should allow unregistering renderers", () => {
      // Should initially have dynamic-backlinks renderer
      const beforeResult = factory.createRenderer("dynamic-backlinks");
      expect(beforeResult.isSuccess).toBe(true);

      // Unregister dynamic-backlinks renderer
      const unregistered = factory.unregisterRenderer("dynamic-backlinks");
      expect(unregistered).toBe(true);

      // Should now fail to create dynamic-backlinks renderer
      const afterResult = factory.createRenderer("dynamic-backlinks");
      expect(afterResult.isSuccess).toBe(false);
    });
  });

  describe("renderer adapter functionality", () => {
    it("should wrap legacy renderers with adapter pattern", async () => {
      const renderer = factory.createRenderer("dynamic-backlinks").getValue()!;

      // Mock context for rendering
      const mockContext = {
        container: document.createElement("div"),
        config: { type: "dynamic-backlinks" },
        file: { basename: "TestFile" } as any,
        frontmatter: {},
        dataviewApi: null,
      };

      // Should not throw when rendering (adapter should handle it)
      const renderResult = await renderer.render(mockContext);

      // Depending on the mock setup, this might succeed or fail
      // but it should not throw an exception
      expect(renderResult).toBeDefined();
    });
  });
});
