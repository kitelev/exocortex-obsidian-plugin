import { WorkspacePage } from './WorkspacePage';

/**
 * Page Object for CreateAssetModal testing
 * Uses browser.executeObsidian for direct plugin access
 */
export class CreateAssetModalPage extends WorkspacePage {
  // Extended selectors specific to CreateAssetModal
  private createAssetSelectors = {
    modal: '.exocortex-create-asset-modal',
    modalTitle: '.exocortex-modal-title',
    classSelector: '.exocortex-class-selector',
    classOptions: '.exocortex-class-option',
    selectedClass: '.exocortex-selected-class',
    propertyField: '.exocortex-property-field',
    propertyLabel: '.exocortex-property-label',
    propertyInput: '.exocortex-property-input',
    propertyType: '.exocortex-property-type',
    dynamicProperties: '.exocortex-dynamic-properties',
    submitButton: '.exocortex-submit-button',
    cancelButton: '.exocortex-cancel-button',
    loadingSpinner: '.exocortex-modal-loading',
    errorMessage: '.exocortex-modal-error',
    successMessage: '.exocortex-modal-success'
  };

  /**
   * Open the Create Asset Modal
   */
  async openCreateAssetModal(): Promise<void> {
    await browser.executeObsidian(({app}) => {
      const plugin = app.plugins.plugins["exocortex-obsidian-plugin"];
      if (plugin && plugin.openCreateAssetModal) {
        return plugin.openCreateAssetModal();
      } else {
        return app.commands.executeCommandById("exocortex:create-asset");
      }
    });
    await this.waitForModalToOpen();
  }

  /**
   * Wait for the modal to open and be ready for interaction
   */
  async waitForModalToOpen(): Promise<WebdriverIO.Element> {
    const modal = await this.waitForElement(this.createAssetSelectors.modal, 10000);
    
    // Wait for class selector to be available
    await this.waitForElement(this.createAssetSelectors.classSelector, 5000);
    
    return modal;
  }

  /**
   * Get available class options
   */
  async getAvailableClasses(): Promise<string[]> {
    return await browser.executeObsidian(
      () => Array.from(document.querySelectorAll(".exocortex-class-option")).map(el => el.textContent?.trim() || "")
    ) || [];
  }

  /**
   * Select a class from the dropdown
   */
  async selectClass(className: string): Promise<void> {
    // Use direct DOM interaction via executeObsidian
    await browser.executeObsidian((_, className) => {
      const option = Array.from(document.querySelectorAll('.exocortex-class-option'))
        .find(el => el.textContent?.trim() === className);
      if (option) (option as HTMLElement).click();
    }, className);
    
    await this.waitForPropertiesToUpdate();
  }

  /**
   * Wait for property fields to update after class selection
   */
  async waitForPropertiesToUpdate(): Promise<void> {
    // Simple pause to allow DOM updates
    await browser.pause(1000);
    
    // Wait for property fields to be present
    await browser.waitUntil(
      async () => {
        const fieldCount = await browser.executeObsidian(
          () => document.querySelectorAll(".exocortex-property-field").length
        );
        return fieldCount > 0;
      },
      {
        timeout: 5000,
        timeoutMsg: 'Property fields failed to render'
      }
    );
  }

  /**
   * Get currently visible property fields
   */
  async getPropertyFields(): Promise<any[]> {
    return await browser.executeObsidian(() => {
      return Array.from(document.querySelectorAll('.exocortex-property-field')).map(field => {
        const label = field.querySelector('.exocortex-property-label')?.textContent?.trim() || '';
        const input = field.querySelector('.exocortex-property-input') as HTMLInputElement;
        return {
          label,
          value: input?.value || '',
          inputType: input?.type || 'text',
          propertyType: field.getAttribute('data-property-type') || '',
          isRequired: input?.hasAttribute('required') || false
        };
      });
    }) || [];
  }

  /**
   * Fill property field by label
   */
  async fillPropertyField(label: string, value: string): Promise<void> {
    const success = await browser.executeObsidian((_, label, value) => {
      const field = Array.from(document.querySelectorAll('.exocortex-property-field'))
        .find(f => f.querySelector('.exocortex-property-label')?.textContent?.trim() === label);
      if (field) {
        const input = field.querySelector('.exocortex-property-input') as HTMLInputElement;
        if (input) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, label, value);
    
    if (!success) {
      throw new Error(`Property field with label "${label}" not found`);
    }
  }

  /**
   * Get currently selected class
   */
  async getSelectedClass(): Promise<string | null> {
    return await browser.executeObsidian(
      () => document.querySelector(".exocortex-selected-class")?.textContent?.trim() || null
    );
  }

  /**
   * Submit the form
   */
  async submitForm(): Promise<void> {
    await browser.executeObsidian(
      () => {
        const button = document.querySelector(".exocortex-submit-button") as HTMLElement;
        button?.click();
      }
    );
  }

  /**
   * Cancel the modal
   */
  async cancelModal(): Promise<void> {
    const cancelButton = await $(this.createAssetSelectors.cancelButton);
    await cancelButton.click();
    
    // Wait for modal to close
    await browser.waitUntil(
      async () => {
        const modal = await $(this.createAssetSelectors.modal);
        return !(await modal.isDisplayed());
      },
      {
        timeout: 5000,
        timeoutMsg: 'Modal failed to close after cancel'
      }
    );
  }

  /**
   * Check if modal has validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    const errorMessages = await $$(this.createAssetSelectors.errorMessage);
    
    for (const error of errorMessages) {
      if (await error.isDisplayed()) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errorMessages = await $$(this.createAssetSelectors.errorMessage);
    const errors = [];

    for (const error of errorMessages) {
      if (await error.isDisplayed()) {
        const errorText = await error.getText();
        errors.push(errorText.trim());
      }
    }

    return errors;
  }

  /**
   * Check if form submission was successful
   */
  async isSubmissionSuccessful(): Promise<boolean> {
    try {
      const successMessage = await $(this.createAssetSelectors.successMessage);
      return await successMessage.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for form submission to complete
   */
  async waitForSubmissionComplete(): Promise<boolean> {
    try {
      // Wait for either success message or modal to close
      await browser.waitUntil(
        async () => {
          const successMessage = await $(this.createAssetSelectors.successMessage);
          const modal = await $(this.createAssetSelectors.modal);
          
          return (await successMessage.isDisplayed()) || !(await modal.isDisplayed());
        },
        {
          timeout: 10000,
          timeoutMsg: 'Form submission did not complete within timeout'
        }
      );
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test core dynamic form functionality
   */
  async testDynamicFormExpansion(classNames: string[]): Promise<any> {
    const results = {};

    for (const className of classNames.slice(0, 3)) { // Limit to 3 classes for stability
      console.log(`Testing dynamic form expansion for class: ${className}`);
      
      await this.selectClass(className);
      const properties = await this.getPropertyFields();
      
      results[className] = {
        propertyCount: properties.length,
        hasProperties: properties.length > 0,
        mainProperties: properties.slice(0, 3).map(p => p.label) // First 3 properties
      };
      
      await browser.pause(500);
    }

    return results;
  }

  /**
   * Verify property field updates are working correctly
   */
  async verifyPropertyFieldUpdates(className: string, expectedProperties: string[]): Promise<boolean> {
    await this.selectClass(className);
    const actualProperties = await this.getPropertyFields();
    const actualPropertyLabels = actualProperties.map(p => p.label);

    // Check if all expected properties are present
    for (const expectedProp of expectedProperties) {
      if (!actualPropertyLabels.includes(expectedProp)) {
        console.log(`Missing expected property: ${expectedProp} for class: ${className}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Fill out complete form for testing
   */
  async fillCompleteForm(className: string, propertyValues: Record<string, string>): Promise<void> {
    // Select class
    await this.selectClass(className);
    
    // Fill property fields
    for (const [label, value] of Object.entries(propertyValues)) {
      await this.fillPropertyField(label, value);
    }
  }

  /**
   * Test complete workflow: open, select class, fill form, submit
   */
  async testCompleteWorkflow(className: string, propertyValues: Record<string, string>): Promise<boolean> {
    try {
      // Open modal
      await this.openCreateAssetModal();
      
      // Fill the form
      await this.fillCompleteForm(className, propertyValues);
      
      // Submit
      await this.submitForm();
      
      // Wait for completion
      return await this.waitForSubmissionComplete();
      
    } catch (error) {
      console.error('Complete workflow test failed:', error);
      return false;
    }
  }

  /**
   * Get modal state for debugging
   */
  async getModalState(): Promise<any> {
    const isModalVisible = await (await $(this.createAssetSelectors.modal)).isDisplayed();
    const selectedClass = await this.getSelectedClass();
    const propertyFields = await this.getPropertyFields();
    const hasErrors = await this.hasValidationErrors();
    const errors = hasErrors ? await this.getValidationErrors() : [];

    return {
      isVisible: isModalVisible,
      selectedClass,
      propertyFieldCount: propertyFields.length,
      propertyFields,
      hasErrors,
      errors
    };
  }
}