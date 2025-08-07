---
exo__Instance_class: "[[ui__ClassLayout]]"
exo__Asset_uid: "layout-ems-project-001"
exo__Asset_label: "Project Layout Configuration"
ui__ClassLayout_targetClass: "[[ems__Project]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_enabled: true
ui__ClassLayout_blocks:
  - id: "project-info"
    type: "properties"
    title: "📋 Project Information"
    order: 1
    isVisible: true
    config:
      type: "properties"
      includedProperties:
        - "exo__Asset_label"
        - "ems__Project_status"
        - "ems__Project_deadline"
        - "ems__Project_priority"
        - "ems__Project_owner"
      editableProperties:
        - "ems__Project_status"
        - "ems__Project_deadline"
        - "ems__Project_priority"
  - id: "incomplete-tasks"
    type: "query"
    title: "📝 Active Tasks"
    order: 2
    isVisible: true
    isCollapsible: true
    config:
      type: "query"
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_project"
          operator: "equals"
          value: "{{current_asset}}"
        - property: "ems__Effort_status"
          operator: "notEquals"
          value: "[[ems__EffortStatus - Done]]"
      sortBy: "ems__Task_priority"
      sortOrder: "desc"
      maxResults: 20
      displayAs: "list"
  - id: "completed-tasks"
    type: "query"
    title: "✅ Completed Tasks"
    order: 3
    isVisible: true
    isCollapsible: true
    isCollapsed: true
    config:
      type: "query"
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_project"
          operator: "equals"
          value: "{{current_asset}}"
        - property: "ems__Effort_status"
          operator: "equals"
          value: "[[ems__EffortStatus - Done]]"
      sortBy: "ems__Task_completedDate"
      sortOrder: "desc"
      maxResults: 10
      displayAs: "list"
  - id: "project-milestones"
    type: "query"
    title: "🎯 Milestones"
    order: 4
    isVisible: true
    config:
      type: "query"
      className: "ems__Milestone"
      propertyFilters:
        - property: "ems__Milestone_project"
          operator: "equals"
          value: "{{current_asset}}"
      sortBy: "ems__Milestone_date"
      sortOrder: "asc"
      displayAs: "table"
  - id: "related-docs"
    type: "relations"
    title: "📚 Related Documents"
    order: 5
    isVisible: true
    config:
      type: "relations"
      relationProperty: "exo__Asset_relates"
      showForwardLinks: true
      showBacklinks: false
---

# Project Layout Configuration

This layout configuration defines how `ems__Project` assets are displayed in the Exocortex plugin.

## Features

### Project Information Block
Shows key project properties with inline editing for:
- Status
- Deadline
- Priority

### Active Tasks Block
Displays all incomplete tasks associated with this project, sorted by priority.

### Completed Tasks Block
Shows recently completed tasks (collapsed by default).

### Milestones Block
Displays project milestones in a table format.

### Related Documents Block
Shows all documents related to this project.

## Usage

1. Place this file in your configured layouts folder
2. Enable "Class-Based Layouts" in plugin settings
3. Open any project asset to see this layout applied

## Customization

Modify the `ui__ClassLayout_blocks` frontmatter to:
- Add/remove blocks
- Change block order
- Adjust filters and sorting
- Toggle visibility