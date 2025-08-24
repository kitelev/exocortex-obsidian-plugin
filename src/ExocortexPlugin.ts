import { Plugin } from "obsidian";
import { LifecycleRegistry } from "./infrastructure/lifecycle/LifecycleRegistry";
import { CommandRegistry } from "./presentation/command-controllers/CommandRegistry";
import { ServiceProvider } from "./infrastructure/providers/ServiceProvider";
import { SettingsLifecycleManager } from "./infrastructure/lifecycle/SettingsLifecycleManager";
import { GraphLifecycleManager } from "./infrastructure/lifecycle/GraphLifecycleManager";
import { AssetCommandController } from "./presentation/command-controllers/AssetCommandController";
import { RDFCommandController } from "./presentation/command-controllers/RDFCommandController";
import { QueryProcessor } from "./presentation/processors/QueryProcessor";
import { ExocortexSettings } from "./domain/entities/ExocortexSettings";

/**
 * Main Plugin Class following Single Responsibility Principle
 * Single Responsibility: Coordinate plugin initialization and cleanup
 *
 * This refactored version demonstrates:
 * - Single Responsibility Principle: Only handles plugin coordination
 * - Open/Closed Principle: Extensible through registries
 * - Dependency Inversion: Depends on abstractions, not concretions
 * - Interface Segregation: Uses specific interfaces for different concerns
 * - GRASP Patterns: Controller, Creator, Pure Fabrication
 */
export default class ExocortexPlugin extends Plugin {
  private lifecycleRegistry: LifecycleRegistry;
  private commandRegistry: CommandRegistry;
  private serviceProvider: ServiceProvider;

  // Managers
  private settingsManager: SettingsLifecycleManager;
  private graphManager: GraphLifecycleManager;

  async onload(): Promise<void> {
    try {
      // Initialize registries
      this.lifecycleRegistry = new LifecycleRegistry(this);
      this.commandRegistry = new CommandRegistry(this);

      // Initialize and register lifecycle managers
      await this.initializeLifecycleManagers();

      // Initialize service provider
      await this.initializeServiceProvider();

      // Initialize and register command controllers
      await this.initializeCommandControllers();

      // Initialize all managers
      await this.lifecycleRegistry.initializeAll();

      // Wire up cache invalidation callback
      this.setupCacheInvalidation();

      // Initialize all commands
      await this.commandRegistry.initializeAll();

      console.log("🔍 Exocortex Plugin initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Exocortex Plugin:", error);
      throw error;
    }
  }

  async onunload(): Promise<void> {
    try {
      // Cleanup in reverse order
      await this.commandRegistry?.cleanupAll();
      await this.serviceProvider?.cleanup();
      await this.lifecycleRegistry?.cleanupAll();

      console.log("🔍 Exocortex Plugin cleaned up successfully");
    } catch (error) {
      console.error("Error during plugin cleanup:", error);
    }
  }

  /**
   * Get plugin settings (exposed for settings tab)
   */
  get settings(): ExocortexSettings {
    return this.settingsManager?.getSettings();
  }

  /**
   * Save plugin settings (exposed for settings tab)
   */
  async saveSettings(): Promise<void> {
    await this.settingsManager?.saveSettings();

    // Update dependent services
    this.serviceProvider?.updateServices(this.settings);
  }

  /**
   * Update container (exposed for settings tab)
   */
  updateContainer(): void {
    this.serviceProvider?.updateServices(this.settings);
  }

  private async initializeLifecycleManagers(): Promise<void> {
    // Create and register lifecycle managers
    this.settingsManager = new SettingsLifecycleManager(this);
    this.graphManager = new GraphLifecycleManager(this);

    this.lifecycleRegistry.registerManager(this.settingsManager);
    this.lifecycleRegistry.registerManager(this.graphManager);

    // Initialize settings first (others depend on it)
    await this.settingsManager.initialize();

  }

  private async initializeServiceProvider(): Promise<void> {
    this.serviceProvider = new ServiceProvider(
      this,
      this.graphManager.getGraph(),
      this.settingsManager.getSettings(),
    );
    await this.serviceProvider.initializeServices();
  }

  private async initializeCommandControllers(): Promise<void> {
    // Create and register command controllers
    const assetController = new AssetCommandController(this);
    const rdfController = new RDFCommandController(
      this,
      this.graphManager.getGraph(),
      this.serviceProvider.getService("RDFService"),
      new QueryProcessor(this, this.graphManager.getGraph()),
    );
    this.commandRegistry.registerController(assetController);
    this.commandRegistry.registerController(rdfController);
  }

  private setupCacheInvalidation(): void {
    // Cache invalidation setup (placeholder for future use)
  }
}
