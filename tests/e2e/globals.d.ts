// Global type definitions for E2E tests

import '@wdio/globals/types';

declare global {
  namespace WebdriverIO {
    interface Browser {
      /**
       * Execute JavaScript function in Obsidian context via wdio-obsidian-service
       * @param func - Function to execute in Obsidian context
       * @param params - Additional parameters to pass to the function
       * @returns Promise with the result
       */
      executeObsidian<Return, Params extends unknown[]>(
        func: (obs: { app: any; obsidian: any; plugins: any; require: any }, ...params: Params) => Return,
        ...params: Params
      ): Promise<Return>;
    }
  }

  // Extend expect with additional matchers
  namespace Chai {
    interface Assertion {
      // Add custom assertions if needed
    }
  }
}

export {};