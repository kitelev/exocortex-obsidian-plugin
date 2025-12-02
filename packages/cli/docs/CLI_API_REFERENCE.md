# CLI API Reference

> **API Stability**: This document defines the **stable API surface** for exocortex-cli v0.1.x. Commands and options documented here are considered stable and follow semantic versioning guarantees. See [VERSIONING.md](../VERSIONING.md) for versioning policy.

---

## Table of Contents

- [SPARQL Query](#sparql-query)
- [Command Execution](#command-execution)
  - [Status Commands](#status-commands)
  - [Creation Commands](#creation-commands)
  - [Property Commands](#property-commands)
  - [Planning Commands](#planning-commands)
- [Exit Codes](#exit-codes)
- [Common Options](#common-options)
- [Stability Guarantees](#stability-guarantees)

---

## SPARQL Query

Execute SPARQL queries against your Obsidian vault as an RDF knowledge graph.

### Signature

```bash
exocortex sparql query <query> [options]
```

### Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<query>` | string | Yes | SPARQL query string or path to `.sparql` file |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vault <path>` | string | `process.cwd()` | Path to Obsidian vault |
| `--format <type>` | enum | `table` | Output format: `table`, `json`, `csv` |
| `--explain` | boolean | `false` | Show optimized query plan |
| `--stats` | boolean | `false` | Show execution statistics |
| `--no-optimize` | boolean | `false` | Disable query optimization |

### Output

- **Table format**: ASCII table with headers and aligned columns
- **JSON format**: Array of solution mappings with variable bindings
- **CSV format**: Comma-separated values with header row

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Query executed successfully |
| `1` | General error (parse error, vault not found, etc.) |

### Examples

```bash
# Inline query with table output
exocortex sparql query "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10" --vault ~/vault

# Query from file with JSON output
exocortex sparql query queries/tasks.sparql --vault ~/vault --format json

# Query with execution stats
exocortex sparql query "SELECT ?task WHERE { ?task exo:Instance_class ems:Task }" \
  --vault ~/vault --stats

# Query with plan visualization
exocortex sparql query queries/complex.sparql --vault ~/vault --explain
```

---

## Command Execution

Execute plugin commands on single assets via CLI.

### Base Signature

```bash
exocortex command <command-name> <filepath> [options]
```

### Common Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<command-name>` | string | Yes | Command to execute (see specific commands below) |
| `<filepath>` | string | Yes | Path to asset file (relative to vault root or absolute) |

### Common Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vault <path>` | string | `process.cwd()` | Path to Obsidian vault |
| `--dry-run` | boolean | `false` | Preview changes without modifying files |

---

## Status Commands

Commands that transition effort status (tasks, projects, meetings).

### start

Transitions task from ToDo to Doing status and records start timestamp.

```bash
exocortex command start <filepath> [--vault <path>]
```

**Side Effects**:
- Sets `ems__Effort_status` to `"[[ems__EffortStatusDoing]]"`
- Sets `ems__Effort_startTimestamp` to current ISO timestamp

**Example**:
```bash
exocortex command start "tasks/implement-feature.md" --vault ~/vault
```

---

### complete

Transitions task from Doing to Done status and records completion timestamps.

```bash
exocortex command complete <filepath> [--vault <path>]
```

**Side Effects**:
- Sets `ems__Effort_status` to `"[[ems__EffortStatusDone]]"`
- Sets `ems__Effort_endTimestamp` to current ISO timestamp
- Sets `ems__Effort_resolutionTimestamp` to current ISO timestamp

**Example**:
```bash
exocortex command complete "tasks/implement-feature.md" --vault ~/vault
```

---

### trash

Transitions task to Trashed status from any current status.

```bash
exocortex command trash <filepath> [--vault <path>]
```

**Side Effects**:
- Sets `ems__Effort_status` to `"[[ems__EffortStatusTrashed]]"`
- Sets `ems__Effort_resolutionTimestamp` to current ISO timestamp

**Example**:
```bash
exocortex command trash "tasks/obsolete-task.md" --vault ~/vault
```

---

### archive

Sets archived property to true and removes aliases.

```bash
exocortex command archive <filepath> [--vault <path>]
```

**Side Effects**:
- Sets `archived` to `true`
- Removes `aliases` property

**Example**:
```bash
exocortex command archive "tasks/old-completed-task.md" --vault ~/vault
```

---

### move-to-backlog

Transitions task to Backlog status.

```bash
exocortex command move-to-backlog <filepath> [--vault <path>]
```

**Side Effects**:
- Sets `ems__Effort_status` to `"[[ems__EffortStatusBacklog]]"`

**Example**:
```bash
exocortex command move-to-backlog "tasks/defer-task.md" --vault ~/vault
```

---

### move-to-analysis

Transitions project to Analysis status.

```bash
exocortex command move-to-analysis <filepath> [--vault <path>]
```

**Side Effects**:
- Sets `ems__Effort_status` to `"[[ems__EffortStatusAnalysis]]"`

**Example**:
```bash
exocortex command move-to-analysis "projects/new-initiative.md" --vault ~/vault
```

---

### move-to-todo

Transitions task/project to ToDo status.

```bash
exocortex command move-to-todo <filepath> [--vault <path>]
```

**Side Effects**:
- Sets `ems__Effort_status` to `"[[ems__EffortStatusToDo]]"`

**Example**:
```bash
exocortex command move-to-todo "tasks/ready-task.md" --vault ~/vault
```

---

## Creation Commands

Commands that create new asset files.

### create-task

Creates new task file with complete frontmatter initialization.

```bash
exocortex command create-task <filepath> --label <label> [options]
```

**Required Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--label <value>` | string | Task label (required) |

**Optional Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--prototype <uid>` | string | Prototype UID for inheritance |
| `--area <uid>` | string | Area UID for effort linkage |
| `--parent <uid>` | string | Parent UID for effort linkage |

**Generated Frontmatter**:
- `exo__Asset_isDefinedBy`: `"[[Ontology/EMS]]"`
- `exo__Asset_uid`: Generated UUID v4
- `exo__Asset_label`: From `--label`
- `exo__Asset_createdAt`: ISO timestamp
- `exo__Instance_class`: `["[[ems__Task]]"]`
- `ems__Effort_status`: `"[[ems__EffortStatusDraft]]"`
- `aliases`: Array containing label

**Example**:
```bash
exocortex command create-task "tasks/new-task.md" \
  --label "Implement search feature" \
  --area "areas/product" \
  --vault ~/vault
```

---

### create-meeting

Creates new meeting file with complete frontmatter initialization.

```bash
exocortex command create-meeting <filepath> --label <label> [options]
```

**Required Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--label <value>` | string | Meeting label (required) |

**Optional Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--prototype <uid>` | string | Prototype UID for inheritance |
| `--area <uid>` | string | Area UID for effort linkage |
| `--parent <uid>` | string | Parent UID for effort linkage |

**Generated Frontmatter**:
- `exo__Asset_isDefinedBy`: `"[[Ontology/EMS]]"`
- `exo__Asset_uid`: Generated UUID v4
- `exo__Asset_label`: From `--label`
- `exo__Asset_createdAt`: ISO timestamp
- `exo__Instance_class`: `["[[ems__Meeting]]"]`
- `ems__Effort_status`: `"[[ems__EffortStatusDraft]]"`
- `aliases`: Array containing label

**Example**:
```bash
exocortex command create-meeting "meetings/standup.md" \
  --label "Daily Standup 2025-12-02" \
  --prototype "prototypes/standup-template" \
  --vault ~/vault
```

---

### create-project

Creates new project file with complete frontmatter initialization.

```bash
exocortex command create-project <filepath> --label <label> [options]
```

**Required Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--label <value>` | string | Project label (required) |

**Optional Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--prototype <uid>` | string | Prototype UID for inheritance |
| `--area <uid>` | string | Area UID for effort linkage |
| `--parent <uid>` | string | Parent UID for effort linkage |

**Generated Frontmatter**:
- `exo__Asset_isDefinedBy`: `"[[Ontology/EMS]]"`
- `exo__Asset_uid`: Generated UUID v4
- `exo__Asset_label`: From `--label`
- `exo__Asset_createdAt`: ISO timestamp
- `exo__Instance_class`: `["[[ems__Project]]"]`
- `ems__Effort_status`: `"[[ems__EffortStatusDraft]]"`
- `aliases`: Array containing label

**Example**:
```bash
exocortex command create-project "projects/website-redesign.md" \
  --label "Website Redesign Q1 2026" \
  --area "areas/product" \
  --vault ~/vault
```

---

### create-area

Creates new area file with complete frontmatter initialization.

```bash
exocortex command create-area <filepath> --label <label> [options]
```

**Required Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--label <value>` | string | Area label (required) |

**Optional Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--prototype <uid>` | string | Prototype UID for inheritance |
| `--area <uid>` | string | Parent area UID |
| `--parent <uid>` | string | Parent UID |

**Generated Frontmatter**:
- `exo__Asset_isDefinedBy`: `"[[Ontology/EMS]]"`
- `exo__Asset_uid`: Generated UUID v4
- `exo__Asset_label`: From `--label`
- `exo__Asset_createdAt`: ISO timestamp
- `exo__Instance_class`: `["[[ems__Area]]"]`
- `aliases`: Array containing label

> **Note**: Areas do NOT have `ems__Effort_status` property (only efforts: tasks, projects, meetings).

**Example**:
```bash
exocortex command create-area "areas/product.md" \
  --label "Product Development" \
  --vault ~/vault
```

---

## Property Commands

Commands that modify asset properties.

### rename-to-uid

Renames file to match its `exo__Asset_uid` property value. If label is missing, sets it to the original filename.

```bash
exocortex command rename-to-uid <filepath> [--vault <path>]
```

**Side Effects**:
- Renames file from `<current-name>.md` to `<uid>.md`
- If `exo__Asset_label` is empty, sets it to original filename
- If not archived, adds original filename to `aliases`

**Error Conditions**:
- Exit code `1` if `exo__Asset_uid` property is missing

**Example**:
```bash
exocortex command rename-to-uid "tasks/My Task Name.md" --vault ~/vault
# Result: File renamed to "tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890.md"
```

---

### update-label

Updates `exo__Asset_label` property and synchronizes aliases array.

```bash
exocortex command update-label <filepath> --label <value> [--vault <path>] [--dry-run]
```

**Required Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--label <value>` | string | New label value (required) |

**Side Effects**:
- Sets `exo__Asset_label` to new value
- Adds new label to `aliases` array if not already present

**Dry Run Mode**:
- With `--dry-run`: Shows preview of changes without modifying files
- Without `--dry-run`: Applies changes to file

**Example**:
```bash
# Preview changes
exocortex command update-label "tasks/task.md" --label "New Label" --dry-run

# Apply changes
exocortex command update-label "tasks/task.md" --label "New Label" --vault ~/vault
```

---

## Planning Commands

Commands that set planning dates for efforts.

### schedule

Sets planned start timestamp for an effort (task/project/meeting).

```bash
exocortex command schedule <filepath> --date <YYYY-MM-DD> [--vault <path>]
```

**Required Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--date <value>` | string | Date in YYYY-MM-DD format (required) |

**Side Effects**:
- Sets `ems__Effort_plannedStartTimestamp` to timestamp at start of specified day

**Date Format**:
- Must be `YYYY-MM-DD` (e.g., `2025-12-02`)
- Invalid formats result in exit code `1`

**Example**:
```bash
exocortex command schedule "tasks/feature.md" --date "2025-12-15" --vault ~/vault
```

---

### set-deadline

Sets planned end timestamp for an effort (task/project/meeting).

```bash
exocortex command set-deadline <filepath> --date <YYYY-MM-DD> [--vault <path>]
```

**Required Options**:

| Option | Type | Description |
|--------|------|-------------|
| `--date <value>` | string | Date in YYYY-MM-DD format (required) |

**Side Effects**:
- Sets `ems__Effort_plannedEndTimestamp` to timestamp at start of specified day

**Date Format**:
- Must be `YYYY-MM-DD` (e.g., `2025-12-02`)
- Invalid formats result in exit code `1`

**Example**:
```bash
exocortex command set-deadline "tasks/feature.md" --date "2025-12-31" --vault ~/vault
```

---

## Exit Codes

All commands use standardized exit codes following Unix conventions:

| Code | Constant | Description |
|------|----------|-------------|
| `0` | `SUCCESS` | Command completed successfully |
| `1` | `GENERAL_ERROR` | General error (catch-all for non-specific errors) |
| `2` | `INVALID_ARGUMENTS` | Invalid command-line arguments or options |
| `3` | `FILE_NOT_FOUND` | File or directory not found |
| `4` | `PERMISSION_DENIED` | Permission denied (file system access) |
| `5` | `OPERATION_FAILED` | Command execution failed (business logic error) |
| `6` | `INVALID_STATE_TRANSITION` | Invalid asset state transition (e.g., status change not allowed) |
| `7` | `TRANSACTION_FAILED` | Transaction failed (atomic operation could not complete) |
| `8` | `CONCURRENT_MODIFICATION` | Concurrent modification detected (file changed during operation) |

### Usage in Scripts

```bash
exocortex command start "tasks/task.md" --vault ~/vault
exit_code=$?

case $exit_code in
  0) echo "Success" ;;
  2) echo "Invalid arguments" ;;
  3) echo "File not found" ;;
  *) echo "Error: $exit_code" ;;
esac
```

---

## Common Options

These options are available for all commands:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vault <path>` | string | `process.cwd()` | Path to Obsidian vault |
| `--dry-run` | boolean | `false` | Preview changes without modifying files (supported by some commands) |
| `--help` | boolean | - | Show help for command |
| `--version` | boolean | - | Show CLI version |

### Path Resolution

- **Relative paths**: Resolved relative to vault root
- **Absolute paths**: Used as-is but validated against vault root
- **Path validation**: Ensures path is within vault boundaries (prevents path traversal)

---

## Stability Guarantees

### Stable (v0.1.x)

The following are considered **stable** and covered by semantic versioning:

1. **Command names** - `sparql query`, `command start`, `command create-task`, etc.
2. **Argument positions** - First argument is always `<query>` for SPARQL, `<command-name>` then `<filepath>` for commands
3. **Required options** - `--label` for creation commands, `--date` for planning commands
4. **Exit codes** - Codes 0-8 as documented above
5. **Output formats** - `table`, `json`, `csv` for SPARQL queries

### Experimental

The following may change between minor versions:

1. **Output message text** - Console log messages (success/error formatting)
2. **Additional optional flags** - New non-breaking options may be added
3. **Performance characteristics** - Query optimization strategies

### Breaking Change Policy

Breaking changes will:
1. Only occur in major version bumps (v0.x → v1.0)
2. Be announced at least one minor version in advance
3. Provide migration guidance in release notes

See [VERSIONING.md](../VERSIONING.md) for complete versioning policy.
