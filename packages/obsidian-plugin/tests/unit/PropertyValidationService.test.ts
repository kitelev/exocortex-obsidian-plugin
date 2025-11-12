import { PropertyValidationService } from "../../src/application/services/PropertyValidationService";
import { SPARQLQueryService } from "../../src/application/services/SPARQLQueryService";

describe("PropertyValidationService", () => {
  let service: PropertyValidationService;
  let mockSparqlService: jest.Mocked<SPARQLQueryService>;

  beforeEach(() => {
    mockSparqlService = {
      query: jest.fn(),
      initialize: jest.fn(),
      refresh: jest.fn(),
      updateFile: jest.fn(),
      dispose: jest.fn(),
    } as unknown as jest.Mocked<SPARQLQueryService>;

    service = new PropertyValidationService(mockSparqlService);
  });

  describe("validatePropertyDomain", () => {
    it("should return valid when property domain matches asset class", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([["domain", "ems__Task"]]),
      ]);

      const result = await service.validatePropertyDomain(
        "ems__Effort_status",
        "ems__Task",
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should return invalid when property domain does not match asset class", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([["domain", "ems__Task"]]),
      ]);

      const result = await service.validatePropertyDomain(
        "ems__Effort_status",
        "ims__Concept",
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("not allowed");
      expect(result.errorMessage).toContain("ems__Effort_status");
      expect(result.errorMessage).toContain("ims__Concept");
    });

    it("should return valid when no domain constraint exists", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      const result = await service.validatePropertyDomain(
        "custom__Property",
        "ems__Task",
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should return valid when domain matches partial class name", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([["domain", "ems__Task"]]),
      ]);

      const result = await service.validatePropertyDomain(
        "ems__Effort_status",
        "[[ems__Task]]",
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle SPARQL query errors gracefully", async () => {
      mockSparqlService.query.mockRejectedValue(
        new Error("SPARQL execution failed"),
      );

      const result = await service.validatePropertyDomain(
        "ems__Effort_status",
        "ems__Task",
      );

      expect(result.isValid).toBe(true);
    });

    it("should extract property local name correctly", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([["domain", "ems__Task"]]),
      ]);

      await service.validatePropertyDomain("ems__Effort_status", "ems__Task");

      const queryArg = mockSparqlService.query.mock.calls[0][0];
      expect(queryArg).toContain("Effort_status");
    });
  });

  describe("validatePropertyRange", () => {
    it("should return valid when value type matches range", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#string"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "exo__Asset_label",
        "My Task",
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should return invalid when value type does not match range", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#integer"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "ems__Effort_priority",
        "high",
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("Expected");
      expect(result.errorMessage).toContain("integer");
      expect(result.errorMessage).toContain("string");
    });

    it("should return valid when no range constraint exists", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      const result = await service.validatePropertyRange(
        "custom__Property",
        "any value",
      );

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should detect wikilink type correctly", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#string"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "ems__Effort_status",
        "[[ems__EffortStatusDoing]]",
      );

      expect(result.isValid).toBe(true);
    });

    it("should detect datetime type correctly", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#dateTime"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "ems__Effort_startTimestamp",
        "2025-01-15T10:30:00",
      );

      expect(result.isValid).toBe(true);
    });

    it("should detect number type correctly", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#integer"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "ems__Effort_priority",
        42,
      );

      expect(result.isValid).toBe(true);
    });

    it("should detect boolean type correctly", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#boolean"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "custom__IsActive",
        true,
      );

      expect(result.isValid).toBe(true);
    });

    it("should detect array type correctly", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/1999/02/22-rdf-syntax-ns#List"],
        ]),
      ]);

      const result = await service.validatePropertyRange("custom__Tags", [
        "tag1",
        "tag2",
      ]);

      expect(result.isValid).toBe(true);
    });

    it("should handle short namespace prefixes (xsd:)", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([["range", "xsd:string"]]),
      ]);

      const result = await service.validatePropertyRange(
        "exo__Asset_label",
        "text",
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle SPARQL query errors gracefully", async () => {
      mockSparqlService.query.mockRejectedValue(
        new Error("SPARQL execution failed"),
      );

      const result = await service.validatePropertyRange(
        "exo__Asset_label",
        "value",
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle null and undefined values", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#string"],
        ]),
      ]);

      const resultNull = await service.validatePropertyRange(
        "custom__Prop",
        null,
      );
      const resultUndefined = await service.validatePropertyRange(
        "custom__Prop",
        undefined,
      );

      expect(resultNull.isValid).toBe(false);
      expect(resultUndefined.isValid).toBe(false);
    });

    it("should handle object values", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#string"],
        ]),
      ]);

      const result = await service.validatePropertyRange("custom__Metadata", {
        key: "value",
      });

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("object");
    });
  });

  describe("edge cases", () => {
    it("should handle empty property name", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      const result = await service.validatePropertyDomain("", "ems__Task");

      expect(result.isValid).toBe(true);
    });

    it("should handle empty asset class", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      const result = await service.validatePropertyDomain(
        "ems__Effort_status",
        "",
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle property name without namespace prefix", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      const result = await service.validatePropertyDomain(
        "SimpleProperty",
        "ems__Task",
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle wikilink with alias", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#string"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "ems__Effort_status",
        "[[ems__EffortStatusDoing|Doing]]",
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle datetime with milliseconds", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#dateTime"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "ems__Effort_startTimestamp",
        "2025-01-15T10:30:00.123Z",
      );

      expect(result.isValid).toBe(true);
    });

    it("should handle datetime without time component", async () => {
      mockSparqlService.query.mockResolvedValue([
        new Map([
          ["range", "http://www.w3.org/2001/XMLSchema#dateTime"],
        ]),
      ]);

      const result = await service.validatePropertyRange(
        "ems__Effort_date",
        "2025-01-15",
      );

      expect(result.isValid).toBe(true);
    });
  });
});
