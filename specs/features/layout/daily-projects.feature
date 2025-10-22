Feature: Daily Projects Table in Layout
  As a user viewing a pn__DailyNote
  I want to see all projects scheduled for that day
  So that I can manage my daily projects efficiently

  Background:
    Given I am viewing a note with UniversalLayout
    And I have a pn__DailyNote for "2025-10-16"

  Scenario: Display projects for DailyNote with projects
    Given the note has "pn__DailyNote_day" property set to "[[2025-10-16]]"
    And there are 3 projects with "ems__Effort_day" property set to "[[2025-10-16]]"
    When I view the daily note
    Then I should see a "Projects" section
    And the Projects table should appear after Tasks table
    And I should see 3 projects in the table
    And each project should display Name, Start, End, and Status columns

  Scenario: Projects display with icons based on status
    Given project "Active Project" has status "[[ems__EffortStatusDoing]]" and class "[[ems__Project]]"
    And project "Completed Project" has status "[[ems__EffortStatusDone]]"
    And project "Cancelled Project" has status "[[ems__EffortStatusTrashed]]"
    When I view the daily note
    Then project "Active Project" should display with 📦 icon
    And project "Completed Project" should display with ✅ icon
    And project "Cancelled Project" should display with ❌ icon

  Scenario: Projects sorted by priority
    Given project "Active Project" has status "[[ems__EffortStatusDoing]]" and start time "09:00"
    And project "Done Project" has status "[[ems__EffortStatusDone]]" and start time "08:00"
    And project "Trashed Project" has status "[[ems__EffortStatusTrashed]]"
    When I view the daily note
    Then projects should be sorted with Trashed at bottom
    And Done projects should appear before Trashed
    And Active projects should appear first, sorted by votes then by start time

  Scenario: Projects sorted by votes within same status
    Given project "High Priority" has status "[[ems__EffortStatusDoing]]" and "ems__Effort_votes" set to 5
    And project "Medium Priority" has status "[[ems__EffortStatusDoing]]" and "ems__Effort_votes" set to 3
    And project "Low Priority" has status "[[ems__EffortStatusDoing]]" and "ems__Effort_votes" set to 1
    And project "No Votes" has status "[[ems__EffortStatusDoing]]" and no "ems__Effort_votes" property
    When I view the daily note
    Then projects should be sorted in order: "High Priority", "Medium Priority", "Low Priority", "No Votes"
    And projects with missing votes should be treated as having 0 votes

  Scenario: Click on project opens project file
    Given I have a pn__DailyNote with projects
    When I click on a project name
    Then the project file should open in current tab
    When I Cmd+Click on a project name
    Then the project file should open in new tab

  Scenario: Projects limit to 50 items
    Given there are 75 projects with "ems__Effort_day" property set to "[[2025-10-16]]"
    When I view the daily note
    Then I should see exactly 50 projects in the table
    And projects should be sorted by priority (Active > Done > Trashed, then by votes, then by start time)

  Scenario: No Projects table when no projects for the day
    Given there are NO projects with "ems__Effort_day" property set to "[[2025-10-16]]"
    When I view the daily note
    Then I should NOT see a Projects section
    And Tasks table should render normally
    And Relations table should render normally

  Scenario: Projects and Tasks tables are independent
    Given there are 2 tasks with "ems__Effort_votes" set to 5 and 3
    And there are 2 projects with "ems__Effort_votes" set to 10 and 1
    When I view the daily note
    Then Tasks table should sort tasks by their own votes independently
    And Projects table should sort projects by their own votes independently
    And project votes should NOT affect task sorting
    And task votes should NOT affect project sorting
