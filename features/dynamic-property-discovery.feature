Feature: Dynamic Property Discovery Based on Class Selection
  As a knowledge worker using the Exocortex plugin
  I want the system to automatically discover and display relevant properties when I change the exo__Instance_class
  So that I can work with type-safe, ontology-driven metadata without manual configuration

  Background:
    Given the Exocortex plugin is installed and activated
    And the ontology is properly loaded with class definitions
    And I have access to notes with frontmatter properties

  @core-functionality @automatic-discovery
  Scenario: Properties update automatically when class changes
    Given I have a note with exo__Instance_class set to "ems__Task"
    And the note displays task-specific properties
    When I change exo__Instance_class to "ems__Area" in the frontmatter
    Then the displayed properties should update to show area-specific properties
    And task-specific properties should be hidden or marked as not applicable
    And the property form should refresh automatically

  @property-inheritance @hierarchical-ontology
  Scenario: Display inherited properties from parent classes
    Given I set exo__Instance_class to "ems__Task"
    When the properties are discovered
    Then I should see properties inherited from "ems__Asset":
      | Property | Type | Source |
      | exo__Instance_name | text | ems__Asset |
      | exo__Instance_description | text | ems__Asset |
      | exo__Instance_created_date | date | ems__Asset |
    And I should see properties specific to "ems__Task":
      | Property | Type | Source |
      | ems__Task_status | select | ems__Task |
      | ems__Task_priority | select | ems__Task |
      | ems__Task_due_date | date | ems__Task |

  @property-types @validation-rules
  Scenario: Discover property types and validation constraints
    Given I set exo__Instance_class to "ems__Task"
    When properties are discovered for the task
    Then each property should have correct type information:
      | Property | Data Type | Validation |
      | ems__Task_status | enum | ['open', 'in-progress', 'completed', 'blocked'] |
      | ems__Task_priority | enum | ['low', 'medium', 'high', 'urgent'] |
      | ems__Task_due_date | date | ISO 8601 format |
      | ems__Task_estimated_hours | number | positive integer |
    And validation rules should be enforced in the UI

  @relationship-properties @object-properties
  Scenario: Discover relationship properties to other assets
    Given I set exo__Instance_class to "ems__Task"
    When relationship properties are discovered
    Then I should see object properties like:
      | Property | Range | Cardinality |
      | ems__Task_assigned_to | ems__Person | 0..1 |
      | ems__Task_depends_on | ems__Task | 0..* |
      | ems__Task_part_of | ems__Project | 0..1 |
    And these should be rendered as appropriate UI controls (dropdowns, multi-select, etc.)

  @real-time-updates @reactive-interface
  Scenario: Properties update in real-time as class changes
    Given I have the property editor open for a note
    And I can see task-specific properties
    When I change exo__Instance_class from "ems__Task" to "ems__Project" using the dropdown
    Then the property list should update immediately
    And I should see project-specific properties:
      | Property | Type |
      | ems__Project_start_date | date |
      | ems__Project_end_date | date |
      | ems__Project_budget | number |
      | ems__Project_status | enum |
    And the interface should not require a page refresh

  @data-preservation @value-migration
  Scenario: Preserve compatible property values during class changes
    Given I have a note with exo__Instance_class "ems__Task"
    And the note has these property values:
      | Property | Value |
      | exo__Instance_name | "Review quarterly goals" |
      | exo__Instance_description | "Analyze Q4 performance" |
      | ems__Task_priority | "high" |
    When I change exo__Instance_class to "ems__Project"
    Then compatible properties should be preserved:
      | Property | Value |
      | exo__Instance_name | "Review quarterly goals" |
      | exo__Instance_description | "Analyze Q4 performance" |
    And task-specific properties should be removed or marked as deprecated
    And new project-specific properties should appear with default values

  @property-groups @organized-display
  Scenario: Properties are organized by semantic groups
    Given I set exo__Instance_class to "ems__Task"
    When properties are discovered and displayed
    Then properties should be grouped logically:
      | Group | Properties |
      | Basic Information | exo__Instance_name, exo__Instance_description |
      | Task Management | ems__Task_status, ems__Task_priority |
      | Scheduling | ems__Task_due_date, ems__Task_estimated_hours |
      | Relationships | ems__Task_assigned_to, ems__Task_depends_on |
    And each group should have a clear heading
    And groups should be collapsible for better UX

  @ontology-validation @data-integrity
  Scenario: Validate property values against ontology constraints
    Given I set exo__Instance_class to "ems__Task"
    And I enter "invalid_status" for ems__Task_status
    When the property is validated
    Then the system should display a validation error
    And suggest valid values: ['open', 'in-progress', 'completed', 'blocked']
    And prevent saving until the value is corrected

  @multi-inheritance @complex-hierarchies
  Scenario: Handle properties from multiple inheritance paths
    Given a class "ems__LeadershipTask" that inherits from both "ems__Task" and "ems__LeadershipActivity"
    When I set exo__Instance_class to "ems__LeadershipTask"
    Then I should see properties from all parent classes:
      | Source Class | Properties |
      | ems__Asset | exo__Instance_name, exo__Instance_description |
      | ems__Task | ems__Task_status, ems__Task_priority |
      | ems__LeadershipActivity | ems__Leadership_team_members, ems__Leadership_impact_area |
    And there should be no duplicate properties
    And property precedence should be clearly defined

  @performance @efficient-loading
  Scenario: Property discovery performs efficiently for large ontologies
    Given an ontology with 100+ classes and 500+ properties
    When I change exo__Instance_class
    Then property discovery should complete within 100ms
    And only relevant properties should be loaded
    And the UI should remain responsive during discovery

  @caching @optimization
  Scenario: Property definitions are cached for performance
    Given I have discovered properties for "ems__Task"
    When I navigate to another note and select "ems__Task" again
    Then the property definitions should load from cache
    And the loading time should be significantly reduced
    And the cache should invalidate when the ontology is updated

  @error-handling @unknown-classes
  Scenario: Handle unknown or invalid class names gracefully
    Given I set exo__Instance_class to "unknown__InvalidClass"
    When property discovery is attempted
    Then the system should display a friendly error message
    And suggest similar valid class names
    And fall back to displaying basic Asset properties
    And log the error for debugging purposes

  @property-constraints @business-rules
  Scenario: Apply business rule constraints to properties
    Given I set exo__Instance_class to "ems__Project"
    And I enter a start date of "2024-06-01"
    When I enter an end date of "2024-05-01" (before start date)
    Then the system should validate the date relationship
    And display an error: "End date cannot be before start date"
    And prevent saving until the constraint is satisfied

  @internationalization @localization
  Scenario: Property labels and descriptions support multiple languages
    Given the system is configured for Spanish locale
    And I set exo__Instance_class to "ems__Task"
    When properties are discovered
    Then property labels should be displayed in Spanish:
      | English Label | Spanish Label |
      | Task Status | Estado de la Tarea |
      | Priority | Prioridad |
      | Due Date | Fecha de Vencimiento |
    And validation messages should also be localized

  @api-integration @programmatic-access
  Scenario: Property discovery is accessible via plugin API
    Given I am developing a custom extension
    When I call the property discovery API for "ems__Task"
    Then I should receive a structured response with:
      | Field | Content |
      | class_name | "ems__Task" |
      | parent_classes | ["ems__Asset"] |
      | properties | Array of property definitions |
      | relationships | Array of object property definitions |
    And the API should support filtering and pagination

  @version-compatibility @schema-evolution
  Scenario: Handle ontology version changes gracefully
    Given I have notes created with ontology v1.0
    And the ontology is updated to v1.1 with new properties
    When I open an existing note
    Then existing properties should remain valid
    And new properties should be available for use
    And deprecated properties should be marked but not removed
    And migration suggestions should be provided for outdated properties