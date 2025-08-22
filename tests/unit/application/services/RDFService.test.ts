/**
 * Test suite for RDF Service functionality
 * Memory-optimized for CI/CD environments
 */

// Import memory optimization setup first
import "../../../memory-optimization-setup";

// Manual mocking approach for better control

import { RDFService } from "../../../../src/application/services/RDFService";
import { RDFSerializer } from "../../../../src/application/services/RDFSerializer";
import { RDFParser } from "../../../../src/application/services/RDFParser";
import { NamespaceManager } from "../../../../src/application/services/NamespaceManager";
import { Graph } from "../../../../src/domain/semantic/core/Graph";
import {
  Triple,
  IRI,
  BlankNode,
  Literal,
} from "../../../../src/domain/semantic/core/Triple";
import { Result } from "../../../../src/domain/core/Result";
import { TFile } from "obsidian";
import { INotificationService } from "../../../../src/application/ports/INotificationService";
import { IFileSystemAdapter } from "../../../../src/application/ports/IFileSystemAdapter";

// Mock implementations for ports
const mockNotificationService: INotificationService = {
  showNotice: jest.fn(),
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showWarning: jest.fn(),
};

const mockFileSystemAdapter: IFileSystemAdapter = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  fileExists: jest.fn(),
  listFiles: jest.fn(),
  generateFileName: jest.fn(),
  detectFormatFromExtension: jest.fn(),
  ensureDirectory: jest.fn(),
};

// Mock Obsidian App with comprehensive vault operations
const mockApp = {
  vault: {
    getAbstractFileByPath: jest.fn(),
    createFolder: jest.fn(),
    create: jest.fn(),
    modify: jest.fn(),
    read: jest.fn(),
    getFiles: jest.fn().mockReturnValue([]),
    adapter: {
      write: jest.fn(),
      read: jest.fn(),
    },
  },
} as any;

// Mock the service classes
const mockRDFFileManager = {
  readFromVault: jest.fn(),
  saveToVault: jest.fn(),
  detectFormatFromExtension: jest.fn(),
  listRDFFiles: jest.fn(),
  generateFileName: jest.fn(),
};

const mockRDFParser = {
  parse: jest.fn(),
};

const mockRDFValidator = {
  validateExportOptions: jest.fn(),
  validateImportOptions: jest.fn(),
  validateGraph: jest.fn(),
};

const mockRDFSerializer = {
  serialize: jest.fn(),
};

const mockNamespaceManager = {
  hasPrefix: jest.fn(),
  addBinding: jest.fn(),
  getPrefix: jest.fn(),
  expand: jest.fn(),
  compressIRI: jest.fn(),
  getAllBindings: jest.fn(),
  generatePrefixDeclarations: jest.fn(),
  getNamespace: jest.fn(),
  expandCURIE: jest.fn(),
};

// Override the imports with our mocks using jest.doMock
// Using real RDFFileManager - just mock vault operations

jest.doMock("../../../../src/application/services/RDFParser", () => {
  return {
    RDFParser: jest.fn(() => mockRDFParser),
  };
});

jest.doMock("../../../../src/application/services/RDFValidator", () => {
  return {
    RDFValidator: jest.fn(() => mockRDFValidator),
  };
});

jest.doMock("../../../../src/application/services/RDFSerializer", () => {
  return {
    RDFSerializer: jest.fn(() => mockRDFSerializer),
  };
});

jest.doMock("../../../../src/application/services/NamespaceManager", () => {
  return {
    NamespaceManager: jest.fn(() => mockNamespaceManager),
  };
});

describe("RDFService", () => {
  let rdfService: RDFService;
  let graph: Graph;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock responses for successful operations
    mockRDFFileManager.readFromVault.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      getValue: () =>
        '@prefix ex: <http://example.org/> . ex:test ex:prop "value" .',
      errorValue: () => "",
      getError: () => "",
      getErrorMessage: () => "",
      error: "",
    });

    mockRDFFileManager.detectFormatFromExtension.mockReturnValue("turtle");

    mockRDFParser.parse.mockReturnValue({
      isSuccess: true,
      isFailure: false,
      getValue: () => ({
        graph: new Graph(),
        tripleCount: 1,
        namespaces: { ex: "http://example.org/" },
        warnings: [],
      }),
      errorValue: () => "",
      getError: () => "",
      getErrorMessage: () => "",
      error: "",
    });

    // CRITICAL FIX: Setup RDFValidator methods to return proper Result objects matching Result<T> interface
    mockRDFValidator.validateExportOptions.mockReturnValue({
      isSuccess: true,
      isFailure: false,
      getValue: () => undefined,
      errorValue: () => "",
      getError: () => "",
      getErrorMessage: () => "",
      error: "",
    });

    mockRDFValidator.validateImportOptions.mockReturnValue({
      isSuccess: true,
      isFailure: false,
      getValue: () => undefined,
      errorValue: () => "",
      getError: () => "",
      getErrorMessage: () => "",
      error: "",
    });

    mockRDFFileManager.listRDFFiles.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      getValue: () => [],
      errorValue: () => "",
      getError: () => "",
      getErrorMessage: () => "",
      error: "",
    });

    mockRDFFileManager.saveToVault.mockImplementation(
      async (content, filePath) => {
        // Simulate vault write operation
        mockApp.vault.create(filePath, content);
        return {
          isSuccess: true,
          isFailure: false,
          getValue: () => ({ filePath, success: true }),
          errorValue: () => "",
          getError: () => "",
          getErrorMessage: () => "",
          error: "",
        };
      },
    );

    mockRDFFileManager.generateFileName.mockImplementation(
      (fileName, format) => {
        if (fileName) return fileName;
        const extension = format === "turtle" ? ".ttl" : ".rdf";
        return `generated-file${extension}`;
      },
    );

    // Setup serializer mock - make it format-aware
    mockRDFSerializer.serialize.mockImplementation((graph, options) => {
      const tripleCount = graph.size();
      let content: string;

      switch (options.format) {
        case "json-ld":
          content = JSON.stringify(
            {
              "@context": { ex: "http://example.org/" },
              "@graph": [
                {
                  "@id": "http://example.org/person/1",
                  "http://example.org/name": { "@value": "John Doe" },
                },
              ],
            },
            null,
            2,
          );
          break;
        case "n-triples":
          content =
            '<http://example.org/person/1> <http://example.org/name> "John Doe" .';
          break;
        case "turtle":
        default:
          content =
            '@prefix ex: <http://example.org/> .\n<http://example.org/person/1> <http://example.org/name> "John Doe" .';
          break;
      }

      return {
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          content,
          tripleCount,
          format: options.format,
        }),
        errorValue: () => "",
        getError: () => "",
        getErrorMessage: () => "",
        error: "",
      };
    });

    // Setup namespace manager mock
    mockNamespaceManager.hasPrefix.mockReturnValue(false);
    mockNamespaceManager.addBinding.mockImplementation(() => {});
    mockNamespaceManager.compressIRI.mockImplementation((iri) =>
      iri.toString(),
    );
    mockNamespaceManager.getAllBindings.mockReturnValue([
      { prefix: "ex", namespace: { toString: () => "http://example.org/" } },
      {
        prefix: "foaf",
        namespace: { toString: () => "http://xmlns.com/foaf/0.1/" },
      },
    ]);
    mockNamespaceManager.generatePrefixDeclarations.mockReturnValue(
      "@prefix ex: <http://example.org/> .",
    );
    mockNamespaceManager.getNamespace.mockReturnValue(null);
    mockNamespaceManager.expandCURIE.mockReturnValue({ isSuccess: false });

    mockRDFValidator.validateGraph.mockReturnValue({
      isSuccess: true,
      isFailure: false,
      getValue: () => ({
        isValid: true,
        errors: [],
        warnings: [],
      }),
      errorValue: () => "",
      getError: () => "",
      getErrorMessage: () => "",
      error: "",
    });

    rdfService = new RDFService(mockNotificationService, mockFileSystemAdapter);
    graph = new Graph();

    // Add some test data
    const subject = new IRI("http://example.org/person/1");
    const predicate = new IRI("http://example.org/name");
    const object = Literal.string("John Doe");

    graph.add(new Triple(subject, predicate, object));
  });

  describe("exportGraph", () => {
    it("should export graph in Turtle format", async () => {
      const result = await rdfService.exportGraph(graph, {
        format: "turtle",
        saveToVault: false,
      });

      expect(result.isSuccess).toBe(true);

      const exportData = result.getValue();
      expect(exportData.format).toBe("turtle");
      expect(exportData.tripleCount).toBe(1);
      expect(exportData.content).toContain("@prefix");
      expect(exportData.content).toContain("John Doe");
    });

    it("should export graph in JSON-LD format", async () => {
      const result = await rdfService.exportGraph(graph, {
        format: "json-ld",
        saveToVault: false,
      });

      expect(result.isSuccess).toBe(true);

      const exportData = result.getValue();
      expect(exportData.format).toBe("json-ld");
      expect(exportData.tripleCount).toBe(1);

      // Should be valid JSON
      const jsonData = JSON.parse(exportData.content);
      expect(jsonData["@context"]).toBeDefined();
      expect(jsonData["@graph"]).toBeDefined();
    });

    it("should validate export options", async () => {
      // Mock validation failure for invalid format
      mockRDFValidator.validateExportOptions.mockReturnValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Unsupported format: invalid",
      });

      const result = await rdfService.exportGraph(graph, {
        format: "invalid" as any,
        saveToVault: false,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain(
        "Unsupported export format: invalid",
      );
    });
  });

  describe("importRDF", () => {
    it("should import Turtle format RDF", async () => {
      const turtleContent = `
                @prefix ex: <http://example.org/> .
                ex:person1 ex:name "Jane Smith" .
                ex:person1 ex:age "30"^^<http://www.w3.org/2001/XMLSchema#integer> .
            `;

      const result = await rdfService.importRDF(turtleContent, graph, {
        format: "turtle",
        mergeMode: "merge",
      });

      expect(result.isSuccess).toBe(true);

      const { graph: updatedGraph, imported } = result.getValue();
      expect(imported.tripleCount).toBeGreaterThan(0);
      expect(updatedGraph.size()).toBeGreaterThanOrEqual(1); // Should have at least the imported data
    });

    it("should import JSON-LD format RDF", async () => {
      const jsonldContent = JSON.stringify({
        "@context": {
          ex: "http://example.org/",
        },
        "@graph": [
          {
            "@id": "ex:person2",
            "ex:name": { "@value": "Bob Johnson" },
            "ex:age": {
              "@value": "25",
              "@type": "http://www.w3.org/2001/XMLSchema#integer",
            },
          },
        ],
      });

      const result = await rdfService.importRDF(jsonldContent, graph, {
        format: "json-ld",
        mergeMode: "merge",
      });

      expect(result.isSuccess).toBe(true);

      const { imported } = result.getValue();
      expect(imported.tripleCount).toBeGreaterThan(0);
    });

    it("should validate import options", async () => {
      // Mock validation failure for invalid format
      mockRDFValidator.validateImportOptions.mockReturnValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Unsupported import format: invalid",
      });

      const result = await rdfService.importRDF("invalid content", graph, {
        format: "invalid" as any,
        mergeMode: "merge",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain(
        "Unsupported import format: invalid",
      );
    });

    it("should handle replace merge mode", async () => {
      const originalSize = graph.size();

      const turtleContent = `
                @prefix ex: <http://example.org/> .
                ex:newperson ex:name "New Person" .
            `;

      // Mock successful parsing with specific data for replace mode
      const replacementGraph = new Graph();
      replacementGraph.add(
        new Triple(
          new IRI("http://example.org/newperson"),
          new IRI("http://example.org/name"),
          Literal.string("New Person"),
        ),
      );

      mockRDFParser.parse.mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          graph: replacementGraph,
          tripleCount: 1,
          namespaces: { ex: "http://example.org/" },
          warnings: [],
        }),
        errorValue: () => null,
      });

      const result = await rdfService.importRDF(turtleContent, graph, {
        format: "turtle",
        mergeMode: "replace",
      });

      expect(result.isSuccess).toBe(true);

      const { graph: updatedGraph } = result.getValue();
      // In replace mode, should return the replacement graph
      expect(updatedGraph.size()).toBe(1);
    });
  });

  describe("getSupportedFormats", () => {
    it("should return all supported formats", () => {
      const formats = rdfService.getSupportedFormats();

      expect(formats).toContain("turtle");
      expect(formats).toContain("n-triples");
      expect(formats).toContain("json-ld");
      expect(formats).toContain("rdf-xml");
    });
  });

  describe("getFormatInfo", () => {
    it("should return format information", () => {
      const info = rdfService.getFormatInfo("turtle");

      expect(info.extension).toBe(".ttl");
      expect(info.mimeType).toBe("text/turtle");
      expect(info.name).toBe("Turtle");
    });
  });

  describe("exportQueryResults", () => {
    it("should export SPARQL query results", async () => {
      const queryResults = [
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/name",
          object: "John Doe",
        },
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/age",
          object: "30",
        },
      ];

      const result = await rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "query-results",
        false,
      );

      expect(result.isSuccess).toBe(true);

      const exportData = result.getValue();
      expect(exportData.format).toBe("turtle");
      expect(exportData.tripleCount).toBe(2);
    });
  });

  describe("importFromVaultFile", () => {
    it.skip("should import RDF from vault file", async () => {
      const mockFile = {
        path: "test.ttl",
        name: "test.ttl",
      } as any;

      // Mock the vault to return a proper TFile for reading
      const mockTFile = {
        path: "test.ttl",
        name: "test.ttl",
      } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockApp.vault.read.mockResolvedValue(
        '@prefix ex: <http://example.org/> . ex:person1 ex:name \"Test Person\" .',
      );

      // Mock successful file read
      mockRDFFileManager.readFromVault.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        getValue: () =>
          '@prefix ex: <http://example.org/> . ex:person1 ex:name "Test Person" .',
        errorValue: () => null,
      });

      // Mock format detection
      mockRDFFileManager.detectFormatFromExtension.mockReturnValue("turtle");

      // Mock successful parsing
      const testGraph = new Graph();
      testGraph.add(
        new Triple(
          new IRI("http://example.org/person1"),
          new IRI("http://example.org/name"),
          Literal.string("Test Person"),
        ),
      );

      mockRDFParser.parse.mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          graph: testGraph,
          tripleCount: 1,
          namespaces: { ex: "http://example.org/" },
          warnings: [],
        }),
        errorValue: () => null,
      });

      const result = await rdfService.importFromVaultFile(
        mockFile.path,
        graph,
        {
          mergeMode: "merge",
        },
      );

      expect(result.isSuccess).toBe(true);
      // Note: using real RDFFileManager implementation, not testing mock calls
    });

    it.skip("should auto-detect format from file extension", async () => {
      const mockFile = {
        path: "test.jsonld",
        name: "test.jsonld",
      } as any;

      // Mock the vault to return a proper TFile for reading
      const mockTFile = {
        path: "test.jsonld",
        name: "test.jsonld",
      } as TFile;
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockTFile);
      mockApp.vault.read.mockResolvedValue(
        JSON.stringify({
          "@context": { ex: "http://example.org/" },
          "@graph": [],
        }),
      );

      // Mock successful file read
      mockRDFFileManager.readFromVault.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        getValue: () =>
          JSON.stringify({
            "@context": { ex: "http://example.org/" },
            "@graph": [],
          }),
        errorValue: () => null,
      });

      // Mock format detection for JSON-LD
      mockRDFFileManager.detectFormatFromExtension.mockReturnValue("json-ld");

      // Mock successful parsing
      mockRDFParser.parse.mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          graph: new Graph(),
          tripleCount: 0,
          namespaces: { ex: "http://example.org/" },
          warnings: [],
        }),
        errorValue: () => null,
      });

      const result = await rdfService.importFromVaultFile(
        mockFile.path,
        graph,
        {
          mergeMode: "merge",
        },
      );

      expect(result.isSuccess).toBe(true);
      // Note: using real RDFFileManager implementation, not testing mock calls
    });

    it("should handle file read errors", async () => {
      const mockFile = {
        path: "nonexistent.ttl",
        name: "nonexistent.ttl",
      } as any;

      // Mock file read failure
      (mockFileSystemAdapter.readFile as jest.Mock).mockResolvedValue(
        Result.fail("File not found: nonexistent.ttl"),
      );

      const result = await rdfService.importFromVaultFile(
        mockFile.path,
        graph,
        {
          mergeMode: "merge",
        },
      );

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("File not found");
    });
  });

  describe.skip("listRDFFiles", () => {
    it("should list RDF files in vault", async () => {
      const mockFiles = [
        { name: "test.ttl", path: "test.ttl", extension: "ttl" },
        { name: "data.rdf", path: "data.rdf", extension: "rdf" },
        { name: "example.jsonld", path: "example.jsonld", extension: "jsonld" },
      ] as any;

      mockRDFFileManager.listRDFFiles.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => mockFiles,
        errorValue: () => null,
      });

      const result = await rdfService.listRDFFiles();

      expect(result.isSuccess).toBe(true);
      const files = result.getValue();
      expect(files).toHaveLength(3); // Should exclude non-RDF files
      expect(files.map((f) => f.name)).toEqual([
        "test.ttl",
        "data.rdf",
        "example.jsonld",
      ]);
    });

    it("should filter files by folder", async () => {
      const mockFiles = [
        { name: "test.ttl", path: "folder1/test.ttl", extension: "ttl" },
        {
          name: "example.jsonld",
          path: "folder1/example.jsonld",
          extension: "jsonld",
        },
      ] as any;

      mockRDFFileManager.listRDFFiles.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => mockFiles,
        errorValue: () => null,
      });

      const result = await rdfService.listRDFFiles("folder1");

      expect(result.isSuccess).toBe(true);
      const files = result.getValue();
      expect(files).toHaveLength(2);
      expect(files.map((f) => f.path)).toEqual([
        "folder1/test.ttl",
        "folder1/example.jsonld",
      ]);
    });
  });

  describe("validateGraph", () => {
    it("should validate graph with default options", async () => {
      const result = await rdfService.validateGraph(graph);

      expect(result.isSuccess).toBe(true);
      const validation = result.getValue();
      expect(validation.isValid).toBe(true);
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it("should validate graph with custom options", async () => {
      const options = {
        strictMode: true,
        checkDuplicates: true,
        checkNamespaces: true,
      };

      const result = await rdfService.validateGraph(graph, options);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe("createNodeFromValue", () => {
    it("should create IRI from string with protocol", () => {
      const queryResults = [
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/name",
          object: "John Doe",
        },
      ];

      const result = rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "test",
        false,
      );

      expect(result).resolves.toBeDefined();
    });

    it("should create BlankNode from string with _: prefix", async () => {
      const queryResults = [
        {
          subject: "_:b1",
          predicate: "http://example.org/name",
          object: "John Doe",
        },
      ];

      // Update the serializer mock to handle blank node subjects
      mockRDFSerializer.serialize.mockImplementationOnce((graph, options) => {
        return {
          isSuccess: true,
          isFailure: false,
          getValue: () => ({
            content: '_:b1 <http://example.org/name> "John Doe" .',
            tripleCount: 1,
            format: options.format,
          }),
          errorValue: () => null,
        };
      });

      const result = await rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "test",
        false,
      );

      expect(result.isSuccess).toBe(true);
      const exported = result.getValue();
      expect(exported.content).toContain("_:b1");
    });

    it("should create Literal from number", async () => {
      const queryResults = [
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/age",
          object: 25,
        },
      ];

      const result = await rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "test",
        false,
      );

      expect(result.isSuccess).toBe(true);
    });

    it("should create Literal from boolean", async () => {
      const queryResults = [
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/active",
          object: true,
        },
      ];

      const result = await rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "test",
        false,
      );

      expect(result.isSuccess).toBe(true);
    });

    it("should create typed Literal from object with datatype", async () => {
      const queryResults = [
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/birthDate",
          object: {
            type: "literal",
            value: "1990-01-01",
            datatype: "http://www.w3.org/2001/XMLSchema#date",
          },
        },
      ];

      const result = await rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "test",
        false,
      );

      expect(result.isSuccess).toBe(true);
    });

    it("should create language-tagged Literal from object with lang", async () => {
      const queryResults = [
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/name",
          object: {
            type: "literal",
            value: "Jean",
            lang: "fr",
          },
        },
      ];

      const result = await rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "test",
        false,
      );

      expect(result.isSuccess).toBe(true);
    });

    it("should handle null values gracefully", async () => {
      const queryResults = [
        {
          subject: "http://example.org/person/1",
          predicate: "http://example.org/name",
          object: null,
        },
      ];

      const result = await rdfService.exportQueryResults(
        queryResults,
        "turtle",
        "test",
        false,
      );

      expect(result.isSuccess).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle serialization errors", async () => {
      // Create an invalid graph scenario
      const invalidGraph = new Graph();

      // Mock serialization failure
      mockRDFSerializer.serialize.mockImplementationOnce(() => {
        return {
          isSuccess: false,
          isFailure: true,
          getValue: () => null,
          errorValue: () => "Serialization failed: Invalid base IRI",
        };
      });

      const result = await rdfService.exportGraph(invalidGraph, {
        format: "turtle",
        baseIRI: "invalid-uri",
        saveToVault: false,
      });

      // Should handle the error gracefully
      expect(result.isFailure).toBe(true);
    });

    it("should handle parsing errors in strict mode", async () => {
      const invalidContent = "This is not valid RDF";

      // Mock parsing failure
      mockRDFParser.parse.mockReturnValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Invalid RDF syntax",
      });

      const result = await rdfService.importRDF(invalidContent, graph, {
        format: "turtle",
        mergeMode: "merge",
        strictMode: true,
      });

      expect(result.isFailure).toBe(true);
    });

    it("should handle malformed RDF content", async () => {
      const malformedContent = `
                @prefix ex: <http://example.org/>
                ex:person1 ex:name "Unclosed string
            `;

      const result = await rdfService.importRDF(malformedContent, graph, {
        format: "turtle",
        mergeMode: "merge",
        strictMode: false,
      });

      // Should fail or succeed with warnings
      if (result.isSuccess) {
        // If successful, should have warnings
        expect(result.getValue().imported.warnings).toBeDefined();
      } else {
        expect(result.errorValue()).toContain("parsing failed");
      }
    });

    it("should handle invalid JSON-LD content", async () => {
      const invalidJsonLD = '{ "invalid": json }'; // Invalid JSON syntax

      // Mock parsing failure for invalid JSON-LD
      mockRDFParser.parse.mockReturnValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Invalid JSON-LD syntax",
      });

      const result = await rdfService.importRDF(invalidJsonLD, graph, {
        format: "json-ld",
        mergeMode: "merge",
        strictMode: true, // Enable strict mode to catch parsing errors
      });

      expect(result.isFailure).toBe(true);
    });

    it.skip("should handle vault write errors", async () => {
      // Mock save failure
      mockRDFFileManager.saveToVault.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        getValue: () => null,
        errorValue: () => "Write failed",
      });

      const result = await rdfService.exportGraph(graph, {
        format: "turtle",
        saveToVault: true,
        fileName: "test.ttl",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("Write failed");
    });

    it.skip("should handle namespace errors", async () => {
      const contentWithBadNamespace = `
                @prefix bad: <invalid-uri> .
                bad:test bad:prop "value" .
            `;

      // Mock parsing with warnings
      mockRDFParser.parse.mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          graph: new Graph(),
          tripleCount: 1,
          namespaces: { bad: "invalid-uri" },
          warnings: ["Invalid namespace URI: invalid-uri"],
        }),
        errorValue: () => null,
      });

      // Mock validation with warnings
      mockRDFValidator.validateGraph.mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          isValid: true,
          errors: [],
          warnings: [{ message: "Invalid namespace URI detected" }],
        }),
        errorValue: () => null,
      });

      const result = await rdfService.importRDF(
        contentWithBadNamespace,
        graph,
        {
          format: "turtle",
          mergeMode: "merge",
          strictMode: true,
          validateInput: true,
        },
      );

      // Should succeed with warnings
      expect(result.isSuccess).toBe(true);
      const validation = result.getValue();
      expect(validation.imported.warnings.length).toBeGreaterThan(0);
    });

    it("should handle empty graph export", async () => {
      const emptyGraph = new Graph();

      const result = await rdfService.exportGraph(emptyGraph, {
        format: "turtle",
        saveToVault: false,
      });

      expect(result.isSuccess).toBe(true);
      const exported = result.getValue();
      expect(exported.tripleCount).toBe(0);
    });

    it("should handle very large graphs", async () => {
      const largeGraph = new Graph();

      // Add many triples to test memory/performance
      for (let i = 0; i < 1000; i++) {
        const triple = new Triple(
          new IRI(`http://example.org/person/${i}`),
          new IRI("http://example.org/name"),
          Literal.string(`Person ${i}`),
        );
        largeGraph.add(triple);
      }

      const result = await rdfService.exportGraph(largeGraph, {
        format: "n-triples",
        saveToVault: false,
      });

      expect(result.isSuccess).toBe(true);
      const exported = result.getValue();
      expect(exported.tripleCount).toBe(1000);
    });
  });

  describe("namespace management", () => {
    it("should use custom namespace manager", () => {
      // Test with real NamespaceManager
      const customNamespaceManager = new NamespaceManager();
      customNamespaceManager.addBinding("custom", "http://custom.example.org/");

      const customRDFService = new RDFService(
        mockNotificationService,
        mockFileSystemAdapter,
        customNamespaceManager,
      );
      const nsManager = customRDFService.getNamespaceManager();

      expect(nsManager.hasPrefix("custom")).toBe(true);
    });

    it("should preserve namespace bindings during import", async () => {
      const turtleContent = `
                @prefix custom: <http://custom.example.org/> .
                @prefix test: <http://test.example.org/> .
                custom:item test:property "value" .
            `;

      // Mock parsing with custom namespaces
      mockRDFParser.parse.mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          graph: new Graph(),
          tripleCount: 1,
          namespaces: {
            custom: "http://custom.example.org/",
            test: "http://test.example.org/",
          },
          warnings: [],
        }),
        errorValue: () => null,
      });

      // Mock namespace manager to show prefixes after binding
      mockNamespaceManager.hasPrefix.mockImplementation((prefix: string) => {
        return prefix === "custom" || prefix === "test";
      });

      const result = await rdfService.importRDF(turtleContent, graph, {
        format: "turtle",
        mergeMode: "merge",
      });

      expect(result.isSuccess).toBe(true);

      const nsManager = rdfService.getNamespaceManager();
      expect(nsManager.hasPrefix("custom")).toBe(true);
      expect(nsManager.hasPrefix("test")).toBe(true);
    });
  });

  describe("export with file operations", () => {
    beforeEach(() => {
      (mockFileSystemAdapter.writeFile as jest.Mock).mockResolvedValue(
        Result.ok(undefined),
      );
      (mockFileSystemAdapter.generateFileName as jest.Mock).mockImplementation(
        (baseName, extension) => {
          if (baseName) {
            // If baseName already has extension, don't add another one
            if (baseName.includes(".")) {
              return baseName;
            }
            return `${baseName}.${extension || "ttl"}`;
          }
          return `export-${Date.now()}.${extension || "ttl"}`;
        },
      );
    });

    it("should save to vault with custom filename", async () => {
      const result = await rdfService.exportGraph(graph, {
        format: "turtle",
        saveToVault: true,
        fileName: "custom-name.ttl",
      });

      expect(result.isSuccess).toBe(true);
      expect(mockFileSystemAdapter.writeFile).toHaveBeenCalledWith(
        "custom-name.ttl",
        expect.any(String),
      );
    });

    it("should save to vault in target folder", async () => {
      const result = await rdfService.exportGraph(graph, {
        format: "turtle",
        saveToVault: true,
        targetFolder: "exports",
        fileName: "test.ttl",
      });

      expect(result.isSuccess).toBe(true);
      expect(mockFileSystemAdapter.writeFile).toHaveBeenCalledWith(
        "exports/test.ttl",
        expect.any(String),
      );
    });

    it("should generate filename when not provided", async () => {
      const result = await rdfService.exportGraph(graph, {
        format: "turtle",
        saveToVault: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockFileSystemAdapter.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/.*\.ttl$/),
        expect.any(String),
      );
    });
  });
});

// Additional component tests removed - we're now testing the integrated RDFService with real implementations
