import { extractInstanceClass } from "../../../src/domain/property-editor/extractInstanceClass";

describe("extractInstanceClass", () => {
  describe("array values", () => {
    it("should extract class from array with wikilink format", () => {
      const frontmatter = { "exo__Instance_class": ["[[ems__Task]]"] };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should extract class from array with plain string", () => {
      const frontmatter = { "exo__Instance_class": ["ems__Project"] };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Project");
    });

    it("should extract first element from multi-element array", () => {
      const frontmatter = { "exo__Instance_class": ["[[ems__Task]]", "[[ems__Project]]"] };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should handle empty array with default", () => {
      const frontmatter = { "exo__Instance_class": [] };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should strip quotes from array element", () => {
      const frontmatter = { "exo__Instance_class": ['"ems__Meeting"'] };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Meeting");
    });
  });

  describe("string values", () => {
    it("should extract class from wikilink string", () => {
      const frontmatter = { "exo__Instance_class": "[[ems__Task]]" };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should extract class from plain string", () => {
      const frontmatter = { "exo__Instance_class": "ems__Initiative" };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Initiative");
    });

    it("should strip quotes from string value", () => {
      const frontmatter = { "exo__Instance_class": '"ems__Area"' };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Area");
    });
  });

  describe("missing or invalid values", () => {
    it("should return default for missing property", () => {
      const frontmatter = {};
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should return default for null value", () => {
      const frontmatter = { "exo__Instance_class": null };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should return default for undefined value", () => {
      const frontmatter = { "exo__Instance_class": undefined };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should return default for number value", () => {
      const frontmatter = { "exo__Instance_class": 123 };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });

    it("should return default for boolean value", () => {
      const frontmatter = { "exo__Instance_class": true };
      expect(extractInstanceClass(frontmatter)).toBe("ems__Task");
    });
  });
});
