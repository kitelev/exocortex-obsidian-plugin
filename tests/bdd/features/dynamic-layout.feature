Feature: DynamicLayout - Filtered Asset Relations Display
  As a knowledge worker using Exocortex
  I want to display asset relations filtered by specific properties
  So that I can see only relevant relationships based on ui__ClassLayout configuration

  Background:
    Given I have an Obsidian vault with Exocortex plugin installed
    And I have defined a ui__ClassLayout for my asset class
    And the layout specifies properties to show in ui__ClassLayout_relationsToShow

  Scenario: Display filtered relations based on ui__ClassLayout configuration
    Given I have an asset of class "ems__Area"
    And there is a ui__ClassLayout for "ems__Area" class
    And the layout specifies "ems__Area_parent" in relationsToShow
    When I render DynamicLayout for this asset
    Then I should see only assets linked through "ems__Area_parent" property
    And each relation group should have the property name as H2 header
    And other property relations should not be displayed

  Scenario: Handle multiple properties in relationsToShow
    Given I have an asset with a ui__ClassLayout
    And the layout specifies multiple properties in relationsToShow
    When I render DynamicLayout
    Then I should see separate H2 sections for each specified property
    And each section should contain only assets linked through that property
    And the sections should be displayed in the order specified

  Scenario: Show error when ui__ClassLayout is missing
    Given I have an asset of class "SomeClass"
    And there is no ui__ClassLayout defined for "SomeClass"
    When I render DynamicLayout for this asset
    Then I should see an error message stating "No ui__ClassLayout found for class: SomeClass"
    And the error should suggest creating a ui__ClassLayout
    And no relations should be displayed

  Scenario: Handle empty relationsToShow property
    Given I have an asset with a ui__ClassLayout
    And the ui__ClassLayout_relationsToShow property is empty
    When I render DynamicLayout
    Then I should see a message "No relations configured to display"
    And no relation sections should be rendered

  Scenario: Display body links when specified in relationsToShow
    Given I have an asset with a ui__ClassLayout
    And the layout includes "body" or "untyped" in relationsToShow
    When I render DynamicLayout
    Then I should see an "Untyped Relations" section
    And it should contain assets linked from document body
    And body links should be shown after all property-based relations

  Scenario: Fallback to UniversalLayout behavior
    Given I have an asset with a ui__ClassLayout
    And the layout specifies "*" or "all" in relationsToShow
    When I render DynamicLayout
    Then it should behave like UniversalLayout
    And display all relations grouped by property
    And include the Untyped Relations section

  Scenario: Performance with large number of relations
    Given I have an asset with 100+ referencing assets
    And a ui__ClassLayout filtering to show only 2 properties
    When I render DynamicLayout
    Then rendering should complete within 500ms
    And only filtered relations should be processed
    And memory usage should remain optimal

  Scenario: CSS styling consistency
    Given I render DynamicLayout with filtered relations
    When the relations are displayed
    Then they should use the same CSS classes as UniversalLayout
    And maintain visual consistency with existing features
    And support both light and dark themes