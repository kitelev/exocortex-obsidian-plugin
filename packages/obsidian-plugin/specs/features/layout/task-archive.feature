Feature: Archive Completed Tasks

  Background:
    Given I am viewing a note with UniversalLayout

  Rule: Archive button appears only for completed, non-archived Tasks and Projects

    Scenario: Display Archive button for Done Task not archived
      Given I have a Task "Completed Task" with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Task]]             |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
        | archived            | false                     |
      When I view "Completed Task" with UniversalLayout
      Then I see a "To Archive" button

    Scenario: NO Archive button for incomplete Task
      Given I have a Task "Active Task" with:
        | Key                 | Value                       |
        | exo__Instance_class | [[ems__Task]]               |
        | ems__Effort_status  | [[ems__EffortStatusActive]] |
      When I view "Active Task" with UniversalLayout
      Then I do NOT see "To Archive" button

    Scenario: NO Archive button for already archived Task
      Given I have a Task "Archived Task" with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Task]]             |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
        | archived            | true                      |
      When I view "Archived Task" with UniversalLayout
      Then I do NOT see "To Archive" button

    Scenario: Display Archive button for Done Project not archived
      Given I have a Project "Completed Project" with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Project]]          |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
        | archived            | false                     |
      When I view "Completed Project" with UniversalLayout
      Then I see a "To Archive" button

    Scenario: NO Archive button for incomplete Project
      Given I have a Project "Active Project" with:
        | Key                 | Value                       |
        | exo__Instance_class | [[ems__Project]]            |
        | ems__Effort_status  | [[ems__EffortStatusActive]] |
      When I view "Active Project" with UniversalLayout
      Then I do NOT see "To Archive" button

    Scenario: NO Archive button for already archived Project
      Given I have a Project "Archived Project" with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Project]]          |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
        | archived            | true                      |
      When I view "Archived Project" with UniversalLayout
      Then I do NOT see "To Archive" button

    Scenario: NO Archive button for non-Task/Project assets (Area)
      Given I have an Area "Development" with:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Area]] |
      When I view "Development" with UniversalLayout
      Then I do NOT see "To Archive" button

  Rule: Clicking Archive button updates Task

    Scenario: Archive sets archived property to true
      Given I have a Done Task "Ready to Archive" with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Task]]             |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
        | archived            | false                     |
      When I click "To Archive" button
      Then Task frontmatter is updated:
        | Property | Value |
        | archived | true  |
      And "To Archive" button disappears from layout

    Scenario: Archive adds archived property if missing
      Given I have a Done Task "No Archive Field" with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Task]]             |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
      And Task has NO "archived" property
      When I click "To Archive" button
      Then frontmatter is updated with:
        | Property | Value |
        | archived | true  |

    Scenario: Preserve all properties when archiving
      Given I have a Done Task with complete frontmatter:
        | Property                 | Value                     |
        | exo__Instance_class      | [[ems__Task]]             |
        | ems__Effort_status       | [[ems__EffortStatusDone]] |
        | ems__Effort_endTimestamp | 2025-10-12T14:30:00       |
        | exo__Asset_uid           | task-uuid-456             |
        | custom_field             | important_data            |
      When I click "To Archive" button
      Then all original properties are preserved
      And "archived: true" is added

  Rule: Archive button recognizes various archived formats

    Scenario Outline: Handle different archived value formats
      Given I have a Done Task with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Task]]             |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
        | archived            | <archived_value>          |
      When I view the Task
      Then Archive button visibility is <button_visible>

      Examples:
        | archived_value | button_visible |
        | true           | hidden         |
        | false          | visible        |
        | "true"         | hidden         |
        | "false"        | visible        |
        | "yes"          | hidden         |
        | "no"           | visible        |
        | 1              | hidden         |
        | 0              | visible        |

  Rule: Legacy field support

    Scenario: Recognize legacy exo__Asset_isArchived field
      Given I have a Done Task with:
        | Key                   | Value                     |
        | exo__Instance_class   | [[ems__Task]]             |
        | ems__Effort_status    | [[ems__EffortStatusDone]] |
        | exo__Asset_isArchived | true                      |
      When I view the Task
      Then I do NOT see "To Archive" button
