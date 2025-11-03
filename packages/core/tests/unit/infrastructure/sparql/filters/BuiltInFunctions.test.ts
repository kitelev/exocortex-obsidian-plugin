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
});
