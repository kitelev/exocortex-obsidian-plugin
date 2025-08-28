# CreateAssetModal Property Display - BDD Feature Specifications
# Comprehensive behavior-driven testing for modal property functionality

Feature: Asset Creation Modal Property Display
  As a knowledge worker
  I want to see class properties when creating new assets  
  So that I can properly structure my semantic data

  Background:
    Given I have access to the Exocortex plugin
    And the property discovery service is available
    And I have a test vault with class and property definitions

  @smoke @property-display @critical
  Scenario: Modal displays properties for selected class
    Given I have a class "Person" with properties "name", "age", "email" via exo__Property_domain
    When I open the asset creation modal
    And I select "Person" as the asset class
    Then I should see property fields for "name", "age", and "email"
    And each property should have appropriate input types
    And property loading should complete within 200ms

  @property-updates @dynamic-behavior @critical
  Scenario: Modal updates properties when class changes
    Given I have classes "Person" and "Organization" with different properties
    When I open the asset creation modal
    And I initially select "Person" class
    And I change to "Organization" class
    Then the property fields should update to show Organization properties
    And Person properties should no longer be visible
    And the property update should complete within 200ms

  @edge-cases @graceful-degradation @high-priority
  Scenario: Modal handles class without properties
    Given I have a class "EmptyClass" with no exo__Property_domain relationships
    When I open the asset creation modal
    And I select "EmptyClass"
    Then I should see a message indicating no properties are available
    And the create button should still be functional

  @error-handling @resilience @high-priority
  Scenario: Modal handles property domain resolution failures
    Given I have a class with malformed property domain relationships
    When I open the asset creation modal
    And I select the problematic class
    Then I should see an error message about property loading
    And the modal should remain functional for other operations

  @inheritance @semantic-hierarchy @medium-priority
  Scenario: Modal displays inherited properties from class hierarchy
    Given I have a class "Employee" that inherits from "Person"
    And "Person" has properties "name", "email"
    And "Employee" has additional properties "employee_id", "department"
    When I open the asset creation modal
    And I select "Employee" as the asset class
    Then I should see all properties from both "Person" and "Employee" classes
    And inherited properties should be clearly marked
    And property hierarchy should be resolved correctly

  @performance @scalability @critical
  Scenario: Modal validates performance requirements with large property sets
    Given I have a class with 50+ properties
    When I open the modal and select the property-rich class
    Then property loading should complete within 2 seconds
    And memory usage should remain under performance thresholds
    And the UI should remain responsive during property loading

  @property-types @semantic-ranges @medium-priority
  Scenario: Modal handles different property types correctly
    Given I have a class "Product" with diverse property types:
      | Property     | Type            | Range           | Required |
      | name         | DatatypeProperty| string          | true     |
      | price        | DatatypeProperty| decimal         | true     |
      | category     | ObjectProperty  | ProductCategory | true     |
      | available    | DatatypeProperty| boolean         | false    |
      | launch_date  | DatatypeProperty| date            | false    |
      | tags         | DatatypeProperty| string[]        | false    |
    When I open the asset creation modal
    And I select "Product" as the asset class
    Then each property should render with the correct input type:
      | Property     | Input Type |
      | name         | text       |
      | price        | number     |
      | category     | dropdown   |
      | available    | toggle     |
      | launch_date  | date       |
      | tags         | textarea   |
    And validation should work correctly for each type

  @validation @form-behavior @medium-priority
  Scenario: Modal validates required properties before creation
    Given I have a class "Task" with required properties "title", "priority"
    And optional properties "description", "due_date"
    When I open the asset creation modal
    And I select "Task" as the asset class
    And I attempt to create without filling required properties
    Then I should see validation errors for missing required fields
    And the create button should remain disabled
    When I fill in all required properties
    Then the validation errors should clear
    And the create button should become enabled

  @caching @performance @medium-priority
  Scenario: Modal uses property caching for improved performance
    Given I have a class "CachedClass" with multiple properties
    When I open the asset creation modal for the first time
    And I select "CachedClass"
    Then properties should be loaded from the vault
    And the properties should be cached for future use
    When I close and reopen the modal
    And I select "CachedClass" again
    Then properties should load from cache
    And the loading should be faster than the initial load

  @semantic-validation @data-integrity @high-priority
  Scenario: Modal validates semantic property constraints
    Given I have a class "Person" with property "age" having range "integer"
    And the property has constraints "minimum: 0, maximum: 150"
    When I open the asset creation modal
    And I select "Person" as the asset class
    And I enter an invalid age value "-5"
    Then I should see a validation error about invalid age
    When I enter a valid age value "25"
    Then the validation error should clear
    And the property should be accepted

  @accessibility @user-experience @medium-priority
  Scenario: Modal property display supports accessibility
    Given I have a class "Document" with various properties
    When I open the asset creation modal with accessibility tools enabled
    And I select "Document" as the asset class
    Then all property fields should have proper labels
    And required fields should be announced correctly
    And keyboard navigation should work through all property fields
    And screen reader announcements should be clear and informative

  @regression-prevention @quality-assurance @critical
  Scenario: Modal prevents regression in property domain resolution
    Given I have the standard test classes with known property relationships
    When I run the complete property discovery test suite
    Then all property domain relationships should resolve correctly
    And no properties should be missing from their designated classes
    And no properties should appear in classes they don't belong to
    And performance should remain within established thresholds
    And no memory leaks should occur during repeated operations