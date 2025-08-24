import { Asset } from '../../../src/domain/entities/Asset';
import { AssetId } from '../../../src/domain/value-objects/AssetId';
import { ClassName } from '../../../src/domain/value-objects/ClassName';
import { Priority } from '../../../src/domain/value-objects/Priority';
import { Triple } from '../../../src/domain/semantic/core/Triple';
import { IndexedGraph } from '../../../src/domain/semantic/core/IndexedGraph';
import { FakeVaultAdapter } from '../../helpers/FakeVaultAdapter';

/**
 * BDD Test Data Builder
 * 
 * Provides fluent API for creating test data in BDD scenarios.
 * Follows the Builder pattern for readable test data construction.
 */
export class TestDataBuilder {
  constructor(
    private vaultAdapter: FakeVaultAdapter,
    private graph: IndexedGraph
  ) {}
  
  /**
   * Create an Asset Builder for fluent asset creation
   */
  asset(name: string): AssetBuilder {
    return new AssetBuilder(name, this.vaultAdapter, this.graph);
  }
  
  /**
   * Create a Triple Builder for fluent triple creation
   */
  triple(subject: string): TripleBuilder {
    return new TripleBuilder(subject, this.graph);
  }
  
  /**
   * Create a Graph Builder for bulk graph operations
   */
  graph(): GraphBuilder {
    return new GraphBuilder(this.graph);
  }
  
  /**
   * Create a Scenario Builder for complex test scenarios
   */
  scenario(name: string): ScenarioBuilder {
    return new ScenarioBuilder(name, this.vaultAdapter, this.graph);
  }
  
  /**
   * Clear all test data
   */
  clear(): void {
    this.vaultAdapter.clear();
    this.graph.clear();
  }
}

/**
 * Asset Builder for creating test assets
 */
export class AssetBuilder {
  private properties = new Map<string, any>();
  private className = 'ems__Project';
  private frontmatter: Record<string, any> = {};
  private content = '';
  
  constructor(
    private name: string,
    private vaultAdapter: FakeVaultAdapter,
    private graph: IndexedGraph
  ) {}
  
  /**
   * Set the asset class
   */
  withClass(className: string): AssetBuilder {
    this.className = className;
    return this;
  }
  
  /**
   * Add a property to the asset
   */
  withProperty(key: string, value: any): AssetBuilder {
    this.properties.set(key, value);
    this.frontmatter[key] = value;
    return this;
  }
  
  /**
   * Add multiple properties to the asset
   */
  withProperties(properties: Record<string, any>): AssetBuilder {
    Object.entries(properties).forEach(([key, value]) => {
      this.withProperty(key, value);
    });
    return this;
  }
  
  /**
   * Set the asset priority
   */
  withPriority(priority: 'low' | 'medium' | 'high' | 'critical'): AssetBuilder {
    return this.withProperty('priority', priority);
  }
  
  /**
   * Set the asset status
   */
  withStatus(status: string): AssetBuilder {
    return this.withProperty('status', status);
  }
  
  /**
   * Set the asset description
   */
  withDescription(description: string): AssetBuilder {
    return this.withProperty('description', description);
  }
  
  /**
   * Set markdown content for the asset
   */
  withContent(content: string): AssetBuilder {
    this.content = content;
    return this;
  }
  
  /**
   * Add tags to the asset
   */
  withTags(tags: string[]): AssetBuilder {
    return this.withProperty('tags', tags);
  }
  
  /**
   * Build and create the asset
   */
  async build(): Promise<Asset> {
    // Create the Asset entity
    const classNameValue = ClassName.create(this.className);
    if (!classNameValue.isSuccess) {
      throw new Error(`Invalid class name: ${this.className}`);
    }
    
    const assetResult = Asset.create({
      name: this.name,
      className: classNameValue.getValue()!,
      properties: this.properties
    });
    
    if (!assetResult.isSuccess) {
      throw new Error(`Failed to create asset: ${assetResult.getError()}`);
    }
    
    const asset = assetResult.getValue()!;
    
    // Create the file in the vault
    const fileName = `${this.name}.md`;
    const frontmatterSection = this.buildFrontmatter();
    const fileContent = `${frontmatterSection}\n\n${this.content || `# ${this.name}\n`}`;
    
    await this.vaultAdapter.createFile(fileName, fileContent);
    
    // Add triples to the graph
    this.addAssetTriples(asset);
    
    return asset;
  }
  
  /**
   * Build multiple assets with similar pattern
   */
  async buildMultiple(count: number, namePattern?: (index: number) => string): Promise<Asset[]> {
    const assets: Asset[] = [];
    
    for (let i = 0; i < count; i++) {
      const assetName = namePattern ? namePattern(i) : `${this.name}_${i}`;
      const builder = new AssetBuilder(assetName, this.vaultAdapter, this.graph)
        .withClass(this.className)
        .withProperties(Object.fromEntries(this.properties))
        .withContent(this.content);
      
      assets.push(await builder.build());
    }
    
    return assets;
  }
  
  /**
   * Build frontmatter section
   */
  private buildFrontmatter(): string {
    const fm = {
      class: this.className,
      ...this.frontmatter
    };
    
    const yaml = Object.entries(fm)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
    
    return `---\n${yaml}\n---`;
  }
  
  /**
   * Add semantic triples for the asset
   */
  private addAssetTriples(asset: Asset): void {
    const assetIRI = `:${asset.getName().replace(/\s+/g, '_')}`;
    
    // Basic type triple
    this.graph.add(new Triple(
      assetIRI,
      'rdf:type',
      this.className
    ));
    
    // Property triples
    this.properties.forEach((value, property) => {
      this.graph.add(new Triple(
        assetIRI,
        `ems:${property}`,
        typeof value === 'string' ? `"${value}"` : value.toString()
      ));
    });
  }
}

/**
 * Triple Builder for creating semantic triples
 */
export class TripleBuilder {
  private predicate?: string;
  private object?: string;
  
  constructor(
    private subject: string,
    private graph: IndexedGraph
  ) {}
  
  /**
   * Set the predicate
   */
  with(predicate: string): TripleBuilder {
    this.predicate = predicate;
    return this;
  }
  
  /**
   * Set the object and build the triple
   */
  equals(object: string): Triple {
    if (!this.predicate) {
      throw new Error('Predicate must be set before object');
    }
    
    const triple = new Triple(this.subject, this.predicate, object);
    const result = this.graph.add(triple);
    
    if (!result.isSuccess) {
      throw new Error(`Failed to add triple: ${result.getError()}`);
    }
    
    return triple;
  }
  
  /**
   * Create a literal object
   */
  literal(value: string | number | boolean): Triple {
    const literalValue = typeof value === 'string' ? `"${value}"` : value.toString();
    return this.equals(literalValue);
  }
  
  /**
   * Create an IRI object
   */
  iri(iri: string): Triple {
    return this.equals(iri);
  }
}

/**
 * Graph Builder for bulk operations
 */
export class GraphBuilder {
  constructor(private graph: IndexedGraph) {}
  
  /**
   * Add multiple triples from table data
   */
  addTriplesFromTable(triples: Array<{ subject: string; predicate: string; object: string }>): GraphBuilder {
    triples.forEach(row => {
      const triple = new Triple(row.subject, row.predicate, row.object);
      this.graph.add(triple);
    });
    
    return this;
  }
  
  /**
   * Add a complete ontology
   */
  addOntology(ontologyName: string): GraphBuilder {
    // Add basic ontology structure
    this.graph.add(new Triple(`${ontologyName}:`, 'rdf:type', 'owl:Ontology'));
    
    // Add common classes
    const classes = ['Project', 'Task', 'Area', 'Person', 'Document'];
    classes.forEach(cls => {
      this.graph.add(new Triple(`${ontologyName}:${cls}`, 'rdf:type', 'owl:Class'));
    });
    
    // Add common properties
    const properties = ['hasTask', 'assignedTo', 'priority', 'status', 'description'];
    properties.forEach(prop => {
      this.graph.add(new Triple(`${ontologyName}:${prop}`, 'rdf:type', 'owl:ObjectProperty'));
    });
    
    return this;
  }
  
  /**
   * Create a hierarchical structure
   */
  createHierarchy(rootEntity: string, childEntities: string[], relationProperty = 'hasChild'): GraphBuilder {
    childEntities.forEach(child => {
      this.graph.add(new Triple(rootEntity, relationProperty, child));
    });
    
    return this;
  }
  
  /**
   * Get graph statistics
   */
  getStats(): { tripleCount: number; subjects: number; predicates: number; objects: number } {
    return {
      tripleCount: this.graph.size(),
      subjects: this.graph.getSubjects().size,
      predicates: this.graph.getPredicates().size,
      objects: this.graph.getObjects().size
    };
  }
}

/**
 * Scenario Builder for complex test scenarios
 */
export class ScenarioBuilder {
  private assets: AssetBuilder[] = [];
  private triples: TripleBuilder[] = [];
  
  constructor(
    private name: string,
    private vaultAdapter: FakeVaultAdapter,
    private graph: IndexedGraph
  ) {}
  
  /**
   * Add an asset to the scenario
   */
  withAsset(name: string): AssetBuilder {
    const builder = new AssetBuilder(name, this.vaultAdapter, this.graph);
    this.assets.push(builder);
    return builder;
  }
  
  /**
   * Add a triple to the scenario
   */
  withTriple(subject: string): TripleBuilder {
    const builder = new TripleBuilder(subject, this.graph);
    this.triples.push(builder);
    return builder;
  }
  
  /**
   * Create a project management scenario
   */
  projectManagementScenario(): ScenarioBuilder {
    // Create project
    this.withAsset('Enterprise Project')
      .withClass('ems__Project')
      .withStatus('active')
      .withPriority('high')
      .withDescription('Large enterprise project');
    
    // Create tasks
    ['Design Phase', 'Development Phase', 'Testing Phase'].forEach((taskName, index) => {
      this.withAsset(taskName)
        .withClass('ems__Task')
        .withStatus(index === 0 ? 'completed' : 'active')
        .withPriority('medium');
    });
    
    // Create relationships
    this.withTriple(':Enterprise_Project').with('ems:hasTask').equals(':Design_Phase');
    this.withTriple(':Enterprise_Project').with('ems:hasTask').equals(':Development_Phase');
    this.withTriple(':Enterprise_Project').with('ems:hasTask').equals(':Testing_Phase');
    
    return this;
  }
  
  /**
   * Create a knowledge management scenario
   */
  knowledgeManagementScenario(): ScenarioBuilder {
    // Create areas
    this.withAsset('Technology Area')
      .withClass('ems__Area')
      .withDescription('Technology and software development');
    
    // Create concepts
    this.withAsset('Clean Architecture')
      .withClass('ims__Concept')
      .withDescription('Software architecture pattern');
    
    // Create relationships
    this.withTriple(':Technology_Area').with('ems:contains').equals(':Clean_Architecture');
    
    return this;
  }
  
  /**
   * Build all scenario components
   */
  async build(): Promise<{ assets: Asset[]; tripleCount: number }> {
    const assets: Asset[] = [];
    
    // Build all assets
    for (const assetBuilder of this.assets) {
      assets.push(await assetBuilder.build());
    }
    
    // All triples are built when created through TripleBuilder
    
    return {
      assets,
      tripleCount: this.graph.size()
    };
  }
}