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
                    const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
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
                const ontology = cache.frontmatter['exo__Asset_isDefinedBy'];
                const ontologyValue = ontology?.replace(/\[\[!?|\]\]/g, '');
                
                if (ontologyValue === prefix.toString()) {
                    const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
                    if (asset) {
                        assets.push(asset);
                    }
                }
            }
        }
        
        return assets;
    }

    async save(asset: Asset): Promise<void> {
        const frontmatter = asset.toFrontmatter();
        
        // Try to find the existing file by asset ID, stored path, or filename
        let targetFile: TFile | null = null;
        
        // First check if asset has a stored file path
        const storedPath = (asset as any).props?.filePath;
        if (storedPath) {
            const file = this.app.vault.getAbstractFileByPath(storedPath);
            if (file instanceof TFile) {
                targetFile = file;
            }
        }
        
        // If not found by stored path, try by asset ID
        if (!targetFile) {
            const assetId = frontmatter['exo__Asset_uid'];
            if (assetId) {
                const files = this.app.vault.getMarkdownFiles();
                for (const file of files) {
                    const cache = this.app.metadataCache.getFileCache(file);
                    if (cache?.frontmatter?.['exo__Asset_uid'] === assetId) {
                        targetFile = file;
                        break;
                    }
                }
            }
        }
        
        // If not found by ID, try by filename
        if (!targetFile) {
            const fileName = `${asset.getTitle()}.md`;
            const file = this.app.vault.getAbstractFileByPath(fileName);
            if (file instanceof TFile) {
                targetFile = file;
            }
        }
        
        // Build YAML frontmatter
        const yamlLines = ['---'];
        for (const [key, value] of Object.entries(frontmatter)) {
            if (Array.isArray(value)) {
                yamlLines.push(`${key}:`);
                for (const item of value) {
                    // Check if item contains wikilinks that need quotes
                    const itemStr = String(item);
                    if (itemStr.includes('[[') && itemStr.includes(']]')) {
                        yamlLines.push(`  - "${itemStr}"`);
                    } else {
                        yamlLines.push(`  - ${itemStr}`);
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                yamlLines.push(`${key}: ${JSON.stringify(value)}`);
            } else {
                // Check if value contains wikilinks that need quotes
                const valueStr = String(value);
                if (valueStr.includes('[[') && valueStr.includes(']]')) {
                    yamlLines.push(`${key}: "${valueStr}"`);
                } else {
                    yamlLines.push(`${key}: ${valueStr}`);
                }
            }
        }
        yamlLines.push('---');
        
        if (targetFile) {
            // Preserve existing content after frontmatter
            const existingContent = await this.app.vault.read(targetFile);
            const contentMatch = existingContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
            const bodyContent = contentMatch ? contentMatch[1] : '';
            
            const newContent = yamlLines.join('\n') + '\n' + bodyContent;
            await this.app.vault.modify(targetFile, newContent);
        } else {
            // Create new file if it doesn't exist
            const fileName = `${asset.getTitle()}.md`;
            const content = yamlLines.join('\n') + '\n';
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
                const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
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
        if (!searchPath.endsWith('.md')) {
            searchPath = `${searchPath}.md`;
        }
        
        // Try to find by path first
        let file = this.app.vault.getAbstractFileByPath(searchPath);
        
        // If not found, search all files by basename
        if (!file) {
            const files = this.app.vault.getMarkdownFiles();
            file = files.find(f => f.path === searchPath || f.name === searchPath) || null;
        }
        
        if (file instanceof TFile) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter) {
                const asset = Asset.fromFrontmatter(cache.frontmatter, file.basename);
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
    async updateFrontmatterByPath(filePath: string, updates: Record<string, any>): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        
        if (!(file instanceof TFile)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const content = await this.app.vault.read(file);
        const cache = this.app.metadataCache.getFileCache(file);
        const currentFrontmatter = cache?.frontmatter || {};
        
        // Merge updates with current frontmatter
        const newFrontmatter = { ...currentFrontmatter, ...updates };
        
        // Build new YAML frontmatter
        const yamlLines = ['---'];
        for (const [key, value] of Object.entries(newFrontmatter)) {
            if (value === undefined || value === null) continue; // Skip undefined/null values
            
            if (Array.isArray(value)) {
                yamlLines.push(`${key}:`);
                for (const item of value) {
                    const itemStr = String(item);
                    if (itemStr.includes('[[') && itemStr.includes(']]')) {
                        yamlLines.push(`  - "${itemStr}"`);
                    } else {
                        yamlLines.push(`  - ${itemStr}`);
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                yamlLines.push(`${key}: ${JSON.stringify(value)}`);
            } else if (typeof value === 'boolean') {
                yamlLines.push(`${key}: ${value}`);
            } else if (typeof value === 'number') {
                yamlLines.push(`${key}: ${value}`);
            } else {
                const valueStr = String(value);
                // Check if value needs quoting
                if (valueStr.includes(':') || valueStr.includes('#') || 
                    valueStr.includes('[') || valueStr.includes(']') ||
                    valueStr.includes('{') || valueStr.includes('}') ||
                    valueStr.includes('|') || valueStr.includes('>') ||
                    valueStr.includes('@') || valueStr.includes('`') ||
                    valueStr.includes('"') || valueStr.includes("'") ||
                    valueStr.startsWith(' ') || valueStr.endsWith(' ')) {
                    // Escape quotes and wrap in quotes
                    yamlLines.push(`${key}: "${valueStr.replace(/"/g, '\\"')}"`);
                } else {
                    yamlLines.push(`${key}: ${valueStr}`);
                }
            }
        }
        yamlLines.push('---');
        
        // Extract body content - handle multiple cases
        let bodyContent = '';
        
        // Check if content has frontmatter
        if (content.startsWith('---\n')) {
            // Find the end of frontmatter
            const endOfFrontmatter = content.indexOf('\n---\n', 4);
            if (endOfFrontmatter !== -1) {
                // Extract content after frontmatter
                bodyContent = content.substring(endOfFrontmatter + 5);
            } else {
                // Malformed frontmatter, preserve original content
                bodyContent = content;
            }
        } else {
            // No frontmatter, entire content is body
            bodyContent = content;
        }
        
        const newContent = yamlLines.join('\n') + '\n' + bodyContent;
        await this.app.vault.modify(file, newContent);
    }
}