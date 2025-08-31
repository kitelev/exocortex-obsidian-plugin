import { QueryEngineService } from "../../../../src/application/services/QueryEngineService";
import { QueryEngineConfig } from "../../../../src/domain/entities/QueryEngineConfig";
import { Result } from "../../../../src/domain/core/Result";
import {
  IQueryEngine,
  QueryEngineType,
  QueryResult,
  QueryContext,
} from "../../../../src/domain/ports/IQueryEngine";

// Mock QueryEngineFactory
class MockQueryEngineFactory {
  private availableEngines: QueryEngineType[] = ["dataview", "datacore", "native"];
  private engines: Map<QueryEngineType, IQueryEngine> = new Map();
  private shouldFailCreation: boolean = false;

  constructor() {
    this.setupMockEngines();
  }

  private setupMockEngines() {
    const createMockEngine = (type: QueryEngineType, isAvailable = true): IQueryEngine => ({
      getType: () => type,
      isAvailable: () => isAvailable,
      executeQuery: jest.fn().mockResolvedValue(Result.ok({ data: `${type}-data`, count: 1 })),
      renderQuery: jest.fn().mockResolvedValue(Result.ok(undefined)),
      getPages: jest.fn().mockResolvedValue(Result.ok([{ path: `${type}-page`, metadata: {} }])),
      getPageMetadata: jest.fn().mockResolvedValue(Result.ok({ title: `${type}-title` })),
      validateQuery: jest.fn().mockReturnValue(Result.ok(true)),
    });

    this.engines.set("dataview", createMockEngine("dataview"));
    this.engines.set("datacore", createMockEngine("datacore"));
    this.engines.set("native", createMockEngine("native"));
    this.engines.set("unavailable", createMockEngine("unavailable", false));
  }

  getAvailableEngines(): QueryEngineType[] {
    return this.availableEngines.filter(type => this.engines.get(type)?.isAvailable());
  }

  isEngineAvailable(type: QueryEngineType): boolean {
    return this.engines.get(type)?.isAvailable() ?? false;
  }

  async createQueryEngine(preferred?: QueryEngineType): Promise<Result<IQueryEngine>> {
    if (this.shouldFailCreation) {
      return Result.fail<IQueryEngine>("Engine creation failed");
    }

    if (preferred && this.engines.has(preferred)) {
      const engine = this.engines.get(preferred)!;
      if (engine.isAvailable()) {
        return Result.ok(engine);
      }
      return Result.fail<IQueryEngine>(`Engine ${preferred} is not available`);
    }

    // Auto-select first available engine
    for (const type of this.availableEngines) {
      const engine = this.engines.get(type);
      if (engine && engine.isAvailable()) {
        return Result.ok(engine);
      }
    }

    return Result.fail<IQueryEngine>("No engines available");
  }

  getDiagnostics() {
    return {
      availableEngines: this.getAvailableEngines(),
      totalEngines: this.engines.size
    };
  }

  setEngineAvailable(type: QueryEngineType, available: boolean) {
    const engine = this.engines.get(type);
    if (engine) {
      (engine.isAvailable as jest.Mock).mockReturnValue(available);
    }
  }

  setShouldFailCreation(fail: boolean) {
    this.shouldFailCreation = fail;
  }

  getMockEngine(type: QueryEngineType): IQueryEngine | undefined {
    return this.engines.get(type);
  }
}

describe("QueryEngineService", () => {
  let service: QueryEngineService;
  let mockFactory: MockQueryEngineFactory;
  let config: QueryEngineConfig;

  beforeEach(() => {
    mockFactory = new MockQueryEngineFactory();
    config = QueryEngineConfig.createDefault().getValue()!;
    service = new QueryEngineService(mockFactory, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("executeQuery", () => {
    it("should execute query with preferred engine", async () => {
      const query = "SELECT * FROM pages";
      const context: QueryContext = { currentPath: "/test.md" };

      const result = await service.executeQuery(query, context, "dataview");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({ data: "dataview-data", count: 1 });

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.executeQuery).toHaveBeenCalledWith(query, context);
    });

    it("should use cached results when caching is enabled", async () => {
      const query = "SELECT * FROM pages";
      
      // First call
      const result1 = await service.executeQuery(query, undefined, "dataview");
      expect(result1.isSuccess).toBe(true);

      // Second call should use cache
      const result2 = await service.executeQuery(query, undefined, "dataview");
      expect(result2.isSuccess).toBe(true);

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.executeQuery).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it("should skip cache when caching is disabled", async () => {
      // Disable caching
      const noCacheConfig = QueryEngineConfig.create({
        preferredEngine: "dataview",
        enableCache: false
      }).getValue()!;
      service.updateConfig(noCacheConfig);

      const query = "SELECT * FROM pages";
      
      // First call
      await service.executeQuery(query, undefined, "dataview");
      // Second call
      await service.executeQuery(query, undefined, "dataview");

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.executeQuery).toHaveBeenCalledTimes(2); // Called twice, no caching
    });

    it("should fall back to secondary engine when primary fails", async () => {
      // Make dataview unavailable
      mockFactory.setEngineAvailable("dataview", false);

      const result = await service.executeQuery("SELECT * FROM pages", undefined, "dataview");

      expect(result.isSuccess).toBe(true);
      // Should fall back to next available engine (datacore)
      expect(result.getValue()).toEqual({ data: "datacore-data", count: 1 });
    });

    it("should use auto-detection when configured engines fail", async () => {
      // Configure with unavailable engines but enable auto-detection
      const autoConfig = QueryEngineConfig.create({
        preferredEngine: "unavailable",
        fallbackEngine: "unavailable",
        autoDetect: true
      }).getValue()!;
      service.updateConfig(autoConfig);

      const result = await service.executeQuery("SELECT * FROM pages");

      expect(result.isSuccess).toBe(true);
      // Should auto-detect and use first available engine
      expect(result.getValue()?.data).toBeTruthy();
    });

    it("should fail when no engines are available", async () => {
      // Make all engines unavailable
      mockFactory.setEngineAvailable("dataview", false);
      mockFactory.setEngineAvailable("datacore", false);
      mockFactory.setEngineAvailable("native", false);

      const result = await service.executeQuery("SELECT * FROM pages");

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("No query engines available");
    });

    it("should handle engine execution errors", async () => {
      const engine = mockFactory.getMockEngine("dataview")!;
      (engine.executeQuery as jest.Mock).mockResolvedValue(
        Result.fail<QueryResult>("Query execution failed")
      );

      const result = await service.executeQuery("INVALID QUERY", undefined, "dataview");

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe("Query execution failed");
    });

    it("should expire cached results after timeout", async () => {
      // Set very short cache timeout
      const shortCacheConfig = QueryEngineConfig.create({
        preferredEngine: "dataview",
        cacheTimeout: 0.001 // 0.001 minutes = 0.06 seconds
      }).getValue()!;
      service.updateConfig(shortCacheConfig);

      const query = "SELECT * FROM pages";
      
      // First call
      await service.executeQuery(query);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second call should not use expired cache
      await service.executeQuery(query);

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.executeQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe("renderQuery", () => {
    it("should render query to container", async () => {
      const container = document.createElement("div");
      const query = "SELECT * FROM pages";

      const result = await service.renderQuery(container, query, undefined, "dataview");

      expect(result.isSuccess).toBe(true);

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.renderQuery).toHaveBeenCalledWith(container, query, undefined);
    });

    it("should display error in container when engine fails", async () => {
      mockFactory.setShouldFailCreation(true);
      
      const container = document.createElement("div");
      const query = "SELECT * FROM pages";

      const result = await service.renderQuery(container, query);

      expect(result.isSuccess).toBe(false);
      
      const errorElement = container.querySelector(".exocortex-error");
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain("Query Engine Error");
    });
  });

  describe("getPages", () => {
    it("should get pages from engine", async () => {
      const source = "tag:#important";

      const result = await service.getPages(source, "dataview");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([{ path: "dataview-page", metadata: {} }]);

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.getPages).toHaveBeenCalledWith(source);
    });

    it("should handle engine failure", async () => {
      const engine = mockFactory.getMockEngine("dataview")!;
      (engine.getPages as jest.Mock).mockResolvedValue(
        Result.fail<any[]>("Failed to get pages")
      );

      const result = await service.getPages("tag:#error");

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe("Failed to get pages");
    });
  });

  describe("getPageMetadata", () => {
    it("should get page metadata from engine", async () => {
      const path = "/test.md";

      const result = await service.getPageMetadata(path, "dataview");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({ title: "dataview-title" });

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.getPageMetadata).toHaveBeenCalledWith(path);
    });
  });

  describe("validateQuery", () => {
    it("should validate query syntax", async () => {
      const query = "SELECT * FROM pages WHERE tag = 'important'";

      const result = await service.validateQuery(query, "dataview");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);

      const engine = mockFactory.getMockEngine("dataview");
      expect(engine?.validateQuery).toHaveBeenCalledWith(query);
    });

    it("should handle validation failure", async () => {
      const engine = mockFactory.getMockEngine("dataview")!;
      (engine.validateQuery as jest.Mock).mockReturnValue(
        Result.fail<boolean>("Invalid syntax")
      );

      const result = await service.validateQuery("INVALID QUERY");

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toBe("Invalid syntax");
    });
  });

  describe("configuration management", () => {
    it("should update configuration", async () => {
      const newConfig = QueryEngineConfig.create({
        preferredEngine: "datacore",
        enableCache: false
      }).getValue()!;

      service.updateConfig(newConfig);

      // Should use new preferred engine
      await service.executeQuery("SELECT * FROM pages");

      const engine = mockFactory.getMockEngine("datacore");
      expect(engine?.executeQuery).toHaveBeenCalled();
    });

    it("should clear cache when caching is disabled", () => {
      // Add something to cache
      service.executeQuery("SELECT * FROM pages");

      // Disable cache
      const noCacheConfig = QueryEngineConfig.create({
        enableCache: false
      }).getValue()!;
      service.updateConfig(noCacheConfig);

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should reset current engine when config changes", async () => {
      // Use dataview engine
      await service.executeQuery("SELECT * FROM pages", undefined, "dataview");

      // Change config to prefer datacore
      const newConfig = QueryEngineConfig.create({
        preferredEngine: "datacore"
      }).getValue()!;
      service.updateConfig(newConfig);

      // Should use new engine
      await service.executeQuery("SELECT * FROM pages");

      const datacoreEngine = mockFactory.getMockEngine("datacore");
      expect(datacoreEngine?.executeQuery).toHaveBeenCalled();
    });
  });

  describe("cache management", () => {
    it("should provide cache statistics", () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("hitRate");
      expect(stats).toHaveProperty("maxSize");
      expect(typeof stats.size).toBe("number");
    });

    it("should clear cache manually", async () => {
      // Add something to cache
      await service.executeQuery("SELECT * FROM pages");
      
      // Clear cache
      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should respect max cache size", async () => {
      // Set very small cache size
      const smallCacheConfig = QueryEngineConfig.create({
        maxCacheSize: 1
      }).getValue()!;
      service.updateConfig(smallCacheConfig);

      // Add two different queries (should evict first one)
      await service.executeQuery("SELECT * FROM pages");
      await service.executeQuery("SELECT * FROM tasks");

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1); // Should not exceed max size
    });
  });

  describe("engine availability", () => {
    it("should report available engines", () => {
      const available = service.getAvailableEngines();

      expect(available).toContain("dataview");
      expect(available).toContain("datacore");
      expect(available).toContain("native");
      expect(available).not.toContain("unavailable");
    });

    it("should check if specific engine is available", () => {
      expect(service.isEngineAvailable("dataview")).toBe(true);
      expect(service.isEngineAvailable("unavailable")).toBe(false);
    });
  });

  describe("diagnostics", () => {
    it("should provide comprehensive diagnostic information", async () => {
      // Execute a query to set current engine
      await service.executeQuery("SELECT * FROM pages", undefined, "dataview");

      const diagnostics = service.getDiagnostics();

      expect(diagnostics).toHaveProperty("currentEngine");
      expect(diagnostics).toHaveProperty("availableEngines");
      expect(diagnostics).toHaveProperty("config");
      expect(diagnostics).toHaveProperty("cache");
      expect(diagnostics).toHaveProperty("factory");

      expect(diagnostics.currentEngine).toBe("dataview");
      expect(diagnostics.availableEngines).toContain("dataview");
      expect(diagnostics.config).toHaveProperty("preferred");
      expect(diagnostics.config).toHaveProperty("fallback");
      expect(diagnostics.config).toHaveProperty("autoDetect");
      expect(diagnostics.config).toHaveProperty("cacheEnabled");
    });

    it("should show null current engine initially", () => {
      const diagnostics = service.getDiagnostics();

      expect(diagnostics.currentEngine).toBeNull();
    });
  });

  describe("engine reuse optimization", () => {
    it("should reuse current engine when appropriate", async () => {
      // First query with dataview
      await service.executeQuery("SELECT * FROM pages", undefined, "dataview");
      
      // Second query with same engine preference should reuse
      await service.executeQuery("SELECT * FROM tasks", undefined, "dataview");

      // Should have created engine only once
      expect(mockFactory.getMockEngine("dataview")?.executeQuery).toHaveBeenCalledTimes(2);
    });

    it("should create new engine when preference changes", async () => {
      // First query with dataview
      await service.executeQuery("SELECT * FROM pages", undefined, "dataview");
      
      // Second query with different preference should create new engine
      await service.executeQuery("SELECT * FROM tasks", undefined, "datacore");

      expect(mockFactory.getMockEngine("dataview")?.executeQuery).toHaveBeenCalledTimes(1);
      expect(mockFactory.getMockEngine("datacore")?.executeQuery).toHaveBeenCalledTimes(1);
    });

    it("should create new engine when current engine becomes unavailable", async () => {
      // First query with dataview
      await service.executeQuery("SELECT * FROM pages", undefined, "dataview");
      
      // Make dataview unavailable
      mockFactory.setEngineAvailable("dataview", false);
      
      // Second query should fall back to another engine
      const result = await service.executeQuery("SELECT * FROM tasks", undefined, "dataview");
      
      expect(result.isSuccess).toBe(true);
      // Should have fallen back to datacore
      expect(mockFactory.getMockEngine("datacore")?.executeQuery).toHaveBeenCalled();
    });
  });

  describe("concurrent query handling", () => {
    it("should handle multiple concurrent queries", async () => {
      const queries = [
        "SELECT * FROM pages",
        "SELECT * FROM tasks", 
        "SELECT * FROM projects"
      ];

      // Execute all queries concurrently
      const results = await Promise.all(
        queries.map(query => service.executeQuery(query, undefined, "dataview"))
      );

      // All should succeed
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });

      // All should have been executed
      expect(mockFactory.getMockEngine("dataview")?.executeQuery).toHaveBeenCalledTimes(3);
    });

    it("should handle concurrent queries with different engines", async () => {
      const engineQueries = [
        { query: "SELECT * FROM pages", engine: "dataview" as QueryEngineType },
        { query: "SELECT * FROM tasks", engine: "datacore" as QueryEngineType },
        { query: "SELECT * FROM projects", engine: "native" as QueryEngineType }
      ];

      const results = await Promise.all(
        engineQueries.map(({ query, engine }) => 
          service.executeQuery(query, undefined, engine)
        )
      );

      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });

      expect(mockFactory.getMockEngine("dataview")?.executeQuery).toHaveBeenCalledTimes(1);
      expect(mockFactory.getMockEngine("datacore")?.executeQuery).toHaveBeenCalledTimes(1);
      expect(mockFactory.getMockEngine("native")?.executeQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle empty query string", async () => {
      const result = await service.executeQuery("", undefined, "dataview");

      expect(result.isSuccess).toBe(true);
      expect(mockFactory.getMockEngine("dataview")?.executeQuery).toHaveBeenCalledWith("", undefined);
    });

    it("should handle query with special characters", async () => {
      const complexQuery = "SELECT * FROM pages WHERE content =~ /regex[0-9]+/ AND tags contains 'special-tag'";
      
      const result = await service.executeQuery(complexQuery, undefined, "dataview");

      expect(result.isSuccess).toBe(true);
      expect(mockFactory.getMockEngine("dataview")?.executeQuery).toHaveBeenCalledWith(complexQuery, undefined);
    });

    it("should handle null/undefined context gracefully", async () => {
      const result1 = await service.executeQuery("SELECT * FROM pages", null as any);
      const result2 = await service.executeQuery("SELECT * FROM pages", undefined);

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
    });

    it("should handle factory returning null engine", async () => {
      mockFactory.setShouldFailCreation(true);
      
      const result = await service.executeQuery("SELECT * FROM pages");

      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Engine creation failed");
    });
  });
});