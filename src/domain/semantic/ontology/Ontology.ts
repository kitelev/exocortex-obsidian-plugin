/**
 * Ontology management system for semantic schema definition
 * Supports OWL ontologies with class hierarchies, properties, and constraints
 */

import { IRI, RDF, RDFS, OWL, XSD } from "../core/Triple";
import { Graph } from "../core/Graph";
import { Result } from "../../core/Result";

export interface PropertyDefinition {
  iri: IRI;
  label: string;
  comment?: string;
  domain: IRI[]; // Classes this property applies to
  range: IRI | DataType; // Value type or class
  required: boolean;
  multiple: boolean;
  defaultValue?: any;
  order?: number; // Display order in UI
}

export interface ClassDefinition {
  iri: IRI;
  label: string;
  comment?: string;
  superClasses: IRI[];
  properties: PropertyDefinition[];
  abstract?: boolean;
  icon?: string; // Icon for UI display
  color?: string; // Color for UI display
}

export enum DataType {
  String = "xsd:string",
  Boolean = "xsd:boolean",
  Integer = "xsd:integer",
  Double = "xsd:double",
  Date = "xsd:date",
  DateTime = "xsd:dateTime",
  Markdown = "exo:markdown",
  JSON = "exo:json",
  UUID = "exo:uuid",
}

/**
 * Ontology - Defines the schema for a domain
 */
export class Ontology {
  private classes: Map<string, ClassDefinition> = new Map();
  private properties: Map<string, PropertyDefinition> = new Map();
  private prefixes: Map<string, string> = new Map();
  private graph: Graph;

  constructor(
    public readonly namespace: IRI,
    public readonly prefix: string,
    public readonly label: string,
    public readonly version: string,
  ) {
    this.graph = new Graph();
    this.prefixes.set(prefix, namespace.toString());
    this.initializeStandardPrefixes();
  }

  /**
   * Initialize standard namespace prefixes
   */
  private initializeStandardPrefixes(): void {
    this.prefixes.set("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    this.prefixes.set("rdfs", "http://www.w3.org/2000/01/rdf-schema#");
    this.prefixes.set("owl", "http://www.w3.org/2002/07/owl#");
    this.prefixes.set("xsd", "http://www.w3.org/2001/XMLSchema#");
    this.prefixes.set("exo", "https://exocortex.io/ontology/core#");
  }

  /**
   * Add a class definition
   */
  addClass(definition: ClassDefinition): Result<void> {
    const key = definition.iri.toString();

    if (this.classes.has(key)) {
      return Result.fail(`Class ${key} already exists`);
    }

    // Validate superclasses exist
    for (const superClass of definition.superClasses) {
      if (
        !this.classes.has(superClass.toString()) &&
        !this.isBuiltInClass(superClass)
      ) {
        return Result.fail(`Superclass ${superClass} not found`);
      }
    }

    this.classes.set(key, definition);

    // Add to RDF graph
    this.graph.add(new Triple(definition.iri, RDF.type, OWL.Class));
    this.graph.add(
      new Triple(definition.iri, RDFS.label, Literal.string(definition.label)),
    );

    if (definition.comment) {
      this.graph.add(
        new Triple(
          definition.iri,
          RDFS.comment,
          Literal.string(definition.comment),
        ),
      );
    }

    for (const superClass of definition.superClasses) {
      this.graph.add(new Triple(definition.iri, RDFS.subClassOf, superClass));
    }

    return Result.ok();
  }

  /**
   * Add a property definition
   */
  addProperty(definition: PropertyDefinition): Result<void> {
    const key = definition.iri.toString();

    if (this.properties.has(key)) {
      return Result.fail(`Property ${key} already exists`);
    }

    // Validate domain classes exist
    for (const domainClass of definition.domain) {
      if (
        !this.classes.has(domainClass.toString()) &&
        !this.isBuiltInClass(domainClass)
      ) {
        return Result.fail(`Domain class ${domainClass} not found`);
      }
    }

    this.properties.set(key, definition);

    // Add to RDF graph
    const propType =
      typeof definition.range === "string"
        ? OWL.DatatypeProperty
        : OWL.ObjectProperty;

    this.graph.add(new Triple(definition.iri, RDF.type, propType));
    this.graph.add(
      new Triple(definition.iri, RDFS.label, Literal.string(definition.label)),
    );

    if (definition.comment) {
      this.graph.add(
        new Triple(
          definition.iri,
          RDFS.comment,
          Literal.string(definition.comment),
        ),
      );
    }

    for (const domainClass of definition.domain) {
      this.graph.add(new Triple(definition.iri, RDFS.domain, domainClass));
    }

    if (definition.range instanceof IRI) {
      this.graph.add(new Triple(definition.iri, RDFS.range, definition.range));
    } else {
      this.graph.add(
        new Triple(
          definition.iri,
          RDFS.range,
          this.dataTypeToIRI(definition.range),
        ),
      );
    }

    return Result.ok();
  }

  /**
   * Get a class definition
   */
  getClass(iri: IRI | string): ClassDefinition | undefined {
    const key = typeof iri === "string" ? iri : iri.toString();
    return this.classes.get(key);
  }

  /**
   * Get a property definition
   */
  getProperty(iri: IRI | string): PropertyDefinition | undefined {
    const key = typeof iri === "string" ? iri : iri.toString();
    return this.properties.get(key);
  }

  /**
   * Get all classes
   */
  getAllClasses(): ClassDefinition[] {
    return Array.from(this.classes.values());
  }

  /**
   * Get all properties
   */
  getAllProperties(): PropertyDefinition[] {
    return Array.from(this.properties.values());
  }

  /**
   * Get properties for a class (including inherited)
   */
  getClassProperties(classIri: IRI): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    const processed = new Set<string>();

    const processClass = (iri: IRI) => {
      const key = iri.toString();
      if (processed.has(key)) return;
      processed.add(key);

      // Get direct properties
      for (const prop of this.properties.values()) {
        if (prop.domain.some((d) => d.toString() === key)) {
          properties.push(prop);
        }
      }

      // Process superclasses
      const classDef = this.classes.get(key);
      if (classDef) {
        for (const superClass of classDef.superClasses) {
          processClass(superClass);
        }
      }
    };

    processClass(classIri);

    // Sort by order
    return properties.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Get all subclasses of a class
   */
  getSubclasses(classIri: IRI, direct: boolean = false): IRI[] {
    const subclasses: IRI[] = [];

    for (const classDef of this.classes.values()) {
      if (direct) {
        // Only direct subclasses
        if (
          classDef.superClasses.some(
            (s) => s.toString() === classIri.toString(),
          )
        ) {
          subclasses.push(classDef.iri);
        }
      } else {
        // All subclasses (transitive)
        if (this.isSubclassOf(classDef.iri, classIri)) {
          subclasses.push(classDef.iri);
        }
      }
    }

    return subclasses;
  }

  /**
   * Check if a class is a subclass of another
   */
  isSubclassOf(subClass: IRI, superClass: IRI): boolean {
    if (subClass.toString() === superClass.toString()) return true;

    const classDef = this.classes.get(subClass.toString());
    if (!classDef) return false;

    for (const parent of classDef.superClasses) {
      if (this.isSubclassOf(parent, superClass)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Expand a prefixed name to full IRI
   */
  expandIRI(prefixedName: string): Result<IRI> {
    const parts = prefixedName.split(":");
    if (parts.length !== 2) {
      return Result.fail(`Invalid prefixed name: ${prefixedName}`);
    }

    const [prefix, localName] = parts;
    const namespace = this.prefixes.get(prefix);

    if (!namespace) {
      return Result.fail(`Unknown prefix: ${prefix}`);
    }

    return Result.ok(new IRI(namespace + localName));
  }

  /**
   * Compact an IRI to prefixed name
   */
  compactIRI(iri: IRI): string {
    const iriStr = iri.toString();

    for (const [prefix, namespace] of this.prefixes) {
      if (iriStr.startsWith(namespace)) {
        return `${prefix}:${iriStr.substring(namespace.length)}`;
      }
    }

    return iriStr;
  }

  /**
   * Export ontology to Turtle format
   */
  toTurtle(): string {
    const lines: string[] = [];

    // Prefixes
    for (const [prefix, namespace] of this.prefixes) {
      lines.push(`@prefix ${prefix}: <${namespace}> .`);
    }
    lines.push("");

    // Ontology metadata
    lines.push(`<${this.namespace}>`);
    lines.push(`    a owl:Ontology ;`);
    lines.push(`    rdfs:label "${this.label}" ;`);
    lines.push(`    owl:versionInfo "${this.version}" .`);
    lines.push("");

    // Classes
    for (const classDef of this.classes.values()) {
      lines.push(`${this.compactIRI(classDef.iri)}`);
      lines.push(`    a owl:Class ;`);
      lines.push(`    rdfs:label "${classDef.label}" ;`);

      if (classDef.comment) {
        lines.push(`    rdfs:comment "${classDef.comment}" ;`);
      }

      if (classDef.superClasses.length > 0) {
        const superClassList = classDef.superClasses
          .map((s) => this.compactIRI(s))
          .join(", ");
        lines.push(`    rdfs:subClassOf ${superClassList} ;`);
      }

      lines[lines.length - 1] = lines[lines.length - 1].replace(" ;", " .");
      lines.push("");
    }

    // Properties
    for (const prop of this.properties.values()) {
      const propType =
        typeof prop.range === "string"
          ? "owl:DatatypeProperty"
          : "owl:ObjectProperty";

      lines.push(`${this.compactIRI(prop.iri)}`);
      lines.push(`    a ${propType} ;`);
      lines.push(`    rdfs:label "${prop.label}" ;`);

      if (prop.comment) {
        lines.push(`    rdfs:comment "${prop.comment}" ;`);
      }

      if (prop.domain.length > 0) {
        const domainList = prop.domain
          .map((d) => this.compactIRI(d))
          .join(", ");
        lines.push(`    rdfs:domain ${domainList} ;`);
      }

      if (prop.range instanceof IRI) {
        lines.push(`    rdfs:range ${this.compactIRI(prop.range)} ;`);
      } else {
        lines.push(`    rdfs:range ${prop.range} ;`);
      }

      lines[lines.length - 1] = lines[lines.length - 1].replace(" ;", " .");
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Check if a class is built-in
   */
  private isBuiltInClass(iri: IRI): boolean {
    const builtIn = [
      "http://www.w3.org/2002/07/owl#Thing",
      "https://exocortex.io/ontology/core#Asset",
      "https://exocortex.io/ontology/core#KnowledgeObject",
    ];

    return builtIn.includes(iri.toString());
  }

  /**
   * Convert DataType enum to IRI
   */
  private dataTypeToIRI(dataType: DataType): IRI {
    const mapping: Record<DataType, string> = {
      [DataType.String]: XSD.string.toString(),
      [DataType.Boolean]: XSD.boolean.toString(),
      [DataType.Integer]: XSD.integer.toString(),
      [DataType.Double]: XSD.double.toString(),
      [DataType.Date]: XSD.date.toString(),
      [DataType.DateTime]: XSD.dateTime.toString(),
      [DataType.Markdown]: "https://exocortex.io/ontology/core#markdown",
      [DataType.JSON]: "https://exocortex.io/ontology/core#json",
      [DataType.UUID]: "https://exocortex.io/ontology/core#uuid",
    };

    return new IRI(mapping[dataType]);
  }
}

// Re-export for convenience
import { Triple, Literal } from "../core/Triple";
export { Triple, Literal, IRI };
