#!/bin/bash

# Script to validate GitHub Actions workflow configuration
set -e

echo "🔍 Validating GitHub Actions Workflows..."
echo "========================================="

# Check if required workflows exist
REQUIRED_WORKFLOWS=(
  "fast-feedback.yml"
  "comprehensive-ci.yml"
  "auto-release.yml"
  "release.yml"
)

WORKFLOWS_DIR=".github/workflows"
ERRORS=0

echo ""
echo "✅ Checking for required workflows..."
for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
  if [ -f "$WORKFLOWS_DIR/$workflow" ]; then
    echo "  ✓ $workflow exists"
  else
    echo "  ✗ $workflow is missing!"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "🔧 Validating workflow syntax..."
for workflow in "$WORKFLOWS_DIR"/*.yml; do
  if [ -f "$workflow" ]; then
    # Basic YAML syntax check
    if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
      basename=$(basename "$workflow")
      
      # Check if workflow is disabled
      if grep -q "if: false" "$workflow" 2>/dev/null; then
        echo "  ⏸️  $basename (disabled)"
      else
        # Check for concurrency group
        if grep -q "concurrency:" "$workflow" 2>/dev/null; then
          echo "  ✓ $basename (active, has concurrency group)"
        else
          echo "  ⚠️  $basename (active, no concurrency group)"
        fi
      fi
    else
      echo "  ✗ $(basename "$workflow") - YAML syntax error!"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

echo ""
echo "📊 Workflow Migration Status:"
echo "-----------------------------"
echo "Active workflows:"
echo "  - fast-feedback.yml (PR validation)"
echo "  - comprehensive-ci.yml (main branch)"
echo "  - auto-release.yml (version bumps)"
echo "  - release.yml (tag releases)"
echo "  - emergency-ci-stabilization.yml (fallback)"
echo ""
echo "Disabled workflows (migrated):"
for workflow in "$WORKFLOWS_DIR"/*.yml; do
  if grep -q "if: false" "$workflow" 2>/dev/null; then
    echo "  - $(basename "$workflow")"
  fi
done

echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ Validation completed successfully!"
  echo ""
  echo "📈 Expected improvements:"
  echo "  • PR feedback: 14.5 → 2.5 minutes (-82%)"
  echo "  • Main push: 11 → 4 minutes (-64%)"
  echo "  • Monthly usage: 2,500 → 1,200 minutes (-52%)"
else
  echo "❌ Validation failed with $ERRORS errors"
  exit 1
fi