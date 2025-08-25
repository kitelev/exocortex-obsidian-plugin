@performance @caching @optimization @scalability
Feature: Caching and Performance - High-Performance Knowledge Management
  As a user working with large knowledge bases in the Exocortex plugin
  I want optimal performance through intelligent caching and optimization
  So that I can work efficiently with my knowledge without delays or system slowdowns

  Background:
    Given the Exocortex plugin is initialized
    And the performance monitoring system is active
    And the query cache is enabled with default configuration:
      | setting           | value      |
      | maxSize          | 1000       |
      | defaultTTL       | 300000ms   |
      | maxTTL           | 1800000ms  |
      | cleanupInterval  | 60000ms    |
      | enabled          | true       |

  @query-caching @cache-hit-miss @performance-optimization
  Scenario: Cache query results for improved performance
    Given I have a complex SPARQL query that takes 500ms to execute
    When I execute the query for the first time
    Then the query should be executed and results cached
    And the response time should be approximately 500ms
    And cache statistics should show:
      | metric      | value |
      | hits        | 0     |
      | misses      | 1     |
      | totalQueries| 1     |
      | hitRate     | 0%    |
    When I execute the same query again
    Then the cached results should be returned
    And the response time should be under 50ms
    And cache statistics should show:
      | metric      | value |
      | hits        | 1     |
      | misses      | 1     |
      | totalQueries| 2     |
      | hitRate     | 50%   |

  @cache-invalidation @data-freshness @consistency
  Scenario: Invalidate cache when underlying data changes
    Given I have cached results for a query about project tasks
    And the cache contains 5 task results
    When I modify one of the tasks in the underlying data
    Then the cache should be automatically invalidated
    And the next query should fetch fresh data
    And the cache miss counter should be incremented
    When I execute the query after the change
    Then I should see the updated task data
    And the results should be cached again for future use

  @cache-key-normalization @query-matching @intelligent-caching
  Scenario: Generate consistent cache keys for similar queries
    Given I have the following logically equivalent queries:
      | query_variant                                          |
      | SELECT * WHERE { ?s ?p ?o } ORDER BY ?s              |
      | select * where { ?s ?p ?o } order by ?s              |
      | SELECT   *   WHERE   {   ?s   ?p   ?o   }  ORDER BY ?s|
      | SELECT *\nWHERE {\n  ?s ?p ?o\n} ORDER BY ?s        |
    When I execute each query variant
    Then all variants should generate the same cache key
    And only one entry should be stored in the cache
    And all variants should benefit from the same cached result
    And query normalization should handle:
      | normalization_type | description                    |
      | case_insensitive  | Convert keywords to lowercase  |
      | whitespace_normal | Normalize spacing and newlines |
      | bracket_spacing   | Consistent spacing around {}() |

  @cache-ttl @expiration-handling @temporal-consistency
  Scenario: Handle cache entry expiration correctly
    Given I have cached a query result with TTL of 100ms
    When I wait for 50ms and query again
    Then the cached result should still be valid
    And cache hit should be recorded
    When I wait for another 60ms and query again
    Then the cached result should have expired
    And a cache miss should be recorded
    And fresh data should be fetched and cached
    And cleanup should remove the expired entry

  @cache-size-management @lru-eviction @memory-management
  Scenario: Manage cache size and evict old entries
    Given the cache is configured with maxSize of 10
    When I execute 15 different queries sequentially
    Then only 10 entries should remain in the cache
    And the oldest 5 entries should be evicted
    And eviction statistics should show 5 evictions
    And the most recently accessed entries should be retained
    When I access one of the older cached entries
    Then it should be promoted and less likely to be evicted

  @performance-monitoring @metrics-collection @system-health
  Scenario: Monitor cache performance and system metrics
    Given I have executed various queries with different cache behaviors
    When I request cache performance metrics
    Then I should see comprehensive statistics:
      | metric_category  | specific_metrics                           |
      | hit_rates       | Overall hit rate, recent hit rate          |
      | response_times  | Cached vs uncached response times          |
      | memory_usage    | Cache size, memory consumption             |
      | eviction_stats  | Eviction count, eviction reasons           |
      | query_patterns  | Most/least cached queries                  |
    And performance trends should be trackable over time
    And alerts should be generated for performance degradation

  @large-dataset-performance @scalability @big-data
  Scenario: Handle large datasets efficiently
    Given I have a knowledge base with:
      | data_size        | quantity |
      | total_assets     | 50000    |
      | total_triples    | 500000   |
      | relationships    | 100000   |
      | complex_queries  | 100      |
    When I perform various operations:
      | operation_type     | expected_performance      |
      | simple_queries     | < 100ms                   |
      | complex_queries    | < 1000ms                  |
      | graph_traversals   | < 2000ms                  |
      | bulk_operations    | < 10000ms for 1000 items  |
    Then all performance targets should be met
    And memory usage should remain bounded under 500MB
    And the system should remain responsive during operations

  @concurrent-access @thread-safety @parallel-processing
  Scenario: Handle concurrent cache access safely
    Given multiple threads are accessing the cache simultaneously
    When 10 threads execute different queries concurrently
    And 5 threads access the same cached query
    Then all cache operations should be thread-safe
    And no race conditions should occur
    And cache consistency should be maintained
    And cache statistics should accurately reflect all operations
    And no cache corruption should occur

  @cache-warming @preloading @startup-optimization
  Scenario: Warm cache with frequently accessed data
    Given the system has identified frequently accessed queries from usage patterns
    When the plugin starts up
    Then the cache warming system should:
      | warming_action        | description                              |
      | load_common_queries   | Execute and cache most frequent queries  |
      | precompute_indexes    | Build search indexes for fast lookup    |
      | warm_relationship_cache| Cache relationship data for key assets |
    And cache warming should complete in background
    And user interactions should not be blocked
    And warmed cache should improve initial response times

  @memory-optimization @garbage-collection @resource-management
  Scenario: Optimize memory usage and prevent leaks
    Given the system has been running for an extended period
    When memory optimization is triggered
    Then the system should:
      | optimization_action   | expected_outcome                      |
      | clean_expired_entries | Remove all expired cache entries      |
      | compact_cache        | Optimize cache data structure         |
      | release_unused_refs  | Free references to unused objects     |
      | gc_hint             | Suggest garbage collection if needed  |
    And memory usage should be reduced by at least 20%
    And system performance should be maintained or improved
    And no memory leaks should be present

  @cache-configuration @tuning @adaptive-behavior
  Scenario: Configure cache for different usage patterns
    Given I want to optimize cache for my specific usage pattern
    When I configure cache for different scenarios:
      | usage_pattern     | recommended_config                        |
      | heavy_read       | Large cache size, long TTL                |
      | frequent_updates | Small cache size, short TTL               |
      | mixed_workload   | Medium cache size, adaptive TTL           |
      | memory_constrained| Small cache size, aggressive cleanup      |
    Then the cache should adapt its behavior accordingly
    And performance should be optimized for each pattern
    And configuration validation should prevent invalid settings

  @query-optimization @execution-planning @intelligent-processing
  Scenario: Optimize query execution through intelligent planning
    Given I have queries with different complexity levels
    When the system analyzes query patterns:
      | query_type       | optimization_strategy                    |
      | simple_lookups   | Direct index access                     |
      | complex_joins    | Join order optimization                 |
      | graph_traversal  | Path caching and pruning                |
      | aggregations     | Incremental computation                 |
    Then query execution should be optimized automatically
    And execution plans should be cached for repeated patterns
    And query performance should improve over time through learning

  @index-management @search-optimization @data-structures
  Scenario: Maintain efficient indexes for fast data access
    Given the system maintains various indexes for performance
    When data is modified in the knowledge base
    Then indexes should be updated incrementally:
      | index_type        | update_strategy                         |
      | spo_index        | Immediate update for consistency        |
      | text_search      | Batched updates for efficiency          |
      | relationship_map | Lazy update on next access              |
      | property_values  | Background incremental update           |
    And index consistency should be maintained
    And index corruption should be detected and repaired
    And index rebuilding should be available when needed

  @cache-partitioning @data-locality @distributed-caching
  Scenario: Partition cache data for improved access patterns
    Given I have different types of cached data
    When the cache partitioning system organizes data:
      | partition_type    | data_types                              |
      | query_results    | SPARQL query results                    |
      | entity_data      | Asset and entity information            |
      | relationship_data| Relationship and backlink data          |
      | ui_components    | Rendered UI component cache             |
    Then each partition should have optimized access patterns
    And partitions should have different eviction policies
    And cross-partition operations should be minimized
    And partition-specific optimization should be applied

  @performance-degradation @monitoring @alerting
  Scenario: Detect and respond to performance degradation
    Given the system is monitoring performance continuously
    When performance metrics exceed thresholds:
      | metric                | threshold    | response_action                |
      | average_response_time | > 1000ms     | Increase cache size            |
      | cache_hit_rate       | < 60%        | Adjust TTL and cache strategy  |
      | memory_usage         | > 800MB      | Trigger cache cleanup          |
      | query_failures       | > 5%         | Enable performance logging     |
    Then appropriate automated responses should be triggered
    And performance alerts should be logged
    And system should attempt automatic optimization
    And user should be notified of any persistent issues

  @cache-persistence @restart-recovery @durability
  Scenario: Persist cache across plugin restarts for faster startup
    Given the cache contains valuable frequently-accessed data
    When the plugin shuts down
    Then critical cache data should be persisted to disk:
      | data_type           | persistence_strategy                   |
      | hot_query_results   | Save most frequently accessed          |
      | index_data         | Persist computed indexes               |
      | relationship_cache  | Save relationship mappings             |
      | configuration      | Save optimized cache settings          |
    When the plugin restarts
    Then persisted cache data should be loaded
    And cache should be functional immediately
    And startup time should be reduced by at least 50%
    And data integrity should be verified during loading

  @adaptive-caching @machine-learning @intelligent-optimization
  Scenario: Adapt caching strategy based on usage patterns
    Given the system has collected usage data over time
    When the adaptive caching system analyzes patterns:
      | usage_pattern      | adaptation_strategy                     |
      | daily_peaks       | Pre-cache data before peak times        |
      | query_sequences   | Predict and cache likely next queries   |
      | user_behavior     | Personalize cache priorities            |
      | data_access_freq  | Adjust TTL based on access frequency    |
    Then caching strategy should evolve to match usage
    And predictive caching should improve hit rates
    And system performance should continuously improve
    And adaptation should be transparent to users

  @stress-testing @load-testing @resilience
  Scenario: Maintain performance under high load conditions
    Given the system is under stress testing conditions
    When subjected to high load:
      | load_condition      | test_parameters                        |
      | concurrent_users    | 50 simultaneous operations             |
      | query_volume       | 1000 queries per minute                |
      | data_modification  | 100 updates per minute                 |
      | memory_pressure    | Limited to 200MB available memory      |
    Then the system should maintain acceptable performance:
      | performance_metric  | acceptable_threshold                   |
      | response_time_95th  | < 2000ms                              |
      | cache_hit_rate     | > 70%                                 |
      | error_rate         | < 1%                                  |
      | memory_stability   | No memory leaks or excessive growth    |
    And graceful degradation should occur under extreme load
    And critical functionality should remain available

  @cache-debugging @troubleshooting @diagnostics
  Scenario: Provide debugging tools for cache performance issues
    Given I am experiencing cache-related performance issues
    When I access cache debugging information
    Then I should be able to see:
      | debug_information   | details_provided                       |
      | cache_contents     | Current cached entries with metadata   |
      | hit_miss_patterns  | Detailed hit/miss statistics           |
      | eviction_history   | Recent evictions with reasons          |
      | query_analysis     | Query normalization and key generation |
      | performance_trends | Historical performance data            |
    And debugging should not impact production performance
    And debugging information should help identify optimization opportunities
    And recommendations should be provided for performance improvements