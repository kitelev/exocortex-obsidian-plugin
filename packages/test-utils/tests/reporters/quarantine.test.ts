/**
 * Tests for Quarantine System
 */

import {
  QuarantineManager,
  loadQuarantine,
  getQuarantineManager,
  isTestQuarantined,
  shouldSkipTest,
  type QuarantinedTest,
  type QuarantineConfig,
} from "../../src/reporters/quarantine";

describe("QuarantineManager", () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  const createTestQuarantine = (tests: QuarantinedTest[]): QuarantineConfig => ({
    tests,
    skipQuarantined: false,
    maxQuarantineDays: 30,
    warnOnExpired: true,
  });

  describe("isQuarantined", () => {
    it("should return true for quarantined test", () => {
      const manager = new QuarantineManager(
        createTestQuarantine([
          {
            file: "src/test.ts",
            name: "flaky test",
          },
        ]),
      );

      expect(manager.isQuarantined("src/test.ts", "flaky test")).toBe(true);
    });

    it("should return false for non-quarantined test", () => {
      const manager = new QuarantineManager(
        createTestQuarantine([
          {
            file: "src/test.ts",
            name: "flaky test",
          },
        ]),
      );

      expect(manager.isQuarantined("src/test.ts", "stable test")).toBe(false);
      expect(manager.isQuarantined("src/other.ts", "flaky test")).toBe(false);
    });

    it("should normalize Windows-style paths", () => {
      const manager = new QuarantineManager(
        createTestQuarantine([
          {
            file: "src/path/to/test.ts",
            name: "flaky test",
          },
        ]),
      );

      // Should match even with backslashes
      expect(manager.isQuarantined("src\\path\\to\\test.ts", "flaky test")).toBe(
        true,
      );
    });

    it("should return false for expired quarantine (expiresAt)", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const manager = new QuarantineManager(
        createTestQuarantine([
          {
            file: "src/test.ts",
            name: "expired test",
            expiresAt: yesterday.toISOString(),
          },
        ]),
      );

      expect(manager.isQuarantined("src/test.ts", "expired test")).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should return true for non-expired quarantine", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const manager = new QuarantineManager(
        createTestQuarantine([
          {
            file: "src/test.ts",
            name: "valid test",
            expiresAt: tomorrow.toISOString(),
          },
        ]),
      );

      expect(manager.isQuarantined("src/test.ts", "valid test")).toBe(true);
    });

    it("should return false when quarantine exceeds maxQuarantineDays", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      const manager = new QuarantineManager({
        tests: [
          {
            file: "src/test.ts",
            name: "old quarantine",
            quarantinedAt: oldDate.toISOString(),
          },
        ],
        maxQuarantineDays: 30,
        warnOnExpired: true,
      });

      expect(manager.isQuarantined("src/test.ts", "old quarantine")).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should return true when quarantine is within maxQuarantineDays", () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      const manager = new QuarantineManager({
        tests: [
          {
            file: "src/test.ts",
            name: "recent quarantine",
            quarantinedAt: recentDate.toISOString(),
          },
        ],
        maxQuarantineDays: 30,
        warnOnExpired: false,
      });

      expect(manager.isQuarantined("src/test.ts", "recent quarantine")).toBe(
        true,
      );
    });
  });

  describe("shouldSkip", () => {
    it("should return true when skipQuarantined is true and test is quarantined", () => {
      const manager = new QuarantineManager({
        tests: [{ file: "src/test.ts", name: "flaky test" }],
        skipQuarantined: true,
      });

      expect(manager.shouldSkip("src/test.ts", "flaky test")).toBe(true);
    });

    it("should return false when skipQuarantined is false", () => {
      const manager = new QuarantineManager({
        tests: [{ file: "src/test.ts", name: "flaky test" }],
        skipQuarantined: false,
      });

      expect(manager.shouldSkip("src/test.ts", "flaky test")).toBe(false);
    });

    it("should return false when test is not quarantined", () => {
      const manager = new QuarantineManager({
        tests: [{ file: "src/test.ts", name: "flaky test" }],
        skipQuarantined: true,
      });

      expect(manager.shouldSkip("src/test.ts", "stable test")).toBe(false);
    });
  });

  describe("getQuarantineInfo", () => {
    it("should return quarantine info for quarantined test", () => {
      const quarantined: QuarantinedTest = {
        file: "src/test.ts",
        name: "flaky test",
        issue: "https://github.com/org/repo/issues/123",
        reason: "Race condition",
      };

      const manager = new QuarantineManager(createTestQuarantine([quarantined]));
      const info = manager.getQuarantineInfo("src/test.ts", "flaky test");

      expect(info).toEqual(quarantined);
    });

    it("should return undefined for non-quarantined test", () => {
      const manager = new QuarantineManager(createTestQuarantine([]));
      const info = manager.getQuarantineInfo("src/test.ts", "stable test");

      expect(info).toBeUndefined();
    });
  });

  describe("getAllQuarantined", () => {
    it("should return all quarantined tests", () => {
      const tests: QuarantinedTest[] = [
        { file: "test1.ts", name: "test1" },
        { file: "test2.ts", name: "test2" },
      ];

      const manager = new QuarantineManager(createTestQuarantine(tests));
      expect(manager.getAllQuarantined()).toEqual(tests);
    });
  });

  describe("getExpiredQuarantines", () => {
    it("should return expired quarantines", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);

      const manager = new QuarantineManager({
        tests: [
          {
            file: "test1.ts",
            name: "expired by expiresAt",
            expiresAt: yesterday.toISOString(),
          },
          {
            file: "test2.ts",
            name: "expired by maxDays",
            quarantinedAt: oldDate.toISOString(),
          },
          {
            file: "test3.ts",
            name: "still valid",
          },
        ],
        maxQuarantineDays: 30,
        warnOnExpired: false,
      });

      const expired = manager.getExpiredQuarantines();
      expect(expired).toHaveLength(2);
      expect(expired.map((t) => t.name)).toContain("expired by expiresAt");
      expect(expired.map((t) => t.name)).toContain("expired by maxDays");
    });
  });

  describe("printSummary", () => {
    it("should print summary of quarantined tests", () => {
      const manager = new QuarantineManager(
        createTestQuarantine([
          {
            file: "test1.ts",
            name: "test1",
            reason: "Race condition",
            issue: "https://example.com/issue/1",
            quarantinedAt: "2025-01-01",
          },
        ]),
      );

      manager.printSummary();

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join("\n");
      expect(output).toContain("QUARANTINE SUMMARY");
      expect(output).toContain("test1");
    });

    it("should indicate when no tests are quarantined", () => {
      const manager = new QuarantineManager(createTestQuarantine([]));

      manager.printSummary();

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join("\n");
      expect(output).toContain("No tests in quarantine");
    });
  });
});

describe("Global Quarantine Functions", () => {
  beforeEach(() => {
    // Reset global manager
    loadQuarantine({ tests: [] });
  });

  describe("loadQuarantine", () => {
    it("should set global quarantine manager", () => {
      const config: QuarantineConfig = {
        tests: [{ file: "test.ts", name: "flaky" }],
      };

      const manager = loadQuarantine(config);
      expect(manager).toBeInstanceOf(QuarantineManager);
      expect(getQuarantineManager()).toBe(manager);
    });
  });

  describe("isTestQuarantined", () => {
    it("should use global manager", () => {
      loadQuarantine({
        tests: [{ file: "test.ts", name: "flaky" }],
      });

      expect(isTestQuarantined("test.ts", "flaky")).toBe(true);
      expect(isTestQuarantined("test.ts", "stable")).toBe(false);
    });

    it("should return false when no global manager", () => {
      // Manually clear global manager by loading empty config
      loadQuarantine({ tests: [] });

      expect(isTestQuarantined("test.ts", "any")).toBe(false);
    });
  });

  describe("shouldSkipTest", () => {
    it("should use global manager", () => {
      loadQuarantine({
        tests: [{ file: "test.ts", name: "flaky" }],
        skipQuarantined: true,
      });

      expect(shouldSkipTest("test.ts", "flaky")).toBe(true);
      expect(shouldSkipTest("test.ts", "stable")).toBe(false);
    });
  });
});
