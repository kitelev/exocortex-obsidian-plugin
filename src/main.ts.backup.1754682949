import { Plugin, Notice, TFile } from 'obsidian';
import { VaultGraphAdapter } from './infrastructure/persistence/VaultGraphAdapter';
import { SPARQLProcessor } from './presentation/processors/SPARQLProcessor';

export default class ExocortexPlugin extends Plugin {
    private graphAdapter: VaultGraphAdapter;
    private sparqlProcessor: SPARQLProcessor;
    private saveInterval: NodeJS.Timeout | null = null;
    
    async onload() {
        console.log('Loading Exocortex plugin v0.8.0');
        
        try {
            // Initialize graph adapter
            this.graphAdapter = new VaultGraphAdapter(this);
            const graph = await this.graphAdapter.load();
            
            new Notice(`Exocortex: Loaded ${this.graphAdapter.size} triples`);
            
            // Initialize SPARQL processor
            this.sparqlProcessor = new SPARQLProcessor(this, graph);
            
            // Register SPARQL code block processor
            this.registerMarkdownCodeBlockProcessor(
                'sparql',
                this.sparqlProcessor.processCodeBlock.bind(this.sparqlProcessor)
            );
            
            // Setup file watchers
            this.registerEvent(
                this.app.vault.on('modify', async (file) => {
                    if (file instanceof TFile && file.extension === 'md') {
                        await this.graphAdapter.updateFromFile(file.path);
                    }
                })
            );
            
            this.registerEvent(
                this.app.vault.on('delete', async (file) => {
                    if (file instanceof TFile && file.extension === 'md') {
                        await this.graphAdapter.removeFile(file.path);
                    }
                })
            );
            
            // Setup auto-save
            this.saveInterval = setInterval(() => {
                this.graphAdapter.save();
            }, 60000); // Save every minute
            
            console.log('Exocortex plugin loaded successfully');
            
        } catch (error) {
            console.error('Failed to load Exocortex plugin:', error);
            new Notice('Exocortex: Failed to initialize. Check console for details.');
        }
    }
    
    async onunload() {
        console.log('Unloading Exocortex plugin');
        
        // Clear intervals
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        
        // Save graph before unloading
        if (this.graphAdapter) {
            await this.graphAdapter.save();
        }
    }
}
