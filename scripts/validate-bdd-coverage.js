#!/usr/bin/env node

/**
 * BDD Step Coverage Validation Script
 * 
 * This script validates that all BDD steps in feature files have corresponding
 * implementations in step definition files. It calculates coverage percentage
 * and fails if below the minimum threshold.
 * 
 * Usage: node scripts/validate-bdd-coverage.js [--threshold=80] [--verbose] [--json]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');

// Configuration
const DEFAULT_THRESHOLD = 80;
const FEATURE_DIRECTORIES = [
  'features',
  'tests/bdd/features'
];
const STEP_DEFINITION_DIRECTORIES = [
  'features/step-definitions',
  'tests/bdd/step-definitions'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class BDDCoverageValidator {
  constructor(options = {}) {
    this.threshold = options.threshold || DEFAULT_THRESHOLD;
    this.verbose = options.verbose || false;
    this.json = options.json || false;
    this.projectRoot = process.cwd();
    
    this.steps = new Set();
    this.implementedSteps = new Set();
    this.stepPatterns = new Map();
    this.featureFiles = [];
    this.stepDefinitionFiles = [];
    this.coverage = {
      totalSteps: 0,
      implementedSteps: 0,
      percentage: 0,
      missingSteps: [],
      unusedImplementations: [],
      byFile: new Map()
    };
  }

  /**
   * Main validation entry point
   */
  async validate() {
    try {
      this.log(`${colors.cyan}🎯 BDD Step Coverage Validation${colors.reset}`, 'info');
      this.log(`${'='.repeat(50)}`, 'info');
      
      // Discovery phase
      await this.discoverFiles();
      
      // Analysis phase
      await this.analyzeFeatureFiles();
      await this.analyzeStepDefinitions();
      
      // Coverage calculation
      this.calculateCoverage();
      
      // Reporting
      if (this.json) {
        this.outputJsonReport();
      } else {
        this.outputTextReport();
      }
      
      // Validation result
      return this.validateThreshold();
      
    } catch (error) {
      this.log(`${colors.red}❌ Validation failed: ${error.message}${colors.reset}`, 'error');
      throw error;
    }
  }

  /**
   * Discover feature and step definition files
   */
  async discoverFiles() {
    this.log(`${colors.blue}🔍 Discovering files...${colors.reset}`, 'info');
    
    // Find feature files
    for (const dir of FEATURE_DIRECTORIES) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        const pattern = path.join(dirPath, '**/*.feature');
        const files = glob.sync(pattern);
        this.featureFiles.push(...files);
      }
    }
    
    // Find step definition files
    for (const dir of STEP_DEFINITION_DIRECTORIES) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        const pattern = path.join(dirPath, '**/*.{ts,js}');
        const files = glob.sync(pattern);
        this.stepDefinitionFiles.push(...files);
      }
    }
    
    this.log(`Found ${this.featureFiles.length} feature files`, 'info');
    this.log(`Found ${this.stepDefinitionFiles.length} step definition files`, 'info');
    
    if (this.featureFiles.length === 0) {
      throw new Error('No feature files found');
    }
  }

  /**
   * Parse and analyze feature files to extract step definitions
   */
  async analyzeFeatureFiles() {
    this.log(`${colors.blue}📖 Analyzing feature files...${colors.reset}`, 'info');
    
    for (const featureFile of this.featureFiles) {
      const relativePath = path.relative(this.projectRoot, featureFile);
      const fileSteps = new Set();
      
      try {
        const content = fs.readFileSync(featureFile, 'utf8');
        const lines = content.split('\n');
        
        let inScenario = false;
        let currentScenario = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip comments and empty lines
          if (!line || line.startsWith('#')) continue;
          
          // Track scenarios for context
          if (line.match(/^\s*Scenario/)) {
            inScenario = true;
            currentScenario = line;
            continue;
          }
          
          // Extract Given/When/Then/And/But steps
          const stepMatch = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/);
          if (stepMatch) {
            const stepType = stepMatch[1];
            const stepText = stepMatch[2];
            const normalizedStep = this.normalizeStep(stepText);
            
            // Store step with context
            const stepInfo = {
              text: stepText,
              normalized: normalizedStep,
              type: stepType,
              file: relativePath,
              line: i + 1,
              scenario: currentScenario
            };
            
            this.steps.add(JSON.stringify(stepInfo));
            fileSteps.add(normalizedStep);
          }
        }
        
        this.coverage.byFile.set(relativePath, {
          type: 'feature',
          steps: Array.from(fileSteps),
          totalSteps: fileSteps.size
        });
        
        if (this.verbose) {
          this.log(`  📄 ${relativePath}: ${fileSteps.size} steps`, 'info');
        }
        
      } catch (error) {
        this.log(`⚠️  Error reading ${relativePath}: ${error.message}`, 'warning');
      }
    }
  }

  /**
   * Parse and analyze step definition files
   */
  async analyzeStepDefinitions() {
    this.log(`${colors.blue}🔧 Analyzing step definitions...${colors.reset}`, 'info');
    
    for (const stepFile of this.stepDefinitionFiles) {
      const relativePath = path.relative(this.projectRoot, stepFile);
      const fileImplementations = new Set();
      
      try {
        const content = fs.readFileSync(stepFile, 'utf8');
        
        // Extract step implementations using regex patterns
        const stepPatterns = [
          /Given\s*\(\s*['"](.*?)['"],/g,
          /When\s*\(\s*['"](.*?)['"],/g,
          /Then\s*\(\s*['"](.*?)['"],/g
        ];
        
        for (const pattern of stepPatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const stepPattern = match[1];
            const normalizedPattern = this.normalizeStepPattern(stepPattern);
            
            this.implementedSteps.add(normalizedPattern);
            this.stepPatterns.set(normalizedPattern, {
              original: stepPattern,
              file: relativePath,
              type: this.getStepType(pattern)
            });
            
            fileImplementations.add(normalizedPattern);
          }
        }
        
        this.coverage.byFile.set(relativePath, {
          type: 'step-definition',
          implementations: Array.from(fileImplementations),
          totalImplementations: fileImplementations.size
        });
        
        if (this.verbose) {
          this.log(`  🔧 ${relativePath}: ${fileImplementations.size} implementations`, 'info');
        }
        
      } catch (error) {
        this.log(`⚠️  Error reading ${relativePath}: ${error.message}`, 'warning');
      }
    }
  }

  /**
   * Calculate step coverage statistics
   */
  calculateCoverage() {
    this.log(`${colors.blue}📊 Calculating coverage...${colors.reset}`, 'info');
    
    const allSteps = new Set();
    const stepDetails = new Map();
    
    // Parse all steps from the stored JSON
    for (const stepJson of this.steps) {
      const stepInfo = JSON.parse(stepJson);
      allSteps.add(stepInfo.normalized);
      stepDetails.set(stepInfo.normalized, stepInfo);
    }
    
    this.coverage.totalSteps = allSteps.size;
    
    // Check which steps have implementations
    const implementedCount = new Set();
    const missingSteps = [];
    
    for (const step of allSteps) {
      let hasImplementation = false;
      
      // Direct match
      if (this.implementedSteps.has(step)) {
        hasImplementation = true;
        implementedCount.add(step);
      } else {
        // Pattern matching for parameterized steps
        for (const pattern of this.implementedSteps) {
          if (this.matchesPattern(step, pattern)) {
            hasImplementation = true;
            implementedCount.add(step);
            break;
          }
        }
      }
      
      if (!hasImplementation) {
        const stepInfo = stepDetails.get(step);
        missingSteps.push({
          text: stepInfo.text,
          normalized: step,
          file: stepInfo.file,
          line: stepInfo.line,
          scenario: stepInfo.scenario,
          type: stepInfo.type
        });
      }
    }
    
    this.coverage.implementedSteps = implementedCount.size;
    this.coverage.percentage = this.coverage.totalSteps > 0 
      ? (this.coverage.implementedSteps / this.coverage.totalSteps * 100)
      : 0;
    this.coverage.missingSteps = missingSteps;
    
    // Find unused implementations
    const unusedImplementations = [];
    for (const [pattern, info] of this.stepPatterns) {
      let isUsed = false;
      for (const step of allSteps) {
        if (this.matchesPattern(step, pattern) || step === pattern) {
          isUsed = true;
          break;
        }
      }
      if (!isUsed) {
        unusedImplementations.push({
          pattern: info.original,
          file: info.file,
          type: info.type
        });
      }
    }
    this.coverage.unusedImplementations = unusedImplementations;
  }

  /**
   * Output coverage report in JSON format
   */
  outputJsonReport() {
    const report = {
      timestamp: new Date().toISOString(),
      threshold: this.threshold,
      coverage: {
        percentage: parseFloat(this.coverage.percentage.toFixed(2)),
        totalSteps: this.coverage.totalSteps,
        implementedSteps: this.coverage.implementedSteps,
        missingSteps: this.coverage.missingSteps.length
      },
      passed: this.coverage.percentage >= this.threshold,
      details: {
        missingSteps: this.coverage.missingSteps,
        unusedImplementations: this.coverage.unusedImplementations,
        files: Object.fromEntries(this.coverage.byFile)
      }
    };
    
    console.log(JSON.stringify(report, null, 2));
  }

  /**
   * Output coverage report in text format
   */
  outputTextReport() {
    console.log('');
    this.log(`${colors.cyan}📈 BDD Step Coverage Report${colors.reset}`, 'info');
    this.log(`${'='.repeat(50)}`, 'info');
    console.log('');
    
    // Summary
    const percentage = this.coverage.percentage.toFixed(1);
    const statusColor = this.coverage.percentage >= this.threshold ? colors.green : colors.red;
    
    this.log(`${colors.bright}Coverage Summary:${colors.reset}`, 'info');
    this.log(`  Total Steps: ${this.coverage.totalSteps}`, 'info');
    this.log(`  Implemented: ${this.coverage.implementedSteps}`, 'info');
    this.log(`  Missing: ${this.coverage.missingSteps.length}`, 'info');
    this.log(`  Coverage: ${statusColor}${percentage}%${colors.reset}`, 'info');
    this.log(`  Threshold: ${this.threshold}%`, 'info');
    console.log('');
    
    // Missing steps details
    if (this.coverage.missingSteps.length > 0) {
      this.log(`${colors.red}❌ Missing Step Implementations (${this.coverage.missingSteps.length}):${colors.reset}`, 'error');
      this.log(`${'-'.repeat(50)}`, 'info');
      
      const groupedByFile = new Map();
      for (const step of this.coverage.missingSteps) {
        if (!groupedByFile.has(step.file)) {
          groupedByFile.set(step.file, []);
        }
        groupedByFile.get(step.file).push(step);
      }
      
      for (const [file, steps] of groupedByFile) {
        this.log(`\n  📄 ${file}:`, 'info');
        for (const step of steps) {
          this.log(`    ${colors.yellow}${step.type}${colors.reset} "${step.text}" ${colors.cyan}(line ${step.line})${colors.reset}`, 'info');
          if (this.verbose && step.scenario) {
            this.log(`      Context: ${step.scenario}`, 'info');
          }
        }
      }
      console.log('');
    }
    
    // Unused implementations
    if (this.coverage.unusedImplementations.length > 0 && this.verbose) {
      this.log(`${colors.yellow}⚠️  Unused Step Implementations (${this.coverage.unusedImplementations.length}):${colors.reset}`, 'warning');
      this.log(`${'-'.repeat(50)}`, 'info');
      
      for (const impl of this.coverage.unusedImplementations) {
        this.log(`  ${colors.magenta}${impl.type}${colors.reset} "${impl.pattern}" in ${impl.file}`, 'info');
      }
      console.log('');
    }
    
    // File breakdown
    if (this.verbose) {
      this.log(`${colors.blue}📁 File Breakdown:${colors.reset}`, 'info');
      this.log(`${'-'.repeat(50)}`, 'info');
      
      for (const [file, info] of this.coverage.byFile) {
        if (info.type === 'feature') {
          this.log(`  📄 ${file}: ${info.totalSteps} steps`, 'info');
        } else if (info.type === 'step-definition') {
          this.log(`  🔧 ${file}: ${info.totalImplementations} implementations`, 'info');
        }
      }
      console.log('');
    }
    
    // Recommendations
    if (this.coverage.missingSteps.length > 0) {
      this.log(`${colors.cyan}💡 Recommendations:${colors.reset}`, 'info');
      this.log(`${'-'.repeat(50)}`, 'info');
      
      const stepsByType = new Map();
      for (const step of this.coverage.missingSteps) {
        if (!stepsByType.has(step.type)) {
          stepsByType.set(step.type, []);
        }
        stepsByType.get(step.type).push(step);
      }
      
      for (const [type, steps] of stepsByType) {
        this.log(`\n  Add ${type} step implementations:`, 'info');
        for (const step of steps.slice(0, 3)) { // Show first 3 examples
          const suggestion = this.generateStepImplementation(step);
          this.log(`    ${colors.green}${suggestion}${colors.reset}`, 'info');
        }
        if (steps.length > 3) {
          this.log(`    ... and ${steps.length - 3} more`, 'info');
        }
      }
      console.log('');
    }
  }

  /**
   * Validate coverage against threshold
   */
  validateThreshold() {
    const passed = this.coverage.percentage >= this.threshold;
    
    if (passed) {
      this.log(`${colors.green}✅ Coverage validation PASSED (${this.coverage.percentage.toFixed(1)}% >= ${this.threshold}%)${colors.reset}`, 'info');
      return true;
    } else {
      this.log(`${colors.red}❌ Coverage validation FAILED (${this.coverage.percentage.toFixed(1)}% < ${this.threshold}%)${colors.reset}`, 'error');
      return false;
    }
  }

  /**
   * Normalize step text for comparison
   */
  normalizeStep(stepText) {
    return stepText
      .replace(/"/g, "'") // Normalize quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\s+|\s+$/g, '') // Trim
      .toLowerCase();
  }

  /**
   * Normalize step pattern for comparison
   */
  normalizeStepPattern(pattern) {
    return pattern
      .replace(/\\\\/g, '\\') // Handle escaped backslashes
      .replace(/\\\"/g, '"') // Handle escaped quotes
      .replace(/\{[^}]+\}/g, '(.*)') // Replace parameters with wildcards
      .replace(/\([^)]+\)/g, '(.*)') // Replace regex groups with wildcards
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .toLowerCase();
  }

  /**
   * Check if a step matches a pattern
   */
  matchesPattern(step, pattern) {
    try {
      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
        .replace(/\\\(\\\.\\\*\\\)/g, '.*'); // Convert back our wildcards
      
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(step);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get step type from regex pattern
   */
  getStepType(pattern) {
    const patternStr = pattern.toString();
    if (patternStr.includes('Given')) return 'Given';
    if (patternStr.includes('When')) return 'When';
    if (patternStr.includes('Then')) return 'Then';
    return 'Unknown';
  }

  /**
   * Generate step implementation suggestion
   */
  generateStepImplementation(step) {
    const params = this.extractParameters(step.text);
    const paramTypes = params.map((_, i) => `param${i + 1}`).join(', ');
    
    return `${step.type}('${step.text}', ${paramTypes ? `function(${paramTypes}) {` : 'function() {'}\n    // TODO: Implement step\n});`;
  }

  /**
   * Extract parameters from step text
   */
  extractParameters(stepText) {
    const params = [];
    const quotedMatches = stepText.match(/"([^"]*)"/g);
    if (quotedMatches) {
      params.push(...quotedMatches.map(m => m.slice(1, -1)));
    }
    
    const numberMatches = stepText.match(/\b\d+\b/g);
    if (numberMatches) {
      params.push(...numberMatches);
    }
    
    return params;
  }

  /**
   * Log with level
   */
  log(message, level = 'info') {
    if (this.json && level !== 'error') return;
    
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warning':
        console.warn(message);
        break;
      default:
        console.log(message);
        break;
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--threshold=')) {
      options.threshold = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
BDD Step Coverage Validation

Usage: node scripts/validate-bdd-coverage.js [options]

Options:
  --threshold=<number>  Minimum coverage percentage (default: 80)
  --verbose, -v         Show detailed output
  --json                Output results in JSON format
  --help, -h            Show this help message

Examples:
  node scripts/validate-bdd-coverage.js --threshold=85 --verbose
  node scripts/validate-bdd-coverage.js --json > coverage-report.json
      `);
      process.exit(0);
    }
  }
  
  try {
    const validator = new BDDCoverageValidator(options);
    const passed = await validator.validate();
    
    // Set exit code based on validation result
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(2);
  }
}

// Export for testing
module.exports = { BDDCoverageValidator };

// Run if called directly
if (require.main === module) {
  main();
}