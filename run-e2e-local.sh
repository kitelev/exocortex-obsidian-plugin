#!/bin/bash

# Simple E2E test runner using wdio-obsidian-service (no Docker)

set -e

echo "🚀 Running E2E tests locally with wdio-obsidian-service..."

# Clean up any previous test artifacts
echo "🧹 Cleaning up previous test results..."
rm -rf tests/e2e/test-results
rm -rf tests/e2e/.obsidian-cache
mkdir -p tests/e2e/test-results/screenshots

# Build the plugin first
echo "🔨 Building plugin..."
npm run build

# Create test vault directory
echo "📁 Setting up test vault..."
mkdir -p tests/e2e/test-vault/.obsidian/plugins/exocortex-obsidian-plugin
cp -r classes tests/e2e/test-vault/ || echo "No classes directory found"
cp -r properties tests/e2e/test-vault/ || echo "No properties directory found"  
cp -r ontologies tests/e2e/test-vault/ || echo "No ontologies directory found"

# Copy plugin files to test vault
cp main.js tests/e2e/test-vault/.obsidian/plugins/exocortex-obsidian-plugin/
cp manifest.json tests/e2e/test-vault/.obsidian/plugins/exocortex-obsidian-plugin/
cp styles.css tests/e2e/test-vault/.obsidian/plugins/exocortex-obsidian-plugin/ || echo "No styles.css found"

# Enable the plugin in test vault
echo "⚙️ Enabling plugin in test vault..."
mkdir -p tests/e2e/test-vault/.obsidian
cat > tests/e2e/test-vault/.obsidian/community-plugins.json << 'EOF'
["exocortex-obsidian-plugin"]
EOF

# Run WebDriver tests
echo "🧪 Running WebDriver E2E tests..."
npx wdio run wdio.e2e.conf.ts

echo "✅ E2E tests completed successfully!"
echo "📋 Test results available in tests/e2e/test-results/"
echo "📸 Screenshots (if any) available in tests/e2e/test-results/screenshots/"