#!/usr/bin/env node

/**
 * BDD Coverage Report Generator
 * 
 * Generates comprehensive HTML and JSON reports for BDD test coverage
 * including interactive visualizations, trend analysis, and actionable insights.
 * 
 * Usage: node scripts/generate-bdd-report.js [--output=reports] [--format=html,json]
 */

const fs = require('fs');
const path = require('path');
const { BDDCoverageValidator } = require('./validate-bdd-coverage');

// Configuration
const DEFAULT_OUTPUT_DIR = 'reports/bdd-coverage';
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'bdd-reports');

class BDDReportGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
    this.formats = options.formats || ['html', 'json'];
    this.includeHistory = options.includeHistory !== false;
    this.projectRoot = process.cwd();
    this.timestamp = new Date().toISOString();
    
    this.validator = new BDDCoverageValidator({ verbose: true });
    this.reportData = null;
    this.historicalData = [];
  }

  /**
   * Generate comprehensive BDD coverage reports
   */
  async generate() {
    console.log('🎯 Generating BDD Coverage Reports...');
    console.log('═'.repeat(50));
    
    try {
      // Ensure output directory exists
      this.ensureDirectoryExists(this.outputDir);
      
      // Run coverage analysis
      console.log('📊 Running coverage analysis...');
      await this.runCoverageAnalysis();
      
      // Load historical data if available
      if (this.includeHistory) {
        console.log('📈 Loading historical data...');
        this.loadHistoricalData();
      }
      
      // Generate reports in requested formats
      for (const format of this.formats) {
        console.log(`📝 Generating ${format.toUpperCase()} report...`);
        await this.generateReport(format);
      }
      
      // Update historical data
      if (this.includeHistory) {
        this.updateHistoricalData();
      }
      
      console.log('\n✅ Report generation completed!');
      console.log(`📁 Reports saved to: ${path.resolve(this.outputDir)}`);
      
      return {
        success: true,
        outputDir: this.outputDir,
        formats: this.formats,
        coverage: this.reportData.coverage.percentage
      };
      
    } catch (error) {
      console.error(`❌ Report generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run BDD coverage analysis
   */
  async runCoverageAnalysis() {
    try {
      // Run validation directly to get data
      const validator = new BDDCoverageValidator({ 
        verbose: false, 
        json: false, // Don't output JSON to console
        threshold: 80 
      });
      
      // Validate and get results
      await validator.validate();
      
      // Get the coverage data directly
      this.reportData = {
        timestamp: this.timestamp,
        threshold: validator.threshold,
        coverage: {
          percentage: validator.coverage.percentage,
          totalSteps: validator.coverage.totalSteps,
          implementedSteps: validator.coverage.implementedSteps,
          missingSteps: validator.coverage.missingSteps.length
        },
        passed: validator.coverage.percentage >= validator.threshold,
        details: {
          missingSteps: validator.coverage.missingSteps,
          unusedImplementations: validator.coverage.unusedImplementations,
          files: Object.fromEntries(validator.coverage.byFile)
        }
      };
      
      // Enhance report data with additional metrics
      this.enhanceReportData();
      
    } catch (error) {
      throw new Error(`Coverage analysis failed: ${error.message}`);
    }
  }

  /**
   * Enhance report data with additional metrics and analysis
   */
  enhanceReportData() {
    if (!this.reportData) return;
    
    // Add file-level statistics
    this.reportData.fileStats = this.calculateFileStats();
    
    // Add step type analysis
    this.reportData.stepTypeAnalysis = this.analyzeStepTypes();
    
    // Add complexity metrics
    this.reportData.complexityMetrics = this.calculateComplexityMetrics();
    
    // Add quality indicators
    this.reportData.qualityIndicators = this.calculateQualityIndicators();
    
    // Add recommendations
    this.reportData.recommendations = this.generateRecommendations();
  }

  /**
   * Calculate file-level statistics
   */
  calculateFileStats() {
    const stats = {
      totalFiles: 0,
      featureFiles: 0,
      stepDefinitionFiles: 0,
      avgStepsPerFeature: 0,
      maxStepsInFeature: 0,
      minStepsInFeature: Infinity,
      fileDetails: []
    };
    
    if (!this.reportData.details?.files) return stats;
    
    let totalSteps = 0;
    let featureStepCounts = [];
    
    for (const [fileName, fileData] of Object.entries(this.reportData.details.files)) {
      stats.totalFiles++;
      
      if (fileData.type === 'feature') {
        stats.featureFiles++;
        const stepCount = fileData.totalSteps || 0;
        featureStepCounts.push(stepCount);
        totalSteps += stepCount;
        
        stats.maxStepsInFeature = Math.max(stats.maxStepsInFeature, stepCount);
        stats.minStepsInFeature = Math.min(stats.minStepsInFeature, stepCount);
      } else if (fileData.type === 'step-definition') {
        stats.stepDefinitionFiles++;
      }
      
      stats.fileDetails.push({
        name: fileName,
        type: fileData.type,
        steps: fileData.totalSteps || 0,
        implementations: fileData.totalImplementations || 0
      });
    }
    
    stats.avgStepsPerFeature = stats.featureFiles > 0 ? totalSteps / stats.featureFiles : 0;
    if (stats.minStepsInFeature === Infinity) stats.minStepsInFeature = 0;
    
    return stats;
  }

  /**
   * Analyze step types distribution
   */
  analyzeStepTypes() {
    const analysis = {
      Given: { count: 0, implemented: 0 },
      When: { count: 0, implemented: 0 },
      Then: { count: 0, implemented: 0 },
      And: { count: 0, implemented: 0 },
      But: { count: 0, implemented: 0 }
    };
    
    if (!this.reportData.details?.missingSteps) return analysis;
    
    // Count missing steps by type
    for (const step of this.reportData.details.missingSteps) {
      const type = step.type || 'Unknown';
      if (analysis[type]) {
        analysis[type].count++;
      }
    }
    
    // Calculate implementation rates
    const totalSteps = this.reportData.coverage.totalSteps;
    const implementedSteps = this.reportData.coverage.implementedSteps;
    
    for (const [type, data] of Object.entries(analysis)) {
      data.implemented = Math.max(0, (totalSteps / 5) - data.count); // Rough estimate
      data.percentage = data.count + data.implemented > 0 
        ? (data.implemented / (data.count + data.implemented)) * 100 
        : 100;
    }
    
    return analysis;
  }

  /**
   * Calculate complexity metrics
   */
  calculateComplexityMetrics() {
    return {
      scenarioComplexity: this.calculateScenarioComplexity(),
      stepParameterization: this.calculateStepParameterization(),
      reuseability: this.calculateReuseability(),
      maintainability: this.calculateMaintainability()
    };
  }

  calculateScenarioComplexity() {
    // Estimate based on average steps per scenario
    const avgSteps = this.reportData.fileStats?.avgStepsPerFeature || 0;
    if (avgSteps <= 5) return { level: 'Low', score: 1 };
    if (avgSteps <= 10) return { level: 'Medium', score: 2 };
    return { level: 'High', score: 3 };
  }

  calculateStepParameterization() {
    // Estimate based on unused implementations ratio
    const totalImplementations = this.reportData.details?.unusedImplementations?.length || 0;
    const implementedSteps = this.reportData.coverage.implementedSteps;
    const ratio = implementedSteps > 0 ? totalImplementations / implementedSteps : 0;
    
    return {
      unusedRatio: ratio,
      level: ratio < 0.1 ? 'Good' : ratio < 0.3 ? 'Medium' : 'Poor',
      score: ratio < 0.1 ? 3 : ratio < 0.3 ? 2 : 1
    };
  }

  calculateReuseability() {
    // Higher reusability indicates better step design
    const totalSteps = this.reportData.coverage.totalSteps;
    const implementations = this.reportData.coverage.implementedSteps;
    const reuseRatio = implementations > 0 ? totalSteps / implementations : 1;
    
    return {
      ratio: reuseRatio,
      level: reuseRatio > 2 ? 'High' : reuseRatio > 1.5 ? 'Medium' : 'Low',
      score: reuseRatio > 2 ? 3 : reuseRatio > 1.5 ? 2 : 1
    };
  }

  calculateMaintainability() {
    // Based on coverage percentage and missing steps distribution
    const coverage = this.reportData.coverage.percentage;
    const missingSteps = this.reportData.details?.missingSteps?.length || 0;
    
    let score = 0;
    if (coverage >= 90) score = 3;
    else if (coverage >= 70) score = 2;
    else score = 1;
    
    if (missingSteps > 20) score = Math.max(1, score - 1);
    
    return {
      level: score === 3 ? 'High' : score === 2 ? 'Medium' : 'Low',
      score,
      coverage,
      missingSteps
    };
  }

  /**
   * Calculate quality indicators
   */
  calculateQualityIndicators() {
    const indicators = [];
    
    const coverage = this.reportData.coverage.percentage;
    const missingSteps = this.reportData.details?.missingSteps?.length || 0;
    const unusedImplementations = this.reportData.details?.unusedImplementations?.length || 0;
    
    // Coverage indicator
    if (coverage >= 90) {
      indicators.push({ type: 'success', message: 'Excellent test coverage' });
    } else if (coverage >= 70) {
      indicators.push({ type: 'warning', message: 'Good test coverage, room for improvement' });
    } else {
      indicators.push({ type: 'error', message: 'Low test coverage requires attention' });
    }
    
    // Missing steps indicator
    if (missingSteps === 0) {
      indicators.push({ type: 'success', message: 'All steps implemented' });
    } else if (missingSteps <= 5) {
      indicators.push({ type: 'info', message: `${missingSteps} missing step implementations` });
    } else {
      indicators.push({ type: 'warning', message: `${missingSteps} missing step implementations` });
    }
    
    // Unused implementations indicator
    if (unusedImplementations > 0) {
      indicators.push({ type: 'info', message: `${unusedImplementations} unused step implementations` });
    }
    
    return indicators;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    const coverage = this.reportData.coverage.percentage;
    const missingSteps = this.reportData.details?.missingSteps || [];
    const unusedImplementations = this.reportData.details?.unusedImplementations || [];
    
    // Coverage recommendations
    if (coverage < 80) {
      recommendations.push({
        priority: 'High',
        category: 'Coverage',
        title: 'Improve test coverage',
        description: 'Implement missing step definitions to reach minimum 80% coverage',
        action: `Implement ${missingSteps.length} missing step definitions`,
        impact: 'High'
      });
    }
    
    // Missing steps recommendations
    if (missingSteps.length > 0) {
      const stepsByType = missingSteps.reduce((acc, step) => {
        acc[step.type] = (acc[step.type] || 0) + 1;
        return acc;
      }, {});
      
      const mostCommonType = Object.entries(stepsByType)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      if (mostCommonType) {
        recommendations.push({
          priority: 'Medium',
          category: 'Implementation',
          title: `Focus on ${mostCommonType} steps`,
          description: `Most missing implementations are ${mostCommonType} steps`,
          action: `Start with implementing ${stepsByType[mostCommonType]} ${mostCommonType} steps`,
          impact: 'Medium'
        });
      }
    }
    
    // Unused implementations recommendations
    if (unusedImplementations.length > 5) {
      recommendations.push({
        priority: 'Low',
        category: 'Cleanup',
        title: 'Remove unused step implementations',
        description: 'Clean up unused step implementations to reduce maintenance overhead',
        action: `Review and remove ${unusedImplementations.length} unused implementations`,
        impact: 'Low'
      });
    }
    
    // File organization recommendations
    const fileStats = this.reportData.fileStats;
    if (fileStats?.maxStepsInFeature > 20) {
      recommendations.push({
        priority: 'Medium',
        category: 'Organization',
        title: 'Break down large feature files',
        description: 'Large feature files are harder to maintain',
        action: `Consider splitting feature files with more than 20 steps`,
        impact: 'Medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Load historical coverage data
   */
  loadHistoricalData() {
    const historyFile = path.join(this.outputDir, 'coverage-history.json');
    
    try {
      if (fs.existsSync(historyFile)) {
        const content = fs.readFileSync(historyFile, 'utf8');
        this.historicalData = JSON.parse(content);
      }
    } catch (error) {
      console.warn(`⚠️  Could not load historical data: ${error.message}`);
      this.historicalData = [];
    }
  }

  /**
   * Update historical coverage data
   */
  updateHistoricalData() {
    const historyEntry = {
      timestamp: this.timestamp,
      coverage: this.reportData.coverage.percentage,
      totalSteps: this.reportData.coverage.totalSteps,
      implementedSteps: this.reportData.coverage.implementedSteps,
      missingSteps: this.reportData.details?.missingSteps?.length || 0,
      passed: this.reportData.passed
    };
    
    this.historicalData.push(historyEntry);
    
    // Keep only last 50 entries
    if (this.historicalData.length > 50) {
      this.historicalData = this.historicalData.slice(-50);
    }
    
    const historyFile = path.join(this.outputDir, 'coverage-history.json');
    fs.writeFileSync(historyFile, JSON.stringify(this.historicalData, null, 2));
  }

  /**
   * Generate report in specified format
   */
  async generateReport(format) {
    switch (format.toLowerCase()) {
      case 'json':
        await this.generateJSONReport();
        break;
      case 'html':
        await this.generateHTMLReport();
        break;
      case 'xml':
        await this.generateXMLReport();
        break;
      case 'csv':
        await this.generateCSVReport();
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport() {
    const reportFile = path.join(this.outputDir, 'coverage-report.json');
    
    const report = {
      ...this.reportData,
      generatedAt: this.timestamp,
      generator: 'BDD Coverage Report Generator v1.0',
      history: this.historicalData
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`  ✅ JSON report: ${reportFile}`);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport() {
    const reportFile = path.join(this.outputDir, 'coverage-report.html');
    
    const template = this.getHTMLTemplate();
    const html = this.populateHTMLTemplate(template);
    
    fs.writeFileSync(reportFile, html);
    console.log(`  ✅ HTML report: ${reportFile}`);
    
    // Generate assets
    this.generateHTMLAssets();
  }

  /**
   * Get HTML template
   */
  getHTMLTemplate() {
    const templateFile = path.join(TEMPLATE_DIR, 'report-template.html');
    
    if (fs.existsSync(templateFile)) {
      return fs.readFileSync(templateFile, 'utf8');
    }
    
    // Fallback inline template
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BDD Coverage Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .content { padding: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid; }
        .metric.success { border-left-color: #28a745; }
        .metric.warning { border-left-color: #ffc107; }
        .metric.danger { border-left-color: #dc3545; }
        .metric .value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric .label { color: #666; text-transform: uppercase; font-size: 0.8em; letter-spacing: 1px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .chart-container { height: 300px; margin: 20px 0; }
        .missing-steps { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; }
        .missing-step { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #dc3545; }
        .recommendations { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; }
        .recommendation { margin: 15px 0; padding: 15px; background: white; border-radius: 4px; border-left: 3px solid #17a2b8; }
        .recommendation .priority { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; color: white; margin-right: 10px; }
        .priority.high { background: #dc3545; }
        .priority.medium { background: #ffc107; color: #333; }
        .priority.low { background: #28a745; }
        .file-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .file-card { background: #f8f9fa; border-radius: 8px; padding: 15px; border-left: 4px solid #667eea; }
        .timestamp { color: #666; font-size: 0.9em; text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 BDD Coverage Report</h1>
            <div class="subtitle">Generated on {{timestamp}}</div>
        </div>
        
        <div class="content">
            <!-- Metrics -->
            <div class="metrics">
                <div class="metric {{coverageClass}}">
                    <div class="value">{{coverage}}%</div>
                    <div class="label">Coverage</div>
                </div>
                <div class="metric">
                    <div class="value">{{totalSteps}}</div>
                    <div class="label">Total Steps</div>
                </div>
                <div class="metric">
                    <div class="value">{{implementedSteps}}</div>
                    <div class="label">Implemented</div>
                </div>
                <div class="metric {{missingClass}}">
                    <div class="value">{{missingSteps}}</div>
                    <div class="label">Missing</div>
                </div>
            </div>
            
            <!-- Coverage Trend Chart -->
            {{#hasHistory}}
            <div class="section">
                <h2>📈 Coverage Trend</h2>
                <div class="chart-container">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
            {{/hasHistory}}
            
            <!-- Missing Steps -->
            {{#hasMissingSteps}}
            <div class="section">
                <h2>❌ Missing Step Implementations</h2>
                <div class="missing-steps">
                    {{#missingSteps}}
                    <div class="missing-step">
                        <strong>{{type}}</strong> "{{text}}"<br>
                        <small>📄 {{file}}:{{line}} {{#scenario}}in {{scenario}}{{/scenario}}</small>
                    </div>
                    {{/missingSteps}}
                </div>
            </div>
            {{/hasMissingSteps}}
            
            <!-- Recommendations -->
            {{#hasRecommendations}}
            <div class="section">
                <h2>💡 Recommendations</h2>
                <div class="recommendations">
                    {{#recommendations}}
                    <div class="recommendation">
                        <span class="priority {{priorityClass}}">{{priority}}</span>
                        <strong>{{title}}</strong><br>
                        {{description}}<br>
                        <em>Action: {{action}}</em>
                    </div>
                    {{/recommendations}}
                </div>
            </div>
            {{/hasRecommendations}}
            
            <!-- File Details -->
            <div class="section">
                <h2>📁 File Breakdown</h2>
                <div class="file-details">
                    {{#fileDetails}}
                    <div class="file-card">
                        <strong>{{name}}</strong><br>
                        Type: {{type}}<br>
                        {{#steps}}Steps: {{steps}}{{/steps}}
                        {{#implementations}}Implementations: {{implementations}}{{/implementations}}
                    </div>
                    {{/fileDetails}}
                </div>
            </div>
            
            <div class="timestamp">
                Report generated by BDD Coverage Report Generator v1.0
            </div>
        </div>
    </div>
    
    <script>
        // Coverage trend chart
        {{#hasHistory}}
        const ctx = document.getElementById('trendChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: {{{historyLabels}}},
                datasets: [{
                    label: 'Coverage %',
                    data: {{{historyData}}},
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        {{/hasHistory}}
    </script>
</body>
</html>`;
  }

  /**
   * Populate HTML template with data
   */
  populateHTMLTemplate(template) {
    const data = {
      timestamp: new Date(this.timestamp).toLocaleString(),
      coverage: this.reportData.coverage.percentage.toFixed(1),
      coverageClass: this.reportData.coverage.percentage >= 80 ? 'success' : 
                    this.reportData.coverage.percentage >= 60 ? 'warning' : 'danger',
      totalSteps: this.reportData.coverage.totalSteps,
      implementedSteps: this.reportData.coverage.implementedSteps,
      missingSteps: this.reportData.coverage.missingSteps,
      missingClass: this.reportData.coverage.missingSteps === 0 ? 'success' : 
                    this.reportData.coverage.missingSteps <= 5 ? 'warning' : 'danger',
      hasMissingSteps: this.reportData.details?.missingSteps?.length > 0,
      hasRecommendations: this.reportData.recommendations?.length > 0,
      hasHistory: this.historicalData.length > 1,
      historyLabels: JSON.stringify(
        this.historicalData.map(h => new Date(h.timestamp).toLocaleDateString())
      ),
      historyData: JSON.stringify(
        this.historicalData.map(h => h.coverage.toFixed(1))
      ),
      fileDetails: this.reportData.fileStats?.fileDetails || []
    };
    
    // Process missing steps
    if (data.hasMissingSteps) {
      data.missingSteps = this.reportData.details.missingSteps.map(step => ({
        ...step,
        scenario: step.scenario ? step.scenario.replace(/^Scenario:?\s*/i, '') : null
      }));
    }
    
    // Process recommendations
    if (data.hasRecommendations) {
      data.recommendations = this.reportData.recommendations.map(rec => ({
        ...rec,
        priorityClass: rec.priority.toLowerCase()
      }));
    }
    
    // Simple template replacement
    let html = template;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'boolean') {
        // Handle conditional blocks
        const ifPattern = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
        html = html.replace(ifPattern, value ? '$1' : '');
      } else if (Array.isArray(value)) {
        // Handle arrays (simple iteration)
        const arrayPattern = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
        html = html.replace(arrayPattern, (match, template) => {
          return value.map(item => {
            let itemHtml = template;
            for (const [itemKey, itemValue] of Object.entries(item)) {
              itemHtml = itemHtml.replace(new RegExp(`{{${itemKey}}}`, 'g'), itemValue || '');
            }
            return itemHtml;
          }).join('');
        });
      } else {
        // Handle simple replacements
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        html = html.replace(new RegExp(`{{{${key}}}}`, 'g'), value || '');
      }
    }
    
    return html;
  }

  /**
   * Generate HTML report assets
   */
  generateHTMLAssets() {
    // Create CSS file for custom styling
    const cssFile = path.join(this.outputDir, 'report-styles.css');
    const css = `
/* Additional custom styles for BDD coverage report */
.coverage-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
  text-transform: uppercase;
}

.coverage-excellent { background: #d4edda; color: #155724; }
.coverage-good { background: #fff3cd; color: #856404; }
.coverage-poor { background: #f8d7da; color: #721c24; }

.step-implementation {
  font-family: 'Monaco', 'Consolas', monospace;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #28a745;
  margin: 10px 0;
}

.interactive-filters {
  margin: 20px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-button:hover { background: #f8f9fa; }
.filter-button.active { background: #667eea; color: white; }
`;
    
    fs.writeFileSync(cssFile, css);
  }

  /**
   * Generate XML report (JUnit format for CI integration)
   */
  async generateXMLReport() {
    const reportFile = path.join(this.outputDir, 'coverage-report.xml');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="BDD Coverage" tests="${this.reportData.coverage.totalSteps}" 
             failures="${this.reportData.coverage.missingSteps}" 
             time="0" timestamp="${this.timestamp}">
    <properties>
      <property name="coverage.percentage" value="${this.reportData.coverage.percentage}"/>
      <property name="coverage.threshold" value="${this.reportData.threshold}"/>
      <property name="coverage.passed" value="${this.reportData.passed}"/>
    </properties>
    ${this.reportData.details?.missingSteps?.map(step => `
    <testcase name="${step.type}: ${step.text}" classname="${step.file}">
      <failure message="Missing step implementation" type="MissingImplementation">
        Step "${step.text}" in ${step.file}:${step.line} is not implemented
      </failure>
    </testcase>`).join('') || ''}
  </testsuite>
</testsuites>`;
    
    fs.writeFileSync(reportFile, xml);
    console.log(`  ✅ XML report: ${reportFile}`);
  }

  /**
   * Generate CSV report for data analysis
   */
  async generateCSVReport() {
    const reportFile = path.join(this.outputDir, 'coverage-report.csv');
    
    const csvLines = [
      'File,Type,Steps,Implementations,Coverage',
      ...Object.entries(this.reportData.details?.files || {}).map(([file, data]) => {
        const steps = data.totalSteps || 0;
        const implementations = data.totalImplementations || 0;
        const coverage = data.type === 'feature' && steps > 0 ? 
          ((steps - (this.reportData.details?.missingSteps?.filter(s => s.file === file).length || 0)) / steps * 100).toFixed(1) : 
          'N/A';
        return `"${file}","${data.type}",${steps},${implementations},"${coverage}%"`;
      })
    ];
    
    fs.writeFileSync(reportFile, csvLines.join('\n'));
    console.log(`  ✅ CSV report: ${reportFile}`);
  }

  /**
   * Ensure directory exists
   */
  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    outputDir: DEFAULT_OUTPUT_DIR,
    formats: ['html', 'json']
  };
  
  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      options.formats = arg.split('=')[1].split(',');
    } else if (arg === '--no-history') {
      options.includeHistory = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
BDD Coverage Report Generator

Usage: node scripts/generate-bdd-report.js [options]

Options:
  --output=<dir>        Output directory (default: reports/bdd-coverage)
  --format=<formats>    Report formats: html,json,xml,csv (default: html,json)
  --no-history          Don't include historical data
  --help, -h            Show this help message

Examples:
  node scripts/generate-bdd-report.js
  node scripts/generate-bdd-report.js --output=reports/custom --format=html,xml
      `);
      process.exit(0);
    }
  }
  
  try {
    const generator = new BDDReportGenerator(options);
    const result = await generator.generate();
    
    console.log('\n📊 Report Summary:');
    console.log(`   Coverage: ${result.coverage}%`);
    console.log(`   Output: ${result.outputDir}`);
    console.log(`   Formats: ${result.formats.join(', ')}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Export for testing
module.exports = { BDDReportGenerator };

// Run if called directly
if (require.main === module) {
  main();
}