#!/bin/bash

# Screenshot Verification Script
# Verifies that Docker E2E tests produce valid screenshot files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIRS=(
    "$PROJECT_ROOT/tests/e2e/docker/test-results/screenshots"
    "$PROJECT_ROOT/tests/e2e/docker/test-results/plugin-screenshots"
    "$PROJECT_ROOT/tests/e2e/docker/test-results/debug-screenshots"
    "$PROJECT_ROOT/tests/e2e/docker/test-results/real-plugin-screenshots"
)

echo "🔍 SCREENSHOT VERIFICATION"
echo "========================="
echo "Project: $PROJECT_ROOT"
echo ""

total_found=0
total_valid=0
total_empty=0
total_missing=0

# Function to check a single screenshot file
check_screenshot() {
    local filepath="$1"
    local filename=$(basename "$filepath")
    
    if [ ! -f "$filepath" ]; then
        echo "  ❌ Missing: $filename"
        ((total_missing++))
        return 1
    fi
    
    local size=$(stat -c%s "$filepath" 2>/dev/null || stat -f%z "$filepath" 2>/dev/null || echo "0")
    
    if [ "$size" -eq 0 ]; then
        echo "  ⚠️  Empty (0 bytes): $filename"
        ((total_empty++))
        return 1
    elif [ "$size" -lt 1000 ]; then
        echo "  ⚠️  Very small (${size} bytes): $filename"
        ((total_valid++))
        return 0
    else
        echo "  ✅ Valid (${size} bytes): $filename"
        ((total_valid++))
        return 0
    fi
}

# Check each screenshot directory
for screenshot_dir in "${SCREENSHOT_DIRS[@]}"; do
    if [ -d "$screenshot_dir" ]; then
        echo "📁 Checking: $(basename "$screenshot_dir")"
        
        png_files=$(find "$screenshot_dir" -name "*.png" 2>/dev/null | wc -l)
        jpg_files=$(find "$screenshot_dir" -name "*.jpg" -o -name "*.jpeg" 2>/dev/null | wc -l)
        
        if [ "$png_files" -eq 0 ] && [ "$jpg_files" -eq 0 ]; then
            echo "  📭 No screenshot files found"
            continue
        fi
        
        # Check PNG files
        if [ "$png_files" -gt 0 ]; then
            echo "  🖼️  Found $png_files PNG files:"
            find "$screenshot_dir" -name "*.png" | while read -r file; do
                check_screenshot "$file"
                ((total_found++))
            done
        fi
        
        # Check JPEG files
        if [ "$jpg_files" -gt 0 ]; then
            echo "  🖼️  Found $jpg_files JPEG files:"
            find "$screenshot_dir" -name "*.jpg" -o -name "*.jpeg" | while read -r file; do
                check_screenshot "$file"
                ((total_found++))
            done
        fi
        
        echo ""
    else
        echo "📁 Not found: $(basename "$screenshot_dir")"
    fi
done

# Summary
echo "📊 VERIFICATION SUMMARY"
echo "======================"
echo "📈 Total files found: $total_found"
echo "✅ Valid screenshots: $total_valid"
echo "⚠️  Empty files: $total_empty"
echo "❌ Missing files: $total_missing"

# Calculate success rate
if [ "$total_found" -gt 0 ]; then
    success_rate=$(( (total_valid * 100) / total_found ))
    echo "📊 Success rate: ${success_rate}%"
    
    if [ "$success_rate" -ge 80 ]; then
        echo "🎉 Screenshot generation is working well!"
        exit 0
    elif [ "$success_rate" -ge 50 ]; then
        echo "⚠️  Screenshot generation has issues but partially working"
        exit 1
    else
        echo "❌ Screenshot generation is failing"
        exit 2
    fi
else
    echo "💥 No screenshot files found - tests may not be running"
    exit 3
fi