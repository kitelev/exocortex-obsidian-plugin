#!/bin/bash

##
# BDD Pre-Commit Hook
#
# This hook enforces BDD coverage requirements before allowing commits.
# It validates that:
# 1. All BDD tests pass
# 2. Coverage meets minimum threshold 
# 3. New functionality has corresponding BDD scenarios
# 4. Modified code is covered by existing or new BDD tests
##

set -e

# Configuration
MIN_COVERAGE_THRESHOLD=80
STRICT_MODE=${BDD_STRICT_MODE:-true}
VERBOSE=${BDD_VERBOSE:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_separator() {
    echo "═══════════════════════════════════════════════════════════"
}

# Main execution
main() {
    log_info "BDD Pre-Commit Hook - Validating BDD Coverage"
    log_separator

    # Check if this is a commit that should be validated
    if should_skip_validation; then
        log_warning "Skipping BDD validation (emergency commit or special case)"
        exit 0
    fi

    # Step 1: Check if there are any BDD-related changes
    if has_bdd_related_changes; then
        log_info "BDD-related changes detected, running full validation"
    else
        log_info "No BDD-related changes, checking affected code coverage"
    fi

    # Step 2: Run BDD tests
    if ! run_bdd_tests; then
        log_error "BDD tests failed - commit blocked"
        suggest_fixes_for_test_failures
        exit 1
    fi

    # Step 3: Validate coverage
    if ! validate_coverage; then
        log_error "BDD coverage below threshold - commit blocked"
        suggest_coverage_improvements
        exit 1
    fi

    # Step 4: Check for missing feature files for new functionality
    if ! check_feature_completeness; then
        log_error "New functionality detected without corresponding BDD scenarios"
        suggest_feature_file_creation
        
        if [[ "$STRICT_MODE" == "true" ]]; then
            exit 1
        else
            log_warning "Proceeding with warning (strict mode disabled)"
        fi
    fi

    # Step 5: Validate step definitions for modified scenarios
    if ! validate_step_definitions; then
        log_error "Modified scenarios have missing step definitions"
        suggest_step_implementations
        exit 1
    fi

    log_separator
    log_success "BDD validation passed - commit allowed"
    print_coverage_summary
}

# Check if validation should be skipped
should_skip_validation() {
    # Skip for emergency commits
    if git log -1 --pretty=%B | grep -qi "emergency\|hotfix\|urgent"; then
        return 0
    fi
    
    # Skip for certain file types only
    local changed_files=$(git diff --cached --name-only)
    local non_skippable_changes=false
    
    while IFS= read -r file; do
        # Skip validation only if ALL changes are in these file types
        if [[ ! "$file" =~ \.(md|yml|yaml|json|txt)$ ]]; then
            non_skippable_changes=true
            break
        fi
    done <<< "$changed_files"
    
    if [[ "$non_skippable_changes" == "false" ]]; then
        return 0  # Skip validation
    fi
    
    return 1  # Don't skip
}

# Check if there are BDD-related changes
has_bdd_related_changes() {
    local changed_files=$(git diff --cached --name-only)
    
    # Check for changes in BDD directories
    if echo "$changed_files" | grep -q "tests/bdd/\|\.feature$\|\.steps\.ts$"; then
        return 0
    fi
    
    # Check for changes in core functionality that should have BDD coverage
    if echo "$changed_files" | grep -q "src/application/use-cases/\|src/presentation/\|src/domain/entities/"; then
        return 0
    fi
    
    return 1
}

# Run BDD tests
run_bdd_tests() {
    log_info "Running BDD tests..."
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_warning "Dependencies not installed, installing..."
        npm ci --silent
    fi
    
    # Run the tests
    if [[ "$VERBOSE" == "true" ]]; then
        npm run test:bdd
    else
        npm run test:bdd > /tmp/bdd-test-output.log 2>&1
    fi
    
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        log_error "BDD tests failed with exit code $exit_code"
        
        if [[ "$VERBOSE" != "true" ]]; then
            log_info "Test output:"
            tail -20 /tmp/bdd-test-output.log
        fi
        
        return 1
    fi
    
    log_success "BDD tests passed"
    return 0
}

# Validate BDD coverage
validate_coverage() {
    log_info "Validating BDD coverage (threshold: ${MIN_COVERAGE_THRESHOLD}%)..."
    
    # Run coverage validation
    local coverage_result
    if ! coverage_result=$(node scripts/validate-bdd-coverage.js --threshold=$MIN_COVERAGE_THRESHOLD --json 2>/dev/null); then
        log_error "Coverage validation failed"
        return 1
    fi
    
    # Parse coverage percentage
    local coverage_percentage
    coverage_percentage=$(echo "$coverage_result" | grep -o '"percentage":[0-9.]*' | cut -d':' -f2)
    
    if [[ -z "$coverage_percentage" ]]; then
        log_error "Could not determine coverage percentage"
        return 1
    fi
    
    # Check if coverage meets threshold
    if (( $(echo "$coverage_percentage < $MIN_COVERAGE_THRESHOLD" | bc -l) )); then
        log_error "Coverage ${coverage_percentage}% is below threshold ${MIN_COVERAGE_THRESHOLD}%"
        return 1
    fi
    
    log_success "Coverage ${coverage_percentage}% meets threshold"
    return 0
}

# Check feature completeness for new functionality
check_feature_completeness() {
    log_info "Checking feature completeness..."
    
    local new_use_cases=$(git diff --cached --name-only | grep "src/application/use-cases/.*\.ts$" | grep -v "\.test\.ts$")
    local new_entities=$(git diff --cached --name-only | grep "src/domain/entities/.*\.ts$" | grep -v "\.test\.ts$")
    local new_renderers=$(git diff --cached --name-only | grep "src/presentation/.*Renderer.*\.ts$" | grep -v "\.test\.ts$")
    
    local missing_features=()
    
    # Check for corresponding feature files
    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            local feature_name=$(basename "$file" .ts | sed 's/UseCase$//' | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')
            local feature_file="tests/bdd/features/${feature_name}.feature"
            
            if [[ ! -f "$feature_file" ]]; then
                missing_features+=("$file -> $feature_file")
            fi
        fi
    done <<< "$new_use_cases"
    
    # Similar checks for entities and renderers
    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            local entity_name=$(basename "$file" .ts | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')
            local feature_file="tests/bdd/features/${entity_name}-management.feature"
            
            if [[ ! -f "$feature_file" ]]; then
                missing_features+=("$file -> $feature_file")
            fi
        fi
    done <<< "$new_entities"
    
    if [[ ${#missing_features[@]} -gt 0 ]]; then
        log_error "Missing feature files for new functionality:"
        printf '  - %s\n' "${missing_features[@]}"
        return 1
    fi
    
    log_success "All new functionality has corresponding feature files"
    return 0
}

# Validate step definitions for modified scenarios  
validate_step_definitions() {
    log_info "Validating step definitions..."
    
    # Check if any feature files were modified
    local modified_features=$(git diff --cached --name-only | grep "\.feature$")
    
    if [[ -z "$modified_features" ]]; then
        log_info "No feature files modified"
        return 0
    fi
    
    # Run step validation
    if ! node scripts/validate-bdd-coverage.js --threshold=0 --verbose > /tmp/step-validation.log 2>&1; then
        local missing_steps=$(grep -c "Missing Step Implementations" /tmp/step-validation.log || echo "0")
        
        if [[ "$missing_steps" -gt 0 ]]; then
            log_error "Found missing step implementations"
            if [[ "$VERBOSE" == "true" ]]; then
                cat /tmp/step-validation.log
            fi
            return 1
        fi
    fi
    
    log_success "All step definitions are implemented"
    return 0
}

# Suggest fixes for test failures
suggest_fixes_for_test_failures() {
    log_info "🔧 Suggested fixes for BDD test failures:"
    echo "  1. Run 'npm run test:bdd' to see detailed failure information"
    echo "  2. Check if all required dependencies are installed"
    echo "  3. Verify that all step definitions are properly implemented"
    echo "  4. Run 'npm run test:bdd:watch' for interactive debugging"
    echo "  5. Check logs in /tmp/bdd-test-output.log for more details"
    echo ""
    echo "Common issues:"
    echo "  - Missing or incorrect step definitions"
    echo "  - Syntax errors in feature files"
    echo "  - Import/dependency issues in step definitions"
    echo "  - Async/await issues in step implementations"
}

# Suggest coverage improvements
suggest_coverage_improvements() {
    log_info "💡 Suggestions to improve BDD coverage:"
    echo "  1. Run 'npm run bdd:validate-coverage:strict --verbose' for detailed report"
    echo "  2. Check missing step implementations with 'node scripts/validate-bdd-coverage.js --verbose'"
    echo "  3. Add feature files for new functionality in tests/bdd/features/"
    echo "  4. Implement missing step definitions in tests/bdd/step-definitions/"
    echo "  5. Run 'npm run bdd:generate-report' for comprehensive coverage analysis"
    echo ""
    echo "Quick actions:"
    echo "  - Focus on implementing Given/When/Then steps for core workflows"
    echo "  - Add edge case scenarios for error handling"
    echo "  - Ensure critical user journeys are fully covered"
}

# Suggest feature file creation
suggest_feature_file_creation() {
    log_info "📝 Create missing feature files:"
    echo "  1. Use existing feature files as templates"
    echo "  2. Follow the pattern: tests/bdd/features/[functionality-name].feature"
    echo "  3. Include scenarios for:"
    echo "     - Happy path (successful operation)"
    echo "     - Error cases (validation failures, system errors)" 
    echo "     - Edge cases (boundary conditions, unusual inputs)"
    echo "     - Performance requirements (if applicable)"
    echo ""
    echo "Feature file template:"
    echo "  @functionality @core"
    echo "  Feature: [Feature Name]"
    echo "    As a [user type]"
    echo "    I want to [goal]"
    echo "    So that [benefit]"
    echo ""
    echo "    Scenario: [Scenario name]"
    echo "      Given [preconditions]"
    echo "      When [action]" 
    echo "      Then [expected result]"
}

# Suggest step implementations
suggest_step_implementations() {
    log_info "🔧 Implement missing step definitions:"
    echo "  1. Run 'npm run bdd:validate-coverage --verbose' to see missing steps"
    echo "  2. Add step definitions in tests/bdd/step-definitions/"
    echo "  3. Use existing step definitions as examples"
    echo "  4. Import required test infrastructure:"
    echo "     - BDDWorld for test context"
    echo "     - TestDataBuilder for creating test objects"
    echo "     - FakeVaultAdapter for mocking Obsidian"
    echo ""
    echo "Step definition template:"
    echo "  Given('some condition', function() {"
    echo "    // Setup test state"
    echo "  });"
    echo ""
    echo "  When('I perform some action', async function() {"
    echo "    // Execute the action being tested"
    echo "  });"
    echo ""
    echo "  Then('I should see some result', function() {"
    echo "    // Verify the expected outcome"
    echo "  });"
}

# Print coverage summary
print_coverage_summary() {
    local coverage_result
    if coverage_result=$(node scripts/validate-bdd-coverage.js --json 2>/dev/null); then
        local coverage_percentage=$(echo "$coverage_result" | grep -o '"percentage":[0-9.]*' | cut -d':' -f2)
        local total_steps=$(echo "$coverage_result" | grep -o '"totalSteps":[0-9]*' | cut -d':' -f2)
        local missing_steps=$(echo "$coverage_result" | grep -o '"missingSteps":[0-9]*' | cut -d':' -f2)
        
        log_info "📊 BDD Coverage Summary:"
        echo "   Coverage: ${coverage_percentage}%"
        echo "   Total Steps: ${total_steps}"
        echo "   Missing: ${missing_steps}"
        echo ""
        echo "   Run 'npm run bdd:generate-report' for detailed analysis"
    fi
}

# Trap errors and provide helpful message
trap 'log_error "BDD validation encountered an unexpected error"; exit 1' ERR

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log_error "Not in a git repository"
    exit 1
fi

# Check if we have staged changes
if ! git diff --cached --quiet; then
    main "$@"
else
    log_warning "No staged changes detected, skipping BDD validation"
    exit 0
fi