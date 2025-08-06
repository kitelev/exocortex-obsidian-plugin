import { App, TFile } from 'obsidian';
import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { Asset } from '../../domain/entities/Asset';
import { AssetId } from '../../domain/value-objects/AssetId';
import { ClassName } from '../../domain/value-objects/ClassName';
import { OntologyPrefix } from '../../domain/value-objects/OntologyPrefix';

/**
 * Obsidian implementation of IAssetRepository
 * Handles asset persistence using Obsidian vault
 */
export class ObsidianAssetRepository implements IAssetRepository {
    constructor(private app: App) {}

    async findById(id: AssetId): Promise<Asset | null> {
        const files = this.app.vault.getMarkdownFiles();
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.['exo__Asset_uid'] === id.toString()) {
                const content = await this.app.vault.read(file);
                return Asset.fromFrontmatter(cache.frontmatter, file.basename);
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
                const classes = cache.frontmatter['exo__Instance_class'];
                const classArray = Array.isArray(classes) ? classes : [classes];
                
                if (classArray.some(c => c === className.toWikiLink() || c === className.toString())) {
                    assets.push(Asset.fromFrontmatter(cache.frontmatter, file.basename));
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
                const ontology = cache.frontmatter['exo__Asset_isDefinedBy'];
                const ontologyValue = ontology?.replace(/\[\[!?|\]\]/g, '');
                
                if (ontologyValue === prefix.toString()) {
                    assets.push(Asset.fromFrontmatter(cache.frontmatter, file.basename));
                }
            }
        }
        
        return assets;
    }

    async save(asset: Asset): Promise<void> {
        const fileName = `${asset.getTitle()}.md`;
        const frontmatter = asset.toFrontmatter();
        
        // Build YAML frontmatter
        const yamlLines = ['---'];
        for (const [key, value] of Object.entries(frontmatter)) {
            if (Array.isArray(value)) {
                yamlLines.push(`${key}:`);
                for (const item of value) {
                    yamlLines.push(`  - ${item}`);
                }
            } else if (typeof value === 'object' && value !== null) {
                yamlLines.push(`${key}: ${JSON.stringify(value)}`);
            } else {
                yamlLines.push(`${key}: ${value}`);
            }
        }
        yamlLines.push('---', '');
        
        const content = yamlLines.join('\n');
        
        // Check if file exists
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile instanceof TFile) {
            await this.app.vault.modify(existingFile, content);
        } else {
            await this.app.vault.create(fileName, content);
        }
    }

    async delete(id: AssetId): Promise<void> {
        const asset = await this.findById(id);
        if (asset) {
            const fileName = `${asset.getTitle()}.md`;
            const file = this.app.vault.getAbstractFileByPath(fileName);
            if (file) {
                await this.app.vault.delete(file);
            }
        }
    }

    async exists(id: AssetId): Promise<boolean> {
        const asset = await this.findById(id);
        return asset !== null;
    }

    async findAll(): Promise<Asset[]> {
        const files = this.app.vault.getMarkdownFiles();
        const assets: Asset[] = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.['exo__Asset_uid']) {
                assets.push(Asset.fromFrontmatter(cache.frontmatter, file.basename));
            }
        }
        
        return assets;
    }
}