---
exo__Instance_class: "[[ui__ClassLayout]]"
exo__Asset_uid: "layout-ims-concept-001"
exo__Asset_label: "Concept Layout Configuration"
ui__ClassLayout_targetClass: "[[ims__Concept]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_enabled: true
ui__ClassLayout_blocks:
  - id: "concept-properties"
    type: "properties"
    title: "🧠 Concept Properties"
    order: 1
    isVisible: true
    config:
      type: "properties"
      includedProperties:
        - "exo__Asset_label"
        - "exo__Asset_description"
        - "ims__Concept_broader"
        - "ims__Concept_definition"
        - "ims__Concept_note"
      editableProperties:
        - "exo__Asset_description"
        - "ims__Concept_broader"
        - "ims__Concept_definition"
        - "ims__Concept_note"
      groupBy: "category"
  - id: "narrower-concepts"
    type: "narrower"
    title: "🔽 Narrower Concepts"
    order: 2
    isVisible: true
    isCollapsible: true
    config:
      type: "narrower"
      broaderProperty: "ims__Concept_broader"
      filterByClass: "ims__Concept"
      displayAs: "table"
      maxResults: 50
  - id: "related-concepts"
    type: "query"
    title: "🔗 Related Concepts"
    order: 3
    isVisible: true
    isCollapsible: true
    isCollapsed: true
    config:
      type: "query"
      className: "ims__Concept"
      propertyFilters:
        - property: "ims__Concept_relates"
          operator: "contains"
          value: "{{current_asset}}"
      sortBy: "exo__Asset_label"
      sortOrder: "asc"
      displayAs: "list"
      maxResults: 20
  - id: "concept-backlinks"
    type: "backlinks"
    title: "📎 Referenced In"
    order: 4
    isVisible: true
    isCollapsible: true
    isCollapsed: true
    config:
      type: "backlinks"
      maxResults: 15
---

# Concept Layout Configuration

This layout configuration defines how `ims__Concept` assets are displayed in the Exocortex plugin.

## Features

### Concept Properties Block
Shows key concept properties with inline editing for:
- Description
- Broader concept relationships  
- Definition
- Notes

### Narrower Concepts Block
Displays all concepts that reference this concept as their broader concept:
- Table format showing concept name, class, and description
- Filtered to show only `ims__Concept` instances
- Limited to 50 results for performance
- Uses `ims__Concept_broader` property for hierarchy detection

### Related Concepts Block  
Shows concepts explicitly related through `ims__Concept_relates` property (collapsed by default).

### Referenced In Block
Shows backlinks from other notes that reference this concept (collapsed by default).

## Usage

1. Place this file in your configured layouts folder
2. Enable "Class-Based Layouts" in plugin settings  
3. Open any concept asset to see this layout applied

## Narrower Block Configuration

The Narrower block uses the following configuration:
- **broaderProperty**: `ims__Concept_broader` - Property that defines broader/narrower relationships
- **filterByClass**: `ims__Concept` - Only show concepts of this class
- **displayAs**: `table` - Display format (list, table, or cards)
- **maxResults**: `50` - Maximum number of results to display

## Customization

Modify the `ui__ClassLayout_blocks` frontmatter to:
- Add/remove blocks
- Change block order
- Adjust filters and sorting
- Toggle visibility and collapse states
- Modify display formats and result limits