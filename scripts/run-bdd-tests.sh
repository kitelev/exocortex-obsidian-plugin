#!/bin/bash

# BDD Test Runner for Exocortex Plugin
# Executes Cucumber tests with various configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPORTS_DIR="reports/bdd"
FEATURES_DIR="features"

# Print colored message
print_message() {
    echo -e "${2}${1}${NC}"
}

# Clean reports directory
clean_reports() {
    print_message "🧹 Cleaning reports directory..." "$YELLOW"
    rm -rf $REPORTS_DIR
    mkdir -p $REPORTS_DIR
}

# Run smoke tests
run_smoke_tests() {
    print_message "\n🔥 Running smoke tests..." "$BLUE"
    npx cucumber-js --profile smoke || true
}

# Run security tests
run_security_tests() {
    print_message "\n🔒 Running security tests..." "$BLUE"
    npx cucumber-js --profile security || true
}

# Run API tests
run_api_tests() {
    print_message "\n🌐 Running API tests..." "$BLUE"
    npx cucumber-js --profile api || true
}

# Run all tests
run_all_tests() {
    print_message "\n🚀 Running all BDD tests..." "$GREEN"
    npx cucumber-js || true
}

# Generate HTML report
generate_report() {
    print_message "\n📊 Generating HTML report..." "$YELLOW"
    
    if [ -f "$REPORTS_DIR/cucumber-report.json" ]; then
        node -e "
        const reporter = require('cucumber-html-reporter');
        const options = {
            theme: 'bootstrap',
            jsonFile: '$REPORTS_DIR/cucumber-report.json',
            output: '$REPORTS_DIR/cucumber-report.html',
            reportSuiteAsScenarios: true,
            scenarioTimestamp: true,
            launchReport: false,
            metadata: {
                'App Version': '3.17.1',
                'Test Environment': 'Local',
                'Browser': 'N/A',
                'Platform': process.platform,
                'Executed': new Date().toISOString()
            }
        };
        reporter.generate(options);
        " || true
        
        print_message "✅ Report generated: $REPORTS_DIR/cucumber-report.html" "$GREEN"
    else
        print_message "⚠️  No test results found to generate report" "$YELLOW"
    fi
}

# Print test summary
print_summary() {
    print_message "\n📈 Test Summary" "$GREEN"
    print_message "═══════════════════════════════════════" "$GREEN"
    
    if [ -f "$REPORTS_DIR/cucumber-report.json" ]; then
        node -e "
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('$REPORTS_DIR/cucumber-report.json', 'utf8'));
        
        let scenarios = 0, passed = 0, failed = 0, skipped = 0;
        
        report.forEach(feature => {
            feature.elements?.forEach(scenario => {
                scenarios++;
                const status = scenario.steps?.every(s => s.result?.status === 'passed') ? 'passed' :
                              scenario.steps?.some(s => s.result?.status === 'failed') ? 'failed' : 'skipped';
                if (status === 'passed') passed++;
                else if (status === 'failed') failed++;
                else skipped++;
            });
        });
        
        console.log('Total Scenarios:', scenarios);
        console.log('✅ Passed:', passed);
        console.log('❌ Failed:', failed);
        console.log('⏭️  Skipped:', skipped);
        console.log('Success Rate:', scenarios > 0 ? ((passed/scenarios)*100).toFixed(1) + '%' : 'N/A');
        " || true
    else
        print_message "No test results to summarize" "$YELLOW"
    fi
    
    print_message "═══════════════════════════════════════" "$GREEN"
}

# Main execution
main() {
    print_message "🎯 Exocortex BDD Test Runner" "$GREEN"
    print_message "════════════════════════════════════════" "$GREEN"
    
    # Parse command line arguments
    TEST_TYPE=${1:-all}
    
    # Clean previous reports
    clean_reports
    
    # Run tests based on type
    case $TEST_TYPE in
        smoke)
            run_smoke_tests
            ;;
        security)
            run_security_tests
            ;;
        api)
            run_api_tests
            ;;
        all)
            run_all_tests
            ;;
        *)
            print_message "Usage: $0 [smoke|security|api|all]" "$RED"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_report
    
    # Print summary
    print_summary
    
    print_message "\n✨ BDD tests completed!" "$GREEN"
}

# Run main function
main "$@"