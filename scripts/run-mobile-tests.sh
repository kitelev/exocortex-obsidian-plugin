#!/bin/bash
# Mobile Test Runner
# Runs tests with mobile environment configuration

set -e

echo "🧪 Running Mobile Tests for Exocortex Obsidian Plugin"
echo "=================================================="

# Set mobile test environment
export TEST_PLATFORM="mobile"
export NODE_ENV="test"

# Function to run tests for a specific platform
run_platform_tests() {
    local platform=$1
    local description=$2
    
    echo ""
    echo "📱 Testing $description ($platform)"
    echo "----------------------------------------"
    
    export TEST_PLATFORM="$platform"
    
    # Run mobile-specific tests
    npx jest \
        --testNamePattern="(Mobile|Touch|Platform|Performance|Battery|Gesture)" \
        --testPathPatterns="(mobile|touch|platform)" \
        --verbose \
        --coverage=false \
        --maxWorkers=2 \
        --testTimeout=30000
}

# Function to run specific mobile test suites
run_test_suite() {
    local suite=$1
    local pattern=$2
    
    echo ""
    echo "🔧 Testing $suite"
    echo "----------------------------------------"
    
    npx jest \
        --testNamePattern="$pattern" \
        --verbose \
        --coverage=false \
        --maxWorkers=2
}

# Parse command line arguments
case "${1:-all}" in
    "ios")
        export TEST_PLATFORM="ios"
        run_platform_tests "ios" "iOS Environment"
        ;;
    "android")
        export TEST_PLATFORM="android"
        run_platform_tests "android" "Android Environment"
        ;;
    "tablet")
        export TEST_PLATFORM="tablet"
        run_platform_tests "tablet" "Tablet Environment"
        ;;
    "touch")
        run_test_suite "Touch Controllers" "Touch.*Controller"
        ;;
    "performance")
        run_test_suite "Performance Optimization" "Performance.*Optim"
        ;;
    "gestures")
        run_test_suite "Gesture Recognition" "(Gesture|Pinch|Pan|Tap)"
        ;;
    "integration")
        run_test_suite "Mobile Integration" "MobileIntegration"
        ;;
    "all")
        echo "Running all mobile test scenarios..."
        
        # Test all platforms
        run_platform_tests "ios" "iOS Environment"
        run_platform_tests "android" "Android Environment"
        run_platform_tests "tablet" "Tablet Environment"
        
        # Test specific components
        run_test_suite "Touch Controllers" "TouchGraphController"
        run_test_suite "Mobile UI Components" "MobileUI"
        run_test_suite "Mobile Modal Adapter" "MobileModalAdapter"
        run_test_suite "Performance Optimization" "MobilePerformanceOptimizer"
        run_test_suite "Mobile Integration" "MobileIntegrationAdvanced"
        
        echo ""
        echo "✅ All mobile tests completed!"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  all           Run all mobile tests (default)"
        echo "  ios           Run iOS-specific tests"
        echo "  android       Run Android-specific tests"
        echo "  tablet        Run tablet-specific tests"
        echo "  touch         Run touch controller tests"
        echo "  performance   Run performance optimization tests"
        echo "  gestures      Run gesture recognition tests"
        echo "  integration   Run mobile integration tests"
        echo "  help          Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0              # Run all mobile tests"
        echo "  $0 ios          # Run only iOS tests"
        echo "  $0 touch        # Run only touch controller tests"
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo "Use '$0 help' for available options"
        exit 1
        ;;
esac

echo ""
echo "🏁 Mobile testing complete!"