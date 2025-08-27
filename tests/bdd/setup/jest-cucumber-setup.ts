import { autoBindSteps, loadFeatures } from "jest-cucumber";
import path from "path";
import { PerformanceMonitor } from "../helpers/PerformanceMonitor";
import { SecurityValidator } from "../helpers/SecurityValidator";

// Global BDD test configuration
declare global {
  namespace NodeJS {
    interface Global {
      bddContext: BDDGlobalContext;
    }
  }
}

interface BDDGlobalContext {
  performanceMonitor: PerformanceMonitor;
  securityValidator: SecurityValidator;
  testStartTime: number;
  featureFiles: string[];
}

// Initialize global BDD context
global.bddContext = {
  performanceMonitor: new PerformanceMonitor(),
  securityValidator: new SecurityValidator(),
  testStartTime: Date.now(),
  featureFiles: [],
};

// Setup Jest-Cucumber integration
beforeAll(async () => {
  console.log("🥒 Initializing BDD Test Suite...");

  // Load all feature files
  const featuresDir = path.join(__dirname, "../features");
  global.bddContext.featureFiles = [
    "asset-management.feature",
    "property-editing.feature",
    "query-execution.feature",
    "plugin-initialization.feature",
    "layout-rendering.feature",
    "dynamic-layout.feature",
  ];

  console.log(
    `📋 Loaded ${global.bddContext.featureFiles.length} feature files`,
  );

  // Initialize performance monitoring
  global.bddContext.performanceMonitor.startSession("bdd-test-suite");

  // Initialize security validation
  await global.bddContext.securityValidator.initialize();

  console.log("✅ BDD Test Suite initialized successfully");
});

afterAll(async () => {
  const duration = Date.now() - global.bddContext.testStartTime;
  console.log(`🏁 BDD Test Suite completed in ${duration}ms`);

  // Generate performance report
  const performanceReport =
    global.bddContext.performanceMonitor.generateReport();
  console.log("📊 Performance Summary:", performanceReport);

  // Generate security report
  const securityReport =
    await global.bddContext.securityValidator.generateReport();
  console.log("🔒 Security Validation Summary:", securityReport);

  // Cleanup
  global.bddContext.performanceMonitor.endSession();
});

// Custom Jest matchers for BDD testing
expect.extend({
  toBeValidAsset(received: any) {
    if (!received || typeof received !== "object") {
      return {
        message: () =>
          `Expected valid asset object, received ${typeof received}`,
        pass: false,
      };
    }

    const hasRequiredProperties =
      received.id && received.className && received.title;

    return {
      message: () =>
        hasRequiredProperties
          ? `Expected asset to be invalid`
          : `Expected asset to have id, className, and title properties`,
      pass: hasRequiredProperties,
    };
  },

  toHaveValidFrontmatter(received: string) {
    const hasFrontmatter =
      received.startsWith("---") && received.includes("---\n");
    const frontmatterMatch = received.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      return {
        message: () => `Expected file content to have valid frontmatter`,
        pass: false,
      };
    }

    const frontmatterContent = frontmatterMatch[1];
    const hasClassProperty = frontmatterContent.includes("class:");

    return {
      message: () =>
        hasClassProperty
          ? `Expected frontmatter to be invalid`
          : `Expected frontmatter to contain 'class:' property`,
      pass: hasClassProperty,
    };
  },

  toCompleteWithinTimeLimit(received: number, timeLimit: number) {
    const pass = received <= timeLimit;

    return {
      message: () =>
        pass
          ? `Expected operation to take more than ${timeLimit}ms, but it took ${received}ms`
          : `Expected operation to complete within ${timeLimit}ms, but it took ${received}ms`,
      pass,
    };
  },

  toHaveSecurityViolations(received: any) {
    const violations =
      global.bddContext.securityValidator.checkForViolations(received);
    const hasViolations = violations.length > 0;

    return {
      message: () =>
        hasViolations
          ? `Expected no security violations, but found: ${violations.join(", ")}`
          : `Expected security violations, but none were found`,
      pass: hasViolations,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAsset(): R;
      toHaveValidFrontmatter(): R;
      toCompleteWithinTimeLimit(timeLimit: number): R;
      toHaveSecurityViolations(): R;
    }
  }
}

// Export for use in step definitions
export { autoBindSteps, loadFeatures };
