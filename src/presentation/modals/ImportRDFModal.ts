/**
 * Modal for RDF Import functionality
 * Allows users to import RDF data from files and merge with existing graph
 */

import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import { Graph } from '../../domain/semantic/core/Graph';
import { IndexedGraph } from '../../domain/semantic/core/IndexedGraph';
import { RDFParser, ParseOptions } from '../../application/services/RDFParser';
import { RDFFormat } from '../../application/services/RDFSerializer';
import { NamespaceManager } from '../../application/services/NamespaceManager';
import { MemoryOptimizedImporter, StreamingImportOptions } from '../../infrastructure/performance/MemoryOptimizedImporter';

export interface ImportOptions extends StreamingImportOptions {
    format?: RDFFormat;
    mergeMode: 'merge' | 'replace';
    validateInput: boolean;
    strictMode: boolean;
    baseIRI?: string;
    useOptimizedImporter?: boolean;
}

export class ImportRDFModal extends Modal {
    private graph: Graph;
    private options: ImportOptions = {
        mergeMode: 'merge',
        validateInput: true,
        strictMode: false,
        useOptimizedImporter: true,
        chunkSize: 1000,
        enableMemoryPooling: false
    };
    private parser: RDFParser;
    private optimizedImporter: MemoryOptimizedImporter;
    private namespaceManager: NamespaceManager;
    private selectedFile: File | TFile | null = null;
    private fileContent: string = '';
    private onImport?: (importedGraph: Graph, options: ImportOptions) => void;
    
    constructor(
        app: App, 
        graph: Graph, 
        namespaceManager?: NamespaceManager,
        onImport?: (importedGraph: Graph, options: ImportOptions) => void
    ) {
        super(app);
        this.graph = graph;
        this.namespaceManager = namespaceManager || new NamespaceManager();
        this.parser = new RDFParser(this.namespaceManager);
        this.optimizedImporter = new MemoryOptimizedImporter();
        this.onImport = onImport;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Title
        contentEl.createEl('h2', { text: 'Import RDF Data' });
        
        // Current graph statistics
        const currentStatsEl = contentEl.createDiv('current-stats');
        currentStatsEl.innerHTML = `
            <h3>Current Graph</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Triples:</span>
                    <span class="stat-value">${this.graph.size()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Subjects:</span>
                    <span class="stat-value">${this.graph.subjects().size}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Predicates:</span>
                    <span class="stat-value">${this.graph.predicates().size}</span>
                </div>
            </div>
        `;
        
        // File selection
        const fileSection = contentEl.createDiv('file-selection');
        fileSection.createEl('h3', { text: 'Select File' });
        
        // File input
        const fileInputContainer = fileSection.createDiv('file-input-container');
        
        // Option 1: Select from vault
        new Setting(fileInputContainer)
            .setName('Import from vault')
            .setDesc('Select an RDF file from your vault')
            .addButton(button => {
                button
                    .setButtonText('Select File')
                    .onClick(() => this.openVaultFilePicker());
            });
        
        // Option 2: Upload file
        const uploadContainer = fileInputContainer.createDiv('upload-container');
        uploadContainer.createEl('span', { text: 'Or upload file: ' });
        
        const fileInput = uploadContainer.createEl('input', { type: 'file' });
        fileInput.accept = '.ttl,.nt,.jsonld,.rdf,.n3,.xml';
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Selected file display
        const selectedFileEl = fileSection.createDiv('selected-file');
        selectedFileEl.style.display = 'none';
        
        // Format selection
        new Setting(contentEl)
            .setName('RDF format')
            .setDesc('Specify format (auto-detected if not set)')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('', 'Auto-detect')
                    .addOption('turtle', 'Turtle (.ttl)')
                    .addOption('ntriples', 'N-Triples (.nt)')
                    .addOption('jsonld', 'JSON-LD (.jsonld)')
                    .addOption('rdfxml', 'RDF/XML (.rdf)')
                    .setValue(this.options.format || '')
                    .onChange(value => {
                        this.options.format = value ? value as RDFFormat : undefined;
                        this.updatePreview();
                    });
            });
        
        // Merge mode
        new Setting(contentEl)
            .setName('Import mode')
            .setDesc('How to handle existing data')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('merge', 'Merge with existing graph')
                    .addOption('replace', 'Replace entire graph')
                    .setValue(this.options.mergeMode)
                    .onChange(value => {
                        this.options.mergeMode = value as 'merge' | 'replace';
                    });
            });
        
        // Base IRI setting
        new Setting(contentEl)
            .setName('Base IRI')
            .setDesc('Optional base IRI for relative URIs')
            .addText(text => {
                text
                    .setPlaceholder('https://example.org/data/')
                    .setValue(this.options.baseIRI || '')
                    .onChange(value => {
                        this.options.baseIRI = value || undefined;
                        this.updatePreview();
                    });
            });
        
        // Validation options
        new Setting(contentEl)
            .setName('Validate input')
            .setDesc('Validate RDF data during import')
            .addToggle(toggle => {
                toggle
                    .setValue(this.options.validateInput)
                    .onChange(value => {
                        this.options.validateInput = value;
                    });
            });
        
        new Setting(contentEl)
            .setName('Strict mode')
            .setDesc('Fail import on any parsing errors')
            .addToggle(toggle => {
                toggle
                    .setValue(this.options.strictMode)
                    .onChange(value => {
                        this.options.strictMode = value;
                    });
            });
        
        // Memory optimization settings
        contentEl.createEl('h3', { text: 'Memory Optimization' });
        
        new Setting(contentEl)
            .setName('Use optimized importer')
            .setDesc('Enable memory-optimized importing for large files')
            .addToggle(toggle => {
                toggle
                    .setValue(this.options.useOptimizedImporter ?? true)
                    .onChange(value => {
                        this.options.useOptimizedImporter = value;
                        this.updateOptimizationSettings();
                    });
            });
        
        const optimizationContainer = contentEl.createDiv('optimization-settings');
        
        new Setting(optimizationContainer)
            .setName('Chunk size')
            .setDesc('Number of triples to process at once')
            .addSlider(slider => {
                slider
                    .setLimits(100, 5000, 100)
                    .setValue(this.options.chunkSize || 1000)
                    .setDynamicTooltip()
                    .onChange(value => {
                        this.options.chunkSize = value;
                    });
            });
        
        new Setting(optimizationContainer)
            .setName('Memory pooling')
            .setDesc('Reuse objects to reduce memory allocation')
            .addToggle(toggle => {
                toggle
                    .setValue(this.options.enableMemoryPooling ?? false)
                    .onChange(value => {
                        this.options.enableMemoryPooling = value;
                    });
            });
        
        // Preview section
        const previewContainer = contentEl.createDiv('import-preview');
        previewContainer.createEl('h3', { text: 'Preview' });
        
        const previewEl = previewContainer.createEl('div', { cls: 'preview-content' });
        previewEl.innerHTML = '<em>Select a file to see preview</em>';
        
        // Buttons
        const buttonContainer = contentEl.createDiv('import-buttons');
        buttonContainer.addClass('modal-button-container');
        
        // Import button
        const importButton = buttonContainer.createEl('button', { 
            text: 'Import',
            cls: 'mod-cta'
        });
        importButton.disabled = true;
        importButton.onclick = () => this.handleImport();
        
        // Cancel button
        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.onclick = () => this.close();
        
        // Store references
        this.updateUI();
        
        // Add styles
        this.addStyles();
    }
    
    /**
     * Open vault file picker
     */
    private openVaultFilePicker(): void {
        // Get all files that might be RDF
        const files = this.app.vault.getFiles().filter(file => 
            /\.(ttl|nt|jsonld|rdf|n3|xml)$/i.test(file.extension)
        );
        
        if (files.length === 0) {
            new Notice('No RDF files found in vault');
            return;
        }
        
        // Create a simple file picker (in a real implementation, you might use a more sophisticated picker)
        const picker = document.createElement('select');
        picker.innerHTML = '<option value="">Select file...</option>';
        
        for (const file of files) {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = file.path;
            picker.appendChild(option);
        }
        
        picker.addEventListener('change', async (e) => {
            const selectedPath = (e.target as HTMLSelectElement).value;
            if (selectedPath) {
                const file = this.app.vault.getAbstractFileByPath(selectedPath);
                if (file instanceof TFile) {
                    await this.selectVaultFile(file);
                }
            }
        });
        
        // Add to modal (in a real implementation, this would be better integrated)
        const container = this.contentEl.querySelector('.file-input-container');
        if (container) {
            container.appendChild(picker);
        }
    }
    
    /**
     * Handle file upload from computer
     */
    private async handleFileUpload(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (file) {
            try {
                const content = await this.readFile(file);
                this.selectedFile = file;
                this.fileContent = content;
                this.updateUI();
                this.updatePreview();
            } catch (error) {
                new Notice(`Error reading file: ${error.message}`);
            }
        }
    }
    
    /**
     * Select file from vault
     */
    private async selectVaultFile(file: TFile): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            this.selectedFile = file;
            this.fileContent = content;
            this.updateUI();
            this.updatePreview();
        } catch (error) {
            new Notice(`Error reading vault file: ${error.message}`);
        }
    }
    
    /**
     * Read file content
     */
    private readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Update UI state
     */
    private updateUI(): void {
        // Update selected file display
        const selectedFileEl = this.contentEl.querySelector('.selected-file') as HTMLElement;
        if (selectedFileEl) {
            if (this.selectedFile) {
                const fileName = this.selectedFile instanceof TFile 
                    ? this.selectedFile.name 
                    : this.selectedFile.name;
                
                selectedFileEl.innerHTML = `
                    <div class="selected-file-info">
                        <strong>Selected:</strong> ${fileName}
                        <span class="file-size">(${this.formatFileSize(this.fileContent.length)})</span>
                    </div>
                `;
                selectedFileEl.style.display = 'block';
            } else {
                selectedFileEl.style.display = 'none';
            }
        }
        
        // Enable/disable import button
        const importButton = this.contentEl.querySelector('button.mod-cta') as HTMLButtonElement;
        if (importButton) {
            importButton.disabled = !this.selectedFile;
        }
    }
    
    /**
     * Update preview content
     */
    private updatePreview(): void {
        const previewEl = this.contentEl.querySelector('.preview-content') as HTMLElement;
        if (!previewEl || !this.fileContent) return;
        
        try {
            const parseOptions: ParseOptions = {
                format: this.options.format,
                baseIRI: this.options.baseIRI,
                namespaceManager: this.namespaceManager,
                validateInput: false, // Don't validate for preview
                strictMode: false
            };
            
            const result = this.parser.parse(this.fileContent, parseOptions);
            
            if (result.isSuccess) {
                const parseResult = result.getValue();
                
                previewEl.innerHTML = `
                    <div class="preview-stats">
                        <h4>Import Preview</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Triples:</span>
                                <span class="stat-value">${parseResult.tripleCount}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Subjects:</span>
                                <span class="stat-value">${parseResult.graph.subjects().size}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Predicates:</span>
                                <span class="stat-value">${parseResult.graph.predicates().size}</span>
                            </div>
                        </div>
                        ${Object.keys(parseResult.namespaces).length > 0 ? `
                            <div class="namespaces">
                                <strong>Namespaces found:</strong>
                                <ul>
                                    ${Object.entries(parseResult.namespaces)
                                        .slice(0, 5)
                                        .map(([prefix, uri]) => `<li>${prefix}: ${uri}</li>`)
                                        .join('')}
                                    ${Object.keys(parseResult.namespaces).length > 5 ? '<li>... and more</li>' : ''}
                                </ul>
                            </div>
                        ` : ''}
                        ${parseResult.warnings?.length ? `
                            <div class="warnings">
                                <strong>Warnings:</strong>
                                <ul>
                                    ${parseResult.warnings.slice(0, 3).map(w => `<li>${w}</li>`).join('')}
                                    ${parseResult.warnings.length > 3 ? '<li>... and more</li>' : ''}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                    <div class="sample-triples">
                        <h4>Sample Triples</h4>
                        <pre class="triple-sample">${this.formatSampleTriples(parseResult.graph)}</pre>
                    </div>
                `;
            } else {
                previewEl.innerHTML = `
                    <div class="preview-error">
                        <strong>Parse Error:</strong> ${result.errorValue()}
                    </div>
                `;
            }
        } catch (error) {
            previewEl.innerHTML = `
                <div class="preview-error">
                    <strong>Preview Error:</strong> ${error.message}
                </div>
            `;
        }
    }
    
    /**
     * Format sample triples for display
     */
    private formatSampleTriples(graph: Graph): string {
        const triples = graph.toArray().slice(0, 5);
        return triples.map(triple => triple.toString()).join('\n') + 
               (graph.size() > 5 ? '\n... and more' : '');
    }
    
    /**
     * Format file size
     */
    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }
    
    /**
     * Handle import action
     */
    private async handleImport(): Promise<void> {
        if (!this.selectedFile || !this.fileContent) {
            new Notice('No file selected');
            return;
        }
        
        try {
            let finalGraph: Graph;
            let importedTripleCount = 0;
            let importTime = 0;
            
            if (this.options.useOptimizedImporter && this.fileContent.length > 50000) {
                // Use optimized importer for large files
                const startTime = performance.now();
                
                // Convert graph to IndexedGraph if needed
                const targetGraph = this.graph instanceof IndexedGraph 
                    ? this.graph 
                    : this.convertToIndexedGraph(this.graph);
                
                if (this.options.mergeMode === 'replace') {
                    targetGraph.clear();
                }
                
                // Configure optimized import options
                const importOptions: StreamingImportOptions = {
                    format: this.options.format,
                    baseIRI: this.options.baseIRI,
                    namespaceManager: this.namespaceManager,
                    validateInput: this.options.validateInput,
                    strictMode: this.options.strictMode,
                    chunkSize: this.options.chunkSize || 1000,
                    enableMemoryPooling: this.options.enableMemoryPooling,
                    enableGCHints: true,
                    progressCallback: (processed, total) => {
                        const progress = Math.round((processed / total) * 100);
                        console.log(`Import progress: ${progress}%`);
                    }
                };
                
                const result = await this.optimizedImporter.importRDF(
                    this.fileContent, 
                    targetGraph, 
                    importOptions
                );
                
                importTime = performance.now() - startTime;
                
                if (result.isFailure) {
                    new Notice(`Optimized import failed: ${result.getError()}`);
                    return;
                }
                
                const memoryReport = result.getValue();
                finalGraph = targetGraph;
                importedTripleCount = targetGraph.size();
                
                // Show memory optimization results
                const memoryReduction = Math.round(memoryReport.memoryReduction / 1024 / 1024 * 10) / 10;
                if (memoryReduction > 0) {
                    new Notice(`Memory saved: ${memoryReduction}MB`, 2000);
                }
                
            } else {
                // Use standard parser for small files
                const startTime = performance.now();
                
                const parseOptions: ParseOptions = {
                    format: this.options.format,
                    baseIRI: this.options.baseIRI,
                    namespaceManager: this.namespaceManager,
                    validateInput: this.options.validateInput,
                    strictMode: this.options.strictMode
                };
                
                const result = this.parser.parse(this.fileContent, parseOptions);
                
                if (result.isFailure) {
                    new Notice(`Import failed: ${result.getError()}`);
                    return;
                }
                
                const parseResult = result.getValue();
                importTime = performance.now() - startTime;
                
                // Handle merge mode
                if (this.options.mergeMode === 'replace') {
                    finalGraph = parseResult.graph;
                } else {
                    // Merge with existing graph
                    finalGraph = this.graph.clone();
                    finalGraph.merge(parseResult.graph);
                }
                
                importedTripleCount = parseResult.tripleCount;
                
                if (parseResult.warnings?.length) {
                    new Notice(`Warnings: ${parseResult.warnings.length} warnings found`, 3000);
                }
                
                if (parseResult.errors?.length) {
                    new Notice(`Errors: ${parseResult.errors.length} errors found`, 3000);
                }
            }
            
            // Call onImport callback
            if (this.onImport) {
                this.onImport(finalGraph, this.options);
            }
            
            const message = this.options.mergeMode === 'replace'
                ? `Replaced graph with ${importedTripleCount} triples in ${importTime.toFixed(0)}ms`
                : `Added ${importedTripleCount} triples to graph in ${importTime.toFixed(0)}ms`;
            
            new Notice(message);
            
            this.close();
            
        } catch (error) {
            new Notice(`Import error: ${error.message}`);
        }
    }
    
    /**
     * Convert regular Graph to IndexedGraph
     */
    private convertToIndexedGraph(graph: Graph): IndexedGraph {
        const indexedGraph = new IndexedGraph();
        
        indexedGraph.beginBatch();
        for (const triple of graph.toArray()) {
            indexedGraph.add(triple);
        }
        indexedGraph.commitBatch();
        
        return indexedGraph;
    }
    
    /**
     * Update optimization settings visibility
     */
    private updateOptimizationSettings(): void {
        const container = this.contentEl.querySelector('.optimization-settings') as HTMLElement;
        if (container) {
            container.style.display = this.options.useOptimizedImporter ? 'block' : 'none';
        }
    }
    
    /**
     * Add custom styles
     */
    private addStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .current-stats, .preview-stats {
                margin-bottom: 20px;
                padding: 15px;
                background: var(--background-secondary);
                border-radius: 6px;
            }
            
            .stats-grid {
                display: flex;
                gap: 20px;
                margin-top: 10px;
            }
            
            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .stat-label {
                font-size: 12px;
                color: var(--text-muted);
                margin-bottom: 2px;
            }
            
            .stat-value {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-normal);
            }
            
            .file-selection {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
            }
            
            .file-input-container {
                margin: 10px 0;
            }
            
            .upload-container {
                margin: 10px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .selected-file {
                margin: 10px 0;
                padding: 10px;
                background: var(--background-primary-alt);
                border-radius: 4px;
            }
            
            .selected-file-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .file-size {
                color: var(--text-muted);
                font-size: 12px;
            }
            
            .preview-content {
                max-height: 300px;
                overflow-y: auto;
                padding: 15px;
                background: var(--background-secondary);
                border-radius: 6px;
            }
            
            .preview-error {
                color: var(--text-error);
                padding: 10px;
                background: var(--background-modifier-error);
                border-radius: 4px;
            }
            
            .namespaces, .warnings {
                margin: 10px 0;
            }
            
            .namespaces ul, .warnings ul {
                margin: 5px 0 0 20px;
                font-size: 12px;
            }
            
            .warnings {
                color: var(--text-warning);
            }
            
            .sample-triples {
                margin-top: 15px;
            }
            
            .triple-sample {
                font-family: var(--font-monospace);
                font-size: 11px;
                background: var(--background-primary);
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                margin: 5px 0 0 0;
            }
            
            .import-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--background-modifier-border);
            }
            
            .modal-button-container button {
                padding: 8px 16px;
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                background: var(--background-primary);
                color: var(--text-normal);
                cursor: pointer;
            }
            
            .modal-button-container button:hover:not(:disabled) {
                background: var(--background-secondary);
            }
            
            .modal-button-container button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .modal-button-container button.mod-cta:not(:disabled) {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }
            
            .modal-button-container button.mod-cta:hover:not(:disabled) {
                background: var(--interactive-accent-hover);
                border-color: var(--interactive-accent-hover);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}