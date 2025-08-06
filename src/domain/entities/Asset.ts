import { AssetId } from '../value-objects/AssetId';
import { ClassName } from '../value-objects/ClassName';
import { OntologyPrefix } from '../value-objects/OntologyPrefix';

/**
 * Domain entity representing an Exocortex Asset
 * Core business logic and invariants
 */
export class Asset {
  private readonly id: AssetId;
  private title: string;
  private className: ClassName;
  private ontologyPrefix: OntologyPrefix;
  private properties: Map<string, any>;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(params: {
    id?: AssetId;
    title: string;
    className: ClassName;
    ontologyPrefix: OntologyPrefix;
    properties?: Map<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = params.id || AssetId.generate();
    this.title = params.title;
    this.className = params.className;
    this.ontologyPrefix = params.ontologyPrefix;
    this.properties = params.properties || new Map();
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();
    
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Asset title cannot be empty');
    }
    
    if (!this.className) {
      throw new Error('Asset must have a class');
    }
    
    if (!this.ontologyPrefix) {
      throw new Error('Asset must belong to an ontology');
    }
  }

  // Getters
  getId(): AssetId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getClassName(): ClassName {
    return this.className;
  }

  getOntologyPrefix(): OntologyPrefix {
    return this.ontologyPrefix;
  }

  getProperties(): Map<string, any> {
    return new Map(this.properties);
  }

  getProperty(key: string): any {
    return this.properties.get(key);
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business methods
  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Asset title cannot be empty');
    }
    this.title = title;
    this.updatedAt = new Date();
  }

  setProperty(key: string, value: any): void {
    this.properties.set(key, value);
    this.updatedAt = new Date();
  }

  removeProperty(key: string): void {
    this.properties.delete(key);
    this.updatedAt = new Date();
  }

  changeClass(className: ClassName): void {
    this.className = className;
    this.updatedAt = new Date();
  }

  toFrontmatter(): Record<string, any> {
    const frontmatter: Record<string, any> = {
      'exo__Asset_uid': this.id.toString(),
      'exo__Asset_label': this.title,
      'exo__Asset_isDefinedBy': `[[${this.ontologyPrefix.toFileName()}]]`,
      'exo__Asset_createdAt': this.createdAt.toISOString(),
      'exo__Instance_class': [this.className.toWikiLink()]
    };

    // Add custom properties
    for (const [key, value] of this.properties) {
      if (!frontmatter[key]) {
        frontmatter[key] = value;
      }
    }

    return frontmatter;
  }

  static fromFrontmatter(frontmatter: Record<string, any>, fileName: string): Asset {
    const id = new AssetId(frontmatter['exo__Asset_uid'] || AssetId.generate().toString());
    const title = frontmatter['exo__Asset_label'] || fileName.replace('.md', '');
    
    const classValue = Array.isArray(frontmatter['exo__Instance_class']) 
      ? frontmatter['exo__Instance_class'][0] 
      : frontmatter['exo__Instance_class'];
    const className = new ClassName(classValue || 'exo__Asset');
    
    const ontologyValue = frontmatter['exo__Asset_isDefinedBy']?.replace(/\[\[!?|\]\]/g, '') || 'exo';
    const ontologyPrefix = new OntologyPrefix(ontologyValue);
    
    const createdAt = frontmatter['exo__Asset_createdAt'] 
      ? new Date(frontmatter['exo__Asset_createdAt']) 
      : new Date();
    
    const properties = new Map<string, any>();
    for (const [key, value] of Object.entries(frontmatter)) {
      if (!key.startsWith('exo__Asset_') && !key.startsWith('exo__Instance_')) {
        properties.set(key, value);
      }
    }
    
    return new Asset({
      id,
      title,
      className,
      ontologyPrefix,
      properties,
      createdAt,
      updatedAt: new Date()
    });
  }
}