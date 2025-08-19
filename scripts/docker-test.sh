#!/bin/bash
# Docker Testing Script for Exocortex Obsidian Plugin
# Provides convenient commands for running tests in Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="exocortex-plugin"

# Helper functions
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check if docker-compose is available
check_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        if ! docker compose version > /dev/null 2>&1; then
            print_error "docker-compose is not available. Please install Docker Compose."
            exit 1
        fi
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
}

# Clean up containers and volumes
cleanup() {
    print_header "Cleaning up Docker resources"
    $COMPOSE_CMD --project-name $PROJECT_NAME down --volumes --remove-orphans
    docker system prune -f --filter "label=project=$PROJECT_NAME"
    print_success "Cleanup completed"
}

# Build test images
build() {
    print_header "Building Docker images"
    $COMPOSE_CMD --project-name $PROJECT_NAME build --no-cache
    print_success "Build completed"
}

# Run unit and integration tests
test_unit() {
    print_header "Running Unit and Integration Tests"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile test up --abort-on-container-exit test
    print_success "Unit and integration tests completed"
}

# Run UI tests
test_ui() {
    print_header "Running UI Tests"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile ui up --abort-on-container-exit ui-test
    print_success "UI tests completed"
}

# Run mobile tests
test_mobile() {
    print_header "Running Mobile Tests"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile mobile up --abort-on-container-exit mobile-test
    print_success "Mobile tests completed"
}

# Run all tests
test_all() {
    print_header "Running All Tests"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile all up --abort-on-container-exit
    print_success "All tests completed"
}

# Run CI pipeline
test_ci() {
    print_header "Running CI Pipeline"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile ci up --abort-on-container-exit ci
    print_success "CI pipeline completed"
}

# Run matrix tests (multiple Node.js versions)
test_matrix() {
    print_header "Running Matrix Tests (Node.js 18 & 20)"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile matrix up --abort-on-container-exit test-node18 test-node20
    print_success "Matrix tests completed"
}

# Run performance tests
test_performance() {
    print_header "Running Performance Tests"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile performance up --abort-on-container-exit perf-test
    print_success "Performance tests completed"
}

# Run security tests
test_security() {
    print_header "Running Security Tests"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile security up --abort-on-container-exit security-test
    print_success "Security tests completed"
}

# Generate and serve coverage report
coverage() {
    print_header "Generating Coverage Report"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile coverage up coverage
    print_warning "Coverage report will be available at http://localhost:8080"
    print_warning "Press Ctrl+C to stop the server"
}

# Start development environment
dev() {
    print_header "Starting Development Environment"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile dev up dev
}

# Watch tests during development
watch() {
    print_header "Starting Test Watch Mode"
    $COMPOSE_CMD --project-name $PROJECT_NAME --profile watch up test-watch
}

# Show test results
results() {
    print_header "Test Results Summary"
    
    if [ -d "./coverage" ]; then
        echo "📊 Coverage Report:"
        if [ -f "./coverage/coverage-summary.json" ]; then
            node -e "
                const summary = require('./coverage/coverage-summary.json');
                console.log('  Lines: ' + summary.total.lines.pct + '%');
                console.log('  Functions: ' + summary.total.functions.pct + '%');
                console.log('  Branches: ' + summary.total.branches.pct + '%');
                console.log('  Statements: ' + summary.total.statements.pct + '%');
            "
        fi
    fi
    
    if [ -d "./test-results" ]; then
        echo "🧪 Test Results:"
        find ./test-results -name "*.xml" -o -name "*.json" | wc -l | xargs echo "  Result files:"
    fi
    
    if [ -d "./screenshots" ]; then
        echo "📸 Screenshots:"
        find ./screenshots -name "*.png" | wc -l | xargs echo "  Screenshot files:"
    fi
}

# Show help
help() {
    echo "Docker Testing Script for Exocortex Obsidian Plugin"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build           Build Docker images"
    echo "  test-unit       Run unit and integration tests"
    echo "  test-ui         Run UI tests"
    echo "  test-mobile     Run mobile-specific tests"
    echo "  test-all        Run all test suites"
    echo "  test-ci         Run complete CI pipeline"
    echo "  test-matrix     Run tests on multiple Node.js versions"
    echo "  test-perf       Run performance tests"
    echo "  test-security   Run security tests"
    echo "  coverage        Generate and serve coverage report"
    echo "  dev             Start development environment"
    echo "  watch           Start test watch mode"
    echo "  results         Show test results summary"
    echo "  cleanup         Clean up Docker resources"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build              # Build images"
    echo "  $0 test-all           # Run all tests"
    echo "  $0 test-ui            # Run only UI tests"
    echo "  $0 coverage           # Generate coverage report"
    echo "  $0 cleanup            # Clean up after testing"
    echo ""
}

# Main script logic
main() {
    check_docker
    check_compose
    
    case "${1:-help}" in
        "build")
            build
            ;;
        "test-unit")
            test_unit
            ;;
        "test-ui")
            test_ui
            ;;
        "test-mobile")
            test_mobile
            ;;
        "test-all")
            test_all
            ;;
        "test-ci")
            test_ci
            ;;
        "test-matrix")
            test_matrix
            ;;
        "test-perf"|"test-performance")
            test_performance
            ;;
        "test-security")
            test_security
            ;;
        "coverage")
            coverage
            ;;
        "dev")
            dev
            ;;
        "watch")
            watch
            ;;
        "results")
            results
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            help
            ;;
        *)
            print_error "Unknown command: $1"
            help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"