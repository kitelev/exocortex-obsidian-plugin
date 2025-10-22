#!/bin/bash
# docker-entrypoint-e2e.sh
# Runs E2E tests with xvfb-run --auto-servernum (recommended by Playwright team)

set -e

# Set Docker flag for Electron --no-sandbox
export DOCKER=1
export CI=1
export DEBUG=pw:browser*
export ELECTRON_ENABLE_LOGGING=1

echo "========================================" >&2
echo "OBSIDIAN_PATH: $OBSIDIAN_PATH" >&2
echo "OBSIDIAN_VAULT: $OBSIDIAN_VAULT" >&2
echo "Command: $@" >&2
echo "========================================" >&2

echo "Launching with xvfb-run --auto-servernum..." >&2

# Use xvfb-run with --auto-servernum as recommended by Playwright team
# https://github.com/microsoft/playwright/issues/8198#issuecomment-986736585
exec xvfb-run --auto-servernum "$@"
