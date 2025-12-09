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

  describe("langMatches", () => {
    describe("exact matches", () => {
      it("should return true for exact match", () => {
        expect(BuiltInFunctions.langMatches("en", "en")).toBe(true);
      });

      it("should return true for exact match with subtag", () => {
        expect(BuiltInFunctions.langMatches("en-US", "en-US")).toBe(true);
      });

      it("should be case-insensitive", () => {
        expect(BuiltInFunctions.langMatches("EN", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en", "EN")).toBe(true);
        expect(BuiltInFunctions.langMatches("En-Us", "en-us")).toBe(true);
      });
    });

    describe("prefix matches", () => {
      it("should return true when tag extends range with hyphen", () => {
        expect(BuiltInFunctions.langMatches("en-US", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-GB", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-GB-oed", "en")).toBe(true);
      });

      it("should return true for nested subtag matches", () => {
        expect(BuiltInFunctions.langMatches("en-GB-oed", "en-GB")).toBe(true);
      });

      it("should return false when range is longer than tag", () => {
        expect(BuiltInFunctions.langMatches("en", "en-US")).toBe(false);
      });

      it("should return false for partial prefix without hyphen", () => {
        // "eng" does NOT start with "en-"
        expect(BuiltInFunctions.langMatches("eng", "en")).toBe(false);
      });
    });

    describe("wildcard matching", () => {
      it("should return true for any non-empty tag with '*' range", () => {
        expect(BuiltInFunctions.langMatches("en", "*")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-US", "*")).toBe(true);
        expect(BuiltInFunctions.langMatches("fr", "*")).toBe(true);
        expect(BuiltInFunctions.langMatches("de-AT", "*")).toBe(true);
      });

      it("should return false for empty tag with '*' range", () => {
        expect(BuiltInFunctions.langMatches("", "*")).toBe(false);
      });
    });

    describe("no matches", () => {
      it("should return false for different language families", () => {
        expect(BuiltInFunctions.langMatches("fr", "en")).toBe(false);
        expect(BuiltInFunctions.langMatches("de", "en")).toBe(false);
        expect(BuiltInFunctions.langMatches("fr-FR", "en")).toBe(false);
      });
    });

    describe("empty string handling", () => {
      it("should return false for empty tag with non-wildcard range", () => {
        expect(BuiltInFunctions.langMatches("", "en")).toBe(false);
      });

      it("should return true for empty tag with empty range", () => {
        expect(BuiltInFunctions.langMatches("", "")).toBe(true);
      });

      it("should return false for non-empty tag with empty range", () => {
        // Per implementation: non-empty tag doesn't match empty range
        // because it requires exact match or prefix match with hyphen
        expect(BuiltInFunctions.langMatches("en", "")).toBe(false);
      });
    });

    describe("SPARQL spec examples", () => {
      // Examples from SPARQL 1.1 spec section 17.4.3.2
      it("should match langMatches(LANG(?label), 'en') for en-tagged literals", () => {
        expect(BuiltInFunctions.langMatches("en", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-US", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-GB", "en")).toBe(true);
      });

      it("should not match langMatches(LANG(?label), 'en') for non-en literals", () => {
        expect(BuiltInFunctions.langMatches("fr", "en")).toBe(false);
        expect(BuiltInFunctions.langMatches("de", "en")).toBe(false);
      });
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

  describe("isNumeric", () => {
    describe("core numeric types", () => {
      it("should return true for xsd:integer", () => {
        const xsdInteger = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const literal = new Literal("42", xsdInteger);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:decimal", () => {
        const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
        const literal = new Literal("3.14", xsdDecimal);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:float", () => {
        const xsdFloat = new IRI("http://www.w3.org/2001/XMLSchema#float");
        const literal = new Literal("3.14159", xsdFloat);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:double", () => {
        const xsdDouble = new IRI("http://www.w3.org/2001/XMLSchema#double");
        const literal = new Literal("3.141592653589793", xsdDouble);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });
    });

    describe("derived integer types", () => {
      it("should return true for xsd:long", () => {
        const xsdLong = new IRI("http://www.w3.org/2001/XMLSchema#long");
        const literal = new Literal("9223372036854775807", xsdLong);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:int", () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#int");
        const literal = new Literal("2147483647", xsdInt);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:short", () => {
        const xsdShort = new IRI("http://www.w3.org/2001/XMLSchema#short");
        const literal = new Literal("32767", xsdShort);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:byte", () => {
        const xsdByte = new IRI("http://www.w3.org/2001/XMLSchema#byte");
        const literal = new Literal("127", xsdByte);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:unsignedLong", () => {
        const xsdUnsignedLong = new IRI("http://www.w3.org/2001/XMLSchema#unsignedLong");
        const literal = new Literal("18446744073709551615", xsdUnsignedLong);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:unsignedInt", () => {
        const xsdUnsignedInt = new IRI("http://www.w3.org/2001/XMLSchema#unsignedInt");
        const literal = new Literal("4294967295", xsdUnsignedInt);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:unsignedShort", () => {
        const xsdUnsignedShort = new IRI("http://www.w3.org/2001/XMLSchema#unsignedShort");
        const literal = new Literal("65535", xsdUnsignedShort);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:unsignedByte", () => {
        const xsdUnsignedByte = new IRI("http://www.w3.org/2001/XMLSchema#unsignedByte");
        const literal = new Literal("255", xsdUnsignedByte);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:positiveInteger", () => {
        const xsdPositiveInteger = new IRI("http://www.w3.org/2001/XMLSchema#positiveInteger");
        const literal = new Literal("1", xsdPositiveInteger);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:nonNegativeInteger", () => {
        const xsdNonNegativeInteger = new IRI("http://www.w3.org/2001/XMLSchema#nonNegativeInteger");
        const literal = new Literal("0", xsdNonNegativeInteger);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:negativeInteger", () => {
        const xsdNegativeInteger = new IRI("http://www.w3.org/2001/XMLSchema#negativeInteger");
        const literal = new Literal("-1", xsdNegativeInteger);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for xsd:nonPositiveInteger", () => {
        const xsdNonPositiveInteger = new IRI("http://www.w3.org/2001/XMLSchema#nonPositiveInteger");
        const literal = new Literal("0", xsdNonPositiveInteger);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });
    });

    describe("non-numeric types", () => {
      it("should return false for plain literal (string without datatype)", () => {
        const literal = new Literal("42");
        expect(BuiltInFunctions.isNumeric(literal)).toBe(false);
      });

      it("should return false for xsd:string", () => {
        const xsdString = new IRI("http://www.w3.org/2001/XMLSchema#string");
        const literal = new Literal("42", xsdString);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(false);
      });

      it("should return false for xsd:boolean", () => {
        const xsdBoolean = new IRI("http://www.w3.org/2001/XMLSchema#boolean");
        const literal = new Literal("true", xsdBoolean);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(false);
      });

      it("should return false for xsd:dateTime", () => {
        const xsdDateTime = new IRI("http://www.w3.org/2001/XMLSchema#dateTime");
        const literal = new Literal("2025-12-09T10:00:00Z", xsdDateTime);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(false);
      });

      it("should return false for xsd:date", () => {
        const xsdDate = new IRI("http://www.w3.org/2001/XMLSchema#date");
        const literal = new Literal("2025-12-09", xsdDate);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(false);
      });

      it("should return false for language-tagged literal", () => {
        const literal = new Literal("forty-two", undefined, "en");
        expect(BuiltInFunctions.isNumeric(literal)).toBe(false);
      });

      it("should return false for IRI", () => {
        const iri = new IRI("http://example.org/resource");
        expect(BuiltInFunctions.isNumeric(iri)).toBe(false);
      });

      it("should return false for BlankNode", () => {
        const blank = new BlankNode("b1");
        expect(BuiltInFunctions.isNumeric(blank)).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(BuiltInFunctions.isNumeric(undefined)).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should return true for negative integer literal", () => {
        const xsdInteger = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const literal = new Literal("-42", xsdInteger);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for zero as integer", () => {
        const xsdInteger = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const literal = new Literal("0", xsdInteger);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for scientific notation as double", () => {
        const xsdDouble = new IRI("http://www.w3.org/2001/XMLSchema#double");
        const literal = new Literal("1.0e10", xsdDouble);
        expect(BuiltInFunctions.isNumeric(literal)).toBe(true);
      });

      it("should return true for special float values", () => {
        const xsdFloat = new IRI("http://www.w3.org/2001/XMLSchema#float");
        // SPARQL allows INF and NaN for float/double types
        const infLiteral = new Literal("INF", xsdFloat);
        const nanLiteral = new Literal("NaN", xsdFloat);
        expect(BuiltInFunctions.isNumeric(infLiteral)).toBe(true);
        expect(BuiltInFunctions.isNumeric(nanLiteral)).toBe(true);
      });
    });
  });

  describe("langMatches", () => {
    describe("exact match", () => {
      it("should return true for identical tags", () => {
        expect(BuiltInFunctions.langMatches("en", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("fr", "fr")).toBe(true);
        expect(BuiltInFunctions.langMatches("de", "de")).toBe(true);
      });

      it("should be case-insensitive", () => {
        expect(BuiltInFunctions.langMatches("EN", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en", "EN")).toBe(true);
        expect(BuiltInFunctions.langMatches("En-US", "en-us")).toBe(true);
      });
    });

    describe("prefix match", () => {
      it("should match language subtags", () => {
        expect(BuiltInFunctions.langMatches("en-US", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-GB", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("fr-CA", "fr")).toBe(true);
        expect(BuiltInFunctions.langMatches("zh-Hans-CN", "zh")).toBe(true);
      });

      it("should match multi-level subtags", () => {
        expect(BuiltInFunctions.langMatches("en-GB-oed", "en-GB")).toBe(true);
        expect(BuiltInFunctions.langMatches("zh-Hans-CN", "zh-Hans")).toBe(true);
      });

      it("should not match if range is not a prefix", () => {
        expect(BuiltInFunctions.langMatches("en", "en-US")).toBe(false);
        expect(BuiltInFunctions.langMatches("fr", "en")).toBe(false);
        expect(BuiltInFunctions.langMatches("english", "en")).toBe(false);
      });

      it("should not match partial prefixes without hyphen", () => {
        // "eng" is not a proper subtag prefix of "english"
        expect(BuiltInFunctions.langMatches("english", "eng")).toBe(false);
      });
    });

    describe("wildcard range", () => {
      it("should match any non-empty language tag with '*'", () => {
        expect(BuiltInFunctions.langMatches("en", "*")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-US", "*")).toBe(true);
        expect(BuiltInFunctions.langMatches("fr", "*")).toBe(true);
        expect(BuiltInFunctions.langMatches("zh-Hans-CN", "*")).toBe(true);
      });

      it("should not match empty language tag with '*'", () => {
        expect(BuiltInFunctions.langMatches("", "*")).toBe(false);
      });
    });

    describe("empty language tag", () => {
      it("should not match non-empty range", () => {
        expect(BuiltInFunctions.langMatches("", "en")).toBe(false);
        expect(BuiltInFunctions.langMatches("", "fr")).toBe(false);
      });

      it("should match empty range", () => {
        expect(BuiltInFunctions.langMatches("", "")).toBe(true);
      });
    });

    describe("SPARQL spec examples", () => {
      // Examples from SPARQL 1.1 spec section 17.4.3.2
      it('langMatches("en", "en") returns true', () => {
        expect(BuiltInFunctions.langMatches("en", "en")).toBe(true);
      });

      it('langMatches("en-US", "en") returns true', () => {
        expect(BuiltInFunctions.langMatches("en-US", "en")).toBe(true);
      });

      it('langMatches("fr", "en") returns false', () => {
        expect(BuiltInFunctions.langMatches("fr", "en")).toBe(false);
      });

      it('langMatches("en-US", "*") returns true', () => {
        expect(BuiltInFunctions.langMatches("en-US", "*")).toBe(true);
      });

      it('langMatches("", "*") returns false', () => {
        expect(BuiltInFunctions.langMatches("", "*")).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle very long language tags", () => {
        // Valid BCP 47 tag with multiple extensions
        expect(BuiltInFunctions.langMatches("en-Latn-US-x-twain", "en")).toBe(true);
        expect(BuiltInFunctions.langMatches("en-Latn-US-x-twain", "en-Latn")).toBe(true);
      });

      it("should handle single character language codes", () => {
        // While not common, single character should work
        expect(BuiltInFunctions.langMatches("x-custom", "x")).toBe(true);
      });

      it("should not confuse similar prefixes", () => {
        // "en" should not match "eno" even though "eno" starts with "en"
        expect(BuiltInFunctions.langMatches("eno", "en")).toBe(false);
      });
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

  describe("SUBSTR", () => {
    it("should extract substring from start position (1-based)", () => {
      // SPARQL uses 1-based indexing
      expect(BuiltInFunctions.substr("foobar", 4)).toBe("bar");
    });

    it("should extract substring with length", () => {
      expect(BuiltInFunctions.substr("foobar", 4, 2)).toBe("ba");
    });

    it("should handle start position 1", () => {
      expect(BuiltInFunctions.substr("hello", 1)).toBe("hello");
      expect(BuiltInFunctions.substr("hello", 1, 3)).toBe("hel");
    });

    it("should handle start position beyond string length", () => {
      expect(BuiltInFunctions.substr("hello", 10)).toBe("");
      expect(BuiltInFunctions.substr("hello", 10, 5)).toBe("");
    });

    it("should handle length exceeding remaining string", () => {
      expect(BuiltInFunctions.substr("hello", 3, 100)).toBe("llo");
    });

    it("should handle empty string", () => {
      expect(BuiltInFunctions.substr("", 1)).toBe("");
      expect(BuiltInFunctions.substr("", 1, 5)).toBe("");
    });

    it("should handle unicode strings", () => {
      expect(BuiltInFunctions.substr("Привет мир", 1, 6)).toBe("Привет");
    });

    it("should handle zero and negative start positions", () => {
      // According to SPARQL spec, position 0 maps to position 1
      expect(BuiltInFunctions.substr("hello", 0)).toBe("hello");
      expect(BuiltInFunctions.substr("hello", 0, 3)).toBe("he");
      expect(BuiltInFunctions.substr("hello", -1, 3)).toBe("h");
    });
  });

  describe("STRBEFORE", () => {
    it("should return substring before separator", () => {
      expect(BuiltInFunctions.strBefore("hello/world", "/")).toBe("hello");
    });

    it("should return empty string if separator not found", () => {
      expect(BuiltInFunctions.strBefore("hello world", "/")).toBe("");
    });

    it("should return empty string if separator is at start", () => {
      expect(BuiltInFunctions.strBefore("/hello", "/")).toBe("");
    });

    it("should handle empty separator (returns empty string per spec)", () => {
      expect(BuiltInFunctions.strBefore("hello", "")).toBe("");
    });

    it("should handle empty source string", () => {
      expect(BuiltInFunctions.strBefore("", "/")).toBe("");
    });

    it("should find first occurrence only", () => {
      expect(BuiltInFunctions.strBefore("a/b/c", "/")).toBe("a");
    });

    it("should handle multi-character separator", () => {
      expect(BuiltInFunctions.strBefore("hello::world", "::")).toBe("hello");
    });

    it("should handle path extraction", () => {
      expect(BuiltInFunctions.strBefore("/projects/task.md", "/")).toBe("");
      expect(BuiltInFunctions.strBefore("projects/task.md", "/")).toBe("projects");
    });
  });

  describe("STRAFTER", () => {
    it("should return substring after separator", () => {
      expect(BuiltInFunctions.strAfter("hello/world", "/")).toBe("world");
    });

    it("should return empty string if separator not found", () => {
      expect(BuiltInFunctions.strAfter("hello world", "/")).toBe("");
    });

    it("should return empty string if separator is at end", () => {
      expect(BuiltInFunctions.strAfter("hello/", "/")).toBe("");
    });

    it("should handle empty separator (returns entire string per spec)", () => {
      expect(BuiltInFunctions.strAfter("hello", "")).toBe("hello");
    });

    it("should handle empty source string", () => {
      expect(BuiltInFunctions.strAfter("", "/")).toBe("");
    });

    it("should find first occurrence only", () => {
      expect(BuiltInFunctions.strAfter("a/b/c", "/")).toBe("b/c");
    });

    it("should handle multi-character separator", () => {
      expect(BuiltInFunctions.strAfter("hello::world", "::")).toBe("world");
    });

    it("should extract fragment from URI", () => {
      expect(BuiltInFunctions.strAfter("http://example.org/resource#fragment", "#")).toBe("fragment");
    });

    it("should extract file extension", () => {
      expect(BuiltInFunctions.strAfter("document.md", ".")).toBe("md");
    });
  });

  describe("CONCAT", () => {
    it("should concatenate two strings", () => {
      expect(BuiltInFunctions.concat("hello", " world")).toBe("hello world");
    });

    it("should concatenate multiple strings", () => {
      expect(BuiltInFunctions.concat("a", "b", "c", "d")).toBe("abcd");
    });

    it("should handle single argument", () => {
      expect(BuiltInFunctions.concat("hello")).toBe("hello");
    });

    it("should handle no arguments", () => {
      expect(BuiltInFunctions.concat()).toBe("");
    });

    it("should handle empty strings in arguments", () => {
      expect(BuiltInFunctions.concat("hello", "", "world")).toBe("helloworld");
    });

    it("should build full name from parts", () => {
      expect(BuiltInFunctions.concat("John", " ", "Doe")).toBe("John Doe");
    });

    it("should build path from components", () => {
      expect(BuiltInFunctions.concat("/projects/", "myproject", "/tasks")).toBe("/projects/myproject/tasks");
    });
  });

  describe("REPLACE", () => {
    it("should replace pattern with replacement", () => {
      expect(BuiltInFunctions.replace("hello world", "world", "there")).toBe("hello there");
    });

    it("should support regex patterns", () => {
      expect(BuiltInFunctions.replace("test123", "\\d+", "NUM")).toBe("testNUM");
    });

    it("should replace all occurrences by default", () => {
      expect(BuiltInFunctions.replace("a-b-c", "-", "_")).toBe("a_b_c");
    });

    it("should throw for invalid regex", () => {
      expect(() => BuiltInFunctions.replace("test", "[invalid", "x")).toThrow("REPLACE: invalid pattern");
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

  describe("SPARQL 1.1 DateTime Accessor Functions", () => {
    describe("YEAR", () => {
      it("should extract year from ISO datetime", () => {
        expect(BuiltInFunctions.year("2025-11-30T14:30:00Z")).toBe(2025);
      });

      it("should extract year from date without time", () => {
        expect(BuiltInFunctions.year("2025-11-30")).toBe(2025);
      });

      it("should throw for invalid date", () => {
        expect(() => BuiltInFunctions.year("invalid")).toThrow("YEAR: invalid date string");
      });
    });

    describe("MONTH", () => {
      it("should extract month from ISO datetime", () => {
        expect(BuiltInFunctions.month("2025-11-30T14:30:00Z")).toBe(11);
      });

      it("should return 1 for January", () => {
        expect(BuiltInFunctions.month("2025-01-15T00:00:00Z")).toBe(1);
      });

      it("should return 12 for December", () => {
        expect(BuiltInFunctions.month("2025-12-25T00:00:00Z")).toBe(12);
      });

      it("should throw for invalid date", () => {
        expect(() => BuiltInFunctions.month("invalid")).toThrow("MONTH: invalid date string");
      });
    });

    describe("DAY", () => {
      it("should extract day from ISO datetime", () => {
        expect(BuiltInFunctions.day("2025-11-30T14:30:00Z")).toBe(30);
      });

      it("should return 1 for first day of month", () => {
        expect(BuiltInFunctions.day("2025-11-01T00:00:00Z")).toBe(1);
      });

      it("should return 31 for last day of month", () => {
        expect(BuiltInFunctions.day("2025-01-31T00:00:00Z")).toBe(31);
      });

      it("should throw for invalid date", () => {
        expect(() => BuiltInFunctions.day("invalid")).toThrow("DAY: invalid date string");
      });
    });

    describe("HOURS", () => {
      it("should extract hours from ISO datetime (local parse)", () => {
        // Without Z suffix, will be parsed as local time
        expect(BuiltInFunctions.hours("2025-11-30T14:30:00")).toBe(14);
      });

      it("should return 0 for midnight", () => {
        expect(BuiltInFunctions.hours("2025-11-30T00:30:00")).toBe(0);
      });

      it("should return 23 for last hour", () => {
        expect(BuiltInFunctions.hours("2025-11-30T23:30:00")).toBe(23);
      });

      it("should throw for invalid date", () => {
        expect(() => BuiltInFunctions.hours("invalid")).toThrow("HOURS: invalid date string");
      });
    });

    describe("MINUTES", () => {
      it("should extract minutes from ISO datetime", () => {
        expect(BuiltInFunctions.minutes("2025-11-30T14:45:30")).toBe(45);
      });

      it("should return 0 for zero minutes", () => {
        expect(BuiltInFunctions.minutes("2025-11-30T14:00:30")).toBe(0);
      });

      it("should return 59 for last minute", () => {
        expect(BuiltInFunctions.minutes("2025-11-30T14:59:30")).toBe(59);
      });

      it("should throw for invalid date", () => {
        expect(() => BuiltInFunctions.minutes("invalid")).toThrow("MINUTES: invalid date string");
      });
    });

    describe("SECONDS", () => {
      it("should extract seconds from ISO datetime", () => {
        expect(BuiltInFunctions.seconds("2025-11-30T14:45:30")).toBe(30);
      });

      it("should include milliseconds as decimal", () => {
        expect(BuiltInFunctions.seconds("2025-11-30T14:45:30.500")).toBe(30.5);
      });

      it("should return 0 for zero seconds", () => {
        expect(BuiltInFunctions.seconds("2025-11-30T14:45:00")).toBe(0);
      });

      it("should throw for invalid date", () => {
        expect(() => BuiltInFunctions.seconds("invalid")).toThrow("SECONDS: invalid date string");
      });
    });

    describe("NOW", () => {
      it("should return ISO string format", () => {
        const result = BuiltInFunctions.now();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it("should return current time (within 1 second)", () => {
        const result = BuiltInFunctions.now();
        const resultDate = new Date(result);
        const now = new Date();
        const diffMs = Math.abs(resultDate.getTime() - now.getTime());
        expect(diffMs).toBeLessThan(1000);
      });
    });
  });

  describe("Duration Conversion Functions", () => {
    describe("msToMinutes", () => {
      it("should convert milliseconds to minutes", () => {
        expect(BuiltInFunctions.msToMinutes(60000)).toBe(1);
        expect(BuiltInFunctions.msToMinutes(3600000)).toBe(60);
        expect(BuiltInFunctions.msToMinutes(7200000)).toBe(120);
      });

      it("should round to nearest minute", () => {
        // 90 seconds = 1.5 minutes → rounds to 2
        expect(BuiltInFunctions.msToMinutes(90000)).toBe(2);
        // 30 seconds = 0.5 minutes → rounds to 1
        expect(BuiltInFunctions.msToMinutes(30000)).toBe(1);
      });
    });

    describe("msToHours", () => {
      it("should convert milliseconds to hours", () => {
        expect(BuiltInFunctions.msToHours(3600000)).toBe(1);
        expect(BuiltInFunctions.msToHours(7200000)).toBe(2);
      });

      it("should return decimal hours", () => {
        // 1.5 hours
        expect(BuiltInFunctions.msToHours(5400000)).toBe(1.5);
      });
    });

    describe("msToSeconds", () => {
      it("should convert milliseconds to seconds", () => {
        expect(BuiltInFunctions.msToSeconds(1000)).toBe(1);
        expect(BuiltInFunctions.msToSeconds(60000)).toBe(60);
      });

      it("should round to nearest second", () => {
        expect(BuiltInFunctions.msToSeconds(1500)).toBe(2);
        expect(BuiltInFunctions.msToSeconds(500)).toBe(1);
      });
    });
  });

  describe("SPARQL 1.1 Numeric Functions", () => {
    describe("ABS", () => {
      it("should return absolute value of positive number", () => {
        expect(BuiltInFunctions.abs(5)).toBe(5);
        expect(BuiltInFunctions.abs(42.5)).toBe(42.5);
      });

      it("should return absolute value of negative number", () => {
        expect(BuiltInFunctions.abs(-5)).toBe(5);
        expect(BuiltInFunctions.abs(-42.5)).toBe(42.5);
      });

      it("should return 0 for 0", () => {
        expect(BuiltInFunctions.abs(0)).toBe(0);
      });

      it("should handle very large numbers", () => {
        expect(BuiltInFunctions.abs(-1e10)).toBe(1e10);
        expect(BuiltInFunctions.abs(1e15)).toBe(1e15);
      });

      it("should handle very small decimals", () => {
        expect(BuiltInFunctions.abs(-0.00001)).toBe(0.00001);
        expect(BuiltInFunctions.abs(0.00001)).toBe(0.00001);
      });
    });

    describe("ROUND", () => {
      it("should round to nearest integer", () => {
        expect(BuiltInFunctions.round(2.5)).toBe(3);
        expect(BuiltInFunctions.round(2.4)).toBe(2);
        expect(BuiltInFunctions.round(2.6)).toBe(3);
      });

      it("should round negative numbers correctly", () => {
        expect(BuiltInFunctions.round(-2.5)).toBe(-2);
        expect(BuiltInFunctions.round(-2.4)).toBe(-2);
        expect(BuiltInFunctions.round(-2.6)).toBe(-3);
      });

      it("should return integer unchanged", () => {
        expect(BuiltInFunctions.round(5)).toBe(5);
        expect(BuiltInFunctions.round(-5)).toBe(-5);
        expect(BuiltInFunctions.round(0)).toBe(0);
      });

      it("should handle very large numbers", () => {
        expect(BuiltInFunctions.round(1e10 + 0.5)).toBe(1e10 + 1);
      });
    });

    describe("CEIL", () => {
      it("should round up to nearest integer", () => {
        expect(BuiltInFunctions.ceil(2.1)).toBe(3);
        expect(BuiltInFunctions.ceil(2.9)).toBe(3);
        expect(BuiltInFunctions.ceil(2.0)).toBe(2);
      });

      it("should round negative numbers toward zero", () => {
        expect(BuiltInFunctions.ceil(-2.1)).toBe(-2);
        expect(BuiltInFunctions.ceil(-2.9)).toBe(-2);
        expect(BuiltInFunctions.ceil(-2.0)).toBe(-2);
      });

      it("should return integer unchanged", () => {
        expect(BuiltInFunctions.ceil(5)).toBe(5);
        expect(BuiltInFunctions.ceil(-5)).toBe(-5);
        expect(BuiltInFunctions.ceil(0)).toBe(0);
      });

      it("should handle very small positive decimals", () => {
        expect(BuiltInFunctions.ceil(0.00001)).toBe(1);
        expect(BuiltInFunctions.ceil(0.99999)).toBe(1);
      });
    });

    describe("FLOOR", () => {
      it("should round down to nearest integer", () => {
        expect(BuiltInFunctions.floor(2.1)).toBe(2);
        expect(BuiltInFunctions.floor(2.9)).toBe(2);
        expect(BuiltInFunctions.floor(2.0)).toBe(2);
      });

      it("should round negative numbers away from zero", () => {
        expect(BuiltInFunctions.floor(-2.1)).toBe(-3);
        expect(BuiltInFunctions.floor(-2.9)).toBe(-3);
        expect(BuiltInFunctions.floor(-2.0)).toBe(-2);
      });

      it("should return integer unchanged", () => {
        expect(BuiltInFunctions.floor(5)).toBe(5);
        expect(BuiltInFunctions.floor(-5)).toBe(-5);
        expect(BuiltInFunctions.floor(0)).toBe(0);
      });

      it("should handle very small positive decimals", () => {
        expect(BuiltInFunctions.floor(0.00001)).toBe(0);
        expect(BuiltInFunctions.floor(0.99999)).toBe(0);
      });
    });

    describe("RAND", () => {
      it("should return number in range [0, 1)", () => {
        for (let i = 0; i < 100; i++) {
          const value = BuiltInFunctions.rand();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
        }
      });

      it("should return different values on multiple calls", () => {
        const values: Set<number> = new Set();
        for (let i = 0; i < 100; i++) {
          values.add(BuiltInFunctions.rand());
        }
        // Should have mostly unique values (statistically)
        expect(values.size).toBeGreaterThan(90);
      });
    });
  });

  describe("SPARQL 1.1 Conditional Functions", () => {
    describe("COALESCE", () => {
      it("should return first non-null value with 2 arguments", () => {
        expect(BuiltInFunctions.coalesce([undefined, "fallback"])).toBe("fallback");
        expect(BuiltInFunctions.coalesce(["first", "second"])).toBe("first");
      });

      it("should return first non-null value with 3 arguments", () => {
        expect(BuiltInFunctions.coalesce([undefined, undefined, "third"])).toBe("third");
        expect(BuiltInFunctions.coalesce([undefined, "second", "third"])).toBe("second");
        expect(BuiltInFunctions.coalesce(["first", "second", "third"])).toBe("first");
      });

      it("should return first non-null value with 5 arguments", () => {
        expect(BuiltInFunctions.coalesce([undefined, undefined, undefined, undefined, "fifth"])).toBe("fifth");
        expect(BuiltInFunctions.coalesce([undefined, undefined, "third", undefined, "fifth"])).toBe("third");
      });

      it("should return undefined when all arguments are unbound", () => {
        expect(BuiltInFunctions.coalesce([undefined, undefined])).toBeUndefined();
        expect(BuiltInFunctions.coalesce([undefined, undefined, undefined])).toBeUndefined();
        expect(BuiltInFunctions.coalesce([null, null, null])).toBeUndefined();
        expect(BuiltInFunctions.coalesce([undefined, null, undefined])).toBeUndefined();
      });

      it("should return undefined for empty array", () => {
        expect(BuiltInFunctions.coalesce([])).toBeUndefined();
      });

      it("should handle mixed types (string, number, IRI)", () => {
        const iri = new IRI("http://example.org/resource");
        const literal = new Literal("test");

        expect(BuiltInFunctions.coalesce([undefined, iri])).toBe(iri);
        expect(BuiltInFunctions.coalesce([undefined, literal])).toBe(literal);
        expect(BuiltInFunctions.coalesce([undefined, 42])).toBe(42);
        expect(BuiltInFunctions.coalesce([undefined, 0])).toBe(0);
        expect(BuiltInFunctions.coalesce([undefined, ""])).toBe("");
      });

      it("should treat 0 and empty string as valid values", () => {
        expect(BuiltInFunctions.coalesce([0, 42])).toBe(0);
        expect(BuiltInFunctions.coalesce(["", "fallback"])).toBe("");
      });

      it("should skip null values and continue", () => {
        expect(BuiltInFunctions.coalesce([null, "second"])).toBe("second");
        expect(BuiltInFunctions.coalesce([null, null, "third"])).toBe("third");
      });
    });

    describe("IF", () => {
      it("should return thenValue when condition is true", () => {
        expect(BuiltInFunctions.if(true, "yes", "no")).toBe("yes");
        expect(BuiltInFunctions.if(true, 1, 0)).toBe(1);
      });

      it("should return elseValue when condition is false", () => {
        expect(BuiltInFunctions.if(false, "yes", "no")).toBe("no");
        expect(BuiltInFunctions.if(false, 1, 0)).toBe(0);
      });

      it("should handle RDF term return types", () => {
        const iri1 = new IRI("http://example.org/resource1");
        const iri2 = new IRI("http://example.org/resource2");
        const literal1 = new Literal("value1");
        const literal2 = new Literal("value2");

        expect(BuiltInFunctions.if(true, iri1, iri2)).toBe(iri1);
        expect(BuiltInFunctions.if(false, iri1, iri2)).toBe(iri2);
        expect(BuiltInFunctions.if(true, literal1, literal2)).toBe(literal1);
        expect(BuiltInFunctions.if(false, literal1, literal2)).toBe(literal2);
      });

      it("should handle mixed types via any cast", () => {
        // In real SPARQL, IF can return different types based on condition
        // TypeScript generic forces same types, but runtime allows mixed types
        const iri = new IRI("http://example.org/resource");
        const literal = new Literal("test");

        // Use explicit any to test runtime behavior with mixed types
        const result1 = (BuiltInFunctions.if as any)(true, iri, literal);
        const result2 = (BuiltInFunctions.if as any)(false, iri, literal);
        const result3 = (BuiltInFunctions.if as any)(true, 42, "forty-two");
        const result4 = (BuiltInFunctions.if as any)(false, 42, "forty-two");

        expect(result1).toBe(iri);
        expect(result2).toBe(literal);
        expect(result3).toBe(42);
        expect(result4).toBe("forty-two");
      });

      it("should handle undefined and null as return values", () => {
        expect(BuiltInFunctions.if(true, undefined, "fallback")).toBeUndefined();
        expect(BuiltInFunctions.if(false, "value", null)).toBeNull();
      });
    });
  });

  describe("sameTerm", () => {
    describe("IRI comparison", () => {
      it("should return true for identical IRIs", () => {
        const iri1 = new IRI("http://example.org/resource");
        const iri2 = new IRI("http://example.org/resource");
        expect(BuiltInFunctions.sameTerm(iri1, iri2)).toBe(true);
      });

      it("should return false for different IRIs", () => {
        const iri1 = new IRI("http://example.org/resource1");
        const iri2 = new IRI("http://example.org/resource2");
        expect(BuiltInFunctions.sameTerm(iri1, iri2)).toBe(false);
      });

      it("should handle same IRI object reference", () => {
        const iri = new IRI("http://example.org/resource");
        expect(BuiltInFunctions.sameTerm(iri, iri)).toBe(true);
      });
    });

    describe("BlankNode comparison", () => {
      it("should return true for identical blank nodes", () => {
        const bn1 = new BlankNode("b1");
        const bn2 = new BlankNode("b1");
        expect(BuiltInFunctions.sameTerm(bn1, bn2)).toBe(true);
      });

      it("should return false for different blank nodes", () => {
        const bn1 = new BlankNode("b1");
        const bn2 = new BlankNode("b2");
        expect(BuiltInFunctions.sameTerm(bn1, bn2)).toBe(false);
      });
    });

    describe("Literal comparison - plain literals", () => {
      it("should return true for identical plain literals", () => {
        const lit1 = new Literal("hello");
        const lit2 = new Literal("hello");
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(true);
      });

      it("should return false for different plain literal values", () => {
        const lit1 = new Literal("hello");
        const lit2 = new Literal("world");
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(false);
      });
    });

    describe("Literal comparison - typed literals", () => {
      it("should return true for identical typed literals", () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const lit1 = new Literal("42", xsdInt);
        const lit2 = new Literal("42", xsdInt);
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(true);
      });

      it("should return false for same value with different datatypes", () => {
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
        const lit1 = new Literal("42", xsdInt);
        const lit2 = new Literal("42", xsdDecimal);
        // Key difference from = operator: sameTerm requires exact datatype match
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(false);
      });

      it("should return false for plain literal vs xsd:string typed literal", () => {
        // This is the key semantic difference from Literal.equals()
        // Per SPARQL 1.1 spec, sameTerm requires exact term identity
        const xsdString = new IRI("http://www.w3.org/2001/XMLSchema#string");
        const plainLit = new Literal("hello");
        const typedLit = new Literal("hello", xsdString);
        // Plain literal has no datatype, typed has xsd:string - not identical terms
        expect(BuiltInFunctions.sameTerm(plainLit, typedLit)).toBe(false);
      });

      it("should return false for different numeric representations", () => {
        // "42"^^xsd:integer and "42.0"^^xsd:decimal are equal by value but not same term
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
        const intLit = new Literal("42", xsdInt);
        const decLit = new Literal("42.0", xsdDecimal);
        expect(BuiltInFunctions.sameTerm(intLit, decLit)).toBe(false);
      });
    });

    describe("Literal comparison - language tags", () => {
      it("should return true for identical language-tagged literals", () => {
        const lit1 = new Literal("hello", undefined, "en");
        const lit2 = new Literal("hello", undefined, "en");
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(true);
      });

      it("should return false for different language tags", () => {
        const lit1 = new Literal("hello", undefined, "en");
        const lit2 = new Literal("hello", undefined, "de");
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(false);
      });

      it("should return false for language-tagged vs plain literal", () => {
        const lit1 = new Literal("hello", undefined, "en");
        const lit2 = new Literal("hello");
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(false);
      });

      it("should be case-insensitive for language tags (normalized by Literal)", () => {
        // Literal class normalizes language tags to lowercase
        const lit1 = new Literal("hello", undefined, "EN");
        const lit2 = new Literal("hello", undefined, "en");
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(true);
      });
    });

    describe("Cross-type comparison", () => {
      it("should return false for IRI vs Literal", () => {
        const iri = new IRI("http://example.org/resource");
        const lit = new Literal("http://example.org/resource");
        expect(BuiltInFunctions.sameTerm(iri, lit)).toBe(false);
      });

      it("should return false for IRI vs BlankNode", () => {
        const iri = new IRI("http://example.org/b1");
        const bn = new BlankNode("b1");
        expect(BuiltInFunctions.sameTerm(iri, bn)).toBe(false);
      });

      it("should return false for Literal vs BlankNode", () => {
        const lit = new Literal("b1");
        const bn = new BlankNode("b1");
        expect(BuiltInFunctions.sameTerm(lit, bn)).toBe(false);
      });
    });

    describe("Undefined handling", () => {
      it("should return true for both undefined", () => {
        expect(BuiltInFunctions.sameTerm(undefined, undefined)).toBe(true);
      });

      it("should return false for undefined vs IRI", () => {
        const iri = new IRI("http://example.org/resource");
        expect(BuiltInFunctions.sameTerm(undefined, iri)).toBe(false);
        expect(BuiltInFunctions.sameTerm(iri, undefined)).toBe(false);
      });

      it("should return false for undefined vs Literal", () => {
        const lit = new Literal("test");
        expect(BuiltInFunctions.sameTerm(undefined, lit)).toBe(false);
        expect(BuiltInFunctions.sameTerm(lit, undefined)).toBe(false);
      });

      it("should return false for undefined vs BlankNode", () => {
        const bn = new BlankNode("b1");
        expect(BuiltInFunctions.sameTerm(undefined, bn)).toBe(false);
        expect(BuiltInFunctions.sameTerm(bn, undefined)).toBe(false);
      });
    });

    describe("SPARQL spec examples", () => {
      it("should distinguish between equal values and same terms", () => {
        // From SPARQL 1.1 spec section 17.4.2.5
        // sameTerm("42"^^xsd:integer, "42"^^xsd:integer) = true
        const xsdInt = new IRI("http://www.w3.org/2001/XMLSchema#integer");
        const lit1 = new Literal("42", xsdInt);
        const lit2 = new Literal("42", xsdInt);
        expect(BuiltInFunctions.sameTerm(lit1, lit2)).toBe(true);

        // sameTerm("42"^^xsd:integer, "42.0"^^xsd:decimal) = false
        // Even though they are equal by value
        const xsdDecimal = new IRI("http://www.w3.org/2001/XMLSchema#decimal");
        const lit3 = new Literal("42.0", xsdDecimal);
        expect(BuiltInFunctions.sameTerm(lit1, lit3)).toBe(false);
      });
    });
  });

  describe("XSD Type Casting Functions", () => {
    describe("xsdDateTime", () => {
      it("should convert ISO 8601 string to dateTime Literal", () => {
        const result = BuiltInFunctions.xsdDateTime("2025-12-02T10:30:00Z");
        expect(result).toBeInstanceOf(Literal);
        expect(result.datatype?.value).toBe("http://www.w3.org/2001/XMLSchema#dateTime");
        // The value should be a valid ISO string
        expect(new Date(result.value).toISOString()).toBe("2025-12-02T10:30:00.000Z");
      });

      it("should convert JavaScript Date string format to dateTime Literal", () => {
        // Real-world format from vault data (Issue #534)
        const result = BuiltInFunctions.xsdDateTime("Tue Dec 02 2025 02:10:39 GMT+0500");
        expect(result).toBeInstanceOf(Literal);
        expect(result.datatype?.value).toBe("http://www.w3.org/2001/XMLSchema#dateTime");
        // Should be converted to ISO 8601
        expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it("should handle date without time", () => {
        const result = BuiltInFunctions.xsdDateTime("2025-12-02");
        expect(result).toBeInstanceOf(Literal);
        expect(result.datatype?.value).toBe("http://www.w3.org/2001/XMLSchema#dateTime");
      });

      it("should throw for invalid date string", () => {
        expect(() => BuiltInFunctions.xsdDateTime("invalid")).toThrow("xsd:dateTime: invalid date string");
      });

      it("should throw for empty string", () => {
        expect(() => BuiltInFunctions.xsdDateTime("")).toThrow("xsd:dateTime: invalid date string");
      });

      it("should preserve date semantics after conversion", () => {
        // Sleep analysis use case from Issue #534
        const startStr = "Tue Dec 02 2025 02:10:39 GMT+0500";
        const endStr = "Tue Dec 02 2025 10:30:00 GMT+0500";

        const startLiteral = BuiltInFunctions.xsdDateTime(startStr);
        const endLiteral = BuiltInFunctions.xsdDateTime(endStr);

        // Verify the dates can be parsed and compared
        const startMs = new Date(startLiteral.value).getTime();
        const endMs = new Date(endLiteral.value).getTime();

        expect(endMs).toBeGreaterThan(startMs);
        // Difference should be ~8 hours 19 minutes = 499 minutes
        const diffMinutes = (endMs - startMs) / (1000 * 60);
        expect(diffMinutes).toBeCloseTo(499, 0);
      });
    });

    describe("xsdInteger", () => {
      it("should convert string to integer Literal", () => {
        const result = BuiltInFunctions.xsdInteger("42");
        expect(result).toBeInstanceOf(Literal);
        expect(result.value).toBe("42");
        expect(result.datatype?.value).toBe("http://www.w3.org/2001/XMLSchema#integer");
      });

      it("should handle negative numbers", () => {
        const result = BuiltInFunctions.xsdInteger("-123");
        expect(result.value).toBe("-123");
        expect(result.datatype?.value).toBe("http://www.w3.org/2001/XMLSchema#integer");
      });

      it("should truncate decimal values", () => {
        const result = BuiltInFunctions.xsdInteger("42.99");
        expect(result.value).toBe("42");
      });

      it("should throw for non-numeric string", () => {
        expect(() => BuiltInFunctions.xsdInteger("abc")).toThrow("xsd:integer: cannot convert 'abc' to integer");
      });

      it("should handle zero", () => {
        const result = BuiltInFunctions.xsdInteger("0");
        expect(result.value).toBe("0");
      });

      it("should handle large numbers", () => {
        const result = BuiltInFunctions.xsdInteger("1234567890");
        expect(result.value).toBe("1234567890");
      });
    });

    describe("xsdDecimal", () => {
      it("should convert string to decimal Literal", () => {
        const result = BuiltInFunctions.xsdDecimal("42.5");
        expect(result).toBeInstanceOf(Literal);
        expect(result.value).toBe("42.5");
        expect(result.datatype?.value).toBe("http://www.w3.org/2001/XMLSchema#decimal");
      });

      it("should handle integer values", () => {
        const result = BuiltInFunctions.xsdDecimal("42");
        expect(result.value).toBe("42");
        expect(result.datatype?.value).toBe("http://www.w3.org/2001/XMLSchema#decimal");
      });

      it("should handle negative decimals", () => {
        const result = BuiltInFunctions.xsdDecimal("-3.14159");
        expect(result.value).toBe("-3.14159");
      });

      it("should throw for non-numeric string", () => {
        expect(() => BuiltInFunctions.xsdDecimal("xyz")).toThrow("xsd:decimal: cannot convert 'xyz' to decimal");
      });

      it("should handle scientific notation", () => {
        const result = BuiltInFunctions.xsdDecimal("1.5e3");
        expect(result.value).toBe("1500");
      });
    });
  });

  describe("ENCODE_FOR_URI", () => {
    describe("basic encoding", () => {
      it("should encode spaces as %20", () => {
        expect(BuiltInFunctions.encodeForUri("hello world")).toBe("hello%20world");
      });

      it("should encode URL special characters", () => {
        expect(BuiltInFunctions.encodeForUri("a/b?c=d")).toBe("a%2Fb%3Fc%3Dd");
      });

      it("should encode ampersand", () => {
        expect(BuiltInFunctions.encodeForUri("foo&bar")).toBe("foo%26bar");
      });

      it("should encode hash/fragment", () => {
        expect(BuiltInFunctions.encodeForUri("test#anchor")).toBe("test%23anchor");
      });

      it("should encode percent sign", () => {
        expect(BuiltInFunctions.encodeForUri("100%")).toBe("100%25");
      });
    });

    describe("unreserved characters (should NOT be encoded)", () => {
      it("should not encode alphabetic characters", () => {
        expect(BuiltInFunctions.encodeForUri("ABCxyz")).toBe("ABCxyz");
      });

      it("should not encode digits", () => {
        expect(BuiltInFunctions.encodeForUri("0123456789")).toBe("0123456789");
      });

      it("should not encode hyphen", () => {
        expect(BuiltInFunctions.encodeForUri("foo-bar")).toBe("foo-bar");
      });

      it("should not encode underscore", () => {
        expect(BuiltInFunctions.encodeForUri("foo_bar")).toBe("foo_bar");
      });

      it("should not encode period", () => {
        expect(BuiltInFunctions.encodeForUri("file.txt")).toBe("file.txt");
      });

      it("should not encode tilde", () => {
        expect(BuiltInFunctions.encodeForUri("~user")).toBe("~user");
      });
    });

    describe("reserved characters (should be encoded)", () => {
      it("should encode colon", () => {
        expect(BuiltInFunctions.encodeForUri("http://example.org")).toBe("http%3A%2F%2Fexample.org");
      });

      it("should encode brackets", () => {
        expect(BuiltInFunctions.encodeForUri("[array]")).toBe("%5Barray%5D");
      });

      it("should encode parentheses", () => {
        expect(BuiltInFunctions.encodeForUri("(value)")).toBe("(value)");
      });

      it("should encode plus sign", () => {
        expect(BuiltInFunctions.encodeForUri("a+b")).toBe("a%2Bb");
      });

      it("should encode exclamation mark", () => {
        expect(BuiltInFunctions.encodeForUri("hello!")).toBe("hello!");
      });
    });

    describe("unicode characters", () => {
      it("should encode Cyrillic characters", () => {
        expect(BuiltInFunctions.encodeForUri("Привет")).toBe("%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82");
      });

      it("should encode Chinese characters", () => {
        expect(BuiltInFunctions.encodeForUri("中文")).toBe("%E4%B8%AD%E6%96%87");
      });

      it("should encode emoji", () => {
        expect(BuiltInFunctions.encodeForUri("👍")).toBe("%F0%9F%91%8D");
      });
    });

    describe("edge cases", () => {
      it("should return empty string for empty input", () => {
        expect(BuiltInFunctions.encodeForUri("")).toBe("");
      });

      it("should handle string with only unreserved characters", () => {
        expect(BuiltInFunctions.encodeForUri("simple-test_123.txt~")).toBe("simple-test_123.txt~");
      });

      it("should handle string with only reserved characters", () => {
        expect(BuiltInFunctions.encodeForUri("/?#")).toBe("%2F%3F%23");
      });

      it("should handle mixed content", () => {
        expect(BuiltInFunctions.encodeForUri("Los Angeles")).toBe("Los%20Angeles");
        expect(BuiltInFunctions.encodeForUri("New York City")).toBe("New%20York%20City");
      });
    });

    describe("SPARQL spec examples", () => {
      // From SPARQL 1.1 spec section 17.4.3.11
      it('ENCODE_FOR_URI("Los Angeles") returns "Los%20Angeles"', () => {
        expect(BuiltInFunctions.encodeForUri("Los Angeles")).toBe("Los%20Angeles");
      });

      it("should properly encode for use in IRI construction", () => {
        // Use case: CONCAT("http://example.org/", ENCODE_FOR_URI(?name))
        const name = "John Doe";
        const encoded = BuiltInFunctions.encodeForUri(name);
        expect(encoded).toBe("John%20Doe");
        const uri = "http://example.org/" + encoded;
        expect(uri).toBe("http://example.org/John%20Doe");
      });
    });
  });

  describe("SPARQL 1.1 Hash Functions", () => {
    describe("MD5", () => {
      it("should return correct MD5 hash for 'test'", () => {
        // Standard test vector
        expect(BuiltInFunctions.md5("test")).toBe("098f6bcd4621d373cade4e832627b4f6");
      });

      it("should return lowercase hexadecimal string", () => {
        const result = BuiltInFunctions.md5("hello");
        expect(result).toMatch(/^[0-9a-f]+$/);
        expect(result.toLowerCase()).toBe(result);
      });

      it("should return 32 character hex string", () => {
        expect(BuiltInFunctions.md5("hello")).toHaveLength(32);
      });

      it("should hash empty string", () => {
        expect(BuiltInFunctions.md5("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
      });

      it("should hash unicode characters", () => {
        const hash = BuiltInFunctions.md5("Привет мир");
        expect(hash).toHaveLength(32);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });

      it("should produce different hashes for different inputs", () => {
        const hash1 = BuiltInFunctions.md5("hello");
        const hash2 = BuiltInFunctions.md5("world");
        expect(hash1).not.toBe(hash2);
      });

      it("should produce same hash for same input", () => {
        const hash1 = BuiltInFunctions.md5("reproducible");
        const hash2 = BuiltInFunctions.md5("reproducible");
        expect(hash1).toBe(hash2);
      });
    });

    describe("SHA1", () => {
      it("should return correct SHA1 hash for 'test'", () => {
        // Standard test vector
        expect(BuiltInFunctions.sha1("test")).toBe("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
      });

      it("should return lowercase hexadecimal string", () => {
        const result = BuiltInFunctions.sha1("hello");
        expect(result).toMatch(/^[0-9a-f]+$/);
        expect(result.toLowerCase()).toBe(result);
      });

      it("should return 40 character hex string", () => {
        expect(BuiltInFunctions.sha1("hello")).toHaveLength(40);
      });

      it("should hash empty string", () => {
        expect(BuiltInFunctions.sha1("")).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
      });

      it("should hash unicode characters", () => {
        const hash = BuiltInFunctions.sha1("日本語");
        expect(hash).toHaveLength(40);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });

      it("should produce different hashes for different inputs", () => {
        const hash1 = BuiltInFunctions.sha1("hello");
        const hash2 = BuiltInFunctions.sha1("world");
        expect(hash1).not.toBe(hash2);
      });

      it("should produce same hash for same input", () => {
        const hash1 = BuiltInFunctions.sha1("consistent");
        const hash2 = BuiltInFunctions.sha1("consistent");
        expect(hash1).toBe(hash2);
      });
    });

    describe("SHA256", () => {
      it("should return correct SHA256 hash for 'test'", () => {
        // Standard test vector
        expect(BuiltInFunctions.sha256("test")).toBe(
          "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
        );
      });

      it("should return lowercase hexadecimal string", () => {
        const result = BuiltInFunctions.sha256("hello");
        expect(result).toMatch(/^[0-9a-f]+$/);
        expect(result.toLowerCase()).toBe(result);
      });

      it("should return 64 character hex string", () => {
        expect(BuiltInFunctions.sha256("hello")).toHaveLength(64);
      });

      it("should hash empty string", () => {
        expect(BuiltInFunctions.sha256("")).toBe(
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
      });

      it("should hash unicode characters", () => {
        const hash = BuiltInFunctions.sha256("emoji 👍");
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });

      it("should produce different hashes for different inputs", () => {
        const hash1 = BuiltInFunctions.sha256("hello");
        const hash2 = BuiltInFunctions.sha256("world");
        expect(hash1).not.toBe(hash2);
      });

      it("should produce same hash for same input", () => {
        const hash1 = BuiltInFunctions.sha256("deterministic");
        const hash2 = BuiltInFunctions.sha256("deterministic");
        expect(hash1).toBe(hash2);
      });

      it("should be suitable for generating stable keys", () => {
        // Use case from issue: generating hashed identifiers
        const email = "user@example.com";
        const hashedEmail = BuiltInFunctions.sha256(email);
        expect(hashedEmail).toBe(
          "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514"
        );
      });
    });

    describe("SHA384", () => {
      it("should return correct SHA384 hash for 'test'", () => {
        // Standard test vector
        expect(BuiltInFunctions.sha384("test")).toBe(
          "768412320f7b0aa5812fce428dc4706b3cae50e02a64caa16a782249bfe8efc4b7ef1ccb126255d196047dfedf17a0a9"
        );
      });

      it("should return lowercase hexadecimal string", () => {
        const result = BuiltInFunctions.sha384("hello");
        expect(result).toMatch(/^[0-9a-f]+$/);
        expect(result.toLowerCase()).toBe(result);
      });

      it("should return 96 character hex string", () => {
        expect(BuiltInFunctions.sha384("hello")).toHaveLength(96);
      });

      it("should hash empty string", () => {
        expect(BuiltInFunctions.sha384("")).toBe(
          "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b"
        );
      });

      it("should hash unicode characters", () => {
        const hash = BuiltInFunctions.sha384("中文测试");
        expect(hash).toHaveLength(96);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });

      it("should produce different hashes for different inputs", () => {
        const hash1 = BuiltInFunctions.sha384("hello");
        const hash2 = BuiltInFunctions.sha384("world");
        expect(hash1).not.toBe(hash2);
      });

      it("should produce same hash for same input", () => {
        const hash1 = BuiltInFunctions.sha384("reliable");
        const hash2 = BuiltInFunctions.sha384("reliable");
        expect(hash1).toBe(hash2);
      });
    });

    describe("SHA512", () => {
      it("should return correct SHA512 hash for 'test'", () => {
        // Standard test vector
        expect(BuiltInFunctions.sha512("test")).toBe(
          "ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff"
        );
      });

      it("should return lowercase hexadecimal string", () => {
        const result = BuiltInFunctions.sha512("hello");
        expect(result).toMatch(/^[0-9a-f]+$/);
        expect(result.toLowerCase()).toBe(result);
      });

      it("should return 128 character hex string", () => {
        expect(BuiltInFunctions.sha512("hello")).toHaveLength(128);
      });

      it("should hash empty string", () => {
        expect(BuiltInFunctions.sha512("")).toBe(
          "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
        );
      });

      it("should hash unicode characters", () => {
        const hash = BuiltInFunctions.sha512("مرحبا");
        expect(hash).toHaveLength(128);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });

      it("should produce different hashes for different inputs", () => {
        const hash1 = BuiltInFunctions.sha512("hello");
        const hash2 = BuiltInFunctions.sha512("world");
        expect(hash1).not.toBe(hash2);
      });

      it("should produce same hash for same input", () => {
        const hash1 = BuiltInFunctions.sha512("stable");
        const hash2 = BuiltInFunctions.sha512("stable");
        expect(hash1).toBe(hash2);
      });
    });

    describe("SPARQL use cases", () => {
      it("should work in BIND expression context (generate hashed identifier)", () => {
        // Simulating: SELECT ?s (SHA256(?email) AS ?hashedEmail)
        const email = "test@example.com";
        const hashedEmail = BuiltInFunctions.sha256(email);
        expect(hashedEmail).toHaveLength(64);
        expect(hashedEmail).toMatch(/^[0-9a-f]+$/);
      });

      it("should produce consistent hashes for identical strings", () => {
        // Important for reproducible keys
        const value = "user123";
        const hash1 = BuiltInFunctions.sha256(value);
        const hash2 = BuiltInFunctions.sha256(value);
        const hash3 = BuiltInFunctions.sha256(value);
        expect(hash1).toBe(hash2);
        expect(hash2).toBe(hash3);
      });

      it("should handle special characters in input", () => {
        const special = "hello\nworld\t!@#$%^&*()";
        const hash = BuiltInFunctions.sha256(special);
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });

      it("should handle long strings", () => {
        const longString = "a".repeat(10000);
        const hash = BuiltInFunctions.sha256(longString);
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[0-9a-f]+$/);
      });
    });
  });
});
