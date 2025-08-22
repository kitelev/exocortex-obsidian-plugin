import { MarkdownPostProcessorContext, Plugin, App, Notice } from "obsidian";
import { SPARQLProcessor } from "../../../../src/presentation/processors/SPARQLProcessor";
import { Graph } from "../../../../src/domain/semantic/core/Graph";
import {
  Triple,
  IRI,
  Literal,
} from "../../../../src/domain/semantic/core/Triple";
import {
  SPARQLEngine,
  SelectResult,
  ConstructResult,
} from "../../../../src/application/SPARQLEngine";
import { ExoFocusService } from "../../../../src/application/services/ExoFocusService";
import { RDFService } from "../../../../src/application/services/RDFService";
import { SPARQLSanitizer } from "../../../../src/application/services/SPARQLSanitizer";
// Result will be mocked through the SPARQLSanitizer mock

// Mock dependencies
jest.mock("../../../../src/application/SPARQLEngine");
jest.mock("../../../../src/domain/semantic/core/Graph");
jest.mock("../../../../src/application/services/ExoFocusService");
jest.mock("../../../../src/application/services/RDFService");
jest.mock("../../../../src/application/services/SPARQLSanitizer");
jest.mock("../../../../src/presentation/modals/ExportRDFModal");

describe("SPARQLProcessor", () => {
  let processor: SPARQLProcessor;
  let mockPlugin: jest.Mocked<Plugin>;
  let mockGraph: jest.Mocked<Graph>;
  let mockEngine: jest.Mocked<SPARQLEngine>;
  let mockFocusService: jest.Mocked<ExoFocusService>;
  let mockRDFService: jest.Mocked<RDFService>;
  let mockSanitizer: jest.Mocked<SPARQLSanitizer>;
  let mockApp: jest.Mocked<App>;
  let container: HTMLElement;
  let context: MarkdownPostProcessorContext;

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById("test-container")!;

    // Mock app
    mockApp = {
      workspace: {
        openLinkText: jest.fn(),
      },
    } as any;

    // Mock plugin
    mockPlugin = {
      app: mockApp,
    } as any;

    // Mock graph
    mockGraph = new Graph() as jest.Mocked<Graph>;

    // Create default mock responses
    const defaultSelectResult = {
      results: [
        { s: "subject1", p: "predicate1", o: "object1" },
        { s: "subject2", p: "predicate2", o: "object2" },
      ],
      cached: false,
    };

    const defaultConstructResult = {
      triples: [],
      cached: false,
      provenance: "test",
    };

    // Create mock engine instance
    mockEngine = {
      select: jest.fn().mockReturnValue(defaultSelectResult),
      construct: jest.fn().mockReturnValue(defaultConstructResult),
      getCacheStatistics: jest.fn().mockReturnValue({
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        maxSize: 100,
        totalQueries: 0,
        evictions: 0,
      }),
      invalidateCache: jest.fn(),
      cleanupCache: jest.fn().mockReturnValue(0),
      destroy: jest.fn(),
    } as jest.Mocked<SPARQLEngine>;

    // Mock the SPARQLEngine constructor to return our mock instance
    (SPARQLEngine as jest.MockedClass<typeof SPARQLEngine>).mockImplementation(
      () => {
        return mockEngine;
      },
    );

    // Mock services
    mockFocusService = new ExoFocusService(
      mockApp,
      mockGraph,
    ) as jest.Mocked<ExoFocusService>;
    mockRDFService = new RDFService(mockApp) as jest.Mocked<RDFService>;
    mockSanitizer = new SPARQLSanitizer() as jest.Mocked<SPARQLSanitizer>;

    // Mock the filterSPARQLResults method to return results unchanged
    mockFocusService.filterSPARQLResults = jest
      .fn()
      .mockImplementation((results) => results);

    // Setup service mocks
    (RDFService as jest.MockedClass<typeof RDFService>).mockImplementation(
      () => mockRDFService,
    );
    (
      SPARQLSanitizer as jest.MockedClass<typeof SPARQLSanitizer>
    ).mockImplementation(() => mockSanitizer);

    mockRDFService.getNamespaceManager = jest.fn().mockReturnValue({
      getPrefix: jest.fn().mockReturnValue("exo"),
      expand: jest.fn().mockReturnValue("http://example.org/exo#"),
    });

    // Mock sanitizer - should return the input query as sanitized
    mockSanitizer.sanitize = jest.fn().mockImplementation((input: string) => ({
      isSuccess: true,
      isFailure: false,
      getValue: () => ({
        query: input, // Return the same query that was passed in
        warnings: [],
      }),
      errorValue: () => null,
    }));

    // Create processor
    processor = new SPARQLProcessor(mockPlugin, mockGraph, mockFocusService);

    // Mock context
    context = {
      sourcePath: "test.md",
      frontmatter: {},
      addChild: jest.fn(),
      getSectionInfo: jest.fn(),
    };

    // Mock Notice
    jest.spyOn(require("obsidian"), "Notice").mockImplementation(() => ({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("Initialization", () => {
    test("should initialize with all required dependencies", () => {
      expect(processor).toBeDefined();
      expect(processor["plugin"]).toBe(mockPlugin);
      expect(processor["graph"]).toBe(mockGraph);
      expect(processor["engine"]).toBe(mockEngine);
      expect(processor["focusService"]).toBe(mockFocusService);
    });

    test("should initialize without focus service", () => {
      const processorNoFocus = new SPARQLProcessor(mockPlugin, mockGraph);
      expect(processorNoFocus).toBeDefined();
      expect(processorNoFocus["focusService"]).toBeUndefined();
    });

    test("should initialize with cache configuration", () => {
      const cacheConfig = {
        maxSize: 100,
        defaultTTL: 60000,
        enabled: true,
      };

      const processorWithCache = new SPARQLProcessor(
        mockPlugin,
        mockGraph,
        mockFocusService,
        cacheConfig,
      );
      expect(processorWithCache).toBeDefined();
      expect(SPARQLEngine).toHaveBeenCalledWith(mockGraph, cacheConfig);
    });
  });

  describe("processCodeBlock", () => {
    test("should process simple SELECT query successfully", async () => {
      const selectResults = [
        { s: "subject1", p: "predicate1", o: "object1" },
        { s: "subject2", p: "predicate2", o: "object2" },
      ];

      // Set up the mock engine for this specific test
      mockEngine.select.mockReturnValue({
        results: selectResults,
        cached: false,
      } as SelectResult);

      const source = "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10";

      await processor.processCodeBlock(source, container, context);

      expect(mockSanitizer.sanitize).toHaveBeenCalledWith(source);
      expect(mockEngine.select).toHaveBeenCalledWith(source);

      // Check DOM structure
      const sparqlContainer = container.querySelector(
        ".exocortex-sparql-container",
      );
      expect(sparqlContainer).toBeTruthy();
      expect(sparqlContainer?.querySelector("h3")?.textContent).toBe(
        "SPARQL Query Results",
      );
      expect(sparqlContainer?.querySelector("pre")?.textContent).toBe(source);
      expect(sparqlContainer?.querySelector("table")).toBeTruthy();
    });

    test("should process CONSTRUCT query successfully", async () => {
      const mockTriples = [
        {
          getSubject: () => ({ toString: () => "http://example.org/s1" }),
          getPredicate: () => ({ toString: () => "http://example.org/p1" }),
          getObject: () => ({ toString: () => "http://example.org/o1" }),
        },
        {
          getSubject: () => ({ toString: () => "http://example.org/s2" }),
          getPredicate: () => ({ toString: () => "http://example.org/p2" }),
          getObject: () => ({ toString: () => "http://example.org/o2" }),
        },
      ];

      mockEngine.construct = jest.fn().mockReturnValue({
        triples: mockTriples,
        cached: false,
        provenance: "test-query",
      } as ConstructResult);

      mockGraph.add = jest.fn();

      const source = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";

      await processor.processCodeBlock(source, container, context);

      expect(mockSanitizer.sanitize).toHaveBeenCalledWith(source);
      expect(mockEngine.construct).toHaveBeenCalledWith(source);
      expect(mockGraph.add).toHaveBeenCalledTimes(2);

      // Check results formatting
      const sparqlContainer = container.querySelector(
        ".exocortex-sparql-container",
      );
      expect(sparqlContainer).toBeTruthy();
      expect(sparqlContainer?.querySelector("table")).toBeTruthy();

      // Check that the table contains the expected triple data (s1, p1, o1 are extracted from URIs as note names)
      const firstCell = sparqlContainer?.querySelector("td");
      expect(firstCell?.textContent).toBe("s1");
    });

    test("should handle empty results", async () => {
      mockEngine.select = jest.fn().mockReturnValue({
        results: [],
        cached: false,
      } as SelectResult);

      const source = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      await processor.processCodeBlock(source, container, context);

      expect(container.querySelector(".sparql-empty-result")).toBeTruthy();
      expect(container.querySelector(".sparql-empty-result")?.textContent).toBe(
        "No results found",
      );
    });

    test("should handle cached results", async () => {
      const selectResults = [{ s: "cached1", p: "cached2", o: "cached3" }];

      mockEngine.select = jest.fn().mockReturnValue({
        results: selectResults,
        cached: true,
      } as SelectResult);

      const source = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      await processor.processCodeBlock(source, container, context);

      expect(container.querySelector(".sparql-cache-indicator")).toBeTruthy();
      expect(
        container.querySelector(".sparql-cache-indicator")?.textContent,
      ).toContain("Cached Result");
    });

    test("should display loading indicator", async () => {
      let resolvePromise: Function;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockEngine.select = jest.fn().mockReturnValue({
        results: [],
        cached: false,
      } as SelectResult);

      // Mock processCodeBlock to be slow
      const originalExecuteQuery = processor.executeQuery;
      processor.executeQuery = jest.fn().mockImplementation(() => slowPromise);

      const source = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";
      const processPromise = processor.processCodeBlock(
        source,
        container,
        context,
      );

      // Check loading indicator appears
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(container.querySelector(".sparql-loading")).toBeTruthy();
      expect(container.querySelector(".sparql-loading")?.textContent).toBe(
        "Executing query...",
      );

      // Complete the promise
      resolvePromise!({ results: [], cached: false });
      await processPromise;

      // Loading indicator should be removed
      expect(container.querySelector(".sparql-loading")).toBeFalsy();

      processor.executeQuery = originalExecuteQuery;
    });

    test("should handle query execution errors", async () => {
      const source = "INVALID SPARQL QUERY";

      // Mock sanitizer to return error
      mockSanitizer.sanitize = jest.fn().mockReturnValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Invalid SPARQL syntax",
      });

      await processor.processCodeBlock(source, container, context);

      expect(container.querySelector(".sparql-error")).toBeTruthy();
      expect(container.querySelector(".sparql-error")?.textContent).toContain(
        "Query validation failed",
      );
    });

    test("should apply ExoFocus filtering when available", async () => {
      const originalResults = [
        { s: "subject1", p: "predicate1", o: "object1" },
        { s: "subject2", p: "predicate2", o: "object2" },
        { s: "subject3", p: "predicate3", o: "object3" },
      ];

      const filteredResults = [
        { s: "subject1", p: "predicate1", o: "object1" },
      ];

      mockEngine.select = jest.fn().mockReturnValue({
        results: originalResults,
        cached: false,
      } as SelectResult);

      mockFocusService.filterSPARQLResults = jest
        .fn()
        .mockReturnValue(filteredResults);

      const source = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      await processor.processCodeBlock(source, container, context);

      expect(mockFocusService.filterSPARQLResults).toHaveBeenCalledWith(
        originalResults,
      );

      // Check that filtered results are displayed
      const rows = container.querySelectorAll("tbody tr");
      expect(rows).toHaveLength(1);
    });
  });

  describe("executeQuery", () => {
    test("should reject empty queries", async () => {
      await expect(processor.executeQuery("")).rejects.toThrow("Empty query");
      await expect(processor.executeQuery("   ")).rejects.toThrow(
        "Empty query",
      );
    });

    test("should handle query sanitization failures", async () => {
      mockSanitizer.sanitize = jest.fn().mockReturnValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Malicious query detected",
      });

      await expect(processor.executeQuery("DROP TABLE users;")).rejects.toThrow(
        "Query validation failed",
      );
    });

    test("should show warnings from sanitizer", async () => {
      const mockNotice = jest.spyOn(require("obsidian"), "Notice");

      mockSanitizer.sanitize = jest.fn().mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          query: "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
          warnings: ["Query contains deprecated syntax"],
        }),
        errorValue: () => null,
      });

      mockEngine.select = jest.fn().mockReturnValue({
        results: [],
        cached: false,
      } as SelectResult);

      await processor.executeQuery("SELECT ?s ?p ?o WHERE { ?s ?p ?o }");

      expect(mockNotice).toHaveBeenCalledWith(
        "Query executed with warnings: Query contains deprecated syntax",
      );
    });

    test("should reject unsupported query types", async () => {
      mockSanitizer.sanitize = jest.fn().mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          query: "DELETE WHERE { ?s ?p ?o }",
          warnings: [],
        }),
        errorValue: () => null,
      });

      await expect(
        processor.executeQuery("DELETE WHERE { ?s ?p ?o }"),
      ).rejects.toThrow(
        "Only SELECT and CONSTRUCT queries are currently supported",
      );
    });

    test("should handle CONSTRUCT query with duplicate prevention", async () => {
      const mockTriples = [
        {
          getSubject: () => ({ toString: () => "http://example.org/s1" }),
          getPredicate: () => ({ toString: () => "http://example.org/p1" }),
          getObject: () => ({ toString: () => "http://example.org/o1" }),
        },
      ];

      // Test cached result - should not add to graph
      mockEngine.construct = jest.fn().mockReturnValue({
        triples: mockTriples,
        cached: true,
        provenance: "test-query",
      } as ConstructResult);

      const result = await processor.executeQuery(
        "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      );

      expect(mockGraph.add).not.toHaveBeenCalled();
      expect(result.cached).toBe(true);
      expect(result.results).toHaveLength(1);
    });
  });

  describe("Table Creation", () => {
    test("should create table with headers", () => {
      const results = [
        { name: "John", age: "25", city: "New York" },
        { name: "Jane", age: "30", city: "Boston" },
      ];

      const table = processor["createResultTable"](results);

      expect(table.tagName).toBe("TABLE");
      expect(table.className).toBe("sparql-results-table");

      // Check headers
      const headers = table.querySelectorAll("th");
      expect(headers).toHaveLength(3);
      expect(headers[0].textContent).toBe("name");
      expect(headers[1].textContent).toBe("age");
      expect(headers[2].textContent).toBe("city");

      // Check data rows
      const dataRows = table.querySelectorAll("tbody tr");
      expect(dataRows).toHaveLength(2);
      expect(dataRows[0].cells[0].textContent).toBe("John");
      expect(dataRows[1].cells[0].textContent).toBe("Jane");
    });

    test("should create empty table for no results", () => {
      const table = processor["createResultTable"]([]);
      expect(table.tagName).toBe("TABLE");
      expect(table.querySelectorAll("tr")).toHaveLength(0);
    });

    test("should handle file links in results", () => {
      const results = [
        { file: "file://test-note.md", content: "some content" },
        { file: "/path/to/note.md", content: "more content" },
      ];

      const table = processor["createResultTable"](results);

      const links = table.querySelectorAll("a.internal-link");
      expect(links).toHaveLength(2);
      expect(links[0].textContent).toBe("test-note.md");
      expect(links[1].textContent).toBe("note.md");
    });

    test("should handle click events on note links", () => {
      const results = [{ file: "file://test-note.md" }];
      const table = processor["createResultTable"](results);
      const link = table.querySelector("a.internal-link") as HTMLAnchorElement;

      expect(link).toBeTruthy();

      // Mock click event
      const clickEvent = new Event("click");
      jest.spyOn(clickEvent, "preventDefault");

      link.dispatchEvent(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(mockApp.workspace.openLinkText).toHaveBeenCalledWith(
        "test-note.md",
        "",
      );
    });
  });

  describe("Cache Management", () => {
    test("should return cache statistics", () => {
      const mockStats = {
        hits: 15,
        misses: 8,
        hitRate: 65.2,
        size: 12,
        maxSize: 100,
        totalQueries: 23,
        evictions: 2,
      };

      mockEngine.getCacheStatistics = jest.fn().mockReturnValue(mockStats);

      const stats = processor.getCacheStatistics();
      expect(stats).toEqual(mockStats);
      expect(mockEngine.getCacheStatistics).toHaveBeenCalled();
    });

    test("should invalidate cache", () => {
      mockEngine.invalidateCache = jest.fn();
      processor.invalidateCache();
      expect(mockEngine.invalidateCache).toHaveBeenCalled();
    });

    test("should cleanup cache", () => {
      mockEngine.cleanupCache = jest.fn().mockReturnValue(5);
      const result = processor.cleanupCache();
      expect(result).toBe(5);
      expect(mockEngine.cleanupCache).toHaveBeenCalled();
    });

    test("should destroy resources", () => {
      mockEngine.destroy = jest.fn();
      processor.destroy();
      expect(mockEngine.destroy).toHaveBeenCalled();
    });
  });

  describe("UI Elements", () => {
    test("should create loading indicator", () => {
      const loading = processor["createLoadingIndicator"]();
      expect(loading.className).toBe("sparql-loading");
      expect(loading.textContent).toBe("Executing query...");
    });

    test("should create error message", () => {
      const error = new Error("Test error message");
      const errorEl = processor["createErrorMessage"](error);

      expect(errorEl.className).toBe("sparql-error");
      expect(errorEl.textContent).toContain("Query Error:");
      expect(errorEl.textContent).toContain("Test error message");
    });

    test("should create stats element without cache info", () => {
      const stats = processor["createStatsElement"](5, 150);
      expect(stats.className).toBe("sparql-stats");
      expect(stats.textContent).toBe("Executed in 150ms - 5 results");
    });

    test("should create stats element with cache info", () => {
      const stats = processor["createStatsElement"](5, 150, true);
      expect(stats.textContent).toBe(
        "Executed in 150ms - 5 results (cached result)",
      );
    });

    test("should create cache indicator for cached results", () => {
      const indicator = processor["createCacheIndicator"](true);
      expect(indicator.className).toBe("sparql-cache-indicator");
      expect(indicator.textContent).toBe("📋 Cached Result");
      expect(indicator.style.background).toContain("rgb(232, 245, 232)");
    });

    test("should create cache indicator for fresh results", () => {
      const indicator = processor["createCacheIndicator"](false);
      expect(indicator.textContent).toBe("🔄 Fresh Result");
      expect(indicator.style.background).toContain("rgb(227, 242, 253)");
    });
  });

  describe("Export Controls", () => {
    test("should create export controls with format buttons", () => {
      const results = [{ s: "test", p: "test", o: "test" }];
      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      const controls = processor["createExportControls"](results, query);

      expect(controls.className).toBe("sparql-export-controls");
      expect(controls.textContent).toContain("Export results:");

      // Check format buttons
      const buttons = controls.querySelectorAll(".sparql-export-button");
      expect(buttons).toHaveLength(4); // Turtle, JSON-LD, N-Triples, RDF/XML

      expect(buttons[0].textContent).toBe("Turtle");
      expect(buttons[1].textContent).toBe("JSON-LD");
      expect(buttons[2].textContent).toBe("N-Triples");
      expect(buttons[3].textContent).toBe("RDF/XML");
    });

    test("should create advanced export button", () => {
      const results = [{ s: "test", p: "test", o: "test" }];
      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      const controls = processor["createExportControls"](results, query);
      const advancedButton = controls.querySelector(".sparql-export-advanced");

      expect(advancedButton).toBeTruthy();
      expect(advancedButton!.textContent).toBe("Advanced...");
    });

    test("should handle export button clicks", async () => {
      mockRDFService.exportQueryResults = jest.fn().mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          tripleCount: 10,
          fileName: "test-export.ttl",
          content: "mock turtle content",
        }),
        errorValue: () => null,
      });

      const results = [{ s: "test", p: "test", o: "test" }];
      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      const controls = processor["createExportControls"](results, query);
      const turtleButton = controls.querySelector(
        ".sparql-export-button",
      ) as HTMLButtonElement;

      // Simulate click
      turtleButton.click();

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRDFService.exportQueryResults).toHaveBeenCalledWith(
        results,
        "turtle",
        expect.any(String),
      );
    });

    test("should handle export errors", async () => {
      mockRDFService.exportQueryResults = jest.fn().mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Export failed",
      });

      const mockNotice = jest.spyOn(require("obsidian"), "Notice");

      const results = [{ s: "test", p: "test", o: "test" }];
      const query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }";

      const controls = processor["createExportControls"](results, query);
      const turtleButton = controls.querySelector(
        ".sparql-export-button",
      ) as HTMLButtonElement;

      // Simulate click
      turtleButton.click();

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockNotice).toHaveBeenCalledWith("Export failed: Export failed");
    });
  });

  describe("Performance Tests", () => {
    test("should handle large result sets efficiently", async () => {
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Name ${i}`,
        value: `Value ${i}`,
      }));

      mockEngine.select = jest.fn().mockReturnValue({
        results: largeResults,
        cached: false,
      } as SelectResult);

      const source = "SELECT ?id ?name ?value WHERE { ?id ?name ?value }";
      const startTime = Date.now();

      await processor.processCodeBlock(source, container, context);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify table was created
      const table = container.querySelector("table");
      expect(table).toBeTruthy();

      const rows = table!.querySelectorAll("tbody tr");
      expect(rows).toHaveLength(1000);
    });

    test("should handle complex queries with multiple variables", async () => {
      const complexResults = [
        {
          subject: "http://example.org/person1",
          name: "John Doe",
          age: "30",
          email: "john@example.org",
          department: "Engineering",
          manager: "http://example.org/person2",
          projects: "Project A, Project B",
          skills: "JavaScript, TypeScript, React",
        },
      ];

      mockEngine.select = jest.fn().mockReturnValue({
        results: complexResults,
        cached: false,
      } as SelectResult);

      const source = `
        SELECT ?subject ?name ?age ?email ?department ?manager ?projects ?skills
        WHERE {
          ?subject foaf:name ?name ;
                   foaf:age ?age ;
                   foaf:mbox ?email ;
                   org:department ?department ;
                   org:manager ?manager ;
                   proj:projects ?projects ;
                   skill:has ?skills .
        }
      `;

      await processor.processCodeBlock(source, container, context);

      const table = container.querySelector("table");
      expect(table).toBeTruthy();

      const headers = table!.querySelectorAll("th");
      expect(headers).toHaveLength(8);

      const dataRow = table!.querySelector("tbody tr");
      expect(dataRow).toBeTruthy();
      expect(dataRow!.cells).toHaveLength(8);
    });
  });

  describe("Edge Cases", () => {
    test("should handle null and undefined values in results", () => {
      const results = [
        { name: "John", age: null, city: undefined },
        { name: null, age: "25", city: "" },
        { name: undefined, age: undefined, city: "Boston" },
      ];

      const table = processor["createResultTable"](results);
      const cells = table.querySelectorAll("td");

      // Should display empty string for null/undefined
      expect(cells[1].textContent).toBe(""); // null age
      expect(cells[2].textContent).toBe(""); // undefined city
      expect(cells[3].textContent).toBe(""); // null name
      expect(cells[5].textContent).toBe(""); // empty city
    });

    test("should handle results with inconsistent column structure", () => {
      const results = [
        { name: "John", age: "30" },
        { name: "Jane", city: "Boston" },
        { age: "25", city: "New York", country: "USA" },
      ];

      // Should use columns from first result
      const table = processor["createResultTable"](results);
      const headers = table.querySelectorAll("th");

      expect(headers).toHaveLength(2);
      expect(headers[0].textContent).toBe("name");
      expect(headers[1].textContent).toBe("age");
    });

    test("should handle very long query strings", async () => {
      const longQuery = `
        SELECT ?s ?p ?o WHERE {
          ?s ?p ?o .
          ${Array.from({ length: 100 }, (_, i) => `OPTIONAL { ?s ex:prop${i} ?val${i} }`).join(" ")}
        }
      `.trim();

      mockEngine.select = jest.fn().mockReturnValue({
        results: [],
        cached: false,
      } as SelectResult);

      await processor.processCodeBlock(longQuery, container, context);

      expect(container.querySelector("pre")?.textContent).toBe(longQuery);
      expect(mockEngine.select).toHaveBeenCalledWith(longQuery);
    });

    test("should handle special characters in query and results", async () => {
      const results = [
        { name: "Jöhn Döe", description: "Special chars: àáâãäå" },
        { name: "Смит", description: "Cyrillic: русский текст" },
        { name: "田中太郎", description: "Japanese: こんにちは" },
      ];

      mockEngine.select = jest.fn().mockReturnValue({
        results: results,
        cached: false,
      } as SelectResult);

      const query =
        "SELECT ?name ?description WHERE { ?person rdfs:label ?name ; dc:description ?description }";

      await processor.processCodeBlock(query, container, context);

      const table = container.querySelector("table");
      const cells = table!.querySelectorAll("td");

      expect(cells[0].textContent).toBe("Jöhn Döe");
      expect(cells[1].textContent).toBe("Special chars: àáâãäå");
      expect(cells[2].textContent).toBe("Смит");
      expect(cells[4].textContent).toBe("田中太郎");
    });
  });
});

// Test utilities
function createMockTriple(s: string, p: string, o: string): any {
  return {
    getSubject: () => ({ toString: () => s }),
    getPredicate: () => ({ toString: () => p }),
    getObject: () => ({ toString: () => o }),
  };
}

function createMockContext(
  sourcePath: string = "test.md",
): MarkdownPostProcessorContext {
  return {
    sourcePath,
    frontmatter: {},
    addChild: jest.fn(),
    getSectionInfo: jest.fn(),
  };
}
