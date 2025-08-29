# CreateAssetModal Class Switching Bug Fix - BDD Feature Specifications
# Critical UX bug: Property fields fail to update when users select different classes

Feature: Asset Creation Modal Class Switching Behavior
  As a knowledge worker
  I want property fields to update correctly when I switch between classes
  So that I can create assets with the correct properties for each class

  Background:
    Given I have access to the Exocortex plugin
    And the property discovery service is available
    And I have a test vault with multiple classes and their properties

  @critical @bug-fix @state-management
  Scenario: Property fields update immediately when switching classes
    Given I have a "Person" class with properties "firstName", "lastName", "email"
    And I have an "Organization" class with properties "orgName", "industry", "size"
    When I open the asset creation modal
    And I select "Person" as the initial class
    Then I should see property fields for "firstName", "lastName", "email"
    When I switch to "Organization" class
    Then the property fields should clear within 50ms
    And new property fields for "orgName", "industry", "size" should appear
    And the old "Person" property fields should be completely removed from DOM
    And the property values should be cleared
    And the update should complete within 100ms

  @critical @state-cleanup @memory-management
  Scenario: Property values are properly cleared when switching classes
    Given I have a "Task" class with properties "title", "priority", "dueDate"
    And I have a "Document" class with properties "docTitle", "author", "version"
    When I open the asset creation modal
    And I select "Task" class
    And I enter "Fix bug" in the "title" field
    And I enter "High" in the "priority" field
    When I switch to "Document" class
    Then the property values Map should be empty
    And the "title" value "Fix bug" should not persist
    And the "priority" value "High" should not persist
    And new fields should be ready for input

  @critical @event-handling @performance
  Scenario: Rapid class switching maintains correct state
    Given I have classes "ClassA", "ClassB", "ClassC" with different properties
    When I open the asset creation modal
    And I rapidly switch between classes in sequence:
      | from    | to      | time_ms |
      | ClassA  | ClassB  | 50      |
      | ClassB  | ClassC  | 50      |
      | ClassC  | ClassA  | 50      |
    Then each switch should complete successfully
    And the final state should show only "ClassA" properties
    And no properties from "ClassB" or "ClassC" should be visible
    And there should be no DOM leaks or orphaned elements
    And total execution time should be under 300ms

  @critical @cache-invalidation @data-integrity
  Scenario: Property cache is properly invalidated on class switch
    Given I have a "Product" class with cached properties
    When I open the asset creation modal
    And I select "Product" class (loads from cache)
    And I switch to another class
    And I switch back to "Product" class
    Then the properties should reload correctly
    And any stale cache data should be refreshed
    And the property discovery should use fresh data

  @critical @async-handling @race-conditions
  Scenario: Async property loading handles class switches correctly
    Given I have a "ComplexClass" with slow-loading properties
    When I open the asset creation modal
    And I select "ComplexClass" (triggers async load)
    And I immediately switch to "SimpleClass" before load completes
    Then the "ComplexClass" property load should be cancelled
    And only "SimpleClass" properties should be displayed
    And there should be no race condition errors
    And the UI should remain responsive

  @critical @dom-manipulation @cross-browser
  Scenario: DOM cleanup works across different browsers
    Given I am testing in "<browser>"
    When I open the asset creation modal
    And I select "TestClass1" with 10 properties
    And I switch to "TestClass2" with 5 properties
    Then the DOM should have exactly 5 property fields
    And no orphaned event listeners should remain
    And memory usage should not increase with repeated switches
    Examples:
      | browser |
      | Chrome  |
      | Firefox |
      | Safari  |
      | Edge    |

  @critical @validation @form-state
  Scenario: Required field validation resets on class switch
    Given I have a "RequiredClass" with required property "mandatoryField"
    And I have an "OptionalClass" with no required properties
    When I open the asset creation modal
    And I select "RequiredClass"
    Then the create button should be disabled (missing required field)
    When I switch to "OptionalClass"
    Then the create button should be enabled
    And no validation errors should persist

  @critical @object-properties @dropdown-state
  Scenario: ObjectProperty dropdowns update correctly on class switch
    Given I have a "Manager" class with ObjectProperty "reportsTo" of type "Person"
    And I have a "Project" class with ObjectProperty "owner" of type "Organization"
    When I open the asset creation modal
    And I select "Manager" class
    Then the "reportsTo" dropdown should show Person instances
    When I switch to "Project" class
    Then the "owner" dropdown should show Organization instances
    And the Person instances should no longer be available

  @critical @performance-monitoring @metrics
  Scenario: Property update performance stays within thresholds
    Given performance monitoring is enabled
    When I perform 100 class switches in the modal
    Then the average switch time should be under 100ms
    And the 95th percentile should be under 150ms
    And the maximum switch time should be under 200ms
    And no memory leaks should be detected

  @critical @error-recovery @resilience
  Scenario: Modal recovers from property loading errors
    Given I have a "FaultyClass" that causes property loading errors
    When I open the asset creation modal
    And I select "FaultyClass" (triggers error)
    Then an error message should be displayed
    When I switch to a valid class
    Then the modal should recover and show correct properties
    And the error state should be cleared
    And the modal should remain functional