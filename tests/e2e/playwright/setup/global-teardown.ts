import { FullConfig } from '@playwright/test';
import { join } from 'path';
import * as fs from 'fs';

/**
 * Global teardown for Playwright E2E tests
 * 
 * Responsibilities:
 * - Clean up test vault (optional, for debugging keep files)
 * - Archive test results
 * - Generate test summary report
 * - Close any remaining Obsidian processes
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('🧹 Running global teardown...');

  try {
    // 1. Kill any remaining Obsidian processes
    await killObsidianProcesses();
    
    // 2. Archive test results
    await archiveTestResults();
    
    // 3. Generate summary report
    await generateSummaryReport();
    
    // 4. Optionally clean up test vault (keep for debugging by default)
    const shouldCleanup = process.env.CLEANUP_TEST_VAULT === 'true';
    if (shouldCleanup) {
      await cleanupTestVault();
    } else {
      console.log('ℹ️ Test vault preserved for debugging (set CLEANUP_TEST_VAULT=true to clean up)');
    }
    
    console.log('✅ Global teardown completed');
    
  } catch (error) {
    console.error('❌ Global teardown error:', error);
    // Don't throw - teardown failures shouldn't fail the tests
  }
}

/**
 * Kill any remaining Obsidian processes that might be hanging
 */
async function killObsidianProcesses(): Promise<void> {
  console.log('🔄 Checking for running Obsidian processes...');
  
  try {
    const { execSync } = require('child_process');
    
    // Check if any Obsidian processes are running
    const processes = execSync('pgrep -f "Obsidian" || true', { encoding: 'utf8' });
    
    if (processes.trim()) {
      console.log('⚠️ Found running Obsidian processes, attempting to terminate...');
      
      // Try graceful shutdown first
      execSync('pkill -TERM -f "Obsidian" || true', { stdio: 'ignore' });
      
      // Wait a moment for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force kill if still running
      const stillRunning = execSync('pgrep -f "Obsidian" || true', { encoding: 'utf8' });
      if (stillRunning.trim()) {
        console.log('🔨 Force killing remaining Obsidian processes...');
        execSync('pkill -KILL -f "Obsidian" || true', { stdio: 'ignore' });
      }
      
      console.log('✅ Obsidian processes cleaned up');
    } else {
      console.log('✅ No running Obsidian processes found');
    }
    
  } catch (error) {
    console.log('ℹ️ Process cleanup completed (some errors expected)');
  }
}

/**
 * Archive test results with timestamp
 */
async function archiveTestResults(): Promise<void> {
  console.log('📦 Archiving test results...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = join(__dirname, '../../../../test-results/archive', `run-${timestamp}`);
    const resultsDir = join(__dirname, '../../../../test-results');
    
    // Create archive directory
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    // Copy playwright results if they exist
    const playwrightResults = [
      'playwright-reports',
      'playwright-output',
      'playwright-results.xml',
      'playwright-results.json'
    ];
    
    for (const item of playwrightResults) {
      const sourcePath = join(resultsDir, item);
      const destPath = join(archiveDir, item);
      
      if (fs.existsSync(sourcePath)) {
        if (fs.statSync(sourcePath).isDirectory()) {
          copyDirectoryRecursive(sourcePath, destPath);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
        console.log(`  ✓ Archived ${item}`);
      }
    }
    
    console.log(`✅ Results archived to: ${archiveDir}`);
    
  } catch (error) {
    console.warn('⚠️ Failed to archive results:', error);
  }
}

/**
 * Generate a summary report of the test run
 */
async function generateSummaryReport(): Promise<void> {
  console.log('📊 Generating test summary report...');
  
  try {
    const resultsPath = join(__dirname, '../../../../test-results/playwright-results.json');
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        environment: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          obsidianPath: process.env.OBSIDIAN_PATH || 'default'
        },
        testSuites: results.suites?.map((suite: any) => ({
          title: suite.title,
          tests: suite.tests?.length || 0,
          duration: suite.duration || 0
        })) || []
      };
      
      const summaryPath = join(__dirname, '../../../../test-results/test-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log(`✅ Summary report generated: ${summaryPath}`);
      console.log(`   📈 Tests: ${summary.passed}✅ ${summary.failed}❌ ${summary.skipped}⏭️`);
      
    } else {
      console.log('ℹ️ No test results found to summarize');
    }
    
  } catch (error) {
    console.warn('⚠️ Failed to generate summary report:', error);
  }
}

/**
 * Clean up test vault
 */
async function cleanupTestVault(): Promise<void> {
  console.log('🗑️ Cleaning up test vault...');
  
  try {
    const testVaultPath = join(__dirname, '../test-vault');
    
    if (fs.existsSync(testVaultPath)) {
      fs.rmSync(testVaultPath, { recursive: true, force: true });
      console.log('✅ Test vault cleaned up');
    }
    
  } catch (error) {
    console.warn('⚠️ Failed to clean up test vault:', error);
  }
}

/**
 * Utility function to copy directory recursively
 */
function copyDirectoryRecursive(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = join(source, file);
    const destPath = join(destination, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

export default globalTeardown;