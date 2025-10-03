/**
 * E2E Test Helpers for Obsidian Plugin Testing
 *
 * Utilities for launching Obsidian, navigating, and interacting with the plugin
 */

import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

export interface ObsidianTestContext {
  app: ElectronApplication;
  window: Page;
}

/**
 * Launch Obsidian with test vault
 */
export async function launchObsidian(): Promise<ObsidianTestContext> {
  const vaultPath = path.join(__dirname, 'test-vault');
  const userDataPath = path.join(__dirname, 'test-user-data');

  // Ensure directories exist
  await fs.ensureDir(vaultPath);
  await fs.ensureDir(path.join(vaultPath, '.obsidian'));
  await fs.remove(userDataPath);  // Clean user data for fresh start
  await fs.ensureDir(userDataPath);

  // Get Obsidian executable path
  const obsidianBinary = process.env.OBSIDIAN_PATH || '/Applications/Obsidian.app/Contents/MacOS/Obsidian';

  // Launch Electron app with Obsidian
  const app = await electron.launch({
    executablePath: obsidianBinary,
    args: [
      `--user-data-dir=${userDataPath}`,
      '--vault',
      vaultPath,
    ],
    timeout: 60000,  // Increased timeout for startup
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
    },
  });

  // Get first window
  const window = await app.firstWindow();

  // Wait for Obsidian to load
  await window.waitForLoadState('domcontentloaded');
  await window.waitForTimeout(3000);  // Extra wait for plugin loading

  return { app, window };
}

/**
 * Close Obsidian gracefully
 */
export async function closeObsidian(context: ObsidianTestContext): Promise<void> {
  await context.app.close();
}

/**
 * Open note by name
 */
export async function openNote(window: Page, noteName: string): Promise<void> {
  // Open quick switcher (Ctrl+O or Cmd+O)
  const isMac = process.platform === 'darwin';
  const modifier = isMac ? 'Meta' : 'Control';

  await window.keyboard.press(`${modifier}+O`);
  await window.waitForTimeout(500);

  // Type note name
  await window.keyboard.type(noteName);
  await window.waitForTimeout(300);

  // Press Enter
  await window.keyboard.press('Enter');

  // Wait for note to load
  await window.waitForSelector('.markdown-source-view, .markdown-reading-view', {
    timeout: 5000,
  });
}

/**
 * Create test note in vault
 */
export async function createTestNote(
  noteName: string,
  content: string,
  frontmatter?: Record<string, any>
): Promise<void> {
  const vaultPath = path.join(__dirname, 'test-vault');
  const notePath = path.join(vaultPath, noteName);

  let fileContent = content;

  if (frontmatter) {
    const yamlFrontmatter = Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    fileContent = `---\n${yamlFrontmatter}\n---\n\n${content}`;
  }

  await fs.writeFile(notePath, fileContent, 'utf-8');
}

/**
 * Delete test note
 */
export async function deleteTestNote(noteName: string): Promise<void> {
  const vaultPath = path.join(__dirname, 'test-vault');
  const notePath = path.join(vaultPath, noteName);

  if (await fs.pathExists(notePath)) {
    await fs.remove(notePath);
  }
}

/**
 * Open command palette
 */
export async function openCommandPalette(window: Page): Promise<void> {
  const isMac = process.platform === 'darwin';
  const modifier = isMac ? 'Meta' : 'Control';

  await window.keyboard.press(`${modifier}+P`);
  await window.waitForSelector('.prompt', { timeout: 2000 });
}

/**
 * Execute Obsidian command
 */
export async function executeCommand(window: Page, commandName: string): Promise<void> {
  await openCommandPalette(window);
  await window.keyboard.type(commandName);
  await window.waitForTimeout(500);
  await window.keyboard.press('Enter');
}

/**
 * Open settings
 */
export async function openSettings(window: Page): Promise<void> {
  const isMac = process.platform === 'darwin';
  const modifier = isMac ? 'Meta' : 'Control';

  await window.keyboard.press(`${modifier}+,`);
  await window.waitForSelector('.modal.mod-settings', { timeout: 5000 });
}

/**
 * Wait for plugin to be loaded
 */
export async function waitForPlugin(window: Page, pluginId: string): Promise<boolean> {
  return await window.evaluate((id) => {
    return new Promise((resolve) => {
      const checkPlugin = () => {
        // @ts-ignore
        if (window.app?.plugins?.enabledPlugins?.has(id)) {
          resolve(true);
        } else {
          setTimeout(checkPlugin, 100);
        }
      };
      checkPlugin();

      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
  }, pluginId);
}

/**
 * Get plugin instance
 */
export async function getPlugin(window: Page, pluginId: string): Promise<any> {
  return await window.evaluate((id) => {
    // @ts-ignore
    return window.app?.plugins?.plugins?.[id];
  }, pluginId);
}

/**
 * Check if element exists
 */
export async function elementExists(window: Page, selector: string): Promise<boolean> {
  try {
    await window.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean test vault (remove all notes except sample)
 */
export async function cleanTestVault(): Promise<void> {
  const vaultPath = path.join(__dirname, 'test-vault');
  const files = await fs.readdir(vaultPath);

  for (const file of files) {
    if (file !== '.obsidian' && !file.startsWith('.')) {
      await fs.remove(path.join(vaultPath, file));
    }
  }
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(window: Page, name: string): Promise<void> {
  const screenshotPath = path.join(__dirname, '../screenshots', `${name}.png`);
  await fs.ensureDir(path.dirname(screenshotPath));
  await window.screenshot({ path: screenshotPath });
}
