/**
 * Flaky Test Detection and Quarantine System
 *
 * This module provides tools for detecting, tracking, and managing flaky tests:
 *
 * - **FlakyReporter**: Jest custom reporter that detects tests passing after retry
 * - **Quarantine**: System for managing known flaky tests without failing CI
 *
 * @module flaky
 */

export { default as FlakyReporter } from './FlakyReporter';
export type {
  FlakyTestInfo,
  FlakyReport,
  FlakyReporterOptions,
} from './FlakyReporter';

export {
  QUARANTINED_TESTS,
  isQuarantined,
  shouldSkipTest,
  getQuarantinedTests,
  getQuarantineStats,
  quarantineTest,
  generateQuarantineReport,
} from './quarantine';
export type { QuarantinedTest } from './quarantine';
