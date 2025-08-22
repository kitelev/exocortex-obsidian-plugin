import { App, TFile } from "obsidian";
import { FileOperationUtils } from "./utils/FileOperationUtils";
import { ErrorHandlingUtils } from "./utils/ErrorHandlingUtils";

/**
 * Abstract base class for file-based repositories
 * Implements DRY principle for common file operations across repositories
 */
export abstract class AbstractFileRepository {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Find file using multiple fallback strategies
   */
  protected findFileWithFallback(criteria: {
    uid?: string;
    storedPath?: string;
    filename?: string;
  }): TFile | null {
    return FileOperationUtils.findFileWithFallback(this.app, criteria);
  }

  /**
   * Get all files filtered by frontmatter property
   */
  protected getFilesWithProperty(
    propertyKey: string,
    propertyValue?: any,
  ): TFile[] {
    return FileOperationUtils.getFilesWithProperty(
      this.app,
      propertyKey,
      propertyValue,
    );
  }

  /**
   * Update file frontmatter while preserving body content
   */
  protected async updateFileFrontmatter(
    file: TFile,
    frontmatter: Record<string, any>,
  ): Promise<void> {
    try {
      await FileOperationUtils.updateFileWithFrontmatter(
        this.app,
        file,
        frontmatter,
      );
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(
        "Update file frontmatter",
        error,
        { filePath: file.path, frontmatter },
      );
      throw error;
    }
  }

  /**
   * Create new file with frontmatter
   */
  protected async createFileWithFrontmatter(
    filename: string,
    frontmatter: Record<string, any>,
  ): Promise<void> {
    try {
      await FileOperationUtils.createFileWithFrontmatter(
        this.app,
        filename,
        frontmatter,
      );
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(
        "Create file with frontmatter",
        error,
        { filename, frontmatter },
      );
      throw error;
    }
  }

  /**
   * Update frontmatter by file path
   */
  protected async updateFrontmatterByPath(
    filePath: string,
    updates: Record<string, any>,
  ): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(filePath);

      if (!(file instanceof TFile)) {
        throw ErrorHandlingUtils.createError(
          "FILE_NOT_FOUND",
          `File not found: ${filePath}`,
        );
      }

      const content = await this.app.vault.read(file);
      const cache = this.app.metadataCache.getFileCache(file);
      const currentFrontmatter = cache?.frontmatter || {};

      // Merge updates with current frontmatter
      const newFrontmatter = FileOperationUtils.mergeFrontmatter(
        currentFrontmatter,
        updates,
      );

      await this.updateFileFrontmatter(file, newFrontmatter);
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(
        "Update frontmatter by path",
        error,
        { filePath, updates },
      );
      throw error;
    }
  }

  /**
   * Extract entity from frontmatter with error handling
   */
  protected extractEntityFromFrontmatter<T>(
    file: TFile,
    extractorFn: (
      frontmatter: Record<string, any>,
      basename: string,
    ) => T | null,
    entityType: string,
  ): T | null {
    try {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache?.frontmatter) {
        return null;
      }

      return extractorFn(cache.frontmatter, file.basename);
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(
        `Extract ${entityType} from frontmatter`,
        error,
        { filePath: file.path },
      );
      return null;
    }
  }

  /**
   * Save entity with consistent error handling
   */
  protected async saveEntityWithFrontmatter<T>(
    entity: T,
    getTitle: (entity: T) => string,
    toFrontmatter: (entity: T) => Record<string, any>,
    findExistingFile: (entity: T) => TFile | null,
    entityType: string,
  ): Promise<void> {
    try {
      const frontmatter = toFrontmatter(entity);
      const existingFile = findExistingFile(entity);

      if (existingFile) {
        await this.updateFileFrontmatter(existingFile, frontmatter);
      } else {
        const fileName = `${getTitle(entity)}.md`;
        await this.createFileWithFrontmatter(fileName, frontmatter);
      }
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(`Save ${entityType}`, error, {
        entity,
      });
      throw error;
    }
  }

  /**
   * Delete file by entity with consistent error handling
   */
  protected async deleteFileByEntity<T>(
    entity: T,
    getTitle: (entity: T) => string,
    entityType: string,
  ): Promise<void> {
    try {
      const fileName = `${getTitle(entity)}.md`;
      const file = this.app.vault.getAbstractFileByPath(fileName);

      if (file) {
        await this.app.vault.delete(file);
      }
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(`Delete ${entityType}`, error, {
        entity,
      });
      throw error;
    }
  }

  /**
   * Check if entity exists with consistent error handling
   */
  protected async entityExists<T>(
    entity: T,
    findEntity: (entity: T) => Promise<T | null>,
    entityType: string,
  ): Promise<boolean> {
    try {
      const found = await findEntity(entity);
      return found !== null;
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(
        `Check ${entityType} existence`,
        error,
        { entity },
      );
      return false;
    }
  }

  /**
   * Find all entities of a type with consistent error handling
   */
  protected async findAllEntities<T>(
    propertyKey: string,
    extractorFn: (
      frontmatter: Record<string, any>,
      basename: string,
    ) => T | null,
    entityType: string,
    additionalFilter?: (file: TFile) => boolean,
  ): Promise<T[]> {
    try {
      const files = this.getFilesWithProperty(propertyKey);
      const entities: T[] = [];

      for (const file of files) {
        if (additionalFilter && !additionalFilter(file)) {
          continue;
        }

        const entity = this.extractEntityFromFrontmatter(
          file,
          extractorFn,
          entityType,
        );

        if (entity) {
          entities.push(entity);
        }
      }

      return entities;
    } catch (error) {
      ErrorHandlingUtils.handleRepositoryError(
        `Find all ${entityType}s`,
        error,
        { propertyKey },
      );
      return [];
    }
  }

  /**
   * Check if reference value matches target asset
   */
  protected isReferencingAsset(
    referenceValue: any,
    assetName: string,
  ): boolean {
    return FileOperationUtils.isReferencingAsset(referenceValue, assetName);
  }
}
