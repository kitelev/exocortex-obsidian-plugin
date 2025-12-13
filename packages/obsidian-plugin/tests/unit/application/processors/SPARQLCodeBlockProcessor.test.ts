import type { MarkdownPostProcessorContext, App, Vault, MetadataCache, EventRef, TFile } from "obsidian";
import { SPARQLCodeBlockProcessor } from "../../../../src/application/processors/SPARQLCodeBlockProcessor";
import type ExocortexPlugin from "../../../../src/ExocortexPlugin";

describe("SPARQLCodeBlockProcessor", () => {
  let processor: SPARQLCodeBlockProcessor;
  let mockPlugin: ExocortexPlugin;
  let mockContext: MarkdownPostProcessorContext;
  let mockEl: HTMLElement;
  let mockMetadataCache: MetadataCache;

  /**
   * Helper to create a mock active query with all required fields
   */
  const createMockActiveQuery = (overrides: Partial<{
    source: string;
    lastResults: any[];
    refreshTimeout?: ReturnType<typeof setTimeout>;
    eventRef?: EventRef;
    startTime: number;
    controller: AbortController;
  }> = {}) => ({
    source: "SELECT * WHERE { ?s ?p ?o }",
    lastResults: [],
    startTime: Date.now(),
    controller: new AbortController(),
    ...overrides,
  });

  beforeEach(() => {
    mockPlugin = {
      app: {
        vault: {} as Vault,
        metadataCache: {
          offref: jest.fn(),
        } as unknown as MetadataCache,
      } as App,
    } as ExocortexPlugin;

    mockContext = {
      addChild: jest.fn(),
    } as any;

    mockEl = document.createElement("div");

    processor = new SPARQLCodeBlockProcessor(mockPlugin);
  });

  afterEach(() => {
    // Clean up the processor to stop intervals
    processor.cleanup();
    jest.clearAllMocks();
  });

  it("should be instantiable", () => {
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(SPARQLCodeBlockProcessor);
  });

  it("should have a process method", () => {
    expect(typeof processor.process).toBe("function");
  });

  describe("Live Query Refresh Methods", () => {
    it("should have scheduleRefresh method", () => {
      expect(typeof (processor as any).scheduleRefresh).toBe("function");
    });

    it("should have refreshQuery method", () => {
      expect(typeof (processor as any).refreshQuery).toBe("function");
    });

    it("should have invalidateTripleStore method", () => {
      expect(typeof (processor as any).invalidateTripleStore).toBe("function");
    });

    it("should have areResultsEqual method", () => {
      expect(typeof (processor as any).areResultsEqual).toBe("function");
    });

    it("should have showRefreshIndicator method", () => {
      expect(typeof (processor as any).showRefreshIndicator).toBe("function");
    });

    it("should have hideRefreshIndicator method", () => {
      expect(typeof (processor as any).hideRefreshIndicator).toBe("function");
    });
  });

  describe("Result Comparison", () => {
    it("should compare results correctly for equality", () => {
      // Mock SolutionMapping objects
      const createMockSolutionMapping = (bindings: Map<string, any>) => ({
        getBindings: () => bindings,
      });

      const result1 = [
        createMockSolutionMapping(new Map([
          ["var1", { toString: () => "value1" }],
          ["var2", { toString: () => "value2" }],
        ])),
      ];

      const result2 = [
        createMockSolutionMapping(new Map([
          ["var1", { toString: () => "value1" }],
          ["var2", { toString: () => "value2" }],
        ])),
      ];

      const result3 = [
        createMockSolutionMapping(new Map([
          ["var1", { toString: () => "value1" }],
          ["var2", { toString: () => "different" }],
        ])),
      ];

      const areEqual = (processor as any).areResultsEqual;

      expect(areEqual.call(processor, result1, result2)).toBe(true);
      expect(areEqual.call(processor, result1, result3)).toBe(false);
      expect(areEqual.call(processor, [], [])).toBe(true);
      expect(areEqual.call(processor, result1, [])).toBe(false);
    });
  });

  describe("Refresh Indicator", () => {
    it("should show refresh indicator", () => {
      const container = document.createElement("div");
      container.className = "sparql-results-container";

      (processor as any).showRefreshIndicator(container);

      const indicator = container.querySelector(".sparql-refresh-indicator");
      expect(indicator).toBeTruthy();
      expect(indicator?.textContent).toContain("Refreshing...");
    });

    it("should hide refresh indicator", () => {
      const container = document.createElement("div");
      container.className = "sparql-results-container";

      const indicator = document.createElement("div");
      indicator.className = "sparql-refresh-indicator";
      container.appendChild(indicator);

      (processor as any).hideRefreshIndicator(container);

      expect(container.querySelector(".sparql-refresh-indicator")).toBeFalsy();
    });

    it("should not duplicate refresh indicators", () => {
      const container = document.createElement("div");
      container.className = "sparql-results-container";

      (processor as any).showRefreshIndicator(container);
      (processor as any).showRefreshIndicator(container);

      const indicators = container.querySelectorAll(".sparql-refresh-indicator");
      expect(indicators.length).toBe(1);
    });
  });

  describe("Triple Store Invalidation", () => {
    it("should invalidate triple store", () => {
      (processor as any).tripleStore = {};

      (processor as any).invalidateTripleStore();

      expect((processor as any).tripleStore).toBeNull();
    });
  });

  describe("Refresh Query Method", () => {
    it("should handle refresh when no active query exists", async () => {
      const container = document.createElement("div");
      const el = document.createElement("div");

      await (processor as any).refreshQuery(el, container, "SELECT * WHERE { ?s ?p ?o }");

      // Should exit early when no active query
      expect(container.innerHTML).toBe("");
    });

    it("should handle refresh with active query but same results", async () => {
      const container = document.createElement("div");
      const el = document.createElement("div");
      const source = "SELECT * WHERE { ?s ?p ?o }";

      // Set up active query with all required fields
      const activeQuery = createMockActiveQuery({ source, lastResults: [] });
      (processor as any).activeQueries.set(el, activeQuery);

      // Mock methods
      (processor as any).invalidateTripleStore = jest.fn();
      (processor as any).ensureTripleStoreLoaded = jest.fn().mockResolvedValue(undefined);
      (processor as any).showRefreshIndicator = jest.fn();
      (processor as any).hideRefreshIndicator = jest.fn();
      (processor as any).executeQuery = jest.fn().mockResolvedValue([]);
      (processor as any).areResultsEqual = jest.fn().mockReturnValue(true);

      await (processor as any).refreshQuery(el, container, source);

      expect((processor as any).invalidateTripleStore).toHaveBeenCalled();
      expect((processor as any).ensureTripleStoreLoaded).toHaveBeenCalled();
      expect((processor as any).showRefreshIndicator).toHaveBeenCalledWith(container);
      expect((processor as any).hideRefreshIndicator).toHaveBeenCalledWith(container);
      expect((processor as any).executeQuery).toHaveBeenCalledWith(source, activeQuery.controller.signal);
    });

    it("should handle refresh with different results", async () => {
      const container = document.createElement("div");
      const el = document.createElement("div");
      const source = "SELECT * WHERE { ?s ?p ?o }";

      // Set up active query with all required fields
      const activeQuery = createMockActiveQuery({ source, lastResults: [] });
      (processor as any).activeQueries.set(el, activeQuery);

      const newResults = [
        {
          getBindings: () => new Map([["var1", { toString: () => "value1" }]]),
        },
      ];

      // Mock methods
      (processor as any).invalidateTripleStore = jest.fn();
      (processor as any).ensureTripleStoreLoaded = jest.fn().mockResolvedValue(undefined);
      (processor as any).showRefreshIndicator = jest.fn();
      (processor as any).executeQuery = jest.fn().mockResolvedValue(newResults);
      (processor as any).areResultsEqual = jest.fn().mockReturnValue(false);
      (processor as any).renderResults = jest.fn();

      await (processor as any).refreshQuery(el, container, source);

      expect((processor as any).renderResults).toHaveBeenCalledWith(newResults, container, source);
      expect((processor as any).activeQueries.get(el).lastResults).toBe(newResults);
    });

    it("should handle refresh errors", async () => {
      const container = document.createElement("div");
      const el = document.createElement("div");
      const source = "SELECT * WHERE { ?s ?p ?o }";

      // Set up active query with all required fields
      (processor as any).activeQueries.set(el, createMockActiveQuery({ source, lastResults: [] }));

      const error = new Error("Test error");

      // Mock methods
      (processor as any).invalidateTripleStore = jest.fn();
      (processor as any).ensureTripleStoreLoaded = jest.fn().mockRejectedValue(error);
      (processor as any).renderError = jest.fn();

      await (processor as any).refreshQuery(el, container, source);

      expect((processor as any).renderError).toHaveBeenCalledWith(error, container, source);
      expect(container.innerHTML).toBe("");
    });

    it("should handle abort errors gracefully during refresh", async () => {
      const container = document.createElement("div");
      const el = document.createElement("div");
      const source = "SELECT * WHERE { ?s ?p ?o }";

      // Set up active query with all required fields
      const activeQuery = createMockActiveQuery({ source, lastResults: [] });
      (processor as any).activeQueries.set(el, activeQuery);

      // Mock methods to throw AbortError
      (processor as any).invalidateTripleStore = jest.fn();
      (processor as any).ensureTripleStoreLoaded = jest.fn().mockResolvedValue(undefined);
      (processor as any).showRefreshIndicator = jest.fn();
      (processor as any).executeQuery = jest.fn().mockRejectedValue(
        new DOMException("Query aborted", "AbortError")
      );
      (processor as any).renderError = jest.fn();

      await (processor as any).refreshQuery(el, container, source);

      // Should NOT call renderError for abort errors
      expect((processor as any).renderError).not.toHaveBeenCalled();
    });
  });

  describe("Schedule Refresh Method", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should schedule refresh with debounce", () => {
      const el = document.createElement("div");
      const container = document.createElement("div");
      const source = "SELECT * WHERE { ?s ?p ?o }";

      // Set up active query with all required fields
      (processor as any).activeQueries.set(el, createMockActiveQuery({ source, lastResults: [] }));

      (processor as any).refreshQuery = jest.fn();

      (processor as any).scheduleRefresh(el, container, source);

      // Should not call immediately
      expect((processor as any).refreshQuery).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(500);

      // Should call after debounce delay
      expect((processor as any).refreshQuery).toHaveBeenCalledWith(el, container, source);
    });

    it("should cancel previous timeout when called multiple times", () => {
      const el = document.createElement("div");
      const container = document.createElement("div");
      const source = "SELECT * WHERE { ?s ?p ?o }";

      // Set up active query with all required fields
      (processor as any).activeQueries.set(el, createMockActiveQuery({ source, lastResults: [] }));

      (processor as any).refreshQuery = jest.fn();

      // Call multiple times rapidly
      (processor as any).scheduleRefresh(el, container, source);
      jest.advanceTimersByTime(200);
      (processor as any).scheduleRefresh(el, container, source);
      jest.advanceTimersByTime(200);
      (processor as any).scheduleRefresh(el, container, source);

      // Should not have called yet
      expect((processor as any).refreshQuery).not.toHaveBeenCalled();

      // Advance past debounce
      jest.advanceTimersByTime(500);

      // Should call only once
      expect((processor as any).refreshQuery).toHaveBeenCalledTimes(1);
    });

    it("should not schedule if no active query", () => {
      const el = document.createElement("div");
      const container = document.createElement("div");
      const source = "SELECT * WHERE { ?s ?p ?o }";

      (processor as any).refreshQuery = jest.fn();

      (processor as any).scheduleRefresh(el, container, source);

      jest.advanceTimersByTime(1000);

      // Should not call
      expect((processor as any).refreshQuery).not.toHaveBeenCalled();
    });
  });

  describe("Query Timeout and TTL", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should have QUERY_TTL_MS constant set to 5 minutes", () => {
      expect(processor.getQueryTTL()).toBe(5 * 60 * 1000);
    });

    it("should start cleanup interval on construction", () => {
      const stats = processor.getStats();
      expect(stats.cleanupIntervalActive).toBe(true);
    });

    it("should cleanup stale queries that exceed TTL", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");

      // Create an old query (6 minutes old)
      const oldQuery = createMockActiveQuery({
        source: "SELECT * WHERE { ?old ?p ?o }",
        startTime: Date.now() - (6 * 60 * 1000), // 6 minutes ago
      });

      // Create a fresh query
      const freshQuery = createMockActiveQuery({
        source: "SELECT * WHERE { ?fresh ?p ?o }",
        startTime: Date.now(), // just now
      });

      (processor as any).activeQueries.set(el1, oldQuery);
      (processor as any).activeQueries.set(el2, freshQuery);

      expect(processor.getActiveQueryCount()).toBe(2);

      // Run cleanup
      const cleanedUp = processor.cleanupStaleQueries();

      expect(cleanedUp).toBe(1);
      expect(processor.getActiveQueryCount()).toBe(1);
      expect((processor as any).activeQueries.has(el1)).toBe(false);
      expect((processor as any).activeQueries.has(el2)).toBe(true);
    });

    it("should abort queries when cleaning up", () => {
      const el = document.createElement("div");
      const controller = new AbortController();
      const abortSpy = jest.spyOn(controller, "abort");

      const oldQuery = createMockActiveQuery({
        source: "SELECT * WHERE { ?s ?p ?o }",
        startTime: Date.now() - (6 * 60 * 1000),
        controller,
      });

      (processor as any).activeQueries.set(el, oldQuery);

      processor.cleanupStaleQueries();

      expect(abortSpy).toHaveBeenCalled();
    });

    it("should clear refresh timeout when cleaning up stale queries", () => {
      const el = document.createElement("div");
      const refreshTimeout = setTimeout(() => {}, 10000);
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const oldQuery = createMockActiveQuery({
        source: "SELECT * WHERE { ?s ?p ?o }",
        startTime: Date.now() - (6 * 60 * 1000),
        refreshTimeout,
      });

      (processor as any).activeQueries.set(el, oldQuery);

      processor.cleanupStaleQueries();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(refreshTimeout);
    });

    it("should unregister event refs when cleaning up stale queries", () => {
      const el = document.createElement("div");
      const mockEventRef = {} as EventRef;

      const oldQuery = createMockActiveQuery({
        source: "SELECT * WHERE { ?s ?p ?o }",
        startTime: Date.now() - (6 * 60 * 1000),
        eventRef: mockEventRef,
      });

      (processor as any).activeQueries.set(el, oldQuery);

      processor.cleanupStaleQueries();

      expect(mockPlugin.app.metadataCache.offref).toHaveBeenCalledWith(mockEventRef);
    });

    it("should not cleanup queries that are within TTL", () => {
      const el = document.createElement("div");

      // Create a query that's 4 minutes old (within 5 minute TTL)
      const freshQuery = createMockActiveQuery({
        source: "SELECT * WHERE { ?s ?p ?o }",
        startTime: Date.now() - (4 * 60 * 1000),
      });

      (processor as any).activeQueries.set(el, freshQuery);

      const cleanedUp = processor.cleanupStaleQueries();

      expect(cleanedUp).toBe(0);
      expect(processor.getActiveQueryCount()).toBe(1);
    });

    it("should run periodic cleanup at configured interval", () => {
      // Stop the existing interval to control timing
      processor.cleanup();

      // Create fresh processor
      const freshProcessor = new SPARQLCodeBlockProcessor(mockPlugin);

      const cleanupSpy = jest.spyOn(freshProcessor, "cleanupStaleQueries");

      // Advance time by cleanup interval (1 minute)
      jest.advanceTimersByTime(60 * 1000);

      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      // Advance another minute
      jest.advanceTimersByTime(60 * 1000);

      expect(cleanupSpy).toHaveBeenCalledTimes(2);

      freshProcessor.cleanup();
    });

    it("should stop cleanup interval on cleanup()", () => {
      const stats1 = processor.getStats();
      expect(stats1.cleanupIntervalActive).toBe(true);

      processor.cleanup();

      const stats2 = processor.getStats();
      expect(stats2.cleanupIntervalActive).toBe(false);
    });

    it("should return correct stats", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");

      const oldTime = Date.now() - (3 * 60 * 1000); // 3 minutes ago
      const newTime = Date.now() - (1 * 60 * 1000); // 1 minute ago

      (processor as any).activeQueries.set(el1, createMockActiveQuery({
        source: "query1",
        startTime: oldTime,
      }));
      (processor as any).activeQueries.set(el2, createMockActiveQuery({
        source: "query2",
        startTime: newTime,
      }));

      const stats = processor.getStats();

      expect(stats.activeQueryCount).toBe(2);
      expect(stats.oldestQueryAge).toBeGreaterThanOrEqual(3 * 60 * 1000 - 100); // Allow some timing slack
      expect(stats.cleanupIntervalActive).toBe(true);
    });
  });

  describe("AbortController Integration", () => {
    it("should throw AbortError if signal is already aborted before execution", async () => {
      const controller = new AbortController();
      controller.abort();

      (processor as any).tripleStore = {}; // Set up mock store

      await expect(
        (processor as any).executeQuery("SELECT * WHERE { ?s ?p ?o }", controller.signal)
      ).rejects.toThrow("Query aborted");
    });

    it("should abort all queries on cleanup()", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");

      const controller1 = new AbortController();
      const controller2 = new AbortController();
      const abortSpy1 = jest.spyOn(controller1, "abort");
      const abortSpy2 = jest.spyOn(controller2, "abort");

      (processor as any).activeQueries.set(el1, createMockActiveQuery({ controller: controller1 }));
      (processor as any).activeQueries.set(el2, createMockActiveQuery({ controller: controller2 }));

      processor.cleanup();

      expect(abortSpy1).toHaveBeenCalled();
      expect(abortSpy2).toHaveBeenCalled();
    });
  });
});