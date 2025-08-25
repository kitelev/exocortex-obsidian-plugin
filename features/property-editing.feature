@property-editing @ui-workflow
Feature: Property Editing Workflow
  As a user working with assets
  I want to edit properties inline and through modals
  So that I can update my knowledge base efficiently

  Background:
    Given the Exocortex plugin is loaded
    And I have an existing asset "Sample Project"
    And the asset has the following properties:
      | property      | value           |
      | class         | ems__Project    |
      | status        | active          |
      | priority      | medium          |
      | description   | Sample project  |

  @smoke @inline-editing
  Scenario: Inline property editing success
    Given I am viewing the asset page
    And the property renderer is active
    When I click on the "priority" property
    Then an inline editor should appear
    When I change the value to "high"
    And I press Enter to confirm
    Then the property should be updated to "high"
    And the change should be persisted to frontmatter
    And the graph index should be updated

  @validation @data-integrity
  Scenario: Property validation during editing
    Given I am editing the "priority" property
    When I enter an invalid value "invalid_priority"
    And I attempt to save the change
    Then the system should reject the invalid value
    And a validation error should be displayed
    And the original value should be preserved
    And no changes should be persisted

  @modal-editing @complex-properties
  Scenario: Editing complex properties through modal
    Given I need to edit multiple properties at once
    When I open the property editing modal
    Then I should see all editable properties
    When I update multiple properties:
      | property      | new_value              |
      | priority      | high                   |
      | description   | Updated description    |
      | tags          | important, urgent      |
    And I click "Save Changes"
    Then all properties should be updated atomically
    And the asset should reflect all changes
    And the change should be recorded in the history

  @undo-redo @user-experience
  Scenario: Property editing with undo/redo support
    Given I have made several property changes
    When I edit "priority" from "medium" to "high"
    And I edit "status" from "active" to "completed"
    Then I should be able to undo the last change
    When I press Ctrl+Z
    Then "status" should revert to "active"
    And "priority" should remain "high"
    When I press Ctrl+Y
    Then "status" should become "completed" again

  @performance @responsive-editing
  Scenario: Property editing performance requirements
    Given I have an asset with many properties
    When I initiate inline editing
    Then the editor should appear within 100ms
    When I make changes to the property
    Then the validation should occur within 50ms
    When I save the changes
    Then the persistence should complete within 200ms

  @concurrent-editing @conflict-resolution
  Scenario: Handling concurrent property edits
    Given multiple users are editing the same asset
    When User A changes "priority" to "high"
    And User B simultaneously changes "priority" to "critical"
    And both users save their changes
    Then the system should detect the conflict
    And present a conflict resolution dialog
    And allow the user to choose the final value
    And preserve both change histories

  @accessibility @inclusive-design
  Scenario: Property editing accessibility
    Given I am using screen reader technology
    When I navigate to a property field
    Then the property should be announced clearly
    When I activate inline editing with keyboard
    Then the editor should be keyboard accessible
    And I should be able to navigate with Tab/Shift+Tab
    And changes should be announced to assistive technology

  @error-recovery @robustness
  Scenario: Recovery from editing failures
    Given I am editing a property
    When a network error occurs during save
    Then the system should preserve my changes locally
    And display a "save pending" indicator
    When the connection is restored
    Then the system should automatically retry saving
    And notify me of successful save
    Or prompt for manual retry if automatic save fails

  @batch-editing @efficiency
  Scenario: Batch property editing across multiple assets
    Given I have selected multiple assets of the same class
    When I choose "Batch Edit Properties"
    Then I should see only properties common to all assets
    When I update shared properties:
      | property  | new_value  |
      | priority  | high       |
      | status    | reviewed   |
    And I apply the changes
    Then all selected assets should be updated
    And the changes should be atomic across all assets
    And individual asset histories should be preserved