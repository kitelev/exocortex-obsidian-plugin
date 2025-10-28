import { EffortSortingHelpers } from "../../src/utilities/EffortSortingHelpers";

describe("EffortSortingHelpers", () => {
  describe("sortEfforts", () => {
    it("should sort by priority", () => {
      const efforts = [
        { priority: 3, status: "ToDo" },
        { priority: 1, status: "ToDo" },
        { priority: 2, status: "ToDo" }
      ];
      const sorted = EffortSortingHelpers.sortEfforts(efforts);
      expect(sorted[0].priority).toBe(1);
      expect(sorted[2].priority).toBe(3);
    });
  });
});
