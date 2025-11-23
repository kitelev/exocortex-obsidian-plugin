# CLI Scripting Patterns

Practical bash scripting patterns for automating Exocortex workflows with CLI commands.

## Table of Contents

- [Batch Operations](#batch-operations)
- [SPARQL + Command Combinations](#sparql--command-combinations)
- [Error Handling](#error-handling)
- [Parallel Execution](#parallel-execution)
- [Workflow Automation](#workflow-automation)
- [Best Practices](#best-practices)

---

## Batch Operations

### Rename All Tasks to UID Format

```bash
#!/bin/bash
# rename-all-tasks.sh - Rename all task files to UID format

VAULT_PATH="/path/to/vault"
TASK_DIR="03 Knowledge/tasks"

# Find all markdown files in tasks directory
find "$VAULT_PATH/$TASK_DIR" -name "*.md" -type f | while read filepath; do
  # Get relative path from vault root
  relative_path="${filepath#$VAULT_PATH/}"

  # Rename to UID
  exocortex command rename-to-uid "$relative_path" --vault "$VAULT_PATH"

  # Check exit code
  if [ $? -eq 0 ]; then
    echo "✓ Renamed: $relative_path"
  else
    echo "✗ Failed: $relative_path"
  fi
done
```

**Usage:**
```bash
chmod +x rename-all-tasks.sh
./rename-all-tasks.sh
```

---

### Update Labels for Multiple Files

```bash
#!/bin/bash
# update-labels.sh - Update labels from CSV file

# CSV format: filepath,new_label
# Example: tasks/task-1.md,Implement Feature X

VAULT_PATH="/path/to/vault"
CSV_FILE="labels.csv"

# Skip header row, read CSV
tail -n +2 "$CSV_FILE" | while IFS=',' read filepath label; do
  exocortex command update-label "$filepath" \
    --label "$label" \
    --vault "$VAULT_PATH"

  if [ $? -eq 0 ]; then
    echo "✓ Updated: $filepath → $label"
  else
    echo "✗ Failed: $filepath"
  fi
done
```

**CSV Example (`labels.csv`):**
```csv
filepath,label
tasks/task-1.md,Implement Feature X
tasks/task-2.md,Fix Bug Y
tasks/task-3.md,Write Documentation
```

---

### Complete All Doing Tasks

```bash
#!/bin/bash
# complete-doing-tasks.sh - Complete all tasks in Doing status

VAULT_PATH="/path/to/vault"

# Find all files with Doing status using grep
grep -r "ems__Effort_status.*Doing" "$VAULT_PATH/03 Knowledge/tasks" \
  | cut -d: -f1 \
  | while read filepath; do

  # Get relative path
  relative_path="${filepath#$VAULT_PATH/}"

  # Complete task
  exocortex command complete "$relative_path" --vault "$VAULT_PATH"

  if [ $? -eq 0 ]; then
    echo "✓ Completed: $relative_path"
  else
    echo "✗ Failed: $relative_path"
  fi
done
```

---

### Bulk Create Tasks from Template

```bash
#!/bin/bash
# create-tasks-bulk.sh - Create multiple tasks from list

VAULT_PATH="/path/to/vault"
TASK_DIR="03 Knowledge/tasks"

# Task list (one per line)
TASKS=(
  "Implement feature A"
  "Implement feature B"
  "Implement feature C"
  "Write tests"
  "Update documentation"
)

for label in "${TASKS[@]}"; do
  # Generate filename from label (lowercase, replace spaces with hyphens)
  filename=$(echo "$label" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  filepath="$TASK_DIR/$filename.md"

  # Create task
  exocortex command create-task "$filepath" \
    --label "$label" \
    --vault "$VAULT_PATH"

  if [ $? -eq 0 ]; then
    echo "✓ Created: $filepath"
  else
    echo "✗ Failed: $filepath (may already exist)"
  fi
done
```

---

### Schedule Tasks for Week

```bash
#!/bin/bash
# schedule-week.sh - Schedule tasks for the week

VAULT_PATH="/path/to/vault"

# Get Monday of current week
MONDAY=$(date -d "monday this week" +%Y-%m-%d)

# Tasks to schedule
declare -A SCHEDULE=(
  ["monday"]="tasks/task-1.md tasks/task-2.md"
  ["tuesday"]="tasks/task-3.md"
  ["wednesday"]="tasks/task-4.md tasks/task-5.md"
  ["thursday"]="tasks/task-6.md"
  ["friday"]="tasks/task-7.md tasks/task-8.md"
)

# Schedule each day
for day in monday tuesday wednesday thursday friday; do
  # Calculate date offset
  case $day in
    monday) offset=0 ;;
    tuesday) offset=1 ;;
    wednesday) offset=2 ;;
    thursday) offset=3 ;;
    friday) offset=4 ;;
  esac

  # Calculate date
  date=$(date -d "$MONDAY + $offset days" +%Y-%m-%d)

  # Schedule tasks for this day
  for task in ${SCHEDULE[$day]}; do
    exocortex command schedule "$task" \
      --date "$date" \
      --vault "$VAULT_PATH"

    echo "✓ Scheduled $task for $date ($day)"
  done
done
```

---

## SPARQL + Command Combinations

### Complete Tasks by Query

```bash
#!/bin/bash
# complete-by-query.sh - Complete tasks matching SPARQL query

VAULT_PATH="/path/to/vault"

# Create SPARQL query
cat > /tmp/query.sparql <<'EOF'
PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?uid WHERE {
  ?task exo:Asset_uid ?uid ;
        exo:Instance_class ems:Task ;
        ems:Effort_status ems:EffortStatusDoing .

  # Only tasks with "bug" in label
  FILTER(CONTAINS(LCASE(?label), "bug"))
}
EOF

# Execute query and process results
exocortex sparql /tmp/query.sparql --vault "$VAULT_PATH" | \
jq -r '.results.bindings[].uid.value' | \
while read uid; do
  # Find file by UID
  filepath=$(find "$VAULT_PATH" -name "$uid.md" | head -1)

  if [ -n "$filepath" ]; then
    relative_path="${filepath#$VAULT_PATH/}"

    # Complete task
    exocortex command complete "$relative_path" --vault "$VAULT_PATH"

    echo "✓ Completed: $relative_path"
  fi
done

# Cleanup
rm /tmp/query.sparql
```

---

### Archive Old Completed Tasks

```bash
#!/bin/bash
# archive-old-tasks.sh - Archive tasks completed >30 days ago

VAULT_PATH="/path/to/vault"

# Get cutoff date (30 days ago)
CUTOFF_DATE=$(date -d "30 days ago" +%Y-%m-%dT%H:%M:%S)

# SPARQL query for old completed tasks
cat > /tmp/archive-query.sparql <<EOF
PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?uid ?completionTime WHERE {
  ?task exo:Asset_uid ?uid ;
        ems:Effort_status ems:EffortStatusDone ;
        ems:Effort_resolutionTimestamp ?completionTime .

  # Filter by completion date
  FILTER(?completionTime < "$CUTOFF_DATE"^^xsd:dateTime)
}
EOF

# Execute and archive
exocortex sparql /tmp/archive-query.sparql --vault "$VAULT_PATH" | \
jq -r '.results.bindings[].uid.value' | \
while read uid; do
  # Find file
  filepath=$(find "$VAULT_PATH" -name "$uid.md" | head -1)

  if [ -n "$filepath" ]; then
    relative_path="${filepath#$VAULT_PATH/}"

    # Archive
    exocortex command archive "$relative_path" --vault "$VAULT_PATH"

    echo "✓ Archived: $relative_path"
  fi
done

rm /tmp/archive-query.sparql
```

---

### Move Tasks to Backlog by Area

```bash
#!/bin/bash
# backlog-by-area.sh - Move tasks from specific area to Backlog

VAULT_PATH="/path/to/vault"
AREA_UID="area-uid-to-backlog"

# Query tasks in area with ToDo status
cat > /tmp/backlog-query.sparql <<EOF
PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?uid WHERE {
  ?task exo:Asset_uid ?uid ;
        ems:Effort_area <$AREA_UID> ;
        ems:Effort_status ems:EffortStatusToDo .
}
EOF

# Execute and move to backlog
exocortex sparql /tmp/backlog-query.sparql --vault "$VAULT_PATH" | \
jq -r '.results.bindings[].uid.value' | \
while read uid; do
  filepath=$(find "$VAULT_PATH" -name "$uid.md" | head -1)

  if [ -n "$filepath" ]; then
    relative_path="${filepath#$VAULT_PATH/}"
    exocortex command move-to-backlog "$relative_path" --vault "$VAULT_PATH"
    echo "✓ Moved to Backlog: $relative_path"
  fi
done

rm /tmp/backlog-query.sparql
```

---

## Error Handling

### Robust Error Handling Pattern

```bash
#!/bin/bash
# robust-command.sh - Template with comprehensive error handling

set -euo pipefail  # Exit on error, undefined vars, pipe failures

VAULT_PATH="/path/to/vault"
LOG_FILE="command-log.txt"

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
  log "ERROR: Command failed at line $1"
  exit 1
}

trap 'error_handler $LINENO' ERR

# Execute command with retry logic
execute_with_retry() {
  local filepath="$1"
  local command_name="$2"
  local max_retries=3
  local retry_delay=2

  for i in $(seq 1 $max_retries); do
    log "Attempt $i/$max_retries: $command_name $filepath"

    if exocortex command "$command_name" "$filepath" --vault "$VAULT_PATH" 2>&1 | tee -a "$LOG_FILE"; then
      log "SUCCESS: $command_name $filepath"
      return 0
    fi

    if [ $i -lt $max_retries ]; then
      log "RETRY: Waiting ${retry_delay}s before retry..."
      sleep $retry_delay
    fi
  done

  log "FAILED: $command_name $filepath after $max_retries attempts"
  return 1
}

# Usage
execute_with_retry "tasks/task.md" "start"
```

---

### Validate Before Execute

```bash
#!/bin/bash
# validate-before-execute.sh - Validate files exist before running commands

VAULT_PATH="/path/to/vault"

validate_file() {
  local filepath="$1"
  local full_path="$VAULT_PATH/$filepath"

  # Check file exists
  if [ ! -f "$full_path" ]; then
    echo "ERROR: File not found: $filepath"
    return 1
  fi

  # Check file has .md extension
  if [[ ! "$filepath" =~ \.md$ ]]; then
    echo "ERROR: Not a markdown file: $filepath"
    return 1
  fi

  # Check file is not empty
  if [ ! -s "$full_path" ]; then
    echo "ERROR: File is empty: $filepath"
    return 1
  fi

  return 0
}

# Execute with validation
execute_safe() {
  local filepath="$1"
  local command_name="$2"

  if validate_file "$filepath"; then
    exocortex command "$command_name" "$filepath" --vault "$VAULT_PATH"
  else
    echo "Skipping: $filepath"
    return 1
  fi
}

# Usage
execute_safe "tasks/task-1.md" "start"
execute_safe "tasks/task-2.md" "complete"
```

---

### Rollback on Failure

```bash
#!/bin/bash
# rollback-on-failure.sh - Backup before modify, rollback on failure

VAULT_PATH="/path/to/vault"
BACKUP_DIR="/tmp/vault-backup"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup file
backup_file() {
  local filepath="$1"
  local full_path="$VAULT_PATH/$filepath"
  local backup_path="$BACKUP_DIR/${filepath//\//_}"

  cp "$full_path" "$backup_path"
  echo "$full_path:$backup_path" >> "$BACKUP_DIR/manifest.txt"
}

# Rollback file
rollback_file() {
  local filepath="$1"
  local backup_path="$BACKUP_DIR/${filepath//\//_}"
  local full_path="$VAULT_PATH/$filepath"

  if [ -f "$backup_path" ]; then
    cp "$backup_path" "$full_path"
    echo "✓ Rolled back: $filepath"
  fi
}

# Execute with backup
execute_with_backup() {
  local filepath="$1"
  local command_name="$2"

  # Backup before modify
  backup_file "$filepath"

  # Execute command
  if exocortex command "$command_name" "$filepath" --vault "$VAULT_PATH"; then
    echo "✓ Success: $command_name $filepath"
    return 0
  else
    echo "✗ Failed: $command_name $filepath"
    rollback_file "$filepath"
    return 1
  fi
}

# Cleanup backups
cleanup_backups() {
  rm -rf "$BACKUP_DIR"
}

# Usage
execute_with_backup "tasks/task.md" "start"

# Cleanup after success
cleanup_backups
```

---

## Parallel Execution

### Parallel Task Processing

```bash
#!/bin/bash
# parallel-tasks.sh - Process multiple tasks in parallel

VAULT_PATH="/path/to/vault"
MAX_PARALLEL=4  # Number of parallel jobs

# Function to process single task
process_task() {
  local filepath="$1"
  local command_name="$2"

  exocortex command "$command_name" "$filepath" --vault "$VAULT_PATH"

  if [ $? -eq 0 ]; then
    echo "✓ $command_name: $filepath"
  else
    echo "✗ FAILED: $command_name $filepath"
  fi
}

export -f process_task
export VAULT_PATH

# Get task list
TASKS=(
  "tasks/task-1.md"
  "tasks/task-2.md"
  "tasks/task-3.md"
  "tasks/task-4.md"
  "tasks/task-5.md"
)

# Process in parallel using GNU parallel
printf "%s\n" "${TASKS[@]}" | \
  parallel -j "$MAX_PARALLEL" process_task {} "complete"

# Alternative: xargs parallel
# printf "%s\n" "${TASKS[@]}" | \
#   xargs -P "$MAX_PARALLEL" -I {} bash -c "process_task '{}' 'complete'"
```

**Requires:** `gnu-parallel` or `xargs -P` support

**Install parallel:**
```bash
# macOS
brew install parallel

# Ubuntu/Debian
sudo apt-get install parallel
```

---

### Rate-Limited Execution

```bash
#!/bin/bash
# rate-limited.sh - Execute commands with rate limiting

VAULT_PATH="/path/to/vault"
RATE_LIMIT=5  # Max 5 commands per second

# Get task list
TASKS=(
  "tasks/task-1.md"
  "tasks/task-2.md"
  "tasks/task-3.md"
  # ... many more tasks
)

# Execute with rate limiting
count=0
for task in "${TASKS[@]}"; do
  exocortex command start "$task" --vault "$VAULT_PATH" &

  count=$((count + 1))

  # Sleep every N commands
  if [ $((count % RATE_LIMIT)) -eq 0 ]; then
    wait  # Wait for background jobs to finish
    sleep 1
  fi
done

# Wait for remaining jobs
wait
```

---

## Workflow Automation

### Daily Task Workflow

```bash
#!/bin/bash
# daily-workflow.sh - Automated daily task management

VAULT_PATH="/path/to/vault"
TODAY=$(date +%Y-%m-%d)

# 1. Move yesterday's incomplete tasks to backlog
echo "=== Moving overdue tasks to backlog ==="
grep -r "ems__Effort_plannedStartTimestamp.*$(date -d yesterday +%Y-%m-%d)" \
  "$VAULT_PATH/03 Knowledge/tasks" | \
  cut -d: -f1 | \
while read filepath; do
  relative_path="${filepath#$VAULT_PATH/}"

  # Check if still ToDo (not started)
  if grep -q "ems__Effort_status.*ToDo" "$filepath"; then
    exocortex command move-to-backlog "$relative_path" --vault "$VAULT_PATH"
    echo "→ Backlog: $relative_path"
  fi
done

# 2. Move today's scheduled tasks to ToDo
echo ""
echo "=== Activating today's tasks ==="
grep -r "ems__Effort_plannedStartTimestamp.*$TODAY" \
  "$VAULT_PATH/03 Knowledge/tasks" | \
  cut -d: -f1 | \
while read filepath; do
  relative_path="${filepath#$VAULT_PATH/}"
  exocortex command move-to-todo "$relative_path" --vault "$VAULT_PATH"
  echo "→ ToDo: $relative_path"
done

# 3. Archive tasks completed >30 days ago
echo ""
echo "=== Archiving old tasks ==="
CUTOFF=$(date -d "30 days ago" +%Y-%m-%d)
grep -r "ems__Effort_resolutionTimestamp" "$VAULT_PATH/03 Knowledge/tasks" | \
  while IFS=: read filepath timestamp_line; do
    # Extract timestamp
    timestamp=$(echo "$timestamp_line" | grep -oP '\d{4}-\d{2}-\d{2}')

    # Compare dates
    if [[ "$timestamp" < "$CUTOFF" ]]; then
      relative_path="${filepath#$VAULT_PATH/}"
      exocortex command archive "$relative_path" --vault "$VAULT_PATH"
      echo "→ Archived: $relative_path"
    fi
  done

echo ""
echo "✓ Daily workflow complete"
```

**Schedule with cron:**
```cron
# Run daily at 8:00 AM
0 8 * * * /path/to/daily-workflow.sh >> /var/log/exocortex-daily.log 2>&1
```

---

### Sprint Planning Workflow

```bash
#!/bin/bash
# sprint-planning.sh - Automated sprint setup

VAULT_PATH="/path/to/vault"
SPRINT_AREA="area-current-sprint"
SPRINT_START=$(date +%Y-%m-%d)
SPRINT_END=$(date -d "+14 days" +%Y-%m-%d)

# 1. Create sprint tasks from backlog
echo "=== Creating sprint tasks ==="

# Query backlog tasks
cat > /tmp/sprint-query.sparql <<EOF
PREFIX ems: <https://exocortex.my/ontology/ems#>
PREFIX exo: <https://exocortex.my/ontology/exo#>

SELECT ?uid ?label WHERE {
  ?task exo:Asset_uid ?uid ;
        exo:Asset_label ?label ;
        ems:Effort_status ems:EffortStatusBacklog ;
        ems:Effort_voteTally ?votes .

  # Top 10 tasks by votes
  FILTER(?votes > 0)
}
ORDER BY DESC(?votes)
LIMIT 10
EOF

exocortex sparql /tmp/sprint-query.sparql --vault "$VAULT_PATH" | \
jq -r '.results.bindings[] | "\(.uid.value),\(.label.value)"' | \
while IFS=',' read uid label; do
  # Move to ToDo
  filepath=$(find "$VAULT_PATH" -name "$uid.md" | head -1)
  relative_path="${filepath#$VAULT_PATH/}"

  exocortex command move-to-todo "$relative_path" --vault "$VAULT_PATH"

  # Set area
  # (Note: This would require an update-area command - placeholder)
  echo "→ Sprint task: $label"
done

# 2. Schedule sprint tasks
echo ""
echo "=== Scheduling sprint ==="

# Distribute tasks across 2 weeks
# (Simplified - actual distribution would be more complex)
find "$VAULT_PATH/03 Knowledge/tasks" -name "*.md" | \
  head -10 | \
while read filepath; do
  # Random day in sprint
  offset=$((RANDOM % 14))
  schedule_date=$(date -d "$SPRINT_START + $offset days" +%Y-%m-%d)

  relative_path="${filepath#$VAULT_PATH/}"
  exocortex command schedule "$relative_path" \
    --date "$schedule_date" \
    --vault "$VAULT_PATH"

  echo "→ Scheduled: $relative_path for $schedule_date"
done

echo ""
echo "✓ Sprint planning complete"
```

---

## Best Practices

### 1. Always Use Absolute Paths

```bash
# ❌ BAD: Relative to script location (fragile)
exocortex command start "tasks/task.md"

# ✅ GOOD: Explicit vault path
VAULT_PATH="/path/to/vault"
exocortex command start "tasks/task.md" --vault "$VAULT_PATH"
```

---

### 2. Check Exit Codes

```bash
# ❌ BAD: Ignores errors
for task in "${TASKS[@]}"; do
  exocortex command start "$task"
done

# ✅ GOOD: Check and handle errors
for task in "${TASKS[@]}"; do
  if exocortex command start "$task" --vault "$VAULT_PATH"; then
    echo "✓ Started: $task"
  else
    echo "✗ Failed: $task"
    # Log error, retry, or skip
  fi
done
```

---

### 3. Use Logging

```bash
# ❌ BAD: No audit trail
exocortex command complete "tasks/task.md"

# ✅ GOOD: Log all operations
LOG_FILE="/var/log/exocortex.log"

{
  echo "[$(date)] Completing task: tasks/task.md"
  exocortex command complete "tasks/task.md" --vault "$VAULT_PATH"
  echo "[$(date)] Exit code: $?"
} | tee -a "$LOG_FILE"
```

---

### 4. Validate Inputs

```bash
# ❌ BAD: Trust user input
exocortex command create-task "$USER_INPUT.md" --label "$USER_LABEL"

# ✅ GOOD: Validate and sanitize
if [[ "$USER_INPUT" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  exocortex command create-task "tasks/$USER_INPUT.md" \
    --label "$USER_LABEL" \
    --vault "$VAULT_PATH"
else
  echo "ERROR: Invalid filename: $USER_INPUT"
  exit 1
fi
```

---

### 5. Use Functions for Reusability

```bash
# ❌ BAD: Duplicate code
exocortex command start "tasks/task-1.md" --vault "$VAULT_PATH"
if [ $? -eq 0 ]; then echo "✓"; else echo "✗"; fi

exocortex command start "tasks/task-2.md" --vault "$VAULT_PATH"
if [ $? -eq 0 ]; then echo "✓"; else echo "✗"; fi

# ✅ GOOD: Reusable function
execute_command() {
  local filepath="$1"
  local command_name="$2"

  if exocortex command "$command_name" "$filepath" --vault "$VAULT_PATH"; then
    echo "✓ $command_name: $filepath"
    return 0
  else
    echo "✗ FAILED: $command_name $filepath"
    return 1
  fi
}

execute_command "tasks/task-1.md" "start"
execute_command "tasks/task-2.md" "start"
```

---

## Related Documentation

- [Command Reference](./Command-Reference.md) - Complete command syntax and options
- [Integration Examples](./Integration-Examples.md) - CI/CD workflows
- [Troubleshooting](./Troubleshooting.md) - Debugging script issues
