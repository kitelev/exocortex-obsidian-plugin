import { IQueryEngine, IQueryEngineFactory, QueryEngineType } from '../../domain/ports/IQueryEngine';
import { Result } from '../../domain/core/Result';
import { DataviewQueryEngine } from './DataviewQueryEngine';
import { DatacoreQueryEngine } from './DatacoreQueryEngine';
import { NativeQueryEngine } from './NativeQueryEngine';
import { PlatformDetector } from '../utils/PlatformDetector';
import { MobilePerformanceOptimizer, MobilePerformanceOptimizerConfig } from '../optimizers/MobilePerformanceOptimizer';
import { App } from 'obsidian';

/**
 * Query Engine Factory Implementation
 * Creates and manages query engine instances based on availability and preference
 */
export class QueryEngineFactory implements IQueryEngineFactory {
    private dataviewApi: any = null;
    private datacoreApi: any = null;
    private cachedEngines: Map<QueryEngineType, IQueryEngine> = new Map();
    private performanceOptimizer?: MobilePerformanceOptimizer;
    private platformInfo = PlatformDetector.getPlatformInfo();

    constructor(private app: App) {
        this.detectAvailableEngines();
        this.initializeMobileOptimizations();
    }

    public async createQueryEngine(preferred?: QueryEngineType): Promise<Result<IQueryEngine>> {
        // If no preference specified, use auto-detection
        if (!preferred) {
            return this.createAutoDetectedEngine();
        }

        // Try to create the preferred engine
        const preferredResult = await this.createSpecificEngine(preferred);
        if (preferredResult.isSuccess) {
            return preferredResult;
        }

        // Fallback to any available engine
        console.warn(`Preferred query engine '${preferred}' not available, falling back to auto-detection`);
        return this.createAutoDetectedEngine();
    }

    public getAvailableEngines(): QueryEngineType[] {
        const available: QueryEngineType[] = [];
        
        if (this.isEngineAvailable('dataview')) {
            available.push('dataview');
        }
        
        if (this.isEngineAvailable('datacore')) {
            available.push('datacore');
        }
        
        // Native engine is always available
        available.push('native');
        
        return available;
    }

    public isEngineAvailable(type: QueryEngineType): boolean {
        switch (type) {
            case 'dataview':
                return this.dataviewApi != null;
            case 'datacore':
                return this.datacoreApi != null;
            case 'native':
                return true; // Native engine is always available
            default:
                return false;
        }
    }

    public updateApis(dataviewApi?: any, datacoreApi?: any): void {
        this.dataviewApi = dataviewApi;
        this.datacoreApi = datacoreApi;
        
        // Clear cached engines when APIs change
        this.cachedEngines.clear();
        
        console.log('Query Engine Factory: APIs updated', {
            dataview: !!this.dataviewApi,
            datacore: !!this.datacoreApi
        });
    }

    private async createAutoDetectedEngine(): Promise<Result<IQueryEngine>> {
        const availableEngines = this.getAvailableEngines();
        
        if (availableEngines.length === 0) {
            return Result.fail<IQueryEngine>('No query engines available');
        }

        // Mobile-first engine selection for iOS/mobile devices
        let preferredOrder: QueryEngineType[];
        
        if (this.platformInfo.isObsidianMobile || this.platformInfo.isMobile) {
            // On mobile, prefer native engine for better performance and compatibility
            preferredOrder = ['native', 'dataview', 'datacore'];
            console.log('Mobile platform detected, preferring native query engine');
        } else {
            // On desktop, prefer Dataview/Datacore for full feature support
            preferredOrder = ['dataview', 'datacore', 'native'];
        }
        
        for (const engineType of preferredOrder) {
            if (availableEngines.includes(engineType)) {
                const result = await this.createSpecificEngine(engineType);
                if (result.isSuccess) {
                    return result;
                }
            }
        }

        // Final fallback to native engine (always available)
        return this.createSpecificEngine('native');
    }

    private async createSpecificEngine(type: QueryEngineType): Promise<Result<IQueryEngine>> {
        // Return cached instance if available
        if (this.cachedEngines.has(type)) {
            const cached = this.cachedEngines.get(type)!;
            if (cached.isAvailable()) {
                return Result.ok<IQueryEngine>(cached);
            } else {
                // Remove invalid cached engine
                this.cachedEngines.delete(type);
            }
        }

        let engine: IQueryEngine;

        switch (type) {
            case 'dataview':
                if (!this.dataviewApi) {
                    return Result.fail<IQueryEngine>('Dataview API not available');
                }
                engine = new DataviewQueryEngine(this.dataviewApi);
                break;

            case 'datacore':
                if (!this.datacoreApi) {
                    return Result.fail<IQueryEngine>('Datacore API not available');
                }
                engine = new DatacoreQueryEngine(this.datacoreApi);
                break;

            case 'native':
                engine = new NativeQueryEngine(this.app);
                break;

            default:
                return Result.fail<IQueryEngine>(`Unknown query engine type: ${type}`);
        }

        // Verify the engine is actually available
        if (!engine.isAvailable()) {
            return Result.fail<IQueryEngine>(`Query engine '${type}' is not available`);
        }

        // Cache the engine
        this.cachedEngines.set(type, engine);

        return Result.ok<IQueryEngine>(engine);
    }

    private detectAvailableEngines(): void {
        // Try to detect and initialize available query engines
        this.detectDataview();
        this.detectDatacore();
    }

    private detectDataview(): void {
        try {
            // Check if Dataview plugin is loaded
            const plugins = (this.app as any).plugins;
            if (plugins && plugins.plugins && plugins.plugins.dataview) {
                const dataviewPlugin = plugins.plugins.dataview;
                if (dataviewPlugin && dataviewPlugin.api) {
                    this.dataviewApi = dataviewPlugin.api;
                    console.log('Query Engine Factory: Dataview API detected');
                }
            }
        } catch (error) {
            console.warn('Query Engine Factory: Failed to detect Dataview', error);
        }
    }

    private detectDatacore(): void {
        try {
            // Check if Datacore plugin is loaded
            const plugins = (this.app as any).plugins;
            if (plugins && plugins.plugins && plugins.plugins.datacore) {
                const datacorePlugin = plugins.plugins.datacore;
                if (datacorePlugin && datacorePlugin.api) {
                    this.datacoreApi = datacorePlugin.api;
                    console.log('Query Engine Factory: Datacore API detected');
                }
            }
        } catch (error) {
            console.warn('Query Engine Factory: Failed to detect Datacore', error);
        }
    }

    /**
     * Refresh engine detection - useful when plugins are loaded dynamically
     */
    public refresh(): void {
        this.detectAvailableEngines();
    }

    /**
     * Clear all cached engines - forces recreation on next request
     */
    public clearCache(): void {
        this.cachedEngines.clear();
    }

    /**
     * Get diagnostic information about available engines
     */
    public getDiagnostics(): Record<string, any> {
        return {
            availableEngines: this.getAvailableEngines(),
            dataviewAvailable: this.isEngineAvailable('dataview'),
            datacoreAvailable: this.isEngineAvailable('datacore'),
            nativeAvailable: this.isEngineAvailable('native'),
            cachedEngines: Array.from(this.cachedEngines.keys()),
            dataviewApi: !!this.dataviewApi,
            datacoreApi: !!this.datacoreApi,
            platformInfo: this.platformInfo,
            performanceOptimizer: !!this.performanceOptimizer
        };
    }

    /**
     * Initialize mobile-specific optimizations
     */
    private initializeMobileOptimizations(): void {
        if (PlatformDetector.shouldUseMobileOptimizations()) {
            const config: MobilePerformanceOptimizerConfig = {
                maxMemoryMB: PlatformDetector.hasLimitedMemory() ? 50 : 100,
                maxCacheEntries: PlatformDetector.getRecommendedCacheSize(),
                batchSize: PlatformDetector.getRecommendedBatchSize(),
                debounceMs: this.platformInfo.isMobile ? 500 : 300,
                enableGCHints: true,
                enableLazyLoading: true,
                virtualScrollThreshold: this.platformInfo.isMobile ? 50 : 100
            };
            this.performanceOptimizer = new MobilePerformanceOptimizer(config);

            console.log('Mobile optimizations enabled:', {
                platform: this.platformInfo.os,
                isMobile: this.platformInfo.isMobile,
                isObsidianMobile: this.platformInfo.isObsidianMobile,
                batchSize: PlatformDetector.getRecommendedBatchSize(),
                cacheSize: PlatformDetector.getRecommendedCacheSize()
            });
        }
    }

    /**
     * Get the performance optimizer (if mobile optimizations are enabled)
     */
    public getPerformanceOptimizer(): MobilePerformanceOptimizer | undefined {
        return this.performanceOptimizer;
    }

    /**
     * Force refresh platform detection and reinitialize optimizations
     */
    public refreshPlatformDetection(): void {
        PlatformDetector.refresh();
        this.platformInfo = PlatformDetector.getPlatformInfo();
        
        // Reinitialize mobile optimizations if needed
        if (PlatformDetector.shouldUseMobileOptimizations() && !this.performanceOptimizer) {
            this.initializeMobileOptimizations();
        } else if (!PlatformDetector.shouldUseMobileOptimizations() && this.performanceOptimizer) {
            this.performanceOptimizer.destroy();
            this.performanceOptimizer = undefined;
        }
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.clearCache();
        if (this.performanceOptimizer) {
            this.performanceOptimizer.destroy();
            this.performanceOptimizer = undefined;
        }
    }
}