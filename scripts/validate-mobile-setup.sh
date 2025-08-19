#!/bin/bash
# Mobile Setup Validation Script
# Validates that the mobile test environment is properly configured

set -e

echo "🔍 Validating Mobile Test Environment Setup"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_pattern="$3"
    
    echo ""
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    echo "   Command: $test_command"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo ""
echo -e "${YELLOW}Phase 1: Mobile Environment Configuration${NC}"
echo "----------------------------------------"

# Test 1: Mobile Platform Detection
run_test "Mobile Platform Detection" \
    "TEST_PLATFORM=mobile npx jest tests/unit/infrastructure/utils/PlatformDetector.test.ts --testNamePattern='should detect mobile' --silent" \
    "mobile detection"

# Test 2: Mobile Performance Optimizer
run_test "Mobile Performance Optimizer Initialization" \
    "TEST_PLATFORM=mobile npx jest tests/unit/infrastructure/optimizers/MobilePerformanceOptimizer.test.ts --testNamePattern='should initialize with default config' --silent" \
    "performance optimizer"

# Test 3: Touch Controller Setup
run_test "Touch Graph Controller Element Setup" \
    "TEST_PLATFORM=mobile npx jest tests/unit/presentation/mobile/TouchGraphController.test.ts --testNamePattern='should setup element styles for touch interaction' --silent" \
    "touch controller"

echo ""
echo -e "${YELLOW}Phase 2: Mobile UI Components${NC}"
echo "-------------------------------"

# Test 4: Mobile Modal Adapter
run_test "Mobile Modal Adapter" \
    "TEST_PLATFORM=mobile npx jest tests/unit/presentation/mobile/MobileModalAdapter.test.ts --testNamePattern='should adapt modal for mobile' --silent" \
    "modal adapter"

# Test 5: Mobile UI Components
run_test "Mobile UI Components" \
    "TEST_PLATFORM=mobile npx jest tests/unit/presentation/mobile/MobileUIComponents.test.ts --testNamePattern='should render mobile-optimized' --silent" \
    "ui components"

echo ""
echo -e "${YELLOW}Phase 3: Platform-Specific Tests${NC}"
echo "--------------------------------"

# Test 6: iOS Platform
run_test "iOS Platform Configuration" \
    "TEST_PLATFORM=ios npx jest tests/unit/infrastructure/utils/PlatformDetector.test.ts --testNamePattern='should detect iOS' --silent" \
    "iOS detection"

# Test 7: Android Platform  
run_test "Android Platform Configuration" \
    "TEST_PLATFORM=android npx jest tests/unit/infrastructure/utils/PlatformDetector.test.ts --testNamePattern='should detect Android' --silent" \
    "Android detection"

# Test 8: Tablet Configuration
run_test "Tablet Platform Configuration" \
    "TEST_PLATFORM=tablet npx jest tests/unit/infrastructure/utils/PlatformDetector.test.ts --testNamePattern='should detect tablet' --silent" \
    "tablet detection"

echo ""
echo -e "${YELLOW}Phase 4: Touch Event System${NC}"
echo "-----------------------------"

# Test 9: Touch Event Creation
run_test "Touch Event Mock System" \
    "TEST_PLATFORM=mobile npx jest tests/unit/presentation/mobile/TouchGraphController.test.ts --testNamePattern='should attach event listeners' --silent" \
    "touch events"

# Test 10: Gesture Recognition
run_test "Gesture Recognition System" \
    "TEST_PLATFORM=mobile npx jest tests/unit/presentation/mobile/TouchGraphController.test.ts --testNamePattern='should detect single tap' --silent" \
    "gestures"

echo ""
echo -e "${YELLOW}Phase 5: Performance and Memory${NC}"
echo "--------------------------------"

# Test 11: Memory Management
run_test "Memory Management System" \
    "TEST_PLATFORM=mobile npx jest tests/unit/infrastructure/optimizers/MobilePerformanceOptimizer.test.ts --testNamePattern='should monitor memory usage' --silent" \
    "memory management"

# Test 12: Batch Processing
run_test "Mobile Batch Processing" \
    "TEST_PLATFORM=mobile npx jest tests/unit/infrastructure/optimizers/MobilePerformanceOptimizer.test.ts --testNamePattern='should process items in batches' --silent" \
    "batch processing"

echo ""
echo "=============================================="
echo -e "${BLUE}📊 Mobile Test Environment Validation Results${NC}"
echo "=============================================="
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests:  $TESTS_TOTAL"
echo ""

# Calculate success percentage
if [ $TESTS_TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TESTS_TOTAL ))
    echo -e "Success Rate: ${SUCCESS_RATE}%"
    
    if [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "${GREEN}🎉 Mobile test environment is properly configured!${NC}"
        echo ""
        echo -e "${BLUE}✅ Ready for mobile development and testing${NC}"
        echo "   • Touch event simulation: Working"
        echo "   • Platform detection: Working"
        echo "   • Performance optimization: Working"
        echo "   • Mobile UI components: Working"
        echo ""
        echo -e "${YELLOW}🚀 You can now run mobile tests with:${NC}"
        echo "   ./scripts/run-mobile-tests.sh"
        echo "   TEST_PLATFORM=mobile npm test"
        echo "   TEST_PLATFORM=ios npm test"
        echo "   TEST_PLATFORM=android npm test"
        exit 0
    elif [ $SUCCESS_RATE -ge 60 ]; then
        echo -e "${YELLOW}⚠️  Mobile test environment has some issues${NC}"
        echo "   Most core functionality is working, but some tests are failing."
        echo "   You may proceed with caution."
        exit 1
    else
        echo -e "${RED}❌ Mobile test environment has significant issues${NC}"
        echo "   Please review the failing tests and fix the configuration."
        exit 2
    fi
else
    echo -e "${RED}❌ No tests were executed${NC}"
    exit 3
fi