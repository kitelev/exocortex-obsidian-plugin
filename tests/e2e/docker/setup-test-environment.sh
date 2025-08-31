#!/bin/bash

# Setup Test Environment for Real Plugin Testing
set -e

echo "🔧 Setting up test environment..."

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TEST_VAULT_DIR="$SCRIPT_DIR/test-vault"
CONFIG_DIR="$SCRIPT_DIR/obsidian-config"

echo "📍 Project root: $PROJECT_ROOT"
echo "📍 Test vault: $TEST_VAULT_DIR"
echo "📍 Config dir: $CONFIG_DIR"

# Ensure plugin is built
echo "🏗️ Building plugin..."
cd "$PROJECT_ROOT"
npm run build

# Verify build artifacts exist
if [ ! -f "$PROJECT_ROOT/main.js" ]; then
    echo "❌ main.js not found! Build failed."
    exit 1
fi

if [ ! -f "$PROJECT_ROOT/manifest.json" ]; then
    echo "❌ manifest.json not found!"
    exit 1
fi

echo "✅ Plugin build verified"

# Create test vault structure
echo "📁 Setting up test vault..."
mkdir -p "$TEST_VAULT_DIR/assets"
mkdir -p "$TEST_VAULT_DIR/projects"
mkdir -p "$TEST_VAULT_DIR/classes"

# Create test notes with proper frontmatter
cat > "$TEST_VAULT_DIR/assets/Test-Asset.md" << 'EOF'
---
exo__Instance_class: Asset
exo__Instance_title: Test Asset for E2E Testing
exo__Asset_priority: high
exo__Asset_status: active
---

# Test Asset

This is a test asset created for E2E testing of the Exocortex plugin.

The plugin should render:
- Dynamic layout blocks
- Property editing interface
- Action buttons
EOF

cat > "$TEST_VAULT_DIR/projects/Test-Project.md" << 'EOF'
---
exo__Instance_class: Project
exo__Instance_title: Test Project for E2E
exo__Project_status: active
exo__Project_priority: medium
---

# Test Project

This project is used for testing the plugin functionality.

```exo-query
name: project-tasks
query: |
  SELECT * FROM #task
  WHERE exo__Task_project = "[[Test-Project]]"
```
EOF

cat > "$TEST_VAULT_DIR/classes/Asset.md" << 'EOF'
---
exo__Class_name: Asset
exo__Class_superClass: Thing
---

# Asset Class

Base class for all assets in the system.

## Properties
- priority: high, medium, low
- status: active, inactive, archived
EOF

cat > "$TEST_VAULT_DIR/classes/Project.md" << 'EOF'
---
exo__Class_name: Project
exo__Class_superClass: Asset
---

# Project Class

Project management entity.

## Properties
- status: planning, active, completed
- priority: high, medium, low
EOF

# Create Obsidian workspace file
cat > "$TEST_VAULT_DIR/.obsidian/workspace.json" << 'EOF'
{
  "main": {
    "id": "main-workspace",
    "type": "split",
    "children": [
      {
        "id": "main-leaf",
        "type": "leaf",
        "state": {
          "type": "markdown",
          "state": {
            "file": "assets/Test-Asset.md",
            "mode": "source"
          }
        }
      }
    ]
  },
  "left": {
    "id": "left-sidebar",
    "type": "split",
    "children": [
      {
        "id": "file-explorer",
        "type": "leaf",
        "state": {
          "type": "file-explorer",
          "state": {}
        }
      }
    ]
  },
  "active": "main-leaf",
  "lastOpenFiles": [
    "assets/Test-Asset.md",
    "projects/Test-Project.md",
    "classes/Asset.md"
  ]
}
EOF

mkdir -p "$TEST_VAULT_DIR/.obsidian"

echo "✅ Test vault setup complete"

# Setup permissions (important for Docker mounting)
echo "🔐 Setting permissions..."
chmod -R 755 "$TEST_VAULT_DIR"
chmod -R 755 "$CONFIG_DIR"

echo "✅ Test environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: docker-compose -f docker-compose.e2e.yml up -d obsidian-e2e"
echo "2. Wait for health check to pass"
echo "3. Open browser to http://localhost:8084"
echo "4. Run tests: node real-plugin-test.js"