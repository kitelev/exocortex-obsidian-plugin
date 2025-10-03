module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/e2e/",
    "/tests/ui/", // Exclude WebDriver UI tests
  ],
  collectCoverageFrom: [
    "main.ts",
    "src/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/tests/**",
  ],
  moduleNameMapper: {
    "^obsidian$": "<rootDir>/tests/__mocks__/obsidian.ts",
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Domain layer - higher threshold for business logic
    "./src/domain/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  // Note: setupFilesAfterEnv moved to memory optimization section above
  // Handle ES modules and other transformations in CI
  transformIgnorePatterns: ["node_modules/(?!(chai)/)"],
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
  collectCoverage: process.env.CI && process.env.COVERAGE ? true : false,
  coverageReporters: process.env.CI
    ? ["lcov", "text-summary"]
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
        },
      },
    ],
  },
};
