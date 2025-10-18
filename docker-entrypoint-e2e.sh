#!/bin/bash
# docker-entrypoint-e2e.sh
# Starts xvfb for headless Obsidian testing

set -e

# Set Docker flag for Electron --no-sandbox
export DOCKER=1

echo "Starting Xvfb on display $DISPLAY..."
Xvfb :99 -screen 0 1920x1080x24 -ac &
XVFB_PID=$!

# Wait for X server to be ready
sleep 2

echo "Xvfb started (PID: $XVFB_PID)"
echo "OBSIDIAN_PATH: $OBSIDIAN_PATH"
echo "OBSIDIAN_VAULT: $OBSIDIAN_VAULT"

# Trap to kill xvfb on exit
trap "kill $XVFB_PID 2>/dev/null || true" EXIT INT TERM

# Run tests
echo "Running E2E tests..."
exec "$@"
