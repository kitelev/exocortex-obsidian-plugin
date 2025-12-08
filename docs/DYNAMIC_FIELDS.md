# Dynamic Property Fields Guide

> **Status**: Experimental Feature (v14.x+)
>
> This feature is under active development. Enable via Settings to try it out.

## Overview

Dynamic Property Fields automatically generate asset creation forms based on your RDF ontology definitions. Instead of hardcoded forms with fixed fields, the plugin reads your ontology to determine which properties should appear when creating Tasks, Projects, or any other asset type.

### Key Benefits

- **Ontology-Driven Forms**: Fields are generated from your `rdfs:domain` definitions
- **Property Inheritance**: Child classes inherit properties from parent classes (e.g., Task inherits from Effort, which inherits from Asset)
- **Type-Specific Widgets**: Automatic field type detection based on `rdfs:range`:
  - `xsd:string` → Text input
  - `xsd:dateTime` → DateTime picker
  - `xsd:integer` → Number input
  - `xsd:boolean` → Toggle switch
  - `ems__EffortStatus` → Status dropdown
  - `ems__TaskSize` → Size dropdown
  - Asset references → Wikilink input
- **Deprecated Property Hiding**: Properties marked `owl:deprecated true` are automatically hidden
- **Graceful Fallback**: When ontology is unavailable, falls back to basic label + task size fields

## Enabling the Feature

1. Open Obsidian Settings
2. Navigate to **Exocortex** section
3. Enable **"Use dynamic property fields"** toggle
4. The setting takes effect immediately for all creation commands

![Settings Toggle](../docs/diagrams/settings-dynamic-fields.png)

## How It Works

### 1. Class Property Resolution

When you invoke a creation command (e.g., "Create Task"), the plugin:

1. Queries the RDF ontology for properties where `rdfs:domain` matches the target class
2. Traverses the class hierarchy via `rdfs:subClassOf` to find inherited properties
3. Filters out deprecated properties (`owl:deprecated true`)
4. Sorts properties alphabetically by label

```sparql
# Example: What properties does ems__Task have?
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?property ?label ?range WHERE {
  ?property rdfs:domain ems:Task .
  OPTIONAL { ?property rdfs:label ?label }
  OPTIONAL { ?property rdfs:range ?range }
}
```

### 2. Field Type Detection

The `rdfs:range` property determines the field type:

| Range Type | Field Type | UI Widget |
|------------|------------|-----------|
| `xsd:string` | text | Text input |
| `xsd:dateTime` | timestamp | DateTime picker |
| `xsd:integer`, `xsd:decimal` | number | Number input |
| `xsd:boolean` | boolean | Toggle switch |
| `ems:EffortStatus` | status-select | Status dropdown |
| `ems:TaskSize` | size-select | Size dropdown |
| Any class reference | wikilink | Wikilink input |

### 3. Modal Rendering

The `DynamicAssetCreationModal` renders fields based on property definitions:

```typescript
// For each property in the ontology
for (const prop of properties) {
  switch (prop.fieldType) {
    case "text":
      // Render text input
      break;
    case "timestamp":
      // Render datetime-local input
      break;
    case "number":
      // Render number input
      break;
    case "boolean":
      // Render toggle
      break;
    case "status-select":
      // Render status dropdown
      break;
    case "size-select":
      // Render task size dropdown
      break;
    case "wikilink":
      // Render wikilink input with auto-wrapping
      break;
  }
}
```

## Usage Examples

### Creating a Task with Dynamic Fields

1. Navigate to a Project or Area note
2. Click "Create Task" button or use Command Palette
3. Fill in the dynamically generated form:
   - **Label**: Display name for the task
   - **Task Size**: XXS, XS, S, or M
   - **Status**: Draft, Active, Done, or Cancelled
   - **Parent**: Auto-filled with current note
   - **Area**: Inherited from parent
4. Click "Create" to generate the task

### Creating a Project with Custom Properties

If your ontology defines custom properties for Projects (e.g., `ems__Project_budget`), these will appear automatically in the creation modal.

## Ontology Requirements

For dynamic fields to work, your ontology must define:

### 1. Class Definitions

```turtle
ems:Task a rdfs:Class ;
    rdfs:subClassOf ems:Effort ;
    rdfs:label "Task" .
```

### 2. Property Definitions with Domain

```turtle
ems:Effort_taskSize a rdf:Property ;
    rdfs:domain ems:Task ;
    rdfs:range ems:TaskSize ;
    rdfs:label "Task Size" ;
    rdfs:comment "Estimated size of the task" .
```

### 3. Range Types for Field Detection

```turtle
# For text fields
exo:Asset_label a rdf:Property ;
    rdfs:domain exo:Asset ;
    rdfs:range xsd:string .

# For datetime fields
ems:Effort_startTimestamp a rdf:Property ;
    rdfs:domain ems:Effort ;
    rdfs:range xsd:dateTime .
```

See [Ontology Extension Guide](./ONTOLOGY_EXTENSION.md) for detailed instructions on adding custom properties.

## Fallback Behavior

When the ontology is unavailable or contains no properties for a class, the modal falls back to default fields:

### For Tasks (`ems__Task`)

- Label (text)
- Task Size (dropdown)
- Open in new tab (toggle)

### For Other Classes

- Label (text)
- Open in new tab (toggle)

## Troubleshooting

### "Loading properties..." never completes

**Cause**: SPARQL query to ontology is failing.

**Solution**:
1. Check that your vault contains ontology files with `exo__Instance_class: exo__Ontology`
2. Verify the default ontology is set in Settings
3. Check the console for SPARQL errors (Cmd/Ctrl+Shift+I → Console)

### Properties not appearing

**Cause**: Properties may not have correct `rdfs:domain` or may be deprecated.

**Solution**:
1. Verify the property has `rdfs:domain` matching the target class
2. Check if property has `owl:deprecated true` (deprecated properties are hidden)
3. Use SPARQL Query Builder to inspect the ontology

### Wrong field type

**Cause**: The `rdfs:range` type is not recognized.

**Solution**:
1. Ensure `rdfs:range` uses standard XSD types or known EMS/EXO types
2. Unknown range types default to text fields
3. Check the type mapping table above

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                   CreateTaskCommand                      │
│  - Checks useDynamicPropertyFields setting              │
│  - Opens appropriate modal                               │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌───────────────────┐       ┌───────────────────────────┐
│  LabelInputModal  │       │ DynamicAssetCreationModal │
│  (fallback)       │       │ (ontology-driven)         │
└───────────────────┘       └─────────────┬─────────────┘
                                          │
                            ┌─────────────┴─────────────┐
                            ▼                           │
                ┌───────────────────────┐               │
                │ OntologySchemaService │               │
                │ - getClassProperties  │               │
                │ - getClassHierarchy   │               │
                │ - isDeprecatedProperty│               │
                └───────────────────────┘               │
                            │                           │
                            ▼                           │
                ┌───────────────────────┐               │
                │  SPARQLQueryService   │◄──────────────┘
                │  (queries ontology)   │
                └───────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `DynamicAssetCreationModal.ts` | Modal UI with dynamic field rendering |
| `OntologySchemaService.ts` | Queries class properties from ontology |
| `ExocortexSettings.ts` | Contains `useDynamicPropertyFields` setting |
| `ExocortexSettingTab.ts` | Settings UI with toggle |
| `CreateTaskCommand.ts` | Uses setting to choose modal type |

## Related Documentation

- [Ontology Extension Guide](./ONTOLOGY_EXTENSION.md) - Add custom properties to your ontology
- [SPARQL User Guide](./sparql/User-Guide.md) - Query your ontology data
- [Property Schema Reference](./PROPERTY_SCHEMA.md) - Standard frontmatter properties
- [Getting Started](./Getting-Started.md) - Initial plugin setup

## Version History

| Version | Changes |
|---------|---------|
| v14.x | Initial experimental release |
| - | Dynamic field generation from ontology |
| - | Property inheritance support |
| - | Type-specific field widgets |
| - | Deprecated property filtering |
