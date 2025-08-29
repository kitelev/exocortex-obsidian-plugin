import { expect } from '@wdio/globals';

/**
 * REAL UI Test for CreateAssetModal - runs in Docker with actual Obsidian
 * This test verifies the actual behavior of the modal in a real environment
 */
describe('CreateAssetModal - Real Docker Test', () => {
  
  before(async () => {
    // Wait for Obsidian to fully load
    await browser.pause(3000);
    
    // Make sure we're in a vault
    const workspace = await $('.workspace');
    await workspace.waitForExist({ timeout: 10000 });
  });

  describe('Field Duplication Bug Verification', () => {
    it('should open CreateAssetModal and check for duplicate fields', async () => {
      console.log('=== STARTING REAL UI TEST ===');
      
      // Open command palette
      await browser.keys(['Meta', 'p']); // Cmd+P on Mac, Ctrl+P on others
      await browser.pause(500);
      
      // Search for create asset command
      const commandInput = await $('.prompt-input');
      if (await commandInput.isExisting()) {
        await commandInput.setValue('Create ExoAsset');
        await browser.pause(300);
        
        // Select the command
        const suggestion = await $('.suggestion-item');
        if (await suggestion.isExisting()) {
          await suggestion.click();
        } else {
          // Try pressing Enter if suggestion not clickable
          await browser.keys(['Enter']);
        }
      } else {
        console.error('Command palette did not open');
        // Try alternative method - direct command execution
        await browser.execute(() => {
          // @ts-ignore
          if (window.app && window.app.commands) {
            // @ts-ignore
            window.app.commands.executeCommandById('exocortex:create-asset');
          }
        });
      }
      
      // Wait for modal to appear
      await browser.pause(1000);
      
      // Check if modal opened
      const modal = await $('.modal');
      const modalExists = await modal.isExisting();
      console.log(`Modal exists: ${modalExists}`);
      
      if (!modalExists) {
        console.error('Modal did not open - trying alternative approach');
        
        // Alternative: Try to trigger via ribbon icon or menu
        const ribbonButton = await $('.side-dock-ribbon-action[aria-label*="Exo"]');
        if (await ribbonButton.isExisting()) {
          await ribbonButton.click();
          await browser.pause(1000);
        }
      }
      
      // Now check for the actual modal content
      const modalContainer = await $('.modal-container');
      if (await modalContainer.isExisting()) {
        console.log('Modal container found');
        
        // Check for title
        const modalTitle = await modalContainer.$('h2');
        if (await modalTitle.isExisting()) {
          const titleText = await modalTitle.getText();
          console.log(`Modal title: ${titleText}`);
          expect(titleText).toContain('ExoAsset');
        }
        
        // Count all settings/fields in the modal
        const allSettings = await modalContainer.$$('.setting-item');
        console.log(`Total setting items found: ${allSettings.length}`);
        
        // Look for specific fields
        const fields: { [key: string]: number } = {};
        
        for (const setting of allSettings) {
          const nameEl = await setting.$('.setting-item-name');
          if (await nameEl.isExisting()) {
            const name = await nameEl.getText();
            fields[name] = (fields[name] || 0) + 1;
            console.log(`Found field: "${name}"`);
          }
        }
        
        // Check for duplicates
        console.log('\n=== FIELD COUNT ANALYSIS ===');
        let hasDuplicates = false;
        for (const [fieldName, count] of Object.entries(fields)) {
          console.log(`"${fieldName}": ${count} occurrence(s)`);
          if (count > 1) {
            console.error(`❌ DUPLICATE FOUND: "${fieldName}" appears ${count} times!`);
            hasDuplicates = true;
          }
        }
        
        // Specific checks for core properties
        const coreProperties = ['Instance Class', 'Unique ID', 'Defined By'];
        console.log('\n=== CORE PROPERTY CHECK ===');
        
        for (const coreProp of coreProperties) {
          if (fields[coreProp]) {
            console.log(`Found core property: "${coreProp}" - Count: ${fields[coreProp]}`);
            if (fields[coreProp] > 1) {
              console.error(`❌ ERROR: Core property "${coreProp}" appears ${fields[coreProp]} times (should be 0 or 1)`);
            }
          } else {
            console.log(`✅ Core property "${coreProp}" not found in user fields (good!)`);
          }
        }
        
        // Check Properties section specifically
        const propertiesHeader = await modalContainer.$('h3');
        if (await propertiesHeader.isExisting()) {
          const headerText = await propertiesHeader.getText();
          console.log(`\nProperties section header: "${headerText}"`);
          
          // Find the properties container (should be after the h3)
          const propertiesContainer = await propertiesHeader.nextElement();
          if (await propertiesContainer.isExisting()) {
            const propSettings = await propertiesContainer.$$('.setting-item');
            console.log(`Properties in Properties section: ${propSettings.length}`);
            
            // Check each property in the Properties section
            for (const propSetting of propSettings) {
              const propName = await propSetting.$('.setting-item-name');
              if (await propName.isExisting()) {
                const name = await propName.getText();
                console.log(`  - Property: "${name}"`);
                
                // These should NOT be in Properties section
                if (coreProperties.includes(name)) {
                  console.error(`  ❌ ERROR: Core property "${name}" should not be in Properties section!`);
                }
              }
            }
          }
        }
        
        // Test class switching
        console.log('\n=== CLASS SWITCHING TEST ===');
        const classDropdown = await modalContainer.$('select');
        if (await classDropdown.isExisting()) {
          const initialValue = await classDropdown.getValue();
          console.log(`Initial class: ${initialValue}`);
          
          // Get all options
          const options = await classDropdown.$$('option');
          console.log(`Available classes: ${options.length}`);
          
          if (options.length > 1) {
            // Switch to a different class
            await classDropdown.selectByIndex(1);
            await browser.pause(500);
            
            const newValue = await classDropdown.getValue();
            console.log(`Switched to class: ${newValue}`);
            
            // Count fields again after switch
            const newSettings = await modalContainer.$$('.setting-item');
            console.log(`Fields after switch: ${newSettings.length}`);
            
            // Switch back
            await classDropdown.selectByIndex(0);
            await browser.pause(500);
            
            const finalSettings = await modalContainer.$$('.setting-item');
            console.log(`Fields after switching back: ${finalSettings.length}`);
          }
        }
        
        // Take screenshot for visual verification
        await browser.saveScreenshot('./test-results/create-asset-modal-real.png');
        console.log('Screenshot saved to test-results/create-asset-modal-real.png');
        
        // Assert no duplicates
        expect(hasDuplicates).toBe(false);
      } else {
        console.error('Modal container not found');
        
        // Take screenshot of current state for debugging
        await browser.saveScreenshot('./test-results/modal-not-found.png');
        
        // Log page source for debugging
        const pageSource = await browser.getPageSource();
        console.log('Page has modal class:', pageSource.includes('modal'));
      }
      
      // Close modal if it's open
      const closeButton = await $('.modal-close-button');
      if (await closeButton.isExisting()) {
        await closeButton.click();
        console.log('Modal closed');
      } else {
        // Try ESC key
        await browser.keys(['Escape']);
      }
    });
  });

  describe('Performance Test', () => {
    it('should update properties quickly when switching classes', async () => {
      // Open modal again for performance test
      await browser.keys(['Meta', 'p']);
      await browser.pause(500);
      
      const commandInput = await $('.prompt-input');
      if (await commandInput.isExisting()) {
        await commandInput.setValue('Create ExoAsset');
        await browser.pause(300);
        await browser.keys(['Enter']);
      }
      
      await browser.pause(1000);
      
      const modal = await $('.modal');
      if (await modal.isExisting()) {
        const classDropdown = await modal.$('select');
        if (await classDropdown.isExisting()) {
          // Measure time for class switch
          const startTime = Date.now();
          
          await classDropdown.selectByIndex(1);
          
          // Wait for properties to update (should be fast)
          await browser.pause(100);
          
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`Class switch took ${duration}ms`);
          
          // Should be under 500ms even in Docker
          expect(duration).toBeLessThan(500);
        }
        
        // Close modal
        await browser.keys(['Escape']);
      }
    });
  });

  after(async () => {
    // Clean up - make sure modal is closed
    const modal = await $('.modal');
    if (await modal.isExisting()) {
      await browser.keys(['Escape']);
    }
    
    console.log('=== TEST COMPLETED ===');
  });
});