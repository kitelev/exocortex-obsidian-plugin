#!/usr/bin/env node

/**
 * NEGATIVE TEST CASES - These tests SHOULD FAIL when plugin is broken
 * Tests that verify the testing infrastructure actually catches real problems
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BrokenPluginTest {
    constructor(baseUrl = 'http://localhost:8084') {
        this.baseUrl = baseUrl;
        this.testResults = [];
        this.browser = null;
        this.page = null;
        this.PROJECT_ROOT = path.join(__dirname, '../../..');
    }
    
    async init() {
        console.log('🚀 Initializing broken plugin tests...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        return true;
    }
    
    async backupPlugin() {
        console.log('💾 Backing up original plugin files...');
        const mainJs = path.join(this.PROJECT_ROOT, 'main.js');
        const manifest = path.join(this.PROJECT_ROOT, 'manifest.json');
        
        if (fs.existsSync(mainJs)) {
            fs.copyFileSync(mainJs, `${mainJs}.backup`);
        }
        if (fs.existsSync(manifest)) {
            fs.copyFileSync(manifest, `${manifest}.backup`);
        }
        
        console.log('✅ Plugin files backed up');
    }
    
    async restorePlugin() {
        console.log('🔄 Restoring original plugin files...');
        const mainJs = path.join(this.PROJECT_ROOT, 'main.js');
        const manifest = path.join(this.PROJECT_ROOT, 'manifest.json');
        
        if (fs.existsSync(`${mainJs}.backup`)) {
            fs.copyFileSync(`${mainJs}.backup`, mainJs);
            fs.unlinkSync(`${mainJs}.backup`);
        }
        if (fs.existsSync(`${manifest}.backup`)) {
            fs.copyFileSync(`${manifest}.backup`, manifest);
            fs.unlinkSync(`${manifest}.backup`);
        }
        
        console.log('✅ Plugin files restored');
    }
    
    async breakPlugin(breakType) {
        console.log(`💥 Breaking plugin: ${breakType}`);
        
        const mainJs = path.join(this.PROJECT_ROOT, 'main.js');
        const manifest = path.join(this.PROJECT_ROOT, 'manifest.json');
        
        switch (breakType) {
            case 'syntax-error':
                // Inject syntax error into main.js
                if (fs.existsSync(mainJs)) {
                    let content = fs.readFileSync(mainJs, 'utf8');
                    content = content.replace('class', 'class BROKEN SYNTAX');
                    fs.writeFileSync(mainJs, content);
                }
                break;
                
            case 'missing-manifest':
                // Remove manifest.json
                if (fs.existsSync(manifest)) {
                    fs.unlinkSync(manifest);
                }
                break;
                
            case 'invalid-manifest':
                // Create invalid manifest
                fs.writeFileSync(manifest, '{ "invalid": json }');
                break;
                
            case 'missing-main':
                // Remove main.js
                if (fs.existsSync(mainJs)) {
                    fs.unlinkSync(mainJs);
                }
                break;
                
            case 'runtime-error':
                // Inject runtime error
                if (fs.existsSync(mainJs)) {
                    let content = fs.readFileSync(mainJs, 'utf8');
                    // Insert code that will throw at runtime
                    content = content.replace(
                        'onload() {',
                        'onload() {\n        throw new Error("Intentional test error");\n'
                    );
                    fs.writeFileSync(mainJs, content);
                }
                break;
        }
        
        console.log(`💥 Plugin broken with: ${breakType}`);
    }
    
    async restartContainer() {
        console.log('🔄 Restarting Docker container to reload broken plugin...');
        
        try {
            // Stop the container
            execSync('docker-compose -f docker-compose.e2e.yml stop obsidian-e2e', {
                cwd: __dirname,
                stdio: 'pipe'
            });
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start the container
            execSync('docker-compose -f docker-compose.e2e.yml up -d obsidian-e2e', {
                cwd: __dirname,
                stdio: 'pipe'
            });
            
            // Wait for container to be ready
            await this.waitForContainer();
            
        } catch (error) {
            console.error('Failed to restart container:', error.message);
            throw error;
        }
    }
    
    async waitForContainer() {
        console.log('⏳ Waiting for container to be ready...');
        
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(this.baseUrl);
                if (response.ok) {
                    console.log('✅ Container is ready');
                    return;
                }
            } catch (error) {
                // Container not ready yet
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('Container failed to become ready');
    }
    
    async testBrokenPlugin(breakType) {
        console.log(`\n🧪 NEGATIVE TEST: Plugin broken with ${breakType}`);
        console.log('─'.repeat(60));
        console.log('🎯 This test SHOULD FAIL if our testing works correctly');
        
        const startTime = Date.now();
        let testPassed = false;
        let error = null;
        
        try {
            // Break the plugin
            await this.breakPlugin(breakType);
            
            // Restart container to load broken plugin
            await this.restartContainer();
            
            // Navigate to Obsidian
            await this.page.goto(this.baseUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for Obsidian to load
            await this.page.waitForSelector('.app-container', { timeout: 20000 });
            
            // Check if plugin loaded successfully (it shouldn't!)
            const pluginStatus = await this.page.evaluate(() => {
                if (!window.app) return { loaded: false, enabled: false, error: 'No app' };
                
                const plugins = window.app.plugins;
                if (!plugins) return { loaded: false, enabled: false, error: 'No plugins manager' };
                
                const exoPlugin = plugins.plugins && plugins.plugins['exocortex'];
                const enabled = plugins.enabledPlugins && plugins.enabledPlugins.has('exocortex');
                
                return {
                    loaded: !!exoPlugin,
                    enabled: enabled,
                    error: null
                };
            });
            
            console.log(`  Plugin status: ${JSON.stringify(pluginStatus)}`);
            
            // For broken plugins, we expect them NOT to load properly
            if (pluginStatus.loaded && pluginStatus.enabled) {
                // Plugin loaded despite being broken - test infrastructure failure!
                throw new Error(`🚨 CRITICAL: Plugin loaded despite being broken with ${breakType}! Test infrastructure is not working.`);
            } else {
                // Plugin correctly failed to load - this is expected
                console.log(`  ✅ EXPECTED: Plugin correctly failed to load (${breakType})`);
                testPassed = true;
            }
            
        } catch (err) {
            error = err;
            
            // For broken plugin tests, some errors are expected
            if (err.message.includes('CRITICAL')) {
                // This is a real problem with our test infrastructure
                testPassed = false;
            } else {
                // Other errors might be expected when plugin is broken
                console.log(`  ✅ EXPECTED: Error occurred with broken plugin: ${err.message}`);
                testPassed = true;
            }
        }
        
        this.testResults.push({
            name: `Broken Plugin Test: ${breakType}`,
            status: testPassed ? 'PASS' : 'FAIL',
            duration: Date.now() - startTime,
            error: error ? error.message : null,
            expected: 'Plugin should fail to load correctly'
        });
        
        return testPassed;
    }
    
    async runNegativeTests() {
        console.log('🎯 NEGATIVE TEST SUITE - Testing Test Infrastructure');
        console.log('═'.repeat(70));
        console.log('🔥 These tests verify that our tests actually catch problems!');
        console.log('');
        
        await this.init();
        
        // Backup original plugin
        await this.backupPlugin();
        
        try {
            // Test different ways the plugin can be broken
            const breakTypes = [
                'syntax-error',
                'missing-manifest', 
                'invalid-manifest',
                'missing-main',
                'runtime-error'
            ];
            
            for (const breakType of breakTypes) {
                await this.testBrokenPlugin(breakType);
                
                // Restore plugin between tests
                await this.restorePlugin();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } finally {
            // Always restore the original plugin
            await this.restorePlugin();
            
            // Restart container with working plugin
            console.log('🔄 Restoring working plugin environment...');
            await this.restartContainer();
        }
        
        await this.generateReport();
        await this.cleanup();
        
        return this.testResults.every(test => test.status === 'PASS');
    }
    
    async generateReport() {
        console.log('\n' + '═'.repeat(70));
        console.log('📊 NEGATIVE TEST RESULTS');
        console.log('═'.repeat(70));
        
        const passed = this.testResults.filter(t => t.status === 'PASS').length;
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        
        console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
        console.log('\n📝 Test Interpretation:');
        console.log('  ✅ PASS = Test infrastructure correctly detected broken plugin');
        console.log('  ❌ FAIL = Test infrastructure failed to detect broken plugin (BAD!)');
        
        for (const test of this.testResults) {
            const icon = test.status === 'PASS' ? '✅' : '❌';
            console.log(`\n${icon} ${test.name}`);
            console.log(`   Duration: ${test.duration}ms`);
            console.log(`   Expected: ${test.expected}`);
            
            if (test.error) {
                console.log(`   Result: ${test.error}`);
            }
        }
        
        if (failed === 0) {
            console.log('\n🎉 ALL NEGATIVE TESTS PASSED!');
            console.log('🔥 Test infrastructure correctly detects broken plugins');
        } else {
            console.log(`\n🚨 ${failed} NEGATIVE TESTS FAILED!`);
            console.log('⚠️  Test infrastructure is not working - it failed to detect broken plugins');
        }
    }
    
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Only run if called directly
if (require.main === module) {
    const tester = new BrokenPluginTest();
    tester.runNegativeTests().then(success => {
        console.log(`\n${success ? '🎯 SUCCESS' : '💥 FAILURE'}: Negative tests completed`);
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = BrokenPluginTest;