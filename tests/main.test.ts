import { App, TFile, Notice } from 'obsidian';
import ExocortexPlugin from '../main';

describe('ExocortexPlugin', () => {
  let app: App;
  let plugin: ExocortexPlugin;
  
  beforeEach(async () => {
    app = new App();
    plugin = new ExocortexPlugin(app, {
      id: 'exocortex-obsidian-plugin',
      name: 'Exocortex',
      version: '0.4.1',
      minAppVersion: '1.0.0',
      description: 'Test',
      author: 'test',
      authorUrl: '',
      isDesktopOnly: false
    });
    // Initialize settings
    await plugin.loadSettings();
  });
  
  describe('Plugin Lifecycle', () => {
    test('should load plugin successfully', async () => {
      const loadDataSpy = jest.spyOn(plugin, 'loadData');
      await plugin.onload();
      
      expect(loadDataSpy).toHaveBeenCalled();
      expect((window as any).ExoUIRender).toBeDefined();
    });
    
    test('should unload plugin successfully', () => {
      (window as any).ExoUIRender = {};
      plugin.onunload();
      
      expect((window as any).ExoUIRender).toBeUndefined();
    });
  });
  
  describe('Settings Management', () => {
    test('should load default settings', async () => {
      await plugin.loadSettings();
      
      expect(plugin.settings).toBeDefined();
      expect(plugin.settings.defaultOntology).toBe('exo');
      expect(plugin.settings.enableAutoLayout).toBe(true);
      expect(plugin.settings.debugMode).toBe(false);
      expect(plugin.settings.templateFolderPath).toBe('templates');
    });
    
    test('should save settings', async () => {
      const saveDataSpy = jest.spyOn(plugin, 'saveData').mockResolvedValue();
      plugin.settings = {
        defaultOntology: 'ems',
        enableAutoLayout: false,
        debugMode: true,
        templateFolderPath: 'templates'
      };
      
      await plugin.saveSettings();
      
      expect(saveDataSpy).toHaveBeenCalledWith(plugin.settings);
    });
    
    test('should merge saved settings with defaults', async () => {
      jest.spyOn(plugin, 'loadData').mockResolvedValue({
        defaultOntology: 'gtd'
      });
      
      await plugin.loadSettings();
      
      expect(plugin.settings.defaultOntology).toBe('gtd');
      expect(plugin.settings.enableAutoLayout).toBe(true); // default value
      expect(plugin.settings.debugMode).toBe(false); // default value
      expect(plugin.settings.templateFolderPath).toBe('templates'); // default value
    });
  });
  
  describe('Ontology Discovery', () => {
    test('should find all ontologies in vault', async () => {
      const mockFile1 = new TFile('!exo.md');
      const mockFile2 = new TFile('Ontology - EMS.md');
      
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([mockFile1, mockFile2]);
      jest.spyOn(app.metadataCache, 'getFileCache')
        .mockImplementation((file: TFile) => {
          if (file.basename === '!exo') {
            return {
              frontmatter: {
                'exo__Instance_class': '[[exo__Ontology]]',
                'exo__Ontology_prefix': 'exo',
                'exo__Asset_label': 'EXO Core'
              }
            };
          }
          if (file.basename === 'Ontology - EMS') {
            return {
              frontmatter: {
                'exo__Instance_class': 'exo__InternalOntology',
                'exo__Ontology_prefix': 'ems',
                'exo__Asset_label': 'EMS Ontology'
              }
            };
          }
          return null;
        });
      
      const ontologies = await plugin.findAllOntologies();
      
      expect(ontologies).toHaveLength(4); // 2 found + 2 defaults (gtd, ims added, exo and ems already found)
      expect(ontologies.find(o => o.prefix === 'exo')).toMatchObject({
        prefix: 'exo',
        label: 'EXO Core',
        fileName: '!exo'
      });
      expect(ontologies.find(o => o.prefix === 'ems')).toMatchObject({
        prefix: 'ems',
        label: 'EMS Ontology',
        fileName: 'Ontology - EMS'
      });
    });
    
    test('should include default ontologies even if not found', async () => {
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([]);
      
      const ontologies = await plugin.findAllOntologies();
      
      expect(ontologies).toHaveLength(4); // All defaults
      const prefixes = ontologies.map(o => o.prefix).sort();
      expect(prefixes).toEqual(['ems', 'exo', 'gtd', 'ims']);
    });
  });
  
  describe('Class Discovery', () => {
    test('should find all classes in vault', async () => {
      const mockFile1 = new TFile('exo__Asset.md');
      const mockFile2 = new TFile('ems__Task.md');
      
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([mockFile1, mockFile2]);
      jest.spyOn(app.metadataCache, 'getFileCache')
        .mockImplementation((file: TFile) => {
          if (file.basename === 'exo__Asset') {
            return {
              frontmatter: {
                'exo__Instance_class': 'exo__Class',
                'exo__Asset_label': 'Asset Base Class',
                'exo__Asset_isDefinedBy': '[[!exo]]'
              }
            };
          }
          if (file.basename === 'ems__Task') {
            return {
              frontmatter: {
                'exo__Instance_class': '[[owl__Class]]',
                'rdfs__label': 'Task',
                'exo__Asset_isDefinedBy': '[[!ems]]'
              }
            };
          }
          return null;
        });
      
      const classes = await plugin.findAllClasses();
      
      expect(classes.length).toBeGreaterThan(2);
      expect(classes.find(c => c.className === 'exo__Asset')).toMatchObject({
        className: 'exo__Asset',
        label: 'Asset Base Class',
        ontology: 'exo'
      });
      expect(classes.find(c => c.className === 'ems__Task')).toMatchObject({
        className: 'ems__Task',
        label: 'Task',
        ontology: 'ems'
      });
    });
    
    test('should include common classes even if not found', async () => {
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([]);
      
      const classes = await plugin.findAllClasses();
      
      expect(classes.length).toBeGreaterThan(10);
      expect(classes.find(c => c.className === 'exo__Asset')).toBeDefined();
      expect(classes.find(c => c.className === 'ems__Task')).toBeDefined();
      expect(classes.find(c => c.className === 'gtd__Project')).toBeDefined();
    });
  });
  
  describe('Property Discovery', () => {
    test('should find properties for a class', async () => {
      const mockFile1 = new TFile('exo__Asset_label.md');
      const mockFile2 = new TFile('ems__Task_status.md');
      
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([mockFile1, mockFile2]);
      jest.spyOn(app.metadataCache, 'getFileCache')
        .mockImplementation((file: TFile) => {
          if (file.basename === 'exo__Asset_label') {
            return {
              frontmatter: {
                'exo__Instance_class': 'exo__DatatypeProperty',
                'exo__Property_domain': 'exo__Asset',
                'exo__Property_range': 'string',
                'exo__Property_required': true,
                'exo__Asset_label': 'Label'
              }
            };
          }
          if (file.basename === 'ems__Task_status') {
            return {
              frontmatter: {
                'exo__Instance_class': 'exo__Property',
                'exo__Property_domain': '[[ems__Task]]',
                'exo__Property_range': 'enum:todo,in_progress,done',
                'rdfs__label': 'Status'
              }
            };
          }
          return null;
        });
      
      // Test for exo__Asset
      const assetProps = await plugin.findPropertiesForClass('exo__Asset');
      const labelProp = assetProps.find(p => p.propertyName === 'exo__Asset_label');
      expect(labelProp).toMatchObject({
        propertyName: 'exo__Asset_label',
        label: 'Label',
        range: 'string',
        isRequired: true
      });
      
      // Test for ems__Task
      const taskProps = await plugin.findPropertiesForClass('ems__Task');
      const statusProp = taskProps.find(p => p.propertyName === 'ems__Task_status');
      expect(statusProp).toMatchObject({
        propertyName: 'ems__Task_status',
        label: 'Status',
        range: 'enum:todo,in_progress,done',
        isRequired: false
      });
    });
    
    test('should inherit properties from parent classes', async () => {
      const mockFile1 = new TFile('ems__Task.md');
      const mockFile2 = new TFile('exo__Asset_label.md');
      
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([mockFile1, mockFile2]);
      jest.spyOn(app.metadataCache, 'getFileCache')
        .mockImplementation((file: TFile) => {
          if (file.basename === 'ems__Task') {
            return {
              frontmatter: {
                'exo__Instance_class': 'exo__Class',
                'exo__Class_superClass': '[[exo__Asset]]'
              }
            };
          }
          if (file.basename === 'exo__Asset_label') {
            return {
              frontmatter: {
                'exo__Instance_class': 'exo__Property',
                'exo__Property_domain': 'exo__Asset',
                'exo__Property_range': 'string'
              }
            };
          }
          return null;
        });
      
      const hierarchy = await plugin.getClassHierarchy('ems__Task');
      expect(hierarchy).toContain('ems__Task');
      expect(hierarchy).toContain('exo__Asset');
      
      const props = await plugin.findPropertiesForClass('ems__Task');
      const labelProp = props.find(p => p.propertyName === 'exo__Asset_label');
      expect(labelProp).toBeDefined();
    });
  });
  
  describe('Class Hierarchy', () => {
    test('should get class hierarchy', async () => {
      const mockFile1 = new TFile('ems__Task.md');
      const mockFile2 = new TFile('exo__Asset.md');
      
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([mockFile1, mockFile2]);
      jest.spyOn(app.metadataCache, 'getFileCache')
        .mockImplementation((file: TFile) => {
          if (file.basename === 'ems__Task') {
            return {
              frontmatter: {
                'exo__Class_superClass': '[[exo__Asset]]'
              }
            };
          }
          return null;
        });
      
      const hierarchy = await plugin.getClassHierarchy('ems__Task');
      
      expect(hierarchy).toEqual(['ems__Task', 'exo__Asset']);
    });
    
    test('should handle circular references in hierarchy', async () => {
      const mockFile1 = new TFile('ClassA.md');
      const mockFile2 = new TFile('ClassB.md');
      
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([mockFile1, mockFile2]);
      jest.spyOn(app.metadataCache, 'getFileCache')
        .mockImplementation((file: TFile) => {
          if (file.basename === 'ClassA') {
            return {
              frontmatter: {
                'exo__Class_superClass': 'ClassB'
              }
            };
          }
          if (file.basename === 'ClassB') {
            return {
              frontmatter: {
                'exo__Class_superClass': 'ClassA'
              }
            };
          }
          return null;
        });
      
      const hierarchy = await plugin.getClassHierarchy('ClassA');
      
      expect(hierarchy).toContain('ClassA');
      expect(hierarchy).toContain('ClassB');
      expect(hierarchy.length).toBeLessThanOrEqual(2); // Should stop at circular reference
    });
  });
  
  describe('Layout Management', () => {
    test('should find layout for class', async () => {
      const mockLayoutFile = new TFile('Layout - ems__Task.md');
      
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([mockLayoutFile]);
      
      const layoutFile = await plugin.findLayoutForClass('[[ems__Task]]');
      
      expect(layoutFile).toBe(mockLayoutFile);
    });
    
    test('should return null if no layout found', async () => {
      jest.spyOn(app.vault, 'getFiles').mockReturnValue([]);
      
      const layoutFile = await plugin.findLayoutForClass('NonExistentClass');
      
      expect(layoutFile).toBeNull();
    });
    
    test('should refresh all layouts', () => {
      // Import MarkdownView from the mock
      const { MarkdownView } = require('obsidian');
      const mockView = new MarkdownView();
      const mockLeaf = { view: mockView };
      
      // Make the view look like a MarkdownView instance
      Object.setPrototypeOf(mockView, MarkdownView.prototype);
      
      jest.spyOn(app.workspace, 'iterateAllLeaves')
        .mockImplementation((callback: any) => {
          callback(mockLeaf);
        });
      
      plugin.refreshAllLayouts();
      
      expect(mockView.previewMode.rerender).toHaveBeenCalledWith(true);
    });
  });
  
  describe('Value Formatting', () => {
    test('should format array values', () => {
      const result = plugin.formatValue(['item1', 'item2', 'item3']);
      expect(result).toBe('item1, item2, item3');
    });
    
    test('should format object values', () => {
      const result = plugin.formatValue({ key: 'value' });
      expect(result).toBe('{"key":"value"}');
    });
    
    test('should format string values', () => {
      const result = plugin.formatValue('simple string');
      expect(result).toBe('simple string');
    });
    
    test('should format null values', () => {
      const result = plugin.formatValue(null);
      expect(result).toBe('null');
    });
    
    test('should format nested arrays', () => {
      const result = plugin.formatValue([['nested'], 'item']);
      expect(result).toBe('nested, item');
    });
  });
  
  describe('Universal Layout Renderer', () => {
    test('should render error when no file determined', async () => {
      const mockDv = {
        paragraph: jest.fn(),
        header: jest.fn(),
        table: jest.fn(),
        list: jest.fn()
      };
      const mockCtx = {
        container: {
          closest: jest.fn().mockReturnValue(null)
        }
      };
      
      jest.spyOn(app.workspace, 'getActiveFile').mockReturnValue(null);
      
      await plugin.renderUniversalLayout(mockDv, mockCtx);
      
      expect(mockDv.paragraph).toHaveBeenCalledWith('Error: Could not determine current file');
    });
    
    test('should render error when no frontmatter', async () => {
      const mockFile = new TFile('test.md');
      const mockDv = {
        paragraph: jest.fn(),
        header: jest.fn(),
        table: jest.fn(),
        list: jest.fn()
      };
      const mockCtx = {
        container: {
          closest: jest.fn().mockReturnValue({ file: mockFile })
        }
      };
      
      jest.spyOn(app.metadataCache, 'getFileCache').mockReturnValue(null);
      
      await plugin.renderUniversalLayout(mockDv, mockCtx);
      
      expect(mockDv.paragraph).toHaveBeenCalledWith('No frontmatter found');
    });
    
    test('should render default layout when no custom layout found', async () => {
      const mockFile = new TFile('test.md');
      const mockDv = {
        paragraph: jest.fn(),
        header: jest.fn(),
        table: jest.fn(),
        list: jest.fn()
      };
      const mockCtx = {
        container: {
          closest: jest.fn().mockReturnValue({ file: mockFile })
        }
      };
      
      jest.spyOn(app.metadataCache, 'getFileCache').mockReturnValue({
        frontmatter: {
          'exo__Instance_class': '[[ems__Task]]',
          'exo__Asset_label': 'Test Task'
        }
      });
      jest.spyOn(plugin, 'findLayoutForClass').mockResolvedValue(null);
      
      await plugin.renderUniversalLayout(mockDv, mockCtx);
      
      expect(mockDv.header).toHaveBeenCalledWith(2, 'Properties');
      expect(mockDv.table).toHaveBeenCalled();
    });
  });
});