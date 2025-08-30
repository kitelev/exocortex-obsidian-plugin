import type { Options } from '@wdio/types';
import type { ObsidianCapabilityOptions } from 'wdio-obsidian-service';

export const config: Options.Testrunner = {
  //
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: './tsconfig.wdio.json',
      transpileOnly: true
    }
  },

  //
  // ==================
  // Specify Test Files
  // ==================
  specs: [
    './tests/e2e/specs/**/*.spec.ts'
  ],
  exclude: [],

  //
  // ============
  // Capabilities
  // ============
  maxInstances: 1,
  capabilities: [{
    maxInstances: 1,
    browserName: 'obsidian',
    browserVersion: 'latest',
    'wdio:obsidianOptions': {
      appVersion: 'latest',
      installerVersion: 'latest',
      plugins: ['.'],
      vault: './tests/e2e/test-vault'
    } as ObsidianCapabilityOptions,
    'goog:chromeOptions': {
      args: process.env.CI ? ['--headless=new'] : []
    }
  }],

  //
  // ===================
  // Test Configurations
  // ===================
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 120000,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 3,

  //
  // Test runner services
  services: [
    'obsidian'
  ],

  //
  // Framework definition
  framework: 'mocha',
  reporters: [
    'spec',
    ['obsidian', {
      outputDir: './tests/e2e/test-results'
    }],
    ['allure', {
      outputDir: './tests/e2e/test-results/allure-results',
      disableWebdriverStepsReporting: true,
      disableWebdriverScreenshotsReporting: false
    }],
    ['json', {
      outputDir: './tests/e2e/test-results',
      outputFileFormat: function(options) {
        return `results-${options.cid}.json`;
      }
    }]
  ],

  //
  // Options to be passed to Mocha
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: 4,
    bail: false
  },

  //
  // =====
  // Hooks
  // =====
  onPrepare: async function (config, capabilities) {
    console.log('🚀 Starting E2E tests with wdio-obsidian-service...');
    console.log('🔧 Plugin will be loaded automatically by obsidian service');
  },

  beforeSession: async function (config, capabilities, specs, cid) {
    console.log('📋 Session starting for:', specs);
  },

  beforeSuite: async function (suite) {
    console.log('🧪 Starting test suite:', suite.title);
  },

  beforeTest: async function (test, context) {
    console.log(`🔍 Running test: ${test.title}`);
    // Wait for Obsidian to be ready
    // @ts-ignore - browser is available in test context
    await (global as any).browser?.executeObsidian?.(({app}: any) => app.workspace.layoutReady || app.workspace.leftSplit || true);
  },

  afterTest: async function(test, context, { error, result, duration, passed, retries }) {
    if (error) {
      // Take screenshot on failure
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `./tests/e2e/test-results/screenshots/${test.title}-${timestamp}.png`;
      try {
        // @ts-ignore - browser is available in test context
        await (global as any).browser?.saveScreenshot?.(screenshotPath);
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        console.log('Failed to take screenshot:', (screenshotError as Error).message);
      }
    }
  },

  afterSuite: async function (suite) {
    console.log('✅ Test suite completed:', suite.title);
  },

  afterSession: async function (config, capabilities, specs) {
    console.log('🏁 Session completed for:', specs);
  },

  onComplete: async function (exitCode, config, capabilities, results) {
    console.log('🎉 All tests completed!');
    console.log('Exit code:', exitCode);
    console.log('Results:', results);
  },

};