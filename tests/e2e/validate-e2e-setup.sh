#!/bin/bash

# Validate E2E testing setup
# Checks that all required files and dependencies are in place

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Validating E2E Testing Setup${NC}"
echo "========================================"

VALIDATION_PASSED=true

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "✅ ${GREEN}$1${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1 (missing)${NC}"
        VALIDATION_PASSED=false
        return 1
    fi
}

# Function to check directory exists  
check_dir() {
    if [ -d "$1" ]; then
        echo -e "✅ ${GREEN}$1/${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1/ (missing)${NC}"
        VALIDATION_PASSED=false
        return 1
    fi
}

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        local version=$(eval "$2" 2>/dev/null || echo "unknown")
        echo -e "✅ ${GREEN}$1${NC} (${version})"
        return 0
    else
        echo -e "❌ ${RED}$1 (not installed)${NC}"
        VALIDATION_PASSED=false
        return 1
    fi
}

echo
echo -e "${BLUE}📋 Core Requirements${NC}"
echo "--------------------"
check_command "docker" "docker --version"
check_command "docker-compose" "docker-compose --version"
check_command "node" "node --version"  
check_command "npm" "npm --version"

echo
echo -e "${BLUE}🏗️ Project Structure${NC}"
echo "--------------------"
check_file "package.json"
check_file "wdio.e2e.conf.ts"
check_file "tsconfig.wdio.json"

echo
echo -e "${BLUE}🐳 Docker Configuration${NC}"
echo "-----------------------"
check_file "tests/e2e/docker/docker-compose.e2e.yml"
check_file "tests/e2e/docker/Dockerfile.test-runner"
check_dir "tests/e2e/docker/test-vault"

echo
echo -e "${BLUE}📄 Page Objects${NC}"
echo "---------------"
check_file "tests/e2e/page-objects/WorkspacePage.ts"
check_file "tests/e2e/page-objects/DynamicLayoutPage.ts"
check_file "tests/e2e/page-objects/CreateAssetModalPage.ts"

echo
echo -e "${BLUE}🧪 Test Specifications${NC}"
echo "----------------------"
check_file "tests/e2e/specs/dynamic-layout.spec.ts"
check_file "tests/e2e/specs/create-asset-modal.spec.ts"
check_file "tests/e2e/specs/universal-layout.spec.ts"

echo
echo -e "${BLUE}🔧 Scripts and Tools${NC}"
echo "-------------------"
check_file "tests/e2e/docker/run-stable-quick.sh"
check_file "tests/e2e/docker/initialize-test-vault.sh"

# Check if scripts are executable
if [ -x "tests/e2e/docker/run-stable-quick.sh" ]; then
    echo -e "✅ ${GREEN}run-stable-quick.sh is executable${NC}"
else
    echo -e "⚠️ ${YELLOW}run-stable-quick.sh needs execute permission${NC}"
    chmod +x tests/e2e/docker/run-stable-quick.sh
fi

if [ -x "tests/e2e/docker/initialize-test-vault.sh" ]; then
    echo -e "✅ ${GREEN}initialize-test-vault.sh is executable${NC}"
else
    echo -e "⚠️ ${YELLOW}initialize-test-vault.sh needs execute permission${NC}"
    chmod +x tests/e2e/docker/initialize-test-vault.sh
fi

echo
echo -e "${BLUE}🚀 CI/CD Configuration${NC}"  
echo "----------------------"
check_file ".github/workflows/e2e-docker-tests.yml"

echo
echo -e "${BLUE}📦 Plugin Build${NC}"
echo "---------------"
check_file "main.js"
check_file "manifest.json"

if [ ! -f "main.js" ]; then
    echo -e "⚠️ ${YELLOW}Plugin not built. Run 'npm run build' first.${NC}"
fi

echo
echo -e "${BLUE}📚 Documentation${NC}"
echo "-----------------"
check_file "tests/e2e/README.md"

echo
echo -e "${BLUE}🔍 NPM Scripts Validation${NC}"
echo "-----------------------------"

# Check if E2E scripts are in package.json
if grep -q "test:e2e:docker" package.json; then
    echo -e "✅ ${GREEN}E2E Docker scripts configured${NC}"
else
    echo -e "❌ ${RED}E2E Docker scripts missing in package.json${NC}"
    VALIDATION_PASSED=false
fi

# Check Docker setup
echo
echo -e "${BLUE}🐳 Docker Service Check${NC}"
echo "------------------------"

if docker info &> /dev/null; then
    echo -e "✅ ${GREEN}Docker daemon is running${NC}"
else
    echo -e "❌ ${RED}Docker daemon is not running${NC}"
    VALIDATION_PASSED=false
fi

# Test Docker Compose file syntax
if docker-compose -f tests/e2e/docker/docker-compose.e2e.yml config &> /dev/null; then
    echo -e "✅ ${GREEN}Docker Compose file is valid${NC}"
else
    echo -e "❌ ${RED}Docker Compose file has syntax errors${NC}"
    VALIDATION_PASSED=false
fi

# Check for required directories
echo
echo -e "${BLUE}📁 Test Directories${NC}"
echo "------------------"
mkdir -p tests/e2e/docker/test-results/screenshots
mkdir -p tests/e2e/docker/test-results/allure-results  
mkdir -p tests/e2e/docker/wdio-logs

check_dir "tests/e2e/docker/test-results"
check_dir "tests/e2e/fixtures"

# Final summary
echo
echo "========================================"
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "🎉 ${GREEN}E2E SETUP VALIDATION PASSED${NC}"
    echo -e "✨ ${GREEN}Ready to run E2E tests!${NC}"
    echo
    echo -e "${BLUE}Quick Start Commands:${NC}"
    echo "npm run test:e2e:docker              # Run all E2E tests"
    echo "npm run test:e2e:docker:stability    # Run stability testing"
    echo "./tests/e2e/docker/initialize-test-vault.sh  # Initialize test vault"
    echo
    exit 0
else
    echo -e "❌ ${RED}E2E SETUP VALIDATION FAILED${NC}"
    echo -e "⚠️ ${YELLOW}Please fix the issues above before running E2E tests${NC}"
    echo
    exit 1
fi