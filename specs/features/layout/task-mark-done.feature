Feature: Mark Task as Done

  Background:
    Given I am viewing a note with UniversalLayout

  Rule: Done button appears only for incomplete Tasks

    Scenario: Display Done button for Task without status
      Given I have a note "My Task" with frontmatter:
        | Key                    | Value             |
        | exo__Instance_class    | [[ems__Task]]     |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]  |
      When I view "My Task" with UniversalLayout
      Then I see a "Done" button above properties table

    Scenario: Display Done button for Task with non-Done status
      Given I have a Task "In Progress Task" with:
        | Key                    | Value                       |
        | exo__Instance_class    | [[ems__Task]]               |
        | ems__Effort_status     | [[ems__EffortStatusActive]] |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]            |
      When I view "In Progress Task" with UniversalLayout
      Then I see a "Done" button

    Scenario: NO Done button for completed Task
      Given I have a Task "Completed Task" with:
        | Key                 | Value                      |
        | exo__Instance_class | [[ems__Task]]              |
        | ems__Effort_status  | [[ems__EffortStatusDone]]  |
      When I view "Completed Task" with UniversalLayout
      Then I do NOT see "Done" button

    Scenario: NO Done button for non-Task assets (Project)
      Given I have a note "Project Asset" with:
        | Key                 | Value            |
        | exo__Instance_class | [[ems__Project]] |
      When I view "Project Asset" with UniversalLayout
      Then I do NOT see "Done" button

    Scenario: NO Done button for non-Task assets (Area)
      Given I have a note "Area Asset" with:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Area]] |
      When I view "Area Asset" with UniversalLayout
      Then I do NOT see "Done" button

  Rule: Clicking Done button updates Task status

    Scenario: Mark Task as Done sets status and timestamp
      Given I have a Task "Active Task" with:
        | Key                    | Value                       |
        | exo__Instance_class    | [[ems__Task]]               |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]            |
        | ems__Effort_status     | [[ems__EffortStatusActive]] |
      When I click "Done" button
      Then Task frontmatter is updated with:
        | Property                 | Value                     | Format                |
        | ems__Effort_status       | [[ems__EffortStatusDone]] | quoted wiki-link      |
        | ems__Effort_endTimestamp | current timestamp         | ISO 8601 (no ms)      |
      And "Done" button disappears from layout

    Scenario: Mark Task as Done for Task without initial status
      Given I have a Task "New Task" with:
        | Key                    | Value             |
        | exo__Instance_class    | [[ems__Task]]     |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]  |
      And Task has NO "ems__Effort_status" property
      When I click "Done" button
      Then frontmatter is updated with:
        | Property                 | Value                     |
        | ems__Effort_status       | [[ems__EffortStatusDone]] |
        | ems__Effort_endTimestamp | current timestamp         |
      And other properties are preserved:
        | Property               |
        | exo__Instance_class    |
        | exo__Asset_isDefinedBy |

    Scenario: Timestamp format is ISO 8601 without milliseconds
      Given I have a Task "Task for Timestamp Test"
      When I click "Done" button
      Then "ems__Effort_endTimestamp" matches format: YYYY-MM-DDTHH:MM:SS
      And timestamp does NOT contain milliseconds
      And timestamp does NOT contain timezone suffix

    Scenario: Update existing timestamp when marking as Done again
      Given I have a Task "Previously Done Task" with:
        | Key                      | Value                     |
        | exo__Instance_class      | [[ems__Task]]             |
        | ems__Effort_status       | [[ems__EffortStatusDone]] |
        | ems__Effort_endTimestamp | 2025-01-01T10:00:00       |
      And I manually change status to "[[ems__EffortStatusActive]]"
      When I click "Done" button
      Then "ems__Effort_endTimestamp" is updated to current time
      And old timestamp "2025-01-01T10:00:00" is replaced

  Rule: Done button interaction and UI behavior

    Scenario: Button click triggers callback
      Given I have a Task "Interactive Task" without Done status
      And Done button is visible
      When I click the "Done" button
      Then "onMarkDone" callback is called
      And file content is updated
      And layout is refreshed

    Scenario: Button has correct CSS class
      Given I have a Task without Done status
      When I view the Task with UniversalLayout
      Then button has class "exocortex-mark-done-btn"
      And button is inside container with class "exocortex-mark-done-section"

  Rule: Edge cases and data integrity

    Scenario: Preserve all other frontmatter properties
      Given I have a Task with frontmatter:
        | Property               | Value                    |
        | exo__Instance_class    | [[ems__Task]]            |
        | exo__Asset_uid         | task-uuid-123            |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]         |
        | ems__Effort_area       | [[Development]]          |
        | ems__Effort_priority   | High                     |
        | custom_field           | custom_value             |
      When I click "Done" button
      Then all original properties are preserved:
        | Property               |
        | exo__Instance_class    |
        | exo__Asset_uid         |
        | exo__Asset_isDefinedBy |
        | ems__Effort_area       |
        | ems__Effort_priority   |
        | custom_field           |
      And new properties are added:
        | Property                 |
        | ems__Effort_status       |
        | ems__Effort_endTimestamp |

    Scenario: Handle Task with array of statuses
      Given I have a Task with:
        | Key                 | Value                            |
        | exo__Instance_class | [[ems__Task]]                    |
        | ems__Effort_status  | ["[[ems__EffortStatusActive]]"]  |
      When I view the Task
      Then Done button is visible
      When I click "Done" button
      Then first status in array is replaced with "[[ems__EffortStatusDone]]"

    Scenario: Handle Task with empty string status
      Given I have a Task with:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Task]] |
        | ems__Effort_status  | ""            |
      When I view the Task
      Then Done button is visible
      When I click "Done" button
      Then status is set to "[[ems__EffortStatusDone]]"
