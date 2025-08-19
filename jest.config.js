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
  // Enhanced setup for CI environments
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', '<rootDir>/tests/mobile-setup.ts'],
  // Handle ES modules and other transformations in CI
  transformIgnorePatterns: [
    'node_modules/(?!(chai)/)'
  ],
  // Optimized CI/CD performance settings
  testTimeout: process.env.CI ? 90000 : 30000, // Increased for CI stability
  maxWorkers: process.env.CI ? 4 : '75%', // Optimized for CI parallelization
  // Performance optimizations
  verbose: false,
  silent: process.env.CI ? true : false, // Reduce CI noise
  bail: process.env.CI ? 3 : false, // Fail fast in CI after 3 failures
  // Enhanced caching
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // CI-specific optimizations
  forceExit: process.env.CI ? true : false,
  detectOpenHandles: process.env.CI ? false : true,
  // Improved memory management
  workerIdleMemoryLimit: process.env.CI ? '768MB' : '1GB',
  // Coverage optimization
  collectCoverage: process.env.CI && process.env.COVERAGE ? true : false,
  coverageReporters: process.env.CI ? ['lcov', 'text-summary'] : ['text', 'html'],
  // Test result optimization
  passWithNoTests: true,
  errorOnDeprecated: false,
  // Modern ts-jest configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true, // Faster TypeScript compilation
      tsconfig: {
        module: 'esnext',
        target: 'es2020',
        lib: ['es2020', 'dom'],
        skipLibCheck: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      }
    }],
  }
};