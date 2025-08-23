Feature: SPARQL Query Execution
  As a knowledge worker
  I want to execute SPARQL queries
  So that I can discover relationships in my knowledge graph

  Background:
    Given the RDF triple store is initialized
    And the following triples exist:
      | subject | predicate | object |
      | :Alice | :knows | :Bob |
      | :Bob | :knows | :Charlie |
      | :Alice | :worksAt | :Acme |

  Scenario: Execute SELECT query
    When I execute the SPARQL query:
      """
      SELECT ?person WHERE {
        ?person :knows :Bob
      }
      """
    Then the query should return results within 100ms
    And the results should contain:
      | person |
      | :Alice |

  Scenario: Execute CONSTRUCT query
    When I execute the SPARQL query:
      """
      CONSTRUCT { ?s :connected ?o }
      WHERE { ?s :knows ?o }
      """
    Then the query should return triples:
      | subject | predicate | object |
      | :Alice | :connected | :Bob |
      | :Bob | :connected | :Charlie |

  Scenario: Execute ASK query
    When I execute the SPARQL query:
      """
      ASK { :Alice :knows :Bob }
      """
    Then the query should return true

  Scenario: Query result caching
    Given I execute a complex SPARQL query
    When I execute the same query again
    Then the second query should use cached results
    And the cache hit rate should be above 90%