#!/bin/bash
# run-parallel.sh - Parallel execution of agents on all shards
set -euo pipefail

TASK="${1:-Auto-fix recent changes}"
PROJECT_ROOT="${2:-.}"
PARALLEL_JOBS="${3:-auto}"
MODEL="${4:-sonnet}"
EXTRA_FLAGS="${5:-}"
CACHE_DIR="${6:-.turbo-cache}"

# Determine parallel jobs
if [ "$PARALLEL_JOBS" = "auto" ]; then
    # Use half of logical CPUs for safety
    PARALLEL_JOBS=$(( $(sysctl -n hw.logicalcpu) / 2 ))
    [ $PARALLEL_JOBS -lt 1 ] && PARALLEL_JOBS=1
    [ $PARALLEL_JOBS -gt 4 ] && PARALLEL_JOBS=4  # Cap at 4 for API limits
fi

echo "Running with $PARALLEL_JOBS parallel jobs" >&2

# Find all shard files
SHARDS=$(ls -1 "$CACHE_DIR"/shard_*.txt 2>/dev/null || true)

if [ -z "$SHARDS" ]; then
    echo "No shard files found in $CACHE_DIR" >&2
    exit 1
fi

SHARD_COUNT=$(echo "$SHARDS" | wc -l | tr -d ' ')
echo "Processing $SHARD_COUNT shards..." >&2

# Create log directory
LOG_DIR="$CACHE_DIR/logs"
mkdir -p "$LOG_DIR"
rm -f "$LOG_DIR"/*.log

# Function to run a single agent
run_agent() {
    local shard="$1"
    local shard_name=$(basename "$shard" .txt)
    local log_file="$LOG_DIR/${shard_name}.log"
    
    echo "[$(date '+%H:%M:%S')] Starting $shard_name" >&2
    
    if bash turbo/agent.sh "$shard" "$TASK" "$PROJECT_ROOT" "$MODEL" "$EXTRA_FLAGS" > "$log_file" 2>&1; then
        echo "[$(date '+%H:%M:%S')] ✓ Completed $shard_name" >&2
        return 0
    else
        echo "[$(date '+%H:%M:%S')] ✗ Failed $shard_name" >&2
        cat "$log_file" >&2
        return 1
    fi
}

# Export function and variables for parallel execution
export -f run_agent
export TASK PROJECT_ROOT MODEL EXTRA_FLAGS LOG_DIR

# Check if GNU parallel is available
if command -v parallel &> /dev/null; then
    echo "Using GNU parallel..." >&2
    echo "$SHARDS" | parallel -j "$PARALLEL_JOBS" --halt-on-error 1 run_agent
else
    echo "GNU parallel not found, using xargs..." >&2
    # Fallback to xargs with limited parallelism
    echo "$SHARDS" | xargs -n 1 -P "$PARALLEL_JOBS" -I {} bash -c 'run_agent "$@"' _ {}
fi

# Aggregate results
echo "" >&2
echo "=== AGGREGATED RESULTS ===" >&2
for log in "$LOG_DIR"/*.log; do
    if [ -f "$log" ]; then
        echo "--- $(basename "$log" .log) ---" >&2
        cat "$log"
        echo "" >&2
    fi
done

echo "All shards processed successfully!" >&2