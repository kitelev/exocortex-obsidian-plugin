/**
 * Namespace Manager for handling RDF namespace prefixes and URI expansion
 * Manages common RDF vocabularies and custom namespace prefixes
 */

import { IRI } from "../../domain/semantic/core/Triple";
import { Result } from "../../domain/core/Result";

export interface NamespaceBinding {
  prefix: string;
  namespace: IRI;
}

export class NamespaceManager {
  private bindings: Map<string, IRI> = new Map();
  private reverseBindings: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultNamespaces();
  }

  /**
   * Initialize common RDF namespace prefixes
   */
  private initializeDefaultNamespaces(): void {
    this.addBinding("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    this.addBinding("rdfs", "http://www.w3.org/2000/01/rdf-schema#");
    this.addBinding("owl", "http://www.w3.org/2002/07/owl#");
    this.addBinding("xsd", "http://www.w3.org/2001/XMLSchema#");
    this.addBinding("dc", "http://purl.org/dc/elements/1.1/");
    this.addBinding("dcterms", "http://purl.org/dc/terms/");
    this.addBinding("foaf", "http://xmlns.com/foaf/0.1/");
    this.addBinding("skos", "http://www.w3.org/2004/02/skos/core#");
    this.addBinding("void", "http://rdfs.org/ns/void#");

    // Exocortex namespaces
    this.addBinding("exo", "https://exocortex.io/ontology/core#");
    this.addBinding("ems", "https://exocortex.io/ontology/ems#");
    this.addBinding("vault", "obsidian://vault/");
  }

  /**
   * Add a namespace binding
   */
  addBinding(prefix: string, namespace: string): void {
    try {
      const iri = new IRI(namespace);
      this.bindings.set(prefix, iri);
      this.reverseBindings.set(namespace, prefix);
    } catch (error) {
      console.warn(`Invalid namespace URI for prefix ${prefix}: ${namespace}`);
    }
  }

  /**
   * Remove a namespace binding
   */
  removeBinding(prefix: string): void {
    const namespace = this.bindings.get(prefix);
    if (namespace) {
      this.bindings.delete(prefix);
      this.reverseBindings.delete(namespace.toString());
    }
  }

  /**
   * Get namespace URI for a prefix
   */
  getNamespace(prefix: string): IRI | undefined {
    return this.bindings.get(prefix);
  }

  /**
   * Get prefix for a namespace URI
   */
  getPrefix(namespace: string): string | undefined {
    return this.reverseBindings.get(namespace);
  }

  /**
   * Expand a CURIE (Compact URI) to full IRI
   */
  expandCURIE(curie: string): Result<IRI> {
    const colonIndex = curie.indexOf(":");
    if (colonIndex === -1) {
      return Result.fail(`Invalid CURIE format: ${curie}`);
    }

    const prefix = curie.substring(0, colonIndex);
    const localName = curie.substring(colonIndex + 1);

    const namespace = this.bindings.get(prefix);
    if (!namespace) {
      return Result.fail(`Unknown prefix: ${prefix}`);
    }

    try {
      const fullIRI = new IRI(namespace.toString() + localName);
      return Result.ok(fullIRI);
    } catch (error) {
      return Result.fail(`Invalid expanded IRI: ${error.message}`);
    }
  }

  /**
   * Compress a full IRI to CURIE if possible
   */
  compressIRI(iri: IRI): string {
    const iriString = iri.toString();

    // Try to find a matching namespace
    for (const [namespace, prefix] of this.reverseBindings) {
      if (iriString.startsWith(namespace)) {
        const localName = iriString.substring(namespace.length);
        // Only compress if the local name is valid
        if (this.isValidLocalName(localName)) {
          return `${prefix}:${localName}`;
        }
      }
    }

    // Return full IRI if no compression possible
    return `<${iriString}>`;
  }

  /**
   * Check if a local name is valid for CURIE compression
   */
  private isValidLocalName(localName: string): boolean {
    // Basic validation - should start with letter or underscore
    // and contain only alphanumeric characters, hyphens, underscores
    return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(localName);
  }

  /**
   * Parse and add namespace prefixes from RDF content
   */
  parseNamespaces(content: string, format: "turtle" | "n3"): void {
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (format === "turtle" || format === "n3") {
        // Parse @prefix declarations
        const prefixMatch = trimmed.match(
          /^@prefix\s+(\w+):\s+<([^>]+)>\s*\.\s*$/,
        );
        if (prefixMatch) {
          const [, prefix, namespace] = prefixMatch;
          this.addBinding(prefix, namespace);
          continue;
        }

        // Parse PREFIX declarations (SPARQL style)
        const sparqlPrefixMatch = trimmed.match(
          /^PREFIX\s+(\w+):\s+<([^>]+)>\s*$/,
        );
        if (sparqlPrefixMatch) {
          const [, prefix, namespace] = sparqlPrefixMatch;
          this.addBinding(prefix, namespace);
        }
      }
    }
  }

  /**
   * Generate namespace prefix declarations for a format
   */
  generatePrefixDeclarations(format: "turtle" | "n3" | "sparql"): string {
    const declarations: string[] = [];

    for (const [prefix, namespace] of this.bindings) {
      switch (format) {
        case "turtle":
        case "n3":
          declarations.push(`@prefix ${prefix}: <${namespace.toString()}> .`);
          break;
        case "sparql":
          declarations.push(`PREFIX ${prefix}: <${namespace.toString()}>`);
          break;
      }
    }

    return declarations.join("\n");
  }

  /**
   * Get all namespace bindings
   */
  getAllBindings(): NamespaceBinding[] {
    return Array.from(this.bindings.entries()).map(([prefix, namespace]) => ({
      prefix,
      namespace,
    }));
  }

  /**
   * Clear all custom bindings (keeps default ones)
   */
  clearCustomBindings(): void {
    this.bindings.clear();
    this.reverseBindings.clear();
    this.initializeDefaultNamespaces();
  }

  /**
   * Check if a prefix exists
   */
  hasPrefix(prefix: string): boolean {
    return this.bindings.has(prefix);
  }

  /**
   * Check if a namespace exists
   */
  hasNamespace(namespace: string): boolean {
    return this.reverseBindings.has(namespace);
  }

  /**
   * Create a copy of the namespace manager
   */
  clone(): NamespaceManager {
    const clone = new NamespaceManager();
    clone.clearCustomBindings();

    for (const [prefix, namespace] of this.bindings) {
      clone.addBinding(prefix, namespace.toString());
    }

    return clone;
  }
}
