@cache @performance
Feature: Cache Management System
  As a performance-conscious user
  I want efficient caching of queries and data
  So that my knowledge base remains responsive

  Background:
    Given the cache management system is initialized
    And cache configuration is set to default values

  @smoke @cache
  Scenario: SPARQL query result caching
    Given I execute a SPARQL query:
      """
      SELECT ?s ?p ?o 
      WHERE { ?s ?p ?o } 
      LIMIT 100
      """
    When I execute the same query again within TTL
    Then the result should be served from cache
    And response time should be <5ms
    And cache hit counter should increment

  @cache
  Scenario: Cache TTL expiration
    Given a cached query with TTL of 60 seconds
    When 61 seconds have passed
    And I execute the query again
    Then the cache entry should be expired
    And a fresh query should be executed
    And the new result should be cached

  @cache @statistics
  Scenario: View cache statistics
    Given I have been using the plugin for a session
    When I view SPARQL cache statistics
    Then I should see:
      | metric | description |
      | Total queries | Number of unique queries |
      | Cache hits | Queries served from cache |
      | Cache misses | Queries requiring execution |
      | Hit rate | Percentage of cache hits |
      | Memory usage | Current cache size in MB |
      | Avg response time | Cached vs fresh comparison |

  @cache
  Scenario: Clear cache manually
    Given the cache contains 50 entries
    When I execute the clear cache command
    Then all cache entries should be removed
    And memory should be freed
    And statistics should reset
    And a confirmation message should appear

  @cache @memory
  Scenario: Cache size limits
    Given cache max size is set to 10MB
    When cache approaches the limit
    Then LRU eviction should occur
    And least recently used entries removed
    And cache size should stay within limits
    And performance should not degrade

  @cache @invalidation
  Scenario: Intelligent cache invalidation
    Given cached queries about "Project A"
    When "Project A" data is modified
    Then related cache entries should be invalidated
    And unrelated entries should remain cached
    And invalidation should cascade to dependent queries

  @cache @persistence
  Scenario: Cache persistence across sessions
    Given I have cached data from previous session
    When I restart Obsidian
    Then persistent cache entries should be available
    And volatile entries should be cleared
    And cache should be validated on load

  @cache @performance
  Scenario: Cache warming on startup
    Given frequently used queries are identified
    When the plugin starts
    Then high-priority queries should be pre-cached
    And warming should happen in background
    And not block plugin initialization

  @cache @configuration
  Scenario: Configure cache behavior
    When I adjust cache settings:
      | setting | value |
      | TTL | 300 seconds |
      | Max size | 20MB |
      | Persistence | Enabled |
      | Warming | Disabled |
    Then cache behavior should update immediately
    And existing cache should be preserved
    And new settings should persist

  @cache @monitoring
  Scenario: Cache performance monitoring
    Given cache monitoring is enabled
    When analyzing cache performance
    Then metrics should include:
      | metric | threshold |
      | Hit rate | >80% expected |
      | Avg save time | Track per query |
      | Memory efficiency | Bytes per entry |
      | Eviction rate | Monitor thrashing |
    And alerts for poor performance