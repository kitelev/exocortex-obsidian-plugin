import { Plugin } from "obsidian";
import { LifecycleRegistry } from "./infrastructure/lifecycle/LifecycleRegistry";
import { CommandRegistry } from "./presentation/command-controllers/CommandRegistry";
import { ServiceProvider } from "./infrastructure/providers/ServiceProvider";
import { SettingsLifecycleManager } from "./infrastructure/lifecycle/SettingsLifecycleManager";
import { AssetCommandController } from "./presentation/command-controllers/AssetCommandController";
import { MaintenanceCommandController } from "./presentation/command-controllers/MaintenanceCommandController";
import { CodeBlockProcessor } from "./presentation/processors/CodeBlockProcessor";
import { RefactoredUniversalLayoutRenderer } from "./presentation/renderers/RefactoredUniversalLayoutRenderer";
import { AssetListRenderer } from "./presentation/renderers/AssetListRenderer";
import { DynamicLayoutRenderer } from "./presentation/renderers/DynamicLayoutRenderer";
import { ExocortexSettings } from "./domain/entities/ExocortexSettings";
import { ILogger } from "./application/ports/ILogger";
import { LoggerFactory } from "./infrastructure/logging/LoggerFactory";
import { LoggerConfigFactory } from "./infrastructure/logging/LoggerConfig";
import { LogLevel } from "./application/ports/ILogger";
import { PropertyCacheService } from "./domain/services/PropertyCacheService";

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
  private logger: ILogger;
  private lifecycleRegistry: LifecycleRegistry;
  private commandRegistry: CommandRegistry;
  private serviceProvider: ServiceProvider;
  private codeBlockProcessor: CodeBlockProcessor;

  // Managers
  private settingsManager: SettingsLifecycleManager;

  async onload(): Promise<void> {
    try {
      // Initialize logger first
      this.logger = LoggerFactory.createForClass(ExocortexPlugin);
      this.logger.startTiming("plugin-onload");

      // Initialize registries
      this.lifecycleRegistry = new LifecycleRegistry(this);
      this.commandRegistry = new CommandRegistry(this);

      // Initialize and register lifecycle managers
      await this.initializeLifecycleManagers();

      // Initialize service provider
      await this.initializeServiceProvider();

      // Apply logging configuration from settings
      this.applyLoggingConfigFromSettings();

      // Initialize and register command controllers
      await this.initializeCommandControllers();

      // Initialize all managers
      await this.lifecycleRegistry.initializeAll();

      // Wire up cache invalidation callback
      this.setupCacheInvalidation();

      // Initialize all commands
      await this.commandRegistry.initializeAll();

      // Initialize code block processor
      await this.initializeCodeBlockProcessor();

      this.logger.endTiming("plugin-onload");
      this.logger.info("Exocortex Plugin initialized successfully", {
        managers: ["lifecycle", "settings"],
        controllers: ["asset"],
        processors: ["codeBlock"],
      });
    } catch (error) {
      this.logger?.error(
        "Failed to initialize Exocortex Plugin",
        {
          stage: "onload",
        },
        error as Error,
      );
      throw error;
    }
  }

  async onunload(): Promise<void> {
    try {
      this.logger?.startTiming("plugin-onunload");

      // Cleanup in reverse order
      await this.commandRegistry?.cleanupAll();
      await this.serviceProvider?.cleanup();
      await this.lifecycleRegistry?.cleanupAll();

      this.logger?.endTiming("plugin-onunload");
      this.logger?.info("Exocortex Plugin cleaned up successfully", {
        cleanedUp: ["commands", "services", "lifecycle"],
      });
    } catch (error) {
      this.logger?.error(
        "Error during plugin cleanup",
        {
          stage: "onunload",
        },
        error as Error,
      );
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

    this.lifecycleRegistry.registerManager(this.settingsManager);

    // Settings will be initialized later by lifecycleRegistry.initializeAll()
    // Load settings early so they're available for other components
    await this.settingsManager.loadSettings();
  }

  private async initializeServiceProvider(): Promise<void> {
    this.serviceProvider = new ServiceProvider(
      this,
      this.settingsManager.getSettings(),
    );
    await this.serviceProvider.initializeServices();
  }

  private async initializeCommandControllers(): Promise<void> {
    // Create and register command controllers
    const assetController = new AssetCommandController(this);
    this.commandRegistry.registerController(assetController);

    // Maintenance/utility commands
    const maintenance = new MaintenanceCommandController(this);
    this.commandRegistry.registerController(maintenance);
  }

  /**
   * Public: refresh all rendered views
   */
  public async refreshViews(): Promise<void> {
    await this.codeBlockProcessor?.refreshViews();
  }

  /**
   * Public: derive logger config from settings and apply
   */
  public applyLoggingConfigFromSettings(): void {
    const s = this.settings;
    const cfg = LoggerConfigFactory.createDefault();

    // Enable logs in production only when explicitly requested
    const enableLogs = !!(s.get("enableVerboseLogging") || s.get("enableDebugMode"));
    cfg.enabledInProduction = enableLogs;
    cfg.enabledInDevelopment = true;

    // Level
    cfg.level = enableLogs ? LogLevel.DEBUG : LogLevel.WARN;
    cfg.includeStackTrace = enableLogs;
    cfg.formatJson = false; // more readable in Obsidian console

    // Performance threshold based on settings
    cfg.performanceThreshold = s.get("enablePerformanceMetrics") ? 50 : 150;

    LoggerFactory.setConfig(cfg);
    this.logger?.info("Logger configuration updated", {
      enabledInProd: cfg.enabledInProduction,
      level: LogLevel[cfg.level],
      perfThreshold: cfg.performanceThreshold,
    });
  }

  /**
   * Public: lightweight diagnostics for status modal
   */
  public async getDiagnostics(): Promise<{
    activeViews: number;
    cacheSize: number;
    loggerLevel: string;
    performanceThresholdMs: number;
    settings: Record<string, any>;
  }> {
    const cfg = LoggerFactory.getConfig();
    const cacheSize = PropertyCacheService.getInstance().getSize?.() ?? 0;
    const activeViews = this.codeBlockProcessor?.getActiveViewCount?.() ?? 0;
    return {
      activeViews,
      cacheSize,
      loggerLevel: LogLevel[cfg.level],
      performanceThresholdMs: cfg.performanceThreshold,
      settings: {
        enableDebugMode: this.settings.get("enableDebugMode"),
        enableVerboseLogging: this.settings.get("enableVerboseLogging"),
        enablePerformanceMetrics: this.settings.get("enablePerformanceMetrics"),
      },
    };
  }

  private setupCacheInvalidation(): void {
    // Cache invalidation setup (placeholder for future use)
  }

  /**
   * Initialize the code block processor for 'exocortex' code blocks
   */
  private async initializeCodeBlockProcessor(): Promise<void> {
    try {
      // Create the code block processor
      this.codeBlockProcessor = new CodeBlockProcessor(this.serviceProvider);

      // Register view renderers
      const universalLayoutRenderer = new RefactoredUniversalLayoutRenderer(
        this.app,
        this.serviceProvider,
      );
      const assetListRenderer = new AssetListRenderer(this.serviceProvider);
      const dynamicLayoutRenderer = new DynamicLayoutRenderer(this.app);

      this.codeBlockProcessor.registerView(
        "UniversalLayout",
        universalLayoutRenderer,
      );
      this.codeBlockProcessor.registerView("AssetList", assetListRenderer);
      this.codeBlockProcessor.registerView(
        "DynamicLayout",
        dynamicLayoutRenderer,
      );

      // Register the markdown code block processor with Obsidian
      this.registerMarkdownCodeBlockProcessor(
        "exocortex",
        async (source, el, ctx) => {
          await this.codeBlockProcessor.processCodeBlock(source, el, ctx);
        },
      );

      // Set up file change listener for live updates
      this.registerEvent(
        this.app.vault.on("modify", async () => {
          await this.codeBlockProcessor.refreshViews();
        }),
      );

      // Set up metadata cache change listener
      this.registerEvent(
        this.app.metadataCache.on("changed", async () => {
          await this.codeBlockProcessor.refreshViews();
        }),
      );

      this.logger.info("Code block processor initialized with views", {
        views: ["UniversalLayout", "AssetList", "DynamicLayout"],
        updateListeners: ["vault.modify", "metadataCache.changed"],
      });
    } catch (error) {
      this.logger.error("Failed to initialize code block processor", { error });
      throw error;
    }
  }
}
