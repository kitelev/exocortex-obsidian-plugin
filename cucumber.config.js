/**
 * Cucumber Configuration - Executable Specifications
 *
 * ✅ OFFICIAL WORKING configuration (from cucumber-js-examples):
 * - Based on: https://github.com/cucumber/cucumber-js-examples/tree/main/examples/typescript-node-esm
 * - Uses ts-node/esm loader for TypeScript ESM
 * - Requires "type": "module" in package.json
 * - Full TypeScript + ESM support
 *
 * Key insight: Use official example configuration!
 */

module.exports = {
  default: {
    // Feature files location
    paths: ['specs/features/**/*.feature'],

    // TypeScript loader for ESM (OFFICIAL approach)
    loader: ['ts-node/esm'],

    // Step definitions using 'import' for ESM
    import: ['tests/steps/**/*.ts'],

    // Output formats
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      'summary'
    ],

    // Publish results (set to false for local dev)
    publish: false,

    // Parallel execution (1 for stability)
    parallel: 1,

    // Retry failed scenarios
    retry: 0,

    // Timeout (prevent hanging)
    timeout: 60000,
  },
};
