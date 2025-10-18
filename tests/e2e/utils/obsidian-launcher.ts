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

    this.createObsidianConfig();

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
    console.log('[ObsidianLauncher] DOM loaded, handling trust dialog if present...');

    await this.handleTrustDialog();

    console.log('[ObsidianLauncher] Trust dialog handled, waiting for window.app to become available...');

    let pollCount = 0;
    const maxPolls = 60;
    let appFound = false;

    while (pollCount < maxPolls && !appFound) {
      const pollResult = await this.window.evaluate(() => {
        const win = window as any;
        return {
          hasApp: !!win.app,
          hasWorkspace: !!win.app?.workspace,
          hasVault: !!win.app?.vault,
        };
      });

      if (pollResult.hasApp && pollResult.hasWorkspace && pollResult.hasVault) {
        appFound = true;
        console.log('[ObsidianLauncher] App object found after', pollCount, 'polls');
        break;
      }

      if (pollCount % 5 === 0) {
        console.log(`[ObsidianLauncher] Poll ${pollCount}/${maxPolls}: app=${pollResult.hasApp}, workspace=${pollResult.hasWorkspace}, vault=${pollResult.hasVault}`);
      }

      await this.window.waitForTimeout(1000);
      pollCount++;
    }

    if (!appFound) {
      throw new Error('window.app not available after 60 seconds');
    }

    console.log('[ObsidianLauncher] Obsidian app object available!');

    await this.window.waitForTimeout(1000);
    console.log('[ObsidianLauncher] Obsidian ready!');
  }

  private createObsidianConfig(): void {
    const configDir = '/root/.config/obsidian';
    const configPath = path.join(configDir, 'obsidian.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log('[ObsidianLauncher] Created config directory:', configDir);
    }

    const vaultId = 'test-vault-e2e';
    const config = {
      vaults: {
        [vaultId]: {
          path: this.vaultPath,
          ts: Date.now(),
          open: true,
          trusted: true
        }
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[ObsidianLauncher] Created Obsidian config at:', configPath);
    console.log('[ObsidianLauncher] Registered vault:', this.vaultPath);
  }

  private async handleTrustDialog(): Promise<void> {
    if (!this.window) {
      throw new Error('Window not available');
    }

    try {
      console.log('[ObsidianLauncher] Looking for trust dialog...');

      const trustButton = await this.window.locator('button:has-text("Trust author and enable plugins")').first();

      const isVisible = await trustButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        console.log('[ObsidianLauncher] Trust dialog found! Clicking "Trust author and enable plugins" button...');
        await trustButton.click();
        console.log('[ObsidianLauncher] Trust button clicked, waiting for dialog to disappear...');

        await this.window.waitForSelector('button:has-text("Trust author and enable plugins")', {
          state: 'hidden',
          timeout: 5000
        }).catch(() => {
          console.log('[ObsidianLauncher] Trust dialog did not disappear, but continuing...');
        });

        console.log('[ObsidianLauncher] Trust dialog handled successfully');
      } else {
        console.log('[ObsidianLauncher] Trust dialog not present (vault already trusted or not required)');
      }
    } catch (error) {
      console.log('[ObsidianLauncher] No trust dialog found or error handling it:', error);
    }
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

    const fileOpenResult = await this.window.evaluate(async (path) => {
      const app = (window as any).app;
      if (!app || !app.workspace || !app.vault) {
        return { success: false, error: 'App not available' };
      }

      const file = app.vault.getAbstractFileByPath(path);
      if (!file) {
        return { success: false, error: `File not found: ${path}` };
      }

      const leaf = app.workspace.getLeaf(false);
      await leaf.openFile(file, { state: { mode: 'preview' } });

      return { success: true };
    }, normalizedPath);

    console.log('[ObsidianLauncher] File open result:', fileOpenResult);

    if (!fileOpenResult.success) {
      throw new Error(`Failed to open file: ${fileOpenResult.error}`);
    }

    await this.window.waitForTimeout(2000);
    console.log('[ObsidianLauncher] Waiting for file load and plugin render...');

    const finalViewInfo = await this.window.evaluate(() => {
      const app = (window as any).app;
      const activeLeaf = app?.workspace?.activeLeaf;
      const viewState = activeLeaf?.getViewState();
      return {
        hasLeaf: !!activeLeaf,
        currentMode: viewState?.state?.mode,
        viewType: viewState?.type,
        hasExocortexContainer: !!document.querySelector('.exocortex-layout-container'),
      };
    });

    console.log('[ObsidianLauncher] Final view info:', finalViewInfo);

    if (!finalViewInfo.hasLeaf) {
      throw new Error('No active leaf after opening file');
    }
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
