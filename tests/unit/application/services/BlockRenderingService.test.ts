import { BlockRenderingService } from "../../../../src/application/services/BlockRenderingService";
import { Result } from "../../../../src/domain/core/Result";
import { Block } from "../../../../src/domain/entities/LayoutBlock";
import {
  IBlockRenderStrategy,
  BlockRenderResult,
  RenderContext,
} from "../../../../src/domain/ports/IBlockRenderer";

// Mock implementation of IBlockRenderStrategy
class MockBlockRenderStrategy implements IBlockRenderStrategy {
  constructor(
    private supportedTypes: string[],
    private shouldFail = false,
    private renderDelay = 0
  ) {}

  canHandle(blockType: string): boolean {
    return this.supportedTypes.includes(blockType);
  }

  async render(
    context: RenderContext,
    config: Record<string, any>
  ): Promise<Result<BlockRenderResult>> {
    if (this.renderDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.renderDelay));
    }

    if (this.shouldFail) {
      return Result.fail("Mock render failure");
    }

    return Result.ok({
      html: `<div>Rendered ${config.type || 'unknown'} block</div>`,
      metadata: {
        renderTime: this.renderDelay,
        strategy: 'mock',
        blockType: config.type,
      },
      dependencies: [],
      cacheKey: `mock-${config.type}-${Date.now()}`,
    });
  }
}

describe("BlockRenderingService", () => {
  let service: BlockRenderingService;
  let mockStrategy1: MockBlockRenderStrategy;
  let mockStrategy2: MockBlockRenderStrategy;
  let mockContext: RenderContext;

  beforeEach(() => {
    mockStrategy1 = new MockBlockRenderStrategy(["query", "properties"]);
    mockStrategy2 = new MockBlockRenderStrategy(["backlinks", "custom"]);
    
    service = new BlockRenderingService([mockStrategy1, mockStrategy2]);

    mockContext = {
      file: {
        path: "test-file.md",
        name: "test-file",
        basename: "test-file",
      },
      metadata: {
        frontmatter: {
          "exo__Asset_class": "TestClass",
          "exo__Asset_uid": "test-uid-123",
        },
        tags: ["test-tag"],
        links: [],
      },
      container: document.createElement("div"),
      app: {} as any,
      vault: {} as any,
      plugin: {} as any,
    };
  });

  describe("Service Initialization", () => {
    it("should initialize with no strategies", () => {
      const emptyService = new BlockRenderingService();
      expect(emptyService.getAvailableBlockTypes()).toHaveLength(0);
    });

    it("should initialize with provided strategies", () => {
      expect(service.getAvailableBlockTypes()).toContain("query");
      expect(service.getAvailableBlockTypes()).toContain("properties");
      expect(service.getAvailableBlockTypes()).toContain("backlinks");
      expect(service.getAvailableBlockTypes()).toContain("custom");
    });

    it("should register strategies during construction", () => {
      expect(service.hasStrategyFor("query")).toBe(true);
      expect(service.hasStrategyFor("properties")).toBe(true);
      expect(service.hasStrategyFor("backlinks")).toBe(true);
      expect(service.hasStrategyFor("custom")).toBe(true);
      expect(service.hasStrategyFor("unsupported")).toBe(false);
    });
  });

  describe("Strategy Registration", () => {
    it("should register individual strategies", () => {
      const newService = new BlockRenderingService();
      const customStrategy = new MockBlockRenderStrategy(["test-type"]);

      newService.registerStrategy(customStrategy);

      expect(newService.hasStrategyFor("test-type")).toBe(true);
      expect(newService.getAvailableBlockTypes()).toContain("test-type");
    });

    it("should handle strategies that support multiple block types", () => {
      const newService = new BlockRenderingService();
      const multiStrategy = new MockBlockRenderStrategy([
        "type1", "type2", "type3"
      ]);

      newService.registerStrategy(multiStrategy);

      expect(newService.hasStrategyFor("type1")).toBe(true);
      expect(newService.hasStrategyFor("type2")).toBe(true);
      expect(newService.hasStrategyFor("type3")).toBe(true);
    });

    it("should allow strategy override", () => {
      const originalStrategy = new MockBlockRenderStrategy(["query"]);
      const newStrategy = new MockBlockRenderStrategy(["query"]);

      const newService = new BlockRenderingService([originalStrategy]);
      expect(newService.hasStrategyFor("query")).toBe(true);

      // Override with new strategy
      newService.registerStrategy(newStrategy);
      expect(newService.hasStrategyFor("query")).toBe(true);
    });
  });

  describe("Block Rendering", () => {
    it("should render blocks successfully with appropriate strategy", async () => {
      const block: Block = {
        id: "test-block-1",
        type: "query",
        config: {
          type: "query",
          query: "test query",
          title: "Test Query Block",
        },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      const result = await service.renderBlock(block, mockContext);

      expect(result.isSuccess).toBe(true);
      const renderResult = result.getValue();
      expect(renderResult.blockId).toBe("test-block-1");
      expect(renderResult.html).toContain("Rendered query block");
      expect(renderResult.renderTime).toBeGreaterThan(0);
      expect(renderResult.metadata?.blockType).toBe("query");
    });

    it("should fail when no strategy is found for block type", async () => {
      const block: Block = {
        id: "test-block-2",
        type: "unsupported",
        config: { type: "unsupported" },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      const result = await service.renderBlock(block, mockContext);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("No rendering strategy found");
      expect(result.getError()).toContain("unsupported");
    });

    it("should handle strategy render failures gracefully", async () => {
      const failingStrategy = new MockBlockRenderStrategy(["failing"], true);
      service.registerStrategy(failingStrategy);

      const block: Block = {
        id: "test-block-3",
        type: "failing",
        config: { type: "failing" },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      const result = await service.renderBlock(block, mockContext);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Block rendering failed");
      expect(result.getError()).toContain("Mock render failure");
    });

    it("should measure render time accurately", async () => {
      const slowStrategy = new MockBlockRenderStrategy(["slow"], false, 100);
      service.registerStrategy(slowStrategy);

      const block: Block = {
        id: "test-block-4",
        type: "slow",
        config: { type: "slow" },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      const result = await service.renderBlock(block, mockContext);

      expect(result.isSuccess).toBe(true);
      const renderResult = result.getValue();
      expect(renderResult.renderTime).toBeGreaterThan(90);
    });

    it("should handle exceptions during rendering", async () => {
      const throwingStrategy: IBlockRenderStrategy = {
        canHandle: jest.fn().mockReturnValue(true),
        render: jest.fn().mockRejectedValue(new Error("Strategy threw error")),
      };

      service.registerStrategy(throwingStrategy);

      const block: Block = {
        id: "test-block-5",
        type: "query", // Override query strategy
        config: { type: "query" },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      const result = await service.renderBlock(block, mockContext);

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Unexpected error rendering block");
      expect(result.getError()).toContain("test-block-5");
    });

    it("should pass block configuration to strategy", async () => {
      const spyStrategy = new MockBlockRenderStrategy(["properties"]);
      const renderSpy = jest.spyOn(spyStrategy, "render");
      
      service.registerStrategy(spyStrategy);

      const block: Block = {
        id: "test-block-6",
        type: "properties",
        config: {
          type: "properties",
          showEmpty: false,
          groupBy: "category",
          customParam: "test-value",
        },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      await service.renderBlock(block, mockContext);

      expect(renderSpy).toHaveBeenCalledWith(mockContext, block.config);
      expect(renderSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: "properties",
          showEmpty: false,
          groupBy: "category",
          customParam: "test-value",
        })
      );
    });
  });

  describe("Strategy Management", () => {
    it("should return all available block types", () => {
      const blockTypes = service.getAvailableBlockTypes();

      expect(blockTypes).toContain("query");
      expect(blockTypes).toContain("properties");
      expect(blockTypes).toContain("backlinks");
      expect(blockTypes).toContain("custom");
      expect(blockTypes.length).toBeGreaterThanOrEqual(4);
    });

    it("should check if strategy exists for specific block type", () => {
      expect(service.hasStrategyFor("query")).toBe(true);
      expect(service.hasStrategyFor("properties")).toBe(true);
      expect(service.hasStrategyFor("backlinks")).toBe(true);
      expect(service.hasStrategyFor("custom")).toBe(true);
      expect(service.hasStrategyFor("nonexistent")).toBe(false);
    });

    it("should handle empty strategy lists", () => {
      const emptyService = new BlockRenderingService();

      expect(emptyService.getAvailableBlockTypes()).toEqual([]);
      expect(emptyService.hasStrategyFor("any")).toBe(false);
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle multiple concurrent render requests", async () => {
      const blocks: Block[] = [
        {
          id: "concurrent-1",
          type: "query",
          config: { type: "query" },
          position: { row: 0, col: 0 },
          size: { width: 1, height: 1 },
        },
        {
          id: "concurrent-2", 
          type: "properties",
          config: { type: "properties" },
          position: { row: 0, col: 1 },
          size: { width: 1, height: 1 },
        },
        {
          id: "concurrent-3",
          type: "backlinks",
          config: { type: "backlinks" },
          position: { row: 1, col: 0 },
          size: { width: 1, height: 1 },
        },
      ];

      const renderPromises = blocks.map(block => 
        service.renderBlock(block, mockContext)
      );

      const results = await Promise.all(renderPromises);

      results.forEach((result, index) => {
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().blockId).toBe(blocks[index].id);
      });
    });

    it("should maintain performance with many strategies", () => {
      const manyStrategiesService = new BlockRenderingService();

      // Register many strategies
      for (let i = 0; i < 100; i++) {
        const strategy = new MockBlockRenderStrategy([`type-${i}`]);
        manyStrategiesService.registerStrategy(strategy);
      }

      expect(manyStrategiesService.getAvailableBlockTypes()).toHaveLength(100);
      expect(manyStrategiesService.hasStrategyFor("type-50")).toBe(true);
      expect(manyStrategiesService.hasStrategyFor("type-99")).toBe(true);
      expect(manyStrategiesService.hasStrategyFor("type-100")).toBe(false);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null or undefined blocks gracefully", async () => {
      const nullBlock = null as any;

      await expect(async () => {
        await service.renderBlock(nullBlock, mockContext);
      }).rejects.toThrow();
    });

    it("should handle malformed block objects", async () => {
      const malformedBlock = {
        id: "malformed",
        // Missing required fields
      } as any;

      await expect(async () => {
        await service.renderBlock(malformedBlock, mockContext);
      }).rejects.toThrow();
    });

    it("should handle strategies that return invalid results", async () => {
      const invalidStrategy: IBlockRenderStrategy = {
        canHandle: jest.fn().mockReturnValue(true),
        render: jest.fn().mockResolvedValue(null as any), // Invalid result
      };

      service.registerStrategy(invalidStrategy);

      const block: Block = {
        id: "invalid-result",
        type: "query", // Override existing strategy
        config: { type: "query" },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      const result = await service.renderBlock(block, mockContext);
      
      // Should handle gracefully without crashing
      expect(result.isSuccess).toBe(false);
    });
  });

  describe("Integration Scenarios", () => {
    it("should work with real-world block configurations", async () => {
      const complexBlock: Block = {
        id: "complex-query-block",
        type: "query",
        config: {
          type: "query",
          title: "Complex Query",
          query: `
            TABLE WITHOUT ID
            FROM "folder"
            WHERE contains(tags, "#important")
            SORT file.mtime DESC
            LIMIT 10
          `,
          columns: ["file.name", "file.mtime", "tags"],
          groupBy: "folder",
          showEmpty: false,
          cache: true,
          refreshInterval: 30000,
        },
        position: { row: 0, col: 0 },
        size: { width: 2, height: 3 },
      };

      const result = await service.renderBlock(complexBlock, mockContext);

      expect(result.isSuccess).toBe(true);
      const renderResult = result.getValue();
      expect(renderResult.blockId).toBe("complex-query-block");
      expect(renderResult.html).toBeTruthy();
    });

    it("should handle different render contexts", async () => {
      const differentContexts = [
        {
          ...mockContext,
          file: { ...mockContext.file, path: "different-file.md" },
        },
        {
          ...mockContext,
          metadata: {
            ...mockContext.metadata,
            frontmatter: { "exo__Asset_class": "DifferentClass" },
          },
        },
      ];

      const block: Block = {
        id: "context-test",
        type: "properties",
        config: { type: "properties" },
        position: { row: 0, col: 0 },
        size: { width: 1, height: 1 },
      };

      for (const context of differentContexts) {
        const result = await service.renderBlock(block, context);
        expect(result.isSuccess).toBe(true);
      }
    });
  });
});