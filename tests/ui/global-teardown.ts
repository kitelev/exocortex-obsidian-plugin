import * as fs from 'fs';
import * as path from 'path';

/**
 * Global teardown for UI tests
 * Cleans up after all tests have run
 */
async function globalTeardown() {
    console.log('\n🧹 Cleaning up UI test environment...');
    
    // Clean up test artifacts if needed
    const testArtifacts = [
        'test-project.md',
        'test-task.md',
        'malformed-project.md'
    ];
    
    // Note: We don't actually delete from vault here as Playwright handles it
    // This is just for logging and potential future cleanup needs
    
    console.log('✅ UI test cleanup complete');
    
    // Report test results location
    const resultsPath = path.join(process.cwd(), 'test-results', 'ui-tests', 'index.html');
    if (fs.existsSync(resultsPath)) {
        console.log('\n📊 Test results available at:', resultsPath);
    }
}

export default globalTeardown;