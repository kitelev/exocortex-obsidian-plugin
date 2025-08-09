#\!/bin/bash

echo "🔧 Fixing Obsidian for UI tests on macOS..."

# Remove old cache
echo "📦 Removing old cache..."
rm -rf .obsidian-cache

# Create cache directory
mkdir -p .obsidian-cache/obsidian-installer/darwin-arm64

# Download Obsidian
echo "📥 Downloading Obsidian v1.8.10..."
cd .obsidian-cache/obsidian-installer/darwin-arm64
curl -L -o Obsidian.dmg "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.8.10/Obsidian-1.8.10.dmg"

# Mount DMG
echo "💿 Mounting DMG..."
hdiutil attach Obsidian.dmg -nobrowse -quiet

# Copy app
echo "📋 Copying Obsidian.app..."
cp -R /Volumes/Obsidian*/Obsidian.app ./Obsidian-1.8.10

# Unmount DMG
echo "💿 Unmounting DMG..."
hdiutil detach /Volumes/Obsidian* -quiet

# Remove quarantine attribute
echo "🔓 Removing quarantine attributes..."
xattr -cr Obsidian-1.8.10
xattr -d com.apple.quarantine Obsidian-1.8.10 2>/dev/null || true

# Make executable
chmod +x Obsidian-1.8.10/Contents/MacOS/Obsidian

# Clean up
rm -f Obsidian.dmg

echo "✅ Obsidian is ready for UI tests\!"

# Go back to project root
cd ../../..
