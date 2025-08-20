import * as fs from 'fs';
import * as path from 'path';

/**
 * Global setup for UI tests
 * Prepares the test environment before running tests
 */
async function globalSetup() {
    console.log('🚀 Setting up UI test environment...');
    
    // Ensure layouts folder exists
    const layoutsDir = path.join(process.cwd(), 'layouts');
    if (!fs.existsSync(layoutsDir)) {
        fs.mkdirSync(layoutsDir, { recursive: true });
        console.log('✅ Created layouts directory');
    }
    
    // Copy layout file from examples if not exists
    const sourceLayout = path.join(process.cwd(), 'examples', 'layouts', 'Layout - ems__Project.md');
    const targetLayout = path.join(layoutsDir, 'Layout - ems__Project.md');
    
    if (!fs.existsSync(targetLayout) && fs.existsSync(sourceLayout)) {
        fs.copyFileSync(sourceLayout, targetLayout);
        console.log('✅ Copied ems__Project layout to layouts folder');
    }
    
    // Create test results directory
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testResultsDir)) {
        fs.mkdirSync(testResultsDir, { recursive: true });
        console.log('✅ Created test results directory');
    }
    
    // Verify test vault exists
    const testVaultPath = '/Users/kitelev/vault-2025';
    if (!fs.existsSync(testVaultPath)) {
        console.warn('⚠️  Test vault not found at:', testVaultPath);
        console.log('   Please ensure the vault exists or update the path in tests');
    } else {
        console.log('✅ Test vault found at:', testVaultPath);
    }
    
    // Check if Obsidian is installed
    const obsidianPath = '/Applications/Obsidian.app';
    if (!fs.existsSync(obsidianPath)) {
        console.warn('⚠️  Obsidian not found at default location');
        console.log('   UI tests may fail if Obsidian is not installed');
    } else {
        console.log('✅ Obsidian application found');
    }
    
    console.log('✅ UI test environment setup complete\n');
}

export default globalSetup;