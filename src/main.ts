import { Plugin, Notice, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { Graph, Triple } from './domain/Graph';
import { SPARQLProcessor } from './presentation/processors/SPARQLProcessor';

export default class ExocortexPlugin extends Plugin {
    private graph: Graph;
    private sparqlProcessor: SPARQLProcessor;
    
    async onload(): Promise<void> {
        console.log('🚀 Exocortex: Loading SPARQL plugin v2.1.5...');
        
        // Initialize graph
        this.graph = new Graph();
        
        // Load vault data into graph
        await this.loadVaultIntoGraph();
        
        // Initialize SPARQL processor
        this.sparqlProcessor = new SPARQLProcessor(this, this.graph);
        
        // Register SPARQL code block processor
        this.registerMarkdownCodeBlockProcessor('sparql', 
            (source, el, ctx) => this.sparqlProcessor.processCodeBlock(source, el, ctx)
        );
        
        // Register file modification handler to update graph
        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.updateFileInGraph(file);
                }
            })
        );
        
        // Register file creation handler
        this.registerEvent(
            this.app.vault.on('create', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.updateFileInGraph(file);
                }
            })
        );
        
        // Register file deletion handler
        this.registerEvent(
            this.app.vault.on('delete', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.removeFileFromGraph(file);
                }
            })
        );
        
        new Notice('🔍 Exocortex: SPARQL support enabled!');
        console.log('✅ Exocortex: SPARQL processor registered');
    }
    
    private async loadVaultIntoGraph(): Promise<void> {
        console.log('📊 Loading vault into RDF graph...');
        const startTime = Date.now();
        
        const files = this.app.vault.getMarkdownFiles();
        let triplesCount = 0;
        
        for (const file of files) {
            try {
                const content = await this.app.vault.read(file);
                const triples = this.extractTriplesFromFile(file, content);
                
                for (const triple of triples) {
                    this.graph.add(triple);
                    triplesCount++;
                }
            } catch (err) {
                console.warn(`Failed to process ${file.path}:`, err);
            }
        }
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ Loaded ${triplesCount} triples from ${files.length} files in ${loadTime}ms`);
    }
    
    private async updateFileInGraph(file: TFile): Promise<void> {
        try {
            // Remove old triples for this file
            this.removeFileFromGraph(file);
            
            // Add new triples
            const content = await this.app.vault.read(file);
            const triples = this.extractTriplesFromFile(file, content);
            
            for (const triple of triples) {
                this.graph.add(triple);
            }
        } catch (err) {
            console.warn(`Failed to update ${file.path} in graph:`, err);
        }
    }
    
    private removeFileFromGraph(file: TFile): void {
        const subject = `file://${file.basename}`;
        const triplesToRemove = this.graph.match(subject, null, null);
        
        for (const triple of triplesToRemove) {
            this.graph.remove(triple);
        }
    }
    
    private extractTriplesFromFile(file: TFile, content: string): Triple[] {
        const triples: Triple[] = [];
        const subject = `file://${file.basename}`;
        
        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
            const frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
            
            for (const [key, value] of Object.entries(frontmatter)) {
                if (Array.isArray(value)) {
                    for (const v of value) {
                        triples.push({
                            subject,
                            predicate: key,
                            object: String(v)
                        });
                    }
                } else if (value !== null && value !== undefined) {
                    triples.push({
                        subject,
                        predicate: key,
                        object: String(value)
                    });
                }
            }
        }
        
        // Add basic file metadata
        triples.push({
            subject,
            predicate: 'file_path',
            object: file.path
        });
        
        triples.push({
            subject,
            predicate: 'file_name',
            object: file.name
        });
        
        return triples;
    }
    
    private parseFrontmatter(yaml: string): Record<string, any> {
        const result: Record<string, any> = {};
        const lines = yaml.split('\n');
        let currentKey: string | null = null;
        let currentValue: any = null;
        let inArray = false;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (!trimmed) continue;
            
            // Check for array item
            if (line.startsWith('  - ') || line.startsWith('    - ')) {
                if (currentKey && inArray) {
                    const value = line.substring(line.indexOf('- ') + 2).trim();
                    const cleanValue = value.replace(/^["']|["']$/g, '').replace(/\[\[|\]\]/g, '');
                    if (!Array.isArray(currentValue)) {
                        currentValue = [];
                    }
                    currentValue.push(cleanValue);
                }
                continue;
            }
            
            // Check for key:value pair
            if (trimmed.includes(':')) {
                // Save previous key-value if exists
                if (currentKey !== null && currentValue !== null) {
                    result[currentKey] = currentValue;
                }
                
                const colonIndex = trimmed.indexOf(':');
                currentKey = trimmed.substring(0, colonIndex).trim();
                const valueStr = trimmed.substring(colonIndex + 1).trim();
                
                if (!valueStr) {
                    // Value will be on next lines (array)
                    inArray = true;
                    currentValue = [];
                } else {
                    // Single value
                    inArray = false;
                    currentValue = valueStr.replace(/^["']|["']$/g, '').replace(/\[\[|\]\]/g, '');
                }
            }
        }
        
        // Save last key-value
        if (currentKey !== null && currentValue !== null) {
            result[currentKey] = currentValue;
        }
        
        return result;
    }
    
    async onunload(): Promise<void> {
        console.log('👋 Exocortex: Plugin unloaded');
        if (this.graph) {
            this.graph.clear();
        }
    }
}