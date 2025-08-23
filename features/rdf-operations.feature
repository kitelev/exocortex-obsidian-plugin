@rdf
Feature: RDF Data Management
  As a semantic knowledge user
  I want to import and export RDF data
  So that I can integrate with external knowledge systems

  Background:
    Given I have a vault with RDF triple store initialized
    And I have semantic data about projects and tasks

  @smoke @rdf
  Scenario: Export knowledge graph to Turtle format
    Given I have triples in my knowledge base:
      | subject | predicate | object |
      | :Project1 | rdf:type | :Project |
      | :Project1 | :hasTitle | "Website Redesign" |
      | :Task1 | :belongsTo | :Project1 |
    When I export the knowledge graph as Turtle
    Then the export should contain valid Turtle syntax
    And it should include all triples
    And namespace prefixes should be defined

  @rdf
  Scenario: Export to multiple formats
    When I export the knowledge graph
    Then I can choose from formats:
      | format | extension |
      | Turtle | .ttl |
      | RDF/XML | .rdf |
      | N-Triples | .nt |
      | JSON-LD | .jsonld |
    And each format should produce valid output

  @rdf
  Scenario: Import RDF data with merge strategy
    Given I have existing triples:
      | subject | predicate | object |
      | :Project1 | :hasTitle | "Old Title" |
    When I import RDF data containing:
      """
      @prefix : <http://example.org/> .
      :Project1 :hasTitle "New Title" .
      :Project2 :hasTitle "Another Project" .
      """
    And I choose "merge" strategy
    Then the knowledge base should contain:
      | subject | predicate | object |
      | :Project1 | :hasTitle | "New Title" |
      | :Project2 | :hasTitle | "Another Project" |

  @rdf
  Scenario: Import RDF data with replace strategy
    Given I have existing triples:
      | subject | predicate | object |
      | :OldProject | :hasTitle | "Old Project" |
    When I import RDF data with "replace" strategy
    Then only the imported data should exist
    And old triples should be removed

  @rdf
  Scenario: Validate RDF data before import
    When I attempt to import invalid RDF:
      """
      This is not valid RDF
      <invalid> syntax here
      """
    Then the import should fail with validation error
    And the error message should indicate the problem
    And no data should be imported

  @rdf
  Scenario: Handle large RDF imports efficiently
    When I import an RDF file with 10000 triples
    Then the import should use batch processing
    And memory usage should stay below 100MB
    And progress should be shown to the user
    And import should complete within 10 seconds

  @rdf
  Scenario: Export with custom namespace prefixes
    Given I have configured namespace prefixes:
      | prefix | namespace |
      | ex | http://example.org/ |
      | proj | http://projects.org/ |
    When I export to Turtle format
    Then the output should use my custom prefixes
    And prefixes should be declared in the header

  @rdf
  Scenario: Incremental export of changes
    Given I exported the knowledge graph yesterday
    When I export only changes since last export
    Then the export should contain only:
      | change_type | count |
      | added | 5 |
      | modified | 3 |
      | deleted | 1 |
    And include timestamp metadata