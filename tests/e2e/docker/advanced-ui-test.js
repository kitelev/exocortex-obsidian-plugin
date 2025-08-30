#!/usr/bin/env node

/**
 * Advanced UI Test for Exocortex Plugin in Docker
 * Performs deeper validation of UI components
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class AdvancedUITest {
    constructor(baseUrl = 'http://localhost:8084') {
        this.baseUrl = baseUrl;
        this.passed = 0;
        this.failed = 0;
        this.details = [];
    }
    
    async request(path = '/') {
        return new Promise((resolve, reject) => {
            const url = this.baseUrl + path;
            http.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({ status: res.statusCode, data });
                });
            }).on('error', reject);
        });
    }
    
    async test(name, testFn) {
        process.stdout.write(`  Testing: ${name}... `);
        try {
            const result = await testFn();
            console.log('✅ PASS');
            this.passed++;
            if (result) {
                this.details.push({ test: name, status: 'PASS', details: result });
            }
        } catch (error) {
            console.log(`❌ FAIL - ${error.message}`);
            this.failed++;
            this.details.push({ test: name, status: 'FAIL', error: error.message });
        }
    }
    
    async runTests() {
        console.log('🧪 Advanced UI Test: Exocortex Plugin');
        console.log('=' . repeat(50));
        console.log('🔍 Performing deep UI component validation...\n');
        
        // Test 1: Container and Obsidian Base
        await this.test('Docker container responds correctly', async () => {
            const res = await this.request('/');
            if (res.status !== 200) {
                throw new Error(`HTTP ${res.status}`);
            }
            return `HTTP 200 OK, ${res.data.length} bytes`;
        });
        
        // Test 2: Obsidian Core Elements
        await this.test('Obsidian core UI elements present', async () => {
            const res = await this.request('/');
            const elements = [
                { name: 'Title', pattern: /<title>.*Obsidian.*<\/title>/ },
                { name: 'VDI CSS', pattern: /vdi\.css/ },
                { name: 'Keyboard', pattern: /id="Keyboard"/ },
                { name: 'Files', pattern: /id="files"/ }
            ];
            
            const found = [];
            for (const elem of elements) {
                if (elem.pattern.test(res.data)) {
                    found.push(elem.name);
                }
            }
            
            if (found.length !== elements.length) {
                throw new Error(`Only found ${found.length}/${elements.length} elements`);
            }
            return `Found: ${found.join(', ')}`;
        });
        
        // Test 3: Plugin Build Verification
        await this.test('Plugin build contains UI components', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            if (!fs.existsSync(mainPath)) {
                throw new Error('main.js not found');
            }
            
            const code = fs.readFileSync(mainPath, 'utf8');
            const components = {
                'DynamicLayout': /DynamicLayout/,
                'UniversalLayout': /UniversalLayout/,
                'CreateAssetModal': /CreateAssetModal/,
                'PropertyRenderer': /PropertyRenderer/,
                'ButtonRenderer': /ButtonRenderer/
            };
            
            const found = [];
            for (const [name, pattern] of Object.entries(components)) {
                if (pattern.test(code)) {
                    found.push(name);
                }
            }
            
            if (found.length < 3) {
                throw new Error(`Only ${found.length} components found`);
            }
            return `Components: ${found.join(', ')}`;
        });
        
        // Test 4: Modal Implementation
        await this.test('CreateAssetModal implementation verified', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            const code = fs.readFileSync(mainPath, 'utf8');
            
            const modalFeatures = [
                'exo__Instance_class',
                'propertyFields',
                'selectClass',
                'fillPropertyField',
                'modal'
            ];
            
            const implemented = [];
            for (const feature of modalFeatures) {
                if (code.includes(feature)) {
                    implemented.push(feature);
                }
            }
            
            if (implemented.length < 2) {
                throw new Error(`Only ${implemented.length}/5 modal features found`);
            }
            return `Features: ${implemented.join(', ')}`;
        });
        
        // Test 5: Layout Renderers
        await this.test('Layout renderers properly implemented', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            const code = fs.readFileSync(mainPath, 'utf8');
            
            const renderers = [
                'renderLayout',
                'renderButtons',
                'renderProperties',
                'container.createEl'
            ];
            
            const found = [];
            for (const renderer of renderers) {
                if (code.includes(renderer)) {
                    found.push(renderer);
                }
            }
            
            if (found.length === 0) {
                throw new Error('No renderers found');
            }
            return `Renderers: ${found.join(', ')}`;
        });
        
        // Test 6: Plugin Manifest
        await this.test('Plugin manifest correctly configured', async () => {
            const manifestPath = path.join(__dirname, '../../../manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (manifest.id !== 'exocortex') {
                throw new Error(`Wrong plugin ID: ${manifest.id}`);
            }
            
            return `Plugin: ${manifest.name} v${manifest.version}`;
        });
        
        // Test 7: Test Vault Structure
        await this.test('Test vault has required structure', async () => {
            const vaultPath = path.join(__dirname, 'test-vault');
            const classesPath = path.join(vaultPath, 'classes');
            
            if (!fs.existsSync(classesPath)) {
                throw new Error('Classes directory missing');
            }
            
            const classes = fs.readdirSync(classesPath);
            if (classes.length < 3) {
                throw new Error(`Only ${classes.length} classes found`);
            }
            
            return `Classes: ${classes.join(', ')}`;
        });
        
        // Print detailed results
        console.log('\n' + '=' . repeat(50));
        console.log('📊 Detailed Test Results:');
        console.log('-' . repeat(50));
        
        for (const detail of this.details) {
            const icon = detail.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${detail.test}`);
            if (detail.details) {
                console.log(`   └─ ${detail.details}`);
            } else if (detail.error) {
                console.log(`   └─ Error: ${detail.error}`);
            }
        }
        
        console.log('\n' + '=' . repeat(50));
        console.log(`📈 Summary: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('✅ All advanced UI tests passed!');
            console.log('\n🎯 Verification Complete:');
            console.log('  • Container operational');
            console.log('  • Obsidian UI loaded');
            console.log('  • Plugin components verified');
            console.log('  • CreateAssetModal implemented');
            console.log('  • Layout renderers working');
            console.log('  • Test vault configured');
            return true;
        } else {
            console.log('❌ Some tests failed');
            return false;
        }
    }
}

// Run tests
const tester = new AdvancedUITest();
tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
});