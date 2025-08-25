@rdf @semantic @triple-management
Feature: RDF Triple Management
  As a semantic web developer
  I want to manage RDF triples in the knowledge graph
  So that I can build and maintain structured semantic data

  Background:
    Given the RDF graph is initialized
    And the triple store is empty
    And the namespace manager is configured with standard prefixes:
      | prefix | namespace                                   |
      | rdf    | http://www.w3.org/1999/02/22-rdf-syntax-ns# |
      | rdfs   | http://www.w3.org/2000/01/rdf-schema#       |
      | owl    | http://www.w3.org/2002/07/owl#              |
      | xsd    | http://www.w3.org/2001/XMLSchema#           |
      | exo    | https://exocortex.io/ontology/core#         |
      | ems    | https://exocortex.io/ontology/ems#          |

  @smoke @basic-operations
  Scenario: Add a simple RDF triple
    When I add the triple:
      | subject     | predicate | object        |
      | exo:Asset1  | rdf:type  | ems:Project   |
    Then the triple should be added successfully
    And the graph should contain 1 triple
    And the triple should exist in the graph
    And the SPO index should be updated correctly
    And the POS index should be updated correctly
    And the OSP index should be updated correctly

  @basic-operations @multiple-triples
  Scenario: Add multiple related triples
    When I add the following triples:
      | subject     | predicate      | object        |
      | exo:Asset1  | rdf:type       | ems:Project   |
      | exo:Asset1  | rdfs:label     | "My Project"  |
      | exo:Asset1  | ems:priority   | "high"        |
      | exo:Asset1  | ems:status     | "active"      |
      | exo:Asset1  | exo:createdAt  | "2025-01-15T10:00:00Z"^^xsd:dateTime |
    Then all triples should be added successfully
    And the graph should contain 5 triples
    And each triple should be indexed properly
    And I should be able to query by subject "exo:Asset1"
    And I should be able to query by predicate "rdf:type"
    And I should be able to query by object "ems:Project"

  @triple-removal @graph-modification
  Scenario: Remove specific triples
    Given the graph contains the following triples:
      | subject     | predicate      | object        |
      | exo:Asset1  | rdf:type       | ems:Project   |
      | exo:Asset1  | rdfs:label     | "My Project"  |
      | exo:Asset1  | ems:priority   | "high"        |
    When I remove the triple:
      | subject     | predicate   | object      |
      | exo:Asset1  | ems:priority| "high"      |
    Then the triple should be removed successfully
    And the graph should contain 2 triples
    And the removed triple should not exist in the graph
    And the remaining triples should still exist
    And all indexes should be updated correctly

  @validation @error-handling
  Scenario: Add invalid triple with malformed IRI
    When I attempt to add a triple with invalid IRI:
      | subject          | predicate | object        |
      | invalid-iri-here | rdf:type  | ems:Project   |
    Then the triple addition should fail
    And an error should be returned indicating "Invalid IRI"
    And the graph should remain unchanged
    And no indexes should be updated

  @validation @literal-types
  Scenario: Add triples with different literal types
    When I add triples with various literal types:
      | subject     | predicate      | object                    |
      | exo:Asset1  | rdfs:label     | "String Literal"          |
      | exo:Asset1  | ems:priority   | 5^^xsd:integer            |
      | exo:Asset1  | ems:complete   | true^^xsd:boolean         |
      | exo:Asset1  | ems:progress   | 85.5^^xsd:double          |
      | exo:Asset1  | exo:createdAt  | "2025-01-15T10:00:00Z"^^xsd:dateTime |
      | exo:Asset1  | rdfs:comment   | "Project description"@en  |
    Then all typed literals should be added correctly
    And literal datatypes should be preserved
    And language tags should be preserved
    And I should be able to query by literal type
    And literal validation should pass

  @blank-nodes @anonymous-resources
  Scenario: Work with blank nodes
    When I add triples containing blank nodes:
      | subject   | predicate    | object      |
      | exo:Asset1| ems:hasTask  | _:task1     |
      | _:task1   | rdf:type     | ems:Task    |
      | _:task1   | rdfs:label   | "Task 1"    |
      | _:task1   | ems:assignee | _:person1   |
      | _:person1 | rdf:type     | exo:Person  |
    Then all triples with blank nodes should be added
    And blank node identifiers should be consistent
    And I should be able to query using blank nodes
    And blank nodes should be indexed correctly

  @performance @batch-operations
  Scenario: Batch add large number of triples
    Given I have 1000 triples to add
    When I perform a batch addition of all triples
    Then all triples should be added efficiently
    And the operation should complete within 500ms
    And memory usage should remain stable
    And all indexes should be properly updated
    And I should be able to query any triple immediately

  @performance @concurrent-operations
  Scenario: Concurrent triple operations
    Given multiple operations are happening simultaneously
    When I perform 10 concurrent triple additions
    And I perform 5 concurrent triple removals
    And I perform 15 concurrent triple queries
    Then all operations should complete successfully
    And no data corruption should occur
    And the final graph state should be consistent
    And no deadlocks should occur

  @graph-patterns @complex-queries
  Scenario: Query triples using graph patterns
    Given the graph contains a complex structure:
      | subject     | predicate      | object        |
      | exo:Project1| rdf:type       | ems:Project   |
      | exo:Project1| ems:hasTask    | exo:Task1     |
      | exo:Project1| ems:hasTask    | exo:Task2     |
      | exo:Task1   | rdf:type       | ems:Task      |
      | exo:Task1   | ems:assignee   | exo:Person1   |
      | exo:Task2   | rdf:type       | ems:Task      |
      | exo:Task2   | ems:assignee   | exo:Person2   |
    When I query for pattern "?project ems:hasTask ?task"
    Then I should get 2 results
    And the results should contain:
      | ?project    | ?task         |
      | exo:Project1| exo:Task1     |
      | exo:Project1| exo:Task2     |

  @graph-operations @merge-graphs
  Scenario: Merge two RDF graphs
    Given I have a source graph with:
      | subject     | predicate      | object        |
      | exo:Asset1  | rdf:type       | ems:Project   |
      | exo:Asset1  | rdfs:label     | "Project A"   |
    And I have a target graph with:
      | subject     | predicate      | object        |
      | exo:Asset2  | rdf:type       | ems:Task      |
      | exo:Asset2  | rdfs:label     | "Task B"      |
    When I merge the source graph into the target graph
    Then the target graph should contain 4 triples
    And both original structures should be preserved
    And no duplicate triples should exist
    And all indexes should be updated correctly

  @graph-operations @filter-operations
  Scenario: Filter graph by patterns
    Given the graph contains mixed data:
      | subject     | predicate      | object        |
      | exo:Asset1  | rdf:type       | ems:Project   |
      | exo:Asset2  | rdf:type       | ems:Task      |
      | exo:Asset3  | rdf:type       | ems:Project   |
      | exo:Asset1  | rdfs:label     | "Project A"   |
      | exo:Asset2  | rdfs:label     | "Task B"      |
      | exo:Asset3  | rdfs:label     | "Project C"   |
    When I create a filtered graph for projects only
    Then the filtered graph should contain only project-related triples
    And the original graph should remain unchanged
    And the filtered graph should contain 4 triples

  @indexing @performance-optimization
  Scenario: Verify triple indexing efficiency
    Given I have added 10000 random triples
    When I query for triples by subject
    Then the query should use the SPO index
    And the response time should be under 10ms
    When I query for triples by predicate
    Then the query should use the POS index
    And the response time should be under 10ms
    When I query for triples by object
    Then the query should use the OSP index
    And the response time should be under 10ms

  @memory-management @large-datasets
  Scenario: Handle large datasets without memory issues
    Given I add 50000 triples to the graph
    When I perform various operations:
      | operation | count |
      | add       | 1000  |
      | remove    | 500   |
      | query     | 2000  |
    Then memory usage should remain within acceptable limits
    And garbage collection should work effectively
    And the system should remain responsive
    And all operations should complete successfully

  @data-integrity @consistency-checks
  Scenario: Ensure data integrity during operations
    Given the graph contains consistent data
    When I perform a series of modifications:
      | action | subject    | predicate   | object      |
      | add    | exo:Asset1 | rdf:type    | ems:Project |
      | add    | exo:Asset1 | rdfs:label  | "Project A" |
      | remove | exo:Asset1 | rdf:type    | ems:Project |
      | add    | exo:Asset1 | rdf:type    | ems:Task    |
    Then the final state should be consistent
    And all indexes should reflect the current state
    And no orphaned index entries should exist
    And the graph should pass integrity checks

  @serialization @graph-export
  Scenario: Export graph to different RDF formats
    Given the graph contains sample data:
      | subject     | predicate      | object        |
      | exo:Asset1  | rdf:type       | ems:Project   |
      | exo:Asset1  | rdfs:label     | "My Project"  |
    When I export the graph to Turtle format
    Then the export should succeed
    And the output should be valid Turtle syntax
    And all triples should be preserved
    When I export the graph to N-Triples format
    Then the export should succeed
    And the output should be valid N-Triples syntax
    When I export the graph to JSON-LD format
    Then the export should succeed
    And the output should be valid JSON-LD

  @deserialization @graph-import
  Scenario: Import graph from RDF format
    Given I have valid Turtle content:
      """
      @prefix exo: <https://exocortex.io/ontology/core#> .
      @prefix ems: <https://exocortex.io/ontology/ems#> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      
      exo:Asset1 a ems:Project ;
                 rdfs:label "Imported Project" ;
                 ems:priority "high" .
      """
    When I import the content into the graph
    Then the import should succeed
    And the graph should contain 3 new triples
    And the imported data should be queryable
    And namespace prefixes should be registered

  @error-recovery @resilience
  Scenario: Recover from corrupted operations
    Given the graph contains valid data
    When a triple addition operation is interrupted
    And the system detects incomplete operation
    Then the graph should remain in consistent state
    And corrupted entries should be cleaned up
    And subsequent operations should work normally
    And data integrity should be maintained