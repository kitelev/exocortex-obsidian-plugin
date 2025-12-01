import { BuiltInFunctions } from "../../../../../src/infrastructure/sparql/filters/BuiltInFunctions";
import { IRI } from "../../../../../src/domain/models/rdf/IRI";
import { Literal } from "../../../../../src/domain/models/rdf/Literal";
import { BlankNode } from "../../../../../src/domain/models/rdf/BlankNode";

describe("BuiltInFunctions", () => {
  describe("STR", () => {
    it("should return IRI value as string", () => {
      const iri = new IRI("http://example.org/resource");
      expect(BuiltInFunctions.str(iri)).toBe("http://example.org/resource");
    });

    it("should return literal value as string", () => {
      const literal = new Literal("test value");
      expect(BuiltInFunctions.str(literal)).toBe("test value");
    });

    it("should return blank node ID as string", () => {
      const blank = new BlankNode("b1");
      expect(BuiltInFunctions.str(blank)).toBe("b1");
    });

    it("should throw for undefined", () => {
      expect(() => BuiltInFunctions.str(undefined)).toThrow("STR: argument is undefined");
    });
  });

  describe("LANG", () => {
    it("should return language tag for literal", () => {
      const literal = new Literal("hello", undefined, "en");
      expect(BuiltInFunctions.lang(literal)).toBe("en");
    });

    it("should return empty string for literal without language", () => {
      const literal = new Literal("hello");
      expect(BuiltInFunctions.lang(literal)).toBe("");
    });

    it("should return empty string for IRI", () => {
      const iri = new IRI("http://example.org/resource");
      expect(BuiltInFunctions.lang(iri)).toBe("");
    });

    it("should throw for undefined", () => {
      expect(() => BuiltInFunctions.lang(undefined)).toThrow("LANG: argument is undefined");
    });
  });

  describe("DATATYPE", () => {
    it("should return datatype for typed literal", () => {
      const xsdInteger = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const literal = new Literal("42", xsdInteger);
      const datatype = BuiltInFunctions.datatype(literal);
      expect(datatype.value).toBe("http://www.w3.org/2001/XMLSchema#integer");
    });

    it("should return xsd:string for plain literal", () => {
      const literal = new Literal("hello");
      const datatype = BuiltInFunctions.datatype(literal);
      expect(datatype.value).toBe("http://www.w3.org/2001/XMLSchema#string");
    });

    it("should return rdf:langString for literal with language", () => {
      const literal = new Literal("hello", undefined, "en");
      const datatype = BuiltInFunctions.datatype(literal);
      expect(datatype.value).toBe("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString");
    });

    it("should throw for IRI", () => {
      const iri = new IRI("http://example.org/resource");
      expect(() => BuiltInFunctions.datatype(iri)).toThrow("DATATYPE: argument must be a literal");
    });

    it("should throw for undefined", () => {
      expect(() => BuiltInFunctions.datatype(undefined)).toThrow("DATATYPE: argument is undefined");
    });
  });

  describe("BOUND", () => {
    it("should return true for bound term", () => {
      const iri = new IRI("http://example.org/resource");
      expect(BuiltInFunctions.bound(iri)).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(BuiltInFunctions.bound(undefined)).toBe(false);
    });
  });

  describe("isIRI", () => {
    it("should return true for IRI", () => {
      const iri = new IRI("http://example.org/resource");
      expect(BuiltInFunctions.isIRI(iri)).toBe(true);
    });

    it("should return false for Literal", () => {
      const literal = new Literal("test");
      expect(BuiltInFunctions.isIRI(literal)).toBe(false);
    });

    it("should return false for BlankNode", () => {
      const blank = new BlankNode("b1");
      expect(BuiltInFunctions.isIRI(blank)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(BuiltInFunctions.isIRI(undefined)).toBe(false);
    });
  });

  describe("isBlank", () => {
    it("should return true for BlankNode", () => {
      const blank = new BlankNode("b1");
      expect(BuiltInFunctions.isBlank(blank)).toBe(true);
    });

    it("should return false for IRI", () => {
      const iri = new IRI("http://example.org/resource");
      expect(BuiltInFunctions.isBlank(iri)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(BuiltInFunctions.isBlank(undefined)).toBe(false);
    });
  });

  describe("isLiteral", () => {
    it("should return true for Literal", () => {
      const literal = new Literal("test");
      expect(BuiltInFunctions.isLiteral(literal)).toBe(true);
    });

    it("should return false for IRI", () => {
      const iri = new IRI("http://example.org/resource");
      expect(BuiltInFunctions.isLiteral(iri)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(BuiltInFunctions.isLiteral(undefined)).toBe(false);
    });
  });

  describe("REGEX", () => {
    it("should match regex pattern", () => {
      expect(BuiltInFunctions.regex("hello world", "world")).toBe(true);
    });

    it("should not match when pattern not found", () => {
      expect(BuiltInFunctions.regex("hello world", "foo")).toBe(false);
    });

    it("should support case-insensitive flag", () => {
      expect(BuiltInFunctions.regex("Hello World", "hello", "i")).toBe(true);
    });

    it("should support regex special characters", () => {
      expect(BuiltInFunctions.regex("test123", "\\d+")).toBe(true);
    });

    it("should throw for invalid regex", () => {
      expect(() => BuiltInFunctions.regex("test", "[invalid")).toThrow("REGEX: invalid pattern");
    });
  });

  describe("Comparison", () => {
    it("should compare strings with =", () => {
      expect(BuiltInFunctions.compare("hello", "hello", "=")).toBe(true);
      expect(BuiltInFunctions.compare("hello", "world", "=")).toBe(false);
    });

    it("should compare numbers with >", () => {
      expect(BuiltInFunctions.compare(10, 5, ">")).toBe(true);
      expect(BuiltInFunctions.compare(3, 5, ">")).toBe(false);
    });

    it("should compare literals with numeric datatype", () => {
      const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
      const lit1 = new Literal("10", xsdInt);
      const lit2 = new Literal("5", xsdInt);

      expect(BuiltInFunctions.compare(lit1, lit2, ">")).toBe(true);
      expect(BuiltInFunctions.compare(lit1, lit2, "<")).toBe(false);
    });

    it("should compare with <=", () => {
      expect(BuiltInFunctions.compare(5, 10, "<=")).toBe(true);
      expect(BuiltInFunctions.compare(10, 10, "<=")).toBe(true);
      expect(BuiltInFunctions.compare(15, 10, "<=")).toBe(false);
    });

    it("should compare with >=", () => {
      expect(BuiltInFunctions.compare(10, 5, ">=")).toBe(true);
      expect(BuiltInFunctions.compare(5, 5, ">=")).toBe(true);
      expect(BuiltInFunctions.compare(3, 5, ">=")).toBe(false);
    });

    it("should compare with !=", () => {
      expect(BuiltInFunctions.compare("hello", "world", "!=")).toBe(true);
      expect(BuiltInFunctions.compare("hello", "hello", "!=")).toBe(false);
    });

    it("should throw for unknown operator", () => {
      expect(() => BuiltInFunctions.compare(1, 2, "===")).toThrow("Unknown comparison operator");
    });
  });

  describe("CONTAINS", () => {
    it("should return true when string contains substring", () => {
      expect(BuiltInFunctions.contains("hello world", "world")).toBe(true);
    });

    it("should return false when string does not contain substring", () => {
      expect(BuiltInFunctions.contains("hello world", "foo")).toBe(false);
    });

    it("should be case-sensitive by default", () => {
      expect(BuiltInFunctions.contains("Hello World", "hello")).toBe(false);
    });

    it("should handle empty substring", () => {
      expect(BuiltInFunctions.contains("hello", "")).toBe(true);
    });

    it("should handle empty string", () => {
      expect(BuiltInFunctions.contains("", "test")).toBe(false);
    });

    it("should handle Cyrillic text", () => {
      expect(BuiltInFunctions.contains("Поспать после обеда", "Поспать")).toBe(true);
    });
  });

  describe("STRSTARTS", () => {
    it("should return true when string starts with prefix", () => {
      expect(BuiltInFunctions.strStarts("hello world", "hello")).toBe(true);
    });

    it("should return false when string does not start with prefix", () => {
      expect(BuiltInFunctions.strStarts("hello world", "world")).toBe(false);
    });
  });

  describe("STRENDS", () => {
    it("should return true when string ends with suffix", () => {
      expect(BuiltInFunctions.strEnds("hello world", "world")).toBe(true);
    });

    it("should return false when string does not end with suffix", () => {
      expect(BuiltInFunctions.strEnds("hello world", "hello")).toBe(false);
    });
  });

  describe("STRLEN", () => {
    it("should return length of string", () => {
      expect(BuiltInFunctions.strlen("hello")).toBe(5);
    });

    it("should return 0 for empty string", () => {
      expect(BuiltInFunctions.strlen("")).toBe(0);
    });
  });

  describe("UCASE", () => {
    it("should convert string to uppercase", () => {
      expect(BuiltInFunctions.ucase("hello")).toBe("HELLO");
    });
  });

  describe("LCASE", () => {
    it("should convert string to lowercase", () => {
      expect(BuiltInFunctions.lcase("HELLO")).toBe("hello");
    });
  });

  describe("Logical Operators", () => {
    it("should perform logical AND", () => {
      expect(BuiltInFunctions.logicalAnd([true, true])).toBe(true);
      expect(BuiltInFunctions.logicalAnd([true, false])).toBe(false);
      expect(BuiltInFunctions.logicalAnd([false, false])).toBe(false);
    });

    it("should handle empty AND", () => {
      expect(BuiltInFunctions.logicalAnd([])).toBe(true);
    });

    it("should perform logical OR", () => {
      expect(BuiltInFunctions.logicalOr([true, true])).toBe(true);
      expect(BuiltInFunctions.logicalOr([true, false])).toBe(true);
      expect(BuiltInFunctions.logicalOr([false, false])).toBe(false);
    });

    it("should handle empty OR", () => {
      expect(BuiltInFunctions.logicalOr([])).toBe(false);
    });

    it("should perform logical NOT", () => {
      expect(BuiltInFunctions.logicalNot(true)).toBe(false);
      expect(BuiltInFunctions.logicalNot(false)).toBe(true);
    });
  });

  describe("DATEDIFFMINUTES", () => {
    it("should calculate difference in minutes between two dates", () => {
      // 2 hours = 120 minutes
      const date1 = "2025-11-26T05:00:00Z";
      const date2 = "2025-11-26T07:00:00Z";
      expect(BuiltInFunctions.dateDiffMinutes(date1, date2)).toBe(120);
    });

    it("should return positive value regardless of order", () => {
      const date1 = "2025-11-26T07:00:00Z";
      const date2 = "2025-11-26T05:00:00Z";
      expect(BuiltInFunctions.dateDiffMinutes(date1, date2)).toBe(120);
    });

    it("should handle JavaScript Date string format", () => {
      // Real-world format from vault data
      const date1 = "Wed Nov 26 2025 05:03:42 GMT+0500";
      const date2 = "Wed Nov 26 2025 14:10:09 GMT+0500";
      // Difference: 9h 6m 27s ≈ 546 minutes (rounded)
      const diff = BuiltInFunctions.dateDiffMinutes(date1, date2);
      expect(diff).toBe(547); // 9*60 + 6 + rounding from 27s
    });

    it("should handle ISO format dates", () => {
      const date1 = "2025-11-26T00:00:00";
      const date2 = "2025-11-26T01:30:00";
      expect(BuiltInFunctions.dateDiffMinutes(date1, date2)).toBe(90);
    });

    it("should calculate sleep duration correctly", () => {
      // Typical sleep scenario: start at midnight, wake up at 8am
      const sleepStart = "2025-11-26T00:00:00";
      const sleepEnd = "2025-11-26T08:00:00";
      expect(BuiltInFunctions.dateDiffMinutes(sleepStart, sleepEnd)).toBe(480); // 8 hours
    });

    it("should return 0 for same datetime", () => {
      const date = "2025-11-26T12:00:00Z";
      expect(BuiltInFunctions.dateDiffMinutes(date, date)).toBe(0);
    });

    it("should throw for invalid date string", () => {
      expect(() => BuiltInFunctions.dateDiffMinutes("invalid", "2025-11-26T00:00:00")).toThrow(
        "PARSEDATE: invalid date string"
      );
    });
  });

  describe("DATEDIFFHOURS", () => {
    it("should calculate difference in hours between two dates", () => {
      const date1 = "2025-11-26T05:00:00Z";
      const date2 = "2025-11-26T13:00:00Z";
      expect(BuiltInFunctions.dateDiffHours(date1, date2)).toBe(8);
    });

    it("should return positive value regardless of order", () => {
      const date1 = "2025-11-26T13:00:00Z";
      const date2 = "2025-11-26T05:00:00Z";
      expect(BuiltInFunctions.dateDiffHours(date1, date2)).toBe(8);
    });

    it("should return decimal hours", () => {
      // 1.5 hours
      const date1 = "2025-11-26T10:00:00Z";
      const date2 = "2025-11-26T11:30:00Z";
      expect(BuiltInFunctions.dateDiffHours(date1, date2)).toBe(1.5);
    });

    it("should handle JavaScript Date string format", () => {
      // Real-world format from vault data
      const date1 = "Wed Nov 26 2025 05:03:42 GMT+0500";
      const date2 = "Wed Nov 26 2025 14:10:09 GMT+0500";
      // Difference: 9h 6m 27s ≈ 9.11 hours
      const diff = BuiltInFunctions.dateDiffHours(date1, date2);
      expect(diff).toBeCloseTo(9.11, 1);
    });

    it("should calculate sleep duration correctly", () => {
      // Typical sleep scenario: 7.5 hours of sleep
      const sleepStart = "2025-11-26T23:30:00";
      const sleepEnd = "2025-11-27T07:00:00";
      expect(BuiltInFunctions.dateDiffHours(sleepStart, sleepEnd)).toBe(7.5);
    });

    it("should return 0 for same datetime", () => {
      const date = "2025-11-26T12:00:00Z";
      expect(BuiltInFunctions.dateDiffHours(date, date)).toBe(0);
    });

    it("should throw for invalid date string", () => {
      expect(() => BuiltInFunctions.dateDiffHours("invalid", "2025-11-26T00:00:00")).toThrow(
        "PARSEDATE: invalid date string"
      );
    });
  });
});
