#!/bin/bash

# Stability test runner - runs E2E tests 5 times consecutively for validation

set -e

SUCCESS_COUNT=0
TOTAL_RUNS=5
FAILED_RUNS=()

echo "🔄 Running E2E tests $TOTAL_RUNS times for stability validation..."

for i in $(seq 1 $TOTAL_RUNS); do
    echo ""
    echo "========================================="
    echo "🧪 Run $i of $TOTAL_RUNS"
    echo "========================================="
    
    # Clean environment between runs
    echo "🧹 Cleaning environment for run $i..."
    rm -rf tests/e2e/test-results/run-$i
    rm -rf tests/e2e/.obsidian-cache
    
    mkdir -p tests/e2e/test-results/run-$i/screenshots
    
    if bash run-e2e-local.sh; then
        echo "✅ Run $i: SUCCESS"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        
        # Archive results for this run
        cp -r tests/e2e/test-results/* tests/e2e/test-results/run-$i/ 2>/dev/null || echo "No results to archive"
    else
        echo "❌ Run $i: FAILED"
        FAILED_RUNS+=($i)
        
        # Archive failed results
        cp -r tests/e2e/test-results/* tests/e2e/test-results/run-$i/ 2>/dev/null || echo "No results to archive"
    fi
    
    # Brief pause between runs
    if [ $i -lt $TOTAL_RUNS ]; then
        echo "⏸️  Waiting 5 seconds before next run..."
        sleep 5
    fi
done

echo ""
echo "========================================="
echo "📊 STABILITY TEST RESULTS"
echo "========================================="
echo "Total runs: $TOTAL_RUNS"
echo "Successful runs: $SUCCESS_COUNT"
echo "Failed runs: $((TOTAL_RUNS - SUCCESS_COUNT))"

if [ ${#FAILED_RUNS[@]} -eq 0 ]; then
    echo "🎉 ALL RUNS SUCCESSFUL! Tests are stable."
    exit 0
else
    echo "⚠️  Failed runs: ${FAILED_RUNS[*]}"
    echo "🔍 Check individual run results in tests/e2e/test-results/run-X/"
    
    if [ $SUCCESS_COUNT -ge 3 ]; then
        echo "⚖️  Majority of tests passed ($SUCCESS_COUNT/$TOTAL_RUNS). Consider acceptable."
        exit 0
    else
        echo "❌ Tests are not stable enough ($SUCCESS_COUNT/$TOTAL_RUNS passed)."
        exit 1
    fi
fi