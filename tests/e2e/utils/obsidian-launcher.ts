import { _electron as electron, ElectronApplication, Page, chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export class ObsidianLauncher {
  private app: ElectronApplication | null = null;
  private window: Page | null = null;
  private vaultPath: string;
  private electronProcess: ChildProcess | null = null;

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

    const args = [
      this.vaultPath,
      '--remote-debugging-port=9222',
    ];

    // In Docker/CI, we need additional flags to run in headless environment
    if (process.env.CI || process.env.DOCKER) {
      console.log('[ObsidianLauncher] Adding Docker/CI flags...');
      args.push(
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--disable-setuid-sandbox',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=VizDisplayCompositor',
        '--use-gl=swiftshader',
        '--disable-blink-features=AutomationControlled'
      );
    }

    console.log('[ObsidianLauncher] Spawning Electron process with CDP port 9222...');
    console.log('[ObsidianLauncher] Args:', args);

    this.electronProcess = spawn(obsidianPath, args, {
      env: {
        ...process.env,
        OBSIDIAN_DISABLE_GPU: '1',
      },
      stdio: 'inherit',
    });

    console.log('[ObsidianLauncher] Electron process spawned, PID:', this.electronProcess.pid);

    await this.waitForPort(9222, 30000);
    console.log('[ObsidianLauncher] CDP port 9222 is ready');

    console.log('[ObsidianLauncher] Connecting to Electron via CDP...');
    const browser = await chromium.connectOverCDP('http://localhost:9222', { timeout: 30000 });
    console.log('[ObsidianLauncher] Connected to browser via CDP');

    const contexts = browser.contexts();
    console.log(`[ObsidianLauncher] Found ${contexts.length} browser context(s)`);

    if (contexts.length === 0) {
      throw new Error('No browser contexts found after CDP connection');
    }

    const context = contexts[0];
    const pages = context.pages();
    console.log(`[ObsidianLauncher] Found ${pages.length} page(s) in first context`);

    if (pages.length > 1) {
      this.window = pages[1];
      console.log('[ObsidianLauncher] Using second page (trashhalo pattern)');
    } else if (pages.length === 1) {
      this.window = pages[0];
      console.log('[ObsidianLauncher] Using first page (only one available)');
    } else {
      console.log('[ObsidianLauncher] No pages yet, waiting for page event...');
      this.window = await context.waitForEvent('page', { timeout: 30000 });
      console.log('[ObsidianLauncher] Got page from event');
    }

    await this.window.waitForLoadState('domcontentloaded', { timeout: 30000 });
    console.log('[ObsidianLauncher] DOM loaded, waiting 3s for Obsidian initialization...');

    await this.window.waitForTimeout(3000);
    console.log('[ObsidianLauncher] Obsidian ready!');
  }

  private async waitForPort(port: number, timeout: number): Promise<void> {
    const startTime = Date.now();
    const http = await import('http');

    return new Promise((resolve, reject) => {
      const checkPort = () => {
        const req = http.request(
          {
            host: 'localhost',
            port,
            path: '/json/version',
            method: 'GET',
          },
          (res) => {
            if (res.statusCode === 200) {
              console.log(`[ObsidianLauncher] Port ${port} is accepting connections`);
              resolve();
            } else {
              retryCheck();
            }
          }
        );

        req.on('error', () => {
          retryCheck();
        });

        req.end();
      };

      const retryCheck = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for port ${port} after ${timeout}ms`));
        } else {
          setTimeout(checkPort, 500);
        }
      };

      checkPort();
    });
  }

  async openFile(filePath: string): Promise<void> {
    if (!this.window) {
      throw new Error('Obsidian not launched. Call launch() first.');
    }

    const normalizedPath = filePath.replace(/\\/g, '/');
    console.log(`[ObsidianLauncher] Opening file: ${normalizedPath}`);

    await this.window.evaluate((path) => {
      const app = (window as any).app;
      if (app && app.workspace) {
        app.workspace.openLinkText(path, '', false);
      }
    }, normalizedPath);

    await this.window.waitForTimeout(500);
    console.log('[ObsidianLauncher] File opened, checking view mode...');

    const viewInfo = await this.window.evaluate(() => {
      const app = (window as any).app;
      const activeLeaf = app?.workspace?.activeLeaf;
      const viewState = activeLeaf?.getViewState();
      return {
        hasLeaf: !!activeLeaf,
        currentMode: viewState?.state?.mode,
        viewType: viewState?.type,
      };
    });

    console.log('[ObsidianLauncher] View info before mode switch:', viewInfo);

    if (viewInfo.currentMode !== 'preview') {
      console.log('[ObsidianLauncher] Switching to preview mode...');
      await this.window.evaluate(() => {
        const app = (window as any).app;
        const activeLeaf = app?.workspace?.activeLeaf;
        if (activeLeaf) {
          const currentState = activeLeaf.getViewState();
          activeLeaf.setViewState({
            ...currentState,
            state: {
              ...currentState.state,
              mode: 'preview',
            },
          });
        }
      });

      await this.window.waitForTimeout(2000);
      console.log('[ObsidianLauncher] Preview mode switch complete, waiting for plugin render...');
    } else {
      console.log('[ObsidianLauncher] Already in preview mode');
      await this.window.waitForTimeout(1000);
    }

    const finalViewInfo = await this.window.evaluate(() => {
      const app = (window as any).app;
      const activeLeaf = app?.workspace?.activeLeaf;
      const viewState = activeLeaf?.getViewState();
      return {
        currentMode: viewState?.state?.mode,
        hasExocortexContainer: !!document.querySelector('.exocortex-layout-container'),
      };
    });

    console.log('[ObsidianLauncher] Final view info:', finalViewInfo);
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
    if (this.window) {
      await this.window.close();
      this.window = null;
    }

    if (this.electronProcess) {
      this.electronProcess.kill('SIGTERM');
      this.electronProcess = null;
    }

    this.app = null;
  }
}
