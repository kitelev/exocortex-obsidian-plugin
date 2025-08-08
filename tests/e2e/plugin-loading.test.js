#!/usr/bin/env node

/**
 * E2E Test: Plugin Loading
 * Tests that plugin loads correctly in a simulated Obsidian environment
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 E2E Test: Plugin Loading');

// Test configuration
const PLUGIN_DIR = path.resolve(__dirname, '../..');
const MAIN_JS_PATH = path.join(PLUGIN_DIR, 'main.js');
const MANIFEST_PATH = path.join(PLUGIN_DIR, 'manifest.json');

// Test results tracker
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function runTest(name, testFn) {
    testsRun++;
    process.stdout.write(`  ${name}... `);
    
    try {
        testFn();
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

// Mock Obsidian API
const ObsidianMock = {
    Plugin: class Plugin {
        constructor(app, manifest) {
            this.app = app;
            this.manifest = manifest;
        }
        
        registerMarkdownCodeBlockProcessor(language, processor) {
            console.log(`    📝 Registered processor for '${language}' blocks`);
            this.codeBlockProcessor = processor;
        }
        
        async onload() {
            // Override in actual plugin
        }
        
        async onunload() {
            // Override in actual plugin
        }
    },
    
    Notice: class Notice {
        constructor(message, timeout) {
            console.log(`    📢 Notice: ${message}`);
            this.message = message;
            this.timeout = timeout;
        }
    }
};

// Mock Obsidian App
const AppMock = {
    vault: {
        getMarkdownFiles() {
            return [
                { 
                    basename: 'test-file',
                    path: 'test-file.md'
                }
            ];
        },
        
        async read(file) {
            return `---
exo__Asset_uid: test-uid
exo__Asset_label: Test Asset  
exo__Instance_class: "[[exo__Class]]"
---

# Test File`;
        }
    },
    
    workspace: {
        openLinkText(linkText, sourcePath) {
            console.log(`    🔗 Opening link: ${linkText}`);
        }
    }
};

console.log('\n🔍 Running Plugin Loading Tests...\n');

// Test 1: Files exist
runTest('Plugin files exist', () => {
    assert(fs.existsSync(MAIN_JS_PATH), 'main.js not found');
    assert(fs.existsSync(MANIFEST_PATH), 'manifest.json not found');
});

// Test 2: Manifest is valid
runTest('Manifest is valid JSON', () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    assert(manifest.id, 'Manifest missing id');
    assert(manifest.name, 'Manifest missing name');
    assert(manifest.version, 'Manifest missing version');
    assert(manifest.minAppVersion, 'Manifest missing minAppVersion');
});

// Test 3: Plugin code is syntactically valid
runTest('Plugin code is syntactically valid', () => {
    const pluginCode = fs.readFileSync(MAIN_JS_PATH, 'utf8');
    // Try to create function to check syntax
    new Function('module', 'exports', 'require', pluginCode);
});

// Test 4: Plugin exports properly
runTest('Plugin exports default class', () => {
    // Setup module system
    const moduleExports = {};
    const module = { exports: moduleExports };
    
    // Mock require function
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
    
    // Check export
    const PluginClass = module.exports.default || module.exports;
    assert(PluginClass, 'Plugin does not export default class');
    assert(typeof PluginClass === 'function', 'Export is not a constructor function');
});

// Test 5: Plugin instantiates correctly
runTest('Plugin instantiates without errors', () => {
    // Setup module system
    const moduleExports = {};
    const module = { exports: moduleExports };
    
    function mockRequire(id) {
        if (id === 'obsidian') {
            return ObsidianMock;
        }
        throw new Error(`Module not mocked: ${id}`);
    }
    
    // Load and instantiate plugin
    const pluginCode = fs.readFileSync(MAIN_JS_PATH, 'utf8');
    const pluginFn = new Function('module', 'exports', 'require', pluginCode);
    pluginFn(module, moduleExports, mockRequire);
    
    const PluginClass = module.exports.default || module.exports;
    const plugin = new PluginClass(AppMock, {});
    
    assert(plugin, 'Plugin instantiation failed');
    assert(typeof plugin.onload === 'function', 'Plugin missing onload method');
    assert(typeof plugin.onunload === 'function', 'Plugin missing onunload method');
});

// Test 6: Plugin onload works
runTest('Plugin onload executes without errors', async () => {
    // Setup module system
    const moduleExports = {};
    const module = { exports: moduleExports };
    
    function mockRequire(id) {
        if (id === 'obsidian') {
            return ObsidianMock;
        }
        throw new Error(`Module not mocked: ${id}`);
    }
    
    // Load and test onload
    const pluginCode = fs.readFileSync(MAIN_JS_PATH, 'utf8');
    const pluginFn = new Function('module', 'exports', 'require', pluginCode);
    pluginFn(module, moduleExports, mockRequire);
    
    const PluginClass = module.exports.default || module.exports;
    const plugin = new PluginClass(AppMock, {});
    
    // Execute onload
    await plugin.onload();
    
    assert(plugin.codeBlockProcessor, 'SPARQL code block processor not registered');
});

console.log(`\n📊 Test Results: ${testsPassed}/${testsRun} passed`);

if (testsFailed > 0) {
    console.log('❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('✅ All plugin loading tests passed!');
    process.exit(0);
}