import { QueryClient } from "@tanstack/react-query";

export interface QueryClientConfig {
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean;
  refetchOnWindowFocus?: boolean;
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_GC_TIME = 10 * 60 * 1000;

export function createQueryClient(config: QueryClientConfig = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: config.staleTime ?? DEFAULT_STALE_TIME,
        gcTime: config.gcTime ?? DEFAULT_GC_TIME,
        retry: config.retry ?? 1,
        refetchOnWindowFocus: config.refetchOnWindowFocus ?? false,
      },
    },
  });
}

let globalQueryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!globalQueryClient) {
    globalQueryClient = createQueryClient();
  }
  return globalQueryClient;
}

export function setQueryClient(client: QueryClient): void {
  globalQueryClient = client;
}

export function invalidateAllQueries(): Promise<void> {
  const client = getQueryClient();
  return client.invalidateQueries();
}

export function invalidateSPARQLQueries(): Promise<void> {
  const client = getQueryClient();
  return client.invalidateQueries({ queryKey: ["sparql"] });
}

export function clearQueryCache(): void {
  const client = getQueryClient();
  client.clear();
}

export interface CacheStatistics {
  totalQueries: number;
  staleQueries: number;
  fetchingQueries: number;
  cacheSize: number;
}

export function getCacheStatistics(): CacheStatistics {
  const client = getQueryClient();
  const cache = client.getQueryCache();
  const queries = cache.getAll();

  let staleQueries = 0;
  let fetchingQueries = 0;

  queries.forEach((query) => {
    if (query.isStale()) {
      staleQueries++;
    }
    if (query.state.fetchStatus === "fetching") {
      fetchingQueries++;
    }
  });

  return {
    totalQueries: queries.length,
    staleQueries,
    fetchingQueries,
    cacheSize: queries.length,
  };
}
