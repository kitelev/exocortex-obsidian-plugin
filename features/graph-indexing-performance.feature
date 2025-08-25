@graph @indexing @performance @optimization
Feature: Graph Indexing and Performance Optimization
  As a system administrator
  I want optimal graph indexing and performance
  So that semantic queries execute efficiently even with large datasets

  Background:
    Given the graph indexing system is initialized
    And the IndexedGraph implementation is being used
    And performance monitoring is enabled
    And the following index types are available:
      | index_type | description                              |
      | SPO        | Subject-Predicate-Object index          |
      | POS        | Predicate-Object-Subject index          |
      | OSP        | Object-Subject-Predicate index          |
      | SPOC       | Subject-Predicate-Object-Context index  |
    And baseline performance metrics are established

  @smoke @basic-indexing
  Scenario: Basic triple indexing functionality
    When I add a triple to an empty indexed graph:
      | subject    | predicate   | object        |
      | exo:Asset1 | rdf:type    | ems:Project   |
    Then the triple should be added to all three primary indexes
    And the SPO index should contain the entry
    And the POS index should contain the entry
    And the OSP index should contain the entry
    And all index entries should be consistent

  @index-construction @batch-operations
  Scenario: Efficient bulk index construction
    Given I have 10000 triples to add to the graph
    When I perform a bulk insert operation using batch mode
    Then the operation should complete within 2 seconds
    And memory usage should not exceed 100MB during indexing
    And all indexes should be fully populated
    And index consistency should be maintained
    And subsequent queries should be fast

  @query-optimization @index-utilization
  Scenario: Optimal index selection for different query patterns
    Given the graph contains 50000 triples with diverse patterns
    When I execute a query with pattern "?subject rdf:type ems:Project"
    Then the query engine should use the POS index
    And the query should complete within 10ms
    And the explain plan should show index usage
    
    When I execute a query with pattern "exo:Asset1 ?predicate ?object"
    Then the query engine should use the SPO index
    And the query should complete within 5ms
    
    When I execute a query with pattern "?subject ?predicate 'high'"
    Then the query engine should use the OSP index
    And the query should complete within 15ms

  @index-maintenance @concurrent-operations
  Scenario: Index maintenance during concurrent operations
    Given the graph contains 100000 triples
    When I perform concurrent operations:
      | operation | count | threads |
      | add       | 1000  | 5       |
      | remove    | 500   | 3       |
      | query     | 2000  | 10      |
    Then all operations should complete successfully
    And no index corruption should occur
    And query results should remain consistent
    And deadlocks should not occur
    And performance should remain acceptable

  @memory-optimization @garbage-collection
  Scenario: Memory-efficient indexing for large graphs
    Given I create a graph with 1 million triples
    When the system is under memory pressure
    Then the indexing system should optimize memory usage
    And unnecessary index entries should be garbage collected
    And memory usage should stabilize below 500MB
    And query performance should remain acceptable
    And the system should not crash or become unresponsive

  @index-persistence @durability
  Scenario: Persist and recover indexes efficiently
    Given I have a large graph with complex indexes
    When I save the graph state to persistent storage
    Then the indexes should be serialized efficiently
    And the save operation should complete within 30 seconds
    When I restart the system and load the graph
    Then the indexes should be restored completely
    And the load operation should complete within 45 seconds
    And all index entries should be identical to the saved state

  @performance-monitoring @metrics
  Scenario: Monitor and report index performance metrics
    Given performance monitoring is active
    When I perform various graph operations over time
    Then the system should collect performance metrics:
      | metric               | expected_range      |
      | index_lookup_time    | < 1ms per lookup    |
      | index_update_time    | < 5ms per update    |
      | memory_usage         | < 1GB for 1M triples|
      | cache_hit_ratio      | > 80%               |
      | query_response_time  | < 50ms average      |
    And metrics should be queryable via API
    And performance trends should be trackable

  @adaptive-indexing @smart-optimization
  Scenario: Adaptive indexing based on query patterns
    Given the system monitors query patterns over time
    When certain query patterns become frequent:
      | pattern_type           | frequency | example_query                    |
      | by_predicate_value     | 60%       | ?s ems:priority "high"          |
      | by_type_and_property   | 30%       | ?s rdf:type ?t; ems:status ?st  |
      | complex_joins          | 10%       | multi-hop relationship queries  |
    Then the indexing system should adapt automatically
    And specialized indexes should be created for frequent patterns
    And query performance should improve over time
    And the adaptation should not negatively impact other operations

  @index-compression @storage-optimization
  Scenario: Index compression for storage efficiency
    Given I have a graph with many repeated patterns
    When index compression is enabled
    Then storage space should be reduced by at least 40%
    And compressed indexes should remain functionally equivalent
    And query performance should not degrade significantly
    And decompression should be transparent to queries
    And compression ratios should be reported

  @distributed-indexing @scalability
  Scenario: Distributed indexing for horizontal scaling
    Given multiple graph nodes are available
    When the graph size exceeds single-node capacity
    Then indexes should be distributed across nodes
    And query routing should be optimized
    And data locality should be considered
    And rebalancing should occur automatically
    And fault tolerance should be maintained

  @index-validation @consistency-checking
  Scenario: Validate index consistency and integrity
    Given the graph has been modified extensively
    When I run index consistency validation
    Then all indexes should be internally consistent
    And cross-index consistency should be verified
    And any inconsistencies should be reported with details
    And automatic repair should be attempted if possible
    And validation should complete within acceptable time

  @cache-management @performance-tuning
  Scenario: Intelligent cache management for hot data
    Given the system tracks data access patterns
    When certain triples are accessed frequently
    Then frequently accessed data should be cached in memory
    And cache eviction should use LRU or similar algorithms
    And cache hit ratios should exceed 85%
    And cache size should be automatically tuned
    And cache performance should be monitored

  @query-planning @execution-optimization
  Scenario: Advanced query planning with cost estimation
    Given the query planner has access to index statistics
    When I execute a complex multi-join query:
      """
      SELECT ?project ?task ?person ?skill WHERE {
        ?project rdf:type ems:Project .
        ?project ems:hasTask ?task .
        ?task ems:assignedTo ?person .
        ?person exo:hasSkill ?skill .
        FILTER(?skill = "Java Programming")
      }
      """
    Then the query planner should:
      | optimization_step      | expected_behavior                    |
      | selectivity_analysis   | estimate result set sizes            |
      | join_order_optimization| choose optimal join sequence         |
      | index_selection        | select most efficient indexes        |
      | filter_pushdown        | apply filters as early as possible   |
      | cost_estimation        | calculate total execution cost        |
    And the execution should follow the optimal plan

  @incremental-indexing @real-time-updates
  Scenario: Incremental index updates for real-time performance
    Given the graph is actively being modified
    When I make incremental changes:
      | operation | count | frequency    |
      | add       | 100   | every second |
      | modify    | 50    | every 2 seconds |
      | remove    | 25    | every 4 seconds |
    Then index updates should be incremental, not full rebuilds
    And real-time query performance should be maintained
    And index update overhead should be minimal
    And batch optimizations should be applied when beneficial

  @index-statistics @query-optimization
  Scenario: Maintain and use index statistics for optimization
    Given the system collects detailed index statistics
    When statistical information is gathered over time:
      | statistic_type        | collected_data                      |
      | predicate_frequency   | how often each predicate is used    |
      | object_cardinality    | unique object count per predicate   |
      | subject_fanout        | average objects per subject         |
      | value_distribution    | distribution of literal values      |
    Then statistics should be used to improve query planning
    And index maintenance should be prioritized based on usage
    And storage allocation should be optimized
    And performance recommendations should be generated

  @backup-recovery @index-durability
  Scenario: Backup and recovery of index structures
    Given I have a fully indexed graph with custom optimizations
    When I create a backup of the entire system
    Then all index structures should be included in the backup
    And custom index configurations should be preserved
    And the backup should be consistent and complete
    When I restore from the backup
    Then all indexes should be restored correctly
    And query performance should match the original system
    And no data or index corruption should occur

  @stress-testing @load-handling
  Scenario: Handle extreme load conditions gracefully
    Given the system is under extreme load conditions:
      | load_type              | intensity      |
      | concurrent_queries     | 1000/second    |
      | bulk_insertions        | 10000/second   |
      | index_updates          | 5000/second    |
      | memory_pressure        | 95% utilization|
    When the system operates under this load for 1 hour
    Then the system should remain stable and responsive
    And no index corruption should occur
    And query response times should degrade gracefully
    And error rates should remain below 1%
    And recovery should be automatic after load reduction

  @index-analytics @performance-insights
  Scenario: Provide analytics on index usage and performance
    Given comprehensive index monitoring is enabled
    When I request index analytics after significant usage
    Then the system should provide detailed reports:
      | report_type           | content                              |
      | index_utilization     | which indexes are used most/least    |
      | query_patterns        | most common query patterns           |
      | performance_hotspots  | slowest operations and bottlenecks   |
      | optimization_suggestions | recommended improvements           |
      | capacity_planning     | projected growth and requirements    |
    And reports should be actionable and specific
    And trends should be visualizable over time

  @integration-testing @end-to-end-performance
  Scenario: End-to-end performance with real-world workloads
    Given I simulate a realistic knowledge management workload:
      | workload_component    | characteristics                      |
      | note_creation         | 1000 notes/hour with semantic links |
      | relationship_queries  | 500 complex queries/hour            |
      | full_text_search     | 200 combined searches/hour          |
      | batch_imports         | 10000 triples/hour from external sources |
      | ontology_updates      | schema changes every few hours      |
    When the system runs this workload for 24 hours
    Then overall system performance should meet SLA requirements:
      | metric                | target          |
      | average_query_time    | < 100ms         |
      | 95th_percentile      | < 500ms         |
      | throughput           | > 1000 ops/sec  |
      | availability         | > 99.9%         |
      | data_consistency     | 100%            |
    And the system should handle the workload sustainably