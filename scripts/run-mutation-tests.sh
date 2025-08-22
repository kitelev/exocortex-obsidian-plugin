#!/bin/bash

echo "🧬 Running Simple Mutation Tests..."
echo "===================================="
echo ""

# Test files to mutate
TEST_FILES=(
  "src/domain/entities/Asset.ts"
  "src/domain/value-objects/AssetId.ts"
  "src/application/use-cases/CreateAssetUseCase.ts"
)

MUTATIONS_KILLED=0
MUTATIONS_SURVIVED=0

# Simple mutations to test
for file in "${TEST_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️  Skipping $file (not found)"
    continue
  fi
  
  echo "📁 Testing $file..."
  
  # Save original
  cp "$file" "$file.backup"
  
  # Test 1: Boolean flip
  if grep -q "return true" "$file"; then
    sed -i '' 's/return true/return false/g' "$file" 2>/dev/null || sed -i 's/return true/return false/g' "$file"
    
    # Run tests silently
    if npm test -- --silent > /dev/null 2>&1; then
      echo "  ❌ Boolean flip mutation SURVIVED"
      ((MUTATIONS_SURVIVED++))
    else
      echo "  ✅ Boolean flip mutation KILLED"
      ((MUTATIONS_KILLED++))
    fi
    
    # Restore
    cp "$file.backup" "$file"
  fi
  
  # Test 2: Comparison operator
  if grep -q "===" "$file"; then
    sed -i '' 's/===/!==/g' "$file" 2>/dev/null || sed -i 's/===/!==/g' "$file"
    
    if npm test -- --silent > /dev/null 2>&1; then
      echo "  ❌ Comparison mutation SURVIVED"
      ((MUTATIONS_SURVIVED++))
    else
      echo "  ✅ Comparison mutation KILLED"
      ((MUTATIONS_KILLED++))
    fi
    
    # Restore
    cp "$file.backup" "$file"
  fi
  
  # Clean up backup
  rm "$file.backup"
done

echo ""
echo "========================================"
echo "📊 MUTATION TESTING REPORT"
echo "========================================"
echo "Mutations Killed: $MUTATIONS_KILLED ✅"
echo "Mutations Survived: $MUTATIONS_SURVIVED ❌"

TOTAL=$((MUTATIONS_KILLED + MUTATIONS_SURVIVED))
if [ $TOTAL -gt 0 ]; then
  SCORE=$((MUTATIONS_KILLED * 100 / TOTAL))
  echo "Mutation Score: ${SCORE}%"
  
  if [ $SCORE -ge 60 ]; then
    echo ""
    echo "✅ Mutation testing passed (threshold: 60%)"
    exit 0
  else
    echo ""
    echo "❌ Mutation testing failed (threshold: 60%)"
    exit 1
  fi
else
  echo "No mutations were tested"
  exit 0
fi