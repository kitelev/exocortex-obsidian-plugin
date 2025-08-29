import { $ } from '@wdio/globals';

/**
 * Page object for CreateAssetModal
 * Provides methods to interact with the asset creation modal
 */
export class CreateAssetModal {
  /**
   * Define selectors for modal elements
   */
  get modal() {
    return $('.modal');
  }

  get titleInput() {
    return $('[data-test="asset-title-input"]');
  }

  get classDropdown() {
    return $('[data-test="asset-class-dropdown"]');
  }

  get ontologyDropdown() {
    return $('select[data-test="asset-ontology-dropdown"]');
  }

  get propertiesContainer() {
    return $('[data-test="properties-container"]');
  }

  get createButton() {
    return $('[data-test="create-asset-button"]');
  }

  get modalTitle() {
    return $('h2=Create ExoAsset');
  }

  /**
   * Wait for modal to be displayed
   */
  async waitForDisplay() {
    await this.modal.waitForDisplayed({ timeout: 5000 });
    await this.modalTitle.waitForDisplayed({ timeout: 2000 });
  }

  /**
   * Get title input
   */
  async getTitleInput() {
    return this.titleInput;
  }

  /**
   * Get class dropdown
   */
  async getClassDropdown() {
    return this.classDropdown;
  }

  /**
   * Set asset title
   */
  async setTitle(title: string) {
    const input = await this.titleInput;
    await input.setValue(title);
  }

  /**
   * Select a class from dropdown
   */
  async selectClass(className: string) {
    const dropdown = await this.classDropdown;
    await dropdown.click();
    const option = await $(`option=${className}`);
    await option.click();
  }

  /**
   * Get all property fields
   */
  async getPropertyFields() {
    const container = await this.propertiesContainer;
    if (await container.isExisting()) {
      return container.$$('.setting-item');
    }
    return [];
  }

  /**
   * Check if a property field exists
   */
  async hasPropertyField(propertyName: string) {
    const container = await this.propertiesContainer;
    if (await container.isExisting()) {
      const field = await container.$(`[data-test="property-${propertyName}"]`);
      return field.isExisting();
    }
    return false;
  }

  /**
   * Click create button
   */
  async clickCreate() {
    const button = await this.createButton;
    await button.click();
  }

  /**
   * Close modal
   */
  async close() {
    const closeButton = await $('.modal-close-button');
    if (await closeButton.isExisting()) {
      await closeButton.click();
    }
  }
}