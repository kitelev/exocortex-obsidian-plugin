#!/bin/bash
# Real E2E Testing with Playwright and Obsidian
# This script runs authentic E2E tests against a real Obsidian desktop application

set -e

echo "🚀 Starting Real E2E Tests with Playwright..."
echo "=================================================================================="

# Configuration
OBSIDIAN_PATH=${OBSIDIAN_PATH:-"/Applications/Obsidian.app/Contents/MacOS/Obsidian"}
NODE_ENV=${NODE_ENV:-"test"}
CLEANUP_TEST_VAULT=${CLEANUP_TEST_VAULT:-"false"}

echo "Configuration:"
echo "  Obsidian Path: $OBSIDIAN_PATH"
echo "  Node Environment: $NODE_ENV"
echo "  Cleanup Test Vault: $CLEANUP_TEST_VAULT"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if Obsidian is installed
if [ ! -f "$OBSIDIAN_PATH" ]; then
    echo "❌ Obsidian not found at: $OBSIDIAN_PATH"
    echo "   Please install Obsidian or set OBSIDIAN_PATH environment variable"
    echo "   Example: export OBSIDIAN_PATH=\"/Applications/Obsidian.app/Contents/MacOS/Obsidian\""
    exit 1
fi

echo "✅ Obsidian found at: $OBSIDIAN_PATH"

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) found"

# Install dependencies if needed
echo ""
echo "📦 Installing dependencies..."
if [ ! -d "node_modules/@playwright" ]; then
    echo "Installing Playwright..."
    npm install
    npx playwright install
else
    echo "✅ Playwright already installed"
fi

# Build the plugin
echo ""
echo "🔨 Building plugin..."
npm run build

if [ ! -f "main.js" ]; then
    echo "❌ Plugin build failed - main.js not found"
    exit 1
fi

echo "✅ Plugin built successfully"

# Clean up any previous test results
echo ""
echo "🧹 Preparing test environment..."
rm -rf test-results/playwright-*
rm -rf test-results/screenshots
mkdir -p test-results/screenshots

# Kill any existing Obsidian processes
echo "🔄 Checking for running Obsidian processes..."
pkill -f "Obsidian" || true
sleep 2

# Export environment variables
export OBSIDIAN_PATH
export NODE_ENV
export CLEANUP_TEST_VAULT

echo ""
echo "🚀 Running Playwright E2E Tests..."
echo "=================================================================================="

# Function to run specific test suite
run_test_suite() {
    local suite_name="$1"
    local test_file="$2"
    
    echo ""
    echo "🧪 Running $suite_name tests..."
    echo "----------------------------------------"
    
    # Run the test with timeout and retry
    if npx playwright test "$test_file" --project="Desktop macOS - Real Obsidian" --reporter=list,html; then
        echo "✅ $suite_name tests passed"
        return 0
    else
        echo "❌ $suite_name tests failed"
        return 1
    fi
}

# Test execution plan
declare -a test_results=()
total_tests=0
passed_tests=0

# Run UniversalLayout tests
((total_tests++))
if run_test_suite "UniversalLayout" "tests/e2e/playwright/tests/universal-layout.spec.ts"; then
    ((passed_tests++))
    test_results+=("✅ UniversalLayout: PASSED")
else
    test_results+=("❌ UniversalLayout: FAILED")
fi

# Run DynamicLayout tests
((total_tests++))
if run_test_suite "DynamicLayout" "tests/e2e/playwright/tests/dynamic-layout.spec.ts"; then
    ((passed_tests++))
    test_results+=("✅ DynamicLayout: PASSED")
else
    test_results+=("❌ DynamicLayout: FAILED")
fi

# Run CreateAssetModal tests
((total_tests++))
if run_test_suite "CreateAssetModal" "tests/e2e/playwright/tests/create-asset-modal.spec.ts"; then
    ((passed_tests++))
    test_results+=("✅ CreateAssetModal: PASSED")
else
    test_results+=("❌ CreateAssetModal: FAILED")
fi

# Run Integration tests
((total_tests++))
if run_test_suite "Integration" "tests/e2e/playwright/tests/plugin-integration.spec.ts"; then
    ((passed_tests++))
    test_results+=("✅ Integration: PASSED")
else
    test_results+=("❌ Integration: FAILED")
fi

# Generate final report
echo ""
echo "📊 Test Execution Summary"
echo "=================================================================================="
echo "Total Test Suites: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $((total_tests - passed_tests))"
echo ""

echo "Detailed Results:"
for result in "${test_results[@]}"; do
    echo "  $result"
done

echo ""
echo "📁 Test Artifacts:"
echo "  Screenshots: test-results/screenshots/"
echo "  HTML Report: test-results/playwright-reports/"
echo "  Video Files: test-results/playwright-output/"

# Check if HTML report exists and offer to open it
if [ -f "test-results/playwright-reports/index.html" ]; then
    echo ""
    echo "🌐 HTML Report generated: test-results/playwright-reports/index.html"
    
    # On macOS, offer to open the report
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo ""
        read -p "Would you like to open the HTML report? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open test-results/playwright-reports/index.html
        fi
    fi
fi

# Check if screenshots were generated
screenshot_count=$(find test-results/screenshots -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
if [ "$screenshot_count" -gt 0 ]; then
    echo "📸 $screenshot_count screenshots captured during testing"
    
    # Create screenshot gallery if it exists
    if [ -f "test-results/screenshots/gallery.html" ]; then
        echo "🖼️ Screenshot gallery: test-results/screenshots/gallery.html"
    fi
fi

# Clean up processes
echo ""
echo "🧹 Cleaning up..."
pkill -f "Obsidian" || true

# Final status
echo ""
echo "=================================================================================="
if [ $passed_tests -eq $total_tests ]; then
    echo "🎉 ALL TESTS PASSED! Real E2E testing completed successfully."
    echo ""
    echo "✅ The Exocortex plugin has been validated in a real Obsidian environment:"
    echo "   - Plugin loads and initializes correctly"
    echo "   - UniversalLayout renders authentic UI components"
    echo "   - DynamicLayout responds to different asset types"
    echo "   - CreateAssetModal handles real user workflows"
    echo "   - Integration between components works seamlessly"
    echo "   - Performance is acceptable for real-world usage"
    echo ""
    echo "📸 Real screenshots document actual functionality, not simulations."
    exit 0
else
    echo "⚠️  Some tests failed ($passed_tests/$total_tests passed)"
    echo ""
    echo "Check the detailed reports and screenshots to understand the issues:"
    echo "   - HTML Report: test-results/playwright-reports/index.html"
    echo "   - Screenshots: test-results/screenshots/"
    echo "   - Console output above for specific error details"
    echo ""
    echo "This is real E2E testing - failures indicate actual plugin issues."
    exit 1
fi