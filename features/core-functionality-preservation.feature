# Core Functionality Preservation
# BDD Specifications for preserving essential components during refactoring

Feature: Core Functionality Preservation
  As a plugin user
  I want the essential layout and asset creation functionality to remain intact
  So that I can continue using the core features after refactoring

  Background:
    Given the Exocortex plugin is installed and activated
    And I have access to test vault with sample ontology files
    And the following components are preserved:
      | Component        | Type            | Location                                    |
      | UniversalLayout  | View Renderer   | presentation/renderers/UniversalLayoutRenderer.ts |
      | DynamicLayout    | View Renderer   | presentation/renderers/DynamicLayoutRenderer.ts   |
      | CreateAssetModal | Modal Component | presentation/modals/CreateAssetModal.ts            |

  Scenario: UniversalLayout remains fully functional
    Given I have a note with exo__Instance_class "exo__Asset"
    And the note contains assets that reference it via various properties
    When I add the following code block to the note:
      """
      ```UniversalLayout
      layout: table
      showProperties: exo__Asset_label, exo__Instance_class
      groupByProperty: true
      ```
      """
    Then the UniversalLayout should render successfully
    And I should see assets grouped by their referencing properties
    And the table should display "Name" and "exo__Instance_class" columns
    And each asset should be clickable and navigate to the correct file
    And if the current file is a class, I should see a "Create" button

  Scenario: UniversalLayout handles empty results gracefully
    Given I have a note with no incoming asset relations
    When I add a UniversalLayout code block to the note
    Then I should see the message "No related assets found"
    And no error should be displayed in the console
    And the layout container should be properly structured

  Scenario: UniversalLayout supports all layout modes
    Given I have a note with asset relations
    When I test different layout configurations:
      | Layout | Expected Result |
      | list   | Bulleted list with asset links |
      | table  | Sortable table with columns |
      | cards  | Card-based grid layout |
      | graph  | Grouped relations with graph placeholder |
    Then each layout mode should render without errors
    And maintain consistent data presentation across modes

  Scenario: DynamicLayout continues working with class layouts
    Given I have a class definition file with exo__Instance_class "exo__Class"
    And I have a ClassLayout file configured for this class
    And the ClassLayout specifies relationsToShow: ["exo__Asset_belongsTo", "exo__Asset_createdBy"]
    When I add a DynamicLayout code block to an asset instance of this class
    Then the DynamicLayout should load the ClassLayout configuration
    And only display relations for the specified properties
    And group them according to the configuration order

  Scenario: DynamicLayout falls back to UniversalLayout when no layout configured
    Given I have an asset with exo__Instance_class "CustomClass"
    And there is no ClassLayout defined for "CustomClass"
    When I add a DynamicLayout code block to the asset
    Then I should see the message "There is no specific Layout for class [[CustomClass]] - UniversalLayout will be used"
    And all asset relations should be displayed using UniversalLayout rendering
    And the functionality should be identical to UniversalLayout

  Scenario: DynamicLayout handles defaultLayout property optimization
    Given I have a class with exo__Class_defaultLayout property pointing to a ClassLayout UUID
    And the ClassLayout file exists with the specified UUID
    When I render DynamicLayout for an instance of this class
    Then the layout should be loaded via direct UUID lookup
    And performance should be optimized (under 100ms for layout discovery)
    And the correct relationsToShow configuration should be applied

  Scenario: CreateAssetModal creates assets with dynamic properties
    Given I open the CreateAssetModal
    When I select class "exo__Asset" from the dropdown
    Then I should see the basic asset creation form
    And the title field should be editable
    And the ontology field should default to "exo"
    And I should see dynamically loaded properties for the selected class

  Scenario: CreateAssetModal handles class switching correctly
    Given I have the CreateAssetModal open
    And I have selected class "exo__Asset"
    When I change the class to "ems__Area"
    Then the properties should update within 100ms
    And any previous property values should be cleared
    And new properties specific to "ems__Area" should be displayed
    And no duplicate property fields should appear

  Scenario: CreateAssetModal creates valid assets
    Given I have the CreateAssetModal open
    When I fill in the following details:
      | Field    | Value           |
      | Title    | Test Asset      |
      | Class    | exo__Asset      |
      | Ontology | exo             |
    And I click the "Create" button
    Then a new asset file should be created
    And it should have the correct frontmatter with exo__Instance_class
    And it should include a unique exo__Asset_uid
    And I should see a success notice
    And the modal should close

  Scenario: CreateAssetModal handles property validation
    Given I have the CreateAssetModal open with class "exo__Property"
    And the class has required properties
    When I attempt to create an asset without filling required fields
    Then appropriate validation should occur
    And I should see clear error messages
    And the modal should remain open for corrections

  Scenario: CreateAssetModal supports different property types
    Given I have a class with various property types:
      | Property Type | UI Component | Expected Behavior |
      | ObjectProperty | Dropdown | Shows instances of target class |
      | DatatypeProperty with enum | Dropdown | Shows predefined options |
      | Boolean | Toggle | True/false selection |
      | Date | Date picker | Calendar input |
      | Number | Number input | Numeric validation |
      | Text | Textarea | Multi-line text input |
      | Array | Text input | Comma-separated or [[links]] |
    When I open CreateAssetModal for this class
    Then each property should render with the correct input type
    And all inputs should function as expected
    And data should be properly formatted in the created asset

  Scenario: Architecture layers remain intact after component preservation
    Given the refactoring has preserved core functionality
    When I examine the codebase structure
    Then the Domain layer should remain independent with entities, value objects, and services
    And the Application layer should maintain use cases and ports
    And the Infrastructure layer should preserve repositories and adapters
    And the Presentation layer should contain the preserved renderers and modals
    And dependency injection should continue working correctly
    And the clean architecture boundaries should be maintained