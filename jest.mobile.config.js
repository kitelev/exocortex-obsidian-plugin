const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'Mobile Tests',
  testMatch: [
    '**/__tests__/**/*mobile*.ts',
    '**/*mobile*.test.ts',
    '**/mobile/**/*.test.ts',
    '**/touch/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/ui/',
    '/tests/unit/(?!.*mobile).*',  // Only include mobile-related tests
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/tests/mobile-setup.ts'
  ],
  // Mobile-specific test environment
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
  },
  // Mobile test optimizations
  testTimeout: process.env.CI ? 45000 : 20000,
  maxWorkers: process.env.CI ? 2 : 1,
  // Mobile-specific globals
  globals: {
    MOBILE_TEST_ENV: true,
    TOUCH_ENABLED: true
  }
};