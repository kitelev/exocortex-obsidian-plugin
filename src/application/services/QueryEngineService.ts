import { IQueryEngine, QueryEngineType, QueryResult, QueryContext } from '../../domain/ports/IQueryEngine';
import { QueryEngineConfig } from '../../domain/entities/QueryEngineConfig';
import { Result } from '../../domain/core/Result';

/**
 * Query Engine Service
 * High-level service for executing queries with caching, fallback, and configuration support
 */
export class QueryEngineService {
    private queryCache: Map<string, { result: QueryResult; timestamp: number }> = new Map();
    private currentEngine: IQueryEngine | null = null;
    private config: QueryEngineConfig;

    constructor(
        private queryEngineFactory: any, // IQueryEngineFactory - will be imported from infrastructure
        config?: QueryEngineConfig
    ) {
        this.config = config || QueryEngineConfig.createDefault().getValue()!;
    }

    /**
     * Execute a query with automatic engine selection, caching, and fallback
     */
    public async executeQuery(
        query: string,
        context?: QueryContext,
        enginePreference?: QueryEngineType
    ): Promise<Result<QueryResult>> {
        // Check cache first
        if (this.config.enableCache) {
            const cached = this.getCachedResult(query, context);
            if (cached) {
                return Result.ok<QueryResult>(cached);
            }
        }

        // Get appropriate engine
        const engineResult = await this.getQueryEngine(enginePreference);
        if (!engineResult.isSuccess) {
            return Result.fail<QueryResult>(engineResult.getError());
        }

        const engine = engineResult.getValue()!;

        // Execute query
        const queryResult = await engine.executeQuery(query, context);
        
        // Cache successful results
        if (queryResult.isSuccess && this.config.enableCache) {
            this.cacheResult(query, context, queryResult.getValue()!);
        }

        return queryResult;
    }

    /**
     * Render a query directly to a container
     */
    public async renderQuery(
        container: HTMLElement,
        query: string,
        context?: QueryContext,
        enginePreference?: QueryEngineType
    ): Promise<Result<void>> {
        const engineResult = await this.getQueryEngine(enginePreference);
        if (!engineResult.isSuccess) {
            container.createEl('p', {
                text: `Query Engine Error: ${engineResult.getError()}`,
                cls: 'exocortex-error'
            });
            return Result.fail<void>(engineResult.getError());
        }

        const engine = engineResult.getValue()!;
        return engine.renderQuery(container, query, context);
    }

    /**
     * Get pages from any available engine
     */
    public async getPages(
        source: string,
        enginePreference?: QueryEngineType
    ): Promise<Result<any[]>> {
        const engineResult = await this.getQueryEngine(enginePreference);
        if (!engineResult.isSuccess) {
            return Result.fail<any[]>(engineResult.getError());
        }

        const engine = engineResult.getValue()!;
        return engine.getPages(source);
    }

    /**
     * Get page metadata from any available engine
     */
    public async getPageMetadata(
        path: string,
        enginePreference?: QueryEngineType
    ): Promise<Result<Record<string, any>>> {
        const engineResult = await this.getQueryEngine(enginePreference);
        if (!engineResult.isSuccess) {
            return Result.fail<Record<string, any>>(engineResult.getError());
        }

        const engine = engineResult.getValue()!;
        return engine.getPageMetadata(path);
    }

    /**
     * Validate query syntax
     */
    public async validateQuery(
        query: string,
        engineType?: QueryEngineType
    ): Promise<Result<boolean>> {
        const engineResult = await this.getQueryEngine(engineType);
        if (!engineResult.isSuccess) {
            return Result.fail<boolean>(engineResult.getError());
        }

        const engine = engineResult.getValue()!;
        return Result.ok<boolean>(engine.validateQuery(query).getValue() || false);
    }

    /**
     * Get information about available engines
     */
    public getAvailableEngines(): QueryEngineType[] {
        return this.queryEngineFactory.getAvailableEngines();
    }

    /**
     * Check if a specific engine is available
     */
    public isEngineAvailable(type: QueryEngineType): boolean {
        return this.queryEngineFactory.isEngineAvailable(type);
    }

    /**
     * Update configuration
     */
    public updateConfig(config: QueryEngineConfig): void {
        this.config = config;
        this.currentEngine = null; // Reset current engine to respect new preferences
        
        if (!config.enableCache) {
            this.clearCache();
        }
    }

    /**
     * Clear query cache
     */
    public clearCache(): void {
        this.queryCache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; hitRate: number; maxSize: number } {
        // This would need to be implemented with proper hit/miss tracking
        return {
            size: this.queryCache.size,
            hitRate: 0, // Placeholder
            maxSize: this.config.maxCacheSize
        };
    }

    /**
     * Get diagnostic information
     */
    public getDiagnostics(): Record<string, any> {
        return {
            currentEngine: this.currentEngine?.getType() || null,
            availableEngines: this.getAvailableEngines(),
            config: {
                preferred: this.config.preferredEngine,
                fallback: this.config.fallbackEngine,
                autoDetect: this.config.autoDetect,
                cacheEnabled: this.config.enableCache
            },
            cache: this.getCacheStats(),
            factory: this.queryEngineFactory.getDiagnostics()
        };
    }

    private async getQueryEngine(preference?: QueryEngineType): Promise<Result<IQueryEngine>> {
        // Use preference if provided, otherwise use config
        const engineType = preference || this.config.preferredEngine;

        // Try to reuse current engine if it matches preferences and is available
        if (this.currentEngine && 
            this.currentEngine.getType() === engineType && 
            this.currentEngine.isAvailable()) {
            return Result.ok<IQueryEngine>(this.currentEngine);
        }

        // Create new engine
        const engineResult = await this.queryEngineFactory.createQueryEngine(engineType);
        
        if (engineResult.isSuccess) {
            this.currentEngine = engineResult.getValue()!;
            return engineResult;
        }

        // Try fallback engine if configured
        if (this.config.fallbackEngine && this.config.fallbackEngine !== engineType) {
            console.warn(`Primary engine '${engineType}' failed, trying fallback '${this.config.fallbackEngine}'`);
            
            const fallbackResult = await this.queryEngineFactory.createQueryEngine(this.config.fallbackEngine);
            if (fallbackResult.isSuccess) {
                this.currentEngine = fallbackResult.getValue()!;
                return fallbackResult;
            }
        }

        // If auto-detect is enabled, try any available engine
        if (this.config.autoDetect) {
            console.warn(`Configured engines failed, auto-detecting available engine`);
            
            const autoResult = await this.queryEngineFactory.createQueryEngine();
            if (autoResult.isSuccess) {
                this.currentEngine = autoResult.getValue()!;
                return autoResult;
            }
        }

        return Result.fail<IQueryEngine>('No query engines available');
    }

    private getCachedResult(query: string, context?: QueryContext): QueryResult | null {
        const cacheKey = this.createCacheKey(query, context);
        const cached = this.queryCache.get(cacheKey);
        
        if (!cached) {
            return null;
        }

        // Check if cache entry is expired
        const now = Date.now();
        const ageMinutes = (now - cached.timestamp) / (1000 * 60);
        
        if (ageMinutes > this.config.cacheTimeout) {
            this.queryCache.delete(cacheKey);
            return null;
        }

        return cached.result;
    }

    private cacheResult(query: string, context: QueryContext | undefined, result: QueryResult): void {
        // Ensure cache doesn't grow too large
        if (this.queryCache.size >= this.config.maxCacheSize) {
            // Remove oldest entries (simple LRU approximation)
            const oldestKey = this.queryCache.keys().next().value;
            this.queryCache.delete(oldestKey);
        }

        const cacheKey = this.createCacheKey(query, context);
        this.queryCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
    }

    private createCacheKey(query: string, context?: QueryContext): string {
        const contextStr = context ? JSON.stringify(context) : '';
        return `${query}|${contextStr}`;
    }
}