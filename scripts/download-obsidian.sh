#!/bin/bash

# Download Obsidian for E2E testing
# Usage: ./scripts/download-obsidian.sh

set -e

OBSIDIAN_VERSION="${OBSIDIAN_VERSION:-1.8.10}"
PLATFORM=$(uname -s)
ARCH=$(uname -m)

echo "🔍 Detecting platform: $PLATFORM $ARCH"

if [ "$PLATFORM" = "Darwin" ]; then
    # macOS
    # All macOS versions now use the same DMG
    URL="https://github.com/obsidianmd/obsidian-releases/releases/download/v${OBSIDIAN_VERSION}/Obsidian-${OBSIDIAN_VERSION}.dmg"
    FILE="Obsidian.dmg"
elif [ "$PLATFORM" = "Linux" ]; then
    # Linux
    URL="https://github.com/obsidianmd/obsidian-releases/releases/download/v${OBSIDIAN_VERSION}/Obsidian-${OBSIDIAN_VERSION}.AppImage"
    FILE="Obsidian.AppImage"
else
    echo "❌ Unsupported platform: $PLATFORM"
    exit 1
fi

echo "📥 Downloading Obsidian v${OBSIDIAN_VERSION}..."
echo "   URL: $URL"

# Create directory for Obsidian binary
mkdir -p test-obsidian

# Download if not already present
if [ ! -f "test-obsidian/$FILE" ]; then
    curl -L -o "test-obsidian/$FILE" "$URL"
    
    if [ "$PLATFORM" = "Linux" ]; then
        chmod +x "test-obsidian/$FILE"
    fi
    
    echo "✅ Downloaded to test-obsidian/$FILE"
else
    echo "✅ Using existing test-obsidian/$FILE"
fi

# Extract app path for macOS
if [ "$PLATFORM" = "Darwin" ]; then
    echo "📦 Extracting macOS app..."
    
    # Mount DMG
    hdiutil attach "test-obsidian/$FILE" -nobrowse -noautoopen
    
    # Copy app to test directory
    cp -R "/Volumes/Obsidian/Obsidian.app" "test-obsidian/"
    
    # Unmount DMG
    hdiutil detach "/Volumes/Obsidian"
    
    APP_PATH="$(pwd)/test-obsidian/Obsidian.app"
else
    APP_PATH="$(pwd)/test-obsidian/$FILE"
fi

echo ""
echo "✅ Obsidian ready for testing!"
echo ""
echo "📝 Export this before running tests:"
echo "   export OBSIDIAN_APP_PATH=\"$APP_PATH\""
echo ""
echo "🚀 Run tests with:"
echo "   npm run test:ui"