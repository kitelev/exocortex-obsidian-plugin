import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
    // Test specs
    specs: [
        './tests/ui/specs/**/*.spec.ts'
    ],
    
    // Patterns to exclude
    exclude: [],
    
    // Max instances
    maxInstances: 1,
    
    // Capabilities
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--headless',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        },
        acceptInsecureCerts: true
    }],
    
    // Test runner
    runner: 'local',
    
    // Level of logging verbosity
    logLevel: 'info',
    
    // Bail on first error
    bail: 0,
    
    // Base URL
    baseUrl: 'http://localhost',
    
    // Default timeout
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    // Services
    services: [
        ['chromedriver', {
            logFileName: 'wdio-chromedriver.log',
            outputDir: './test-results',
            args: ['--silent']
        }]
    ],
    
    // Framework
    framework: 'mocha',
    
    // Reporters
    reporters: [
        'spec',
        ['junit', {
            outputDir: './test-results',
            outputFileFormat: function(options: any) {
                return `results-${options.cid}.xml`;
            }
        }]
    ],
    
    // Mocha options
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    
    // Hooks
    before: function (capabilities, specs) {
        console.log('Starting UI tests in Docker environment');
        console.log('Specs to run:', specs);
    },
    
    after: function (result, capabilities, specs) {
        console.log('Tests completed');
        console.log('Result:', result === 0 ? 'PASSED' : 'FAILED');
    },
    
    beforeTest: function (test, context) {
        console.log(`Running test: ${test.title}`);
    },
    
    afterTest: function(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            console.error(`Test failed: ${test.title}`);
            if (error) {
                console.error('Error:', error.message);
            }
        } else {
            console.log(`Test passed: ${test.title} (${duration}ms)`);
        }
    }
};