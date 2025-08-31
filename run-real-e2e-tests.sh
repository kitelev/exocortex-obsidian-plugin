#!/bin/bash

# Real E2E Test Runner for Exocortex Plugin
# Runs actual tests against real Obsidian desktop application

set -e

echo "🎯 REAL E2E TESTING - EXOCORTEX PLUGIN"
echo "======================================="
echo ""
echo "This script runs REAL tests against ACTUAL Obsidian."
echo "No simulations, no mockups, just real functionality."
echo ""

# Check if Obsidian is installed
if [[ "$OSTYPE" == "darwin"* ]]; then
    OBSIDIAN_PATH="/Applications/Obsidian.app"
    if [ ! -d "$OBSIDIAN_PATH" ]; then
        echo "❌ Obsidian not found at $OBSIDIAN_PATH"
        echo "Please install Obsidian from https://obsidian.md"
        exit 1
    fi
    echo "✅ Obsidian found at $OBSIDIAN_PATH"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OBSIDIAN_PATH="/usr/bin/obsidian"
    if [ ! -f "$OBSIDIAN_PATH" ]; then
        echo "❌ Obsidian not found at $OBSIDIAN_PATH"
        echo "Please install Obsidian"
        exit 1
    fi
    echo "✅ Obsidian found at $OBSIDIAN_PATH"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OBSIDIAN_PATH="C:\\Program Files\\Obsidian\\Obsidian.exe"
    if [ ! -f "$OBSIDIAN_PATH" ]; then
        echo "❌ Obsidian not found at $OBSIDIAN_PATH"
        echo "Please install Obsidian"
        exit 1
    fi
    echo "✅ Obsidian found"
else
    echo "⚠️ Unknown OS type: $OSTYPE"
fi

# Build the plugin first
echo ""
echo "📦 Building plugin..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Plugin built successfully"

# Install Playwright if needed
echo ""
echo "📥 Checking Playwright installation..."
if ! npm list @playwright/test > /dev/null 2>&1; then
    echo "Installing Playwright..."
    npm install --save-dev @playwright/test playwright
fi

# Install Playwright browsers if needed
echo ""
echo "🌐 Ensuring Playwright browsers are installed..."
npx playwright install chromium

# Create test results directory
mkdir -p test-results/playwright

# Run the actual tests
echo ""
echo "🚀 Running REAL E2E tests..."
echo "================================"
echo ""

# Set test mode
export REAL_E2E_TEST=true
export TEST_MODE=real

# Run specific test suites
if [ "$1" == "universal" ]; then
    echo "Testing UniversalLayout..."
    npx playwright test tests/e2e/playwright/tests/universal-layout.spec.ts
elif [ "$1" == "modal" ]; then
    echo "Testing CreateAssetModal..."
    npx playwright test tests/e2e/playwright/tests/create-asset-modal.spec.ts
elif [ "$1" == "dynamic" ]; then
    echo "Testing DynamicLayout..."
    npx playwright test tests/e2e/playwright/tests/dynamic-layout.spec.ts
elif [ "$1" == "debug" ]; then
    echo "Running in debug mode..."
    npx playwright test --debug
elif [ "$1" == "ui" ]; then
    echo "Opening Playwright UI..."
    npx playwright test --ui
else
    echo "Running all tests..."
    npx playwright test
fi

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ================================"
    echo "✅ REAL E2E TESTS PASSED!"
    echo "✅ ================================"
    echo ""
    echo "These were REAL tests:"
    echo "  • Launched actual Obsidian desktop app"
    echo "  • Loaded the real compiled plugin"
    echo "  • Tested actual UI components"
    echo "  • Captured real screenshots"
    echo "  • No simulations or mockups!"
    echo ""
    echo "📊 View detailed report: npx playwright show-report"
    echo "📸 Screenshots saved in: test-results/playwright/"
else
    echo ""
    echo "❌ ================================"
    echo "❌ REAL E2E TESTS FAILED"
    echo "❌ ================================"
    echo ""
    echo "These failures are REAL issues in the plugin."
    echo "Check the report for details: npx playwright show-report"
    exit 1
fi

# Offer to open report
echo ""
read -p "Would you like to view the test report? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx playwright show-report
fi