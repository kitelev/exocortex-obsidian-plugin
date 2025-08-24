@query-execution @semantic-operations
Feature: Query Execution Engine
  As a knowledge worker
  I want to execute semantic queries against my knowledge graph
  So that I can discover insights and relationships in my data

  Background:
    Given the semantic graph is initialized
    And the query engine is available
    And the following test data exists:
      | subject       | predicate        | object          |
      | :Project1     | rdf:type         | ems:Project     |
      | :Project1     | ems:hasTask      | :Task1          |
      | :Project1     | ems:priority     | "high"          |
      | :Task1        | rdf:type         | ems:Task        |
      | :Task1        | ems:status       | "active"        |
      | :Task1        | ems:assignedTo   | :Person1        |

  @smoke @basic-queries
  Scenario: Execute basic SELECT query
    When I execute the following SPARQL query:
      """
      SELECT ?project ?priority WHERE {
        ?project rdf:type ems:Project .
        ?project ems:priority ?priority .
      }
      """
    Then the query should execute successfully
    And the results should contain:
      | ?project  | ?priority |
      | :Project1 | "high"    |
    And the query execution time should be under 100ms

  @performance @complex-queries
  Scenario: Execute complex query with joins and filters
    When I execute the following SPARQL query:
      """
      SELECT ?project ?task ?person WHERE {
        ?project rdf:type ems:Project .
        ?project ems:hasTask ?task .
        ?task ems:assignedTo ?person .
        ?task ems:status "active" .
        FILTER(?project = :Project1)
      }
      """
    Then the query should execute successfully
    And the results should contain:
      | ?project  | ?task | ?person  |
      | :Project1 | :Task1| :Person1 |
    And the query execution time should be under 200ms

  @construct-queries @graph-transformation
  Scenario: Execute CONSTRUCT query for graph transformation
    When I execute the following SPARQL query:
      """
      CONSTRUCT {
        ?project ems:relatedTo ?person
      } WHERE {
        ?project ems:hasTask ?task .
        ?task ems:assignedTo ?person .
      }
      """
    Then the query should execute successfully
    And the constructed triples should contain:
      | subject   | predicate     | object    |
      | :Project1 | ems:relatedTo | :Person1  |

  @ask-queries @boolean-results
  Scenario: Execute ASK query for existence checks
    When I execute the following SPARQL query:
      """
      ASK {
        :Project1 ems:priority "high" .
      }
      """
    Then the query should execute successfully
    And the result should be true

    When I execute the following SPARQL query:
      """
      ASK {
        :Project1 ems:priority "low" .
      }
      """
    Then the query should execute successfully
    And the result should be false

  @caching @performance-optimization
  Scenario: Query result caching
    Given the query cache is enabled
    When I execute a complex query for the first time
    Then the query should be executed and cached
    And the execution time should be recorded
    When I execute the same query again
    Then the result should come from cache
    And the cache retrieval should be under 10ms
    And the cache hit rate should be 100%

  @error-handling @query-validation
  Scenario: Handling malformed SPARQL queries
    When I execute an invalid SPARQL query:
      """
      SELECT ?invalid WHERE {
        ?subject INVALID_SYNTAX ?object
      """
    Then the query execution should fail gracefully
    And the error message should indicate syntax error
    And the error should include line number information
    And no partial results should be returned

  @security @injection-protection
  Scenario: Protection against query injection
    When I execute a potentially malicious query containing:
      """
      SELECT * WHERE {
        ?s ?p ?o .
      } DELETE {
        ?s ?p ?o .
      } WHERE {
        ?s ?p ?o .
      }
      """
    Then the query should be sanitized
    And only the SELECT portion should be executed
    And no data modification should occur
    And a security warning should be logged

  @pagination @large-results
  Scenario: Handling large result sets with pagination
    Given the graph contains 1000 projects
    When I execute a query that returns all projects
    And I request pagination with 50 results per page
    Then the first page should contain 50 results
    And pagination metadata should be included
    When I request the next page
    Then the next 50 results should be returned
    And the total count should be 1000

  @timeout-handling @resilience
  Scenario: Query timeout handling
    Given the query timeout is set to 5 seconds
    When I execute a very complex query that takes longer than 5 seconds
    Then the query should be terminated after 5 seconds
    And a timeout error should be returned
    And the system should remain responsive
    And no memory leaks should occur

  @concurrent-queries @scalability
  Scenario: Concurrent query execution
    Given multiple queries are executed simultaneously
    When I start 10 concurrent SELECT queries
    Then all queries should execute without interference
    And the total execution time should not exceed 2x single query time
    And no deadlocks should occur
    And the results should be accurate for all queries

  @explain-plan @query-optimization
  Scenario: Query execution plan analysis
    When I execute a complex query with EXPLAIN option
    Then the query plan should be returned
    And the plan should show execution steps
    And performance statistics should be included
    And optimization recommendations should be provided