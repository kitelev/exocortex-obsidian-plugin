/**
 * RDF Serializer for converting Graph instances to various RDF formats
 * Supports Turtle (.ttl), N-Triples (.nt), JSON-LD (.jsonld), and RDF/XML (.rdf)
 */

import { Graph } from "../../domain/semantic/core/Graph";
import {
  Triple,
  IRI,
  BlankNode,
  Literal,
} from "../../domain/semantic/core/Triple";
import { Result } from "../../domain/core/Result";
import { NamespaceManager } from "./NamespaceManager";

export type RDFFormat = "turtle" | "n-triples" | "json-ld" | "rdf-xml";

export interface SerializationOptions {
  format: RDFFormat;
  includeComments?: boolean;
  prettyPrint?: boolean;
  baseIRI?: string;
  namespaceManager?: NamespaceManager;
}

export interface SerializationResult {
  content: string;
  format: RDFFormat;
  tripleCount: number;
  metadata?: {
    namespaces: Record<string, string>;
    warnings?: string[];
  };
}

export class RDFSerializer {
  private namespaceManager: NamespaceManager;

  constructor(namespaceManager?: NamespaceManager) {
    this.namespaceManager = namespaceManager || new NamespaceManager();
  }

  /**
   * Serialize a graph to the specified RDF format
   */
  serialize(
    graph: Graph,
    options: SerializationOptions,
  ): Result<SerializationResult> {
    try {
      // Validate baseIRI if provided
      if (options.baseIRI) {
        try {
          new URL(options.baseIRI);
        } catch {
          return Result.fail(`Invalid base IRI: ${options.baseIRI}`);
        }
      }

      const nm = options.namespaceManager || this.namespaceManager;

      let content: string;
      const warnings: string[] = [];

      switch (options.format) {
        case "turtle":
          content = this.serializeToTurtle(graph, nm, options);
          break;

        case "n-triples":
          content = this.serializeToNTriples(graph, warnings);
          break;

        case "json-ld":
          content = this.serializeToJSONLD(graph, nm, options);
          break;

        case "rdf-xml":
          content = this.serializeToRDFXML(graph, nm, options);
          break;

        default:
          return Result.fail(`Unsupported format: ${options.format}`);
      }

      const result: SerializationResult = {
        content,
        format: options.format,
        tripleCount: graph.size(),
        metadata: {
          namespaces: this.extractNamespaces(nm),
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };

      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Serialization failed: ${error.message}`);
    }
  }

  /**
   * Serialize graph to Turtle format
   */
  private serializeToTurtle(
    graph: Graph,
    nm: NamespaceManager,
    options: SerializationOptions,
  ): string {
    const lines: string[] = [];
    const { includeComments = true, prettyPrint = true } = options;

    // Add header comment
    if (includeComments) {
      lines.push("# RDF Graph exported from Exocortex");
      lines.push(`# Generated on ${new Date().toISOString()}`);
      lines.push(`# Triple count: ${graph.size()}`);
      lines.push("");
    }

    // Add namespace prefixes
    const prefixDeclarations = nm.generatePrefixDeclarations("turtle");
    if (prefixDeclarations) {
      lines.push(prefixDeclarations);
      lines.push("");
    }

    // Group triples by subject for prettier output
    const subjectGroups = this.groupTriplesBySubject(graph);

    for (const [subject, triples] of subjectGroups) {
      if (triples.length === 0) continue;

      const subjectStr = this.formatNode(subject, nm);

      if (triples.length === 1) {
        // Single triple on one line
        const triple = triples[0];
        const predicateStr = this.formatNode(triple.getPredicate(), nm);
        const objectStr = this.formatNode(triple.getObject(), nm);
        lines.push(`${subjectStr} ${predicateStr} ${objectStr} .`);
      } else {
        // Multiple triples with same subject - pretty print
        lines.push(`${subjectStr}`);

        // Group by predicate
        const predicateGroups = this.groupTriplesByPredicate(triples);
        const predicateEntries = Array.from(predicateGroups.entries());

        for (let i = 0; i < predicateEntries.length; i++) {
          const [predicate, objects] = predicateEntries[i];
          const predicateStr = this.formatNode(predicate, nm);
          const isLast = i === predicateEntries.length - 1;

          if (objects.length === 1) {
            const objectStr = this.formatNode(objects[0], nm);
            lines.push(
              `    ${predicateStr} ${objectStr}${isLast ? " ." : " ;"}`,
            );
          } else {
            lines.push(`    ${predicateStr}`);
            for (let j = 0; j < objects.length; j++) {
              const objectStr = this.formatNode(objects[j], nm);
              const isLastObject = j === objects.length - 1;
              const suffix = isLastObject ? (isLast ? " ." : " ;") : " ,";
              lines.push(`        ${objectStr}${suffix}`);
            }
          }
        }
      }

      if (prettyPrint) {
        lines.push(""); // Empty line between subject groups
      }
    }

    return lines.join("\n");
  }

  /**
   * Serialize graph to N-Triples format
   */
  private serializeToNTriples(graph: Graph, warnings: string[]): string {
    const lines: string[] = [];

    for (const triple of graph.toArray()) {
      try {
        const subjectStr = this.formatNodeNTriples(triple.getSubject());
        const predicateStr = this.formatNodeNTriples(triple.getPredicate());
        const objectStr = this.formatNodeNTriples(triple.getObject());

        lines.push(`${subjectStr} ${predicateStr} ${objectStr} .`);
      } catch (error) {
        warnings.push(`Failed to serialize triple: ${error.message}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Serialize graph to JSON-LD format
   */
  private serializeToJSONLD(
    graph: Graph,
    nm: NamespaceManager,
    options: SerializationOptions,
  ): string {
    const context: Record<string, string> = {};

    // Build context from namespace manager
    for (const binding of nm.getAllBindings()) {
      context[binding.prefix] = binding.namespace.toString();
    }

    // Add base IRI if specified
    if (options.baseIRI) {
      context["@base"] = options.baseIRI;
    }

    // Group triples by subject
    const subjects: Record<string, any> = {};

    for (const triple of graph.toArray()) {
      const subjectId = this.formatNodeJSONLD(triple.getSubject(), nm);
      const predicate = this.formatNodeJSONLD(triple.getPredicate(), nm);
      const object = this.formatObjectJSONLD(triple.getObject(), nm);

      if (!subjects[subjectId]) {
        subjects[subjectId] = { "@id": subjectId };
      }

      // Handle multiple values for same predicate
      if (subjects[subjectId][predicate]) {
        if (!Array.isArray(subjects[subjectId][predicate])) {
          subjects[subjectId][predicate] = [subjects[subjectId][predicate]];
        }
        subjects[subjectId][predicate].push(object);
      } else {
        subjects[subjectId][predicate] = object;
      }
    }

    const jsonLD = {
      "@context": context,
      "@graph": Object.values(subjects),
    };

    return JSON.stringify(jsonLD, null, options.prettyPrint ? 2 : 0);
  }

  /**
   * Serialize graph to RDF/XML format
   */
  private serializeToRDFXML(
    graph: Graph,
    nm: NamespaceManager,
    options: SerializationOptions,
  ): string {
    const lines: string[] = [];

    // XML header
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');

    // RDF root element with namespace declarations
    let rdfElement = "<rdf:RDF";
    rdfElement += ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"';

    for (const binding of nm.getAllBindings()) {
      if (binding.prefix !== "rdf") {
        rdfElement += ` xmlns:${binding.prefix}="${binding.namespace.toString()}"`;
      }
    }

    if (options.baseIRI) {
      rdfElement += ` xml:base="${options.baseIRI}"`;
    }

    rdfElement += ">";
    lines.push(rdfElement);

    // Group triples by subject
    const subjectGroups = this.groupTriplesBySubject(graph);

    for (const [subject, triples] of subjectGroups) {
      if (triples.length === 0) continue;

      // Determine RDF Description or typed resource
      const rdfTypeTriples = triples.filter(
        (t) =>
          t.getPredicate().toString() ===
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      );

      if (rdfTypeTriples.length > 0) {
        // Use typed element
        const type = rdfTypeTriples[0].getObject();
        const typeStr = this.formatNodeRDFXML(type, nm);
        lines.push(
          `  <${typeStr} rdf:about="${this.escapeXML(subject.toString())}">`,
        );
      } else {
        // Use rdf:Description
        lines.push(
          `  <rdf:Description rdf:about="${this.escapeXML(subject.toString())}">`,
        );
      }

      // Add properties
      for (const triple of triples) {
        const predicate = triple.getPredicate();
        const object = triple.getObject();

        // Skip rdf:type as it's handled above
        if (
          predicate.toString() ===
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        ) {
          continue;
        }

        const predicateStr = this.formatNodeRDFXML(predicate, nm);

        if (object instanceof Literal) {
          let literalElement = `    <${predicateStr}`;

          if (object.getDatatype()) {
            literalElement += ` rdf:datatype="${this.escapeXML(object.getDatatype()!.toString())}"`;
          }

          if (object.getLanguage()) {
            literalElement += ` xml:lang="${object.getLanguage()}"`;
          }

          literalElement += `>${this.escapeXML(object.getValue())}</${predicateStr}>`;
          lines.push(literalElement);
        } else {
          // IRI or BlankNode
          const objectAttr =
            object instanceof BlankNode
              ? `rdf:nodeID="${object.toString().substring(2)}"`
              : `rdf:resource="${this.escapeXML(object.toString())}"`;

          lines.push(`    <${predicateStr} ${objectAttr}/>`);
        }
      }

      // Close element
      if (rdfTypeTriples.length > 0) {
        const type = rdfTypeTriples[0].getObject();
        const typeStr = this.formatNodeRDFXML(type, nm);
        lines.push(`  </${typeStr}>`);
      } else {
        lines.push("  </rdf:Description>");
      }
    }

    lines.push("</rdf:RDF>");

    return lines.join("\n");
  }

  /**
   * Group triples by subject
   */
  private groupTriplesBySubject(graph: Graph): Map<IRI | BlankNode, Triple[]> {
    const groups = new Map<IRI | BlankNode, Triple[]>();

    for (const triple of graph.toArray()) {
      const subject = triple.getSubject();
      const subjectKey = subject.toString();

      if (!groups.has(subject)) {
        groups.set(subject, []);
      }

      groups.get(subject)!.push(triple);
    }

    return groups;
  }

  /**
   * Group triples by predicate
   */
  private groupTriplesByPredicate(
    triples: Triple[],
  ): Map<IRI, (IRI | BlankNode | Literal)[]> {
    const groups = new Map<IRI, (IRI | BlankNode | Literal)[]>();

    for (const triple of triples) {
      const predicate = triple.getPredicate();

      if (!groups.has(predicate)) {
        groups.set(predicate, []);
      }

      groups.get(predicate)!.push(triple.getObject());
    }

    return groups;
  }

  /**
   * Format a node for Turtle/N3 output
   */
  private formatNode(
    node: IRI | BlankNode | Literal,
    nm: NamespaceManager,
  ): string {
    if (node instanceof IRI) {
      return nm.compressIRI(node);
    } else if (node instanceof BlankNode) {
      return node.toString();
    } else if (node instanceof Literal) {
      return node.toString();
    }

    throw new Error(`Unknown node type: ${typeof node}`);
  }

  /**
   * Format a node for N-Triples output (no prefixes)
   */
  private formatNodeNTriples(node: IRI | BlankNode | Literal): string {
    if (node instanceof IRI) {
      return `<${node.toString()}>`;
    } else if (node instanceof BlankNode) {
      return node.toString();
    } else if (node instanceof Literal) {
      return node.toString();
    }

    throw new Error(`Unknown node type: ${typeof node}`);
  }

  /**
   * Format a node for JSON-LD output
   */
  private formatNodeJSONLD(
    node: IRI | BlankNode,
    nm: NamespaceManager,
  ): string {
    if (node instanceof IRI) {
      const compressed = nm.compressIRI(node);
      return compressed.startsWith("<") && compressed.endsWith(">")
        ? compressed.slice(1, -1) // Remove angle brackets
        : compressed;
    } else if (node instanceof BlankNode) {
      return node.toString();
    }

    throw new Error(`Invalid node type for JSON-LD ID: ${typeof node}`);
  }

  /**
   * Format an object for JSON-LD output
   */
  private formatObjectJSONLD(
    object: IRI | BlankNode | Literal,
    nm: NamespaceManager,
  ): any {
    if (object instanceof IRI) {
      return { "@id": this.formatNodeJSONLD(object, nm) };
    } else if (object instanceof BlankNode) {
      return { "@id": object.toString() };
    } else if (object instanceof Literal) {
      const result: any = { "@value": object.getValue() };

      if (object.getDatatype()) {
        result["@type"] = this.formatNodeJSONLD(object.getDatatype()!, nm);
      }

      if (object.getLanguage()) {
        result["@language"] = object.getLanguage();
      }

      return result;
    }

    throw new Error(`Unknown object type: ${typeof object}`);
  }

  /**
   * Format a node for RDF/XML output
   */
  private formatNodeRDFXML(
    node: IRI | BlankNode | Literal,
    nm: NamespaceManager,
  ): string {
    if (node instanceof IRI) {
      const compressed = nm.compressIRI(node);
      return compressed.startsWith("<") && compressed.endsWith(">")
        ? node.toString() // Use full IRI if compression failed
        : compressed;
    } else if (node instanceof BlankNode) {
      return node.toString();
    } else if (node instanceof Literal) {
      return node.toString();
    }

    throw new Error(`Unknown node type: ${typeof node}`);
  }

  /**
   * Escape special XML characters
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Extract namespaces from namespace manager
   */
  private extractNamespaces(nm: NamespaceManager): Record<string, string> {
    const namespaces: Record<string, string> = {};

    for (const binding of nm.getAllBindings()) {
      namespaces[binding.prefix] = binding.namespace.toString();
    }

    return namespaces;
  }

  /**
   * Get file extension for format
   */
  static getFileExtension(format: RDFFormat): string {
    switch (format) {
      case "turtle":
        return ".ttl";
      case "n-triples":
        return ".nt";
      case "json-ld":
        return ".jsonld";
      case "rdf-xml":
        return ".rdf";
      default:
        return ".rdf";
    }
  }

  /**
   * Get MIME type for format
   */
  static getMimeType(format: RDFFormat): string {
    switch (format) {
      case "turtle":
        return "text/turtle";
      case "n-triples":
        return "application/n-triples";
      case "json-ld":
        return "application/ld+json";
      case "rdf-xml":
        return "application/rdf+xml";
      default:
        return "application/rdf+xml";
    }
  }
}
