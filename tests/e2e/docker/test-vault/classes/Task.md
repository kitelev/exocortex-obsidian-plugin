---
exo__Class: Class
name: Task
description: A work item or activity that needs to be completed
superClass: Asset
properties:
  - name
  - description
  - status
  - priority
  - due_date
  - assignee
  - project
  - estimated_effort
---

# Task

Tasks represent work items or activities that need to be completed. They inherit from the Asset base class and add task-specific properties.

## Properties

- **priority**: Task priority (low, medium, high, critical)
- **due_date**: When the task should be completed
- **assignee**: Person responsible for the task
- **project**: Associated project
- **estimated_effort**: Time estimate for completion

## Layout Configuration

Tasks use a specialized layout that shows:
- Task details (properties)
- Task actions (buttons)
- Subtasks (query block)
- Related tasks (backlinks)