Feature: Start Effort for Tasks and Projects

  Background:
    Given I am viewing a note with UniversalLayout

  Rule: Start Effort button appears only for Tasks/Projects without Doing or Done status

    Scenario: Display Start Effort button for Task without status
      Given I have a note "My Task" with frontmatter:
        | Key                    | Value             |
        | exo__Instance_class    | [[ems__Task]]     |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]  |
      When I view "My Task" with UniversalLayout
      Then I see a "Start Effort" button above properties table

    Scenario: Display Start Effort button for Task with non-Doing/Done status
      Given I have a Task "Active Task" with:
        | Key                    | Value                       |
        | exo__Instance_class    | [[ems__Task]]               |
        | ems__Effort_status     | [[ems__EffortStatusActive]] |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]            |
      When I view "Active Task" with UniversalLayout
      Then I see a "Start Effort" button

    Scenario: NO Start Effort button for Task with Doing status
      Given I have a Task "Doing Task" with:
        | Key                 | Value                       |
        | exo__Instance_class | [[ems__Task]]               |
        | ems__Effort_status  | [[ems__EffortStatusDoing]]  |
      When I view "Doing Task" with UniversalLayout
      Then I do NOT see "Start Effort" button

    Scenario: NO Start Effort button for completed Task
      Given I have a Task "Completed Task" with:
        | Key                 | Value                      |
        | exo__Instance_class | [[ems__Task]]              |
        | ems__Effort_status  | [[ems__EffortStatusDone]]  |
      When I view "Completed Task" with UniversalLayout
      Then I do NOT see "Start Effort" button

    Scenario: Display Start Effort button for Project without status
      Given I have a note "My Project" with:
        | Key                 | Value            |
        | exo__Instance_class | [[ems__Project]] |
      When I view "My Project" with UniversalLayout
      Then I see a "Start Effort" button

    Scenario: Display Start Effort button for Project with non-Doing/Done status
      Given I have a Project "Active Project" with:
        | Key                 | Value                       |
        | exo__Instance_class | [[ems__Project]]            |
        | ems__Effort_status  | [[ems__EffortStatusActive]] |
      When I view "Active Project" with UniversalLayout
      Then I see a "Start Effort" button

    Scenario: NO Start Effort button for Project with Doing status
      Given I have a Project "Doing Project" with:
        | Key                 | Value                      |
        | exo__Instance_class | [[ems__Project]]           |
        | ems__Effort_status  | [[ems__EffortStatusDoing]] |
      When I view "Doing Project" with UniversalLayout
      Then I do NOT see "Start Effort" button

    Scenario: NO Start Effort button for completed Project
      Given I have a Project "Completed Project" with:
        | Key                 | Value                     |
        | exo__Instance_class | [[ems__Project]]          |
        | ems__Effort_status  | [[ems__EffortStatusDone]] |
      When I view "Completed Project" with UniversalLayout
      Then I do NOT see "Start Effort" button

    Scenario: NO Start Effort button for non-Task/Project assets (Area)
      Given I have a note "Area Asset" with:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Area]] |
      When I view "Area Asset" with UniversalLayout
      Then I do NOT see "Start Effort" button

  Rule: Clicking Start Effort button updates Task status to Doing

    Scenario: Start Effort sets status and timestamp
      Given I have a Task "New Task" with:
        | Key                    | Value             |
        | exo__Instance_class    | [[ems__Task]]     |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]  |
      When I click "Start Effort" button
      Then Task frontmatter is updated with:
        | Property                  | Value                       | Format                |
        | ems__Effort_status        | [[ems__EffortStatusDoing]]  | quoted wiki-link      |
        | ems__Effort_startTimestamp| current timestamp           | ISO 8601 (no ms)      |
      And "Start Effort" button disappears from layout

    Scenario: Start Effort for Task without initial status
      Given I have a Task "New Task" with:
        | Key                    | Value             |
        | exo__Instance_class    | [[ems__Task]]     |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]  |
      And Task has NO "ems__Effort_status" property
      When I click "Start Effort" button
      Then frontmatter is updated with:
        | Property                   | Value                      |
        | ems__Effort_status         | [[ems__EffortStatusDoing]] |
        | ems__Effort_startTimestamp | current timestamp          |
      And other properties are preserved:
        | Property               |
        | exo__Instance_class    |
        | exo__Asset_isDefinedBy |

    Scenario: Timestamp format is ISO 8601 without milliseconds
      Given I have a Task "Task for Timestamp Test"
      When I click "Start Effort" button
      Then "ems__Effort_startTimestamp" matches format: YYYY-MM-DDTHH:MM:SS
      And timestamp does NOT contain milliseconds
      And timestamp does NOT contain timezone suffix

    Scenario: Update existing timestamp when starting effort again
      Given I have a Task "Previously Started Task" with:
        | Key                        | Value                      |
        | exo__Instance_class        | [[ems__Task]]              |
        | ems__Effort_status         | [[ems__EffortStatusDoing]] |
        | ems__Effort_startTimestamp | 2025-01-01T10:00:00        |
      And I manually change status to "[[ems__EffortStatusActive]]"
      When I click "Start Effort" button
      Then "ems__Effort_startTimestamp" is updated to current time
      And old timestamp "2025-01-01T10:00:00" is replaced

  Rule: Start Effort button interaction and UI behavior

    Scenario: Button click triggers callback
      Given I have a Task "Interactive Task" without Doing status
      And Start Effort button is visible
      When I click the "Start Effort" button
      Then "onStartEffort" callback is called
      And file content is updated
      And layout is refreshed

    Scenario: Button has correct CSS class
      Given I have a Task without Doing status
      When I view the Task with UniversalLayout
      Then button has class "exocortex-start-effort-btn"
      And button is inside container with class "exocortex-start-effort-section"

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
      When I click "Start Effort" button
      Then all original properties are preserved:
        | Property               |
        | exo__Instance_class    |
        | exo__Asset_uid         |
        | exo__Asset_isDefinedBy |
        | ems__Effort_area       |
        | ems__Effort_priority   |
        | custom_field           |
      And new properties are added:
        | Property                   |
        | ems__Effort_status         |
        | ems__Effort_startTimestamp |

    Scenario: Handle Task with array of statuses
      Given I have a Task with:
        | Key                 | Value                            |
        | exo__Instance_class | [[ems__Task]]                    |
        | ems__Effort_status  | ["[[ems__EffortStatusActive]]"]  |
      When I view the Task
      Then Start Effort button is visible
      When I click "Start Effort" button
      Then first status in array is replaced with "[[ems__EffortStatusDoing]]"

    Scenario: Handle Task with empty string status
      Given I have a Task with:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Task]] |
        | ems__Effort_status  | ""            |
      When I view the Task
      Then Start Effort button is visible
      When I click "Start Effort" button
      Then status is set to "[[ems__EffortStatusDoing]]"
