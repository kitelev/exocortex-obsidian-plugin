#!/bin/bash

echo "🔧 UI Test Workaround for macOS Gatekeeper"
echo "========================================="
echo ""
echo "⚠️  macOS Gatekeeper is blocking Obsidian from running in headless mode."
echo ""
echo "📋 WORKAROUND OPTIONS:"
echo ""
echo "1. Run tests in non-headless mode (with GUI):"
echo "   npm run test:ui:local"
echo ""
echo "2. Disable Gatekeeper temporarily (requires admin):"
echo "   sudo spctl --master-disable"
echo "   npm run test:ui:headless"
echo "   sudo spctl --master-enable  # Re-enable after tests"
echo ""
echo "3. Use CI environment (GitHub Actions):"
echo "   git push and let CI run the tests"
echo ""
echo "4. Run in Docker container (if available):"
echo "   docker run -it node:18 npm run test:ui:headless"
echo ""
echo "🎯 RECOMMENDED: Use option 1 or 3"
echo ""

# Try the local non-headless version
read -p "Do you want to run tests in GUI mode now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting UI tests with GUI..."
    npm run test:ui:local
fi