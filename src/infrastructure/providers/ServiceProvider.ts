import { Plugin } from "obsidian";
import { IServiceProvider } from "../../application/ports/IServiceProvider";
import { ExocortexSettings } from "../../domain/entities/ExocortexSettings";
import { DIContainer } from "../container/DIContainer";
import { LayoutRenderer } from "../../presentation/renderers/LayoutRenderer";
import { PropertyRenderer } from "../../presentation/components/PropertyRenderer";
import { IClassLayoutRepository } from "../../domain/repositories/IClassLayoutRepository";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { PropertyEditingUseCase } from "../../application/use-cases/PropertyEditingUseCase";

/**
 * Service Provider following Creator Pattern (GRASP)
 * Single Responsibility: Create and manage application services
 */
export class ServiceProvider implements IServiceProvider {
  private readonly services = new Map<string, any>();
  private container: DIContainer;

  constructor(
    private readonly plugin: Plugin,
    private readonly settings: ExocortexSettings,
  ) {}

  async initializeServices(): Promise<void> {
    // Initialize DI container
    DIContainer.initialize(this.plugin.app, this.plugin as any);
    this.container = DIContainer.getInstance();

    // Initialize Asset Repository - Required for UniversalLayoutRenderer
    const assetRepository =
      this.container.resolve<IAssetRepository>("IAssetRepository");
    this.services.set("IAssetRepository", assetRepository);

    // Initialize Layout Renderer with proper dependencies
    const layoutRepository = this.container.resolve<IClassLayoutRepository>(
      "IClassLayoutRepository",
    );
    const layoutRenderer = new LayoutRenderer(
      this.plugin.app,
      layoutRepository,
    );
    this.services.set("LayoutRenderer", layoutRenderer);

    // Initialize Property Renderer
    const propertyEditingUseCase = this.container.getPropertyEditingUseCase();
    const propertyRenderer = new PropertyRenderer(
      this.plugin.app,
      propertyEditingUseCase,
    );
    this.services.set("PropertyRenderer", propertyRenderer);
  }

  getService<T>(serviceType: string): T {
    const service = this.services.get(serviceType);
    if (!service) {
      throw new Error(`Service ${serviceType} not found`);
    }
    return service as T;
  }

  hasService(serviceType: string): boolean {
    return this.services.has(serviceType);
  }

  async cleanup(): Promise<void> {
    this.services.clear();
  }

  /**
   * Update services with new settings
   */
  updateServices(settings: ExocortexSettings): void {
    try {
      // Re-initialize DI container to pick up new settings
      DIContainer.initialize(this.plugin.app, this.plugin as any);
      this.container = DIContainer.getInstance();
    } catch (error) {
      console.error("Error updating services:", error);
    }
  }
}
