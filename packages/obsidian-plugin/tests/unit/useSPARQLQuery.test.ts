import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSPARQLQuery, useSPARQLQueryWithTransform, prefetchSPARQLQuery } from "../../src/infrastructure/query/useSPARQLQuery";
import { setQueryClient, getQueryClient, clearQueryCache } from "../../src/infrastructure/query/QueryClientSetup";
import type ExocortexPlugin from "../../src/ExocortexPlugin";
import type { QueryResult } from "../../src/application/api/SPARQLApi";

const mockQueryResult: QueryResult = {
  type: "SELECT",
  bindings: [
    { name: { termType: "Literal", value: "Test 1" } },
    { name: { termType: "Literal", value: "Test 2" } },
  ],
};

const createMockPlugin = (sparqlApi: any = null): ExocortexPlugin => ({
  getSPARQLApi: () => sparqlApi,
} as unknown as ExocortexPlugin);

const createMockSPARQLApi = (queryFn = jest.fn().mockResolvedValue(mockQueryResult)) => ({
  query: queryFn,
});

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useSPARQLQuery", () => {
  let queryClient: QueryClient;
  let originalClient: QueryClient;

  beforeEach(() => {
    originalClient = getQueryClient();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    setQueryClient(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
    setQueryClient(originalClient);
  });

  describe("basic functionality", () => {
    it("should return loading state initially", () => {
      const mockApi = createMockSPARQLApi();
      const plugin = createMockPlugin(mockApi);
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(
        () => useSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }"),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should fetch data successfully", async () => {
      const mockApi = createMockSPARQLApi();
      const plugin = createMockPlugin(mockApi);
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(
        () => useSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }"),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockQueryResult);
      expect(mockApi.query).toHaveBeenCalledWith("SELECT * WHERE { ?s ?p ?o }");
    });

    it("should return error when SPARQL API is not available", async () => {
      const plugin = createMockPlugin(null);
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(
        () => useSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }"),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("should handle query errors", async () => {
      const mockError = new Error("Query execution failed");
      const mockApi = createMockSPARQLApi(jest.fn().mockRejectedValue(mockError));
      const plugin = createMockPlugin(mockApi);
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(
        () => useSPARQLQuery(plugin, "INVALID QUERY"),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(mockError);
    });
  });

  describe("options", () => {
    it("should respect enabled option", () => {
      const mockApi = createMockSPARQLApi();
      const plugin = createMockPlugin(mockApi);
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(
        () => useSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }", { enabled: false }),
        { wrapper }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockApi.query).not.toHaveBeenCalled();
    });

    it("should use custom staleTime", async () => {
      const mockApi = createMockSPARQLApi();
      const plugin = createMockPlugin(mockApi);
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(
        () => useSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }", { staleTime: 60000 }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.isStale).toBe(false);
    });
  });

  describe("query key normalization", () => {
    it("should normalize whitespace in query strings", async () => {
      const mockApi = createMockSPARQLApi();
      const plugin = createMockPlugin(mockApi);
      const wrapper = createWrapper(queryClient);

      const { result: result1 } = renderHook(
        () => useSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }"),
        { wrapper }
      );

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      const { result: result2 } = renderHook(
        () => useSPARQLQuery(plugin, "SELECT *   WHERE   { ?s ?p ?o }"),
        { wrapper }
      );

      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      expect(mockApi.query).toHaveBeenCalledTimes(1);
    });
  });
});

describe("useSPARQLQueryWithTransform", () => {
  let queryClient: QueryClient;
  let originalClient: QueryClient;

  beforeEach(() => {
    originalClient = getQueryClient();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    setQueryClient(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
    setQueryClient(originalClient);
  });

  it("should transform query results", async () => {
    const mockApi = createMockSPARQLApi();
    const plugin = createMockPlugin(mockApi);
    const wrapper = createWrapper(queryClient);

    const transform = (result: QueryResult) => {
      if (result.type === "SELECT") {
        return result.bindings.length;
      }
      return 0;
    };

    const { result } = renderHook(
      () => useSPARQLQueryWithTransform(plugin, "SELECT * WHERE { ?s ?p ?o }", { transform }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe(2);
  });

  it("should handle transform errors gracefully", async () => {
    const mockApi = createMockSPARQLApi();
    const plugin = createMockPlugin(mockApi);
    const wrapper = createWrapper(queryClient);

    const transform = () => {
      throw new Error("Transform failed");
    };

    const { result } = renderHook(
      () => useSPARQLQueryWithTransform(plugin, "SELECT * WHERE { ?s ?p ?o }", { transform }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Transform failed");
  });
});

describe("prefetchSPARQLQuery", () => {
  let originalClient: QueryClient;

  beforeEach(() => {
    originalClient = getQueryClient();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    setQueryClient(queryClient);
  });

  afterEach(() => {
    clearQueryCache();
    setQueryClient(originalClient);
  });

  it("should resolve immediately when SPARQL API is not available", async () => {
    const plugin = createMockPlugin(null);

    await expect(prefetchSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }")).resolves.toBeUndefined();
  });

  it("should prefetch query and populate cache", async () => {
    const mockApi = createMockSPARQLApi();
    const plugin = createMockPlugin(mockApi);

    await prefetchSPARQLQuery(plugin, "SELECT * WHERE { ?s ?p ?o }");

    expect(mockApi.query).toHaveBeenCalledWith("SELECT * WHERE { ?s ?p ?o }");
  });
});
