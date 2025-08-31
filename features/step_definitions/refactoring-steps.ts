/**
 * BDD Step Definitions for Plugin Refactoring
 * 
 * This file contains step definitions that can be used with Jest and Cucumber
 * to execute the BDD scenarios for the plugin refactoring task.
 * 
 * Usage:
 * - Import these step definitions in your test files
 * - Use with @cucumber/cucumber or jest-cucumber
 * - Adapt the implementation details for your specific testing framework
 */

import { Given, When, Then, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { App, TFile, Plugin, MarkdownPostProcessorContext } from 'obsidian';
import { UniversalLayoutRenderer } from '../../src/presentation/renderers/UniversalLayoutRenderer';
import { DynamicLayoutRenderer } from '../../src/presentation/renderers/DynamicLayoutRenderer';
import { CreateAssetModal } from '../../src/presentation/modals/CreateAssetModal';
import { ExocortexPlugin } from '../../src/ExocortexPlugin';
import { DIContainer } from '../../src/infrastructure/container/DIContainer';
import fs from 'fs';
import path from 'path';

/**
 * Test Context Interface
 */
interface TestContext {
  app: App;
  plugin: ExocortexPlugin;
  testVault: any;
  currentFile: TFile | null;
  renderedElement: HTMLElement | null;
  modal: CreateAssetModal | null;
  errorMessages: string[];
  performanceMetrics: Map<string, number>;
}

let testContext: TestContext;

// =============================================================================
// BACKGROUND AND SETUP STEPS
// =============================================================================

BeforeAll(async function() {
  // Initialize test environment
  testContext = {
    app: null as any,
    plugin: null as any,
    testVault: null,
    currentFile: null,
    renderedElement: null,
    modal: null,
    errorMessages: [],
    performanceMetrics: new Map()
  };
});

AfterAll(async function() {
  // Cleanup test environment
  if (testContext.plugin) {
    await testContext.plugin.onunload();
  }
  testContext.errorMessages = [];
  testContext.performanceMetrics.clear();
});

Given('the Exocortex plugin is installed and activated', async function() {
  // Mock Obsidian App and initialize plugin
  testContext.app = createMockApp();
  testContext.plugin = new ExocortexPlugin(testContext.app, createMockManifest());
  await testContext.plugin.onload();
  
  expect(testContext.plugin).toBeDefined();
  expect(DIContainer.getInstance()).toBeDefined();
});

Given('I have access to test vault with sample ontology files', async function() {
  // Setup test vault with sample files
  testContext.testVault = createTestVault();
  await setupSampleOntologyFiles(testContext.testVault);
  
  expect(testContext.testVault).toBeDefined();
});

Given('the following components are preserved:', function(dataTable: any) {
  const components = dataTable.hashes();
  
  // Verify that preserved components exist in the codebase
  for (const component of components) {
    const filePath = path.join(__dirname, '..', '..', component.Location);
    expect(fs.existsSync(filePath)).toBe(true);
  }
});

Given('the refactored plugin is loaded', async function() {
  // Verify plugin is properly loaded after refactoring
  expect(testContext.plugin).toBeDefined();
  expect(testContext.plugin.app).toBeDefined();
});

// =============================================================================
// CORE FUNCTIONALITY PRESERVATION STEPS
// =============================================================================

Given('I have a note with exo__Instance_class {string}', async function(instanceClass: string) {
  testContext.currentFile = await createTestFile({
    basename: 'TestAsset',
    frontmatter: {
      exo__Instance_class: instanceClass,
      exo__Asset_uid: 'test-asset-123'
    }
  });
  
  expect(testContext.currentFile).toBeDefined();
});

Given('the note contains assets that reference it via various properties', async function() {
  // Create related assets that reference the current file
  await createTestFile({
    basename: 'RelatedAsset1',
    frontmatter: {
      exo__Instance_class: 'exo__Asset',
      exo__Asset_belongsTo: '[[TestAsset]]'
    }
  });
  
  await createTestFile({
    basename: 'RelatedAsset2', 
    frontmatter: {
      exo__Instance_class: 'exo__Asset',
      exo__Asset_createdBy: '[[TestAsset]]'
    }
  });
});

When('I add the following code block to the note:', async function(codeBlock: string) {
  const startTime = performance.now();
  
  // Create container element and render
  testContext.renderedElement = document.createElement('div');
  const renderer = new UniversalLayoutRenderer(DIContainer.getInstance().resolve('ServiceProvider'));
  
  const mockContext: MarkdownPostProcessorContext = {
    sourcePath: testContext.currentFile?.path || '',
    frontmatter: {},
    addChild: () => {},
    getSectionInfo: () => null
  };
  
  await renderer.render(codeBlock.trim(), testContext.renderedElement, mockContext);
  
  const endTime = performance.now();
  testContext.performanceMetrics.set('render_time', endTime - startTime);
});

Then('the UniversalLayout should render successfully', function() {
  expect(testContext.renderedElement).toBeDefined();
  expect(testContext.renderedElement?.children.length).toBeGreaterThan(0);
  expect(testContext.renderedElement?.querySelector('.exocortex-assets-relations')).toBeDefined();
});

Then('I should see assets grouped by their referencing properties', function() {
  const relationGroups = testContext.renderedElement?.querySelectorAll('.exocortex-relation-group');
  expect(relationGroups?.length).toBeGreaterThan(0);
  
  // Verify property-based grouping
  const headers = testContext.renderedElement?.querySelectorAll('.exocortex-relation-group-header');
  expect(headers?.length).toBeGreaterThan(0);
});

Then('the table should display {string} and {string} columns', function(col1: string, col2: string) {
  const table = testContext.renderedElement?.querySelector('table');
  expect(table).toBeDefined();
  
  const headers = Array.from(table?.querySelectorAll('th') || []).map(th => th.textContent?.trim());
  expect(headers).toContain(col1);
  expect(headers).toContain(col2);
});

Then('each asset should be clickable and navigate to the correct file', function() {
  const links = testContext.renderedElement?.querySelectorAll('a.internal-link');
  expect(links?.length).toBeGreaterThan(0);
  
  for (const link of Array.from(links || [])) {
    expect(link.getAttribute('href')).toBeDefined();
    expect(link.textContent?.trim()).toBeTruthy();
  }
});

Then('if the current file is a class, I should see a {string} button', function(buttonText: string) {
  // This step is conditional - only applies if current file is a class
  const cache = testContext.app.metadataCache.getFileCache(testContext.currentFile!);
  if (cache?.frontmatter?.exo__Instance_class === 'exo__Class') {
    const createButton = testContext.renderedElement?.querySelector('.exocortex-create-asset-button');
    expect(createButton).toBeDefined();
    expect(createButton?.textContent?.trim()).toContain(buttonText);
  }
});

// =============================================================================
// DYNAMIC LAYOUT STEPS
// =============================================================================

Given('I have a class definition file with exo__Instance_class {string}', async function(instanceClass: string) {
  testContext.currentFile = await createTestFile({
    basename: 'TestClass',
    frontmatter: {
      exo__Instance_class: instanceClass,
      rdfs__label: 'Test Class',
      exo__Class_createButtonLabel: 'Create Test Asset'
    }
  });
});

Given('I have a ClassLayout file configured for this class', async function() {
  await createTestFile({
    basename: 'ClassLayout - TestClass',
    frontmatter: {
      exo__Instance_class: 'ui__ClassLayout',
      ui__ClassLayout: 'TestClass',
      ui__ClassLayout_relationsToShow: ['exo__Asset_belongsTo', 'exo__Asset_createdBy']
    }
  });
});

Given('the ClassLayout specifies relationsToShow: {string}', function(relations: string) {
  // Relations already set up in previous step
  expect(relations).toContain('exo__Asset_belongsTo');
  expect(relations).toContain('exo__Asset_createdBy');
});

When('I add a DynamicLayout code block to an asset instance of this class', async function() {
  const instanceFile = await createTestFile({
    basename: 'TestInstance',
    frontmatter: {
      exo__Instance_class: 'TestClass'
    }
  });
  
  testContext.currentFile = instanceFile;
  testContext.renderedElement = document.createElement('div');
  
  const renderer = new DynamicLayoutRenderer(DIContainer.getInstance().resolve('ServiceProvider'));
  const mockContext: MarkdownPostProcessorContext = {
    sourcePath: instanceFile.path,
    frontmatter: {},
    addChild: () => {},
    getSectionInfo: () => null
  };
  
  await renderer.render('DynamicLayout', testContext.renderedElement, mockContext);
});

Then('the DynamicLayout should load the ClassLayout configuration', function() {
  expect(testContext.renderedElement?.children.length).toBeGreaterThan(0);
  // Verify that layout was loaded successfully
});

Then('only display relations for the specified properties', function() {
  const relationGroups = testContext.renderedElement?.querySelectorAll('.exocortex-relation-group h2');
  const groupNames = Array.from(relationGroups || []).map(h2 => h2.textContent?.trim());
  
  // Should only show configured relations
  expect(groupNames).toContain('exo__Asset_belongsTo');
  expect(groupNames).toContain('exo__Asset_createdBy');
});

// =============================================================================
// CREATE ASSET MODAL STEPS
// =============================================================================

Given('I open the CreateAssetModal', async function() {
  testContext.modal = new CreateAssetModal(testContext.app);
  await testContext.modal.onOpen();
  
  expect(testContext.modal).toBeDefined();
  expect(testContext.modal.contentEl.getAttribute('data-test')).toBe('create-asset-modal');
});

When('I select class {string} from the dropdown', function(className: string) {
  const dropdown = testContext.modal?.contentEl.querySelector('[data-test="asset-class-dropdown"]') as HTMLSelectElement;
  expect(dropdown).toBeDefined();
  
  dropdown.value = className;
  dropdown.dispatchEvent(new Event('change'));
});

Then('I should see the basic asset creation form', function() {
  expect(testContext.modal?.contentEl.querySelector('[data-test="asset-title-input"]')).toBeDefined();
  expect(testContext.modal?.contentEl.querySelector('[data-test="asset-class-dropdown"]')).toBeDefined();
  expect(testContext.modal?.contentEl.querySelector('[data-test="properties-container"]')).toBeDefined();
});

When('I change the class to {string}', async function(newClass: string) {
  const startTime = performance.now();
  
  const dropdown = testContext.modal?.contentEl.querySelector('[data-test="asset-class-dropdown"]') as HTMLSelectElement;
  dropdown.value = newClass;
  dropdown.dispatchEvent(new Event('change'));
  
  // Wait for properties to update
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const endTime = performance.now();
  testContext.performanceMetrics.set('class_switch_time', endTime - startTime);
});

Then('the properties should update within {int}ms', function(maxTime: number) {
  const switchTime = testContext.performanceMetrics.get('class_switch_time') || 0;
  expect(switchTime).toBeLessThan(maxTime);
});

// =============================================================================
// FUNCTIONALITY REMOVAL STEPS
// =============================================================================

When('I search for button command related code', function() {
  // Check for existence of button-related files
  const buttonFiles = [
    'src/application/use-cases/ExecuteButtonCommandUseCase.ts',
    'src/application/use-cases/RenderClassButtonsUseCase.ts',
    'src/domain/entities/ButtonCommand.ts',
    'src/domain/entities/UIButton.ts',
    'src/domain/repositories/IButtonRepository.ts',
    'src/infrastructure/repositories/ObsidianButtonRepository.ts',
    'src/presentation/components/ButtonRenderer.ts'
  ];
  
  // Store results for verification in Then steps
  testContext.performanceMetrics.set('button_files_found', 
    buttonFiles.filter(file => fs.existsSync(path.join(__dirname, '..', '..', file))).length
  );
});

Then('ExecuteButtonCommandUseCase should not exist in the codebase', function() {
  const filePath = path.join(__dirname, '..', '..', 'src/application/use-cases/ExecuteButtonCommandUseCase.ts');
  expect(fs.existsSync(filePath)).toBe(false);
});

Then('RenderClassButtonsUseCase should not exist in the codebase', function() {
  const filePath = path.join(__dirname, '..', '..', 'src/application/use-cases/RenderClassButtonsUseCase.ts');
  expect(fs.existsSync(filePath)).toBe(false);
});

// =============================================================================
// CLEAN ARCHITECTURE VALIDATION STEPS
// =============================================================================

When('I examine the domain layer dependencies', async function() {
  // Analyze domain layer files for external dependencies
  const domainFiles = await findFilesInDirectory('src/domain');
  
  for (const file of domainFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for forbidden imports
    const hasObsidianImports = content.includes('from "obsidian"') || content.includes("from 'obsidian'");
    const hasInfraImports = content.includes('from "../../infrastructure') || content.includes("from '../../infrastructure");
    const hasPresentationImports = content.includes('from "../../presentation') || content.includes("from '../../presentation");
    
    if (hasObsidianImports || hasInfraImports || hasPresentationImports) {
      testContext.errorMessages.push(`Domain layer violation in ${file}`);
    }
  }
});

Then('domain entities should not import from any other layers', function() {
  const domainViolations = testContext.errorMessages.filter(msg => msg.includes('Domain layer violation'));
  expect(domainViolations).toHaveLength(0);
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createMockApp(): App {
  return {
    vault: {
      getMarkdownFiles: () => [],
      getAbstractFileByPath: (path: string) => null,
      read: async (file: TFile) => '',
      modify: async (file: TFile, content: string) => {},
      create: async (path: string, content: string) => ({} as TFile)
    },
    metadataCache: {
      getFileCache: (file: TFile) => ({ frontmatter: {} }),
      resolvedLinks: {}
    },
    workspace: {
      getActiveFile: () => testContext.currentFile,
      openLinkText: (path: string) => {}
    }
  } as any;
}

function createMockManifest(): any {
  return {
    id: 'exocortex-obsidian-plugin',
    name: 'Exocortex',
    version: '1.0.0',
    minAppVersion: '1.0.0'
  };
}

function createTestVault(): any {
  return {
    files: new Map(),
    metadata: new Map()
  };
}

async function setupSampleOntologyFiles(vault: any): Promise<void> {
  // Create sample ontology files for testing
  const ontologyFiles = [
    { name: '!exo.md', content: 'exo__Ontology_prefix: exo' },
    { name: 'exo__Asset.md', content: 'exo__Instance_class: exo__Class' },
    { name: 'exo__Class.md', content: 'exo__Instance_class: exo__Class' }
  ];
  
  for (const file of ontologyFiles) {
    vault.files.set(file.name, file.content);
  }
}

async function createTestFile(options: {
  basename: string;
  frontmatter: Record<string, any>;
  content?: string;
}): Promise<TFile> {
  const file: TFile = {
    basename: options.basename,
    name: options.basename + '.md',
    path: options.basename + '.md',
    extension: 'md',
    stat: { ctime: Date.now(), mtime: Date.now(), size: 1000 },
    vault: testContext.app.vault
  } as any;
  
  // Store metadata
  testContext.app.metadataCache.getFileCache = (f: TFile) => {
    if (f.path === file.path) {
      return { frontmatter: options.frontmatter };
    }
    return { frontmatter: {} };
  };
  
  return file;
}

async function findFilesInDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  const fullPath = path.join(__dirname, '..', '..', dir);
  
  if (fs.existsSync(fullPath)) {
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(path.join(fullPath, entry.name));
      } else if (entry.isDirectory()) {
        const subFiles = await findFilesInDirectory(path.join(dir, entry.name));
        files.push(...subFiles);
      }
    }
  }
  
  return files;
}

export {
  testContext,
  createMockApp,
  createTestFile,
  setupSampleOntologyFiles
};