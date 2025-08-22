---
exo__Instance_class: "[[ui__ClassLayout]]"
exo__Asset_uid: "layout-ems-area-001"
exo__Asset_label: "Area Layout Configuration"
ui__ClassLayout_targetClass: "[[ems__Area]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_enabled: true
ui__ClassLayout_blocks:
  - id: "area-actions"
    type: "buttons"
    title: "🎯 Area Actions"
    order: 0.5
    isVisible: true
    config:
      type: "buttons"
      buttons:
        - id: "create-child-zone"
          label: "➕ Create Child Zone"
          commandType: "CREATE_CHILD_AREA"
          tooltip: "Create a child area under this zone"
          style: "primary"
  - id: "area-info"
    type: "properties"
    title: "📋 Area Information"
    order: 1
    isVisible: true
    config:
      type: "properties"
      includedProperties:
        - "exo__Asset_label"
        - "ems__Area_status"
        - "ems__Area_owner"
        - "ems__Area_parent"
      editableProperties:
        - "ems__Area_status"
        - "ems__Area_owner"
  - id: "child-areas"
    type: "query"
    title: "🏢 Child Areas"
    order: 2
    isVisible: true
    isCollapsible: true
    config:
      type: "query"
      className: "ems__Area"
      propertyFilters:
        - property: "ems__Area_parent"
          operator: "equals"
          value: "{{current_asset}}"
      sortBy: "exo__Asset_label"
      sortOrder: "asc"
      maxResults: 50
      displayAs: "list"
  - id: "area-efforts"
    type: "query"
    title: "📌 Assigned Efforts"
    order: 3
    isVisible: true
    isCollapsible: true
    config:
      type: "query"
      className: "ems__Effort"
      propertyFilters:
        - property: "ems__Effort_area"
          operator: "equals"
          value: "{{current_asset}}"
        - property: "ems__Effort_status"
          operator: "notEquals"
          value: "[[ems__EffortStatus - Done]]"
      sortBy: "ems__Effort_priority"
      sortOrder: "desc"
      maxResults: 20
      displayAs: "table"
  - id: "area-projects"
    type: "query"
    title: "🚀 Active Projects"
    order: 4
    isVisible: true
    isCollapsible: true
    config:
      type: "query"
      className: "ems__Project"
      propertyFilters:
        - property: "ems__Project_area"
          operator: "equals"
          value: "{{current_asset}}"
        - property: "ems__Project_status"
          operator: "notEquals"
          value: "[[ems__ProjectStatus - Completed]]"
      sortBy: "ems__Project_priority"
      sortOrder: "desc"
      maxResults: 15
      displayAs: "table"
  - id: "area-tasks"
    type: "query"
    title: "📝 Active Tasks"
    order: 5
    isVisible: true
    isCollapsible: true
    isCollapsed: true
    config:
      type: "query"
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_area"
          operator: "equals"
          value: "{{current_asset}}"
        - property: "ems__Effort_status"
          operator: "notEquals"
          value: "[[ems__EffortStatus - Done]]"
      sortBy: "ems__Task_priority"
      sortOrder: "desc"
      maxResults: 30
      displayAs: "list"
  - id: "related-resources"
    type: "relations"
    title: "🔗 Related Resources"
    order: 6
    isVisible: true
    config:
      type: "relations"
      relationProperty: "exo__Asset_relates"
      showForwardLinks: true
      showBacklinks: true
---

# Area Layout Configuration

This layout configuration defines how `ems__Area` assets are displayed in the Exocortex plugin.

## Features

### Area Actions Block

Provides quick action buttons including:
- **Create Child Zone**: Creates a new child area with automatic parent relationship setup

### Area Information Block

Shows key area properties with inline editing for:
- Status
- Owner

### Child Areas Block

Displays all child areas under this zone, showing the hierarchical structure of areas.

### Assigned Efforts Block

Shows all active efforts (tasks, projects, meetings) assigned to this area.

### Active Projects Block

Displays all active projects assigned to this area in a table format.

### Active Tasks Block

Lists all incomplete tasks assigned to this area (collapsed by default).

### Related Resources Block

Shows all resources related to this area, including both forward links and backlinks.

## Usage

1. Place this file in your configured layouts folder
2. Enable "Class-Based Layouts" in plugin settings
3. Open any area asset to see this layout applied

## Customization

Modify the `ui__ClassLayout_blocks` frontmatter to:
- Add/remove blocks
- Change block order
- Adjust filters and sorting
- Toggle visibility
- Customize button actions