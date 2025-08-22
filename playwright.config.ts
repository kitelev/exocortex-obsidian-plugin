import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for UI testing
 * Tests the Create Child Task button functionality in real Obsidian environment
 */
export default defineConfig({
  testDir: "./tests/ui",

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests sequentially for Obsidian
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for Obsidian testing

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "test-results/ui-tests" }],
    ["junit", { outputFile: "test-results/ui-tests.xml" }],
    ["list"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for Obsidian
    baseURL: "obsidian://open",

    // Collect trace on failure
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for different testing scenarios
  projects: [
    {
      name: "Desktop Obsidian",
      use: {
        ...devices["Desktop Chrome"],
        // Custom launch options for Obsidian
        launchOptions: {
          executablePath: "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
          args: ["--enable-automation", "--no-sandbox"],
        },
      },
    },
    {
      name: "CI Tests",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
      },
      testMatch: "**/*.test.ts",
    },
  ],

  // Web server configuration (not needed for Obsidian)
  // webServer: undefined,

  // Global setup/teardown
  globalSetup: "./tests/ui/global-setup.ts",
  globalTeardown: "./tests/ui/global-teardown.ts",
});
