Feature: Configurable Class-Based Layouts
  As a user of the Exocortex plugin
  I want to configure custom layouts for different asset classes
  So that I can see relevant information for each type of asset

  Background:
    Given the plugin is installed and active
    And I have configured the layouts folder as "layouts"
    And the following ontology classes exist:
      | Class           | Parent        |
      | ems__Project    | exo__Asset    |
      | ems__Task       | exo__Asset    |
      | ems__Area       | exo__Asset    |
      | ui__ClassLayout | exo__Asset    |

  @smoke @layout
  Scenario: Display project with incomplete tasks
    Given I have a layout configuration for "ems__Project":
      """
      ---
      exo__Instance_class: "[[ui__ClassLayout]]"
      ui__ClassLayout_targetClass: "[[ems__Project]]"
      ui__ClassLayout_blocks:
        - id: "tasks"
          type: "query"
          title: "Incomplete Tasks"
          config:
            className: "ems__Task"
            propertyFilters:
              - property: "ems__Task_project"
                operator: "equals"
                value: "{{current_asset}}"
              - property: "ems__Effort_status"
                operator: "notEquals"
                value: "[[ems__EffortStatus - Done]]"
      ---
      """
    And I have a project "Website Redesign" with tasks:
      | Task Name          | Status    |
      | Design mockups     | Active    |
      | Implement frontend | Pending   |
      | Deploy to prod     | Done      |
    When I open the "Website Redesign" project
    Then I should see a block titled "Incomplete Tasks"
    And the block should contain "Design mockups"
    And the block should contain "Implement frontend"
    But the block should not contain "Deploy to prod"

  @layout
  Scenario: Display area with sub-areas
    Given I have a layout configuration for "ems__Area":
      """
      ---
      exo__Instance_class: "[[ui__ClassLayout]]"
      ui__ClassLayout_targetClass: "[[ems__Area]]"
      ui__ClassLayout_blocks:
        - id: "subareas"
          type: "query"
          title: "Sub-Areas"
          config:
            className: "ems__Area"
            propertyFilters:
              - property: "ems__Area_parent"
                operator: "equals"
                value: "{{current_asset}}"
      ---
      """
    And I have an area "Engineering" with sub-areas:
      | Sub-Area    |
      | Frontend    |
      | Backend     |
      | DevOps      |
    When I open the "Engineering" area
    Then I should see a block titled "Sub-Areas"
    And the block should list all 3 sub-areas

  @layout @priority
  Scenario: Use highest priority layout when multiple exist
    Given I have two layout configurations for "ems__Project":
      | Layout Name      | Priority |
      | Basic Layout     | 5        |
      | Advanced Layout  | 10       |
    When I open a project asset
    Then the "Advanced Layout" should be used
    And I should see blocks from the higher priority layout

  @layout @fallback
  Scenario: Use default layout when no configuration exists
    Given there is no layout configuration for "ems__Goal"
    When I open an asset of class "ems__Goal"
    Then the default layout should be displayed
    And I should see standard property blocks
    And I should see backlinks section

  @layout @blocks
  Scenario: Render multiple block types in order
    Given I have a layout with multiple blocks:
      | Block Type  | Title         | Order |
      | properties  | Properties    | 1     |
      | query       | Related Tasks | 2     |
      | backlinks   | References    | 3     |
    When I open an asset with this layout
    Then blocks should appear in the specified order
    And each block should render its content correctly

  @layout @query
  Scenario: Execute complex query with multiple filters
    Given I have a query block with filters:
      """
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_area"
          operator: "equals"
          value: "[[Engineering]]"
        - property: "ems__Task_priority"
          operator: "equals"
          value: "High"
        - property: "ems__Effort_status"
          operator: "contains"
          value: "Active"
      maxResults: 10
      sortBy: "ems__Task_deadline"
      sortOrder: "asc"
      """
    When the query block is rendered
    Then it should show only tasks matching all filters
    And results should be limited to 10
    And results should be sorted by deadline ascending

  @layout @edit
  Scenario: Edit properties through layout
    Given I have a properties block with editable fields:
      | Property               |
      | ems__Project_status    |
      | ems__Project_deadline  |
    When I click on an editable property
    Then an inline editor should appear
    And I should be able to modify the value
    And changes should be saved to the asset

  @layout @custom
  Scenario: Render custom block with Dataview query
    Given I have a custom block with dataview query:
      """
      type: "custom"
      dataviewQuery: |
        table deadline, status
        from #project
        where contains(file.name, "2024")
      """
    When the custom block is rendered
    Then it should execute the dataview query
    And display results in the specified format

  @layout @performance
  Scenario: Handle large number of results efficiently
    Given I have a query block returning 100+ assets
    When the block is rendered
    Then it should complete within 500ms
    And implement pagination or virtualization
    And show result count indicator

  @layout @error
  Scenario: Handle invalid layout configuration gracefully
    Given I have a layout with invalid configuration:
      """
      ui__ClassLayout_blocks:
        - id: "invalid"
          type: "nonexistent"
          config: {}
      """
    When I open an asset with this layout
    Then an error message should be displayed
    And the default layout should be used as fallback
    And the error should be logged to console