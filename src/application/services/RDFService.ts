/**
 * RDF Service - Coordinates RDF operations using specialized services
 * Follows Single Responsibility Principle by delegating to specific services
 */

import { Graph } from "../../domain/semantic/core/Graph";
import {
  Triple,
  IRI,
  BlankNode,
  Literal,
} from "../../domain/semantic/core/Triple";
import { Result } from "../../domain/core/Result";
import {
  RDFSerializer,
  RDFFormat,
  SerializationOptions,
  SerializationResult,
} from "./RDFSerializer";
import { RDFParser, ParseOptions, ParseResult } from "./RDFParser";
import { NamespaceManager } from "./NamespaceManager";
import { RDFValidator, ValidationOptions } from "./RDFValidator";
import { INotificationService } from "../ports/INotificationService";
import { IFileSystemAdapter } from "../ports/IFileSystemAdapter";
import {
  MemoryOptimizedImporter,
  StreamingImportOptions,
} from "../../infrastructure/performance/MemoryOptimizedImporter";
import { IndexedGraph } from "../../domain/semantic/core/IndexedGraph";

export interface RDFExportOptions {
  format: RDFFormat;
  includeComments?: boolean;
  prettyPrint?: boolean;
  baseIRI?: string;
  fileName?: string;
  saveToVault?: boolean;
  targetFolder?: string;
}

export interface RDFImportOptions extends StreamingImportOptions {
  format?: RDFFormat;
  mergeMode: "merge" | "replace";
  validateInput?: boolean;
  strictMode?: boolean;
  baseIRI?: string;
  useOptimizedImporter?: boolean;
}

export type { ValidationError } from "./RDFValidator";

export class RDFService {
  private serializer: RDFSerializer;
  private parser: RDFParser;
  private validator: RDFValidator;
  private optimizedImporter: MemoryOptimizedImporter;
  private namespaceManager: NamespaceManager;

  constructor(
    private notificationService: INotificationService,
    private fileSystemAdapter: IFileSystemAdapter,
    namespaceManager?: NamespaceManager,
  ) {
    this.namespaceManager = namespaceManager || new NamespaceManager();
    this.serializer = new RDFSerializer(this.namespaceManager);
    this.parser = new RDFParser(this.namespaceManager);
    this.validator = new RDFValidator();
    this.optimizedImporter = new MemoryOptimizedImporter();
  }

  /**
   * Export graph to RDF format
   */
  async exportGraph(
    graph: Graph,
    options: RDFExportOptions,
  ): Promise<Result<SerializationResult>> {
    try {
      const validationResult = this.validator.validateExportOptions(options);
      if (validationResult.isFailure) {
        return Result.fail<SerializationResult>(validationResult.errorValue());
      }

      const serializationOptions: SerializationOptions = {
        format: options.format,
        includeComments: options.includeComments ?? true,
        prettyPrint: options.prettyPrint ?? true,
        baseIRI: options.baseIRI,
        namespaceManager: this.namespaceManager,
      };

      const result = this.serializer.serialize(graph, serializationOptions);
      if (result.isFailure) {
        return result;
      }

      const serializedData = result.getValue();

      if (options.saveToVault) {
        const fileName = this.fileSystemAdapter.generateFileName(
          options.fileName,
          this.getFormatInfo(options.format).extension.slice(1),
        );
        const filePath = options.targetFolder
          ? `${options.targetFolder}/${fileName}`
          : fileName;

        const saveResult = await this.fileSystemAdapter.writeFile(
          filePath,
          serializedData.content,
        );
        if (saveResult.isFailure) {
          return Result.fail(saveResult.errorValue());
        }

        this.notificationService.showSuccess(
          `Exported ${serializedData.tripleCount} triples to ${filePath}`,
        );
      }

      return result;
    } catch (error) {
      return Result.fail(`Export failed: ${error.message}`);
    }
  }

  /**
   * Import RDF data and merge with existing graph
   */
  async importRDF(
    content: string,
    graph: Graph,
    options: RDFImportOptions,
  ): Promise<Result<{ graph: Graph; imported: ParseResult }>> {
    try {
      const validationResult = this.validator.validateImportOptions(options);
      if (validationResult.isFailure) {
        return Result.fail<{ graph: Graph; imported: ParseResult }>(
          validationResult.errorValue(),
        );
      }

      const parseOptions: ParseOptions = {
        format: options.format,
        baseIRI: options.baseIRI,
        namespaceManager: this.namespaceManager,
        validateInput: options.validateInput ?? true,
        strictMode: options.strictMode ?? false,
      };

      const parseResult = this.parser.parse(content, parseOptions);
      if (parseResult.isFailure) {
        return Result.fail(
          `Import parsing failed: ${parseResult.errorValue()}`,
        );
      }

      const imported = parseResult.getValue();

      if (options.validateInput) {
        const validationOptions: ValidationOptions = {
          strictMode: options.strictMode,
          checkDuplicates: true,
          checkNamespaces: true,
          checkLiterals: true,
        };

        const graphValidation = this.validator.validateGraph(
          imported.graph,
          validationOptions,
        );
        if (graphValidation.isFailure) {
          return Result.fail(graphValidation.errorValue());
        }

        const validation = graphValidation.getValue();
        if (!validation.isValid && options.strictMode) {
          const errorMessages = validation.errors
            .map((e) => e.message)
            .join("; ");
          return Result.fail(`Import validation failed: ${errorMessages}`);
        }

        if (validation.warnings.length > 0) {
          this.notificationService.showWarning(
            `Import completed with ${validation.warnings.length} warnings`,
          );
        }
      }

      let finalGraph: Graph;

      // Use optimized importer for large files
      const useOptimized =
        options.useOptimizedImporter !== false &&
        (content.length > 50000 || options.chunkSize);

      if (useOptimized && graph instanceof IndexedGraph) {
        // Use optimized batch processing
        if (options.mergeMode === "replace") {
          graph.clear();
        }

        graph.beginBatch();
        for (const triple of imported.graph.toArray()) {
          graph.add(triple);
        }
        graph.commitBatch();

        finalGraph = graph;
      } else {
        // Standard merge
        if (options.mergeMode === "replace") {
          finalGraph = imported.graph;
        } else {
          finalGraph = graph.clone();
          if (finalGraph instanceof IndexedGraph) {
            finalGraph.beginBatch();
            finalGraph.merge(imported.graph);
            finalGraph.commitBatch();
          } else {
            finalGraph.merge(imported.graph);
          }
        }
      }

      for (const [prefix, namespace] of Object.entries(imported.namespaces)) {
        if (!this.namespaceManager.hasPrefix(prefix)) {
          this.namespaceManager.addBinding(prefix, namespace);
        }
      }

      return Result.ok({ graph: finalGraph, imported });
    } catch (error) {
      return Result.fail(`Import failed: ${error.message}`);
    }
  }

  /**
   * Import RDF from vault file
   */
  async importFromVaultFile(
    filePath: string,
    graph: Graph,
    options: RDFImportOptions,
  ): Promise<Result<{ graph: Graph; imported: ParseResult }>> {
    try {
      const contentResult = await this.fileSystemAdapter.readFile(filePath);
      if (contentResult.isFailure) {
        return Result.fail(contentResult.errorValue());
      }

      if (!options.format) {
        const fileName = filePath.split("/").pop() || filePath;
        options.format = this.fileSystemAdapter.detectFormatFromExtension(
          fileName,
        ) as RDFFormat;
      }

      return await this.importRDF(contentResult.getValue(), graph, options);
    } catch (error) {
      return Result.fail(`Failed to import from vault file: ${error.message}`);
    }
  }

  /**
   * Export SPARQL query results
   */
  async exportQueryResults(
    results: any[],
    format: RDFFormat,
    fileName?: string,
    saveToVault: boolean = true,
  ): Promise<Result<SerializationResult>> {
    try {
      const graph = this.convertQueryResultsToGraph(results);

      const options: RDFExportOptions = {
        format,
        fileName: fileName || "sparql-results",
        saveToVault,
        includeComments: true,
        prettyPrint: true,
        targetFolder: "exports",
      };

      return await this.exportGraph(graph, options);
    } catch (error) {
      return Result.fail(`Query results export failed: ${error.message}`);
    }
  }

  /**
   * Validate a graph
   */
  async validateGraph(
    graph: Graph,
    options?: ValidationOptions,
  ): Promise<Result<any>> {
    return this.validator.validateGraph(graph, options);
  }

  /**
   * List RDF files in vault
   */
  async listRDFFiles(folder?: string): Promise<Result<any[]>> {
    return this.fileSystemAdapter.listFiles(folder, "ttl");
  }

  /**
   * Convert SPARQL query results to graph
   */
  private convertQueryResultsToGraph(results: any[]): Graph {
    const graph = new Graph();

    for (const result of results) {
      if (result.subject && result.predicate && result.object) {
        try {
          const subject = this.createNodeFromValue(result.subject);
          const predicate = this.createNodeFromValue(result.predicate) as IRI;
          const object = this.createNodeFromValue(result.object);

          if (subject && predicate && object) {
            const triple = new Triple(
              subject as IRI | BlankNode,
              predicate,
              object,
            );
            graph.add(triple);
          }
        } catch (error) {
          console.warn("Failed to convert query result to triple:", error);
        }
      }
    }

    return graph;
  }

  /**
   * Create RDF node from query result value
   */
  private createNodeFromValue(value: any): IRI | BlankNode | Literal | null {
    if (typeof value === "string") {
      if (value.startsWith("_:")) {
        return new BlankNode(value);
      } else if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.includes(":")
      ) {
        try {
          return new IRI(value);
        } catch {
          return Literal.string(value);
        }
      } else {
        return Literal.string(value);
      }
    } else if (typeof value === "number") {
      return Number.isInteger(value)
        ? Literal.integer(value)
        : Literal.double(value);
    } else if (typeof value === "boolean") {
      return Literal.boolean(value);
    } else if (value && typeof value === "object") {
      if (value.type === "uri" || value.type === "iri") {
        return new IRI(value.value);
      } else if (value.type === "bnode") {
        return new BlankNode(value.value);
      } else if (value.type === "literal") {
        if (value.datatype) {
          return new Literal(value.value, new IRI(value.datatype));
        } else if (value.lang) {
          return new Literal(value.value, undefined, value.lang);
        } else {
          return new Literal(value.value);
        }
      }
    }

    return null;
  }

  /**
   * Get namespace manager instance
   */
  getNamespaceManager(): NamespaceManager {
    return this.namespaceManager;
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): RDFFormat[] {
    return ["turtle", "n-triples", "json-ld", "rdf-xml"];
  }

  /**
   * Get format information
   */
  getFormatInfo(format: RDFFormat): {
    extension: string;
    mimeType: string;
    name: string;
  } {
    const formatMap = {
      turtle: { extension: ".ttl", mimeType: "text/turtle", name: "Turtle" },
      "n-triples": {
        extension: ".nt",
        mimeType: "application/n-triples",
        name: "N-Triples",
      },
      "json-ld": {
        extension: ".jsonld",
        mimeType: "application/ld+json",
        name: "JSON-LD",
      },
      "rdf-xml": {
        extension: ".rdf",
        mimeType: "application/rdf+xml",
        name: "RDF/XML",
      },
    };

    return formatMap[format];
  }
}
