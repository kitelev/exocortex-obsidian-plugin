import { App, TFile } from 'obsidian';
import { NarrowerBlockConfig } from "../../domain/entities/LayoutBlockStubs";

export class NarrowerBlockRenderer {
    constructor(private app: App) {}

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        dv: any
    ): Promise<void> {
        const narrowerConfig = config as NarrowerBlockConfig;
        
        // Default broader property for ims__Concept class
        const broaderProperty = narrowerConfig.broaderProperty || 'ims__Concept_broader';
        
        // Find concepts that reference this file via the broader property
        const narrowerConcepts = this.findNarrowerConcepts(file, broaderProperty);
        
        // Filter by class if specified
        let filteredConcepts = narrowerConcepts;
        if (narrowerConfig.filterByClass) {
            const targetClass = this.cleanClassName(narrowerConfig.filterByClass);
            filteredConcepts = narrowerConcepts.filter(f => {
                const metadata = this.app.metadataCache.getFileCache(f);
                const instanceClass = metadata?.frontmatter?.['exo__Instance_class'];
                return this.cleanClassName(instanceClass) === targetClass;
            });
        }

        // Show count
        const totalCount = filteredConcepts.length;
        const info = container.createDiv({ cls: 'exocortex-narrower-info' });
        info.createEl('span', { 
            text: `${totalCount} narrower concept${totalCount !== 1 ? 's' : ''}`,
            cls: 'exocortex-narrower-count'
        });

        if (filteredConcepts.length === 0) {
            container.createEl('p', { 
                text: 'No narrower concepts found',
                cls: 'exocortex-empty'
            });
            return;
        }

        // Limit results if specified
        let displayConcepts = filteredConcepts;
        if (narrowerConfig.maxResults && narrowerConfig.maxResults > 0) {
            displayConcepts = filteredConcepts.slice(0, narrowerConfig.maxResults);
            if (displayConcepts.length < totalCount) {
                info.innerHTML = `${totalCount} narrower concept${totalCount !== 1 ? 's' : ''}, showing ${displayConcepts.length}`;
            }
        }

        // Render based on display type
        switch (narrowerConfig.displayAs) {
            case 'table':
                this.renderTable(container, displayConcepts);
                break;
                
            case 'cards':
                this.renderCards(container, displayConcepts);
                break;
                
            case 'list':
            default:
                this.renderList(container, displayConcepts);
                break;
        }
    }

    private findNarrowerConcepts(file: TFile, broaderProperty: string): TFile[] {
        const currentFileLink = `[[${file.basename}]]`;
        const currentFilePath = `[[${file.path}]]`;
        const currentFilePathWithoutExtension = `[[${file.path.replace(/\.md$/, '')}]]`;
        
        return this.app.vault.getFiles().filter(candidateFile => {
            // Don't include the current file itself
            if (candidateFile.path === file.path) return false;
            
            const metadata = this.app.metadataCache.getFileCache(candidateFile);
            if (!metadata?.frontmatter) return false;
            
            const broaderValue = metadata.frontmatter[broaderProperty];
            if (!broaderValue) return false;
            
            // Check if broader property references our current file
            return this.referencesFile(broaderValue, currentFileLink, currentFilePath, currentFilePathWithoutExtension);
        });
    }

    private referencesFile(value: any, ...possibleReferences: string[]): boolean {
        if (Array.isArray(value)) {
            return value.some(v => this.referencesFile(v, ...possibleReferences));
        }
        
        const cleanValue = this.cleanClassName(value);
        return possibleReferences.some(ref => {
            const cleanRef = this.cleanClassName(ref);
            return cleanValue === cleanRef;
        });
    }

    private renderList(container: HTMLElement, files: TFile[]): void {
        const list = container.createEl('ul', { cls: 'exocortex-narrower-list' });
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const item = list.createEl('li');
            const link = item.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            // Add class info if available
            const instanceClass = frontmatter['exo__Instance_class'];
            if (instanceClass) {
                item.createEl('span', {
                    text: ` (${this.cleanClassName(instanceClass)})`,
                    cls: 'exocortex-class-info'
                });
            }
        });
    }

    private renderTable(container: HTMLElement, files: TFile[]): void {
        // Create table
        const table = container.createEl('table', { cls: 'exocortex-narrower-table' });
        
        // Header
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: 'Concept' });
        headerRow.createEl('th', { text: 'Class' });
        headerRow.createEl('th', { text: 'Description' });

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
            
            // Class cell
            const classCell = row.createEl('td');
            const instanceClass = frontmatter['exo__Instance_class'];
            if (instanceClass) {
                classCell.textContent = this.cleanClassName(instanceClass);
            }
            
            // Description cell
            const descCell = row.createEl('td');
            const description = frontmatter['exo__Asset_description'];
            if (description) {
                descCell.textContent = description;
            }
        });
    }

    private renderCards(container: HTMLElement, files: TFile[]): void {
        const cardsContainer = container.createDiv({ cls: 'exocortex-narrower-cards' });
        
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
            
            // Show class if available
            const instanceClass = frontmatter['exo__Instance_class'];
            if (instanceClass) {
                body.createEl('div', {
                    text: `Class: ${this.cleanClassName(instanceClass)}`,
                    cls: 'exocortex-card-class'
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

    private cleanClassName(className: any): string {
        if (!className) return '';
        const str = Array.isArray(className) ? className[0] : className;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }
}