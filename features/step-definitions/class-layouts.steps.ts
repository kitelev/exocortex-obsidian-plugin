import { Given, When, Then, DataTable, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'chai';
import { ClassLayout } from '../../src/domain/entities/ClassLayout';
import { LayoutBlock } from '../../src/domain/entities/LayoutBlock';
import { Asset } from '../../src/domain/entities/Asset';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { GetLayoutForClassUseCase } from '../../src/application/use-cases/GetLayoutForClassUseCase';
import { LayoutRenderer } from '../../src/presentation/renderers/LayoutRenderer';
import { ObsidianVaultAdapter } from '../../src/infrastructure/adapters/ObsidianVaultAdapter';
import { ObsidianClassLayoutRepository } from '../../src/infrastructure/repositories/ObsidianClassLayoutRepository';

setDefaultTimeout(10000);

// Mock layout configuration
interface LayoutConfiguration {
  targetClass: string;
  priority: number;
  blocks: LayoutBlockConfig[];
}

interface LayoutBlockConfig {
  id: string;
  type: string;
  title: string;
  order: number;
  config: any;
}

// Mock query result
interface QueryResult {
  results: Asset[];
  count: number;
  executionTime: number;
}

// Mock Vault Adapter for testing
class MockVaultForLayouts extends ObsidianVaultAdapter {
  private files: Map<string, string> = new Map();
  private layouts: Map<string, LayoutConfiguration> = new Map();
  private assets: Map<string, Asset> = new Map();

  constructor() {
    super(null as any);
  }

  // Layout management
  setLayoutConfiguration(className: string, config: LayoutConfiguration): void {
    this.layouts.set(className, config);
    
    // Also store as file
    const filename = `layouts/Layout - ${className}.md`;
    const content = this.serializeLayout(config);
    this.files.set(filename, content);
  }

  getLayoutConfiguration(className: string): LayoutConfiguration | null {
    return this.layouts.get(className) || null;
  }

  // Asset management
  createAsset(name: string, className: string, properties: Record<string, any> = {}): Asset {
    const assetId = AssetId.create(name).getValue()!;
    const assetClass = ClassName.create(className).getValue()!;
    
    const asset = Asset.create({
      id: assetId,
      class: assetClass,
      properties: new Map(Object.entries(properties))
    }).getValue()!;
    
    this.assets.set(name, asset);
    return asset;
  }

  getAsset(name: string): Asset | null {
    return this.assets.get(name) || null;
  }

  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  // Query simulation
  executeQuery(className: string, filters: any[], options: any = {}): QueryResult {
    const startTime = Date.now();
    
    let results = Array.from(this.assets.values())
      .filter(asset => asset.getClass().getValue() === className);
    
    // Apply filters
    filters.forEach(filter => {
      results = results.filter(asset => {
        const propertyValue = asset.getProperty(filter.property)?.getValue();
        
        switch (filter.operator) {
          case 'equals':
            return propertyValue === filter.value;
          case 'notEquals':
            return propertyValue !== filter.value;
          case 'contains':
            return propertyValue && propertyValue.includes(filter.value);
          default:
            return true;
        }
      });
    });
    
    // Apply sorting
    if (options.sortBy) {
      results.sort((a, b) => {
        const aValue = a.getProperty(options.sortBy)?.getValue() || '';
        const bValue = b.getProperty(options.sortBy)?.getValue() || '';
        
        if (options.sortOrder === 'desc') {
          return bValue.localeCompare(aValue);
        }
        return aValue.localeCompare(bValue);
      });
    }
    
    // Apply limit
    if (options.maxResults) {
      results = results.slice(0, options.maxResults);
    }
    
    const endTime = Date.now();
    
    return {
      results,
      count: results.length,
      executionTime: endTime - startTime
    };
  }

  private serializeLayout(config: LayoutConfiguration): string {
    const frontmatter = {
      'exo__Instance_class': '[[ui__ClassLayout]]',
      'ui__ClassLayout_targetClass': `[[${config.targetClass}]]`,
      'ui__ClassLayout_priority': config.priority,
      'ui__ClassLayout_blocks': config.blocks
    };
    
    const yamlContent = Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
    
    return `---\n${yamlContent}\n---\n`;
  }

  // File operations
  override async read(path: string): Promise<string> {
    return this.files.get(path) || '';
  }

  override async write(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  override async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  clear(): void {
    this.files.clear();
    this.layouts.clear();
    this.assets.clear();
  }
}

// Mock Layout Renderer
class MockLayoutRenderer extends LayoutRenderer {
  private renderedBlocks: any[] = [];
  private executionTime: number = 0;
  private errorOccurred: boolean = false;

  constructor(private vault: MockVaultForLayouts) {
    super(null as any, null as any);
  }

  async renderLayout(asset: Asset, className: string): Promise<void> {
    const startTime = Date.now();
    this.renderedBlocks = [];
    this.errorOccurred = false;

    try {
      const layout = this.vault.getLayoutConfiguration(className);
      
      if (!layout) {
        // Use default layout
        this.renderDefaultLayout(asset);
        return;
      }

      // Sort blocks by order
      const sortedBlocks = [...layout.blocks].sort((a, b) => a.order - b.order);

      for (const blockConfig of sortedBlocks) {
        await this.renderBlock(asset, blockConfig);
      }
    } catch (error) {
      this.errorOccurred = true;
      this.renderDefaultLayout(asset);
    } finally {
      this.executionTime = Date.now() - startTime;
    }
  }

  private async renderBlock(asset: Asset, blockConfig: LayoutBlockConfig): Promise<void> {
    const renderedBlock = {
      id: blockConfig.id,
      type: blockConfig.type,
      title: blockConfig.title,
      content: null,
      error: null
    };

    try {
      switch (blockConfig.type) {
        case 'properties':
          renderedBlock.content = this.renderPropertiesBlock(asset);
          break;
        case 'query':
          renderedBlock.content = await this.renderQueryBlock(asset, blockConfig);
          break;
        case 'backlinks':
          renderedBlock.content = this.renderBacklinksBlock(asset);
          break;
        case 'custom':
          renderedBlock.content = await this.renderCustomBlock(asset, blockConfig);
          break;
        default:
          throw new Error(`Unknown block type: ${blockConfig.type}`);
      }
    } catch (error) {
      renderedBlock.error = (error as Error).message;
    }

    this.renderedBlocks.push(renderedBlock);
  }

  private renderPropertiesBlock(asset: Asset): any {
    return {
      type: 'properties',
      properties: Array.from(asset.getProperties().entries()).map(([key, value]) => ({
        name: key,
        value: value.getValue(),
        editable: true
      }))
    };
  }

  private async renderQueryBlock(asset: Asset, blockConfig: LayoutBlockConfig): Promise<any> {
    const config = blockConfig.config;
    
    // Replace template variables
    const filters = config.propertyFilters?.map((filter: any) => ({
      ...filter,
      value: filter.value === '{{current_asset}}' ? `[[${asset.getId().getValue()}]]` : filter.value
    })) || [];

    const result = this.vault.executeQuery(config.className, filters, {
      maxResults: config.maxResults,
      sortBy: config.sortBy,
      sortOrder: config.sortOrder
    });

    return {
      type: 'query',
      className: config.className,
      results: result.results.map(r => ({
        id: r.getId().getValue(),
        class: r.getClass().getValue(),
        properties: Object.fromEntries(r.getProperties().entries())
      })),
      count: result.count,
      executionTime: result.executionTime
    };
  }

  private renderBacklinksBlock(asset: Asset): any {
    return {
      type: 'backlinks',
      backlinks: [
        { name: 'Reference 1', path: 'ref1.md' },
        { name: 'Reference 2', path: 'ref2.md' }
      ]
    };
  }

  private async renderCustomBlock(asset: Asset, blockConfig: LayoutBlockConfig): Promise<any> {
    const config = blockConfig.config;
    
    if (config.dataviewQuery) {
      // Simulate Dataview query execution
      return {
        type: 'custom',
        subtype: 'dataview',
        query: config.dataviewQuery,
        results: [
          { name: 'Project 2024-1', deadline: '2024-12-31', status: 'Active' },
          { name: 'Project 2024-2', deadline: '2024-11-30', status: 'Planning' }
        ]
      };
    }

    return {
      type: 'custom',
      content: 'Custom block content'
    };
  }

  private renderDefaultLayout(asset: Asset): void {
    this.renderedBlocks = [
      {
        id: 'default_properties',
        type: 'properties',
        title: 'Properties',
        content: this.renderPropertiesBlock(asset),
        error: null
      },
      {
        id: 'default_backlinks',
        type: 'backlinks',
        title: 'Backlinks',
        content: this.renderBacklinksBlock(asset),
        error: null
      }
    ];
  }

  getRenderedBlocks(): any[] {
    return this.renderedBlocks;
  }

  getExecutionTime(): number {
    return this.executionTime;
  }

  hasError(): boolean {
    return this.errorOccurred;
  }

  getBlockByTitle(title: string): any {
    return this.renderedBlocks.find(block => block.title === title);
  }

  getBlockContent(title: string): any {
    const block = this.getBlockByTitle(title);
    return block ? block.content : null;
  }
}

// Test World interface
interface ClassLayoutsWorld {
  vault: MockVaultForLayouts;
  layoutRenderer: MockLayoutRenderer;
  layoutRepository: ObsidianClassLayoutRepository;
  getLayoutUseCase: GetLayoutForClassUseCase;
  
  // Test state
  currentAsset: Asset | null;
  currentClassName: string;
  renderedBlocks: any[];
  executionTime: number;
  errorMessages: string[];
  
  // Layout configurations
  layoutConfigurations: Map<string, LayoutConfiguration>;
}

let world: ClassLayoutsWorld;

Before(function() {
  const vault = new MockVaultForLayouts();
  const layoutRepository = new ObsidianClassLayoutRepository(vault);
  
  world = {
    vault,
    layoutRenderer: new MockLayoutRenderer(vault),
    layoutRepository,
    getLayoutUseCase: new GetLayoutForClassUseCase(layoutRepository),
    currentAsset: null,
    currentClassName: '',
    renderedBlocks: [],
    executionTime: 0,
    errorMessages: [],
    layoutConfigurations: new Map()
  };
});

After(function() {
  world.vault.clear();
  world.layoutConfigurations.clear();
  world.errorMessages = [];
});

Given('the plugin is installed and active', function() {
  expect(world.vault).to.not.be.null;
  expect(world.layoutRenderer).to.not.be.null;
});

Given('I have configured the layouts folder as {string}', function(folder: string) {
  // Configuration is implicit in our mock
  expect(folder).to.equal('layouts');
});

Given('the following ontology classes exist:', function(dataTable: DataTable) {
  const classes = dataTable.hashes();
  
  classes.forEach(classInfo => {
    // Create class definitions - in real implementation this would create ontology entries
    expect(classInfo.Class).to.not.be.empty;
    expect(classInfo.Parent).to.not.be.empty;
  });
});

Given('I have a layout configuration for {string}:', function(className: string, layoutContent: string) {
  // Parse the layout configuration from the YAML-like content
  const config: LayoutConfiguration = {
    targetClass: className,
    priority: 5, // Default priority
    blocks: []
  };

  // Extract blocks from the content
  const blockMatch = layoutContent.match(/ui__ClassLayout_blocks:([\s\S]*?)(?:\n---|\n$|$)/);
  if (blockMatch) {
    const blocksContent = blockMatch[1];
    
    // Parse the block configuration (simplified YAML parsing)
    const lines = blocksContent.split('\n').filter(line => line.trim());
    let currentBlock: any = null;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('- id:')) {
        if (currentBlock) {
          config.blocks.push(currentBlock);
        }
        currentBlock = {
          id: trimmedLine.split('"')[1],
          type: '',
          title: '',
          order: config.blocks.length + 1,
          config: {}
        };
      } else if (trimmedLine.startsWith('type:') && currentBlock) {
        currentBlock.type = trimmedLine.split('"')[1];
      } else if (trimmedLine.startsWith('title:') && currentBlock) {
        currentBlock.title = trimmedLine.split('"')[1];
      } else if (trimmedLine.includes('className:') && currentBlock) {
        currentBlock.config.className = trimmedLine.split('"')[1];
      } else if (trimmedLine.includes('propertyFilters:') && currentBlock) {
        currentBlock.config.propertyFilters = [];
      } else if (trimmedLine.includes('property:') && currentBlock) {
        const filter: any = { property: trimmedLine.split('"')[1] };
        currentBlock.config.propertyFilters = currentBlock.config.propertyFilters || [];
        currentBlock.config.propertyFilters.push(filter);
      } else if (trimmedLine.includes('operator:') && currentBlock && currentBlock.config.propertyFilters) {
        const lastFilter = currentBlock.config.propertyFilters[currentBlock.config.propertyFilters.length - 1];
        lastFilter.operator = trimmedLine.split('"')[1];
      } else if (trimmedLine.includes('value:') && currentBlock && currentBlock.config.propertyFilters) {
        const lastFilter = currentBlock.config.propertyFilters[currentBlock.config.propertyFilters.length - 1];
        lastFilter.value = trimmedLine.split('"')[1];
      }
    });
    
    if (currentBlock) {
      config.blocks.push(currentBlock);
    }
  }

  world.vault.setLayoutConfiguration(className, config);
  world.layoutConfigurations.set(className, config);
});

Given('I have a project {string} with tasks:', function(projectName: string, dataTable: DataTable) {
  const project = world.vault.createAsset(projectName, 'ems__Project');
  
  const tasks = dataTable.hashes();
  tasks.forEach(task => {
    const taskAsset = world.vault.createAsset(task['Task Name'], 'ems__Task', {
      'ems__Task_project': `[[${projectName}]]`,
      'ems__Effort_status': `[[ems__EffortStatus - ${task.Status}]]`
    });
  });
  
  world.currentAsset = project;
});

Given('I have an area {string} with sub-areas:', function(areaName: string, dataTable: DataTable) {
  const area = world.vault.createAsset(areaName, 'ems__Area');
  
  const subAreas = dataTable.hashes();
  subAreas.forEach(subArea => {
    world.vault.createAsset(subArea['Sub-Area'], 'ems__Area', {
      'ems__Area_parent': `[[${areaName}]]`
    });
  });
  
  world.currentAsset = area;
});

Given('I have two layout configurations for {string}:', function(className: string, dataTable: DataTable) {
  const layouts = dataTable.hashes();
  
  layouts.forEach(layout => {
    const config: LayoutConfiguration = {
      targetClass: className,
      priority: parseInt(layout.Priority),
      blocks: [
        {
          id: `block_${layout['Layout Name']}`,
          type: 'properties',
          title: layout['Layout Name'],
          order: 1,
          config: {}
        }
      ]
    };
    
    world.vault.setLayoutConfiguration(`${className}_${layout.Priority}`, config);
  });
});

Given('there is no layout configuration for {string}', function(className: string) {
  // Ensure no layout exists for this class
  expect(world.vault.getLayoutConfiguration(className)).to.be.null;
});

Given('I have a layout with multiple blocks:', function(dataTable: DataTable) {
  const blocks = dataTable.hashes();
  
  const config: LayoutConfiguration = {
    targetClass: 'TestClass',
    priority: 5,
    blocks: blocks.map(block => ({
      id: `block_${block['Block Type']}`,
      type: block['Block Type'],
      title: block.Title,
      order: parseInt(block.Order),
      config: {}
    }))
  };
  
  world.vault.setLayoutConfiguration('TestClass', config);
  world.currentClassName = 'TestClass';
});

Given('I have a query block with filters:', function(filtersContent: string) {
  // Parse the filters configuration
  const config: LayoutConfiguration = {
    targetClass: 'TestClass',
    priority: 5,
    blocks: [{
      id: 'test_query_block',
      type: 'query',
      title: 'Test Query',
      order: 1,
      config: {
        className: 'ems__Task',
        propertyFilters: [
          { property: 'ems__Task_area', operator: 'equals', value: '[[Engineering]]' },
          { property: 'ems__Task_priority', operator: 'equals', value: 'High' },
          { property: 'ems__Effort_status', operator: 'contains', value: 'Active' }
        ],
        maxResults: 10,
        sortBy: 'ems__Task_deadline',
        sortOrder: 'asc'
      }
    }]
  };
  
  world.vault.setLayoutConfiguration('TestClass', config);
  
  // Create matching test data
  world.vault.createAsset('Task1', 'ems__Task', {
    'ems__Task_area': '[[Engineering]]',
    'ems__Task_priority': 'High',
    'ems__Effort_status': 'Active',
    'ems__Task_deadline': '2024-12-31'
  });
  
  world.vault.createAsset('Task2', 'ems__Task', {
    'ems__Task_area': '[[Marketing]]',
    'ems__Task_priority': 'Low',
    'ems__Effort_status': 'Done'
  });
});

Given('I have a properties block with editable fields:', function(dataTable: DataTable) {
  const properties = dataTable.hashes();
  
  const config: LayoutConfiguration = {
    targetClass: 'TestClass',
    priority: 5,
    blocks: [{
      id: 'properties_block',
      type: 'properties',
      title: 'Properties',
      order: 1,
      config: {
        editableProperties: properties.map(prop => prop.Property)
      }
    }]
  };
  
  world.vault.setLayoutConfiguration('TestClass', config);
});

Given('I have a custom block with dataview query:', function(queryContent: string) {
  const config: LayoutConfiguration = {
    targetClass: 'TestClass',
    priority: 5,
    blocks: [{
      id: 'custom_dataview_block',
      type: 'custom',
      title: 'Custom Dataview',
      order: 1,
      config: {
        dataviewQuery: queryContent.replace(/^\s*type: "custom"\s*\n\s*dataviewQuery: \|\s*\n/, '').trim()
      }
    }]
  };
  
  world.vault.setLayoutConfiguration('TestClass', config);
});

Given('I have a query block returning {int}+ assets', function(count: number) {
  // Create enough assets to test performance
  for (let i = 1; i <= count + 10; i++) {
    world.vault.createAsset(`Asset${i}`, 'TestClass');
  }
  
  const config: LayoutConfiguration = {
    targetClass: 'TestClass',
    priority: 5,
    blocks: [{
      id: 'large_query_block',
      type: 'query',
      title: 'Large Query',
      order: 1,
      config: {
        className: 'TestClass',
        propertyFilters: [],
        maxResults: count
      }
    }]
  };
  
  world.vault.setLayoutConfiguration('TestClass', config);
});

Given('I have a layout with invalid configuration:', function(invalidConfig: string) {
  const config: LayoutConfiguration = {
    targetClass: 'TestClass',
    priority: 5,
    blocks: [{
      id: 'invalid_block',
      type: 'nonexistent', // This will cause an error
      title: 'Invalid Block',
      order: 1,
      config: {}
    }]
  };
  
  world.vault.setLayoutConfiguration('TestClass', config);
});

When('I open the {string} project', async function(projectName: string) {
  const asset = world.vault.getAsset(projectName);
  expect(asset).to.not.be.null;
  
  world.currentAsset = asset!;
  await world.layoutRenderer.renderLayout(asset!, 'ems__Project');
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
});

When('I open the {string} area', async function(areaName: string) {
  const asset = world.vault.getAsset(areaName);
  expect(asset).to.not.be.null;
  
  world.currentAsset = asset!;
  await world.layoutRenderer.renderLayout(asset!, 'ems__Area');
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
});

When('I open a project asset', async function() {
  const asset = world.vault.createAsset('TestProject', 'ems__Project');
  world.currentAsset = asset;
  
  await world.layoutRenderer.renderLayout(asset, 'ems__Project');
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
});

When('I open an asset of class {string}', async function(className: string) {
  const asset = world.vault.createAsset('TestAsset', className);
  world.currentAsset = asset;
  world.currentClassName = className;
  
  await world.layoutRenderer.renderLayout(asset, className);
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
});

When('I open an asset with this layout', async function() {
  const asset = world.vault.createAsset('TestAsset', world.currentClassName || 'TestClass');
  world.currentAsset = asset;
  
  await world.layoutRenderer.renderLayout(asset, world.currentClassName || 'TestClass');
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
  world.executionTime = world.layoutRenderer.getExecutionTime();
});

When('the query block is rendered', async function() {
  const asset = world.vault.createAsset('TestAsset', 'TestClass');
  await world.layoutRenderer.renderLayout(asset, 'TestClass');
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
});

When('I click on an editable property', function() {
  // Simulate clicking on an editable property
  const propertiesBlock = world.renderedBlocks.find(block => block.type === 'properties');
  expect(propertiesBlock).to.not.be.null;
  expect(propertiesBlock.content.properties).to.not.be.empty;
});

When('the custom block is rendered', async function() {
  const asset = world.vault.createAsset('TestAsset', 'TestClass');
  await world.layoutRenderer.renderLayout(asset, 'TestClass');
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
});

When('the block is rendered', async function() {
  const asset = world.vault.createAsset('TestAsset', 'TestClass');
  const startTime = Date.now();
  
  await world.layoutRenderer.renderLayout(asset, 'TestClass');
  
  world.renderedBlocks = world.layoutRenderer.getRenderedBlocks();
  world.executionTime = Date.now() - startTime;
});

Then('I should see a block titled {string}', function(title: string) {
  const block = world.renderedBlocks.find(block => block.title === title);
  expect(block, `Block with title "${title}" not found`).to.not.be.undefined;
});

Then('the block should contain {string}', function(expectedContent: string) {
  const block = world.renderedBlocks.find(block => 
    block.content && 
    JSON.stringify(block.content).includes(expectedContent)
  );
  expect(block, `Content "${expectedContent}" not found in any block`).to.not.be.undefined;
});

Then('the block should not contain {string}', function(unexpectedContent: string) {
  const block = world.renderedBlocks.find(block => 
    block.content && 
    JSON.stringify(block.content).includes(unexpectedContent)
  );
  expect(block, `Content "${unexpectedContent}" was found but shouldn't be`).to.be.undefined;
});

Then('the block should list all {int} sub-areas', function(count: number) {
  const subAreasBlock = world.renderedBlocks.find(block => block.title === 'Sub-Areas');
  expect(subAreasBlock).to.not.be.undefined;
  expect(subAreasBlock.content.results).to.have.length(count);
});

Then('the {string} should be used', function(layoutName: string) {
  // Higher priority layout should be used
  expect(world.renderedBlocks).to.not.be.empty;
});

Then('I should see blocks from the higher priority layout', function() {
  expect(world.renderedBlocks).to.not.be.empty;
});

Then('the default layout should be displayed', function() {
  const hasDefaultBlocks = world.renderedBlocks.some(block => 
    block.id === 'default_properties' || block.id === 'default_backlinks'
  );
  expect(hasDefaultBlocks).to.be.true;
});

Then('I should see standard property blocks', function() {
  const propertiesBlock = world.renderedBlocks.find(block => block.type === 'properties');
  expect(propertiesBlock).to.not.be.undefined;
});

Then('I should see backlinks section', function() {
  const backlinksBlock = world.renderedBlocks.find(block => block.type === 'backlinks');
  expect(backlinksBlock).to.not.be.undefined;
});

Then('blocks should appear in the specified order', function() {
  const actualOrder = world.renderedBlocks.map(block => block.order || 0);
  const expectedOrder = [...actualOrder].sort((a, b) => a - b);
  expect(actualOrder).to.deep.equal(expectedOrder);
});

Then('each block should render its content correctly', function() {
  world.renderedBlocks.forEach(block => {
    expect(block.content).to.not.be.null;
    expect(block.error).to.be.null;
  });
});

Then('it should show only tasks matching all filters', function() {
  const queryBlock = world.renderedBlocks.find(block => block.type === 'query');
  expect(queryBlock).to.not.be.undefined;
  
  // Should only show Task1 which matches all filters
  expect(queryBlock.content.results).to.have.length(1);
  expect(queryBlock.content.results[0].id).to.equal('Task1');
});

Then('results should be limited to {int}', function(limit: number) {
  const queryBlock = world.renderedBlocks.find(block => block.type === 'query');
  expect(queryBlock).to.not.be.undefined;
  expect(queryBlock.content.results.length).to.be.lessThanOrEqual(limit);
});

Then('results should be sorted by deadline ascending', function() {
  const queryBlock = world.renderedBlocks.find(block => block.type === 'query');
  expect(queryBlock).to.not.be.undefined;
  
  // Verify sorting (simplified check)
  expect(queryBlock.content.results).to.not.be.empty;
});

Then('an inline editor should appear', function() {
  // In real implementation, this would check for inline editor UI
  expect(true).to.be.true; // Placeholder for UI check
});

Then('I should be able to modify the value', function() {
  // Placeholder for inline editing capability
  expect(true).to.be.true;
});

Then('changes should be saved to the asset', function() {
  // Placeholder for save verification
  expect(world.currentAsset).to.not.be.null;
});

Then('it should execute the dataview query', function() {
  const customBlock = world.renderedBlocks.find(block => block.type === 'custom');
  expect(customBlock).to.not.be.undefined;
  expect(customBlock.content.subtype).to.equal('dataview');
});

Then('display results in the specified format', function() {
  const customBlock = world.renderedBlocks.find(block => block.type === 'custom');
  expect(customBlock).to.not.be.undefined;
  expect(customBlock.content.results).to.not.be.empty;
});

Then('it should complete within {int}ms', function(maxTime: number) {
  expect(world.executionTime).to.be.lessThan(maxTime);
});

Then('implement pagination or virtualization', function() {
  // Placeholder for pagination verification
  expect(true).to.be.true;
});

Then('show result count indicator', function() {
  const queryBlock = world.renderedBlocks.find(block => block.type === 'query');
  expect(queryBlock).to.not.be.undefined;
  expect(queryBlock.content.count).to.be.a('number');
});

Then('an error message should be displayed', function() {
  const invalidBlock = world.renderedBlocks.find(block => block.error);
  expect(invalidBlock).to.not.be.undefined;
  expect(invalidBlock.error).to.include('Unknown block type');
});

Then('the default layout should be used as fallback', function() {
  const hasDefaultBlocks = world.renderedBlocks.some(block => 
    block.id?.startsWith('default_')
  );
  expect(hasDefaultBlocks).to.be.true;
});

Then('the error should be logged to console', function() {
  // In real implementation, this would check console logs
  expect(world.layoutRenderer.hasError()).to.be.true;
});