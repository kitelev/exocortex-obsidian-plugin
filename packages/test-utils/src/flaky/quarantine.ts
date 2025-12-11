/**
 * Quarantine System for Known Flaky Tests
 *
 * This module provides utilities for managing quarantined (known flaky) tests.
 * Quarantined tests are:
 * - Still executed but their failures don't fail the CI build
 * - Tracked for future fixing
 * - Reported separately in test results
 *
 * Usage:
 * 1. Add test to QUARANTINED_TESTS list with issue tracking
 * 2. Use shouldSkipTest() in test setup to conditionally skip
 * 3. Use quarantineTest() wrapper for conditional execution
 *
 * @example
 * // In test file
 * import { isQuarantined, quarantineTest } from '@exocortex/test-utils';
 *
 * describe('MyComponent', () => {
 *   quarantineTest('flaky async test', async () => {
 *     // Test code that sometimes fails
 *   });
 * });
 */

export interface QuarantinedTest {
  /** File path pattern (glob or exact) */
  file: string;
  /** Test name (can be partial match) */
  name: string;
  /** GitHub issue tracking this flaky test */
  issue: string;
  /** Date when the test was quarantined */
  quarantinedAt: string;
  /** Reason for quarantine */
  reason?: string;
  /** Expected fix date (optional) */
  expectedFixDate?: string;
  /** Number of times this test was observed as flaky before quarantine */
  observedFlakyCount?: number;
}

/**
 * List of quarantined (known flaky) tests.
 *
 * Add tests here when:
 * 1. A test fails intermittently in CI
 * 2. The root cause is identified but fix is non-trivial
 * 3. A GitHub issue has been created to track the fix
 *
 * Remove tests when:
 * 1. The underlying issue has been fixed
 * 2. The test has been stable for at least 10 CI runs
 *
 * @example
 * {
 *   file: 'packages/obsidian-plugin/tests/component/MyComponent.test.ts',
 *   name: 'should handle rapid clicks',
 *   issue: '#123',
 *   quarantinedAt: '2025-12-11',
 *   reason: 'Race condition with async state updates',
 * }
 */
export const QUARANTINED_TESTS: QuarantinedTest[] = [
  // Example (commented out):
  // {
  //   file: 'packages/obsidian-plugin/tests/component/MyComponent.test.ts',
  //   name: 'should handle rapid clicks',
  //   issue: '#123',
  //   quarantinedAt: '2025-12-11',
  //   reason: 'Race condition with async state updates',
  // }
];

/**
 * Check if a test is quarantined
 *
 * @param testFile - Full path to the test file
 * @param testName - Full test name (including describe blocks)
 * @returns The QuarantinedTest entry if quarantined, undefined otherwise
 */
export function isQuarantined(
  testFile: string,
  testName: string,
): QuarantinedTest | undefined {
  return QUARANTINED_TESTS.find((qt) => {
    const fileMatches =
      testFile.includes(qt.file) || matchGlob(testFile, qt.file);
    const nameMatches = testName.includes(qt.name) || qt.name.includes(testName);
    return fileMatches && nameMatches;
  });
}

/**
 * Check if a test should be skipped (quarantined)
 *
 * @param testFile - Full path to the test file
 * @param testName - Full test name
 * @returns true if the test should be skipped
 */
export function shouldSkipTest(testFile: string, testName: string): boolean {
  return isQuarantined(testFile, testName) !== undefined;
}

/**
 * Get all quarantined tests
 *
 * @returns Copy of the quarantined tests list
 */
export function getQuarantinedTests(): QuarantinedTest[] {
  return [...QUARANTINED_TESTS];
}

/**
 * Get quarantine statistics
 *
 * @returns Object with quarantine stats
 */
export function getQuarantineStats(): {
  total: number;
  byFile: Map<string, number>;
  byIssue: Map<string, QuarantinedTest[]>;
  oldestQuarantine: QuarantinedTest | undefined;
} {
  const byFile = new Map<string, number>();
  const byIssue = new Map<string, QuarantinedTest[]>();

  for (const test of QUARANTINED_TESTS) {
    // Count by file
    const currentCount = byFile.get(test.file) ?? 0;
    byFile.set(test.file, currentCount + 1);

    // Group by issue
    const issueTests = byIssue.get(test.issue) ?? [];
    issueTests.push(test);
    byIssue.set(test.issue, issueTests);
  }

  // Find oldest quarantine
  const sortedByDate = [...QUARANTINED_TESTS].sort(
    (a, b) =>
      new Date(a.quarantinedAt).getTime() - new Date(b.quarantinedAt).getTime(),
  );

  return {
    total: QUARANTINED_TESTS.length,
    byFile,
    byIssue,
    oldestQuarantine: sortedByDate[0],
  };
}

/**
 * Wrapper for quarantined tests that marks them appropriately
 *
 * Usage:
 * ```ts
 * import { quarantineTest } from '@exocortex/test-utils';
 *
 * quarantineTest('flaky test name', async () => {
 *   // test implementation
 * }, '#123');
 * ```
 *
 * @param name - Test name
 * @param fn - Test function
 * @param issue - GitHub issue tracking this quarantine
 */
export function quarantineTest(
  name: string,
  fn: () => void | Promise<void>,
  issue: string,
): void {
  // Use Jest's it.skip for quarantined tests in CI
  // In local development, run them but mark as quarantined
  const isCI = Boolean(process.env.CI);
  const runQuarantined = Boolean(process.env.RUN_QUARANTINED_TESTS);

  const quarantinedName = `[QUARANTINED ${issue}] ${name}`;

  if (isCI && !runQuarantined) {
    // Skip in CI unless explicitly requested
    // Note: it.skip doesn't run the callback, so the signature doesn't matter
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    it.skip(quarantinedName, () => {});
  } else {
    // Run locally or when explicitly requested
    it(quarantinedName, async () => {
      try {
        await fn();
      } catch (error) {
        // In non-CI mode, log but don't fail
        if (!isCI) {
          console.warn(
            `\n⚠️ Quarantined test failed (expected): ${name}\n` +
              `   Issue: ${issue}\n` +
              `   Error: ${error instanceof Error ? error.message : String(error)}\n`,
          );
        }
        throw error;
      }
    });
  }
}

/**
 * Simple glob pattern matching (supports * and **)
 */
function matchGlob(path: string, pattern: string): boolean {
  // Escape special regex characters except * and **
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{DOUBLE_STAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/{{DOUBLE_STAR}}/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Generate a quarantine report for CI/CD
 *
 * @returns Formatted report string
 */
export function generateQuarantineReport(): string {
  const stats = getQuarantineStats();
  const lines: string[] = [];

  lines.push('# Quarantined Tests Report');
  lines.push('');
  lines.push(`Total quarantined tests: ${stats.total}`);
  lines.push('');

  if (stats.total === 0) {
    lines.push('✅ No tests are currently quarantined.');
    return lines.join('\n');
  }

  lines.push('## By Issue');
  lines.push('');
  for (const [issue, tests] of stats.byIssue) {
    lines.push(`### ${issue}`);
    for (const test of tests) {
      lines.push(`- \`${test.name}\``);
      lines.push(`  - File: \`${test.file}\``);
      lines.push(`  - Quarantined: ${test.quarantinedAt}`);
      if (test.reason) {
        lines.push(`  - Reason: ${test.reason}`);
      }
    }
    lines.push('');
  }

  if (stats.oldestQuarantine) {
    const daysQuarantined = Math.floor(
      (Date.now() - new Date(stats.oldestQuarantine.quarantinedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    lines.push('## Attention Needed');
    lines.push('');
    lines.push(
      `⚠️ Oldest quarantined test has been quarantined for ${daysQuarantined} days:`,
    );
    lines.push(`   - ${stats.oldestQuarantine.name}`);
    lines.push(`   - Issue: ${stats.oldestQuarantine.issue}`);
  }

  return lines.join('\n');
}
