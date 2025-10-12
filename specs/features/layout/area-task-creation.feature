# language: en
@task-creation @critical
Feature: Create Task from Area or Project

  As an Exocortex user working with Areas and Projects
  I want to quickly create new Tasks from an Area or Project
  So that I can efficiently manage my work efforts

  Background:
    Given the Exocortex plugin is loaded
    And uuid package is available for unique IDs

  Rule: Create Task button appears for Area and Project assets

    Scenario: Display Create Task button for Area asset
      Given I have a note "My Project Area" with frontmatter:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Area]]   |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]] |
        | exo__Asset_uid         | area-uuid-123   |
      When I view "My Project Area" with UniversalLayout
      Then I see a "Create Task" button above properties table
      And button has CSS class "exocortex-create-task-btn"

    Scenario: Display Create Task button for Project asset
      Given I have a note "Website Redesign" with frontmatter:
        | Key                    | Value             |
        | exo__Instance_class    | [[ems__Project]]  |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]  |
        | exo__Asset_uid         | project-uuid-456  |
      When I view "Website Redesign" with UniversalLayout
      Then I see a "Create Task" button above properties table
      And button has CSS class "exocortex-create-task-btn"

    Scenario: No Create Task button for non-Area/Project assets
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

    Scenario: Create Task from Area with all required properties
      Given I have Area "Sprint Planning" with:
        | Key                    | Value           |
        | exo__Instance_class    | [[ems__Area]]   |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]] |
        | exo__Asset_uid         | area-001        |
      When I click "Create Task" button
      Then a new note is created with name format "Task-{timestamp}"
      And new note has frontmatter in this property order:
        | Order | Property                | Value Type         | Source               |
        | 1     | exo__Asset_isDefinedBy  | [[Ontology/EMS]]   | copied from Area     |
        | 2     | exo__Asset_uid          | UUIDv4             | generated            |
        | 3     | exo__Asset_createdAt    | ISO 8601 timestamp | current time         |
        | 4     | exo__Instance_class     | [[ems__Task]]      | hardcoded            |
        | 5     | ems__Effort_area        | [[Sprint Planning]]| link to source Area  |

    Scenario: Create Task from Project with all required properties
      Given I have Project "Website Redesign" with:
        | Key                    | Value             |
        | exo__Instance_class    | [[ems__Project]]  |
        | exo__Asset_isDefinedBy | [[Ontology/EMS]]  |
        | exo__Asset_uid         | project-001       |
      When I click "Create Task" button
      Then a new note is created with name format "Task-{timestamp}"
      And new note has frontmatter in this property order:
        | Order | Property                | Value Type           | Source                 |
        | 1     | exo__Asset_isDefinedBy  | [[Ontology/EMS]]     | copied from Project    |
        | 2     | exo__Asset_uid          | UUIDv4               | generated              |
        | 3     | exo__Asset_createdAt    | ISO 8601 timestamp   | current time           |
        | 4     | exo__Instance_class     | [[ems__Task]]        | hardcoded              |
        | 5     | ems__Effort_parent      | [[Website Redesign]] | link to source Project |

    Scenario: Frontmatter uses correct YAML format with quoted wiki-links
      Given I have Area "Sales Offering People Management" with frontmatter:
        """
        ---
        exo__Asset_isDefinedBy: "[[!toos]]"
        exo__Asset_uid: e827976e-3439-4f83-8a40-3d06ec0334c3
        exo__Instance_class:
          - "[[ems__Area]]"
        ems__Area_parent: "[[Sales Offering (Area)]]"
        ---
        """
      When I click "Create Task" button
      Then new Task has frontmatter in correct YAML format with property order:
        """
        ---
        exo__Asset_isDefinedBy: "[[!toos]]"
        exo__Asset_uid: <generated-uuid>
        exo__Asset_createdAt: <current-timestamp>
        exo__Instance_class:
          - "[[ems__Task]]"
        ems__Effort_area: "[[Sales Offering People Management (Area)]]"
        ---
        """
      And exo__Instance_class is YAML array with quoted wiki-link
      And exo__Asset_isDefinedBy is quoted wiki-link string
      And ems__Effort_area is quoted wiki-link string

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

    Scenario: Task created in same folder as Project
      Given Project "Mobile App" is in folder "Projects/Mobile/"
      When I click "Create Task" button
      Then new Task is created in "Projects/Mobile/" folder
