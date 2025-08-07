---
exo__Instance_class: "[[ui__ClassLayout]]"
exo__Asset_uid: "layout-ems-task-001"
exo__Asset_label: "Task Layout Configuration"
ui__ClassLayout_targetClass: "[[ems__Task]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_enabled: true
ui__ClassLayout_blocks:
  - id: "task-properties"
    type: "properties"
    title: "📝 Task Details"
    order: 1
    isVisible: true
    config:
      type: "properties"
      includedProperties:
        - "exo__Asset_label"
        - "ems__Effort_status"
        - "ems__Task_priority"
        - "ems__Task_deadline"
        - "ems__Task_assignee"
        - "ems__Task_project"
        - "ems__Task_area"
        - "ems__Task_estimatedHours"
        - "ems__Task_actualHours"
      editableProperties:
        - "ems__Effort_status"
        - "ems__Task_priority"
        - "ems__Task_deadline"
        - "ems__Task_actualHours"
      groupBy: "category"
  - id: "subtasks"
    type: "query"
    title: "📋 Subtasks"
    order: 2
    isVisible: true
    config:
      type: "query"
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_parent"
          operator: "equals"
          value: "{{current_asset}}"
      sortBy: "ems__Task_order"
      sortOrder: "asc"
      displayAs: "list"
  - id: "dependencies"
    type: "query"
    title: "🔗 Dependencies"
    order: 3
    isVisible: true
    isCollapsible: true
    config:
      type: "query"
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_blockedBy"
          operator: "contains"
          value: "{{current_asset}}"
      displayAs: "list"
  - id: "related-notes"
    type: "backlinks"
    title: "📎 Related Notes"
    order: 4
    isVisible: true
    config:
      type: "backlinks"
      filterByClass: "exo__Note"
      maxResults: 10
  - id: "task-history"
    type: "custom"
    title: "📜 Task History"
    order: 5
    isVisible: true
    isCollapsible: true
    isCollapsed: true
    config:
      type: "custom"
      customScript: |
        // Display task history/comments
        const history = container.createDiv({ cls: 'task-history' });
        history.createEl('p', { text: 'Task created: ' + file.stat.ctime.toLocaleDateString() });
        history.createEl('p', { text: 'Last modified: ' + file.stat.mtime.toLocaleDateString() });
        
        // Add any comments from the file content
        const content = await app.vault.read(file);
        const commentsMatch = content.match(/## Comments\n([\s\S]*?)(?=\n##|$)/);
        if (commentsMatch) {
          history.createEl('h4', { text: 'Comments' });
          history.createEl('div', { text: commentsMatch[1] });
        }
---

# Task Layout Configuration

This layout configuration defines how `ems__Task` assets are displayed.

## Features

### Task Details
Comprehensive task properties grouped by category:
- **Status & Priority**: Current state and importance
- **Timeline**: Deadlines and time tracking
- **Context**: Project and area associations

### Subtasks
Hierarchical task breakdown showing child tasks.

### Dependencies
Shows tasks that depend on this task.

### Related Notes
Backlinks filtered to show only notes.

### Task History
Custom script showing task timeline and embedded comments.

## Property Grouping

Properties are organized into logical groups:
- Status information
- Time tracking
- Organizational context

## Usage

Place in layouts folder and open any task to see this enhanced view.