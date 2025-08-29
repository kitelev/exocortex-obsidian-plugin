#!/usr/bin/env ts-node

/**
 * Headless test runner for CreateAssetModal
 * This simulates the modal behavior without needing actual Obsidian
 */

import { CreateAssetModal } from '../../src/presentation/modals/CreateAssetModal';
import { SemanticPropertyDiscoveryService } from '../../src/domain/services/SemanticPropertyDiscoveryService';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';
import { App, Plugin, TFile } from 'obsidian';

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}🧪 Running Headless CreateAssetModal Test${RESET}`);
console.log('=' .repeat(50));

// Mock Obsidian environment
const mockFiles: TFile[] = [
  // Classes
  { basename: 'ems__Effort', name: 'ems__Effort.md', path: 'ems__Effort.md', extension: 'md' } as TFile,
  { basename: 'exo__Asset', name: 'exo__Asset.md', path: 'exo__Asset.md', extension: 'md' } as TFile,
  { basename: 'exo__Person', name: 'exo__Person.md', path: 'exo__Person.md', extension: 'md' } as TFile,
  
  // Core properties that should be filtered
  { basename: 'exo__Asset_uid', name: 'exo__Asset_uid.md', path: 'exo__Asset_uid.md', extension: 'md' } as TFile,
  { basename: 'exo__Asset_isDefinedBy', name: 'exo__Asset_isDefinedBy.md', path: 'exo__Asset_isDefinedBy.md', extension: 'md' } as TFile,
  { basename: 'exo__Instance_class', name: 'exo__Instance_class.md', path: 'exo__Instance_class.md', extension: 'md' } as TFile,
  
  // User properties for Effort
  { basename: 'ems__title', name: 'ems__title.md', path: 'ems__title.md', extension: 'md' } as TFile,
  { basename: 'ems__status', name: 'ems__status.md', path: 'ems__status.md', extension: 'md' } as TFile,
  { basename: 'ems__description', name: 'ems__description.md', path: 'ems__description.md', extension: 'md' } as TFile,
];

// Mock metadata
const mockMetadata: { [key: string]: any } = {
  'ems__Effort': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Class]]',
      'rdfs__label': 'Effort'
    }
  },
  'exo__Asset': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Class]]',
      'rdfs__label': 'Asset'
    }
  },
  'exo__Asset_uid': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Property]]',
      'rdfs__domain': '[[exo__Asset]]',
      'rdfs__label': 'Unique ID',
      'rdfs__range': 'string',
      'exo__Property_isRequired': true
    }
  },
  'exo__Asset_isDefinedBy': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Property]]',
      'rdfs__domain': '[[exo__Asset]]',
      'rdfs__label': 'Defined By',
      'rdfs__range': '[[exo__Ontology]]',
      'exo__Property_isRequired': true
    }
  },
  'exo__Instance_class': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Property]]',
      'rdfs__domain': '[[exo__Asset]]',
      'rdfs__label': 'Instance Class',
      'rdfs__range': '[[exo__Class]]',
      'exo__Property_isRequired': true
    }
  },
  'ems__title': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Property]]',
      'rdfs__domain': '[[ems__Effort]]',
      'rdfs__label': 'Title',
      'rdfs__range': 'string',
      'exo__Property_isRequired': true
    }
  },
  'ems__status': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Property]]',
      'rdfs__domain': '[[ems__Effort]]',
      'rdfs__label': 'Status',
      'rdfs__range': 'string',
      'exo__Property_options': ['Not Started', 'In Progress', 'Complete']
    }
  },
  'ems__description': {
    frontmatter: {
      'exo__Instance_class': '[[exo__Property]]',
      'rdfs__domain': '[[ems__Effort]]',
      'rdfs__label': 'Description',
      'rdfs__range': 'text'
    }
  }
};

// Create mock app
const mockApp = {
  vault: {
    getMarkdownFiles: () => mockFiles,
    getAbstractFileByPath: (path: string) => mockFiles.find(f => f.path === path) || null
  },
  metadataCache: {
    getFileCache: (file: TFile) => {
      return { frontmatter: mockMetadata[file.basename] || {} };
    }
  }
} as any as App;

// Initialize container with mock plugin
class MockPlugin extends Plugin {
  constructor(app: App, manifest: any) {
    super(app, manifest);
  }
}

const plugin = new MockPlugin(mockApp, { id: 'test', name: 'Test', version: '1.0.0' } as any);
DIContainer.initialize(mockApp, plugin);

// Run tests
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  console.log('\n📋 Test 1: Property Discovery for ems__Effort');
  console.log('-'.repeat(50));
  
  try {
    const propertyService = new SemanticPropertyDiscoveryService(mockApp);
    const result = await propertyService.discoverPropertiesForClass('ems__Effort');
    
    if (result.isSuccess) {
      const properties = result.getValue() || [];
      console.log(`Found ${properties.length} properties`);
      
      // Check for core properties
      const coreProps = properties.filter(p => 
        p.name === 'exo__Asset_uid' || 
        p.name === 'exo__Asset_isDefinedBy' || 
        p.name === 'exo__Instance_class'
      );
      
      if (coreProps.length > 0) {
        console.log(`${RED}❌ FAIL: Found ${coreProps.length} core properties that should be filtered:${RESET}`);
        coreProps.forEach(p => {
          console.log(`   - ${p.label} (${p.name})`);
          results.errors.push(`Core property "${p.label}" should not be discovered`);
        });
        results.failed++;
      } else {
        console.log(`${GREEN}✅ PASS: No core properties in discovered list${RESET}`);
        results.passed++;
      }
      
      // Check for expected properties
      const expectedProps = ['ems__title', 'ems__status', 'ems__description'];
      const foundProps = properties.map(p => p.name);
      const hasExpected = expectedProps.every(ep => foundProps.includes(ep));
      
      if (hasExpected) {
        console.log(`${GREEN}✅ PASS: All expected properties found${RESET}`);
        results.passed++;
      } else {
        console.log(`${RED}❌ FAIL: Missing expected properties${RESET}`);
        results.failed++;
      }
    } else {
      console.log(`${RED}❌ FAIL: Property discovery failed: ${result.getError()}${RESET}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`${RED}❌ ERROR: ${error}${RESET}`);
    results.failed++;
  }

  console.log('\n📋 Test 2: CreateAssetModal Property Filtering');
  console.log('-'.repeat(50));
  
  try {
    // Create mock container element
    const containerEl = {
      empty: function() { 
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }
      },
      createEl: function(tag: string, attrs?: any) {
        const el = { tagName: tag, ...attrs };
        return el;
      },
      createDiv: function(attrs?: any) {
        return this.createEl('div', attrs);
      },
      innerHTML: '',
      firstChild: null,
      removeChild: function() {}
    } as any;
    
    const modal = new CreateAssetModal(mockApp);
    modal['propertiesContainer'] = containerEl;
    
    // Update properties for Effort
    await modal['updatePropertiesForClass']('ems__Effort');
    
    const modalProperties = modal['properties'];
    console.log(`Modal has ${modalProperties.length} properties`);
    
    // Check for core properties
    const hasCoreProps = modalProperties.some((p: any) => 
      p.label === 'Unique ID' || 
      p.label === 'Defined By' || 
      p.label === 'Instance Class'
    );
    
    if (hasCoreProps) {
      console.log(`${RED}❌ FAIL: Core properties found in modal properties${RESET}`);
      modalProperties.forEach((p: any) => {
        if (['Unique ID', 'Defined By', 'Instance Class'].includes(p.label)) {
          console.log(`   - ${p.label}`);
          results.errors.push(`Core property "${p.label}" in modal`);
        }
      });
      results.failed++;
    } else {
      console.log(`${GREEN}✅ PASS: No core properties in modal${RESET}`);
      results.passed++;
    }
    
    // Check property count
    if (modalProperties.length === 3) { // Should have title, status, description
      console.log(`${GREEN}✅ PASS: Correct number of properties (3)${RESET}`);
      results.passed++;
    } else {
      console.log(`${RED}❌ FAIL: Expected 3 properties, got ${modalProperties.length}${RESET}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`${RED}❌ ERROR: ${error}${RESET}`);
    results.failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`${GREEN}Passed: ${results.passed}${RESET}`);
  console.log(`${RED}Failed: ${results.failed}${RESET}`);
  
  if (results.errors.length > 0) {
    console.log(`\n${YELLOW}Issues found:${RESET}`);
    results.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  const exitCode = results.failed > 0 ? 1 : 0;
  console.log(`\nExit code: ${exitCode}`);
  process.exit(exitCode);
}

// Run the tests
runTests().catch(error => {
  console.error(`${RED}Fatal error: ${error}${RESET}`);
  process.exit(1);
});