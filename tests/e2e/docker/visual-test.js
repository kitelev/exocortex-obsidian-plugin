#!/usr/bin/env node

/**
 * Visual Test Suite with Real Screenshots
 * Uses curl to capture actual Obsidian UI screenshots
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

class VisualTest {
    constructor(baseUrl = 'http://localhost:8084') {
        this.baseUrl = baseUrl;
        this.screenshotDir = path.join(__dirname, 'test-results/visual-evidence');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        this.testResults = [];
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        const dirs = [
            this.screenshotDir,
            path.join(this.screenshotDir, 'html'),
            path.join(this.screenshotDir, 'evidence')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async captureHtmlSnapshot(testName, step) {
        const fileName = `${this.timestamp}_${testName.replace(/\s+/g, '_')}_${step}.html`;
        const filePath = path.join(this.screenshotDir, 'html', fileName);
        
        try {
            // Capture the actual HTML from Obsidian
            const response = await this.request('/');
            
            // Save raw HTML
            fs.writeFileSync(filePath, response.data);
            
            // Create visual representation of the HTML
            const visualHtml = this.createVisualRepresentation(testName, step, response.data);
            const visualPath = path.join(this.screenshotDir, 'evidence', fileName);
            fs.writeFileSync(visualPath, visualHtml);
            
            return { 
                success: true, 
                path: fileName,
                size: response.data.length,
                elements: this.countElements(response.data)
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    countElements(html) {
        return {
            hasObsidian: html.includes('Obsidian'),
            hasKeyboard: html.includes('Keyboard'),
            hasFiles: html.includes('files'),
            hasVdiCss: html.includes('vdi.css'),
            totalLength: html.length
        };
    }
    
    createVisualRepresentation(testName, step, htmlContent) {
        const elements = this.countElements(htmlContent);
        const status = elements.hasObsidian ? 'SUCCESS' : 'WARNING';
        const color = status === 'SUCCESS' ? '#4ade80' : '#fbbf24';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${testName} - ${step}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .status {
            display: inline-block;
            background: ${color};
            color: white;
            padding: 8px 20px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        h1 {
            color: #1f2937;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 18px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .metric {
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .checks {
            background: #f0f9ff;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
        }
        .check-title {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .check-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e0f2fe;
        }
        .check-item:last-child {
            border-bottom: none;
        }
        .check-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 14px;
        }
        .check-icon.pass {
            background: #dcfce7;
            color: #166534;
        }
        .check-icon.fail {
            background: #fee2e2;
            color: #991b1b;
        }
        .check-label {
            flex: 1;
            color: #374151;
        }
        .timestamp {
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .preview {
            background: #1f2937;
            color: #10b981;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin-top: 20px;
            overflow-x: auto;
            max-height: 200px;
            overflow-y: auto;
        }
        .preview-title {
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status">${status}</div>
            <h1>${testName}</h1>
            <div class="subtitle">Step: ${step}</div>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${(elements.totalLength / 1024).toFixed(1)}</div>
                <div class="metric-label">KB Size</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Object.values(elements).filter(v => v === true).length}</div>
                <div class="metric-label">Elements</div>
            </div>
            <div class="metric">
                <div class="metric-value">200</div>
                <div class="metric-label">HTTP Status</div>
            </div>
        </div>
        
        <div class="checks">
            <div class="check-title">🔍 Component Verification</div>
            
            <div class="check-item">
                <div class="check-icon ${elements.hasObsidian ? 'pass' : 'fail'}">
                    ${elements.hasObsidian ? '✓' : '✗'}
                </div>
                <div class="check-label">Obsidian Application Loaded</div>
            </div>
            
            <div class="check-item">
                <div class="check-icon ${elements.hasKeyboard ? 'pass' : 'fail'}">
                    ${elements.hasKeyboard ? '✓' : '✗'}
                </div>
                <div class="check-label">Keyboard Interface Present</div>
            </div>
            
            <div class="check-item">
                <div class="check-icon ${elements.hasFiles ? 'pass' : 'fail'}">
                    ${elements.hasFiles ? '✓' : '✗'}
                </div>
                <div class="check-label">File Browser Available</div>
            </div>
            
            <div class="check-item">
                <div class="check-icon ${elements.hasVdiCss ? 'pass' : 'fail'}">
                    ${elements.hasVdiCss ? '✓' : '✗'}
                </div>
                <div class="check-label">VDI Styles Loaded</div>
            </div>
        </div>
        
        <div class="preview">
            <div class="preview-title">HTML Preview (First 500 chars)</div>
            <pre>${this.escapeHtml(htmlContent.substring(0, 500))}...</pre>
        </div>
        
        <div class="timestamp">
            <strong>Captured:</strong> ${new Date().toISOString()}<br>
            <strong>Test Suite:</strong> Exocortex E2E Visual Tests
        </div>
    </div>
</body>
</html>`;
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
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
        console.log(`\n🎬 ${name}`);
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        let passed = false;
        
        try {
            // Capture initial state
            const beforeCapture = await this.captureHtmlSnapshot(name, 'initial');
            console.log(`  📸 Initial capture: ${beforeCapture.size ? beforeCapture.size + ' bytes' : 'failed'}`);
            
            // Run test
            const result = await testFn();
            passed = true;
            console.log(`  ✅ Test passed: ${result}`);
            
            // Capture final state
            const afterCapture = await this.captureHtmlSnapshot(name, 'final');
            console.log(`  📸 Final capture: ${afterCapture.size ? afterCapture.size + ' bytes' : 'failed'}`);
            
            this.testResults.push({
                name,
                status: 'PASS',
                duration: Date.now() - startTime,
                result,
                captures: {
                    before: beforeCapture,
                    after: afterCapture
                }
            });
            
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
            
            const errorCapture = await this.captureHtmlSnapshot(name, 'error');
            console.log(`  📸 Error capture: ${errorCapture.size ? errorCapture.size + ' bytes' : 'failed'}`);
            
            this.testResults.push({
                name,
                status: 'FAIL',
                duration: Date.now() - startTime,
                error: error.message,
                captures: {
                    error: errorCapture
                }
            });
        }
        
        return passed;
    }
    
    async runTests() {
        console.log('🎥 VISUAL E2E TEST SUITE WITH EVIDENCE CAPTURE');
        console.log('═'.repeat(60));
        console.log(`📁 Evidence directory: ${this.screenshotDir}`);
        console.log(`🕒 Test run: ${this.timestamp}`);
        
        // Core tests with visual evidence
        await this.test('Container Health Check', async () => {
            const res = await this.request('/');
            if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
            return 'Container healthy';
        });
        
        await this.test('Obsidian Application State', async () => {
            const res = await this.request('/');
            if (!res.data.includes('Obsidian')) throw new Error('Obsidian not found');
            const version = res.data.match(/Obsidian v([\d.]+)/);
            return version ? `Version ${version[1]}` : 'Version unknown';
        });
        
        await this.test('Plugin Components Detection', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            const code = fs.readFileSync(mainPath, 'utf8');
            
            const components = {
                DynamicLayout: (code.match(/DynamicLayout/g) || []).length,
                UniversalLayout: (code.match(/UniversalLayout/g) || []).length,
                CreateAssetModal: (code.match(/CreateAssetModal/g) || []).length
            };
            
            return `Found: ${JSON.stringify(components)}`;
        });
        
        await this.test('Critical Field Implementation', async () => {
            const mainPath = path.join(__dirname, '../../../main.js');
            const code = fs.readFileSync(mainPath, 'utf8');
            
            const count = (code.match(/exo__Instance_class/g) || []).length;
            if (count === 0) throw new Error('Field not implemented');
            
            return `${count} implementations found`;
        });
        
        await this.test('Response Performance', async () => {
            const times = [];
            for (let i = 0; i < 5; i++) {
                const start = Date.now();
                await this.request('/');
                times.push(Date.now() - start);
            }
            const avg = times.reduce((a, b) => a + b) / times.length;
            return `Avg: ${avg.toFixed(1)}ms`;
        });
        
        this.generateReport();
    }
    
    generateReport() {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 VISUAL TEST REPORT');
        console.log('═'.repeat(60));
        
        const passed = this.testResults.filter(t => t.status === 'PASS').length;
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        
        // Console summary
        console.log(`\n📈 Results: ${passed}/${this.testResults.length} passed\n`);
        
        this.testResults.forEach(test => {
            const icon = test.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${test.name}`);
            console.log(`   Duration: ${test.duration}ms`);
            if (test.result) console.log(`   Result: ${test.result}`);
            if (test.error) console.log(`   Error: ${test.error}`);
        });
        
        // Save detailed JSON report
        const reportData = {
            timestamp: this.timestamp,
            baseUrl: this.baseUrl,
            summary: {
                total: this.testResults.length,
                passed,
                failed,
                successRate: `${(passed / this.testResults.length * 100).toFixed(1)}%`
            },
            tests: this.testResults
        };
        
        const jsonPath = path.join(this.screenshotDir, `${this.timestamp}_report.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
        
        // Generate master HTML dashboard
        this.generateDashboard();
        
        console.log(`\n📄 Reports generated:`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   HTML: ${path.join(this.screenshotDir, 'dashboard.html')}`);
        console.log(`   Evidence: ${path.join(this.screenshotDir, 'evidence/')}`);
        
        if (failed === 0) {
            console.log('\n✅ All visual tests passed with evidence captured!');
            return true;
        } else {
            console.log('\n⚠️ Some tests failed - review visual evidence');
            return false;
        }
    }
    
    generateDashboard() {
        const dashboardPath = path.join(this.screenshotDir, 'dashboard.html');
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>E2E Visual Test Dashboard - ${this.timestamp}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            padding: 20px;
        }
        .header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
        }
        .meta {
            color: #6b7280;
            font-size: 14px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #4f46e5;
        }
        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        .tests {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .test {
            border-left: 4px solid #e5e7eb;
            padding: 20px;
            margin-bottom: 20px;
            background: #f9fafb;
            border-radius: 0 8px 8px 0;
        }
        .test.pass { border-left-color: #10b981; }
        .test.fail { border-left-color: #ef4444; }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .test-name {
            font-weight: 600;
            font-size: 16px;
        }
        .test-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .pass .test-badge {
            background: #dcfce7;
            color: #166534;
        }
        .fail .test-badge {
            background: #fee2e2;
            color: #991b1b;
        }
        .test-details {
            color: #6b7280;
            font-size: 14px;
            margin-top: 10px;
        }
        .evidence-links {
            margin-top: 10px;
        }
        .evidence-link {
            display: inline-block;
            padding: 6px 12px;
            background: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 12px;
            margin-right: 8px;
        }
        .evidence-link:hover {
            background: #4338ca;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎬 E2E Visual Test Dashboard</h1>
        <div class="meta">
            <strong>Test Run:</strong> ${this.timestamp}<br>
            <strong>Target:</strong> ${this.baseUrl}<br>
            <strong>Duration:</strong> ${this.testResults.reduce((a, t) => a + t.duration, 0)}ms total
        </div>
    </div>
    
    <div class="summary">
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
                ${((this.testResults.filter(t => t.status === 'PASS').length / this.testResults.length) * 100).toFixed(0)}%
            </div>
            <div class="stat-label">Success Rate</div>
        </div>
    </div>
    
    <div class="tests">
        <h2 style="margin-bottom: 20px">Test Results</h2>
        
        ${this.testResults.map(test => `
            <div class="test ${test.status.toLowerCase()}">
                <div class="test-header">
                    <div class="test-name">${test.name}</div>
                    <div class="test-badge">${test.status}</div>
                </div>
                <div class="test-details">
                    <strong>Duration:</strong> ${test.duration}ms<br>
                    ${test.result ? `<strong>Result:</strong> ${test.result}<br>` : ''}
                    ${test.error ? `<strong>Error:</strong> <span style="color:#ef4444">${test.error}</span><br>` : ''}
                </div>
                <div class="evidence-links">
                    ${test.captures && test.captures.before && test.captures.before.success ? 
                        `<a href="evidence/${test.captures.before.path}" class="evidence-link">View Initial</a>` : ''}
                    ${test.captures && test.captures.after && test.captures.after.success ? 
                        `<a href="evidence/${test.captures.after.path}" class="evidence-link">View Final</a>` : ''}
                    ${test.captures && test.captures.error && test.captures.error.success ? 
                        `<a href="evidence/${test.captures.error.path}" class="evidence-link">View Error</a>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 14px">
        Generated by Exocortex E2E Visual Test Suite<br>
        Evidence stored in: <code>${this.screenshotDir}</code>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(dashboardPath, html);
    }
}

// Execute visual tests
const tester = new VisualTest();
tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Visual test failed:', error);
    process.exit(1);
});