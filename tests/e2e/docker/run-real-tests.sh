#!/bin/bash

# REAL PLUGIN TEST RUNNER
# Runs comprehensive real plugin tests in Docker environment
# NO MORE FAKE SIMULATIONS!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🎯 REAL EXOCORTEX PLUGIN TEST SUITE"
echo "═══════════════════════════════════════════════════════════"
echo "🔥 NO MORE FAKE TESTS - Testing REAL plugin functionality!"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_step() {
    echo -e "${BLUE}📋 Step: ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ ${1}${NC}"
}

log_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

# Function to cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Test suite failed!"
    fi
    
    log_step "Cleaning up..."
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.e2e.yml down --volumes --timeout 10 2>/dev/null || true
    
    if [ -f "$PROJECT_ROOT/main.js.backup" ]; then
        mv "$PROJECT_ROOT/main.js.backup" "$PROJECT_ROOT/main.js"
        log_warning "Restored backed up main.js"
    fi
    
    if [ -f "$PROJECT_ROOT/manifest.json.backup" ]; then
        mv "$PROJECT_ROOT/manifest.json.backup" "$PROJECT_ROOT/manifest.json"  
        log_warning "Restored backed up manifest.json"
    fi
}

trap cleanup EXIT

# Step 1: Verify prerequisites
log_step "Verifying prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"  
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

log_success "Prerequisites verified"

# Step 2: Build the plugin
log_step "Building plugin..."
cd "$PROJECT_ROOT"

if [ ! -f "package.json" ]; then
    log_error "package.json not found in project root"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    log_error "Plugin build failed"
    exit 1
fi

if [ ! -f "main.js" ]; then
    log_error "main.js not found after build"
    exit 1
fi

if [ ! -f "manifest.json" ]; then
    log_error "manifest.json not found"
    exit 1
fi

log_success "Plugin built successfully"

# Step 3: Setup test environment
log_step "Setting up test environment..."
cd "$SCRIPT_DIR"

# Run the setup script
if [ -f "setup-test-environment.sh" ]; then
    ./setup-test-environment.sh
    if [ $? -ne 0 ]; then
        log_error "Test environment setup failed"
        exit 1
    fi
else
    log_error "setup-test-environment.sh not found"
    exit 1
fi

log_success "Test environment ready"

# Step 4: Start Docker containers
log_step "Starting Docker containers..."

# Clean up any existing containers
docker-compose -f docker-compose.e2e.yml down --volumes --timeout 10 2>/dev/null || true

# Start containers
docker-compose -f docker-compose.e2e.yml up -d obsidian-e2e
if [ $? -ne 0 ]; then
    log_error "Failed to start Docker containers"
    exit 1
fi

log_success "Docker containers started"

# Step 5: Wait for services to be ready
log_step "Waiting for services to be ready..."

# Wait for Obsidian container to be healthy
echo "⏳ Waiting for Obsidian container health check..."
for i in {1..60}; do
    if docker-compose -f docker-compose.e2e.yml ps | grep -q "healthy"; then
        log_success "Obsidian container is healthy"
        break
    fi
    
    if [ $i -eq 60 ]; then
        log_error "Obsidian container health check timeout"
        docker-compose -f docker-compose.e2e.yml logs obsidian-e2e
        exit 1
    fi
    
    echo "  Attempt $i/60..."
    sleep 2
done

# Additional wait for full initialization
log_step "Waiting for full Obsidian initialization..."
sleep 10

# Verify HTTP response
if ! curl -f -s http://localhost:8084 > /dev/null; then
    log_error "Obsidian container not responding on http://localhost:8084"
    exit 1
fi

log_success "Services are ready"

# Step 6: Install test dependencies
log_step "Installing test dependencies..."

if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        log_error "Failed to install test dependencies"
        exit 1
    fi
fi

log_success "Test dependencies installed"

# Step 7: Run real plugin functionality tests
log_step "Running REAL plugin functionality tests..."
echo ""

node real-plugin-test.js
REAL_TEST_EXIT_CODE=$?

if [ $REAL_TEST_EXIT_CODE -eq 0 ]; then
    log_success "Real plugin tests PASSED!"
else
    log_error "Real plugin tests FAILED!"
fi

# Step 8: Run negative tests (verify test infrastructure catches problems)
log_step "Running negative tests to verify test infrastructure..."
echo ""
log_warning "Note: These tests intentionally break the plugin to verify our tests catch problems"

node broken-plugin-test.js
NEGATIVE_TEST_EXIT_CODE=$?

if [ $NEGATIVE_TEST_EXIT_CODE -eq 0 ]; then
    log_success "Negative tests PASSED - test infrastructure works correctly!"
else
    log_error "Negative tests FAILED - test infrastructure is not working!"
fi

# Step 9: Generate final report
log_step "Generating final report..."

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    FINAL TEST RESULTS                    ║"  
echo "╠══════════════════════════════════════════════════════════╣"

if [ $REAL_TEST_EXIT_CODE -eq 0 ]; then
    echo -e "║ Real Plugin Tests:     ${GREEN}✅ PASSED${NC}                        ║"
else
    echo -e "║ Real Plugin Tests:     ${RED}❌ FAILED${NC}                        ║"
fi

if [ $NEGATIVE_TEST_EXIT_CODE -eq 0 ]; then
    echo -e "║ Negative Tests:        ${GREEN}✅ PASSED${NC}                        ║"
else
    echo -e "║ Negative Tests:        ${RED}❌ FAILED${NC}                        ║"
fi

echo "╠══════════════════════════════════════════════════════════╣"

if [ $REAL_TEST_EXIT_CODE -eq 0 ] && [ $NEGATIVE_TEST_EXIT_CODE -eq 0 ]; then
    echo -e "║ Overall Result:        ${GREEN}🎉 SUCCESS${NC}                       ║"
    echo "║                                                          ║"
    echo "║ 🔥 Plugin works correctly in Docker environment!        ║"
    echo "║ 🎯 Test infrastructure catches broken plugins!          ║"
    FINAL_EXIT_CODE=0
else
    echo -e "║ Overall Result:        ${RED}💥 FAILURE${NC}                       ║"
    echo "║                                                          ║"
    if [ $REAL_TEST_EXIT_CODE -ne 0 ]; then
        echo "║ 🚨 Plugin has functionality issues!                     ║"
    fi
    if [ $NEGATIVE_TEST_EXIT_CODE -ne 0 ]; then
        echo "║ 🚨 Test infrastructure is not working correctly!        ║"
    fi
    FINAL_EXIT_CODE=1
fi

echo "╚══════════════════════════════════════════════════════════╝"

# Step 10: Provide next steps
echo ""
log_step "Next steps and resources:"
echo ""
echo "📁 Test Results:"
echo "   - Screenshots: $(pwd)/test-results/real-plugin-screenshots/"
echo "   - Logs: Check Docker container logs if needed"
echo ""
echo "🔍 Debugging:"
echo "   - View Obsidian: http://localhost:8084"
echo "   - Check container: docker logs obsidian-e2e-test"
echo "   - Container shell: docker exec -it obsidian-e2e-test /bin/bash"
echo ""
echo "🧹 Cleanup:"
echo "   - Stop containers: docker-compose -f docker-compose.e2e.yml down"
echo ""

if [ $FINAL_EXIT_CODE -eq 0 ]; then
    log_success "🎯 ALL TESTS COMPLETED SUCCESSFULLY!"
    echo "🔥 The fake tests have been replaced with real plugin functionality tests!"
else
    log_error "💥 TESTS FAILED - CHECK RESULTS ABOVE"
    echo "🔍 Review the test output and screenshots for debugging information"
fi

exit $FINAL_EXIT_CODE