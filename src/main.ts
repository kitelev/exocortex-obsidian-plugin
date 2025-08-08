import { Plugin, Notice, MarkdownPostProcessorContext } from 'obsidian';

interface Triple {
    subject: string;
    predicate: string;
    object: string;
}

interface QueryResult {
    [key: string]: string;
}

export default class ExocortexPlugin extends Plugin {
    
    async onload(): Promise<void> {
        console.log('Exocortex: Loading SPARQL plugin...');
        
        // Register SPARQL code block processor
        this.registerMarkdownCodeBlockProcessor('sparql', this.processSPARQLBlock.bind(this));
        
        new Notice('Exocortex: SPARQL support enabled!');
        console.log('Exocortex: SPARQL processor registered successfully');
    }
    
    async processSPARQLBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
        console.log('SPARQL query received:', source);
        
        // Clear element
        el.empty();
        
        // Create container
        const container = el.createDiv();
        container.style.border = '1px solid #ccc';
        container.style.padding = '10px';
        container.style.margin = '10px 0';
        container.style.borderRadius = '5px';
        
        // Title
        const title = container.createEl('h4');
        title.textContent = '🔍 SPARQL Query Results';
        title.style.color = '#4a90e2';
        title.style.marginTop = '0';
        
        // Show the query
        const querySection = container.createDiv();
        querySection.style.marginBottom = '15px';
        
        const queryLabel = querySection.createEl('strong');
        queryLabel.textContent = 'Query:';
        queryLabel.style.display = 'block';
        queryLabel.style.marginBottom = '5px';
        
        const queryPre = querySection.createEl('pre');
        queryPre.textContent = source;
        queryPre.style.backgroundColor = '#f5f5f5';
        queryPre.style.padding = '10px';
        queryPre.style.borderRadius = '3px';
        queryPre.style.fontSize = '12px';
        queryPre.style.overflow = 'auto';
        
        try {
            // Execute query
            const results = await this.executeSPARQL(source);
            
            // Results section
            const resultsSection = container.createDiv();
            const resultsLabel = resultsSection.createEl('strong');
            resultsLabel.textContent = 'Results:';
            resultsLabel.style.display = 'block';
            resultsLabel.style.marginBottom = '10px';
            
            if (results && results.length > 0) {
                // Create table
                const table = resultsSection.createEl('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.marginBottom = '10px';
                
                // Table header
                const thead = table.createEl('thead');
                const headerRow = thead.createEl('tr');
                const columns = Object.keys(results[0]);
                
                columns.forEach(col => {
                    const th = headerRow.createEl('th');
                    th.textContent = col;
                    th.style.border = '1px solid #ddd';
                    th.style.padding = '8px';
                    th.style.backgroundColor = '#f9f9f9';
                    th.style.textAlign = 'left';
                });
                
                // Table body
                const tbody = table.createEl('tbody');
                results.forEach((row, index) => {
                    const tr = tbody.createEl('tr');
                    if (index % 2 === 0) {
                        tr.style.backgroundColor = '#f9f9f9';
                    }
                    
                    columns.forEach(col => {
                        const td = tr.createEl('td');
                        const value = row[col] || '';
                        td.textContent = value;
                        td.style.border = '1px solid #ddd';
                        td.style.padding = '8px';
                        
                        // Make file links clickable
                        if (value.includes('file://')) {
                            td.style.color = '#4a90e2';
                            td.style.cursor = 'pointer';
                            td.onclick = () => {
                                const filename = value.replace('file://', '');
                                this.app.workspace.openLinkText(filename, '');
                            };
                        }
                    });
                });
                
                // Stats
                const stats = resultsSection.createEl('div');
                stats.textContent = `Found ${results.length} result(s)`;
                stats.style.fontSize = '12px';
                stats.style.color = '#666';
                stats.style.fontStyle = 'italic';
            } else {
                const noResults = resultsSection.createEl('p');
                noResults.textContent = 'No results found';
                noResults.style.color = '#666';
                noResults.style.fontStyle = 'italic';
            }
            
        } catch (error: any) {
            // Error section
            const errorSection = container.createDiv();
            errorSection.style.color = '#e74c3c';
            errorSection.style.marginTop = '10px';
            
            const errorLabel = errorSection.createEl('strong');
            errorLabel.textContent = 'Error:';
            errorLabel.style.display = 'block';
            errorLabel.style.marginBottom = '5px';
            
            const errorMsg = errorSection.createEl('p');
            errorMsg.textContent = error.message || 'Unknown error occurred';
            errorMsg.style.margin = '0';
            
            console.error('SPARQL error:', error);
        }
    }
    
    async executeSPARQL(query: string): Promise<QueryResult[]> {
        console.log('Executing SPARQL query:', query);
        
        // Get all markdown files
        const files = this.app.vault.getMarkdownFiles();
        const triples: Triple[] = [];
        
        // Extract RDF triples from frontmatter
        for (const file of files) {
            try {
                const content = await this.app.vault.read(file);
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                
                if (frontmatterMatch) {
                    const frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
                    const subject = `file://${file.basename}`;
                    
                    for (const [key, value] of Object.entries(frontmatter)) {
                        if (Array.isArray(value)) {
                            value.forEach((v: any) => {
                                triples.push({
                                    subject: subject,
                                    predicate: key,
                                    object: String(v)
                                });
                            });
                        } else {
                            triples.push({
                                subject: subject,
                                predicate: key,
                                object: String(value)
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to process ${file.path}:`, error);
            }
        }
        
        console.log(`Extracted ${triples.length} triples from ${files.length} files`);
        
        // Simple query processing
        const results = this.processQuery(query, triples);
        console.log(`Query returned ${results.length} results`);
        
        return results;
    }
    
    parseFrontmatter(yaml: string): Record<string, any> {
        const result: Record<string, any> = {};
        const lines = yaml.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.includes(':')) {
                const [key, ...valueParts] = trimmed.split(':');
                const value = valueParts.join(':').trim().replace(/["']/g, '');
                
                if (value) {
                    result[key.trim()] = value;
                }
            }
        }
        
        return result;
    }
    
    processQuery(query: string, triples: Triple[]): QueryResult[] {
        const results: QueryResult[] = [];
        
        try {
            // Extract variables from SELECT clause
            const selectMatch = query.match(/SELECT\s+(.*?)\s+WHERE/i);
            if (!selectMatch) {
                return [{ error: 'Invalid SELECT query' }];
            }
            
            const selectClause = selectMatch[1].trim();
            let variables: string[] = [];
            
            if (selectClause === '*') {
                variables = ['subject', 'predicate', 'object'];
            } else {
                const varMatches = selectClause.match(/\?\w+/g);
                if (varMatches) {
                    variables = varMatches.map(v => v.substring(1));
                }
            }
            
            // Simple pattern matching
            if (query.toLowerCase().includes('task')) {
                // Filter for tasks
                const taskTriples = triples.filter(t => 
                    t.object.includes('Task') || 
                    t.predicate.includes('Instance_class') ||
                    t.subject.includes('Task')
                );
                
                taskTriples.forEach(triple => {
                    const result: QueryResult = {};
                    if (variables.includes('subject') || variables.includes('s')) {
                        result.subject = triple.subject;
                    }
                    if (variables.includes('predicate') || variables.includes('p')) {
                        result.predicate = triple.predicate;
                    }
                    if (variables.includes('object') || variables.includes('o')) {
                        result.object = triple.object;
                    }
                    if (variables.includes('task')) {
                        result.task = triple.subject;
                    }
                    if (variables.includes('status') && triple.predicate.includes('status')) {
                        result.status = triple.object;
                    }
                    if (variables.includes('label') && triple.predicate.includes('label')) {
                        result.label = triple.object;
                    }
                    
                    if (Object.keys(result).length > 0) {
                        results.push(result);
                    }
                });
            } else {
                // Return all triples (limited)
                const limit = query.match(/LIMIT\s+(\d+)/i);
                const maxResults = limit ? parseInt(limit[1]) : 20;
                
                triples.slice(0, maxResults).forEach(triple => {
                    const result: QueryResult = {};
                    if (variables.includes('subject') || variables.includes('s')) {
                        result.s = triple.subject;
                    }
                    if (variables.includes('predicate') || variables.includes('p')) {
                        result.p = triple.predicate;
                    }
                    if (variables.includes('object') || variables.includes('o')) {
                        result.o = triple.object;
                    }
                    
                    if (Object.keys(result).length > 0) {
                        results.push(result);
                    }
                });
            }
            
        } catch (error: any) {
            console.error('Query processing error:', error);
            return [{ error: error.message }];
        }
        
        return results;
    }
    
    async onunload(): Promise<void> {
        console.log('Exocortex: Plugin unloaded');
    }
}
