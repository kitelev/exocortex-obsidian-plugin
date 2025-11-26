import { QueryClient } from "@tanstack/react-query";
import {
  createQueryClient,
  getQueryClient,
  setQueryClient,
  invalidateAllQueries,
  invalidateSPARQLQueries,
  clearQueryCache,
  getCacheStatistics,
} from "../../src/infrastructure/query/QueryClientSetup";

describe("QueryClientSetup", () => {
  let originalClient: QueryClient | null = null;

  beforeEach(() => {
    originalClient = null;
    try {
      originalClient = getQueryClient();
    } catch {
      // No client set
    }
    clearQueryCache();
  });

  afterEach(() => {
    if (originalClient) {
      setQueryClient(originalClient);
    }
  });

  describe("createQueryClient", () => {
    it("should create a QueryClient with default options", () => {
      const client = createQueryClient();

      expect(client).toBeInstanceOf(QueryClient);
      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000);
      expect(defaultOptions.queries?.retry).toBe(1);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it("should create a QueryClient with custom staleTime", () => {
      const customStaleTime = 60 * 1000;
      const client = createQueryClient({ staleTime: customStaleTime });

      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(customStaleTime);
    });

    it("should create a QueryClient with custom gcTime", () => {
      const customGcTime = 30 * 60 * 1000;
      const client = createQueryClient({ gcTime: customGcTime });

      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.gcTime).toBe(customGcTime);
    });

    it("should create a QueryClient with custom retry", () => {
      const client = createQueryClient({ retry: 3 });

      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.retry).toBe(3);
    });

    it("should create a QueryClient with refetchOnWindowFocus enabled", () => {
      const client = createQueryClient({ refetchOnWindowFocus: true });

      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    });
  });

  describe("getQueryClient", () => {
    it("should return the same instance on multiple calls", () => {
      const client1 = getQueryClient();
      const client2 = getQueryClient();

      expect(client1).toBe(client2);
    });

    it("should create a client if none exists", () => {
      const newClient = createQueryClient();
      setQueryClient(newClient);

      const retrievedClient = getQueryClient();
      expect(retrievedClient).toBe(newClient);
    });
  });

  describe("setQueryClient", () => {
    it("should set a new query client", () => {
      const newClient = createQueryClient({ staleTime: 1000 });
      setQueryClient(newClient);

      const retrievedClient = getQueryClient();
      expect(retrievedClient).toBe(newClient);
      expect(retrievedClient.getDefaultOptions().queries?.staleTime).toBe(1000);
    });
  });

  describe("invalidateAllQueries", () => {
    it("should return a promise", async () => {
      const result = invalidateAllQueries();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  describe("invalidateSPARQLQueries", () => {
    it("should return a promise", async () => {
      const result = invalidateSPARQLQueries();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    it("should invalidate queries with sparql key", async () => {
      const client = getQueryClient();
      const invalidateSpy = jest.spyOn(client, "invalidateQueries");

      await invalidateSPARQLQueries();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["sparql"] });
      invalidateSpy.mockRestore();
    });
  });

  describe("clearQueryCache", () => {
    it("should clear the query cache", () => {
      const client = getQueryClient();
      const clearSpy = jest.spyOn(client, "clear");

      clearQueryCache();

      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });
  });

  describe("getCacheStatistics", () => {
    it("should return cache statistics with initial values", () => {
      const stats = getCacheStatistics();

      expect(stats).toHaveProperty("totalQueries");
      expect(stats).toHaveProperty("staleQueries");
      expect(stats).toHaveProperty("fetchingQueries");
      expect(stats).toHaveProperty("cacheSize");
      expect(typeof stats.totalQueries).toBe("number");
      expect(typeof stats.staleQueries).toBe("number");
      expect(typeof stats.fetchingQueries).toBe("number");
      expect(typeof stats.cacheSize).toBe("number");
    });

    it("should return zero queries for empty cache", () => {
      clearQueryCache();
      const stats = getCacheStatistics();

      expect(stats.totalQueries).toBe(0);
      expect(stats.staleQueries).toBe(0);
      expect(stats.fetchingQueries).toBe(0);
      expect(stats.cacheSize).toBe(0);
    });
  });
});
