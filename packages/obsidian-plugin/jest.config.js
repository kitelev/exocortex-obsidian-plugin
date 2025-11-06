module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/../core/tests/**/*.test.ts",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/ui/",
    "/tests/e2e/",
    "/tests/component/",
    "/tests/infrastructure/",
  ],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
    "<rootDir>/../core/src/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/tests/**",
  ],
  moduleNameMapper: {
    "^@exocortex/core$": "<rootDir>/../core/src/index.ts",
    "^obsidian$": "<rootDir>/tests/__mocks__/obsidian.ts",
  },
  coverageThreshold: {
    global: {
      branches: 70, // Updated from 63 to 70 (current: 70.7%)
      functions: 75, // Updated from 70 to 75 (current: 75.78%)
      lines: 78, // Updated from 75 to 78 (current: 78.42%)
      statements: 80, // Updated from 75 to 80 (current: 80.67%)
    },
    // Domain layer thresholds disabled until core package coverage collection is fixed
    // See: https://github.com/kitelev/exocortex-obsidian-plugin/issues/197
    // "<rootDir>/../core/src/domain/": {
    //   branches: 78,
    //   functions: 80,
    //   lines: 79,
    //   statements: 78,
    // },
  },
  // 🎯 COVERAGE TARGETS (enforced in CI):
  // Current: 80% statements ✅, 78% lines, 75% functions, 70% branches
  // Achieved milestone: 80% statements coverage!
  // Next milestone: 85% statements, 80% lines/functions
  // Ultimate goal: 85% statements/lines, 80% branches/functions
  // Domain layer: 85% across all metrics (once core package coverage collection works)
  // Note: setupFilesAfterEnv moved to memory optimization section above
  // Handle ES modules and other transformations in CI
  // Transform @exocortex/core package files
  transformIgnorePatterns: ["node_modules/(?!(chai|uuid)/)"],
  // ULTIMATE EMERGENCY: Extended timeouts for memory safety
  testTimeout: process.env.CI ? 300000 : 60000, // 5 minute timeout for ultimate safety
  // maxWorkers moved to memory management section above
  // Performance optimizations
  verbose: false,
  silent: process.env.CI ? true : false, // Reduce CI noise
  bail: process.env.CI ? 3 : false, // Fail fast in CI after 3 failures
  // EMERGENCY: Safe degradation settings
  forceExit: true, // Always force exit to prevent hangs
  detectOpenHandles: false, // Disabled to prevent hangs

  // EMERGENCY: Memory allocation handled via NODE_OPTIONS environment variable
  // Critical memory optimizations for CI/CD stability
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // ULTIMATE EMERGENCY: Maximum memory stabilization
  workerIdleMemoryLimit: process.env.CI ? "512MB" : "1024MB", // Ultimate memory allocation
  maxWorkers: 1, // Force single worker always - no parallelism
  // Memory leak detection - CRITICAL for stability
  detectLeaks: false, // Disabled - incompatible with emergency mode
  logHeapUsage: false, // Disabled - saves memory
  // EMERGENCY: Enhanced memory management setup
  setupFilesAfterEnv: [
    // "<rootDir>/tests/setup.ts", // File doesn't exist
    // '<rootDir>/tests/emergency-memory-setup.ts', // TEMPORARY: Disabled for debugging
    // "<rootDir>/tests/test-cleanup.ts", // File doesn't exist
  ],
  // Reduce cache to prevent memory buildup
  cacheDirectory: "<rootDir>/.jest-cache",
  cache: false, // EMERGENCY: Disable all caching to prevent memory buildup
  // Coverage optimization
  // Note: collectCoverage controlled by --coverage flag, not environment variable
  // This allows batched test script to control coverage collection
  collectCoverage: false, // Let --coverage flag control this
  coverageReporters: process.env.CI
    ? ["lcov", "json-summary", "text-summary"]
    : ["text", "html"],
  // Test result optimization
  passWithNoTests: true,
  errorOnDeprecated: false,
  // Modern ts-jest configuration
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // Use isolatedModules from tsconfig instead of here
        useESM: false,
        tsconfig: {
          module: "commonjs", // Use CommonJS for better Jest compatibility
          target: "es2020",
          lib: ["es2020", "dom"],
          skipLibCheck: true,
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          isolatedModules: true, // Move isolatedModules here
          paths: {
            "@exocortex/core": ["<rootDir>/../core/src/index.ts"]
          }
        },
      },
    ],
    "^.+\\.(js|mjs)$": "babel-jest", // Transform ES modules from node_modules (uuid v13)
  },
};
