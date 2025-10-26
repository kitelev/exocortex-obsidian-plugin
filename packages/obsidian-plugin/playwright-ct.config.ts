import { defineConfig, devices } from '@playwright/experimental-ct-react';
import * as path from 'path';

/**
 * Playwright Component Testing Configuration
 *
 * Tests React components in isolation without requiring full Obsidian environment
 */
export default defineConfig({
  testDir: './tests/component',

  // Run tests in parallel
  fullyParallel: true,

  // Fail CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Workers for parallel execution
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report-ct', open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  // Timeout configuration
  timeout: 10000,  // 10 seconds per test
  expect: {
    timeout: 5000,   // 5 seconds for assertions
  },

  // Shared settings for all tests
  use: {
    // Capture trace on first retry
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Component testing options
    ctPort: 3100,
    ctViteConfig: {
      resolve: {
        alias: {
          '@exocortex/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
          'obsidian': path.resolve(__dirname, './tests/__mocks__/obsidian.ts'),
          '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    },
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and WebKit disabled by default (install with: npx playwright install firefox webkit)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
