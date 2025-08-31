#!/usr/bin/env node

/**
 * DEBUG DISPLAY TEST
 * Tests display environment and screenshot capture capabilities
 * Provides detailed diagnostics for troubleshooting screenshot issues
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DisplayDebugTest {
    constructor() {
        this.screenshotDir = path.join(__dirname, 'test-results', 'debug-screenshots');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        this.browser = null;
        this.page = null;
        this.diagnostics = [];
        
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
            console.log(`📁 Created debug directory: ${this.screenshotDir}`);
        }
    }
    
    addDiagnostic(test, result, details = null) {
        this.diagnostics.push({
            test,
            result,
            details,
            timestamp: new Date().toISOString()
        });
        
        const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} ${test}: ${details || result}`);
    }
    
    async runSystemDiagnostics() {
        console.log('\n🔧 SYSTEM DIAGNOSTICS');
        console.log('═'.repeat(50));
        
        // Check DISPLAY environment variable
        const displayEnv = process.env.DISPLAY;
        this.addDiagnostic('DISPLAY Environment', displayEnv ? 'PASS' : 'FAIL', displayEnv || 'not set');
        
        // Check X server accessibility
        try {
            const xdpyOutput = execSync('xdpyinfo -display :99 2>/dev/null', { encoding: 'utf8' });
            const resolution = xdpyOutput.match(/dimensions:\s+(\d+x\d+)/);
            this.addDiagnostic('X Server Access', 'PASS', resolution ? resolution[1] : 'accessible');
        } catch (error) {
            this.addDiagnostic('X Server Access', 'FAIL', error.message);
        }
        
        // Check Xvfb process
        try {
            execSync('pgrep Xvfb >/dev/null 2>&1');
            this.addDiagnostic('Xvfb Process', 'PASS', 'running');
        } catch {
            this.addDiagnostic('Xvfb Process', 'FAIL', 'not running');
        }
        
        // Check available fonts
        try {
            const fontOutput = execSync('fc-list | wc -l 2>/dev/null', { encoding: 'utf8' });
            this.addDiagnostic('Font System', 'PASS', `${fontOutput.trim()} fonts available`);
        } catch {
            this.addDiagnostic('Font System', 'WARN', 'font check failed');
        }
        
        // Check memory and disk space
        try {
            const memInfo = execSync('free -m | grep Mem:', { encoding: 'utf8' });
            const memMatch = memInfo.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/);
            if (memMatch) {
                const [, total, used, free] = memMatch;
                this.addDiagnostic('Memory Status', free > 500 ? 'PASS' : 'WARN', `${free}MB free of ${total}MB`);
            }
        } catch {
            this.addDiagnostic('Memory Status', 'WARN', 'memory check failed');
        }
    }
    
    async runBrowserDiagnostics() {
        console.log('\n🌐 BROWSER DIAGNOSTICS');
        console.log('═'.repeat(50));
        
        try {
            // Test browser launch
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--window-size=1920,1080',
                    '--force-device-scale-factor=1',
                    '--use-gl=swiftshader',
                    '--enable-logging',
                    '--log-level=0'
                ],
                defaultViewport: { width: 1920, height: 1080 },
                timeout: 30000
            });
            
            this.addDiagnostic('Browser Launch', 'PASS', 'Puppeteer launched successfully');
            
            // Test page creation
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
            this.addDiagnostic('Page Creation', 'PASS', 'Page created with viewport 1920x1080');
            
            // Test basic navigation
            await this.page.goto('data:text/html,<html><body><h1>Display Test</h1></body></html>');
            this.addDiagnostic('Basic Navigation', 'PASS', 'Data URI loaded successfully');
            
            // Test screenshot capability
            await this.testScreenshotCapability();
            
        } catch (error) {
            this.addDiagnostic('Browser Launch', 'FAIL', error.message);
        }
    }
    
    async testScreenshotCapability() {
        console.log('\n📸 SCREENSHOT CAPABILITY TEST');
        console.log('═'.repeat(50));
        
        if (!this.page) {
            this.addDiagnostic('Screenshot Test', 'FAIL', 'No page available');
            return;
        }
        
        // Create a colorful test page
        await this.page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                    }
                    .test-box {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 600px;
                    }
                    h1 { color: #333; margin-bottom: 20px; }
                    .stats { margin-top: 20px; font-size: 14px; color: #666; }
                </style>
            </head>
            <body>
                <div class="test-box">
                    <h1>🧪 Display Test Success!</h1>
                    <p>If you can see this colorful page in the screenshot, the display system is working correctly.</p>
                    <div class="stats">
                        <div>Resolution: 1920x1080</div>
                        <div>Time: ${new Date().toLocaleString()}</div>
                        <div>Display: ${process.env.DISPLAY || 'not set'}</div>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        // Wait for rendering
        await this.page.waitForFunction('document.readyState === "complete"');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test different screenshot methods
        const testMethods = [
            {
                name: 'Standard PNG',
                options: { type: 'png', quality: 90 }
            },
            {
                name: 'JPEG Quality 80',
                options: { type: 'jpeg', quality: 80 }
            },
            {
                name: 'Full Page PNG',
                options: { type: 'png', fullPage: true }
            },
            {
                name: 'Clipped Region',
                options: { type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } }
            }
        ];
        
        for (const method of testMethods) {
            const filename = `${this.timestamp}_${method.name.replace(/\s+/g, '_')}.${method.options.type === 'jpeg' ? 'jpg' : 'png'}`;
            const filepath = path.join(this.screenshotDir, filename);
            
            try {
                await this.page.screenshot({
                    path: filepath,
                    ...method.options
                });
                
                if (fs.existsSync(filepath)) {
                    const stats = fs.statSync(filepath);
                    if (stats.size > 0) {
                        this.addDiagnostic(`Screenshot: ${method.name}`, 'PASS', `${stats.size} bytes`);
                    } else {
                        this.addDiagnostic(`Screenshot: ${method.name}`, 'FAIL', 'Empty file created');
                        fs.unlinkSync(filepath);
                    }
                } else {
                    this.addDiagnostic(`Screenshot: ${method.name}`, 'FAIL', 'File not created');
                }
            } catch (error) {
                this.addDiagnostic(`Screenshot: ${method.name}`, 'FAIL', error.message);
            }
        }
    }
    
    async runPerformanceTests() {
        console.log('\n⚡ PERFORMANCE TESTS');
        console.log('═'.repeat(50));
        
        if (!this.page) {
            this.addDiagnostic('Performance Test', 'SKIP', 'No page available');
            return;
        }
        
        // Test screenshot timing
        const timingTests = [];
        for (let i = 0; i < 3; i++) {
            const startTime = Date.now();
            try {
                await this.page.screenshot({ type: 'png' });
                const duration = Date.now() - startTime;
                timingTests.push(duration);
            } catch (error) {
                console.warn(`  ⚠️ Timing test ${i + 1} failed: ${error.message}`);
            }
        }
        
        if (timingTests.length > 0) {
            const avgTime = Math.round(timingTests.reduce((a, b) => a + b) / timingTests.length);
            const status = avgTime < 5000 ? 'PASS' : avgTime < 10000 ? 'WARN' : 'FAIL';
            this.addDiagnostic('Screenshot Speed', status, `${avgTime}ms average`);
        }
        
        // Test memory usage
        try {
            const metrics = await this.page.metrics();
            const jsHeapSize = Math.round(metrics.JSHeapUsedSize / 1024 / 1024);
            this.addDiagnostic('JS Heap Usage', jsHeapSize < 100 ? 'PASS' : 'WARN', `${jsHeapSize}MB`);
        } catch (error) {
            this.addDiagnostic('Memory Metrics', 'WARN', 'Unable to collect metrics');
        }
    }
    
    async generateReport() {
        console.log('\n📊 DIAGNOSTIC REPORT');
        console.log('═'.repeat(50));
        
        const passed = this.diagnostics.filter(d => d.result === 'PASS').length;
        const failed = this.diagnostics.filter(d => d.result === 'FAIL').length;
        const warned = this.diagnostics.filter(d => d.result === 'WARN').length;
        const total = this.diagnostics.length;
        
        console.log(`\n📈 Results: ${passed} passed, ${failed} failed, ${warned} warnings`);
        console.log(`📁 Debug screenshots: ${this.screenshotDir}\n`);
        
        // Show summary by category
        const categories = ['SYSTEM', 'BROWSER', 'SCREENSHOT', 'PERFORMANCE'];
        for (const category of categories) {
            const categoryTests = this.diagnostics.filter(d => 
                d.test.toUpperCase().includes(category.substring(0, 3))
            );
            if (categoryTests.length > 0) {
                console.log(`${category}:`);
                categoryTests.forEach(test => {
                    const icon = test.result === 'PASS' ? '✅' : test.result === 'FAIL' ? '❌' : '⚠️';
                    console.log(`  ${icon} ${test.test}: ${test.details || test.result}`);
                });
                console.log('');
            }
        }
        
        // Save detailed report
        const reportPath = path.join(this.screenshotDir, `${this.timestamp}_debug_report.json`);
        const reportData = {
            timestamp: this.timestamp,
            environment: {
                display: process.env.DISPLAY,
                ci: process.env.CI,
                node: process.version
            },
            summary: { passed, failed, warned, total },
            diagnostics: this.diagnostics
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`📄 Detailed report: ${reportPath}`);
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        console.log('═'.repeat(50));
        
        if (failed === 0) {
            console.log('🎉 All critical tests passed! Screenshot functionality should work correctly.');
        } else {
            console.log('🔧 Issues found that may prevent screenshots from working:');
            this.diagnostics.filter(d => d.result === 'FAIL').forEach(test => {
                console.log(`   • ${test.test}: ${test.details}`);
            });
        }
        
        if (warned > 0) {
            console.log('\n⚠️  Warnings that may affect performance:');
            this.diagnostics.filter(d => d.result === 'WARN').forEach(test => {
                console.log(`   • ${test.test}: ${test.details}`);
            });
        }
    }
    
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }
    
    async runAllDiagnostics() {
        console.log('🔍 DISPLAY & SCREENSHOT DEBUG TEST');
        console.log('═'.repeat(60));
        console.log(`📅 Started: ${new Date().toLocaleString()}`);
        console.log(`🎯 Purpose: Diagnose screenshot capture issues in Docker`);
        console.log('');
        
        try {
            await this.runSystemDiagnostics();
            await this.runBrowserDiagnostics();
            await this.runPerformanceTests();
        } catch (error) {
            console.error('💥 Unexpected error during diagnostics:', error);
        } finally {
            await this.cleanup();
            await this.generateReport();
        }
        
        const hasFailures = this.diagnostics.some(d => d.result === 'FAIL');
        return !hasFailures;
    }
}

// Run the debug test
async function main() {
    const debugTest = new DisplayDebugTest();
    const success = await debugTest.runAllDiagnostics();
    
    console.log(`\n${success ? '🎯 SUCCESS' : '💥 ISSUES FOUND'}: Debug test completed`);
    process.exit(success ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});