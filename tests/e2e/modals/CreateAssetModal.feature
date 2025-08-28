# CreateAssetModal Property Display - E2E Feature Tests
# BDD scenarios for comprehensive modal property functionality testing

Feature: Asset Creation Modal Property Display
  As a knowledge worker
  I want to see class properties when creating new assets
  So that I can properly structure my semantic data

  Background:
    Given I have a clean Obsidian test environment
    And the Exocortex plugin is loaded and active
    And I have appropriate test data in the vault

  @smoke @property-display
  Scenario: Modal displays properties for selected class
    Given I have a class "Person" with properties "name", "age", "email" via exo__Property_domain
    When I open the asset creation modal
    And I select "Person" as the asset class
    Then I should see property fields for "name", "age", and "email"
    And each property should have appropriate input types
    And required properties should be marked with asterisks
    And property loading should complete within 200ms

  @property-updates @dynamic-behavior
  Scenario: Modal updates properties when class changes
    Given I have classes "Person" and "Organization" with different properties
    When I open the asset creation modal
    And I initially select "Person" class
    And I change to "Organization" class
    Then the property fields should update to show Organization properties
    And Person properties should no longer be visible
    And the property update should complete within 200ms

  @edge-cases @graceful-degradation
  Scenario: Modal handles class without properties
    Given I have a class "EmptyClass" with no exo__Property_domain relationships
    When I open the asset creation modal
    And I select "EmptyClass"
    Then I should see a message indicating no properties are available
    And the create button should still be functional
    And the modal should remain responsive

  @error-handling @resilience
  Scenario: Modal handles property domain resolution failures
    Given I have a class with malformed property domain relationships
    When I open the asset creation modal
    And I select the problematic class
    Then I should see an error message about property loading
    And the modal should remain functional for other operations
    And I should be able to still create an asset with basic information

  @docker-e2e @complete-workflow
  Scenario: Docker E2E validates complete modal workflow
    Given a clean Obsidian environment in Docker container
    And test ontology with known class-property relationships
    When I navigate to asset creation through UI
    And I interact with the modal through real browser automation
    Then property display should work end-to-end
    And asset creation should persist correct semantic relationships
    And the created asset should be accessible in the vault

  @performance @docker-e2e
  Scenario: Docker E2E validates performance requirements
    Given a Docker environment with performance monitoring
    And a class with 50+ properties
    When I open the modal and select the property-rich class
    Then property loading should complete within 2 seconds
    And memory usage should remain under performance thresholds
    And the UI should remain responsive during property loading

  @inheritance @semantic-hierarchy
  Scenario: Modal displays inherited properties from class hierarchy
    Given I have a class "Employee" that inherits from "Person"
    And "Person" has properties "name", "email"
    And "Employee" has additional properties "employee_id", "department"
    When I open the asset creation modal
    And I select "Employee" as the asset class
    Then I should see all properties from both "Person" and "Employee" classes
    And inherited properties should be clearly marked
    And property hierarchy should be resolved correctly

  @property-types @semantic-ranges
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

  @validation @form-behavior
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

  @accessibility @user-experience
  Scenario: Modal property display supports accessibility
    Given I have a class "Document" with various properties
    When I open the asset creation modal with accessibility tools enabled
    And I select "Document" as the asset class
    Then all property fields should have proper labels
    And required fields should be announced correctly
    And keyboard navigation should work through all property fields
    And screen reader announcements should be clear and informative

  @mobile @responsive-design
  Scenario: Modal property display works on mobile devices
    Given I am using a mobile device viewport
    And I have a class "Note" with multiple properties
    When I open the asset creation modal
    And I select "Note" as the asset class
    Then property fields should be optimized for touch interaction
    And the layout should be responsive and usable
    And scrolling should work smoothly through property fields
    And mobile-specific input types should be used where appropriate