@business @workflow @task-management
Feature: Task Management - Complete Lifecycle
  As a knowledge worker using the Exocortex plugin
  I want to manage tasks through their complete lifecycle
  So that I can track progress, maintain organization, and achieve my goals

  Background:
    Given the Exocortex plugin is initialized
    And the task management system is enabled
    And I have the following task priorities available:
      | priority | value |
      | high     | 3     |
      | medium   | 2     |
      | low      | 1     |
    And I have the following task statuses available:
      | status      | can_transition_to           |
      | todo        | in_progress,cancelled       |
      | in_progress | done,blocked,todo           |
      | blocked     | todo,in_progress,cancelled  |
      | done        | todo                        |
      | cancelled   | todo                        |

  @create @validation
  Scenario: Create a basic task with valid data
    Given I am creating a new task
    When I provide the following task details:
      | title           | Learn RDF fundamentals               |
      | description     | Study RDF spec and practice queries  |
      | priority        | medium                               |
      | estimated_hours | 4                                    |
      | tags            | learning,rdf                         |
    Then the task should be created successfully
    And the task should have a valid UUID
    And the task status should be "todo"
    And the created timestamp should be set
    And the updated timestamp should equal the created timestamp
    And the task should be persisted with frontmatter

  @create @validation @error-handling
  Scenario: Attempt to create task with invalid title
    Given I am creating a new task
    When I provide the following invalid task details:
      | title           |                                      |
      | description     | This task has an empty title         |
      | priority        | medium                               |
    Then the task creation should fail
    And I should receive the error "Task title cannot be empty"
    And no task should be created

  @create @validation @edge-cases
  Scenario: Create task with title at maximum length
    Given I am creating a new task
    When I provide a task title with exactly 200 characters
    Then the task should be created successfully
    And the title length should be exactly 200 characters

  @create @validation @error-handling
  Scenario: Attempt to create task with title exceeding maximum length
    Given I am creating a new task
    When I provide a task title with 201 characters
    Then the task creation should fail
    And I should receive the error "Task title cannot exceed 200 characters"

  @create @validation @business-rules
  Scenario: Create task with past due date shows warning
    Given I am creating a new task
    And today is "2025-01-15T10:00:00Z"
    When I provide the following task details:
      | title    | Overdue task example       |
      | due_date | 2025-01-10T15:00:00Z      |
      | priority | high                       |
    Then the task should be created successfully
    And a warning should be logged about the past due date
    But the task creation should not fail

  @create @validation @error-handling
  Scenario: Attempt to create task with negative estimated hours
    Given I am creating a new task
    When I provide the following invalid task details:
      | title           | Invalid hours task           |
      | estimated_hours | -5                           |
    Then the task creation should fail
    And I should receive the error "Estimated hours cannot be negative"

  @update @status-transitions @business-rules
  Scenario Outline: Valid task status transitions
    Given I have a task with status "<current_status>"
    When I update the task status to "<new_status>"
    Then the status update should succeed
    And the task status should be "<new_status>"
    And the updated timestamp should be modified
    And if the new status is "done" then the completed timestamp should be set

    Examples:
      | current_status | new_status  |
      | todo           | in_progress |
      | in_progress    | done        |
      | in_progress    | blocked     |
      | blocked        | in_progress |
      | done           | todo        |
      | cancelled      | todo        |

  @update @status-transitions @error-handling
  Scenario Outline: Invalid task status transitions
    Given I have a task with status "<current_status>"
    When I attempt to update the task status to "<invalid_status>"
    Then the status update should fail
    And I should receive an error about invalid transition
    And the task status should remain "<current_status>"

    Examples:
      | current_status | invalid_status |
      | todo           | done           |
      | todo           | blocked        |
      | in_progress    | cancelled      |
      | done           | blocked        |
      | done           | cancelled      |

  @update @completion-tracking
  Scenario: Completing a task sets completion timestamp
    Given I have an in-progress task
    And the task has no completion timestamp
    When I update the task status to "done"
    Then the task should have a completion timestamp
    And the completion timestamp should be recent

  @update @completion-tracking
  Scenario: Reopening a completed task clears completion timestamp
    Given I have a completed task with a completion timestamp
    When I update the task status to "todo"
    Then the completion timestamp should be cleared
    And the task status should be "todo"

  @update @validation @business-rules
  Scenario: Update task title with valid data
    Given I have an existing task
    When I update the task title to "Updated task title"
    Then the title update should succeed
    And the task title should be "Updated task title"
    And the updated timestamp should be modified

  @update @validation @error-handling
  Scenario: Attempt to update task title to empty string
    Given I have an existing task with title "Original title"
    When I attempt to update the task title to ""
    Then the title update should fail
    And I should receive the error "Task title cannot be empty"
    And the task title should remain "Original title"

  @update @estimation
  Scenario: Update estimated hours with valid value
    Given I have a task with estimated hours of 2
    When I update the estimated hours to 5
    Then the hours update should succeed
    And the estimated hours should be 5
    And the updated timestamp should be modified

  @update @estimation @error-handling
  Scenario: Attempt to update estimated hours to negative value
    Given I have a task with estimated hours of 2
    When I attempt to update the estimated hours to -3
    Then the hours update should fail
    And I should receive the error "Estimated hours cannot be negative"
    And the estimated hours should remain 2

  @project-assignment @relationships
  Scenario: Assign task to a project
    Given I have an unassigned task
    And I have a project with ID "project-123"
    When I assign the task to the project
    Then the task should be assigned to "project-123"
    And the updated timestamp should be modified
    And the task frontmatter should include the project reference

  @project-assignment @relationships
  Scenario: Remove task from project
    Given I have a task assigned to project "project-123"
    When I remove the task from the project
    Then the task should have no project assignment
    And the updated timestamp should be modified
    And the project reference should be removed from frontmatter

  @tagging @metadata
  Scenario: Add tags to a task
    Given I have a task with tags: "work,planning"
    When I add the tag "urgent"
    Then the task should have tags: "work,planning,urgent"
    And the updated timestamp should be modified

  @tagging @metadata
  Scenario: Remove tags from a task
    Given I have a task with tags: "work,planning,urgent"
    When I remove the tag "urgent"
    Then the task should have tags: "work,planning"
    And the updated timestamp should be modified

  @tagging @validation
  Scenario: Add duplicate tag is ignored
    Given I have a task with tags: "work,planning"
    When I add the tag "work"
    Then the task should still have tags: "work,planning"
    And the tag should not be duplicated

  @query @business-intelligence
  Scenario: Query overdue tasks
    Given I have the following tasks:
      | title          | due_date             | status      |
      | Overdue task 1 | 2025-01-10T10:00:00Z | todo        |
      | Overdue task 2 | 2025-01-12T15:00:00Z | in_progress |
      | Future task    | 2025-01-20T10:00:00Z | todo        |
      | Done task      | 2025-01-05T10:00:00Z | done        |
    And today is "2025-01-15T10:00:00Z"
    When I query for overdue tasks
    Then I should get 2 overdue tasks
    And the results should include "Overdue task 1" and "Overdue task 2"
    And the results should not include "Future task" or "Done task"

  @query @business-intelligence
  Scenario: Query tasks due today
    Given I have the following tasks:
      | title           | due_date             | status |
      | Due today 1     | 2025-01-15T09:00:00Z | todo   |
      | Due today 2     | 2025-01-15T17:00:00Z | todo   |
      | Due yesterday   | 2025-01-14T10:00:00Z | todo   |
      | Due tomorrow    | 2025-01-16T10:00:00Z | todo   |
    And today is "2025-01-15T12:00:00Z"
    When I query for tasks due today
    Then I should get 2 tasks due today
    And the results should include "Due today 1" and "Due today 2"

  @query @prioritization
  Scenario: Query high priority tasks
    Given I have the following tasks:
      | title           | priority |
      | Critical task   | high     |
      | Important task  | high     |
      | Normal task     | medium   |
      | Minor task      | low      |
    When I query for high priority tasks
    Then I should get 2 high priority tasks
    And the results should include "Critical task" and "Important task"

  @persistence @frontmatter
  Scenario: Task data is correctly serialized to frontmatter
    Given I have a task with the following properties:
      | title           | Complete documentation review    |
      | description     | Review all user-facing docs      |
      | priority        | high                             |
      | status          | in_progress                      |
      | project_id      | project-456                      |
      | due_date        | 2025-01-20                       |
      | estimated_hours | 6                                |
      | tags            | documentation,review             |
    When the task is serialized to frontmatter
    Then the frontmatter should contain:
      | key                      | value                         |
      | exo__Task_title          | Complete documentation review |
      | exo__Task_priority       | high                          |
      | exo__Task_status         | in_progress                   |
      | exo__Effort_parent       | [[project-456]]               |
      | exo__Task_dueDate        | 2025-01-20                    |
      | exo__Task_estimatedHours | 6                             |
      | exo__Task_tags           | [documentation,review]        |

  @persistence @deserialization
  Scenario: Task is correctly created from frontmatter
    Given I have a note with the following frontmatter:
      | key                      | value                         |
      | exo__Task_title          | Imported task from note       |
      | exo__Task_description    | This task was imported        |
      | exo__Task_priority       | medium                        |
      | exo__Task_status         | todo                          |
      | exo__Task_dueDate        | 2025-01-25                    |
      | exo__Task_estimatedHours | 3                             |
      | exo__Task_tags           | [imported,test]               |
    When I create a task from the frontmatter
    Then the task should be created successfully
    And the task properties should match the frontmatter values

  @persistence @error-handling
  Scenario: Handle corrupted task frontmatter gracefully
    Given I have a note with invalid frontmatter:
      | key                | value           |
      | exo__Task_priority | invalid_priority|
      | exo__Task_status   | invalid_status  |
    When I attempt to create a task from the frontmatter
    Then the task creation should use default values
    And a warning should be logged about invalid data
    And the task should still be created with fallback values

  @markdown-generation
  Scenario: Generate markdown content for task
    Given I have a task with complete information:
      | title           | Write comprehensive tests        |
      | description     | Add BDD tests for all features   |
      | priority        | high                             |
      | status          | in_progress                      |
      | due_date        | 2025-01-30                       |
      | estimated_hours | 8                                |
      | tags            | testing,bdd                      |
    When I generate markdown for the task
    Then the markdown should include:
      | element              | content                      |
      | header               | # Write comprehensive tests  |
      | description          | Add BDD tests for all features |
      | status_checkbox      | - [ ] **Status**: in_progress |
      | priority             | - **Priority**: high          |
      | due_date            | - **Due Date**: 2025-01-30    |
      | estimated_hours     | - **Estimated Hours**: 8      |
      | tags                | - **Tags**: #testing #bdd     |

  @performance @bulk-operations
  Scenario: Handle bulk task operations efficiently
    Given I have 1000 existing tasks in the system
    When I perform bulk operations:
      | operation        | count |
      | status_updates   | 100   |
      | tag_additions    | 50    |
      | project_assignments | 75 |
    Then all operations should complete within 5 seconds
    And no memory leaks should occur
    And the task cache should remain consistent

  @concurrency @data-integrity
  Scenario: Handle concurrent task modifications
    Given I have a task being edited simultaneously by two processes
    When process A updates the task title
    And process B updates the task priority at the same time
    Then both updates should be handled correctly
    And the final task should have both changes
    And no data corruption should occur
    And the updated timestamp should reflect the latest change

  @integration @search
  Scenario: Tasks are searchable through Obsidian
    Given I have created multiple tasks with different properties
    When I search for tasks using Obsidian's search functionality
    Then I should find tasks by:
      | search_criteria    | expected_results              |
      | title_content      | Tasks with matching titles    |
      | tag_content        | Tasks with specific tags      |
      | frontmatter_values | Tasks with property matches   |
      | description_text   | Tasks with content matches    |

  @accessibility @ui-integration
  Scenario: Task management interface is accessible
    Given the task management UI is displayed
    When I navigate using keyboard only
    Then all task management functions should be accessible
    And proper ARIA labels should be present
    And focus management should work correctly
    And screen readers should announce changes appropriately