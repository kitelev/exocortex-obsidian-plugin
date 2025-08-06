import { AssetId } from '../value-objects/AssetId';
import { ClassName } from '../value-objects/ClassName';
import { OntologyPrefix } from '../value-objects/OntologyPrefix';
import { Entity } from '../core/Entity';
import { Result } from '../core/Result';

interface AssetProps {
  id: AssetId;
  title: string;
  className: ClassName;
  ontology: OntologyPrefix;
  label?: string;
  description?: string;
  properties: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain entity representing an Exocortex Asset
 * Core business logic and invariants
 */
export class Asset extends Entity<AssetProps> {
  
  private constructor(props: AssetProps) {
    super(props);
  }

  static create(params: {
    id: AssetId;
    className: ClassName;
    ontology: OntologyPrefix;
    label: string;
    description?: string;
    properties?: Record<string, any>;
  }): Result<Asset> {
    if (!params.label || params.label.trim().length === 0) {
      return Result.fail<Asset>('Asset label cannot be empty');
    }

    const props: AssetProps = {
      id: params.id,
      title: params.label,
      className: params.className,
      ontology: params.ontology,
      label: params.label,
      description: params.description,
      properties: new Map(Object.entries(params.properties || {})),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return Result.ok<Asset>(new Asset(props));
  }

  // Getters
  getId(): AssetId {
    return this.props.id;
  }

  getTitle(): string {
    return this.props.title;
  }

  getClassName(): ClassName {
    return this.props.className;
  }

  getOntologyPrefix(): OntologyPrefix {
    return this.props.ontology;
  }

  getProperties(): Map<string, any> {
    return new Map(this.props.properties);
  }

  getProperty(key: string): any {
    return this.props.properties.get(key);
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Asset title cannot be empty');
    }
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  setProperty(key: string, value: any): void {
    this.props.properties.set(key, value);
    this.props.updatedAt = new Date();
  }

  removeProperty(key: string): void {
    this.props.properties.delete(key);
    this.props.updatedAt = new Date();
  }

  changeClass(className: ClassName): void {
    this.props.className = className;
    this.props.updatedAt = new Date();
  }

  toFrontmatter(): Record<string, any> {
    const frontmatter: Record<string, any> = {
      'exo__Asset_uid': this.props.id.toString(),
      'exo__Asset_label': this.props.title,
      'exo__Asset_isDefinedBy': `[[${this.props.ontology.toFileName()}]]`,
      'exo__Asset_createdAt': this.props.createdAt.toISOString(),
      'exo__Instance_class': [this.props.className.toWikiLink()]
    };

    // Add custom properties
    for (const [key, value] of this.props.properties) {
      if (!frontmatter[key]) {
        frontmatter[key] = value;
      }
    }

    return frontmatter;
  }

  static fromFrontmatter(frontmatter: Record<string, any>, fileName: string): Asset {
    const idResult = AssetId.create(frontmatter['exo__Asset_uid'] || AssetId.generate().toString());
    const id = idResult.isSuccess ? idResult.getValue() : AssetId.generate();
    const title = frontmatter['exo__Asset_label'] || fileName.replace('.md', '');
    
    const classValue = Array.isArray(frontmatter['exo__Instance_class']) 
      ? frontmatter['exo__Instance_class'][0] 
      : frontmatter['exo__Instance_class'];
    const classNameResult = ClassName.create(classValue || 'exo__Asset');
    const className = classNameResult.isSuccess ? classNameResult.getValue() : ClassName.create('exo__Asset').getValue()!;
    
    const ontologyValue = frontmatter['exo__Asset_isDefinedBy']?.replace(/\[\[!?|\]\]/g, '') || 'exo';
    const ontologyResult = OntologyPrefix.create(ontologyValue);
    const ontologyPrefix = ontologyResult.isSuccess ? ontologyResult.getValue() : OntologyPrefix.create('exo').getValue()!;
    
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
      ontology: ontologyPrefix,
      properties,
      createdAt,
      updatedAt: new Date()
    });
  }
}