import { Result } from "../core/Result";
import { QueryEngineType } from "../ports/IQueryEngine";

/**
 * Exocortex Plugin Settings Interface
 * Contains all user-configurable plugin settings
 */
export interface ExocortexSettingsData {
  // Folder Paths
  layoutsFolderPath: string;
  templatesFolderPath: string;
  templateUsageDataPath: string;

  // Query Engine Settings
  preferredQueryEngine: QueryEngineType;
  fallbackQueryEngine: QueryEngineType;
  enableQueryEngineAutoDetect: boolean;

  // Cache Settings
  enableSPARQLCache: boolean;
  sparqlCacheMaxSize: number;
  sparqlCacheTTLMinutes: number;
  enableQueryCache: boolean;
  queryCacheTimeout: number;
  queryCacheMaxSize: number;

  // RDF Export Settings
  defaultRDFFormat: "turtle" | "rdf-xml" | "n-triples" | "json-ld";
  includeInferredTriples: boolean;
  exportNamespaces: boolean;

  // Performance Settings
  maxGraphSize: number;
  batchProcessingSize: number;
  enableLazyLoading: boolean;

  // Mobile/Platform Settings
  enableMobileOptimizations: boolean;
  mobileBatchSize: number;
  enableTouchControls: boolean;

  // Debug Settings
  enableDebugMode: boolean;
  enableVerboseLogging: boolean;
  logSPARQLQueries: boolean;
  enablePerformanceMetrics: boolean;
}

/**
 * Default settings for the Exocortex plugin
 */
export const DEFAULT_SETTINGS: ExocortexSettingsData = {
  // Folder Paths
  layoutsFolderPath: "layouts",
  templatesFolderPath: ".exocortex/templates",
  templateUsageDataPath: ".exocortex/template-usage.json",

  // Query Engine Settings
  preferredQueryEngine: "dataview",
  fallbackQueryEngine: "datacore",
  enableQueryEngineAutoDetect: true,

  // Cache Settings
  enableSPARQLCache: true,
  sparqlCacheMaxSize: 500,
  sparqlCacheTTLMinutes: 5,
  enableQueryCache: true,
  queryCacheTimeout: 30,
  queryCacheMaxSize: 100,

  // RDF Export Settings
  defaultRDFFormat: "turtle",
  includeInferredTriples: false,
  exportNamespaces: true,

  // Performance Settings
  maxGraphSize: 10000,
  batchProcessingSize: 50,
  enableLazyLoading: true,

  // Mobile/Platform Settings
  enableMobileOptimizations: true,
  mobileBatchSize: 10,
  enableTouchControls: true,

  // Debug Settings
  enableDebugMode: false,
  enableVerboseLogging: false,
  logSPARQLQueries: false,
  enablePerformanceMetrics: false,
};

/**
 * Exocortex Settings Entity
 * Manages plugin configuration with validation
 */
export class ExocortexSettings {
  private data: ExocortexSettingsData;

  constructor(data: Partial<ExocortexSettingsData> = {}) {
    this.data = { ...DEFAULT_SETTINGS, ...data };
  }

  /**
   * Create settings from partial data with validation
   */
  public static create(
    data: Partial<ExocortexSettingsData> = {},
  ): Result<ExocortexSettings> {
    try {
      const settings = new ExocortexSettings(data);
      const validation = settings.validate();

      if (validation.isFailure) {
        return Result.fail<ExocortexSettings>(validation.getError());
      }

      return Result.ok<ExocortexSettings>(settings);
    } catch (error) {
      return Result.fail<ExocortexSettings>(
        `Failed to create settings: ${error.message}`,
      );
    }
  }

  /**
   * Validate all settings
   */
  public validate(): Result<void> {
    // Validate folder paths
    if (
      !this.data.layoutsFolderPath ||
      this.data.layoutsFolderPath.trim().length === 0
    ) {
      return Result.fail<void>("Layouts folder path cannot be empty");
    }

    if (
      !this.data.templatesFolderPath ||
      this.data.templatesFolderPath.trim().length === 0
    ) {
      return Result.fail<void>("Templates folder path cannot be empty");
    }

    // Validate cache settings
    if (this.data.sparqlCacheMaxSize < 1) {
      return Result.fail<void>("SPARQL cache max size must be at least 1");
    }

    if (this.data.sparqlCacheTTLMinutes < 1) {
      return Result.fail<void>("SPARQL cache TTL must be at least 1 minute");
    }

    if (this.data.queryCacheMaxSize < 1) {
      return Result.fail<void>("Query cache max size must be at least 1");
    }

    if (this.data.queryCacheTimeout < 1) {
      return Result.fail<void>("Query cache timeout must be at least 1 minute");
    }

    // Validate performance settings
    if (this.data.maxGraphSize < 100) {
      return Result.fail<void>("Max graph size must be at least 100");
    }

    if (this.data.batchProcessingSize < 1) {
      return Result.fail<void>("Batch processing size must be at least 1");
    }

    if (this.data.mobileBatchSize < 1) {
      return Result.fail<void>("Mobile batch size must be at least 1");
    }

    return Result.ok<void>();
  }

  /**
   * Get all settings data
   */
  public getData(): ExocortexSettingsData {
    return { ...this.data };
  }

  /**
   * Update settings with partial data
   */
  public update(updates: Partial<ExocortexSettingsData>): Result<void> {
    const newData = { ...this.data, ...updates };
    const tempSettings = new ExocortexSettings(newData);
    const validation = tempSettings.validate();

    if (validation.isFailure) {
      return Result.fail<void>(validation.getError());
    }

    this.data = newData;
    return Result.ok<void>();
  }

  /**
   * Get specific setting value with type safety
   */
  public get<K extends keyof ExocortexSettingsData>(
    key: K,
  ): ExocortexSettingsData[K] {
    return this.data[key];
  }

  /**
   * Set specific setting value with validation
   */
  public set<K extends keyof ExocortexSettingsData>(
    key: K,
    value: ExocortexSettingsData[K],
  ): Result<void> {
    const updates = { [key]: value } as Partial<ExocortexSettingsData>;
    return this.update(updates);
  }

  /**
   * Reset all settings to defaults
   */
  public resetToDefaults(): void {
    this.data = { ...DEFAULT_SETTINGS };
  }

  /**
   * Convert to JSON for persistence
   */
  public toJSON(): ExocortexSettingsData {
    return this.getData();
  }

  /**
   * Create from JSON data
   */
  public static fromJSON(json: string): Result<ExocortexSettings> {
    try {
      const data = JSON.parse(json);
      return ExocortexSettings.create(data);
    } catch (error) {
      return Result.fail<ExocortexSettings>(
        `Failed to parse settings JSON: ${error.message}`,
      );
    }
  }
}
