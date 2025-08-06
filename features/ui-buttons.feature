# language: en
Feature: Dynamic UI Buttons in Asset Views
  As a user viewing assets in Exocortex
  I want to see and interact with custom buttons
  So that I can execute actions directly from asset views

  Background:
    Given I have the Exocortex plugin installed
    And my vault contains the following ontology structure:
      | Asset | Class | Properties |
      | ui__Button | exo__Class | ui__Button_label, ui__Button_command |
      | ui__ButtonCommand | exo__Class | ui__Command_type, ui__Command_parameters |
      | ui__ClassView | exo__Class | ui__ClassView_buttons, ui__ClassView_targetClass |
    And I have defined the following buttons:
      | Button ID | Label | Command | Order |
      | btn_create_task | Create Task | cmd_create_task | 1 |
      | btn_open_related | Open Related | cmd_open_related | 2 |
      | btn_run_template | Apply Template | cmd_run_template | 3 |
    And I have defined the following commands:
      | Command ID | Type | Requires Input | Parameters |
      | cmd_create_task | CREATE_ASSET | true | title, description, priority |
      | cmd_open_related | OPEN_ASSET | false | - |
      | cmd_run_template | RUN_TEMPLATE | true | template_name |
    And I have a ClassView for "ems__Project" with buttons:
      | btn_create_task |
      | btn_open_related |

  @smoke @ui
  Scenario: Display buttons in asset view
    Given I am viewing an asset of class "ems__Project"
    When the asset view renders
    Then I should see a button with label "Create Task"
    And I should see a button with label "Open Related"
    And the buttons should be in the correct order
    And the buttons should be positioned at the top of the view

  @functional @button-click
  Scenario: Click button without input requirements
    Given I am viewing an asset of class "ems__Project"
    And I see the "Open Related" button
    When I click the "Open Related" button
    Then the command "cmd_open_related" should execute
    And related assets should open in new tabs
    And I should see a success message

  @functional @button-input
  Scenario: Click button with input requirements
    Given I am viewing an asset of class "ems__Project"
    And I see the "Create Task" button
    When I click the "Create Task" button
    Then a modal should open requesting input
    And the modal should show fields for:
      | Field | Type | Required |
      | title | string | true |
      | description | text | false |
      | priority | enum | true |
    When I fill in the required fields:
      | Field | Value |
      | title | New Task |
      | priority | high |
    And I click "Execute"
    Then the command "cmd_create_task" should execute with the provided parameters
    And a new task asset should be created
    And I should see a success message

  @functional @button-validation
  Scenario: Input validation for button commands
    Given I am viewing an asset with the "Create Task" button
    When I click the "Create Task" button
    And the input modal opens
    And I leave the required "title" field empty
    And I click "Execute"
    Then I should see a validation error "Required parameter 'title' is missing"
    And the command should not execute

  @functional @button-enable-disable
  Scenario: Disabled buttons cannot be clicked
    Given I have a ClassView with a disabled button "btn_archive"
    And I am viewing an asset with this ClassView
    Then the "Archive" button should appear disabled
    When I attempt to click the "Archive" button
    Then nothing should happen
    And no command should execute

  @functional @no-buttons
  Scenario: View without configured buttons
    Given I am viewing an asset of class "exo__Asset"
    And no ClassView is configured for "exo__Asset"
    When the asset view renders
    Then no buttons should be displayed
    And the view should render normally without button section

  @functional @button-position
  Scenario Outline: Button positioning options
    Given I have a ClassView with button position "<position>"
    When I view an asset with this ClassView
    Then the buttons should be displayed at the "<position>" of the view

    Examples:
      | position |
      | top |
      | bottom |
      | floating |

  @edge-case @missing-command
  Scenario: Handle missing command gracefully
    Given I have a button "btn_broken" with command "cmd_nonexistent"
    And the command "cmd_nonexistent" does not exist
    When I view an asset with this button
    Then the button should not be displayed
    And a warning should be logged in the console

  @integration @command-execution
  Scenario: Execute template command
    Given I am viewing an asset with the "Apply Template" button
    And I have a template "project_checklist.md"
    When I click the "Apply Template" button
    And I select the template "project_checklist"
    And I click "Execute"
    Then the template should be applied to the current asset
    And the asset content should be updated
    And I should see "Template applied successfully"

  @performance @many-buttons
  Scenario: Handle many buttons efficiently
    Given I have a ClassView with 20 buttons
    When I view an asset with this ClassView
    Then all 20 buttons should render within 200ms
    And clicking any button should respond within 100ms

  @accessibility @keyboard
  Scenario: Keyboard navigation for buttons
    Given I am viewing an asset with multiple buttons
    When I press Tab key
    Then focus should move to the first button
    When I press Arrow Right key
    Then focus should move to the next button
    When I press Enter key
    Then the focused button should be clicked
    When I press Escape key in a modal
    Then the modal should close

  @functional @context-aware
  Scenario: Context-aware button visibility
    Given I have a button that requires selection
    And the button command type is "DELETE_ASSET"
    When I view an asset without any selection
    Then the delete button should not be visible
    When I select text in the asset
    Then the delete button should become visible