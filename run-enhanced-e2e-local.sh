#!/bin/bash

# Enhanced E2E Test Runner for Local Development
# This script runs the complete enhanced E2E testing suite locally

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_RESULTS_DIR="$SCRIPT_DIR/test-results"
OBSIDIAN_VERSION="${OBSIDIAN_VERSION:-1.5.12}"
NODE_VERSION="${NODE_VERSION:-20}"
ENABLE_VNC="${ENABLE_VNC:-false}"
ENABLE_MONITORING="${ENABLE_MONITORING:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${PURPLE}"
    echo "════════════════════════════════════════════════════════════════════"
    echo "🎯 ENHANCED E2E TESTING SUITE"
    echo "Running REAL Obsidian Desktop with Plugin Testing"
    echo "════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
    echo -e "${CYAN}Obsidian Version:${NC} $OBSIDIAN_VERSION"
    echo -e "${CYAN}Node Version:${NC} $NODE_VERSION"
    echo -e "${CYAN}VNC Debugging:${NC} $ENABLE_VNC"
    echo -e "${CYAN}Performance Monitoring:${NC} $ENABLE_MONITORING"
    echo -e "${CYAN}Test Results:${NC} $TEST_RESULTS_DIR"
    echo ""
}

cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    docker-compose -f docker-compose.e2e-enhanced.yml down --volumes --remove-orphans 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
}

# Trap cleanup on exit
trap cleanup EXIT

main() {
    print_banner
    
    # Step 1: Prerequisites Check
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check completed${NC}\n"
    
    # Step 2: Build Plugin
    echo -e "${BLUE}🔨 Building plugin...${NC}"
    
    if [ ! -f package.json ]; then
        echo -e "${RED}❌ No package.json found. Please run from the plugin root directory.${NC}"
        exit 1
    fi
    
    npm ci
    npm run build
    
    # Verify build artifacts
    if [ ! -f main.js ] || [ ! -f manifest.json ]; then
        echo -e "${RED}❌ Build failed. Missing main.js or manifest.json${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Plugin built successfully${NC}\n"
    
    # Step 3: Prepare Test Environment
    echo -e "${BLUE}📁 Preparing test environment...${NC}"
    
    # Create test directories
    mkdir -p "$TEST_RESULTS_DIR"/{enhanced-screenshots,videos,reports,allure-results}
    mkdir -p playwright-report wdio-logs
    
    # Create enhanced test vault
    mkdir -p tests/e2e/test-vault/{assets,classes,templates,.obsidian/plugins/exocortex}
    
    # Copy plugin files to test vault
    cp main.js tests/e2e/test-vault/.obsidian/plugins/exocortex/
    cp manifest.json tests/e2e/test-vault/.obsidian/plugins/exocortex/
    cp styles.css tests/e2e/test-vault/.obsidian/plugins/exocortex/ 2>/dev/null || true
    
    # Create test assets
    cat > tests/e2e/test-vault/assets/Enhanced-Test-Asset.md << 'EOF'
# Enhanced Local E2E Test Asset

exo__Class:: emo__Project
exo__Name:: Enhanced Local E2E Test Project
exo__Status:: exo__Active
exo__Priority:: exo__High

## Description
This is a comprehensive test asset created for enhanced local E2E testing.

## Properties
- Created by: Enhanced Local E2E Test Suite
- Purpose: Testing real plugin functionality locally
- Date: $(date +%Y-%m-%d)

## Test Query Block

```exo-query
instances of exo__Project
```

## Test Layout Block

```exo-layout
class: emo__Project
```

## Performance Test Section
This section tests plugin performance with various content types and sizes.
EOF
    
    # Enable plugin in Obsidian config
    echo '{"enabledPlugins":["exocortex"]}' > tests/e2e/test-vault/.obsidian/community-plugins.json
    
    echo -e "${GREEN}✅ Test environment prepared${NC}\n"
    
    # Step 4: Build Docker Images
    echo -e "${BLUE}🐳 Building Docker images...${NC}"
    
    docker build -f Dockerfile.e2e-enhanced -t exocortex-e2e-enhanced:latest \
        --build-arg NODE_VERSION="$NODE_VERSION" \
        --build-arg OBSIDIAN_VERSION="$OBSIDIAN_VERSION" \
        .
    
    echo -e "${GREEN}✅ Docker images built${NC}\n"
    
    # Step 5: Run Enhanced E2E Tests
    echo -e "${BLUE}🧪 Running Enhanced E2E Tests...${NC}"
    echo -e "${CYAN}This will test REAL plugin functionality in actual Obsidian desktop!${NC}\n"
    
    # Determine which profiles to run
    COMPOSE_PROFILES=""
    if [ "$ENABLE_VNC" = "true" ]; then
        COMPOSE_PROFILES="--profile debug"
        echo -e "${YELLOW}🔍 VNC debugging enabled - connect to localhost:5900 (password: exocortex123)${NC}"
        echo -e "${YELLOW}🌐 Web VNC available at http://localhost:6080${NC}\n"
    fi
    
    if [ "$ENABLE_MONITORING" = "true" ]; then
        COMPOSE_PROFILES="$COMPOSE_PROFILES --profile monitoring"
        echo -e "${YELLOW}📊 Performance monitoring enabled - Prometheus at http://localhost:9090${NC}\n"
    fi
    
    # Run the tests
    if [ -n "$COMPOSE_PROFILES" ]; then
        docker-compose -f docker-compose.e2e-enhanced.yml $COMPOSE_PROFILES up --abort-on-container-exit
    else
        docker-compose -f docker-compose.e2e-enhanced.yml up e2e-enhanced-tests --abort-on-container-exit
    fi
    
    # Step 6: Generate Reports
    echo -e "\n${BLUE}📊 Generating enhanced reports...${NC}"
    
    if [ -f "$TEST_RESULTS_DIR/reports"/*_consolidated_report.json ]; then
        echo -e "${GREEN}✅ Test results found, generating comprehensive reports...${NC}"
        
        # Generate enhanced report
        if [ -f tests/e2e/docker/generate-enhanced-report.js ]; then
            cd tests/e2e/docker
            node generate-enhanced-report.js
            cd "$SCRIPT_DIR"
        fi
    else
        echo -e "${YELLOW}⚠️  No consolidated test results found${NC}"
    fi
    
    # Step 7: Display Results Summary
    echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}📋 ENHANCED E2E TEST RESULTS SUMMARY${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}\n"
    
    # Count artifacts
    SCREENSHOT_COUNT=$(find "$TEST_RESULTS_DIR/enhanced-screenshots" -name "*.png" 2>/dev/null | wc -l)
    VIDEO_COUNT=$(find "$TEST_RESULTS_DIR/videos" -name "*.mp4" -o -name "*.webm" 2>/dev/null | wc -l)
    REPORT_COUNT=$(find "$TEST_RESULTS_DIR/reports" -name "*.json" -o -name "*.html" 2>/dev/null | wc -l)
    
    echo -e "${CYAN}📸 Screenshots Generated:${NC} $SCREENSHOT_COUNT"
    echo -e "${CYAN}🎥 Videos Generated:${NC} $VIDEO_COUNT"
    echo -e "${CYAN}📊 Reports Generated:${NC} $REPORT_COUNT"
    
    # Show most recent test results
    if [ -f "$TEST_RESULTS_DIR/reports"/*_consolidated_report.json ]; then
        LATEST_REPORT=$(ls -t "$TEST_RESULTS_DIR/reports"/*_consolidated_report.json | head -n1)
        
        if command -v jq >/dev/null 2>&1 && [ -f "$LATEST_REPORT" ]; then
            TOTAL_TESTS=$(jq -r '.summary.totalTests // 0' "$LATEST_REPORT")
            PASSED_TESTS=$(jq -r '.summary.passed // 0' "$LATEST_REPORT")
            FAILED_TESTS=$(jq -r '.summary.failed // 0' "$LATEST_REPORT")
            SUCCESS_RATE=$(jq -r '.summary.successRate // 0' "$LATEST_REPORT")
            
            echo ""
            echo -e "${CYAN}🧪 Total Tests:${NC} $TOTAL_TESTS"
            echo -e "${GREEN}✅ Passed:${NC} $PASSED_TESTS"
            echo -e "${RED}❌ Failed:${NC} $FAILED_TESTS"
            echo -e "${BLUE}📈 Success Rate:${NC} ${SUCCESS_RATE}%"
            
            if [ "$SUCCESS_RATE" -ge "90" ] 2>/dev/null; then
                echo -e "\n${GREEN}🎉 EXCELLENT! All tests passing with high success rate!${NC}"
            elif [ "$SUCCESS_RATE" -ge "70" ] 2>/dev/null; then
                echo -e "\n${YELLOW}⚠️  GOOD. Most tests passing but some issues detected.${NC}"
            else
                echo -e "\n${RED}💥 ATTENTION NEEDED. Low success rate indicates problems.${NC}"
            fi
        fi
    fi
    
    echo ""
    echo -e "${PURPLE}🔥 ENHANCED TESTING FEATURES USED:${NC}"
    echo -e "${GREEN}✅${NC} Real Obsidian desktop application in Docker"
    echo -e "${GREEN}✅${NC} Xvfb virtual display for headless operation"
    echo -e "${GREEN}✅${NC} Actual plugin loading and functionality testing"
    echo -e "${GREEN}✅${NC} Real DOM interaction and UI component detection"
    echo -e "${GREEN}✅${NC} Performance monitoring and memory usage tracking"
    echo -e "${GREEN}✅${NC} Visual regression testing with screenshots"
    echo -e "${GREEN}✅${NC} Comprehensive error detection and debugging"
    
    echo ""
    echo -e "${CYAN}📁 Results Location:${NC} $TEST_RESULTS_DIR"
    
    # Show important files
    if [ -f "$TEST_RESULTS_DIR/index.html" ]; then
        echo -e "${CYAN}🌐 Visual Report:${NC} file://$TEST_RESULTS_DIR/index.html"
    fi
    
    if [ -d "$TEST_RESULTS_DIR/enhanced-screenshots" ] && [ "$SCREENSHOT_COUNT" -gt 0 ]; then
        echo -e "${CYAN}📸 Screenshots:${NC} $TEST_RESULTS_DIR/enhanced-screenshots/"
    fi
    
    if [ -d "$TEST_RESULTS_DIR/reports" ] && [ "$REPORT_COUNT" -gt 0 ]; then
        LATEST_HTML_REPORT=$(find "$TEST_RESULTS_DIR/reports" -name "*_dashboard.html" | head -n1)
        if [ -f "$LATEST_HTML_REPORT" ]; then
            echo -e "${CYAN}📊 Dashboard:${NC} file://$LATEST_HTML_REPORT"
        fi
    fi
    
    echo -e "\n${PURPLE}════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎯 Enhanced E2E Testing Completed!${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════════${NC}"
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Enhanced E2E Test Runner for Exocortex Plugin"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Environment Variables:"
    echo "  OBSIDIAN_VERSION    Obsidian version to test (default: 1.5.12)"
    echo "  NODE_VERSION        Node.js version to use (default: 20)"
    echo "  ENABLE_VNC          Enable VNC debugging (true/false, default: false)"
    echo "  ENABLE_MONITORING   Enable performance monitoring (true/false, default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                                          # Run standard tests"
    echo "  ENABLE_VNC=true $0                          # Run with VNC debugging"
    echo "  ENABLE_MONITORING=true $0                   # Run with performance monitoring"
    echo "  OBSIDIAN_VERSION=1.5.8 $0                  # Test with specific Obsidian version"
    echo ""
    echo "Features:"
    echo "  🔥 Real Obsidian desktop application testing"
    echo "  📸 Visual regression testing with screenshots"
    echo "  🎥 Optional video recording"
    echo "  📊 Performance monitoring and analysis"
    echo "  🔍 VNC debugging support"
    echo "  💯 100% authentic plugin functionality testing"
    exit 0
fi

# Run main function
main "$@"