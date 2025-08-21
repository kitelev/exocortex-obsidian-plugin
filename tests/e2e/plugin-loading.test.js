#!/usr/bin/env node

/**
 * E2E Test: Plugin Loading
 * Tests that plugin loads correctly in a simulated Obsidian environment
 */

const fs = require('fs');
const path = require('path');

// Check CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Handle missing dependencies gracefully in CI
if (isCI) {
  console.log('🔧 Running in CI environment - enabling CI optimizations');
}

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
        
        addCommand(command) {
            console.log(`    📝 Registered command: ${command.id}`);
        }
        
        addRibbonIcon(icon, title, callback) {
            console.log(`    🎯 Registered ribbon icon: ${title}`);
        }
        
        registerEvent(event) {
            console.log(`    📌 Registered event listener`);
        }
        
        registerMarkdownCodeBlockProcessor(language, processor) {
            console.log(`    📝 Registered processor for '${language}' blocks`);
            this.codeBlockProcessor = processor;
        }
        
        addSettingTab(tab) {
            console.log(`    ⚙️ Registered settings tab`);
            this.settingTab = tab;
        }
        
        async loadData() {
            console.log(`    💾 Loading plugin data`);
            return {};
        }
        
        async saveData(data) {
            console.log(`    💾 Saving plugin data`);
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
    },
    
    TFile: class TFile {
        constructor(path) {
            this.path = path;
            this.basename = path ? path.split('/').pop().replace(/\.[^/.]+$/, '') : '';
            this.extension = path ? path.split('.').pop() : '';
        }
    },
    
    Modal: class Modal {
        constructor(app) {
            this.app = app;
        }
        open() {}
        close() {}
    },
    
    PluginSettingTab: class PluginSettingTab {
        constructor(app, plugin) {
            this.app = app;
            this.plugin = plugin;
        }
        display() {}
        hide() {}
    }
};

// Mock Obsidian App
const AppMock = {
    vault: {
        getMarkdownFiles() {
            return [
                { 
                    basename: 'test-file',
                    path: 'test-file.md',
                    extension: 'md'
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
        },
        
        on(event, callback) {
            console.log(`    📎 Vault event registered: ${event}`);
            return { event, callback };
        },
        
        adapter: {
            read: () => Promise.reject(new Error('File not found')),
            write: () => Promise.resolve(),
            exists: () => Promise.resolve(false)
        }
    },
    
    workspace: {
        openLinkText(linkText, sourcePath) {
            console.log(`    🔗 Opening link: ${linkText}`);
        },
        
        getActiveFile() {
            return null;
        }
    },
    
    metadataCache: {
        getFileCache(file) {
            return {
                frontmatter: {
                    'exo__Asset_uid': 'test-uid',
                    'exo__Asset_label': 'Test Asset',
                    'exo__Instance_class': '[[exo__Class]]'
                }
            };
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