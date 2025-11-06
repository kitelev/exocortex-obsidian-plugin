import type { MarkdownPostProcessorContext, App, Vault, MetadataCache, EventRef, TFile } from "obsidian";
import { SPARQLCodeBlockProcessor } from "../../../../src/application/processors/SPARQLCodeBlockProcessor";
import type ExocortexPlugin from "../../../../src/ExocortexPlugin";

describe("SPARQLCodeBlockProcessor", () => {
  let processor: SPARQLCodeBlockProcessor;
  let mockPlugin: ExocortexPlugin;
  let mockContext: MarkdownPostProcessorContext;
  let mockEl: HTMLElement;
  let mockMetadataCache: MetadataCache;

  beforeEach(() => {
    mockPlugin = {
      app: {
        vault: {} as Vault,
        metadataCache: {} as MetadataCache,
      } as App,
    } as ExocortexPlugin;

    mockContext = {
      addChild: jest.fn(),
    } as any;

    mockEl = document.createElement("div");

    processor = new SPARQLCodeBlockProcessor(mockPlugin);
  });

  afterEach(() => {
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
});