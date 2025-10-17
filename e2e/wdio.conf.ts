import type { Options } from '@wdio/types';

/*
 * This WebdriverIO configuration enables end‑to‑end (E2E) testing of the
 * Exocortex Obsidian plugin in a real Obsidian environment.  It uses the
 * community `wdio-obsidian-service` to automatically download and launch
 * Obsidian in a sandboxed temporary directory, install the built plugin from
 * `./dist`, open a test vault and then run Mocha tests contained in
 * `./e2e/specs`.  Running `npx wdio run ./e2e/wdio.conf.ts` will execute
 * all specs and shut down Obsidian when finished.  See the README for
 * additional options.
 */

export const config: Options.Testrunner = {
  autoCompileOpts: {
    // allow TypeScript test files without separate compilation
    tsNodeOpts: {
      transpileOnly: true,
    },
  },
  specs: ['./e2e/specs/**/*.spec.ts'],
  maxInstances: 1,
  framework: 'mocha',
  mochaOpts: {
    timeout: 60000,
  },
  reporters: ['spec'],
  services: [
    ['wdio-obsidian-service', {
      // Path to the compiled plugin bundle.  Before running E2E tests you
      // should build the plugin (e.g. `npm run build`).  The service will
      // copy `main.js`, `manifest.json` and `styles.css` from this
      // directory into the temporary Obsidian plugins folder.
      pluginPath: './dist',
      // List of vaults to make available.  Each entry defines a friendly
      // name used in tests and the path to a fixture directory under
      // `./e2e/fixtures`.  Additional vaults can be added here if you have
      // multiple test scenarios.
      vaults: [
        {
          name: 'test-vault',
          path: './e2e/fixtures/test-vault',
        },
      ],
      // Which Obsidian versions to test against.  `latest` will pull
      // whatever is current when the tests run.  You can specify a list of
      // version numbers (e.g. ['1.6.7', 'latest']) to test across
      // multiple versions.
      versions: ['latest'],
      // Run Obsidian in headless mode.  When set to true the Electron
      // application runs without opening a visible window, which is
      // recommended for CI environments.  For local debugging you can set
      // this to false to see the UI.
      headless: true,
    }],
  ],
};

export default config;
