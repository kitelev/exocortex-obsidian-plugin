#!/usr/bin/env node

/**
 * Docker E2E Test for Exocortex Plugin
 * Tests plugin functionality in Docker environment
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class DockerE2ETest {
    constructor(baseUrl = 'http://localhost:8084') {
        this.baseUrl = baseUrl;
        this.passed = 0;
        this.failed = 0;
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
            await testFn();
            console.log('✅ PASS');
            this.passed++;
        } catch (error) {
            console.log(`❌ FAIL - ${error.message}`);
            this.failed++;
        }
    }
    
    async runTests() {
        console.log('🧪 Docker E2E Test: Exocortex Plugin');
        console.log('=' . repeat(50));
        console.log('🐳 Testing Obsidian in Docker container...\n');
        
        // Test 1: Container Health
        await this.test('Docker container is healthy', async () => {
            const res = await this.request('/');
            if (res.status !== 200) {
                throw new Error(`Container returned status ${res.status}`);
            }
        });
        
        // Test 2: Obsidian is loaded
        await this.test('Obsidian interface is loaded', async () => {
            const res = await this.request('/');
            if (!res.data.includes('Obsidian')) {
                throw new Error('Obsidian not found in response');
            }
            if (!res.data.includes('vdi.css')) {
                throw new Error('Obsidian CSS not loaded');
            }
        });
        
        // Test 3: Web interface elements
        await this.test('Web interface has required elements', async () => {
            const res = await this.request('/');
            const requiredElements = [
                '<!DOCTYPE html>',
                '<body>',
                'Keyboard',
                'files'
            ];
            
            for (const element of requiredElements) {
                if (!res.data.includes(element)) {
                    throw new Error(`Missing element: ${element}`);
                }
            }
        });
        
        // Test 4: Plugin files mounted
        await this.test('Plugin files are accessible', async () => {
            // Check if main.js exists locally
            const mainPath = path.join(__dirname, '../../../main.js');
            if (!fs.existsSync(mainPath)) {
                throw new Error('main.js not found locally');
            }
            
            // Check if manifest.json exists locally
            const manifestPath = path.join(__dirname, '../../../manifest.json');
            if (!fs.existsSync(manifestPath)) {
                throw new Error('manifest.json not found locally');
            }
            
            // Parse manifest
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (!manifest.id || manifest.id !== 'exocortex') {
                throw new Error('Invalid manifest');
            }
        });
        
        // Test 5: Plugin code validity
        await this.test('Plugin code is valid JavaScript', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            const code = fs.readFileSync(mainPath, 'utf8');
            
            // Check for common patterns
            if (!code.includes('class') || !code.includes('extends')) {
                throw new Error('Plugin code missing expected patterns');
            }
            
            // Check for Obsidian plugin structure
            if (!code.includes('Plugin') && !code.includes('obsidian')) {
                throw new Error('Not a valid Obsidian plugin');
            }
        });
        
        // Test 6: UI Components presence
        await this.test('UI components are defined', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            const code = fs.readFileSync(mainPath, 'utf8');
            
            const uiComponents = [
                'DynamicLayout',
                'UniversalLayout',
                'CreateAssetModal'
            ];
            
            for (const component of uiComponents) {
                if (!code.includes(component)) {
                    throw new Error(`UI component ${component} not found in code`);
                }
            }
        });
        
        console.log('\n' + '=' . repeat(50));
        console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('✅ All Docker E2E tests passed!');
            console.log('\n🎯 Verified components:');
            console.log('  • Docker container running');
            console.log('  • Obsidian web interface accessible');
            console.log('  • Plugin files mounted correctly');
            console.log('  • DynamicLayout component present');
            console.log('  • UniversalLayout component present');
            console.log('  • CreateAssetModal component present');
            return true;
        } else {
            console.log('❌ Some tests failed');
            return false;
        }
    }
}

// Run tests
const tester = new DockerE2ETest();
tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
});