import { App, TFile } from 'obsidian';
import { BacklinksBlockConfig } from '../../domain/entities/LayoutBlock';

export class BacklinksBlockRenderer {
    constructor(private app: App) {}

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        dv: any
    ): Promise<void> {
        const backlinksConfig = config as BacklinksBlockConfig;
        
        // Get backlinks for current file
        const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);
        
        if (!backlinks || !backlinks.data || backlinks.data.size === 0) {
            container.createEl('p', { 
                text: 'No backlinks found',
                cls: 'exocortex-empty'
            });
            return;
        }

        // Convert backlinks to file array
        let backlinkFiles: TFile[] = [];
        for (const [path] of backlinks.data) {
            const backlinkFile = this.app.vault.getAbstractFileByPath(path);
            if (backlinkFile && backlinkFile.path) {
                backlinkFiles.push(backlinkFile as TFile);
            }
        }

        // Filter by class if specified
        if (backlinksConfig.filterByClass) {
            const targetClass = this.cleanClassName(backlinksConfig.filterByClass);
            backlinkFiles = backlinkFiles.filter(f => {
                const metadata = this.app.metadataCache.getFileCache(f);
                const instanceClass = metadata?.frontmatter?.['exo__Instance_class'];
                return this.cleanClassName(instanceClass) === targetClass;
            });
        }

        // Limit results if specified
        const totalCount = backlinkFiles.length;
        if (backlinksConfig.maxResults && backlinksConfig.maxResults > 0) {
            backlinkFiles = backlinkFiles.slice(0, backlinksConfig.maxResults);
        }

        // Show count
        const info = container.createDiv({ cls: 'exocortex-backlinks-info' });
        info.createEl('span', { 
            text: `${totalCount} backlink${totalCount !== 1 ? 's' : ''}${backlinkFiles.length < totalCount ? `, showing ${backlinkFiles.length}` : ''}`,
            cls: 'exocortex-backlinks-count'
        });

        if (backlinkFiles.length === 0) {
            container.createEl('p', { 
                text: 'No matching backlinks found',
                cls: 'exocortex-empty'
            });
            return;
        }

        // Group by class if specified
        if (backlinksConfig.groupByClass) {
            this.renderGroupedBacklinks(container, backlinkFiles);
        } else {
            this.renderFlatBacklinks(container, backlinkFiles);
        }
    }

    private renderFlatBacklinks(container: HTMLElement, files: TFile[]): void {
        const list = container.createEl('ul', { cls: 'exocortex-backlinks-list' });
        
        files.forEach(file => {
            const metadata = this.app.metadataCache.getFileCache(file);
            const frontmatter = metadata?.frontmatter || {};
            
            const item = list.createEl('li');
            const link = item.createEl('a', {
                text: frontmatter['exo__Asset_label'] || file.basename,
                href: file.path,
                cls: 'internal-link'
            });
            
            // Add class info
            const instanceClass = frontmatter['exo__Instance_class'];
            if (instanceClass) {
                const classSpan = item.createEl('span', {
                    text: ` (${this.cleanClassName(instanceClass)})`,
                    cls: 'exocortex-class-info'
                });
            }
        });
    }

    private renderGroupedBacklinks(container: HTMLElement, files: TFile[]): void {
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
            const groupContainer = container.createDiv({ cls: 'exocortex-backlinks-group' });
            
            // Group header
            groupContainer.createEl('h4', {
                text: `${className} (${groupFiles.length})`,
                cls: 'backlinks-group-header'
            });
            
            // Group content
            const list = groupContainer.createEl('ul', { cls: 'exocortex-backlinks-list' });
            
            groupFiles.forEach(file => {
                const metadata = this.app.metadataCache.getFileCache(file);
                const frontmatter = metadata?.frontmatter || {};
                
                const item = list.createEl('li');
                item.createEl('a', {
                    text: frontmatter['exo__Asset_label'] || file.basename,
                    href: file.path,
                    cls: 'internal-link'
                });
            });
        });
    }


    private cleanClassName(className: any): string {
        if (!className) return '';
        const str = Array.isArray(className) ? className[0] : className;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }
}