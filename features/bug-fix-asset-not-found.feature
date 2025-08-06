Feature: Fix Asset Not Found Error in Inline Editing
  As a user editing asset properties
  I want to successfully save dropdown selections
  So that I can update object property references without errors

  Background:
    Given I have an asset "MyTask" with class "ems__Task"
    And I have property "ems__Task_assignee" with range "ems__Person"
    And I have assets of class "ems__Person":
      | name    | filename   |
      | Alice   | Alice.md   |
      | Bob     | Bob.md     |
    And I am viewing the asset "MyTask"

  @bug @critical
  Scenario: Editing object property via dropdown should save correctly
    Given the property "ems__Task_assignee" has value "[[Alice]]"
    When I click on the property value to edit
    And I select "Bob" from the dropdown
    And I save the changes
    Then the property should be updated to "[[Bob]]"
    And no error message should appear
    And the asset should be found and updated

  @bug @regression
  Scenario: Asset lookup should use correct identifier
    Given I am editing an inline property
    When I save a dropdown selection
    Then the system should look up the asset by filename
    Not by the display label
    And the asset should be found successfully

  @validation
  Scenario: Empty selection should be allowed for optional properties
    Given the property "ems__Task_assignee" is optional
    And it currently has value "[[Alice]]"
    When I click to edit the property
    And I select the empty option
    And I save the changes
    Then the property should be cleared
    And no error should occur

  @edge-case
  Scenario: Asset with special characters in name
    Given I have an asset "John O'Brien" with filename "John O'Brien.md"
    When I select this asset from dropdown
    And I save the changes
    Then the asset should be found correctly
    And the reference should be saved as "[[John O'Brien]]"

  @validation @required
  Scenario: Required property validation
    Given the property "ems__Task_assignee" is required
    And it currently has value "[[Alice]]"
    When I click to edit the property
    And I select the empty option
    And I try to save
    Then I should see validation error "This field is required"
    And the original value should remain

  @performance
  Scenario: Large dropdown lists should work correctly
    Given there are 100 assets of class "ems__Person"
    When I click to edit the property
    And I select any person from the dropdown
    And I save the changes
    Then the correct asset should be found
    And the update should complete within 500ms