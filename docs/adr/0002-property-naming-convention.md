# ADR-0002: Property Naming Convention with Namespaces

## Status

✅ **Accepted** (Implemented)

## Context

Exocortex uses YAML frontmatter to store asset metadata. As the system grows, we need a clear naming convention to:
- Avoid property name collisions
- Group related properties
- Make properties self-documenting
- Support multiple ontologies (EMS, IMS, Personal Notes, etc.)
- Enable easy filtering and querying

### Problem

Without convention:
```yaml
# Unclear which system owns these properties
status: Draft
area: Work
label: My Task
uid: 550e8400-e29b-41d4-a716-446655440000
```

Questions:
- Which system defined "status"? (Could be any plugin)
- Is "area" from Exocortex or another plugin?
- Hard to filter "all Exocortex properties"

## Decision

**Use prefixed triple-underscore naming convention**:

```
[prefix]__[EntityType]_[propertyName]
```

**Components**:
- **prefix** (2-4 chars): Namespace identifier
- **EntityType**: Entity class (Asset, Effort, Task, Concept, etc.)
- **propertyName**: Property name in camelCase

### Namespaces

| Prefix | System | Purpose |
|--------|--------|---------|
| `exo__` | Exocortex Universal | Core properties for ALL assets |
| `ems__` | Effort Management System | Task/project management |
| `ims__` | Information Management System | Concepts, knowledge |
| `pn__` | Personal Notes | Daily notes, journals |
| `ztlk__` | Zettelkasten | Note-taking system |

### Examples

```yaml
# Universal (all assets)
exo__Asset_uid: 550e8400-e29b-41d4-a716-446655440000
exo__Asset_label: My Task
exo__Asset_createdAt: 2025-10-26T14:30:00
exo__Instance_class: ["[[ems__Task]]"]

# Effort management (tasks/projects)
ems__Effort_status: "[[ems__EffortStatusDraft]]"
ems__Effort_area: "[[Work]]"
ems__Effort_votes: 3
ems__Task_size: M

# Information management (concepts)
ims__Concept_broader: "[[Programming]]"
ims__Concept_definition: "..."

# Personal notes (daily notes)
pn__DailyNote_date: "[[2025-10-26]]"
```

## Consequences

### Positive ✅

- **No collisions**: `exo__Asset_label` vs other plugins' `label`
- **Self-documenting**: Clear which system owns property
- **Filterable**: Easy to find all `ems__` properties
- **Queryable**: Can query by namespace prefix
- **Extensible**: Add new namespaces without conflicts
- **Multi-ontology**: Support multiple systems in same note

### Negative ❌

- **Verbose**: `exo__Asset_label` vs `label` (14 vs 5 characters)
- **Triple underscore**: Unusual convention (most use single `_`)
- **Typing burden**: More characters to type manually

### Mitigations

1. **Commands handle it**: Users rarely type property names manually
2. **Templates**: Prototypes provide pre-filled frontmatter
3. **Autocomplete**: Obsidian suggests properties from existing notes
4. **Worth it**: Clarity and collision-avoidance outweigh verbosity

## Alternatives Considered

### Alternative 1: Single underscore

```yaml
exo_Asset_uid: ...
```

**Rejected because**:
- Conflicts with common naming (snake_case)
- Less visually distinct

### Alternative 2: Dot notation

```yaml
exo.Asset.uid: ...
```

**Rejected because**:
- YAML interprets as nested objects
- Would become: `{ exo: { Asset: { uid: ... } } }`
- Complex to parse and manipulate

### Alternative 3: No prefix, just descriptive names

```yaml
exocortexAssetUid: ...
```

**Rejected because**:
- Harder to filter (no clear boundary)
- Less scannable
- Doesn't group by namespace

## Related

- **AssetClass enum**: Uses same convention (`ems__Task`, `ims__Concept`)
- **EffortStatus enum**: Uses convention (`ems__EffortStatusDraft`)
- **WikiLinks**: Often reference these enum values

## Notes

The triple underscore `__` creates clear visual separation:
- First `_`: Separator between prefix and entity
- Second `_`: Continuation of namespace separator
- Single `_`: Separator between entity and property

Example: `ems__Effort_status`
- Namespace: `ems` (Effort Management System)
- Entity: `Effort`
- Property: `status`

---

**Date**: 2025-10-26
**Author**: @kitelev
**Related Issues**: #124 (Architecture Documentation)