/**
 * Jest Retry Setup
 *
 * This file should be included in setupFilesAfterEnv to enable automatic
 * retry for all tests. Retries help identify flaky tests by running them
 * multiple times before marking as failed.
 *
 * Configuration:
 * - JEST_RETRY_TIMES: Number of retries (default: 2)
 * - JEST_RETRY_ONLY_FAILED: Only retry failed tests (default: true)
 *
 * @example
 * // In jest.config.js
 * module.exports = {
 *   setupFilesAfterEnv: [
 *     '<rootDir>/../test-utils/src/flaky/setup-retry.ts',
 *   ],
 * };
 */

// Default retry configuration
const DEFAULT_RETRY_TIMES = 2;

// Get retry times from environment or use default
const retryTimes = parseInt(process.env.JEST_RETRY_TIMES ?? '', 10) || DEFAULT_RETRY_TIMES;

// Enable retries for all tests
// jest.retryTimes is available in Jest 28+ with jest-circus runner (default)
if (typeof jest !== 'undefined' && typeof jest.retryTimes === 'function') {
  jest.retryTimes(retryTimes, { logErrorsBeforeRetry: true });

  // Log retry configuration in CI
  if (process.env.CI) {
    console.log(`[Flaky Detection] Retry configured: ${retryTimes} retries per test`);
  }
}
