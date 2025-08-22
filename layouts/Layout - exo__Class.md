---
exo__Instance_class: "[[ui__ClassLayout]]"
exo__Asset_uid: "layout-exo-class-001"
exo__Asset_label: "Class Layout Configuration"
ui__ClassLayout_targetClass: "[[exo__Class]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_enabled: true
ui__ClassLayout_blocks:
  - id: "class-properties"
    type: "properties"
    title: "🎯 Class Properties"
    order: 1
    isVisible: true
    config:
      type: "properties"
      includedProperties:
        - "exo__Asset_label"
        - "exo__Asset_description"
        - "exo__Class_definition"
        - "exo__Class_superclass"
      editableProperties:
        - "exo__Asset_description"
        - "exo__Class_definition"
        - "exo__Class_superclass"
      groupBy: "category"
  - id: "class-instances"
    type: "instances"
    title: "📦 Instances"
    order: 2
    isVisible: true
    isCollapsible: true
    config:
      type: "instances"
      targetProperty: "exo__Instance_class"
      displayAs: "table"
      showInstanceInfo: true
      maxResults: 100
      groupByClass: false
  - id: "class-subclasses"
    type: "query"
    title: "🔗 Subclasses"
    order: 3
    isVisible: true
    isCollapsible: true
    isCollapsed: true
    config:
      type: "query"
      className: "exo__Class"
      propertyFilters:
        - property: "exo__Class_superclass"
          operator: "contains"
          value: "{{current_asset}}"
      sortBy: "exo__Asset_label"
      sortOrder: "asc"
      displayAs: "table"
      maxResults: 50
  - id: "class-backlinks"
    type: "backlinks"
    title: "📎 Referenced In"
    order: 4
    isVisible: true
    isCollapsible: true
    isCollapsed: true
    config:
      type: "backlinks"
      maxResults: 20
---

# Class Layout Configuration

This layout configuration defines how `exo__Class` assets are displayed in the Exocortex plugin.

## Features

### Class Properties Block

Shows key class properties with inline editing for:

- Description
- Class definition
- Superclass relationships

### Instances Block

Displays all assets that reference this class through their `exo__Instance_class` property:

- Table format showing instance name, class, and description
- Shows instance metadata when `showInstanceInfo` is enabled
- Limited to 100 results for performance
- Uses `exo__Instance_class` property for instance detection

### Subclasses Block

Shows classes that inherit from this class through `exo__Class_superclass` property (collapsed by default).

### Referenced In Block

Shows backlinks from other notes that reference this class (collapsed by default).

## Usage

1. Place this file in your configured layouts folder
2. Enable "Class-Based Layouts" in plugin settings
3. Open any class asset to see this layout applied

## Instances Block Configuration

The Instances block uses the following configuration:

- **targetProperty**: `exo__Instance_class` - Property that defines class membership
- **displayAs**: `table` - Display format (list, table, or cards)
- **showInstanceInfo**: `true` - Show additional instance metadata
- **maxResults**: `100` - Maximum number of instances to display
- **groupByClass**: `false` - Whether to group instances by their class

## Customization

Modify the `ui__ClassLayout_blocks` frontmatter to:

- Add/remove blocks
- Change block order
- Adjust filters and sorting
- Toggle visibility and collapse states
- Modify display formats and result limits
- Enable/disable instance grouping
