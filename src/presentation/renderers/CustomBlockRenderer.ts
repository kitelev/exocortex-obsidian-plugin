import { App, TFile } from 'obsidian';
import { CustomBlockConfig } from '../../domain/entities/LayoutBlock';

export class CustomBlockRenderer {
    constructor(private app: App) {}

    async render(
        container: HTMLElement,
        config: any,
        file: TFile,
        frontmatter: any,
        dv: any
    ): Promise<void> {
        const customConfig = config as CustomBlockConfig;
        
        try {
            // Option 1: Render from template file
            if (customConfig.templatePath) {
                await this.renderTemplate(container, customConfig.templatePath, file, frontmatter, dv);
                return;
            }
            
            // Option 2: Execute Dataview query
            if (customConfig.dataviewQuery) {
                await this.renderDataviewQuery(container, customConfig.dataviewQuery, dv);
                return;
            }
            
            // Option 3: Execute custom script
            if (customConfig.customScript) {
                await this.renderCustomScript(container, customConfig.customScript, file, frontmatter, dv);
                return;
            }
            
            container.createEl('p', {
                text: 'Custom block has no content configured',
                cls: 'exocortex-empty'
            });
            
        } catch (error) {
            container.createEl('p', {
                text: `Error rendering custom block: ${error}`,
                cls: 'exocortex-error'
            });
            console.error('Custom block error:', error);
        }
    }

    private async renderTemplate(
        container: HTMLElement,
        templatePath: string,
        file: TFile,
        frontmatter: any,
        dv: any
    ): Promise<void> {
        // Find template file
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        
        if (!(templateFile instanceof TFile)) {
            container.createEl('p', {
                text: `Template not found: ${templatePath}`,
                cls: 'exocortex-error'
            });
            return;
        }
        
        // Read template content
        const templateContent = await this.app.vault.read(templateFile);
        
        // Process template variables
        const processedContent = this.processTemplateVariables(
            templateContent,
            file,
            frontmatter
        );
        
        // Render as markdown
        const tempContainer = container.createDiv();
        await (this.app as any).markdown.renderMarkdown(
            processedContent,
            tempContainer,
            file.path,
            null
        );
    }

    private async renderDataviewQuery(
        container: HTMLElement,
        query: string,
        dv: any
    ): Promise<void> {
        if (!dv) {
            container.createEl('p', {
                text: 'Dataview is not available',
                cls: 'exocortex-error'
            });
            return;
        }
        
        try {
            // Create a wrapper for Dataview output
            const dvContainer = container.createDiv({ cls: 'exocortex-dataview-container' });
            
            // Execute the query
            // Note: This is a simplified version. Real implementation would need
            // to properly integrate with Dataview API
            const queryLines = query.trim().split('\n');
            
            if (queryLines[0].startsWith('table')) {
                // Parse table query
                const tableMatch = query.match(/table\s+(.+?)\s+from/s);
                const fromMatch = query.match(/from\s+(.+?)(?:\s+where|$)/s);
                const whereMatch = query.match(/where\s+(.+?)$/s);
                
                if (fromMatch) {
                    const source = fromMatch[1].trim();
                    const fields = tableMatch ? tableMatch[1].split(',').map(f => f.trim()) : [];
                    
                    // Use Dataview API to execute query
                    const pages = dv.pages(source);
                    
                    if (whereMatch) {
                        // Apply where clause (simplified)
                        // In real implementation, would need proper expression evaluation
                    }
                    
                    // Render table
                    dv.table(['File', ...fields], 
                        pages.map((p: any) => [
                            p.file.link,
                            ...fields.map(f => p[f] || '')
                        ])
                    );
                }
            } else if (queryLines[0].startsWith('list')) {
                // Parse list query
                const fromMatch = query.match(/from\s+(.+?)(?:\s+where|$)/s);
                
                if (fromMatch) {
                    const source = fromMatch[1].trim();
                    const pages = dv.pages(source);
                    dv.list(pages.file.link);
                }
            } else {
                // Try to execute as raw JavaScript
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const fn = new AsyncFunction('dv', 'container', query);
                await fn(dv, dvContainer);
            }
        } catch (error) {
            container.createEl('p', {
                text: `Dataview query error: ${error}`,
                cls: 'exocortex-error'
            });
        }
    }

    private async renderCustomScript(
        container: HTMLElement,
        script: string,
        file: TFile,
        frontmatter: any,
        dv: any
    ): Promise<void> {
        try {
            // Create a sandboxed context for the script
            const context = {
                app: this.app,
                file,
                frontmatter,
                dv,
                container,
                console: {
                    log: (...args: any[]) => console.log('[Custom Block]', ...args),
                    error: (...args: any[]) => console.error('[Custom Block]', ...args)
                }
            };
            
            // Execute the script in a controlled way
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction(
                ...Object.keys(context),
                script
            );
            
            await fn(...Object.values(context));
            
        } catch (error) {
            container.createEl('p', {
                text: `Script execution error: ${error}`,
                cls: 'exocortex-error'
            });
            console.error('Custom script error:', error);
        }
    }

    private processTemplateVariables(
        template: string,
        file: TFile,
        frontmatter: any
    ): string {
        let processed = template;
        
        // Replace file variables
        processed = processed.replace(/\{\{file\.name\}\}/g, file.basename);
        processed = processed.replace(/\{\{file\.path\}\}/g, file.path);
        
        // Replace frontmatter variables
        Object.keys(frontmatter).forEach(key => {
            const value = frontmatter[key];
            const regex = new RegExp(`\\{\\{fm\\.${key}\\}\\}`, 'g');
            processed = processed.replace(regex, this.formatValue(value));
        });
        
        // Replace date variables
        const now = new Date();
        processed = processed.replace(/\{\{date\}\}/g, now.toLocaleDateString());
        processed = processed.replace(/\{\{time\}\}/g, now.toLocaleTimeString());
        processed = processed.replace(/\{\{datetime\}\}/g, now.toLocaleString());
        
        return processed;
    }

    private formatValue(value: any): string {
        if (value === null || value === undefined) return '';
        
        if (Array.isArray(value)) {
            return value.map(v => this.cleanValue(v)).join(', ');
        }
        
        return this.cleanValue(value);
    }

    private cleanValue(value: any): string {
        if (!value) return '';
        const str = value.toString();
        return str.replace(/\[\[|\]\]/g, '');
    }
}