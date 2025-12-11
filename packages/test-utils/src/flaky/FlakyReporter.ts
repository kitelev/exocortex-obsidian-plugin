/**
 * FlakyReporter - Jest custom reporter for detecting and tracking flaky tests
 *
 * A flaky test is one that passes after being retried (failed initially but succeeded on retry).
 * This reporter tracks such tests and generates reports for CI integration.
 *
 * @see https://jestjs.io/docs/configuration#reporters-arraymodulename--modulename-options
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  AggregatedResult,
  Config,
  Reporter,
  TestContext,
  ReporterOnStartOptions,
  Test,
} from '@jest/reporters';
import type { TestResult, AssertionResult } from '@jest/test-result';

export interface FlakyTestInfo {
  /** Full test file path */
  file: string;
  /** Test name (including describe blocks) */
  name: string;
  /** Number of times this test was retried before passing */
  retryCount: number;
  /** Duration of successful run in milliseconds */
  duration: number;
  /** Error message from failed attempt(s) */
  failureMessages: string[];
  /** Timestamp when the flaky test was detected */
  detectedAt: string;
}

export interface FlakyReport {
  /** Timestamp of the report generation */
  timestamp: string;
  /** Total number of flaky tests detected */
  totalFlakyTests: number;
  /** Total number of tests run */
  totalTests: number;
  /** Flaky test percentage */
  flakyPercentage: number;
  /** Detailed list of flaky tests */
  tests: FlakyTestInfo[];
  /** CI environment information */
  ci: {
    isCI: boolean;
    runId?: string;
    commitSha?: string;
    branch?: string;
  };
}

export interface FlakyReporterOptions {
  /** Output file path for JSON report (default: flaky-report.json) */
  outputFile?: string;
  /** Directory for reports (default: current working directory) */
  outputDir?: string;
  /** Whether to fail the test run if flaky tests are detected (default: false) */
  failOnFlaky?: boolean;
  /** Minimum number of flaky occurrences before flagging (default: 1) */
  flakyThreshold?: number;
  /** Whether to output to console (default: true) */
  consoleOutput?: boolean;
}

const DEFAULT_OPTIONS: Required<FlakyReporterOptions> = {
  outputFile: 'flaky-report.json',
  outputDir: process.cwd(),
  failOnFlaky: false,
  flakyThreshold: 1,
  consoleOutput: true,
};

export default class FlakyReporter implements Reporter {
  private readonly options: Required<FlakyReporterOptions>;
  private flakyTests: Map<string, FlakyTestInfo> = new Map();
  private totalTests: number = 0;

  constructor(
    _globalConfig: Config.GlobalConfig,
    reporterOptions?: FlakyReporterOptions,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...reporterOptions };
  }

  onRunStart(
    _results: AggregatedResult,
    _options: ReporterOnStartOptions,
  ): void {
    this.flakyTests.clear();
    this.totalTests = 0;
  }

  onTestFileResult(
    _test: Test,
    testResult: TestResult,
    _aggregatedResult: AggregatedResult,
  ): void {
    const { testResults } = testResult;

    for (const result of testResults) {
      this.totalTests++;

      // A test is flaky if it passed but had invocations > 1 (meaning it was retried)
      // or if it has a retry count > 0
      if (this.isFlaky(result)) {
        const key = `${testResult.testFilePath}::${result.fullName}`;
        this.flakyTests.set(key, {
          file: testResult.testFilePath,
          name: result.fullName,
          retryCount: this.getRetryCount(result),
          duration: result.duration ?? 0,
          failureMessages: result.failureMessages || [],
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  async onRunComplete(
    _testContexts: Set<TestContext>,
    _results: AggregatedResult,
  ): Promise<void> {
    const report = this.generateReport();

    // Write JSON report
    await this.writeReport(report);

    // Console output
    if (this.options.consoleOutput && report.totalFlakyTests > 0) {
      this.printConsoleReport(report);
    }

    // Optionally fail if flaky tests detected
    if (
      this.options.failOnFlaky &&
      report.totalFlakyTests >= this.options.flakyThreshold
    ) {
      throw new Error(
        `Flaky test threshold exceeded: ${report.totalFlakyTests} flaky tests detected (threshold: ${this.options.flakyThreshold})`,
      );
    }
  }

  private isFlaky(result: AssertionResult): boolean {
    // Test passed but had invocations > 1 means it was retried
    // Jest sets invocations when using jest.retryTimes()
    if (result.status === 'passed' && (result.invocations ?? 1) > 1) {
      return true;
    }

    // Check for retry count in result (depends on Jest version)
    const retryCount = this.getRetryCount(result);
    if (result.status === 'passed' && retryCount > 0) {
      return true;
    }

    return false;
  }

  private getRetryCount(result: AssertionResult): number {
    // invocations - 1 gives us the number of retries
    // (first invocation is the original attempt)
    const invocations = result.invocations ?? 1;
    return Math.max(0, invocations - 1);
  }

  private generateReport(): FlakyReport {
    const tests = Array.from(this.flakyTests.values());
    const totalFlakyTests = tests.length;

    return {
      timestamp: new Date().toISOString(),
      totalFlakyTests,
      totalTests: this.totalTests,
      flakyPercentage:
        this.totalTests > 0
          ? Number(((totalFlakyTests / this.totalTests) * 100).toFixed(2))
          : 0,
      tests,
      ci: {
        isCI: Boolean(process.env.CI),
        runId: process.env.GITHUB_RUN_ID,
        commitSha: process.env.GITHUB_SHA,
        branch:
          process.env.GITHUB_HEAD_REF ||
          process.env.GITHUB_REF_NAME ||
          undefined,
      },
    };
  }

  private async writeReport(report: FlakyReport): Promise<void> {
    const outputPath = path.join(this.options.outputDir, this.options.outputFile);

    try {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to write flaky report to ${outputPath}:`, error);
    }
  }

  private printConsoleReport(report: FlakyReport): void {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    ⚠️  FLAKY TESTS DETECTED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total tests run:  ${report.totalTests}`);
    console.log(`  Flaky tests:      ${report.totalFlakyTests}`);
    console.log(`  Flaky percentage: ${report.flakyPercentage}%`);
    console.log('───────────────────────────────────────────────────────────────');

    for (const test of report.tests) {
      console.log(`\n  📍 ${test.name}`);
      console.log(`     File: ${test.file}`);
      console.log(`     Retries: ${test.retryCount}`);
      console.log(`     Duration: ${test.duration}ms`);
      if (test.failureMessages.length > 0) {
        console.log(`     Initial failure: ${test.failureMessages[0].split('\n')[0]}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  Report saved to:', path.join(this.options.outputDir, this.options.outputFile));
    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  getLastError(): Error | undefined {
    return undefined;
  }
}
