export {
  createQueryClient,
  getQueryClient,
  setQueryClient,
  invalidateAllQueries,
  invalidateSPARQLQueries,
  clearQueryCache,
  getCacheStatistics,
  type QueryClientConfig,
  type CacheStatistics,
} from "./QueryClientSetup";

export { QueryProvider, type QueryProviderProps } from "./QueryProvider";

export {
  WithQueryProvider,
  wrapWithQueryProvider,
  type WithQueryProviderProps,
} from "./WithQueryProvider";

export {
  useSPARQLQuery,
  useSPARQLQueryWithTransform,
  prefetchSPARQLQuery,
  type SPARQLQueryResult,
  type UseSPARQLQueryOptions,
  type UseSPARQLQueryWithTransformOptions,
} from "./useSPARQLQuery";
