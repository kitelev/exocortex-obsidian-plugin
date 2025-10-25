import { WikiLinkHelpers } from "../../../src/infrastructure/utilities/WikiLinkHelpers";

describe("WikiLinkHelpers", () => {
  describe("normalize", () => {
    it("should remove [[ ]] brackets from wikilinks", () => {
      const result = WikiLinkHelpers.normalize("[[TaskName]]");
      expect(result).toBe("TaskName");
    });

    it("should remove opening brackets only", () => {
      const result = WikiLinkHelpers.normalize("[[TaskName");
      expect(result).toBe("TaskName");
    });

    it("should remove closing brackets only", () => {
      const result = WikiLinkHelpers.normalize("TaskName]]");
      expect(result).toBe("TaskName");
    });

    it("should handle already normalized values", () => {
      const result = WikiLinkHelpers.normalize("TaskName");
      expect(result).toBe("TaskName");
    });

    it("should handle null value", () => {
      const result = WikiLinkHelpers.normalize(null);
      expect(result).toBe("");
    });

    it("should handle undefined value", () => {
      const result = WikiLinkHelpers.normalize(undefined);
      expect(result).toBe("");
    });

    it("should handle empty string", () => {
      const result = WikiLinkHelpers.normalize("");
      expect(result).toBe("");
    });

    it("should trim whitespace", () => {
      const result = WikiLinkHelpers.normalize("  TaskName  ");
      expect(result).toBe("TaskName");
    });

    it("should handle nested brackets", () => {
      const result = WikiLinkHelpers.normalize("[[[[TaskName]]]]");
      expect(result).toBe("TaskName");
    });

    it("should handle mixed brackets", () => {
      const result = WikiLinkHelpers.normalize("[[Task]]Name]]");
      expect(result).toBe("TaskName");
    });

    it("should handle brackets with whitespace", () => {
      const result = WikiLinkHelpers.normalize("[[ Task Name ]]");
      expect(result).toBe("Task Name");
    });

    it("should handle single opening bracket", () => {
      const result = WikiLinkHelpers.normalize("[[TaskName]");
      expect(result).toBe("TaskName]");
    });

    it("should handle single closing bracket", () => {
      const result = WikiLinkHelpers.normalize("[TaskName]]");
      expect(result).toBe("[TaskName");
    });

    it("should preserve internal brackets", () => {
      const result = WikiLinkHelpers.normalize("[[Task[1]Name]]");
      expect(result).toBe("Task[1]Name");
    });
  });

  describe("normalizeArray", () => {
    it("should normalize array of wikilinks", () => {
      const result = WikiLinkHelpers.normalizeArray(["[[Task1]]", "[[Task2]]", "[[Task3]]"]);
      expect(result).toEqual(["Task1", "Task2", "Task3"]);
    });

    it("should handle single string value", () => {
      const result = WikiLinkHelpers.normalizeArray("[[TaskName]]");
      expect(result).toEqual(["TaskName"]);
    });

    it("should handle null value", () => {
      const result = WikiLinkHelpers.normalizeArray(null);
      expect(result).toEqual([]);
    });

    it("should handle undefined value", () => {
      const result = WikiLinkHelpers.normalizeArray(undefined);
      expect(result).toEqual([]);
    });

    it("should handle empty array", () => {
      const result = WikiLinkHelpers.normalizeArray([]);
      expect(result).toEqual([]);
    });

    it("should filter out empty strings after normalization", () => {
      const result = WikiLinkHelpers.normalizeArray(["[[Task1]]", "", "[[Task2]]", "   "]);
      expect(result).toEqual(["Task1", "Task2"]);
    });

    it("should handle mixed formats in array", () => {
      const result = WikiLinkHelpers.normalizeArray(["[[Task1]]", "Task2", "  [[Task3]]  "]);
      expect(result).toEqual(["Task1", "Task2", "Task3"]);
    });

    it("should filter out values that normalize to empty", () => {
      const result = WikiLinkHelpers.normalizeArray(["[[Task1]]", "[[]]", ""]);
      expect(result).toEqual(["Task1"]);
    });

    it("should handle array with null/undefined elements", () => {
      const result = WikiLinkHelpers.normalizeArray(["[[Task1]]", null as any, "[[Task2]]"]);
      expect(result).toEqual(["Task1", "Task2"]);
    });

    it("should handle nested brackets in array", () => {
      const result = WikiLinkHelpers.normalizeArray(["[[[[Task1]]]]", "[[Task2]]"]);
      expect(result).toEqual(["Task1", "Task2"]);
    });

    it("should preserve order", () => {
      const result = WikiLinkHelpers.normalizeArray(["[[C]]", "[[A]]", "[[B]]"]);
      expect(result).toEqual(["C", "A", "B"]);
    });

    it("should handle single non-array string", () => {
      const result = WikiLinkHelpers.normalizeArray("TaskName");
      expect(result).toEqual(["TaskName"]);
    });

    it("should handle empty string input", () => {
      const result = WikiLinkHelpers.normalizeArray("");
      expect(result).toEqual([]);
    });
  });

  describe("equals", () => {
    it("should compare normalized values", () => {
      const result = WikiLinkHelpers.equals("[[Task1]]", "Task1");
      expect(result).toBe(true);
    });

    it("should handle null comparisons", () => {
      const result = WikiLinkHelpers.equals(null, null);
      expect(result).toBe(true);
    });

    it("should handle null vs undefined", () => {
      const result = WikiLinkHelpers.equals(null, undefined);
      expect(result).toBe(true);
    });

    it("should handle undefined vs undefined", () => {
      const result = WikiLinkHelpers.equals(undefined, undefined);
      expect(result).toBe(true);
    });

    it("should handle null vs non-null", () => {
      const result = WikiLinkHelpers.equals(null, "Task");
      expect(result).toBe(false);
    });

    it("should handle undefined vs non-undefined", () => {
      const result = WikiLinkHelpers.equals(undefined, "Task");
      expect(result).toBe(false);
    });

    it("should be case-sensitive", () => {
      const result = WikiLinkHelpers.equals("TaskName", "taskname");
      expect(result).toBe(false);
    });

    it("should ignore brackets", () => {
      const result = WikiLinkHelpers.equals("[[TaskName]]", "TaskName");
      expect(result).toBe(true);
    });

    it("should handle both with brackets", () => {
      const result = WikiLinkHelpers.equals("[[TaskName]]", "[[TaskName]]");
      expect(result).toBe(true);
    });

    it("should handle empty strings", () => {
      const result = WikiLinkHelpers.equals("", "");
      expect(result).toBe(true);
    });

    it("should handle whitespace", () => {
      const result = WikiLinkHelpers.equals("  TaskName  ", "TaskName");
      expect(result).toBe(true);
    });

    it("should detect different values", () => {
      const result = WikiLinkHelpers.equals("[[Task1]]", "[[Task2]]");
      expect(result).toBe(false);
    });

    it("should handle nested brackets", () => {
      const result = WikiLinkHelpers.equals("[[[[TaskName]]]]", "TaskName");
      expect(result).toBe(true);
    });
  });

  describe("includes", () => {
    it("should check if array includes value", () => {
      const result = WikiLinkHelpers.includes(["[[Task1]]", "[[Task2]]", "[[Task3]]"], "Task2");
      expect(result).toBe(true);
    });

    it("should handle single value as array", () => {
      const result = WikiLinkHelpers.includes("[[TaskName]]", "TaskName");
      expect(result).toBe(true);
    });

    it("should normalize before comparison", () => {
      const result = WikiLinkHelpers.includes(["[[Task1]]", "[[Task2]]"], "[[Task1]]");
      expect(result).toBe(true);
    });

    it("should handle null array", () => {
      const result = WikiLinkHelpers.includes(null, "Task");
      expect(result).toBe(false);
    });

    it("should handle undefined array", () => {
      const result = WikiLinkHelpers.includes(undefined, "Task");
      expect(result).toBe(false);
    });

    it("should handle empty array", () => {
      const result = WikiLinkHelpers.includes([], "Task");
      expect(result).toBe(false);
    });

    it("should return false when value not found", () => {
      const result = WikiLinkHelpers.includes(["[[Task1]]", "[[Task2]]"], "Task3");
      expect(result).toBe(false);
    });

    it("should handle whitespace in comparisons", () => {
      const result = WikiLinkHelpers.includes(["  [[Task1]]  ", "[[Task2]]"], "Task1");
      expect(result).toBe(true);
    });

    it("should be case-sensitive", () => {
      const result = WikiLinkHelpers.includes(["[[TaskName]]"], "taskname");
      expect(result).toBe(false);
    });

    it("should handle nested brackets in array", () => {
      const result = WikiLinkHelpers.includes(["[[[[Task1]]]]", "[[Task2]]"], "Task1");
      expect(result).toBe(true);
    });

    it("should handle nested brackets in search value", () => {
      const result = WikiLinkHelpers.includes(["[[Task1]]", "[[Task2]]"], "[[[[Task1]]]]");
      expect(result).toBe(true);
    });

    it("should handle single string match", () => {
      const result = WikiLinkHelpers.includes("[[TaskName]]", "[[TaskName]]");
      expect(result).toBe(true);
    });

    it("should handle single string no match", () => {
      const result = WikiLinkHelpers.includes("[[Task1]]", "Task2");
      expect(result).toBe(false);
    });

    it("should handle empty string in array", () => {
      const result = WikiLinkHelpers.includes(["", "[[Task1]]"], "Task1");
      expect(result).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("should work together for metadata property matching", () => {
      const metadata = {
        "ems__Effort_parent": "[[ParentTask]]",
        "ems__Task_blocks": ["[[Task1]]", "[[Task2]]", "[[Task3]]"],
      };

      const hasParent = WikiLinkHelpers.equals(metadata["ems__Effort_parent"], "ParentTask");
      const blocksTask2 = WikiLinkHelpers.includes(metadata["ems__Task_blocks"], "Task2");

      expect(hasParent).toBe(true);
      expect(blocksTask2).toBe(true);
    });

    it("should handle complex normalization scenarios", () => {
      const rawValues = ["[[[[Task1]]]]", "  [[Task2]]  ", "Task3", "[[]]", null];
      const normalized = WikiLinkHelpers.normalizeArray(rawValues);

      expect(normalized).toEqual(["Task1", "Task2", "Task3"]);
      expect(WikiLinkHelpers.includes(normalized, "Task1")).toBe(true);
      expect(WikiLinkHelpers.includes(normalized, "Task4")).toBe(false);
    });

    it("should handle comparison with different formats", () => {
      const value1 = "[[TaskName]]";
      const value2 = "  TaskName  ";
      const value3 = "[[[[TaskName]]]]";

      expect(WikiLinkHelpers.equals(value1, value2)).toBe(true);
      expect(WikiLinkHelpers.equals(value2, value3)).toBe(true);
      expect(WikiLinkHelpers.equals(value1, value3)).toBe(true);
    });
  });
});
