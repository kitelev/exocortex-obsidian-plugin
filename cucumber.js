module.exports = {
  default: {
    require: [
      'features/step-definitions/**/*.ts',
      'features/support/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      '@cucumber/pretty-formatter',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    parallel: 2,
    retry: 1,
    publishQuiet: true,
    paths: ['features/**/*.feature']
  },
  
  // Fast smoke tests
  smoke: {
    require: [
      'features/step-definitions/**/*.ts',
      'features/support/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: ['@cucumber/pretty-formatter'],
    tags: '@smoke',
    parallel: 4,
    publishQuiet: true,
    paths: ['features/**/*.feature']
  },
  
  // Security-focused tests
  security: {
    require: [
      'features/step-definitions/**/*.ts',
      'features/support/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: ['@cucumber/pretty-formatter'],
    tags: '@security',
    parallel: 1,
    publishQuiet: true,
    paths: ['features/**/*.feature']
  },
  
  // API tests
  api: {
    require: [
      'features/step-definitions/**/*.ts',
      'features/support/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: ['@cucumber/pretty-formatter'],
    tags: '@api',
    parallel: 2,
    publishQuiet: true,
    paths: ['features/**/*.feature']
  }
};