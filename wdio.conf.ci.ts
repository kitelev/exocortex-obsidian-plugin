import type { Options } from '@wdio/types';
import { config as baseConfig } from './wdio.conf';

/**
 * CI-specific WebdriverIO configuration for GitHub Actions
 * Extends base configuration with CI optimizations:
 * - Headless mode for all browsers
 * - Extended timeouts for slower CI environments
 * - Screenshot capture on failures
 * - Retry logic for flaky tests
 * - Allure reporting for better test reporting
 */
export const config = {
  ...(baseConfig as any),
  
  //
  // ============
  // Capabilities - CI Optimized
  // ============
  capabilities: [{
    browserName: 'obsidian',
    browserVersion: 'latest',
    'wdio:obsidianOptions': {
      vault: './tests/ui/fixtures/vault',
      plugins: [
        { path: '.', enabled: true }
      ],
      // CI-specific Obsidian options
      headless: true,
      devMode: false,
      safeMode: false,
      configDir: '.obsidian-ci',
      // Increase startup timeout for CI
      startupTimeout: 90000,
      // Additional CI-specific options
      electronArgs: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    }
  }],

  //
  // ===================
  // CI-Optimized Test Configurations
  // ===================
  logLevel: process.env.DEBUG === 'true' ? 'debug' : 'warn',
  bail: 1, // Stop on first failure in CI
  waitforTimeout: 30000, // Increased for CI
  connectionRetryTimeout: 300000, // 5 minutes
  connectionRetryCount: 3,
  
  // Test retry configuration for flaky tests
  retry: {
    // Retry failed tests up to 2 times
    test: 2,
    // Don't retry suite failures
    suite: 0
  },

  //
  // Enhanced reporting for CI
  //
  reporters: [
    'spec',
    ['json', {
      outputDir: './wdio-logs',
      outputFileFormat: function(options) {
        return `results-${options.cid}.json`;
      }
    }],
    ['junit', {
      outputDir: './wdio-logs',
      outputFileFormat: function(options) {
        return `junit-${options.cid}.xml`;
      },
      suiteNameFormat: /\[(.+)\]/,
      packageName: 'exocortex.ui'
    }]
  ],

  //
  // Services optimized for CI
  //
  services: [
    ['obsidian', {
      // CI-specific service options
      logLevel: 'warn',
      outputDir: './wdio-logs'
    }]
  ],

  //
  // Mocha options for CI
  //
  mochaOpts: {
    ui: 'bdd',
    timeout: 300000, // 5 minutes per test
    slow: 30000,     // Mark tests as slow if they take more than 30s
    reporter: 'spec',
    bail: false      // Continue running tests even if one fails
  },

  //
  // =====
  // CI-Enhanced Hooks
  // =====
  
  onPrepare: function () {
    console.log('🚀 Starting Obsidian E2E UI tests in CI mode...');
    console.log(`📊 Environment: ${process.env.CI ? 'CI' : 'Local'}`);
    console.log(`🖥️  Platform: ${process.platform}`);
    console.log(`🔧 Node version: ${process.version}`);
    
    // Ensure screenshot directory exists
    const fs = require('fs');
    const path = require('path');
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  },

  beforeSession: function (config, capabilities, specs, cid) {
    console.log(`📱 Starting session ${cid} with capabilities:`, capabilities);
  },

  before: async function (capabilities, specs, browser) {
    console.log('🔧 Setting up test environment...');
    console.log('🖥️  Display:', process.env.DISPLAY || 'not set');
    console.log('🐧 Platform:', process.platform);
    
    // Set longer implicit wait for CI
    await browser.setTimeout({ 'implicit': 15000 });
    
    // Add custom commands for better error handling
    browser.addCommand('waitForObsidianReady', async function(timeout = 90000) {
      console.log('⏳ Waiting for Obsidian to become ready...');
      await (this as any).waitUntil(
        async () => {
          try {
            const ready = await (this as any).executeObsidian(({ app }: any) => {
              return app && app.workspace && app.workspace.layoutReady;
            });
            if (ready) {
              console.log('✅ Obsidian is ready');
            }
            return ready === true;
          } catch (error: any) {
            console.warn('⏳ Waiting for Obsidian to be ready...', error.message);
            return false;
          }
        },
        {
          timeout,
          timeoutMsg: `Obsidian failed to become ready within ${timeout}ms`,
          interval: 2000
        }
      );
    });

    // Enhanced screenshot command
    browser.addCommand('takeScreenshotOnFailure', async function(testName: string) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `failure-${testName}-${timestamp}.png`;
      const filepath = `screenshots/${filename}`;
      
      try {
        await (this as any).saveScreenshot(filepath);
        console.log(`📸 Screenshot saved: ${filepath}`);
        return filepath;
      } catch (error: any) {
        console.warn('Failed to take screenshot:', error.message);
        return null;
      }
    });
  },

  beforeTest: async function (test, context) {
    const testName = `${test.parent}.${test.title}`.replace(/[^a-zA-Z0-9]/g, '_');
    console.log(`📝 Running test: ${test.title}`);
    console.log(`📍 Suite: ${test.parent}`);
    
    // Store test info for potential screenshot naming
    (browser as any).testInfo = { name: testName, startTime: Date.now() };
  },

  afterTest: async function (test, context, result) {
    const duration = Date.now() - ((browser as any).testInfo?.startTime || 0);
    
    if (!result.passed) {
      console.error(`❌ Test failed: ${test.title} (${duration}ms)`);
      console.error(`💥 Error: ${result.error?.message || 'Unknown error'}`);
      
      // Take screenshot on failure
      if ((browser as any).testInfo?.name) {
        await (browser as any).takeScreenshotOnFailure((browser as any).testInfo.name);
      }
    } else {
      console.log(`✅ Test passed: ${test.title} (${duration}ms)`);
    }
  },

  onError: function (error: any, context: any) {
    console.error('🚨 WebDriver error occurred:', error.message);
    console.error('📍 Context:', context);
  },

  afterSession: function (config: any, capabilities: any, specs: any, cid: any) {
    console.log(`📱 Session ${cid} completed`);
  },

  onComplete: function (exitCode, config, capabilities, results) {
    console.log('📊 Test execution completed');
    console.log(`📈 Exit code: ${exitCode}`);
    console.log(`🎯 Total tests: ${results.specs?.length || 0} specs`);
    
    if (results.failed > 0) {
      console.error(`❌ Failed tests: ${results.failed}`);
      console.log('📸 Check screenshots directory for failure screenshots');
    } else {
      console.log('✅ All tests passed!');
    }
  }
} as Options.Testrunner;