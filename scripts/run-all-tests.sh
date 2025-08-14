#!/bin/bash

# Exocortex Plugin - Run All Tests Locally
# This script runs all test suites and provides a summary

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
UNIT_RESULT="❌"
INTEGRATION_RESULT="❌"
E2E_RESULT="❌"
UI_RESULT="❌"

echo -e "${BLUE}🧪 Exocortex Plugin - Complete Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to run tests and capture result
run_test_suite() {
    local suite_name=$1
    local command=$2
    local result_var=$3
    
    echo -e "${YELLOW}📋 Running $suite_name...${NC}"
    
    if $command; then
        eval "$result_var='✅'"
        echo -e "${GREEN}✅ $suite_name PASSED${NC}"
    else
        eval "$result_var='❌'"
        echo -e "${RED}❌ $suite_name FAILED${NC}"
        # Don't exit immediately, continue with other tests
    fi
    echo ""
}

# Run Unit Tests
run_test_suite "Unit Tests" "npm run test:unit" "UNIT_RESULT"

# Run Integration Tests
run_test_suite "Integration Tests" "npm run test:integration" "INTEGRATION_RESULT"

# Run E2E Tests
run_test_suite "E2E Tests" "npm run test:e2e:all" "E2E_RESULT"

# Ask user about UI tests
echo -e "${YELLOW}🖥️  UI Tests Configuration${NC}"
echo "Choose UI test mode:"
echo "1) Skip UI tests"
echo "2) Run with GUI (opens Electron window)"
echo "3) Run headless (no GUI)"
read -p "Enter choice (1-3): " ui_choice

case $ui_choice in
    1)
        UI_RESULT="⏭️"
        echo -e "${YELLOW}⏭️  Skipping UI tests${NC}"
        ;;
    2)
        run_test_suite "UI Tests (with GUI)" "npm run test:ui" "UI_RESULT"
        ;;
    3)
        run_test_suite "UI Tests (headless)" "npm run test:ui:headless" "UI_RESULT"
        ;;
    *)
        UI_RESULT="⏭️"
        echo -e "${YELLOW}Invalid choice. Skipping UI tests${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Unit Tests:        $UNIT_RESULT"
echo -e "Integration Tests: $INTEGRATION_RESULT"
echo -e "E2E Tests:         $E2E_RESULT"
echo -e "UI Tests:          $UI_RESULT"
echo ""

# Check if all tests passed
if [[ "$UNIT_RESULT" == "✅" ]] && [[ "$INTEGRATION_RESULT" == "✅" ]] && [[ "$E2E_RESULT" == "✅" ]] && ([[ "$UI_RESULT" == "✅" ]] || [[ "$UI_RESULT" == "⏭️" ]]); then
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi