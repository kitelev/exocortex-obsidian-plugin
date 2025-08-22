import { App, TFile } from "obsidian";
import { IAssetRepository } from "../../domain/repositories/IAssetRepository";
import { Asset } from "../../domain/entities/Asset";
import { AssetId } from "../../domain/value-objects/AssetId";
import { ClassName } from "../../domain/value-objects/ClassName";
import { OntologyPrefix } from "../../domain/value-objects/OntologyPrefix";
import { AbstractFileRepository } from "../../shared/AbstractFileRepository";
import { FileOperationUtils } from "../../shared/utils/FileOperationUtils";

/**
 * Obsidian implementation of IAssetRepository
 * Handles asset persistence using Obsidian vault
 */
export class ObsidianAssetRepository extends AbstractFileRepository implements IAssetRepository {
  constructor(app: App) {
    super(app);
  }

  async findById(id: AssetId): Promise<Asset | null> {
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter?.["exo__Asset_uid"] === id.toString()) {
        const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
        // Only return valid assets - invalid ones are silently ignored
        if (asset) {
          return asset;
        }
      }
    }

    return null;
  }

  async findByClass(className: ClassName): Promise<Asset[]> {
    const files = this.app.vault.getMarkdownFiles();
    const assets: Asset[] = [];

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        const classes = cache.frontmatter["exo__Instance_class"];
        const classArray = Array.isArray(classes) ? classes : [classes];

        if (
          classArray.some(
            (c) => c === className.toWikiLink() || c === className.toString(),
          )
        ) {
          const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
          // Only include valid assets - invalid ones are silently ignored
          if (asset) {
            assets.push(asset);
          }
        }
      }
    }

    return assets;
  }

  async findByOntology(prefix: OntologyPrefix): Promise<Asset[]> {
    const files = this.app.vault.getMarkdownFiles();
    const assets: Asset[] = [];

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        const ontology = cache.frontmatter["exo__Asset_isDefinedBy"];
        const ontologyValue = ontology?.replace(/\[\[!?|\]\]/g, "");

        if (ontologyValue === prefix.toString()) {
          const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
          // Only include valid assets - invalid ones are silently ignored
          if (asset) {
            assets.push(asset);
          }
        }
      }
    }

    return assets;
  }

  async save(asset: Asset): Promise<void> {
    await this.saveEntityWithFrontmatter(
      asset,
      (a) => a.getTitle(),
      (a) => a.toFrontmatter(),
      (a) => this.findExistingAssetFile(a),
      "Asset"
    );
  }

  private findExistingAssetFile(asset: Asset): TFile | null {
    const frontmatter = asset.toFrontmatter();
    const storedPath = (asset as any).props?.filePath;
    const assetId = frontmatter["exo__Asset_uid"];
    const filename = asset.getTitle();

    return this.findFileWithFallback({
      uid: assetId,
      storedPath,
      filename,
    });
  }

  async delete(id: AssetId): Promise<void> {
    const asset = await this.findById(id);
    if (asset) {
      await this.deleteFileByEntity(
        asset,
        (a) => a.getTitle(),
        "Asset"
      );
    }
  }

  async exists(id: AssetId): Promise<boolean> {
    try {
      const found = await this.findById(id);
      return found !== null;
    } catch (error) {
      console.error("Error checking asset existence:", error);
      return false;
    }
  }

  async findAll(): Promise<Asset[]> {
    const files = this.app.vault.getMarkdownFiles();
    const assets: Asset[] = [];

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter?.["exo__Asset_uid"]) {
        const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
        // Only include valid assets - invalid ones are silently ignored
        if (asset) {
          assets.push(asset);
        }
      }
    }

    return assets;
  }

  async findByFilename(filename: string): Promise<Asset | null> {
    // Handle different filename formats
    let searchPath = filename;

    // Add .md extension if not present
    if (!searchPath.endsWith(".md")) {
      searchPath = `${searchPath}.md`;
    }

    // Try to find by path first
    let file = this.app.vault.getAbstractFileByPath(searchPath);

    // If not found, search all files by basename
    if (!file) {
      const files = this.app.vault.getMarkdownFiles();
      file =
        files.find((f) => f.path === searchPath || f.name === searchPath) ||
        null;
    }

    if (file instanceof TFile) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
        // Only return valid assets - invalid ones are silently ignored
        if (asset) {
          // Store the file path for later use in save
          (asset as any).props.filePath = file.path;
          return asset;
        }
      }
    }

    return null;
  }

  /**
   * Update only the frontmatter of a file by path
   */
  async updateFrontmatterByPath(
    filePath: string,
    updates: Record<string, any>,
  ): Promise<void> {
    await super.updateFrontmatterByPath(filePath, updates);
  }
}
