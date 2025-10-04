#!/usr/bin/env node

/**
 * BDD Coverage Report Generator
 *
 * Generates detailed Markdown report with coverage matrix, uncovered scenarios,
 * and actionable recommendations.
 */

const fs = require('fs');
const path = require('path');
const { parseFeatureFile, parseTestFile, matchScenariosWithTests } = require('./bdd-coverage');

// Configuration
const FEATURES_DIR = path.join(__dirname, '../specs/features');
const TESTS_DIRS = [
  path.join(__dirname, '../tests/component'),
  path.join(__dirname, '../tests/ui'),
];
const COVERAGE_MAPPING_FILE = path.join(__dirname, '../coverage-mapping.json');
const REPORT_OUTPUT = path.join(__dirname, '../bdd-coverage-report.md');

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

function loadCoverageMapping() {
  if (fs.existsSync(COVERAGE_MAPPING_FILE)) {
    return JSON.parse(fs.readFileSync(COVERAGE_MAPPING_FILE, 'utf8'));
  }
  return {};
}

function generateMarkdownReport(coverage) {
  const totalScenarios = Object.keys(coverage).length;
  const coveredScenarios = Object.values(coverage).filter(c => c.status === 'covered').length;
  const coveragePercent = totalScenarios > 0 ? Math.round((coveredScenarios / totalScenarios) * 100) : 0;

  let report = '# BDD Coverage Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary
  report += '## Summary\n\n';
  report += `- **Total Scenarios**: ${totalScenarios}\n`;
  report += `- **Covered**: ${coveredScenarios} (${coveragePercent}%)\n`;
  report += `- **Not Covered**: ${totalScenarios - coveredScenarios} (${100 - coveragePercent}%)\n\n`;

  // Coverage by feature
  const byFeature = {};
  for (const [key, data] of Object.entries(coverage)) {
    const fileName = data.scenario.file;
    if (!byFeature[fileName]) {
      byFeature[fileName] = [];
    }
    byFeature[fileName].push(data);
  }

  report += '### Coverage by Feature:\n\n';
  for (const [fileName, scenarios] of Object.entries(byFeature)) {
    const total = scenarios.length;
    const covered = scenarios.filter(s => s.status === 'covered').length;
    const percent = Math.round((covered / total) * 100);
    const status = percent === 100 ? '✅' : percent >= 70 ? '⚠️' : '❌';

    report += `- ${status} **${fileName}**: ${covered}/${total} (${percent}%)\n`;
  }

  report += '\n';

  // Coverage Matrix
  report += '## Coverage Matrix\n\n';
  report += '| Feature File | Total | Covered | Uncovered | % | Status |\n';
  report += '|-------------|-------|---------|-----------|---|--------|\n';

  for (const [fileName, scenarios] of Object.entries(byFeature)) {
    const total = scenarios.length;
    const covered = scenarios.filter(s => s.status === 'covered').length;
    const uncovered = total - covered;
    const percent = Math.round((covered / total) * 100);
    const status = percent === 100 ? '✅ FULL' : percent >= 70 ? '⚠️ PARTIAL' : '❌ LOW';

    report += `| ${fileName} | ${total} | ${covered} | ${uncovered} | ${percent}% | ${status} |\n`;
  }

  report += '\n';

  // Uncovered scenarios
  const uncovered = Object.values(coverage).filter(c => c.status === 'NOT_COVERED');
  if (uncovered.length > 0) {
    report += '## Uncovered Scenarios\n\n';

    const uncoveredByFeature = {};
    for (const item of uncovered) {
      const fileName = item.scenario.file;
      if (!uncoveredByFeature[fileName]) {
        uncoveredByFeature[fileName] = [];
      }
      uncoveredByFeature[fileName].push(item);
    }

    for (const [fileName, items] of Object.entries(uncoveredByFeature)) {
      report += `### ${fileName}\n\n`;

      for (const item of items) {
        report += `#### ❌ ${item.scenario.scenario}\n\n`;
        report += `- **Line**: ${item.scenario.line}\n`;
        report += `- **Tags**: ${item.scenario.tags.join(', ') || 'none'}\n`;
        report += `- **Feature**: ${item.scenario.feature}\n`;
        report += '\n**Action Required**: Add test case for this scenario\n\n';
        report += '```typescript\n';
        report += `test('${item.scenario.scenario.toLowerCase().replace(/\s+/g, ' ')}', async ({ mount }) => {\n`;
        report += '  // TODO: Implement test for this scenario\n';
        report += '});\n';
        report += '```\n\n';
      }
    }
  } else {
    report += '## ✅ All Scenarios Covered!\n\n';
    report += 'Congratulations! Every scenario in all feature files has corresponding test coverage.\n\n';
  }

  // Covered scenarios (detailed)
  report += '## Covered Scenarios (Detailed)\n\n';

  for (const [fileName, scenarios] of Object.entries(byFeature)) {
    const covered = scenarios.filter(s => s.status === 'covered');
    if (covered.length === 0) continue;

    report += `### ${fileName}\n\n`;

    for (const item of covered) {
      report += `#### ✅ ${item.scenario.scenario}\n\n`;
      report += `- **Line**: ${item.scenario.line}\n`;
      report += `- **Coverage Type**: ${item.coverage}\n`;
      report += `- **Test Cases** (${item.tests.length}):\n`;

      for (const test of item.tests) {
        report += `  - \`${test.file}\`: "${test.description}"\n`;
      }
      report += '\n';
    }
  }

  return report;
}

function main() {
  console.log('📊 Generating BDD Coverage Report...\n');

  // Parse all feature files
  const featureFiles = getAllFiles(FEATURES_DIR, '.feature');
  const allScenarios = [];
  for (const featureFile of featureFiles) {
    const scenarios = parseFeatureFile(featureFile);
    allScenarios.push(...scenarios);
  }

  // Parse all test files
  const allTests = [];
  for (const testsDir of TESTS_DIRS) {
    const testFiles = getAllFiles(testsDir, '.spec.tsx').concat(getAllFiles(testsDir, '.test.ts'));
    for (const testFile of testFiles) {
      const tests = parseTestFile(testFile);
      allTests.push(...tests);
    }
  }

  // Load manual mapping
  const mapping = loadCoverageMapping();

  // Match scenarios with tests
  const coverage = matchScenariosWithTests(allScenarios, allTests, mapping);

  // Generate Markdown report
  const report = generateMarkdownReport(coverage);

  // Write to file
  fs.writeFileSync(REPORT_OUTPUT, report);

  console.log(`✅ Report generated: ${REPORT_OUTPUT}`);
  console.log(`📄 Total scenarios: ${Object.keys(coverage).length}`);
  console.log(`✅ Covered: ${Object.values(coverage).filter(c => c.status === 'covered').length}`);
  console.log(`❌ Uncovered: ${Object.values(coverage).filter(c => c.status === 'NOT_COVERED').length}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdownReport };
