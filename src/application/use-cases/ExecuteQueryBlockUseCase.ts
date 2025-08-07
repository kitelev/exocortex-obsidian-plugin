import { App, TFile } from 'obsidian';
import { QueryBlockConfig } from '../../domain/entities/LayoutBlock';
import { Result } from '../../domain/core/Result';

export interface ExecuteQueryBlockRequest {
    blockConfig: QueryBlockConfig;
    currentAssetPath: string;
    currentAssetFrontmatter: any;
}

export interface ExecuteQueryBlockResponse {
    results: TFile[];
    totalCount: number;
    executionTime: number;
}

export class ExecuteQueryBlockUseCase {
    constructor(
        private app: App
    ) {}

    async execute(request: ExecuteQueryBlockRequest): Promise<Result<ExecuteQueryBlockResponse>> {
        const startTime = Date.now();
        
        try {
            // Get all files
            let files = this.app.vault.getFiles();
            
            // Filter by class if specified
            if (request.blockConfig.className) {
                files = this.filterByClass(files, request.blockConfig.className);
            }
            
            // Apply property filters
            if (request.blockConfig.propertyFilters && request.blockConfig.propertyFilters.length > 0) {
                files = this.applyPropertyFilters(
                    files, 
                    request.blockConfig.propertyFilters,
                    request.currentAssetPath,
                    request.currentAssetFrontmatter
                );
            }
            
            // Apply relation filter if specified
            if (request.blockConfig.relationProperty) {
                files = this.filterByRelation(
                    files,
                    request.blockConfig.relationProperty,
                    request.currentAssetPath
                );
            }
            
            const totalCount = files.length;
            
            // Sort results
            if (request.blockConfig.sortBy) {
                files = this.sortFiles(
                    files,
                    request.blockConfig.sortBy,
                    request.blockConfig.sortOrder || 'asc'
                );
            }
            
            // Limit results
            if (request.blockConfig.maxResults && request.blockConfig.maxResults > 0) {
                files = files.slice(0, request.blockConfig.maxResults);
            }
            
            const executionTime = Date.now() - startTime;
            
            return Result.ok<ExecuteQueryBlockResponse>({
                results: files,
                totalCount,
                executionTime
            });
            
        } catch (error) {
            return Result.fail<ExecuteQueryBlockResponse>(
                `Failed to execute query block: ${error}`
            );
        }
    }
    
    private filterByClass(files: TFile[], className: string): TFile[] {
        const cleanClassName = this.cleanClassName(className);
        
        return files.filter(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata?.frontmatter) return false;
            
            const instanceClass = metadata.frontmatter['exo__Instance_class'];
            const fileClassName = this.cleanClassName(instanceClass);
            
            return fileClassName === cleanClassName;
        });
    }
    
    private applyPropertyFilters(
        files: TFile[], 
        filters: any[],
        currentAssetPath: string,
        currentAssetFrontmatter: any
    ): TFile[] {
        return files.filter(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata?.frontmatter) return false;
            
            // Check all filters
            for (const filter of filters) {
                if (!this.evaluateFilter(
                    metadata.frontmatter, 
                    filter,
                    currentAssetPath,
                    currentAssetFrontmatter,
                    file
                )) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    private evaluateFilter(
        frontmatter: any, 
        filter: any,
        currentAssetPath: string,
        currentAssetFrontmatter: any,
        file: TFile
    ): boolean {
        const propertyValue = frontmatter[filter.property];
        let filterValue = filter.value;
        
        // Replace template variables
        if (typeof filterValue === 'string') {
            filterValue = filterValue
                .replace('{{current_asset}}', `[[${currentAssetPath}]]`)
                .replace('{{current_file}}', `[[${currentAssetPath}]]`);
                
            // Replace frontmatter variables
            const varMatch = filterValue.match(/\{\{fm\.(.+?)\}\}/g);
            if (varMatch) {
                varMatch.forEach((match: string) => {
                    const prop = match.replace(/\{\{fm\.|}\}/g, '');
                    const value = currentAssetFrontmatter[prop];
                    if (value) {
                        filterValue = filterValue.replace(match, value);
                    }
                });
            }
        }
        
        // Clean values for comparison
        const cleanPropValue = this.cleanValue(propertyValue);
        const cleanFilterValue = this.cleanValue(filterValue);
        
        switch (filter.operator) {
            case 'equals':
                return this.valuesEqual(cleanPropValue, cleanFilterValue);
                
            case 'notEquals':
                return !this.valuesEqual(cleanPropValue, cleanFilterValue);
                
            case 'contains':
                return this.valueContains(cleanPropValue, cleanFilterValue);
                
            case 'startsWith':
                return this.valueStartsWith(cleanPropValue, cleanFilterValue);
                
            case 'endsWith':
                return this.valueEndsWith(cleanPropValue, cleanFilterValue);
                
            case 'exists':
                return propertyValue !== undefined && propertyValue !== null;
                
            case 'notExists':
                return propertyValue === undefined || propertyValue === null;
                
            default:
                return false;
        }
    }
    
    private valuesEqual(value1: any, value2: any): boolean {
        // Handle arrays
        if (Array.isArray(value1)) {
            return value1.some(v => this.valuesEqual(v, value2));
        }
        
        // Handle wikilinks
        const clean1 = this.cleanClassName(value1);
        const clean2 = this.cleanClassName(value2);
        
        return clean1 === clean2;
    }
    
    private valueContains(value: any, searchValue: string): boolean {
        if (Array.isArray(value)) {
            return value.some(v => this.valueContains(v, searchValue));
        }
        
        const str = this.cleanClassName(value).toLowerCase();
        const search = this.cleanClassName(searchValue).toLowerCase();
        
        return str.includes(search);
    }
    
    private valueStartsWith(value: any, searchValue: string): boolean {
        if (Array.isArray(value)) {
            return value.some(v => this.valueStartsWith(v, searchValue));
        }
        
        const str = this.cleanClassName(value).toLowerCase();
        const search = this.cleanClassName(searchValue).toLowerCase();
        
        return str.startsWith(search);
    }
    
    private valueEndsWith(value: any, searchValue: string): boolean {
        if (Array.isArray(value)) {
            return value.some(v => this.valueEndsWith(v, searchValue));
        }
        
        const str = this.cleanClassName(value).toLowerCase();
        const search = this.cleanClassName(searchValue).toLowerCase();
        
        return str.endsWith(search);
    }
    
    private filterByRelation(files: TFile[], relationProperty: string, currentAssetPath: string): TFile[] {
        const currentLink = `[[${currentAssetPath}]]`;
        
        return files.filter(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata?.frontmatter) return false;
            
            const relationValue = metadata.frontmatter[relationProperty];
            if (!relationValue) return false;
            
            if (Array.isArray(relationValue)) {
                return relationValue.some(v => 
                    this.cleanClassName(v) === this.cleanClassName(currentLink)
                );
            }
            
            return this.cleanClassName(relationValue) === this.cleanClassName(currentLink);
        });
    }
    
    private sortFiles(files: TFile[], sortBy: string, order: 'asc' | 'desc'): TFile[] {
        return files.sort((a, b) => {
            const aMetadata = this.app.metadataCache.getFileCache(a);
            const bMetadata = this.app.metadataCache.getFileCache(b);
            
            const aValue = aMetadata?.frontmatter?.[sortBy] || '';
            const bValue = bMetadata?.frontmatter?.[sortBy] || '';
            
            let comparison = 0;
            
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
            
            return order === 'asc' ? comparison : -comparison;
        });
    }
    
    private cleanClassName(value: any): string {
        if (!value) return '';
        const str = Array.isArray(value) ? value[0] : value;
        return str?.toString().replace(/\[\[|\]\]/g, '').trim() || '';
    }
    
    private cleanValue(value: any): any {
        if (Array.isArray(value)) {
            return value.map(v => this.cleanValue(v));
        }
        
        if (typeof value === 'string') {
            return value.replace(/\[\[|\]\]/g, '').trim();
        }
        
        return value;
    }
}