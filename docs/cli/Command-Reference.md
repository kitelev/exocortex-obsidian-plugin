# CLI Command Reference

Complete reference for all Exocortex CLI commands with syntax, arguments, and examples.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Command Categories](#command-categories)
  - [Maintenance Commands](#maintenance-commands)
  - [Status Transition Commands](#status-transition-commands)
  - [Creation Commands](#creation-commands)
  - [Planning Commands](#planning-commands)
- [Exit Codes](#exit-codes)
- [Global Options](#global-options)

---

## Quick Reference

All commands follow the pattern:

```bash
exocortex command <command-name> <filepath> [options]
```

**Available commands:**

| Command | Category | Description |
|---------|----------|-------------|
| `rename-to-uid` | Maintenance | Rename file to match its UID |
| `update-label` | Maintenance | Update asset label and aliases |
| `start` | Status | Transition task to Doing status |
| `complete` | Status | Transition task to Done status |
| `trash` | Status | Move task to Trashed status |
| `archive` | Status | Archive asset (remove from active views) |
| `move-to-backlog` | Status | Move task to Backlog |
| `move-to-analysis` | Status | Move project to Analysis |
| `move-to-todo` | Status | Move task/project to ToDo |
| `create-task` | Creation | Create new task file |
| `create-meeting` | Creation | Create new meeting file |
| `create-project` | Creation | Create new project file |
| `create-area` | Creation | Create new area file |
| `schedule` | Planning | Set planned start date |
| `set-deadline` | Planning | Set planned end date |

---

## Command Categories

### Maintenance Commands

Commands for file and metadata maintenance operations.

#### `rename-to-uid`

Renames file to match its `exo__Asset_uid` property value. If `exo__Asset_label` is missing, preserves the original filename as the label.

**Syntax:**
```bash
exocortex command rename-to-uid <filepath> [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to asset file (relative to vault root or absolute)

**Options:**
- `--vault <path>` - Path to Obsidian vault (default: current directory)

**Examples:**
```bash
# Rename task to UID format
exocortex command rename-to-uid "03 Knowledge/tasks/my-task.md"

# Output:
# ✅ Renamed to UID format
#    Old: 03 Knowledge/tasks/my-task.md
#    New: 03 Knowledge/tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890.md

# Rename with explicit vault path
exocortex command rename-to-uid "tasks/my-task.md" \
  --vault /path/to/vault

# If already renamed (no-op)
exocortex command rename-to-uid "tasks/a1b2c3d4.md"
# Output:
# ✅ Already renamed: tasks/a1b2c3d4.md
#    Current filename matches UID: a1b2c3d4.md
```

**Behavior:**
- If label is missing, sets it to the original filename
- Adds original filename to aliases (unless archived)
- Checks if already renamed (no-op if filename matches UID)
- Fails if `exo__Asset_uid` property is missing

**Exit Codes:**
- `0` - Success (renamed or already correct)
- `1` - File read error
- `2` - Missing UID property
- `2` - Path validation error

---

#### `update-label`

Updates `exo__Asset_label` property and synchronizes the `aliases` array.

**Syntax:**
```bash
exocortex command update-label <filepath> --label "<value>" [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to asset file
- `--label <value>` - **Required**. New label value

**Options:**
- `--vault <path>` - Path to Obsidian vault

**Examples:**
```bash
# Update task label
exocortex command update-label "03 Knowledge/tasks/my-task.md" \
  --label "Implement CLI documentation"

# Output:
# ✅ Updated label
#    File: 03 Knowledge/tasks/my-task.md
#    New label: "Implement CLI documentation"
#    Aliases synchronized

# Update with vault path
exocortex command update-label "tasks/task.md" \
  --label "New label" \
  --vault /path/to/vault
```

**Behavior:**
- Updates `exo__Asset_label` property
- Adds new label to `aliases` array (if not already present)
- Preserves existing aliases
- Trims whitespace from label

**Exit Codes:**
- `0` - Success
- `1` - File read/write error
- `2` - Missing `--label` option
- `2` - Empty label value

---

### Status Transition Commands

Commands for managing task/project lifecycle status.

#### `start`

Transitions task from ToDo to Doing status and records start timestamp.

**Syntax:**
```bash
exocortex command start <filepath> [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to task file

**Examples:**
```bash
# Start working on task
exocortex command start "03 Knowledge/tasks/my-task.md"

# Output:
# ✅ Started: 03 Knowledge/tasks/my-task.md
#    Status: Doing
#    Start time: 2025-11-23T09:30:15

# Start with vault path
exocortex command start "tasks/task.md" --vault /path/to/vault
```

**Changes:**
- Sets `ems__Effort_status` → `"[[ems__EffortStatusDoing]]"`
- Sets `ems__Effort_startTimestamp` → current timestamp

**Exit Codes:**
- `0` - Success
- `1` - File read/write error
- `2` - Path validation error

---

#### `complete`

Transitions task from Doing to Done status and records completion timestamps.

**Syntax:**
```bash
exocortex command complete <filepath> [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to task file

**Examples:**
```bash
# Complete task
exocortex command complete "03 Knowledge/tasks/my-task.md"

# Output:
# ✅ Completed: 03 Knowledge/tasks/my-task.md
#    Status: Done
#    Completion time: 2025-11-23T10:45:30
```

**Changes:**
- Sets `ems__Effort_status` → `"[[ems__EffortStatusDone]]"`
- Sets `ems__Effort_endTimestamp` → current timestamp
- Sets `ems__Effort_resolutionTimestamp` → current timestamp

**Exit Codes:**
- `0` - Success
- `1` - File read/write error

---

#### `trash`

Transitions task to Trashed status from any current status.

**Syntax:**
```bash
exocortex command trash <filepath> [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to task file

**Examples:**
```bash
# Trash abandoned task
exocortex command trash "03 Knowledge/tasks/abandoned-task.md"

# Output:
# ✅ Trashed: 03 Knowledge/tasks/abandoned-task.md
#    Status: Trashed
#    Resolution time: 2025-11-23T11:00:00
```

**Changes:**
- Sets `ems__Effort_status` → `"[[ems__EffortStatusTrashed]]"`
- Sets `ems__Effort_resolutionTimestamp` → current timestamp

**Exit Codes:**
- `0` - Success
- `1` - File read/write error

---

#### `archive`

Archives asset by setting `archived: true` and removing aliases.

**Syntax:**
```bash
exocortex command archive <filepath> [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to asset file

**Examples:**
```bash
# Archive old task
exocortex command archive "03 Knowledge/tasks/old-task.md"

# Output:
# ✅ Archived: 03 Knowledge/tasks/old-task.md
#    Archived: true
#    Aliases removed
```

**Changes:**
- Sets `archived` → `true`
- Removes `aliases` property
- Hides asset from active views

**Exit Codes:**
- `0` - Success
- `1` - File read/write error

---

#### `move-to-backlog`

Transitions task to Backlog status.

**Syntax:**
```bash
exocortex command move-to-backlog <filepath> [--vault <path>]
```

**Examples:**
```bash
exocortex command move-to-backlog "tasks/task.md"

# Output:
# ✅ Moved to Backlog: tasks/task.md
#    Status: Backlog
```

**Changes:**
- Sets `ems__Effort_status` → `"[[ems__EffortStatusBacklog]]"`

---

#### `move-to-analysis`

Transitions project to Analysis status.

**Syntax:**
```bash
exocortex command move-to-analysis <filepath> [--vault <path>]
```

**Examples:**
```bash
exocortex command move-to-analysis "projects/my-project.md"

# Output:
# ✅ Moved to Analysis: projects/my-project.md
#    Status: Analysis
```

**Changes:**
- Sets `ems__Effort_status` → `"[[ems__EffortStatusAnalysis]]"`

---

#### `move-to-todo`

Transitions task/project to ToDo status.

**Syntax:**
```bash
exocortex command move-to-todo <filepath> [--vault <path>]
```

**Examples:**
```bash
exocortex command move-to-todo "tasks/task.md"

# Output:
# ✅ Moved to ToDo: tasks/task.md
#    Status: ToDo
```

**Changes:**
- Sets `ems__Effort_status` → `"[[ems__EffortStatusToDo]]"`

---

### Creation Commands

Commands for creating new assets with complete frontmatter initialization.

#### `create-task`

Creates new task file with complete frontmatter.

**Syntax:**
```bash
exocortex command create-task <filepath> \
  --label "<value>" \
  [--prototype <uid>] \
  [--area <uid>] \
  [--parent <uid>] \
  [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path where task file should be created
- `--label <value>` - **Required**. Task label

**Options:**
- `--prototype <uid>` - Prototype UID for inheritance
- `--area <uid>` - Area UID for effort linkage
- `--parent <uid>` - Parent UID for effort linkage
- `--vault <path>` - Path to Obsidian vault

**Examples:**
```bash
# Create simple task
exocortex command create-task "03 Knowledge/tasks/new-task.md" \
  --label "Implement feature X"

# Output:
# ✅ Created task: 03 Knowledge/tasks/new-task.md
#    UID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
#    Label: Implement feature X
#    Class: ems__Task

# Create task with prototype and area
exocortex command create-task "tasks/new-task.md" \
  --label "My Task" \
  --prototype "prototype-uid-123" \
  --area "area-uid-456"

# Create task with parent (subtask)
exocortex command create-task "tasks/subtask.md" \
  --label "Subtask" \
  --parent "parent-task-uid"
```

**Generated Frontmatter:**
```yaml
---
exo__Asset_isDefinedBy: "[[Ontology/EMS]]"
exo__Asset_uid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
exo__Asset_label: Implement feature X
exo__Asset_createdAt: 2025-11-23T10:00:00
exo__Instance_class:
  - "[[ems__Task]]"
ems__Effort_status: "[[ems__EffortStatusDraft]]"
aliases:
  - Implement feature X
---
```

**Exit Codes:**
- `0` - Success
- `1` - File already exists
- `2` - Missing `--label` option
- `2` - Empty label value

---

#### `create-meeting`

Creates new meeting file with complete frontmatter.

**Syntax:**
```bash
exocortex command create-meeting <filepath> \
  --label "<value>" \
  [--prototype <uid>] \
  [--area <uid>] \
  [--parent <uid>] \
  [--vault <path>]
```

**Examples:**
```bash
# Create meeting
exocortex command create-meeting "meetings/daily-standup.md" \
  --label "Daily Standup - 2025-11-23"

# Output:
# ✅ Created meeting: meetings/daily-standup.md
#    UID: meeting-uid-123
#    Label: Daily Standup - 2025-11-23
#    Class: ems__Meeting

# Create meeting with area
exocortex command create-meeting "meetings/sprint-planning.md" \
  --label "Sprint Planning" \
  --area "product-area-uid"
```

**Generated Class:**
- `exo__Instance_class: ["[[ems__Meeting]]"]`
- `ems__Effort_status: "[[ems__EffortStatusDraft]]"`

---

#### `create-project`

Creates new project file with complete frontmatter.

**Syntax:**
```bash
exocortex command create-project <filepath> \
  --label "<value>" \
  [--area <uid>] \
  [--parent <uid>] \
  [--vault <path>]
```

**Examples:**
```bash
# Create project
exocortex command create-project "projects/new-feature.md" \
  --label "Implement Feature X"

# Output:
# ✅ Created project: projects/new-feature.md
#    UID: project-uid-123
#    Label: Implement Feature X
#    Class: ems__Project

# Create project in area
exocortex command create-project "projects/feature.md" \
  --label "Feature" \
  --area "product-area-uid"
```

**Generated Class:**
- `exo__Instance_class: ["[[ems__Project]]"]`
- `ems__Effort_status: "[[ems__EffortStatusDraft]]"`

---

#### `create-area`

Creates new area file with complete frontmatter.

**Syntax:**
```bash
exocortex command create-area <filepath> \
  --label "<value>" \
  [--vault <path>]
```

**Examples:**
```bash
# Create area
exocortex command create-area "areas/product.md" \
  --label "Product Development"

# Output:
# ✅ Created area: areas/product.md
#    UID: area-uid-123
#    Label: Product Development
#    Class: ems__Area
```

**Generated Class:**
- `exo__Instance_class: ["[[ems__Area]]"]`
- No status property (areas don't have status)

---

### Planning Commands

Commands for scheduling and deadline management.

#### `schedule`

Sets planned start timestamp for an effort (task/project/meeting).

**Syntax:**
```bash
exocortex command schedule <filepath> --date "YYYY-MM-DD" [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to effort file
- `--date "YYYY-MM-DD"` - **Required**. Date in YYYY-MM-DD format

**Examples:**
```bash
# Schedule task for specific date
exocortex command schedule "tasks/my-task.md" --date "2025-11-25"

# Output:
# ✅ Scheduled: tasks/my-task.md
#    Date: 2025-11-25
#    Timestamp: 2025-11-25T00:00:00

# Schedule with vault path
exocortex command schedule "tasks/task.md" \
  --date "2025-12-01" \
  --vault /path/to/vault
```

**Changes:**
- Sets `ems__Effort_plannedStartTimestamp` → `2025-11-25T00:00:00`
- Timestamp is at start of day (00:00:00)

**Date Validation:**
- Must match format: `YYYY-MM-DD` (e.g., `2025-11-25`)
- Invalid formats: `11-25-2025`, `2025/11/25`, `Nov 25 2025`

**Exit Codes:**
- `0` - Success
- `1` - File not found
- `2` - Invalid date format
- `2` - Missing `--date` option

---

#### `set-deadline`

Sets planned end timestamp for an effort (task/project/meeting).

**Syntax:**
```bash
exocortex command set-deadline <filepath> --date "YYYY-MM-DD" [--vault <path>]
```

**Arguments:**
- `<filepath>` - Path to effort file
- `--date "YYYY-MM-DD"` - **Required**. Date in YYYY-MM-DD format

**Examples:**
```bash
# Set deadline for task
exocortex command set-deadline "tasks/my-task.md" --date "2025-12-01"

# Output:
# ✅ Set deadline for: tasks/my-task.md
#    Date: 2025-12-01
#    Timestamp: 2025-12-01T00:00:00

# Set deadline with vault path
exocortex command set-deadline "tasks/task.md" \
  --date "2025-12-15" \
  --vault /path/to/vault
```

**Changes:**
- Sets `ems__Effort_plannedEndTimestamp` → `2025-12-01T00:00:00`
- Timestamp is at start of day (00:00:00)

**Exit Codes:**
- `0` - Success
- `1` - File not found
- `2` - Invalid date format
- `2` - Missing `--date` option

---

## Exit Codes

All commands follow standard exit code conventions:

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | Success | Command executed successfully |
| `1` | General error | File read/write error, network error |
| `2` | Invalid arguments | Missing required option, invalid format |

**Checking exit codes in scripts:**

```bash
# Success check
exocortex command start "tasks/task.md"
if [ $? -eq 0 ]; then
  echo "Task started successfully"
fi

# Error handling
exocortex command update-label "tasks/task.md" --label "New Label"
if [ $? -ne 0 ]; then
  echo "Failed to update label"
  exit 1
fi
```

---

## Global Options

Options available for all commands:

### `--vault <path>`

Specifies the Obsidian vault root directory.

**Default:** Current working directory (`process.cwd()`)

**Examples:**
```bash
# Use current directory (default)
exocortex command start "tasks/task.md"

# Explicit vault path (absolute)
exocortex command start "tasks/task.md" \
  --vault /Users/username/Documents/MyVault

# Explicit vault path (relative)
exocortex command start "tasks/task.md" \
  --vault ../my-vault
```

**Path Resolution:**
- Relative paths resolved from current working directory
- Absolute paths used as-is
- `~` expands to home directory
- Paths validated before command execution

---

## Common Patterns

### Batch Operations

```bash
# Rename all tasks in directory
for file in tasks/*.md; do
  exocortex command rename-to-uid "$file"
done

# Complete multiple tasks
exocortex command complete "tasks/task-1.md"
exocortex command complete "tasks/task-2.md"
exocortex command complete "tasks/task-3.md"
```

### Combining with SPARQL

```bash
# Find all tasks in Doing status and complete them
cat > query.sparql <<EOF
SELECT ?file WHERE {
  ?task exo:Asset_uid ?uid ;
        ems:Effort_status ems:EffortStatusDoing .
  BIND(CONCAT("tasks/", STR(?uid), ".md") AS ?file)
}
EOF

exocortex sparql query.sparql | while read file; do
  exocortex command complete "$file"
done
```

### Error Recovery

```bash
# Retry on failure
exocortex command start "tasks/task.md"
if [ $? -ne 0 ]; then
  echo "Retrying..."
  sleep 1
  exocortex command start "tasks/task.md"
fi
```

---

## Related Documentation

- [Scripting Patterns](./Scripting-Patterns.md) - Bash scripting examples and batch operations
- [Integration Examples](./Integration-Examples.md) - CI/CD workflows and automation
- [Troubleshooting](./Troubleshooting.md) - Common errors and debugging
- [Property Schema](../PROPERTY_SCHEMA.md) - Frontmatter property reference
