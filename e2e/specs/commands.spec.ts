import { expect } from 'chai';

/**
 * Basic end to end tests for the Exocortex Obsidian plugin.
 *
 * These tests run against a real Obsidian instance using the wdio obsidian
 * service. They verify that the plugin loads and that a simple command
 * executes without throwing. Additional tests can be added as the plugin
 * evolves (e.g. opening random notes, counting notes, etc.).
 */

describe('Exocortex plugin', () => {
  it('should load the plugin', async () => {
    const loaded = await browser.executeAsync((done) => {
      // The obsidian app is available on the window object when using
      // wdio obsidian service. We wait a short time to allow the plugin to
      // register itself.
      setTimeout(() => {
        const app: any = (window as any).app;
        const hasPlugin = !!(
          app?.plugins?.plugins?.['exocortex-obsidian-plugin'] ||
          app?.plugins?.plugins?.['exocortex'] ||
          app?.plugins?.getPlugin?.('exocortex-obsidian-plugin')
        );
        done(hasPlugin);
      }, 1000);
    });
    expect(loaded).to.be.true;
  });
  it('should execute the "exocortex:create-instance" command without error', async () => {
    // Call the command by its ID. If the command does not exist or throws
    // an exception the test will fail.
    await browser.executeAsync(async (done) => {
      const app: any = (window as any).app;
      if (!app) {
        throw new Error('Obsidian app is not available');
      }
      // The command ID is defined in the plugin's onload() method. If you change the ID in your plugin code, update it here as well.
      await app.commands.executeCommandById('exocortex:create-instance');
      done(true);
    });
  });
});
