/// <reference types="@wdio/globals/types" />
/// <reference types="wdio-obsidian-service" />

declare namespace WebdriverIO {
  interface Browser {
    executeObsidian: <Return, Params extends unknown[]>(
      func: (obs: { app: any; obsidian: any }, ...params: Params) => Return,
      ...params: Params
    ) => Promise<Return>;
    
    executeObsidianCommand: (id: string) => Promise<void>;
    getVaultPath: () => Promise<string | undefined>;
    getObsidianVersion: () => Promise<string>;
    getObsidianInstallerVersion: () => Promise<string>;
    
    // Enhanced commands for CI testing
    waitForObsidianReady: (timeout?: number) => Promise<void>;
    takeScreenshotOnFailure: (testName: string) => Promise<string | null>;
    
    // Test info for screenshot naming
    testInfo?: {
      name: string;
      startTime: number;
    };
  }
}