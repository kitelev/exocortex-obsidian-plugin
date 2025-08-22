/**
 * Jest configuration specifically for performance tests
 * Provides stable environment for reliable performance testing
 */

module.exports = {
  // Extend base configuration
  ...require("./jest.config"),

  // Performance test specific settings
  testMatch: [
    "**/tests/**/*Benchmark.test.ts",
    "**/tests/**/*Performance.test.ts",
  ],

  // Single worker for consistent performance measurement
  maxWorkers: 1,

  // Disable parallel execution
  runInBand: true,

  // Increased timeout for performance tests
  testTimeout: 60000,

  // Disable coverage for performance tests (adds overhead)
  collectCoverage: false,

  // Performance test environment variables
  setupFilesAfterEnv: ["<rootDir>/tests/performance-setup.ts"],

  // Disable cache for consistent results
  cache: false,

  // Force garbage collection between tests
  forceExit: true,

  // Custom environment for performance testing
  testEnvironment: "node",

  // Additional Node.js options for consistent performance
  setupFiles: ["<rootDir>/tests/performance-node-setup.js"],
};
