import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { join } from 'path';
import * as fs from 'fs';

/**
 * Custom Playwright reporter for enhanced screenshot management
 * 
 * Features:
 * - Organizes screenshots by test case
 * - Generates HTML gallery of screenshots
 * - Provides detailed test execution documentation
 * - Creates visual test evidence for real E2E testing
 */
class ScreenshotReporter implements Reporter {
  private screenshotDir: string;
  private testResults: Array<{
    test: TestCase;
    result: TestResult;
    screenshots: string[];
  }> = [];

  constructor() {
    this.screenshotDir = join(process.cwd(), 'test-results/screenshots');
    this.ensureScreenshotDir();
  }

  onBegin() {
    console.log('📸 Screenshot Reporter: Starting test documentation...');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Collect screenshot paths for this test
    const screenshots: string[] = [];
    
    if (result.attachments) {
      for (const attachment of result.attachments) {
        if (attachment.name?.includes('screenshot') && attachment.path) {
          screenshots.push(attachment.path);
        }
      }
    }

    this.testResults.push({
      test,
      result,
      screenshots
    });
  }

  async onEnd(result: FullResult) {
    console.log('📸 Screenshot Reporter: Generating visual documentation...');
    
    try {
      // Generate HTML gallery
      await this.generateScreenshotGallery();
      
      // Generate detailed report
      await this.generateDetailedReport();
      
      console.log(`✅ Screenshot documentation generated at: ${this.screenshotDir}`);
      
    } catch (error) {
      console.error('❌ Screenshot Reporter failed:', error);
    }
  }

  private ensureScreenshotDir() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  private async generateScreenshotGallery() {
    const galleryHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exocortex Plugin - Real E2E Test Screenshots</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            color: #333;
        }
        .header p {
            color: #666;
            margin: 10px 0 0;
        }
        .test-section {
            background: white;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .test-header {
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .test-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: #333;
        }
        .test-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 10px;
        }
        .test-status.passed {
            background: #d4edda;
            color: #155724;
        }
        .test-status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .test-status.skipped {
            background: #fff3cd;
            color: #856404;
        }
        .test-info {
            font-size: 14px;
            color: #666;
            margin: 5px 0 0;
        }
        .screenshots {
            padding: 20px;
        }
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }
        .screenshot-item {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: white;
        }
        .screenshot-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .screenshot-item img:hover {
            transform: scale(1.02);
        }
        .screenshot-caption {
            padding: 10px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
        }
        .no-screenshots {
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 40px;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
        }
        .modal img {
            display: block;
            margin: auto;
            max-width: 90%;
            max-height: 90%;
            margin-top: 5%;
        }
        .close {
            position: absolute;
            top: 20px;
            right: 30px;
            color: white;
            font-size: 40px;
            cursor: pointer;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Exocortex Plugin - Real E2E Test Results</h1>
        <p>Authentic screenshots from actual Obsidian application testing</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="stats">
        ${this.generateStatsCards()}
    </div>

    ${this.testResults.map(({ test, result, screenshots }) => `
    <div class="test-section">
        <div class="test-header">
            <h2 class="test-title">
                ${test.title}
                <span class="test-status ${result.status}">${result.status.toUpperCase()}</span>
            </h2>
            <div class="test-info">
                Duration: ${result.duration}ms | 
                File: ${test.location?.file || 'unknown'}
                ${result.error ? ` | Error: ${result.error.message}` : ''}
            </div>
        </div>
        <div class="screenshots">
            ${screenshots.length > 0 ? `
                <div class="screenshot-grid">
                    ${screenshots.map((screenshot, index) => {
                      const filename = screenshot.split('/').pop() || `screenshot-${index}`;
                      const relativePath = screenshot.replace(process.cwd(), '.');
                      return `
                        <div class="screenshot-item">
                            <img src="${relativePath}" alt="${filename}" onclick="openModal('${relativePath}')">
                            <div class="screenshot-caption">${filename}</div>
                        </div>
                      `;
                    }).join('')}
                </div>
            ` : `
                <div class="no-screenshots">No screenshots captured for this test</div>
            `}
        </div>
    </div>
    `).join('')}

    <!-- Modal for fullsize images -->
    <div id="imageModal" class="modal" onclick="closeModal()">
        <span class="close" onclick="closeModal()">&times;</span>
        <img id="modalImage" src="" alt="Full size screenshot">
    </div>

    <script>
        function openModal(src) {
            document.getElementById('imageModal').style.display = 'block';
            document.getElementById('modalImage').src = src;
        }
        
        function closeModal() {
            document.getElementById('imageModal').style.display = 'none';
        }
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>
</html>`;

    const galleryPath = join(this.screenshotDir, 'gallery.html');
    fs.writeFileSync(galleryPath, galleryHTML);
  }

  private generateStatsCards(): string {
    const stats = this.testResults.reduce((acc, { result }) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      acc.total++;
      return acc;
    }, { total: 0, passed: 0, failed: 0, skipped: 0 } as Record<string, number>);

    return `
      <div class="stat-card">
        <div class="stat-number">${stats.total}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #28a745">${stats.passed || 0}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #dc3545">${stats.failed || 0}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #ffc107">${stats.skipped || 0}</div>
        <div class="stat-label">Skipped</div>
      </div>
    `;
  }

  private async generateDetailedReport() {
    const report = {
      generated: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.result.status === 'passed').length,
        failed: this.testResults.filter(r => r.result.status === 'failed').length,
        skipped: this.testResults.filter(r => r.result.status === 'skipped').length
      },
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        obsidianPath: process.env.OBSIDIAN_PATH || 'default'
      },
      tests: this.testResults.map(({ test, result, screenshots }) => ({
        title: test.title,
        status: result.status,
        duration: result.duration,
        file: test.location?.file,
        error: result.error?.message,
        screenshots: screenshots.map(s => s.replace(process.cwd(), '.')),
        screenshotCount: screenshots.length
      }))
    };

    const reportPath = join(this.screenshotDir, 'detailed-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }
}

export default ScreenshotReporter;