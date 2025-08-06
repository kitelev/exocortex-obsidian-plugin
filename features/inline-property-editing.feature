# language: en
Feature: Inline Property Editing in Asset Views
  As a user viewing assets in Exocortex
  I want to edit property values directly in the asset view
  So that I can quickly update information without opening modals

  Background:
    Given I have the Exocortex plugin installed
    And I have an asset "Project Alpha" of class "ems__Project"
    And the class "ems__Project" has the following properties:
      | Property Name | Type | Range | Required |
      | ems__Project_status | DatatypeProperty | enum:planning,active,completed | true |
      | ems__Project_owner | ObjectProperty | ems__Person | true |
      | ems__Project_startDate | DatatypeProperty | date | false |
      | ems__Project_budget | DatatypeProperty | number | false |
      | ems__Project_tags | DatatypeProperty | array | false |
    And I have assets of class "ems__Person":
      | Asset Name | Label |
      | John Doe | John Doe |
      | Jane Smith | Jane Smith |

  @smoke @edit-mode
  Scenario: Enter edit mode for a property
    Given I am viewing the asset "Project Alpha"
    And the property "ems__Project_status" has value "planning"
    When I click on the value of property "ems__Project_status"
    Then the property value should become editable
    And I should see a dropdown with options "planning", "active", "completed"
    And the current value "planning" should be selected

  @functional @save-changes
  Scenario: Save changes to a property
    Given I am viewing the asset "Project Alpha"
    And I have clicked on the property "ems__Project_status" value
    When I select "active" from the dropdown
    And I press Enter key
    Then the property value should show "active"
    And the value should be saved to the asset file
    And the edit mode should be exited

  @functional @object-property
  Scenario: Edit object property with dropdown
    Given I am viewing the asset "Project Alpha"
    And the property "ems__Project_owner" has value "[[John Doe]]"
    When I click on the property value
    Then I should see a dropdown with assets of class "ems__Person"
    And the dropdown should contain "John Doe" and "Jane Smith"
    When I select "Jane Smith"
    And I press Enter key
    Then the property value should show "[[Jane Smith]]"

  @functional @date-property
  Scenario: Edit date property
    Given I am viewing the asset "Project Alpha"
    When I click on the property "ems__Project_startDate" value
    Then I should see a date input control
    When I select the date "2025-09-01"
    And I click outside the input
    Then the property value should show "2025-09-01"
    And the value should be auto-saved

  @functional @number-property
  Scenario: Edit number property with validation
    Given I am viewing the asset "Project Alpha"
    When I click on the property "ems__Project_budget" value
    Then I should see a number input control
    When I type "not a number"
    Then I should see a validation error "Must be a valid number"
    When I type "50000"
    And I press Tab key
    Then the property value should show "50000"
    And focus should move to the next property

  @functional @array-property
  Scenario: Edit array property
    Given I am viewing the asset "Project Alpha"
    And the property "ems__Project_tags" has values ["urgent", "frontend"]
    When I click on the property value
    Then I should see an array editor with existing values
    And I should see an "Add item" button
    When I click "Add item"
    And I type "backend"
    And I press Enter
    Then the property should have values ["urgent", "frontend", "backend"]

  @functional @keyboard-navigation
  Scenario: Navigate properties with keyboard
    Given I am viewing the asset "Project Alpha"
    And I have clicked on the first property value
    When I press Tab key
    Then focus should move to the next property
    And the first property changes should be saved
    When I press Shift+Tab
    Then focus should move to the previous property
    When I press Escape key
    Then edit mode should be cancelled without saving

  @functional @validation
  Scenario: Required property validation
    Given I am viewing the asset "Project Alpha"
    And the property "ems__Project_owner" is required
    When I click on the property value
    And I clear the selection
    And I try to save
    Then I should see validation error "This field is required"
    And the save should be prevented

  @functional @auto-save
  Scenario: Auto-save after inactivity
    Given I am viewing the asset "Project Alpha"
    And I have clicked on a text property
    When I type "New value"
    And I wait for 500ms without typing
    Then the value should be automatically saved
    And I should see a brief "Saved" indicator

  @edge-case @concurrent-edit
  Scenario: Handle concurrent edits
    Given I am viewing the asset "Project Alpha"
    And another user is also viewing the same asset
    When I edit the property "ems__Project_status" to "active"
    And the other user edits the same property to "completed"
    Then I should see a conflict warning
    And I should be able to choose which value to keep

  @accessibility @screen-reader
  Scenario: Screen reader support
    Given I am using a screen reader
    And I am viewing the asset "Project Alpha"
    When I navigate to a property
    Then I should hear the property name and current value
    When I press Enter to edit
    Then I should hear "Editing [property name]"
    When I make changes and save
    Then I should hear "Property updated"

  @performance @many-properties
  Scenario: Performance with many properties
    Given I am viewing an asset with 50+ properties
    When I click on any property value
    Then the edit control should appear within 100ms
    And scrolling should remain smooth
    When I save changes
    Then the save should complete within 500ms

  @functional @undo-redo
  Scenario: Undo and redo property changes
    Given I am viewing the asset "Project Alpha"
    And I have edited the property "ems__Project_status" from "planning" to "active"
    When I press Ctrl+Z (or Cmd+Z on Mac)
    Then the property value should revert to "planning"
    When I press Ctrl+Shift+Z (or Cmd+Shift+Z on Mac)
    Then the property value should return to "active"