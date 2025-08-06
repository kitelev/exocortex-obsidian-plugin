import { Asset } from '../../domain/entities/Asset';
import { AssetId } from '../../domain/value-objects/AssetId';
import { ClassName } from '../../domain/value-objects/ClassName';
import { OntologyPrefix } from '../../domain/value-objects/OntologyPrefix';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { IVaultAdapter } from '../../application/ports/IVaultAdapter';
import * as yaml from 'js-yaml';

/**
 * Concrete implementation of IAssetRepository using Obsidian vault
 * Handles persistence of assets as markdown files
 */
export class AssetRepository implements IAssetRepository {
  constructor(
    private readonly vaultAdapter: IVaultAdapter,
    private readonly templatePath?: string
  ) {}

  async findById(id: AssetId): Promise<Asset | null> {
    const files = await this.vaultAdapter.list();
    
    for (const path of files) {
      if (this.isTemplateFile(path)) continue;
      
      const metadata = await this.vaultAdapter.getMetadata(path);
      if (metadata && metadata['exo__Asset_uid'] === id.toString()) {
        const fileName = path.split('/').pop()?.replace('.md', '') || '';
        return Asset.fromFrontmatter(metadata, fileName);
      }
    }
    
    return null;
  }

  async findByClass(className: ClassName): Promise<Asset[]> {
    const assets: Asset[] = [];
    const files = await this.vaultAdapter.list();
    
    for (const path of files) {
      if (this.isTemplateFile(path)) continue;
      
      const metadata = await this.vaultAdapter.getMetadata(path);
      if (metadata) {
        const classValue = this.extractClassName(metadata);
        if (classValue === className.toString()) {
          const fileName = path.split('/').pop()?.replace('.md', '') || '';
          assets.push(Asset.fromFrontmatter(metadata, fileName));
        }
      }
    }
    
    return assets;
  }

  async findByOntology(prefix: OntologyPrefix): Promise<Asset[]> {
    const assets: Asset[] = [];
    const files = await this.vaultAdapter.list();
    
    for (const path of files) {
      if (this.isTemplateFile(path)) continue;
      
      const metadata = await this.vaultAdapter.getMetadata(path);
      if (metadata) {
        const ontologyValue = this.extractOntologyPrefix(metadata);
        if (ontologyValue === prefix.toString()) {
          const fileName = path.split('/').pop()?.replace('.md', '') || '';
          assets.push(Asset.fromFrontmatter(metadata, fileName));
        }
      }
    }
    
    return assets;
  }

  async save(asset: Asset): Promise<void> {
    const fileName = `${asset.getTitle()}.md`;
    const frontmatter = asset.toFrontmatter();
    
    const content = this.createMarkdownContent(frontmatter);
    
    const existingPath = await this.findAssetPath(asset.getId());
    if (existingPath) {
      await this.vaultAdapter.update(existingPath, content);
    } else {
      await this.vaultAdapter.create(fileName, content);
    }
  }

  async delete(id: AssetId): Promise<void> {
    const path = await this.findAssetPath(id);
    if (path) {
      await this.vaultAdapter.delete(path);
    }
  }

  async exists(id: AssetId): Promise<boolean> {
    const asset = await this.findById(id);
    return asset !== null;
  }

  async findAll(): Promise<Asset[]> {
    const assets: Asset[] = [];
    const files = await this.vaultAdapter.list();
    
    for (const path of files) {
      if (this.isTemplateFile(path)) continue;
      
      const metadata = await this.vaultAdapter.getMetadata(path);
      if (metadata && metadata['exo__Instance_class']) {
        const fileName = path.split('/').pop()?.replace('.md', '') || '';
        try {
          assets.push(Asset.fromFrontmatter(metadata, fileName));
        } catch (error) {
          // Skip invalid assets
          console.warn(`Failed to parse asset from ${path}:`, error);
        }
      }
    }
    
    return assets;
  }

  async findByFilename(filename: string): Promise<Asset | null> {
    // Handle different filename formats
    let searchPath = filename;
    
    // Add .md extension if not present
    if (!searchPath.endsWith('.md')) {
      searchPath = `${searchPath}.md`;
    }
    
    // Check if file exists
    if (await this.vaultAdapter.exists(searchPath)) {
      const metadata = await this.vaultAdapter.getMetadata(searchPath);
      if (metadata) {
        const baseName = searchPath.split('/').pop()?.replace('.md', '') || '';
        return Asset.fromFrontmatter(metadata, baseName);
      }
    }
    
    // Search all files if not found by direct path
    const files = await this.vaultAdapter.list();
    for (const path of files) {
      if (path.endsWith(searchPath) || path.split('/').pop() === searchPath) {
        const metadata = await this.vaultAdapter.getMetadata(path);
        if (metadata) {
          const baseName = path.split('/').pop()?.replace('.md', '') || '';
          return Asset.fromFrontmatter(metadata, baseName);
        }
      }
    }
    
    return null;
  }

  private async findAssetPath(id: AssetId): Promise<string | null> {
    const files = await this.vaultAdapter.list();
    
    for (const path of files) {
      const metadata = await this.vaultAdapter.getMetadata(path);
      if (metadata && metadata['exo__Asset_uid'] === id.toString()) {
        return path;
      }
    }
    
    return null;
  }

  private isTemplateFile(path: string): boolean {
    return this.templatePath ? path.startsWith(this.templatePath + '/') : false;
  }

  private extractClassName(metadata: Record<string, any>): string {
    const classValue = metadata['exo__Instance_class'];
    if (Array.isArray(classValue)) {
      return classValue[0]?.replace(/\[\[|\]\]/g, '') || '';
    }
    return classValue?.replace(/\[\[|\]\]/g, '') || '';
  }

  private extractOntologyPrefix(metadata: Record<string, any>): string {
    const ontologyValue = metadata['exo__Asset_isDefinedBy'];
    return ontologyValue?.replace(/\[\[!?|\]\]/g, '') || '';
  }

  private createMarkdownContent(frontmatter: Record<string, any>): string {
    const yamlContent = yaml.dump(frontmatter, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });
    
    return `---
${yamlContent}---

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
`;
  }
}