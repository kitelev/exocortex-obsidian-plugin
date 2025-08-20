import { App, TFile } from 'obsidian';
import { ChildrenEffortsBlockConfig } from '../../domain/entities/LayoutBlock';

export class ChildrenEffortsBlockRenderer {
    constructor(private app: App) {}

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        dv: any
    ): Promise<void> {
        const childrenConfig = config as ChildrenEffortsBlockConfig;
        
        // Get all backlinks for current file
        const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);
        
        if (!backlinks || !backlinks.data || backlinks.data.size === 0) {
            container.createEl('p', { 
                text: 'No children efforts found',
                cls: 'exocortex-empty'
            });
            return;
        }

        // Convert backlinks to file array and filter for ems__Effort_parent relationships
        let childrenFiles: TFile[] = [];
        for (const [path] of backlinks.data) {
            const backlinkFile = this.app.vault.getAbstractFileByPath(path);
            if (backlinkFile && backlinkFile.path) {
                const tFile = backlinkFile as TFile;
                // Check if this file references current file via ems__Effort_parent
                if (this.isChildEffort(tFile, file)) {
                    childrenFiles.push(tFile);
                }
            }
        }

        // Filter by class if specified
        if (childrenConfig.filterByClass) {
            const targetClass = this.cleanClassName(childrenConfig.filterByClass);
            childrenFiles = childrenFiles.filter(f => {
                const metadata = this.app.metadataCache.getFileCache(f);
                const instanceClass = metadata?.frontmatter?.['exo__Instance_class'];
                return this.cleanClassName(instanceClass) === targetClass;
            });
        }

        // Limit results if specified
        const totalCount = childrenFiles.length;
        if (childrenConfig.maxResults && childrenConfig.maxResults > 0) {
            childrenFiles = childrenFiles.slice(0, childrenConfig.maxResults);
        }

        // Show count
        const info = container.createDiv({ cls: 'exocortex-children-efforts-info' });
        info.createEl('span', { 
            text: `${totalCount} child effort${totalCount !== 1 ? 's' : ''}${childrenFiles.length < totalCount ? `, showing ${childrenFiles.length}` : ''}`,
            cls: 'exocortex-children-efforts-count'
        });

        if (childrenFiles.length === 0) {
            container.createEl('p', { 
                text: 'No matching child efforts found',
                cls: 'exocortex-empty'
            });
            return;
        }

        // Group by class if specified
        if (childrenConfig.groupByClass) {
            this.renderGroupedChildrenEfforts(container, childrenFiles, childrenConfig);
        } else {
            this.renderFlatChildrenEfforts(container, childrenFiles, childrenConfig);
        }
    }

    private isChildEffort(childFile: TFile, parentFile: TFile): boolean {
        const metadata = this.app.metadataCache.getFileCache(childFile);
        const frontmatter = metadata?.frontmatter;
        
        if (!frontmatter) return false;
        
        const effortParent = frontmatter['ems__Effort_parent'];
        if (!effortParent) return false;
        
        // Handle both string and array formats
        const parentRefs = Array.isArray(effortParent) ? effortParent : [effortParent];
        
        // Check if any parent reference matches our current file
        return parentRefs.some(ref => {
            const cleanRef = this.cleanClassName(ref);
            const parentName = parentFile.basename.replace(/\.md$/, '');
            
            // Match against various possible reference formats
            return cleanRef === parentName || 
                   cleanRef === parentFile.basename ||
                   cleanRef === parentFile.path ||
                   cleanRef === parentFile.path.replace(/\.md$/, '') ||
                   // Also check if the reference contains the parent name (for partial matches)
                   ref.includes(`[[${parentName}]]`) ||
                   ref.includes(parentName);
        });
    }

    private renderFlatChildrenEfforts(
        container: HTMLElement, 
        files: TFile[], 
        config: ChildrenEffortsBlockConfig
    ): void {
        const list = container.createEl('ul', { cls: 'exocortex-children-efforts-list' });
        
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
                item.createEl('span', {
                    text: ` (${this.cleanClassName(instanceClass)})`,
                    cls: 'exocortex-class-info'
                });
            }
            
            // Show parent path if enabled
            if (config.showParentPath) {
                const effortParent = frontmatter['ems__Effort_parent'];
                if (effortParent) {
                    const parentPath = Array.isArray(effortParent) ? effortParent[0] : effortParent;
                    item.createEl('span', {
                        text: ` → ${this.cleanClassName(parentPath)}`,
                        cls: 'exocortex-parent-path'
                    });
                }
            }
        });
    }

    private renderGroupedChildrenEfforts(
        container: HTMLElement, 
        files: TFile[], 
        config: ChildrenEffortsBlockConfig
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
            const groupContainer = container.createDiv({ cls: 'exocortex-children-efforts-group' });
            
            // Group header
            groupContainer.createEl('h4', {
                text: `${className} (${groupFiles.length})`,
                cls: 'children-efforts-group-header'
            });
            
            // Group content
            const list = groupContainer.createEl('ul', { cls: 'exocortex-children-efforts-list' });
            
            groupFiles.forEach(file => {
                const metadata = this.app.metadataCache.getFileCache(file);
                const frontmatter = metadata?.frontmatter || {};
                
                const item = list.createEl('li');
                item.createEl('a', {
                    text: frontmatter['exo__Asset_label'] || file.basename,
                    href: file.path,
                    cls: 'internal-link'
                });
                
                // Show parent path if enabled
                if (config.showParentPath) {
                    const effortParent = frontmatter['ems__Effort_parent'];
                    if (effortParent) {
                        const parentPath = Array.isArray(effortParent) ? effortParent[0] : effortParent;
                        item.createEl('span', {
                            text: ` → ${this.cleanClassName(parentPath)}`,
                            cls: 'exocortex-parent-path'
                        });
                    }
                }
            });
        });
    }

    private cleanClassName(className: any): string {
        if (!className) return '';
        const str = Array.isArray(className) ? className[0] : className;
        return str?.toString().replace(/\[\[|\]\]/g, '') || '';
    }
}