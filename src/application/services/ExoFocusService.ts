import { App, TFile } from 'obsidian';
import { ExoFocus, FocusFilter } from '../../domain/entities/ExoFocus';
import { Graph } from '../../domain/semantic/core/Graph';
import { Triple } from '../../domain/semantic/core/Triple';
import { Result } from '../../domain/core/Result';

export class ExoFocusService {
    private activeFocus: ExoFocus | null = null;
    private allFocuses: Map<string, ExoFocus> = new Map();
    private focusFilePath = '.exocortex/focus.json';
    private focusConfigPath = '.exocortex/focus-configs.json';
    
    constructor(
        private app: App,
        private graph: Graph
    ) {
        // Only load focuses if vault adapter is available
        if (this.app?.vault?.adapter) {
            this.loadFocuses();
        }
    }
    
    /**
     * Load all focus configurations from vault
     */
    private async loadFocuses(): Promise<void> {
        if (!this.app?.vault?.adapter) {
            return;
        }
        
        try {
            const content = await this.app.vault.adapter.read(this.focusConfigPath);
            const configs = JSON.parse(content);
            
            for (const config of configs) {
                const focusResult = ExoFocus.fromJSON(config);
                if (focusResult.isSuccess) {
                    const focus = focusResult.getValue();
                    this.allFocuses.set(focus.id, focus);
                    
                    if (focus.active) {
                        this.activeFocus = focus;
                    }
                }
            }
        } catch (error) {
            // File doesn't exist, create default focuses
            await this.createDefaultFocuses();
        }
    }
    
    /**
     * Create default focus configurations
     */
    private async createDefaultFocuses(): Promise<void> {
        if (!this.app?.vault?.adapter) {
            return;
        }
        
        const defaults = [
            {
                name: 'All',
                description: 'No filtering - show all knowledge',
                filters: [],
                priority: 0,
                active: true
            },
            {
                name: 'Work',
                description: 'Work-related knowledge only',
                filters: [
                    {
                        type: 'tag' as const,
                        operator: 'includes' as const,
                        value: ['work', 'project', 'task', 'meeting']
                    },
                    {
                        type: 'class' as const,
                        operator: 'includes' as const,
                        value: ['ems__Task', 'ems__Project', 'ems__Meeting']
                    }
                ],
                priority: 50,
                active: false
            },
            {
                name: 'Personal',
                description: 'Personal knowledge only',
                filters: [
                    {
                        type: 'tag' as const,
                        operator: 'includes' as const,
                        value: ['personal', 'family', 'health', 'hobby']
                    },
                    {
                        type: 'tag' as const,
                        operator: 'excludes' as const,
                        value: ['work', 'project']
                    }
                ],
                priority: 50,
                active: false
            },
            {
                name: 'Today',
                description: 'Focus on today\'s items',
                filters: [
                    {
                        type: 'timeframe' as const,
                        operator: 'equals' as const,
                        value: new Date().toISOString().split('T')[0]
                    }
                ],
                priority: 75,
                active: false
            },
            {
                name: 'This Week',
                description: 'Focus on this week\'s items',
                filters: [
                    {
                        type: 'timeframe' as const,
                        operator: 'between' as const,
                        value: [
                            this.getWeekStart(),
                            this.getWeekEnd()
                        ]
                    }
                ],
                priority: 60,
                active: false
            }
        ];
        
        for (const config of defaults) {
            const focusResult = ExoFocus.create({
                ...config,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            if (focusResult.isSuccess) {
                const focus = focusResult.getValue();
                this.allFocuses.set(focus.id, focus);
                
                if (focus.active) {
                    this.activeFocus = focus;
                }
            }
        }
        
        await this.saveFocuses();
    }
    
    /**
     * Save all focus configurations
     */
    private async saveFocuses(): Promise<void> {
        if (!this.app?.vault?.adapter) {
            return;
        }
        
        const configs = Array.from(this.allFocuses.values()).map(f => f.toJSON());
        
        await this.app.vault.adapter.write(
            this.focusConfigPath,
            JSON.stringify(configs, null, 2)
        );
        
        // Save active focus separately for quick access
        if (this.activeFocus) {
            await this.app.vault.adapter.write(
                this.focusFilePath,
                JSON.stringify({
                    activeId: this.activeFocus.id,
                    name: this.activeFocus.name,
                    filters: this.activeFocus.filters,
                    timestamp: new Date().toISOString()
                }, null, 2)
            );
        }
    }
    
    /**
     * Get active focus
     */
    getActiveFocus(): ExoFocus | null {
        return this.activeFocus;
    }
    
    /**
     * Set active focus by ID
     */
    async setActiveFocus(focusId: string): Promise<Result<void>> {
        const focus = this.allFocuses.get(focusId);
        if (!focus) {
            return Result.fail<void>('Focus not found');
        }
        
        // Deactivate current focus
        if (this.activeFocus) {
            this.activeFocus.deactivate();
        }
        
        // Activate new focus
        focus.activate();
        this.activeFocus = focus;
        
        await this.saveFocuses();
        return Result.ok<void>();
    }
    
    /**
     * Create new focus
     */
    async createFocus(
        name: string,
        description: string,
        filters: FocusFilter[]
    ): Promise<Result<ExoFocus>> {
        const focusResult = ExoFocus.create({
            name,
            description,
            filters,
            priority: 50,
            active: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        if (focusResult.isFailure) {
            return focusResult;
        }
        
        const focus = focusResult.getValue();
        this.allFocuses.set(focus.id, focus);
        
        await this.saveFocuses();
        return Result.ok<ExoFocus>(focus);
    }
    
    /**
     * Update focus
     */
    async updateFocus(
        focusId: string,
        updates: Partial<{
            name: string;
            description: string;
            filters: FocusFilter[];
            priority: number;
        }>
    ): Promise<Result<void>> {
        const focus = this.allFocuses.get(focusId);
        if (!focus) {
            return Result.fail<void>('Focus not found');
        }
        
        // Update properties
        if (updates.priority !== undefined) {
            const result = focus.updatePriority(updates.priority);
            if (result.isFailure) {
                return result;
            }
        }
        
        // For other updates, we'd need to add methods to ExoFocus
        // or recreate the focus with new properties
        
        await this.saveFocuses();
        return Result.ok<void>();
    }
    
    /**
     * Delete focus
     */
    async deleteFocus(focusId: string): Promise<Result<void>> {
        const focus = this.allFocuses.get(focusId);
        if (!focus) {
            return Result.fail<void>('Focus not found');
        }
        
        if (focus === this.activeFocus) {
            // Switch to "All" focus
            const allFocus = Array.from(this.allFocuses.values())
                .find(f => f.name === 'All');
            if (allFocus) {
                this.activeFocus = allFocus;
                allFocus.activate();
            } else {
                this.activeFocus = null;
            }
        }
        
        this.allFocuses.delete(focusId);
        await this.saveFocuses();
        return Result.ok<void>();
    }
    
    /**
     * Get all focuses
     */
    getAllFocuses(): ExoFocus[] {
        return Array.from(this.allFocuses.values());
    }
    
    /**
     * Filter assets based on active focus
     */
    filterAssets(assets: any[]): any[] {
        if (!this.activeFocus) {
            return assets;
        }
        
        return assets.filter(asset => this.activeFocus!.matchesAsset(asset));
    }
    
    /**
     * Filter triples based on active focus
     */
    filterTriples(triples: Triple[]): Triple[] {
        if (!this.activeFocus) {
            return triples;
        }
        
        return triples.filter(triple => {
            // Convert Triple to plain object for matchesTriple
            const tripleObj = {
                subject: triple.getSubject().toString(),
                predicate: triple.getPredicate().toString(),
                object: triple.getObject().toString()
            };
            return this.activeFocus!.matchesTriple(tripleObj);
        });
    }
    
    /**
     * Filter files based on active focus
     */
    async filterFiles(files: TFile[]): Promise<TFile[]> {
        if (!this.activeFocus) {
            return files;
        }
        
        const filteredFiles: TFile[] = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter) {
                if (this.activeFocus.matchesAsset(cache.frontmatter)) {
                    filteredFiles.push(file);
                }
            }
        }
        
        return filteredFiles;
    }
    
    /**
     * Apply focus to SPARQL query results
     */
    filterSPARQLResults(results: any[]): any[] {
        if (!this.activeFocus) {
            return results;
        }
        
        return results.filter(result => {
            // Check if result is a triple
            if (result.subject && result.predicate && result.object) {
                return this.activeFocus!.matchesTriple(result);
            }
            
            // Otherwise treat as asset
            return this.activeFocus!.matchesAsset(result);
        });
    }
    
    /**
     * Get focus statistics
     */
    async getFocusStatistics(): Promise<{
        totalAssets: number;
        filteredAssets: number;
        totalTriples: number;
        filteredTriples: number;
        activeFocus: string;
    }> {
        const files = this.app.vault.getMarkdownFiles();
        const allAssets = files.length;
        
        const filteredFiles = await this.filterFiles(files);
        const filteredAssets = filteredFiles.length;
        
        const allTriples = this.graph.match(null, null, null);
        const totalTriples = allTriples.length;
        
        const filteredTriples = this.filterTriples(allTriples);
        const filteredTriplesCount = filteredTriples.length;
        
        return {
            totalAssets: allAssets,
            filteredAssets,
            totalTriples,
            filteredTriples: filteredTriplesCount,
            activeFocus: this.activeFocus?.name || 'None'
        };
    }
    
    /**
     * Helper: Get start of current week
     */
    private getWeekStart(): string {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString();
    }
    
    /**
     * Helper: Get end of current week
     */
    private getWeekEnd(): string {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + 7;
        const weekEnd = new Date(now.setDate(diff));
        weekEnd.setHours(23, 59, 59, 999);
        return weekEnd.toISOString();
    }
}