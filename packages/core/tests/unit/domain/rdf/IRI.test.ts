import { IRI } from "../../../../src/domain/models/rdf/IRI";

describe("IRI", () => {
  describe("constructor", () => {
    it("should create valid IRI from valid URI string", () => {
      const iri = new IRI("https://example.com/resource");
      expect(iri.value).toBe("https://example.com/resource");
    });

    it("should create valid IRI with special characters", () => {
      const iri = new IRI("https://example.com/path/with-dashes_and_underscores");
      expect(iri.value).toBe("https://example.com/path/with-dashes_and_underscores");
    });

    it("should create valid IRI with query parameters", () => {
      const iri = new IRI("https://example.com/resource?param=value");
      expect(iri.value).toBe("https://example.com/resource?param=value");
    });

    it("should create valid IRI with fragment", () => {
      const iri = new IRI("https://example.com/resource#fragment");
      expect(iri.value).toBe("https://example.com/resource#fragment");
    });

    it("should throw error for empty string", () => {
      expect(() => new IRI("")).toThrow("IRI cannot be empty");
    });

    it("should throw error for whitespace-only string", () => {
      expect(() => new IRI("   ")).toThrow("IRI cannot be empty");
    });

    it("should throw error for invalid IRI with spaces", () => {
      expect(() => new IRI("https://example.com/path with spaces")).toThrow(
        "Invalid IRI format"
      );
    });

    it("should throw error for invalid scheme", () => {
      expect(() => new IRI("not-a-valid-scheme://example")).toThrow(
        "Invalid IRI format"
      );
    });
  });

  describe("equals", () => {
    it("should return true for identical IRIs", () => {
      const iri1 = new IRI("https://example.com/resource");
      const iri2 = new IRI("https://example.com/resource");
      expect(iri1.equals(iri2)).toBe(true);
    });

    it("should return false for different IRIs", () => {
      const iri1 = new IRI("https://example.com/resource1");
      const iri2 = new IRI("https://example.com/resource2");
      expect(iri1.equals(iri2)).toBe(false);
    });

    it("should be case-sensitive", () => {
      const iri1 = new IRI("https://example.com/Resource");
      const iri2 = new IRI("https://example.com/resource");
      expect(iri1.equals(iri2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return IRI value as string", () => {
      const iri = new IRI("https://example.com/resource");
      expect(iri.toString()).toBe("https://example.com/resource");
    });
  });

  describe("isValidIRI", () => {
    it("should return true for valid HTTP IRI", () => {
      expect(IRI.isValidIRI("http://example.com")).toBe(true);
    });

    it("should return true for valid HTTPS IRI", () => {
      expect(IRI.isValidIRI("https://example.com")).toBe(true);
    });

    it("should return true for valid URN", () => {
      expect(IRI.isValidIRI("urn:isbn:0451450523")).toBe(true);
    });

    it("should return true for valid file URI", () => {
      expect(IRI.isValidIRI("file:///path/to/file")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(IRI.isValidIRI("")).toBe(false);
    });

    it("should return false for IRI with spaces", () => {
      expect(IRI.isValidIRI("http://example.com/path with spaces")).toBe(false);
    });

    it("should return false for relative URI", () => {
      expect(IRI.isValidIRI("/relative/path")).toBe(false);
    });

    it("should return false for invalid scheme", () => {
      expect(IRI.isValidIRI("not a scheme://example")).toBe(false);
    });
  });

  describe("RFC 3987 compliance", () => {
    it("should accept percent-encoded characters", () => {
      const iri = new IRI("https://example.com/path%20with%20encoded");
      expect(iri.value).toBe("https://example.com/path%20with%20encoded");
    });

    it("should accept international characters in domain", () => {
      const iri = new IRI("https://例え.jp/resource");
      expect(iri.value).toBe("https://例え.jp/resource");
    });

    it("should accept international characters in path", () => {
      const iri = new IRI("https://example.com/リソース");
      expect(iri.value).toBe("https://example.com/リソース");
    });
  });
});
