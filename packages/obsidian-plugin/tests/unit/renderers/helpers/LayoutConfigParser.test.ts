import { LayoutConfigParser } from "../../../../src/presentation/renderers/helpers/LayoutConfigParser";

describe("LayoutConfigParser", () => {
  describe("parse", () => {
    it("should return empty config for empty source", () => {
      const config = LayoutConfigParser.parse("");
      expect(config).toEqual({});
    });

    it("should return empty config for whitespace-only source", () => {
      const config = LayoutConfigParser.parse("   \n  \n   ");
      expect(config).toEqual({});
    });

    it("should parse sortBy configuration", () => {
      const config = LayoutConfigParser.parse("sortBy: exo__Asset_label");
      expect(config.sortBy).toBe("exo__Asset_label");
    });

    it("should parse sortOrder configuration", () => {
      const config = LayoutConfigParser.parse("sortOrder: desc");
      expect(config.sortOrder).toBe("desc");
    });

    it("should parse ascending sortOrder", () => {
      const config = LayoutConfigParser.parse("sortOrder: asc");
      expect(config.sortOrder).toBe("asc");
    });

    it("should parse showProperties as comma-separated list", () => {
      const config = LayoutConfigParser.parse("showProperties: status, label, priority");
      expect(config.showProperties).toEqual(["status", "label", "priority"]);
    });

    it("should trim whitespace from showProperties values", () => {
      const config = LayoutConfigParser.parse("showProperties:  prop1  ,  prop2  ,  prop3  ");
      expect(config.showProperties).toEqual(["prop1", "prop2", "prop3"]);
    });

    it("should handle single property in showProperties", () => {
      const config = LayoutConfigParser.parse("showProperties: singleProp");
      expect(config.showProperties).toEqual(["singleProp"]);
    });

    it("should parse multiple configuration lines", () => {
      const source = `
        sortBy: createdAt
        sortOrder: desc
        showProperties: name, status
      `;
      const config = LayoutConfigParser.parse(source);
      expect(config.sortBy).toBe("createdAt");
      expect(config.sortOrder).toBe("desc");
      expect(config.showProperties).toEqual(["name", "status"]);
    });

    it("should ignore empty lines between configurations", () => {
      const source = `sortBy: date

sortOrder: asc

showProperties: a, b`;
      const config = LayoutConfigParser.parse(source);
      expect(config.sortBy).toBe("date");
      expect(config.sortOrder).toBe("asc");
      expect(config.showProperties).toEqual(["a", "b"]);
    });

    it("should ignore lines that don't match key: value pattern", () => {
      const source = `
        this is not a config line
        sortBy: valid
        another invalid line
      `;
      const config = LayoutConfigParser.parse(source);
      expect(config.sortBy).toBe("valid");
      expect(Object.keys(config)).toEqual(["sortBy"]);
    });

    it("should handle lines without colon", () => {
      const config = LayoutConfigParser.parse("no-colon-here");
      expect(config).toEqual({});
    });

    it("should ignore unknown configuration keys", () => {
      const source = `
        unknownKey: someValue
        sortBy: name
        anotherUnknown: value
      `;
      const config = LayoutConfigParser.parse(source);
      expect(config.sortBy).toBe("name");
      expect((config as any).unknownKey).toBeUndefined();
      expect((config as any).anotherUnknown).toBeUndefined();
    });

    it("should handle values with colons", () => {
      const config = LayoutConfigParser.parse("sortBy: time:stamp");
      expect(config.sortBy).toBe("time:stamp");
    });

    it("should handle values with special characters", () => {
      const config = LayoutConfigParser.parse("sortBy: exo__Asset_label");
      expect(config.sortBy).toBe("exo__Asset_label");
    });

    it("should handle Windows-style line endings", () => {
      const config = LayoutConfigParser.parse("sortBy: name\r\nsortOrder: asc");
      expect(config.sortBy).toBe("name");
      expect(config.sortOrder).toBe("asc");
    });

    it("should handle leading whitespace in keys", () => {
      const config = LayoutConfigParser.parse("  sortBy: value");
      expect(config.sortBy).toBe("value");
    });

    it("should handle trailing whitespace in values", () => {
      const config = LayoutConfigParser.parse("sortBy: value   ");
      expect(config.sortBy).toBe("value");
    });
  });
});
