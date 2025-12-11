/**
 * Unit tests for Flaky Test Detection and Quarantine System
 *
 * Tests FlakyReporter and quarantine utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Test, AggregatedResult, TestContext } from '@jest/reporters';
import type { TestResult } from '@jest/test-result';
import type { Config } from '@jest/types';
import FlakyReporter, {
  FlakyReport,
  FlakyReporterOptions,
} from '../src/flaky/FlakyReporter';
import {
  QUARANTINED_TESTS,
  isQuarantined,
  shouldSkipTest,
  getQuarantinedTests,
  getQuarantineStats,
  generateQuarantineReport,
  QuarantinedTest,
} from '../src/flaky/quarantine';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('FlakyReporter', () => {
  let reporter: FlakyReporter;
  let mockGlobalConfig: Config.GlobalConfig;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock fs methods
    mockFs.existsSync.mockReturnValue(true);
    mockFs.writeFileSync.mockImplementation();
    mockFs.mkdirSync.mockImplementation();

    // Create mock global config
    mockGlobalConfig = {
      rootDir: '/test/project',
    } as Config.GlobalConfig;

    reporter = new FlakyReporter(mockGlobalConfig, {
      outputFile: 'flaky-report.json',
      consoleOutput: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('onRunStart', () => {
    it('should reset state for new test run', () => {
      reporter.onRunStart({} as AggregatedResult, {} as never);
      // No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('onTestFileResult', () => {
    it('should detect flaky test that passed after retry', () => {
      reporter.onRunStart({} as AggregatedResult, {} as never);

      const mockTestResult = createMockTestResult([
        {
          fullName: 'Flaky Test',
          status: 'passed',
          invocations: 2, // Passed on second attempt
          duration: 100,
          failureMessages: ['First failure message'],
        },
      ]);

      reporter.onTestFileResult(
        {} as Test,
        mockTestResult,
        {} as AggregatedResult,
      );

      reporter.onRunComplete(
        new Set<TestContext>(),
        {} as AggregatedResult,
      );

      // Should write report
      expect(mockFs.writeFileSync).toHaveBeenCalled();

      const [, content] = mockFs.writeFileSync.mock.calls[0];
      const report: FlakyReport = JSON.parse(content as string);

      expect(report.totalFlakyTests).toBe(1);
      expect(report.tests).toHaveLength(1);
      expect(report.tests[0].name).toBe('Flaky Test');
    });

    it('should not flag test that passed on first attempt', () => {
      reporter.onRunStart({} as AggregatedResult, {} as never);

      const mockTestResult = createMockTestResult([
        {
          fullName: 'Stable Test',
          status: 'passed',
          invocations: 1,
          duration: 50,
        },
      ]);

      reporter.onTestFileResult(
        {} as Test,
        mockTestResult,
        {} as AggregatedResult,
      );

      reporter.onRunComplete(
        new Set<TestContext>(),
        {} as AggregatedResult,
      );

      // Should write report
      expect(mockFs.writeFileSync).toHaveBeenCalled();

      const [, content] = mockFs.writeFileSync.mock.calls[0];
      const report: FlakyReport = JSON.parse(content as string);

      expect(report.totalFlakyTests).toBe(0);
    });

    it('should not flag failed tests as flaky', () => {
      reporter.onRunStart({} as AggregatedResult, {} as never);

      const mockTestResult = createMockTestResult([
        {
          fullName: 'Failed Test',
          status: 'failed',
          invocations: 3,
          duration: 200,
          failureMessages: ['Permanent failure'],
        },
      ]);

      reporter.onTestFileResult(
        {} as Test,
        mockTestResult,
        {} as AggregatedResult,
      );

      reporter.onRunComplete(
        new Set<TestContext>(),
        {} as AggregatedResult,
      );

      const [, content] = mockFs.writeFileSync.mock.calls[0];
      const report: FlakyReport = JSON.parse(content as string);

      expect(report.totalFlakyTests).toBe(0);
    });
  });

  describe('onRunComplete', () => {
    it('should write JSON report to file', () => {
      reporter.onRunStart({} as AggregatedResult, {} as never);
      reporter.onRunComplete(
        new Set<TestContext>(),
        {} as AggregatedResult,
      );

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const [filePath] = mockFs.writeFileSync.mock.calls[0];
      expect(filePath).toContain('flaky-report.json');
    });

    it('should create output directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      reporter = new FlakyReporter(mockGlobalConfig, {
        outputFile: 'reports/flaky-report.json',
        outputDir: '/test/output',
      });

      reporter.onRunStart({} as AggregatedResult, {} as never);
      reporter.onRunComplete(
        new Set<TestContext>(),
        {} as AggregatedResult,
      );

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true },
      );
    });

    it('should include CI environment information', () => {
      reporter.onRunStart({} as AggregatedResult, {} as never);
      reporter.onRunComplete(
        new Set<TestContext>(),
        {} as AggregatedResult,
      );

      const [, content] = mockFs.writeFileSync.mock.calls[0];
      const report: FlakyReport = JSON.parse(content as string);

      expect(report.ci).toBeDefined();
      // CI environment detection is based on process.env.CI
      expect(typeof report.ci.isCI).toBe('boolean');
    });
  });

  describe('getLastError', () => {
    it('should return undefined', () => {
      expect(reporter.getLastError()).toBeUndefined();
    });
  });
});

describe('Quarantine System', () => {
  describe('QUARANTINED_TESTS', () => {
    it('should be an array', () => {
      expect(Array.isArray(QUARANTINED_TESTS)).toBe(true);
    });

    it('should have valid structure for each entry', () => {
      for (const test of QUARANTINED_TESTS) {
        expect(test).toHaveProperty('file');
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('issue');
        expect(test).toHaveProperty('quarantinedAt');
        expect(typeof test.file).toBe('string');
        expect(typeof test.name).toBe('string');
        expect(typeof test.issue).toBe('string');
        expect(typeof test.quarantinedAt).toBe('string');
      }
    });
  });

  describe('isQuarantined', () => {
    it('should return undefined for non-quarantined test', () => {
      const result = isQuarantined(
        'packages/obsidian-plugin/tests/unit/services/SomeService.test.ts',
        'SomeService › should work correctly',
      );
      expect(result).toBeUndefined();
    });

    it('should handle empty quarantine list', () => {
      if (QUARANTINED_TESTS.length === 0) {
        const result = isQuarantined('any/test/file.test.ts', 'Any Test Name');
        expect(result).toBeUndefined();
      }
    });
  });

  describe('shouldSkipTest', () => {
    it('should return false for non-quarantined test', () => {
      const result = shouldSkipTest(
        'packages/obsidian-plugin/tests/unit/services/SomeService.test.ts',
        'SomeService › should work correctly',
      );
      expect(result).toBe(false);
    });
  });

  describe('getQuarantinedTests', () => {
    it('should return a copy of quarantined tests', () => {
      const tests = getQuarantinedTests();
      expect(tests).toEqual(QUARANTINED_TESTS);
      expect(tests).not.toBe(QUARANTINED_TESTS);
    });

    it('should be safe to modify returned array', () => {
      const tests = getQuarantinedTests();
      const originalLength = QUARANTINED_TESTS.length;

      tests.push({
        file: 'test.ts',
        name: 'Test',
        issue: '#999',
        quarantinedAt: '2025-12-11',
      });

      expect(QUARANTINED_TESTS.length).toBe(originalLength);
    });
  });

  describe('getQuarantineStats', () => {
    it('should return correct total count', () => {
      const stats = getQuarantineStats();
      expect(stats.total).toBe(QUARANTINED_TESTS.length);
    });

    it('should return object with required properties', () => {
      const stats = getQuarantineStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byFile');
      expect(stats).toHaveProperty('byIssue');
      expect(typeof stats.total).toBe('number');
      expect(stats.byFile instanceof Map).toBe(true);
      expect(stats.byIssue instanceof Map).toBe(true);
    });
  });

  describe('generateQuarantineReport', () => {
    it('should generate a markdown report', () => {
      const report = generateQuarantineReport();
      expect(typeof report).toBe('string');
      expect(report).toContain('Quarantined Tests Report');
    });

    it('should show empty message when no tests are quarantined', () => {
      if (QUARANTINED_TESTS.length === 0) {
        const report = generateQuarantineReport();
        expect(report).toContain('No tests are currently quarantined');
      }
    });
  });
});

describe('QuarantinedTest interface', () => {
  it('should accept valid test entry', () => {
    const validEntry: QuarantinedTest = {
      file: 'packages/obsidian-plugin/tests/unit/services/ExampleService.test.ts',
      name: 'ExampleService › asyncOperation › should handle race condition',
      issue: '#123',
      quarantinedAt: '2025-12-11',
    };

    expect(validEntry.file).toBeDefined();
    expect(validEntry.name).toBeDefined();
    expect(validEntry.issue).toBeDefined();
    expect(validEntry.quarantinedAt).toBeDefined();
  });

  it('should accept entry with optional fields', () => {
    const entryWithOptionals: QuarantinedTest = {
      file: 'test.ts',
      name: 'Test',
      issue: '#123',
      quarantinedAt: '2025-12-11',
      reason: 'Test reason',
      expectedFixDate: '2025-01-11',
      observedFlakyCount: 5,
    };

    expect(entryWithOptionals.reason).toBe('Test reason');
    expect(entryWithOptionals.expectedFixDate).toBe('2025-01-11');
    expect(entryWithOptionals.observedFlakyCount).toBe(5);
  });
});

// Helper function to create mock test results
function createMockTestResult(
  testResults: Array<{
    fullName: string;
    status: 'passed' | 'failed' | 'pending';
    invocations?: number;
    duration?: number;
    failureMessages?: string[];
  }>,
): TestResult {
  return {
    testFilePath: '/test/project/tests/example.test.ts',
    testResults: testResults.map((r) => ({
      fullName: r.fullName,
      status: r.status,
      invocations: r.invocations ?? 1,
      duration: r.duration ?? 0,
      failureMessages: r.failureMessages ?? [],
      ancestorTitles: [],
      numPassingAsserts: 0,
      title: r.fullName,
    })),
    numFailingTests: testResults.filter((r) => r.status === 'failed').length,
    numPassingTests: testResults.filter((r) => r.status === 'passed').length,
    numPendingTests: testResults.filter((r) => r.status === 'pending').length,
    numTodoTests: 0,
    startTime: Date.now(),
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      unmatched: 0,
      updated: 0,
      uncheckedKeys: [],
    },
    perfStats: {
      start: Date.now(),
      end: Date.now(),
      runtime: 100,
      slow: false,
    },
    leaks: false,
  } as unknown as TestResult;
}
