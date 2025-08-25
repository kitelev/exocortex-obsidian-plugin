  Feature: Simplified UI Layout Block with Property References
  As a user of the Exocortex plugin
  I want to configure which properties to display using property references
  So that I can easily customize asset displays without complex configuration

  Background:
    Given I have the Exocortex plugin installed
    And I have a vault with semantic assets

  Scenario: Simple property list configuration
    Given I have an asset "Project Alpha" of class "ems__Project"
    And I have a ui__LayoutBlock configuration with properties:
      | ui__LayoutBlock_display_properties |
      | [[ems__Effort_status]]             |
      | [[ems__Effort_priority]]           |
      | [[ems__Effort_due_date]]           |
    When I view "Project Alpha" with related efforts
    Then I should see a table with columns for each configured property
    And the columns should be labeled with the property names

  Scenario: Property reference validation
    Given I create a ui__LayoutBlock configuration
    When I add "[[ems__Effort_status]]" to display properties
    Then the system should recognize it as a property reference
    And use it to display the status property of related assets

  Scenario: Automatic property formatting
    Given I have a property "[[ems__Effort_status]]" in display list
    When the property name contains "status"
    Then values should automatically display as status badges
    When the property name contains "date"
    Then values should automatically display as formatted dates

  Scenario: Simple table display
    Given I have a ui__LayoutBlock for "ems__Project"
    And it lists three properties to display
    When viewing a project with related efforts
    Then efforts should appear in a simple table
    And each property should be a column
    And property values should be displayed appropriately

  Scenario: Missing property handling
    Given a related asset lacks a configured property
    When displaying the asset in the table
    Then the missing property should show as "-"
    And the table should remain properly formatted

  Scenario: Property order preservation
    Given display properties are listed in specific order:
      | Order | Property                |
      | 1     | [[ems__Effort_status]]  |
      | 2     | [[ems__Effort_priority]]|  
      | 3     | [[ems__Effort_due_date]]|
    When the table is rendered
    Then columns should appear in the same order

  Scenario: Minimal configuration
    Given I create a ui__LayoutBlock with only:
      - exo__Instance_class: ui__LayoutBlock
      - ui__LayoutBlock_target_class: ems__Project
      - ui__LayoutBlock_display_properties: list of property references
    When the configuration is processed
    Then it should work without any additional settings
    And display a functional property table

  Scenario: Property reference format
    Given properties are referenced as wikilinks
    When I specify "[[ems__Effort_status]]"
    Then the system extracts "ems__Effort_status" as the property name
    And uses it to access frontmatter values

  Scenario: Default asset name column
    Given a ui__LayoutBlock configuration
    When no explicit asset name property is specified
    Then the first column should always be the asset name/label
    And subsequent columns should be the configured properties

  Scenario: Integration with existing layouts
    Given I have both ClassLayout and simplified LayoutBlock
    When rendering an asset
    Then LayoutBlock should enhance the display
    And work seamlessly with existing layout system