/**
 * RDF Parser for parsing various RDF formats and converting to Graph instances
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
import { RDFFormat } from "./RDFSerializer";

export interface ParseOptions {
  format?: RDFFormat;
  baseIRI?: string;
  namespaceManager?: NamespaceManager;
  validateInput?: boolean;
  strictMode?: boolean;
}

export interface ParseResult {
  graph: Graph;
  tripleCount: number;
  namespaces: Record<string, string>;
  warnings?: string[];
  errors?: string[];
}

export class RDFParser {
  private namespaceManager: NamespaceManager;

  constructor(namespaceManager?: NamespaceManager) {
    this.namespaceManager = namespaceManager || new NamespaceManager();
  }

  /**
   * Parse RDF content into a Graph
   */
  parse(content: string, options: ParseOptions = {}): Result<ParseResult> {
    try {
      const nm = options.namespaceManager || this.namespaceManager.clone();
      const format = options.format || this.detectFormat(content);
      const warnings: string[] = [];
      const errors: string[] = [];

      let graph: Graph;

      switch (format) {
        case "turtle":
          graph = this.parseTurtle(content, nm, options, warnings, errors);
          break;

        case "n-triples":
          graph = this.parseNTriples(content, warnings, errors);
          break;

        case "json-ld":
          graph = this.parseJSONLD(content, nm, options, warnings, errors);
          break;

        case "rdf-xml":
          graph = this.parseRDFXML(content, nm, options, warnings, errors);
          break;

        default:
          return Result.fail(`Unsupported format: ${format}`);
      }

      // Validate graph if requested
      if (options.validateInput) {
        const validationErrors = this.validateGraph(graph);
        errors.push(...validationErrors);
      }

      // Return error if strict mode and errors found
      if (options.strictMode && errors.length > 0) {
        return Result.fail(`Parse errors in strict mode: ${errors.join("; ")}`);
      }

      const result: ParseResult = {
        graph,
        tripleCount: graph.size(),
        namespaces: this.extractNamespaces(nm),
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };

      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Parse failed: ${error.message}`);
    }
  }

  /**
   * Detect RDF format from content
   */
  private detectFormat(content: string): RDFFormat {
    const trimmed = content.trim();

    // Check for JSON-LD
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed["@context"] || parsed["@graph"] || parsed["@id"]) {
          return "json-ld";
        }
      } catch {
        // Not valid JSON
      }
    }

    // Check for RDF/XML
    if (trimmed.startsWith("<?xml") || trimmed.includes("<rdf:RDF")) {
      return "rdf-xml";
    }

    // Check for Turtle prefixes
    if (trimmed.includes("@prefix") || trimmed.includes("@base")) {
      return "turtle";
    }

    // Check for N-Triples (every line ends with ' .')
    const lines = trimmed.split("\n").filter((line) => line.trim());
    if (lines.every((line) => line.trim().endsWith(" ."))) {
      // Further check for angle brackets (IRIs) or quotes (literals)
      if (lines.some((line) => line.includes("<") && line.includes(">"))) {
        return "n-triples";
      }
    }

    // Default to Turtle
    return "turtle";
  }

  /**
   * Parse Turtle format
   */
  private parseTurtle(
    content: string,
    nm: NamespaceManager,
    options: ParseOptions,
    warnings: string[],
    errors: string[],
  ): Graph {
    const graph = new Graph();
    let currentSubject: IRI | BlankNode | null = null;
    let baseIRI = options.baseIRI;

    // First, extract and process all prefix declarations
    // Handle both single-line and multi-line content
    const prefixPattern = /@prefix\s+(\w+):\s+<([^>]+)>\s*\./g;
    let match;
    while ((match = prefixPattern.exec(content)) !== null) {
      nm.addBinding(match[1], match[2]);
    }

    // Remove prefix declarations from content
    let processedContent = content.replace(
      /@prefix\s+\w+:\s+<[^>]+>\s*\./g,
      "",
    );

    // Also handle @base declarations
    const basePattern = /@base\s+<([^>]+)>\s*\./g;
    const baseMatch = basePattern.exec(processedContent);
    if (baseMatch) {
      baseIRI = baseMatch[1];
      processedContent = processedContent.replace(/@base\s+<[^>]+>\s*\./g, "");
    }

    // Split the remaining content into statements
    // Statements end with . (but not inside quotes)
    const statements = processedContent
      .split(/\.\s*(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .filter((s) => s.trim());

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();

      if (!statement || statement.startsWith("#")) continue;

      try {
        // Parse the statement
        const triples = this.parseTurtleStatement(
          statement,
          nm,
          currentSubject,
          baseIRI,
        );

        for (const triple of triples) {
          if (triple.subject) {
            currentSubject = triple.subject;
          }

          if (triple.triple) {
            graph.add(triple.triple);
          }
        }
      } catch (error) {
        const errorMsg = `Statement ${i + 1}: ${error.message}`;
        if (options.strictMode) {
          errors.push(errorMsg);
        } else {
          warnings.push(errorMsg);
        }
      }
    }

    return graph;
  }

  /**
   * Parse a single Turtle statement
   */
  private parseTurtleStatement(
    statement: string,
    nm: NamespaceManager,
    currentSubject: IRI | BlankNode | null,
    baseIRI?: string,
  ): Array<{ subject?: IRI | BlankNode; triple?: Triple }> {
    const results: Array<{ subject?: IRI | BlankNode; triple?: Triple }> = [];

    // Clean up the statement
    statement = statement.trim();
    if (!statement) return results;

    // Remove trailing .
    statement = statement.replace(/\.\s*$/, "");

    // Simple approach: if statement contains semicolon, it's a multi-predicate statement
    if (statement.includes(";")) {
      // Split by ; to handle multiple predicates for same subject
      const parts = statement
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s);

      let subject: IRI | BlankNode | null = null;

      for (let i = 0; i < parts.length; i++) {
        const tokens = this.tokenizeTurtleLine(parts[i]);

        if (i === 0 && tokens.length >= 3) {
          // First part has subject predicate object
          subject = this.parseNode(tokens[0], nm, baseIRI) as IRI | BlankNode;
          const predicate = this.parseNode(tokens[1], nm, baseIRI) as IRI;
          const object = this.parseNode(tokens[2], nm, baseIRI);

          const triple = new Triple(subject, predicate, object);
          results.push({ subject, triple });
        } else if (subject && tokens.length >= 2) {
          // Subsequent parts have predicate object
          const predicate = this.parseNode(tokens[0], nm, baseIRI) as IRI;
          const object = this.parseNode(tokens[1], nm, baseIRI);

          const triple = new Triple(subject, predicate, object);
          results.push({ triple });
        }
      }
    } else {
      // Simple single triple
      const tokens = this.tokenizeTurtleLine(statement);

      if (tokens.length >= 3) {
        const subject = this.parseNode(tokens[0], nm, baseIRI) as
          | IRI
          | BlankNode;
        const predicate = this.parseNode(tokens[1], nm, baseIRI) as IRI;
        const object = this.parseNode(tokens[2], nm, baseIRI);

        const triple = new Triple(subject, predicate, object);
        results.push({ subject, triple });
      }
    }

    return results;
  }

  /**
   * Tokenize a Turtle line
   */
  private tokenizeTurtleLine(line: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    let inBrackets = false;
    let afterQuote = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : "";

      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
          afterQuote = false;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = "";
          afterQuote = true;
        }
        current += char;
      } else if (char === "<") {
        inBrackets = true;
        current += char;
      } else if (char === ">") {
        inBrackets = false;
        current += char;
        // Check if this is followed by a space or end of line
        if (nextChar === " " || nextChar === "") {
          if (current) {
            tokens.push(current);
            current = "";
          }
        }
      } else if (char === "^" && nextChar === "^" && afterQuote) {
        // Datatype marker - include it with the literal
        current += "^^";
        i++; // Skip next ^
      } else if (char === " " && !inQuotes && !inBrackets) {
        if (current) {
          tokens.push(current);
          current = "";
          afterQuote = false;
        }
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Parse N-Triples format
   */
  private parseNTriples(
    content: string,
    warnings: string[],
    errors: string[],
  ): Graph {
    const graph = new Graph();
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line || line.startsWith("#")) continue;

      try {
        const triple = this.parseNTriplesLine(line);
        if (triple) {
          graph.add(triple);
        }
      } catch (error) {
        warnings.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    return graph;
  }

  /**
   * Parse a single N-Triples line
   */
  private parseNTriplesLine(line: string): Triple | null {
    // N-Triples format: <subject> <predicate> <object> .
    const match = line.match(
      /^(<[^>]+>|_:[a-zA-Z0-9]+)\s+(<[^>]+>)\s+(<[^>]+>|_:[a-zA-Z0-9]+|"[^"]*"(?:\^\^<[^>]+>|@[a-z-]+)?)\s+\.\s*$/,
    );

    if (!match) {
      throw new Error(`Invalid N-Triples format: ${line}`);
    }

    const [, subjectStr, predicateStr, objectStr] = match;

    const subject = this.parseNTriplesNode(subjectStr) as IRI | BlankNode;
    const predicate = this.parseNTriplesNode(predicateStr) as IRI;
    const object = this.parseNTriplesNode(objectStr);

    return new Triple(subject, predicate, object);
  }

  /**
   * Parse JSON-LD format
   */
  private parseJSONLD(
    content: string,
    nm: NamespaceManager,
    options: ParseOptions,
    warnings: string[],
    errors: string[],
  ): Graph {
    const graph = new Graph();

    try {
      const jsonld = JSON.parse(content);

      // Extract context
      if (jsonld["@context"]) {
        this.processJSONLDContext(jsonld["@context"], nm);
      }

      // Process graph
      const graphData =
        jsonld["@graph"] || (Array.isArray(jsonld) ? jsonld : [jsonld]);
      const subjects = Array.isArray(graphData) ? graphData : [graphData];

      for (const subject of subjects) {
        this.processJSONLDSubject(subject, graph, nm, options.baseIRI);
      }
    } catch (error) {
      errors.push(`JSON-LD parse error: ${error.message}`);
    }

    return graph;
  }

  /**
   * Process JSON-LD context
   */
  private processJSONLDContext(context: any, nm: NamespaceManager): void {
    if (typeof context === "string") {
      // URL context - would need to fetch
      return;
    }

    if (typeof context === "object") {
      for (const [key, value] of Object.entries(context)) {
        if (typeof value === "string" && key !== "@base" && key !== "@vocab") {
          nm.addBinding(key, value);
        }
      }
    }
  }

  /**
   * Process JSON-LD subject
   */
  private processJSONLDSubject(
    subject: any,
    graph: Graph,
    nm: NamespaceManager,
    baseIRI?: string,
  ): void {
    if (!subject["@id"]) return;

    const subjectNode = this.parseJSONLDNode(subject["@id"], nm, baseIRI) as
      | IRI
      | BlankNode;

    for (const [predicate, values] of Object.entries(subject)) {
      if (predicate === "@id" || predicate === "@context") continue;

      const predicateIRI = this.parseJSONLDPredicate(predicate, nm, baseIRI);
      const valueArray = Array.isArray(values) ? values : [values];

      for (const value of valueArray) {
        const objectNode = this.parseJSONLDValue(value, nm, baseIRI);
        const triple = new Triple(subjectNode, predicateIRI, objectNode);
        graph.add(triple);
      }
    }
  }

  /**
   * Parse RDF/XML format (basic implementation)
   */
  private parseRDFXML(
    content: string,
    nm: NamespaceManager,
    options: ParseOptions,
    warnings: string[],
    errors: string[],
  ): Graph {
    const graph = new Graph();
    warnings.push(
      "RDF/XML parsing is limited - consider using a specialized XML parser",
    );

    // This is a simplified implementation
    // A full implementation would use a proper XML parser

    return graph;
  }

  /**
   * Parse a node (IRI, BlankNode, or Literal)
   */
  private parseNode(
    nodeStr: string,
    nm: NamespaceManager,
    baseIRI?: string,
  ): IRI | BlankNode | Literal {
    nodeStr = nodeStr.trim();

    // Blank node
    if (nodeStr.startsWith("_:")) {
      return new BlankNode(nodeStr);
    }

    // Full IRI
    if (nodeStr.startsWith("<") && nodeStr.endsWith(">")) {
      const iri = nodeStr.slice(1, -1);
      return new IRI(baseIRI && !iri.includes("://") ? baseIRI + iri : iri);
    }

    // Literal
    if (nodeStr.startsWith('"')) {
      return this.parseLiteral(nodeStr);
    }

    // CURIE
    if (nodeStr.includes(":")) {
      const expanded = nm.expandCURIE(nodeStr);
      if (expanded.isSuccess) {
        return expanded.getValue();
      }
    }

    throw new Error(`Cannot parse node: ${nodeStr}`);
  }

  /**
   * Parse N-Triples node
   */
  private parseNTriplesNode(nodeStr: string): IRI | BlankNode | Literal {
    nodeStr = nodeStr.trim();

    // IRI
    if (nodeStr.startsWith("<") && nodeStr.endsWith(">")) {
      return new IRI(nodeStr.slice(1, -1));
    }

    // Blank node
    if (nodeStr.startsWith("_:")) {
      return new BlankNode(nodeStr);
    }

    // Literal
    if (nodeStr.startsWith('"')) {
      return this.parseLiteral(nodeStr);
    }

    throw new Error(`Cannot parse N-Triples node: ${nodeStr}`);
  }

  /**
   * Parse JSON-LD node
   */
  private parseJSONLDNode(
    nodeId: string,
    nm: NamespaceManager,
    baseIRI?: string,
  ): IRI | BlankNode {
    if (nodeId.startsWith("_:")) {
      return new BlankNode(nodeId);
    }

    if (nodeId.includes(":") && !nodeId.startsWith("http")) {
      const expanded = nm.expandCURIE(nodeId);
      if (expanded.isSuccess) {
        return expanded.getValue();
      }
    }

    return new IRI(
      baseIRI && !nodeId.includes("://") ? baseIRI + nodeId : nodeId,
    );
  }

  /**
   * Parse JSON-LD predicate
   */
  private parseJSONLDPredicate(
    predicate: string,
    nm: NamespaceManager,
    baseIRI?: string,
  ): IRI {
    if (predicate.includes(":") && !predicate.startsWith("http")) {
      const expanded = nm.expandCURIE(predicate);
      if (expanded.isSuccess) {
        return expanded.getValue();
      }
    }

    return new IRI(
      baseIRI && !predicate.includes("://") ? baseIRI + predicate : predicate,
    );
  }

  /**
   * Parse JSON-LD value
   */
  private parseJSONLDValue(
    value: any,
    nm: NamespaceManager,
    baseIRI?: string,
  ): IRI | BlankNode | Literal {
    if (typeof value === "string") {
      return Literal.string(value);
    }

    if (typeof value === "number") {
      return Number.isInteger(value)
        ? Literal.integer(value)
        : Literal.double(value);
    }

    if (typeof value === "boolean") {
      return Literal.boolean(value);
    }

    if (typeof value === "object") {
      if (value["@id"]) {
        return this.parseJSONLDNode(value["@id"], nm, baseIRI);
      }

      if (value["@value"]) {
        let literal = new Literal(value["@value"]);

        if (value["@type"]) {
          const datatype = this.parseJSONLDPredicate(
            value["@type"],
            nm,
            baseIRI,
          );
          literal = new Literal(value["@value"], datatype);
        }

        if (value["@language"]) {
          literal = new Literal(value["@value"], undefined, value["@language"]);
        }

        return literal;
      }
    }

    throw new Error(`Cannot parse JSON-LD value: ${JSON.stringify(value)}`);
  }

  /**
   * Parse a literal string
   */
  private parseLiteral(literalStr: string): Literal {
    // Basic literal: "value"
    let match = literalStr.match(/^"([^"]*)"$/);
    if (match) {
      return new Literal(match[1]);
    }

    // Literal with language: "value"@lang
    match = literalStr.match(/^"([^"]*)"@([a-z-]+)$/);
    if (match) {
      return new Literal(match[1], undefined, match[2]);
    }

    // Literal with datatype: "value"^^<datatype>
    match = literalStr.match(/^"([^"]*)"(?:\^\^)<([^>]+)>$/);
    if (match) {
      return new Literal(match[1], new IRI(match[2]));
    }

    // Alternative: Try without regex escaping
    if (literalStr.includes("^^<")) {
      const parts = literalStr.split("^^");
      if (parts.length === 2) {
        const value = parts[0].replace(/^"|"$/g, "");
        const datatype = parts[1].replace(/^<|>$/g, "");
        return new Literal(value, new IRI(datatype));
      }
    }

    // Literal with datatype CURIE: "value"^^prefix:local
    match = literalStr.match(/^"([^"]*)"(?:\^\^)([^\s]+)$/);
    if (match) {
      // Would need namespace manager to expand CURIE
      return new Literal(match[1]);
    }

    throw new Error(`Cannot parse literal: ${literalStr}`);
  }

  /**
   * Validate parsed graph
   */
  private validateGraph(graph: Graph): string[] {
    const errors: string[] = [];

    for (const triple of graph.toArray()) {
      // Validate subject (must be IRI or BlankNode)
      const subject = triple.getSubject();
      if (!(subject instanceof IRI) && !(subject instanceof BlankNode)) {
        errors.push(`Invalid subject type: ${typeof subject}`);
      }

      // Validate predicate (must be IRI)
      const predicate = triple.getPredicate();
      if (!(predicate instanceof IRI)) {
        errors.push(`Invalid predicate type: ${typeof predicate}`);
      }

      // Object can be any node type - no validation needed
    }

    return errors;
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
}
