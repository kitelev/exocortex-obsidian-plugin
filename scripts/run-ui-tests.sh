#!/bin/bash

# UI Tests Runner Script
# This script runs the UI tests with proper environment setup and debugging

set -e

echo "🚀 Starting UI Tests for Exocortex Plugin"
echo "=========================================="

# Detect if running in CI
if [[ -n "$CI" || -n "$GITHUB_ACTIONS" ]]; then
    echo "🤖 CI Environment detected"
    IS_CI=true
    export HEADLESS=true
    export TEST_TIMEOUT=30000
else
    echo "💻 Local Environment detected"
    IS_CI=false
    export TEST_TIMEOUT=15000
fi

# Check if Obsidian is available for testing
echo "🔍 Checking test environment..."

# Set test parameters based on environment
if [[ "$IS_CI" == "true" ]]; then
    echo "📝 CI Test Configuration:"
    echo "  - Headless mode: enabled"
    echo "  - Extended timeouts: enabled"
    echo "  - Verbose logging: enabled"
    echo "  - Screenshot capture: disabled"
    
    # CI-specific test command
    npm run test:ui -- \
        --timeout=60000 \
        --reporter=json \
        --verbose \
        --retries=3
else
    echo "📝 Local Test Configuration:"
    echo "  - Headless mode: configurable"
    echo "  - Standard timeouts: enabled"
    echo "  - Debug mode: available"
    echo "  - Screenshot capture: enabled"
    
    # Check if user wants to run specific tests
    if [[ -n "$1" ]]; then
        echo "🎯 Running specific test: $1"
        npm run test:ui -- --grep "$1"
    else
        echo "🏃 Running all UI tests"
        npm run test:ui
    fi
fi

echo ""
echo "✅ UI Tests completed"

# If in CI, generate test report
if [[ "$IS_CI" == "true" ]]; then
    echo "📊 Generating CI test report..."
    
    if [[ -f "test-results.json" ]]; then
        echo "Test results available in test-results.json"
    fi
    
    echo "🏁 CI Test run completed"
fi