Feature: Asset Management
  As a knowledge worker
  I want to create and manage semantic assets
  So that I can organize my knowledge graph effectively

  Background:
    Given the Exocortex plugin is loaded

  Scenario: Create new asset with minimal information
    When I create an asset with:
      | Field     | Value         |
      | Label     | My First Task |
      | Class     | ems__Task     |
      | Ontology  | ems           |
    Then the asset is created successfully
    And the asset has a valid UUID
    And the asset title is "My First Task"
    And the asset version is 1

  Scenario: Create asset with full metadata
    When I create an asset with:
      | Field       | Value                    |
      | Label       | Strategic Project Alpha  |
      | Class       | ems__Project             |
      | Ontology    | ems                      |
      | Description | Q1 2025 strategic init   |
    And I add properties:
      | Property    | Value  |
      | priority    | high   |
      | status      | active |
      | owner       | Alice  |
    Then the asset is created successfully
    And the asset has property "priority" with value "high"
    And the asset has property "status" with value "active"

  Scenario: Fail to create asset with empty label
    When I create an asset with empty label
    Then asset creation fails
    And I see error "Asset label cannot be empty"

  Scenario: Fail to create asset with very long label
    When I create an asset with label of 201 characters
    Then asset creation fails
    And I see error "cannot exceed 200 characters"

  Scenario: Update asset title
    Given an existing asset "Original Title"
    When I update the title to "New Title"
    Then the title is updated successfully
    And the asset title is "New Title"
    And the asset version increments to 2

  Scenario: Add property to asset
    Given an existing asset "Task"
    When I add property "status" with value "todo"
    Then the property is added successfully
    And the asset has property "status" with value "todo"
    And the asset version increments

  Scenario: Update existing property
    Given an existing asset "Task" with property "status" = "todo"
    When I update property "status" to "done"
    Then the property is updated successfully
    And the asset has property "status" with value "done"

  Scenario: Remove property from asset
    Given an existing asset "Task" with properties:
      | Property | Value |
      | status   | done  |
      | priority | low   |
    When I remove property "status"
    Then the property is removed successfully
    And the asset does not have property "status"
    And the asset still has property "priority"

  Scenario: Bulk property update
    Given an existing asset "Task"
    When I update multiple properties:
      | Property  | Value  |
      | status    | active |
      | priority  | high   |
      | assignee  | Bob    |
    Then all properties are updated successfully
    And the asset version increments by 1

  Scenario: Change asset class
    Given an existing asset "Item" of class "ems__Task"
    When I change the class to "ems__Project"
    Then the class is changed successfully
    And the asset class is "ems__Project"
    And the asset version increments

  Scenario: Asset version control
    Given an existing asset "Versioned Item"
    When I perform 3 updates:
      | Action          | Value      |
      | Update title    | New Title  |
      | Add property    | status=new |
      | Update property | status=old |
    Then the asset version is 4

  Scenario: Convert asset to frontmatter
    Given an existing asset with:
      | Field       | Value       |
      | Label       | Test Asset  |
      | Class       | ems__Task   |
      | Ontology    | ems         |
      | Description | Test desc   |
    And properties:
      | Property | Value  |
      | status   | active |
    When I convert the asset to frontmatter
    Then frontmatter contains "exo__Asset_uid"
    And frontmatter contains "exo__Asset_label" = "Test Asset"
    And frontmatter contains "exo__Instance_class" = "[[ems__Task]]"
    And frontmatter contains property "status" = "active"

  Scenario: Create asset from frontmatter
    Given frontmatter with:
      | Field                | Value                                |
      | exo__Asset_uid       | 550e8400-e29b-41d4-a716-446655440000 |
      | exo__Asset_label     | Imported Asset                       |
      | exo__Instance_class  | [[ems__Task]]                        |
      | exo__Asset_isDefinedBy | [[!ems]]                           |
      | exo__Asset_createdAt | 2025-01-01T00:00:00                  |
    When I create an asset from frontmatter
    Then the asset is created successfully
    And the asset title is "Imported Asset"
    And the asset class is "ems__Task"
