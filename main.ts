import { Plugin, Notice, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { Graph, Triple } from './src/domain/Graph';
import { SPARQLProcessor } from './src/presentation/processors/SPARQLProcessor';
import { CreateAssetModal } from './src/presentation/modals/CreateAssetModal';
import { DIContainer } from './src/infrastructure/container/DIContainer';
import { OntologizeAssetCommand } from './src/presentation/commands/OntologizeAssetCommand';
import { LayoutRenderer } from './src/presentation/renderers/LayoutRenderer';
import { PropertyRenderer } from './src/presentation/components/PropertyRenderer';
import { ObsidianClassLayoutRepository } from './src/infrastructure/repositories/ObsidianClassLayoutRepository';
import { ExocortexAPIServer } from './src/infrastructure/api/ExocortexAPIServer';
import { ExoFocusService } from './src/application/services/ExoFocusService';

export default class ExocortexPlugin extends Plugin {
    private graph: Graph;
    private sparqlProcessor: SPARQLProcessor;
    private container: DIContainer;
    private processorRegistered: boolean = false;
    private layoutRenderer: LayoutRenderer;
    private apiServer: ExocortexAPIServer;
    private focusService: ExoFocusService;
    
    async onload(): Promise<void> {
        console.log('🚀 Exocortex: Loading plugin v2.1.12...');
        
        // Initialize DI container
        this.container = DIContainer.initialize(this.app, this);
        
        // Initialize graph
        this.graph = new Graph();
        
        // Initialize layout renderer
        const layoutRepository = new ObsidianClassLayoutRepository(this.app);
        const propertyEditingUseCase = this.container.getPropertyEditingUseCase();
        const propertyRenderer = new PropertyRenderer(this.app, propertyEditingUseCase);
        this.layoutRenderer = new LayoutRenderer(this.app, layoutRepository, propertyRenderer);
        
        // Load vault data into graph
        await this.loadVaultIntoGraph();
        
        // Initialize ExoFocus service
        this.focusService = new ExoFocusService(this.app, this.graph);
        
        // Initialize SPARQL processor with focus service
        this.sparqlProcessor = new SPARQLProcessor(this, this.graph, this.focusService);
        
        // Register SPARQL code block processor with protection against double registration
        try {
            this.registerMarkdownCodeBlockProcessor('sparql', 
                (source, el, ctx) => this.sparqlProcessor.processCodeBlock(source, el, ctx)
            );
            this.processorRegistered = true;
        } catch (error) {
            if (error.message && error.message.includes('already registered')) {
                console.warn('⚠️ SPARQL processor already registered, skipping...');
            } else {
                throw error;
            }
        }
        
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
        
        // Register command: Ontologize relations
        const ontologizeCommand = new OntologizeAssetCommand(this.app);
        this.addCommand({
            id: ontologizeCommand.id,
            name: ontologizeCommand.name,
            callback: () => ontologizeCommand.callback()
        });
        
        // Initialize REST API server
        this.apiServer = new ExocortexAPIServer(this.app, this, this.graph);
        
        // Register command: Start REST API
        this.addCommand({
            id: 'start-rest-api',
            name: 'Start REST API Server',
            callback: async () => {
                if (!this.apiServer.isRunning()) {
                    await this.apiServer.start();
                    const apiKey = this.apiServer.getAPIKey();
                    new Notice(`REST API started. API Key: ${apiKey.substring(0, 10)}...`);
                } else {
                    new Notice('REST API is already running');
                }
            }
        });
        
        // Register command: Stop REST API
        this.addCommand({
            id: 'stop-rest-api',
            name: 'Stop REST API Server',
            callback: async () => {
                if (this.apiServer.isRunning()) {
                    await this.apiServer.stop();
                } else {
                    new Notice('REST API is not running');
                }
            }
        });
        
        // Register command: Show API Key
        this.addCommand({
            id: 'show-api-key',
            name: 'Show REST API Key',
            callback: () => {
                const apiKey = this.apiServer.getAPIKey();
                navigator.clipboard.writeText(apiKey);
                new Notice(`API Key copied to clipboard: ${apiKey.substring(0, 10)}...`);
            }
        });
        
        // Register ExoFocus commands
        this.addCommand({
            id: 'set-focus-all',
            name: 'ExoFocus: Show All Knowledge',
            callback: async () => {
                const allFocus = this.focusService.getAllFocuses().find(f => f.name === 'All');
                if (allFocus) {
                    await this.focusService.setActiveFocus(allFocus.id);
                    new Notice('Focus: All Knowledge');
                }
            }
        });
        
        this.addCommand({
            id: 'set-focus-work',
            name: 'ExoFocus: Work Context',
            callback: async () => {
                const workFocus = this.focusService.getAllFocuses().find(f => f.name === 'Work');
                if (workFocus) {
                    await this.focusService.setActiveFocus(workFocus.id);
                    new Notice('Focus: Work Context');
                }
            }
        });
        
        this.addCommand({
            id: 'set-focus-personal',
            name: 'ExoFocus: Personal Context',
            callback: async () => {
                const personalFocus = this.focusService.getAllFocuses().find(f => f.name === 'Personal');
                if (personalFocus) {
                    await this.focusService.setActiveFocus(personalFocus.id);
                    new Notice('Focus: Personal Context');
                }
            }
        });
        
        this.addCommand({
            id: 'set-focus-today',
            name: 'ExoFocus: Today',
            callback: async () => {
                const todayFocus = this.focusService.getAllFocuses().find(f => f.name === 'Today');
                if (todayFocus) {
                    await this.focusService.setActiveFocus(todayFocus.id);
                    new Notice('Focus: Today');
                }
            }
        });
        
        this.addCommand({
            id: 'show-focus-stats',
            name: 'ExoFocus: Show Statistics',
            callback: async () => {
                const stats = await this.focusService.getFocusStatistics();
                new Notice(`Focus: ${stats.activeFocus}\nVisible: ${stats.filteredAssets}/${stats.totalAssets} assets, ${stats.filteredTriples}/${stats.totalTriples} triples`);
            }
        });
        
        // Register layout renderer for code blocks
        this.registerMarkdownCodeBlockProcessor('exo-layout',
            async (source, el, ctx) => {
                const file = this.app.workspace.getActiveFile();
                if (!file) return;
                
                const metadata = this.app.metadataCache.getFileCache(file);
                if (!metadata || !metadata.frontmatter) return;
                
                // Clear element and render layout
                el.empty();
                await this.layoutRenderer.renderLayout(el, file, metadata, null);
            }
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
        
        if (this.processorRegistered) {
            new Notice('🔍 Exocortex: SPARQL support enabled!');
            console.log('✅ Exocortex: SPARQL processor registered');
        }
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
        
        // Stop API server if running
        if (this.apiServer && this.apiServer.isRunning()) {
            await this.apiServer.stop();
        }
        
        // Clear graph
        if (this.graph) {
            this.graph.clear();
        }
        
        // Reset registration flag
        this.processorRegistered = false;
        
        // Clean up DI container
        if (this.container) {
            this.container.dispose();
        }
    }
}