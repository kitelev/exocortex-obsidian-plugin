import { ExoFocusService } from '../../../../src/application/services/ExoFocusService';
import { ExoFocus, FocusFilter } from '../../../../src/domain/entities/ExoFocus';
import { Graph } from '../../../../src/domain/semantic/core/Graph';
import { Triple, IRI, Literal } from '../../../../src/domain/semantic/core/Triple';
import { Result } from '../../../../src/domain/core/Result';
import { App, TFile, MetadataCache, FileCache, Vault, DataAdapter } from 'obsidian';

// Mock Obsidian classes
jest.mock('obsidian');

describe('ExoFocusService', () => {
  let exoFocusService: ExoFocusService;
  let mockApp: jest.Mocked<App>;
  let mockVault: jest.Mocked<Vault>;
  let mockAdapter: jest.Mocked<DataAdapter>;
  let mockMetadataCache: jest.Mocked<MetadataCache>;
  let mockGraph: jest.Mocked<Graph>;
  let mockFile: jest.Mocked<TFile>;

  beforeEach(() => {
    // Create mock objects
    mockAdapter = {
      read: jest.fn(),
      write: jest.fn()
    } as any;

    mockVault = {
      adapter: mockAdapter,
      getMarkdownFiles: jest.fn()
    } as any;

    mockMetadataCache = {
      getFileCache: jest.fn()
    } as any;

    mockApp = {
      vault: mockVault,
      metadataCache: mockMetadataCache
    } as any;

    mockGraph = {
      match: jest.fn()
    } as any;

    mockFile = {
      path: 'test-file.md',
      name: 'test-file.md'
    } as any;

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with app and graph', () => {
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
      expect(exoFocusService).toBeDefined();
    });

    it('should load focuses when adapter is available', () => {
      mockAdapter.read.mockResolvedValue(JSON.stringify([]));
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
      expect(exoFocusService).toBeDefined();
    });

    it('should handle app without vault adapter', () => {
      const appWithoutAdapter = { vault: null } as any;
      exoFocusService = new ExoFocusService(appWithoutAdapter, mockGraph);
      expect(exoFocusService).toBeDefined();
    });

    it('should handle app without vault', () => {
      const appWithoutVault = {} as any;
      exoFocusService = new ExoFocusService(appWithoutVault, mockGraph);
      expect(exoFocusService).toBeDefined();
    });
  });

  describe('loadFocuses', () => {
    beforeEach(() => {
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should load focuses from existing config', async () => {
      const focusConfig = [{
        name: 'Test Focus',
        description: 'Test focus description',
        filters: [],
        priority: 50,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      
      mockAdapter.read.mockResolvedValue(JSON.stringify(focusConfig));

      // Trigger loadFocuses by creating new service
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
      
      // Allow async load to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAdapter.read).toHaveBeenCalledWith('.exocortex/focus-configs.json');
    });

    it('should create default focuses when config file does not exist', async () => {
      mockAdapter.read.mockRejectedValue(new Error('File not found'));
      mockAdapter.write.mockResolvedValue();

      exoFocusService = new ExoFocusService(mockApp, mockGraph);
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAdapter.write).toHaveBeenCalled();
    });

    it('should handle invalid JSON in config file', async () => {
      mockAdapter.read.mockResolvedValue('invalid json');
      mockAdapter.write.mockResolvedValue();

      exoFocusService = new ExoFocusService(mockApp, mockGraph);
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should create defaults when JSON parsing fails
      expect(mockAdapter.write).toHaveBeenCalled();
    });

    it('should skip loading when no adapter available', async () => {
      const appWithoutAdapter = { vault: {} } as any;
      exoFocusService = new ExoFocusService(appWithoutAdapter, mockGraph);
      
      expect(exoFocusService).toBeDefined();
    });
  });

  describe('getActiveFocus', () => {
    it('should return null when no active focus', () => {
      // Create service with no vault adapter to prevent default focus creation
      const appWithoutAdapter = { vault: {} } as any;
      exoFocusService = new ExoFocusService(appWithoutAdapter, mockGraph);
      
      const activeFocus = exoFocusService.getActiveFocus();
      expect(activeFocus).toBeNull();
    });

    it('should return active focus when available', async () => {
      // Setup proper mocks for this test
      mockAdapter.read.mockRejectedValue(new Error('File not found'));
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
      
      // Create a focus
      await exoFocusService.createFocus('Test Focus', 'Test description', []);
      const allFocuses = exoFocusService.getAllFocuses();
      
      // Find the focus we just created (not the default "All" focus)
      const testFocus = allFocuses.find(f => f.name === 'Test Focus');
      expect(testFocus).toBeDefined();

      // Set it as active
      await exoFocusService.setActiveFocus(testFocus!.id);

      const activeFocus = exoFocusService.getActiveFocus();
      expect(activeFocus).not.toBeNull();
      expect(activeFocus!.name).toBe('Test Focus');
    });
  });

  describe('setActiveFocus', () => {
    beforeEach(() => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should set active focus successfully', async () => {
      const createResult = await exoFocusService.createFocus('Test Focus', 'Description', []);
      const focus = createResult.getValue();

      const result = await exoFocusService.setActiveFocus(focus.id);

      expect(result.isSuccess).toBe(true);
      expect(exoFocusService.getActiveFocus()).toBe(focus);
    });

    it('should fail when focus does not exist', async () => {
      const result = await exoFocusService.setActiveFocus('non-existent-id');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Focus not found');
    });

    it('should deactivate previous focus when setting new one', async () => {
      const focus1Result = await exoFocusService.createFocus('Focus 1', 'First focus', []);
      const focus2Result = await exoFocusService.createFocus('Focus 2', 'Second focus', []);
      
      const focus1 = focus1Result.getValue();
      const focus2 = focus2Result.getValue();

      await exoFocusService.setActiveFocus(focus1.id);
      await exoFocusService.setActiveFocus(focus2.id);

      expect(exoFocusService.getActiveFocus()).toBe(focus2);
      expect(focus1.active).toBe(false);
      expect(focus2.active).toBe(true);
    });

    it('should save focuses after setting active', async () => {
      const createResult = await exoFocusService.createFocus('Test Focus', 'Description', []);
      const focus = createResult.getValue();
      
      mockAdapter.write.mockClear(); // Clear previous write calls

      await exoFocusService.setActiveFocus(focus.id);

      expect(mockAdapter.write).toHaveBeenCalled();
    });
  });

  describe('createFocus', () => {
    beforeEach(() => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should create focus with valid parameters', async () => {
      const filters: FocusFilter[] = [
        { type: 'tag', operator: 'includes', value: ['work'] }
      ];

      const result = await exoFocusService.createFocus('Work Focus', 'Work related items', filters);

      expect(result.isSuccess).toBe(true);
      const focus = result.getValue();
      expect(focus.name).toBe('Work Focus');
      expect(focus.description).toBe('Work related items');
      expect(focus.filters).toEqual(filters);
    });

    it('should fail when ExoFocus.create fails', async () => {
      // Create focus with invalid parameters that would cause ExoFocus.create to fail
      const result = await exoFocusService.createFocus('', 'Invalid focus', []);

      expect(result.isFailure).toBe(true);
    });

    it('should add created focus to collection', async () => {
      await exoFocusService.createFocus('Test Focus', 'Test description', []);

      const allFocuses = exoFocusService.getAllFocuses();
      expect(allFocuses).toHaveLength(1);
      expect(allFocuses[0].name).toBe('Test Focus');
    });

    it('should save focuses after creation', async () => {
      mockAdapter.write.mockClear();

      await exoFocusService.createFocus('Test Focus', 'Test description', []);

      expect(mockAdapter.write).toHaveBeenCalled();
    });

    it('should create focus with complex filters', async () => {
      const complexFilters: FocusFilter[] = [
        { type: 'class', operator: 'includes', value: ['ems__Task'] },
        { type: 'property', operator: 'equals', value: 'high', property: 'priority' },
        { type: 'timeframe', operator: 'between', value: ['2023-01-01', '2023-12-31'] }
      ];

      const result = await exoFocusService.createFocus('Complex Focus', 'Complex filtering', complexFilters);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().filters).toEqual(complexFilters);
    });
  });

  describe('updateFocus', () => {
    let focusId: string;

    beforeEach(async () => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);

      const result = await exoFocusService.createFocus('Test Focus', 'Test description', []);
      focusId = result.getValue().id;
    });

    it('should update focus priority successfully', async () => {
      const result = await exoFocusService.updateFocus(focusId, { priority: 75 });

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when focus does not exist', async () => {
      const result = await exoFocusService.updateFocus('non-existent', { priority: 75 });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Focus not found');
    });

    it('should save after successful update', async () => {
      mockAdapter.write.mockClear();

      await exoFocusService.updateFocus(focusId, { priority: 75 });

      expect(mockAdapter.write).toHaveBeenCalled();
    });

    it('should handle invalid priority update', async () => {
      const result = await exoFocusService.updateFocus(focusId, { priority: 150 });

      expect(result.isFailure).toBe(true);
    });

    it('should handle multiple property updates', async () => {
      const updates = {
        priority: 80,
        name: 'Updated Name'
      };

      const result = await exoFocusService.updateFocus(focusId, updates);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('deleteFocus', () => {
    let focusId: string;

    beforeEach(async () => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);

      const result = await exoFocusService.createFocus('Test Focus', 'Test description', []);
      focusId = result.getValue().id;
    });

    it('should delete focus successfully', async () => {
      const result = await exoFocusService.deleteFocus(focusId);

      expect(result.isSuccess).toBe(true);
      expect(exoFocusService.getAllFocuses()).toHaveLength(0);
    });

    it('should fail when focus does not exist', async () => {
      const result = await exoFocusService.deleteFocus('non-existent-id');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Focus not found');
    });

    it('should switch to "All" focus when deleting active focus', async () => {
      // First create an "All" focus
      await exoFocusService.createFocus('All', 'Show all items', []);
      
      // Set test focus as active
      await exoFocusService.setActiveFocus(focusId);
      expect(exoFocusService.getActiveFocus()?.name).toBe('Test Focus');

      // Delete the active focus
      await exoFocusService.deleteFocus(focusId);

      // Should switch to "All" focus
      const activeFocus = exoFocusService.getActiveFocus();
      expect(activeFocus?.name).toBe('All');
    });

    it('should set active focus to null when no "All" focus exists', async () => {
      await exoFocusService.setActiveFocus(focusId);
      
      const result = await exoFocusService.deleteFocus(focusId);

      expect(result.isSuccess).toBe(true);
      expect(exoFocusService.getActiveFocus()).toBeNull();
    });

    it('should save after deletion', async () => {
      mockAdapter.write.mockClear();

      await exoFocusService.deleteFocus(focusId);

      expect(mockAdapter.write).toHaveBeenCalled();
    });
  });

  describe('getAllFocuses', () => {
    beforeEach(() => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should return empty array when no focuses', () => {
      const focuses = exoFocusService.getAllFocuses();
      expect(focuses).toEqual([]);
    });

    it('should return all created focuses', async () => {
      await exoFocusService.createFocus('Focus 1', 'First focus', []);
      await exoFocusService.createFocus('Focus 2', 'Second focus', []);

      const focuses = exoFocusService.getAllFocuses();
      expect(focuses).toHaveLength(2);
      expect(focuses.map(f => f.name)).toContain('Focus 1');
      expect(focuses.map(f => f.name)).toContain('Focus 2');
    });

    it('should return copy of focuses array', async () => {
      await exoFocusService.createFocus('Test Focus', 'Test', []);

      const focuses1 = exoFocusService.getAllFocuses();
      const focuses2 = exoFocusService.getAllFocuses();

      expect(focuses1).not.toBe(focuses2);
      expect(focuses1).toEqual(focuses2);
    });
  });

  describe('filterAssets', () => {
    beforeEach(async () => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should return all assets when no active focus', () => {
      const assets = [{ name: 'Asset 1' }, { name: 'Asset 2' }];

      const filtered = exoFocusService.filterAssets(assets);

      expect(filtered).toEqual(assets);
    });

    it('should filter assets based on active focus', async () => {
      const filters: FocusFilter[] = [
        { type: 'tag', operator: 'includes', value: ['work'] }
      ];
      
      const result = await exoFocusService.createFocus('Work Focus', 'Work items', filters);
      await exoFocusService.setActiveFocus(result.getValue().id);

      const assets = [
        { name: 'Asset 1', tags: ['work'] },
        { name: 'Asset 2', tags: ['personal'] }
      ];

      // Mock the matchesAsset method
      const mockMatches = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      
      const activeFocus = exoFocusService.getActiveFocus();
      if (activeFocus) {
        activeFocus.matchesAsset = mockMatches;
      }

      const filtered = exoFocusService.filterAssets(assets);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Asset 1');
    });

    it('should handle empty assets array', () => {
      const filtered = exoFocusService.filterAssets([]);
      expect(filtered).toEqual([]);
    });
  });

  describe('filterTriples', () => {
    let mockTriple1: jest.Mocked<Triple>;
    let mockTriple2: jest.Mocked<Triple>;

    beforeEach(async () => {
      mockAdapter.read.mockRejectedValue(new Error('File not found'));
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);

      // Create mock triples
      mockTriple1 = {
        getSubject: jest.fn().mockReturnValue({ toString: () => 'subject1' }),
        getPredicate: jest.fn().mockReturnValue({ toString: () => 'predicate1' }),
        getObject: jest.fn().mockReturnValue({ toString: () => 'object1' })
      } as any;

      mockTriple2 = {
        getSubject: jest.fn().mockReturnValue({ toString: () => 'subject2' }),
        getPredicate: jest.fn().mockReturnValue({ toString: () => 'predicate2' }),
        getObject: jest.fn().mockReturnValue({ toString: () => 'object2' })
      } as any;
    });

    it('should return all triples when no active focus', () => {
      const triples = [mockTriple1, mockTriple2];

      const filtered = exoFocusService.filterTriples(triples);

      expect(filtered).toEqual(triples);
    });

    it('should filter triples based on active focus', async () => {
      const filters: FocusFilter[] = [
        { type: 'class', operator: 'includes', value: ['TestClass'] }
      ];
      
      const result = await exoFocusService.createFocus('Test Focus', 'Test filtering', filters);
      await exoFocusService.setActiveFocus(result.getValue().id);

      const triples = [mockTriple1, mockTriple2];

      // Mock the matchesTriple method
      const mockMatches = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      
      const activeFocus = exoFocusService.getActiveFocus();
      if (activeFocus) {
        activeFocus.matchesTriple = mockMatches;
      }

      const filtered = exoFocusService.filterTriples(triples);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(mockTriple1);
    });

    it('should handle empty triples array', () => {
      const filtered = exoFocusService.filterTriples([]);
      expect(filtered).toEqual([]);
    });
  });

  describe('filterFiles', () => {
    beforeEach(async () => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should return all files when no active focus', async () => {
      const files = [mockFile];

      const filtered = await exoFocusService.filterFiles(files);

      expect(filtered).toEqual(files);
    });

    it('should filter files based on frontmatter', async () => {
      const filters: FocusFilter[] = [
        { type: 'tag', operator: 'includes', value: ['work'] }
      ];
      
      const result = await exoFocusService.createFocus('Work Focus', 'Work files', filters);
      await exoFocusService.setActiveFocus(result.getValue().id);

      const files = [mockFile];
      const mockCache: FileCache = {
        frontmatter: { tags: ['work'] }
      };

      mockMetadataCache.getFileCache.mockReturnValue(mockCache);

      // Mock the matchesAsset method
      const activeFocus = exoFocusService.getActiveFocus();
      if (activeFocus) {
        activeFocus.matchesAsset = jest.fn().mockReturnValue(true);
      }

      const filtered = await exoFocusService.filterFiles(files);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(mockFile);
    });

    it('should handle files without frontmatter', async () => {
      const filters: FocusFilter[] = [
        { type: 'tag', operator: 'includes', value: ['work'] }
      ];
      
      const result = await exoFocusService.createFocus('Work Focus', 'Work files', filters);
      await exoFocusService.setActiveFocus(result.getValue().id);

      const files = [mockFile];
      mockMetadataCache.getFileCache.mockReturnValue(null);

      const filtered = await exoFocusService.filterFiles(files);

      expect(filtered).toHaveLength(0);
    });

    it('should handle empty files array', async () => {
      const filtered = await exoFocusService.filterFiles([]);
      expect(filtered).toEqual([]);
    });
  });

  describe('filterSPARQLResults', () => {
    beforeEach(async () => {
      mockAdapter.read.mockRejectedValue(new Error('File not found'));
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should return all results when no active focus', () => {
      const results = [
        { subject: 's1', predicate: 'p1', object: 'o1' },
        { name: 'Asset 1' }
      ];

      const filtered = exoFocusService.filterSPARQLResults(results);

      expect(filtered).toEqual(results);
    });

    it('should filter triple-like results', async () => {
      const filters: FocusFilter[] = [
        { type: 'class', operator: 'includes', value: ['TestClass'] }
      ];
      
      const result = await exoFocusService.createFocus('Test Focus', 'Test filtering', filters);
      await exoFocusService.setActiveFocus(result.getValue().id);

      const results = [
        { subject: 's1', predicate: 'p1', object: 'o1' },
        { subject: 's2', predicate: 'p2', object: 'o2' }
      ];

      // Mock the matchesTriple method
      const mockMatchesTriple = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      
      const activeFocus = exoFocusService.getActiveFocus();
      if (activeFocus) {
        activeFocus.matchesTriple = mockMatchesTriple;
      }

      const filtered = exoFocusService.filterSPARQLResults(results);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual({ subject: 's1', predicate: 'p1', object: 'o1' });
    });

    it('should filter asset-like results', async () => {
      const filters: FocusFilter[] = [
        { type: 'tag', operator: 'includes', value: ['work'] }
      ];
      
      const result = await exoFocusService.createFocus('Work Focus', 'Work items', filters);
      await exoFocusService.setActiveFocus(result.getValue().id);

      const results = [
        { name: 'Asset 1', tags: ['work'] },
        { name: 'Asset 2', tags: ['personal'] }
      ];

      // Mock the matchesAsset method
      const mockMatchesAsset = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      
      const activeFocus = exoFocusService.getActiveFocus();
      if (activeFocus) {
        activeFocus.matchesAsset = mockMatchesAsset;
      }

      const filtered = exoFocusService.filterSPARQLResults(results);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Asset 1');
    });
  });

  describe('getFocusStatistics', () => {
    beforeEach(async () => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should return statistics with no active focus', async () => {
      const files = [mockFile, mockFile]; // Two files
      const triples = [
        new Triple(new IRI('s1'), new IRI('p1'), new Literal('o1')),
        new Triple(new IRI('s2'), new IRI('p2'), new Literal('o2'))
      ];

      mockVault.getMarkdownFiles.mockReturnValue(files);
      mockGraph.match.mockReturnValue(triples);

      const stats = await exoFocusService.getFocusStatistics();

      expect(stats.totalAssets).toBe(2);
      expect(stats.filteredAssets).toBe(2);
      expect(stats.totalTriples).toBe(2);
      expect(stats.filteredTriples).toBe(2);
      expect(stats.activeFocus).toBe('None');
    });

    it('should return filtered statistics with active focus', async () => {
      const filters: FocusFilter[] = [
        { type: 'tag', operator: 'includes', value: ['work'] }
      ];
      
      const result = await exoFocusService.createFocus('Work Focus', 'Work items', filters);
      await exoFocusService.setActiveFocus(result.getValue().id);

      const files = [mockFile];
      const triples = [new Triple(new IRI('s1'), new IRI('p1'), new Literal('o1'))];

      mockVault.getMarkdownFiles.mockReturnValue(files);
      mockGraph.match.mockReturnValue(triples);
      
      // Mock metadata cache to return frontmatter
      const mockCache: FileCache = {
        frontmatter: { tags: ['work'] }
      };
      mockMetadataCache.getFileCache.mockReturnValue(mockCache);

      // Mock focus matching methods
      const activeFocus = exoFocusService.getActiveFocus();
      if (activeFocus) {
        activeFocus.matchesAsset = jest.fn().mockReturnValue(true);
        activeFocus.matchesTriple = jest.fn().mockReturnValue(true);
      }

      const stats = await exoFocusService.getFocusStatistics();

      expect(stats.totalAssets).toBe(1);
      expect(stats.filteredAssets).toBe(1);
      expect(stats.totalTriples).toBe(1);
      expect(stats.filteredTriples).toBe(1);
      expect(stats.activeFocus).toBe('Work Focus');
    });

    it('should handle empty vault', async () => {
      mockVault.getMarkdownFiles.mockReturnValue([]);
      mockGraph.match.mockReturnValue([]);

      const stats = await exoFocusService.getFocusStatistics();

      expect(stats.totalAssets).toBe(0);
      expect(stats.filteredAssets).toBe(0);
      expect(stats.totalTriples).toBe(0);
      expect(stats.filteredTriples).toBe(0);
      expect(stats.activeFocus).toBe('None');
    });
  });

  describe('week calculation helpers', () => {
    beforeEach(() => {
      // Allow default focuses to be created for this test section
      mockAdapter.read.mockRejectedValue(new Error('File not found'));
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should create default focuses with time-based filters', async () => {
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const allFocuses = exoFocusService.getAllFocuses();
      const weekFocus = allFocuses.find(f => f.name === 'This Week');
      
      expect(weekFocus).toBeDefined();
      expect(weekFocus?.filters).toHaveLength(1);
      expect(weekFocus?.filters[0].type).toBe('timeframe');
      expect(weekFocus?.filters[0].operator).toBe('between');
    });

    it('should create today focus with correct date filter', async () => {
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const allFocuses = exoFocusService.getAllFocuses();
      const todayFocus = allFocuses.find(f => f.name === 'Today');
      
      expect(todayFocus).toBeDefined();
      expect(todayFocus?.filters).toHaveLength(1);
      expect(todayFocus?.filters[0].type).toBe('timeframe');
      expect(todayFocus?.filters[0].operator).toBe('equals');
      
      const today = new Date().toISOString().split('T')[0];
      expect(todayFocus?.filters[0].value).toBe(today);
    });
  });

  describe('save functionality', () => {
    beforeEach(() => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should save both config and active focus files', async () => {
      const result = await exoFocusService.createFocus('Test Focus', 'Test', []);
      await exoFocusService.setActiveFocus(result.getValue().id);

      // Check that both files are written
      const writeCalls = mockAdapter.write.mock.calls;
      const configCall = writeCalls.find(call => call[0] === '.exocortex/focus-configs.json');
      const activeCall = writeCalls.find(call => call[0] === '.exocortex/focus.json');

      expect(configCall).toBeDefined();
      expect(activeCall).toBeDefined();
    });

    it('should handle save errors gracefully', async () => {
      mockAdapter.write.mockRejectedValue(new Error('Write failed'));

      // Should not throw even if write fails
      try {
        await exoFocusService.createFocus('Test Focus', 'Test', []);
        // If we get here, the test passed
        expect(true).toBe(true);
      } catch (error) {
        // The test should fail if this throws
        throw new Error('createFocus should not throw when write fails');
      }
    });

    it('should skip saving when no adapter available', async () => {
      const appWithoutAdapter = { vault: {} } as any;
      const serviceWithoutAdapter = new ExoFocusService(appWithoutAdapter, mockGraph);

      // Should not throw when no adapter available
      try {
        await serviceWithoutAdapter.createFocus('Test Focus', 'Test', []);
        expect(true).toBe(true);
      } catch (error) {
        throw new Error('createFocus should not throw when no adapter available');
      }
    });
  });

  describe('edge cases and error handling', () => {
    beforeEach(() => {
      // Mock empty config to prevent default focuses from being created
      mockAdapter.read.mockResolvedValue('[]');
      mockAdapter.write.mockResolvedValue();
      exoFocusService = new ExoFocusService(mockApp, mockGraph);
    });

    it('should handle corrupted focus data gracefully', async () => {
      const corruptedConfig = JSON.stringify([{
        name: 'Corrupted Focus',
        // Missing required fields
      }]);
      
      mockAdapter.read.mockResolvedValue(corruptedConfig);
      
      // Should not throw when loading corrupted data
      expect(() => {
        new ExoFocusService(mockApp, mockGraph);
      }).not.toThrow();
    });

    it('should handle very large filter arrays', async () => {
      const largeFilters: FocusFilter[] = Array.from({ length: 1000 }, (_, i) => ({
        type: 'tag',
        operator: 'includes',
        value: [`tag${i}`]
      }));

      const result = await exoFocusService.createFocus('Large Focus', 'Many filters', largeFilters);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().filters).toHaveLength(1000);
    });

    it('should handle special characters in focus names', async () => {
      const specialName = 'Focus with "quotes" and <brackets> & symbols!';
      
      const result = await exoFocusService.createFocus(specialName, 'Special focus', []);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().name).toBe(specialName);
    });

    it('should handle empty filter values', async () => {
      const emptyFilters: FocusFilter[] = [
        { type: 'tag', operator: 'includes', value: [] },
        { type: 'class', operator: 'excludes', value: [] }
      ];

      const result = await exoFocusService.createFocus('Empty Filters', 'Empty values', emptyFilters);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().filters).toEqual(emptyFilters);
    });

    it('should handle concurrent focus operations', async () => {
      const operations = [
        exoFocusService.createFocus('Focus 1', 'First', []),
        exoFocusService.createFocus('Focus 2', 'Second', []),
        exoFocusService.createFocus('Focus 3', 'Third', [])
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });

      expect(exoFocusService.getAllFocuses()).toHaveLength(3);
    });
  });
});