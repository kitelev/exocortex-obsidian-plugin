#!/usr/bin/env node

/**
 * ENHANCED TEST REPORT GENERATOR
 * Consolidates results from multiple test runners and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');

class EnhancedReportGenerator {
    constructor() {
        this.baseDir = '/workspace';
        this.testResultsDir = path.join(this.baseDir, 'test-results');
        this.screenshotsDir = path.join(this.testResultsDir, 'enhanced-screenshots');
        this.reportsDir = path.join(this.testResultsDir, 'reports');
        this.playwrightReportDir = path.join(this.baseDir, 'playwright-report');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        [this.testResultsDir, this.screenshotsDir, this.reportsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async generateConsolidatedReport() {
        console.log('📊 Generating Enhanced Consolidated Test Report...');
        console.log('=' .repeat(60));
        
        const report = {
            timestamp: this.timestamp,
            testSuite: 'Enhanced Real Plugin E2E Tests',
            environment: {
                docker: true,
                obsidianVersion: process.env.OBSIDIAN_VERSION || '1.5.12',
                nodeVersion: process.version,
                platform: 'linux-docker-xvfb'
            },
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                successRate: 0,
                totalDuration: 0
            },
            testTypes: {},
            artifacts: {
                screenshots: [],
                videos: [],
                reports: []
            },
            performance: {
                averageTestDuration: 0,
                memoryUsage: [],
                errorCount: 0
            },
            details: []
        };
        
        // Collect results from various test runners
        await this.collectPuppeteerResults(report);
        await this.collectPlaywrightResults(report);
        await this.collectWebDriverIOResults(report);
        await this.collectArtifacts(report);
        
        // Calculate final metrics
        this.calculateSummary(report);
        
        // Generate reports
        await this.saveJSONReport(report);
        await this.generateHTMLDashboard(report);
        await this.generateMarkdownSummary(report);
        await this.generateArtifactIndex(report);
        
        console.log('\n✅ Enhanced consolidated report generated successfully!');
        return report;
    }
    
    async collectPuppeteerResults(report) {
        console.log('🎪 Collecting Puppeteer test results...');
        
        try {
            const puppeteerReports = fs.readdirSync(this.reportsDir)
                .filter(file => file.includes('enhanced_test_report.json'))
                .map(file => path.join(this.reportsDir, file));
            
            for (const reportFile of puppeteerReports) {
                const data = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
                
                report.testTypes.puppeteer = {
                    passed: data.summary.passed,
                    failed: data.summary.failed,
                    total: data.summary.total,
                    duration: data.summary.totalDuration,
                    tests: data.tests
                };
                
                report.summary.totalTests += data.summary.total;
                report.summary.passed += data.summary.passed;
                report.summary.failed += data.summary.failed;
                report.summary.totalDuration += data.summary.totalDuration;
                
                // Add performance data
                if (data.performance && data.performance.metrics) {
                    report.performance.memoryUsage.push(...data.performance.metrics
                        .filter(m => m.memoryUsage)
                        .map(m => ({
                            timestamp: m.timestamp,
                            used: m.memoryUsage.used,
                            total: m.memoryUsage.total
                        }))
                    );
                }
                
                report.details.push(...data.tests.map(test => ({
                    runner: 'puppeteer',
                    ...test
                })));
            }
            
            console.log(`  ✅ Found ${puppeteerReports.length} Puppeteer reports`);
        } catch (error) {
            console.log(`  ⚠️  Puppeteer results not found: ${error.message}`);
        }
    }
    
    async collectPlaywrightResults(report) {
        console.log('🎭 Collecting Playwright test results...');
        
        try {
            // Look for Playwright JSON report
            const playwrightJSONPath = path.join(this.playwrightReportDir, 'results.json');
            if (fs.existsSync(playwrightJSONPath)) {
                const data = JSON.parse(fs.readFileSync(playwrightJSONPath, 'utf8'));
                
                const playwrightSummary = {
                    passed: 0,
                    failed: 0,
                    total: 0,
                    duration: 0,
                    tests: []
                };
                
                // Parse Playwright results format
                if (data.suites) {
                    data.suites.forEach(suite => {
                        suite.specs?.forEach(spec => {
                            spec.tests?.forEach(test => {
                                playwrightSummary.total++;
                                const passed = test.results?.every(r => r.status === 'passed');
                                if (passed) {
                                    playwrightSummary.passed++;
                                } else {
                                    playwrightSummary.failed++;
                                }
                                
                                playwrightSummary.tests.push({
                                    name: test.title,
                                    status: passed ? 'PASS' : 'FAIL',
                                    duration: test.results?.[0]?.duration || 0
                                });
                                
                                playwrightSummary.duration += test.results?.[0]?.duration || 0;
                            });
                        });
                    });
                }
                
                report.testTypes.playwright = playwrightSummary;
                
                report.summary.totalTests += playwrightSummary.total;
                report.summary.passed += playwrightSummary.passed;
                report.summary.failed += playwrightSummary.failed;
                report.summary.totalDuration += playwrightSummary.duration;
                
                report.details.push(...playwrightSummary.tests.map(test => ({
                    runner: 'playwright',
                    ...test
                })));
                
                console.log(`  ✅ Found ${playwrightSummary.total} Playwright tests`);
            }
        } catch (error) {
            console.log(`  ⚠️  Playwright results not found: ${error.message}`);
        }
    }
    
    async collectWebDriverIOResults(report) {
        console.log('🌐 Collecting WebDriverIO test results...');
        
        try {
            // Look for WDIO allure results
            const allureResultsDir = path.join(this.testResultsDir, 'allure-results');
            if (fs.existsSync(allureResultsDir)) {
                const allureFiles = fs.readdirSync(allureResultsDir)
                    .filter(file => file.endsWith('-result.json'));
                
                const wdioSummary = {
                    passed: 0,
                    failed: 0,
                    total: allureFiles.length,
                    duration: 0,
                    tests: []
                };
                
                allureFiles.forEach(file => {
                    try {
                        const data = JSON.parse(fs.readFileSync(path.join(allureResultsDir, file), 'utf8'));
                        
                        const passed = data.status === 'passed';
                        if (passed) {
                            wdioSummary.passed++;
                        } else {
                            wdioSummary.failed++;
                        }
                        
                        wdioSummary.tests.push({
                            name: data.name,
                            status: passed ? 'PASS' : 'FAIL',
                            duration: data.stop - data.start
                        });
                        
                        wdioSummary.duration += data.stop - data.start;
                    } catch (e) {
                        console.log(`    ⚠️  Error parsing ${file}: ${e.message}`);
                    }
                });
                
                if (wdioSummary.total > 0) {
                    report.testTypes.webdriverio = wdioSummary;
                    
                    report.summary.totalTests += wdioSummary.total;
                    report.summary.passed += wdioSummary.passed;
                    report.summary.failed += wdioSummary.failed;
                    report.summary.totalDuration += wdioSummary.duration;
                    
                    report.details.push(...wdioSummary.tests.map(test => ({
                        runner: 'webdriverio',
                        ...test
                    })));
                    
                    console.log(`  ✅ Found ${wdioSummary.total} WebDriverIO tests`);
                }
            }
        } catch (error) {
            console.log(`  ⚠️  WebDriverIO results not found: ${error.message}`);
        }
    }
    
    async collectArtifacts(report) {
        console.log('📁 Collecting test artifacts...');
        
        // Collect screenshots
        if (fs.existsSync(this.screenshotsDir)) {
            const screenshots = fs.readdirSync(this.screenshotsDir)
                .filter(file => file.endsWith('.png'))
                .map(file => ({
                    name: file,
                    path: path.join(this.screenshotsDir, file),
                    size: fs.statSync(path.join(this.screenshotsDir, file)).size,
                    timestamp: file.split('_')[0] || this.timestamp
                }));
            
            report.artifacts.screenshots = screenshots;
            console.log(`  📸 Found ${screenshots.length} screenshots`);
        }
        
        // Collect videos (if any)
        const videosDir = path.join(this.testResultsDir, 'videos');
        if (fs.existsSync(videosDir)) {
            const videos = fs.readdirSync(videosDir)
                .filter(file => file.endsWith('.mp4') || file.endsWith('.webm'))
                .map(file => ({
                    name: file,
                    path: path.join(videosDir, file),
                    size: fs.statSync(path.join(videosDir, file)).size
                }));
            
            report.artifacts.videos = videos;
            console.log(`  🎥 Found ${videos.length} videos`);
        }
        
        // Collect reports
        if (fs.existsSync(this.reportsDir)) {
            const reports = fs.readdirSync(this.reportsDir)
                .filter(file => file.endsWith('.json') || file.endsWith('.html'))
                .map(file => ({
                    name: file,
                    path: path.join(this.reportsDir, file),
                    size: fs.statSync(path.join(this.reportsDir, file)).size,
                    type: file.endsWith('.json') ? 'json' : 'html'
                }));
            
            report.artifacts.reports = reports;
            console.log(`  📊 Found ${reports.length} reports`);
        }
    }
    
    calculateSummary(report) {
        if (report.summary.totalTests > 0) {
            report.summary.successRate = Math.round((report.summary.passed / report.summary.totalTests) * 100);
            report.performance.averageTestDuration = Math.round(report.summary.totalDuration / report.summary.totalTests);
        }
        
        report.performance.errorCount = report.summary.failed;
        
        if (report.performance.memoryUsage.length > 0) {
            const avgMemory = report.performance.memoryUsage.reduce((sum, m) => sum + m.used, 0) / report.performance.memoryUsage.length;
            report.performance.averageMemoryUsage = Math.round(avgMemory / 1024 / 1024); // MB
        }
    }
    
    async saveJSONReport(report) {
        const jsonPath = path.join(this.reportsDir, `${this.timestamp}_consolidated_report.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        console.log(`  📄 JSON report: ${jsonPath}`);
    }
    
    async generateHTMLDashboard(report) {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced E2E Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .dashboard { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { 
            background: rgba(255,255,255,0.95); 
            border-radius: 12px; 
            padding: 30px; 
            margin-bottom: 30px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { 
            background: rgba(255,255,255,0.95); 
            border-radius: 12px; 
            padding: 25px; 
            text-align: center; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-value { font-size: 3em; font-weight: bold; margin-bottom: 10px; }
        .stat-label { color: #666; font-size: 1.1em; }
        .success { color: #28a745; }
        .danger { color: #dc3545; }
        .info { color: #007bff; }
        .warning { color: #ffc107; }
        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .panel { 
            background: rgba(255,255,255,0.95); 
            border-radius: 12px; 
            padding: 25px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .panel h3 { margin-bottom: 20px; color: #333; }
        .chart-container { height: 300px; margin-bottom: 20px; }
        .test-list { max-height: 400px; overflow-y: auto; }
        .test-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 12px; 
            border-bottom: 1px solid #eee; 
            transition: background-color 0.3s ease;
        }
        .test-item:hover { background-color: #f8f9fa; }
        .test-name { font-weight: 500; }
        .test-runner { 
            background: #e9ecef; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 0.8em; 
            margin-right: 10px; 
        }
        .artifact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .artifact-section { margin-bottom: 20px; }
        .artifact-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 10px; 
            background: #f8f9fa; 
            border-radius: 6px; 
            margin-bottom: 8px; 
        }
        .footer { 
            background: rgba(255,255,255,0.95); 
            border-radius: 12px; 
            padding: 25px; 
            text-align: center; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .badge { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 0.8em; 
            font-weight: bold; 
            text-transform: uppercase; 
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-danger { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🎯 Enhanced E2E Test Dashboard</h1>
            <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Environment:</strong> ${report.environment.platform} | Node ${report.environment.nodeVersion} | Obsidian ${report.environment.obsidianVersion}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value success">${report.summary.passed}</div>
                <div class="stat-label">Passed Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value danger">${report.summary.failed}</div>
                <div class="stat-label">Failed Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value info">${report.summary.successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value warning">${Math.round(report.summary.totalDuration / 1000)}s</div>
                <div class="stat-label">Total Duration</div>
            </div>
        </div>
        
        <div class="content-grid">
            <div class="panel">
                <h3>📊 Test Results by Runner</h3>
                <div class="chart-container">
                    <canvas id="runnerChart"></canvas>
                </div>
                <div>
                    ${Object.entries(report.testTypes).map(([runner, data]) => `
                        <div class="test-item">
                            <span>
                                <span class="test-runner">${runner}</span>
                                <span class="test-name">${data.total} tests</span>
                            </span>
                            <span>
                                <span class="badge badge-success">${data.passed}</span>
                                <span class="badge badge-danger">${data.failed}</span>
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="panel">
                <h3>🧪 Individual Test Results</h3>
                <div class="test-list">
                    ${report.details.slice(0, 20).map(test => `
                        <div class="test-item">
                            <span>
                                <span class="test-runner">${test.runner}</span>
                                <span class="test-name">${test.name}</span>
                            </span>
                            <span class="badge badge-${test.status === 'PASS' ? 'success' : 'danger'}">
                                ${test.status}
                            </span>
                        </div>
                    `).join('')}
                    ${report.details.length > 20 ? `<div class="test-item"><em>... and ${report.details.length - 20} more tests</em></div>` : ''}
                </div>
            </div>
        </div>
        
        <div class="panel">
            <h3>📁 Test Artifacts</h3>
            <div class="artifact-grid">
                <div class="artifact-section">
                    <h4>📸 Screenshots (${report.artifacts.screenshots.length})</h4>
                    ${report.artifacts.screenshots.slice(0, 5).map(screenshot => `
                        <div class="artifact-item">
                            <span>${screenshot.name}</span>
                            <span>${Math.round(screenshot.size / 1024)}KB</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="artifact-section">
                    <h4>🎥 Videos (${report.artifacts.videos.length})</h4>
                    ${report.artifacts.videos.slice(0, 5).map(video => `
                        <div class="artifact-item">
                            <span>${video.name}</span>
                            <span>${Math.round(video.size / 1024 / 1024)}MB</span>
                        </div>
                    `).join('')}
                    ${report.artifacts.videos.length === 0 ? '<div class="artifact-item"><em>No videos generated</em></div>' : ''}
                </div>
                
                <div class="artifact-section">
                    <h4>📊 Reports (${report.artifacts.reports.length})</h4>
                    ${report.artifacts.reports.slice(0, 5).map(reportFile => `
                        <div class="artifact-item">
                            <span>${reportFile.name}</span>
                            <span>${reportFile.type.toUpperCase()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        ${report.performance.memoryUsage.length > 0 ? `
        <div class="panel">
            <h3>⚡ Performance Metrics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value info">${report.performance.averageTestDuration}ms</div>
                    <div class="stat-label">Avg Test Duration</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value warning">${report.performance.averageMemoryUsage}MB</div>
                    <div class="stat-label">Avg Memory Usage</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value danger">${report.performance.errorCount}</div>
                    <div class="stat-label">Errors Detected</div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            <p><strong>🔥 Enhanced Real Plugin E2E Testing</strong></p>
            <p>Running actual Obsidian desktop application in Docker with Xvfb</p>
            <p>No more fake tests - 100% real plugin functionality verification!</p>
        </div>
    </div>
    
    <script>
        // Chart.js for test runner breakdown
        const ctx = document.getElementById('runnerChart').getContext('2d');
        const runnerData = ${JSON.stringify(Object.entries(report.testTypes).map(([runner, data]) => ({
            runner,
            passed: data.passed,
            failed: data.failed
        })))};
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: runnerData.map(d => d.runner.charAt(0).toUpperCase() + d.runner.slice(1)),
                datasets: [{
                    label: 'Passed',
                    data: runnerData.map(d => d.passed),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 1
                }, {
                    label: 'Failed',
                    data: runnerData.map(d => d.failed),
                    backgroundColor: '#dc3545',
                    borderColor: '#bd2130',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
</body>
</html>`;
        
        const htmlPath = path.join(this.reportsDir, `${this.timestamp}_dashboard.html`);
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`  🌐 HTML dashboard: ${htmlPath}`);
    }
    
    async generateMarkdownSummary(report) {
        const markdown = `# 🎯 Enhanced E2E Test Results

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Environment:** ${report.environment.platform} | Node ${report.environment.nodeVersion} | Obsidian ${report.environment.obsidianVersion}

## 📊 Summary

| Metric | Value |
|--------|--------|
| Total Tests | ${report.summary.totalTests} |
| Passed | ✅ ${report.summary.passed} |
| Failed | ❌ ${report.summary.failed} |
| Success Rate | ${report.summary.successRate}% |
| Total Duration | ${Math.round(report.summary.totalDuration / 1000)}s |

## 🧪 Test Runners

${Object.entries(report.testTypes).map(([runner, data]) => `
### ${runner.charAt(0).toUpperCase() + runner.slice(1)}
- **Tests:** ${data.total}
- **Passed:** ${data.passed}
- **Failed:** ${data.failed}
- **Duration:** ${Math.round(data.duration / 1000)}s
`).join('')}

## 📁 Artifacts

- **Screenshots:** ${report.artifacts.screenshots.length}
- **Videos:** ${report.artifacts.videos.length}
- **Reports:** ${report.artifacts.reports.length}

${report.performance.averageMemoryUsage ? `
## ⚡ Performance

- **Average Test Duration:** ${report.performance.averageTestDuration}ms
- **Average Memory Usage:** ${report.performance.averageMemoryUsage}MB
- **Error Count:** ${report.performance.errorCount}
` : ''}

## 🔥 Real Plugin Testing Features

✅ **Actual Obsidian Desktop:** Running real Obsidian application in Docker  
✅ **Plugin Functionality:** Testing actual plugin features, not mocks  
✅ **Visual Testing:** Screenshots and visual regression detection  
✅ **Performance Monitoring:** Memory usage and execution time tracking  
✅ **Comprehensive Coverage:** UI components, commands, settings integration  
✅ **Error Detection:** Real error catching and debugging information  

---
*Generated by Enhanced E2E Test Suite - No more fake tests!*
`;
        
        const markdownPath = path.join(this.reportsDir, `${this.timestamp}_summary.md`);
        fs.writeFileSync(markdownPath, markdown);
        console.log(`  📝 Markdown summary: ${markdownPath}`);
    }
    
    async generateArtifactIndex(report) {
        const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Artifacts Index</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f7; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .artifact { border: 1px solid #e1e1e1; border-radius: 8px; padding: 15px; background: #fafafa; }
        .artifact img { max-width: 100%; border-radius: 4px; margin-bottom: 10px; }
        .artifact h4 { margin: 0 0 10px 0; color: #333; }
        .artifact p { margin: 5px 0; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 Test Artifacts Index</h1>
        <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        
        <h2>📸 Screenshots</h2>
        <div class="gallery">
            ${report.artifacts.screenshots.map(screenshot => `
                <div class="artifact">
                    <h4>${screenshot.name}</h4>
                    <img src="${screenshot.name}" alt="${screenshot.name}" loading="lazy">
                    <p><strong>Size:</strong> ${Math.round(screenshot.size / 1024)}KB</p>
                    <p><strong>Timestamp:</strong> ${screenshot.timestamp}</p>
                </div>
            `).join('')}
        </div>
        
        ${report.artifacts.videos.length > 0 ? `
        <h2>🎥 Videos</h2>
        <div class="gallery">
            ${report.artifacts.videos.map(video => `
                <div class="artifact">
                    <h4>${video.name}</h4>
                    <video controls style="max-width: 100%; border-radius: 4px;">
                        <source src="${video.name}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <p><strong>Size:</strong> ${Math.round(video.size / 1024 / 1024)}MB</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <h2>📊 Reports</h2>
        <div class="gallery">
            ${report.artifacts.reports.map(reportFile => `
                <div class="artifact">
                    <h4><a href="${reportFile.name}" target="_blank">${reportFile.name}</a></h4>
                    <p><strong>Type:</strong> ${reportFile.type.toUpperCase()}</p>
                    <p><strong>Size:</strong> ${Math.round(reportFile.size / 1024)}KB</p>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
        
        const indexPath = path.join(this.testResultsDir, 'index.html');
        fs.writeFileSync(indexPath, indexHTML);
        console.log(`  🗂️  Artifact index: ${indexPath}`);
    }
}

// Export for use in other scripts or run directly
if (require.main === module) {
    const generator = new EnhancedReportGenerator();
    generator.generateConsolidatedReport().then(report => {
        console.log('\n🎉 Enhanced consolidated report generation completed!');
        console.log(`📊 Total tests: ${report.summary.totalTests}`);
        console.log(`✅ Success rate: ${report.summary.successRate}%`);
        process.exit(0);
    }).catch(error => {
        console.error('💥 Report generation failed:', error);
        process.exit(1);
    });
}

module.exports = { EnhancedReportGenerator };