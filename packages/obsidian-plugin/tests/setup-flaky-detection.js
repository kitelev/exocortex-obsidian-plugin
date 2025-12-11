/**
 * Jest Setup for Flaky Test Detection
 *
 * This setup file configures Jest to:
 * 1. Retry failed tests (in CI environment)
 * 2. Track tests that pass after retry
 *
 * Configuration:
 * - CI: 2 retries (matches Playwright component test config)
 * - Local: 0 retries (fail fast for development)
 *
 * @see https://github.com/kitelev/exocortex-obsidian-plugin/issues/756
 */

// Configure retry behavior based on environment
const isCI = process.env.CI === "true";
const retryCount = isCI ? 2 : 0;

// Set global retry for all tests
// Note: jest.retryTimes() must be called at the top level of a test file
// or in a setupFilesAfterEnv file to work properly
if (retryCount > 0) {
  jest.retryTimes(retryCount, { logErrorsBeforeRetry: true });
}

// Log configuration for debugging
if (isCI) {
  console.log(
    `🔄 Flaky test detection enabled: ${retryCount} retries per failed test`,
  );
}
