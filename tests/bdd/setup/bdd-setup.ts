import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { BDDWorld } from '../support/world';

// Set default timeout for all steps
setDefaultTimeout(30000);

/**
 * Global BDD Test Setup
 * 
 * Configures the testing environment for BDD scenarios.
 * Handles setup and cleanup for comprehensive testing.
 */

// Global test configuration
BeforeAll(async function() {
  // Initialize global test environment
  console.log('🚀 Initializing BDD Test Environment');
  
  // Set up global error handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
});

// Global cleanup
AfterAll(async function() {
  console.log('🧹 Cleaning up BDD Test Environment');
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Scenario-level setup
Before(async function(scenario) {
  // Initialize world context for each scenario
  const world = this as BDDWorld;
  
  await world.initialize(scenario.pickle.name);
  
  console.log(`\n📋 Starting scenario: ${scenario.pickle.name}`);
  console.log(`   Tags: ${scenario.pickle.tags.map(tag => tag.name).join(', ')}`);
});

// Scenario-level cleanup
After(async function(scenario) {
  const world = this as BDDWorld;
  
  try {
    // Run scenario cleanup
    await world.cleanup();
    
    // Log scenario result
    const status = scenario.result?.status || 'unknown';
    const duration = scenario.result?.duration?.milliseconds || 0;
    
    console.log(`✅ Completed scenario: ${scenario.pickle.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Duration: ${duration}ms`);
    
    // Log any validation errors or warnings
    if (world.validationErrors.length > 0) {
      console.log(`   Validation Errors: ${world.validationErrors.length}`);
    }
    
    if (world.securityWarnings.length > 0) {
      console.log(`   Security Warnings: ${world.securityWarnings.length}`);
    }
    
  } catch (error) {
    console.error(`❌ Error during scenario cleanup: ${(error as Error).message}`);
  }
});

// Tag-specific hooks
Before({ tags: '@performance' }, async function() {
  console.log('⚡ Performance monitoring enabled for this scenario');
  
  const world = this as BDDWorld;
  world.performanceMonitor.recordMeasurement('scenario_start', Date.now());
});

After({ tags: '@performance' }, async function(scenario) {
  const world = this as BDDWorld;
  world.performanceMonitor.recordMeasurement('scenario_end', Date.now());
  
  const report = world.performanceMonitor.generateReport();
  console.log('\n📊 Performance Report:');
  console.log(JSON.stringify(report.summary, null, 2));
});

Before({ tags: '@security' }, async function() {
  console.log('🔒 Security validation enabled for this scenario');
});

After({ tags: '@security' }, async function(scenario) {
  const world = this as BDDWorld;
  const securityReport = world.securityValidator.generateSecurityReport();
  
  if (securityReport.summary.totalWarnings > 0) {
    console.log('\n🚨 Security Report:');
    console.log(`   Total Warnings: ${securityReport.summary.totalWarnings}`);
    console.log(`   Critical Issues: ${securityReport.summary.criticalIssues}`);
    console.log(`   High Issues: ${securityReport.summary.highIssues}`);
  }
});

Before({ tags: '@smoke' }, async function() {
  console.log('💨 Smoke test mode - quick validation');
});

Before({ tags: '@integration' }, async function() {
  console.log('🔗 Integration test mode - full system validation');
});

Before({ tags: '@mobile' }, async function() {
  console.log('📱 Mobile platform testing enabled');
  
  const world = this as BDDWorld;
  world.setState('platform', 'mobile');
  world.setState('touchInterface', true);
});

// Error handling hook
After(async function(scenario) {
  if (scenario.result?.status === 'FAILED') {
    const world = this as BDDWorld;
    
    // Capture error details
    const errorDetails = {
      scenario: scenario.pickle.name,
      error: scenario.result.message,
      timestamp: new Date(),
      testState: Object.fromEntries(world.testState),
      validationErrors: world.validationErrors,
      securityWarnings: world.securityWarnings
    };
    
    console.error('\n❌ Scenario Failed:', JSON.stringify(errorDetails, null, 2));
    
    // Optionally save failure artifacts
    if (process.env.SAVE_FAILURE_ARTIFACTS === 'true') {
      await this.saveFailureArtifacts(errorDetails);
    }
  }
});

// Custom hook for saving failure artifacts
BDDWorld.prototype.saveFailureArtifacts = async function(errorDetails: any) {
  // In a real implementation, this might save:
  // - Screenshots (for UI tests)
  // - Network requests/responses
  // - Console logs
  // - Database state
  // - File system state
  
  console.log('💾 Saving failure artifacts...');
  // Implementation would go here
};

// Memory monitoring hook (runs every 10 scenarios)
let scenarioCount = 0;
After(async function() {
  scenarioCount++;
  
  if (scenarioCount % 10 === 0) {
    const world = this as BDDWorld;
    const memoryCheck = world.performanceMonitor.checkMemoryLeak(100); // 100MB limit
    
    if (!memoryCheck.passed) {
      console.warn('⚠️ Memory usage warning:', memoryCheck.message);
    }
    
    // Force garbage collection periodically
    if (global.gc) {
      global.gc();
    }
  }
});

// Data validation hook
Before({ tags: '@data-validation' }, async function() {
  console.log('📋 Enhanced data validation enabled');
  
  const world = this as BDDWorld;
  world.validationHelper.clearValidationErrors();
});

After({ tags: '@data-validation' }, async function() {
  const world = this as BDDWorld;
  const errors = world.validationHelper.getValidationErrors();
  
  if (errors.length > 0) {
    console.log('\n📋 Data Validation Summary:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.context}: ${error.message}`);
    });
  }
});

// Concurrency testing hook
Before({ tags: '@concurrent' }, async function() {
  console.log('⚡ Concurrent execution testing enabled');
});

// Accessibility testing hook
Before({ tags: '@accessibility' }, async function() {
  console.log('♿ Accessibility testing enabled');
});

// Export hooks for custom test runners
export const BDDHooks = {
  Before,
  After,
  BeforeAll,
  AfterAll
};