#!/bin/bash
# Docker E2E Test Runner for CreateAssetModal property display functionality
# Provides comprehensive testing infrastructure with performance monitoring

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
TEST_OUTPUT_DIR="${PROJECT_DIR}/test-results"
SCREENSHOTS_DIR="${PROJECT_DIR}/screenshots"
LOGS_DIR="${PROJECT_DIR}/wdio-logs"
TEST_VAULT_DIR="${PROJECT_DIR}/test-vault"
DOCKER_COMPOSE_FILE="${PROJECT_DIR}/docker-compose.e2e.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans --volumes 2>/dev/null || true
    
    # Clean up dangling images
    docker image prune -f 2>/dev/null || true
    
    # Clean up networks
    docker network prune -f 2>/dev/null || true
    
    log_success "Docker cleanup completed"
}

# Set trap for cleanup on exit
trap cleanup EXIT SIGINT SIGTERM

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is required but not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Docker Compose file
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Function to prepare test environment
prepare_test_environment() {
    log_info "Preparing test environment..."
    
    # Create output directories
    mkdir -p "$TEST_OUTPUT_DIR" "$SCREENSHOTS_DIR" "$LOGS_DIR" "$TEST_VAULT_DIR"
    
    # Clean previous test results
    rm -rf "${TEST_OUTPUT_DIR}"/* "${SCREENSHOTS_DIR}"/* "${LOGS_DIR}"/* 2>/dev/null || true
    
    # Set permissions
    chmod -R 755 "$TEST_OUTPUT_DIR" "$SCREENSHOTS_DIR" "$LOGS_DIR" "$TEST_VAULT_DIR" 2>/dev/null || true
    
    log_success "Test environment prepared"
}

# Function to build Docker images
build_docker_images() {
    log_info "Building Docker images..."
    
    # Build with no cache to ensure latest changes
    if [ "${FORCE_REBUILD:-false}" = "true" ]; then
        log_warning "Force rebuild enabled - this may take longer"
        docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    else
        docker-compose -f "$DOCKER_COMPOSE_FILE" build
    fi
    
    log_success "Docker images built successfully"
}

# Function to validate Docker Compose configuration
validate_compose_config() {
    log_info "Validating Docker Compose configuration..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" config -q; then
        log_success "Docker Compose configuration is valid"
    else
        log_error "Docker Compose configuration is invalid"
        exit 1
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    log_info "Starting E2E tests for CreateAssetModal property display..."
    
    # Set test environment variables
    export CI=true
    export HEADLESS=true
    export NODE_ENV=test
    export FORCE_OBSIDIAN_DOWNLOAD=true
    
    # Performance monitoring settings
    export PERFORMANCE_MONITORING=true
    export MEMORY_THRESHOLD_MB=25
    export PROPERTY_LOAD_TIMEOUT_MS=2000
    
    # Start services in background
    log_info "Starting Docker services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "exocortex-modal-e2e.*healthy"; then
            break
        fi
        
        log_info "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Services failed to become ready within timeout"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs
        exit 1
    fi
    
    log_success "Services are ready"
    
    # Run the E2E tests
    log_info "Executing E2E test suite..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm exocortex-e2e-modal modal; then
        log_success "E2E tests completed successfully"
        TEST_EXIT_CODE=0
    else
        log_error "E2E tests failed"
        TEST_EXIT_CODE=1
    fi
    
    # Create completion marker
    touch "${TEST_OUTPUT_DIR}/e2e-complete"
    
    return $TEST_EXIT_CODE
}

# Function to collect test results
collect_test_results() {
    log_info "Collecting test results..."
    
    # Copy results from containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs exocortex-e2e-modal > "${LOGS_DIR}/e2e-execution.log" 2>&1 || true
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs performance-monitor > "${LOGS_DIR}/performance-monitor.log" 2>&1 || true
    
    # Generate summary report
    cat > "${TEST_OUTPUT_DIR}/e2e-summary.md" << EOF
# CreateAssetModal E2E Test Results

## Test Execution Summary

**Execution Time:** $(date)
**Test Suite:** Modal Property Display Functionality
**Environment:** Docker-based E2E Testing

## Results

EOF
    
    # Add test results if available
    if [ -f "${LOGS_DIR}/wdio-0-0-json-reporter.json" ]; then
        node -e "
            const fs = require('fs');
            try {
                const report = JSON.parse(fs.readFileSync('${LOGS_DIR}/wdio-0-0-json-reporter.json', 'utf8'));
                console.log('\\n### Test Statistics');
                console.log('- **Total Tests:** ' + report.stats.tests);
                console.log('- **Passed:** ' + report.stats.passes);
                console.log('- **Failed:** ' + report.stats.failures);
                console.log('- **Duration:** ' + Math.round((report.stats.end - report.stats.start) / 1000) + ' seconds');
            } catch (error) {
                console.log('\\n### Test Statistics');
                console.log('- Test report parsing failed: ' + error.message);
            }
        " >> "${TEST_OUTPUT_DIR}/e2e-summary.md"
    fi
    
    # Add performance metrics if available
    if [ -f "${LOGS_DIR}/performance-monitor.log" ]; then
        echo "\n### Performance Metrics\n" >> "${TEST_OUTPUT_DIR}/e2e-summary.md"
        echo '```' >> "${TEST_OUTPUT_DIR}/e2e-summary.md"
        tail -10 "${LOGS_DIR}/performance-monitor.log" >> "${TEST_OUTPUT_DIR}/e2e-summary.md" || true
        echo '```' >> "${TEST_OUTPUT_DIR}/e2e-summary.md"
    fi
    
    # Count screenshots
    local screenshot_count=$(find "$SCREENSHOTS_DIR" -name "*.png" -o -name "*.jpg" 2>/dev/null | wc -l || echo "0")
    echo "\n### Artifacts Generated\n" >> "${TEST_OUTPUT_DIR}/e2e-summary.md"
    echo "- **Screenshots:** $screenshot_count files" >> "${TEST_OUTPUT_DIR}/e2e-summary.md"
    echo "- **Log Files:** $(find "$LOGS_DIR" -name "*.log" 2>/dev/null | wc -l || echo "0") files" >> "${TEST_OUTPUT_DIR}/e2e-summary.md"
    
    log_success "Test results collected in $TEST_OUTPUT_DIR"
}

# Function to display results summary
display_results_summary() {
    log_info "Test Results Summary:"
    
    if [ -f "${TEST_OUTPUT_DIR}/e2e-summary.md" ]; then
        echo "\n$(cat "${TEST_OUTPUT_DIR}/e2e-summary.md")"
    fi
    
    echo "\n📁 Results Location: $TEST_OUTPUT_DIR"
    echo "📸 Screenshots: $SCREENSHOTS_DIR"
    echo "📋 Logs: $LOGS_DIR"
    
    if [ -f "${TEST_OUTPUT_DIR}/wdio-0-0-json-reporter.json" ]; then
        echo "📊 Detailed Report: ${TEST_OUTPUT_DIR}/wdio-0-0-json-reporter.json"
    fi
}

# Main execution function
main() {
    local test_type="${1:-all}"
    
    log_info "🚀 Starting Docker E2E Tests for CreateAssetModal"
    log_info "Test Type: $test_type"
    log_info "Project Directory: $PROJECT_DIR"
    
    # Execute test pipeline
    check_prerequisites
    prepare_test_environment
    validate_compose_config
    build_docker_images
    
    # Run tests and capture exit code
    local test_exit_code=0
    if ! run_e2e_tests; then
        test_exit_code=1
    fi
    
    # Always collect results, even on failure
    collect_test_results
    display_results_summary
    
    # Final status
    if [ $test_exit_code -eq 0 ]; then
        log_success "🎉 All E2E tests passed successfully!"
    else
        log_error "❌ E2E tests failed. Check logs for details."
    fi
    
    exit $test_exit_code
}

# Help function
show_help() {
    echo "Usage: $0 [test-type] [options]"
    echo ""
    echo "Test Types:"
    echo "  all        Run all E2E tests (default)"
    echo "  modal      Run only modal property tests"
    echo "  smoke      Run smoke tests only"
    echo "  performance Run performance tests only"
    echo ""
    echo "Environment Variables:"
    echo "  FORCE_REBUILD=true     Force rebuild Docker images"
    echo "  PERFORMANCE_MONITORING=true  Enable performance monitoring"
    echo "  MEMORY_THRESHOLD_MB=25       Memory usage threshold"
    echo "  PROPERTY_LOAD_TIMEOUT_MS=2000 Property loading timeout"
    echo ""
    echo "Examples:"
    echo "  $0                     # Run all tests"
    echo "  $0 modal               # Run modal tests only"
    echo "  FORCE_REBUILD=true $0  # Force rebuild and run tests"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    "")
        main "all"
        ;;
    *)
        main "$1"
        ;;
esac
