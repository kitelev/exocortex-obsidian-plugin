# CLI Troubleshooting Guide

Common issues, error messages, and debugging tips for Exocortex CLI commands.

## Table of Contents

- [Common Errors](#common-errors)
- [Path Resolution Issues](#path-resolution-issues)
- [Frontmatter Problems](#frontmatter-problems)
- [Debugging Techniques](#debugging-techniques)
- [Performance Issues](#performance-issues)
- [Integration Problems](#integration-problems)

---

## Common Errors

### Error: File not found

**Error message:**
```
Error: File not found: tasks/my-task.md
Process exited with code 1
```

**Causes:**
1. File doesn't exist at specified path
2. Wrong vault path
3. Path uses absolute instead of relative (or vice versa)

**Solutions:**

```bash
# Check file exists
ls -la /path/to/vault/tasks/my-task.md

# Verify vault path
exocortex command start "tasks/my-task.md" \
  --vault /absolute/path/to/vault

# Use find to locate file
find /path/to/vault -name "my-task.md"

# Get relative path from vault root
cd /path/to/vault
realpath --relative-to=. tasks/my-task.md
```

---

### Error: Missing required option --label

**Error message:**
```
Error: --label option is required for update-label command
Usage: exocortex command update-label <filepath> --label "<value>"
Process exited with code 2
```

**Cause:**
Required `--label` option not provided for commands that need it.

**Commands requiring --label:**
- `update-label`
- `create-task`
- `create-meeting`
- `create-project`
- `create-area`

**Solution:**
```bash
# ❌ WRONG: Missing --label
exocortex command update-label "tasks/task.md"

# ✅ CORRECT: Include --label
exocortex command update-label "tasks/task.md" --label "My Task"
```

---

### Error: Invalid date format

**Error message:**
```
Error: Invalid date format: 11-25-2025. Expected YYYY-MM-DD (e.g., 2025-11-25)
Process exited with code 2
```

**Cause:**
Date not in YYYY-MM-DD format for `schedule` or `set-deadline` commands.

**Invalid formats:**
- `11-25-2025` (MM-DD-YYYY)
- `2025/11/25` (slashes instead of hyphens)
- `Nov 25 2025` (text month)
- `25.11.2025` (dots)

**Solution:**
```bash
# ❌ WRONG formats
exocortex command schedule "tasks/task.md" --date "11-25-2025"
exocortex command schedule "tasks/task.md" --date "2025/11/25"

# ✅ CORRECT format (YYYY-MM-DD)
exocortex command schedule "tasks/task.md" --date "2025-11-25"
```

**Converting dates:**
```bash
# From MM-DD-YYYY
date -d "11-25-2025" +%Y-%m-%d  # Output: 2025-11-25

# From "Nov 25 2025"
date -d "Nov 25 2025" +%Y-%m-%d  # Output: 2025-11-25
```

---

### Error: Asset missing exo__Asset_uid property

**Error message:**
```
Error: Asset missing exo__Asset_uid property
Process exited with code 2
```

**Cause:**
File doesn't have required `exo__Asset_uid` property in frontmatter.

**Solution:**

```bash
# Check frontmatter
head -20 /path/to/vault/tasks/task.md

# Add UID manually (use uuidgen or similar)
UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "Adding UID: $UUID"

# Edit frontmatter to add:
# exo__Asset_uid: $UUID
```

**Prevention:**
Create all assets using CLI creation commands:
```bash
exocortex command create-task "tasks/new-task.md" \
  --label "My Task" \
  --vault /path/to/vault
```

---

### Error: Label cannot be empty

**Error message:**
```
Error: Label cannot be empty
Process exited with code 2
```

**Cause:**
`--label` option provided but value is empty or whitespace-only.

**Solution:**
```bash
# ❌ WRONG: Empty label
exocortex command create-task "tasks/task.md" --label ""
exocortex command create-task "tasks/task.md" --label "   "

# ✅ CORRECT: Non-empty label
exocortex command create-task "tasks/task.md" --label "My Task"
```

---

### Error: File already exists

**Error message:**
```
Error: File already exists: tasks/my-task.md
Process exited with code 1
```

**Cause:**
Trying to create a file that already exists (create-task, create-project, etc.).

**Solutions:**

```bash
# Check if file exists first
if [ ! -f "/path/to/vault/tasks/my-task.md" ]; then
  exocortex command create-task "tasks/my-task.md" \
    --label "My Task"
fi

# Use different filename
exocortex command create-task "tasks/my-task-2.md" \
  --label "My Task"

# Remove existing file (if safe)
rm /path/to/vault/tasks/my-task.md
exocortex command create-task "tasks/my-task.md" \
  --label "My Task"
```

---

## Path Resolution Issues

### Relative vs Absolute Paths

**Problem:**
Path interpreted incorrectly depending on current directory.

**Understanding path resolution:**

```bash
# Current directory matters for relative paths
cd /some/directory
exocortex command start "tasks/task.md"  # Looks in /some/directory/tasks/task.md
# ❌ WRONG if vault is elsewhere

# Always use --vault to specify vault root
exocortex command start "tasks/task.md" \
  --vault /path/to/vault  # Looks in /path/to/vault/tasks/task.md
# ✅ CORRECT
```

**Best practice - use absolute paths for vault:**
```bash
#!/bin/bash
# ❌ BAD: Relative vault path (fragile)
VAULT_PATH="../my-vault"
exocortex command start "tasks/task.md" --vault "$VAULT_PATH"

# ✅ GOOD: Absolute vault path (reliable)
VAULT_PATH="/Users/username/Documents/my-vault"
exocortex command start "tasks/task.md" --vault "$VAULT_PATH"

# ✅ ALSO GOOD: Resolve relative to absolute
VAULT_PATH=$(cd ../my-vault && pwd)
exocortex command start "tasks/task.md" --vault "$VAULT_PATH"
```

---

### Special Characters in Paths

**Problem:**
Paths with spaces or special characters cause errors.

**Solutions:**

```bash
# ❌ WRONG: Unquoted path with spaces
exocortex command start tasks/my task.md

# ✅ CORRECT: Quoted path
exocortex command start "tasks/my task.md"

# ❌ WRONG: Unescaped special characters
exocortex command start "tasks/task(1).md"  # Parentheses may cause issues

# ✅ CORRECT: Escape special characters in scripts
FILEPATH="tasks/task(1).md"
exocortex command start "$FILEPATH" --vault "/path/to/vault"
```

---

### Vault Auto-Detection

**Problem:**
CLI doesn't find vault when `--vault` not specified.

**Default behavior:**
- Uses `process.cwd()` (current working directory) as vault root
- May not be your vault directory

**Solutions:**

```bash
# Option 1: Always specify --vault
exocortex command start "tasks/task.md" \
  --vault /path/to/vault

# Option 2: Run from vault root
cd /path/to/vault
exocortex command start "tasks/task.md"

# Option 3: Set environment variable in scripts
export EXOCORTEX_VAULT="/path/to/vault"
# (Note: CLI doesn't support env var yet, but you can use in scripts)
VAULT_PATH="${EXOCORTEX_VAULT:-/default/path}"
exocortex command start "tasks/task.md" --vault "$VAULT_PATH"
```

---

## Frontmatter Problems

### Malformed YAML

**Problem:**
Command fails due to invalid YAML syntax in frontmatter.

**Common YAML errors:**

```yaml
# ❌ WRONG: Missing quotes around wiki-link
ems__Effort_status: [[ems__EffortStatusToDo]]

# ✅ CORRECT: Quoted wiki-link
ems__Effort_status: "[[ems__EffortStatusToDo]]"

# ❌ WRONG: Inconsistent indentation
aliases:
- Task 1
  - Task 2

# ✅ CORRECT: Consistent indentation
aliases:
  - Task 1
  - Task 2

# ❌ WRONG: Missing colon
exo__Asset_label Task Name

# ✅ CORRECT: Include colon
exo__Asset_label: Task Name
```

**Validation:**

```bash
# Check frontmatter syntax with yq
yq eval frontmatter /path/to/vault/tasks/task.md

# Validate YAML
python3 -c "
import yaml
with open('/path/to/vault/tasks/task.md') as f:
    content = f.read()
    frontmatter = content.split('---')[1]
    yaml.safe_load(frontmatter)
print('Valid YAML')
"
```

---

### Missing Required Properties

**Problem:**
Command expects certain properties but they're missing.

**Required properties by command:**

| Command | Required Properties |
|---------|---------------------|
| `rename-to-uid` | `exo__Asset_uid` |
| All status commands | `ems__Effort_status` (auto-created if missing) |
| All commands | Valid frontmatter block |

**Fix missing properties:**

```bash
# Add missing UID
UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# Manual edit (example)
cat > temp.txt <<EOF
---
exo__Asset_uid: $UUID
exo__Asset_label: My Task
---

Task content here
EOF

mv temp.txt /path/to/vault/tasks/task.md
```

---

### Conflicting Property Values

**Problem:**
Frontmatter has conflicting or inconsistent values.

**Example conflicts:**

```yaml
# Conflict: Status says "Done" but no resolution timestamp
ems__Effort_status: "[[ems__EffortStatusDone]]"
# Missing: ems__Effort_resolutionTimestamp

# Conflict: Has end timestamp but status is "ToDo"
ems__Effort_status: "[[ems__EffortStatusToDo]]"
ems__Effort_endTimestamp: 2025-11-23T10:00:00
```

**Prevention:**
Always use CLI commands for status changes - they ensure consistency:

```bash
# ✅ CORRECT: CLI ensures all required timestamps
exocortex command complete "tasks/task.md"
# Sets: status=Done, endTimestamp, resolutionTimestamp

# ❌ WRONG: Manual edit may miss timestamps
# Manually editing frontmatter to set status=Done
```

---

## Debugging Techniques

### Verbose Mode

```bash
# Enable bash debugging
set -x  # Print commands before execution
exocortex command start "tasks/task.md" --vault /path/to/vault
set +x  # Disable

# Capture stdout and stderr
exocortex command start "tasks/task.md" 2>&1 | tee debug.log

# Check exit code
exocortex command start "tasks/task.md"
echo "Exit code: $?"
```

---

### Validate Before Execute

```bash
#!/bin/bash
# validate-and-execute.sh - Check everything before running command

VAULT_PATH="/path/to/vault"
FILEPATH="tasks/my-task.md"
COMMAND="start"

# 1. Check vault exists
if [ ! -d "$VAULT_PATH" ]; then
  echo "ERROR: Vault not found: $VAULT_PATH"
  exit 1
fi

# 2. Check file exists
FULL_PATH="$VAULT_PATH/$FILEPATH"
if [ ! -f "$FULL_PATH" ]; then
  echo "ERROR: File not found: $FULL_PATH"
  exit 1
fi

# 3. Check frontmatter has required properties
if ! grep -q "exo__Asset_uid:" "$FULL_PATH"; then
  echo "ERROR: Missing exo__Asset_uid in $FILEPATH"
  exit 1
fi

# 4. Backup before modify
cp "$FULL_PATH" "$FULL_PATH.backup"

# 5. Execute command
echo "Executing: exocortex command $COMMAND $FILEPATH"
if exocortex command "$COMMAND" "$FILEPATH" --vault "$VAULT_PATH"; then
  echo "✓ Success"
  rm "$FULL_PATH.backup"  # Remove backup
else
  echo "✗ Failed - rolling back"
  mv "$FULL_PATH.backup" "$FULL_PATH"
  exit 1
fi
```

---

### Test with Single File First

```bash
# ❌ BAD: Run on all files immediately
find tasks -name "*.md" | while read f; do
  exocortex command start "$f"
done

# ✅ GOOD: Test with one file first
echo "Testing with one file..."
exocortex command start "tasks/test-task.md" --vault /path/to/vault

if [ $? -eq 0 ]; then
  echo "Test passed, continuing with all files..."

  find tasks -name "*.md" | while read f; do
    exocortex command start "$f" --vault /path/to/vault
  done
else
  echo "Test failed, stopping"
  exit 1
fi
```

---

### Compare Before/After

```bash
#!/bin/bash
# compare-changes.sh - See exactly what changed

VAULT_PATH="/path/to/vault"
FILEPATH="tasks/my-task.md"

# Capture before state
echo "=== BEFORE ==="
cat "$VAULT_PATH/$FILEPATH"

# Execute command
exocortex command start "$FILEPATH" --vault "$VAULT_PATH"

# Capture after state
echo ""
echo "=== AFTER ==="
cat "$VAULT_PATH/$FILEPATH"

# Show diff
echo ""
echo "=== DIFF ==="
git diff "$VAULT_PATH/$FILEPATH"
```

---

## Performance Issues

### Slow Batch Operations

**Problem:**
Processing many files takes too long.

**Optimization:**

```bash
# ❌ SLOW: Sequential processing
for task in tasks/*.md; do
  exocortex command start "$task" --vault /path/to/vault
done
# Time: N seconds (where N = number of files)

# ✅ FAST: Parallel processing
find tasks -name "*.md" | \
  parallel -j 4 exocortex command start {} --vault /path/to/vault
# Time: N/4 seconds (4 parallel jobs)

# ✅ ALSO FAST: xargs parallel
find tasks -name "*.md" | \
  xargs -P 4 -I {} exocortex command start {} --vault /path/to/vault
```

**Benchmark:**
```bash
# Measure execution time
time find tasks -name "*.md" | \
  parallel -j 4 exocortex command start {} --vault /path/to/vault
```

---

### Memory Usage

**Problem:**
Large vault causes high memory usage.

**Solutions:**

```bash
# Process in batches
find tasks -name "*.md" | \
while read -r -n 100 files; do
  echo "$files" | xargs -I {} exocortex command start {} --vault /path/to/vault
  # Small pause between batches
  sleep 1
done

# Limit parallel jobs
parallel -j 2  # Instead of -j 8 or -j 16
```

---

### Rate Limiting

**Problem:**
Too many operations trigger rate limits (if syncing to external service).

**Solution:**

```bash
#!/bin/bash
# rate-limited-batch.sh

TASKS=( $(find tasks -name "*.md") )
RATE_LIMIT=5  # Max 5 per second

for i in "${!TASKS[@]}"; do
  exocortex command start "${TASKS[$i]}" --vault /path/to/vault &

  # Wait every N tasks
  if [ $(($i % $RATE_LIMIT)) -eq 0 ]; then
    wait  # Wait for background jobs
    sleep 1
  fi
done

wait  # Wait for remaining jobs
```

---

## Integration Problems

### GitHub Actions Timeout

**Problem:**
Workflow times out during bulk operations.

**Solutions:**

```yaml
# Increase timeout
jobs:
  process-tasks:
    timeout-minutes: 30  # Default is 360 (6 hours)

# Process in smaller batches
- name: Process tasks
  run: |
    # Only process recent tasks
    find tasks -name "*.md" -mtime -7 | \
      xargs -I {} exocortex command start {}
```

---

### Permission Denied

**Problem:**
CLI can't read/write files due to permissions.

**Solutions:**

```bash
# Check file permissions
ls -la /path/to/vault/tasks/task.md

# Fix permissions
chmod 644 /path/to/vault/tasks/*.md  # Files
chmod 755 /path/to/vault/tasks        # Directory

# Run with correct user
sudo -u vaultuser exocortex command start "tasks/task.md"
```

---

### Git Conflicts

**Problem:**
Multiple processes modifying same files cause git conflicts.

**Solutions:**

```bash
# Use file locking
{
  flock -x 200  # Exclusive lock

  exocortex command start "tasks/task.md" --vault /path/to/vault

  cd /path/to/vault
  git add .
  git commit -m "Update task"
  git pull --rebase
  git push

} 200>/tmp/vault.lock
```

---

### External Tool Sync Issues

**Problem:**
Sync fails due to API changes or auth issues.

**Debugging:**

```bash
# Test API manually
curl -H "Authorization: Bearer $TOKEN" \
  https://api.external-tool.com/tasks

# Check token expiry
jwt decode $TOKEN | jq '.exp'
EXPIRY=$(jwt decode $TOKEN | jq -r '.exp')
NOW=$(date +%s)
if [ $NOW -gt $EXPIRY ]; then
  echo "Token expired"
fi

# Enable verbose logging
set -x
/path/to/sync-script.sh
set +x
```

---

## Related Documentation

- [Command Reference](./Command-Reference.md) - Full command syntax
- [Scripting Patterns](./Scripting-Patterns.md) - Script examples
- [Integration Examples](./Integration-Examples.md) - CI/CD workflows
