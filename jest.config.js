module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/tests/e2e/',
    '/tests/ui/',  // Exclude WebDriver UI tests
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'main.ts',
    'src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/tests/**',
  ],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/tests/__mocks__/obsidian.ts',
  },
  coverageThreshold: {
    global: {
      branches: 59,
      functions: 63,
      lines: 68,
      statements: 68,
    },
  },
  // Enhanced setup for CI environments
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Handle ES modules and other transformations in CI
  transformIgnorePatterns: [
    'node_modules/(?!(chai)/)'
  ],
  // Additional environment settings for CI
  testTimeout: 30000,
  maxWorkers: process.env.CI ? 1 : '50%',
};