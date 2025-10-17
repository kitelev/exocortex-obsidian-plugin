import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export class ObsidianLauncher {
  private app: ElectronApplication | null = null;
  private window: Page | null = null;
  private vaultPath: string;

  constructor(vaultPath?: string) {
    this.vaultPath = vaultPath || path.join(__dirname, '../test-vault');
  }

  async launch(): Promise<void> {
    const obsidianPath = process.env.OBSIDIAN_PATH || '/Applications/Obsidian.app/Contents/MacOS/Obsidian';

    if (!fs.existsSync(obsidianPath)) {
      throw new Error(`Obsidian not found at ${obsidianPath}. Set OBSIDIAN_PATH environment variable.`);
    }

    this.app = await electron.launch({
      executablePath: obsidianPath,
      args: [this.vaultPath],
      env: {
        ...process.env,
        OBSIDIAN_DISABLE_GPU: '1',
      },
    });

    this.window = await this.app.firstWindow();
    await this.window.waitForLoadState('domcontentloaded');

    await this.window.waitForTimeout(3000);
  }

  async openFile(filePath: string): Promise<void> {
    if (!this.window) {
      throw new Error('Obsidian not launched. Call launch() first.');
    }

    const normalizedPath = filePath.replace(/\\/g, '/');

    await this.window.evaluate((path) => {
      const app = (window as any).app;
      if (app && app.workspace) {
        app.workspace.openLinkText(path, '', false);
      }
    }, normalizedPath);

    await this.window.waitForTimeout(1000);
  }

  async getWindow(): Promise<Page> {
    if (!this.window) {
      throw new Error('Obsidian not launched. Call launch() first.');
    }
    return this.window;
  }

  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    if (!this.window) {
      throw new Error('Obsidian not launched. Call launch() first.');
    }
    await this.window.waitForSelector(selector, { timeout });
  }

  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
      this.window = null;
    }
  }
}
