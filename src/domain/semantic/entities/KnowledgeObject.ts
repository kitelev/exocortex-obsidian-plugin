/**
 * KnowledgeObject - The fundamental semantic entity in the Exocortex system
 * Represents any piece of knowledge with RDF-based properties and relationships
 */

import { Entity } from '../../core/Entity';
import { Result } from '../../core/Result';
import { Graph } from '../core/Graph';
import { Triple, IRI, Literal, BlankNode, RDF, RDFS, EXO } from '../core/Triple';
import { v4 as uuidv4 } from 'uuid';

export type UUID = string;
export type MarkdownContent = string;

export interface KnowledgeObjectProps {
  uuid: UUID;
  type: IRI;
  graph: Graph;
  content?: MarkdownContent;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * KnowledgeObject - Core domain entity for semantic knowledge management
 * 
 * Design principles:
 * 1. Privacy-first: Only UUID is public, all other data is private
 * 2. Semantic: All properties are RDF triples with formal semantics
 * 3. Extensible: New properties can be added without code changes
 * 4. Validatable: SHACL shapes ensure data integrity
 */
export class KnowledgeObject extends Entity<KnowledgeObjectProps> {
  private constructor(props: KnowledgeObjectProps) {
    super(props);
  }

  /**
   * Factory method for creating a new KnowledgeObject
   */
  static create(
    type: IRI,
    initialProperties?: Map<IRI, any>,
    content?: MarkdownContent
  ): Result<KnowledgeObject> {
    const uuid = uuidv4();
    const now = new Date();
    const graph = new Graph();
    
    // Create subject IRI from UUID
    const subject = new IRI(`urn:uuid:${uuid}`);
    
    // Add core triples
    graph.add(new Triple(subject, RDF.type, type));
    graph.add(new Triple(subject, EXO.uuid, Literal.string(uuid)));
    graph.add(new Triple(subject, EXO.createdAt, Literal.dateTime(now)));
    graph.add(new Triple(subject, EXO.updatedAt, Literal.dateTime(now)));
    
    // Add initial properties
    if (initialProperties) {
      for (const [predicate, value] of initialProperties) {
        const literal = KnowledgeObject.valueToLiteral(value);
        if (literal.isFailure) {
          return Result.fail(literal.error);
        }
        graph.add(new Triple(subject, predicate, literal.getValue()));
      }
    }
    
    const props: KnowledgeObjectProps = {
      uuid,
      type,
      graph,
      content,
      createdAt: now,
      updatedAt: now
    };
    
    return Result.ok(new KnowledgeObject(props));
  }

  /**
   * Reconstruct a KnowledgeObject from stored data
   */
  static fromGraph(
    uuid: UUID,
    graph: Graph,
    content?: MarkdownContent
  ): Result<KnowledgeObject> {
    const subject = new IRI(`urn:uuid:${uuid}`);
    
    // Get type
    const typeTriples = graph.match(subject, RDF.type, null);
    if (typeTriples.length === 0) {
      return Result.fail('Knowledge object has no type');
    }
    const type = typeTriples[0].getObject() as IRI;
    
    // Get timestamps
    const createdTriples = graph.match(subject, EXO.createdAt, null);
    const updatedTriples = graph.match(subject, EXO.updatedAt, null);
    
    let createdAt = new Date();
    let updatedAt = new Date();
    
    if (createdTriples.length > 0) {
      const literal = createdTriples[0].getObject() as Literal;
      createdAt = new Date(literal.getValue());
    }
    
    if (updatedTriples.length > 0) {
      const literal = updatedTriples[0].getObject() as Literal;
      updatedAt = new Date(literal.getValue());
    }
    
    const props: KnowledgeObjectProps = {
      uuid,
      type,
      graph,
      content,
      createdAt,
      updatedAt
    };
    
    return Result.ok(new KnowledgeObject(props));
  }

  /**
   * Get the UUID (public identifier)
   */
  get uuid(): UUID {
    return this.props.uuid;
  }

  /**
   * Get the semantic type
   */
  get type(): IRI {
    return this.props.type;
  }

  /**
   * Get the content (if any)
   */
  get content(): MarkdownContent | undefined {
    return this.props.content;
  }

  /**
   * Get creation timestamp
   */
  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Get last update timestamp
   */
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Get the subject IRI for this object
   */
  get subject(): IRI {
    return new IRI(`urn:uuid:${this.uuid}`);
  }

  /**
   * Set a property value
   */
  setProperty(predicate: IRI, value: any): Result<void> {
    const literal = KnowledgeObject.valueToLiteral(value);
    if (literal.isFailure) {
      return Result.fail(literal.error);
    }
    
    // Remove existing values for this predicate
    const existing = this.props.graph.match(this.subject, predicate, null);
    for (const triple of existing) {
      this.props.graph.remove(triple);
    }
    
    // Add new value
    this.props.graph.add(new Triple(this.subject, predicate, literal.getValue()));
    
    // Update timestamp
    this.updateTimestamp();
    
    return Result.ok();
  }

  /**
   * Get a property value
   */
  getProperty(predicate: IRI): any | undefined {
    const triples = this.props.graph.match(this.subject, predicate, null);
    if (triples.length === 0) return undefined;
    
    const object = triples[0].getObject();
    if (object instanceof Literal) {
      return KnowledgeObject.literalToValue(object);
    }
    return object.toString();
  }

  /**
   * Get all property values for a predicate
   */
  getProperties(predicate: IRI): any[] {
    const triples = this.props.graph.match(this.subject, predicate, null);
    return triples.map(t => {
      const object = t.getObject();
      if (object instanceof Literal) {
        return KnowledgeObject.literalToValue(object);
      }
      return object.toString();
    });
  }

  /**
   * Add a property value (for multi-valued properties)
   */
  addProperty(predicate: IRI, value: any): Result<void> {
    const literal = KnowledgeObject.valueToLiteral(value);
    if (literal.isFailure) {
      return Result.fail(literal.error);
    }
    
    this.props.graph.add(new Triple(this.subject, predicate, literal.getValue()));
    this.updateTimestamp();
    
    return Result.ok();
  }

  /**
   * Remove a property value
   */
  removeProperty(predicate: IRI, value?: any): Result<void> {
    if (value === undefined) {
      // Remove all values for this predicate
      const triples = this.props.graph.match(this.subject, predicate, null);
      for (const triple of triples) {
        this.props.graph.remove(triple);
      }
    } else {
      // Remove specific value
      const literal = KnowledgeObject.valueToLiteral(value);
      if (literal.isFailure) {
        return Result.fail(literal.error);
      }
      
      const triples = this.props.graph.match(this.subject, predicate, literal.getValue());
      for (const triple of triples) {
        this.props.graph.remove(triple);
      }
    }
    
    this.updateTimestamp();
    return Result.ok();
  }

  /**
   * Add a relationship to another KnowledgeObject
   */
  addRelation(predicate: IRI, targetUuid: UUID): Result<void> {
    const targetIri = new IRI(`urn:uuid:${targetUuid}`);
    this.props.graph.add(new Triple(this.subject, predicate, targetIri));
    this.updateTimestamp();
    return Result.ok();
  }

  /**
   * Remove a relationship
   */
  removeRelation(predicate: IRI, targetUuid: UUID): Result<void> {
    const targetIri = new IRI(`urn:uuid:${targetUuid}`);
    const triples = this.props.graph.match(this.subject, predicate, targetIri);
    for (const triple of triples) {
      this.props.graph.remove(triple);
    }
    this.updateTimestamp();
    return Result.ok();
  }

  /**
   * Get all related objects for a predicate
   */
  getRelations(predicate: IRI): UUID[] {
    const triples = this.props.graph.match(this.subject, predicate, null);
    const uuids: UUID[] = [];
    
    for (const triple of triples) {
      const object = triple.getObject();
      if (object instanceof IRI) {
        const iri = object.toString();
        if (iri.startsWith('urn:uuid:')) {
          uuids.push(iri.substring(9));
        }
      }
    }
    
    return uuids;
  }

  /**
   * Update content
   */
  setContent(content: MarkdownContent): Result<void> {
    this.props.content = content;
    this.updateTimestamp();
    return Result.ok();
  }

  /**
   * Get all properties as a map
   */
  getAllProperties(): Map<IRI, any[]> {
    const properties = new Map<IRI, any[]>();
    const triples = this.props.graph.match(this.subject, null, null);
    
    for (const triple of triples) {
      const predicate = triple.getPredicate();
      const object = triple.getObject();
      
      if (!properties.has(predicate)) {
        properties.set(predicate, []);
      }
      
      if (object instanceof Literal) {
        properties.get(predicate)!.push(KnowledgeObject.literalToValue(object));
      } else if (object instanceof IRI) {
        const iri = object.toString();
        if (iri.startsWith('urn:uuid:')) {
          properties.get(predicate)!.push(iri.substring(9));
        } else {
          properties.get(predicate)!.push(iri);
        }
      }
    }
    
    return properties;
  }

  /**
   * Get the RDF graph for this object
   */
  getGraph(): Graph {
    return this.props.graph.clone();
  }

  /**
   * Export to N-Triples format
   */
  toNTriples(): string {
    return this.props.graph.toString();
  }

  /**
   * Clone the knowledge object
   */
  clone(): KnowledgeObject {
    const props: KnowledgeObjectProps = {
      uuid: this.props.uuid,
      type: this.props.type,
      graph: this.props.graph.clone(),
      content: this.props.content,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    };
    
    return new KnowledgeObject(props);
  }

  /**
   * Update the timestamp
   */
  private updateTimestamp(): void {
    const now = new Date();
    this.props.updatedAt = now;
    
    // Update in graph
    const existing = this.props.graph.match(this.subject, EXO.updatedAt, null);
    for (const triple of existing) {
      this.props.graph.remove(triple);
    }
    this.props.graph.add(new Triple(this.subject, EXO.updatedAt, Literal.dateTime(now)));
  }

  /**
   * Convert a JavaScript value to an RDF Literal
   */
  private static valueToLiteral(value: any): Result<Literal | IRI> {
    if (value === null || value === undefined) {
      return Result.fail('Cannot convert null/undefined to literal');
    }
    
    if (typeof value === 'string') {
      // Check if it's a UUID reference
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return Result.ok(new IRI(`urn:uuid:${value}`));
      }
      // Check if it's an IRI
      if (value.startsWith('http://') || value.startsWith('https://') || value.includes(':')) {
        try {
          return Result.ok(new IRI(value));
        } catch {
          // Fall back to string literal
        }
      }
      return Result.ok(Literal.string(value));
    }
    
    if (typeof value === 'boolean') {
      return Result.ok(Literal.boolean(value));
    }
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return Result.ok(Literal.integer(value));
      }
      return Result.ok(Literal.double(value));
    }
    
    if (value instanceof Date) {
      return Result.ok(Literal.dateTime(value));
    }
    
    if (value instanceof IRI) {
      return Result.ok(value);
    }
    
    if (value instanceof Literal) {
      return Result.ok(value);
    }
    
    // Convert object to JSON string
    return Result.ok(Literal.string(JSON.stringify(value)));
  }

  /**
   * Convert an RDF Literal to a JavaScript value
   */
  private static literalToValue(literal: Literal): any {
    const datatype = literal.getDatatype();
    const value = literal.getValue();
    
    if (!datatype) {
      return value;
    }
    
    const dt = datatype.toString();
    
    if (dt === 'http://www.w3.org/2001/XMLSchema#boolean') {
      return value === 'true';
    }
    
    if (dt === 'http://www.w3.org/2001/XMLSchema#integer') {
      return parseInt(value, 10);
    }
    
    if (dt === 'http://www.w3.org/2001/XMLSchema#double') {
      return parseFloat(value);
    }
    
    if (dt === 'http://www.w3.org/2001/XMLSchema#dateTime') {
      return new Date(value);
    }
    
    // Try to parse JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        // Not JSON, return as string
      }
    }
    
    return value;
  }
}