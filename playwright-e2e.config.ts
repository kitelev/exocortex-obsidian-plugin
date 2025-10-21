import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 3,
  timeout: 60000,

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
