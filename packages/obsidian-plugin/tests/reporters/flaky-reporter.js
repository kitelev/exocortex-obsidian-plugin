/**
 * Flaky Test Reporter for Jest (JavaScript version)
 *
 * Tracks tests that pass after retry (flaky tests) and generates reports.
 * This helps identify and quarantine unreliable tests that erode CI confidence.
 *
 * A test is considered flaky if it:
 * - Failed on initial attempt
 * - Passed after one or more retries
 *
 * @see https://github.com/kitelev/exocortex-obsidian-plugin/issues/756
 */

const fs = require("fs");
const path = require("path");

class FlakyReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = {
      outputFile: options.outputFile || "flaky-report.json",
      outputDir: options.outputDir || process.cwd(),
      consoleOutput: options.consoleOutput !== false,
      failOnFlaky: options.failOnFlaky || false,
    };
    this.flakyTests = new Map();
    this.totalTests = 0;
  }

  onRunStart() {
    this.flakyTests.clear();
    this.totalTests = 0;
  }

  onTestResult(_test, testResult) {
    for (const result of testResult.testResults || []) {
      this.totalTests++;

      const invocations = result.invocations || 1;
      const retryCount = Math.max(0, invocations - 1);

      // A test is flaky if it passed but required retries
      if (result.status === "passed" && retryCount > 0) {
        const testKey = `${testResult.testFilePath}::${result.fullName}`;
        this.flakyTests.set(testKey, {
          file: testResult.testFilePath,
          name: result.fullName,
          retryCount: retryCount,
          duration: result.duration || 0,
          failureMessages: result.failureMessages || [],
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  async onRunComplete() {
    const report = this.generateReport();

    // Write JSON report
    await this.writeReport(report);

    // Console output
    if (this.options.consoleOutput && report.totalFlakyTests > 0) {
      this.printConsoleReport(report);
    }

    // Optionally fail if flaky tests detected
    if (this.options.failOnFlaky && report.totalFlakyTests > 0) {
      throw new Error(
        `Flaky test threshold exceeded: ${report.totalFlakyTests} flaky tests detected`,
      );
    }
  }

  generateReport() {
    const tests = Array.from(this.flakyTests.values());
    return {
      timestamp: new Date().toISOString(),
      totalFlakyTests: tests.length,
      totalTests: this.totalTests,
      flakyPercentage:
        this.totalTests > 0
          ? Number(((tests.length / this.totalTests) * 100).toFixed(2))
          : 0,
      tests: tests,
      ci: {
        isCI: Boolean(process.env.CI),
        runId: process.env.GITHUB_RUN_ID || undefined,
        commitSha: process.env.GITHUB_SHA || undefined,
        branch:
          process.env.GITHUB_HEAD_REF ||
          process.env.GITHUB_REF_NAME ||
          undefined,
      },
    };
  }

  async writeReport(report) {
    try {
      const outputPath = path.join(
        this.options.outputDir,
        this.options.outputFile,
      );
      const dir = path.dirname(outputPath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

      if (report.totalFlakyTests > 0 && this.options.consoleOutput) {
        console.log(`\n📊 Flaky test report written to: ${outputPath}`);
      }
    } catch (error) {
      console.error(`Failed to write flaky test report: ${error}`);
    }
  }

  printConsoleReport(report) {
    console.log("\n");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("                    ⚠️  FLAKY TESTS DETECTED");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log(`  Total tests run:  ${report.totalTests}`);
    console.log(`  Flaky tests:      ${report.totalFlakyTests}`);
    console.log(`  Flaky percentage: ${report.flakyPercentage}%`);
    console.log(
      "───────────────────────────────────────────────────────────────",
    );

    for (const test of report.tests) {
      console.log(`\n  📍 ${test.name}`);
      console.log(`     File: ${test.file}`);
      console.log(`     Retries: ${test.retryCount}`);
      console.log(`     Duration: ${test.duration}ms`);
      if (test.failureMessages && test.failureMessages.length > 0) {
        console.log(
          `     Initial failure: ${test.failureMessages[0].split("\n")[0]}`,
        );
      }
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log(
      "  Consider adding these tests to the quarantine list if they remain flaky.",
    );
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );
  }

  getLastError() {
    return undefined;
  }
}

module.exports = FlakyReporter;
