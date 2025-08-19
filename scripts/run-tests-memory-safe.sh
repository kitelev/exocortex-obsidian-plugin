#!/bin/bash

# Memory-safe test runner for the Exocortex plugin
# This script runs tests with optimized memory settings

set -e

echo "🧠 Running memory-optimized tests for Exocortex plugin..."

# Set memory optimization environment variables
export NODE_OPTIONS="--max-old-space-size=2048 --expose-gc"
export JEST_WORKER_ID="1"
export CI_MEMORY_OPTIMIZED="true"

# Clear any existing Jest cache
echo "🧹 Clearing Jest cache..."
npx jest --clearCache || true

# Remove any corrupted cache directories
rm -rf node_modules/.cache
rm -rf .jest-cache

# Set test timeouts for memory constrained environments
export JEST_TIMEOUT=90000

# Run tests with memory optimizations
echo "🔬 Running unit tests with memory optimizations..."
npm run test:unit || {
    echo "❌ Unit tests failed with memory optimizations"
    exit 1
}

echo "🔬 Running integration tests with memory optimizations..."
npm run test:integration || {
    echo "❌ Integration tests failed with memory optimizations"
    exit 1
}

echo "✅ All tests passed with memory optimizations!"
echo "💾 Memory usage was managed successfully"