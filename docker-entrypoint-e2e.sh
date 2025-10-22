#!/bin/bash
# docker-entrypoint-e2e.sh
# Runs E2E tests with xvfb-run --auto-servernum (recommended by Playwright team)

set -e

# Set Docker flag for Electron --no-sandbox
export DOCKER=1
export CI=1
export DEBUG=pw:browser*
export ELECTRON_ENABLE_LOGGING=0

echo "========================================" >&2
echo "OBSIDIAN_PATH: $OBSIDIAN_PATH" >&2
echo "OBSIDIAN_VAULT: $OBSIDIAN_VAULT" >&2
echo "Command: $@" >&2
echo "========================================" >&2

echo "Launching with xvfb-run --auto-servernum..." >&2

# Use xvfb-run with --auto-servernum as recommended by Playwright team
# https://github.com/microsoft/playwright/issues/8198#issuecomment-986736585
# Filter out harmless Chrome/dbus errors that clutter logs (stderr only)
xvfb-run --auto-servernum "$@" 2>&1 | grep -v -E "(LaunchProcess: failed to execvp:|ERROR:dbus/bus.cc:|ERROR:dbus/object_proxy.cc:|WARNING:ui/gfx/linux/gpu_memory_buffer_support_x11.cc:|WARNING:device/bluetooth/dbus/bluez_dbus_manager.cc:|WARNING:electron/shell/browser/ui/accelerator_util.cc:|xdg-settings)"
exit ${PIPESTATUS[0]}
