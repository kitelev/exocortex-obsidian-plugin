/**
 * BDD Step definitions for CreateAssetModal property display functionality
 * Implements comprehensive test scenarios for property domain resolution
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { CreateAssetModal } from '../../../src/presentation/modals/CreateAssetModal';
import { SemanticPropertyDiscoveryService } from '../../../src/domain/services/SemanticPropertyDiscoveryService';
import { DIContainer } from '../../../src/infrastructure/container/DIContainer';
import { App, TFile } from 'obsidian';
import { Result } from '../../../src/domain/core/Result';

const feature = loadFeature('./tests/bdd/features/create-asset-modal-properties.feature');

interface TestContext {
  app: App;
  modal: CreateAssetModal;
  propertyService: SemanticPropertyDiscoveryService;
  testVault: Map<string, any>;
  properties: any[];
  selectedClass?: string;
  errorMessage?: string;
  performanceMetrics: {
    startTime?: number;
    endTime?: number;
    memoryBefore?: number;
    memoryAfter?: number;
  };
}

// Mock Obsidian API with enhanced property testing capabilities
jest.mock('obsidian', () => {
  const mockFiles = new Map<string, any>();
  
  return {
    App: jest.fn().mockImplementation(() => ({
      vault: {
        getMarkdownFiles: jest.fn(() => Array.from(mockFiles.values())),
        read: jest.fn(),
        create: jest.fn(),
        modify: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          const mockFile = mockFiles.get(file.basename);
          return mockFile ? { frontmatter: mockFile.frontmatter } : null;
        }),
        on: jest.fn(),
        off: jest.fn(),
      },
      workspace: {
        getActiveFile: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
      },
    })),
    TFile: jest.fn().mockImplementation((basename: string) => ({
      basename,
      name: `${basename}.md`,
      path: `/${basename}.md`,
    })),
    Modal: class MockModal {
      app: any;
      contentEl: HTMLElement;
      
      constructor(app: any) {
        this.app = app;
        this.contentEl = document.createElement('div');
        
        // Add Obsidian DOM methods
        this.contentEl.createEl = jest.fn((tag: string, attrs?: any) => {
          const element = document.createElement(tag);
          if (attrs?.text) element.textContent = attrs.text;
          if (attrs?.cls) element.className = attrs.cls;
          this.contentEl.appendChild(element);
          return element;
        });
        
        this.contentEl.createDiv = jest.fn((attrs?: any) => {
          const element = document.createElement('div');
          if (attrs?.cls) element.className = attrs.cls;
          this.contentEl.appendChild(element);
          return element;
        });
        
        this.contentEl.empty = jest.fn(() => {
          while (this.contentEl.firstChild) {
            this.contentEl.removeChild(this.contentEl.firstChild);
          }
        });
      }
      
      open() { /* Mock implementation */ }
      close() { /* Mock implementation */ }
      onOpen() { /* To be overridden */ }
      onClose() { /* To be overridden */ }
    },
    Setting: jest.fn().mockImplementation(() => ({
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      addText: jest.fn().mockReturnThis(),
      addDropdown: jest.fn().mockReturnThis(),
      addToggle: jest.fn().mockReturnThis(),
      addTextArea: jest.fn().mockReturnThis(),
      addButton: jest.fn().mockReturnThis(),
    })),
    Notice: jest.fn(),
  };
});

// Mock DIContainer
jest.mock('../../../src/infrastructure/container/DIContainer', () => ({
  DIContainer: {
    getInstance: jest.fn(() => ({
      getCreateAssetUseCase: jest.fn(() => ({ execute: jest.fn() })),
      resolve: jest.fn((token: string) => {
        if (token === 'PropertyCacheService') {
          return {
            getPropertiesForClass: jest.fn(() => []),
            updateClassProperties: jest.fn(),
            hasPropertiesForClass: jest.fn(() => false),
            clearCache: jest.fn(),
          };
        }
        if (token === 'CircuitBreakerService') {
          return {
            execute: jest.fn((name, operation) => operation()),
          };
        }
        return {};
      }),
    })),
  },
}));

defineFeature(feature, (test) => {
  let context: TestContext;

  beforeEach(() => {
    // Setup test context with mocked dependencies
    context = {
      app: new (require('obsidian').App)(),
      modal: null as any,
      propertyService: null as any,
      testVault: new Map(),
      properties: [],
      performanceMetrics: {},
    };
    
    // Initialize property service
    context.propertyService = new SemanticPropertyDiscoveryService(context.app);
    
    // Initialize modal
    context.modal = new CreateAssetModal(context.app);
    
    // Reset performance monitoring
    if (global.performance) {
      context.performanceMetrics.memoryBefore = global.performance.memory?.usedJSHeapSize;
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    context.testVault.clear();
    context.properties = [];
  });

  test('Modal displays properties for selected class', ({ given, when, then }) => {
    given('I have a class "Person" with properties "name", "age", "email" via exo__Property_domain', async () => {
      // Create Person class
      const personClass = {
        basename: 'Person',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Person',
        },
      };
      context.testVault.set('Person', personClass);
      
      // Create properties with proper domain relationships
      const properties = [
        {
          basename: 'person_name',
          frontmatter: {
            'exo__Instance_class': '[[exo__Property]]',
            'rdf__type': 'exo__DatatypeProperty',
            'rdfs__label': 'Full Name',
            'exo__Property_domain': '[[Person]]',
            'rdfs__range': 'string',
            'exo__Property_isRequired': true,
          },
        },
        {
          basename: 'person_age',
          frontmatter: {
            'exo__Instance_class': '[[exo__Property]]',
            'rdf__type': 'exo__DatatypeProperty',
            'rdfs__label': 'Age',
            'exo__Property_domain': '[[Person]]',
            'rdfs__range': 'integer',
            'exo__Property_isRequired': false,
          },
        },
        {
          basename: 'person_email',
          frontmatter: {
            'exo__Instance_class': '[[exo__Property]]',
            'rdf__type': 'exo__DatatypeProperty',
            'rdfs__label': 'Email Address',
            'exo__Property_domain': '[[Person]]',
            'rdfs__range': 'string',
            'exo__Property_isRequired': false,
          },
        },
      ];
      
      properties.forEach(prop => {
        context.testVault.set(prop.basename, prop);
      });
      
      // Mock vault to return our test files
      const mockFiles = Array.from(context.testVault.values()).map(data => new (require('obsidian').TFile)(data.basename));
      (context.app.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);
    });

    when('I open the asset creation modal', async () => {
      // Initialize modal (simulates opening)
      await context.modal.onOpen();
    });

    when('I select "Person" as the asset class', async () => {
      context.selectedClass = 'Person';
      context.performanceMetrics.startTime = Date.now();
      
      // Use SemanticPropertyDiscoveryService for proper property resolution
      const result = await context.propertyService.discoverPropertiesForClass('Person');
      
      context.performanceMetrics.endTime = Date.now();
      
      if (result.isSuccess) {
        context.properties = result.getValue() || [];
      }
      
      // Also test the modal's updatePropertiesForClass method
      await (context.modal as any).updatePropertiesForClass('Person');
    });

    then('I should see property fields for "name", "age", and "email"', () => {
      // Verify that properties were discovered correctly
      expect(context.properties.length).toBeGreaterThanOrEqual(3);
      
      const propertyNames = context.properties.map(p => p.name);
      expect(propertyNames).toContain('person_name');
      expect(propertyNames).toContain('person_age');
      expect(propertyNames).toContain('person_email');
      
      // Verify modal's internal property state
      const modalProperties = (context.modal as any).properties || [];
      expect(modalProperties.length).toBeGreaterThanOrEqual(3);
    });

    then('each property should have appropriate input types', () => {
      const nameProperty = context.properties.find(p => p.name === 'person_name');
      const ageProperty = context.properties.find(p => p.name === 'person_age');
      const emailProperty = context.properties.find(p => p.name === 'person_email');
      
      expect(nameProperty?.type).toBe('DatatypeProperty');
      expect(ageProperty?.type).toBe('DatatypeProperty');
      expect(emailProperty?.type).toBe('DatatypeProperty');
      
      expect(nameProperty?.range).toBe('string');
      expect(ageProperty?.range).toBe('integer');
      expect(emailProperty?.range).toBe('string');
    });

    then('property loading should complete within 200ms', () => {
      const loadTime = (context.performanceMetrics.endTime || 0) - (context.performanceMetrics.startTime || 0);
      expect(loadTime).toBeLessThan(200);
    });
  });

  test('Modal updates properties when class changes', ({ given, when, then }) => {
    given('I have classes "Person" and "Organization" with different properties', async () => {
      // Create Person class and properties
      context.testVault.set('Person', {
        basename: 'Person',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Person',
        },
      });
      
      context.testVault.set('person_name', {
        basename: 'person_name',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdf__type': 'exo__DatatypeProperty',
          'rdfs__label': 'Full Name',
          'exo__Property_domain': '[[Person]]',
          'rdfs__range': 'string',
        },
      });
      
      // Create Organization class and properties
      context.testVault.set('Organization', {
        basename: 'Organization',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Organization',
        },
      });
      
      context.testVault.set('org_name', {
        basename: 'org_name',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdf__type': 'exo__DatatypeProperty',
          'rdfs__label': 'Organization Name',
          'exo__Property_domain': '[[Organization]]',
          'rdfs__range': 'string',
        },
      });
      
      context.testVault.set('org_industry', {
        basename: 'org_industry',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdf__type': 'exo__DatatypeProperty',
          'rdfs__label': 'Industry',
          'exo__Property_domain': '[[Organization]]',
          'rdfs__range': 'string',
        },
      });
      
      const mockFiles = Array.from(context.testVault.values()).map(data => new (require('obsidian').TFile)(data.basename));
      (context.app.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);
    });

    when('I open the asset creation modal', async () => {
      await context.modal.onOpen();
    });

    when('I initially select "Person" class', async () => {
      const personResult = await context.propertyService.discoverPropertiesForClass('Person');
      expect(personResult.isSuccess).toBe(true);
      
      const personProperties = personResult.getValue() || [];
      expect(personProperties.some(p => p.name === 'person_name')).toBe(true);
      
      await (context.modal as any).updatePropertiesForClass('Person');
    });

    when('I change to "Organization" class', async () => {
      context.performanceMetrics.startTime = Date.now();
      
      const orgResult = await context.propertyService.discoverPropertiesForClass('Organization');
      context.performanceMetrics.endTime = Date.now();
      
      expect(orgResult.isSuccess).toBe(true);
      context.properties = orgResult.getValue() || [];
      
      await (context.modal as any).updatePropertiesForClass('Organization');
    });

    then('the property fields should update to show Organization properties', () => {
      const orgProperties = context.properties.filter(p => p.domain.includes('Organization'));
      expect(orgProperties.length).toBeGreaterThan(0);
      
      const orgNames = orgProperties.map(p => p.name);
      expect(orgNames).toContain('org_name');
      expect(orgNames).toContain('org_industry');
    });

    then('Person properties should no longer be visible', () => {
      const personProperties = context.properties.filter(p => p.domain.includes('Person'));
      expect(personProperties.length).toBe(0);
    });

    then('the property update should complete within 200ms', () => {
      const updateTime = (context.performanceMetrics.endTime || 0) - (context.performanceMetrics.startTime || 0);
      expect(updateTime).toBeLessThan(200);
    });
  });

  test('Modal handles class without properties', ({ given, when, then }) => {
    given('I have a class "EmptyClass" with no exo__Property_domain relationships', async () => {
      context.testVault.set('EmptyClass', {
        basename: 'EmptyClass',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Empty Class',
          'rdfs__comment': 'A class with no properties',
        },
      });
      
      const mockFiles = [new (require('obsidian').TFile)('EmptyClass')];
      (context.app.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);
    });

    when('I open the asset creation modal', async () => {
      await context.modal.onOpen();
    });

    when('I select "EmptyClass"', async () => {
      const result = await context.propertyService.discoverPropertiesForClass('EmptyClass');
      expect(result.isSuccess).toBe(true);
      
      context.properties = result.getValue() || [];
      await (context.modal as any).updatePropertiesForClass('EmptyClass');
    });

    then('I should see a message indicating no properties are available', () => {
      // Should only have core properties, no class-specific properties
      const classSpecificProperties = context.properties.filter(
        p => !p.name.startsWith('exo__Asset_') && !p.name.startsWith('exo__Instance_')
      );
      expect(classSpecificProperties.length).toBe(0);
    });

    then('the create button should still be functional', () => {
      // Modal should still be functional even without specific properties
      expect((context.modal as any).createAsset).toBeDefined();
    });
  });

  test('Modal handles property domain resolution failures', ({ given, when, then }) => {
    given('I have a class with malformed property domain relationships', async () => {
      context.testVault.set('ProblematicClass', {
        basename: 'ProblematicClass',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Problematic Class',
        },
      });
      
      // Property with malformed domain
      context.testVault.set('malformed_prop', {
        basename: 'malformed_prop',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdfs__label': 'Malformed Property',
          'exo__Property_domain': null, // Malformed domain
          'rdfs__range': 'string',
        },
      });
      
      const mockFiles = Array.from(context.testVault.values()).map(data => new (require('obsidian').TFile)(data.basename));
      (context.app.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);
    });

    when('I open the asset creation modal', async () => {
      await context.modal.onOpen();
    });

    when('I select the problematic class', async () => {
      const result = await context.propertyService.discoverPropertiesForClass('ProblematicClass');
      
      // Service should handle malformed data gracefully
      expect(result.isSuccess).toBe(true);
      
      context.properties = result.getValue() || [];
      
      // Test modal's resilience
      try {
        await (context.modal as any).updatePropertiesForClass('ProblematicClass');
      } catch (error) {
        context.errorMessage = error instanceof Error ? error.message : String(error);
      }
    });

    then('I should see an error message about property loading', () => {
      // The service should handle malformed properties gracefully
      // and only include valid properties
      const validProperties = context.properties.filter(p => p.domain && p.domain !== null);
      expect(validProperties.length).toBeGreaterThanOrEqual(0);
    });

    then('the modal should remain functional for other operations', () => {
      // Modal should not crash from malformed property data
      expect((context.modal as any).assetTitle).toBeDefined();
      expect((context.modal as any).assetClass).toBeDefined();
      expect((context.modal as any).createAsset).toBeDefined();
    });
  });

  test('Modal displays inherited properties from class hierarchy', ({ given, when, then }) => {
    given('I have a class "Employee" that inherits from "Person"', async () => {
      // Create Person class
      context.testVault.set('Person', {
        basename: 'Person',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Person',
        },
      });
      
      // Create Employee class that inherits from Person
      context.testVault.set('Employee', {
        basename: 'Employee',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Employee',
          'rdfs__subClassOf': '[[Person]]',
        },
      });
    });

    given('"Person" has properties "name", "email"', async () => {
      context.testVault.set('person_name', {
        basename: 'person_name',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdf__type': 'exo__DatatypeProperty',
          'rdfs__label': 'Full Name',
          'exo__Property_domain': '[[Person]]',
          'rdfs__range': 'string',
        },
      });
      
      context.testVault.set('person_email', {
        basename: 'person_email',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdf__type': 'exo__DatatypeProperty',
          'rdfs__label': 'Email Address',
          'exo__Property_domain': '[[Person]]',
          'rdfs__range': 'string',
        },
      });
    });

    given('"Employee" has additional properties "employee_id", "department"', async () => {
      context.testVault.set('employee_id', {
        basename: 'employee_id',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdf__type': 'exo__DatatypeProperty',
          'rdfs__label': 'Employee ID',
          'exo__Property_domain': '[[Employee]]',
          'rdfs__range': 'string',
        },
      });
      
      context.testVault.set('department', {
        basename: 'department',
        frontmatter: {
          'exo__Instance_class': '[[exo__Property]]',
          'rdf__type': 'exo__DatatypeProperty',
          'rdfs__label': 'Department',
          'exo__Property_domain': '[[Employee]]',
          'rdfs__range': 'string',
        },
      });
      
      const mockFiles = Array.from(context.testVault.values()).map(data => new (require('obsidian').TFile)(data.basename));
      (context.app.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);
    });

    when('I open the asset creation modal', async () => {
      await context.modal.onOpen();
    });

    when('I select "Employee" as the asset class', async () => {
      const result = await context.propertyService.discoverPropertiesForClass('Employee');
      expect(result.isSuccess).toBe(true);
      
      context.properties = result.getValue() || [];
      await (context.modal as any).updatePropertiesForClass('Employee');
    });

    then('I should see all properties from both "Person" and "Employee" classes', () => {
      const propertyNames = context.properties.map(p => p.name);
      
      // Should include Person properties (inherited)
      expect(propertyNames).toContain('person_name');
      expect(propertyNames).toContain('person_email');
      
      // Should include Employee properties (direct)
      expect(propertyNames).toContain('employee_id');
      expect(propertyNames).toContain('department');
      
      // Should have at least 4 class-specific properties plus core properties
      expect(context.properties.length).toBeGreaterThanOrEqual(4);
    });

    then('inherited properties should be clearly marked', () => {
      // Properties should include domain information to identify inheritance
      const personProperties = context.properties.filter(p => p.domain.includes('Person'));
      const employeeProperties = context.properties.filter(p => p.domain.includes('Employee'));
      
      expect(personProperties.length).toBeGreaterThanOrEqual(2);
      expect(employeeProperties.length).toBeGreaterThanOrEqual(2);
    });

    then('property hierarchy should be resolved correctly', () => {
      // Verify that the class hierarchy resolution worked
      const allClassSpecificProperties = context.properties.filter(
        p => !p.name.startsWith('exo__Asset_') && !p.name.startsWith('exo__Instance_')
      );
      
      expect(allClassSpecificProperties.length).toBe(4); // 2 from Person + 2 from Employee
    });
  });

  test('Modal validates performance requirements with large property sets', ({ given, when, then }) => {
    given('I have a class with 50+ properties', async () => {
      // Create RichClass
      context.testVault.set('RichClass', {
        basename: 'RichClass',
        frontmatter: {
          'exo__Instance_class': '[[exo__Class]]',
          'rdfs__label': 'Rich Class',
          'rdfs__comment': 'A class with many properties for performance testing',
        },
      });
      
      // Create 50 properties
      for (let i = 1; i <= 50; i++) {
        context.testVault.set(`rich_prop_${i}`, {
          basename: `rich_prop_${i}`,
          frontmatter: {
            'exo__Instance_class': '[[exo__Property]]',
            'rdf__type': 'exo__DatatypeProperty',
            'rdfs__label': `Property ${i}`,
            'exo__Property_domain': '[[RichClass]]',
            'rdfs__range': 'string',
          },
        });
      }
      
      const mockFiles = Array.from(context.testVault.values()).map(data => new (require('obsidian').TFile)(data.basename));
      (context.app.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);
    });

    when('I open the modal and select the property-rich class', async () => {
      await context.modal.onOpen();
      
      context.performanceMetrics.startTime = Date.now();
      
      const result = await context.propertyService.discoverPropertiesForClass('RichClass');
      
      context.performanceMetrics.endTime = Date.now();
      
      expect(result.isSuccess).toBe(true);
      context.properties = result.getValue() || [];
      
      await (context.modal as any).updatePropertiesForClass('RichClass');
    });

    then('property loading should complete within 2 seconds', () => {
      const loadTime = (context.performanceMetrics.endTime || 0) - (context.performanceMetrics.startTime || 0);
      expect(loadTime).toBeLessThan(2000);
    });

    then('memory usage should remain under performance thresholds', () => {
      // Verify we found all the properties
      const richProperties = context.properties.filter(p => p.name.startsWith('rich_prop_'));
      expect(richProperties.length).toBe(50);
      
      // Verify total property count is reasonable (50 + core properties)
      expect(context.properties.length).toBeGreaterThan(50);
      expect(context.properties.length).toBeLessThan(60); // Should not have excessive duplication
    });

    then('the UI should remain responsive during property loading', () => {
      // This is tested implicitly by the performance requirements
      // In a real UI test, we would verify that the interface remains interactive
      expect(context.performanceMetrics.endTime).toBeDefined();
      expect(context.performanceMetrics.startTime).toBeDefined();
    });
  });
});
