import { App, TFile } from 'obsidian';
import { ExecuteQueryBlockUseCase } from '../../application/use-cases/ExecuteQueryBlockUseCase';
import { QueryBlockConfig } from '../../domain/entities/LayoutBlock';

export class QueryBlockRenderer {
    private executeQueryUseCase: ExecuteQueryBlockUseCase;

    constructor(private app: App) {
        this.executeQueryUseCase = new ExecuteQueryBlockUseCase(app);
    }

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        frontmatter: any,
        dv: any
    ): Promise<void> {
        try {
            if (!config) {
                container.createEl('p', { 
                    text: 'Query configuration is missing',
                    cls: 'exocortex-error'
                });
                return;
            }

            const queryConfig = config as QueryBlockConfig;
            
            // Execute query
            const result = await this.executeQueryUseCase.execute({
                blockConfig: queryConfig,
                currentAssetPath: file.path,
                currentAssetFrontmatter: frontmatter
            });

        if (result.isFailure) {
            container.createEl('p', { 
                text: `Query failed: ${result.error}`,
                cls: 'exocortex-error'
            });
            return;
        }

        const { results, totalCount, executionTime } = result.getValue();

        // Show result count and execution time
        const info = container.createDiv({ cls: 'exocortex-query-info' });
        info.createEl('span', { 
            text: `Found ${totalCount} items${results.length < totalCount ? `, showing ${results.length}` : ''} (${executionTime}ms)`,
            cls: 'exocortex-query-count'
        });

        if (results.length === 0) {
            container.createEl('p', { 
                text: 'No items found',
                cls: 'exocortex-empty'
            });
            return;
        }

        // Render based on display type
        switch (queryConfig.displayAs) {
            case 'table':
                this.renderTable(container, results, dv);
                break;
                
            case 'cards':
                this.renderCards(container, results);
                break;
                
            case 'list':
            default:
                this.renderList(container, results);
                break;
        }
        } catch (error) {
            container.createEl('p', { 
                text: `Error rendering query block: ${error}`,
                cls: 'exocortex-error'
            });
            console.error('Query block render error:', error);
        }
    }

    private renderList(container: HTMLElement, files: TFile[]): void {
        const list = container.createEl('ul', { cls: 'exocortex-query-list' });
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const item = list.createEl('li');
            const link = item.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            // Add status or other info if available
            const status = frontmatter['ems__Effort_status'];
            if (status) {
                const statusSpan = item.createEl('span', {
                    text: ` - ${this.cleanValue(status)}`,
                    cls: 'exocortex-status'
                });
            }
        });
    }

    private renderTable(container: HTMLElement, files: TFile[], dv: any): void {
        // Collect all unique properties
        const allProps = new Set<string>();
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (metadata?.frontmatter) {
                Object.keys(metadata.frontmatter).forEach(key => {
                    if (!key.startsWith('exo__Instance')) {
                        allProps.add(key);
                    }
                });
            }
        });

        // Select most relevant properties (max 5)
        const relevantProps = Array.from(allProps)
            .filter(p => !p.startsWith('exo__Asset_uid'))
            .slice(0, 5);

        // Create table
        const table = container.createEl('table', { cls: 'exocortex-query-table' });
        
        // Header
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: 'Name' });
        relevantProps.forEach(prop => {
            const displayName = prop.replace(/_/g, ' ').replace(/^\w+__/, '');
            headerRow.createEl('th', { text: displayName });
        });

        // Body
        const tbody = table.createEl('tbody');
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const row = tbody.createEl('tr');
            
            // Name cell with link
            const nameCell = row.createEl('td');
            nameCell.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            // Property cells
            relevantProps.forEach(prop => {
                const cell = row.createEl('td');
                const value = frontmatter[prop];
                if (value) {
                    cell.setText(this.formatValue(value));
                }
            });
        });
    }

    private renderCards(container: HTMLElement, files: TFile[]): void {
        const cardsContainer = container.createDiv({ cls: 'exocortex-query-cards' });
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const card = cardsContainer.createDiv({ cls: 'exocortex-card' });
            
            // Card header
            const header = card.createDiv({ cls: 'exocortex-card-header' });
            header.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            // Card body with key properties
            const body = card.createDiv({ cls: 'exocortex-card-body' });
            
            // Show status if available
            const status = frontmatter['ems__Effort_status'];
            if (status) {
                body.createEl('div', {
                    text: `Status: ${this.cleanValue(status)}`,
                    cls: 'exocortex-card-status'
                });
            }
            
            // Show description if available
            const description = frontmatter['exo__Asset_description'];
            if (description) {
                body.createEl('div', {
                    text: description,
                    cls: 'exocortex-card-description'
                });
            }
        });
    }

    private cleanValue(value: any): string {
        if (!value) return '';
        const str = Array.isArray(value) ? value[0] : value;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }

    private formatValue(value: any): string {
        if (Array.isArray(value)) {
            return value.map(v => this.cleanValue(v)).join(', ');
        }
        return this.cleanValue(value);
    }
}