import { EffortSortingHelpers } from "../../src/utilities/EffortSortingHelpers";

describe("EffortSortingHelpers", () => {
  describe("sortByPriority", () => {
    it("should prioritize non-trashed over trashed", () => {
      const a = { isTrashed: false, isDone: false, metadata: {} };
      const b = { isTrashed: true, isDone: false, metadata: {} };
      expect(EffortSortingHelpers.sortByPriority(a, b)).toBe(-1);
      expect(EffortSortingHelpers.sortByPriority(b, a)).toBe(1);
    });

    it("should prioritize not done over done", () => {
      const a = { isTrashed: false, isDone: false, metadata: {} };
      const b = { isTrashed: false, isDone: true, metadata: {} };
      expect(EffortSortingHelpers.sortByPriority(a, b)).toBe(-1);
      expect(EffortSortingHelpers.sortByPriority(b, a)).toBe(1);
    });

    it("should sort by votes (descending)", () => {
      const a = {
        isTrashed: false,
        isDone: false,
        metadata: { ems__Effort_votes: 5 },
      };
      const b = {
        isTrashed: false,
        isDone: false,
        metadata: { ems__Effort_votes: 10 },
      };
      expect(EffortSortingHelpers.sortByPriority(a, b)).toBe(5);
      expect(EffortSortingHelpers.sortByPriority(b, a)).toBe(-5);
    });

    it("should handle missing votes as zero", () => {
      const a = { isTrashed: false, isDone: false, metadata: {} };
      const b = {
        isTrashed: false,
        isDone: false,
        metadata: { ems__Effort_votes: 3 },
      };
      expect(EffortSortingHelpers.sortByPriority(a, b)).toBe(3);
    });

    it("should sort by startTime if votes equal", () => {
      const a = {
        isTrashed: false,
        isDone: false,
        metadata: {},
        startTime: "2025-01-15",
      };
      const b = {
        isTrashed: false,
        isDone: false,
        metadata: {},
        startTime: "2025-01-20",
      };
      expect(EffortSortingHelpers.sortByPriority(a, b)).toBeLessThan(0);
    });

    it("should prioritize items with startTime over those without", () => {
      const a = {
        isTrashed: false,
        isDone: false,
        metadata: {},
        startTime: "2025-01-15",
      };
      const b = { isTrashed: false, isDone: false, metadata: {} };
      expect(EffortSortingHelpers.sortByPriority(a, b)).toBe(-1);
      expect(EffortSortingHelpers.sortByPriority(b, a)).toBe(1);
    });
  });
});
