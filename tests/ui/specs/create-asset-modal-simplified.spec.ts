import { expect } from 'chai';
import { ObsidianAppPage } from '../pageobjects/ObsidianApp.page';
import { UITestHelpers } from '../utils/test-helpers';

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
    // Use retry logic for opening modal in headless environment
    await UITestHelpers.retryOperation(async () => {
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
    }, 3, 1000);

    // Wait for modal to appear in DOM with proper timeout
    const modalExists = await UITestHelpers.waitForModal(15000);
    expect(modalExists).to.be.true;

    // Wait for modal content to be populated
    await UITestHelpers.waitForModalContent('h2', 5000);
    await UITestHelpers.waitForModalContent('input[type="text"]', 5000);
    await UITestHelpers.waitForModalContent('select', 5000);

    // Check modal content with retry logic
    const modalInfo = await UITestHelpers.retryOperation(async () => {
      return await browser.executeObsidian(() => {
        const modal = document.querySelector('.modal');
        if (!modal) throw new Error('Modal not found');
        
        const h2 = modal.querySelector('h2');
        const titleInput = modal.querySelector('input[type="text"]');
        const classDropdown = modal.querySelector('select');
        
        if (!h2 || !titleInput || !classDropdown) {
          throw new Error('Modal content not fully loaded');
        }
        
        return {
          exists: true,
          title: h2.textContent || null,
          hasTitleInput: titleInput !== null,
          hasClassDropdown: classDropdown !== null
        };
      });
    }, 5, 500);

    expect(modalInfo.exists).to.be.true;
    expect(modalInfo.title).to.equal('Create ExoAsset');
    expect(modalInfo.hasTitleInput).to.be.true;
    expect(modalInfo.hasClassDropdown).to.be.true;
  });

  it('should display default Asset class properties', async () => {
    // Wait for properties container to appear
    const containerExists = await UITestHelpers.waitForModalContent('.exocortex-properties-container', 10000);
    expect(containerExists).to.be.true;
    
    // Wait additional time for properties to be populated asynchronously
    await browser.pause(2000);
    
    // Use retry logic to get properties as they load asynchronously
    const properties = await UITestHelpers.retryOperation(async () => {
      return await browser.executeObsidian(() => {
        const modal = document.querySelector('.modal');
        if (!modal) throw new Error('Modal not found');
        
        const propertyContainer = modal.querySelector('.exocortex-properties-container');
        if (!propertyContainer) throw new Error('Properties container not found');
        
        const props = [];
        const settings = propertyContainer.querySelectorAll('.setting-item');
        
        console.log(`Found ${settings.length} property settings`);
        
        for (const setting of settings) {
          const nameEl = setting.querySelector('.setting-item-name');
          if (nameEl && nameEl.textContent) {
            const propName = nameEl.textContent.trim().replace(' *', ''); // Remove required marker
            props.push(propName);
            console.log(`Found property: ${propName}`);
          }
        }
        
        if (props.length === 0) {
          // Check if there's a "no properties" message instead
          const noPropsMsg = propertyContainer.querySelector('.exocortex-no-properties');
          if (noPropsMsg) {
            console.log('No properties message found:', noPropsMsg.textContent);
          }
          throw new Error('No properties found yet, may still be loading');
        }
        
        return props;
      });
    }, 10, 1000); // Try 10 times with 1 second intervals

    console.log('Retrieved properties:', properties);
    
    // Default Asset properties (matching the CreateAssetModal default properties)
    expect(properties).to.include('Description');
    expect(properties).to.include('Tags');
  });

  it('should close modal', async () => {
    // Use retry logic for closing modal
    await UITestHelpers.retryOperation(async () => {
      await browser.executeObsidian(() => {
        const modal = document.querySelector('.modal');
        if (!modal) throw new Error('Modal not found to close');
        
        // Try multiple close strategies
        const closeButton = modal.querySelector('.modal-close-button');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        } else {
          // Fallback: press Escape key
          const event = new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            which: 27
          });
          document.dispatchEvent(event);
        }
      });
    }, 3, 500);

    // Wait for modal to disappear
    await browser.pause(1000);

    // Verify modal is closed with retry logic
    const modalClosed = await UITestHelpers.retryOperation(async () => {
      const isClosed = await browser.executeObsidian(() => {
        return document.querySelector('.modal') === null;
      });
      
      if (!isClosed) {
        throw new Error('Modal still visible');
      }
      
      return isClosed;
    }, 5, 500);

    expect(modalClosed).to.be.true;
  });

  after(async () => {
    // Close any open modals with retry logic
    try {
      await UITestHelpers.closeAllModals(3);
    } catch (error) {
      console.log('Could not close modals in cleanup:', error.message);
    }
  });
});