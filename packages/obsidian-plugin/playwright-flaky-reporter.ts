/**
 * Playwright Flaky Test Reporter
 *
 * Tracks tests that pass after retry (flaky tests) and generates
 * a JSON report for tracking. Unlike NoFlakyReporter, this does NOT
 * fail CI but instead tracks flaky tests for investigation.
 */

import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";

interface FlakyTestInfo {
  file: string;
  line: number;
  title: string;
  retryCount: number;
  duration: number;
  project: string;
}

interface FlakyReport {
  timestamp: string;
  totalFlaky: number;
  tests: FlakyTestInfo[];
  summary: {
    totalTests: number;
    flakyPercentage: number;
  };
}

interface FlakyReporterOptions {
  outputFile?: string;
  failOnFlaky?: boolean;
  verbose?: boolean;
}

class PlaywrightFlakyReporter implements Reporter {
  private flakyTests: FlakyTestInfo[] = [];
  private totalTests = 0;
  private options: Required<FlakyReporterOptions>;

  constructor(options: FlakyReporterOptions = {}) {
    this.options = {
      outputFile: options.outputFile ?? "flaky-report-playwright.json",
      failOnFlaky: options.failOnFlaky ?? false,
      verbose: options.verbose ?? true,
    };
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.totalTests++;

    // Flaky test = passed only after retries
    if (result.status === "passed" && result.retry > 0) {
      const flakyInfo: FlakyTestInfo = {
        file: test.location.file,
        line: test.location.line,
        title: test.title,
        retryCount: result.retry,
        duration: result.duration,
        project: test.parent.project()?.name ?? "unknown",
      };

      this.flakyTests.push(flakyInfo);

      if (this.options.verbose) {
        console.warn(
          `\n⚠️  FLAKY TEST DETECTED: ${test.title}\n` +
            `   Location: ${test.location.file}:${test.location.line}\n` +
            `   Retries: ${result.retry}\n` +
            `   Project: ${flakyInfo.project}\n`,
        );
      }
    }
  }

  onEnd(_result: FullResult): void {
    const report = this.generateReport();
    this.writeReport(report);

    if (this.flakyTests.length > 0) {
      this.printSummary(report);

      if (this.options.failOnFlaky) {
        console.error(
          "\n❌ CI FAILURE: Flaky tests detected!\n" +
            "   Flaky tests indicate race conditions or timing issues.\n" +
            "   All tests must pass consistently on first attempt.\n" +
            "   Please fix the flaky tests before merging.\n",
        );
        process.exitCode = 1;
      }
    }
  }

  printsToStdio(): boolean {
    return false;
  }

  private generateReport(): FlakyReport {
    const flakyPercentage =
      this.totalTests > 0
        ? Number(((this.flakyTests.length / this.totalTests) * 100).toFixed(2))
        : 0;

    return {
      timestamp: new Date().toISOString(),
      totalFlaky: this.flakyTests.length,
      tests: this.flakyTests,
      summary: {
        totalTests: this.totalTests,
        flakyPercentage,
      },
    };
  }

  private writeReport(report: FlakyReport): void {
    try {
      const outputPath = path.isAbsolute(this.options.outputFile)
        ? this.options.outputFile
        : path.join(process.cwd(), this.options.outputFile);

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

      if (this.options.verbose && this.flakyTests.length > 0) {
        console.log(`\n📊 Playwright flaky test report written to: ${outputPath}`);
      }
    } catch (error) {
      console.error(`Failed to write flaky report:`, error);
    }
  }

  private printSummary(report: FlakyReport): void {
    console.log("\n" + "=".repeat(60));
    console.log("⚠️  PLAYWRIGHT FLAKY TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total flaky tests: ${report.totalFlaky}`);
    console.log(
      `Flaky percentage: ${report.summary.flakyPercentage}% of ${report.summary.totalTests} tests`,
    );
    console.log("");

    for (const test of report.tests) {
      console.log(`  - ${test.title}`);
      console.log(`    File: ${test.file}:${test.line}`);
      console.log(`    Retries: ${test.retryCount}`);
      console.log(`    Project: ${test.project}`);
    }

    console.log("=".repeat(60) + "\n");
  }
}

export default PlaywrightFlakyReporter;
