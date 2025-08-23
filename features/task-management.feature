@tasks
Feature: Task Management System
  As a knowledge worker
  I want to manage tasks within my Exocortex
  So that I can organize my work effectively

  Background:
    Given I have a vault with Exocortex plugin enabled
    And I have a project "Website Redesign" with class "Project"
    And I have a project "Mobile App" with class "Project"

  @smoke @tasks
  Scenario: Quick create task for current project
    Given I am viewing the project "Website Redesign"
    When I use the quick task creation command (Cmd+Shift+T)
    And I enter task title "Design homepage mockup"
    Then a new task should be created with:
      | property | value |
      | title | Design homepage mockup |
      | class | Task |
      | parent | Website Redesign |
      | status | todo |
      | created | today |
    And the task should appear in the project's children

  @tasks
  Scenario: Create child task from parent asset
    Given I have a task "Epic: User Authentication"
    When I create a child task "Implement login form"
    Then the child task should be created with:
      | property | value |
      | parent | Epic: User Authentication |
      | class | Task |
      | status | todo |
    And the parent task should show the child in its children list

  @tasks
  Scenario: Create child area from parent area
    Given I have an area "Development" with class "ems__Area"
    When I create a child area "Frontend Development"
    Then the child area should be created with:
      | property | value |
      | parent | Development |
      | class | ems__Area |
    And the hierarchy should be maintained

  @tasks
  Scenario: Task status progression
    Given I have a task "Write documentation" with status "todo"
    When I update the task status to "in_progress"
    Then the task frontmatter should update
    And the task should appear in "in_progress" queries
    When I update the task status to "done"
    Then the task should have a completion date

  @tasks
  Scenario: Task priority management
    Given I have tasks with different priorities:
      | title | priority |
      | Critical bug fix | high |
      | Feature request | medium |
      | Documentation update | low |
    When I query tasks by priority
    Then tasks should be ordered by priority:
      | order | title |
      | 1 | Critical bug fix |
      | 2 | Feature request |
      | 3 | Documentation update |

  @tasks
  Scenario: Project-based task filtering
    Given I have tasks in multiple projects:
      | task | project |
      | Design homepage | Website Redesign |
      | Implement API | Mobile App |
      | Write tests | Mobile App |
    When I view tasks for project "Mobile App"
    Then I should see only:
      | task |
      | Implement API |
      | Write tests |
    And I should not see "Design homepage"

  @tasks @efforts
  Scenario: Children efforts table display
    Given I have a project with child tasks:
      | task | status | effort |
      | Task A | done | 3h |
      | Task B | in_progress | 5h |
      | Task C | todo | 2h |
    When I view the project's children efforts
    Then I should see a professional table with:
      | columns |
      | Title |
      | Status |
      | Effort |
      | Progress |
    And status badges should be color-coded
    And total effort should show "10h"