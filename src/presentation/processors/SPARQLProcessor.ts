import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { SPARQLEngine } from '../../application/SPARQLEngine';
import { Graph } from '../../domain/Graph';

export class SPARQLProcessor {
    private plugin: Plugin;
    private engine: SPARQLEngine;
    
    constructor(plugin: Plugin, graph: Graph) {
        this.plugin = plugin;
        this.engine = new SPARQLEngine(graph);
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
        
        try {
            // Show loading indicator
            const loadingEl = this.createLoadingIndicator();
            el.appendChild(loadingEl);
            
            // Execute query
            const startTime = Date.now();
            const result = await this.executeQuery(source.trim());
            const executionTime = Date.now() - startTime;
            
            // Remove loading indicator
            loadingEl.remove();
            
            // Display results
            if (!result || result.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'sparql-empty-result';
                emptyMessage.textContent = 'No results found';
                el.appendChild(emptyMessage);
            } else {
                const table = this.createResultTable(result);
                el.appendChild(table);
                
                // Add stats
                const stats = this.createStatsElement(result.length, executionTime);
                el.appendChild(stats);
            }
            
        } catch (error: any) {
            el.empty();
            const errorEl = this.createErrorMessage(error);
            el.appendChild(errorEl);
            console.error('SPARQL execution error:', error);
        }
    }
    
    private async executeQuery(sparql: string): Promise<any[]> {
        // Basic query validation
        if (!sparql || sparql.trim().length === 0) {
            throw new Error('Empty query');
        }
        
        // For MVP, support simple SELECT queries
        if (!sparql.toUpperCase().includes('SELECT')) {
            throw new Error('Only SELECT queries are currently supported');
        }
        
        // Execute using SPARQL engine
        return this.engine.select(sparql);
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
        
        const title = document.createElement('strong');
        title.textContent = 'Query Error: ';
        errorDiv.appendChild(title);
        
        const message = document.createElement('span');
        message.textContent = error.message;
        errorDiv.appendChild(message);
        
        return errorDiv;
    }
    
    private createStatsElement(count: number, time: number): HTMLElement {
        const stats = document.createElement('div');
        stats.className = 'sparql-stats';
        stats.textContent = `${count} results in ${time}ms`;
        return stats;
    }
}
