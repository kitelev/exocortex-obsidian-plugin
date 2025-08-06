module.exports = {
    default: {
        requireModule: ['ts-node/register'],
        require: ['features/**/*.steps.ts'],
        format: [
            'progress-bar',
            'html:test-results/cucumber-report.html',
            'json:test-results/cucumber-report.json',
            '@cucumber/pretty-formatter'
        ],
        formatOptions: {
            snippetInterface: 'async-await'
        },
        worldParameters: {
            appPath: process.env.OBSIDIAN_PATH || '/Applications/Obsidian.app',
            vaultPath: process.env.TEST_VAULT_PATH || './test-vault'
        },
        parallel: 2,
        retry: 1
    },
    
    // Profile for CI/CD pipeline
    ci: {
        requireModule: ['ts-node/register'],
        require: ['features/**/*.steps.ts'],
        format: [
            'json:test-results/cucumber-report.json',
            'junit:test-results/cucumber-junit.xml'
        ],
        parallel: 4,
        retry: 2,
        tags: 'not @manual'
    },
    
    // Profile for smoke tests
    smoke: {
        requireModule: ['ts-node/register'],
        require: ['features/**/*.steps.ts'],
        format: ['progress-bar'],
        tags: '@smoke',
        parallel: 1
    },
    
    // Profile for development
    dev: {
        requireModule: ['ts-node/register'],
        require: ['features/**/*.steps.ts'],
        format: ['progress-bar', '@cucumber/pretty-formatter'],
        tags: 'not @slow',
        parallel: 1
    }
};