/**
 * Page Object for general Obsidian app interactions
 */
export class ObsidianAppPage {
  /**
   * Wait for Obsidian workspace to be ready
   */
  async waitForWorkspaceReady(timeout = 30000): Promise<void> {
    await (browser as any).waitUntil(
      async () => {
        try {
          const ready = await browser.executeObsidian(({ app }) => {
            return app.workspace && app.workspace.layoutReady;
          });
          return ready === true;
        } catch {
          return false;
        }
      },
      {
        timeout,
        timeoutMsg: "Obsidian workspace failed to become ready",
      },
    );
  }

  /**
   * Open a markdown file by path
   */
  async openFile(filePath: string): Promise<void> {
    await browser.executeObsidian(({ app }, path: string) => {
      const file = app.vault
        .getMarkdownFiles()
        .find((f: any) => f.path === path || f.name === path);
      if (file) {
        app.workspace.openLinkText(file.path, "", false);
      }
    }, filePath);

    // Wait for file to open
    await (browser as any).pause(500);
  }

  /**
   * Get current active file name
   */
  async getActiveFileName(): Promise<string | null> {
    return await browser.executeObsidian(({ app }) => {
      const file = app.workspace.getActiveFile();
      return file ? file.name : null;
    });
  }

  /**
   * Enable a plugin by ID
   */
  async enablePlugin(pluginId: string): Promise<void> {
    await browser.executeObsidian(({ app }, id: string) => {
      return app.plugins.enablePlugin(id);
    }, pluginId);
  }

  /**
   * Check if plugin is enabled
   */
  async isPluginEnabled(pluginId: string): Promise<boolean> {
    return await browser.executeObsidian(({ app }, id: string) => {
      return app.plugins.enabledPlugins.has(id);
    }, pluginId);
  }

  /**
   * Execute a command by ID
   */
  async executeCommand(commandId: string): Promise<void> {
    await browser.executeObsidianCommand(commandId);
  }

  /**
   * Get all available commands
   */
  async getAvailableCommands(): Promise<string[]> {
    return await browser.executeObsidian(({ app }) => {
      return Object.keys(app.commands.commands);
    });
  }

  /**
   * Switch to source mode
   */
  async switchToSourceMode(): Promise<void> {
    await browser.executeObsidian(({ app }) => {
      const leaf = app.workspace.activeLeaf;
      if (leaf) {
        const state = leaf.getViewState();
        state.state.mode = "source";
        leaf.setViewState(state);
      }
    });
  }

  /**
   * Switch to preview mode
   */
  async switchToPreviewMode(): Promise<void> {
    await browser.executeObsidian(({ app }) => {
      const leaf = app.workspace.activeLeaf;
      if (leaf) {
        const state = leaf.getViewState();
        state.state.mode = "preview";
        leaf.setViewState(state);
      }
    });
  }
}
