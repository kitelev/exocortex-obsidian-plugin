#!/bin/bash
# Docker UI Test Runner Script
# Provides easy interface for running containerized Obsidian UI tests

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.ui-test.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_PROFILE="ui-tests"
TEST_OUTPUT_DIR="$PROJECT_ROOT/test-output"
CLEANUP_ON_EXIT=true
VERBOSE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
🐳 Docker UI Test Runner for Exocortex Plugin

USAGE:
    $0 [OPTIONS] [COMMAND]

COMMANDS:
    run [SUITE]     Run UI test suite (default: all)
                    Suites: all, basic, sparql, ui
    dev             Start interactive development environment
    ci              Run tests in CI mode with optimizations
    clean           Clean up test artifacts and containers
    logs [SERVICE]  Show logs from specific service
    status          Show running containers status
    build           Build test containers without running
    debug           Run tests with debug output enabled

TEST SUITES:
    all             Complete UI test suite (default)
    basic           Quick validation tests (plugin activation)
    sparql          SPARQL processing functionality tests
    ui              Full UI interaction tests

OPTIONS:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose output
    -k, --keep      Keep containers running after tests
    -o, --output    Custom output directory (default: ./test-output)
    -t, --timeout   Test timeout in seconds (default: 300)
    -p, --profile   Docker compose profile (default: ui-tests)
    --no-cleanup    Don't cleanup containers on exit
    --headed        Run tests in headed mode (with display)
    --build         Force rebuild containers

EXAMPLES:
    # Run complete UI test suite
    $0 run

    # Run only basic validation tests
    $0 run basic

    # Start development environment for debugging
    $0 dev

    # Run tests with verbose output
    $0 -v run sparql

    # Run CI tests with custom timeout
    $0 -t 180 ci

    # Clean up everything
    $0 clean

    # View logs from main test runner
    $0 logs ui-test-runner

ENVIRONMENT VARIABLES:
    DOCKER_BUILDKIT     Enable Docker BuildKit (default: 1)
    COMPOSE_PARALLEL    Parallel container startup (default: true)
    TEST_TIMEOUT        Global test timeout (default: 300)
    HEADLESS            Run in headless mode (default: true)

EOF
}

# Function to cleanup on exit
cleanup() {
    if [ "$CLEANUP_ON_EXIT" = true ]; then
        print_status "Cleaning up containers and networks..."
        docker-compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
        print_success "Cleanup completed"
    fi
}

# Function to setup test environment
setup_test_environment() {
    # Create output directories
    mkdir -p "$TEST_OUTPUT_DIR"/{ui-results,screenshots,wdio-logs,coverage,basic,sparql,ci,performance}
    
    # Set permissions
    chmod -R 755 "$TEST_OUTPUT_DIR" 2>/dev/null || true
    
    # Verify Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "docker-compose is not installed or not in PATH"
        exit 1
    fi
    
    # Verify compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    print_success "Test environment setup completed"
}

# Function to build containers
build_containers() {
    local force_build=$1
    
    print_status "Building UI test containers..."
    
    if [ "$force_build" = true ]; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache --pull
    else
        docker-compose -f "$COMPOSE_FILE" build
    fi
    
    print_success "Container build completed"
}

# Function to run tests
run_tests() {
    local test_suite=${1:-all}
    local profile=${2:-$DEFAULT_PROFILE}
    
    print_status "Starting UI tests for suite: $test_suite"
    print_status "Using profile: $profile"
    
    # Set test environment variables
    export COMPOSE_PROJECT_NAME="exocortex-ui-test"
    export DOCKER_BUILDKIT=1
    
    case $test_suite in
        "all")
            docker-compose -f "$COMPOSE_FILE" --profile "$profile" up --build --exit-code-from ui-test-runner
            ;;
        "basic")
            docker-compose -f "$COMPOSE_FILE" --profile basic-tests up --build --exit-code-from ui-test-basic
            ;;
        "sparql")
            docker-compose -f "$COMPOSE_FILE" --profile feature-tests up --build --exit-code-from ui-test-sparql
            ;;
        "ui")
            docker-compose -f "$COMPOSE_FILE" --profile ui-tests up --build --exit-code-from ui-test-runner
            ;;
        *)
            print_error "Unknown test suite: $test_suite"
            print_status "Available suites: all, basic, sparql, ui"
            exit 1
            ;;
    esac
}

# Function to run development environment
run_dev_environment() {
    print_status "Starting interactive development environment..."
    print_status "Access the container with: docker exec -it \$(docker-compose -f $COMPOSE_FILE ps -q ui-test-dev) /bin/bash"
    
    docker-compose -f "$COMPOSE_FILE" --profile development up --build ui-test-dev
}

# Function to run CI tests
run_ci_tests() {
    print_status "Running tests in CI mode..."
    
    export CI=true
    export HEADLESS=true
    export NO_SANDBOX=true
    
    docker-compose -f "$COMPOSE_FILE" --profile ci up --build --exit-code-from ui-test-ci
}

# Function to show container status
show_status() {
    print_status "Container status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    print_status "\nNetwork status:"
    docker network ls | grep ui-test || true
    
    if [ -d "$TEST_OUTPUT_DIR" ]; then
        print_status "\nTest output directory contents:"
        ls -la "$TEST_OUTPUT_DIR"
    fi
}

# Function to show logs
show_logs() {
    local service=${1:-ui-test-runner}
    
    print_status "Showing logs for service: $service"
    docker-compose -f "$COMPOSE_FILE" logs -f "$service"
}

# Function to clean up
clean_up() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans --volumes 2>/dev/null || true
    
    # Remove unused images
    docker image prune -f --filter "label=com.docker.compose.project=exocortex-ui-test" 2>/dev/null || true
    
    # Clean up test output (optional)
    if [ "$1" = "--all" ]; then
        print_status "Removing test output directory..."
        rm -rf "$TEST_OUTPUT_DIR" 2>/dev/null || true
    fi
    
    print_success "Cleanup completed"
}

# Function to run debug mode
run_debug() {
    print_status "Starting debug mode..."
    
    export DEBUG=true
    export VERBOSE=true
    export NODE_OPTIONS="--inspect=0.0.0.0:9229"
    
    docker-compose -f "$COMPOSE_FILE" --profile debug up --build ui-test-dev
}

# Parse command line arguments
COMMAND=""
TEST_SUITE="all"
FORCE_BUILD=false
TIMEOUT=300

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            export DEBUG=true
            shift
            ;;
        -k|--keep)
            CLEANUP_ON_EXIT=false
            shift
            ;;
        -o|--output)
            TEST_OUTPUT_DIR="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            export TEST_TIMEOUT="$2"
            shift 2
            ;;
        -p|--profile)
            DEFAULT_PROFILE="$2"
            shift 2
            ;;
        --no-cleanup)
            CLEANUP_ON_EXIT=false
            shift
            ;;
        --headed)
            export HEADLESS=false
            shift
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        run|dev|ci|clean|logs|status|build|debug)
            COMMAND="$1"
            shift
            ;;
        *)
            if [ -z "$COMMAND" ]; then
                COMMAND="run"
                TEST_SUITE="$1"
            elif [ "$COMMAND" = "run" ] && [ -z "$TEST_SUITE" ]; then
                TEST_SUITE="$1"
            elif [ "$COMMAND" = "logs" ]; then
                SERVICE="$1"
            fi
            shift
            ;;
    esac
done

# Set default command if none provided
if [ -z "$COMMAND" ]; then
    COMMAND="run"
fi

# Set trap for cleanup on exit
trap cleanup EXIT SIGINT SIGTERM

# Change to project root
cd "$PROJECT_ROOT"

# Main execution logic
case $COMMAND in
    "run")
        setup_test_environment
        if [ "$FORCE_BUILD" = true ]; then
            build_containers true
        fi
        run_tests "$TEST_SUITE" "$DEFAULT_PROFILE"
        ;;
    "dev")
        setup_test_environment
        CLEANUP_ON_EXIT=false  # Keep dev environment running
        run_dev_environment
        ;;
    "ci")
        setup_test_environment
        run_ci_tests
        ;;
    "build")
        build_containers "$FORCE_BUILD"
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$SERVICE"
        ;;
    "clean")
        clean_up "$2"
        ;;
    "debug")
        setup_test_environment
        CLEANUP_ON_EXIT=false
        run_debug
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac

print_success "Docker UI test operation completed!"