Feature: Command Palette Integration for Asset Commands

  As an Obsidian user
  I want to access asset commands via Command Palette
  So that I can perform asset operations without clicking UI buttons

  Background:
    Given I have Exocortex plugin installed
    And Command Palette is available

  Rule: Commands appear in Command Palette with "Exocortex:" prefix

    Scenario: View all Exocortex commands in Command Palette
      When I open Command Palette
      Then I see "Exocortex: Create Task" command
      And I see "Exocortex: Start Effort" command
      And I see "Exocortex: Mark as Done" command
      And I see "Exocortex: Archive Task" command
      And I see "Exocortex: Clean Empty Properties" command
      And I see "Exocortex: Repair Folder" command

  Rule: Command availability matches button visibility

    Scenario: Create Task command available for Area
      Given I have a note "My Area" with frontmatter:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Area]]   |
      And I am viewing "My Area"
      When I open Command Palette
      Then "Exocortex: Create Task" command is available
      And Create Task button is visible in layout

    Scenario: Create Task command available for Project
      Given I have a note "My Project" with frontmatter:
        | Key                    | Value              |
        | exo__Instance_class    | [[ems__Project]]   |
      And I am viewing "My Project"
      When I open Command Palette
      Then "Exocortex: Create Task" command is available
      And Create Task button is visible in layout

    Scenario: Create Task command NOT available for Task
      Given I have a note "My Task" with frontmatter:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Task]]   |
      And I am viewing "My Task"
      When I open Command Palette
      Then "Exocortex: Create Task" command is NOT available
      And Create Task button is NOT visible in layout

    Scenario: Start Effort command available for Task without status
      Given I have a note "New Task" with frontmatter:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Task]]   |
      And I am viewing "New Task"
      When I open Command Palette
      Then "Exocortex: Start Effort" command is available
      And Start Effort button is visible in layout

    Scenario: Start Effort command NOT available for Task with Doing status
      Given I have a note "Doing Task" with frontmatter:
        | Key                    | Value                        |
        | exo__Instance_class    | [[ems__Task]]                |
        | ems__Effort_status     | [[ems__EffortStatusDoing]]   |
      And I am viewing "Doing Task"
      When I open Command Palette
      Then "Exocortex: Start Effort" command is NOT available
      And Start Effort button is NOT visible in layout

    Scenario: Mark as Done command available for Task without Done status
      Given I have a note "Active Task" with frontmatter:
        | Key                    | Value                        |
        | exo__Instance_class    | [[ems__Task]]                |
        | ems__Effort_status     | [[ems__EffortStatusActive]]  |
      And I am viewing "Active Task"
      When I open Command Palette
      Then "Exocortex: Mark as Done" command is available
      And Done button is visible in layout

    Scenario: Mark as Done command NOT available for Done Task
      Given I have a note "Done Task" with frontmatter:
        | Key                    | Value                      |
        | exo__Instance_class    | [[ems__Task]]              |
        | ems__Effort_status     | [[ems__EffortStatusDone]]  |
      And I am viewing "Done Task"
      When I open Command Palette
      Then "Exocortex: Mark as Done" command is NOT available
      And Done button is NOT visible in layout

    Scenario: Archive Task command available for Done Task not archived
      Given I have a note "Completed Task" with frontmatter:
        | Key                    | Value                      |
        | exo__Instance_class    | [[ems__Task]]              |
        | ems__Effort_status     | [[ems__EffortStatusDone]]  |
        | archived               | false                      |
      And I am viewing "Completed Task"
      When I open Command Palette
      Then "Exocortex: Archive Task" command is available
      And Archive button is visible in layout

    Scenario: Archive Task command NOT available for archived Task
      Given I have a note "Archived Task" with frontmatter:
        | Key                    | Value                      |
        | exo__Instance_class    | [[ems__Task]]              |
        | ems__Effort_status     | [[ems__EffortStatusDone]]  |
        | archived               | true                       |
      And I am viewing "Archived Task"
      When I open Command Palette
      Then "Exocortex: Archive Task" command is NOT available
      And Archive button is NOT visible in layout

    Scenario: Clean Properties command available when asset has empty properties
      Given I have a note "Messy Asset" with frontmatter:
        | Key           | Value    |
        | prop1         | ""       |
        | prop2         | "value"  |
      And I am viewing "Messy Asset"
      When I open Command Palette
      Then "Exocortex: Clean Empty Properties" command is available
      And Clean button is visible in layout

    Scenario: Clean Properties command NOT available when no empty properties
      Given I have a note "Clean Asset" with frontmatter:
        | Key           | Value    |
        | prop1         | "value1" |
        | prop2         | "value2" |
      And I am viewing "Clean Asset"
      When I open Command Palette
      Then "Exocortex: Clean Empty Properties" command is NOT available
      And Clean button is NOT visible in layout

    Scenario: Repair Folder command available when asset is in wrong folder
      Given I have a note "Misplaced Task" in folder "wrong-folder"
      And "Misplaced Task" has frontmatter:
        | Key                       | Value               |
        | exo__Instance_class       | [[ems__Task]]       |
        | exo__Asset_isDefinedBy    | [[Reference]]       |
      And "Reference" file is located in folder "correct-folder"
      And I am viewing "Misplaced Task"
      When I open Command Palette
      Then "Exocortex: Repair Folder" command is available
      And Repair Folder button is visible in layout

    Scenario: Repair Folder command NOT available when asset is in correct folder
      Given I have a note "Well-placed Task" in folder "correct-folder"
      And "Well-placed Task" has frontmatter:
        | Key                       | Value               |
        | exo__Instance_class       | [[ems__Task]]       |
        | exo__Asset_isDefinedBy    | [[Reference]]       |
      And "Reference" file is located in folder "correct-folder"
      And I am viewing "Well-placed Task"
      When I open Command Palette
      Then "Exocortex: Repair Folder" command is NOT available
      And Repair Folder button is NOT visible in layout

  Rule: Command execution performs same actions as button clicks

    Scenario: Execute Create Task via Command Palette
      Given I have a note "My Area" with:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Area]]   |
      And I am viewing "My Area"
      When I execute "Exocortex: Create Task" from Command Palette
      Then new Task file is created in same folder
      And new Task file is opened in new tab
      And new Task has frontmatter:
        | Property                 | Type                          |
        | exo__Instance_class      | [[ems__Task]]                 |
        | ems__Effort_area         | [[My Area]]                   |
        | exo__Asset_uid           | UUID                          |
        | exo__Asset_createdAt     | ISO 8601 timestamp            |

    Scenario: Execute Start Effort via Command Palette
      Given I have a note "My Task" with:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Task]]   |
      And I am viewing "My Task"
      When I execute "Exocortex: Start Effort" from Command Palette
      Then "My Task" frontmatter is updated with:
        | Property                   | Value                        |
        | ems__Effort_status         | [[ems__EffortStatusDoing]]   |
        | ems__Effort_startTimestamp | current ISO 8601 timestamp   |
      And I see notification "Started effort: My Task"

    Scenario: Execute Mark as Done via Command Palette
      Given I have a note "Active Task" with:
        | Key                    | Value                        |
        | exo__Instance_class    | [[ems__Task]]                |
        | ems__Effort_status     | [[ems__EffortStatusActive]]  |
      And I am viewing "Active Task"
      When I execute "Exocortex: Mark as Done" from Command Palette
      Then "Active Task" frontmatter is updated with:
        | Property                 | Value                      |
        | ems__Effort_status       | [[ems__EffortStatusDone]]  |
        | ems__Effort_endTimestamp | current ISO 8601 timestamp |
      And I see notification "Marked as done: Active Task"

    Scenario: Execute Archive Task via Command Palette
      Given I have a note "Done Task" with:
        | Key                    | Value                      |
        | exo__Instance_class    | [[ems__Task]]              |
        | ems__Effort_status     | [[ems__EffortStatusDone]]  |
        | archived               | false                      |
      And I am viewing "Done Task"
      When I execute "Exocortex: Archive Task" from Command Palette
      Then "Done Task" frontmatter is updated with:
        | Property | Value |
        | archived | true  |
      And I see notification "Archived: Done Task"

    Scenario: Execute Clean Properties via Command Palette
      Given I have a note "Messy Asset" with frontmatter:
        | Key           | Value    |
        | prop1         | ""       |
        | prop2         | null     |
        | prop3         | "value"  |
      And I am viewing "Messy Asset"
      When I execute "Exocortex: Clean Empty Properties" from Command Palette
      Then "Messy Asset" frontmatter is updated:
        | Property | Status   |
        | prop1    | removed  |
        | prop2    | removed  |
        | prop3    | kept     |
      And I see notification "Cleaned empty properties: Messy Asset"

    Scenario: Execute Repair Folder via Command Palette
      Given I have a note "Misplaced Task" in folder "wrong-folder"
      And "Misplaced Task" has frontmatter:
        | Key                       | Value               |
        | exo__Instance_class       | [[ems__Task]]       |
        | exo__Asset_isDefinedBy    | [[Reference]]       |
      And "Reference" file is located in folder "correct-folder"
      And I am viewing "Misplaced Task"
      When I execute "Exocortex: Repair Folder" from Command Palette
      Then "Misplaced Task" is moved to "correct-folder"
      And I see notification "Moved to correct-folder"

  Rule: Command availability updates when switching files

    Scenario: Commands update when switching from Area to Task
      Given I have two notes:
        | Note     | exo__Instance_class |
        | My Area  | [[ems__Area]]       |
        | My Task  | [[ems__Task]]       |
      And I am viewing "My Area"
      When I open Command Palette
      Then "Exocortex: Create Task" command is available
      When I switch to viewing "My Task"
      And I open Command Palette
      Then "Exocortex: Create Task" command is NOT available
      And "Exocortex: Start Effort" command is available

    Scenario: Commands update when task status changes
      Given I have a note "My Task" with:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Task]]   |
      And I am viewing "My Task"
      When I open Command Palette
      Then "Exocortex: Start Effort" command is available
      When I execute "Exocortex: Start Effort" from Command Palette
      And I open Command Palette again
      Then "Exocortex: Start Effort" command is NOT available
      And "Exocortex: Mark as Done" command is available

  Rule: Error handling for Command Palette execution

    Scenario: Command shows error notification on failure
      Given I have a note "My Area" with:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Area]]   |
      And I am viewing "My Area"
      And task creation will fail due to disk error
      When I execute "Exocortex: Create Task" from Command Palette
      Then I see error notification "Failed to create task: Disk error"
      And no new Task file is created
