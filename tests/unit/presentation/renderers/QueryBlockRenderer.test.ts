import { QueryBlockRenderer } from "../../../../src/presentation/renderers/QueryBlockRenderer";
import { Vault, App, TFile } from "../../../__mocks__/obsidian";
import { QueryBlockConfig } from "../../../../src/domain/entities/LayoutBlock";

// Mock the ExecuteQueryBlockUseCase
jest.mock(
  "../../../../src/application/use-cases/ExecuteQueryBlockUseCase",
  () => {
    return {
      ExecuteQueryBlockUseCase: jest.fn().mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue({
          isFailure: false,
          getValue: () => ({
            results: [
              {
                path: "test1.md",
                basename: "test1",
                metadata: { frontmatter: { exo__Asset_label: "Test 1" } },
              },
              {
                path: "test2.md",
                basename: "test2",
                metadata: { frontmatter: { exo__Asset_label: "Test 2" } },
              },
            ],
            totalCount: 2,
            executionTime: 10,
          }),
        }),
      })),
    };
  },
);

describe("QueryBlockRenderer", () => {
  let renderer: QueryBlockRenderer;
  let mockVault: Vault;
  let mockApp: App;
  let mockFile: TFile;

  beforeEach(() => {
    mockVault = new Vault();
    mockApp = new App();
    mockFile = new TFile();
    mockFile.path = "test.md";
    mockFile.basename = "test";
    renderer = new QueryBlockRenderer(mockApp as any);
  });

  describe("render", () => {
    it("should render query results as list", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:Asset",
        displayAs: "list",
      };

      await renderer.render(container, config, mockFile, {}, null);

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.textContent).toContain("Found 2 items");
    });

    it("should render query results as table", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:Asset",
        displayAs: "table",
      };

      const mockDv = {
        pages: jest.fn(),
        table: jest.fn(),
        list: jest.fn(),
      };

      await renderer.render(container, config, mockFile, {}, mockDv);

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.textContent).toContain("Found 2 items");
    });

    it("should render query results as cards", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:Asset",
        displayAs: "cards",
      };

      await renderer.render(container, config, mockFile, {}, null);

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.textContent).toContain("Found 2 items");
    });

    it("should handle query failure", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "invalid:query",
      };

      // Mock failure scenario
      const mockUseCase =
        require("../../../../src/application/use-cases/ExecuteQueryBlockUseCase").ExecuteQueryBlockUseCase;
      mockUseCase.mockImplementationOnce(() => ({
        execute: jest.fn().mockResolvedValue({
          isFailure: true,
          error: "Invalid query syntax",
        }),
      }));

      const failingRenderer = new QueryBlockRenderer(mockApp as any);
      await failingRenderer.render(container, config, mockFile, {}, null);

      expect(container.textContent).toContain("Query failed");
    });

    it("should handle empty results", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:NonexistentClass",
      };

      // Mock empty results
      const mockUseCase =
        require("../../../../src/application/use-cases/ExecuteQueryBlockUseCase").ExecuteQueryBlockUseCase;
      mockUseCase.mockImplementationOnce(() => ({
        execute: jest.fn().mockResolvedValue({
          isFailure: false,
          getValue: () => ({
            results: [],
            totalCount: 0,
            executionTime: 5,
          }),
        }),
      }));

      const emptyRenderer = new QueryBlockRenderer(mockApp as any);
      await emptyRenderer.render(container, config, mockFile, {}, null);

      expect(container.textContent).toContain("No items found");
    });

    it("should handle property filters", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:Asset",
        propertyFilters: [
          {
            property: "status",
            operator: "equals",
            value: "active",
          },
        ],
        maxResults: 10,
        sortBy: "title",
        sortOrder: "asc",
      };

      await renderer.render(container, config, mockFile, {}, null);

      expect(container.children.length).toBeGreaterThan(0);
    });
  });

  describe("rendering modes", () => {
    it("should render list with proper structure", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:Asset",
        displayAs: "list",
      };

      await renderer.render(container, config, mockFile, {}, null);

      const list = container.querySelector("ul");
      expect(list).toBeTruthy();
      expect(list?.className).toContain("exocortex-query-list");
    });

    it("should render table with proper headers", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:Asset",
        displayAs: "table",
      };

      await renderer.render(container, config, mockFile, {}, null);

      const table = container.querySelector("table");
      expect(table).toBeTruthy();
      expect(table?.className).toContain("exocortex-query-table");
    });

    it("should render cards with proper styling", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "class:Asset",
        displayAs: "cards",
      };

      await renderer.render(container, config, mockFile, {}, null);

      const cardsContainer = container.querySelector(".exocortex-query-cards");
      expect(cardsContainer).toBeTruthy();
    });
  });

  describe("error handling", () => {
    it("should handle render errors gracefully", async () => {
      const container = document.createElement("div");
      const config = null as any;

      await expect(
        renderer.render(container, config, mockFile, {}, null),
      ).resolves.not.toThrow();
    });

    it("should handle invalid query config", async () => {
      const container = document.createElement("div");
      const config: QueryBlockConfig = {
        type: "query",
        query: "",
        maxResults: -1,
      };

      await renderer.render(container, config, mockFile, {}, null);

      expect(container).toBeDefined();
    });
  });
});
