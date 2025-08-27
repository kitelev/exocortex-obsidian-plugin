// NOTE: This file is for jest-cucumber setup, not @cucumber/cucumber
// The jest-cucumber package doesn't use these imports
// All Cucumber-specific hooks are commented out since we're using jest-cucumber

import { BDDWorld } from "../support/world";

/**
 * Global BDD Test Setup
 *
 * Configures the testing environment for BDD scenarios.
 * With jest-cucumber, setup is handled in individual test files.
 */

// Export BDDWorld for use in test files
export { BDDWorld };

// Global setup can be done here if needed for jest-cucumber
console.log("🚀 BDD Test Environment Initialized");
