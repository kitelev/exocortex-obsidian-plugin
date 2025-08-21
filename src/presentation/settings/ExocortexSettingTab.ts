import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { ExocortexSettings, ExocortexSettingsData } from '../../domain/entities/ExocortexSettings';
import { QueryEngineType } from '../../domain/ports/IQueryEngine';
import ExocortexPlugin from '../../main';

/**
 * Exocortex Settings Tab
 * Provides a comprehensive user interface for plugin configuration
 */
export class ExocortexSettingTab extends PluginSettingTab {
    plugin: ExocortexPlugin;
    private settings: ExocortexSettings;

    constructor(app: App, plugin: ExocortexPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = plugin.settings;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Header
        containerEl.createEl('h1', { text: 'Exocortex Settings' });
        containerEl.createEl('p', { 
            text: 'Configure your Exocortex plugin to optimize your knowledge management experience.',
            cls: 'setting-item-description'
        });

        // Folder Paths Section
        this.addFolderPathsSection(containerEl);
        
        // Query Engine Section
        this.addQueryEngineSection(containerEl);
        
        // Cache Settings Section
        this.addCacheSettingsSection(containerEl);
        
        // RDF Export Section
        this.addRDFExportSection(containerEl);
        
        // Performance Section
        this.addPerformanceSection(containerEl);
        
        // Mobile/Platform Section
        this.addMobilePlatformSection(containerEl);
        
        // Debug Section
        this.addDebugSection(containerEl);
        
        // Reset Section
        this.addResetSection(containerEl);
    }

    private addFolderPathsSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Folder Paths' });
        
        new Setting(containerEl)
            .setName('Layouts folder')
            .setDesc('Path to folder containing class layout files')
            .addText(text => text
                .setPlaceholder('layouts')
                .setValue(this.settings.get('layoutsFolderPath'))
                .onChange(async (value) => {
                    await this.updateSetting('layoutsFolderPath', value.trim() || 'layouts');
                }));
        
        new Setting(containerEl)
            .setName('Templates folder')
            .setDesc('Path to folder containing query templates')
            .addText(text => text
                .setPlaceholder('.exocortex/templates')
                .setValue(this.settings.get('templatesFolderPath'))
                .onChange(async (value) => {
                    await this.updateSetting('templatesFolderPath', value.trim() || '.exocortex/templates');
                }));
        
        new Setting(containerEl)
            .setName('Template usage data path')
            .setDesc('Path to file for storing template usage statistics')
            .addText(text => text
                .setPlaceholder('.exocortex/template-usage.json')
                .setValue(this.settings.get('templateUsageDataPath'))
                .onChange(async (value) => {
                    await this.updateSetting('templateUsageDataPath', value.trim() || '.exocortex/template-usage.json');
                }));
    }

    private addQueryEngineSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Query Engine' });
        
        new Setting(containerEl)
            .setName('Preferred query engine')
            .setDesc('Primary query engine to use for data queries')
            .addDropdown(dropdown => dropdown
                .addOption('dataview', 'Dataview')
                .addOption('datacore', 'Datacore')
                .addOption('native', 'Native')
                .setValue(this.settings.get('preferredQueryEngine'))
                .onChange(async (value: QueryEngineType) => {
                    await this.updateSetting('preferredQueryEngine', value);
                }));
        
        new Setting(containerEl)
            .setName('Fallback query engine')
            .setDesc('Secondary query engine to use if primary fails')
            .addDropdown(dropdown => dropdown
                .addOption('dataview', 'Dataview')
                .addOption('datacore', 'Datacore')
                .addOption('native', 'Native')
                .setValue(this.settings.get('fallbackQueryEngine'))
                .onChange(async (value: QueryEngineType) => {
                    await this.updateSetting('fallbackQueryEngine', value);
                }));
        
        new Setting(containerEl)
            .setName('Auto-detect query engines')
            .setDesc('Automatically detect and use available query engines')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableQueryEngineAutoDetect'))
                .onChange(async (value) => {
                    await this.updateSetting('enableQueryEngineAutoDetect', value);
                }));
    }

    private addCacheSettingsSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Cache Settings' });
        
        // SPARQL Cache
        new Setting(containerEl)
            .setName('Enable SPARQL cache')
            .setDesc('Cache SPARQL query results for improved performance')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableSPARQLCache'))
                .onChange(async (value) => {
                    await this.updateSetting('enableSPARQLCache', value);
                }));
        
        new Setting(containerEl)
            .setName('SPARQL cache max size')
            .setDesc('Maximum number of cached SPARQL queries')
            .addSlider(slider => slider
                .setLimits(10, 2000, 10)
                .setValue(this.settings.get('sparqlCacheMaxSize'))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.updateSetting('sparqlCacheMaxSize', value);
                }));
        
        new Setting(containerEl)
            .setName('SPARQL cache TTL')
            .setDesc('Time to live for cached SPARQL queries (minutes)')
            .addSlider(slider => slider
                .setLimits(1, 60, 1)
                .setValue(this.settings.get('sparqlCacheTTLMinutes'))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.updateSetting('sparqlCacheTTLMinutes', value);
                }));
        
        // Query Cache
        new Setting(containerEl)
            .setName('Enable query cache')
            .setDesc('Cache general query results for improved performance')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableQueryCache'))
                .onChange(async (value) => {
                    await this.updateSetting('enableQueryCache', value);
                }));
        
        new Setting(containerEl)
            .setName('Query cache timeout')
            .setDesc('Query cache timeout (minutes)')
            .addSlider(slider => slider
                .setLimits(1, 120, 1)
                .setValue(this.settings.get('queryCacheTimeout'))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.updateSetting('queryCacheTimeout', value);
                }));
        
        new Setting(containerEl)
            .setName('Query cache max size')
            .setDesc('Maximum number of cached query results')
            .addSlider(slider => slider
                .setLimits(10, 500, 10)
                .setValue(this.settings.get('queryCacheMaxSize'))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.updateSetting('queryCacheMaxSize', value);
                }));
    }

    private addRDFExportSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'RDF Export Settings' });
        
        new Setting(containerEl)
            .setName('Default RDF format')
            .setDesc('Default format for RDF exports')
            .addDropdown(dropdown => dropdown
                .addOption('turtle', 'Turtle (.ttl)')
                .addOption('rdf-xml', 'RDF/XML (.rdf)')
                .addOption('n-triples', 'N-Triples (.nt)')
                .addOption('json-ld', 'JSON-LD (.jsonld)')
                .setValue(this.settings.get('defaultRDFFormat'))
                .onChange(async (value: 'turtle' | 'rdf-xml' | 'n-triples' | 'json-ld') => {
                    await this.updateSetting('defaultRDFFormat', value);
                }));
        
        new Setting(containerEl)
            .setName('Include inferred triples')
            .setDesc('Include inferred/derived triples in exports')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('includeInferredTriples'))
                .onChange(async (value) => {
                    await this.updateSetting('includeInferredTriples', value);
                }));
        
        new Setting(containerEl)
            .setName('Export namespaces')
            .setDesc('Include namespace declarations in exports')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('exportNamespaces'))
                .onChange(async (value) => {
                    await this.updateSetting('exportNamespaces', value);
                }));
    }

    private addPerformanceSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Performance Settings' });
        
        new Setting(containerEl)
            .setName('Max graph size')
            .setDesc('Maximum number of triples in the knowledge graph')
            .addSlider(slider => slider
                .setLimits(100, 50000, 100)
                .setValue(this.settings.get('maxGraphSize'))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.updateSetting('maxGraphSize', value);
                }));
        
        new Setting(containerEl)
            .setName('Batch processing size')
            .setDesc('Number of items to process in each batch')
            .addSlider(slider => slider
                .setLimits(1, 200, 1)
                .setValue(this.settings.get('batchProcessingSize'))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.updateSetting('batchProcessingSize', value);
                }));
        
        new Setting(containerEl)
            .setName('Enable lazy loading')
            .setDesc('Load data on-demand to improve performance')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableLazyLoading'))
                .onChange(async (value) => {
                    await this.updateSetting('enableLazyLoading', value);
                }));
    }

    private addMobilePlatformSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Mobile & Platform Settings' });
        
        new Setting(containerEl)
            .setName('Enable mobile optimizations')
            .setDesc('Apply mobile-specific performance optimizations')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableMobileOptimizations'))
                .onChange(async (value) => {
                    await this.updateSetting('enableMobileOptimizations', value);
                }));
        
        new Setting(containerEl)
            .setName('Mobile batch size')
            .setDesc('Batch size optimized for mobile devices')
            .addSlider(slider => slider
                .setLimits(1, 50, 1)
                .setValue(this.settings.get('mobileBatchSize'))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.updateSetting('mobileBatchSize', value);
                }));
        
        new Setting(containerEl)
            .setName('Enable touch controls')
            .setDesc('Enable touch-based interactions for mobile devices')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableTouchControls'))
                .onChange(async (value) => {
                    await this.updateSetting('enableTouchControls', value);
                }));
    }

    private addDebugSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Debug Settings' });
        containerEl.createEl('p', {
            text: 'Debug settings help with troubleshooting but may impact performance.',
            cls: 'setting-item-description'
        });
        
        new Setting(containerEl)
            .setName('Enable debug mode')
            .setDesc('Enable general debug features and extended logging')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableDebugMode'))
                .onChange(async (value) => {
                    await this.updateSetting('enableDebugMode', value);
                }));
        
        new Setting(containerEl)
            .setName('Enable verbose logging')
            .setDesc('Enable detailed console logging for troubleshooting')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableVerboseLogging'))
                .onChange(async (value) => {
                    await this.updateSetting('enableVerboseLogging', value);
                }));
        
        new Setting(containerEl)
            .setName('Log SPARQL queries')
            .setDesc('Log all SPARQL queries to console for debugging')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('logSPARQLQueries'))
                .onChange(async (value) => {
                    await this.updateSetting('logSPARQLQueries', value);
                }));
        
        new Setting(containerEl)
            .setName('Enable performance metrics')
            .setDesc('Collect and log performance metrics')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enablePerformanceMetrics'))
                .onChange(async (value) => {
                    await this.updateSetting('enablePerformanceMetrics', value);
                }));
    }

    private addResetSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Reset Settings' });
        
        new Setting(containerEl)
            .setName('Reset to defaults')
            .setDesc('Reset all settings to their default values')
            .addButton(button => button
                .setButtonText('Reset All Settings')
                .setCta()
                .onClick(async () => {
                    const confirmed = await this.confirmReset();
                    if (confirmed) {
                        await this.resetAllSettings();
                    }
                }));
    }

    private async updateSetting<K extends keyof ExocortexSettingsData>(
        key: K,
        value: ExocortexSettingsData[K]
    ): Promise<void> {
        const result = this.settings.set(key, value);
        
        if (result.isFailure) {
            new Notice(`Settings error: ${result.getError()}`);
            return;
        }
        
        await this.plugin.saveSettings();
        
        // Trigger settings update in DI container
        if (this.plugin.updateContainer) {
            this.plugin.updateContainer();
        }
    }

    private async confirmReset(): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-bg"></div>
                <div class="modal-content">
                    <div class="modal-title">Reset Settings</div>
                    <div class="modal-text">
                        Are you sure you want to reset all settings to their default values?
                        This action cannot be undone.
                    </div>
                    <div class="modal-button-container">
                        <button class="mod-cta" id="confirm-reset">Reset</button>
                        <button id="cancel-reset">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const confirmBtn = modal.querySelector('#confirm-reset') as HTMLButtonElement;
            const cancelBtn = modal.querySelector('#cancel-reset') as HTMLButtonElement;
            const modalBg = modal.querySelector('.modal-bg') as HTMLElement;
            
            const cleanup = () => {
                document.body.removeChild(modal);
            };
            
            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };
            
            modalBg.onclick = () => {
                cleanup();
                resolve(false);
            };
        });
    }

    private async resetAllSettings(): Promise<void> {
        this.settings.resetToDefaults();
        await this.plugin.saveSettings();
        
        // Trigger settings update in DI container
        if (this.plugin.updateContainer) {
            this.plugin.updateContainer();
        }
        
        // Refresh the settings display
        this.display();
        
        new Notice('All settings have been reset to defaults');
    }
}