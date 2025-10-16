Feature: Daily Tasks Table in Layout
  As a user viewing a pn__DailyNote
  I want to see all tasks scheduled for that day
  So that I can manage my daily tasks efficiently

  Background:
    Given Dataview plugin is installed and active
    And I am viewing a note with UniversalLayout

  Scenario: Display tasks for DailyNote with tasks
    Given I have a pn__DailyNote for "2025-10-16"
    And the note has "pn__DailyNote_day" property set to "[[2025-10-16]]"
    And there are 3 tasks with "ems__Effort_day" property set to "[[2025-10-16]]"
    When I view the daily note
    Then I should see a "Tasks" section
    And the Tasks table should appear after Properties table
    And the Tasks table should appear before Relations table
    And I should see 3 tasks in the table
    And each task should display Name, Start, End, and Status columns

  Scenario: Tasks display with icons based on status
    Given I have a pn__DailyNote for "2025-10-16"
    And task "Meeting" has status "[[ems__EffortStatusDoing]]" and class "[[ems__Meeting]]"
    And task "Completed Work" has status "[[ems__EffortStatusDone]]"
    And task "Cancelled Task" has status "[[ems__EffortStatusTrashed]]"
    When I view the daily note
    Then task "Meeting" should display with 👥 icon
    And task "Completed Work" should display with ✅ icon
    And task "Cancelled Task" should display with ❌ icon

  Scenario: Tasks sorted by priority
    Given I have a pn__DailyNote for "2025-10-16"
    And task "Active Task" has status "[[ems__EffortStatusDoing]]" and start time "09:00"
    And task "Done Task" has status "[[ems__EffortStatusDone]]" and start time "08:00"
    And task "Trashed Task" has status "[[ems__EffortStatusTrashed]]"
    When I view the daily note
    Then tasks should be sorted with Trashed at bottom
    And Done tasks should appear before Trashed
    And Active tasks should appear first, sorted by start time

  Scenario: Click on task opens task file
    Given I have a pn__DailyNote with tasks
    When I click on a task name
    Then the task file should open in current tab
    When I Cmd+Click on a task name
    Then the task file should open in new tab

  Scenario: Display tasks with time information
    Given I have a pn__DailyNote for "2025-10-16"
    And task "Morning Meeting" has "ems__Effort_startTimestamp" at "2025-10-16T09:00:00"
    And task "Afternoon Work" has "ems__Effort_plannedStartTimestamp" at "2025-10-16T14:00:00"
    And task "Unscheduled" has no time properties
    When I view the daily note
    Then "Morning Meeting" should show start time "09:00"
    And "Afternoon Work" should show start time "14:00"
    And "Unscheduled" should show "-" for start time

  Scenario: No Tasks table for non-DailyNote assets
    Given I have a regular note with class "[[ems__Task]]"
    When I view the note with UniversalLayout
    Then I should NOT see a Tasks section

  Scenario: No Tasks table when pn__DailyNote_day is missing
    Given I have a pn__DailyNote
    But the note has no "pn__DailyNote_day" property
    When I view the note with UniversalLayout
    Then I should NOT see a Tasks section

  Scenario: Graceful fallback when Dataview is not installed
    Given Dataview plugin is NOT installed
    And I have a pn__DailyNote for "2025-10-16"
    When I view the note with UniversalLayout
    Then I should NOT see a Tasks section
    And no error should be displayed
    And Properties and Relations sections should render normally

  Scenario: No Tasks table when no tasks for the day
    Given I have a pn__DailyNote for "2025-10-16"
    And there are NO tasks with "ems__Effort_day" property set to "[[2025-10-16]]"
    When I view the daily note
    Then I should NOT see a Tasks section
    And Properties table should render normally
    And Relations table should render normally

  Scenario: Tasks display with labels
    Given I have a pn__DailyNote for "2025-10-16"
    And task file "task-123.md" has "exo__Asset_label" set to "Write Documentation"
    And task file "task-456.md" has NO "exo__Asset_label" property
    When I view the daily note
    Then task "task-123.md" should display as "Write Documentation"
    And task "task-456.md" should display as its filename

  Scenario: Tasks limit to 50 items
    Given I have a pn__DailyNote for "2025-10-16"
    And there are 75 tasks with "ems__Effort_day" property set to "[[2025-10-16]]"
    When I view the daily note
    Then I should see exactly 50 tasks in the table
    And tasks should be sorted by priority (Active > Done > Trashed, then by start time)

  Scenario: Click on status opens status definition
    Given I have a pn__DailyNote with tasks
    When I click on a task's status link
    Then the status definition file should open
    When I Cmd+Click on a task's status link
    Then the status definition file should open in new tab
