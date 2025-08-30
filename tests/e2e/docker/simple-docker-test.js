#!/usr/bin/env node

/**
 * Simple Docker E2E Test for Obsidian
 * Tests that Obsidian is running in Docker and accessible
 */

const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
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

async function runTests() {
    console.log('🧪 Docker E2E Test: Obsidian Container');
    console.log('=' . repeat(40));
    
    const tests = [
        {
            name: 'Container responds to HTTP requests',
            test: async () => {
                const res = await makeRequest('http://localhost:8080');
                if (res.status !== 200) {
                    throw new Error(`Expected status 200, got ${res.status}`);
                }
            }
        },
        {
            name: 'Obsidian web interface is loaded',
            test: async () => {
                const res = await makeRequest('http://localhost:8080');
                if (!res.data.includes('Obsidian')) {
                    throw new Error('Obsidian not found in response');
                }
            }
        },
        {
            name: 'Web interface includes required elements',
            test: async () => {
                const res = await makeRequest('http://localhost:8080');
                const requiredElements = ['<!DOCTYPE html>', 'vdi.css', 'Keyboard'];
                for (const element of requiredElements) {
                    if (!res.data.includes(element)) {
                        throw new Error(`Required element "${element}" not found`);
                    }
                }
            }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of tests) {
        try {
            await test();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    console.log('=' . repeat(40));
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    
    return failed === 0;
}

// Run tests
runTests().then(success => {
    if (success) {
        console.log('✅ All Docker tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some Docker tests failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
});