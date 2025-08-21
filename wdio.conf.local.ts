import type { Options } from '@wdio/types';
import { TestEnvironmentDetector } from './tests/ui/utils/test-environment';

/**
 * Local WebdriverIO configuration without Obsidian downloads
 * Used when running tests locally to avoid unnecessary downloads
 */

// Log environment info
TestEnvironmentDetector.logEnvironmentInfo();

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
  // Capabilities - LOCAL MODE (No Obsidian Download)
  // ============
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    browserVersion: 'latest',
    'goog:chromeOptions': {
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--headless'
      ]
    }
  }],
  
  //
  // ===================
  // Test Configurations
  // ===================
  logLevel: process.env.DEBUG === 'true' ? 'debug' : 'info',
  bail: 0, // Don't stop on failures in local mode
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  
  // Use minimal services for local tests (no external dependencies)
  services: [],
  
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },
  
  reporters: ['spec'],
  
  //
  // =====
  // Hooks
  // =====
  onPrepare: function () {
    console.log('🚀 Starting LOCAL UI tests (No Obsidian download)...');
    console.log('⚠️  Local UI tests run with mocked Obsidian functionality');
    console.log('💡 For full Obsidian tests, run: FORCE_OBSIDIAN_DOWNLOAD=true npm run test:ui');
    
    // Ensure log directories exist
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
    console.log('🔧 Setting up local test environment...');
    
    // Mock Obsidian-specific functionality for local tests
    global.mockObsidianAPI = {
      app: {
        workspace: {
          layoutReady: true
        },
        vault: {
          adapter: {
            path: './tests/ui/fixtures/vault'
          }
        }
      }
    };

    // Add mock commands
    (browser as any).addCommand('waitForObsidianReady', async function() {
      console.log('✅ Mock: Obsidian ready (local test mode)');
      return Promise.resolve(true);
    });

    (browser as any).addCommand('executeObsidian', async function(script: Function) {
      console.log('🎭 Mock: Executing Obsidian script');
      return script(global.mockObsidianAPI);
    });
  },
  
  after: async function () {
    console.log('✅ Local UI tests completed');
    console.log('💡 Note: These were mocked tests. For full integration, use CI environment.');
  },
  
  beforeTest: async function (test: any) {
    console.log(`📝 Running local test: ${test.title}`);
  },
  
  afterTest: async function (test: any, context: any, result: { passed: boolean }) {
    if (!result.passed) {
      console.error(`❌ Local test failed: ${test.title}`);
      
      // Take screenshot on failure (if possible)
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const testName = test.title.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `local-failure-${testName}-${timestamp}.png`;
        const filepath = `screenshots/${filename}`;
        await (browser as any).saveScreenshot(filepath);
        console.log(`📸 Screenshot saved: ${filepath}`);
      } catch (error) {
        console.warn('Failed to take screenshot in local mode:', error.message);
      }
    }
  }
} as Options.Testrunner;