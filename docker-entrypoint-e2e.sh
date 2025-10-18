#!/bin/bash
# docker-entrypoint-e2e.sh
# Runs E2E tests with xvfb-run wrapper

set -e

# Set Docker flag for Electron --no-sandbox
export DOCKER=1

echo "OBSIDIAN_PATH: $OBSIDIAN_PATH"
echo "OBSIDIAN_VAULT: $OBSIDIAN_VAULT"
echo "Running E2E tests with xvfb-run..."

# Use xvfb-run wrapper instead of background xvfb
# This ensures proper X server initialization before Playwright starts
exec xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24 -ac +extension GLX +render -noreset' "$@"
