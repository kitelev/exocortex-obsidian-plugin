module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/performance/**/*.test.ts",
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
    "^@plugin/types$": "<rootDir>/src/types/index.ts",
    "^@plugin/types/(.*)$": "<rootDir>/src/types/$1",
    "^@plugin/adapters/(.*)$": "<rootDir>/src/adapters/$1",
    "^@plugin/application/(.*)$": "<rootDir>/src/application/$1",
    "^@plugin/domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@plugin/infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@plugin/presentation/(.*)$": "<rootDir>/src/presentation/$1",
    "^@plugin/(.*)$": "<rootDir>/src/$1",
    "^obsidian$": "<rootDir>/tests/__mocks__/obsidian.ts",
    "^d3$": "<rootDir>/tests/__mocks__/d3.ts",
  },
  // Coverage thresholds per Test Pyramid policy (docs/TEST-PYRAMID.md)
  // These are enforced in CI via .github/workflows/ci.yml
  coverageThreshold: {
    global: {
      statements: 75, // CI threshold (current: ~80%)
      branches: 67,   // CI threshold (current: ~71%)
      functions: 70,  // CI threshold (current: ~73%)
      lines: 75,      // CI threshold (current: ~81%)
    },
  },
  // 🎯 COVERAGE POLICY (see docs/TEST-PYRAMID.md):
  // - obsidian-plugin: 75% statements, 67% branches, 70% functions, 75% lines
  // - Short-term goal: 80% statements, 70% branches
  // - Long-term goal: 85% statements, 80% branches
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
    "<rootDir>/tests/setup-reflect-metadata.ts", // Global reflect-metadata for TSyringe
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
  // Flaky test reporter - tracks tests that pass after retry
  // Note: Uses compiled .js file because Jest doesn't transform custom reporters
  reporters: [
    "default",
    ...(process.env.CI
      ? [
          [
            "<rootDir>/../test-utils/reporters/flaky-reporter.js",
            {
              outputFile: "flaky-report.json",
              failOnFlaky: false, // Track but don't fail CI
              verbose: true,
            },
          ],
        ]
      : []),
  ],
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
            "@exocortex/core": ["<rootDir>/../core/src/index.ts"],
            "@plugin/types": ["<rootDir>/src/types/index.ts"],
            "@plugin/types/*": ["<rootDir>/src/types/*"],
            "@plugin/adapters/*": ["<rootDir>/src/adapters/*"],
            "@plugin/application/*": ["<rootDir>/src/application/*"],
            "@plugin/domain/*": ["<rootDir>/src/domain/*"],
            "@plugin/infrastructure/*": ["<rootDir>/src/infrastructure/*"],
            "@plugin/presentation/*": ["<rootDir>/src/presentation/*"],
            "@plugin/*": ["<rootDir>/src/*"]
          }
        },
      },
    ],
    "^.+\\.(js|mjs)$": "babel-jest", // Transform ES modules from node_modules (uuid v13)
  },
};
