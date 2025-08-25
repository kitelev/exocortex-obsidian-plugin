const reporter = require('cucumber-html-reporter');

const options = {
  theme: 'bootstrap',
  jsonFile: 'reports/cucumber/cucumber-report.json',
  output: 'reports/cucumber/cucumber-report.html',
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  metadata: {
    'App Version': require('./package.json').version,
    'Test Environment': process.env.NODE_ENV || 'development',
    'Browser': 'N/A',
    'Platform': process.platform,
    'Parallel': 'Scenarios',
    'Executed': 'Local'
  },
  customData: {
    title: 'Exocortex Plugin BDD Test Report',
    data: [
      { label: 'Project', value: 'Exocortex Obsidian Plugin' },
      { label: 'Test Framework', value: 'Cucumber + Jest' },
      { label: 'Coverage Areas', value: 'Semantic, Mobile, Business Logic, UI' }
    ]
  }
};

reporter.generate(options);