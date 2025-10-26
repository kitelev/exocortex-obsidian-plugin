# language: en
Feature: Universal Layout Rendering

  As an Exocortex plugin user
  I want to see related notes in a structured view
  So that I can efficiently work with my semantic knowledge network

  Background:
    Given Obsidian vault with Exocortex plugin installed
    And note "My Project" exists with metadata:
      | Property              | Value            |
      | exo__Instance_class   | [[ems__Project]] |
      | exo__Asset_isArchived | false            |

  Scenario: Display table of related notes
    Given I have note "My Project" open
    And related notes exist:
      | Name         | exo__Instance_class | Relation      |
      | Task 1       | [[ems__Task]]       | exo__Parent   |
      | Task 2       | [[ems__Task]]       | exo__Parent   |
      | Work Area    | [[ems__Area]]       | body          |
    When I add a code block with type "exocortex-universal"
    And block contains configuration:
      """yaml
      layout: table
      showProperties:
        - exo__Instance_class
      """
    Then I see a table with columns:
      | Name | exo__Instance_class | Relation Type | Modified |
    And table contains 3 rows
    And column headers "Name" and "exo__Instance_class" have class "sortable"

  Scenario: Instance Class column contains clickable links
    Given I have note "My Project" open
    And related note "Task 1" exists with metadata:
      | Property            | Value         |
      | exo__Instance_class | [[ems__Task]] |
    When I add a code block with type "exocortex-universal"
    And block contains configuration:
      """yaml
      layout: table
      showProperties:
        - exo__Instance_class
      """
    Then in column "exo__Instance_class" I see element <a>
    And element <a> has text "ems__Task"
    And element <a> has class "internal-link"
    And clicking element <a> opens note "ems__Task"
    And element <a> does NOT contain symbols "[[" or "]]"

  Scenario: Sort by Name column
    Given I have note "My Project" open
    And related notes exist:
      | Name   | exo__Instance_class |
      | Task C | [[ems__Task]]       |
      | Task A | [[ems__Task]]       |
      | Task B | [[ems__Task]]       |
    And I added a code block with type "exocortex-universal"
    And block contains configuration "layout: table"
    When I click on column header "Name"
    Then table is sorted ascending
    And row order is:
      | Task A |
      | Task B |
      | Task C |
    When I click on column header "Name" again
    Then table is sorted descending
    And row order is:
      | Task C |
      | Task B |
      | Task A |

  Scenario: Sort by Instance Class column
    Given I have note "My Project" open
    And related notes exist:
      | Name   | exo__Instance_class |
      | Note 1 | [[ems__Task]]       |
      | Note 2 | [[ems__Area]]       |
      | Note 3 | [[ems__Project]]    |
    And I added a code block with type "exocortex-universal"
    When I click on column header "exo__Instance_class"
    Then rows are sorted by Instance Class value
    And header "exo__Instance_class" has class "sorted-asc"
    And header "exo__Instance_class" contains symbol "▲"

  Scenario: Sort indicators
    Given I have note with Universal Layout table open
    When I click on header "Name"
    Then header "Name" has class "sorted-asc"
    And header "Name" contains symbol "▲"
    When I click on header "Name" again
    Then header "Name" has class "sorted-desc"
    And header "Name" contains symbol "▼"
    And symbol "▲" disappears

  Scenario: Filter archived notes
    Given I have note "My Project" open
    And related notes exist:
      | Name        | exo__Asset_isArchived |
      | Active      | false                 |
      | Archived    | true                  |
      | Also Active | false                 |
    When I add a code block with type "exocortex-universal"
    Then table contains 2 rows
    And I see notes "Active" and "Also Active"
    And I do NOT see note "Archived"

  Scenario: Display additional properties
    Given I have note "My Project" open
    And related note "Task 1" exists with metadata:
      | Property            | Value           |
      | exo__Instance_class | [[ems__Task]]   |
      | exo__Status         | In Progress     |
      | exo__Priority       | High            |
    When I add a code block with configuration:
      """yaml
      layout: table
      showProperties:
        - exo__Instance_class
        - exo__Status
        - exo__Priority
      """
    Then I see a table with columns:
      | Name | exo__Instance_class | exo__Status | exo__Priority | Relation Type | Modified |
    And in row "Task 1" column "exo__Status" contains "In Progress"
    And in row "Task 1" column "exo__Priority" contains "High"

  Scenario: Mobile table adaptation
    Given I am using Obsidian on a mobile device
    And I have note with Universal Layout table open
    When table is rendered
    Then <table> element has class "mobile-responsive"
    And table is adapted for touch controls
