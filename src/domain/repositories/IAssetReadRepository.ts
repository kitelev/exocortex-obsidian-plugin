import { Asset } from "../entities/Asset";
import { AssetId } from "../value-objects/AssetId";
import { ClassName } from "../value-objects/ClassName";
import { OntologyPrefix } from "../value-objects/OntologyPrefix";
import { AssetSpecification } from "../specifications/AssetSpecification";

/**
 * Query options for repository operations
 */
export interface AssetQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: "title" | "createdAt" | "updatedAt" | "className";
  readonly sortDirection?: "asc" | "desc";
  readonly includeDeleted?: boolean;
}

/**
 * Query result with pagination information
 */
export interface AssetQueryResult {
  readonly assets: Asset[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly offset: number;
  readonly limit: number;
}

/**
 * Asset statistics
 */
export interface AssetStatistics {
  readonly totalAssets: number;
  readonly assetsByClass: Record<string, number>;
  readonly assetsByOntology: Record<string, number>;
  readonly recentlyCreated: number; // Last 7 days
  readonly recentlyUpdated: number; // Last 7 days
}

/**
 * Read-only repository interface for Asset queries (CQRS Query side)
 * Focused on efficient data retrieval without side effects
 */
export interface IAssetReadRepository {
  /**
   * Find an asset by its unique identifier
   */
  findById(id: AssetId): Promise<Asset | null>;

  /**
   * Find multiple assets by their IDs
   */
  findByIds(ids: AssetId[]): Promise<Asset[]>;

  /**
   * Find all assets with pagination
   */
  findAll(options?: AssetQueryOptions): Promise<AssetQueryResult>;

  /**
   * Find assets by specification pattern
   */
  findBySpecification(
    specification: AssetSpecification,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find all assets of a specific class
   */
  findByClass(
    className: ClassName,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find all assets in an ontology
   */
  findByOntology(
    prefix: OntologyPrefix,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets by property value
   */
  findByPropertyValue(
    propertyName: string,
    value: any,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets with a specific property (regardless of value)
   */
  findWithProperty(
    propertyName: string,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets by title pattern (supports regex)
   */
  findByTitlePattern(
    pattern: string | RegExp,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets created within a date range
   */
  findCreatedBetween(
    startDate: Date,
    endDate: Date,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets updated within a date range
   */
  findUpdatedBetween(
    startDate: Date,
    endDate: Date,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find recently created assets
   */
  findRecentlyCreated(
    daysBack?: number,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find recently updated assets
   */
  findRecentlyUpdated(
    daysBack?: number,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets by tags
   */
  findByTag(
    tag: string,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets with any of the specified tags
   */
  findByAnyTag(
    tags: string[],
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets with all of the specified tags
   */
  findByAllTags(
    tags: string[],
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find asset by filename/path
   */
  findByFilename(filename: string): Promise<Asset | null>;

  /**
   * Check if an asset exists
   */
  exists(id: AssetId): Promise<boolean>;

  /**
   * Count assets by specification
   */
  countBySpecification(specification: AssetSpecification): Promise<number>;

  /**
   * Count all assets
   */
  count(): Promise<number>;

  /**
   * Count assets by class
   */
  countByClass(className: ClassName): Promise<number>;

  /**
   * Count assets by ontology
   */
  countByOntology(prefix: OntologyPrefix): Promise<number>;

  /**
   * Get asset statistics
   */
  getStatistics(): Promise<AssetStatistics>;

  /**
   * Get all unique class names in the repository
   */
  getUniqueClasses(): Promise<ClassName[]>;

  /**
   * Get all unique ontology prefixes in the repository
   */
  getUniqueOntologies(): Promise<OntologyPrefix[]>;

  /**
   * Get all unique property names across all assets
   */
  getUniquePropertyNames(): Promise<string[]>;

  /**
   * Get unique values for a specific property
   */
  getUniquePropertyValues(propertyName: string): Promise<any[]>;

  /**
   * Search assets by full-text query
   */
  search(query: string, options?: AssetQueryOptions): Promise<AssetQueryResult>;

  /**
   * Find related assets (assets that reference or are referenced by the given asset)
   */
  findRelatedAssets(
    id: AssetId,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets that reference the given asset
   */
  findReferencingAssets(
    id: AssetId,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Find assets referenced by the given asset
   */
  findReferencedAssets(
    id: AssetId,
    options?: AssetQueryOptions,
  ): Promise<AssetQueryResult>;

  /**
   * Get asset version history (if supported)
   */
  getVersionHistory(id: AssetId): Promise<Asset[]>;

  /**
   * Get asset at specific version (if supported)
   */
  getVersion(id: AssetId, version: number): Promise<Asset | null>;
}
