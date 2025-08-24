---
exo__Asset_id: ui__LayoutBlock_ems_Project_Simple
exo__Instance_class: ui__LayoutBlock
ui__LayoutBlock_target_class: ems__Project
ui__LayoutBlock_enabled: true
ui__LayoutBlock_priority: 100
ui__LayoutBlock_display_properties:
  - "[[ems__Effort_status]]"
  - "[[ems__Effort_priority]]"
  - "[[ems__Effort_due_date]]"
  - "[[ems__Effort_assigned_to]]"
  - "[[ems__Effort_completion_percentage]]"
---

# Simplified UI LayoutBlock Example: Project Properties Display

## Overview

This is a simplified example of `ui__LayoutBlock` that uses a simple list of property references to configure which properties are displayed for related assets.

## How It Works

When viewing any `ems__Project` asset, this configuration will:

1. Find all related assets that link back to the project
2. Display them in a table with the specified properties as columns
3. Automatically format properties based on their names:
   - Properties with "status" → colored badges
   - Properties with "date" → formatted dates
   - Properties with "assignee/owner" → clickable links
   - Others → plain text

## Configuration

The entire configuration is just a list of property references:

```yaml
ui__LayoutBlock_display_properties:
  - "[[ems__Effort_status]]"
  - "[[ems__Effort_priority]]"
  - "[[ems__Effort_due_date]]"
  - "[[ems__Effort_assigned_to]]"
```

That's it! No complex configuration needed.

## Property Reference Format

Properties are referenced using standard Obsidian wikilink format:
- `[[property_name]]` - The property to display

The system automatically:
- Extracts the property name from the wikilink
- Formats the column header nicely
- Determines the appropriate display format

## Example Result

When viewing a Project, you'll see a table like:

| Asset | Effort Status | Effort Priority | Effort Due Date | Effort Assigned To |
|-------|--------------|-----------------|-----------------|-------------------|
| Feature X | 🟡 In Progress | 🔴 High | 03/15/2024 | [[Jane Smith]] |
| Bug Fix Y | 🟢 Completed | 🟡 Medium | 03/10/2024 | [[Bob Wilson]] |
| Task Z | 🔵 Pending | 🟡 Medium | 03/20/2024 | [[Alice Chen]] |

## Automatic Formatting

The system automatically detects property types:

- **Status properties**: Displayed as colored badges
- **Date properties**: Formatted in locale date format
- **User/Owner properties**: Displayed as clickable links
- **Other properties**: Displayed as plain text

## Benefits

1. **Ultra-simple**: Just list the properties you want
2. **No configuration overhead**: No need to specify formats, widths, etc.
3. **Automatic formatting**: Smart detection of property types
4. **Clean display**: Professional table without complexity
5. **Easy to maintain**: Just add/remove properties from the list

## Tips

- Order matters - properties appear in the order listed
- The asset name is always the first column
- Properties must exist in the related assets' frontmatter
- Use standard naming conventions for automatic formatting

## Comparison with Complex Version

**Complex version** (not needed anymore):
```yaml
displayProperties:
  - propertyName: "ems__Effort_status"
    displayLabel: "Status"
    formatType: "status-badge"
    isVisible: true
    columnWidth: "120px"
    alignment: "center"
```

**Simple version** (recommended):
```yaml
ui__LayoutBlock_display_properties:
  - "[[ems__Effort_status]]"
```

Much cleaner!