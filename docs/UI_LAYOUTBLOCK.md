# UI LayoutBlock Feature

## Overview

The `ui__LayoutBlock` feature allows you to configure which properties are displayed for related assets in your Obsidian vault. Similar to `ui__ClassLayout` which defines the overall layout structure, `ui__LayoutBlock` specifically controls how related assets and their properties are shown.

## Key Features

- **Property Display Configuration**: Choose which properties to show for related assets
- **Multiple Format Types**: Display properties as status badges, dates, links, or raw text
- **Table and List Views**: Show related assets in professional tables or lists
- **Sorting and Filtering**: Sort by any property and filter by asset class
- **Grouping**: Group related assets by property values
- **Custom Formatting**: Apply custom formatters to property values

## Quick Start

### 1. Create a LayoutBlock Configuration

Create a new note with the following frontmatter:

```yaml
---
exo__Asset_id: ui__LayoutBlock_YourClass
exo__Instance_class: ui__LayoutBlock
ui__LayoutBlock_target_class: YourTargetClass
ui__LayoutBlock_enabled: true
ui__LayoutBlock_priority: 100
ui__LayoutBlock_blocks:
  - id: "related-items"
    type: "relation-properties"
    title: "Related Items"
    order: 1
    isVisible: true
    isCollapsible: true
    isCollapsed: false
    config:
      type: "relation-properties"
      tableFormat: true
      showAssetName: true
      displayProperties:
        - propertyName: "status_property"
          displayLabel: "Status"
          formatType: "status-badge"
          isVisible: true
          columnWidth: "120px"
        - propertyName: "date_property"
          displayLabel: "Date"
          formatType: "date"
          isVisible: true
---
```

### 2. View Your Assets

When you view any asset of the target class, related assets will be displayed according to your configuration.

## Example: Project Management

Here's a practical example for displaying efforts related to a project:

```yaml
---
exo__Instance_class: ui__LayoutBlock
ui__LayoutBlock_target_class: ems__Project
ui__LayoutBlock_blocks:
  - id: "project-efforts"
    type: "relation-properties"
    title: "Project Efforts"
    config:
      type: "relation-properties"
      targetClass: "ems__Effort"
      tableFormat: true
      displayProperties:
        - propertyName: "ems__Effort_status"
          displayLabel: "Status"
          formatType: "status-badge"
          isVisible: true
        - propertyName: "ems__Effort_priority"
          displayLabel: "Priority"
          formatType: "status-badge"
          isVisible: true
        - propertyName: "ems__Effort_assigned_to"
          displayLabel: "Assignee"
          formatType: "link"
          isVisible: true
---
```

This configuration will display all efforts related to a project in a table with status badges, priority indicators, and clickable assignee links.

## Configuration Options

### Block Types

- `relation-properties`: Display properties of related assets
- `dynamic-backlinks`: Display backlinks grouped by property (existing feature)

### Format Types

| Format Type | Description | Example |
|------------|-------------|---------|
| `raw` | Display value as-is | "Some text" |
| `status-badge` | Colored badge | 🟢 Completed |
| `date` | Formatted date | 03/15/2024 |
| `link` | Clickable link | [[Asset Name]] |
| `custom` | Custom JavaScript | (user-defined) |

### Display Options

- `tableFormat`: Display as table (true) or list (false)
- `showAssetName`: Show/hide asset names
- `showAssetClass`: Show/hide asset class as subtitle
- `maxResults`: Limit number of results
- `sortBy`: Sort by property and direction
- `groupByProperty`: Group results by property value

## Status Badge Colors

The system automatically applies colors based on common status values:

- **Green**: completed, done, success
- **Yellow**: in-progress, active, running
- **Red**: blocked, failed, error
- **Blue**: pending, waiting, todo
- **Gray**: cancelled, skipped

## Best Practices

1. **Start Simple**: Begin with a few essential properties
2. **Use Meaningful Labels**: Make display labels clear and concise
3. **Consider Screen Size**: Test table displays on different screen sizes
4. **Consistent Naming**: Follow your vault's naming conventions
5. **Performance**: Use `maxResults` for assets with many relations

## Integration with ClassLayout

LayoutBlock works seamlessly with ClassLayout:

- **ClassLayout**: Defines overall page structure and sections
- **LayoutBlock**: Enhances display of related assets within those sections

Both can be used together for complete control over asset presentation.

## Troubleshooting

### LayoutBlock Not Appearing

1. Verify `ui__LayoutBlock_enabled: true`
2. Check target class spelling matches exactly
3. Ensure the file has `exo__Instance_class: ui__LayoutBlock`

### Properties Not Displaying

1. Check property names are spelled correctly
2. Verify `isVisible: true` for each property
3. Ensure related assets have the expected properties

### Formatting Issues

1. Check `formatType` is valid (raw, status-badge, date, link, custom)
2. For dates, ensure values are valid date strings
3. For links, ensure values are valid asset references

## Advanced Examples

### Grouped by Status

```yaml
config:
  type: "relation-properties"
  groupByProperty: "status"
  tableFormat: true
```

### Limited Results with Sorting

```yaml
config:
  type: "relation-properties"
  maxResults: 10
  sortBy:
    property: "priority"
    direction: "desc"
```

### Custom Column Widths

```yaml
displayProperties:
  - propertyName: "title"
    columnWidth: "300px"
  - propertyName: "status"
    columnWidth: "100px"
  - propertyName: "date"
    columnWidth: "150px"
```

## See Also

- [Full Example: Project Management](./examples/ui__LayoutBlock-ems__Project.md)
- [ClassLayout Documentation](./UI_CLASSLAYOUT.md)
- [Asset Properties Guide](./ASSET_PROPERTIES.md)