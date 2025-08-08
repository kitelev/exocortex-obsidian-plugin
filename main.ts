import { Plugin, Notice, MarkdownPostProcessorContext } from 'obsidian';

export default class ExocortexPlugin extends Plugin {
    
    async onload(): Promise<void> {
        console.log('🚀 Exocortex: Loading SPARQL plugin v2.0...');
        
        // Register SPARQL code block processor
        this.registerMarkdownCodeBlockProcessor('sparql', this.processSPARQL.bind(this));
        
        new Notice('🔍 Exocortex: SPARQL support enabled!');
        console.log('✅ Exocortex: SPARQL processor registered');
    }
    
    async processSPARQL(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
        console.log('🔍 SPARQL query received:', source);
        
        el.empty();
        
        // Create styled container
        const container = el.createDiv({
            cls: 'exocortex-sparql-container'
        });
        
        // Add styles
        container.style.cssText = `
            border: 2px solid #4a90e2;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            background: #f8f9ff;
        `;
        
        // Title with emoji
        const title = container.createEl('h3');
        title.textContent = '🔍 SPARQL Query Results';
        title.style.cssText = `
            color: #4a90e2;
            margin: 0 0 12px 0;
            font-size: 18px;
        `;
        
        // Show query
        const queryDiv = container.createDiv();
        queryDiv.style.marginBottom = '16px';
        
        const queryLabel = queryDiv.createEl('strong');
        queryLabel.textContent = 'Query:';
        queryLabel.style.display = 'block';
        queryLabel.style.marginBottom = '8px';
        
        const queryPre = queryDiv.createEl('pre');
        queryPre.textContent = source;
        queryPre.style.cssText = `
            background: #f0f0f0;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
            border-left: 4px solid #4a90e2;
        `;
        
        try {
            // Execute SPARQL
            const startTime = Date.now();
            const results = await this.executeSPARQL(source);
            const execTime = Date.now() - startTime;
            
            console.log(`✅ SPARQL executed in ${execTime}ms, ${results.length} results`);
            
            // Results section
            const resultsDiv = container.createDiv();
            
            if (results && results.length > 0) {
                const resultsLabel = resultsDiv.createEl('strong');
                resultsLabel.textContent = `Results (${results.length} found):`;
                resultsLabel.style.cssText = 'display: block; margin-bottom: 8px; color: #2d5aa0;';
                
                // Create table
                const table = resultsDiv.createEl('table');
                table.style.cssText = `
                    width: 100%;
                    border-collapse: collapse;
                    margin: 8px 0;
                    background: white;
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                `;
                
                // Header
                const thead = table.createEl('thead');
                const headerRow = thead.createEl('tr');
                headerRow.style.background = '#4a90e2';
                
                const columns = Object.keys(results[0]);
                columns.forEach(col => {
                    const th = headerRow.createEl('th');
                    th.textContent = col;
                    th.style.cssText = `
                        padding: 12px;
                        text-align: left;
                        color: white;
                        font-weight: bold;
                        border: none;
                    `;
                });
                
                // Body
                const tbody = table.createEl('tbody');
                results.forEach((row, idx) => {
                    const tr = tbody.createEl('tr');
                    if (idx % 2 === 0) {
                        tr.style.background = '#f8f9ff';
                    }
                    tr.style.borderBottom = '1px solid #e0e0e0';
                    
                    columns.forEach(col => {
                        const td = tr.createEl('td');
                        const value = row[col] || '';
                        td.style.cssText = `
                            padding: 10px 12px;
                            border: none;
                            vertical-align: top;
                        `;
                        
                        if (value.includes('file://')) {
                            const link = td.createEl('a');
                            link.textContent = value.replace('file://', '');
                            link.style.cssText = 'color: #4a90e2; cursor: pointer; text-decoration: underline;';
                            link.onclick = () => {
                                this.app.workspace.openLinkText(value.replace('file://', ''), '');
                            };
                        } else {
                            td.textContent = value;
                        }
                    });
                });
                
                // Stats
                const stats = resultsDiv.createEl('div');
                stats.textContent = `⚡ Executed in ${execTime}ms`;
                stats.style.cssText = `
                    font-size: 12px;
                    color: #666;
                    margin-top: 8px;
                    font-style: italic;
                `;
                
            } else {
                const noResults = resultsDiv.createEl('div');
                noResults.innerHTML = '📭 <strong>No results found</strong>';
                noResults.style.cssText = `
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    background: #f0f0f0;
                    border-radius: 4px;
                `;
            }
            
        } catch (error: any) {
            console.error('❌ SPARQL error:', error);
            
            const errorDiv = container.createDiv();
            errorDiv.style.cssText = `
                background: #ffebee;
                border: 2px solid #f44336;
                border-radius: 4px;
                padding: 16px;
                margin-top: 16px;
            `;
            
            errorDiv.innerHTML = `
                <strong style="color: #f44336;">❌ SPARQL Error:</strong><br>
                <span style="color: #d32f2f;">${error.message}</span>
            `;
        }
    }
    
    async executeSPARQL(query: string): Promise<any[]> {
        console.log('🔄 Executing SPARQL:', query);
        
        const files = this.app.vault.getMarkdownFiles();
        const triples: any[] = [];
        
        // Extract triples from files
        for (const file of files) {
            try {
                const content = await this.app.vault.read(file);
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                
                if (frontmatterMatch) {
                    const frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
                    const subject = `file://${file.basename}`;
                    
                    Object.entries(frontmatter).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            value.forEach((v: any) => {
                                triples.push({
                                    subject,
                                    predicate: key,
                                    object: String(v)
                                });
                            });
                        } else {
                            triples.push({
                                subject,
                                predicate: key,
                                object: String(value)
                            });
                        }
                    });
                }
            } catch (err) {
                console.warn(`Failed to process ${file.path}:`, err);
            }
        }
        
        console.log(`📊 Extracted ${triples.length} triples from ${files.length} files`);
        
        return this.processQuery(query, triples);
    }
    
    parseFrontmatter(yaml: string): Record<string, any> {
        const result: Record<string, any> = {};
        const lines = yaml.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.includes(':')) continue;
            
            const [key, ...valueParts] = trimmed.split(':');
            const value = valueParts.join(':').trim().replace(/["']/g, '');
            
            if (value) {
                result[key.trim()] = value;
            }
        }
        
        return result;
    }
    
    processQuery(query: string, triples: any[]): any[] {
        const results: any[] = [];
        
        try {
            // Basic SELECT parsing
            const selectMatch = query.match(/SELECT\s+(.*?)\s+WHERE/i);
            if (!selectMatch) {
                throw new Error('Only SELECT queries supported');
            }
            
            const selectClause = selectMatch[1].trim();
            let variables: string[] = [];
            
            if (selectClause === '*') {
                variables = ['subject', 'predicate', 'object'];
            } else {
                const varMatches = selectClause.match(/\?\w+/g);
                variables = varMatches ? varMatches.map(v => v.substring(1)) : [];
            }
            
            // Apply LIMIT
            const limitMatch = query.match(/LIMIT\s+(\d+)/i);
            const limit = limitMatch ? parseInt(limitMatch[1]) : 50;
            
            // Simple pattern matching
            const limitedTriples = triples.slice(0, limit);
            
            limitedTriples.forEach(triple => {
                const result: any = {};
                
                variables.forEach(variable => {
                    switch(variable) {
                        case 'subject':
                        case 's':
                            result[variable] = triple.subject;
                            break;
                        case 'predicate': 
                        case 'p':
                            result[variable] = triple.predicate;
                            break;
                        case 'object':
                        case 'o':
                            result[variable] = triple.object;
                            break;
                        case 'task':
                            if (triple.predicate.includes('Instance_class') && triple.object.includes('Task')) {
                                result[variable] = triple.subject;
                            }
                            break;
                        case 'status':
                            if (triple.predicate.includes('status')) {
                                result[variable] = triple.object;
                            }
                            break;
                        case 'label':
                            if (triple.predicate.includes('label')) {
                                result[variable] = triple.object;
                            }
                            break;
                    }
                });
                
                if (Object.keys(result).length > 0) {
                    results.push(result);
                }
            });
            
        } catch (error: any) {
            console.error('Query processing error:', error);
            throw error;
        }
        
        return results;
    }
    
    async onunload(): Promise<void> {
        console.log('👋 Exocortex: Plugin unloaded');
    }
}
