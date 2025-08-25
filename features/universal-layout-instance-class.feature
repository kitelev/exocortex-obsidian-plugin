Feature: Display exo__Instance_class in UniversalLayout
  As a knowledge worker using Exocortex
  I want to see the exo__Instance_class value in the UniversalLayout table
  So that I can quickly identify the class type of my assets alongside their names

  Background:
    Given I have the Exocortex plugin installed
    And I have assets with exo__Instance_class properties
    And I am viewing an asset with UniversalLayout

  Scenario: Display exo__Instance_class in second column for assets with the property
    Given I have an asset "Project Alpha" with exo__Instance_class "ems__Project"
    When I view the asset in UniversalLayout
    Then I should see a table with two columns
    And the first column should show "Project Alpha"
    And the second column should show "ems__Project"

  Scenario: Handle missing exo__Instance_class property gracefully
    Given I have an asset "Generic Note" without exo__Instance_class property
    When I view the asset in UniversalLayout
    Then I should see a table with two columns
    And the first column should show "Generic Note"
    And the second column should be empty or show a placeholder

  Scenario: Display multiple assets with different exo__Instance_class values
    Given I have the following assets in a related block:
      | Asset Name      | exo__Instance_class |
      | Project Alpha   | ems__Project        |
      | Task Beta       | ems__Task           |
      | Area Gamma      | ems__Area           |
      | Note Delta      |                     |
    When I view the related assets in UniversalLayout
    Then I should see a table with the following content:
      | Name            | Instance Class      |
      | Project Alpha   | ems__Project        |
      | Task Beta       | ems__Task           |
      | Area Gamma      | ems__Area           |
      | Note Delta      | -                   |

  Scenario: Maintain existing functionality while adding new column
    Given I have an asset with complex UniversalLayout blocks
    And the asset has exo__Instance_class "ems__Effort"
    When I view the asset
    Then all existing layout blocks should render correctly
    And the asset name should appear in the first column
    And "ems__Effort" should appear in the second column
    And no existing functionality should be broken

  Scenario: Performance with large number of assets
    Given I have 100 related assets with various exo__Instance_class values
    When I view them in UniversalLayout
    Then the table should render within 500ms
    And all exo__Instance_class values should be displayed correctly
    And the UI should remain responsive

  Scenario: Mobile responsiveness of two-column layout
    Given I am using Obsidian on a mobile device
    And I have an asset with exo__Instance_class "ems__Zone"
    When I view the asset in UniversalLayout
    Then the two-column table should be responsive
    And both columns should be visible on mobile screens
    And the text should be readable without horizontal scrolling

  Scenario: Integration with query results
    Given I have a query block that returns assets
    And the assets have exo__Instance_class properties
    When the query results are displayed in UniversalLayout
    Then each result should show both name and exo__Instance_class
    And the formatting should be consistent with other tables

  Scenario: Sorting and filtering capabilities
    Given I have a table with multiple assets and their exo__Instance_class values
    When I interact with the table headers
    Then I should be able to sort by asset name
    And I should be able to sort by exo__Instance_class
    And the sorting should be case-insensitive

  Scenario: Export and copy functionality
    Given I have a UniversalLayout table with exo__Instance_class column
    When I select and copy the table content
    Then the copied text should include both columns
    And the format should be suitable for pasting into spreadsheets
    And the column headers should be included