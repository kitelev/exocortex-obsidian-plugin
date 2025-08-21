import { App, TFile } from 'obsidian';
import { Result } from '../../domain/core/Result';

export interface PropertyBasedBacklink {
    propertyName: string;
    referencingFiles: TFile[];
}

export interface BacklinkDiscoveryOptions {
    excludeProperties?: string[];
    maxResultsPerProperty?: number;
    filterByClass?: string;
}

export class DynamicBacklinksService {
    constructor(private app: App) {}

    async discoverPropertyBasedBacklinks(
        targetFile: TFile,
        options: BacklinkDiscoveryOptions = {}
    ): Promise<Result<PropertyBasedBacklink[]>> {
        try {
            const propertyBacklinks = new Map<string, TFile[]>();
            const targetFileName = targetFile.basename;
            
            // Scan all markdown files in the vault
            const allFiles = this.app.vault.getMarkdownFiles();
            
            for (const file of allFiles) {
                if (file.path === targetFile.path) continue; // Skip self-references
                
                const metadata = this.app.metadataCache.getFileCache(file);
                if (!metadata?.frontmatter) continue;
                
                // Filter by class if specified
                if (options.filterByClass) {
                    const instanceClass = this.cleanClassName(metadata.frontmatter['exo__Instance_class']);
                    if (instanceClass !== options.filterByClass) continue;
                }
                
                // Check each frontmatter property for references to target file
                for (const [propertyName, value] of Object.entries(metadata.frontmatter)) {
                    // Skip excluded properties
                    if (options.excludeProperties?.includes(propertyName)) continue;
                    
                    if (this.isReferencingTarget(value, targetFileName)) {
                        if (!propertyBacklinks.has(propertyName)) {
                            propertyBacklinks.set(propertyName, []);
                        }
                        propertyBacklinks.get(propertyName)!.push(file);
                    }
                }
            }
            
            // Convert to result format and apply limits
            const results: PropertyBasedBacklink[] = [];
            for (const [propertyName, files] of propertyBacklinks.entries()) {
                const limitedFiles = options.maxResultsPerProperty 
                    ? files.slice(0, options.maxResultsPerProperty)
                    : files;
                    
                results.push({
                    propertyName,
                    referencingFiles: limitedFiles
                });
            }
            
            // Sort by property name for consistent ordering
            results.sort((a, b) => a.propertyName.localeCompare(b.propertyName));
            
            return Result.ok(results);
        } catch (error) {
            return Result.fail(`Failed to discover backlinks: ${error}`);
        }
    }

    private isReferencingTarget(value: any, targetFileName: string): boolean {
        if (!value) return false;
        
        // Handle arrays
        if (Array.isArray(value)) {
            return value.some(item => this.isReferencingTarget(item, targetFileName));
        }
        
        // Convert to string and check various reference formats
        const strValue = value.toString();
        
        return (
            // Direct basename match
            strValue === targetFileName ||
            // Wiki-link format
            strValue.includes(`[[${targetFileName}]]`) ||
            // Wiki-link with display text
            strValue.includes(`[[${targetFileName}|`) ||
            // Partial match within string (for composite references)
            strValue.includes(targetFileName)
        );
    }

    private cleanClassName(className: any): string {
        if (!className) return '';
        const str = Array.isArray(className) ? className[0] : className;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }
}