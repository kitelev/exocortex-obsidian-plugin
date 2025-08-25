Feature: Display exo__Instance_class values as clickable links
  As a knowledge worker using Exocortex
  I want exo__Instance_class values to be displayed as clickable links
  So that I can navigate directly to the class definitions from the UniversalLayout table

  Background:
    Given I have the Exocortex plugin installed
    And I have assets with exo__Instance_class properties
    And the exo__Instance_class field can contain arrays of links

  Scenario: Display single instance class as clickable link
    Given I have an asset "Project Alpha" with exo__Instance_class "[[ems__Project]]"
    When I view the asset in UniversalLayout
    Then I should see "ems__Project" as a clickable link in the second column
    And clicking the link should navigate to the ems__Project asset

  Scenario: Display multiple instance classes as separate links
    Given I have an asset "Hybrid Task" with exo__Instance_class array:
      | [[ems__Task]] |
      | [[ems__Effort]] |
      | [[ems__Milestone]] |
    When I view the asset in UniversalLayout
    Then I should see three clickable links in the second column
    And the links should be displayed as "ems__Task, ems__Effort, ems__Milestone"
    And each link should navigate to its respective asset

  Scenario: Handle mixed format instance classes (with and without brackets)
    Given I have an asset "Mixed Format" with exo__Instance_class array:
      | [[ems__Project]] |
      | ems__Task |
      | [[ems__Area|Custom Area]] |
    When I view the asset in UniversalLayout
    Then I should see all values as clickable links
    And "ems__Project" should link to ems__Project.md
    And "ems__Task" should link to ems__Task.md
    And "Custom Area" should link to ems__Area.md with displayed text "Custom Area"

  Scenario: Handle empty array gracefully
    Given I have an asset "Empty Classes" with exo__Instance_class as empty array
    When I view the asset in UniversalLayout
    Then I should see "-" in the second column
    And no links should be present

  Scenario: Handle null or undefined exo__Instance_class
    Given I have an asset "No Classes" without exo__Instance_class property
    When I view the asset in UniversalLayout
    Then I should see "-" in the second column
    And no links should be present

  Scenario: Preserve link functionality with special characters
    Given I have an asset with exo__Instance_class "[[ems__Project-2024]]"
    When I view the asset in UniversalLayout
    Then the link should work correctly with special characters
    And clicking should navigate to "ems__Project-2024.md"

  Scenario: Links should respect Obsidian navigation modifiers
    Given I have an asset with exo__Instance_class "[[ems__Task]]"
    When I view the asset in UniversalLayout
    Then Ctrl+Click should open the link in a new pane
    And Shift+Click should open the link in a new split
    And regular click should navigate in the current pane

  Scenario: Display piped links with custom text
    Given I have an asset with exo__Instance_class "[[ems__CustomClass|My Custom Class]]"
    When I view the asset in UniversalLayout
    Then I should see "My Custom Class" as the link text
    And clicking should navigate to "ems__CustomClass.md"

  Scenario: Handle very long lists of instance classes
    Given I have an asset with 10 instance classes
    When I view the asset in UniversalLayout
    Then all 10 links should be displayed
    And the cell should handle overflow gracefully
    And all links should remain clickable

  Scenario: Maintain performance with many linked assets
    Given I have 100 assets each with multiple instance class links
    When I view them in UniversalLayout
    Then the rendering should complete within 1000ms
    And all links should be functional
    And the UI should remain responsive