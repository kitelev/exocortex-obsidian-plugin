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

# Run all tests
echo "📦 Running all tests..."
if npx jest \
    --runInBand \
    --forceExit \
    --testTimeout=60000; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Tests failed!"
    exit 1
fi
