Feature: UI Layout Block for Relation Properties Display
  As a user of the Exocortex plugin
  I want to configure which properties are displayed for related assets
  So that I can see relevant information about linked assets at a glance

  Background:
    Given I have the Exocortex plugin installed
    And I have a vault with semantic assets

  Scenario: Default relation display without LayoutBlock configuration
    Given I have an asset "Project Alpha" of class "ems__Project"
    And I have related assets linked to "Project Alpha"
    When I view "Project Alpha" in Obsidian
    Then I should see related assets with only their names
    And I should not see additional properties displayed

  Scenario: Creating a LayoutBlock configuration for ems__Project
    Given I create a file "ui__LayoutBlock - ems__Project.md"
    And I set its exo__Instance_class to "ui__LayoutBlock"
    And I set its ui__LayoutBlock_target_class to "ems__Project"
    And I configure display properties for "ems__Effort_status"
    When I view an asset of class "ems__Project"
    Then related assets should display with the configured properties
    And I should see the "ems__Effort_status" property values

  Scenario: Table format display of related asset properties
    Given I have a LayoutBlock configured for "ems__Project"
    And the configuration specifies "tableFormat: true"
    And multiple display properties are configured
    When I view an asset of class "ems__Project"
    Then related assets should appear in a table format
    And the table should have columns for each configured property
    And each row should represent a related asset

  Scenario: Status badge formatting for properties
    Given I have a LayoutBlock with property "ems__Effort_status"
    And the property has "formatType: status-badge"
    When I view related assets with status values
    Then status values should appear as colored badges
    And "In Progress" should have a yellow background
    And "Completed" should have a green background
    And "Blocked" should have a red background

  Scenario: Sorting related assets by property
    Given I have a LayoutBlock configuration
    And it includes "sortBy: { property: 'ems__Effort_priority', direction: 'desc' }"
    When I view related assets
    Then assets should be sorted by priority in descending order
    And high priority items should appear first

  Scenario: Filtering by target class
    Given I have a LayoutBlock with "targetClass: 'ems__Effort'"
    And I have mixed types of related assets
    When I view the layout
    Then only assets of class "ems__Effort" should be displayed
    And other asset types should be filtered out

  Scenario: Column width and alignment customization
    Given I have a LayoutBlock with property configurations
    And properties have "columnWidth" and "alignment" settings
    When the table is rendered
    Then columns should have the specified widths
    And text should be aligned according to configuration

  Scenario: Empty property handling
    Given I have related assets with missing property values
    And the LayoutBlock displays those properties
    When I view the related assets
    Then empty properties should show a dash "-"
    And empty cells should have muted styling

  Scenario: Multiple LayoutBlock configurations
    Given I have multiple LayoutBlock files for the same class
    And they have different priority values
    When determining which layout to use
    Then the layout with the highest priority should be selected
    And lower priority layouts should be ignored

  Scenario: Date formatting for date properties
    Given I have a property with "formatType: date"
    And the property contains ISO date strings
    When displaying the property value
    Then dates should be formatted in locale-appropriate format
    And invalid dates should show as plain text

  Scenario: Link formatting for reference properties
    Given I have a property with "formatType: link"
    And the property contains references to other assets
    When displaying the property value
    Then values should appear as clickable internal links
    And clicking should navigate to the referenced asset

  Scenario: Maximum results limitation
    Given I have a LayoutBlock with "maxResults: 10"
    And there are 20 related assets
    When displaying the relations
    Then only the first 10 assets should be shown
    And a message should indicate more results exist

  Scenario: Collapsible block configuration
    Given I have a LayoutBlock with "isCollapsible: true"
    And "isCollapsed: false" initially
    When the block is rendered
    Then it should have a collapse/expand toggle
    And clicking the toggle should hide/show the content

  Scenario: Custom property labels
    Given I have a property "ems__Effort_status"
    And it has "displayLabel: 'Current Status'"
    When the table header is rendered
    Then the column should show "Current Status" instead of the property name

  Scenario: Asset class subtitle display
    Given I have a LayoutBlock with "showAssetClass: true"
    When displaying related assets
    Then each asset should show its class name as a subtitle
    And the class name should be in smaller, muted text

  Scenario: Fallback to default display
    Given I have a corrupted LayoutBlock configuration
    When attempting to render relations
    Then the system should fall back to default display
    And an error message should be logged
    But the page should not crash

  Scenario: Live configuration updates
    Given I have a LayoutBlock configuration file open
    When I modify and save the configuration
    Then the changes should be reflected immediately
    And related asset displays should update without reload

  Scenario: Property discovery for configuration
    Given I want to configure a LayoutBlock
    When I check available properties for a class
    Then the system should scan existing assets
    And provide a list of all properties used by that class
    And suggest them for configuration

  Scenario: Integration with existing layout system
    Given I have both ClassLayout and LayoutBlock configured
    When rendering an asset view
    Then ClassLayout should define the overall structure
    And LayoutBlock should enhance relation displays
    And both should work together seamlessly