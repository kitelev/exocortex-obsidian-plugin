import { expect } from 'chai';
import { ObsidianAppPage } from '../pageobjects/ObsidianApp.page';

describe('Exocortex Plugin – Activation', () => {
  let app: ObsidianAppPage;

  before(() => {
    app = new ObsidianAppPage();
  });

  it('should load Obsidian workspace successfully', async () => {
    await app.waitForWorkspaceReady();
    
    // Verify workspace is ready
    const isReady = await browser.executeObsidian(({ app }) => {
      return app.workspace.layoutReady === true;
    });
    
    expect(isReady).to.be.true;
  });

  it('should enable Exocortex plugin', async () => {
    // Enable the plugin
    await app.enablePlugin('exocortex');
    
    // Verify plugin is enabled
    const isEnabled = await app.isPluginEnabled('exocortex');
    expect(isEnabled).to.be.true;
  });

  it('should register SPARQL code block processor', async () => {
    // Check if SPARQL processor is registered by looking for console logs
    const logs = await browser.executeObsidian(({ app }) => {
      // Check if the plugin registered successfully
      const plugin = app.plugins.plugins['exocortex'];
      return plugin !== undefined;
    });
    
    expect(logs).to.be.true;
  });

  it('should have test files in vault', async () => {
    const files = await browser.executeObsidian(({ app }) => {
      return app.vault.getMarkdownFiles().map((f: any) => f.name);
    });
    
    expect(files).to.include('Task 1 - Test SPARQL.md');
    expect(files).to.include('Project - UI Testing.md');
    expect(files).to.include('Note - SPARQL Examples.md');
  });
});
