# language: en
Feature: Interactive Class Tree Selector
  As a user creating an asset in Exocortex
  I want to select a class from an interactive tree modal
  So that I can easily navigate complex class hierarchies

  Background:
    Given I have Obsidian with Exocortex plugin installed
    And I have ontologies with class hierarchies in my vault
    And the vault contains the following classes:
      | Class Name      | Parent Class    | Ontology |
      | exo__Asset      | -              | exo      |
      | exo__Class      | exo__Asset     | exo      |
      | exo__Property   | exo__Asset     | exo      |
      | ems__Task       | exo__Asset     | ems      |
      | ems__Project    | exo__Asset     | ems      |
      | ems__Milestone  | ems__Task      | ems      |

  @smoke @ui
  Scenario: Open class tree selector modal
    Given I am in the asset creation modal
    When I click on the class selection button
    Then the class tree selector modal should open
    And I should see the class hierarchy displayed as a tree
    And the currently selected class should be highlighted

  @functional @expand-collapse
  Scenario: Expand and collapse tree nodes
    Given the class tree selector modal is open
    And I see "exo__Asset" with a collapse/expand icon
    When I click on the expand icon for "exo__Asset"
    Then I should see its child classes "exo__Class" and "exo__Property"
    When I click on the collapse icon for "exo__Asset"
    Then its child classes should be hidden

  @functional @search
  Scenario Outline: Search for classes
    Given the class tree selector modal is open
    When I type "<search_term>" in the search field
    Then I should see only classes matching "<search_term>"
    And matching text should be highlighted
    And the tree should auto-expand to show matches

    Examples:
      | search_term | expected_results                    |
      | Task        | ems__Task, ems__Milestone          |
      | exo         | exo__Asset, exo__Class, exo__Property |
      | Project     | ems__Project                       |
      | nonexistent | (No classes found)                 |

  @functional @selection
  Scenario: Select a class from the tree
    Given the class tree selector modal is open
    And no class is currently selected
    When I click on "ems__Task" in the tree
    Then the modal should close
    And "ems__Task" should be shown in the class selection button
    And the properties section should update for "ems__Task"

  @edge-case @circular-reference
  Scenario: Handle circular inheritance
    Given the vault contains a circular inheritance:
      | Class Name | Parent Class |
      | ClassA     | ClassB       |
      | ClassB     | ClassC       |
      | ClassC     | ClassA       |
    When I open the class tree selector modal
    Then I should see a recursion warning for the circular reference
    And the circular classes should not be selectable

  @performance @large-dataset
  Scenario: Handle large class hierarchies efficiently
    Given the vault contains 1000+ classes in a deep hierarchy
    When I open the class tree selector modal
    Then the modal should render within 500ms
    And scrolling should be smooth
    And search should respond within 100ms

  @accessibility @keyboard
  Scenario: Navigate with keyboard
    Given the class tree selector modal is open
    When I press Tab key
    Then focus should move to the search field
    When I press Arrow Down key
    Then focus should move to the first tree item
    When I press Enter key on a focused class
    Then that class should be selected
    When I press Escape key
    Then the modal should close without selection

  @integration @property-update
  Scenario: Properties update after class selection
    Given I am in the asset creation modal
    And "exo__Asset" is currently selected
    And I have filled in some property values
    When I select "ems__Task" from the tree selector
    Then the properties section should show "ems__Task" properties
    And my previously filled values for "exo__Asset" should be preserved
    When I switch back to "exo__Asset"
    Then my original values should be restored