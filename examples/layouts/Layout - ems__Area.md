---
exo__Instance_class: "[[ui__ClassLayout]]"
exo__Asset_uid: "layout-ems-area-001"
exo__Asset_label: "Area Layout Configuration"
ui__ClassLayout_targetClass: "[[ems__Area]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_enabled: true
ui__ClassLayout_blocks:
  - id: "area-info"
    type: "properties"
    title: "🏢 Area Information"
    order: 1
    isVisible: true
    config:
      type: "properties"
      includedProperties:
        - "exo__Asset_label"
        - "exo__Asset_description"
        - "ems__Area_owner"
        - "ems__Area_status"
      editableProperties:
        - "ems__Area_status"
        - "exo__Asset_description"
  - id: "sub-areas"
    type: "query"
    title: "📁 Sub-Areas"
    order: 2
    isVisible: true
    config:
      type: "query"
      className: "ems__Area"
      propertyFilters:
        - property: "ems__Area_parent"
          operator: "equals"
          value: "{{current_asset}}"
      sortBy: "exo__Asset_label"
      sortOrder: "asc"
      displayAs: "cards"
  - id: "area-projects"
    type: "query"
    title: "📋 Active Projects"
    order: 3
    isVisible: true
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
      displayAs: "table"
  - id: "area-goals"
    type: "query"
    title: "🎯 Goals"
    order: 4
    isVisible: true
    isCollapsible: true
    config:
      type: "query"
      className: "ems__Goal"
      propertyFilters:
        - property: "ems__Goal_area"
          operator: "equals"
          value: "{{current_asset}}"
      sortBy: "ems__Goal_deadline"
      sortOrder: "asc"
      displayAs: "list"
  - id: "recent-activity"
    type: "custom"
    title: "📊 Recent Activity"
    order: 5
    isVisible: true
    config:
      type: "custom"
      dataviewQuery: |
        table file.mtime as "Modified"
        from ""
        where contains(file.frontmatter.ems__Task_area, this.file.path) or
              contains(file.frontmatter.ems__Project_area, this.file.path)
        sort file.mtime desc
        limit 10
---

# Area Layout Configuration

This layout configuration defines how `ems__Area` assets are displayed in the Exocortex plugin.

## Features

### Area Information
Core area properties with inline editing.

### Sub-Areas
Visual card display of all child areas for easy navigation.

### Active Projects
Table view of all active projects in this area.

### Goals
List of goals associated with this area.

### Recent Activity
Custom Dataview query showing recently modified items in this area.

## Hierarchy Support

This layout supports hierarchical area structures by:
- Showing sub-areas as cards
- Filtering content by parent area
- Supporting navigation between area levels

## Usage

1. Place in your layouts folder
2. Enable class-based layouts
3. Open any area asset to see this layout