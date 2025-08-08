#!/usr/bin/env node

/**
 * E2E Test: Plugin Loading Reproduction
 * Reproduces the plugin loading error before fixing
 */

console.log('🔍 Reproducing plugin loading error...');

try {
    // Try to load the plugin file as Node.js would
    const fs = require('fs');
    const path = require('path');
    
    const pluginPath = path.join(__dirname, 'main.js');
    const manifestPath = path.join(__dirname, 'manifest.json');
    
    console.log('📂 Checking plugin files...');
    
    // Check if files exist
    if (!fs.existsSync(pluginPath)) {
        throw new Error('main.js not found!');
    }
    
    if (!fs.existsSync(manifestPath)) {
        throw new Error('manifest.json not found!');
    }
    
    console.log('✅ Plugin files exist');
    
    // Try to parse manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ Manifest parsed:', manifest.name, 'v' + manifest.version);
    
    // Try to load main.js as module
    console.log('🔄 Attempting to load main.js...');
    
    const pluginCode = fs.readFileSync(pluginPath, 'utf8');
    
    // Check for syntax errors by trying to create Function
    new Function('module', 'exports', 'require', pluginCode);
    console.log('✅ main.js syntax is valid');
    
    // Mock Obsidian environment
    global.require = require;
    global.module = { exports: {} };
    global.exports = global.module.exports;
    
    // Mock obsidian module
    const obsidianMock = {
        Plugin: class Plugin {
            constructor() {}
            registerMarkdownCodeBlockProcessor() {}
        },
        Notice: class Notice {
            constructor(message) {
                console.log('📢 Notice:', message);
            }
        }
    };
    
    // Override require for obsidian
    const originalRequire = global.require;
    global.require = function(id) {
        if (id === 'obsidian') {
            return obsidianMock;
        }
        return originalRequire(id);
    };
    
    // Try to execute the plugin
    eval(pluginCode);
    
    // Check if plugin exported correctly
    const PluginClass = global.module.exports.default || global.module.exports;
    
    if (!PluginClass) {
        throw new Error('Plugin does not export default class!');
    }
    
    console.log('✅ Plugin class found:', PluginClass.name);
    
    // Try to instantiate plugin
    const plugin = new PluginClass();
    console.log('✅ Plugin instantiated successfully');
    
    // Check required methods
    if (typeof plugin.onload !== 'function') {
        throw new Error('Plugin missing onload() method!');
    }
    
    if (typeof plugin.onunload !== 'function') {
        throw new Error('Plugin missing onunload() method!');  
    }
    
    console.log('✅ Required methods present');
    
    console.log('🎉 Plugin loading test PASSED - no errors found');
    
} catch (error) {
    console.log('❌ REPRODUCTION SUCCESSFUL - Error found:');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    process.exit(1);
}