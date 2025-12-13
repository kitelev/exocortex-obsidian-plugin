import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e/specs",
  // fullyParallel: false - E2E tests share Obsidian state, must run serially per shard
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Reduced retries: 1 instead of 2 to speed up failing tests
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // Reduced timeout from 90s to 60s - most tests complete in 30-45s
  timeout: 60000,
  // Expect timeout reduced to 30s (was using global default)
  expect: {
    timeout: 30000,
  },

  reporter: [
    // Use blob reporter in CI for shard merging
    ...(process.env.CI
      ? ([["blob", { outputDir: "blob-report" }]] as const)
      : []),
    ["html", { outputFolder: "playwright-report-e2e", open: "never" }],
    ["list"],
    ...(process.env.CI ? [["github", {}] as ["github", {}]] : []),
    ["./playwright-no-flaky-reporter.ts"],
  ],

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Disabled video in CI to speed up tests
    video: process.env.CI ? "off" : "retain-on-failure",
    launchOptions: {
      args: [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--log-level=3",
      ],
      env: {
        DBUS_SESSION_BUS_ADDRESS: "/dev/null",
      },
    },
  },

  projects: [
    {
      name: "e2e",
      testMatch: "**/*.spec.ts",
    },
  ],
});
