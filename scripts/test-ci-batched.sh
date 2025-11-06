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

# Run all tests (with coverage if COVERAGE=true)
echo "📦 Running all tests..."

# Build jest command with conditional coverage flag
JEST_ARGS="--config packages/obsidian-plugin/jest.config.js --runInBand --forceExit --testTimeout=60000"
if [ "$COVERAGE" = "true" ]; then
    echo "📊 Coverage collection enabled"
    JEST_ARGS="$JEST_ARGS --coverage --coverageReporters=lcov --coverageReporters=json-summary --coverageReporters=text-summary"
fi

if npx jest $JEST_ARGS; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Tests failed!"
    exit 1
fi
