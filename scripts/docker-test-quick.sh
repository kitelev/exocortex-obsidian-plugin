#!/bin/bash
# Quick Docker UI Test Runner
# Simplified script for rapid test execution without interrupting development

set -e

# Quick configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_SUITE=${1:-basic}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Docker UI Test Runner${NC}"
echo -e "${BLUE}Suite: $TEST_SUITE${NC}"

cd "$PROJECT_ROOT"

# Create output directory
mkdir -p test-output/quick

# Run tests in background to avoid blocking development
echo -e "${GREEN}Starting containerized UI tests in background...${NC}"

docker-compose -f docker-compose.ui-test.yml --profile basic-tests up --build -d ui-test-basic >/dev/null 2>&1

# Wait for completion
echo -e "${BLUE}Tests running... Check status with: docker-compose -f docker-compose.ui-test.yml logs ui-test-basic${NC}"

# Optional: Wait for completion and show results
if [ "${2:-}" = "--wait" ]; then
    echo "Waiting for test completion..."
    docker-compose -f docker-compose.ui-test.yml wait ui-test-basic
    
    # Show results
    EXIT_CODE=$(docker-compose -f docker-compose.ui-test.yml ps -q ui-test-basic | xargs docker inspect --format='{{.State.ExitCode}}')
    
    if [ "$EXIT_CODE" = "0" ]; then
        echo -e "${GREEN}✅ Tests passed!${NC}"
    else
        echo -e "${RED}❌ Tests failed with exit code: $EXIT_CODE${NC}"
    fi
    
    # Cleanup
    docker-compose -f docker-compose.ui-test.yml down --remove-orphans >/dev/null 2>&1
else
    echo -e "${GREEN}Tests started successfully! Development work can continue.${NC}"
    echo "View progress: docker-compose -f docker-compose.ui-test.yml logs -f ui-test-basic"
    echo "Stop tests: docker-compose -f docker-compose.ui-test.yml down"
fi