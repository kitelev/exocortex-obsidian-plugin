@ui @buttons @commands @interactions
Feature: Button Commands and UI Button System
  As a user of the Exocortex plugin
  I want to interact with intuitive button interfaces
  So that I can efficiently execute commands and navigate the knowledge system

  Background:
    Given the Exocortex plugin is installed and activated
    And I have access to the button command system

  @buttons @ui-buttons @happy-path
  Scenario: Basic UI Button Functionality
    Given I am viewing an asset page with UI buttons
    When I see UI buttons for various actions
    Then each button should display a clear label or icon
    And buttons should have consistent styling
    And hover states should provide visual feedback
    When I click a UI button
    Then the corresponding action should execute immediately
    And I should receive appropriate feedback

  @buttons @button-commands @execution
  Scenario: Button Command Execution
    Given I have configured button commands for specific actions
    When I click on a button command
    Then the underlying command should execute correctly
    And the execution should be logged appropriately
    And any errors should be handled gracefully
    When the command completes successfully
    Then I should see confirmation of the action
    And the UI should update to reflect changes

  @buttons @create-child-task @hierarchical
  Scenario: Create Child Task Button Functionality
    Given I am viewing a project or task asset
    And I see a "Create Child Task" button
    When I click the "Create Child Task" button
    Then a modal should open to create a new task
    And the new task should be automatically linked as a child
    And the parent-child relationship should be established
    When I save the new child task
    Then it should appear in the children list
    And the relationships should be properly indexed

  @buttons @child-zone-creation @ems-area
  Scenario: EMS Area Child Zone Creation Buttons
    Given I am viewing an ems__Area asset
    And I see child zone creation buttons
    When I click on a "Create Child Zone" button
    Then a modal should open for creating a new zone
    And the zone type should be pre-selected appropriately
    And the parent-child hierarchy should be maintained
    When I create the child zone
    Then it should be linked to the parent area automatically
    And the hierarchical structure should be preserved

  @buttons @class-selector @ontology-aware
  Scenario: Class Selector Button Integration
    Given I am creating or editing an asset
    And I need to select a class from the ontology
    When I click on the class selector button
    Then the ClassTreeModal should open
    And I should see the hierarchical class structure
    And I should be able to navigate the class tree
    When I select a class from the tree
    Then the button should update to show the selected class
    And the asset's class property should be set accordingly

  @buttons @dynamic-rendering @context-aware
  Scenario: Dynamic Button Rendering Based on Context
    Given I am viewing different types of assets
    When I view a task asset
    Then task-specific buttons should be rendered
    And buttons should reflect the task's current state
    When I view a project asset
    Then project-specific buttons should be rendered
    And child creation buttons should be available
    When I view a generic asset
    Then only universally applicable buttons should show

  @buttons @button-groups @organization
  Scenario: Button Grouping and Organization
    Given I have multiple buttons on a single interface
    When the buttons are rendered
    Then related buttons should be grouped logically
    And primary actions should be visually emphasized
    And secondary actions should be appropriately de-emphasized
    When space is limited (mobile)
    Then buttons should be organized efficiently
    And overflow menus should be used when necessary

  @buttons @button-states @visual-feedback
  Scenario: Button States and Visual Feedback
    Given I am interacting with UI buttons
    When a button is in its default state
    Then it should appear clickable and inviting
    When I hover over a button (desktop)
    Then it should provide visual hover feedback
    When I press/touch a button
    Then it should provide immediate pressed state feedback
    When a button is disabled
    Then it should appear disabled and be non-interactive
    When a button is loading
    Then it should show loading state with appropriate indicators

  @buttons @mobile-optimization @touch-friendly
  Scenario: Mobile-Optimized Button Interactions
    Given I am using a mobile device
    When I view UI buttons
    Then all buttons should meet minimum touch target requirements (44px)
    And buttons should have appropriate spacing for touch
    And visual feedback should account for touch interactions
    When I tap a button on mobile
    Then the tap should register immediately
    And tactile feedback should be provided when available

  @buttons @accessibility @inclusive-design
  Scenario: Button Accessibility Features
    Given I am using assistive technologies
    When I encounter UI buttons
    Then all buttons should have appropriate ARIA labels
    And keyboard navigation should work correctly
    And screen readers should announce button purposes clearly
    When I use high contrast mode
    Then buttons should remain clearly visible and distinct
    When I use keyboard-only navigation
    Then all buttons should be reachable and activatable

  @buttons @customization @user-preferences
  Scenario: Button Customization and User Preferences
    Given I want to customize button behavior
    When I access button settings
    Then I should be able to configure button visibility
    And I should be able to customize button labels
    And I should be able to set preferred button styles
    When I have specific workflow needs
    Then I should be able to add custom button commands
    And button arrangements should be customizable

  @buttons @performance @efficiency
  Scenario: Button Performance and Efficiency
    Given I am using the button system intensively
    When buttons are rendered on the page
    Then rendering should be fast and not block the UI
    And button event handlers should respond immediately
    When I click buttons in rapid succession
    Then the system should handle rapid interactions gracefully
    And no actions should be lost or duplicated

  @buttons @error-handling @resilience
  Scenario: Button Error Handling and Resilience
    Given I am using UI buttons for various actions
    When a button command encounters an error
    Then the error should be displayed clearly to the user
    And the button should return to its normal state
    And the system should remain stable and usable
    When network issues prevent button actions
    Then appropriate offline messaging should be shown
    And actions should be queued for retry when possible

  @buttons @integration @workflow
  Scenario: Button Integration with Workflow Systems
    Given I am working with complex workflows
    When buttons trigger multi-step processes
    Then progress should be clearly communicated
    And users should be able to track action status
    When buttons integrate with external systems
    Then integration status should be visible
    And failures should be handled gracefully

  @buttons @theming @visual-consistency
  Scenario: Button Theming and Visual Consistency
    Given I am using Obsidian with different themes
    When UI buttons are displayed
    Then buttons should respect the current theme
    And colors should integrate well with the overall design
    And contrast should meet accessibility standards
    When I switch themes
    Then button appearance should update appropriately
    And visual hierarchy should be maintained

  @buttons @keyboard-shortcuts @power-user
  Scenario: Keyboard Shortcuts for Button Actions
    Given I am a power user who prefers keyboard navigation
    When UI buttons have associated actions
    Then relevant buttons should have keyboard shortcuts
    And shortcuts should be discoverable (tooltips, etc.)
    And shortcuts should not conflict with system shortcuts
    When I use keyboard shortcuts
    Then actions should execute exactly as if I clicked the button
    And visual feedback should indicate the action occurred

  @buttons @batch-operations @bulk-actions
  Scenario: Batch Operations and Bulk Button Actions
    Given I need to perform similar actions on multiple items
    When I select multiple assets or items
    Then bulk action buttons should become available
    And buttons should clearly indicate they will affect multiple items
    When I execute bulk button actions
    Then progress should be shown for long-running operations
    And I should be able to cancel operations if needed
    And results should be clearly communicated