import { App, TFile } from 'obsidian';
import { InstancesBlockConfig } from '../../domain/entities/LayoutBlock';

export class InstancesBlockRenderer {
    constructor(private app: App) {}

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        dv: any
    ): Promise<void> {
        const instancesConfig = config as InstancesBlockConfig;
        
        // Get all files that have the target property referencing current file
        const targetProperty = instancesConfig.targetProperty || 'exo__Instance_class';
        const currentAssetName = file.basename;
        
        // Find all files that reference this asset as their instance class
        let instanceFiles: TFile[] = [];
        
        // Get all files in the vault
        const allFiles = this.app.vault.getFiles();
        
        for (const otherFile of allFiles) {
            if (otherFile === file) continue; // Skip self
            
            const metadata = this.app.metadataCache.getFileCache(otherFile);
            const frontmatter = metadata?.frontmatter;
            
            if (!frontmatter) continue;
            
            const instanceClassValue = frontmatter[targetProperty];
            if (this.isReferencingCurrentAsset(instanceClassValue, currentAssetName)) {
                instanceFiles.push(otherFile);
            }
        }

        // Filter by class if specified
        if (instancesConfig.filterByClass) {
            const targetClass = this.cleanClassName(instancesConfig.filterByClass);
            instanceFiles = instanceFiles.filter(f => {
                const metadata = this.app.metadataCache.getFileCache(f);
                const instanceClass = metadata?.frontmatter?.['exo__Instance_class'];
                return this.cleanClassName(instanceClass) === targetClass;
            });
        }

        // Limit results if specified
        const totalCount = instanceFiles.length;
        if (instancesConfig.maxResults && instancesConfig.maxResults > 0) {
            instanceFiles = instanceFiles.slice(0, instancesConfig.maxResults);
        }

        // Show count
        const info = container.createDiv({ cls: 'exocortex-instances-info' });
        info.createEl('span', { 
            text: `${totalCount} instance${totalCount !== 1 ? 's' : ''}${instanceFiles.length < totalCount ? `, showing ${instanceFiles.length}` : ''}`,
            cls: 'exocortex-instances-count'
        });

        if (instanceFiles.length === 0) {
            container.createEl('p', { 
                text: 'No instances found',
                cls: 'exocortex-empty'
            });
            return;
        }

        // Group by class if specified
        if (instancesConfig.groupByClass) {
            this.renderGroupedInstances(container, instanceFiles, instancesConfig);
        } else {
            this.renderFlatInstances(container, instanceFiles, instancesConfig);
        }
    }

    private isReferencingCurrentAsset(instanceClassValue: any, currentAssetName: string): boolean {
        if (!instanceClassValue) return false;
        
        // Handle both string and array formats
        const refs = Array.isArray(instanceClassValue) ? instanceClassValue : [instanceClassValue];
        
        return refs.some(ref => {
            const cleanRef = this.cleanClassName(ref);
            
            // Match against various possible reference formats
            return cleanRef === currentAssetName || 
                   cleanRef === `${currentAssetName}.md` ||
                   // Check if the reference contains the asset name in wiki link format
                   ref.includes(`[[${currentAssetName}]]`) ||
                   ref.includes(currentAssetName);
        });
    }

    private renderFlatInstances(
        container: HTMLElement, 
        files: TFile[], 
        config: InstancesBlockConfig
    ): void {
        const displayAs = config.displayAs || 'table';
        
        if (displayAs === 'list') {
            this.renderInstancesList(container, files, config);
        } else if (displayAs === 'cards') {
            this.renderInstancesCards(container, files, config);
        } else {
            this.renderInstancesTable(container, files, config);
        }
    }

    private renderInstancesList(
        container: HTMLElement, 
        files: TFile[], 
        config: InstancesBlockConfig
    ): void {
        const list = container.createEl('ul', { cls: 'exocortex-instances-list' });
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const item = list.createEl('li', { cls: 'exocortex-instances-item' });
            
            // Create link
            const link = item.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            // Add class info if enabled
            if (config.showInstanceInfo) {
                const instanceClass = frontmatter['exo__Instance_class'];
                if (instanceClass) {
                    item.createEl('span', {
                        text: ` (${this.cleanClassName(instanceClass)})`,
                        cls: 'exocortex-instance-class-info'
                    });
                }
            }
        });
    }

    private renderInstancesCards(
        container: HTMLElement, 
        files: TFile[], 
        config: InstancesBlockConfig
    ): void {
        const cardsContainer = container.createDiv({ cls: 'exocortex-instances-cards' });
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const card = cardsContainer.createDiv({ cls: 'exocortex-instance-card' });
            
            // Card title
            const title = card.createEl('h4', { cls: 'exocortex-card-title' });
            title.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            // Card content
            if (config.showInstanceInfo) {
                const instanceClass = frontmatter['exo__Instance_class'];
                if (instanceClass) {
                    card.createEl('p', {
                        text: `Class: ${this.cleanClassName(instanceClass)}`,
                        cls: 'exocortex-card-class'
                    });
                }
                
                const description = frontmatter['exo__Asset_description'];
                if (description) {
                    card.createEl('p', {
                        text: description,
                        cls: 'exocortex-card-description'
                    });
                }
            }
        });
    }

    private renderInstancesTable(
        container: HTMLElement, 
        files: TFile[], 
        config: InstancesBlockConfig
    ): void {
        const table = container.createEl('table', { cls: 'exocortex-instances-table' });
        
        // Create table header
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: 'Instance Name', cls: 'exocortex-table-header-name' });
        
        if (config.showInstanceInfo) {
            headerRow.createEl('th', { text: 'Class', cls: 'exocortex-table-header-class' });
            headerRow.createEl('th', { text: 'Description', cls: 'exocortex-table-header-description' });
        }
        
        // Create table body
        const tbody = table.createEl('tbody');
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const row = tbody.createEl('tr', { cls: 'exocortex-instances-row' });
            
            // Name column
            const nameCell = row.createEl('td', { cls: 'exocortex-table-cell-name' });
            nameCell.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            if (config.showInstanceInfo) {
                // Class column
                const classCell = row.createEl('td', { cls: 'exocortex-table-cell-class' });
                const instanceClass = frontmatter['exo__Instance_class'];
                if (instanceClass) {
                    classCell.createEl('span', {
                        text: this.cleanClassName(instanceClass),
                        cls: 'exocortex-class-ref'
                    });
                } else {
                    classCell.createEl('span', {
                        text: '-',
                        cls: 'exocortex-class-empty'
                    });
                }
                
                // Description column
                const descCell = row.createEl('td', { cls: 'exocortex-table-cell-description' });
                const description = frontmatter['exo__Asset_description'];
                if (description) {
                    descCell.createEl('span', {
                        text: description.length > 100 ? description.substring(0, 100) + '...' : description,
                        cls: 'exocortex-description-text'
                    });
                } else {
                    descCell.createEl('span', {
                        text: '-',
                        cls: 'exocortex-description-empty'
                    });
                }
            }
        });
    }

    private renderGroupedInstances(
        container: HTMLElement, 
        files: TFile[], 
        config: InstancesBlockConfig
    ): void {
        // Group files by class
        const groups = new Map<string, TFile[]>();
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const instanceClass = metadata?.frontmatter?.['exo__Instance_class'];
            const className = this.cleanClassName(instanceClass) || 'Unclassified';
            
            if (!groups.has(className)) {
                groups.set(className, []);
            }
            groups.get(className)!.push(file);
        });

        // Sort groups by name
        const sortedGroups = Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b));

        // Render each group
        sortedGroups.forEach(([className, groupFiles]) => {
            const groupContainer = container.createDiv({ cls: 'exocortex-instances-group' });
            
            // Group header
            groupContainer.createEl('h4', {
                text: `${className} (${groupFiles.length})`,
                cls: 'instances-group-header'
            });
            
            // Render group contents
            this.renderFlatInstances(groupContainer, groupFiles, {...config, groupByClass: false});
        });
    }
    
    private cleanClassName(className: any): string {
        if (!className) return '';
        const str = Array.isArray(className) ? className[0] : className;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }
}