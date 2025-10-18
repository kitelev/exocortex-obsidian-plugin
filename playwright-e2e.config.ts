import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 180000, // 3 minutes for Electron launch in Docker

  reporter: [
    ['html', { outputFolder: 'playwright-report-e2e', open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github', {}] as ['github', {}]] : []),
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'e2e',
      testMatch: '**/*.spec.ts',
    },
  ],
});
