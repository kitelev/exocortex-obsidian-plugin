#!/bin/bash
# Local E2E test execution in Docker (isolated, identical to GitHub Actions)
#
# Requirements:
# - Docker installed and running
# - No impact on host system (full isolation)
# - Results visible in console (like unit tests)
#
# Usage:
#   ./scripts/test-e2e-local.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Building E2E Docker image with BuildKit...${NC}"
DOCKER_BUILDKIT=1 docker build -f Dockerfile.e2e -t exocortex-e2e:local .

echo ""
echo -e "${BLUE}🧪 Running E2E tests in Docker container...${NC}"
echo -e "${YELLOW}(Identical to GitHub Actions workflow)${NC}"
echo ""

# Create artifact directories (will be mounted)
mkdir -p test-results-e2e playwright-report-e2e

# Run tests in Docker (identical to CI)
docker run --init --rm \
  -v "$PWD/test-results-e2e:/app/test-results" \
  -v "$PWD/playwright-report-e2e:/app/playwright-report-e2e" \
  exocortex-e2e:local \
  npm run test:e2e

echo ""
echo -e "${GREEN}✅ E2E tests completed!${NC}"
echo ""
echo -e "${BLUE}📁 Test artifacts saved to:${NC}"
echo "   - test-results-e2e/       (screenshots, videos, traces)"
echo "   - playwright-report-e2e/  (HTML report)"
echo ""
echo -e "${YELLOW}ℹ️  To view HTML report manually (optional):${NC}"
echo "   npx playwright show-report playwright-report-e2e"
