import type { Options } from '@wdio/types';

/**
 * Base WebdriverIO configuration for local development
 * For CI environment, use wdio.conf.ci.ts
 */
export const config = {
  //
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',
  tsConfigPath: './tsconfig.wdio.json',
  
  //
  // ==================
  // Specify Test Files
  // ==================
  specs: [
    './tests/ui/specs/**/*.spec.ts'
  ],
  exclude: [],
  
  //
  // ============
  // Capabilities
  // ============
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: process.env.CI ? [
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ] : [
        '--disable-web-security',
        '--window-size=1920,1080'
      ]
    },
    'wdio:obsidianOptions': {
      appVersion: 'latest',
      vault: './tests/ui/fixtures/vault',
      plugins: [
        { path: '.', enabled: true }  // The exocortex plugin from current directory
      ],
      // Increase timeout for slower environments
      startupTimeout: process.env.CI ? 60000 : 30000
    }
  }],
  
  //
  // ===================
  // Test Configurations
  // ===================
  logLevel: process.env.DEBUG === 'true' ? 'debug' : 'info',
  bail: process.env.CI ? 1 : 0, // Stop on first failure in CI
  waitforTimeout: process.env.CI ? 30000 : 10000,
  connectionRetryTimeout: process.env.CI ? 300000 : 120000,
  connectionRetryCount: 3,
  
  services: [
    ['obsidian', {
      logLevel: process.env.CI ? 'warn' : 'info'
    }]
  ],
  
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: process.env.CI ? 300000 : 120000
  },
  
  reporters: process.env.CI ? [
    'spec',
    ['json', {
      outputDir: './wdio-logs'
    }]
  ] : ['spec'],
  
  //
  // =====
  // Hooks
  // =====
  onPrepare: function () {
    // Ensure log and screenshot directories exist
    const fs = require('fs');
    const path = require('path');
    
    ['wdio-logs', 'screenshots'].forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  },

  before: async function () {
    const mode = process.env.CI ? 'CI' : 'local';
    console.log(`🚀 Starting Obsidian E2E UI tests in ${mode} mode...`);
    
    // Add enhanced wait command
    (browser as any).addCommand('waitForObsidianReady', async function(timeout = process.env.CI ? 60000 : 30000) {
      await (this as any).waitUntil(
        async () => {
          try {
            const ready = await (this as any).executeObsidian(({ app }: any) => {
              return app && app.workspace && app.workspace.layoutReady;
            });
            return ready === true;
          } catch (error: any) {
            return false;
          }
        },
        {
          timeout,
          timeoutMsg: `Obsidian failed to become ready within ${timeout}ms`
        }
      );
    });
  },
  
  after: async function () {
    console.log('✅ Obsidian E2E UI tests completed');
  },
  
  beforeTest: async function (test: any) {
    console.log(`📝 Running test: ${test.title}`);
  },
  
  afterTest: async function (test: any, context: any, result: { passed: boolean }) {
    if (!result.passed) {
      console.error(`❌ Test failed: ${test.title}`);
      
      // Take screenshot on failure
      if (process.env.CI || process.env.TAKE_SCREENSHOTS) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const testName = test.title.replace(/[^a-zA-Z0-9]/g, '_');
          const filename = `failure-${testName}-${timestamp}.png`;
          const filepath = `screenshots/${filename}`;
          await (browser as any).saveScreenshot(filepath);
          console.log(`📸 Screenshot saved: ${filepath}`);
        } catch (error) {
          console.warn('Failed to take screenshot:', error.message);
        }
      }
    }
  }
} as Options.Testrunner;