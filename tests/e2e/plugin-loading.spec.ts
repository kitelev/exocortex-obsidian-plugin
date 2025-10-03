import { test, expect } from '@playwright/test';
import { launchObsidian, closeObsidian, waitForPlugin } from './setup/helpers';

test.describe('Plugin Loading', () => {
  test('should load Exocortex plugin successfully', async () => {
    const context = await launchObsidian();

    const pluginLoaded = await waitForPlugin(context.window, 'exocortex-obsidian-plugin');
    expect(pluginLoaded).toBe(true);

    await closeObsidian(context);
  });

  test('should have plugin in enabled plugins list', async () => {
    const context = await launchObsidian();

    const isEnabled = await context.window.evaluate(() => {
      // @ts-ignore
      return window.app?.plugins?.enabledPlugins?.has('exocortex-obsidian-plugin');
    });

    expect(isEnabled).toBe(true);
    await closeObsidian(context);
  });

  test('should load without console errors', async () => {
    const context = await launchObsidian();
    const errors: string[] = [];

    context.window.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await context.window.waitForTimeout(3000);

    const pluginErrors = errors.filter(err =>
      err.toLowerCase().includes('exocortex')
    );

    expect(pluginErrors.length).toBe(0);
    await closeObsidian(context);
  });
});
