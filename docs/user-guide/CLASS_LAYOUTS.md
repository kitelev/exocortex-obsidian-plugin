# Class-Based Layouts User Guide

## Overview

The Class-Based Layouts feature allows you to create custom view configurations for different asset classes in your Exocortex knowledge base. Instead of seeing the same generic layout for all assets, you can define specific layouts for Projects, Tasks, Areas, and any other classes you use.

## Quick Start

1. **Enable the feature**: Go to Settings → Exocortex → Enable "Class-Based Layouts"
2. **Set layouts folder**: Configure where layout files will be stored (default: `layouts`)
3. **Create layout files**: Add layout configuration files to your layouts folder
4. **Open assets**: Assets will automatically use their configured layouts

## Creating a Layout Configuration

Layout configurations are regular Obsidian notes with special frontmatter:

```yaml
---
exo__Instance_class: "[[ui__ClassLayout]]"
ui__ClassLayout_targetClass: "[[ems__Project]]"  # Which class this layout is for
ui__ClassLayout_priority: 10                      # Higher priority wins
ui__ClassLayout_enabled: true                     # Enable/disable layout
ui__ClassLayout_blocks:                           # Define blocks to display
  - id: "block-1"
    type: "query"
    title: "Active Items"
    order: 1
    config:
      # Block-specific configuration
---
```

## Block Types

### 1. Query Block
Displays filtered lists of assets:

```yaml
- id: "active-tasks"
  type: "query"
  title: "📝 Active Tasks"
  order: 1
  config:
    className: "ems__Task"
    propertyFilters:
      - property: "ems__Task_project"
        operator: "equals"
        value: "{{current_asset}}"
    sortBy: "ems__Task_priority"
    sortOrder: "desc"
    displayAs: "list"  # or "table", "cards"
```

**Operators:**
- `equals`: Exact match
- `notEquals`: Not equal
- `contains`: Contains substring
- `startsWith`: Starts with value
- `endsWith`: Ends with value
- `exists`: Property exists
- `notExists`: Property doesn't exist

**Variables:**
- `{{current_asset}}`: Current asset path
- `{{fm.property}}`: Any frontmatter property

### 2. Properties Block
Shows and allows editing of properties:

```yaml
- id: "properties"
  type: "properties"
  title: "📋 Properties"
  order: 2
  config:
    includedProperties:
      - "ems__Project_status"
      - "ems__Project_deadline"
    editableProperties:
      - "ems__Project_status"
    groupBy: "category"  # or "prefix"
```

### 3. Relations Block
Shows linked assets:

```yaml
- id: "relations"
  type: "relations"
  title: "🔗 Related"
  order: 3
  config:
    relationProperty: "exo__Asset_relates"
    showForwardLinks: true
    showBacklinks: true
```

### 4. Backlinks Block
Shows incoming links:

```yaml
- id: "backlinks"
  type: "backlinks"
  title: "📎 References"
  order: 4
  config:
    filterByClass: "exo__Note"
    groupByClass: true
    maxResults: 20
```

### 5. Custom Block
For advanced users - custom Dataview or JavaScript:

```yaml
- id: "custom"
  type: "custom"
  title: "📊 Custom View"
  order: 5
  config:
    dataviewQuery: |
      table status, deadline
      from #project
      where area = this.file.path
```

## Block Options

All blocks support:
- `id`: Unique identifier
- `type`: Block type
- `title`: Display title
- `order`: Display order (lower first)
- `isVisible`: Show/hide block
- `isCollapsible`: Can be collapsed
- `isCollapsed`: Start collapsed

## Examples

### Project Layout
Shows incomplete tasks, milestones, and project status:
```yaml
ui__ClassLayout_blocks:
  - id: "status"
    type: "properties"
    title: "Project Status"
    config:
      includedProperties: ["ems__Project_status", "ems__Project_deadline"]
      editableProperties: ["ems__Project_status"]
  - id: "tasks"
    type: "query"
    title: "Active Tasks"
    config:
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_project"
          operator: "equals"
          value: "{{current_asset}}"
```

### Area Layout
Shows sub-areas and area projects:
```yaml
ui__ClassLayout_blocks:
  - id: "subareas"
    type: "query"
    title: "Sub-Areas"
    config:
      className: "ems__Area"
      propertyFilters:
        - property: "ems__Area_parent"
          operator: "equals"
          value: "{{current_asset}}"
      displayAs: "cards"
```

## Priority System

When multiple layouts exist for a class:
1. Layouts with higher `priority` values win
2. Disabled layouts are ignored
3. Falls back to parent class layouts
4. Uses default layout if none found

## Performance Tips

1. **Limit query results**: Use `maxResults` to prevent slow queries
2. **Use specific filters**: More filters = faster queries
3. **Collapse unused blocks**: Start heavy blocks collapsed
4. **Cache-friendly**: Layouts cache for 30 seconds

## Troubleshooting

### Layout not appearing
- Check layout is in configured folder
- Verify `ui__ClassLayout_enabled: true`
- Confirm target class matches exactly
- Check for syntax errors in YAML

### Queries returning no results
- Verify property names are correct
- Check filter operators
- Test with simpler filters first
- Use console for debug info

### Performance issues
- Reduce `maxResults` values
- Simplify complex queries
- Use table/list instead of cards
- Disable unused blocks

## Advanced Features

### Layout Inheritance
Layouts can inherit from parent classes:
- `ems__Task` → `ems__Effort` → `exo__Asset`
- Child class layouts override parent layouts

### Dynamic Variables
Use frontmatter values in queries:
```yaml
propertyFilters:
  - property: "ems__Task_sprint"
    operator: "equals"
    value: "{{fm.current_sprint}}"
```

### Conditional Visibility
Show/hide blocks based on conditions (future feature).

## Best Practices

1. **Start simple**: Begin with basic blocks, add complexity gradually
2. **Use meaningful IDs**: Makes debugging easier
3. **Document your layouts**: Add comments in the layout file
4. **Test incrementally**: Add one block at a time
5. **Share layouts**: Export and share with community

## Migration from Old System

If upgrading from the old layout system:
1. Enable class-based layouts in settings
2. Old layouts continue to work as fallback
3. Gradually create new layout configurations
4. Disable old system once migrated

## Support

- Report issues: GitHub Issues
- Share layouts: Community Forum
- Documentation: This guide
- Examples: `/examples/layouts/` folder