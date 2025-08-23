#!/bin/bash
# shard-context.sh - Split file list into shards for parallel processing
set -euo pipefail

SHARDS="${1:-6}"
CACHE_DIR="${2:-.turbo-cache}"

# Ensure cache directory exists
mkdir -p "$CACHE_DIR"

# Clean previous shards
rm -f "$CACHE_DIR"/shard_*.txt

# Read file list from stdin
FILES=$(cat)

if [ -z "$FILES" ]; then
    echo "No files to shard" >&2
    exit 0
fi

# Count total files
TOTAL=$(echo "$FILES" | wc -l | tr -d ' ')
FILES_PER_SHARD=$(( (TOTAL + SHARDS - 1) / SHARDS ))

echo "Sharding $TOTAL files into $SHARDS shards ($FILES_PER_SHARD files per shard)" >&2

# Split files into shards
SHARD_NUM=0
COUNTER=0
CURRENT_SHARD=""

echo "$FILES" | while IFS= read -r file; do
    CURRENT_SHARD="${CURRENT_SHARD}${file}\n"
    COUNTER=$((COUNTER + 1))
    
    if [ $COUNTER -ge $FILES_PER_SHARD ] || [ $COUNTER -eq $TOTAL ]; then
        SHARD_FILE="$CACHE_DIR/shard_$(printf "%02d" $SHARD_NUM).txt"
        printf "%b" "$CURRENT_SHARD" | grep -v '^$' > "$SHARD_FILE"
        echo "Created $SHARD_FILE with $(wc -l < "$SHARD_FILE" | tr -d ' ') files" >&2
        
        SHARD_NUM=$((SHARD_NUM + 1))
        COUNTER=0
        CURRENT_SHARD=""
    fi
done

# Handle any remaining files
if [ -n "$CURRENT_SHARD" ]; then
    SHARD_FILE="$CACHE_DIR/shard_$(printf "%02d" $SHARD_NUM).txt"
    printf "%b" "$CURRENT_SHARD" | grep -v '^$' > "$SHARD_FILE"
    echo "Created $SHARD_FILE with $(wc -l < "$SHARD_FILE" | tr -d ' ') files" >&2
fi

# List created shards
ls -1 "$CACHE_DIR"/shard_*.txt 2>/dev/null || true