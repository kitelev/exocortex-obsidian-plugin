import { test, expect } from '@playwright/test';
import {
  launchObsidian,
  closeObsidian,
  waitForPlugin,
  openCommandPalette,
  executeCommand,
} from './setup/helpers';

test.describe('Plugin Commands', () => {
  test('should open command palette', async () => {
    const context = await launchObsidian();
    await waitForPlugin(context.window, 'exocortex-obsidian-plugin');

    await openCommandPalette(context.window);

    const paletteVisible = await context.window.isVisible('.prompt');
    expect(paletteVisible).toBe(true);

    await context.window.keyboard.press('Escape');
    await closeObsidian(context);
  });

  test('should list Exocortex commands', async () => {
    const context = await launchObsidian();
    await waitForPlugin(context.window, 'exocortex-obsidian-plugin');

    await openCommandPalette(context.window);
    await context.window.keyboard.type('Exocortex');
    await context.window.waitForTimeout(500);

    const commandsVisible = await context.window.evaluate(() => {
      const text = document.body.innerText;
      return text.toLowerCase().includes('exocortex');
    });

    expect(commandsVisible).toBe(true);

    await context.window.keyboard.press('Escape');
    await closeObsidian(context);
  });

  test('should execute commands without errors', async () => {
    const context = await launchObsidian();
    await waitForPlugin(context.window, 'exocortex-obsidian-plugin');

    const errors: string[] = [];
    context.window.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await openCommandPalette(context.window);
    await context.window.keyboard.press('Escape');
    await context.window.waitForTimeout(1000);

    const pluginErrors = errors.filter(err =>
      err.toLowerCase().includes('exocortex')
    );

    expect(pluginErrors.length).toBe(0);
    await closeObsidian(context);
  });
});
