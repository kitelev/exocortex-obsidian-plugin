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

    console.log('[ObsidianLauncher] Launching Obsidian from:', obsidianPath);
    console.log('[ObsidianLauncher] Vault path:', this.vaultPath);
    console.log('[ObsidianLauncher] DOCKER env:', process.env.DOCKER);
    console.log('[ObsidianLauncher] DISPLAY env:', process.env.DISPLAY);

    if (!fs.existsSync(obsidianPath)) {
      throw new Error(`Obsidian not found at ${obsidianPath}. Set OBSIDIAN_PATH environment variable.`);
    }

    const args = [this.vaultPath];

    // In Docker/CI, we need additional flags to run in headless environment
    if (process.env.CI || process.env.DOCKER) {
      console.log('[ObsidianLauncher] Adding Docker/CI flags...');
      args.push(
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--disable-setuid-sandbox',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      );
    }

    console.log('[ObsidianLauncher] Launching Electron with args:', args);

    this.app = await electron.launch({
      executablePath: obsidianPath,
      args,
      env: {
        ...process.env,
        OBSIDIAN_DISABLE_GPU: '1',
      },
      timeout: 120000, // 2 minutes timeout for launch
    });

    console.log('[ObsidianLauncher] Electron launched, waiting for window...');

    this.window = await this.app.firstWindow();
    console.log('[ObsidianLauncher] Window received, waiting for DOM...');

    await this.window.waitForLoadState('domcontentloaded');
    console.log('[ObsidianLauncher] DOM loaded, waiting 3s for Obsidian initialization...');

    await this.window.waitForTimeout(3000);
    console.log('[ObsidianLauncher] Obsidian ready!');
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
