Feature: Effort Lifecycle Workflow
  As a user managing tasks and projects
  I want a structured workflow with clear state transitions
  So that I can manage task maturity and track completion status

  Background:
    Given I am viewing a note with UniversalLayout
    And the plugin is properly initialized

  Rule: Setting Draft status for efforts without status

    Scenario: Set Draft status via button
      Given I have a Task without ems__Effort_status property
      When I view the Task
      Then I see "Set Draft Status" button
      When I click "Set Draft Status" button
      Then Task property "ems__Effort_status" is set to "[[ems__EffortStatusDraft]]"
      And "Set Draft Status" button disappears
      And "Move to Backlog" button appears

    Scenario: Set Draft status via Command Palette
      Given I have a Task without ems__Effort_status property
      When I open Command Palette
      And I select "Exocortex: Set Draft Status"
      Then Task status is set to Draft
      And command executes successfully

  Rule: New tasks start in Draft status

    Scenario: Create new task from Area
      Given I have an Area "Development"
      When I click "Create Task" button
      Then a new Task is created
      And Task has property "ems__Effort_status" = "[[ems__EffortStatusDraft]]"
      And Task has property "exo__Asset_uid" with UUID value
      And Task has property "exo__Asset_createdAt" with timestamp

    Scenario: Create new task from Project
      Given I have a Project "Mobile App"
      When I click "Create Task" button
      Then a new Task is created
      And Task has property "ems__Effort_status" = "[[ems__EffortStatusDraft]]"
      And Task has property "ems__Effort_parent" = "[[Mobile App]]"

    Scenario: Create instance from TaskPrototype
      Given I have a TaskPrototype "Code Review Template"
      When I click "Create Instance" button
      And I enter label "Review PR #123"
      Then a new Task is created
      And Task has property "ems__Effort_status" = "[[ems__EffortStatusDraft]]"
      And Task has property "exo__Asset_prototype" = "[[Code Review Template]]"
      And Task has property "exo__Asset_label" = "Review PR #123"

    Scenario: Create instance from MeetingPrototype
      Given I have a MeetingPrototype "Daily Standup Template"
      When I click "Create Instance" button
      And I enter label "Standup 2025-10-19"
      Then a new Meeting is created
      And Meeting has property "exo__Instance_class" = "[[ems__Meeting]]"
      And Meeting has property "ems__Effort_status" = "[[ems__EffortStatusDraft]]"
      And Meeting has property "exo__Asset_prototype" = "[[Daily Standup Template]]"
      And Meeting has property "exo__Asset_label" = "Standup 2025-10-19"

  Rule: Draft → Backlog transition

    Scenario: Move Task from Draft to Backlog via button
      Given I have a Task "Write Documentation" with:
        | Property            | Value                           |
        | exo__Instance_class | [[ems__Task]]                   |
        | ems__Effort_status  | [[ems__EffortStatusDraft]]      |
      When I view the Task
      Then I see "To Backlog" button
      When I click "To Backlog" button
      Then Task property "ems__Effort_status" is updated to "[[ems__EffortStatusBacklog]]"
      And "To Backlog" button disappears
      And "Start Effort" button appears

    Scenario: Move Task from Draft to Backlog via Command Palette
      Given I have a Task "Fix Bug" with Draft status
      When I open Command Palette
      And I select "Exocortex: Move to Backlog"
      Then Task status changes to Backlog
      And command executes successfully

    Scenario: To Backlog button only visible for Draft status
      Given I have Tasks with different statuses:
        | Task Name       | Status   |
        | Draft Task      | Draft    |
        | Backlog Task    | Backlog  |
        | Doing Task      | Doing    |
        | Done Task       | Done     |
        | Trashed Task    | Trashed  |
      Then "To Backlog" button is visible only for "Draft Task"
      And button is hidden for all other tasks

  Rule: Backlog → Doing transition

    Scenario: Start effort from Backlog via button
      Given I have a Task "Implement Feature" with:
        | Property            | Value                           |
        | exo__Instance_class | [[ems__Task]]                   |
        | ems__Effort_status  | [[ems__EffortStatusBacklog]]    |
      When I view the Task
      Then I see "Start Effort" button
      When I click "Start Effort" button
      Then Task property "ems__Effort_status" is updated to "[[ems__EffortStatusDoing]]"
      And Task property "ems__Effort_startTimestamp" is set to current timestamp
      And "Start Effort" button disappears
      And "Done" button appears

    Scenario: Start effort from Backlog via Command Palette
      Given I have a Task "Deploy to Production" with Backlog status
      When I open Command Palette
      And I select "Exocortex: Start Effort"
      Then Task status changes to Doing
      And startTimestamp is recorded

    Scenario: Start Effort button only visible for Backlog status
      Given I have Tasks with different statuses:
        | Task Name       | Status   |
        | Draft Task      | Draft    |
        | Backlog Task    | Backlog  |
        | Doing Task      | Doing    |
        | Done Task       | Done     |
      Then "Start Effort" button is visible only for "Backlog Task"
      And button is hidden for all other tasks

  Rule: Planning for Evening (19:00)

    Scenario: Plan Task for evening via button
      Given I have a Task "Prepare Presentation" with:
        | Property            | Value                           |
        | exo__Instance_class | [[ems__Task]]                   |
        | ems__Effort_status  | [[ems__EffortStatusBacklog]]    |
      When I view the Task
      Then I see "Plan for Evening (19:00)" button
      When I click "Plan for Evening (19:00)" button
      Then Task property "ems__Effort_plannedStartTimestamp" is set to today at 19:00:00
      And timestamp format is "YYYY-MM-DDTHH:mm:ss"

    Scenario: Plan for evening via Command Palette
      Given I have a Task "Review Documents" with Backlog status
      When I open Command Palette
      And I select "Exocortex: Plan for Evening (19:00)"
      Then Task plannedStartTimestamp is set to today at 19:00
      And command executes successfully

    Scenario: Plan for Evening button only visible for Tasks in Backlog
      Given I have different assets:
        | Asset Name      | Type    | Status   |
        | Backlog Task    | Task    | Backlog  |
        | Draft Task      | Task    | Draft    |
        | Doing Task      | Task    | Doing    |
        | Backlog Project | Project | Backlog  |
      Then "Plan for Evening (19:00)" button is visible only for "Backlog Task"
      And button is hidden for "Draft Task"
      And button is hidden for "Doing Task"
      And button is hidden for "Backlog Project"

    Scenario: Evening timestamp format verification
      Given I have a Backlog Task
      When I plan it for evening
      Then "ems__Effort_plannedStartTimestamp" contains today's date
      And time portion is "19:00:00"
      And timestamp is in local timezone

  Rule: Doing → Done transition with dual timestamps

    Scenario: Mark task as Done via button
      Given I have a Task "Write Tests" with:
        | Property                      | Value                           |
        | exo__Instance_class           | [[ems__Task]]                   |
        | ems__Effort_status            | [[ems__EffortStatusDoing]]      |
        | ems__Effort_startTimestamp    | 2025-10-15T10:00:00             |
      When I view the Task
      Then I see "Done" button
      When I click "Done" button
      Then Task property "ems__Effort_status" is updated to "[[ems__EffortStatusDone]]"
      And Task property "ems__Effort_endTimestamp" is set to current timestamp
      And Task property "ems__Effort_resolutionTimestamp" is set to current timestamp
      And "Done" button disappears
      And "To Archive" button appears

    Scenario: Mark task as Done via Command Palette
      Given I have a Task "Complete Code Review" with Doing status
      When I open Command Palette
      And I select "Exocortex: Mark as Done"
      Then Task status changes to Done
      And both endTimestamp and resolutionTimestamp are recorded

    Scenario: Done button only visible for Doing status
      Given I have Tasks with different statuses:
        | Task Name       | Status   |
        | Draft Task      | Draft    |
        | Backlog Task    | Backlog  |
        | Doing Task      | Doing    |
        | Done Task       | Done     |
      Then "Done" button is visible only for "Doing Task"
      And button is hidden for all other tasks

    Scenario: Done status sets both timestamps
      Given I have a Doing Task
      When I mark it as Done
      Then property "ems__Effort_endTimestamp" exists
      And property "ems__Effort_resolutionTimestamp" exists
      And both timestamps have the same value

  Rule: Trash transition from Draft/Backlog/Doing with resolutionTimestamp

    Scenario: Trash task from Draft status
      Given I have a Task "Obsolete Idea" with Draft status
      When I click "Trash" button
      Then Task property "ems__Effort_status" is updated to "[[ems__EffortStatusTrashed]]"
      And Task property "ems__Effort_resolutionTimestamp" is set to current timestamp
      And Task property "ems__Effort_endTimestamp" does not exist

    Scenario: Trash task from Backlog status
      Given I have a Task "Cancelled Feature" with Backlog status
      When I click "Trash" button
      Then Task status changes to Trashed
      And only resolutionTimestamp is set

    Scenario: Trash task from Doing status
      Given I have a Task "Blocked Work" with:
        | Property                      | Value                           |
        | ems__Effort_status            | [[ems__EffortStatusDoing]]      |
        | ems__Effort_startTimestamp    | 2025-10-15T09:00:00             |
      When I click "Trash" button
      Then Task status changes to Trashed
      And resolutionTimestamp is set
      And startTimestamp is preserved
      And no endTimestamp is added

    Scenario: Trash button visible for Draft, Backlog, and Doing
      Given I have Tasks with different statuses:
        | Task Name       | Status   |
        | Draft Task      | Draft    |
        | Backlog Task    | Backlog  |
        | Doing Task      | Doing    |
        | Done Task       | Done     |
        | Trashed Task    | Trashed  |
      Then "Trash" button is visible for "Draft Task"
      And "Trash" button is visible for "Backlog Task"
      And "Trash" button is visible for "Doing Task"
      And "Trash" button is hidden for "Done Task"
      And "Trash" button is hidden for "Trashed Task"

    Scenario: Trash via Command Palette sets resolutionTimestamp only
      Given I have a Task with Backlog status
      When I select "Exocortex: Trash" command
      Then Task is trashed
      And resolutionTimestamp is set
      And endTimestamp is not set

  Rule: Archive completed or trashed efforts

    Scenario: Archive Done task
      Given I have a Task with:
        | Property                         | Value                           |
        | ems__Effort_status               | [[ems__EffortStatusDone]]       |
        | ems__Effort_endTimestamp         | 2025-10-15T14:00:00             |
        | ems__Effort_resolutionTimestamp  | 2025-10-15T14:00:00             |
        | archived                         | false                           |
      When I click "To Archive" button
      Then Task property "archived" is set to true
      And "To Archive" button disappears

    Scenario: Archive Trashed task
      Given I have a Task with:
        | Property                         | Value                           |
        | ems__Effort_status               | [[ems__EffortStatusTrashed]]    |
        | ems__Effort_resolutionTimestamp  | 2025-10-15T11:30:00             |
        | archived                         | false                           |
      When I click "To Archive" button
      Then Task property "archived" is set to true

    Scenario: Archive button only for Done or Trashed
      Given I have Tasks with different statuses:
        | Task Name       | Status   | Archived |
        | Done Task       | Done     | false    |
        | Trashed Task    | Trashed  | false    |
        | Doing Task      | Doing    | false    |
        | Archived Done   | Done     | true     |
      Then "To Archive" button is visible for "Done Task"
      And "To Archive" button is visible for "Trashed Task"
      And "To Archive" button is hidden for "Doing Task"
      And "To Archive" button is hidden for "Archived Done"

  Rule: Workflow applies to both Tasks and Projects

    Scenario: Project follows same workflow as Task
      Given I have a Project "Website Redesign" with Draft status
      When I move it to Backlog
      And I start effort
      And I mark it as Done
      Then Project has same workflow transitions as Task
      And all timestamps are properly set

    Scenario: All buttons work for Projects
      Given I have a Project in each workflow state
      Then all workflow buttons appear correctly for Projects
      And all transitions work identically to Tasks

  Rule: Workflow state machine validation

    Scenario: Cannot skip workflow steps
      Given I have a Task with Draft status
      Then "Start Effort" button is not visible
      And "Done" button is not visible
      And only "To Backlog" and "Trash" buttons are visible

    Scenario: Forward-only progression (except Trash)
      Given I have a Task with Doing status
      Then I cannot move it back to Backlog
      And I cannot move it back to Draft
      And I can only move to Done or Trash

    Scenario: Terminal states are final
      Given I have a Task with Done status
      Then no workflow buttons are visible except "To Archive"
      And Task cannot transition to other workflow states

    Scenario: Command Palette reflects button availability
      Given I have a Task with Backlog status
      When I open Command Palette
      Then "Exocortex: Start Effort" command is available
      And "Exocortex: Move to Backlog" command is not available
      And "Exocortex: Mark as Done" command is not available
      And "Exocortex: Trash" command is available

  Rule: Timestamp preservation across transitions

    Scenario: Timestamps persist through workflow
      Given I have a Task with:
        | Property                      | Value                           |
        | ems__Effort_status            | [[ems__EffortStatusDraft]]      |
        | exo__Asset_createdAt          | 2025-10-15T09:00:00             |
      When I move to Backlog
      Then createdAt timestamp is preserved
      When I start effort
      Then createdAt timestamp is preserved
      And startTimestamp is added
      When I mark as Done
      Then createdAt timestamp is preserved
      And startTimestamp is preserved
      And endTimestamp is added
      And resolutionTimestamp is added

    Scenario: Trashing preserves existing timestamps but adds resolutionTimestamp
      Given I have a Doing Task with startTimestamp
      When I trash it
      Then startTimestamp is preserved
      And resolutionTimestamp is added
      And no endTimestamp is added

  Rule: Edge cases and error handling

    Scenario: Task without status shows Set Draft Status button
      Given I have a legacy Task without ems__Effort_status property
      Then "Set Draft Status" button is visible
      And no other workflow transition buttons are visible
      When I click "Set Draft Status" button
      Then Task property "ems__Effort_status" is set to "[[ems__EffortStatusDraft]]"
      And "Set Draft Status" button disappears
      And "Move to Backlog" button appears

    Scenario: Multiple status values handled correctly
      Given I have a Task with status array ["[[ems__EffortStatusBacklog]]", "[[CustomStatus]]"]
      Then workflow logic uses first status value
      And "Start Effort" button is visible

    Scenario: Status without wiki-link brackets
      Given I have a Task with:
        | Property            | Value                    |
        | ems__Effort_status  | ems__EffortStatusBacklog |
      Then workflow still recognizes the status
      And correct buttons are displayed
