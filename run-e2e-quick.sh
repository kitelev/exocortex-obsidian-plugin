#!/bin/bash

# Quick E2E test runner for development - runs only essential tests

set -e

echo "⚡ Running quick E2E tests (essential functionality only)..."

# Clean up
echo "🧹 Quick cleanup..."
rm -rf tests/e2e/test-results
mkdir -p tests/e2e/test-results/screenshots

# Build plugin
echo "🔨 Quick build..."
npm run build

# Set up minimal test vault
echo "📁 Minimal test vault setup..."
mkdir -p tests/e2e/test-vault/.obsidian/plugins/exocortex-obsidian-plugin

# Copy essential plugin files only
cp main.js tests/e2e/test-vault/.obsidian/plugins/exocortex-obsidian-plugin/
cp manifest.json tests/e2e/test-vault/.obsidian/plugins/exocortex-obsidian-plugin/

# Enable plugin
cat > tests/e2e/test-vault/.obsidian/community-plugins.json << 'EOF'
["exocortex-obsidian-plugin"]
EOF

# Run only the create-asset-modal test (most critical)
echo "🧪 Running essential test suite..."
npx wdio run wdio.e2e.conf.ts --spec tests/e2e/specs/create-asset-modal.spec.ts

echo "✅ Quick E2E tests completed!"
echo "⏱️  For full test suite, use: ./run-e2e-local.sh"