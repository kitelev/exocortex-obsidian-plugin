#!/bin/bash

# CI-safe test runner with aggressive memory optimization
set -e

echo "🧠 Running CI-safe tests with minimal memory usage..."

# Clear any existing caches
echo "🧹 Clearing caches..."
rm -rf node_modules/.cache || true
rm -rf .jest-cache || true
npx jest --clearCache || true

# Set aggressive memory limits
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc"
export CI_MEMORY_OPTIMIZED="true"

echo "🔬 Running tests with aggressive memory constraints..."

# Run with minimal workers and memory limits
npx jest \
  --testPathIgnorePatterns='/tests/ui/' '/tests/e2e/' \
  --runInBand \
  --workerIdleMemoryLimit=32MB \
  --forceExit \
  --no-cache \
  --bail=1 \
  --silent \
  --verbose=false \
  --detectOpenHandles=false

echo "✅ Tests completed successfully!"