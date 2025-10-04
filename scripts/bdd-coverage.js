#!/usr/bin/env node

/**
 * BDD Coverage Checker
 *
 * Parses .feature files and checks if all scenarios have corresponding automated tests.
 * Ensures every BDD scenario is covered by at least one test case.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FEATURES_DIR = path.join(__dirname, '../specs/features');
const TESTS_DIRS = [
  path.join(__dirname, '../tests/component'),
  path.join(__dirname, '../tests/ui'),
];
const COVERAGE_MAPPING_FILE = path.join(__dirname, '../coverage-mapping.json');
const COVERAGE_THRESHOLD = parseInt(process.env.BDD_COVERAGE_THRESHOLD || '80', 10);

// Parse feature files
function parseFeatureFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const scenarios = [];

  const lines = content.split('\n');
  let currentFeature = null;
  let currentTags = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extract feature name
    if (line.startsWith('Feature:')) {
      currentFeature = line.replace('Feature:', '').trim();
      continue;
    }

    // Extract tags
    if (line.startsWith('@')) {
      currentTags = line.split(/\s+/).filter(tag => tag.startsWith('@'));
      continue;
    }

    // Extract scenarios
    if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
      const scenarioName = line.replace(/Scenario( Outline)?:/, '').trim();
      scenarios.push({
        feature: currentFeature,
        scenario: scenarioName,
        file: fileName,
        tags: [...currentTags],
        line: i + 1,
      });
      currentTags = []; // Reset tags after scenario
    }
  }

  return scenarios;
}

// Parse test files
function parseTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative(path.join(__dirname, '..'), filePath);
  const tests = [];

  // Match test() and it() calls
  const testRegex = /(test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = testRegex.exec(content)) !== null) {
    const description = match[2];
    tests.push({
      description,
      file: fileName,
      type: filePath.includes('/component/') ? 'component' : 'ui',
    });
  }

  return tests;
}

// Get all files recursively
function getAllFiles(dir, extension) {
  const files = [];

  function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile() && fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Load coverage mapping
function loadCoverageMapping() {
  if (fs.existsSync(COVERAGE_MAPPING_FILE)) {
    return JSON.parse(fs.readFileSync(COVERAGE_MAPPING_FILE, 'utf8'));
  }
  return {};
}

// Match scenarios with tests
function matchScenariosWithTests(scenarios, tests, mapping) {
  const coverage = {};

  for (const scenario of scenarios) {
    const key = `${scenario.file}::${scenario.scenario}`;

    // Check manual mapping first
    const mappedTests = mapping[scenario.file]?.[scenario.scenario]?.tests || [];

    // Auto-detect tests by keywords
    const keywords = scenario.scenario
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // Skip short words

    const matchedTests = tests.filter(test => {
      // Check if test is in manual mapping
      const testKey = `${test.file}::${test.description}`;
      if (mappedTests.includes(testKey)) {
        return true;
      }

      // Auto-detection: test description contains scenario keywords
      const testDesc = test.description.toLowerCase();
      return keywords.some(keyword => testDesc.includes(keyword));
    });

    coverage[key] = {
      scenario,
      tests: matchedTests,
      status: matchedTests.length > 0 ? 'covered' : 'NOT_COVERED',
      coverage: mappedTests.length > 0 ? 'manual' : 'auto',
    };
  }

  return coverage;
}

// Generate coverage report
function generateReport(coverage) {
  const totalScenarios = Object.keys(coverage).length;
  const coveredScenarios = Object.values(coverage).filter(c => c.status === 'covered').length;
  const coveragePercent = totalScenarios > 0 ? Math.round((coveredScenarios / totalScenarios) * 100) : 0;

  console.log('\n🎯 BDD Coverage Report\n');
  console.log('═'.repeat(60));
  console.log(`Total Scenarios:    ${totalScenarios}`);
  console.log(`Covered Scenarios:  ${coveredScenarios}`);
  console.log(`Uncovered Scenarios: ${totalScenarios - coveredScenarios}`);
  console.log(`Coverage:           ${coveragePercent}%`);
  console.log('═'.repeat(60));

  // Group by feature file
  const byFeature = {};
  for (const [key, data] of Object.entries(coverage)) {
    const fileName = data.scenario.file;
    if (!byFeature[fileName]) {
      byFeature[fileName] = [];
    }
    byFeature[fileName].push(data);
  }

  // Print by feature
  console.log('\n📊 Coverage by Feature:\n');
  for (const [fileName, scenarios] of Object.entries(byFeature)) {
    const total = scenarios.length;
    const covered = scenarios.filter(s => s.status === 'covered').length;
    const percent = Math.round((covered / total) * 100);
    const status = percent === 100 ? '✅' : percent >= 70 ? '⚠️' : '❌';

    console.log(`${status} ${fileName}: ${covered}/${total} (${percent}%)`);
  }

  // Print uncovered scenarios
  const uncovered = Object.values(coverage).filter(c => c.status === 'NOT_COVERED');
  if (uncovered.length > 0) {
    console.log('\n❌ Uncovered Scenarios:\n');
    for (const item of uncovered) {
      console.log(`   ${item.scenario.file}:${item.scenario.line}`);
      console.log(`   "${item.scenario.scenario}"`);
      console.log(`   Tags: ${item.scenario.tags.join(', ') || 'none'}`);
      console.log('');
    }
  }

  return {
    totalScenarios,
    coveredScenarios,
    coveragePercent,
    uncovered,
  };
}

// Main execution
function main() {
  console.log('🔍 Analyzing BDD Coverage...\n');

  // Parse all feature files
  const featureFiles = getAllFiles(FEATURES_DIR, '.feature');
  console.log(`Found ${featureFiles.length} feature files`);

  const allScenarios = [];
  for (const featureFile of featureFiles) {
    const scenarios = parseFeatureFile(featureFile);
    allScenarios.push(...scenarios);
  }
  console.log(`Found ${allScenarios.length} scenarios`);

  // Parse all test files
  const allTests = [];
  for (const testsDir of TESTS_DIRS) {
    const testFiles = getAllFiles(testsDir, '.spec.tsx').concat(getAllFiles(testsDir, '.test.ts'));
    console.log(`Found ${testFiles.length} test files in ${path.basename(testsDir)}/`);

    for (const testFile of testFiles) {
      const tests = parseTestFile(testFile);
      allTests.push(...tests);
    }
  }
  console.log(`Found ${allTests.length} test cases\n`);

  // Load manual mapping
  const mapping = loadCoverageMapping();

  // Match scenarios with tests
  const coverage = matchScenariosWithTests(allScenarios, allTests, mapping);

  // Generate report
  const report = generateReport(coverage);

  // Check threshold
  const failOnUncovered = process.argv.includes('--fail-on-uncovered');
  if (failOnUncovered && report.coveragePercent < COVERAGE_THRESHOLD) {
    console.log(`\n❌ BDD Coverage ${report.coveragePercent}% < ${COVERAGE_THRESHOLD}%`);
    console.log('Run with --fail-on-uncovered to enforce coverage threshold\n');
    process.exit(1);
  }

  if (report.coveragePercent === 100) {
    console.log('\n✅ All BDD scenarios are covered!\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseFeatureFile, parseTestFile, matchScenariosWithTests };
