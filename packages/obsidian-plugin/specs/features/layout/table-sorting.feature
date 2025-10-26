# language: en
@sorting @implemented
Feature: Interactive Table Sorting

  As an Exocortex plugin user
  I want to sort tables by different columns
  So that I can quickly find the information I need

  Background:
    Given a note with Universal Layout table exists
    And the table contains notes:
      | Name    | exo__Instance_class | exo__Status  | Modified   |
      | Task C  | [[ems__Task]]       | Done         | 2025-10-01 |
      | Task A  | [[ems__Area]]       | In Progress  | 2025-10-03 |
      | Task B  | [[ems__Task]]       | New          | 2025-10-02 |

  Rule: Sorting by Name column

    Scenario: First click - sort ascending
      When I click on header "Name"
      Then table is sorted ascending
      And row order is:
        | Task A |
        | Task B |
        | Task C |
      And header "Name" has class "sorted-asc"
      And header "Name" contains symbol "▲"

    Scenario: Second click - sort descending
      Given I clicked on header "Name" once
      And table is sorted ascending
      When I click on header "Name" again
      Then table is sorted descending
      And row order is:
        | Task C |
        | Task B |
        | Task A |
      And header "Name" has class "sorted-desc"
      And header "Name" contains symbol "▼"
      And does NOT contain symbol "▲"

    Scenario: Third click - return to ascending
      Given I clicked on header "Name" twice
      And table is sorted descending
      When I click on header "Name" again
      Then table is sorted ascending again
      And header "Name" has class "sorted-asc"

  Rule: Sorting by Instance Class

    Scenario: Sort by Instance Class works correctly
      When I click on header "exo__Instance_class"
      Then table is sorted by Instance Class value
      And row order is:
        | Task A |  # ems__Area
        | Task C |  # ems__Task
        | Task B |  # ems__Task
      And header "exo__Instance_class" has class "sorted-asc"

    Scenario: Instance Class is extracted from metadata
      Given note has Instance Class "[[ems__Task]]"
      When sorting by "exo__Instance_class" is performed
      Then value "ems__Task" is used for sorting
      And "[[ems__Task]]" is NOT used

  Rule: Sorting by additional properties

    Scenario: Sort by custom property
      Given configuration includes:
        """yaml
        showProperties:
          - exo__Status
        """
      When I click on header "exo__Status"
      Then table is sorted by "exo__Status" value
      And row order is:
        | Task A |  # In Progress
        | Task C |  # Done
        | Task B |  # New

    Scenario: All custom properties are sortable
      Given configuration includes:
        """yaml
        showProperties:
          - exo__Priority
          - exo__Status
          - exo__Assignee
        """
      Then headers "exo__Priority", "exo__Status", "exo__Assignee" have class "sortable"
      And clicking any header triggers sorting

  Rule: Sort indicators

    Scenario: Only one column has indicator
      Given table is sorted by "Name"
      And header "Name" has class "sorted-asc"
      When I click on header "exo__Instance_class"
      Then header "Name" does NOT have class "sorted-asc"
      And header "Name" does NOT contain symbols "▲" or "▼"
      And header "exo__Instance_class" has class "sorted-asc"
      And header "exo__Instance_class" contains symbol "▲"

    Scenario: Arrows update when direction changes
      Given header "Name" contains "▲"
      When I click on "Name" to change direction
      Then symbol "▲" is replaced with "▼"
      And only one symbol is present at a time

  Rule: Sort state

    Scenario: Initial sort by Name ascending
      When table is rendered for the first time
      Then table is automatically sorted by "Name"
      And sort direction is "asc"
      And header "Name" has initial state

    Scenario: Preserve sort state in groups
      Given grouping by Instance Class is enabled
      And in group "ems__Task" I sorted by "Name" descending
      When I sort group "ems__Project" by "exo__Status"
      Then sort state of group "ems__Task" is preserved
      And group "ems__Task" remains sorted by "Name" desc
      And group "ems__Project" is sorted by "exo__Status"

  Rule: Handle special values

    Scenario: Sort with empty values
      Given table contains notes:
        | Name   | exo__Status  |
        | Task 1 | Done         |
        | Task 2 | (empty)      |
        | Task 3 | In Progress  |
      When I sort by "exo__Status"
      Then empty values are placed at the end
      And row order is:
        | Task 1 |  # Done
        | Task 3 |  # In Progress
        | Task 2 |  # (empty)

    Scenario: Sort dates
      Given table contains column "Modified" with dates
      When I sort by "Modified"
      Then dates are sorted chronologically
      And not as strings

    Scenario: Sort numbers
      Given table contains column with numeric values
      When I sort by this column
      Then numbers are sorted numerically
      And not lexicographically
      # Note: 2 < 10 (not "10" < "2")
