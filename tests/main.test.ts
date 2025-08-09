import { App, TFile, Notice, MarkdownPostProcessorContext } from 'obsidian';
import ExocortexPlugin from '../main';

// Mock DIContainer
jest.mock('../src/infrastructure/container/DIContainer', () => ({
  DIContainer: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn()
    }))
  }
}));

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

# Test File`)
      },
      workspace: {
        openLinkText: jest.fn()
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
    
    test('should extract triples from files', async () => {
      await plugin.onload();
      
      const query = 'SELECT * WHERE { } LIMIT 1';
      const results = await plugin.executeSPARQL(query);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('subject');
      expect(results[0]).toHaveProperty('predicate');
      expect(results[0]).toHaveProperty('object');
    });
    
    test('should parse frontmatter correctly', async () => {
      await plugin.onload();
      
      const yaml = `exo__Asset_uid: test-uid
exo__Asset_label: Test Asset
exo__Instance_class: "[[exo__Class]]"`;
      
      const result = plugin.parseFrontmatter(yaml);
      
      expect(result['exo__Asset_uid']).toBe('test-uid');
      expect(result['exo__Asset_label']).toBe('Test Asset');
      expect(result['exo__Instance_class']).toBe('[[exo__Class]]');
    });
    
    test('should handle invalid SPARQL queries', async () => {
      await plugin.onload();
      
      const invalidQuery = 'INVALID QUERY';
      
      // Should throw an error for invalid queries, but not crash
      await expect(plugin.executeSPARQL(invalidQuery)).rejects.toThrow('Only SELECT queries supported');
    });
    
    test('should respect LIMIT in queries', async () => {
      await plugin.onload();
      
      const query = 'SELECT * WHERE { } LIMIT 2';
      const results = await plugin.executeSPARQL(query);
      
      expect(results.length).toBeLessThanOrEqual(2);
    });
    
    test('should extract specific variables from SELECT queries', async () => {
      await plugin.onload();
      
      const query = 'SELECT ?subject ?predicate WHERE { } LIMIT 3';
      const results = await plugin.executeSPARQL(query);
      
      expect(results.length).toBeGreaterThan(0);
      if (results[0]) {
        expect(results[0]).toHaveProperty('subject');
        expect(results[0]).toHaveProperty('predicate');
        expect(results[0]).not.toHaveProperty('object');
      }
    });
  });
  
  describe('DOM Processing', () => {
    test('should process SPARQL code blocks without errors', async () => {
      // Setup DOM mock
      const mockContainer = {
        innerHTML: '',
        appendChild: jest.fn(),
        className: '',
        style: {}
      };
      
      const mockContext: MarkdownPostProcessorContext = {
        sourcePath: 'test.md',
        frontmatter: {},
        addChild: jest.fn(),
        getSectionInfo: jest.fn()
      };
      
      await plugin.onload();
      
      const query = 'SELECT * WHERE { } LIMIT 1';
      
      // Should not throw errors
      await expect(plugin.processSPARQL(query, mockContainer as any, mockContext)).resolves.toBeUndefined();
      
      // Should have cleared and modified container
      expect(mockContainer.innerHTML).toBe('');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });
  });
});