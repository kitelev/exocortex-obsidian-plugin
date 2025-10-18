#!/bin/bash
# docker-entrypoint-e2e.sh
# Runs E2E tests with background xvfb + explicit ready check

set -ex

# Set Docker flag for Electron --no-sandbox
export DOCKER=1
export DISPLAY=:99
export DEBUG=pw:browser*
export ELECTRON_ENABLE_LOGGING=1

echo "========================================" >&2
echo "OBSIDIAN_PATH: $OBSIDIAN_PATH" >&2
echo "OBSIDIAN_VAULT: $OBSIDIAN_VAULT" >&2
echo "DISPLAY: $DISPLAY" >&2
echo "Command: $@" >&2
echo "========================================" >&2

# Start xvfb in background
echo "Starting Xvfb on display $DISPLAY..." >&2
Xvfb $DISPLAY -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!
echo "Xvfb started with PID $XVFB_PID" >&2

# Wait for X server to be ready (check for display socket)
echo "Waiting for X server to be ready..." >&2
for i in {1..30}; do
  if xdpyinfo -display $DISPLAY >/dev/null 2>&1; then
    echo "X server is ready after ${i} attempts" >&2
    break
  fi
  echo "Attempt $i: X server not ready yet, waiting..." >&2
  sleep 0.5
done

# Final check
if ! xdpyinfo -display $DISPLAY >/dev/null 2>&1; then
  echo "ERROR: X server failed to start after 15 seconds" >&2
  kill $XVFB_PID 2>/dev/null || true
  exit 1
fi

echo "X server confirmed ready, launching tests..." >&2

# Run the test command
exec "$@"
