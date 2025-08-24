---
exo__Asset_id: ui__LayoutBlock_ems_Project_Relations
exo__Instance_class: ui__LayoutBlock
ui__LayoutBlock_target_class: ems__Project
ui__LayoutBlock_enabled: true
ui__LayoutBlock_priority: 100
ui__LayoutBlock_blocks:
  - id: "project-efforts-block"
    type: "relation-properties"
    title: "Related Efforts"
    order: 1
    isVisible: true
    isCollapsible: true
    isCollapsed: false
    config:
      type: "relation-properties"
      targetClass: "ems__Effort"
      tableFormat: true
      showAssetName: true
      showAssetClass: false
      maxResults: 50
      showEmptyProperties: false
      displayProperties:
        - propertyName: "ems__Effort_status"
          displayLabel: "Status"
          formatType: "status-badge"
          isVisible: true
          columnWidth: "120px"
          alignment: "center"
        - propertyName: "ems__Effort_priority"
          displayLabel: "Priority"
          formatType: "status-badge"
          isVisible: true
          columnWidth: "100px"
          alignment: "center"
        - propertyName: "ems__Effort_due_date"
          displayLabel: "Due Date"
          formatType: "date"
          isVisible: true
          columnWidth: "140px"
          alignment: "left"
        - propertyName: "ems__Effort_assigned_to"
          displayLabel: "Assignee"
          formatType: "link"
          isVisible: true
          columnWidth: "150px"
          alignment: "left"
        - propertyName: "ems__Effort_completion_percentage"
          displayLabel: "Progress"
          formatType: "raw"
          isVisible: true
          columnWidth: "100px"
          alignment: "center"
      sortBy:
        property: "ems__Effort_priority"
        direction: "desc"
---

# UI LayoutBlock Example: Project Relations Display

## Overview

This is an example of a `ui__LayoutBlock` configuration that defines how related assets should be displayed when viewing assets of class `ems__Project`. This specific configuration creates a professional table view showing related efforts with their status, priority, due dates, and assignees.

## What This Configuration Does

When you view any asset of class `ems__Project`, the plugin will:

1. **Find all related efforts** - Assets of class `ems__Effort` that link back to the current project
2. **Display them in a table** - A professional table format with sortable columns
3. **Show key properties** - Status, Priority, Due Date, Assignee, and Progress for each effort
4. **Apply formatting** - Status badges with colors, formatted dates, and clickable links
5. **Sort by priority** - Highest priority efforts appear first

## Configuration Breakdown

### Target Class
```yaml
ui__LayoutBlock_target_class: ems__Project
```
This layout applies to all assets with `exo__Instance_class: ems__Project`

### Block Configuration
```yaml
type: "relation-properties"
targetClass: "ems__Effort"
tableFormat: true
```
- `type`: Specifies this is a relation-properties block (not dynamic-backlinks)
- `targetClass`: Only show related assets of class `ems__Effort`
- `tableFormat`: Display as a table (not a list or cards)

### Display Properties
Each property in `displayProperties` defines a column in the table:

#### Status Column
```yaml
- propertyName: "ems__Effort_status"
  displayLabel: "Status"
  formatType: "status-badge"
  columnWidth: "120px"
  alignment: "center"
```
Shows effort status as a colored badge (green for completed, yellow for in-progress, etc.)

#### Priority Column
```yaml
- propertyName: "ems__Effort_priority"
  displayLabel: "Priority"
  formatType: "status-badge"
  columnWidth: "100px"
```
Shows priority levels with visual indicators

#### Due Date Column
```yaml
- propertyName: "ems__Effort_due_date"
  displayLabel: "Due Date"
  formatType: "date"
  columnWidth: "140px"
```
Formats ISO dates into readable format

#### Assignee Column
```yaml
- propertyName: "ems__Effort_assigned_to"
  displayLabel: "Assignee"
  formatType: "link"
  columnWidth: "150px"
```
Makes assignee names clickable links to their profiles

### Sorting
```yaml
sortBy:
  property: "ems__Effort_priority"
  direction: "desc"
```
Sorts efforts by priority in descending order (highest first)

## Usage Example

### Project Asset (Project Alpha.md)
```markdown
---
exo__Asset_id: project_alpha_001
exo__Instance_class: ems__Project
exo__Asset_label: Project Alpha
ems__Project_status: [[Active]]
ems__Project_owner: [[John Doe]]
---

# Project Alpha

Main project for Q1 2024...
```

### Related Effort Asset (Implement Feature X.md)
```markdown
---
exo__Asset_id: effort_feature_x_001
exo__Instance_class: ems__Effort
exo__Asset_label: Implement Feature X
ems__Effort_status: [[In Progress]]
ems__Effort_priority: [[High]]
ems__Effort_due_date: 2024-03-15
ems__Effort_assigned_to: [[Jane Smith]]
ems__Effort_completion_percentage: 65
ems__Effort_project: [[Project Alpha]]
---

# Implement Feature X

Task details...
```

### Resulting Display

When viewing "Project Alpha", you'll see:

| Asset | Status | Priority | Due Date | Assignee | Progress |
|-------|--------|----------|----------|----------|----------|
| Implement Feature X | 🟡 In Progress | 🔴 High | 03/15/2024 | Jane Smith | 65% |
| Fix Bug Y | 🟢 Completed | 🟡 Medium | 03/10/2024 | Bob Wilson | 100% |
| Design UI Z | 🔵 Pending | 🟡 Medium | 03/20/2024 | Alice Chen | 0% |

## Customization Options

### Format Types
- `raw`: Display value as-is
- `status-badge`: Colored badge based on value
- `date`: Format as locale date
- `link`: Make value a clickable link
- `custom`: Use custom JavaScript formatter

### Table vs List Display
Change `tableFormat: false` to display as a list instead of a table

### Grouping
Add `groupByProperty: "ems__Effort_status"` to group efforts by status

### Limiting Results
Use `maxResults: 10` to show only the first 10 efforts

### Column Alignment
Use `alignment: "left"`, `"center"`, or `"right"` for each column

## Multiple Blocks

You can define multiple blocks in the same LayoutBlock configuration:

```yaml
ui__LayoutBlock_blocks:
  - id: "active-efforts"
    type: "relation-properties"
    title: "Active Efforts"
    config:
      targetClass: "ems__Effort"
      # ... configuration for active efforts
  
  - id: "project-risks"
    type: "relation-properties"
    title: "Project Risks"
    config:
      targetClass: "ems__Risk"
      # ... configuration for risks
```

## Integration with ClassLayout

This LayoutBlock works alongside ClassLayout configurations. While ClassLayout defines the overall page structure, LayoutBlock enhances how related assets are displayed within those layouts.

## Tips

1. **Test your configuration** - Create a test project and efforts to see how it looks
2. **Use consistent naming** - Follow the namespace convention (ems__, ui__, etc.)
3. **Start simple** - Begin with a few properties and add more as needed
4. **Consider mobile** - Test how tables look on smaller screens
5. **Document your layouts** - Keep notes about what each LayoutBlock does

## Troubleshooting

If your LayoutBlock isn't working:

1. Check that `ui__LayoutBlock_enabled: true`
2. Verify the target class matches exactly
3. Ensure property names are spelled correctly
4. Check the browser console for error messages
5. Verify related assets have the expected properties

## See Also

- [ClassLayout Documentation](./ui__ClassLayout-example.md)
- [Asset Properties Guide](./asset-properties.md)
- [Exocortex Plugin Documentation](../README.md)