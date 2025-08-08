import { Plugin, Notice } from 'obsidian';

export default class ExocortexDebugPlugin extends Plugin {
    async onload() {
        console.log('Exocortex Debug Plugin: Loading...');
        new Notice('Exocortex Debug: Plugin loaded!');
        
        // Register a simple SPARQL processor
        this.registerMarkdownCodeBlockProcessor('sparql', async (source, el, ctx) => {
            console.log('SPARQL Debug: Processing query:', source);
            
            el.empty();
            
            // Create debug output
            const debugDiv = el.createDiv({ cls: 'sparql-debug' });
            debugDiv.createEl('h4', { text: 'SPARQL Debug Output' });
            debugDiv.createEl('p', { text: 'Query received:' });
            debugDiv.createEl('pre', { text: source });
            debugDiv.createEl('p', { text: 'Status: Plugin is working!' });
            
            new Notice('SPARQL query processed - check note for debug output');
        });
        
        console.log('Exocortex Debug Plugin: Loaded successfully');
    }
    
    async onunload() {
        console.log('Exocortex Debug Plugin: Unloading...');
        new Notice('Exocortex Debug: Plugin unloaded');
    }
}
