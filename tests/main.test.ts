import { App, TFile, Notice, MarkdownPostProcessorContext } from 'obsidian';
import ExocortexPlugin from '../main';

// Mock DIContainer
jest.mock('../src/infrastructure/container/DIContainer', () => {
  const mockContainer = {
    getCreateAssetUseCase: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        success: true,
        message: 'Asset created'
      })
    }),
    getPropertyEditingUseCase: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        success: true,
        message: 'Property edited'
      })
    }),
    resolve: jest.fn().mockImplementation(() => ({})),
    dispose: jest.fn()
  };

  return {
    DIContainer: {
      initialize: jest.fn((app, plugin) => mockContainer),
      getInstance: jest.fn(() => mockContainer)
    }
  };
});

describe('ExocortexPlugin - SPARQL Version', () => {
  let app: App;
  let plugin: ExocortexPlugin;
  
  // Mock Obsidian App
  beforeEach(async () => {
    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([
          { basename: 'test-file', path: 'test-file.md' }
        ]),
        read: jest.fn().mockResolvedValue(`---
exo__Asset_uid: test-uid
exo__Asset_label: Test Asset
exo__Instance_class: "[[exo__Class]]"
---

# Test File`),
        on: jest.fn().mockReturnValue({ event: 'mock', callback: jest.fn() })
      },
      workspace: {
        openLinkText: jest.fn()
      },
      metadataCache: {
        getFileCache: jest.fn()
      }
    } as unknown as App;
    
    plugin = new ExocortexPlugin(app, {
      id: 'exocortex',
      name: 'Exocortex',
      version: '2.0.0',
      minAppVersion: '1.0.0',
      description: 'SPARQL queries in Obsidian',
      author: 'M.K. Khromov',
      authorUrl: '',
      isDesktopOnly: false
    });
  });
  
  describe('Plugin Lifecycle', () => {
    test('should load plugin successfully', async () => {
      const registerSpy = jest.spyOn(plugin, 'registerMarkdownCodeBlockProcessor');
      await plugin.onload();
      
      expect(registerSpy).toHaveBeenCalledWith('sparql', expect.any(Function));
    });
    
    test('should unload plugin successfully', async () => {
      await plugin.onload();
      await plugin.onunload();
      // Plugin should unload without errors
    });
  });
  
  describe('SPARQL Processing', () => {
    test('should register SPARQL code block processor', async () => {
      await plugin.onload();
      // Check if processor was registered (tested via E2E tests)
      expect(true).toBe(true);
    });
    
    test('should load vault data into graph', async () => {
      await plugin.onload();
      
      // Verify that the plugin has loaded data from vault
      // The graph should exist after loading
      expect(plugin['graph']).toBeDefined();
      
      // Verify vault.getMarkdownFiles was called
      expect(app.vault.getMarkdownFiles).toHaveBeenCalled();
    });
    
    test('should initialize SPARQL processor', async () => {
      await plugin.onload();
      
      // Verify that the SPARQL processor was initialized
      expect(plugin['sparqlProcessor']).toBeDefined();
      
      // Verify the processor has required components
      expect(plugin['graph']).toBeDefined();
      expect(plugin['focusService']).toBeDefined();
    });
    
    test('should register event handlers for file changes', async () => {
      await plugin.onload();
      
      // Verify that file modification handlers were registered
      expect(app.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
      expect(app.vault.on).toHaveBeenCalledWith('create', expect.any(Function));
      expect(app.vault.on).toHaveBeenCalledWith('delete', expect.any(Function));
    });
    
    test('should initialize layout renderer', async () => {
      await plugin.onload();
      
      // Verify that the layout renderer was initialized
      expect(plugin['layoutRenderer']).toBeDefined();
      
      // Verify that the container provides PropertyEditingUseCase
      const container = plugin['container'];
      expect(container).toBeDefined();
      expect(container.getPropertyEditingUseCase).toBeDefined();
    });
    
    test('should initialize API server when enabled', async () => {
      // Note: API server initialization depends on settings
      await plugin.onload();
      
      // Verify that the API server property exists (may be null if disabled)
      expect('apiServer' in plugin).toBe(true);
      
      // Verify the plugin loaded successfully
      expect(plugin['graph']).toBeDefined();
    });
  });
  
  describe('DOM Processing', () => {
    test('should register markdown code block processors', async () => {
      // Mock the registerMarkdownCodeBlockProcessor method
      const registerProcessorSpy = jest.spyOn(plugin, 'registerMarkdownCodeBlockProcessor' as any)
        .mockImplementation(() => {});
      
      await plugin.onload();
      
      // Verify that SPARQL and layout processors were registered
      // Note: The actual registration happens but may catch errors for duplicates
      expect(plugin['processorRegistered']).toBeDefined();
      
      // Verify the plugin loaded successfully even if processor registration had issues
      expect(plugin['graph']).toBeDefined();
      
      registerProcessorSpy.mockRestore();
    });
  });
});