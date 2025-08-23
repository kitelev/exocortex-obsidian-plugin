@sparql @commands
Feature: SPARQL Command Operations
  As a semantic data user
  I want to execute SPARQL commands
  So that I can query and analyze my knowledge base

  Background:
    Given the RDF triple store is initialized
    And SPARQL engine is configured

  @smoke @sparql
  Scenario: Execute SELECT query in code block
    Given I create a SPARQL code block:
      """sparql
      PREFIX : <http://example.org/>
      SELECT ?title ?status
      WHERE {
        ?project a :Project ;
                 :title ?title ;
                 :status ?status .
      }
      ORDER BY ?title
      """
    When the code block is rendered
    Then results should display in a table
    And columns should be "title" and "status"
    And results should be sorted alphabetically

  @sparql
  Scenario: CONSTRUCT query for graph building
    Given I execute a CONSTRUCT query:
      """sparql
      CONSTRUCT {
        ?task :belongsToActive ?project
      }
      WHERE {
        ?task a :Task ;
              :belongsTo ?project .
        ?project :status "active" .
      }
      """
    When the query executes
    Then new triples should be created
    And the graph should contain the constructed relationships

  @sparql
  Scenario: ASK query for existence checking
    Given I execute an ASK query:
      """sparql
      ASK {
        ?project a :Project ;
                 :status "completed" .
      }
      """
    When the query executes
    Then it should return a boolean result
    And display "true" or "false" in the output

  @sparql
  Scenario: DESCRIBE query for resource details
    Given I execute a DESCRIBE query:
      """sparql
      DESCRIBE <http://example.org/Project1>
      """
    When the query executes
    Then all triples about Project1 should be returned
    And display in a readable format

  @sparql @validation
  Scenario: Query validation and error handling
    Given I write an invalid SPARQL query:
      """sparql
      SELECT ?x WHERE { 
        ?x :hasProperty 
      }
      """
    When the query is executed
    Then a validation error should be shown
    And the error should indicate "Incomplete triple pattern"
    And suggest corrections

  @sparql @autocomplete
  Scenario: SPARQL autocomplete assistance
    Given I am typing a SPARQL query
    When I type "SEL" and trigger autocomplete
    Then suggestions should include:
      | suggestion | description |
      | SELECT | Select query variables |
      | SELECT DISTINCT | Select unique results |
      | SELECT * | Select all variables |
    When I select "SELECT"
    Then it should be inserted correctly

  @sparql @templates
  Scenario: Query templates with parameters
    Given I have a query template:
      """sparql
      SELECT ?task ?title
      WHERE {
        ?task :belongsTo <${PROJECT}> ;
              :title ?title ;
              :status "${STATUS}" .
      }
      """
    When I provide parameters:
      | parameter | value |
      | PROJECT | http://example.org/Project1 |
      | STATUS | in_progress |
    Then the query should execute with substituted values
    And return filtered results

  @sparql @performance
  Scenario: Query timeout protection
    Given query timeout is set to 5 seconds
    When I execute a complex query taking >5 seconds
    Then the query should be terminated
    And show timeout error message
    And suggest query optimization

  @sparql @export
  Scenario: Export query results
    Given I have query results displayed
    When I click export results
    Then I can choose format:
      | format | description |
      | CSV | Comma-separated values |
      | JSON | JSON array |
      | TSV | Tab-separated values |
      | Markdown | Markdown table |
    And download the formatted results

  @sparql @history
  Scenario: Query history and favorites
    Given I have executed multiple queries
    When I open query history
    Then I should see recent queries
    And be able to:
      | action | description |
      | Re-run | Execute again |
      | Edit | Modify and run |
      | Save | Add to favorites |
      | Delete | Remove from history |