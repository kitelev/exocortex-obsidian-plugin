import { EffortSortingHelpers } from "../../../src/infrastructure/utilities/EffortSortingHelpers";

interface EffortItem {
  isTrashed: boolean;
  isDone: boolean;
  metadata: Record<string, any>;
  startTime?: string;
}

describe("EffortSortingHelpers", () => {
  describe("sortByPriority", () => {
    it("should sort trashed items last", () => {
      const items: EffortItem[] = [
        { isTrashed: true, isDone: false, metadata: {}, startTime: "2025-01-01" },
        { isTrashed: false, isDone: false, metadata: {}, startTime: "2025-01-02" },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].isTrashed).toBe(false);
      expect(items[1].isTrashed).toBe(true);
    });

    it("should sort done items after active", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: true, metadata: {}, startTime: "2025-01-01" },
        { isTrashed: false, isDone: false, metadata: {}, startTime: "2025-01-02" },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].isDone).toBe(false);
      expect(items[1].isDone).toBe(true);
    });

    it("should sort by vote count descending", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 10 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 3 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.ems__Effort_votes).toBe(10);
      expect(items[1].metadata.ems__Effort_votes).toBe(5);
      expect(items[2].metadata.ems__Effort_votes).toBe(3);
    });

    it("should sort by start time when votes equal", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-03" },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-01" },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-02" },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].startTime).toBe("2025-01-01");
      expect(items[1].startTime).toBe("2025-01-02");
      expect(items[2].startTime).toBe("2025-01-03");
    });

    it("should handle items without votes (treat as 0)", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: {} },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 3 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.ems__Effort_votes).toBe(5);
      expect(items[1].metadata.ems__Effort_votes).toBe(3);
      expect(items[2].metadata.ems__Effort_votes).toBeUndefined();
    });

    it("should handle items with non-number votes", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: "invalid" } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 3 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.ems__Effort_votes).toBe(5);
      expect(items[1].metadata.ems__Effort_votes).toBe(3);
      expect(items[2].metadata.ems__Effort_votes).toBe("invalid");
    });

    it("should handle items without start time", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-01" },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-02" },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].startTime).toBe("2025-01-01");
      expect(items[1].startTime).toBe("2025-01-02");
      expect(items[2].startTime).toBeUndefined();
    });

    it("should prioritize items with start time over those without", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-01" },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].startTime).toBe("2025-01-01");
      expect(items[1].startTime).toBeUndefined();
    });

    it("should handle complex scenario (mixed trashed/done/votes)", () => {
      const items: EffortItem[] = [
        { isTrashed: true, isDone: true, metadata: { ems__Effort_votes: 100 }, startTime: "2025-01-01" },
        { isTrashed: false, isDone: true, metadata: { ems__Effort_votes: 50 }, startTime: "2025-01-02" },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 10 }, startTime: "2025-01-03" },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 20 }, startTime: "2025-01-04" },
        { isTrashed: true, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-05" },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].isTrashed).toBe(false);
      expect(items[0].isDone).toBe(false);
      expect(items[0].metadata.ems__Effort_votes).toBe(20);

      expect(items[1].isTrashed).toBe(false);
      expect(items[1].isDone).toBe(false);
      expect(items[1].metadata.ems__Effort_votes).toBe(10);

      expect(items[2].isTrashed).toBe(false);
      expect(items[2].isDone).toBe(true);

      expect(items[3].isTrashed).toBe(true);
      expect(items[3].isDone).toBe(false);

      expect(items[4].isTrashed).toBe(true);
      expect(items[4].isDone).toBe(true);
    });

    it("should be stable sort (preserve order for equal items)", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: {} },
        { isTrashed: false, isDone: false, metadata: {} },
      ];

      const result = EffortSortingHelpers.sortByPriority(items[0], items[1]);

      expect(result).toBe(0);
    });

    it("should handle empty metadata", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: {} },
        { isTrashed: false, isDone: false, metadata: {} },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items).toHaveLength(2);
    });

    it("should handle zero votes", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 0 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.ems__Effort_votes).toBe(5);
      expect(items[1].metadata.ems__Effort_votes).toBe(0);
    });

    it("should handle negative votes", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: -5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 0 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.ems__Effort_votes).toBe(5);
      expect(items[1].metadata.ems__Effort_votes).toBe(0);
      expect(items[2].metadata.ems__Effort_votes).toBe(-5);
    });

    it("should sort done items by votes", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: true, metadata: { ems__Effort_votes: 10 } },
        { isTrashed: false, isDone: true, metadata: { ems__Effort_votes: 20 } },
        { isTrashed: false, isDone: true, metadata: { ems__Effort_votes: 5 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.ems__Effort_votes).toBe(20);
      expect(items[1].metadata.ems__Effort_votes).toBe(10);
      expect(items[2].metadata.ems__Effort_votes).toBe(5);
    });

    it("should sort trashed items by votes", () => {
      const items: EffortItem[] = [
        { isTrashed: true, isDone: false, metadata: { ems__Effort_votes: 10 } },
        { isTrashed: true, isDone: false, metadata: { ems__Effort_votes: 20 } },
        { isTrashed: true, isDone: false, metadata: { ems__Effort_votes: 5 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.ems__Effort_votes).toBe(20);
      expect(items[1].metadata.ems__Effort_votes).toBe(10);
      expect(items[2].metadata.ems__Effort_votes).toBe(5);
    });

    it("should handle both items without start time", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
      ];

      const result = EffortSortingHelpers.sortByPriority(items[0], items[1]);

      expect(result).toBe(0);
    });

    it("should handle lexicographic start time comparison", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-12-31" },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-01-01" },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 }, startTime: "2025-06-15" },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].startTime).toBe("2025-01-01");
      expect(items[1].startTime).toBe("2025-06-15");
      expect(items[2].startTime).toBe("2025-12-31");
    });
  });

  describe("integration scenarios", () => {
    it("should sort real-world effort items correctly", () => {
      const items: EffortItem[] = [
        {
          isTrashed: false,
          isDone: false,
          metadata: {
            ems__Effort_votes: 15,
            exo__Asset_label: "High priority task",
          },
          startTime: "2025-10-24T10:00:00",
        },
        {
          isTrashed: false,
          isDone: true,
          metadata: {
            ems__Effort_votes: 100,
            exo__Asset_label: "Completed task",
          },
          startTime: "2025-10-20T08:00:00",
        },
        {
          isTrashed: true,
          isDone: false,
          metadata: {
            ems__Effort_votes: 50,
            exo__Asset_label: "Trashed task",
          },
          startTime: "2025-10-23T14:00:00",
        },
        {
          isTrashed: false,
          isDone: false,
          metadata: {
            ems__Effort_votes: 15,
            exo__Asset_label: "Another high priority",
          },
          startTime: "2025-10-24T08:00:00",
        },
        {
          isTrashed: false,
          isDone: false,
          metadata: {
            ems__Effort_votes: 5,
            exo__Asset_label: "Lower priority",
          },
          startTime: "2025-10-25T12:00:00",
        },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);

      expect(items[0].metadata.exo__Asset_label).toBe("Another high priority");
      expect(items[1].metadata.exo__Asset_label).toBe("High priority task");
      expect(items[2].metadata.exo__Asset_label).toBe("Lower priority");
      expect(items[3].metadata.exo__Asset_label).toBe("Completed task");
      expect(items[4].metadata.exo__Asset_label).toBe("Trashed task");
    });

    it("should maintain correct order through multiple sorts", () => {
      const items: EffortItem[] = [
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 10 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 5 } },
        { isTrashed: false, isDone: false, metadata: { ems__Effort_votes: 15 } },
      ];

      items.sort(EffortSortingHelpers.sortByPriority);
      expect(items[0].metadata.ems__Effort_votes).toBe(15);

      items.sort(EffortSortingHelpers.sortByPriority);
      expect(items[0].metadata.ems__Effort_votes).toBe(15);
    });
  });
});
