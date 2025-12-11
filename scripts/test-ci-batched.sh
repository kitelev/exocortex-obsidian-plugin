#!/bin/bash

# Simple test runner for CI
set -e

echo "🚀 Running tests..."

# Clear cache in CI
if [ "$CI" = "true" ]; then
    echo "🧹 Clearing Jest cache..."
    rm -rf .jest-cache || true
    npx jest --clearCache || true
fi

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=4096"

# Run obsidian-plugin tests (with coverage if COVERAGE=true)
echo "📦 Running obsidian-plugin tests..."

# Build jest command with conditional coverage flag
JEST_ARGS="--config packages/obsidian-plugin/jest.config.js --runInBand --forceExit --testTimeout=60000"
if [ "$COVERAGE" = "true" ]; then
    echo "📊 Coverage collection enabled"
    JEST_ARGS="$JEST_ARGS --coverage --coverageReporters=lcov --coverageReporters=json-summary --coverageReporters=text-summary"
fi

if npx jest $JEST_ARGS; then
    echo "✅ Obsidian plugin tests passed!"
else
    echo "❌ Obsidian plugin tests failed!"
    exit 1
fi

# Run CLI tests
echo "📦 Running CLI tests..."
CLI_JEST_ARGS="--config packages/cli/jest.config.js --forceExit --testTimeout=60000"
if [ "$COVERAGE" = "true" ]; then
    echo "📊 CLI coverage collection enabled"
    CLI_JEST_ARGS="$CLI_JEST_ARGS --coverage --coverageReporters=lcov --coverageReporters=json-summary --coverageReporters=text-summary"
fi

if node --experimental-vm-modules ./node_modules/jest/bin/jest.js $CLI_JEST_ARGS; then
    echo "✅ CLI tests passed!"
else
    echo "❌ CLI tests failed!"
    exit 1
fi

echo "✅ All tests passed!"
exit 0
