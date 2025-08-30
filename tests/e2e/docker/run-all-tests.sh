#!/bin/bash

# Complete Docker E2E Test Suite
# Runs all Docker tests to ensure everything works

set -e

echo "🚀 COMPLETE DOCKER E2E TEST SUITE"
echo "="$(printf '%.0s' {1..60})
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TOTAL_PASSED=0
TOTAL_FAILED=0

# Test 1: Simple connectivity
echo "📦 Test 1: Simple Docker Connectivity"
echo "-"$(printf '%.0s' {1..40})
if node simple-docker-test.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Simple connectivity test PASSED${NC}"
    ((TOTAL_PASSED++))
else
    echo -e "${RED}❌ Simple connectivity test FAILED${NC}"
    ((TOTAL_FAILED++))
fi
echo ""

# Test 2: Plugin verification
echo "📦 Test 2: Docker Plugin Verification"
echo "-"$(printf '%.0s' {1..40})
if node docker-plugin-test.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Plugin verification test PASSED${NC}"
    ((TOTAL_PASSED++))
else
    echo -e "${RED}❌ Plugin verification test FAILED${NC}"
    ((TOTAL_FAILED++))
fi
echo ""

# Test 3: Advanced UI validation
echo "📦 Test 3: Advanced UI Validation"
echo "-"$(printf '%.0s' {1..40})
if node advanced-ui-test.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Advanced UI test PASSED${NC}"
    ((TOTAL_PASSED++))
else
    echo -e "${RED}❌ Advanced UI test FAILED${NC}"
    ((TOTAL_FAILED++))
fi
echo ""

# Test 4: Stability test (5 runs)
echo "📦 Test 4: Stability Test (5x consecutive)"
echo "-"$(printf '%.0s' {1..40})
if ./run-stability-test.sh > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Stability test PASSED (5/5 runs)${NC}"
    ((TOTAL_PASSED++))
else
    echo -e "${RED}❌ Stability test FAILED${NC}"
    ((TOTAL_FAILED++))
fi
echo ""

# Final summary
echo "="$(printf '%.0s' {1..60})
echo "📊 FINAL TEST RESULTS"
echo "="$(printf '%.0s' {1..60})
echo ""
echo "Test Suites Run: 4"
echo -e "Passed: ${GREEN}$TOTAL_PASSED${NC}"
echo -e "Failed: ${RED}$TOTAL_FAILED${NC}"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL DOCKER E2E TESTS PASSED!${NC}"
    echo ""
    echo "🎯 Verified Components:"
    echo "  • Docker container: ✅"
    echo "  • Obsidian UI: ✅"
    echo "  • Plugin loading: ✅"
    echo "  • DynamicLayout: ✅"
    echo "  • UniversalLayout: ✅"
    echo "  • CreateAssetModal: ✅"
    echo "  • 5x stability: ✅"
    echo ""
    echo "🚀 Ready for production!"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please check the failing tests above."
    exit 1
fi