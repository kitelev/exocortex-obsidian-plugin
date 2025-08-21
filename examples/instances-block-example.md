# Instances Block Feature Example

This example demonstrates the new `instances` block type for Class Layout configurations.

## Overview

The `instances` block automatically finds and displays all assets that reference the current asset through their `exo__Instance_class` property. This is particularly useful for Class assets to see all their instances.

## Example Class Asset

Create a class asset like this:

```markdown
---
exo__Instance_class: "[[exo__Class]]"
exo__Asset_uid: "example-class-001"
exo__Asset_label: "Example Class"
exo__Asset_description: "A demonstration class for the instances block feature"
exo__Class_definition: "An example class used to demonstrate the instances block functionality"
---

# Example Class

This is an example class that demonstrates the instances block feature.
```

## Example Instance Assets

Create some instance assets that reference the class:

### Instance 1

```markdown
---
exo__Instance_class: "[[Example Class]]"
exo__Asset_uid: "example-instance-001"
exo__Asset_label: "First Instance"
exo__Asset_description: "The first example instance"
---

# First Instance

This is the first instance of the Example Class.
```

### Instance 2

```markdown
---
exo__Instance_class: "[[Example Class]]"
exo__Asset_uid: "example-instance-002"
exo__Asset_label: "Second Instance"
exo__Asset_description: "The second example instance"
---

# Second Instance

This is the second instance of the Example Class.
```

## Layout Configuration

The layout for the class asset should include an instances block:

```yaml
ui__ClassLayout_blocks:
  - id: "class-instances"
    type: "instances"
    title: "📦 Instances"
    order: 2
    isVisible: true
    isCollapsible: true
    config:
      type: "instances"
      targetProperty: "exo__Instance_class"    # Property to search for references
      displayAs: "table"                       # Display format: list, table, or cards
      showInstanceInfo: true                   # Show additional instance details
      maxResults: 100                          # Maximum number of instances to display
      groupByClass: false                      # Whether to group by instance class
      filterByClass: null                      # Optional: filter by specific class
```

## Configuration Options

### Core Options

- **targetProperty**: The property to search for references (default: `exo__Instance_class`)
- **displayAs**: Display format - `list`, `table`, or `cards` (default: `table`)
- **showInstanceInfo**: Whether to show additional instance metadata (default: `false`)
- **maxResults**: Maximum number of instances to display (default: unlimited)
- **groupByClass**: Whether to group instances by their class (default: `false`)
- **filterByClass**: Optional filter to only show instances of a specific class

### Display Formats

#### Table Display (`"table"`)
- Shows instances in a structured table
- Columns: Instance Name, Class (if showInstanceInfo), Description (if showInstanceInfo)
- Clean, professional appearance
- Best for detailed information

#### List Display (`"list"`)
- Shows instances as a bulleted list
- Compact format with clickable links
- Class information shown in parentheses (if showInstanceInfo)
- Best for simple listings

#### Cards Display (`"cards"`)
- Shows instances as individual cards
- Each card includes title, class, and description
- Visual and modern appearance
- Best for browsing and discovery

## Reference Formats Supported

The instances block recognizes various reference formats:

1. **Wiki Link Format**: `[[Example Class]]`
2. **Direct Name**: `Example Class`
3. **Array Format**: `["[[Example Class]]", "[[Other Class]]"]`
4. **File Path**: `Example Class.md`

## Advanced Usage

### Grouping by Class

When `groupByClass: true`, instances are organized into sections by their class:

```
📦 Instances

## ExampleClass (5)
- Instance 1
- Instance 2
- Instance 3
- Instance 4
- Instance 5

## OtherClass (2)
- Instance A
- Instance B
```

### Filtering

Use `filterByClass` to show only instances of a specific class:

```yaml
config:
  type: "instances"
  filterByClass: "SpecificClass"  # Only show instances of this class
```

### Custom Target Property

Search for instances using a different property:

```yaml
config:
  type: "instances"
  targetProperty: "custom__belongs_to"  # Use a custom relationship property
```

## CSS Styling

The instances block generates HTML with specific classes for styling:

- `.exocortex-instances-info` - Count information
- `.exocortex-instances-table` - Table container
- `.exocortex-instances-list` - List container
- `.exocortex-instances-cards` - Cards container
- `.exocortex-instance-card` - Individual card
- `.exocortex-instances-group` - Group container (when groupByClass is true)

## Integration with Other Blocks

The instances block works well alongside other layout blocks:

```yaml
ui__ClassLayout_blocks:
  - id: "class-properties"
    type: "properties"
    title: "🎯 Properties"
    order: 1
  
  - id: "class-instances"
    type: "instances"
    title: "📦 Instances"
    order: 2
  
  - id: "class-subclasses"
    type: "query"
    title: "🔗 Subclasses"
    order: 3
  
  - id: "class-backlinks"
    type: "backlinks"
    title: "📎 References"
    order: 4
```

This creates a comprehensive class view showing properties, instances, subclasses, and references.