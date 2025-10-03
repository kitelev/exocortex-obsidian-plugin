Feature: Ontology Management
  As a knowledge architect
  I want to manage ontologies in my knowledge base
  So that I can organize domain concepts effectively

  Background:
    Given the Exocortex plugin is loaded

  Scenario: Create internal ontology
    When I create an ontology with:
      | Field       | Value                     |
      | Prefix      | ems                       |
      | Label       | Enterprise Management     |
      | FileName    | !ems.md                   |
      | Namespace   | https://example.com/ems#  |
      | Description | EMS domain ontology       |
    Then the ontology is created successfully
    And the ontology prefix is "ems"
    And the ontology is marked as internal

  Scenario: Create external ontology
    When I create an ontology with:
      | Field    | Value         |
      | Prefix   | custom        |
      | Label    | Custom Domain |
      | FileName | custom.md     |
    Then the ontology is created successfully
    And the ontology is NOT marked as internal

  Scenario: Get ontology display name
    Given an ontology with prefix "ems" and label "Enterprise Management"
    When I get the display name
    Then the display name is "ems - Enterprise Management"

  Scenario: Compare ontologies by prefix
    Given two ontologies:
      | Ontology | Prefix | Label  |
      | Ont1     | ems    | EMS v1 |
      | Ont2     | ems    | EMS v2 |
    When I compare Ont1 and Ont2
    Then they are considered equal
    Because ontologies are equal if prefixes match

  Scenario: Different ontologies are not equal
    Given two ontologies:
      | Ontology | Prefix | Label  |
      | Ont1     | ems    | EMS    |
      | Ont2     | custom | Custom |
    When I compare Ont1 and Ont2
    Then they are NOT equal

  Scenario: Convert ontology to frontmatter
    Given an ontology with:
      | Field       | Value                    |
      | Prefix      | ems                      |
      | Label       | Enterprise               |
      | Namespace   | https://example.com/ems# |
      | Description | EMS ontology             |
    When I convert to frontmatter
    Then frontmatter contains:
      | Field                      | Value                    |
      | exo__Ontology_prefix       | ems                      |
      | exo__Ontology_label        | Enterprise               |
      | exo__Ontology_namespace    | https://example.com/ems# |
      | exo__Ontology_description  | EMS ontology             |

  Scenario: Create ontology from frontmatter
    Given frontmatter with:
      | Field                     | Value                    |
      | exo__Ontology_prefix      | custom                   |
      | exo__Ontology_label       | Custom Ontology          |
      | exo__Ontology_namespace   | https://example.com/custom# |
      | exo__Ontology_description | Custom domain            |
    When I create ontology from frontmatter
    Then the ontology is created successfully
    And the ontology prefix is "custom"
    And the ontology label is "Custom Ontology"

  Scenario: Roundtrip: ontology to frontmatter and back
    Given an ontology with all fields populated
    When I convert to frontmatter
    And I create ontology from that frontmatter
    Then the new ontology equals the original
    And all properties are preserved

  Scenario: Handle missing optional fields in frontmatter
    Given frontmatter with only:
      | Field                 | Value |
      | exo__Ontology_prefix  | test  |
    When I create ontology from frontmatter
    Then the ontology is created successfully
    And the ontology label defaults to "test"
    And namespace is undefined
    And description is undefined

  Scenario: Default to 'exo' prefix when missing
    Given frontmatter without prefix field
    When I create ontology from frontmatter
    Then the ontology is created with prefix "exo"

  Scenario: Identify internal ontology by filename
    Given ontologies:
      | FileName       | Expected Internal |
      | !exo.md        | true              |
      | !ems.md        | true              |
      | custom.md      | false             |
      | external.md    | false             |
    Then internal detection works correctly
