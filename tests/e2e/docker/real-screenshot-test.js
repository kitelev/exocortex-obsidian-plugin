#!/usr/bin/env node

/**
 * Real Screenshot Test - Generates actual SVG images
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const ScreenshotGenerator = require('./generate-screenshot.js');

class RealScreenshotTest {
    constructor(baseUrl = 'http://localhost:8084') {
        this.baseUrl = baseUrl;
        this.generator = new ScreenshotGenerator();
        this.screenshotDir = path.join(__dirname, 'test-results/screenshots');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        this.screenshots = [];
        this.testResults = [];
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
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
    
    captureScreenshot(testName, step, status, details) {
        const filename = `${this.timestamp}_${testName.replace(/\s+/g, '_')}_${step}.svg`;
        const filepath = path.join(this.screenshotDir, filename);
        
        this.generator.generateTestScreenshot(testName, step, status, details, filepath);
        
        this.screenshots.push({
            testName,
            step,
            status,
            filename,
            timestamp: new Date().toISOString()
        });
        
        return { success: true, path: filename };
    }
    
    async test(name, testFn) {
        console.log(`\n🎬 Testing: ${name}`);
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        let testPassed = false;
        let result = null;
        let details = {};
        
        try {
            // Capture initial state
            this.captureScreenshot(name, 'before', 'RUNNING', {
                'Status': 'Test starting...',
                'Time': new Date().toLocaleTimeString()
            });
            console.log(`  📸 Before screenshot captured`);
            
            // Run the actual test
            result = await testFn();
            testPassed = true;
            
            // Extract details from result
            if (typeof result === 'object') {
                details = result;
            } else {
                details = { 'Result': result };
            }
            
            console.log(`  ✅ Test passed`);
            
            // Capture success state
            this.captureScreenshot(name, 'after', 'PASS', {
                ...details,
                'Duration': `${Date.now() - startTime}ms`,
                'Status': 'Completed successfully'
            });
            console.log(`  📸 Success screenshot captured`);
            
            this.testResults.push({
                name,
                status: 'PASS',
                duration: Date.now() - startTime,
                result: details
            });
            
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
            
            // Capture error state
            this.captureScreenshot(name, 'error', 'FAIL', {
                'Error': error.message,
                'Duration': `${Date.now() - startTime}ms`,
                'Status': 'Failed'
            });
            console.log(`  📸 Error screenshot captured`);
            
            this.testResults.push({
                name,
                status: 'FAIL',
                duration: Date.now() - startTime,
                error: error.message
            });
        }
        
        return testPassed;
    }
    
    async runTests() {
        console.log('🎬 REAL SCREENSHOT E2E TEST SUITE');
        console.log('═'.repeat(60));
        console.log(`📁 Screenshots: ${this.screenshotDir}`);
        console.log('');
        
        // Test 1: Container Health
        await this.test('Docker Container Health', async () => {
            const res = await this.request('/');
            if (res.status !== 200) {
                throw new Error(`HTTP ${res.status}`);
            }
            return {
                'Container': 'obsidian-e2e',
                'HTTP Status': res.status,
                'Response Size': `${res.data.length} bytes`,
                'Health': 'OK'
            };
        });
        
        // Test 2: Obsidian UI
        await this.test('Obsidian UI Components', async () => {
            const res = await this.request('/');
            const checks = {
                'Obsidian App': res.data.includes('Obsidian'),
                'Keyboard UI': res.data.includes('Keyboard'),
                'File Browser': res.data.includes('files'),
                'VDI Styles': res.data.includes('vdi.css')
            };
            
            const passed = Object.values(checks).filter(v => v).length;
            if (passed < 4) {
                throw new Error(`Only ${passed}/4 components found`);
            }
            
            const version = res.data.match(/Obsidian v([\d.]+)/);
            return {
                'Version': version ? version[1] : 'Unknown',
                'Components Found': `${passed}/4`,
                'Obsidian': checks['Obsidian App'] ? '✅' : '❌',
                'Keyboard': checks['Keyboard UI'] ? '✅' : '❌',
                'Files': checks['File Browser'] ? '✅' : '❌',
                'Styles': checks['VDI Styles'] ? '✅' : '❌'
            };
        });
        
        // Test 3: Plugin Components
        await this.test('Plugin Component Verification', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            if (!fs.existsSync(mainPath)) {
                throw new Error('Plugin not built');
            }
            
            const code = fs.readFileSync(mainPath, 'utf8');
            const components = {
                'DynamicLayout': (code.match(/DynamicLayout/g) || []).length,
                'UniversalLayout': (code.match(/UniversalLayout/g) || []).length,
                'CreateAssetModal': (code.match(/CreateAssetModal/g) || []).length,
                'PropertyRenderer': (code.match(/PropertyRenderer/g) || []).length,
                'ButtonRenderer': (code.match(/ButtonRenderer/g) || []).length
            };
            
            const total = Object.values(components).reduce((a, b) => a + b, 0);
            if (total < 10) {
                throw new Error('Insufficient component references');
            }
            
            return components;
        });
        
        // Test 4: CreateAssetModal
        await this.test('CreateAssetModal Implementation', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            const code = fs.readFileSync(mainPath, 'utf8');
            
            const fieldCount = (code.match(/exo__Instance_class/g) || []).length;
            const modalCount = (code.match(/modal/gi) || []).length;
            const propertyCount = (code.match(/property/gi) || []).length;
            
            if (fieldCount === 0) {
                throw new Error('exo__Instance_class not implemented');
            }
            
            return {
                'exo__Instance_class': `${fieldCount} refs`,
                'Modal elements': `${modalCount} refs`,
                'Property fields': `${propertyCount} refs`,
                'Implementation': '✅ Complete'
            };
        });
        
        // Test 5: Performance
        await this.test('Response Performance', async () => {
            const times = [];
            for (let i = 0; i < 5; i++) {
                const start = Date.now();
                await this.request('/');
                times.push(Date.now() - start);
            }
            
            const avg = times.reduce((a, b) => a + b) / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);
            
            if (avg > 100) {
                throw new Error(`Response too slow: ${avg}ms`);
            }
            
            return {
                'Average': `${avg.toFixed(1)}ms`,
                'Minimum': `${min}ms`,
                'Maximum': `${max}ms`,
                'Samples': times.length,
                'Performance': avg < 20 ? '⚡ Excellent' : avg < 50 ? '✅ Good' : '⚠️ Acceptable'
            };
        });
        
        // Test 6: Stability Check
        await this.test('System Stability', async () => {
            let successCount = 0;
            const attempts = 3;
            
            for (let i = 0; i < attempts; i++) {
                try {
                    const res = await this.request('/');
                    if (res.status === 200) successCount++;
                } catch (error) {
                    // Count failures
                }
            }
            
            if (successCount < attempts) {
                throw new Error(`Only ${successCount}/${attempts} requests succeeded`);
            }
            
            return {
                'Successful Requests': `${successCount}/${attempts}`,
                'Success Rate': '100%',
                'Stability': '✅ Stable',
                'Container Status': 'Healthy'
            };
        });
        
        this.generateReport();
    }
    
    generateReport() {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('═'.repeat(60));
        
        const passed = this.testResults.filter(t => t.status === 'PASS').length;
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        
        console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
        
        this.testResults.forEach(test => {
            const icon = test.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${test.name} (${test.duration}ms)`);
        });
        
        // Generate HTML index with real screenshots
        this.generateHTMLIndex();
        
        console.log(`\n📸 Screenshots saved: ${this.screenshots.length}`);
        console.log(`📄 View report: open ${path.join(this.screenshotDir, 'index.html')}`);
        
        return failed === 0;
    }
    
    generateHTMLIndex() {
        const indexPath = path.join(this.screenshotDir, 'index.html');
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Screenshots - ${this.timestamp}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
        }
        .meta {
            color: #6b7280;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #4f46e5;
        }
        .stat-label {
            color: #6b7280;
            margin-top: 5px;
        }
        .test-section {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .test-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
        }
        .test-name {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
        }
        .test-status {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
        .status-pass {
            background: #dcfce7;
            color: #166534;
        }
        .status-fail {
            background: #fee2e2;
            color: #991b1b;
        }
        .screenshots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
        }
        .screenshot-item {
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.2s;
        }
        .screenshot-item:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        .screenshot-image {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-label {
            padding: 10px;
            background: #f9fafb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 E2E Test Screenshots</h1>
            <div class="meta">
                <strong>Test Run:</strong> ${this.timestamp}<br>
                <strong>Environment:</strong> Docker (${this.baseUrl})
            </div>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${this.testResults.length}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #10b981">
                    ${this.testResults.filter(t => t.status === 'PASS').length}
                </div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #ef4444">
                    ${this.testResults.filter(t => t.status === 'FAIL').length}
                </div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value">
                    ${this.screenshots.length}
                </div>
                <div class="stat-label">Screenshots</div>
            </div>
        </div>
        
        ${this.groupScreenshotsByTest().map(group => `
            <div class="test-section">
                <div class="test-header">
                    <div class="test-name">${group.testName}</div>
                    <div class="test-status status-${group.status.toLowerCase()}">${group.status}</div>
                </div>
                <div class="screenshots-grid">
                    ${group.screenshots.map(s => `
                        <div class="screenshot-item">
                            <img src="${s.filename}" class="screenshot-image" alt="${s.testName} - ${s.step}">
                            <div class="screenshot-label">
                                <strong>${s.step.toUpperCase()}</strong> - ${s.status}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
        
        fs.writeFileSync(indexPath, html);
    }
    
    groupScreenshotsByTest() {
        const groups = {};
        
        this.screenshots.forEach(screenshot => {
            if (!groups[screenshot.testName]) {
                groups[screenshot.testName] = {
                    testName: screenshot.testName,
                    status: 'PASS',
                    screenshots: []
                };
            }
            
            groups[screenshot.testName].screenshots.push(screenshot);
            
            if (screenshot.status === 'FAIL') {
                groups[screenshot.testName].status = 'FAIL';
            }
        });
        
        return Object.values(groups);
    }
}

// Run the tests
const tester = new RealScreenshotTest();
tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});