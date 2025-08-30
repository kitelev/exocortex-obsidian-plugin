#!/bin/bash

# Initialize test vault with required plugin files and configuration
# This script prepares the test vault before running E2E tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TEST_VAULT_DIR="${SCRIPT_DIR}/test-vault"
PLUGIN_DIR="${TEST_VAULT_DIR}/.obsidian/plugins/exocortex-obsidian-plugin"

echo "🔧 Initializing E2E test vault..."
echo "Project root: ${PROJECT_ROOT}"
echo "Test vault: ${TEST_VAULT_DIR}"

# Create plugin directory structure
mkdir -p "${PLUGIN_DIR}"
mkdir -p "${TEST_VAULT_DIR}/classes"
mkdir -p "${TEST_VAULT_DIR}/properties"  
mkdir -p "${TEST_VAULT_DIR}/ontologies"
mkdir -p "${TEST_VAULT_DIR}/assets"

# Copy built plugin files
if [ -f "${PROJECT_ROOT}/main.js" ]; then
    cp "${PROJECT_ROOT}/main.js" "${PLUGIN_DIR}/"
    echo "✅ Copied main.js"
else
    echo "❌ main.js not found. Please run 'npm run build' first."
    exit 1
fi

if [ -f "${PROJECT_ROOT}/manifest.json" ]; then
    cp "${PROJECT_ROOT}/manifest.json" "${PLUGIN_DIR}/"
    echo "✅ Copied manifest.json"
else
    echo "❌ manifest.json not found"
    exit 1
fi

if [ -f "${PROJECT_ROOT}/styles.css" ]; then
    cp "${PROJECT_ROOT}/styles.css" "${PLUGIN_DIR}/"
    echo "✅ Copied styles.css"
else
    echo "⚠️ styles.css not found (optional)"
fi

# Ensure plugin is enabled
mkdir -p "${TEST_VAULT_DIR}/.obsidian"
cat > "${TEST_VAULT_DIR}/.obsidian/community-plugins.json" << 'EOF'
["exocortex-obsidian-plugin"]
EOF

# Create core configuration
cat > "${TEST_VAULT_DIR}/.obsidian/core-plugins.json" << 'EOF'
[
  "file-explorer",
  "global-search", 
  "switcher",
  "graph",
  "backlink",
  "canvas",
  "outgoing-link",
  "tag-pane",
  "properties",
  "page-preview",
  "daily-notes",
  "templates",
  "note-composer",
  "command-palette",
  "editor-status",
  "bookmarks",
  "outline",
  "word-count",
  "file-recovery"
]
EOF

# Create sample test files if they don't exist
if [ ! -f "${TEST_VAULT_DIR}/classes/Asset.md" ]; then
    echo "Creating sample test files..."
    
    # These are created by the main script, but ensure they exist
    touch "${TEST_VAULT_DIR}/classes/Asset.md"
    touch "${TEST_VAULT_DIR}/classes/Task.md"
    touch "${TEST_VAULT_DIR}/classes/Project.md"
fi

# Create test assets
cat > "${TEST_VAULT_DIR}/assets/Test Asset 1.md" << 'EOF'
---
exo__Class: Asset
name: Test Asset 1
description: First test asset for E2E testing
status: active
category: test
---

# Test Asset 1

This is a test asset created for E2E testing of the Exocortex plugin.

## Purpose

This asset is used to test:
- Universal layout rendering
- Property display
- Dynamic layout functionality
- Modal interactions
EOF

cat > "${TEST_VAULT_DIR}/assets/Test Task 1.md" << 'EOF'
---
exo__Class: Task
name: Test Task 1
description: First test task for E2E testing
status: active
priority: medium
due_date: 2024-12-31
---

# Test Task 1

This is a test task for validating task-specific layout rendering and functionality.

## Details

- Priority: Medium
- Due: End of year
- Status: Active
- Used for E2E testing
EOF

cat > "${TEST_VAULT_DIR}/assets/Test Project 1.md" << 'EOF'
---
exo__Class: Project
name: Test Project 1
description: Test project for E2E validation
status: active
start_date: 2024-01-01
end_date: 2024-12-31
---

# Test Project 1

A sample project used for testing project-specific layouts and functionality.

## Objectives

- Validate project layout rendering
- Test project-specific properties
- Ensure proper block organization
EOF

# Create index file
cat > "${TEST_VAULT_DIR}/README.md" << 'EOF'
# E2E Test Vault

This vault is automatically configured for Exocortex E2E testing.

## Test Assets

- [[Test Asset 1]] - Basic asset for testing
- [[Test Task 1]] - Task with specific properties  
- [[Test Project 1]] - Project with timeline

## Classes

- [[classes/Asset]] - Base asset class
- [[classes/Task]] - Task class definition
- [[classes/Project]] - Project class definition

This vault is recreated for each test run to ensure clean test conditions.
EOF

echo "✅ Test vault initialization complete!"
echo "📁 Plugin installed at: ${PLUGIN_DIR}"
echo "📄 Test files created in: ${TEST_VAULT_DIR}/assets"

# Verify plugin files
echo
echo "🔍 Verifying plugin installation..."
if [ -f "${PLUGIN_DIR}/main.js" ] && [ -f "${PLUGIN_DIR}/manifest.json" ]; then
    echo "✅ Plugin files verified"
    
    # Show plugin info
    echo "📋 Plugin manifest:"
    if command -v jq &> /dev/null; then
        jq -r '.name + " v" + .version' "${PLUGIN_DIR}/manifest.json"
    else
        grep -E '(name|version)' "${PLUGIN_DIR}/manifest.json" | head -2
    fi
else
    echo "❌ Plugin verification failed"
    exit 1
fi

echo
echo "🚀 Test vault ready for E2E testing!"