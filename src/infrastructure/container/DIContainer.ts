import { App } from "obsidian";
import { Container } from "../../application/core/Container";

// Port Interfaces
import { INotificationService } from "../../application/ports/INotificationService";
import { IUIAdapter } from "../../application/ports/IUIAdapter";
import { IVaultAdapter } from "../../application/ports/IVaultAdapter";

// Infrastructure Adapters
import { ObsidianNotificationService } from "../adapters/ObsidianNotificationService";
import { ObsidianUIAdapter } from "../adapters/ObsidianUIAdapter";
import { ObsidianVaultAdapter } from "../adapters/ObsidianVaultAdapter";

// Repositories
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { IOntologyRepository } from "../../domain/repositories/IOntologyRepository";
import { IClassViewRepository } from "../../domain/repositories/IClassViewRepository";
import { IClassLayoutRepository } from "../../domain/repositories/IClassLayoutRepository";
import { ObsidianAssetRepository } from "../repositories/ObsidianAssetRepository";
import { ObsidianOntologyRepository } from "../repositories/ObsidianOntologyRepository";
import { ObsidianClassViewRepository } from "../repositories/ObsidianClassViewRepository";
import { ObsidianClassLayoutRepository } from "../repositories/ObsidianClassLayoutRepository";

// Use Cases
import { CreateAssetUseCase } from "../../application/use-cases/CreateAssetUseCase";
import { PropertyEditingUseCase } from "../../application/use-cases/PropertyEditingUseCase";

// Services
import { ICommandExecutor } from "../../application/services/ICommandExecutor";
import { ObsidianCommandExecutor } from "../services/ObsidianCommandExecutor";
import { ErrorHandlerService } from "../../application/services/ErrorHandlerService";
import { OntologyProvisioningService } from "../../domain/services/OntologyProvisioningService";
import { PropertyCacheService } from "../../domain/services/PropertyCacheService";
import { CircuitBreakerService } from "../resilience/CircuitBreakerService";

// Presentation
import { PropertyRenderer } from "../../presentation/components/PropertyRenderer";

// Logging
import { ILogger } from "../../application/ports/ILogger";
import { LoggerFactory } from "../logging/LoggerFactory";

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

    // Register Logger Factory
    this.container.register<ILogger>("ILogger", () =>
      LoggerFactory.create("DIContainer"),
    );

    // Register Logger Factory itself for creating named loggers
    this.container.register("LoggerFactory", () => LoggerFactory);

    // Register Port Implementations
    this.container.register<INotificationService>(
      "INotificationService",
      () => new ObsidianNotificationService(),
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

    this.container.register<IClassLayoutRepository>(
      "IClassLayoutRepository",
      () =>
        new ObsidianClassLayoutRepository(
          this.app,
          this.plugin?.settings?.layoutsFolderPath || "layouts",
        ),
    );

    // Register Services
    this.container.register<ICommandExecutor>(
      "ICommandExecutor",
      () =>
        new ObsidianCommandExecutor(
          this.app,
          this.container.resolve<IAssetRepository>("IAssetRepository"),
          null,
        ),
    );

    // Register Error Handler Service
    this.container.register<ErrorHandlerService>(
      "ErrorHandlerService",
      () =>
        new ErrorHandlerService(
          LoggerFactory.createForClass(ErrorHandlerService),
          {
            showUserNotification: true,
            logToConsole: true,
            trackMetrics: true,
            autoRecover: false,
          },
          this.container.resolve<INotificationService>("INotificationService"),
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

    this.container.register<PropertyEditingUseCase>(
      "PropertyEditingUseCase",
      () =>
        new PropertyEditingUseCase(
          this.container.resolve<IAssetRepository>("IAssetRepository"),
          this.plugin || this.app, // Use plugin if available, otherwise app
        ),
    );

    // Register Presentation Components

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

    // Register Mobile Components
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

  public getPropertyRenderer(): PropertyRenderer {
    return this.resolve<PropertyRenderer>("PropertyRenderer");
  }

  public getPropertyEditingUseCase(): PropertyEditingUseCase {
    return this.resolve<PropertyEditingUseCase>("PropertyEditingUseCase");
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clean up any resources if needed
    this.container.clear();
  }
}
