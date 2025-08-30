#!/bin/bash

# Docker E2E Stability Test
# Runs the Docker plugin test 5 times to ensure stability

set -e

echo "🔄 Docker E2E Stability Test"
echo "="$(printf '%.0s' {1..50})
echo "Running 5 consecutive test runs to verify stability..."
echo ""

PASSED=0
FAILED=0

for i in {1..5}; do
    echo "📦 Test Run $i/5"
    echo "-"$(printf '%.0s' {1..30})
    
    if node docker-plugin-test.js > /dev/null 2>&1; then
        echo "✅ Run $i: PASSED"
        ((PASSED++))
    else
        echo "❌ Run $i: FAILED"
        ((FAILED++))
    fi
    
    # Small delay between runs
    sleep 1
done

echo ""
echo "="$(printf '%.0s' {1..50})
echo "📊 Stability Test Results:"
echo "  • Passed: $PASSED/5"
echo "  • Failed: $FAILED/5"
echo "  • Success Rate: $((PASSED * 100 / 5))%"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "✅ STABILITY TEST PASSED!"
    echo "All 5 consecutive runs completed successfully."
    exit 0
else
    echo ""
    echo "❌ STABILITY TEST FAILED"
    echo "$FAILED runs failed. Please investigate."
    exit 1
fi