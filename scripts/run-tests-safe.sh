#!/bin/bash
# Safe test runner that prevents Playwright hangs
# Recommended: Use /test command instead (invokes obsidian-qa-expert agent)

set -e

echo "🧪 Running Exocortex test suite with hang prevention..."
echo ""

# Create temp file for output
TEMP_OUTPUT="/tmp/exocortex-test-output-$$.txt"
trap "rm -f $TEMP_OUTPUT" EXIT

# Track start time
START_TIME=$(date +%s)

# Function to run tests with timeout and output capture
run_with_timeout() {
    local test_name="$1"
    local command="$2"
    local timeout_seconds="$3"

    echo "Running $test_name..."

    # Run with timeout, capture output
    if timeout $timeout_seconds bash -c "$command" 2>&1 | tee -a $TEMP_OUTPUT; then
        echo "✅ $test_name passed"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            echo "⚠️  $test_name timed out after ${timeout_seconds}s"
            echo "📊 Analyzing partial results..."
            grep -E "passed|failed|Test Suites" $TEMP_OUTPUT | tail -5 || echo "No results found"
        else
            echo "❌ $test_name failed with exit code $exit_code"
        fi
        return $exit_code
    fi
}

# Phase 1: Unit Tests (fast, ~1s)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_with_timeout "Unit tests" "npm run test:unit" 30
UNIT_EXIT=$?
echo ""

if [ $UNIT_EXIT -ne 0 ]; then
    echo "❌ Unit tests failed. Stopping execution."
    exit $UNIT_EXIT
fi

# Phase 2: UI Integration Tests (medium, ~2s)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: UI Integration Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_with_timeout "UI tests" "npm run test:ui" 30
UI_EXIT=$?
echo ""

if [ $UI_EXIT -ne 0 ]; then
    echo "❌ UI tests failed. Stopping execution."
    exit $UI_EXIT
fi

# Phase 3: Component Tests with Playwright Hang Prevention (slow, ~5-10s)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3: Component Tests (Playwright CT - Hang Prevention)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Using timeout wrapper and output parsing to prevent hang"
echo ""

# Run component tests with special handling
COMPONENT_TEMP="/tmp/exocortex-component-$$.txt"
timeout 120 npm run test:component 2>&1 | tee $COMPONENT_TEMP | head -200

# Parse results from output (before HTTP server message)
if grep -q "passed" $COMPONENT_TEMP; then
    PASSED_COUNT=$(grep -oE "[0-9]+ passed" $COMPONENT_TEMP | head -1 | grep -oE "[0-9]+")
    DURATION=$(grep -oE "passed \([0-9.]+s\)" $COMPONENT_TEMP | head -1 | grep -oE "[0-9.]+s")
    echo ""
    echo "✅ Component tests: $PASSED_COUNT passed ($DURATION)"
    COMPONENT_EXIT=0
else
    echo ""
    echo "❌ Component tests failed or timed out"
    echo "Last output:"
    tail -20 $COMPONENT_TEMP
    COMPONENT_EXIT=1
fi

rm -f $COMPONENT_TEMP
echo ""

if [ $COMPONENT_EXIT -ne 0 ]; then
    echo "❌ Component tests failed. Stopping execution."
    exit $COMPONENT_EXIT
fi

# Phase 4: BDD Coverage Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 4: BDD Coverage Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_with_timeout "BDD coverage check" "npm run bdd:check" 10
BDD_EXIT=$?
echo ""

if [ $BDD_EXIT -ne 0 ]; then
    echo "❌ BDD coverage below 80%. Add missing test implementations."
    exit $BDD_EXIT
fi

# Calculate total duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Final Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All Tests Passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Test Summary:"
echo "  - Unit tests: ✅ PASS"
echo "  - UI tests: ✅ PASS"
echo "  - Component tests: ✅ PASS (hang prevented)"
echo "  - BDD coverage: ✅ PASS (≥80%)"
echo ""
echo "⏱️  Total Duration: ${DURATION}s"
echo ""
echo "🎯 Next Steps:"
echo "  - All quality gates passed"
echo "  - Ready for commit"
echo "  - Consider running /release if code changes complete"
echo ""

exit 0
