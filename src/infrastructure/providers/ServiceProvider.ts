import { Plugin } from "obsidian";
import { IServiceProvider } from "../../application/ports/IServiceProvider";
import { ExocortexSettings } from "../../domain/entities/ExocortexSettings";
import { DIContainer } from "../container/DIContainer";
import { PropertyRenderer } from "../../presentation/components/PropertyRenderer";
import { IClassLayoutRepository } from "../../domain/repositories/IClassLayoutRepository";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";

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
      DIContainer.getInstance().resolve<IAssetRepository>("IAssetRepository");
    this.services.set("IAssetRepository", assetRepository);

    // LayoutRenderer removed - handled by UniversalLayoutRenderer and DynamicLayoutRenderer

    // Initialize Property Renderer
    const propertyEditingUseCase =
      DIContainer.getInstance().getPropertyEditingUseCase();
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
