/**
 * UI Test Configuration
 * 
 * Centralized configuration for UI tests that adapts to CI vs local environments
 */

export interface TestConfig {
  timeouts: {
    modal: number;
    element: number;
    content: number;
    interaction: number;
  };
  retries: {
    operations: number;
    tests: number;
  };
  debugging: {
    enabled: boolean;
    screenshots: boolean;
    verbose: boolean;
    domLogging: boolean;
  };
  environment: {
    isCI: boolean;
    headless: boolean;
  };
}

class TestConfigManager {
  private static instance: TestConfigManager;
  private config: TestConfig;

  private constructor() {
    this.config = this.createConfig();
  }

  public static getInstance(): TestConfigManager {
    if (!TestConfigManager.instance) {
      TestConfigManager.instance = new TestConfigManager();
    }
    return TestConfigManager.instance;
  }

  private createConfig(): TestConfig {
    const isCI = !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.BUILD_NUMBER ||
      process.env.JENKINS_URL
    );

    const baseTimeouts = {
      modal: isCI ? 25000 : 15000,
      element: isCI ? 20000 : 12000,
      content: isCI ? 15000 : 8000,
      interaction: isCI ? 5000 : 2000
    };

    return {
      timeouts: {
        modal: parseInt(process.env.TEST_MODAL_TIMEOUT || baseTimeouts.modal.toString()),
        element: parseInt(process.env.TEST_ELEMENT_TIMEOUT || baseTimeouts.element.toString()),
        content: parseInt(process.env.TEST_CONTENT_TIMEOUT || baseTimeouts.content.toString()),
        interaction: parseInt(process.env.TEST_INTERACTION_TIMEOUT || baseTimeouts.interaction.toString())
      },
      retries: {
        operations: isCI ? 5 : 3,
        tests: isCI ? 3 : 1
      },
      debugging: {
        enabled: process.env.TEST_DEBUG === 'true' || isCI,
        screenshots: process.env.TEST_SCREENSHOTS === 'true' && !isCI,
        verbose: process.env.TEST_VERBOSE === 'true' || isCI,
        domLogging: process.env.TEST_DOM_LOGGING === 'true' || isCI
      },
      environment: {
        isCI,
        headless: process.env.HEADLESS === 'true' || isCI
      }
    };
  }

  public getConfig(): TestConfig {
    return this.config;
  }

  public getTimeout(type: keyof TestConfig['timeouts']): number {
    return this.config.timeouts[type];
  }

  public getRetries(type: keyof TestConfig['retries']): number {
    return this.config.retries[type];
  }

  public isDebuggingEnabled(type: keyof TestConfig['debugging']): boolean {
    return this.config.debugging[type];
  }

  public isCI(): boolean {
    return this.config.environment.isCI;
  }

  public isHeadless(): boolean {
    return this.config.environment.headless;
  }

  public logConfig(): void {
    console.log('🔧 Test Configuration:');
    console.log(`   Environment: ${this.isCI() ? 'CI' : 'Local'}`);
    console.log(`   Headless: ${this.isHeadless()}`);
    console.log(`   Modal Timeout: ${this.getTimeout('modal')}ms`);
    console.log(`   Element Timeout: ${this.getTimeout('element')}ms`);
    console.log(`   Operation Retries: ${this.getRetries('operations')}`);
    console.log(`   Debugging: ${this.isDebuggingEnabled('enabled')}`);
    console.log(`   DOM Logging: ${this.isDebuggingEnabled('domLogging')}`);
  }
}

export const testConfig = TestConfigManager.getInstance();

// Export commonly used values for convenience
export const TEST_TIMEOUTS = {
  get MODAL() { return testConfig.getTimeout('modal'); },
  get ELEMENT() { return testConfig.getTimeout('element'); },
  get CONTENT() { return testConfig.getTimeout('content'); },
  get INTERACTION() { return testConfig.getTimeout('interaction'); }
};

export const TEST_RETRIES = {
  get OPERATIONS() { return testConfig.getRetries('operations'); },
  get TESTS() { return testConfig.getRetries('tests'); }
};

export const IS_CI = testConfig.isCI();
export const IS_HEADLESS = testConfig.isHeadless();
export const DEBUG_ENABLED = testConfig.isDebuggingEnabled('enabled');