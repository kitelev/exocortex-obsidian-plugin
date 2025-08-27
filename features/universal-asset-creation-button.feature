Feature: Universal Asset Creation Button
  As a knowledge worker using Obsidian with semantic knowledge management
  I want to create new assets directly from class layouts with semantic property discovery
  So that I can quickly create properly structured knowledge assets

  Background:
    Given the Exocortex plugin is installed and active
    And I have a vault with ontology definitions
    And properties are defined with exo__Property_domain relationships

  Scenario: Creation button appears on class layouts
    Given I am viewing a class layout for "ems__Area"
    When the UniversalLayoutRenderer processes the class
    Then I should see a "Create task" button in the layout
    And the button should have class "exocortex-create-asset-button"
    And the button should be positioned at the top of the layout

  Scenario: Button label is configurable
    Given a class "test__CustomClass" exists
    And the class has a custom button label "Add New Item"
    When I view the class layout
    Then the creation button should display "Add New Item"

  Scenario: Default button label uses class name
    Given a class "exo__Asset" exists without custom button configuration
    When I view the class layout
    Then the creation button should display "Create Asset"

  Scenario: Clicking button opens CreateAssetModal
    Given I am viewing the "ems__Area" class layout
    When I click the "Create task" button
    Then the CreateAssetModal should open
    And the modal title should be "Create Area"
    And the class field should be pre-filled with "ems__Area"

  Scenario: Property discovery for direct domain match
    Given a property "ems__Area_parent" exists with:
      | property                | value            |
      | exo__Property_domain   | [[ems__Area]]    |
      | rdf__type              | exo__ObjectProperty |
      | exo__Property_range    | [[ems__Area]]    |
    When I open the creation modal for "ems__Area"
    Then the modal should include a field for "ems__Area_parent"
    And the field should be a dropdown type

  Scenario: Property discovery includes superclass properties
    Given "ems__Area" has superclass "exo__Asset"
    And a property "exo__Asset_label" exists with domain "exo__Asset"
    When I open the creation modal for "ems__Area"
    Then the modal should include fields from both "ems__Area" and "exo__Asset"
    And "exo__Asset_label" field should be present

  Scenario: ObjectProperty generates dropdown with instances
    Given a property "ems__Area_parent" has:
      | property                | value            |
      | rdf__type              | exo__ObjectProperty |
      | exo__Property_range    | [[ems__Area]]    |
    And the vault contains these "ems__Area" instances:
      | name          | uid                                  |
      | North Region  | area-north-123                       |
      | South Region  | area-south-456                       |
      | East Region   | area-east-789                        |
    When I open the creation modal for "ems__Area"
    Then the "ems__Area_parent" dropdown should contain:
      | label         | value                                |
      | North Region  | [[North Region]]                     |
      | South Region  | [[South Region]]                     |
      | East Region   | [[East Region]]                      |

  Scenario: DatatypeProperty generates appropriate input types
    Given these properties exist for "test__Entity":
      | name                | type                  | range    |
      | test__name         | exo__DatatypeProperty | string   |
      | test__age          | exo__DatatypeProperty | number   |
      | test__birthdate    | exo__DatatypeProperty | date     |
      | test__isActive     | exo__DatatypeProperty | boolean  |
    When I open the creation modal for "test__Entity"
    Then the form should have these input types:
      | field           | input_type |
      | test__name     | text       |
      | test__age      | number     |
      | test__birthdate| date       |
      | test__isActive | checkbox   |

  Scenario: Required properties are validated
    Given a property "exo__Asset_label" has "exo__Property_isRequired: true"
    When I open the creation modal
    And I try to submit without filling "exo__Asset_label"
    Then I should see a validation error "Label is required"
    And the form should not submit

  Scenario: Core properties are automatically included
    Given I open the creation modal for any class
    Then these core fields should always be present:
      | field                  | type           | behavior          |
      | exo__Asset_uid        | text           | auto-generated    |
      | exo__Asset_isDefinedBy| dropdown       | ontology list     |
      | exo__Instance_class   | text           | pre-filled        |

  Scenario: Successful asset creation
    Given I have the creation modal open for "ems__Area"
    And I fill in all required fields:
      | field                  | value                  |
      | exo__Asset_label      | North Production Area  |
      | ems__Area_parent      | [[South Region]]       |
      | exo__Asset_isDefinedBy| [[Ontology - ems]]    |
    When I click the "Create" button
    Then a new file "North Production Area.md" should be created
    And the file should have frontmatter:
      """
      ---
      exo__Asset_uid: <generated-uuid>
      exo__Asset_label: North Production Area
      exo__Asset_isDefinedBy: "[[Ontology - ems]]"
      exo__Instance_class: "[[ems__Area]]"
      ems__Area_parent: "[[South Region]]"
      ---
      """
    And I should see a success notification "Asset created successfully"

  Scenario: Property discovery handles wikilink formats
    Given a property exists with domain "[[exo__Asset]]" (wikilink format)
    When discovering properties for class "exo__Asset"
    Then the property should be included in discovery results

  Scenario: Property discovery handles string formats
    Given a property exists with domain "exo__Asset" (plain string format)
    When discovering properties for class "exo__Asset"
    Then the property should be included in discovery results

  Scenario: Performance - Property discovery completes quickly
    Given a vault with 5000 property definitions
    And 50 properties match the class domain
    When I click the creation button
    Then the modal should open within 500ms
    And all applicable properties should be discovered

  Scenario: Mobile support - Touch-friendly interface
    Given I am using Obsidian on a mobile device
    When I tap the creation button
    Then the modal should be touch-optimized
    And dropdowns should be easily selectable
    And the form should be scrollable
    And buttons should have adequate touch targets (min 44x44px)