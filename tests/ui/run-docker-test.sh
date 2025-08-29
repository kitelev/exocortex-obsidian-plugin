#!/bin/bash

# Script to run UI tests in Docker
set -e

echo "🐳 Starting Docker UI Tests for CreateAssetModal"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building Docker image...${NC}"

# Build the plugin first
cd ../..
npm run build
cd tests/ui

# Create test-results directory if it doesn't exist
mkdir -p test-results

# Clean up any previous containers
echo -e "${YELLOW}🧹 Cleaning up previous containers...${NC}"
docker-compose down -v 2>/dev/null || true

# Build and run the tests
echo -e "${YELLOW}🚀 Running tests in Docker...${NC}"
docker-compose up --build --abort-on-container-exit

# Capture exit code
TEST_EXIT_CODE=$?

# Get logs
echo -e "${YELLOW}📋 Fetching test logs...${NC}"
docker-compose logs > test-results/docker-test.log 2>&1

# Clean up
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
docker-compose down -v

# Check results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Tests PASSED!${NC}"
    echo "Screenshots saved in: tests/ui/test-results/"
    
    # Show summary from logs
    if [ -f test-results/docker-test.log ]; then
        echo -e "\n${YELLOW}📊 Test Summary:${NC}"
        grep -E "DUPLICATE|Core property|ERROR|✅|❌" test-results/docker-test.log | tail -20
    fi
else
    echo -e "${RED}❌ Tests FAILED!${NC}"
    echo "Check logs at: tests/ui/test-results/docker-test.log"
    echo "Screenshots at: tests/ui/test-results/"
    
    # Show errors from logs
    if [ -f test-results/docker-test.log ]; then
        echo -e "\n${RED}Errors found:${NC}"
        grep -E "ERROR|DUPLICATE|❌" test-results/docker-test.log | tail -10
    fi
fi

exit $TEST_EXIT_CODE