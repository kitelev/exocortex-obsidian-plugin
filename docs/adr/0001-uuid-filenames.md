# ADR-0001: Use UUID v4 Filenames for Assets

## Status

✅ **Accepted** (Implemented)

## Context

Assets (tasks, projects, areas, concepts) need unique, stable identifiers that:
- Don't change when the asset is renamed
- Don't conflict across different vaults or instances
- Are programmatically easy to generate
- Work reliably across filesystems (case-sensitive and case-insensitive)

### Problem

Traditional approaches have limitations:

1. **Slugified labels**: `review-pr-123.md`
   - Changes when label changes → breaks references
   - Name collisions possible
   - Requires complex renaming logic

2. **Timestamp-based**: `task-2025-10-26T14-30-45.md`
   - Collisions possible (multiple creates per second)
   - Not human-friendly
   - Timezone issues

3. **Sequential IDs**: `task-001.md`, `task-002.md`
   - Requires coordination across instances
   - Race conditions in parallel creation
   - Doesn't work in distributed scenarios

## Decision

**Use UUID v4 as filename**: `550e8400-e29b-41d4-a716-446655440000.md`

### Implementation

```typescript
import { v4 as uuidv4 } from 'uuid';

const uid = uuidv4();
const fileName = `${uid}.md`;
// Example: "550e8400-e29b-41d4-a716-446655440000.md"
```

### UUID also stored in frontmatter

```yaml
exo__Asset_uid: 550e8400-e29b-41d4-a716-446655440000
```

This enables:
- Reference by UID even if filename changes
- Validation that filename matches UID
- Search by UID

## Consequences

### Positive ✅

- **Globally unique**: No collisions across vaults, no coordination needed
- **Stable identifiers**: Never change, even with renames
- **Easy generation**: Simple library call, no complex logic
- **Cross-platform**: Works on all filesystems (Windows, macOS, Linux)
- **Programmatic**: Perfect for CLI and automation
- **No race conditions**: Parallel instances can create assets safely

### Negative ❌

- **Not human-readable**: `550e8400-e29b-41d4-a716-446655440000.md` vs `review-pr-123.md`
- **Requires labels**: Users must add `exo__Asset_label` for identification
- **File explorer unfriendly**: Hard to find files by name in file browser

### Mitigations

1. **Labels in aliases**: `exo__Asset_label` automatically added to `aliases`
   - Enables search by label in Obsidian
   - Linking works with `[[Label]]` not just `[[UUID]]`

2. **Graph view enhancement**: Show labels instead of filenames in graph
   - Graph displays `exo__Asset_label`
   - Users never see UUIDs in normal usage

3. **Command palette**: Use labels for search
   - "Create task" shows label, not filename
   - CLI accepts label or UID for commands

## Alternatives Considered

### Alternative 1: Hybrid (Label + UUID suffix)

```
review-pr-123_550e8400.md
```

**Rejected because**:
- Still changes when label changes (need renaming logic)
- More complex to parse
- Doesn't fully solve human-readability

### Alternative 2: Folder-based organization

```
tasks/2025/10/review-pr-123.md
```

**Rejected because**:
- Folders are organizational, not identifiers
- Name collisions still possible
- Complex folder management logic needed

## Related

- **Property**: `exo__Asset_uid` stores same UUID
- **Graph**: Uses labels from frontmatter for display
- **Search**: Aliases enable label-based search
- **Future**: CLI will support both UID and label for asset lookup

## Notes

UUID v4 provides 2^122 unique identifiers (5.3 × 10^36). Collision probability is negligible even with billions of assets.

---

**Date**: 2025-10-26
**Author**: @kitelev
**Related Issues**: #122 (Core Extraction)