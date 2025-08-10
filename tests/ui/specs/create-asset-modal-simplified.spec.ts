import { expect } from 'chai';
import { ObsidianAppPage } from '../pageobjects/ObsidianApp.page';

describe('Exocortex Plugin – Create Asset Modal (Simplified)', () => {
  let app: ObsidianAppPage;

  before(async () => {
    app = new ObsidianAppPage();
    
    // Ensure workspace is ready
    await app.waitForWorkspaceReady();
    
    // Enable the plugin if not already enabled
    const isEnabled = await app.isPluginEnabled('exocortex');
    if (!isEnabled) {
      await app.enablePlugin('exocortex');
      await browser.pause(2000);
    }
  });

  it('should verify plugin is loaded', async () => {
    const pluginLoaded = await browser.executeObsidian(({ app }) => {
      return app.plugins.plugins['exocortex'] !== undefined;
    });
    
    expect(pluginLoaded).to.be.true;
  });

  it('should open modal programmatically', async () => {
    // Open modal directly through the plugin
    await browser.executeObsidian(({ app }) => {
      const plugin = app.plugins.plugins['exocortex'];
      if (plugin && plugin.CreateAssetModal) {
        const modal = new plugin.CreateAssetModal(app);
        modal.open();
      } else if ((window as any).ExocortexPlugin) {
        // Try global reference
        const CreateAssetModal = (window as any).ExocortexPlugin.CreateAssetModal;
        if (CreateAssetModal) {
          const modal = new CreateAssetModal(app);
          modal.open();
        }
      }
    });

    await browser.pause(1000);

    // Check if modal opened
    const modalInfo = await browser.executeObsidian(() => {
      const modal = document.querySelector('.modal');
      if (!modal) return { exists: false };
      
      const h2 = modal.querySelector('h2');
      const titleInput = modal.querySelector('input[type="text"]');
      const classDropdown = modal.querySelector('select');
      
      return {
        exists: true,
        title: h2?.textContent || null,
        hasTitleInput: titleInput !== null,
        hasClassDropdown: classDropdown !== null
      };
    });

    expect(modalInfo.exists).to.be.true;
    expect(modalInfo.title).to.equal('Create ExoAsset');
    expect(modalInfo.hasTitleInput).to.be.true;
    expect(modalInfo.hasClassDropdown).to.be.true;
  });

  it('should display default Asset class properties', async () => {
    const properties = await browser.executeObsidian(() => {
      const modal = document.querySelector('.modal');
      if (!modal) return [];
      
      const propertyContainer = modal.querySelector('.exocortex-properties-container');
      if (!propertyContainer) return [];
      
      const props = [];
      const settings = propertyContainer.querySelectorAll('.setting-item');
      
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl) {
          props.push(nameEl.textContent);
        }
      }
      
      return props;
    });

    // Default Asset properties
    expect(properties).to.include('Description');
    expect(properties).to.include('Tags');
  });

  it('should close modal', async () => {
    await browser.executeObsidian(() => {
      const modal = document.querySelector('.modal');
      if (modal) {
        const closeButton = modal.querySelector('.modal-close-button');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      }
    });

    await browser.pause(500);

    const modalClosed = await browser.executeObsidian(() => {
      return document.querySelector('.modal') === null;
    });

    expect(modalClosed).to.be.true;
  });

  after(async () => {
    // Close any open modals
    await browser.executeObsidian(() => {
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => {
        const closeButton = modal.querySelector('.modal-close-button');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      });
    });
  });
});