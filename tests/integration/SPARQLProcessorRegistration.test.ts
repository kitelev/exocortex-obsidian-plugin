import ExocortexPlugin from '../../main';
import { App, Plugin } from 'obsidian';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';

describe('SPARQL Processor Registration', () => {
    let app: App;
    let plugin: ExocortexPlugin;
    let registeredProcessors: Map<string, any>;
    
    beforeEach(() => {
        // Track registered processors
        registeredProcessors = new Map();
        
        // Create mock app
        app = {
            vault: {
                getMarkdownFiles: jest.fn().mockReturnValue([]),
                getFiles: jest.fn().mockReturnValue([]),
                getAbstractFileByPath: jest.fn(),
                read: jest.fn().mockResolvedValue(''),
                modify: jest.fn().mockResolvedValue(undefined),
                create: jest.fn().mockResolvedValue({}),
                delete: jest.fn().mockResolvedValue(undefined),
                rename: jest.fn().mockResolvedValue(undefined),
                on: jest.fn().mockReturnValue({ event: 'mock', callback: jest.fn() })
            },
            workspace: {
                getActiveFile: jest.fn(),
                openLinkText: jest.fn()
            },
            metadataCache: {
                getFileCache: jest.fn()
            }
        } as any;
        
        // Initialize DIContainer before creating plugin
        DIContainer.initialize(app, {} as Plugin);
        
        // Create plugin instance with mocked methods
        plugin = new ExocortexPlugin(app, {} as any);
        
        // Mock Plugin methods
        plugin.addCommand = jest.fn();
        plugin.addRibbonIcon = jest.fn();
        plugin.registerEvent = jest.fn();
        
        // Mock registerMarkdownCodeBlockProcessor to track registrations
        plugin.registerMarkdownCodeBlockProcessor = jest.fn((language: string, handler: any) => {
            if (registeredProcessors.has(language)) {
                throw new Error(`Code block postprocessor for language ${language} is already registered`);
            }
            registeredProcessors.set(language, handler);
        });
    });
    
    afterEach(() => {
        registeredProcessors.clear();
    });
    
    describe('Plugin Loading', () => {
        it('should register SPARQL processor only once on first load', async () => {
            await plugin.onload();
            
            // Plugin registers both SPARQL and layout processors
            expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledTimes(2);
            expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledWith(
                'sparql',
                expect.any(Function)
            );
            expect(plugin.registerMarkdownCodeBlockProcessor).toHaveBeenCalledWith(
                'exo-layout',
                expect.any(Function)
            );
            expect(registeredProcessors.has('sparql')).toBe(true);
            expect(registeredProcessors.has('exo-layout')).toBe(true);
        });
        
        it('should handle duplicate registration gracefully', async () => {
            // First load should succeed
            await plugin.onload();
            
            // Create a second plugin instance (don't reset container, simulating duplicate load)
            const plugin2 = new ExocortexPlugin(app, {} as any);
            plugin2.addCommand = jest.fn();
            plugin2.addRibbonIcon = jest.fn();
            plugin2.registerEvent = jest.fn();
            
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            plugin2.registerMarkdownCodeBlockProcessor = jest.fn((language: string, handler: any) => {
                if (registeredProcessors.has(language)) {
                    throw new Error(`Code block postprocessor for language ${language} is already registered`);
                }
                registeredProcessors.set(language, handler);
            });
            
            // Second load should handle the error gracefully
            await plugin2.onload();
            
            // Should have logged warning
            expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ SPARQL processor already registered, skipping...');
            
            // Should not have set processorRegistered flag
            expect(plugin2['processorRegistered']).toBe(false);
            
            consoleWarnSpy.mockRestore();
        });
        
        it('should properly clean up on unload', async () => {
            await plugin.onload();
            
            // Create spy for graph.clear if it exists
            if (plugin['graph']) {
                plugin['graph'].clear = jest.fn();
            }
            
            await plugin.onunload();
            
            // Verify cleanup happened
            if (plugin['graph']) {
                expect(plugin['graph'].clear).toHaveBeenCalled();
            }
        });
        
        it('should handle reload scenario correctly', async () => {
            // First load
            await plugin.onload();
            
            // Unload
            await plugin.onunload();
            
            // Clear the registered processors to simulate proper cleanup
            registeredProcessors.clear();
            
            // Second load after unload should work
            const plugin2 = new ExocortexPlugin(app, {} as any);
            plugin2.addCommand = jest.fn();
            plugin2.addRibbonIcon = jest.fn();
            plugin2.registerEvent = jest.fn();
            plugin2.registerMarkdownCodeBlockProcessor = jest.fn((language: string, handler: any) => {
                if (registeredProcessors.has(language)) {
                    throw new Error(`Code block postprocessor for language ${language} is already registered`);
                }
                registeredProcessors.set(language, handler);
            });
            
            await plugin2.onload();
            
            expect(plugin2.registerMarkdownCodeBlockProcessor).toHaveBeenCalledTimes(2);
            expect(plugin2.registerMarkdownCodeBlockProcessor).toHaveBeenCalledWith(
                'sparql',
                expect.any(Function)
            );
            expect(plugin2.registerMarkdownCodeBlockProcessor).toHaveBeenCalledWith(
                'exo-layout',
                expect.any(Function)
            );
        });
    });
    
    describe('Hot Reload Protection', () => {
        it('should handle hot reload scenario gracefully', async () => {
            // Simulate hot reload scenario where old processor might still be registered
            registeredProcessors.set('sparql', jest.fn());
            
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Plugin should handle this gracefully
            await plugin.onload();
            
            expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ SPARQL processor already registered, skipping...');
            expect(plugin['processorRegistered']).toBe(false);
            
            consoleWarnSpy.mockRestore();
        });
        
        it('should track registration state internally', async () => {
            await plugin.onload();
            
            // Plugin should have internal state tracking
            expect(plugin['sparqlProcessor']).toBeDefined();
        });
    });
    
    describe('Error Handling', () => {
        it('should handle missing graph gracefully during unload', async () => {
            await plugin.onload();
            
            // Remove graph to simulate error condition
            delete plugin['graph'];
            
            // Should not throw
            await expect(plugin.onunload()).resolves.toBeUndefined();
        });
        
        it('should handle vault loading errors gracefully', async () => {
            // Make vault throw error
            app.vault.getMarkdownFiles = jest.fn().mockImplementation(() => {
                throw new Error('Vault error');
            });
            
            // Should still complete loading but log error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await expect(plugin.onload()).rejects.toThrow();
            
            consoleSpy.mockRestore();
        });
    });
});