#!/bin/bash
# docker-entrypoint-e2e.sh
# Runs E2E tests with xvfb-run wrapper

set -ex  # Added -x for command tracing

# Set Docker flag for Electron --no-sandbox
export DOCKER=1

echo "========================================" >&2
echo "OBSIDIAN_PATH: $OBSIDIAN_PATH" >&2
echo "OBSIDIAN_VAULT: $OBSIDIAN_VAULT" >&2
echo "Running E2E tests with xvfb-run..." >&2
echo "Command: $@" >&2
echo "========================================" >&2

# Use xvfb-run wrapper with verbose error output
# -e: error file to stderr
# --auto-servernum: automatically pick a server number
# --server-args: xvfb configuration
exec xvfb-run -e /dev/stderr --auto-servernum --server-args='-screen 0 1920x1080x24 -ac +extension GLX +render -noreset' "$@" 2>&1
