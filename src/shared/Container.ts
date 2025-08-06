/**
 * Simple dependency injection container
 * Manages service registration and resolution
 */
export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(token: string, instance: T): void {
    this.services.set(token, instance);
  }

  /**
   * Register a factory for creating services
   */
  registerFactory<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  /**
   * Resolve a service by token
   */
  resolve<T>(token: string): T {
    // Check for singleton
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    // Check for factory
    if (this.factories.has(token)) {
      const factory = this.factories.get(token);
      const instance = factory!();
      return instance;
    }

    throw new Error(`Service not found: ${token}`);
  }

  /**
   * Check if a service is registered
   */
  has(token: string): boolean {
    return this.services.has(token) || this.factories.has(token);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// Service tokens
export const SERVICE_TOKENS = {
  // Repositories
  ASSET_REPOSITORY: 'IAssetRepository',
  ONTOLOGY_REPOSITORY: 'IOntologyRepository',
  
  // Use Cases
  CREATE_ASSET_USE_CASE: 'CreateAssetUseCase',
  FIND_ONTOLOGIES_USE_CASE: 'FindOntologiesUseCase',
  FIND_CLASSES_USE_CASE: 'FindClassesUseCase',
  
  // Adapters
  VAULT_ADAPTER: 'IVaultAdapter',
  METADATA_ADAPTER: 'IMetadataAdapter',
  
  // Services
  ASSET_SERVICE: 'AssetService',
  ONTOLOGY_SERVICE: 'OntologyService',
  PROPERTY_SERVICE: 'PropertyService',
  
  // Settings
  SETTINGS: 'Settings',
  TEMPLATE_PATH: 'TemplatePath'
};