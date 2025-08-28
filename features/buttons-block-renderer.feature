Feature: ButtonsBlockRenderer for "Buttons" code block type
  As a knowledge worker using the Exocortex plugin
  I want to use "Buttons" code blocks to display interactive UI elements
  So that I can perform common actions without leaving my notes

  Background:
    Given the Exocortex plugin is installed and activated
    And the ButtonsBlockRenderer is registered in the BlockRendererFactory
    And I have a test file with frontmatter properties

  @happy-path @core-functionality
  Scenario: Render basic buttons block with default configuration
    Given I have a note with the following code block:
      ```
      ```exocortex
      view: Buttons
      config:
        buttons:
          - label: "Create Child Task"
            commandType: "CREATE_CHILD_TASK"
            tooltip: "Create a new child task"
      ```
      ```
    When the code block is processed by the system
    Then a button container should be rendered with class "exocortex-buttons-block"
    And the button should display text "Create Child Task"
    And the button should have tooltip "Create a new child task"
    And the button should have class "exocortex-layout-button"
    And clicking the button should trigger CREATE_CHILD_TASK command

  @configuration @positioning
  Scenario: Render buttons with different positioning options
    Given I have a note with the following code block:
      ```
      ```exocortex
      view: Buttons
      config:
        position: "bottom"
        buttons:
          - label: "Create Area"
            commandType: "CREATE_CHILD_AREA"
      ```
      ```
    When the code block is processed
    Then the button container should have class "exocortex-buttons-bottom"

  @multiple-buttons @batch-operations
  Scenario: Render multiple buttons in a single block
    Given I have a note with the following code block:
      ```
      ```exocortex
      view: Buttons
      config:
        buttons:
          - label: "New Task"
            commandType: "CREATE_CHILD_TASK"
          - label: "New Area"
            commandType: "CREATE_CHILD_AREA"
          - label: "Open Asset"
            commandType: "OPEN_ASSET"
      ```
      ```
    When the code block is processed
    Then exactly 3 buttons should be rendered
    And each button should be properly configured with its respective command

  @styling @customization
  Scenario: Apply custom button styles
    Given I have a note with the following code block:
      ```
      ```exocortex
      view: Buttons
      config:
        buttons:
          - label: "Primary Action"
            commandType: "CREATE_ASSET"
            style: "primary"
          - label: "Danger Action"
            commandType: "DELETE_ASSET"
            style: "danger"
      ```
      ```
    When the code block is processed
    Then the first button should have additional class "exocortex-button-primary"
    And the second button should have additional class "exocortex-button-danger"

  @error-handling @empty-config
  Scenario: Handle empty buttons configuration gracefully
    Given I have a note with the following code block:
      ```
      ```exocortex
      view: Buttons
      config:
        buttons: []
      ```
      ```
    When the code block is processed
    Then no buttons should be rendered
    And no error should be thrown
    And the container should remain empty

  @error-handling @missing-config
  Scenario: Handle missing buttons configuration
    Given I have a note with the following code block:
      ```
      ```exocortex
      view: Buttons
      config: {}
      ```
      ```
    When the code block is processed
    Then no buttons should be rendered
    And no error should be thrown

  @command-integration @context-awareness
  Scenario: Pass current file context to button commands
    Given I have a file "/Test Folder/My Note.md" with exo__Instance_class "ems__Task"
    And the file contains a Buttons code block with CREATE_CHILD_TASK command
    When I click the button
    Then the command should receive the current file as context
    And the command should receive the frontmatter data including exo__Instance_class

  @command-feedback @user-experience
  Scenario: Provide user feedback for unimplemented commands
    Given I have a note with the following code block:
      ```
      ```exocortex
      view: Buttons
      config:
        buttons:
          - label: "Future Feature"
            commandType: "FUTURE_COMMAND"
      ```
      ```
    When I click the button
    Then a notice should be displayed saying "Command FUTURE_COMMAND not yet implemented"

  @integration @block-renderer-factory
  Scenario: ButtonsBlockRenderer is properly registered in factory
    When I request a renderer for block type "Buttons"
    Then the BlockRendererFactory should return a ButtonsBlockRenderer instance
    And the renderer should implement the IBlockRenderer interface

  @performance @rendering-speed
  Scenario: Render buttons efficiently for large configurations
    Given I have a note with 20 buttons configured
    When the code block is processed
    Then all 20 buttons should render within 100ms
    And each button should be properly initialized

  @accessibility @keyboard-navigation
  Scenario: Buttons support keyboard navigation
    Given I have rendered buttons on the page
    When I navigate using Tab key
    Then buttons should receive focus in logical order
    And pressing Enter should trigger the button action
    And buttons should have appropriate ARIA labels

  @responsive-design @mobile-support
  Scenario: Buttons render appropriately on mobile devices
    Given I am using the plugin on a mobile device
    When buttons are rendered
    Then buttons should have touch-friendly dimensions
    And button spacing should be appropriate for touch interaction

  @command-validation @type-safety
  Scenario: Validate command types before rendering
    Given I have a note with an invalid commandType
    When the code block is processed
    Then the system should handle the invalid command gracefully
    And provide appropriate user feedback