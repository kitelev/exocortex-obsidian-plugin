Feature: DynamicLayout ClassLayout Discovery
  As an Exocortex plugin user
  I want DynamicLayout to correctly discover ui__ClassLayout configurations
  So that I can use custom layouts for my classes like exo__Class

  Background:
    Given I have the Exocortex plugin installed
    And I have a vault with Obsidian notes

  Scenario: Finding ui__ClassLayout for class with double underscore prefix
    Given I have a class named "exo__Class"
    And I have a ClassLayout file at "01 Inbox/ClassLayout - exo__Class.md"
    And the ClassLayout file has frontmatter property "ui__ClassLayout" set to "exo__Class"
    When I render DynamicLayout for the class "exo__Class"
    Then it should find the ClassLayout configuration
    And it should display the configured relations
    And it should not show "No ui__ClassLayout found for class: exo__Class"

  Scenario: Finding ui__ClassLayout with exact name match
    Given I have a class named "Person"
    And I have a ClassLayout file at "ClassLayout - Person.md"
    And the ClassLayout file has frontmatter property "ui__ClassLayout" set to "Person"
    When I render DynamicLayout for the class "Person"
    Then it should find the ClassLayout configuration
    And it should apply the layout settings

  Scenario: Finding ui__ClassLayout with class prefix variations
    Given I have a class named "exo__Document"
    And I have multiple ClassLayout files:
      | Path                                    | ui__ClassLayout value |
      | "ClassLayout - Document.md"            | "Document"            |
      | "ClassLayout - exo__Document.md"       | "exo__Document"       |
      | "UI/ClassLayout - exo__Document.md"    | "exo__Document"       |
    When I render DynamicLayout for the class "exo__Document"
    Then it should find the most specific ClassLayout (exo__Document)
    And it should not use the generic "Document" layout

  Scenario: Searching for ui__ClassLayout across entire vault
    Given I have a class named "exo__Class"
    And I have a ClassLayout file in a nested folder "01 Inbox/Layouts/ClassLayout - exo__Class.md"
    And the file has property "ui__ClassLayout" set to "exo__Class"
    When I render DynamicLayout for the class "exo__Class"
    Then it should search the entire vault for ClassLayout files
    And it should find the layout regardless of folder depth

  Scenario: Handling ui__ClassLayout with special characters
    Given I have a class named "exo__Class"
    And the ClassLayout file name contains spaces and special characters
    And the ui__ClassLayout property exactly matches "exo__Class"
    When I render DynamicLayout for the class "exo__Class"
    Then it should correctly match the class name
    And it should handle the double underscore in the class name

  Scenario: ClassLayout referenced via exo__Class_defaultLayout property
    Given I have a class note "02 Ontology/1 Exo/exo/Class/exo__Class.md"
    And it has property "exo__Class_defaultLayout" pointing to "[[ClassLayout - exo__Class]]"
    And the ClassLayout file exists at "01 Inbox/ClassLayout - exo__Class.md"
    When I render DynamicLayout in the class note
    Then it should follow the defaultLayout reference
    And it should load the ClassLayout configuration
    And it should display the configured layout

  Scenario: Fallback when no ui__ClassLayout found
    Given I have a class named "UnknownClass"
    And there is no ClassLayout file for this class
    When I render DynamicLayout for the class "UnknownClass"
    Then it should show a helpful message "No ui__ClassLayout found for class: UnknownClass"
    And it should suggest creating a ClassLayout configuration

  Scenario: ClassLayout with relationsToShow configuration
    Given I have a class named "exo__Class"
    And I have a ClassLayout with ui__ClassLayout_relationsToShow property
    And the relationsToShow lists specific properties to display
    When I render DynamicLayout for the class "exo__Class"
    Then it should only show the configured relations
    And it should respect the display order

  Scenario: Case sensitivity in class name matching
    Given I have a class named "exo__Class"
    And I have ClassLayout files with various case variations:
      | ui__ClassLayout value |
      | "exo__class"         |
      | "EXO__CLASS"         |
      | "exo__Class"         |
    When I render DynamicLayout for the class "exo__Class"
    Then it should match the exact case "exo__Class"
    And it should not match case-insensitive variants

  Scenario: Multiple ui__ClassLayout properties in same file
    Given I have a file with multiple ui__ClassLayout properties for different classes
    And one of them is "ui__ClassLayout: exo__Class"
    When I render DynamicLayout for the class "exo__Class"
    Then it should correctly identify the matching property
    And it should not be confused by other ClassLayout properties

  Scenario: Performance with large vault search
    Given I have a vault with 1000+ notes
    And I have a ClassLayout file for "exo__Class" somewhere in the vault
    When I render DynamicLayout for the class "exo__Class"
    Then it should find the ClassLayout efficiently
    And the search should complete within 1 second
    And it should cache the result for subsequent renders

  Scenario: Updating ClassLayout configuration
    Given I have a ClassLayout for "exo__Class" already loaded
    When I update the ui__ClassLayout_relationsToShow property
    And I refresh the DynamicLayout render
    Then it should reflect the updated configuration
    And it should not use stale cached data