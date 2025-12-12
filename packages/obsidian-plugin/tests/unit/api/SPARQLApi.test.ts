import { SPARQLApi } from "../../../src/application/api/SPARQLApi";
import { SPARQLQueryService } from "../../../src/application/services/SPARQLQueryService";
import type ExocortexPlugin from "../../../src/ExocortexPlugin";
import type { App } from "obsidian";

jest.mock("../../../src/application/services/SPARQLQueryService");

describe("SPARQLApi", () => {
  let api: SPARQLApi;
  let mockPlugin: ExocortexPlugin;
  let mockApp: App;
  let mockQueryService: jest.Mocked<SPARQLQueryService>;

  beforeEach(() => {
    mockApp = {} as App;
    mockPlugin = {
      app: mockApp,
    } as ExocortexPlugin;

    mockQueryService = {
      query: jest.fn(),
      refresh: jest.fn(),
      dispose: jest.fn(),
      getTripleStore: jest.fn().mockReturnValue({}),
    } as any;

    (SPARQLQueryService as jest.Mock).mockImplementation(() => mockQueryService);

    api = new SPARQLApi(mockPlugin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("query", () => {
    it("should execute SPARQL query and return results with count", async () => {
      const mockBindings = [
        { getBindings: () => new Map([["task", { value: "task1" }]]) },
        { getBindings: () => new Map([["task", { value: "task2" }]]) },
      ];

      mockQueryService.query.mockResolvedValue(mockBindings as any);

      const result = await api.query("SELECT ?task WHERE { ?task a ems:Task }");

      expect(mockQueryService.query).toHaveBeenCalledWith("SELECT ?task WHERE { ?task a ems:Task }");
      expect(result.bindings).toEqual(mockBindings);
      expect(result.count).toBe(2);
    });

    it("should return empty results when no bindings found", async () => {
      mockQueryService.query.mockResolvedValue([]);

      const result = await api.query("SELECT ?task WHERE { ?task a ems:Task }");

      expect(result.bindings).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should propagate errors from query service", async () => {
      const error = new Error("Query failed");
      mockQueryService.query.mockRejectedValue(error);

      await expect(api.query("INVALID QUERY")).rejects.toThrow("Query failed");
    });
  });

  describe("getTripleStore", () => {
    it("should return triple store from query service", () => {
      const mockTripleStore = {};
      mockQueryService.getTripleStore.mockReturnValue(mockTripleStore);

      const tripleStore = api.getTripleStore();

      expect(tripleStore).toBe(mockTripleStore);
      expect(mockQueryService.getTripleStore).toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should call refresh on query service", async () => {
      await api.refresh();

      expect(mockQueryService.refresh).toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should call dispose on query service", async () => {
      await api.dispose();

      expect(mockQueryService.dispose).toHaveBeenCalled();
    });
  });
});
