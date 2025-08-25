@business @workflow @ui @children-efforts
Feature: Children Efforts Table - Hierarchical Task Display
  As a project manager using the Exocortex plugin
  I want to view child efforts in a professional table format
  So that I can track project progress and maintain hierarchical organization

  Background:
    Given the Exocortex plugin is initialized
    And the children efforts rendering system is enabled
    And I have a parent project note "Project Alpha"
    And the current note has proper frontmatter structure

  @rendering @basic-functionality
  Scenario: Display basic children efforts table
    Given I have the following child efforts for "Project Alpha":
      | title         | status      | class      | effort_parent     |
      | Task A        | todo        | ems__Task  | [[Project Alpha]] |
      | Task B        | in_progress | ems__Task  | [[Project Alpha]] |
      | Task C        | done        | ems__Task  | [[Project Alpha]] |
    When I render the children efforts block
    Then I should see a professional table with:
      | column       | content                    |
      | Asset Name   | Task A, Task B, Task C     |
      | Status       | todo, in_progress, done    |
    And the table should have proper CSS classes:
      | class                           | purpose                    |
      | exocortex-children-efforts-table| Main table styling         |
      | exocortex-table-header-asset    | Asset column header        |
      | exocortex-table-header-status   | Status column header       |
      | exocortex-efforts-row          | Individual row styling     |

  @rendering @empty-state
  Scenario: Handle no children efforts gracefully
    Given the parent project has no child efforts
    When I render the children efforts block
    Then I should see the message "No children efforts found"
    And the message should have class "exocortex-empty"

  @filtering @class-based
  Scenario: Filter children efforts by class
    Given I have the following child efforts:
      | title      | class         | effort_parent     |
      | Task 1     | ems__Task     | [[Project Alpha]] |
      | Task 2     | ems__Task     | [[Project Alpha]] |
      | Milestone  | ems__Milestone| [[Project Alpha]] |
      | Document   | ems__Document | [[Project Alpha]] |
    And the children efforts block is configured with:
      | filterByClass | ems__Task |
    When I render the children efforts block
    Then I should see only 2 child efforts
    And the results should include "Task 1" and "Task 2"
    And the results should not include "Milestone" or "Document"

  @filtering @result-limiting
  Scenario: Limit number of displayed results
    Given I have 15 child efforts for "Project Alpha"
    And the children efforts block is configured with:
      | maxResults | 10 |
    When I render the children efforts block
    Then I should see exactly 10 child efforts displayed
    And the info section should show "15 child efforts, showing 10 (table view)"

  @grouping @class-organization
  Scenario: Group children efforts by class
    Given I have the following child efforts:
      | title      | class         | status      | effort_parent     |
      | Task 1     | ems__Task     | todo        | [[Project Alpha]] |
      | Task 2     | ems__Task     | done        | [[Project Alpha]] |
      | Doc 1      | ems__Document | draft       | [[Project Alpha]] |
      | Doc 2      | ems__Document | published   | [[Project Alpha]] |
      | Issue 1    | ems__Issue    | open        | [[Project Alpha]] |
    And the children efforts block is configured with:
      | groupByClass | true |
    When I render the children efforts block
    Then I should see 3 groups:
      | group_name   | count |
      | ems__Document| 2     |
      | ems__Issue   | 1     |
      | ems__Task    | 2     |
    And each group should have its own table
    And group headers should show "ClassName (count)"

  @parent-path @relationship-tracking
  Scenario: Display parent path information
    Given I have child efforts with different parent references
    And the children efforts block is configured with:
      | showParentPath | true |
    When I render the children efforts block
    Then the table should include a "Parent" column
    And each row should show the parent reference
    And parent references should be cleaned of brackets

  @status-extraction @metadata-processing
  Scenario: Extract and display effort status correctly
    Given I have child efforts with various status formats:
      | title    | ems__Effort_status           |
      | Task 1   | [[ems__EffortStatusTodo]]    |
      | Task 2   | ems__EffortStatusInProgress  |
      | Task 3   | Done                         |
      | Task 4   |                              |
    When I render the children efforts block
    Then the status should be displayed as:
      | title    | displayed_status |
      | Task 1   | Todo             |
      | Task 2   | InProgress       |
      | Task 3   | Done             |
      | Task 4   | Unknown          |

  @reference-matching @relationship-validation
  Scenario Outline: Match various parent reference formats
    Given I have a parent note "Project Alpha"
    And I have a child effort with parent reference "<parent_ref>"
    When the system checks if this is a child effort
    Then the relationship should be recognized as <should_match>

    Examples:
      | parent_ref              | should_match |
      | [[Project Alpha]]       | true         |
      | Project Alpha           | true         |
      | Project Alpha.md        | true         |
      | notes/Project Alpha.md  | true         |
      | [[Different Project]]   | false        |
      | Project Beta            | false        |

  @performance @large-datasets
  Scenario: Handle large numbers of child efforts efficiently
    Given I have a project with 500 child efforts
    When I render the children efforts block
    Then the rendering should complete within 2 seconds
    And memory usage should remain stable
    And the table should be paginated or virtualized for performance

  @ui-styling @visual-consistency
  Scenario: Apply consistent visual styling
    Given I have child efforts with different statuses
    When I render the children efforts table
    Then status badges should have consistent styling:
      | status      | css_class                |
      | Known       | exocortex-status-known   |
      | Unknown     | exocortex-status-unknown |
    And asset links should have proper internal link styling
    And class information should be displayed as subtle subtitles

  @accessibility @screen-readers
  Scenario: Provide accessible table structure
    Given I have rendered a children efforts table
    Then the table should have proper semantic structure:
      | element | requirement                    |
      | table   | role="table"                   |
      | thead   | Contains column headers        |
      | th      | Contains proper header text    |
      | tbody   | Contains data rows             |
      | tr      | Proper row structure           |
      | td      | Proper cell structure          |
    And column headers should be properly associated with data cells

  @responsive @mobile-support
  Scenario: Display table responsively on mobile devices
    Given I am viewing the plugin on a mobile device
    When I render the children efforts table
    Then the table should adapt to small screens:
      | adaptation         | behavior                        |
      | column_stacking   | Stack columns vertically        |
      | text_truncation   | Truncate long asset names       |
      | touch_targets     | Ensure touch-friendly links     |
      | scroll_behavior   | Enable horizontal scroll        |

  @error-handling @corrupted-data
  Scenario: Handle corrupted child effort data gracefully
    Given I have child efforts with corrupted metadata:
      | title    | issue_type           | corrupted_data           |
      | Task 1   | missing_frontmatter  | No frontmatter           |
      | Task 2   | invalid_class        | exo__InvalidClass        |
      | Task 3   | broken_parent_ref    | [[Broken]]Reference]]    |
    When I render the children efforts block
    Then corrupted entries should be handled gracefully:
      | issue_type          | handling                       |
      | missing_frontmatter | Use filename as title          |
      | invalid_class       | Show as "Unclassified"         |
      | broken_parent_ref   | Clean and attempt to match     |
    And error messages should be logged for debugging
    And the table should still render for valid entries

  @caching @performance-optimization
  Scenario: Cache children efforts data for performance
    Given I have rendered a children efforts table
    And the data is cached
    When I navigate away and return to the same note
    Then the cached data should be used
    And the rendering should be significantly faster
    And the cache should be invalidated when child efforts change

  @real-time-updates @data-synchronization
  Scenario: Update table when child efforts change
    Given I have a rendered children efforts table
    When a child effort status is updated in another view
    Then the table should reflect the change
    And the updated timestamp should be current
    And no full page refresh should be required

  @integration @obsidian-features
  Scenario: Integrate with Obsidian's link system
    Given I have child efforts displayed in the table
    When I click on an asset name link
    Then Obsidian should navigate to that note
    And the navigation should use Obsidian's internal routing
    And backlinks should be properly maintained

  @configuration @customization
  Scenario: Support flexible configuration options
    Given I want to customize the children efforts display
    When I configure the block with:
      | option          | value    | expected_behavior                |
      | showParentPath  | false    | Parent column should be hidden   |
      | groupByClass    | true     | Group assets by class            |
      | maxResults      | 25       | Limit to 25 results              |
      | filterByClass   | ems__Task| Show only tasks                  |
      | sortBy          | status   | Sort by status alphabetically    |
    Then the table should respect all configuration options
    And invalid configuration should use sensible defaults

  @sorting @data-organization
  Scenario: Sort child efforts by different criteria
    Given I have child efforts with various properties
    When I configure sorting by:
      | sort_criteria | order | expected_result                    |
      | title         | asc   | Alphabetical by asset name         |
      | status        | desc  | Status priority (done, progress, todo) |
      | created_date  | desc  | Newest first                       |
      | class         | asc   | Grouped by class alphabetically    |
    Then the table rows should be ordered accordingly
    And the sorting should be stable for equal values

  @export @data-portability
  Scenario: Export children efforts data
    Given I have a populated children efforts table
    When I export the table data
    Then I should be able to export in formats:
      | format | content_type        | includes                |
      | CSV    | text/csv            | Headers and data rows   |
      | JSON   | application/json    | Structured data objects |
      | MD     | text/markdown       | Markdown table format   |
    And exported data should include all visible columns
    And formatting should be preserved where applicable

  @multi-parent @complex-relationships
  Scenario: Handle child efforts with multiple parents
    Given I have child efforts that reference multiple parents
    And a child effort has parent references:
      | parent_refs                        |
      | [[Project Alpha]], [[Project Beta]] |
    When I render the children efforts block for "Project Alpha"
    Then the child effort should be included in the results
    And the parent column should show the relevant parent reference
    And the effort should not be duplicated in the table

  @internationalization @localization
  Scenario: Support different languages in effort data
    Given I have child efforts with international content:
      | title       | language | special_chars        |
      | Tâche 1     | French   | Accented characters  |
      | Aufgabe 2   | German   | Umlauts             |
      | タスク3      | Japanese | Kanji characters     |
    When I render the children efforts table
    Then all international characters should display correctly
    And sorting should work with international characters
    And text truncation should respect character boundaries