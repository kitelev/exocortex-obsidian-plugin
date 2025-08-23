import { App } from "obsidian";
import { Container } from "../../application/core/Container";

// Port Interfaces
import { INotificationService } from "../../application/ports/INotificationService";
import { IFileSystemAdapter } from "../../application/ports/IFileSystemAdapter";
import { IUIAdapter } from "../../application/ports/IUIAdapter";
import { IVaultAdapter } from "../../application/ports/IVaultAdapter";

// Infrastructure Adapters
import { ObsidianNotificationService } from "../adapters/ObsidianNotificationService";
import { ObsidianFileSystemAdapter } from "../adapters/ObsidianFileSystemAdapter";
import { ObsidianUIAdapter } from "../adapters/ObsidianUIAdapter";
import { ObsidianVaultAdapter } from "../adapters/ObsidianVaultAdapter";

// Repositories
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { IClassViewRepository } from "../../domain/repositories/IClassViewRepository";
import { IButtonRepository } from "../../domain/repositories/IButtonRepository";
import { IClassLayoutRepository } from "../../domain/repositories/IClassLayoutRepository";
import { ObsidianAssetRepository } from "../repositories/ObsidianAssetRepository";
import { ObsidianOntologyRepository } from "../repositories/ObsidianOntologyRepository";
import { ObsidianClassViewRepository } from "../repositories/ObsidianClassViewRepository";
import { ObsidianButtonRepository } from "../repositories/ObsidianButtonRepository";
import { ObsidianClassLayoutRepository } from "../repositories/ObsidianClassLayoutRepository";

// Use Cases
import { CreateAssetUseCase } from "../../application/use-cases/CreateAssetUseCase";
import { CreateChildTaskUseCase } from "../../application/use-cases/CreateChildTaskUseCase";
import { CreateChildAreaUseCase } from "../../application/use-cases/CreateChildAreaUseCase";
import { RenderClassButtonsUseCase } from "../../application/use-cases/RenderClassButtonsUseCase";
import { ExecuteButtonCommandUseCase } from "../../application/use-cases/ExecuteButtonCommandUseCase";
import { PropertyEditingUseCase } from "../../application/use-cases/PropertyEditingUseCase";
import { QueryTemplateUseCase } from "../../application/use-cases/QueryTemplateUseCase";

// Services
import { ICommandExecutor } from "../../application/services/ICommandExecutor";
import { ObsidianCommandExecutor } from "../services/ObsidianCommandExecutor";
import { ErrorHandlerService } from "../../application/services/ErrorHandlerService";
import { OntologyProvisioningService } from "../../domain/services/OntologyProvisioningService";
import { PropertyCacheService } from "../../domain/services/PropertyCacheService";
import { CircuitBreakerService } from "../resilience/CircuitBreakerService";
import { ISuggestionRepository } from "../../domain/repositories/ISuggestionRepository";
import { GraphSuggestionRepository } from "../repositories/GraphSuggestionRepository";
import { IQueryTemplateRepository } from "../../domain/repositories/IQueryTemplateRepository";
import { ObsidianQueryTemplateRepository } from "../repositories/ObsidianQueryTemplateRepository";
import { QueryEngineFactory } from "../query-engines/QueryEngineFactory";
import { QueryEngineService } from "../../application/services/QueryEngineService";
import { QueryEngineConfig } from "../../domain/entities/QueryEngineConfig";
import { RDFService } from "../../application/services/RDFService";

// Presentation
import { ButtonRenderer } from "../../presentation/components/ButtonRenderer";
import { PropertyRenderer } from "../../presentation/components/PropertyRenderer";
import { LayoutRenderer } from "../../presentation/renderers/LayoutRenderer";

// Mobile Components
import { MobileUIComponents } from "../../presentation/components/MobileUIComponents";
import { TouchGraphController } from "../../presentation/mobile/TouchGraphController";
import { MobileModalAdapter } from "../../presentation/mobile/MobileModalAdapter";
import { MobilePerformanceOptimizer } from "../optimizers/MobilePerformanceOptimizer";
import { OfflineDataManager } from "../offline/OfflineDataManager";
import { PlatformDetector } from "../utils/PlatformDetector";

/**
 * Dependency Injection Container Setup
 * Following Clean Architecture - wires up all dependencies
 */
export class DIContainer {
  private static instance: DIContainer;
  private container: Container;

  private plugin: any;

  private constructor(private app: App) {
    this.container = Container.getInstance();
    this.registerDependencies();
  }

  public static initialize(app: App, plugin?: any): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer(app);
    } else {
      // Always update app and plugin references
      DIContainer.instance.app = app;
      if (plugin) {
        DIContainer.instance.plugin = plugin;
      }
      // Re-register dependencies to ensure they use the new app instance
      DIContainer.instance.container.clear();
      DIContainer.instance.registerDependencies();
    }
    if (plugin && !DIContainer.instance.plugin) {
      DIContainer.instance.plugin = plugin;
    }
    return DIContainer.instance;
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      throw new Error(
        "DIContainer not initialized. Call initialize(app) first.",
      );
    }
    return DIContainer.instance;
  }

  /**
   * Async initialize method for backward compatibility
   */
  public async initialize(app: App): Promise<void> {
    // Already initialized in constructor, this is for backward compatibility
    return Promise.resolve();
  }

  /**
   * Reset the container instance (for testing purposes)
   */
  public static reset(): void {
    DIContainer.instance = null as any;
  }

  private registerDependencies(): void {
    // Register Obsidian App
    this.container.register("App", () => this.app);

    // Register Port Implementations
    this.container.register<INotificationService>(
      "INotificationService",
      () => new ObsidianNotificationService(),
    );

    this.container.register<IFileSystemAdapter>(
      "IFileSystemAdapter",
      () => new ObsidianFileSystemAdapter(this.app),
    );

    this.container.register<IUIAdapter>(
      "IUIAdapter",
      () => new ObsidianUIAdapter(this.app),
    );

    this.container.register<IVaultAdapter>(
      "IVaultAdapter",
      () => new ObsidianVaultAdapter(this.app.vault, this.app.metadataCache),
    );

    // Register Repositories
    this.container.register<IAssetRepository>(
      "IAssetRepository",
      () => new ObsidianAssetRepository(this.app),
    );

    this.container.register<IOntologyRepository>(
      "IOntologyRepository",
      () => new ObsidianOntologyRepository(this.app),
    );

    this.container.register<IClassViewRepository>(
      "IClassViewRepository",
      () => new ObsidianClassViewRepository(this.app),
    );

    this.container.register<IButtonRepository>(
      "IButtonRepository",
      () => new ObsidianButtonRepository(this.app),
    );

    this.container.register<IClassLayoutRepository>(
      "IClassLayoutRepository",
      () =>
        new ObsidianClassLayoutRepository(
          this.app,
          this.plugin?.settings?.layoutsFolderPath || "layouts",
        ),
    );

    this.container.register<IQueryTemplateRepository>(
      "IQueryTemplateRepository",
      () =>
        new ObsidianQueryTemplateRepository(
          this.app,
          this.plugin?.settings?.templatesPath || ".exocortex/templates",
          this.plugin?.settings?.templateUsageDataPath ||
            ".exocortex/template-usage.json",
        ),
    );

    // Register Services
    this.container.register<ICommandExecutor>(
      "ICommandExecutor",
      () =>
        new ObsidianCommandExecutor(
          this.app,
          this.container.resolve<IAssetRepository>("IAssetRepository"),
          this.container.resolve<CreateChildTaskUseCase>(
            "CreateChildTaskUseCase",
          ),
        ),
    );

    // Register Error Handler Service
    this.container.register<ErrorHandlerService>(
      "ErrorHandlerService",
      () =>
        new ErrorHandlerService(
          {
            showUserNotification: true,
            logToConsole: true,
            trackMetrics: true,
            autoRecover: false,
          },
          this.container.resolve<INotificationService>("INotificationService"),
        ),
    );

    // Register Autocomplete Services
    this.container.register<ISuggestionRepository>(
      "ISuggestionRepository",
      () => {
        // Need to get graph instance - will be provided by plugin
        const graph = (this.plugin as any)?.graph || null;
        return new GraphSuggestionRepository(graph);
      },
    );


    // Register Query Engine Services
    this.container.register<QueryEngineFactory>("QueryEngineFactory", () => {
      const factory = new QueryEngineFactory(this.app);

      // Try to get Dataview and Datacore APIs if available
      const plugins = (this.app as any).plugins;
      const dataviewApi = plugins?.plugins?.dataview?.api;
      const datacoreApi = plugins?.plugins?.datacore?.api;

      factory.updateApis(dataviewApi, datacoreApi);
      return factory;
    });

    this.container.register<QueryEngineConfig>("QueryEngineConfig", () => {
      // Create default config, could be overridden by plugin settings
      const configResult = QueryEngineConfig.createDefault();
      return configResult.getValue()!;
    });

    this.container.register<QueryEngineService>(
      "QueryEngineService",
      () =>
        new QueryEngineService(
          this.container.resolve<QueryEngineFactory>("QueryEngineFactory"),
          this.container.resolve<QueryEngineConfig>("QueryEngineConfig"),
        ),
    );

    // Register RDF Service - Must be before any dependencies that use it
    this.container.register<RDFService>(
      "RDFService",
      () =>
        new RDFService(
          this.container.resolve<INotificationService>("INotificationService"),
          this.container.resolve<IFileSystemAdapter>("IFileSystemAdapter"),
        ),
    );

    // Register Domain Services
    this.container.register<OntologyProvisioningService>(
      "OntologyProvisioningService",
      () => new OntologyProvisioningService(),
    );

    this.container.register<PropertyCacheService>("PropertyCacheService", () =>
      PropertyCacheService.getInstance(),
    );

    this.container.register<CircuitBreakerService>(
      "CircuitBreakerService",
      () => CircuitBreakerService.getInstance(),
    );

    // Register Use Cases
    this.container.register<CreateAssetUseCase>(
      "CreateAssetUseCase",
      () =>
        new CreateAssetUseCase(
          this.container.resolve<IAssetRepository>("IAssetRepository"),
          this.container.resolve<IOntologyRepository>("IOntologyRepository"),
          this.container.resolve<OntologyProvisioningService>(
            "OntologyProvisioningService",
          ),
        ),
    );

    this.container.register<CreateChildTaskUseCase>(
      "CreateChildTaskUseCase",
      () =>
        new CreateChildTaskUseCase(
          this.container.resolve<IAssetRepository>("IAssetRepository"),
          this.container.resolve<CreateAssetUseCase>("CreateAssetUseCase"),
        ),
    );

    this.container.register<CreateChildAreaUseCase>(
      "CreateChildAreaUseCase",
      () =>
        new CreateChildAreaUseCase(
          this.container.resolve<IAssetRepository>("IAssetRepository"),
          this.container.resolve<CreateAssetUseCase>("CreateAssetUseCase"),
        ),
    );

    this.container.register<RenderClassButtonsUseCase>(
      "RenderClassButtonsUseCase",
      () =>
        new RenderClassButtonsUseCase(
          this.container.resolve<IClassViewRepository>("IClassViewRepository"),
          this.container.resolve<IButtonRepository>("IButtonRepository"),
        ),
    );

    this.container.register<ExecuteButtonCommandUseCase>(
      "ExecuteButtonCommandUseCase",
      () =>
        new ExecuteButtonCommandUseCase(
          this.container.resolve<IButtonRepository>("IButtonRepository"),
          this.container.resolve<ICommandExecutor>("ICommandExecutor"),
        ),
    );

    this.container.register<PropertyEditingUseCase>(
      "PropertyEditingUseCase",
      () =>
        new PropertyEditingUseCase(
          this.container.resolve<IAssetRepository>("IAssetRepository"),
          this.plugin || this.app, // Use plugin if available, otherwise app
        ),
    );

    this.container.register<QueryTemplateUseCase>(
      "QueryTemplateUseCase",
      () =>
        new QueryTemplateUseCase(
          this.container.resolve<IQueryTemplateRepository>(
            "IQueryTemplateRepository",
          ),
        ),
    );

    // Register Presentation Components
    this.container.register<ButtonRenderer>(
      "ButtonRenderer",
      () =>
        new ButtonRenderer(
          this.app,
          this.container.resolve<RenderClassButtonsUseCase>(
            "RenderClassButtonsUseCase",
          ),
          this.container.resolve<ExecuteButtonCommandUseCase>(
            "ExecuteButtonCommandUseCase",
          ),
        ),
    );

    this.container.register<PropertyRenderer>(
      "PropertyRenderer",
      () =>
        new PropertyRenderer(
          this.app,
          this.container.resolve<PropertyEditingUseCase>(
            "PropertyEditingUseCase",
          ),
        ),
    );

    this.container.register<LayoutRenderer>(
      "LayoutRenderer",
      () =>
        new LayoutRenderer(
          this.app,
          this.container.resolve<IClassLayoutRepository>(
            "IClassLayoutRepository",
          ),
        ),
    );

    // Register Mobile Components
    this.container.register<MobilePerformanceOptimizer>(
      "MobilePerformanceOptimizer",
      () =>
        MobilePerformanceOptimizer.getInstance({
          maxMemoryMB: PlatformDetector.isMobile() ? 50 : 200,
          maxCacheEntries: PlatformDetector.isMobile() ? 100 : 500,
          batchSize: PlatformDetector.isMobile() ? 10 : 50,
          debounceMs: PlatformDetector.isMobile() ? 500 : 200,
          enableGCHints: PlatformDetector.isMobile(),
          enableLazyLoading: true,
          virtualScrollThreshold: 100,
        }),
    );

    this.container.register<OfflineDataManager>(
      "OfflineDataManager",
      () =>
        new OfflineDataManager({
          strategy: "indexeddb",
          maxStorageMB: PlatformDetector.isMobile() ? 50 : 200,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          autoSync: true,
          syncIntervalMs: 30000,
          enableConflictResolution: true,
          enableCompression: PlatformDetector.isMobile(),
        }),
    );

    this.container.register<MobileUIComponents>(
      "MobileUIComponents",
      () =>
        new MobileUIComponents(
          this.container.resolve<MobilePerformanceOptimizer>(
            "MobilePerformanceOptimizer",
          ),
        ),
    );

    // TouchGraphController is typically created per graph instance,
    // so we register a factory function
    this.container.register<typeof TouchGraphController>(
      "TouchGraphControllerClass",
      () => TouchGraphController,
    );

    // MobileModalAdapter is typically created per modal,
    // so we register a factory function
    this.container.register<typeof MobileModalAdapter>(
      "MobileModalAdapterClass",
      () => MobileModalAdapter,
    );
  }

  /**
   * Resolve a dependency from the container
   */
  public resolve<T>(token: string): T {
    return this.container.resolve<T>(token);
  }

  /**
   * Get specific use cases for common operations
   */
  public getCreateAssetUseCase(): CreateAssetUseCase {
    return this.resolve<CreateAssetUseCase>("CreateAssetUseCase");
  }

  public getRenderButtonsUseCase(): RenderClassButtonsUseCase {
    return this.resolve<RenderClassButtonsUseCase>("RenderClassButtonsUseCase");
  }

  public getExecuteButtonCommandUseCase(): ExecuteButtonCommandUseCase {
    return this.resolve<ExecuteButtonCommandUseCase>(
      "ExecuteButtonCommandUseCase",
    );
  }

  public getButtonRenderer(): ButtonRenderer {
    return this.resolve<ButtonRenderer>("ButtonRenderer");
  }

  public getPropertyRenderer(): PropertyRenderer {
    return this.resolve<PropertyRenderer>("PropertyRenderer");
  }

  public getLayoutRenderer(): LayoutRenderer {
    return this.resolve<LayoutRenderer>("LayoutRenderer");
  }

  public getPropertyEditingUseCase(): PropertyEditingUseCase {
    return this.resolve<PropertyEditingUseCase>("PropertyEditingUseCase");
  }

  public getQueryTemplateUseCase(): QueryTemplateUseCase {
    return this.resolve<QueryTemplateUseCase>("QueryTemplateUseCase");
  }

  public getQueryTemplateRepository(): IQueryTemplateRepository {
    return this.resolve<IQueryTemplateRepository>("IQueryTemplateRepository");
  }

  public getQueryEngineService(): QueryEngineService {
    return this.resolve<QueryEngineService>("QueryEngineService");
  }

  public getQueryEngineFactory(): QueryEngineFactory {
    return this.resolve<QueryEngineFactory>("QueryEngineFactory");
  }

  public getRDFService(): RDFService {
    return this.resolve<RDFService>("RDFService");
  }

  // Mobile Components Getters
  public getMobilePerformanceOptimizer(): MobilePerformanceOptimizer {
    return this.resolve<MobilePerformanceOptimizer>(
      "MobilePerformanceOptimizer",
    );
  }

  public getOfflineDataManager(): OfflineDataManager {
    return this.resolve<OfflineDataManager>("OfflineDataManager");
  }

  public getMobileUIComponents(): MobileUIComponents {
    return this.resolve<MobileUIComponents>("MobileUIComponents");
  }

  public getTouchGraphControllerClass(): typeof TouchGraphController {
    return this.resolve<typeof TouchGraphController>(
      "TouchGraphControllerClass",
    );
  }

  public getMobileModalAdapterClass(): typeof MobileModalAdapter {
    return this.resolve<typeof MobileModalAdapter>("MobileModalAdapterClass");
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clean up any resources if needed
    this.container.clear();
  }
}
