/**
 * Core RDF Triple implementation for semantic knowledge representation
 * Based on RDF 1.1 specification: https://www.w3.org/TR/rdf11-concepts/
 */

import { Result } from '../../core/Result';

/**
 * Internationalized Resource Identifier
 * Used to uniquely identify resources in the semantic web
 */
export class IRI {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid IRI: ${value}`);
    }
  }

  private isValid(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      // Check if it's a valid CURIE (prefix:localName)
      return /^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: IRI): boolean {
    return this.value === other.value;
  }

  static from(value: string): Result<IRI> {
    try {
      return Result.ok(new IRI(value));
    } catch (error) {
      return Result.fail(`Invalid IRI: ${error.message}`);
    }
  }
}

/**
 * Blank node for representing anonymous resources
 */
export class BlankNode {
  constructor(private readonly id: string = BlankNode.generateId()) {}

  private static counter = 0;
  
  private static generateId(): string {
    return `_:b${++BlankNode.counter}`;
  }

  toString(): string {
    return this.id;
  }

  equals(other: BlankNode): boolean {
    return this.id === other.id;
  }
}

/**
 * RDF Literal with optional datatype and language tag
 */
export class Literal {
  constructor(
    private readonly value: string,
    private readonly datatype?: IRI,
    private readonly language?: string
  ) {
    if (language && datatype) {
      throw new Error('Literal cannot have both language and datatype');
    }
  }

  toString(): string {
    if (this.language) {
      return `"${this.value}"@${this.language}`;
    }
    if (this.datatype) {
      return `"${this.value}"^^${this.datatype.toString()}`;
    }
    return `"${this.value}"`;
  }

  getValue(): string {
    return this.value;
  }

  getDatatype(): IRI | undefined {
    return this.datatype;
  }

  getLanguage(): string | undefined {
    return this.language;
  }

  equals(other: Literal): boolean {
    const datatypeEquals = this.datatype && other.datatype 
      ? this.datatype.equals(other.datatype)
      : this.datatype === other.datatype;
    
    return (
      this.value === other.value &&
      datatypeEquals &&
      this.language === other.language
    );
  }

  static string(value: string): Literal {
    return new Literal(value, XSD.string);
  }

  static boolean(value: boolean): Literal {
    return new Literal(value.toString(), XSD.boolean);
  }

  static integer(value: number): Literal {
    return new Literal(Math.floor(value).toString(), XSD.integer);
  }

  static double(value: number): Literal {
    return new Literal(value.toString(), XSD.double);
  }

  static dateTime(value: Date): Literal {
    return new Literal(value.toISOString(), XSD.dateTime);
  }

  static langString(value: string, language: string): Literal {
    return new Literal(value, undefined, language);
  }
}

/**
 * RDF Triple: Subject-Predicate-Object statement
 */
export class Triple {
  constructor(
    private readonly subject: IRI | BlankNode,
    private readonly predicate: IRI,
    private readonly object: IRI | BlankNode | Literal
  ) {}

  getSubject(): IRI | BlankNode {
    return this.subject;
  }

  getPredicate(): IRI {
    return this.predicate;
  }

  getObject(): IRI | BlankNode | Literal {
    return this.object;
  }

  toString(): string {
    return `${this.subject.toString()} ${this.predicate.toString()} ${this.object.toString()} .`;
  }

  equals(other: Triple): boolean {
    return (
      this.subjectEquals(other.subject) &&
      this.predicate.equals(other.predicate) &&
      this.objectEquals(other.object)
    );
  }

  private subjectEquals(other: IRI | BlankNode): boolean {
    if (this.subject instanceof IRI && other instanceof IRI) {
      return this.subject.equals(other);
    }
    if (this.subject instanceof BlankNode && other instanceof BlankNode) {
      return this.subject.equals(other);
    }
    return false;
  }

  private objectEquals(other: IRI | BlankNode | Literal): boolean {
    if (this.object instanceof IRI && other instanceof IRI) {
      return this.object.equals(other);
    }
    if (this.object instanceof BlankNode && other instanceof BlankNode) {
      return this.object.equals(other);
    }
    if (this.object instanceof Literal && other instanceof Literal) {
      return this.object.equals(other);
    }
    return false;
  }
}

/**
 * Common RDF vocabularies
 */
export class RDF {
  static readonly namespace = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
  static readonly type = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  static readonly Property = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property');
  static readonly Statement = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement');
  static readonly subject = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#subject');
  static readonly predicate = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate');
  static readonly object = new IRI('http://www.w3.org/1999/02/22-rdf-syntax-ns#object');
}

export class RDFS {
  static readonly namespace = new IRI('http://www.w3.org/2000/01/rdf-schema#');
  static readonly Class = new IRI('http://www.w3.org/2000/01/rdf-schema#Class');
  static readonly subClassOf = new IRI('http://www.w3.org/2000/01/rdf-schema#subClassOf');
  static readonly subPropertyOf = new IRI('http://www.w3.org/2000/01/rdf-schema#subPropertyOf');
  static readonly domain = new IRI('http://www.w3.org/2000/01/rdf-schema#domain');
  static readonly range = new IRI('http://www.w3.org/2000/01/rdf-schema#range');
  static readonly label = new IRI('http://www.w3.org/2000/01/rdf-schema#label');
  static readonly comment = new IRI('http://www.w3.org/2000/01/rdf-schema#comment');
}

export class OWL {
  static readonly namespace = new IRI('http://www.w3.org/2002/07/owl#');
  static readonly Class = new IRI('http://www.w3.org/2002/07/owl#Class');
  static readonly ObjectProperty = new IRI('http://www.w3.org/2002/07/owl#ObjectProperty');
  static readonly DatatypeProperty = new IRI('http://www.w3.org/2002/07/owl#DatatypeProperty');
  static readonly sameAs = new IRI('http://www.w3.org/2002/07/owl#sameAs');
  static readonly differentFrom = new IRI('http://www.w3.org/2002/07/owl#differentFrom');
  static readonly equivalentClass = new IRI('http://www.w3.org/2002/07/owl#equivalentClass');
}

export class XSD {
  static readonly namespace = new IRI('http://www.w3.org/2001/XMLSchema#');
  static readonly string = new IRI('http://www.w3.org/2001/XMLSchema#string');
  static readonly boolean = new IRI('http://www.w3.org/2001/XMLSchema#boolean');
  static readonly integer = new IRI('http://www.w3.org/2001/XMLSchema#integer');
  static readonly double = new IRI('http://www.w3.org/2001/XMLSchema#double');
  static readonly dateTime = new IRI('http://www.w3.org/2001/XMLSchema#dateTime');
  static readonly date = new IRI('http://www.w3.org/2001/XMLSchema#date');
}

/**
 * Exocortex-specific vocabularies
 */
export class EXO {
  static readonly namespace = new IRI('https://exocortex.io/ontology/core#');
  static readonly Asset = new IRI('https://exocortex.io/ontology/core#Asset');
  static readonly uuid = new IRI('https://exocortex.io/ontology/core#uuid');
  static readonly createdAt = new IRI('https://exocortex.io/ontology/core#createdAt');
  static readonly updatedAt = new IRI('https://exocortex.io/ontology/core#updatedAt');
  static readonly isDefinedBy = new IRI('https://exocortex.io/ontology/core#isDefinedBy');
}

export class EMS {
  static readonly namespace = new IRI('https://exocortex.io/ontology/ems#');
  static readonly Task = new IRI('https://exocortex.io/ontology/ems#Task');
  static readonly Project = new IRI('https://exocortex.io/ontology/ems#Project');
  static readonly Area = new IRI('https://exocortex.io/ontology/ems#Area');
  static readonly status = new IRI('https://exocortex.io/ontology/ems#status');
  static readonly priority = new IRI('https://exocortex.io/ontology/ems#priority');
}