import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

class NoFlakyReporter implements Reporter {
  private hasFlaky = false;

  onTestEnd(test: TestCase, result: TestResult) {
    // Flaky test = passed only after retries
    if (result.status === 'passed' && result.retry > 0) {
      this.hasFlaky = true;
      console.error(
        `\n❌ FLAKY TEST DETECTED (will fail CI): ${test.title}\n` +
          `   Location: ${test.location.file}:${test.location.line}\n` +
          `   This test passed after ${result.retry} retries.\n` +
          `   Flaky tests are NOT acceptable - they must be fixed!\n`,
      );
    }
  }

  onEnd(result: FullResult) {
    if (this.hasFlaky) {
      console.error(
        '\n❌ CI FAILURE: Flaky tests detected!\n' +
          '   Flaky tests indicate race conditions or timing issues.\n' +
          '   All tests must pass consistently on first attempt.\n' +
          '   Please fix the flaky tests before merging.\n',
      );
      process.exitCode = 1;
    }
  }

  printsToStdio() {
    return false;
  }
}

export default NoFlakyReporter;
