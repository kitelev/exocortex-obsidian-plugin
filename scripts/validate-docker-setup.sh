#!/bin/bash
# Docker Setup Validation Script
# Validates Docker configuration without requiring Docker to be running

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation results
ERRORS=0
WARNINGS=0

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

# Validate file existence and syntax
validate_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_success "$description exists: $file"
        return 0
    else
        print_error "$description missing: $file"
        return 1
    fi
}

# Validate Dockerfile syntax
validate_dockerfile() {
    local dockerfile=$1
    
    if [ -f "$dockerfile" ]; then
        print_success "Dockerfile exists: $dockerfile"
        
        # Check for common Dockerfile commands
        if grep -q "FROM.*node:" "$dockerfile"; then
            print_success "  Node.js base image specified"
        else
            print_error "  No Node.js base image found"
        fi
        
        if grep -q "WORKDIR" "$dockerfile"; then
            print_success "  Working directory set"
        else
            print_warning "  No working directory specified"
        fi
        
        if grep -q "COPY package" "$dockerfile"; then
            print_success "  Package files copied"
        else
            print_error "  Package files not copied"
        fi
        
        if grep -q "RUN npm" "$dockerfile"; then
            print_success "  npm commands present"
        else
            print_error "  No npm commands found"
        fi
        
        # Count stages
        local stages=$(grep -c "^FROM.*AS" "$dockerfile" || echo 0)
        if [ "$stages" -gt 0 ]; then
            print_success "  Multi-stage build with $stages stages"
        else
            print_warning "  Single-stage build (consider multi-stage)"
        fi
        
    else
        print_error "Dockerfile missing: $dockerfile"
    fi
}

# Validate docker-compose.yml syntax
validate_compose() {
    local compose_file=$1
    
    if [ -f "$compose_file" ]; then
        print_success "Docker Compose file exists: $compose_file"
        
        # Check version
        if grep -q "version:" "$compose_file"; then
            local version=$(grep "version:" "$compose_file" | head -1 | cut -d'"' -f2 | cut -d"'" -f2)
            print_success "  Compose version: $version"
        else
            print_warning "  No version specified"
        fi
        
        # Check for services
        if grep -q "services:" "$compose_file"; then
            print_success "  Services section present"
            local service_count=$(grep -A 1000 "services:" "$compose_file" | grep "^  [a-zA-Z]" | wc -l)
            print_success "  Found $service_count services"
        else
            print_error "  No services section found"
        fi
        
        # Check for volumes
        if grep -q "volumes:" "$compose_file"; then
            print_success "  Volumes section present"
        else
            print_warning "  No volumes section (may impact caching)"
        fi
        
        # Check for profiles
        if grep -q "profiles:" "$compose_file"; then
            print_success "  Profiles configured"
        else
            print_warning "  No profiles configured"
        fi
        
    else
        print_error "Docker Compose file missing: $compose_file"
    fi
}

# Validate package.json scripts
validate_npm_scripts() {
    if [ -f "package.json" ]; then
        print_success "package.json exists"
        
        # Check for test scripts
        if grep -q '"test"' package.json; then
            print_success "  Test scripts configured"
        else
            print_error "  No test scripts found"
        fi
        
        # Check for build script
        if grep -q '"build"' package.json; then
            print_success "  Build script configured"
        else
            print_error "  No build script found"
        fi
        
        # Check for dev dependencies
        if grep -q '"devDependencies"' package.json; then
            print_success "  Dev dependencies section present"
            
            # Check for testing frameworks
            if grep -q '"jest"' package.json; then
                print_success "    Jest testing framework"
            else
                print_warning "    Jest not found"
            fi
            
            if grep -q '"webdriverio"' package.json; then
                print_success "    WebDriverIO for UI testing"
            else
                print_warning "    WebDriverIO not found"
            fi
        else
            print_error "  No dev dependencies found"
        fi
        
    else
        print_error "package.json missing"
    fi
}

# Validate directory structure
validate_directories() {
    local dirs=("src" "tests" "scripts" ".github/workflows")
    
    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_success "Directory exists: $dir"
        else
            print_warning "Directory missing: $dir"
        fi
    done
}

# Validate GitHub Actions workflows
validate_workflows() {
    if [ -d ".github/workflows" ]; then
        print_success "GitHub workflows directory exists"
        
        local workflow_count=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
        print_success "  Found $workflow_count workflow files"
        
        if [ -f ".github/workflows/docker-ci.yml" ]; then
            print_success "  Docker CI workflow configured"
        else
            print_warning "  Docker CI workflow missing"
        fi
        
        if [ -f ".github/workflows/ci.yml" ]; then
            print_success "  Main CI workflow exists"
        else
            print_warning "  Main CI workflow missing"
        fi
        
    else
        print_warning "No GitHub workflows directory"
    fi
}

# Validate Docker ignore file
validate_dockerignore() {
    if [ -f ".dockerignore" ]; then
        print_success ".dockerignore exists"
        
        if grep -q "node_modules" .dockerignore; then
            print_success "  node_modules ignored"
        else
            print_warning "  node_modules not ignored"
        fi
        
        if grep -q "coverage" .dockerignore; then
            print_success "  Coverage files ignored"
        else
            print_warning "  Coverage files not ignored"
        fi
        
    else
        print_warning ".dockerignore missing (may impact build performance)"
    fi
}

# Check for executable scripts
validate_scripts() {
    local scripts=("scripts/docker-test.sh")
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                print_success "Script executable: $script"
            else
                print_warning "Script not executable: $script (run: chmod +x $script)"
            fi
        else
            print_error "Script missing: $script"
        fi
    done
}

# Main validation
main() {
    print_header "Docker Setup Validation"
    echo "Validating Docker testing infrastructure..."
    echo ""
    
    print_header "File Structure Validation"
    validate_file "Dockerfile" "Main Dockerfile"
    validate_file "Dockerfile.matrix" "Matrix testing Dockerfile"
    validate_file "docker-compose.yml" "Docker Compose file"
    validate_file "docker-compose.mobile.yml" "Mobile testing Compose file"
    validate_file "scripts/docker-test.sh" "Docker test script"
    echo ""
    
    print_header "Directory Structure"
    validate_directories
    echo ""
    
    print_header "Dockerfile Validation"
    validate_dockerfile "Dockerfile"
    echo ""
    
    print_header "Docker Compose Validation"
    validate_compose "docker-compose.yml"
    echo ""
    
    print_header "Mobile Compose Validation"
    validate_compose "docker-compose.mobile.yml"
    echo ""
    
    print_header "Package.json Validation"
    validate_npm_scripts
    echo ""
    
    print_header "GitHub Workflows Validation"
    validate_workflows
    echo ""
    
    print_header "Docker Ignore Validation"
    validate_dockerignore
    echo ""
    
    print_header "Script Permissions"
    validate_scripts
    echo ""
    
    # Summary
    print_header "Validation Summary"
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_success "All validations passed! Docker setup is ready."
        echo ""
        echo "Next steps:"
        echo "1. Start Docker: docker --version"
        echo "2. Build images: ./scripts/docker-test.sh build"
        echo "3. Run tests: ./scripts/docker-test.sh test-all"
        exit 0
    elif [ $ERRORS -eq 0 ]; then
        print_warning "Validation completed with $WARNINGS warnings"
        echo ""
        echo "Docker setup is functional but could be improved."
        echo "Address warnings for optimal performance."
        exit 0
    else
        print_error "Validation failed with $ERRORS errors and $WARNINGS warnings"
        echo ""
        echo "Please fix the errors before using Docker testing."
        exit 1
    fi
}

# Run validation
main "$@"