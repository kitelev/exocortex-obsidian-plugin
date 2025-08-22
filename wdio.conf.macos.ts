import type { Options } from "@wdio/types";
import { config as baseConfig } from "./wdio.conf";

// Special configuration for macOS to bypass Gatekeeper issues
export const config: Options.Testrunner = {
  ...baseConfig,

  capabilities: [
    {
      browserName: "chrome",
      "wdio:obsidianOptions": {
        // Try to use system-installed Obsidian if available
        binaryPath: "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
        // Disable headless mode on macOS to avoid Gatekeeper
        headless: false,
        // Other options from base config
        startupTimeout: 60000,
      },
    },
  ],

  // Run tests sequentially to avoid multiple Obsidian instances
  maxInstances: 1,

  beforeSession: function (config, capabilities, specs) {
    console.log("🍎 Running UI tests on macOS with Gatekeeper workaround");
    console.log("ℹ️  Using system Obsidian from /Applications/");
    console.log("ℹ️  Tests will run in GUI mode (not headless)");
  },

  afterTest: async function (
    test,
    context,
    { error, result, duration, passed, retries },
  ) {
    // Give macOS time to properly close windows
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
};
