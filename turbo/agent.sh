#!/bin/bash
# agent.sh - Claude agent wrapper for single shard processing
set -euo pipefail

SHARD_FILE="${1}"
TASK="${2:-Auto-fix recent changes}"
PROJECT_ROOT="${3:-.}"
MODEL="${4:-sonnet}"
EXTRA_FLAGS="${5:-}"

if [ ! -f "$SHARD_FILE" ]; then
    echo "Error: Shard file $SHARD_FILE not found" >&2
    exit 1
fi

# Read files from shard
FILES=$(cat "$SHARD_FILE")
FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')

echo "Processing shard: $SHARD_FILE ($FILE_COUNT files)" >&2

# Build the prompt with strict constraints
PROMPT="Task: $TASK

CRITICAL CONSTRAINTS:
1. ONLY analyze files from the provided list below
2. Provide a brief structural analysis
3. Focus on architecture and patterns
4. Return summary in 5-10 bullet points

FILES IN SCOPE:
$FILES

Analyze these files for their structure, purpose, and patterns."

# Change to project root
cd "$PROJECT_ROOT"

# Execute with timeout and capture output
TIMEOUT_SECONDS=300
OUTPUT_FILE=".turbo-cache/agent_$(basename "$SHARD_FILE" .txt).out"

echo "Analyzing $FILE_COUNT files..." >&2

# Use gtimeout on macOS, timeout on Linux
if command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="gtimeout"
else
    TIMEOUT_CMD="timeout"
fi

# Simplified Claude call
echo "$PROMPT" | $TIMEOUT_CMD $TIMEOUT_SECONDS claude \
    --print \
    --model "$MODEL" \
    --dangerously-skip-permissions \
    > "$OUTPUT_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Shard processed successfully" >&2
    cat "$OUTPUT_FILE"
else
    echo "✗ Shard processing failed" >&2
    echo "Error output:" >&2
    cat "$OUTPUT_FILE" >&2
    exit 1
fi