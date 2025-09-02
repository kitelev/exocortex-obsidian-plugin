import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Real E2E Testing Configuration for Exocortex Plugin
 * Tests the actual plugin in real Obsidian environments
 */
export default defineConfig({
  testDir: './tests/e2e/playwright',
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially for Obsidian
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for Obsidian instance
  
  // Reporting
  reporter: process.env.CI ? [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ] : [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['list'],
    ['./tests/e2e/playwright/utils/screenshot-reporter.ts']
  ],
  
  // Global timeout settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  
  use: {
    // Base settings
    baseURL: 'obsidian://open',
    
    // Screenshot settings
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    // Video recording
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    // Tracing for debugging
    trace: 'on-first-retry',
    
    // Custom test data
    testIdAttribute: 'data-test-id',
  },
  
  // Projects for different test scenarios
  projects: [
    {
      name: 'desktop-app',
      testMatch: /.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        // Path to Obsidian executable (with CI fallback)
        launchOptions: {
          executablePath: process.env.OBSIDIAN_PATH || (
            process.platform === 'darwin' 
              ? '/Applications/Obsidian.app/Contents/MacOS/Obsidian'
              : process.platform === 'win32'
              ? 'C:\\Program Files\\Obsidian\\Obsidian.exe'
              : '/usr/local/bin/obsidian' // CI Linux path
          ),
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            `--vault-path=${path.join(__dirname, 'tests/e2e/playwright/test-vault')}`,
          ],
        },
      },
    },
    
    // CI Environment Project
    {
      name: 'CI Environment - Headless',
      testMatch: /.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: {
          executablePath: process.env.OBSIDIAN_PATH || '/usr/local/bin/obsidian',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--headless',
            '--virtual-time-budget=5000',
            `--vault-path=${path.join(__dirname, 'tests/e2e/playwright/test-vault')}`,
          ],
        },
      },
    },
    
    {
      name: 'web-based',
      testMatch: /.*\.web\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8084', // For Docker testing
      },
    },
  ],
  
  // Global setup and teardown
  globalSetup: './tests/e2e/playwright/setup/global-setup.ts',
  globalTeardown: './tests/e2e/playwright/setup/global-teardown.ts',
  
  // Output folder for test artifacts
  outputDir: 'test-results/playwright',
  
  // Web server configuration (for Docker tests)
  webServer: process.env.USE_DOCKER ? {
    command: 'docker run -d -p 8084:8080 --name obsidian-e2e ghcr.io/sytone/obsidian-remote:latest',
    port: 8084,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  } : undefined,
});