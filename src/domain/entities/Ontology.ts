import { OntologyPrefix } from '../value-objects/OntologyPrefix';

/**
 * Domain entity representing an ontology
 * Manages ontology metadata and relationships
 */
export class Ontology {
  private readonly prefix: OntologyPrefix;
  private readonly label: string;
  private readonly fileName: string;
  private readonly namespace?: string;
  private readonly description?: string;

  constructor(params: {
    prefix: OntologyPrefix;
    label: string;
    fileName: string;
    namespace?: string;
    description?: string;
  }) {
    this.prefix = params.prefix;
    this.label = params.label;
    this.fileName = params.fileName;
    this.namespace = params.namespace;
    this.description = params.description;
  }

  getPrefix(): OntologyPrefix {
    return this.prefix;
  }

  getLabel(): string {
    return this.label;
  }

  getFileName(): string {
    return this.fileName;
  }

  getNamespace(): string | undefined {
    return this.namespace;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getDisplayName(): string {
    return `${this.prefix.toString()} - ${this.label}`;
  }

  isInternal(): boolean {
    return this.fileName.startsWith('!');
  }

  equals(other: Ontology): boolean {
    return this.prefix.equals(other.prefix);
  }
}