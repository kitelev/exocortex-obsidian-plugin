import { expect } from '@wdio/globals';
import { ObsidianApp } from '../pageobjects/obsidian-app.page';
import { CreateAssetModal } from '../pageobjects/create-asset-modal.page';

/**
 * UI Test to detect field duplication in CreateAssetModal
 * This test verifies that core properties are not duplicated
 * and that class-specific properties appear correctly
 */
describe('CreateAssetModal Field Duplication Bug', () => {
  let app: ObsidianApp;
  let modal: CreateAssetModal;

  before(async () => {
    app = new ObsidianApp();
    await app.open();
    await app.waitForLoad();
  });

  describe('Field Duplication Detection', () => {
    it('should NOT show duplicate Instance Class fields', async () => {
      // Open the create asset modal
      await app.executeCommand('exocortex:create-asset');
      modal = new CreateAssetModal();
      await modal.waitForDisplay();

      // Wait for properties to load
      await browser.pause(500);

      // Find all elements with "Instance Class" label
      const instanceClassLabels = await $$('//div[contains(@class, "setting-item")]//div[contains(text(), "Instance Class")]');
      
      // There should be at most 1 Instance Class field (or 0 if it's auto-managed)
      expect(instanceClassLabels.length).toBeLessThanOrEqual(1);
      
      if (instanceClassLabels.length > 1) {
        console.error(`DUPLICATION DETECTED: Found ${instanceClassLabels.length} Instance Class fields`);
        
        // Log details about each duplicate
        for (let i = 0; i < instanceClassLabels.length; i++) {
          const parent = await instanceClassLabels[i].parentElement();
          const parentClass = await parent.getAttribute('class');
          console.error(`  Instance Class field ${i + 1} parent class: ${parentClass}`);
        }
      }
    });

    it('should NOT show core properties as editable fields', async () => {
      // Core properties that should NOT appear as user-editable fields
      const coreProperties = [
        'Unique ID',
        'Defined By',
        'Instance Class'
      ];

      // Check Properties section for core properties
      const propertiesSection = await $('//h3[text()="Properties"]/following-sibling::div[@class="exocortex-properties-container"]');
      
      if (await propertiesSection.isExisting()) {
        for (const coreProp of coreProperties) {
          // Look for core properties within the properties container
          const coreField = await propertiesSection.$(`//div[contains(@class, "setting-item")]//div[contains(text(), "${coreProp}")]`);
          
          if (await coreField.isExisting()) {
            console.error(`CORE PROPERTY LEAK: "${coreProp}" should not appear in Properties section`);
          }
          
          // Core properties should NOT be in the Properties section
          expect(await coreField.isExisting()).toBe(false);
        }
      }
    });

    it('should show class-specific properties when switching classes', async () => {
      // Select a specific class (e.g., ems__Effort)
      const classDropdown = await modal.getClassDropdown();
      await classDropdown.click();
      
      // Select ems__Effort if available
      const effortOption = await $('//option[contains(text(), "Effort")]');
      if (await effortOption.isExisting()) {
        await effortOption.click();
        
        // Wait for properties to update
        await browser.pause(500);
        
        // Check that properties section exists and has content
        const propertiesContainer = await $('.exocortex-properties-container');
        expect(await propertiesContainer.isExisting()).toBe(true);
        
        // Get all property fields
        const propertyFields = await propertiesContainer.$$('.setting-item');
        
        // Log what we found
        console.log(`Found ${propertyFields.length} property fields for ems__Effort`);
        
        // Should have some properties (not just core properties)
        if (propertyFields.length === 0) {
          console.error('NO PROPERTIES FOUND: Class-specific properties are not loading');
        }
      }
    });

    it('should properly update properties when switching between classes', async () => {
      // Get initial class
      const classDropdown = await modal.getClassDropdown();
      const initialClass = await classDropdown.getValue();
      
      // Count initial properties
      const initialContainer = await $('.exocortex-properties-container');
      const initialFields = await initialContainer.$$('.setting-item');
      const initialCount = initialFields.length;
      
      console.log(`Initial class "${initialClass}" has ${initialCount} properties`);
      
      // Switch to a different class
      await classDropdown.click();
      const options = await $$('option');
      
      // Find a different class to switch to
      for (const option of options) {
        const optionText = await option.getText();
        if (optionText !== initialClass) {
          await option.click();
          break;
        }
      }
      
      // Wait for properties to update
      await browser.pause(500);
      
      // Count new properties
      const newContainer = await $('.exocortex-properties-container');
      const newFields = await newContainer.$$('.setting-item');
      const newCount = newFields.length;
      
      const newClass = await classDropdown.getValue();
      console.log(`New class "${newClass}" has ${newCount} properties`);
      
      // Properties should have changed (unless both classes have same properties)
      if (initialClass !== newClass && initialCount === newCount && initialCount > 0) {
        console.warn('POSSIBLE BUG: Property count unchanged after class switch');
      }
    });

    it('should not have any duplicate field IDs or data-test attributes', async () => {
      // Get all fields with data-test attributes
      const allFields = await $$('[data-test^="property-"]');
      const fieldIds = [];
      
      for (const field of allFields) {
        const dataTest = await field.getAttribute('data-test');
        if (fieldIds.includes(dataTest)) {
          console.error(`DUPLICATE FIELD ID: "${dataTest}" appears multiple times`);
          expect(fieldIds.includes(dataTest)).toBe(false);
        }
        fieldIds.push(dataTest);
      }
      
      console.log(`Checked ${fieldIds.length} fields for duplicates`);
    });
  });

  describe('Visual Verification', () => {
    it('should display a clean modal without visual duplication', async () => {
      // Take a screenshot for manual verification
      await browser.saveScreenshot('./test-results/create-asset-modal-duplication.png');
      
      // Check modal structure
      const modalContent = await $('.modal-content');
      expect(await modalContent.isExisting()).toBe(true);
      
      // Verify sections are in correct order
      const title = await $('h2=Create ExoAsset');
      const titleSection = await $('//div[contains(@class, "setting-item")]//div[text()="Title"]');
      const classSection = await $('//div[contains(@class, "setting-item")]//div[text()="Class"]');
      const ontologySection = await $('//div[contains(@class, "setting-item")]//div[text()="Ontology"]');
      const propertiesHeader = await $('h3=Properties');
      
      expect(await title.isExisting()).toBe(true);
      expect(await titleSection.isExisting()).toBe(true);
      expect(await classSection.isExisting()).toBe(true);
      expect(await ontologySection.isExisting()).toBe(true);
      expect(await propertiesHeader.isExisting()).toBe(true);
    });
  });

  after(async () => {
    // Close modal if still open
    const closeButton = await $('.modal-close-button');
    if (await closeButton.isExisting()) {
      await closeButton.click();
    }
  });
});