module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.ts', 'features/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/cucumber/cucumber-report.html',
      'json:reports/cucumber/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    parallel: 5,
    retry: 1,
    publishQuiet: true
  },
  ci: {
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.ts', 'features/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress',
      'json:reports/cucumber/cucumber-report.json',
      'junit:reports/cucumber/cucumber-junit.xml'
    ],
    parallel: 3,
    retry: 2,
    publishQuiet: true
  }
};