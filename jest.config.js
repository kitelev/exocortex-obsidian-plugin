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
      branches: 27,
      functions: 33,
      lines: 34,
      statements: 34,
    },
  },
  // Note: setupFilesAfterEnv moved to memory optimization section above
  // Handle ES modules and other transformations in CI
  transformIgnorePatterns: [
    'node_modules/(?!(chai)/)'
  ],
  // Optimized CI/CD performance settings
  testTimeout: process.env.CI ? 90000 : 30000, // Increased for CI stability
  // maxWorkers moved to memory management section above
  // Performance optimizations
  verbose: false,
  silent: process.env.CI ? true : false, // Reduce CI noise
  bail: process.env.CI ? 3 : false, // Fail fast in CI after 3 failures
  // Note: Cache settings moved to memory optimization section above
  // CI-specific optimizations
  forceExit: true, // Always force exit to prevent hangs
  detectOpenHandles: process.env.CI ? false : true,
  // Critical memory optimizations for CI/CD stability
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Aggressive memory management for CI
  workerIdleMemoryLimit: process.env.CI ? '64MB' : '128MB', // Further reduce memory per worker
  maxWorkers: 1, // Force single worker always for stability
  // Memory leak detection - CRITICAL for stability
  detectLeaks: false, // Disabled due to performance impact
  logHeapUsage: false, // Disabled for CI performance
  // Force garbage collection between tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/tests/memory-optimization-setup.ts', // New memory optimization setup
    '<rootDir>/tests/test-cleanup.ts'
  ],
  // Reduce cache to prevent memory buildup
  cacheDirectory: '<rootDir>/.jest-cache',
  cache: process.env.CI ? false : true, // Disable cache in CI to prevent memory issues
  // Coverage optimization
  collectCoverage: process.env.CI && process.env.COVERAGE ? true : false,
  coverageReporters: process.env.CI ? ['lcov', 'text-summary'] : ['text', 'html'],
  // Test result optimization
  passWithNoTests: true,
  errorOnDeprecated: false,
  // Modern ts-jest configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      // Use isolatedModules from tsconfig instead of here
      useESM: false,
      tsconfig: {
        module: 'commonjs', // Use CommonJS for better Jest compatibility
        target: 'es2020',
        lib: ['es2020', 'dom'],
        skipLibCheck: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        isolatedModules: true, // Move isolatedModules here
      }
    }],
  }
};