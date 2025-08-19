module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/integration/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/tests/e2e/',
    '/tests/ui/',
    '/tests/unit/'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/tests/__mocks__/obsidian.ts',
  },
  // Integration test specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts', 
    '<rootDir>/tests/mobile-setup.ts',
    '<rootDir>/tests/integration-setup.ts'
  ],
  // More aggressive timeouts and memory management for integration tests
  testTimeout: 120000, // 2 minutes for integration tests
  maxWorkers: 1, // Single worker to avoid memory issues
  // Optimize for stability over speed
  verbose: false,
  silent: true,
  bail: 3, // Stop after 3 failures
  // Memory management
  forceExit: true,
  detectOpenHandles: false,
  workerIdleMemoryLimit: '256MB',
  // Cache settings
  cache: false, // Disable cache for integration tests to avoid memory buildup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Coverage not needed for integration tests
  collectCoverage: false
};