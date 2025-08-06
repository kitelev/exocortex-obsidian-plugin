import { Container, SERVICE_TOKENS } from '../../src/shared/Container';
import { FakeVaultAdapter } from './FakeVaultAdapter';
import { AssetRepository } from '../../src/infrastructure/repositories/AssetRepository';
import { CreateAssetUseCase } from '../../src/application/use-cases/CreateAssetUseCase';
import { IOntologyRepository } from '../../src/domain/repositories/IOntologyRepository';
import { Ontology } from '../../src/domain/entities/Ontology';
import { OntologyPrefix } from '../../src/domain/value-objects/OntologyPrefix';

/**
 * Test context that sets up all dependencies for testing
 * Provides a complete test environment with fake implementations
 */
export class TestContext {
  public container: Container;
  public vaultAdapter: FakeVaultAdapter;
  public assetRepository: AssetRepository;
  public ontologyRepository: IOntologyRepository;
  public createAssetUseCase: CreateAssetUseCase;

  constructor() {
    this.container = Container.getInstance();
    this.container.clear(); // Clear any existing registrations
    
    this.setupFakeImplementations();
    this.registerServices();
  }

  private setupFakeImplementations(): void {
    // Create fake vault adapter
    this.vaultAdapter = new FakeVaultAdapter();
    
    // Create repository with fake adapter
    this.assetRepository = new AssetRepository(this.vaultAdapter);
    
    // Create fake ontology repository
    this.ontologyRepository = new FakeOntologyRepository();
    
    // Create use case with repositories
    this.createAssetUseCase = new CreateAssetUseCase(
      this.assetRepository,
      this.ontologyRepository
    );
  }

  private registerServices(): void {
    // Register all services in container
    this.container.registerSingleton(SERVICE_TOKENS.VAULT_ADAPTER, this.vaultAdapter);
    this.container.registerSingleton(SERVICE_TOKENS.ASSET_REPOSITORY, this.assetRepository);
    this.container.registerSingleton(SERVICE_TOKENS.ONTOLOGY_REPOSITORY, this.ontologyRepository);
    this.container.registerSingleton(SERVICE_TOKENS.CREATE_ASSET_USE_CASE, this.createAssetUseCase);
    
    // Register default settings
    this.container.registerSingleton(SERVICE_TOKENS.SETTINGS, {
      defaultOntology: 'exo',
      enableAutoLayout: true,
      debugMode: false,
      templateFolderPath: 'templates'
    });
  }

  /**
   * Setup default test data
   */
  async setupDefaultData(): Promise<void> {
    // Add default ontologies
    const exoOntology = new Ontology({
      prefix: new OntologyPrefix('exo'),
      label: 'EXO Core',
      fileName: '!exo'
    });
    
    const emsOntology = new Ontology({
      prefix: new OntologyPrefix('ems'),
      label: 'EMS',
      fileName: '!ems'
    });
    
    await (this.ontologyRepository as FakeOntologyRepository).addOntology(exoOntology);
    await (this.ontologyRepository as FakeOntologyRepository).addOntology(emsOntology);
  }

  /**
   * Clean up test context
   */
  cleanup(): void {
    this.vaultAdapter.clear();
    this.container.clear();
  }
}

/**
 * Fake implementation of IOntologyRepository for testing
 */
class FakeOntologyRepository implements IOntologyRepository {
  private ontologies: Map<string, Ontology> = new Map();

  async findByPrefix(prefix: OntologyPrefix): Promise<Ontology | null> {
    return this.ontologies.get(prefix.toString()) || null;
  }

  async findAll(): Promise<Ontology[]> {
    return Array.from(this.ontologies.values());
  }

  async save(ontology: Ontology): Promise<void> {
    this.ontologies.set(ontology.getPrefix().toString(), ontology);
  }

  async exists(prefix: OntologyPrefix): Promise<boolean> {
    return this.ontologies.has(prefix.toString());
  }

  // Helper method for testing
  async addOntology(ontology: Ontology): Promise<void> {
    await this.save(ontology);
  }

  clear(): void {
    this.ontologies.clear();
  }
}