#!/usr/bin/env node

/**
 * Real Obsidian Screenshot Test
 * Captures actual screenshots from the Obsidian Docker container
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ObsidianScreenshotTest {
    constructor(baseUrl = 'http://localhost:8084') {
        this.baseUrl = baseUrl;
        this.screenshotDir = path.join(__dirname, 'test-results', 'obsidian-screenshots');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.screenshots = [];
        
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }
    
    async init() {
        console.log('🚀 Launching Puppeteer...');
        
        try {
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
            
            console.log('✅ Puppeteer initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Puppeteer:', error.message);
            return false;
        }
    }
    
    async navigateToObsidian() {
        try {
            console.log(`📍 Navigating to ${this.baseUrl}...`);
            
            // First check if the container is responding
            const isAlive = await this.checkContainer();
            if (!isAlive) {
                throw new Error('Container not responding');
            }
            
            await this.page.goto(this.baseUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait a bit for any dynamic content
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('✅ Successfully loaded Obsidian');
            return true;
        } catch (error) {
            console.error('❌ Failed to navigate:', error.message);
            return false;
        }
    }
    
    async checkContainer() {
        return new Promise((resolve) => {
            http.get(this.baseUrl, (res) => {
                resolve(res.statusCode === 200);
            }).on('error', () => {
                resolve(false);
            });
        });
    }
    
    async captureScreenshot(testName, step) {
        if (!this.page) {
            console.log('⚠️ Page not initialized, skipping screenshot');
            return null;
        }
        
        const filename = `${this.timestamp}_${testName.replace(/\s+/g, '_')}_${step}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        try {
            // Add overlay with test information
            await this.addTestOverlay(testName, step);
            
            // Capture the screenshot
            await this.page.screenshot({
                path: filepath,
                fullPage: false,
                type: 'png'
            });
            
            // Remove overlay
            await this.removeTestOverlay();
            
            console.log(`  📸 Screenshot saved: ${filename}`);
            
            this.screenshots.push({
                testName,
                step,
                filename,
                timestamp: new Date().toISOString()
            });
            
            return filename;
        } catch (error) {
            console.error(`  ❌ Screenshot failed: ${error.message}`);
            return null;
        }
    }
    
    async addTestOverlay(testName, step) {
        try {
            await this.page.evaluate((name, step, timestamp) => {
                // Create overlay element
                const overlay = document.createElement('div');
                overlay.id = 'test-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 300px;
                `;
                
                overlay.innerHTML = `
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                        📸 E2E Test
                    </div>
                    <div style="font-size: 14px; opacity: 0.95;">
                        <strong>Test:</strong> ${name}<br>
                        <strong>Step:</strong> ${step}<br>
                        <strong>Time:</strong> ${timestamp}
                    </div>
                `;
                
                document.body.appendChild(overlay);
            }, testName, step, new Date().toLocaleTimeString());
        } catch (error) {
            // Overlay failed, but continue with screenshot
        }
    }
    
    async removeTestOverlay() {
        try {
            await this.page.evaluate(() => {
                const overlay = document.getElementById('test-overlay');
                if (overlay) {
                    overlay.remove();
                }
            });
        } catch (error) {
            // Ignore overlay removal errors
        }
    }
    
    async test(name, testFn) {
        console.log(`\n🧪 Testing: ${name}`);
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        let passed = false;
        
        try {
            // Capture initial state
            await this.captureScreenshot(name, 'initial');
            
            // Run the test
            const result = await testFn(this.page);
            passed = true;
            
            console.log(`  ✅ Test passed${result ? ': ' + result : ''}`);
            
            // Capture final state
            await this.captureScreenshot(name, 'final');
            
            this.testResults.push({
                name,
                status: 'PASS',
                duration: Date.now() - startTime,
                result
            });
            
        } catch (error) {
            console.log(`  ❌ Test failed: ${error.message}`);
            
            // Capture error state
            await this.captureScreenshot(name, 'error');
            
            this.testResults.push({
                name,
                status: 'FAIL',
                duration: Date.now() - startTime,
                error: error.message
            });
        }
        
        return passed;
    }
    
    async runTests() {
        console.log('🎬 OBSIDIAN SCREENSHOT E2E TEST SUITE');
        console.log('═'.repeat(60));
        console.log(`📁 Screenshots: ${this.screenshotDir}`);
        console.log(`🌐 Target: ${this.baseUrl}`);
        console.log('');
        
        // Initialize browser
        if (!await this.init()) {
            console.error('Failed to initialize browser');
            return false;
        }
        
        // Navigate to Obsidian
        if (!await this.navigateToObsidian()) {
            console.error('Failed to navigate to Obsidian');
            await this.cleanup();
            return false;
        }
        
        // Capture initial Obsidian state
        await this.captureScreenshot('Obsidian_Initial_Load', 'startup');
        
        // Test 1: Verify Obsidian UI Elements
        await this.test('Obsidian UI Elements', async (page) => {
            const elements = await page.evaluate(() => {
                const results = {
                    title: document.title,
                    hasKeyboard: !!document.querySelector('#Keyboard'),
                    hasFiles: !!document.querySelector('#files'),
                    hasBody: !!document.body,
                    bodyClasses: document.body.className
                };
                return results;
            });
            
            if (!elements.hasKeyboard) throw new Error('Keyboard element not found');
            if (!elements.hasFiles) throw new Error('Files element not found');
            
            return `Title: ${elements.title}`;
        });
        
        // Test 2: Check Viewport and Layout
        await this.test('Viewport and Layout', async (page) => {
            const dimensions = await page.evaluate(() => {
                return {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    devicePixelRatio: window.devicePixelRatio
                };
            });
            
            if (dimensions.width < 800) throw new Error('Viewport too small');
            
            return `${dimensions.width}x${dimensions.height}`;
        });
        
        // Test 3: Plugin Verification (check if our plugin affects the DOM)
        await this.test('Plugin Integration Check', async (page) => {
            // Check for any Exocortex-specific elements or classes
            const pluginElements = await page.evaluate(() => {
                // Look for any elements that might be from our plugin
                const exocortexElements = document.querySelectorAll('[class*="exocortex"]');
                const customElements = document.querySelectorAll('[class*="dynamic-layout"], [class*="universal-layout"]');
                
                return {
                    exocortexCount: exocortexElements.length,
                    customCount: customElements.length,
                    hasPlugin: exocortexElements.length > 0 || customElements.length > 0
                };
            });
            
            return `Plugin elements: ${pluginElements.exocortexCount + pluginElements.customCount}`;
        });
        
        // Test 4: Interactive Elements
        await this.test('Interactive Elements', async (page) => {
            // Try to interact with the keyboard toggle
            const keyboardVisible = await page.evaluate(() => {
                const keyboard = document.querySelector('#Keyboard');
                if (keyboard) {
                    const display = window.getComputedStyle(keyboard).display;
                    return display !== 'none';
                }
                return false;
            });
            
            // Try to toggle the keyboard
            if (keyboardVisible) {
                await page.evaluate(() => {
                    const closeBtn = document.querySelector('#keyboardClose');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                });
                
                // Wait a moment for animation
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Capture state after interaction
                await this.captureScreenshot('Interactive_Elements', 'after_interaction');
            }
            
            return `Keyboard interactive: ${keyboardVisible}`;
        });
        
        // Test 5: Performance Check
        await this.test('Performance Metrics', async (page) => {
            const metrics = await page.metrics();
            const performance = await page.evaluate(() => {
                const perf = window.performance;
                if (perf && perf.timing) {
                    const timing = perf.timing;
                    return {
                        loadTime: timing.loadEventEnd - timing.navigationStart,
                        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                        firstPaint: perf.getEntriesByType('paint')[0]?.startTime || 0
                    };
                }
                return null;
            });
            
            return `Load time: ${performance?.loadTime || 'N/A'}ms`;
        });
        
        // Final screenshot
        await this.captureScreenshot('Obsidian_Final_State', 'complete');
        
        await this.cleanup();
        this.generateReport();
        
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        return failed === 0;
    }
    
    async cleanup() {
        if (this.browser) {
            console.log('\n🧹 Closing browser...');
            await this.browser.close();
        }
    }
    
    generateReport() {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 TEST RESULTS');
        console.log('═'.repeat(60));
        
        const passed = this.testResults.filter(t => t.status === 'PASS').length;
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        
        console.log(`\nTotal: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}\n`);
        
        this.testResults.forEach(test => {
            const icon = test.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${test.name} (${test.duration}ms)`);
            if (test.result) console.log(`   Result: ${test.result}`);
            if (test.error) console.log(`   Error: ${test.error}`);
        });
        
        // Generate HTML gallery
        this.generateHTMLGallery();
        
        console.log(`\n📸 Screenshots captured: ${this.screenshots.length}`);
        console.log(`📄 View gallery: open ${path.join(this.screenshotDir, 'index.html')}`);
    }
    
    generateHTMLGallery() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Obsidian Screenshot Gallery - ${this.timestamp}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            padding: 40px 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        h1 {
            font-size: 36px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .meta {
            color: #8b949e;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
            gap: 30px;
        }
        .screenshot-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .screenshot-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.4);
            border-color: #58a6ff;
        }
        .screenshot-header {
            padding: 15px 20px;
            background: #1c2128;
            border-bottom: 1px solid #30363d;
        }
        .test-name {
            font-weight: 600;
            font-size: 18px;
            color: #f0f6fc;
        }
        .test-step {
            color: #8b949e;
            font-size: 14px;
            margin-top: 5px;
        }
        .screenshot-container {
            position: relative;
            background: #0d1117;
            padding: 10px;
        }
        .screenshot-img {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 4px;
        }
        .timestamp {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: #8b949e;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .status-pass {
            background: #238636;
            color: #ffffff;
        }
        .status-fail {
            background: #da3633;
            color: #ffffff;
        }
        .filter-bar {
            text-align: center;
            margin-bottom: 30px;
        }
        .filter-btn {
            background: #21262d;
            color: #c9d1d9;
            border: 1px solid #30363d;
            padding: 8px 16px;
            margin: 0 5px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .filter-btn:hover {
            background: #30363d;
            border-color: #58a6ff;
        }
        .filter-btn.active {
            background: #58a6ff;
            color: #0d1117;
            border-color: #58a6ff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 Obsidian Screenshot Gallery</h1>
            <div class="meta">
                <strong>Test Run:</strong> ${this.timestamp} | 
                <strong>Total Screenshots:</strong> ${this.screenshots.length} | 
                <strong>Target:</strong> ${this.baseUrl}
            </div>
        </div>
        
        <div class="filter-bar">
            <button class="filter-btn active" onclick="filterScreenshots('all')">All Screenshots</button>
            <button class="filter-btn" onclick="filterScreenshots('initial')">Initial States</button>
            <button class="filter-btn" onclick="filterScreenshots('final')">Final States</button>
        </div>
        
        <div class="gallery" id="gallery">
            ${this.screenshots.map(s => `
                <div class="screenshot-card" data-step="${s.step}">
                    <div class="screenshot-header">
                        <div class="test-name">
                            ${s.testName}
                            ${this.getStatusBadge(s.testName)}
                        </div>
                        <div class="test-step">Step: ${s.step}</div>
                    </div>
                    <div class="screenshot-container">
                        <img src="${s.filename}" alt="${s.testName} - ${s.step}" class="screenshot-img">
                        <div class="timestamp">${new Date(s.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        function filterScreenshots(filter) {
            const cards = document.querySelectorAll('.screenshot-card');
            const buttons = document.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            cards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else if (card.dataset.step === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(this.screenshotDir, 'index.html'), html);
    }
    
    getStatusBadge(testName) {
        const test = this.testResults.find(t => t.name === testName.replace(/_/g, ' '));
        if (!test) return '';
        
        return test.status === 'PASS' 
            ? '<span class="status-badge status-pass">PASS</span>'
            : '<span class="status-badge status-fail">FAIL</span>';
    }
}

// Run the test
async function main() {
    const tester = new ObsidianScreenshotTest();
    const success = await tester.runTests();
    process.exit(success ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});