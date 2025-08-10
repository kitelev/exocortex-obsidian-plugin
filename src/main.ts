import { Plugin, Notice, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { Graph } from './domain/semantic/core/Graph';
import { Triple, IRI, Literal } from './domain/semantic/core/Triple';
import { SPARQLProcessor } from './presentation/processors/SPARQLProcessor';
import { GraphVisualizationProcessor } from './presentation/processors/GraphVisualizationProcessor';
import { CreateAssetModal } from './presentation/modals/CreateAssetModal';
import { ExportRDFModal } from './presentation/modals/ExportRDFModal';
import { ImportRDFModal } from './presentation/modals/ImportRDFModal';
import { DIContainer } from './infrastructure/container/DIContainer';
import { RDFService } from './application/services/RDFService';

export default class ExocortexPlugin extends Plugin {
    private graph: Graph;
    private sparqlProcessor: SPARQLProcessor;
    private graphVisualizationProcessor: GraphVisualizationProcessor;
    private container: DIContainer;
    private rdfService: RDFService;
    
    async onload(): Promise<void> {
        console.log('🚀 Exocortex: Loading plugin v2.1.6...');
        
        // Initialize DI container
        this.container = DIContainer.getInstance();
        await this.container.initialize(this.app);
        
        // Initialize graph
        this.graph = new Graph();
        
        // Initialize RDF service
        this.rdfService = new RDFService(this.app);
        
        // Load vault data into graph
        await this.loadVaultIntoGraph();
        
        // Initialize SPARQL processor with cache configuration
        const cacheConfig = {
            maxSize: 500,           // Reasonable cache size for Obsidian plugin
            defaultTTL: 5 * 60 * 1000,  // 5 minutes TTL
            enabled: true
        };
        this.sparqlProcessor = new SPARQLProcessor(this, this.graph, undefined, cacheConfig);
        
        // Initialize Graph Visualization processor
        this.graphVisualizationProcessor = new GraphVisualizationProcessor(this, this.graph);
        
        // Register SPARQL code block processor
        this.registerMarkdownCodeBlockProcessor('sparql', 
            (source, el, ctx) => this.sparqlProcessor.processCodeBlock(source, el, ctx)
        );
        
        // Register Graph Visualization code block processor
        this.registerMarkdownCodeBlockProcessor('graph', 
            (source, el, ctx) => this.graphVisualizationProcessor.processCodeBlock(source, el, ctx)
        );
        
        // Register command: Create new asset
        this.addCommand({
            id: 'create-exo-asset',
            name: 'Create new ExoAsset',
            hotkeys: [{ modifiers: ["Mod", "Shift"], key: "n" }],
            callback: () => {
                new CreateAssetModal(this.app).open();
            }
        });
        
        // Add ribbon icon for quick access
        this.addRibbonIcon('plus-circle', 'Create ExoAsset', () => {
            new CreateAssetModal(this.app).open();
        });

        // Register command: View SPARQL cache statistics
        this.addCommand({
            id: 'view-sparql-cache-stats',
            name: 'View SPARQL cache statistics',
            callback: () => {
                const stats = this.sparqlProcessor.getCacheStatistics();
                const message = [
                    `SPARQL Query Cache Statistics:`,
                    `• Cache hits: ${stats.hits}`,
                    `• Cache misses: ${stats.misses}`,
                    `• Hit rate: ${stats.hitRate.toFixed(1)}%`,
                    `• Cached entries: ${stats.size}/${stats.maxSize}`,
                    `• Total queries: ${stats.totalQueries}`,
                    `• Evictions: ${stats.evictions}`
                ].join('\n');
                new Notice(message, 8000);
            }
        });

        // Register command: Clear SPARQL cache
        this.addCommand({
            id: 'clear-sparql-cache',
            name: 'Clear SPARQL cache',
            callback: () => {
                this.sparqlProcessor.invalidateCache();
                new Notice('SPARQL query cache cleared!');
            }
        });

        // Register command: Export knowledge graph
        this.addCommand({
            id: 'export-knowledge-graph',
            name: 'Export knowledge graph',
            callback: () => {
                const modal = new ExportRDFModal(
                    this.app,
                    this.graph,
                    this.rdfService.getNamespaceManager(),
                    (result) => {
                        console.log('Knowledge graph exported:', result);
                    }
                );
                modal.open();
            }
        });

        // Register command: Import RDF data
        this.addCommand({
            id: 'import-rdf-data',
            name: 'Import RDF data',
            callback: () => {
                const modal = new ImportRDFModal(
                    this.app,
                    this.graph,
                    this.rdfService.getNamespaceManager(),
                    async (importedGraph, options) => {
                        try {
                            if (options.mergeMode === 'replace') {
                                this.graph.clear();
                                this.graph.merge(importedGraph);
                            } else {
                                this.graph.merge(importedGraph);
                            }
                            
                            // Invalidate SPARQL cache since graph changed
                            this.sparqlProcessor.invalidateCache();
                            
                            console.log('RDF data imported successfully');
                        } catch (error) {
                            console.error('Failed to import RDF data:', error);
                            new Notice(`Import failed: ${error.message}`);
                        }
                    }
                );
                modal.open();
            }
        });
        
        // Register file modification handler to update graph
        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.updateFileInGraph(file);
                    // Invalidate SPARQL query cache when data changes
                    this.sparqlProcessor.invalidateCache();
                }
            })
        );
        
        // Register file creation handler
        this.registerEvent(
            this.app.vault.on('create', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.updateFileInGraph(file);
                    // Invalidate SPARQL query cache when data changes
                    this.sparqlProcessor.invalidateCache();
                }
            })
        );
        
        // Register file deletion handler
        this.registerEvent(
            this.app.vault.on('delete', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.removeFileFromGraph(file);
                    // Invalidate SPARQL query cache when data changes
                    this.sparqlProcessor.invalidateCache();
                }
            })
        );
        
        new Notice('🔍 Exocortex: SPARQL support and graph visualization enabled!');
        console.log('✅ Exocortex: SPARQL processor and graph visualization registered');
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
        const subject = new IRI(`file://${file.basename}`);
        const triplesToRemove = this.graph.match(subject, null, null);
        
        for (const triple of triplesToRemove) {
            this.graph.remove(triple);
        }
    }
    
    private extractTriplesFromFile(file: TFile, content: string): Triple[] {
        const triples: Triple[] = [];
        const subject = new IRI(`file://${file.basename}`);
        
        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
            const frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
            
            for (const [key, value] of Object.entries(frontmatter)) {
                if (Array.isArray(value)) {
                    for (const v of value) {
                        triples.push(new Triple(
                            subject,
                            new IRI(key),
                            Literal.string(String(v))
                        ));
                    }
                } else if (value !== null && value !== undefined) {
                    triples.push(new Triple(
                        subject,
                        new IRI(key),
                        Literal.string(String(value))
                    ));
                }
            }
        }
        
        // Add basic file metadata
        triples.push(new Triple(
            subject,
            new IRI('file_path'),
            Literal.string(file.path)
        ));
        
        triples.push(new Triple(
            subject,
            new IRI('file_name'),
            Literal.string(file.name)
        ));
        
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
        if (this.sparqlProcessor) {
            this.sparqlProcessor.destroy();
        }
    }
}