import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Exocortex Plugin E2E Tests
 *
 * Tests Obsidian plugin in real Electron environment
 * See: docs/E2E-TESTING-GUIDE.md
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run tests sequentially (Electron limitation)
  fullyParallel: false,
  workers: 1,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Fail CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  // Timeout configuration
  timeout: 60000,  // 60 seconds per test (Obsidian startup is slow)
  expect: {
    timeout: 10000,   // 10 seconds for assertions
  },

  // Shared settings for all tests
  use: {
    // Capture trace on first retry
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Action timeout
    actionTimeout: 10000,
  },

  // Test projects
  projects: [
    {
      name: 'obsidian-e2e',
      testMatch: '**/*.spec.ts',
    },
  ],

  // Web Server configuration (if needed)
  // webServer: {
  //   command: 'npm run preview',
  //   port: 3000,
  // },
});
