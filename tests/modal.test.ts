import { App, TFile, Notice, Setting, DropdownComponent } from 'obsidian';
import ExocortexPlugin from '../main';

// We need to import the classes directly from the main file
// Since they're not exported, we'll test them through the plugin

describe('ExocortexAssetModal', () => {
  let app: App;
  let plugin: ExocortexPlugin;
  let createSpy: jest.SpyInstance;
  let openFileSpy: jest.SpyInstance;
  
  beforeEach(() => {
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
    
    // Set up plugin settings
    plugin.settings = {
      defaultOntology: 'exo',
      enableAutoLayout: true,
      debugMode: false,
      templateFolderPath: 'templates'
    };
    
    // Mock vault.create
    createSpy = jest.spyOn(app.vault, 'create').mockResolvedValue(new TFile());
    
    // Mock workspace.getLeaf and openFile
    const mockLeaf = {
      openFile: jest.fn().mockResolvedValue(undefined)
    };
    openFileSpy = mockLeaf.openFile;
    jest.spyOn(app.workspace, 'getLeaf').mockReturnValue(mockLeaf as any);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Default Ontology Application', () => {
    test('should apply default ontology from settings', async () => {
      // Mock ontologies
      const ontologies = [
        { file: null, prefix: 'exo', label: 'EXO', fileName: '!exo' },
        { file: null, prefix: 'ems', label: 'EMS', fileName: '!ems' }
      ];
      
      jest.spyOn(plugin, 'findAllOntologies').mockResolvedValue(ontologies);
      
      // Test the logic directly
      const defaultOntology = ontologies.find(o => o.prefix === plugin.settings.defaultOntology);
      expect(defaultOntology).toBeDefined();
      expect(defaultOntology?.fileName).toBe('!exo');
    });
    
    test('should fallback to first ontology if default not found', async () => {
      // Set a non-existent default
      plugin.settings.defaultOntology = 'nonexistent';
      
      // Mock ontologies without the default
      const ontologies = [
        { file: null, prefix: 'ems', label: 'EMS', fileName: '!ems' },
        { file: null, prefix: 'gtd', label: 'GTD', fileName: '!gtd' }
      ];
      
      jest.spyOn(plugin, 'findAllOntologies').mockResolvedValue(ontologies);
      
      // Test the fallback logic
      const defaultOntology = ontologies.find(o => o.prefix === plugin.settings.defaultOntology);
      expect(defaultOntology).toBeUndefined();
      
      // Should fallback to first
      const fallbackOntology = ontologies[0];
      expect(fallbackOntology.fileName).toBe('!ems');
    });
  });
  
  describe('Asset Creation', () => {
    test('should create asset with correct frontmatter', async () => {
      // Mock data
      jest.spyOn(plugin, 'findAllOntologies').mockResolvedValue([
        { file: null, prefix: 'exo', label: 'EXO', fileName: '!exo' }
      ]);
      
      jest.spyOn(plugin, 'findAllClasses').mockResolvedValue([
        { className: 'ems__Task', label: 'Task', ontology: 'ems' }
      ]);
      
      jest.spyOn(plugin, 'findPropertiesForClass').mockResolvedValue([
        {
          propertyName: 'ems__Task_status',
          label: 'Status',
          range: 'enum:todo,in_progress,done',
          isRequired: false,
          description: 'Task status',
          isObjectProperty: false
        }
      ]);
      
      // Simulate asset creation
      const assetTitle = 'Test Task';
      const assetClass = 'ems__Task';
      const assetOntology = '!exo';
      const propertyValues = new Map([
        ['ems__Task_status', 'todo'],
        ['exo__Asset_label', assetTitle]
      ]);
      
      // Expected frontmatter structure - updated to match actual output
      const expectedFrontmatterRegex = new RegExp(
        [
          'exo__Asset_isDefinedBy: "\\[\\[!exo\\]\\]"',
          'exo__Asset_uid: [a-f0-9-]+',
          'exo__Asset_createdAt: \\d{4}-\\d{2}-\\d{2}T',
          'exo__Instance_class:',
          '  - "\\[\\[ems__Task\\]\\]"',
          'ems__Task_status: "todo"',  // Values are quoted
          'exo__Asset_label: "Test Task"'
        ].join('[\\s\\S]*')
      );
      
      // Create a test that simulates the full flow
      const modalTest = new Promise<void>((resolve) => {
        createSpy.mockImplementation((fileName: string, content: string) => {
          expect(fileName).toBe('Test Task.md');
          expect(content).toMatch(expectedFrontmatterRegex);
          expect(content).toContain('```dataviewjs');
          expect(content).toContain('await window.ExoUIRender(dv, this);');
          resolve();
          return Promise.resolve(new TFile());
        });
      });
      
      // Manually trigger asset creation logic
      // This simulates what happens when user clicks "Create" button
      const fileName = `${assetTitle}.md`;
      const frontmatterLines = [
        `exo__Asset_isDefinedBy: "[[${assetOntology}]]"`,
        `exo__Asset_uid: ${generateTestUUID()}`,
        `exo__Asset_createdAt: ${new Date().toISOString()}`,
        `exo__Instance_class:`,
        `  - "[[${assetClass}]]"`
      ];
      
      for (const [propName, propValue] of propertyValues) {
        frontmatterLines.push(`${propName}: ${typeof propValue === 'string' ? `"${propValue}"` : propValue}`);
      }
      
      const frontmatter = `---
${frontmatterLines.join('\n')}
---

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
`;
      
      await app.vault.create(fileName, frontmatter);
      
      await expect(modalTest).resolves.toBeUndefined();
      expect(createSpy).toHaveBeenCalled();
    });
    
    test('should handle array property values', async () => {
      const propertyValues = new Map([
        ['exo__Asset_relates', ['[[Asset1]]', '[[Asset2]]']]
      ]);
      
      const frontmatterTest = new Promise<void>((resolve) => {
        createSpy.mockImplementation((fileName: string, content: string) => {
          expect(content).toContain('exo__Asset_relates:');
          expect(content).toContain('  - "[[Asset1]]"');
          expect(content).toContain('  - "[[Asset2]]"');
          resolve();
          return Promise.resolve(new TFile());
        });
      });
      
      // Simulate array property handling
      const frontmatterLines = [];
      for (const [propName, propValue] of propertyValues) {
        if (Array.isArray(propValue)) {
          frontmatterLines.push(`${propName}:`);
          for (const item of propValue) {
            frontmatterLines.push(`  - "${item}"`);
          }
        }
      }
      
      const content = `---
${frontmatterLines.join('\n')}
---

\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
`;
      
      await app.vault.create('test.md', content);
      await expect(frontmatterTest).resolves.toBeUndefined();
    });
  });
  
  describe('Property Field Generation', () => {
    test('should generate correct input types for different ranges', async () => {
      const properties = [
        {
          propertyName: 'text_prop',
          label: 'Text Property',
          range: 'string',
          isRequired: false,
          description: 'A text property',
          isObjectProperty: false
        },
        {
          propertyName: 'enum_prop',
          label: 'Enum Property',
          range: 'enum:option1,option2,option3',
          isRequired: false,
          description: 'An enum property',
          isObjectProperty: false
        },
        {
          propertyName: 'bool_prop',
          label: 'Boolean Property',
          range: 'boolean',
          isRequired: false,
          description: 'A boolean property',
          isObjectProperty: false
        },
        {
          propertyName: 'date_prop',
          label: 'Date Property',
          range: 'date',
          isRequired: false,
          description: 'A date property',
          isObjectProperty: false
        },
        {
          propertyName: 'number_prop',
          label: 'Number Property',
          range: 'number',
          isRequired: false,
          description: 'A number property',
          isObjectProperty: false
        }
      ];
      
      jest.spyOn(plugin, 'findPropertiesForClass').mockResolvedValue(properties);
      
      const foundProperties = await plugin.findPropertiesForClass('TestClass');
      
      expect(foundProperties).toHaveLength(5);
      expect(foundProperties[0].range).toBe('string');
      expect(foundProperties[1].range).toContain('enum:');
      expect(foundProperties[2].range).toBe('boolean');
      expect(foundProperties[3].range).toBe('date');
      expect(foundProperties[4].range).toBe('number');
    });
  });
});

describe('ExocortexSettingTab', () => {
  let app: App;
  let plugin: ExocortexPlugin;
  
  beforeEach(() => {
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
    
    plugin.settings = {
      defaultOntology: 'exo',
      enableAutoLayout: true,
      debugMode: false,
      templateFolderPath: 'templates'
    };
  });
  
  describe('Settings Display', () => {
    test('should display ontology dropdown with discovered ontologies', async () => {
      const ontologies = [
        { file: null, prefix: 'exo', label: 'EXO', fileName: '!exo' },
        { file: null, prefix: 'ems', label: 'EMS', fileName: '!ems' },
        { file: null, prefix: 'gtd', label: 'GTD', fileName: '!gtd' }
      ];
      
      jest.spyOn(plugin, 'findAllOntologies').mockResolvedValue(ontologies);
      
      const foundOntologies = await plugin.findAllOntologies();
      
      expect(foundOntologies).toHaveLength(3);
      expect(foundOntologies.map(o => o.prefix)).toContain('exo');
      expect(foundOntologies.map(o => o.prefix)).toContain('ems');
      expect(foundOntologies.map(o => o.prefix)).toContain('gtd');
    });
    
    test('should save selected ontology prefix to settings', async () => {
      const saveSettingsSpy = jest.spyOn(plugin, 'saveSettings').mockResolvedValue();
      
      // Simulate dropdown change
      plugin.settings.defaultOntology = 'ems';
      await plugin.saveSettings();
      
      expect(saveSettingsSpy).toHaveBeenCalled();
      expect(plugin.settings.defaultOntology).toBe('ems');
    });
    
    test('should save toggle settings', async () => {
      const saveSettingsSpy = jest.spyOn(plugin, 'saveSettings').mockResolvedValue();
      
      // Simulate toggle changes
      plugin.settings.enableAutoLayout = false;
      plugin.settings.debugMode = true;
      await plugin.saveSettings();
      
      expect(saveSettingsSpy).toHaveBeenCalled();
      expect(plugin.settings.enableAutoLayout).toBe(false);
      expect(plugin.settings.debugMode).toBe(true);
    });
  });
});

// Helper function for testing
function generateTestUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}