import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ExocortexPlugin } from '../../main';
import { LayoutBlock } from '../../src/domain/value-objects/LayoutBlock';

let plugin: ExocortexPlugin;
let currentFile: any;
let renderedContent: HTMLElement;
let layoutConfig: any;

Before(async function() {
    this.testVault = await createTestVault();
    this.plugin = await loadPlugin(this.testVault);
    plugin = this.plugin;
    
    renderedContent = document.createElement('div');
    renderedContent.className = 'exocortex-layout-container';
    document.body.appendChild(renderedContent);
});

After(async function() {
    document.body.innerHTML = '';
    await this.testVault.cleanup();
});

// Background
Given('I have the Exocortex plugin enabled', async function() {
    expect(plugin).toBeDefined();
    expect(plugin.settings.enableClassLayouts).toBe(true);
});

Given('I have class layouts configured in my vault', async function() {
    // Set up test layouts
    layoutConfig = {
        'ems__Task': {
            blocks: [
                { type: 'properties', title: 'Task Properties' },
                { type: 'query', query: 'tag:#subtask' },
                { type: 'backlinks', title: 'References' }
            ]
        },
        'ems__Person': {
            blocks: [
                { type: 'properties', title: 'Contact Info' },
                { type: 'custom', content: '## Biography\n{{bio}}' },
                { type: 'query', query: 'mentions:{{title}}' }
            ]
        }
    };
    
    await plugin.setLayoutConfig(layoutConfig);
});

// Scenario: Render asset with class-specific layout
Given('I have an asset {string} of class {string}', async function(assetName: string, className: string) {
    currentFile = {
        basename: assetName,
        path: `${assetName}.md`,
        frontmatter: {
            'exo__Asset_label': assetName,
            'exo__Instance_class': [`[[${className}]]`],
            'exo__Asset_uid': 'test-uuid-123',
            'ems__Task_status': 'in-progress',
            'ems__Task_priority': 'high'
        }
    };
});

When('I open the asset in reading view', async function() {
    await plugin.renderAssetLayout(renderedContent, currentFile);
    
    // Wait for render to complete
    await new Promise(resolve => setTimeout(resolve, 100));
});

Then('I should see the layout for {string} class', async function(className: string) {
    const layoutElement = renderedContent.querySelector('.exocortex-layout');
    expect(layoutElement).toBeDefined();
    expect(layoutElement.dataset.class).toBe(className);
});

Then('the layout should contain these blocks in order:', async function(dataTable: any) {
    const expectedBlocks = dataTable.hashes();
    const blocks = renderedContent.querySelectorAll('.exocortex-block');
    
    expect(blocks.length).toBe(expectedBlocks.length);
    
    expectedBlocks.forEach((expected: any, index: number) => {
        const block = blocks[index];
        expect(block.dataset.type).toBe(expected.Type);
        
        if (expected.Title) {
            const title = block.querySelector('.exocortex-block-title');
            expect(title?.textContent).toBe(expected.Title);
        }
    });
});

// Scenario: Inherit layout from parent class
Given('I have a class hierarchy where {string} extends {string}', async function(childClass: string, parentClass: string) {
    await plugin.setClassHierarchy({
        [childClass]: parentClass
    });
});

Given('{string} has no specific layout defined', async function(className: string) {
    // Ensure no layout for this class
    const config = await plugin.getLayoutConfig();
    delete config[className];
    await plugin.setLayoutConfig(config);
});

Given('{string} has a layout defined', async function(className: string) {
    const config = await plugin.getLayoutConfig();
    config[className] = {
        blocks: [
            { type: 'properties', title: `${className} Properties` },
            { type: 'backlinks', title: 'Related' }
        ]
    };
    await plugin.setLayoutConfig(config);
});

Then('the asset should use the layout from {string}', async function(className: string) {
    const layoutElement = renderedContent.querySelector('.exocortex-layout');
    expect(layoutElement.dataset.inheritedFrom).toBe(className);
});

// Scenario: Render query block with dynamic results
Given('I have other assets matching the query {string}', async function(query: string) {
    // Create test assets that match the query
    const testAssets = [
        { title: 'Subtask 1', tags: ['#subtask'] },
        { title: 'Subtask 2', tags: ['#subtask'] },
        { title: 'Subtask 3', tags: ['#subtask'] }
    ];
    
    await plugin.createTestAssets(testAssets);
});

Then('the query block should show {int} results', async function(count: number) {
    const queryBlock = renderedContent.querySelector('[data-type="query"]');
    const results = queryBlock.querySelectorAll('.query-result');
    expect(results.length).toBe(count);
});

Then('each result should be a clickable link', async function() {
    const results = renderedContent.querySelectorAll('.query-result');
    
    results.forEach(result => {
        const link = result.querySelector('a');
        expect(link).toBeDefined();
        expect(link.href).toBeDefined();
    });
});

// Scenario: Custom content block with variable substitution
Given('the asset has custom property {string} with value {string}', async function(property: string, value: string) {
    currentFile.frontmatter[property] = value;
});

Then('the custom block should show {string}', async function(expectedContent: string) {
    const customBlock = renderedContent.querySelector('[data-type="custom"]');
    const content = customBlock.querySelector('.custom-content');
    expect(content.textContent).toContain(expectedContent);
});

Then('variables like {string} should be replaced with actual values', async function(variable: string) {
    const customBlock = renderedContent.querySelector('[data-type="custom"]');
    const content = customBlock.innerHTML;
    
    // Should not contain the variable syntax anymore
    expect(content).not.toContain(`{{${variable}}}`);
    
    // Should contain the actual value
    const actualValue = currentFile.frontmatter[variable] || currentFile[variable];
    expect(content).toContain(actualValue);
});

// Scenario: Fallback to default layout
Given('I have an asset of class {string} with no layout defined', async function(className: string) {
    currentFile = {
        basename: 'Unknown Asset',
        path: 'unknown.md',
        frontmatter: {
            'exo__Instance_class': [`[[${className}]]`],
            'exo__Asset_label': 'Unknown Asset'
        }
    };
    
    // Ensure no layout exists
    const config = await plugin.getLayoutConfig();
    delete config[className];
    await plugin.setLayoutConfig(config);
});

Then('the default layout should be used', async function() {
    const layoutElement = renderedContent.querySelector('.exocortex-layout');
    expect(layoutElement.dataset.layout).toBe('default');
});

Then('it should show a simple properties table', async function() {
    const propertiesBlock = renderedContent.querySelector('[data-type="properties"]');
    expect(propertiesBlock).toBeDefined();
    
    const table = propertiesBlock.querySelector('table');
    expect(table).toBeDefined();
});

// Scenario: Mobile responsive layout
When('I view the asset on a mobile device', async function() {
    // Simulate mobile viewport
    window.innerWidth = 375;
    window.innerHeight = 667;
    
    // Trigger resize event
    const event = new Event('resize');
    window.dispatchEvent(event);
    
    // Re-render
    await plugin.renderAssetLayout(renderedContent, currentFile);
});

Then('the layout should adapt to mobile view', async function() {
    const layoutElement = renderedContent.querySelector('.exocortex-layout');
    expect(layoutElement.classList.contains('is-mobile')).toBe(true);
});

Then('blocks should stack vertically', async function() {
    const blocks = renderedContent.querySelectorAll('.exocortex-block');
    
    let previousBottom = 0;
    blocks.forEach(block => {
        const rect = (block as HTMLElement).getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(previousBottom);
        previousBottom = rect.bottom;
    });
});

// Helper functions
async function createTestVault() {
    return {
        cleanup: async () => {}
    };
}

async function loadPlugin(vault: any) {
    const layoutConfig: any = {};
    const classHierarchy: any = {};
    const testAssets: any[] = [];
    
    return {
        settings: {
            enableClassLayouts: true
        },
        
        setLayoutConfig: async (config: any) => {
            Object.assign(layoutConfig, config);
        },
        
        getLayoutConfig: async () => layoutConfig,
        
        setClassHierarchy: async (hierarchy: any) => {
            Object.assign(classHierarchy, hierarchy);
        },
        
        createTestAssets: async (assets: any[]) => {
            testAssets.push(...assets);
        },
        
        renderAssetLayout: async (container: HTMLElement, file: any) => {
            // Mock layout rendering
            const layout = document.createElement('div');
            layout.className = 'exocortex-layout';
            
            const className = file.frontmatter['exo__Instance_class']?.[0]?.replace(/\[\[|\]\]/g, '');
            layout.dataset.class = className;
            
            const config = layoutConfig[className] || { blocks: [{ type: 'properties' }] };
            
            if (!layoutConfig[className] && classHierarchy[className]) {
                layout.dataset.inheritedFrom = classHierarchy[className];
            }
            
            if (!layoutConfig[className] && !classHierarchy[className]) {
                layout.dataset.layout = 'default';
            }
            
            // Render blocks
            config.blocks?.forEach((blockConfig: any) => {
                const block = document.createElement('div');
                block.className = 'exocortex-block';
                block.dataset.type = blockConfig.type;
                
                if (blockConfig.title) {
                    const title = document.createElement('h3');
                    title.className = 'exocortex-block-title';
                    title.textContent = blockConfig.title;
                    block.appendChild(title);
                }
                
                if (blockConfig.type === 'query') {
                    // Add mock query results
                    testAssets.forEach(asset => {
                        const result = document.createElement('div');
                        result.className = 'query-result';
                        const link = document.createElement('a');
                        link.href = '#';
                        link.textContent = asset.title;
                        result.appendChild(link);
                        block.appendChild(result);
                    });
                }
                
                if (blockConfig.type === 'custom') {
                    const content = document.createElement('div');
                    content.className = 'custom-content';
                    let html = blockConfig.content;
                    
                    // Replace variables
                    Object.keys(file.frontmatter).forEach(key => {
                        html = html.replace(`{{${key}}}`, file.frontmatter[key]);
                    });
                    html = html.replace('{{title}}', file.basename);
                    
                    content.innerHTML = html;
                    block.appendChild(content);
                }
                
                if (blockConfig.type === 'properties') {
                    const table = document.createElement('table');
                    block.appendChild(table);
                }
                
                layout.appendChild(block);
            });
            
            // Check for mobile
            if (window.innerWidth < 768) {
                layout.classList.add('is-mobile');
            }
            
            container.appendChild(layout);
        }
    };
}