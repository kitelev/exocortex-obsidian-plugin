#!/bin/bash
# watch.sh - Watch mode for automatic turbo execution on file changes
set -euo pipefail

PROJECT_ROOT="${1:-.}"
TASK="${2:-Auto-fix recent changes}"
SHARDS="${3:-6}"
LIMIT_FILES="${4:-250}"
RECENT_DAYS="${5:-5}"
PARALLEL_JOBS="${6:-auto}"
MODEL="${7:-sonnet}"

echo "Starting watch mode..." >&2
echo "Project: $PROJECT_ROOT" >&2
echo "Task: $TASK" >&2
echo "Shards: $SHARDS, Limit: $LIMIT_FILES files, Recent: $RECENT_DAYS days" >&2

# Function to run the turbo pipeline
run_turbo() {
    echo "[$(date '+%H:%M:%S')] Change detected, running turbo pipeline..." >&2
    
    # Select context
    echo "Selecting context..." >&2
    bash turbo/select-context.sh "$TASK" "$PROJECT_ROOT" "$LIMIT_FILES" "$RECENT_DAYS" false > .turbo-cache/context.txt
    
    FILE_COUNT=$(wc -l < .turbo-cache/context.txt | tr -d ' ')
    echo "Selected $FILE_COUNT files" >&2
    
    if [ $FILE_COUNT -eq 0 ]; then
        echo "No files selected, skipping..." >&2
        return
    fi
    
    # Shard context
    echo "Sharding into $SHARDS parts..." >&2
    cat .turbo-cache/context.txt | bash turbo/shard-context.sh "$SHARDS" ".turbo-cache"
    
    # Run parallel
    echo "Running parallel execution..." >&2
    bash turbo/run-parallel.sh "$TASK" "$PROJECT_ROOT" "$PARALLEL_JOBS" "$MODEL" ""
    
    echo "[$(date '+%H:%M:%S')] Turbo pipeline completed!" >&2
}

# Initial run
run_turbo

# Check if fswatch is available
if command -v fswatch &> /dev/null; then
    echo "Using fswatch for file monitoring..." >&2
    
    # Watch for changes with debounce
    fswatch -o -l 1 \
        --exclude '\.git' \
        --exclude 'node_modules' \
        --exclude '\.turbo-cache' \
        --exclude 'dist' \
        --exclude 'build' \
        "$PROJECT_ROOT" | while read event; do
        
        echo "[$(date '+%H:%M:%S')] File change detected" >&2
        # Simple debounce - wait a bit for multiple changes
        sleep 1
        run_turbo
    done
else
    echo "fswatch not found, using simple polling mode..." >&2
    
    # Fallback to polling mode
    LAST_MODIFIED=""
    
    while true; do
        # Get modification time of most recently changed file
        CURRENT_MODIFIED=$(find "$PROJECT_ROOT" -type f \
            -not -path "*/.git/*" \
            -not -path "*/node_modules/*" \
            -not -path "*/.turbo-cache/*" \
            -not -path "*/dist/*" \
            -not -path "*/build/*" \
            -newer .turbo-cache/last_check 2>/dev/null | head -1)
        
        if [ -n "$CURRENT_MODIFIED" ] && [ "$CURRENT_MODIFIED" != "$LAST_MODIFIED" ]; then
            LAST_MODIFIED="$CURRENT_MODIFIED"
            run_turbo
            touch .turbo-cache/last_check
        fi
        
        sleep 5  # Poll every 5 seconds
    done
fi