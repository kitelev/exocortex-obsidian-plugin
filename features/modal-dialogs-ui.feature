@ui @modals @dialogs @mobile-friendly
Feature: Modal Dialogs and User Interface
  As a user of the Exocortex plugin
  I want intuitive and responsive modal dialogs
  So that I can efficiently create, edit, and manage content across all devices

  Background:
    Given the Exocortex plugin is installed and activated
    And I have permissions to create and modify content

  @modals @class-tree-modal @navigation
  Scenario: Class Tree Modal Functionality
    Given I need to select a class from the ontology
    When I open the Class Tree Modal
    Then I should see a hierarchical tree of available classes
    And I should be able to expand and collapse class nodes
    And the current selection should be highlighted
    And I should be able to search within the class tree
    When I select a class from the tree
    Then the modal should close automatically
    And the selected class should be applied to the context
    And the class hierarchy should remain navigable

  @modals @create-asset-modal @content-creation
  Scenario: Create Asset Modal Complete Workflow
    Given I want to create a new asset
    When I open the Create Asset Modal
    Then I should see fields for asset name and class selection
    And the class selector should integrate with the Class Tree Modal
    And form validation should prevent invalid submissions
    When I enter a valid asset name
    And I select an appropriate class
    And I click "Create Asset"
    Then a new asset file should be created
    And the asset should have proper frontmatter
    And I should be navigated to the new asset

  @modals @effort-search-modal @task-management
  Scenario: Effort Search Modal for Task Assignment
    Given I am working with task management features
    When I open the Effort Search Modal
    Then I should see a searchable list of available efforts
    And I should be able to filter efforts by various criteria
    And efforts should display relevant metadata
    When I search for specific efforts
    Then results should update dynamically
    When I select an effort
    Then it should be associated with the current context appropriately

  @modals @rdf-export-modal @data-management
  Scenario: RDF Export Modal Functionality
    Given I want to export RDF data
    When I open the RDF Export Modal
    Then I should see options for export format and scope
    And I should be able to select specific ontologies or data sets
    And preview functionality should show what will be exported
    When I configure export settings
    And I initiate the export
    Then the RDF data should be generated correctly
    And I should receive the exported file
    And the modal should provide completion feedback

  @modals @rdf-import-modal @data-integration
  Scenario: RDF Import Modal Data Integration
    Given I want to import RDF data into the system
    When I open the RDF Import Modal
    Then I should be able to select RDF files for import
    And I should see validation of the RDF format
    And preview of the data structure should be available
    When I upload a valid RDF file
    Then the system should parse and validate the content
    And conflicts with existing data should be identified
    When I confirm the import
    Then the RDF data should be integrated properly
    And new assets should be created as needed

  @modals @mobile-optimization @responsive-design
  Scenario: Mobile-Optimized Modal Behavior
    Given I am using a mobile device
    When I open any modal dialog
    Then the modal should occupy an appropriate portion of the screen
    And the modal should respect safe areas (iOS)
    And scrolling should work properly within the modal
    And close buttons should be easily accessible
    When I interact with modal content
    Then touch targets should be appropriately sized
    And form inputs should work well with mobile keyboards

  @modals @keyboard-navigation @accessibility
  Scenario: Keyboard Navigation and Accessibility in Modals
    Given I am using keyboard-only navigation
    When I open a modal dialog
    Then focus should be trapped within the modal
    And I should be able to navigate all interactive elements
    And the Escape key should close the modal
    When I use screen reader software
    Then modal content should be properly announced
    And the modal's purpose should be clear
    And navigation should be logical and predictable

  @modals @form-validation @user-experience
  Scenario: Form Validation and Error Handling in Modals
    Given I am filling out forms in modal dialogs
    When I enter invalid data
    Then validation errors should appear immediately
    And error messages should be clear and actionable
    And invalid fields should be clearly marked
    When I correct validation errors
    Then error states should clear immediately
    When I attempt to submit with invalid data
    Then submission should be prevented with clear feedback

  @modals @modal-stacking @complex-workflows
  Scenario: Modal Stacking and Complex Workflows
    Given I am working with complex workflows that require multiple modals
    When I open a modal from within another modal
    Then the modal stack should be managed properly
    And background modals should be appropriately dimmed
    And I should be able to navigate back through the stack
    When I close a modal in the stack
    Then focus should return to the previous modal appropriately
    And the workflow should continue seamlessly

  @modals @data-persistence @draft-saving
  Scenario: Modal Data Persistence and Draft Saving
    Given I am working with content in a modal
    When I partially complete a form
    And I accidentally close the modal
    Then my progress should be preserved
    When I reopen the same modal
    Then my previous input should be restored
    When I explicitly save a draft
    Then the draft should be stored reliably
    And I should be able to resume from drafts later

  @modals @performance @loading-states
  Scenario: Modal Performance and Loading States
    Given I am working with modals that load dynamic content
    When a modal opens with data that takes time to load
    Then appropriate loading indicators should be shown
    And the modal should remain responsive during loading
    When data loading fails
    Then appropriate error states should be displayed
    And recovery options should be provided
    When modals contain large amounts of data
    Then virtual scrolling or pagination should be used for performance

  @modals @customization @theming
  Scenario: Modal Customization and Theming
    Given I am using Obsidian with custom themes
    When modals are displayed
    Then they should respect the current theme
    And colors and styling should be consistent
    And readability should be maintained across themes
    When I have custom CSS
    Then modal styling should be appropriately customizable
    And plugin functionality should remain intact

  @modals @multi-step-workflows @wizards
  Scenario: Multi-Step Modal Workflows and Wizards
    Given I am working with complex creation workflows
    When I start a multi-step modal process
    Then progress should be clearly indicated
    And I should be able to navigate between steps
    And previously entered data should be preserved
    When I need to go back to previous steps
    Then navigation should work smoothly
    When I complete all steps
    Then the entire workflow should execute properly

  @modals @context-awareness @intelligent-defaults
  Scenario: Context-Aware Modal Behavior and Intelligent Defaults
    Given I am working in specific contexts within the plugin
    When I open modals
    Then default values should be contextually appropriate
    And relevant options should be pre-selected when possible
    And the modal should understand my current workspace
    When I am creating child assets
    Then parent relationships should be automatically configured
    When I am working with specific ontologies
    Then class selections should be filtered appropriately

  @modals @error-recovery @resilience
  Scenario: Modal Error Recovery and System Resilience
    Given I am using modals for important operations
    When network errors occur during modal operations
    Then appropriate error messages should be displayed
    And retry options should be provided
    And data should not be lost unnecessarily
    When system errors occur
    Then modals should degrade gracefully
    And core functionality should remain available
    When recovering from errors
    Then the system should return to a consistent state

  @modals @cross-platform @consistency
  Scenario: Cross-Platform Modal Consistency
    Given I use the plugin across different devices and platforms
    When I open modals on different platforms
    Then core functionality should be identical
    And user experience should be consistent
    And data should sync properly across devices
    When platform-specific optimizations are applied
    Then they should enhance rather than change the basic experience
    And all platforms should support the same feature set