import { Asset } from "../entities/Asset";
import { AssetId } from "../value-objects/AssetId";
import { DomainEvent } from "../core/Entity";
import { Result } from "../core/Result";

/**
 * Write operation options
 */
export interface WriteOptions {
  readonly validateBeforeSave?: boolean;
  readonly createBackup?: boolean;
  readonly forceUpdate?: boolean; // Override optimistic locking
  readonly suppressEvents?: boolean; // Don't emit domain events
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  readonly successful: AssetId[];
  readonly failed: Array<{
    id: AssetId;
    error: string;
  }>;
  readonly totalProcessed: number;
}

/**
 * Transaction context for unit of work pattern
 */
export interface TransactionContext {
  readonly id: string;
  readonly startedAt: Date;
  readonly operations: Array<{
    type: "create" | "update" | "delete";
    assetId: AssetId;
    timestamp: Date;
  }>;
}

/**
 * Write-only repository interface for Asset commands (CQRS Command side)
 * Focused on data mutations and business rule enforcement
 */
export interface IAssetWriteRepository {
  /**
   * Save a new asset or update an existing one
   */
  save(asset: Asset, options?: WriteOptions): Promise<Result<void>>;

  /**
   * Create a new asset (fails if already exists)
   */
  create(asset: Asset, options?: WriteOptions): Promise<Result<void>>;

  /**
   * Update an existing asset (fails if doesn't exist)
   */
  update(asset: Asset, options?: WriteOptions): Promise<Result<void>>;

  /**
   * Delete an asset by ID
   */
  delete(id: AssetId, options?: WriteOptions): Promise<Result<void>>;

  /**
   * Soft delete an asset (mark as deleted but keep data)
   */
  softDelete(id: AssetId, options?: WriteOptions): Promise<Result<void>>;

  /**
   * Restore a soft-deleted asset
   */
  restore(id: AssetId, options?: WriteOptions): Promise<Result<void>>;

  /**
   * Permanently delete an asset (hard delete)
   */
  permanentDelete(id: AssetId, options?: WriteOptions): Promise<Result<void>>;

  /**
   * Save multiple assets in a single transaction
   */
  saveMany(assets: Asset[], options?: WriteOptions): Promise<BulkOperationResult>;

  /**
   * Create multiple assets in a single transaction
   */
  createMany(assets: Asset[], options?: WriteOptions): Promise<BulkOperationResult>;

  /**
   * Update multiple assets in a single transaction
   */
  updateMany(assets: Asset[], options?: WriteOptions): Promise<BulkOperationResult>;

  /**
   * Delete multiple assets in a single transaction
   */
  deleteMany(ids: AssetId[], options?: WriteOptions): Promise<BulkOperationResult>;

  /**
   * Update asset frontmatter directly (bypass domain logic)
   * Use with caution - should only be used for infrastructure concerns
   */
  updateFrontmatter(
    path: string,
    frontmatter: Record<string, any>,
    options?: WriteOptions
  ): Promise<Result<void>>;

  /**
   * Begin a transaction for unit of work
   */
  beginTransaction(): Promise<TransactionContext>;

  /**
   * Commit a transaction
   */
  commitTransaction(context: TransactionContext): Promise<Result<void>>;

  /**
   * Rollback a transaction
   */
  rollbackTransaction(context: TransactionContext): Promise<Result<void>>;

  /**
   * Execute operations within a transaction
   */
  executeInTransaction<T>(
    operation: (context: TransactionContext) => Promise<T>
  ): Promise<Result<T>>;

  /**
   * Publish domain events from entities
   */
  publishDomainEvents(events: DomainEvent[]): Promise<void>;

  /**
   * Clear domain events (typically after publishing)
   */
  clearDomainEvents(asset: Asset): void;

  /**
   * Validate asset before save (business rules)
   */
  validateForSave(asset: Asset): Promise<Result<void>>;

  /**
   * Validate asset before delete (business rules)
   */
  validateForDelete(id: AssetId): Promise<Result<void>>;

  /**
   * Check for optimistic locking conflicts
   */
  checkConcurrencyConflict(asset: Asset): Promise<Result<void>>;

  /**
   * Create a backup of an asset before modification
   */
  createBackup(id: AssetId): Promise<Result<void>>;

  /**
   * Restore an asset from backup
   */
  restoreFromBackup(id: AssetId, backupTimestamp: Date): Promise<Result<Asset>>;

  /**
   * Clean up old backups
   */
  cleanupBackups(olderThanDays: number): Promise<Result<number>>;

  /**
   * Migrate assets to new version/schema
   */
  migrateAssets(
    migrationFunction: (asset: Asset) => Promise<Asset | null>,
    options?: WriteOptions
  ): Promise<BulkOperationResult>;

  /**
   * Repair corrupted assets
   */
  repairCorruptedAssets(): Promise<BulkOperationResult>;

  /**
   * Synchronize assets with file system
   */
  synchronizeWithFileSystem(): Promise<BulkOperationResult>;

  /**
   * Update asset indexes for performance
   */
  updateIndexes(): Promise<Result<void>>;

  /**
   * Compact storage (remove unused space)
   */
  compact(): Promise<Result<void>>;

  /**
   * Get repository health status
   */
  getHealthStatus(): Promise<{
    isHealthy: boolean;
    issues: string[];
    lastCheck: Date;
    metrics: {
      totalAssets: number;
      corruptedAssets: number;
      orphanedFiles: number;
      indexHealth: "good" | "degraded" | "poor";
    };
  }>;
}

/**
 * Event handler for domain events
 */
export interface IDomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Domain event dispatcher
 */
export interface IDomainEventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
  register<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void;
  unregister(eventType: string, handler: IDomainEventHandler<any>): void;
}

/**
 * Asset change tracking
 */
export interface AssetChangeTracker {
  trackChange(
    assetId: AssetId,
    changeType: "created" | "updated" | "deleted",
    changes: Record<string, { oldValue: any; newValue: any }>
  ): void;
  
  getChanges(assetId: AssetId): Array<{
    timestamp: Date;
    changeType: string;
    changes: Record<string, { oldValue: any; newValue: any }>;
  }>;
  
  clearChanges(assetId: AssetId): void;
}

/**
 * Asset validation context
 */
export interface AssetValidationContext {
  readonly isCreating: boolean;
  readonly isUpdating: boolean;
  readonly isDeleting: boolean;
  readonly currentAsset?: Asset;
  readonly proposedAsset?: Asset;
  readonly validationRules: string[];
}

/**
 * Asset save context with additional metadata
 */
export interface AssetSaveContext {
  readonly asset: Asset;
  readonly isNew: boolean;
  readonly changes: string[];
  readonly userId?: string;
  readonly source: "ui" | "api" | "sync" | "migration";
  readonly metadata: Record<string, any>;
}