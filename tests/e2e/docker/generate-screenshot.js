#!/usr/bin/env node

/**
 * Generate SVG Screenshots for Test Results
 * Creates actual viewable images with test information
 */

const fs = require('fs');
const path = require('path');

class ScreenshotGenerator {
    constructor() {
        this.width = 1200;
        this.height = 800;
    }
    
    generateSVG(testName, step, status, details) {
        const bgColor = status === 'PASS' ? '#10b981' : status === 'FAIL' ? '#ef4444' : '#3b82f6';
        const bgGradient = status === 'PASS' ? '#34d399' : status === 'FAIL' ? '#f87171' : '#60a5fa';
        
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgGradient};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.2"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- Background -->
    <rect width="${this.width}" height="${this.height}" fill="url(#bg-gradient)"/>
    
    <!-- Pattern overlay -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1" opacity="0.1"/>
    </pattern>
    <rect width="${this.width}" height="${this.height}" fill="url(#grid)"/>
    
    <!-- Main card -->
    <rect x="100" y="100" width="${this.width - 200}" height="${this.height - 200}" 
          rx="20" fill="white" filter="url(#shadow)"/>
    
    <!-- Status badge -->
    <rect x="150" y="150" width="120" height="40" rx="20" 
          fill="${bgColor}" opacity="0.2"/>
    <text x="210" y="175" font-family="Arial, sans-serif" font-size="16" 
          font-weight="bold" text-anchor="middle" fill="${bgColor}">
        ${status}
    </text>
    
    <!-- Test name -->
    <text x="150" y="250" font-family="Arial, sans-serif" font-size="32" 
          font-weight="bold" fill="#1f2937">
        ${this.escapeXml(testName)}
    </text>
    
    <!-- Step -->
    <text x="150" y="290" font-family="Arial, sans-serif" font-size="20" 
          fill="#6b7280">
        Step: ${this.escapeXml(step)}
    </text>
    
    <!-- Details section -->
    <rect x="150" y="330" width="${this.width - 400}" height="1" fill="#e5e7eb"/>
    
    ${this.generateDetailsSection(details, 150, 370)}
    
    <!-- Timestamp -->
    <text x="150" y="${this.height - 150}" font-family="Arial, sans-serif" 
          font-size="14" fill="#9ca3af">
        ${new Date().toISOString()}
    </text>
    
    <!-- Logo/Branding -->
    <text x="${this.width - 150}" y="${this.height - 150}" 
          font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="end">
        Exocortex E2E Tests
    </text>
    
    <!-- Decorative elements -->
    <circle cx="${this.width - 180}" cy="180" r="30" fill="${bgColor}" opacity="0.1"/>
    <circle cx="${this.width - 150}" cy="210" r="20" fill="${bgGradient}" opacity="0.1"/>
    <circle cx="${this.width - 200}" cy="220" r="15" fill="${bgColor}" opacity="0.1"/>
</svg>`;
        
        return svg;
    }
    
    generateDetailsSection(details, x, y) {
        if (!details || typeof details !== 'object') {
            return '';
        }
        
        let svgContent = '';
        let currentY = y;
        
        for (const [key, value] of Object.entries(details)) {
            // Key
            svgContent += `
                <text x="${x}" y="${currentY}" font-family="Arial, sans-serif" 
                      font-size="16" font-weight="bold" fill="#374151">
                    ${this.escapeXml(key)}:
                </text>`;
            
            // Value
            svgContent += `
                <text x="${x + 150}" y="${currentY}" font-family="Arial, sans-serif" 
                      font-size="16" fill="#6b7280">
                    ${this.escapeXml(String(value))}
                </text>`;
            
            currentY += 30;
            
            if (currentY > this.height - 200) break; // Don't overflow
        }
        
        return svgContent;
    }
    
    escapeXml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    generateTestScreenshot(testName, step, status, details, outputPath) {
        const svg = this.generateSVG(testName, step, status, details);
        fs.writeFileSync(outputPath, svg);
        return outputPath;
    }
    
    generateHTMLPreview(screenshots, outputPath) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Test Screenshots</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            padding: 20px;
            margin: 0;
        }
        h1 {
            color: #1f2937;
            text-align: center;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .screenshot-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .screenshot-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        }
        .screenshot-image {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-info {
            padding: 15px;
            border-top: 1px solid #e5e7eb;
        }
        .screenshot-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .screenshot-meta {
            font-size: 14px;
            color: #6b7280;
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
            background: #dcfce7;
            color: #166534;
        }
        .status-fail {
            background: #fee2e2;
            color: #991b1b;
        }
        .filter-buttons {
            text-align: center;
            margin: 20px 0;
        }
        .filter-btn {
            padding: 8px 16px;
            margin: 0 5px;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .filter-btn:hover {
            border-color: #3b82f6;
            background: #eff6ff;
        }
        .filter-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
    </style>
</head>
<body>
    <h1>📸 E2E Test Screenshots</h1>
    
    <div class="filter-buttons">
        <button class="filter-btn active" onclick="filterScreenshots('all')">All</button>
        <button class="filter-btn" onclick="filterScreenshots('pass')">✅ Passed</button>
        <button class="filter-btn" onclick="filterScreenshots('fail')">❌ Failed</button>
    </div>
    
    <div class="gallery" id="gallery">
        ${screenshots.map(s => `
            <div class="screenshot-card" data-status="${s.status.toLowerCase()}">
                <img src="${s.filename}" alt="${s.testName}" class="screenshot-image">
                <div class="screenshot-info">
                    <div class="screenshot-title">
                        ${s.testName}
                        <span class="status-badge status-${s.status.toLowerCase()}">${s.status}</span>
                    </div>
                    <div class="screenshot-meta">
                        Step: ${s.step} | ${s.timestamp}
                    </div>
                </div>
            </div>
        `).join('')}
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
                } else if (card.dataset.status === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>`;
        
        fs.writeFileSync(outputPath, html);
    }
}

// Export for use in tests
module.exports = ScreenshotGenerator;

// CLI usage
if (require.main === module) {
    const generator = new ScreenshotGenerator();
    
    // Example: Generate sample screenshots
    const outputDir = path.join(__dirname, 'test-results/screenshots');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate sample screenshots
    const samples = [
        {
            testName: 'Docker Container Health',
            step: 'initial',
            status: 'PASS',
            details: {
                'Container': 'obsidian-e2e-simple',
                'Status': 'Healthy',
                'Port': '8084',
                'Response': 'HTTP 200 OK'
            }
        },
        {
            testName: 'Plugin Components',
            step: 'verification',
            status: 'PASS',
            details: {
                'DynamicLayout': '3 references',
                'UniversalLayout': '7 references',
                'CreateAssetModal': '2 references',
                'exo__Instance_class': '58 references'
            }
        },
        {
            testName: 'Obsidian UI Loading',
            step: 'final',
            status: 'PASS',
            details: {
                'Version': '0.15.9',
                'Interface': 'Loaded',
                'Elements': 'All present',
                'Performance': '5ms response'
            }
        }
    ];
    
    const screenshots = [];
    samples.forEach((sample, index) => {
        const filename = `sample_${index + 1}.svg`;
        const filepath = path.join(outputDir, filename);
        generator.generateTestScreenshot(
            sample.testName,
            sample.step,
            sample.status,
            sample.details,
            filepath
        );
        screenshots.push({
            ...sample,
            filename,
            timestamp: new Date().toISOString()
        });
        console.log(`Generated: ${filename}`);
    });
    
    // Generate HTML gallery
    generator.generateHTMLPreview(screenshots, path.join(outputDir, 'gallery.html'));
    console.log('Generated: gallery.html');
    console.log(`\nView gallery: open ${path.join(outputDir, 'gallery.html')}`);
}