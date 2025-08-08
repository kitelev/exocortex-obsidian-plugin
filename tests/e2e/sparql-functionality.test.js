#!/usr/bin/env node

/**
 * E2E Test: SPARQL Functionality
 * Tests that SPARQL queries execute correctly and produce expected output
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('🧪 E2E Test: SPARQL Functionality');

// Test configuration
const PLUGIN_DIR = path.resolve(__dirname, '../..');
const MAIN_JS_PATH = path.join(PLUGIN_DIR, 'main.js');

// Test results tracker
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function runAsyncTest(name, testFn) {
    testsRun++;
    process.stdout.write(`  ${name}... `);
    
    try {
        await testFn();
        testsPassed++;
        console.log('✅ PASS');
        return true;
    } catch (error) {
        testsFailed++;
        console.log('❌ FAIL');
        console.log(`    Error: ${error.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;

// Mock Obsidian API
const ObsidianMock = {
    Plugin: class Plugin {
        constructor(app, manifest) {
            this.app = app;
            this.manifest = manifest;
        }
        
        registerMarkdownCodeBlockProcessor(language, processor) {
            this.codeBlockProcessor = processor;
        }
    },
    
    Notice: class Notice {
        constructor(message, timeout) {
            this.message = message;
        }
    }
};

// Mock test files with frontmatter
const mockFiles = [
    {
        basename: 'Task1',
        path: 'Task1.md',
        content: `---
exo__Asset_uid: task-1-uid
exo__Asset_label: Test Task 1
exo__Instance_class: "[[ems__Task]]"
ems__Task_status: "In Progress"
---

# Test Task 1`
    },
    {
        basename: 'Task2', 
        path: 'Task2.md',
        content: `---
exo__Asset_uid: task-2-uid
exo__Asset_label: Test Task 2  
exo__Instance_class: "[[ems__Task]]"
ems__Task_status: "Done"
---

# Test Task 2`
    },
    {
        basename: 'Asset1',
        path: 'Asset1.md', 
        content: `---
exo__Asset_uid: asset-1-uid
exo__Asset_label: Test Asset
exo__Instance_class: "[[exo__Class]]"
---

# Test Asset`
    }
];

// Mock Obsidian App with test data
const AppMock = {
    vault: {
        getMarkdownFiles() {
            return mockFiles.map(f => ({
                basename: f.basename,
                path: f.path
            }));
        },
        
        async read(file) {
            const mockFile = mockFiles.find(f => f.basename === file.basename);
            if (!mockFile) {
                throw new Error(`Mock file not found: ${file.basename}`);
            }
            return mockFile.content;
        }
    },
    
    workspace: {
        openLinkText(linkText, sourcePath) {
            // Mock implementation
        }
    }
};

async function loadPlugin() {
    // Setup module system
    const moduleExports = {};
    const module = { exports: moduleExports };
    
    function mockRequire(id) {
        if (id === 'obsidian') {
            return ObsidianMock;
        }
        throw new Error(`Module not mocked: ${id}`);
    }
    
    // Load plugin
    const pluginCode = fs.readFileSync(MAIN_JS_PATH, 'utf8');
    const pluginFn = new Function('module', 'exports', 'require', pluginCode);
    pluginFn(module, moduleExports, mockRequire);
    
    const PluginClass = module.exports.default || module.exports;
    const plugin = new PluginClass(AppMock, {});
    
    await plugin.onload();
    
    return plugin;
}

async function main() {
    console.log('\n🔍 Running SPARQL Functionality Tests...\n');

    // Test 1: SPARQL processor is registered
    await runAsyncTest('SPARQL processor is registered', async () => {
        const plugin = await loadPlugin();
        assert(plugin.codeBlockProcessor, 'SPARQL code block processor not registered');
        assert(typeof plugin.codeBlockProcessor === 'function', 'Code block processor is not a function');
    });

    // Test 2: Basic SELECT * query
    await runAsyncTest('Basic SELECT * query works', async () => {
        const plugin = await loadPlugin();
        
        const query = 'SELECT * WHERE { } LIMIT 5';
        const results = await plugin.executeSPARQL(query);
        
        assert(Array.isArray(results), 'Results should be an array');
        assert(results.length > 0, 'Should return some results');
        assert(results.length <= 5, 'Should respect LIMIT');
        
        // Check first result has expected structure
        const firstResult = results[0];
        assert(firstResult.subject, 'Result should have subject');
        assert(firstResult.predicate, 'Result should have predicate'); 
        assert(firstResult.object, 'Result should have object');
    });

    // Test 3: Frontmatter parsing works
    await runAsyncTest('Frontmatter parsing extracts triples correctly', async () => {
        const plugin = await loadPlugin();
        
        // Test frontmatter parser directly
        const yaml = `exo__Asset_uid: test-uid
exo__Asset_label: Test Label
exo__Instance_class: "[[ems__Task]]"`;
        
        const parsed = plugin.parseFrontmatter(yaml);
        
        assert(parsed['exo__Asset_uid'] === 'test-uid', 'Should parse UID correctly');
        assert(parsed['exo__Asset_label'] === 'Test Label', 'Should parse label correctly');
        assert(parsed['exo__Instance_class'] === '[[ems__Task]]', 'Should parse class correctly');
    });

    // Test 4: SPARQL execution extracts triples from mock files
    await runAsyncTest('SPARQL execution extracts triples from files', async () => {
        const plugin = await loadPlugin();
        
        const query = 'SELECT * WHERE { } LIMIT 10';
        const results = await plugin.executeSPARQL(query);
        
        // Should find triples from our mock files
        const taskTriples = results.filter(r => r.object && r.object.includes('Task'));
        assert(taskTriples.length >= 2, 'Should find task-related triples');
        
        const uidTriples = results.filter(r => r.predicate === 'exo__Asset_uid');
        assert(uidTriples.length >= 3, 'Should find UID triples for all mock files');
    });

    // Test 5: HTML rendering works
    await runAsyncTest('SPARQL results render to HTML correctly', async () => {
        const plugin = await loadPlugin();
        
        // Create mock HTML element
        const container = document.createElement('div');
        
        const mockContext = { 
            sourcePath: 'test.md'
        };
        
        const query = 'SELECT * WHERE { } LIMIT 3';
        
        // Execute SPARQL processor 
        await plugin.processSPARQL(query, container, mockContext);
        
        // Check HTML was created
        assert(container.children.length > 0, 'Should create HTML elements');
        assert(container.innerHTML.includes('SPARQL Query Results'), 'Should include title');
        assert(container.innerHTML.includes('table'), 'Should create results table');
    });

    // Test 6: Error handling works
    await runAsyncTest('SPARQL error handling works', async () => {
        const plugin = await loadPlugin();
        
        // Create mock HTML element  
        const container = document.createElement('div');
        const mockContext = { sourcePath: 'test.md' };
        
        // Invalid query should be handled gracefully
        const invalidQuery = 'INVALID SPARQL QUERY';
        
        // Should not throw, but handle error gracefully
        await plugin.processSPARQL(invalidQuery, container, mockContext);
        
        assert(container.children.length > 0, 'Should create HTML even on error');
        assert(container.innerHTML.includes('Error'), 'Should display error message');
    });

    // Test 7: File links work
    await runAsyncTest('File links are created correctly', async () => {
        const plugin = await loadPlugin();
        
        const container = document.createElement('div'); 
        const mockContext = { sourcePath: 'test.md' };
        
        const query = 'SELECT ?subject WHERE { } LIMIT 3';
        
        await plugin.processSPARQL(query, container, mockContext);
        
        // Should create clickable links for file:// subjects
        const links = container.querySelectorAll('a');
        assert(links.length > 0, 'Should create clickable file links');
    });

    console.log(`\n📊 Test Results: ${testsPassed}/${testsRun} passed`);

    if (testsFailed > 0) {
        console.log('❌ Some SPARQL tests failed!');
        process.exit(1);
    } else {
        console.log('✅ All SPARQL functionality tests passed!');
        process.exit(0);
    }
}

main().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
});