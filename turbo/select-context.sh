#!/bin/bash
# select-context.sh - Smart context selection for Claude turbo mode
set -euo pipefail

# Parameters
TASK="${1:-Auto-fix recent changes}"
ROOT="${2:-.}"
LIMIT_FILES="${3:-250}"
RECENT_DAYS="${4:-5}"
OBSIDIAN_MODE="${5:-false}"

# Navigate to project root
cd "$ROOT"

# Extract search tokens from task (min length 3)
SEARCH_TOKENS=$(echo "$TASK" | tr '[:upper:]' '[:lower:]' | grep -oE '\b[a-z]{3,}\b' | head -5 | tr '\n' '|' | sed 's/|$//')

# Build ignore patterns
IGNORE_PATTERNS=(
    -path "*/.git/*"
    -path "*/node_modules/*"
    -path "*/dist/*"
    -path "*/build/*"
    -path "*/.turbo-cache/*"
    -path "*/.DS_Store"
    -path "*/coverage/*"
    -path "*/.next/*"
    -path "*/out/*"
)

# Function to find files
find_files() {
    local pattern="$1"
    find . -type f \( "${IGNORE_PATTERNS[@]}" \) -prune -o -type f $pattern -print 2>/dev/null | sed 's|^\./||'
}

# Priority 1: Recent changes (if git repo)
RECENT_FILES=""
if [ -d .git ]; then
    RECENT_FILES=$(git log --since="${RECENT_DAYS}.days.ago" --name-only --pretty=format: 2>/dev/null | sort -u | grep -v '^$' | head -50 || true)
fi

# Priority 2: Files matching search tokens
MATCHED_FILES=""
if [ -n "$SEARCH_TOKENS" ]; then
    # Use ripgrep if available for content search
    if command -v rg &> /dev/null; then
        MATCHED_FILES=$(rg -l -i "$SEARCH_TOKENS" --type-add 'code:*.{ts,tsx,js,jsx,md,yml,yaml,json}' -t code 2>/dev/null || true)
    else
        # Fallback to grep
        MATCHED_FILES=$(find_files "-name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.md'" | xargs grep -l -i -E "$SEARCH_TOKENS" 2>/dev/null || true)
    fi
fi

# Priority 3: Core project files
CORE_FILES=$(find_files "-name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx'" | head -100)

# Priority 4: Documentation and config
DOC_FILES=$(find_files "-name '*.md' -o -name '*.yml' -o -name '*.yaml' -o -name '*.json'" | head -50)

# Special handling for Obsidian mode
if [ "$OBSIDIAN_MODE" = "true" ]; then
    ONTOLOGY_FILES=$(find_files "-name '*.ttl' -o -name '*.rq' -o -name '*.rdf'" | head -50)
    SEMANTIC_FILES=$(find . -type f -name "*.md" -exec grep -l "ontology\|semantic\|rdf\|sparql" {} \; 2>/dev/null | head -30 || true)
else
    ONTOLOGY_FILES=""
    SEMANTIC_FILES=""
fi

# Combine all files with priority order
{
    echo "$RECENT_FILES"
    echo "$MATCHED_FILES"
    echo "$ONTOLOGY_FILES"
    echo "$SEMANTIC_FILES"
    echo "$CORE_FILES"
    echo "$DOC_FILES"
} 2>/dev/null | grep -v '^$' | grep -v '^\[' | sed 's/^"//;s/"$//' | grep -v '^\\' | grep -v 'Library/Application Support' | awk '!seen[$0]++' | head -n "$LIMIT_FILES"