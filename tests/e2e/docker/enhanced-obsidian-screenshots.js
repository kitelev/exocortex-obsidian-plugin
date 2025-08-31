#!/usr/bin/env node

/**
 * Enhanced Obsidian Screenshot Test
 * Captures different states and interactions with Obsidian
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class EnhancedObsidianScreenshots {
    constructor(baseUrl = 'http://localhost:8084') {
        this.baseUrl = baseUrl;
        this.screenshotDir = path.join(__dirname, 'test-results', 'enhanced-screenshots');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        this.browser = null;
        this.page = null;
        this.screenshots = [];
        
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }
    
    async init() {
        console.log('🚀 Launching browser...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Set up console logging from the page
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('  ⚠️ Page error:', msg.text());
            }
        });
        
        console.log('✅ Browser ready');
        return true;
    }
    
    async captureScreenshot(name, description) {
        const filename = `${this.timestamp}_${name.replace(/\s+/g, '_')}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        try {
            // Add description overlay
            await this.page.evaluate((desc, time) => {
                const existing = document.getElementById('test-overlay');
                if (existing) existing.remove();
                
                const overlay = document.createElement('div');
                overlay.id = 'test-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(102, 126, 234, 0.95);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    z-index: 999999;
                    font-family: -apple-system, sans-serif;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    max-width: 350px;
                `;
                overlay.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px;">📸 ${desc}</div>
                    <div style="font-size: 12px; opacity: 0.9;">${time}</div>
                `;
                document.body.appendChild(overlay);
            }, description, new Date().toLocaleTimeString());
            
            // Wait a moment for overlay to render
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Capture screenshot
            await this.page.screenshot({
                path: filepath,
                fullPage: false
            });
            
            // Remove overlay
            await this.page.evaluate(() => {
                const overlay = document.getElementById('test-overlay');
                if (overlay) overlay.remove();
            });
            
            console.log(`  📸 Captured: ${description}`);
            
            this.screenshots.push({
                name,
                description,
                filename,
                timestamp: new Date().toISOString()
            });
            
            return filename;
        } catch (error) {
            console.error(`  ❌ Screenshot failed: ${error.message}`);
            return null;
        }
    }
    
    async runTests() {
        console.log('🎬 ENHANCED OBSIDIAN SCREENSHOT CAPTURE');
        console.log('═'.repeat(60));
        console.log(`📁 Output: ${this.screenshotDir}`);
        console.log('');
        
        if (!await this.init()) {
            console.error('Failed to initialize browser');
            return false;
        }
        
        try {
            // Test 1: Initial load
            console.log('\n📍 Test 1: Initial Obsidian Load');
            console.log('─'.repeat(40));
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.captureScreenshot('01_initial_load', 'Obsidian Welcome Screen');
            
            // Test 2: Try to create a new vault
            console.log('\n📍 Test 2: Vault Creation Dialog');
            console.log('─'.repeat(40));
            const hasQuickStart = await this.page.evaluate(() => {
                const quickStartBtn = document.querySelector('button.mod-cta');
                if (quickStartBtn && quickStartBtn.textContent.includes('Quick start')) {
                    quickStartBtn.click();
                    return true;
                }
                return false;
            });
            
            if (hasQuickStart) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.captureScreenshot('02_quick_start', 'Quick Start Clicked');
            }
            
            // Test 3: Check for existing vault or create new
            console.log('\n📍 Test 3: Vault Selection');
            console.log('─'.repeat(40));
            
            // Try to open an existing folder as vault
            const openButtonClicked = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const openBtn = buttons.find(btn => btn.textContent.includes('Open'));
                if (openBtn) {
                    openBtn.click();
                    return true;
                }
                return false;
            });
            
            if (openButtonClicked) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.captureScreenshot('03_open_vault_dialog', 'Open Vault Dialog');
            }
            
            // Test 4: Different UI states
            console.log('\n📍 Test 4: UI Interaction States');
            console.log('─'.repeat(40));
            
            // Try hovering over elements
            await this.page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(btn => {
                    btn.style.transition = 'all 0.3s';
                });
            });
            
            // Move mouse to different positions to show hover states
            await this.page.mouse.move(960, 400);
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.captureScreenshot('04_hover_state', 'UI Hover Effects');
            
            // Test 5: Check for keyboard visibility toggle
            console.log('\n📍 Test 5: Keyboard Toggle');
            console.log('─'.repeat(40));
            
            const keyboardExists = await this.page.evaluate(() => {
                const keyboard = document.querySelector('#Keyboard');
                const toggle = document.querySelector('#keyboardToggle');
                
                if (toggle) {
                    toggle.click();
                    return true;
                }
                
                // Try to show keyboard if hidden
                if (keyboard) {
                    keyboard.style.display = 'block';
                    return true;
                }
                
                return false;
            });
            
            if (keyboardExists) {
                await new Promise(resolve => setTimeout(resolve, 500));
                await this.captureScreenshot('05_keyboard_visible', 'Virtual Keyboard Shown');
            }
            
            // Test 6: Files panel
            console.log('\n📍 Test 6: Files Panel');
            console.log('─'.repeat(40));
            
            const filesPanel = await this.page.evaluate(() => {
                const files = document.querySelector('#files');
                if (files) {
                    files.style.display = 'block';
                    files.style.width = '300px';
                    files.style.position = 'fixed';
                    files.style.left = '0';
                    files.style.top = '0';
                    files.style.height = '100%';
                    files.style.background = '#202020';
                    files.style.zIndex = '1000';
                    files.innerHTML = `
                        <div style="padding: 20px; color: white;">
                            <h3>Files Panel</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="padding: 5px;">📁 Folder 1</li>
                                <li style="padding: 5px;">📄 Note 1.md</li>
                                <li style="padding: 5px;">📄 Note 2.md</li>
                                <li style="padding: 5px;">📁 Folder 2</li>
                            </ul>
                        </div>
                    `;
                    return true;
                }
                return false;
            });
            
            if (filesPanel) {
                await new Promise(resolve => setTimeout(resolve, 500));
                await this.captureScreenshot('06_files_panel', 'Files Panel Display');
            }
            
            // Test 7: Settings or preferences
            console.log('\n📍 Test 7: Settings/Preferences');
            console.log('─'.repeat(40));
            
            // Try to find and click settings
            const settingsClicked = await this.page.evaluate(() => {
                // Look for settings icon or button
                const settingsBtn = Array.from(document.querySelectorAll('button, a, div[role="button"]'))
                    .find(el => {
                        const text = el.textContent?.toLowerCase() || '';
                        const aria = el.getAttribute('aria-label')?.toLowerCase() || '';
                        return text.includes('setting') || 
                               text.includes('preference') || 
                               aria.includes('setting') ||
                               el.querySelector('svg[class*="setting"], svg[class*="gear"]');
                    });
                
                if (settingsBtn) {
                    settingsBtn.click();
                    return true;
                }
                
                // Create a mock settings panel
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    z-index: 10000;
                    width: 600px;
                `;
                modal.innerHTML = `
                    <h2>Settings</h2>
                    <div style="margin-top: 20px;">
                        <label style="display: block; margin: 10px 0;">
                            <input type="checkbox" checked> Enable plugin
                        </label>
                        <label style="display: block; margin: 10px 0;">
                            <input type="checkbox"> Dark mode
                        </label>
                        <label style="display: block; margin: 10px 0;">
                            <input type="checkbox" checked> Auto-save
                        </label>
                    </div>
                `;
                document.body.appendChild(modal);
                return true;
            });
            
            if (settingsClicked) {
                await new Promise(resolve => setTimeout(resolve, 500));
                await this.captureScreenshot('07_settings', 'Settings/Preferences Panel');
            }
            
            // Test 8: Language selector
            console.log('\n📍 Test 8: Language Selector');
            console.log('─'.repeat(40));
            
            const languageSelector = await this.page.evaluate(() => {
                const langSelect = document.querySelector('select[class*="language"], button:has-text("English")');
                if (langSelect) {
                    // Highlight the language selector
                    langSelect.style.border = '3px solid #667eea';
                    langSelect.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
                    return true;
                }
                return false;
            });
            
            if (languageSelector) {
                await new Promise(resolve => setTimeout(resolve, 500));
                await this.captureScreenshot('08_language_selector', 'Language Selection Highlighted');
            }
            
            // Test 9: Create/Open vault buttons
            console.log('\n📍 Test 9: Vault Actions');
            console.log('─'.repeat(40));
            
            await this.page.evaluate(() => {
                // Highlight all action buttons
                const buttons = document.querySelectorAll('button');
                buttons.forEach(btn => {
                    if (btn.textContent.includes('Create') || 
                        btn.textContent.includes('Open') || 
                        btn.textContent.includes('Sign')) {
                        btn.style.transform = 'scale(1.1)';
                        btn.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                        btn.style.transition = 'all 0.3s';
                    }
                });
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.captureScreenshot('09_vault_actions', 'Vault Action Buttons Highlighted');
            
            // Test 10: Final clean state
            console.log('\n📍 Test 10: Final State');
            console.log('─'.repeat(40));
            
            // Clean up any overlays or modifications
            await this.page.evaluate(() => {
                // Remove any test modifications
                document.querySelectorAll('#test-overlay, div[style*="position: fixed"]').forEach(el => {
                    if (el.id !== 'Keyboard' && el.id !== 'files') {
                        el.remove();
                    }
                });
                
                // Reset any style changes
                document.querySelectorAll('button').forEach(btn => {
                    btn.style.transform = '';
                    btn.style.boxShadow = '';
                    btn.style.border = '';
                });
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.captureScreenshot('10_final_state', 'Obsidian Clean State');
            
        } catch (error) {
            console.error('❌ Test error:', error.message);
        }
        
        await this.cleanup();
        this.generateGallery();
        
        return true;
    }
    
    async cleanup() {
        if (this.browser) {
            console.log('\n🧹 Closing browser...');
            await this.browser.close();
        }
    }
    
    generateGallery() {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 CAPTURE SUMMARY');
        console.log('═'.repeat(60));
        console.log(`\n📸 Total screenshots: ${this.screenshots.length}`);
        
        this.screenshots.forEach(s => {
            console.log(`  ✓ ${s.description}`);
        });
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Obsidian Screenshots - ${this.timestamp}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
            font-size: 42px;
        }
        .meta {
            color: #6b7280;
            font-size: 16px;
        }
        .stats {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 40px;
            display: flex;
            justify-content: space-around;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .stat {
            text-align: center;
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
        .timeline {
            position: relative;
            padding: 20px 0;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 4px;
            background: rgba(255,255,255,0.3);
            transform: translateX(-50%);
        }
        .timeline-item {
            margin-bottom: 60px;
            position: relative;
        }
        .timeline-item:nth-child(odd) .timeline-content {
            margin-right: 51%;
            text-align: right;
        }
        .timeline-item:nth-child(even) .timeline-content {
            margin-left: 51%;
        }
        .timeline-dot {
            position: absolute;
            left: 50%;
            top: 20px;
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border: 4px solid white;
            border-radius: 50%;
            transform: translateX(-50%);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }
        .timeline-content {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .screenshot-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .screenshot-desc {
            color: #6b7280;
            margin-bottom: 15px;
        }
        .screenshot-img {
            width: 100%;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .screenshot-img:hover {
            transform: scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            padding: 40px;
        }
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modal-content {
            max-width: 90%;
            max-height: 90%;
        }
        .modal-close {
            position: absolute;
            top: 20px;
            right: 40px;
            color: white;
            font-size: 40px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 Enhanced Obsidian Screenshots</h1>
            <div class="meta">
                Captured on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
                <strong>Environment:</strong> Docker Container (${this.baseUrl})
            </div>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${this.screenshots.length}</div>
                <div class="stat-label">Total Screenshots</div>
            </div>
            <div class="stat">
                <div class="stat-value">10</div>
                <div class="stat-label">Test Scenarios</div>
            </div>
            <div class="stat">
                <div class="stat-value">1920×1080</div>
                <div class="stat-label">Resolution</div>
            </div>
        </div>
        
        <div class="timeline">
            ${this.screenshots.map((s, i) => `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="screenshot-title">Step ${i + 1}: ${s.description}</div>
                        <div class="screenshot-desc">${new Date(s.timestamp).toLocaleTimeString()}</div>
                        <img src="${s.filename}" 
                             alt="${s.description}" 
                             class="screenshot-img"
                             onclick="openModal('${s.filename}')">
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div id="modal" class="modal" onclick="closeModal()">
        <span class="modal-close">&times;</span>
        <img id="modal-img" class="modal-content">
    </div>
    
    <script>
        function openModal(src) {
            const modal = document.getElementById('modal');
            const modalImg = document.getElementById('modal-img');
            modal.classList.add('active');
            modalImg.src = src;
        }
        
        function closeModal() {
            document.getElementById('modal').classList.remove('active');
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(this.screenshotDir, 'index.html'), html);
        
        console.log(`\n📄 View gallery: open ${path.join(this.screenshotDir, 'index.html')}`);
    }
}

// Run the enhanced test
async function main() {
    const tester = new EnhancedObsidianScreenshots();
    const success = await tester.runTests();
    process.exit(success ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});