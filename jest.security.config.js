const baseConfig = require("./jest.config.js");

module.exports = {
  ...baseConfig,
  displayName: "Security Tests",
  testMatch: [
    "**/security/**/*.test.ts",
    "**/*security*.test.ts",
    "**/__tests__/**/*security*.ts",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/e2e/",
    "/tests/ui/",
    "/tests/unit/(?!.*security).*", // Only include security-related tests
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  // Security test optimizations
  testTimeout: process.env.CI ? 120000 : 60000, // Longer timeout for security tests
  maxWorkers: process.env.CI ? 2 : 1, // Limited parallelization for security tests
  // Security-specific globals
  globals: {
    SECURITY_TEST_ENV: true,
    ENHANCED_VALIDATION: true,
  },
  // Enhanced error reporting for security tests
  verbose: true,
  collectCoverage: process.env.CI && process.env.COVERAGE,
  collectCoverageFrom: [
    "src/infrastructure/security/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "src/infrastructure/security/": {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
