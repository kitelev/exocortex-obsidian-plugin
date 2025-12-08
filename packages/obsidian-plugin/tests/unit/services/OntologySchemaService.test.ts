import { SPARQLQueryService } from "../../../src/application/services/SPARQLQueryService";
import {
  OntologySchemaService,
  type OntologyPropertyDefinition,
} from "../../../src/application/services/OntologySchemaService";

// Mock SPARQLQueryService
jest.mock("../../../src/application/services/SPARQLQueryService");

describe("OntologySchemaService", () => {
  let mockSparqlService: jest.Mocked<SPARQLQueryService>;
  let schemaService: OntologySchemaService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSparqlService = {
      query: jest.fn(),
      initialize: jest.fn(),
      refresh: jest.fn(),
      updateFile: jest.fn(),
      dispose: jest.fn(),
    } as unknown as jest.Mocked<SPARQLQueryService>;
    schemaService = new OntologySchemaService(mockSparqlService);
  });

  describe("getClassProperties", () => {
    it("should return empty array when no properties found", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      const properties = await schemaService.getClassProperties("ems__Task");

      expect(properties).toEqual([]);
    });

    it("should return properties from SPARQL query", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/exo#Asset_label"],
        ["label", "Label"],
        ["range", "http://www.w3.org/2001/XMLSchema#string"],
        ["deprecated", "false"],
        ["comment", "Display label for the asset"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("ems__Task");

      expect(properties).toHaveLength(1);
      expect(properties[0]).toMatchObject({
        uri: "exo__Asset_label",
        label: "Label",
        fieldType: "text",
        deprecated: false,
        description: "Display label for the asset",
      });
    });

    it("should extract label from URI when rdfs:label not available", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/ems#Effort_taskSize"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("ems__Task");

      expect(properties).toHaveLength(1);
      expect(properties[0].label).toBe("Task Size");
    });

    it("should map datetime range to timestamp field type", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/exo#Asset_createdAt"],
        ["range", "http://www.w3.org/2001/XMLSchema#dateTime"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("exo__Asset");

      expect(properties[0].fieldType).toBe("timestamp");
    });

    it("should map integer range to number field type", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/ems#Effort_votes"],
        ["range", "http://www.w3.org/2001/XMLSchema#integer"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("ems__Effort");

      expect(properties[0].fieldType).toBe("number");
    });

    it("should map boolean range to boolean field type", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/exo#Asset_isArchived"],
        ["range", "http://www.w3.org/2001/XMLSchema#boolean"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("exo__Asset");

      expect(properties[0].fieldType).toBe("boolean");
    });

    it("should map EffortStatus range to status-select field type", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/ems#Effort_status"],
        ["range", "https://exocortex.my/ontology/ems#EffortStatus"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("ems__Effort");

      expect(properties[0].fieldType).toBe("status-select");
    });

    it("should map TaskSize range to size-select field type", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/ems#Effort_taskSize"],
        ["range", "https://exocortex.my/ontology/ems#TaskSize"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("ems__Effort");

      expect(properties[0].fieldType).toBe("size-select");
    });

    it("should map Asset reference to wikilink field type", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/ems#Effort_parent"],
        ["range", "https://exocortex.my/ontology/exo#Asset"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("ems__Effort");

      expect(properties[0].fieldType).toBe("wikilink");
    });

    it("should detect deprecated properties", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/exo#Asset_oldField"],
        ["deprecated", "true"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("exo__Asset");

      expect(properties[0].deprecated).toBe(true);
    });

    it("should return empty array on query error", async () => {
      mockSparqlService.query.mockRejectedValue(new Error("Query failed"));

      const properties = await schemaService.getClassProperties("ems__Task");

      expect(properties).toEqual([]);
    });

    it("should sort properties alphabetically by label", async () => {
      const bindings = [
        new Map<string, unknown>([
          ["property", "https://exocortex.my/ontology/exo#Asset_zebra"],
          ["label", "Zebra"],
        ]),
        new Map<string, unknown>([
          ["property", "https://exocortex.my/ontology/exo#Asset_alpha"],
          ["label", "Alpha"],
        ]),
        new Map<string, unknown>([
          ["property", "https://exocortex.my/ontology/exo#Asset_beta"],
          ["label", "Beta"],
        ]),
      ];

      mockSparqlService.query.mockResolvedValue(bindings);

      const properties = await schemaService.getClassProperties("exo__Asset");

      expect(properties.map((p) => p.label)).toEqual(["Alpha", "Beta", "Zebra"]);
    });
  });

  describe("getDefaultProperties", () => {
    it("should return label property for any class", () => {
      const properties = schemaService.getDefaultProperties("exo__Asset");

      expect(properties).toContainEqual(
        expect.objectContaining({
          uri: "exo__Asset_label",
          label: "Label",
          fieldType: "text",
        }),
      );
    });

    it("should return task-specific properties for ems__Task", () => {
      const properties = schemaService.getDefaultProperties("ems__Task");

      expect(properties).toHaveLength(3);
      expect(properties).toContainEqual(
        expect.objectContaining({
          uri: "exo__Asset_label",
          fieldType: "text",
        }),
      );
      expect(properties).toContainEqual(
        expect.objectContaining({
          uri: "ems__Effort_taskSize",
          fieldType: "size-select",
        }),
      );
      expect(properties).toContainEqual(
        expect.objectContaining({
          uri: "ems__Effort_status",
          fieldType: "status-select",
        }),
      );
    });

    it("should return task properties for Task subclasses", () => {
      const properties = schemaService.getDefaultProperties("ems__Task_Custom");

      expect(properties).toHaveLength(3);
      expect(properties).toContainEqual(
        expect.objectContaining({
          uri: "ems__Effort_taskSize",
        }),
      );
    });

    it("should not return task properties for non-Task classes", () => {
      const properties = schemaService.getDefaultProperties("ems__Project");

      expect(properties).toHaveLength(1);
      expect(properties[0].uri).toBe("exo__Asset_label");
    });
  });

  describe("IRI conversion", () => {
    it("should convert class name to full IRI for EMS namespace", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      await schemaService.getClassProperties("ems__Task");

      expect(mockSparqlService.query).toHaveBeenCalledWith(
        expect.stringContaining("<https://exocortex.my/ontology/ems#Task>"),
      );
    });

    it("should convert class name to full IRI for EXO namespace", async () => {
      mockSparqlService.query.mockResolvedValue([]);

      await schemaService.getClassProperties("exo__Asset");

      expect(mockSparqlService.query).toHaveBeenCalledWith(
        expect.stringContaining("<https://exocortex.my/ontology/exo#Asset>"),
      );
    });
  });

  describe("label extraction", () => {
    it("should extract label from property with underscore separator", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/exo#Asset_displayName"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("exo__Asset");

      expect(properties[0].label).toBe("Display Name");
    });

    it("should handle camelCase in property names", async () => {
      const mockBinding = new Map<string, unknown>([
        ["property", "https://exocortex.my/ontology/exo#Asset_isArchived"],
      ]);

      mockSparqlService.query.mockResolvedValue([mockBinding]);

      const properties = await schemaService.getClassProperties("exo__Asset");

      expect(properties[0].label).toBe("Is Archived");
    });
  });
});
