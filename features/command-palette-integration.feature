Feature: Command Palette Integration for Asset Creation
  As a knowledge worker using Obsidian with the Exocortex plugin
  I want to access asset creation commands through the Obsidian Command Palette
  So that I can quickly create new assets without navigating through menus

  Background:
    Given the Exocortex plugin is installed and activated
    And the AssetCommandController is properly registered
    And the Command Palette is accessible via Ctrl+P (Cmd+P on Mac)

  @core-functionality @command-discovery
  Scenario: Create Asset command appears in Command Palette
    When I open the Command Palette
    And I type "Create Asset"
    Then I should see "Exocortex: Create Asset" in the command list
    And the command should be selectable

  @modal-integration @user-interface
  Scenario: Create Asset command opens asset creation modal
    Given I am in any note file
    When I execute "Exocortex: Create Asset" from the Command Palette
    Then the CreateAssetModal should open
    And the modal should display available asset types
    And the modal should have a cancel option

  @context-awareness @intelligent-defaults
  Scenario: Command considers current note context for asset creation
    Given I am in a note with exo__Instance_class set to "ems__Area"
    When I execute "Exocortex: Create Asset" command
    Then the asset creation modal should suggest appropriate child types
    And "ems__Task" should be pre-selected or highlighted
    And the parent relationship should be automatically configured

  @asset-type-selection @comprehensive-coverage
  Scenario: Modal displays all available asset types from ontology
    When I open the Create Asset modal
    Then I should see the following asset types:
      | Asset Type | Description |
      | ems__Task | A work item or action to be completed |
      | ems__Area | A sphere of responsibility or focus area |
      | ems__Project | A collection of related tasks with an outcome |
      | ems__Resource | Information or tools needed for work |
    And each type should have a clear description
    And each type should be selectable

  @form-validation @data-integrity
  Scenario: Asset creation form validates required fields
    Given I have opened the Create Asset modal
    And I select "ems__Task" as the asset type
    When I try to create the asset without providing a name
    Then the form should display validation errors
    And the asset should not be created
    And focus should return to the name field

  @dynamic-properties @class-based-configuration
  Scenario: Form displays class-specific properties dynamically
    Given I have opened the Create Asset modal
    When I select "ems__Task" as the asset type
    Then the form should display task-specific properties:
      | Property | Type | Required |
      | exo__Instance_name | text | yes |
      | ems__Task_status | select | no |
      | ems__Task_priority | select | no |
      | ems__Task_due_date | date | no |
    And property validation should match the ontology definitions

  @property-inheritance @hierarchical-relationships
  Scenario: Properties are inherited from parent classes
    Given I select "ems__Task" which inherits from "ems__Asset"
    When the property form is displayed
    Then I should see inherited properties from ems__Asset
    And I should see specific properties from ems__Task
    And the property hierarchy should be clearly indicated

  @file-creation @workspace-integration
  Scenario: Successfully creating an asset generates proper file
    Given I have opened the Create Asset modal
    And I select "ems__Task" as the asset type
    And I enter "Review quarterly goals" as the asset name
    And I set ems__Task_priority to "high"
    When I click "Create Asset"
    Then a new file should be created with proper naming convention
    And the file should contain correct frontmatter with:
      | Property | Value |
      | exo__Instance_class | ems__Task |
      | exo__Instance_name | Review quarterly goals |
      | ems__Task_priority | high |
    And the file should open in the active editor

  @parent-child-relationships @automatic-linking
  Scenario: Create child asset with automatic parent linking
    Given I am in a note representing an ems__Area asset
    When I create a new ems__Task through the Command Palette
    Then the new task should automatically link to the current area as parent
    And the parent area should be updated to reference the new child

  @keyboard-shortcuts @accessibility
  Scenario: Command Palette integration supports keyboard navigation
    Given the Command Palette is open
    When I type "create asset"
    And I press Enter to select the command
    Then the Create Asset modal should open
    And I should be able to navigate the form using Tab key
    And I should be able to create the asset using Enter key

  @error-handling @resilient-operation
  Scenario: Handle file creation errors gracefully
    Given I have opened the Create Asset modal and filled in valid data
    And there is a file system permission issue
    When I attempt to create the asset
    Then an appropriate error message should be displayed
    And the modal should remain open with data preserved
    And the user should be able to retry or cancel

  @search-integration @command-discovery
  Scenario: Command appears in fuzzy search results
    When I open the Command Palette
    And I type partial text like "create"
    Then "Exocortex: Create Asset" should appear in fuzzy search results
    And typing "asset" should also find the command
    And typing "exo" should find Exocortex-related commands

  @multi-workspace @context-preservation
  Scenario: Command works across different workspace configurations
    Given I have multiple workspace tabs open
    When I execute the Create Asset command from any tab
    Then the command should work correctly regardless of the active tab
    And the created asset should be placed appropriately based on context

  @template-integration @content-generation
  Scenario: Created assets use appropriate templates
    Given there are templates configured for different asset types
    When I create an ems__Task asset
    Then the new file should be populated with the ems__Task template content
    And template variables should be properly substituted
    And the template structure should be preserved

  @undo-redo @operation-reversibility
  Scenario: Asset creation supports undo operations
    When I create an asset through the Command Palette
    And I immediately press Ctrl+Z (Cmd+Z on Mac)
    Then the file creation should be undone
    And the workspace should return to its previous state

  @batch-operations @efficiency
  Scenario: Support for creating multiple assets quickly
    Given I have created one asset successfully
    When I execute the Create Asset command again
    Then the modal should open with the same asset type pre-selected
    And previous form values should be cleared for new input
    And I should be able to create multiple assets in succession

  @integration-testing @end-to-end
  Scenario: Complete workflow from Command Palette to file opening
    Given I start with the Command Palette closed
    When I press Ctrl+P to open Command Palette
    And I type "create asset" and select the command
    And I choose "ems__Project" as the asset type
    And I fill in the project details
    And I click Create
    Then a new project file should be created and opened
    And the file should be properly formatted
    And the Command Palette should be closed
    And I should be editing the new file