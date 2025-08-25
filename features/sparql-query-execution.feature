@sparql @semantic @query-execution
Feature: SPARQL Query Execution Engine
  As a semantic web developer
  I want to execute SPARQL queries against the RDF knowledge graph
  So that I can retrieve, filter, and transform semantic data efficiently

  Background:
    Given the SPARQL query engine is initialized
    And the RDF graph contains the following test data:
      | subject         | predicate        | object                    |
      | exo:Project1    | rdf:type         | ems:Project              |
      | exo:Project1    | rdfs:label       | "Web Application"        |
      | exo:Project1    | ems:priority     | "high"                   |
      | exo:Project1    | ems:hasTask      | exo:Task1                |
      | exo:Project1    | ems:hasTask      | exo:Task2                |
      | exo:Project1    | exo:createdAt    | "2025-01-01T00:00:00Z"^^xsd:dateTime |
      | exo:Task1       | rdf:type         | ems:Task                 |
      | exo:Task1       | rdfs:label       | "Frontend Development"   |
      | exo:Task1       | ems:status       | "active"                 |
      | exo:Task1       | ems:assignee     | exo:Person1              |
      | exo:Task1       | ems:estimatedHours | 40^^xsd:integer        |
      | exo:Task2       | rdf:type         | ems:Task                 |
      | exo:Task2       | rdfs:label       | "Backend Development"    |
      | exo:Task2       | ems:status       | "completed"              |
      | exo:Task2       | ems:assignee     | exo:Person2              |
      | exo:Task2       | ems:estimatedHours | 60^^xsd:integer        |
      | exo:Person1     | rdf:type         | exo:Person               |
      | exo:Person1     | rdfs:label       | "Alice Developer"        |
      | exo:Person1     | exo:email        | "alice@example.com"      |
      | exo:Person2     | rdf:type         | exo:Person               |
      | exo:Person2     | rdfs:label       | "Bob Developer"          |
      | exo:Person2     | exo:email        | "bob@example.com"        |
    And the namespace prefixes are configured:
      | prefix | namespace                                   |
      | exo    | https://exocortex.io/ontology/core#         |
      | ems    | https://exocortex.io/ontology/ems#          |
      | rdf    | http://www.w3.org/1999/02/22-rdf-syntax-ns# |
      | rdfs   | http://www.w3.org/2000/01/rdf-schema#       |
      | xsd    | http://www.w3.org/2001/XMLSchema#           |

  @smoke @select-queries
  Scenario: Execute basic SELECT query
    When I execute the SPARQL query:
      """
      SELECT ?project ?label WHERE {
        ?project rdf:type ems:Project .
        ?project rdfs:label ?label .
      }
      """
    Then the query should execute successfully
    And the result should contain 1 row
    And the result should have columns: ?project, ?label
    And the result should contain:
      | ?project     | ?label            |
      | exo:Project1 | "Web Application" |
    And the execution time should be under 50ms

  @select-queries @filters
  Scenario: SELECT query with FILTER conditions
    When I execute the SPARQL query:
      """
      SELECT ?task ?label ?hours WHERE {
        ?task rdf:type ems:Task .
        ?task rdfs:label ?label .
        ?task ems:estimatedHours ?hours .
        FILTER(?hours > 50)
      }
      """
    Then the query should execute successfully
    And the result should contain 1 row
    And the result should contain:
      | ?task     | ?label                | ?hours |
      | exo:Task2 | "Backend Development" | 60     |

  @select-queries @optional-patterns
  Scenario: SELECT query with OPTIONAL patterns
    When I execute the SPARQL query:
      """
      SELECT ?project ?label ?priority ?task WHERE {
        ?project rdf:type ems:Project .
        ?project rdfs:label ?label .
        OPTIONAL { ?project ems:priority ?priority }
        OPTIONAL { ?project ems:hasTask ?task }
      }
      """
    Then the query should execute successfully
    And the result should contain multiple rows with optional bindings
    And some results should have ?priority bound
    And some results should have ?task bound

  @select-queries @joins @complex-patterns
  Scenario: Complex SELECT query with multiple joins
    When I execute the SPARQL query:
      """
      SELECT ?project ?projectLabel ?task ?taskLabel ?person ?personLabel WHERE {
        ?project rdf:type ems:Project .
        ?project rdfs:label ?projectLabel .
        ?project ems:hasTask ?task .
        ?task rdfs:label ?taskLabel .
        ?task ems:assignee ?person .
        ?person rdfs:label ?personLabel .
      }
      """
    Then the query should execute successfully
    And the result should contain 2 rows
    And the result should contain:
      | ?project     | ?projectLabel     | ?task     | ?taskLabel            | ?person     | ?personLabel      |
      | exo:Project1 | "Web Application" | exo:Task1 | "Frontend Development"| exo:Person1 | "Alice Developer" |
      | exo:Project1 | "Web Application" | exo:Task2 | "Backend Development" | exo:Person2 | "Bob Developer"   |

  @construct-queries @graph-transformation
  Scenario: CONSTRUCT query for creating new graph
    When I execute the SPARQL query:
      """
      CONSTRUCT {
        ?project ems:workedOnBy ?person .
        ?person ems:worksOn ?project .
      } WHERE {
        ?project ems:hasTask ?task .
        ?task ems:assignee ?person .
      }
      """
    Then the query should execute successfully
    And the result should be an RDF graph
    And the constructed graph should contain 4 triples
    And the constructed graph should contain:
      | subject      | predicate        | object       |
      | exo:Project1 | ems:workedOnBy   | exo:Person1  |
      | exo:Project1 | ems:workedOnBy   | exo:Person2  |
      | exo:Person1  | ems:worksOn      | exo:Project1 |
      | exo:Person2  | ems:worksOn      | exo:Project1 |

  @ask-queries @boolean-results
  Scenario: ASK query for existence checking
    When I execute the SPARQL query:
      """
      ASK {
        exo:Project1 ems:priority "high" .
      }
      """
    Then the query should execute successfully
    And the result should be true

    When I execute the SPARQL query:
      """
      ASK {
        exo:Project1 ems:priority "low" .
      }
      """
    Then the query should execute successfully
    And the result should be false

  @describe-queries @resource-description
  Scenario: DESCRIBE query for resource exploration
    When I execute the SPARQL query:
      """
      DESCRIBE exo:Project1
      """
    Then the query should execute successfully
    And the result should be an RDF graph
    And the described graph should contain all triples with exo:Project1 as subject
    And the described graph should contain at least 6 triples

  @aggregation @group-by
  Scenario: Aggregation queries with GROUP BY
    When I execute the SPARQL query:
      """
      SELECT ?project (COUNT(?task) as ?taskCount) (SUM(?hours) as ?totalHours) WHERE {
        ?project ems:hasTask ?task .
        ?task ems:estimatedHours ?hours .
      } GROUP BY ?project
      """
    Then the query should execute successfully
    And the result should contain 1 row
    And the result should contain:
      | ?project     | ?taskCount | ?totalHours |
      | exo:Project1 | 2          | 100         |

  @order-by @sorting
  Scenario: Query results with ORDER BY
    When I execute the SPARQL query:
      """
      SELECT ?task ?hours WHERE {
        ?task ems:estimatedHours ?hours .
      } ORDER BY DESC(?hours)
      """
    Then the query should execute successfully
    And the result should be ordered by hours in descending order
    And the first result should be exo:Task2 with 60 hours
    And the second result should be exo:Task1 with 40 hours

  @limit-offset @pagination
  Scenario: Query pagination with LIMIT and OFFSET
    When I execute the SPARQL query:
      """
      SELECT ?resource ?type WHERE {
        ?resource rdf:type ?type .
      } ORDER BY ?resource LIMIT 3 OFFSET 1
      """
    Then the query should execute successfully
    And the result should contain exactly 3 rows
    And the result should skip the first resource
    And the pagination should work correctly

  @distinct @duplicate-elimination
  Scenario: DISTINCT modifier for duplicate elimination
    When I execute the SPARQL query:
      """
      SELECT DISTINCT ?type WHERE {
        ?resource rdf:type ?type .
      }
      """
    Then the query should execute successfully
    And the result should not contain duplicates
    And each type should appear only once

  @union @alternative-patterns
  Scenario: UNION for alternative graph patterns
    When I execute the SPARQL query:
      """
      SELECT ?resource ?identifier WHERE {
        {
          ?resource exo:email ?identifier .
        } UNION {
          ?resource rdfs:label ?identifier .
        }
      }
      """
    Then the query should execute successfully
    And the result should contain resources with either email or label
    And the result should contain at least 6 rows

  @regex @string-matching
  Scenario: Regular expression filtering with REGEX
    When I execute the SPARQL query:
      """
      SELECT ?task ?label WHERE {
        ?task rdfs:label ?label .
        FILTER REGEX(?label, "Development", "i")
      }
      """
    Then the query should execute successfully
    And the result should contain both tasks with "Development" in label
    And the regex should be case-insensitive

  @datatype-functions @literal-operations
  Scenario: Built-in functions for literal manipulation
    When I execute the SPARQL query:
      """
      SELECT ?task ?label ?upperLabel ?labelLength WHERE {
        ?task rdfs:label ?label .
        BIND(UCASE(?label) as ?upperLabel)
        BIND(STRLEN(?label) as ?labelLength)
      }
      """
    Then the query should execute successfully
    And the result should contain uppercase versions of labels
    And the result should contain string lengths
    And built-in functions should work correctly

  @performance @large-dataset
  Scenario: Query performance on large dataset
    Given the graph contains 10000 additional triples
    When I execute a complex query with multiple joins:
      """
      SELECT ?project ?task ?person WHERE {
        ?project rdf:type ems:Project .
        ?project ems:hasTask ?task .
        ?task ems:assignee ?person .
        ?person rdf:type exo:Person .
      }
      """
    Then the query should complete within 200ms
    And the result should be accurate
    And memory usage should remain stable

  @concurrent-queries @scalability
  Scenario: Concurrent query execution
    When I execute 10 simultaneous SELECT queries
    And each query is of moderate complexity
    Then all queries should complete successfully
    And the total execution time should not exceed 500ms
    And no query interference should occur
    And results should be accurate for all queries

  @error-handling @syntax-errors
  Scenario: Handle SPARQL syntax errors gracefully
    When I execute an invalid SPARQL query:
      """
      SELECTT ?invalid WHERE {
        ?subject INVALID_SYNTAX ?object
      """
    Then the query execution should fail
    And the error should indicate "Syntax error"
    And the error should include position information
    And no partial results should be returned
    And the system should remain stable

  @error-handling @undefined-prefixes
  Scenario: Handle undefined namespace prefixes
    When I execute a SPARQL query with undefined prefix:
      """
      SELECT ?resource WHERE {
        ?resource undefined:property ?value .
      }
      """
    Then the query execution should fail
    And the error should indicate "Undefined prefix: undefined"
    And no results should be returned

  @security @query-validation
  Scenario: Query security validation
    When I execute a SPARQL query containing potential injection:
      """
      SELECT ?resource WHERE {
        ?resource rdfs:label "'; DROP GRAPH; --" .
      }
      """
    Then the query should be safely executed as a literal search
    And no graph modification should occur
    And the literal should be properly escaped
    And a security audit log should be created

  @timeout-handling @resilience
  Scenario: Query timeout management
    Given the query timeout is set to 2 seconds
    When I execute a deliberately slow query
    Then the query should be terminated after 2 seconds
    And a timeout error should be returned
    And the system should remain responsive
    And no resources should be leaked

  @caching @performance-optimization
  Scenario: Query result caching
    Given query caching is enabled
    When I execute a complex query for the first time
    Then the query result should be cached
    And the execution time should be recorded
    When I execute the same query again
    Then the result should come from cache
    And the cache retrieval should be under 5ms
    And the result should be identical

  @explain-plan @query-optimization
  Scenario: Query execution plan analysis
    When I execute a complex query with explain option:
      """
      EXPLAIN
      SELECT ?project ?task ?person WHERE {
        ?project ems:hasTask ?task .
        ?task ems:assignee ?person .
        ?person rdf:type exo:Person .
      }
      """
    Then the explain plan should be returned
    And the plan should show join order
    And estimated costs should be included
    And index usage should be indicated
    And optimization recommendations should be provided

  @federated-queries @distributed-data
  Scenario: Federated query execution (if supported)
    Given multiple knowledge graphs are available
    When I execute a federated SPARQL query:
      """
      SELECT ?project ?externalInfo WHERE {
        ?project rdf:type ems:Project .
        SERVICE <http://external-endpoint/sparql> {
          ?project ext:additionalInfo ?externalInfo .
        }
      }
      """
    Then the federated query should execute
    And local and remote data should be combined
    And the result should contain merged information

  @update-operations @graph-modification
  Scenario: SPARQL UPDATE operations
    When I execute a SPARQL INSERT operation:
      """
      INSERT DATA {
        exo:Project2 rdf:type ems:Project .
        exo:Project2 rdfs:label "New Project" .
      }
      """
    Then the insert should succeed
    And the graph should contain the new triples
    And I should be able to query the new data

    When I execute a SPARQL DELETE operation:
      """
      DELETE DATA {
        exo:Project2 rdfs:label "New Project" .
      }
      """
    Then the delete should succeed
    And the specified triple should be removed
    And other triples should remain unchanged

  @transaction-support @acid-compliance
  Scenario: Transactional query operations
    Given transaction support is enabled
    When I begin a transaction
    And I execute multiple update operations
    And one operation fails
    Then the entire transaction should be rolled back
    And the graph should return to the original state
    And no partial changes should be visible

  @custom-functions @extensibility
  Scenario: Custom SPARQL functions
    Given custom functions are registered
    When I execute a query using custom function:
      """
      SELECT ?task ?priority WHERE {
        ?task rdf:type ems:Task .
        BIND(exo:calculatePriority(?task) as ?priority)
      }
      """
    Then the custom function should be executed
    And the result should contain calculated values
    And the function should access graph data correctly

  @streaming-results @memory-efficiency
  Scenario: Streaming query results for large result sets
    Given the query will return 50000 results
    When I execute a large SELECT query with streaming enabled
    Then results should be streamed progressively
    And memory usage should remain constant
    And I should be able to process results incrementally
    And the stream should handle backpressure correctly