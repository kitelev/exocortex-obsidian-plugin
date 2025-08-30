#!/bin/bash

# Exocortex E2E Test Stability Validator
# Runs E2E tests 5 consecutive times to ensure stability
# Exit code 0 only if all 5 runs pass

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RUNS=5
TEST_TIMEOUT=900 # 15 minutes per run
TOTAL_TIMEOUT=4500 # 75 minutes total
LOG_DIR="./tests/e2e/docker/test-results/stability-logs"
SCREENSHOT_DIR="./tests/e2e/docker/test-results/screenshots"
CURRENT_DIR=$(pwd)

# Ensure log directories exist
mkdir -p "${LOG_DIR}"
mkdir -p "${SCREENSHOT_DIR}"

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error_log() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success_log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning_log() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to cleanup Docker containers
cleanup_containers() {
    log "Cleaning up Docker containers..."
    
    # Stop and remove containers
    docker-compose -f tests/e2e/docker/docker-compose.e2e.yml down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove dangling containers
    docker container prune -f 2>/dev/null || true
    
    # Wait for cleanup
    sleep 2
}

# Function to wait for services to be ready
wait_for_services() {
    local max_attempts=60
    local attempt=1
    
    log "Waiting for services to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if docker-compose -f tests/e2e/docker/docker-compose.e2e.yml ps | grep -q "healthy"; then
            success_log "Services are healthy!"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error_log "Services failed to become healthy within timeout"
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Function to run single E2E test
run_single_test() {
    local run_number=$1
    local run_log="${LOG_DIR}/run-${run_number}.log"
    local start_time=$(date +%s)
    
    log "Starting E2E test run ${run_number}/${RUNS}"
    
    # Start services
    log "Starting Docker services for run ${run_number}..."
    if ! docker-compose -f tests/e2e/docker/docker-compose.e2e.yml up -d --build > "${run_log}" 2>&1; then
        error_log "Failed to start Docker services for run ${run_number}"
        return 1
    fi
    
    # Wait for services
    if ! wait_for_services >> "${run_log}" 2>&1; then
        error_log "Services failed to start properly for run ${run_number}"
        cleanup_containers
        return 1
    fi
    
    # Run tests with timeout
    log "Executing E2E tests for run ${run_number}..."
    
    if timeout ${TEST_TIMEOUT} docker-compose -f tests/e2e/docker/docker-compose.e2e.yml exec -T test-runner npm run test:e2e:docker >> "${run_log}" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        success_log "Run ${run_number} PASSED in ${duration}s"
        
        # Copy test artifacts
        docker cp "$(docker-compose -f tests/e2e/docker/docker-compose.e2e.yml ps -q test-runner):/test-results/." "${LOG_DIR}/run-${run_number}-results/" 2>/dev/null || true
        
        cleanup_containers
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        error_log "Run ${run_number} FAILED after ${duration}s"
        
        # Capture failure artifacts
        docker-compose -f tests/e2e/docker/docker-compose.e2e.yml logs > "${LOG_DIR}/run-${run_number}-docker.log" 2>&1 || true
        docker cp "$(docker-compose -f tests/e2e/docker/docker-compose.e2e.yml ps -q test-runner):/test-results/." "${LOG_DIR}/run-${run_number}-failed/" 2>/dev/null || true
        docker cp "$(docker-compose -f tests/e2e/docker/docker-compose.e2e.yml ps -q test-runner):/wdio-logs/." "${LOG_DIR}/run-${run_number}-wdio/" 2>/dev/null || true
        
        cleanup_containers
        return 1
    fi
}

# Function to generate stability report
generate_report() {
    local passed_runs=$1
    local failed_runs=$2
    local report_file="${LOG_DIR}/stability-report.json"
    local total_time=$3
    
    cat > "${report_file}" << EOF
{
  "stability_test": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_runs": ${RUNS},
    "passed_runs": ${passed_runs},
    "failed_runs": ${failed_runs},
    "success_rate": $(( passed_runs * 100 / RUNS )),
    "total_duration_seconds": ${total_time},
    "average_duration_seconds": $(( total_time / RUNS )),
    "stability": $([ $failed_runs -eq 0 ] && echo "\"STABLE\"" || echo "\"UNSTABLE\"")
  },
  "run_details": [
EOF

    # Add details for each run
    for ((i=1; i<=RUNS; i++)); do
        local run_log="${LOG_DIR}/run-${i}.log"
        local status="FAILED"
        local duration=0
        
        if [ -f "${run_log}" ]; then
            # Extract status and duration from log (simplified)
            if grep -q "PASSED" "${run_log}"; then
                status="PASSED"
            fi
        fi
        
        cat >> "${report_file}" << EOF
    {
      "run_number": ${i},
      "status": "${status}",
      "log_file": "run-${i}.log"
    }$([ $i -lt $RUNS ] && echo "," || echo "")
EOF
    done

    cat >> "${report_file}" << EOF
  ]
}
EOF

    log "Stability report generated: ${report_file}"
}

# Main execution
main() {
    local start_time=$(date +%s)
    local passed_runs=0
    local failed_runs=0
    
    log "Starting Exocortex E2E Stability Test - ${RUNS} consecutive runs"
    log "Logs directory: ${LOG_DIR}"
    log "Screenshots directory: ${SCREENSHOT_DIR}"
    
    # Pre-flight checks
    if ! command -v docker &> /dev/null; then
        error_log "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error_log "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error_log "Docker is not running"
        exit 1
    fi
    
    # Initial cleanup
    cleanup_containers
    
    # Run tests
    for ((run=1; run<=RUNS; run++)); do
        if run_single_test $run; then
            ((passed_runs++))
        else
            ((failed_runs++))
        fi
        
        # Brief pause between runs
        if [ $run -lt $RUNS ]; then
            log "Pausing 10 seconds before next run..."
            sleep 10
        fi
    done
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    # Generate report
    generate_report $passed_runs $failed_runs $total_time
    
    # Final summary
    echo
    log "========================================"
    log "E2E STABILITY TEST SUMMARY"
    log "========================================"
    log "Total runs: ${RUNS}"
    log "Passed: ${GREEN}${passed_runs}${NC}"
    log "Failed: ${RED}${failed_runs}${NC}"
    log "Success rate: $(( passed_runs * 100 / RUNS ))%"
    log "Total time: ${total_time}s ($(( total_time / 60 ))m $(( total_time % 60 ))s)"
    log "========================================"
    
    if [ $failed_runs -eq 0 ]; then
        success_log "🎉 ALL TESTS STABLE - E2E test suite is reliable!"
        exit 0
    else
        error_log "❌ INSTABILITY DETECTED - ${failed_runs}/${RUNS} runs failed"
        error_log "Check logs in ${LOG_DIR} for failure details"
        exit 1
    fi
}

# Handle script interruption
trap 'error_log "Script interrupted"; cleanup_containers; exit 130' INT TERM

# Ensure we're in the project directory
if [ ! -f "package.json" ] || [ ! -d "tests/e2e" ]; then
    error_log "Please run this script from the project root directory"
    exit 1
fi

# Run main function
main "$@"