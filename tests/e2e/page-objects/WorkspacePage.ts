/**
 * Page Object for Obsidian Workspace interactions
 * Uses browser.executeObsidian for direct Obsidian API access
 */
export class WorkspacePage {
  // Configuration constants (from wdio.e2e.conf.ts obsidianConfig)
  protected readonly selectors = {
    workspace: '.workspace',
    modal: '.modal',
    createAssetModal: '.exocortex-create-asset-modal',
    dynamicLayout: '.exocortex-dynamic-layout',
    universalLayout: '.exocortex-universal-layout',
    propertyField: '.exocortex-property-field',
    classSelector: '.exocortex-class-selector',
    submitButton: '.exocortex-submit-button'
  };

  protected readonly timeouts = {
    pageLoad: 15000,
    elementVisible: 10000,
    modalOpen: 15000,
    formUpdate: 5000
  };

  /**
   * Wait for Obsidian workspace to be fully loaded
   */
  async waitForWorkspace(): Promise<void> {
    await browser.waitUntil(
      async () => {
        return await browser.executeObsidian(({app}) => app && app.workspace && app.workspace.layoutReady);
      },
      {
        timeout: this.timeouts.pageLoad,
        timeoutMsg: 'Obsidian workspace failed to load within timeout'
      }
    );
  }

  /**
   * Open command palette
   */
  async openCommandPalette(): Promise<void> {
    await browser.executeObsidian(({app}) => app.commands.executeCommandById("command-palette:open"));
    await browser.pause(500); // Brief pause for UI to respond
  }

  /**
   * Execute command by ID
   */
  async executeCommand(commandId: string): Promise<void> {
    await browser.executeObsidian(({app}, commandId) => app.commands.executeCommandById(commandId), commandId);
    await browser.pause(200);
  }

  /**
   * Create a new note
   */
  async createNewNote(noteName?: string): Promise<void> {
    if (noteName) {
      await browser.executeObsidian(({app}, noteName) => app.vault.create(`${noteName}.md`, ""), noteName);
    } else {
      await this.executeCommand('file-explorer:new-file');
    }
    await browser.pause(500);
  }

  /**
   * Open note by name
   */
  async openNote(noteName: string): Promise<void> {
    const notePath = noteName.endsWith('.md') ? noteName : `${noteName}.md`;
    await browser.executeObsidian(({app}, notePath) => app.workspace.openLinkText(notePath, ""), notePath);
    await browser.pause(500);
  }

  /**
   * Get current note title
   */
  async getCurrentNoteTitle(): Promise<string> {
    return await browser.executeObsidian(({app}) => app.workspace.getActiveFile()?.basename || "");
  }

  /**
   * Insert text in current editor
   */
  async insertText(text: string): Promise<void> {
    // Click in the editor area
    const editor = await $('.cm-editor');
    await editor.click();
    
    // Insert the text
    await browser.keys(text);
  }

  /**
   * Get editor content
   */
  async getEditorContent(): Promise<string> {
    return await browser.executeObsidian(({app}) => app.workspace.getActiveViewOfType(app.viewRegistry.typeByName["markdown"])?.editor?.getValue() || "");
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = this.timeouts.elementVisible): Promise<WebdriverIO.Element> {
    const element = await $(selector);
    await element.waitForDisplayed({ timeout });
    return element as any;
  }

  /**
   * Wait for modal to open
   */
  async waitForModal(timeout = this.timeouts.modalOpen): Promise<WebdriverIO.Element> {
    const modal = await $(this.selectors.modal);
    await modal.waitForDisplayed({ timeout });
    return modal as any;
  }

  /**
   * Close any open modal
   */
  async closeModal(): Promise<void> {
    // Try pressing Escape key
    await browser.keys('Escape');
    
    // Wait for modal to close
    await browser.waitUntil(
      async () => {
        const modal = await $(this.selectors.modal);
        return !(await modal.isDisplayed());
      },
      {
        timeout: 5000,
        timeoutMsg: 'Modal failed to close'
      }
    );
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(filename?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = filename || `screenshot-${timestamp}.png`;
    const screenshotPath = `./tests/e2e/test-results/screenshots/${screenshotName}`;
    
    await browser.saveScreenshot(screenshotPath);
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    return screenshotPath;
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(): Promise<void> {
    await browser.waitUntil(
      async () => {
        return await browser.execute(() => {
          return document.readyState === 'complete';
        });
      },
      {
        timeout: this.timeouts.pageLoad,
        timeoutMsg: 'Page failed to become ready'
      }
    );
  }

  /**
   * Initialize Obsidian for testing
   */
  async initializeObsidian(): Promise<void> {
    await this.waitForWorkspace();
    await browser.pause(1000); // Allow plugins to load
  }

  /**
   * Get all visible modals
   */
  async getVisibleModals(): Promise<WebdriverIO.Element[]> {
    const modals = await $$(this.selectors.modal);
    const visibleModals: WebdriverIO.Element[] = [];
    
    for (const modal of modals) {
      if (await modal.isDisplayed()) {
        visibleModals.push(modal);
      }
    }
    
    return visibleModals;
  }

  /**
   * Check if plugin is loaded
   */
  async isPluginLoaded(pluginId: string): Promise<boolean> {
    return await browser.executeObsidian(({app}, pluginId) => app.plugins.enabledPlugins.has(pluginId), pluginId);
  }

  /**
   * Get plugin instance
   */
  async getPlugin(pluginId: string): Promise<any> {
    return await browser.executeObsidian(({app}, pluginId) => app.plugins.plugins[pluginId], pluginId);
  }
}