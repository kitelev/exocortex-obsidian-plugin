import { MarkdownPostProcessorContext, Plugin, Notice, App } from 'obsidian';
import { SPARQLEngine, ConstructResult, SelectResult } from '../../application/SPARQLEngine';
import { Graph } from '../../domain/semantic/core/Graph';
import { ExoFocusService } from '../../application/services/ExoFocusService';
import { QueryCacheConfig } from '../../application/services/QueryCache';
import { RDFService } from '../../application/services/RDFService';
import { ExportRDFModal } from '../modals/ExportRDFModal';
import { RDFFormat } from '../../application/services/RDFSerializer';

export class SPARQLProcessor {
    private plugin: Plugin;
    private engine: SPARQLEngine;
    private graph: Graph;
    private focusService?: ExoFocusService;
    private rdfService: RDFService;
    
    constructor(plugin: Plugin, graph: Graph, focusService?: ExoFocusService, cacheConfig?: Partial<QueryCacheConfig>) {
        this.plugin = plugin;
        this.graph = graph;
        this.engine = new SPARQLEngine(graph, cacheConfig);
        this.focusService = focusService;
        this.rdfService = new RDFService(plugin.app);
    }
    
    /**
     * Main processor method called by Obsidian
     */
    async processCodeBlock(
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ): Promise<void> {
        el.empty();
        
        // Create main container for UI tests
        const container = document.createElement('div');
        container.className = 'exocortex-sparql-container';
        container.style.cssText = 'border: 1px solid #e0e0e0; padding: 1em; margin: 1em 0; border-radius: 4px; background: #fafafa;';
        el.appendChild(container);
        
        try {
            // Show loading indicator
            const loadingEl = this.createLoadingIndicator();
            container.appendChild(loadingEl);
            
            // Execute query
            const startTime = Date.now();
            const result = await this.executeQuery(source.trim());
            const executionTime = Date.now() - startTime;
            
            // Remove loading indicator
            loadingEl.remove();
            
            // Add query title
            const title = document.createElement('h3');
            title.textContent = 'SPARQL Query Results';
            title.style.cssText = 'margin-top: 0; color: #333;';
            container.appendChild(title);
            
            // Add query display
            const queryPre = document.createElement('pre');
            queryPre.textContent = source.trim();
            queryPre.style.cssText = 'background: #f5f5f5; padding: 0.5em; border-radius: 3px; font-size: 0.9em; overflow-x: auto;';
            container.appendChild(queryPre);
            
            // Add cache status indicator
            if (result.cached) {
                const cacheIndicator = this.createCacheIndicator(result.cached);
                container.appendChild(cacheIndicator);
            }

            // Display results
            if (!result.results || result.results.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'sparql-empty-result';
                emptyMessage.textContent = 'No results found';
                emptyMessage.style.cssText = 'padding: 1em; text-align: center; color: #666;';
                container.appendChild(emptyMessage);
            } else {
                const table = this.createResultTable(result.results);
                container.appendChild(table);
                
                // Add export controls
                const exportControls = this.createExportControls(result.results, source.trim());
                container.appendChild(exportControls);
                
                // Add stats with cache information
                const stats = this.createStatsElement(result.results.length, executionTime, result.cached);
                container.appendChild(stats);
            }
            
        } catch (error: any) {
            container.innerHTML = '';
            const errorEl = this.createErrorMessage(error);
            container.appendChild(errorEl);
            console.error('SPARQL execution error:', error);
        }
    }
    
    public async executeQuery(sparql: string): Promise<{results: any[], cached?: boolean}> {
        // Basic query validation
        if (!sparql || sparql.trim().length === 0) {
            throw new Error('Empty query');
        }
        
        const upperQuery = sparql.toUpperCase();
        
        // Check query type
        if (upperQuery.includes('CONSTRUCT')) {
            // Execute CONSTRUCT query
            const result: ConstructResult = this.engine.construct(sparql);
            
            // Add generated triples to graph (only if not cached to avoid duplicates)
            if (!result.cached) {
                for (const triple of result.triples) {
                    this.graph.add(triple);
                }
            }
            
            // Show notification
            const cacheInfo = result.cached ? ' (cached)' : '';
            new Notice(`Generated ${result.triples.length} new triples${cacheInfo}`);
            
            // Return triples as results for display
            return {
                results: result.triples.map(t => ({
                    subject: t.getSubject().toString(),
                    predicate: t.getPredicate().toString(),
                    object: t.getObject().toString(),
                    provenance: result.provenance
                })),
                cached: result.cached
            };
        } else if (upperQuery.includes('SELECT')) {
            // Execute SELECT query
            const selectResult: SelectResult = this.engine.select(sparql);
            let results = selectResult.results;
            
            // Apply ExoFocus filtering if available
            if (this.focusService) {
                results = this.focusService.filterSPARQLResults(results);
            }
            
            return {
                results,
                cached: selectResult.cached
            };
        } else {
            throw new Error('Only SELECT and CONSTRUCT queries are currently supported');
        }
    }
    
    private createResultTable(results: any[]): HTMLTableElement {
        const table = document.createElement('table');
        table.className = 'sparql-results-table';
        
        if (results.length === 0) {
            return table;
        }
        
        // Get column names from first result
        const columns = Object.keys(results[0]);
        
        // Create header
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        
        for (const column of columns) {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        }
        
        // Create body
        const tbody = table.createTBody();
        
        for (const row of results) {
            const tr = tbody.insertRow();
            
            for (const column of columns) {
                const td = tr.insertCell();
                const value = row[column];
                
                if (this.isNoteLink(value)) {
                    const link = this.createNoteLink(value);
                    td.appendChild(link);
                } else {
                    td.textContent = value || '';
                }
            }
        }
        
        return table;
    }
    
    private isNoteLink(value: any): boolean {
        if (typeof value !== 'string') return false;
        return value.startsWith('file://') || value.includes('/');
    }
    
    private createNoteLink(uri: string): HTMLAnchorElement {
        const link = document.createElement('a');
        link.className = 'internal-link';
        
        // Extract note name from URI
        const noteName = uri.replace('file://', '').split('/').pop() || uri;
        link.textContent = noteName;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.plugin.app.workspace.openLinkText(noteName, '');
        });
        
        return link;
    }
    
    private createLoadingIndicator(): HTMLElement {
        const loading = document.createElement('div');
        loading.className = 'sparql-loading';
        loading.textContent = 'Executing query...';
        return loading;
    }
    
    private createErrorMessage(error: Error): HTMLElement {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'sparql-error';
        errorDiv.style.cssText = 'background: #ffebee; color: #c62828; padding: 1em; border-radius: 4px; border: 1px solid #ef5350;';
        
        const title = document.createElement('strong');
        title.textContent = 'Query Error: ';
        errorDiv.appendChild(title);
        
        const message = document.createElement('span');
        message.textContent = error.message;
        errorDiv.appendChild(message);
        
        return errorDiv;
    }
    
    private createStatsElement(count: number, time: number, cached?: boolean): HTMLElement {
        const stats = document.createElement('div');
        stats.className = 'sparql-stats';
        const cacheInfo = cached ? ' (cached result)' : '';
        stats.textContent = `Executed in ${time}ms - ${count} results${cacheInfo}`;
        stats.style.cssText = 'margin-top: 0.5em; color: #666; font-size: 0.9em;';
        return stats;
    }

    private createCacheIndicator(cached: boolean): HTMLElement {
        const indicator = document.createElement('div');
        indicator.className = 'sparql-cache-indicator';
        
        if (cached) {
            indicator.textContent = '📋 Cached Result';
            indicator.style.cssText = 'background: #e8f5e8; color: #2e7d32; padding: 0.4em 0.8em; border-radius: 15px; font-size: 0.8em; display: inline-block; margin-bottom: 0.5em; border: 1px solid #c8e6c9;';
        } else {
            indicator.textContent = '🔄 Fresh Result';
            indicator.style.cssText = 'background: #e3f2fd; color: #1565c0; padding: 0.4em 0.8em; border-radius: 15px; font-size: 0.8em; display: inline-block; margin-bottom: 0.5em; border: 1px solid #bbdefb;';
        }
        
        return indicator;
    }

    /**
     * Get cache statistics for display
     */
    getCacheStatistics() {
        return this.engine.getCacheStatistics();
    }

    /**
     * Invalidate all cached queries
     */
    invalidateCache(): void {
        this.engine.invalidateCache();
    }

    /**
     * Cleanup expired cache entries
     */
    cleanupCache(): number {
        return this.engine.cleanupCache();
    }

    /**
     * Destroy cache and cleanup resources
     */
    destroy(): void {
        this.engine.destroy();
    }
    
    /**
     * Create export controls for SPARQL results
     */
    private createExportControls(results: any[], query: string): HTMLElement {
        const exportContainer = document.createElement('div');
        exportContainer.className = 'sparql-export-controls';
        exportContainer.style.cssText = 'margin: 1em 0; padding: 0.8em; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;';
        
        // Export label
        const label = document.createElement('span');
        label.textContent = 'Export results: ';
        label.style.cssText = 'margin-right: 0.5em; font-weight: 500;';
        exportContainer.appendChild(label);
        
        // Quick export buttons
        const formats: Array<{ format: RDFFormat; label: string }> = [
            { format: 'turtle', label: 'Turtle' },
            { format: 'json-ld', label: 'JSON-LD' },
            { format: 'n-triples', label: 'N-Triples' },
            { format: 'rdf-xml', label: 'RDF/XML' }
        ];
        
        for (const { format, label } of formats) {
            const button = document.createElement('button');
            button.textContent = label;
            button.className = 'sparql-export-button';
            button.style.cssText = 'margin: 0 0.3em; padding: 0.4em 0.8em; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85em;';
            
            button.addEventListener('mouseenter', () => {
                button.style.background = '#005a9e';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = '#007acc';
            });
            
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.exportQueryResults(results, format, query);
            });
            
            exportContainer.appendChild(button);
        }
        
        // Advanced export button
        const advancedButton = document.createElement('button');
        advancedButton.textContent = 'Advanced...';
        advancedButton.className = 'sparql-export-advanced';
        advancedButton.style.cssText = 'margin-left: 1em; padding: 0.4em 0.8em; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.85em;';
        
        advancedButton.addEventListener('mouseenter', () => {
            advancedButton.style.background = '#545b62';
        });
        
        advancedButton.addEventListener('mouseleave', () => {
            advancedButton.style.background = '#6c757d';
        });
        
        advancedButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.openAdvancedExportModal(results, query);
        });
        
        exportContainer.appendChild(advancedButton);
        
        return exportContainer;
    }
    
    /**
     * Export query results in specified format
     */
    private async exportQueryResults(results: any[], format: RDFFormat, query: string): Promise<void> {
        try {
            const fileName = `sparql-results-${Date.now()}`;
            const result = await this.rdfService.exportQueryResults(results, format, fileName);
            
            if (result.isSuccess) {
                const exportData = result.getValue();
                new Notice(`Exported ${exportData.tripleCount} triples as ${format.toUpperCase()}`);
            } else {
                new Notice(`Export failed: ${result.errorValue()}`);
            }
        } catch (error: any) {
            new Notice(`Export error: ${error.message}`);
            console.error('SPARQL export error:', error);
        }
    }
    
    /**
     * Open advanced export modal for query results
     */
    private openAdvancedExportModal(results: any[], query: string): void {
        try {
            // Convert query results to a graph for the export modal
            const resultsGraph = this.rdfService['convertQueryResultsToGraph'](results);
            
            const modal = new ExportRDFModal(
                this.plugin.app,
                resultsGraph,
                this.rdfService.getNamespaceManager(),
                (result) => {
                    // Add query metadata as comment
                    const timestamp = new Date().toISOString();
                    const metadata = `\n\n# Query executed at ${timestamp}\n# ${query.replace(/\n/g, '\n# ')}\n`;
                    
                    // You could save this enhanced content or provide additional processing
                    new Notice(`Advanced export completed: ${result.fileName}`);
                }
            );
            
            modal.open();
        } catch (error: any) {
            new Notice(`Failed to open export modal: ${error.message}`);
            console.error('Export modal error:', error);
        }
    }
}
