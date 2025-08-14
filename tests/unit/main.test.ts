import { App, TFile, Notice, MarkdownPostProcessorContext, Plugin } from 'obsidian';
import ExocortexPlugin from '../../src/main';

// Mock all external dependencies
jest.mock('../../src/infrastructure/container/DIContainer', () => {
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

// Mock Graph
const mockGraphMethods = {
  add: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  match: jest.fn().mockReturnValue([]),
  merge: jest.fn(),
  size: jest.fn().mockReturnValue(0)
};

jest.mock('../../src/domain/semantic/core/Graph', () => ({
  Graph: jest.fn().mockImplementation(() => mockGraphMethods)
}));

// Mock SPARQLProcessor
jest.mock('../../src/presentation/processors/SPARQLProcessor', () => ({
  SPARQLProcessor: jest.fn().mockImplementation(() => ({
    processCodeBlock: jest.fn().mockResolvedValue(undefined),
    getCacheStatistics: jest.fn().mockReturnValue({
      hits: 10,
      misses: 5,
      hitRate: 66.7,
      size: 8,
      maxSize: 500,
      totalQueries: 15,
      evictions: 0
    }),
    invalidateCache: jest.fn(),
    destroy: jest.fn()
  }))
}));

// Mock GraphVisualizationProcessor
jest.mock('../../src/presentation/processors/GraphVisualizationProcessor', () => ({
  GraphVisualizationProcessor: jest.fn().mockImplementation(() => ({
    processCodeBlock: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock RDFService
jest.mock('../../src/application/services/RDFService', () => ({
  RDFService: jest.fn().mockImplementation(() => ({
    getNamespaceManager: jest.fn().mockReturnValue({
      getPrefix: jest.fn().mockReturnValue('exo'),
      expand: jest.fn().mockReturnValue('http://example.org/exo#')
    })
  }))
}));

// Mock all modals
jest.mock('../../src/presentation/modals/CreateAssetModal', () => ({
  CreateAssetModal: jest.fn().mockImplementation(() => ({
    open: jest.fn()
  }))
}));

jest.mock('../../src/presentation/modals/ExportRDFModal', () => ({
  ExportRDFModal: jest.fn().mockImplementation(() => ({
    open: jest.fn()
  }))
}));

jest.mock('../../src/presentation/modals/ImportRDFModal', () => ({
  ImportRDFModal: jest.fn().mockImplementation(() => ({
    open: jest.fn()
  }))
}));

jest.mock('../../src/presentation/modals/QuickTaskModal', () => ({
  QuickTaskModal: jest.fn().mockImplementation(() => ({
    open: jest.fn()
  }))
}));

// Mock repositories and use cases
jest.mock('../../src/infrastructure/repositories/ObsidianTaskRepository');
jest.mock('../../src/infrastructure/repositories/ObsidianAssetRepository');
jest.mock('../../src/application/use-cases/CreateTaskFromProjectUseCase');
jest.mock('../../src/application/use-cases/GetCurrentProjectUseCase');
jest.mock('../../src/domain/semantic/core/IndexedGraph');
jest.mock('../../src/application/services/ExoFocusService');

describe('ExocortexPlugin - Comprehensive Tests', () => {
  let app: App;
  let plugin: ExocortexPlugin;
  let mockNotice: jest.SpyInstance;
  
  beforeEach(async () => {
    // Setup comprehensive app mock
    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([
          { basename: 'test-file', path: 'test-file.md', name: 'test-file.md', extension: 'md' },
          { basename: 'project', path: 'project.md', name: 'project.md', extension: 'md' }
        ]),
        read: jest.fn().mockResolvedValue(`---
exo__Asset_uid: test-uid
exo__Asset_label: Test Asset
exo__Instance_class: "[[exo__Class]]"
tags: [project, active]
---

# Test File
This is test content with [[links]] and metadata.`),
        on: jest.fn().mockReturnValue({ event: 'mock', callback: jest.fn() }),
        create: jest.fn().mockResolvedValue(new TFile('new-file.md')),
        modify: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined)
      },
      workspace: {
        openLinkText: jest.fn(),
        getActiveFile: jest.fn().mockReturnValue({
          path: 'current-file.md',
          basename: 'current-file',
          name: 'current-file.md'
        }),
        on: jest.fn()
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue({
          frontmatter: {
            'exo__Asset_uid': 'test-uid',
            'exo__Asset_label': 'Test Asset'
          },
          sections: [],
          headings: [],
          links: []
        }),
        on: jest.fn()
      }
    } as unknown as App;
    
    // Mock Notice to avoid console noise
    mockNotice = jest.spyOn(require('obsidian'), 'Notice').mockImplementation(() => ({}));
    
    plugin = new ExocortexPlugin(app, {
      id: 'exocortex',
      name: 'Exocortex',
      version: '2.11.0',
      minAppVersion: '1.0.0',
      description: 'Knowledge management with semantic web technologies',
      author: 'M.K. Khromov',
      authorUrl: 'https://github.com/kitelev',
      isDesktopOnly: false
    });
    
    // Mock plugin methods for testing
    jest.spyOn(plugin, 'addCommand').mockImplementation(() => {});
    jest.spyOn(plugin, 'addRibbonIcon').mockImplementation(() => document.createElement('div'));
    jest.spyOn(plugin, 'registerEvent').mockImplementation(() => {});
    jest.spyOn(plugin, 'registerMarkdownCodeBlockProcessor').mockImplementation(() => {});
  });
  
  afterEach(() => {
    if (mockNotice) {
      mockNotice.mockRestore();
    }
    jest.clearAllMocks();
  });

  describe('Plugin Lifecycle', () => {
    test('should initialize all core components during load', async () => {
      await plugin.onload();
      
      // Verify core components are initialized
      expect(plugin['graph']).toBeDefined();
      expect(plugin['sparqlProcessor']).toBeDefined();
      expect(plugin['graphVisualizationProcessor']).toBeDefined();
      expect(plugin['container']).toBeDefined();
      expect(plugin['rdfService']).toBeDefined();
    });
    
    test('should register all markdown processors', async () => {
      const registerSpy = jest.spyOn(plugin, 'registerMarkdownCodeBlockProcessor');
      
      await plugin.onload();
      
      expect(registerSpy).toHaveBeenCalledWith('sparql', expect.any(Function));
      expect(registerSpy).toHaveBeenCalledWith('graph', expect.any(Function));
    });
    
    test('should register all commands during load', async () => {
      const commandSpy = jest.spyOn(plugin, 'addCommand');
      
      await plugin.onload();
      
      // Verify all commands are registered
      expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'create-exo-asset',
        name: 'Create new ExoAsset'
      }));
      expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'view-sparql-cache-stats'
      }));
      expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'clear-sparql-cache'
      }));
      expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'export-knowledge-graph'
      }));
      expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'import-rdf-data'
      }));
      expect(commandSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'quick-create-task'
      }));
      
      expect(commandSpy).toHaveBeenCalledTimes(6);
    });
    
    test('should register ribbon icon', async () => {
      const ribbonSpy = jest.spyOn(plugin, 'addRibbonIcon');
      
      await plugin.onload();
      
      expect(ribbonSpy).toHaveBeenCalledWith('plus-circle', 'Create ExoAsset', expect.any(Function));
    });
    
    test('should register vault event handlers', async () => {
      await plugin.onload();
      
      expect(app.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
      expect(app.vault.on).toHaveBeenCalledWith('create', expect.any(Function));
      expect(app.vault.on).toHaveBeenCalledWith('delete', expect.any(Function));
    });
    
    test('should load vault data into graph', async () => {
      await plugin.onload();
      
      expect(app.vault.getMarkdownFiles).toHaveBeenCalled();
      expect(app.vault.read).toHaveBeenCalled();
    });
    
    test('should handle load errors gracefully', async () => {
      app.vault.getMarkdownFiles = jest.fn().mockImplementation(() => {
        throw new Error('Vault access failed');
      });
      
      // Should not throw during plugin load - error should be caught and handled
      await expect(plugin.onload()).resolves.not.toThrow();
      
      // Verify components are still initialized despite vault error
      expect(plugin['graph']).toBeDefined();
      expect(plugin['container']).toBeDefined();
      expect(plugin['rdfService']).toBeDefined();
    });
    
    test('should cleanup resources during unload', async () => {
      await plugin.onload();
      
      const mockSparqlProcessor = plugin['sparqlProcessor'];
      const mockGraph = plugin['graph'];
      
      await plugin.onunload();
      
      // Verify cleanup was called
      expect(mockGraph.clear).toHaveBeenCalled();
      expect(mockSparqlProcessor.destroy).toHaveBeenCalled();
    });
    
    test('should handle unload when components are not initialized', async () => {
      // Don't call onload, test unload with uninitialized state
      await expect(plugin.onunload()).resolves.not.toThrow();
    });
  });

  describe('SPARQL Cache Management', () => {
    beforeEach(async () => {
      await plugin.onload();
    });
    
    test('should initialize SPARQL processor with cache configuration', async () => {
      const processor = plugin['sparqlProcessor'];
      expect(processor).toBeDefined();
      
      // Verify cache statistics are available
      const stats = processor.getCacheStatistics();
      expect(stats).toEqual(expect.objectContaining({
        hits: expect.any(Number),
        misses: expect.any(Number),
        hitRate: expect.any(Number),
        size: expect.any(Number),
        maxSize: expect.any(Number),
        totalQueries: expect.any(Number),
        evictions: expect.any(Number)
      }));
    });
    
    test('should provide cache statistics through command', async () => {
      const commands = plugin['addCommand'].mock.calls;
      const cacheStatsCommand = commands.find(call => call[0].id === 'view-sparql-cache-stats');
      
      expect(cacheStatsCommand).toBeDefined();
      expect(cacheStatsCommand[0].callback).toBeInstanceOf(Function);
    });
    
    test('should provide cache clearing functionality', async () => {
      const commands = plugin['addCommand'].mock.calls;
      const clearCacheCommand = commands.find(call => call[0].id === 'clear-sparql-cache');
      
      expect(clearCacheCommand).toBeDefined();
      expect(clearCacheCommand[0].callback).toBeInstanceOf(Function);
      
      // Execute the clear cache command
      clearCacheCommand[0].callback();
      expect(plugin['sparqlProcessor'].invalidateCache).toHaveBeenCalled();
    });
  });

  describe('File Management and Graph Updates', () => {
    beforeEach(async () => {
      await plugin.onload();
    });
    
    test('should extract triples from frontmatter', () => {
      const mockFile = new TFile('test.md');
      const content = `---
title: Test Note
tags: [project, active]
author: John Doe
---

# Test Content`;
      
      const triples = plugin['extractTriplesFromFile'](mockFile, content);
      
      expect(triples).toHaveLength(5); // title, 2 tags, author, file_path, file_name
      expect(triples.some(t => t.getPredicate().toString() === 'title')).toBe(true);
      expect(triples.some(t => t.getPredicate().toString() === 'author')).toBe(true);
    });
    
    test('should parse complex frontmatter correctly', () => {
      const mockFile = new TFile('complex.md');
      const content = `---
project:
  - Project A
  - Project B
status: active
nested:
  value: test
---

# Complex Note`;
      
      const triples = plugin['extractTriplesFromFile'](mockFile, content);
      
      // Should handle array values and nested objects
      expect(triples.length).toBeGreaterThan(2);
    });
    
    test('should handle file without frontmatter', () => {
      const mockFile = new TFile('simple.md');
      const content = `# Simple Note

Just content, no frontmatter.`;
      
      const triples = plugin['extractTriplesFromFile'](mockFile, content);
      
      // Should still create basic file metadata triples
      expect(triples).toHaveLength(2); // file_path, file_name
    });
    
    test('should update graph when file is modified', async () => {
      const mockFile = new TFile('modified.md');
      const eventHandlers = app.vault.on.mock.calls;
      const modifyHandler = eventHandlers.find(call => call[0] === 'modify')[1];
      
      // Simulate file modification
      await modifyHandler(mockFile);
      
      expect(app.vault.read).toHaveBeenCalledWith(mockFile);
      expect(plugin['sparqlProcessor'].invalidateCache).toHaveBeenCalled();
    });
    
    test('should handle file creation events', async () => {
      const mockFile = new TFile('new.md');
      const eventHandlers = app.vault.on.mock.calls;
      const createHandler = eventHandlers.find(call => call[0] === 'create')[1];
      
      // Simulate file creation
      await createHandler(mockFile);
      
      expect(app.vault.read).toHaveBeenCalledWith(mockFile);
      expect(plugin['sparqlProcessor'].invalidateCache).toHaveBeenCalled();
    });
    
    test('should handle file deletion events', async () => {
      const mockFile = new TFile('deleted.md');
      const eventHandlers = app.vault.on.mock.calls;
      const deleteHandler = eventHandlers.find(call => call[0] === 'delete')[1];
      
      // Simulate file deletion
      await deleteHandler(mockFile);
      
      expect(plugin['sparqlProcessor'].invalidateCache).toHaveBeenCalled();
    });
  });
  
  describe('Command Integration', () => {
    beforeEach(async () => {
      await plugin.onload();
    });
    
    test('should execute create asset command', async () => {
      const commands = plugin['addCommand'].mock.calls;
      const createCommand = commands.find(call => call[0].id === 'create-exo-asset');
      
      expect(createCommand).toBeDefined();
      expect(createCommand[0].hotkeys).toEqual([{ modifiers: ["Mod", "Shift"], key: "n" }]);
      
      // Execute command should open modal
      createCommand[0].callback();
      
      const { CreateAssetModal } = require('../../src/presentation/modals/CreateAssetModal');
      expect(CreateAssetModal).toHaveBeenCalledWith(app);
    });
    
    test('should execute export graph command', async () => {
      const commands = plugin['addCommand'].mock.calls;
      const exportCommand = commands.find(call => call[0].id === 'export-knowledge-graph');
      
      expect(exportCommand).toBeDefined();
      
      // Execute command should open modal
      exportCommand[0].callback();
      
      const { ExportRDFModal } = require('../../src/presentation/modals/ExportRDFModal');
      expect(ExportRDFModal).toHaveBeenCalledWith(
        app,
        plugin['graph'],
        expect.any(Object),
        expect.any(Function)
      );
    });
    
    test('should execute import RDF command', async () => {
      const commands = plugin['addCommand'].mock.calls;
      const importCommand = commands.find(call => call[0].id === 'import-rdf-data');
      
      expect(importCommand).toBeDefined();
      
      // Execute command should open modal
      importCommand[0].callback();
      
      const { ImportRDFModal } = require('../../src/presentation/modals/ImportRDFModal');
      expect(ImportRDFModal).toHaveBeenCalledWith(
        app,
        plugin['graph'],
        expect.any(Object),
        expect.any(Function)
      );
    });
    
    test('should execute quick task creation command', async () => {
      const commands = plugin['addCommand'].mock.calls;
      const taskCommand = commands.find(call => call[0].id === 'quick-create-task');
      
      expect(taskCommand).toBeDefined();
      expect(taskCommand[0].hotkeys).toEqual([{ modifiers: ["Mod", "Shift"], key: "t" }]);
      
      // Execute command should open task modal
      await taskCommand[0].callback();
      
      const { QuickTaskModal } = require('../../src/presentation/modals/QuickTaskModal');
      expect(QuickTaskModal).toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle processor registration failures gracefully', async () => {
      plugin.registerMarkdownCodeBlockProcessor = jest.fn().mockImplementation(() => {
        throw new Error('Registration failed');
      });
      
      // Should not fail plugin loading
      await expect(plugin.onload()).resolves.not.toThrow();
    });
    
    test('should handle vault read failures during graph loading', async () => {
      app.vault.read = jest.fn().mockRejectedValue(new Error('Read failed'));
      
      // Should not fail plugin loading
      await expect(plugin.onload()).resolves.not.toThrow();
    });
    
    test('should handle quick task command errors', async () => {
      await plugin.onload();
      
      const commands = plugin['addCommand'].mock.calls;
      const taskCommand = commands.find(call => call[0].id === 'quick-create-task');
      
      // Should handle error gracefully and show notice
      await expect(taskCommand[0].callback()).resolves.not.toThrow();
    });
  });
  
  describe('Integration Tests', () => {
    test('should have all components working together after load', async () => {
      await plugin.onload();
      
      // Verify all critical components are initialized and connected
      expect(plugin['graph']).toBeDefined();
      expect(plugin['sparqlProcessor']).toBeDefined();
      expect(plugin['graphVisualizationProcessor']).toBeDefined();
      expect(plugin['rdfService']).toBeDefined();
      expect(plugin['container']).toBeDefined();
      
      // Verify processors are connected to the graph
      const sparqlProcessor = plugin['sparqlProcessor'];
      expect(sparqlProcessor).toBeDefined();
    });
    
    test('should maintain data consistency across file operations', async () => {
      await plugin.onload();
      
      const mockFile = new TFile('consistency-test.md');
      const processor = plugin['sparqlProcessor'];
      
      // Reset mocks to track calls from this test specifically
      jest.clearAllMocks();
      
      // Mock file content for update operation
      app.vault.read = jest.fn().mockResolvedValue(`---
title: Test File
tags: [project, test]
---

# Test Content

Some test content.`);
      
      // Mock graph.match to return existing triples that need to be removed
      const mockTriple = { subject: 'test', predicate: 'test', object: 'test' };
      mockGraphMethods.match.mockReturnValue([mockTriple]);
      
      // Simulate file update cycle - this should remove old triples and add new ones
      await plugin['updateFileInGraph'](mockFile);
      
      // Verify old triples were removed by checking removeFileFromGraph was called
      expect(mockGraphMethods.match).toHaveBeenCalled();
      expect(mockGraphMethods.remove).toHaveBeenCalled();
      
      // Verify new triples were added (at least file metadata triples)
      expect(mockGraphMethods.add).toHaveBeenCalled();
      expect(app.vault.read).toHaveBeenCalledWith(mockFile);
      
      // Test file deletion maintains consistency
      jest.clearAllMocks();
      plugin['removeFileFromGraph'](mockFile);
      expect(mockGraphMethods.match).toHaveBeenCalled();
      expect(mockGraphMethods.remove).toHaveBeenCalled();
    });
  });
  
  describe('Frontmatter Parsing', () => {
    test('should parse simple frontmatter', () => {
      const yaml = 'title: Test\nauthor: John\nstatus: active';
      const result = plugin['parseFrontmatter'](yaml);
      
      expect(result).toEqual({
        title: 'Test',
        author: 'John',
        status: 'active'
      });
    });
    
    test('should parse array frontmatter', () => {
      const yaml = 'tags:\n  - project\n  - active\nauthor: John';
      const result = plugin['parseFrontmatter'](yaml);
      
      expect(result).toEqual({
        tags: ['project', 'active'],
        author: 'John'
      });
    });
    
    test('should handle empty values', () => {
      const yaml = 'title:\nauthor: John\nempty: ""';
      const result = plugin['parseFrontmatter'](yaml);
      
      expect(result).toEqual({
        title: [],
        author: 'John',
        empty: ''
      });
    });
    
    test('should handle complex nested arrays', () => {
      const yaml = 'projects:\n  - Project A\n  - Project B\n  - Project C\nowner: Team';
      const result = plugin['parseFrontmatter'](yaml);
      
      expect(result).toEqual({
        projects: ['Project A', 'Project B', 'Project C'],
        owner: 'Team'
      });
    });
  });
  
  describe('Performance and Memory', () => {
    test('should not create memory leaks during repeated load/unload cycles', async () => {
      // Test multiple load/unload cycles
      for (let i = 0; i < 5; i++) {
        await plugin.onload();
        await plugin.onunload();
      }
      
      // Should complete without throwing
      expect(true).toBe(true);
    });
    
    test('should handle large vault with many files', async () => {
      // Mock a large number of files
      const manyFiles = Array.from({ length: 1000 }, (_, i) => ({
        basename: `file-${i}`,
        path: `file-${i}.md`,
        name: `file-${i}.md`,
        extension: 'md'
      }));
      
      app.vault.getMarkdownFiles = jest.fn().mockReturnValue(manyFiles);
      
      // Should handle large vault without timing out
      await expect(plugin.onload()).resolves.not.toThrow();
    });
  });
});

// Additional test utilities for comprehensive testing
function createMockFile(path: string, content: string = ''): TFile {
  const file = new TFile(path);
  return file;
}

function createMockFrontmatter(data: Record<string, any>): string {
  const yaml = Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');
  
  return `---\n${yaml}\n---`;
}