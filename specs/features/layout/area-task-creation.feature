# language: en
@task-creation @critical
Feature: Create Task from Area

  As an Exocortex user working with Areas
  I want to quickly create new Tasks from an Area
  So that I can efficiently manage my work efforts

  Background:
    Given the Exocortex plugin is loaded
    And uuid package is available for unique IDs

  Rule: Create Task button appears only for Area assets

    Scenario: Display Create Task button for Area asset
      Given I have a note "My Project Area" with frontmatter:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Area]]   |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]] |
        | exo__Asset_uid         | area-uuid-123   |
      When I view "My Project Area" with UniversalLayout
      Then I see a "Create Task" button above properties table
      And button has CSS class "exocortex-create-task-btn"

    Scenario: No Create Task button for non-Area assets
      Given I have a note "Regular Task" with frontmatter:
        | Key                 | Value         |
        | exo__Instance_class | [[ems__Task]] |
      When I view "Regular Task" with UniversalLayout
      Then I do NOT see "Create Task" button

    Scenario: No Create Task button when no Instance Class
      Given I have a note "Plain Note" with no frontmatter
      When I view "Plain Note" with UniversalLayout
      Then I do NOT see "Create Task" button

  Rule: Create Task generates correct frontmatter

    Scenario: Create Task with all required properties
      Given I have Area "Sprint Planning" with:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Area]]   |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]] |
        | exo__Asset_uid         | area-001        |
      When I click "Create Task" button
      Then a new note is created with name format "Task-{timestamp}"
      And new note has frontmatter:
        | Property                | Value Type         | Source               |
        | exo__Instance_class     | [[ems__Task]]      | hardcoded            |
        | exo__Asset_isDefinedBy  | [[Ontology/EMS]]   | copied from Area     |
        | exo__Asset_uid          | UUIDv4             | generated            |
        | exo__Asset_createdAt    | ISO 8601 timestamp | current time         |
        | exo__Effort_area        | [[Sprint Planning]]| link to source Area  |

    Scenario: Generated UID is valid UUIDv4
      Given I have Area "Development"
      When I click "Create Task" button
      Then new Task has exo__Asset_uid matching pattern "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"

    Scenario: Timestamp follows ISO 8601 format
      Given I have Area "QA Testing"
      When I click "Create Task" button at "2025-10-04T15:30:45"
      Then new Task has exo__Asset_createdAt equal to "2025-10-04T15:30:45"

  Rule: Task creation behavior and file management

    Scenario: New Task opens in new tab
      Given I have Area "Research"
      When I click "Create Task" button
      Then new Task file opens in a new Obsidian leaf
      And I can immediately edit the Task

    Scenario: Task filename uses timestamp
      Given current time is "2025-10-04T16:23:50"
      And I have Area "Documentation"
      When I click "Create Task" button
      Then new file is created with name "Task-2025-10-04T16-23-50.md"

    Scenario: Task created in same folder as Area
      Given Area "Backend" is in folder "Projects/Backend/"
      When I click "Create Task" button
      Then new Task is created in "Projects/Backend/" folder
