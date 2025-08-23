module.exports = {
  default: {
    require: [
      'features/step-definitions/**/*.js',
      'features/support/**/*.js'
    ],
    format: [
      'progress',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    parallel: 2,
    retry: 1,
    paths: ['features/**/*.feature']
  },
  
  // TypeScript compilation profile
  typescript: {
    requireModule: ['ts-node/register'],
    require: [
      'features/step-definitions/**/*.ts',
      'features/support/**/*.ts'
    ],
    format: ['progress'],
    paths: ['features/**/*.feature']
  },
  
  // Fast smoke tests
  smoke: {
    require: [
      'features/step-definitions/**/*.js',
      'features/support/**/*.js'
    ],
    format: ['progress'],
    tags: '@smoke',
    parallel: 4,
    paths: ['features/**/*.feature']
  }
};