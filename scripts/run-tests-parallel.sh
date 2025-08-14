#!/bin/bash

# Exocortex Plugin - Run Tests in Parallel
# This script runs test suites in parallel for faster execution

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚡ Exocortex Plugin - Parallel Test Execution${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Create temp directory for results
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Function to run test suite in background
run_test_async() {
    local suite_name=$1
    local command=$2
    local output_file=$3
    
    {
        echo -e "${CYAN}🚀 Starting $suite_name...${NC}"
        if $command > "$output_file" 2>&1; then
            echo "PASS" > "$output_file.result"
            echo -e "${GREEN}✅ $suite_name completed successfully${NC}"
        else
            echo "FAIL" > "$output_file.result"
            echo -e "${RED}❌ $suite_name failed${NC}"
        fi
    } &
}

# Start all test suites in parallel
echo -e "${YELLOW}🔄 Starting all test suites in parallel...${NC}"
echo ""

run_test_async "Unit Tests" "npm run test:unit" "$TEMP_DIR/unit.log"
PID_UNIT=$!

run_test_async "Integration Tests" "npm run test:integration" "$TEMP_DIR/integration.log"
PID_INTEGRATION=$!

run_test_async "E2E Tests" "npm run test:e2e:all" "$TEMP_DIR/e2e.log"
PID_E2E=$!

# UI tests in headless mode for parallel execution
run_test_async "UI Tests (headless)" "npm run test:ui:headless" "$TEMP_DIR/ui.log"
PID_UI=$!

# Show progress
echo -e "${YELLOW}⏳ Waiting for all test suites to complete...${NC}"
echo ""

# Wait for all background jobs
wait $PID_UNIT
wait $PID_INTEGRATION
wait $PID_E2E
wait $PID_UI

echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}=============================================${NC}"

# Function to check and display results
check_result() {
    local suite_name=$1
    local result_file=$2
    local log_file=$3
    
    if [ -f "$result_file" ] && [ "$(cat $result_file)" = "PASS" ]; then
        echo -e "${GREEN}✅ $suite_name: PASSED${NC}"
    else
        echo -e "${RED}❌ $suite_name: FAILED${NC}"
        echo -e "${YELLOW}   See logs: $log_file${NC}"
    fi
}

check_result "Unit Tests" "$TEMP_DIR/unit.log.result" "$TEMP_DIR/unit.log"
check_result "Integration Tests" "$TEMP_DIR/integration.log.result" "$TEMP_DIR/integration.log"
check_result "E2E Tests" "$TEMP_DIR/e2e.log.result" "$TEMP_DIR/e2e.log"
check_result "UI Tests" "$TEMP_DIR/ui.log.result" "$TEMP_DIR/ui.log"

echo ""

# Check overall status
ALL_PASS=true
for result_file in "$TEMP_DIR"/*.result; do
    if [ -f "$result_file" ] && [ "$(cat $result_file)" != "PASS" ]; then
        ALL_PASS=false
        break
    fi
done

if $ALL_PASS; then
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    echo -e "${GREEN}⚡ Parallel execution completed${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed.${NC}"
    echo ""
    echo -e "${YELLOW}To view detailed logs:${NC}"
    echo -e "  cat $TEMP_DIR/unit.log        # Unit test logs"
    echo -e "  cat $TEMP_DIR/integration.log # Integration test logs"
    echo -e "  cat $TEMP_DIR/e2e.log         # E2E test logs"
    echo -e "  cat $TEMP_DIR/ui.log          # UI test logs"
    echo ""
    echo -e "${YELLOW}Press Enter to exit and cleanup temp files...${NC}"
    read
    exit 1
fi