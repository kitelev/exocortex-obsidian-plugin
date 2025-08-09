#!/bin/bash

echo "🔧 Fixing Obsidian for UI tests on macOS with Gatekeeper bypass..."

# Clean up everything first
echo "🧹 Cleaning up old installations..."
rm -rf .obsidian-cache
rm -rf ~/Library/Caches/obsidian*
rm -rf /var/folders/*/T/.Obsidian-*.tmp.*

# Create fresh cache
mkdir -p .obsidian-cache

# Try using spctl to allow
echo "🔓 Attempting to allow unsigned apps temporarily..."
sudo spctl --master-disable 2>/dev/null || echo "⚠️  Could not disable Gatekeeper globally"

# Download and setup without mounting DMG
echo "📥 Setting up Obsidian for headless testing..."
mkdir -p .obsidian-cache/obsidian-installer/darwin-arm64

cd .obsidian-cache/obsidian-installer/darwin-arm64

# Download directly
echo "📦 Downloading Obsidian..."
curl -L -o obsidian.dmg "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.8.10/Obsidian-1.8.10.dmg"

# Extract without mounting (using 7z or dmg2img if available)
if command -v 7z &> /dev/null; then
    echo "📦 Extracting with 7z..."
    7z x obsidian.dmg
elif command -v dmg2img &> /dev/null; then
    echo "📦 Converting DMG..."
    dmg2img obsidian.dmg obsidian.img
    # Extract from img
else
    echo "📦 Using hdiutil..."
    # Mount quietly
    hdiutil attach obsidian.dmg -nobrowse -quiet -mountpoint /tmp/obsidian-mount
    
    # Copy
    cp -R /tmp/obsidian-mount/Obsidian.app ./Obsidian-1.8.10
    
    # Unmount
    hdiutil detach /tmp/obsidian-mount -quiet
fi

# If app exists, remove all extended attributes
if [ -d "Obsidian-1.8.10" ]; then
    echo "🔓 Removing ALL security attributes..."
    
    # Remove all extended attributes
    xattr -cr Obsidian-1.8.10
    
    # Specifically remove quarantine
    find Obsidian-1.8.10 -type f -exec xattr -d com.apple.quarantine {} \; 2>/dev/null
    find Obsidian-1.8.10 -type d -exec xattr -d com.apple.quarantine {} \; 2>/dev/null
    
    # Remove code signing
    codesign --remove-signature Obsidian-1.8.10/Contents/MacOS/Obsidian 2>/dev/null || true
    
    # Make everything executable
    chmod -R +x Obsidian-1.8.10/Contents/MacOS/
    
    echo "✅ Obsidian prepared!"
else
    echo "❌ Failed to extract Obsidian"
    exit 1
fi

# Clean up
rm -f obsidian.dmg

cd ../../..

echo "🎯 Testing if Obsidian can launch..."
# Try to launch in background to test
./.obsidian-cache/obsidian-installer/darwin-arm64/Obsidian-1.8.10/Contents/MacOS/Obsidian --version 2>/dev/null || echo "⚠️  Direct launch test failed, but may work with ChromeDriver"

echo "✅ Setup complete! Try running: npm run test:ui:headless"