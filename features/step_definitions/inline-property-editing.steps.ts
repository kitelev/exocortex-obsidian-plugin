import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ExocortexPlugin } from '../../main';
import { Asset } from '../../src/domain/entities/Asset';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { OntologyPrefix } from '../../src/domain/value-objects/OntologyPrefix';

let plugin: ExocortexPlugin;
let currentAsset: Asset;
let propertyElement: HTMLElement;
let originalValue: string;
let notificationElement: HTMLElement;

Before(async function() {
    // Setup test environment
    this.testVault = await createTestVault();
    this.plugin = await loadPlugin(this.testVault);
    plugin = this.plugin;
});

After(async function() {
    // Cleanup
    await this.testVault.cleanup();
});

// Background steps
Given('I have an asset with properties displayed in a view', async function() {
    // Create a test asset with properties
    const assetResult = Asset.create({
        id: AssetId.generate(),
        label: 'Test Asset',
        className: ClassName.create('ems__Task').getValue()!,
        ontology: OntologyPrefix.create('ems').getValue()!,
        properties: {
            'ems__Task_status': 'todo',
            'ems__Task_priority': 'high',
            'ems__Task_assignee': 'John Doe'
        }
    });
    
    currentAsset = assetResult.getValue()!;
    
    // Render the asset view
    const container = document.createElement('div');
    await plugin.renderAssetView(container, currentAsset);
    
    // Verify properties are displayed
    const properties = container.querySelectorAll('.exocortex-property');
    expect(properties.length).toBeGreaterThan(0);
});

// Scenario: Edit text property inline
When('I click on the value of {string} property', async function(propertyKey: string) {
    propertyElement = document.querySelector(`[data-property-key="${propertyKey}"] .exocortex-property-value`);
    expect(propertyElement).toBeDefined();
    
    originalValue = propertyElement.textContent || '';
    propertyElement.click();
});

Then('the value should become editable', async function() {
    expect(propertyElement.contentEditable).toBe('true');
    expect(propertyElement.classList.contains('is-editing')).toBe(true);
});

When('I change the value to {string}', async function(newValue: string) {
    propertyElement.textContent = newValue;
    // Trigger input event
    const event = new Event('input', { bubbles: true });
    propertyElement.dispatchEvent(event);
});

When('I press Enter', async function() {
    const event = new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true 
    });
    propertyElement.dispatchEvent(event);
});

Then('the property value should be saved', async function() {
    // Wait for save operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check that contentEditable is removed
    expect(propertyElement.contentEditable).toBe('false');
    
    // Verify value in asset
    const propertyKey = propertyElement.parentElement?.dataset.propertyKey;
    const savedValue = currentAsset.getProperty(propertyKey);
    expect(savedValue).toBe(propertyElement.textContent);
});

Then('I should see a success notification', async function() {
    notificationElement = document.querySelector('.notice.mod-success');
    expect(notificationElement).toBeDefined();
    expect(notificationElement.textContent).toContain('Property updated');
});

// Scenario: Edit object property with dropdown
Given('I have an asset with object property {string}', async function(propertyKey: string) {
    // Ensure the asset has the object property
    currentAsset.setProperty(propertyKey, '[[John Doe]]');
});

When('I click on the object property value', async function() {
    propertyElement = document.querySelector('[data-property-type="object"] .exocortex-property-value');
    expect(propertyElement).toBeDefined();
    propertyElement.click();
});

Then('a dropdown should appear with available options', async function() {
    const dropdown = document.querySelector('.exocortex-property-dropdown');
    expect(dropdown).toBeDefined();
    expect(dropdown.style.display).not.toBe('none');
    
    const options = dropdown.querySelectorAll('.dropdown-option');
    expect(options.length).toBeGreaterThan(0);
});

When('I select {string} from the dropdown', async function(optionValue: string) {
    const dropdown = document.querySelector('.exocortex-property-dropdown');
    const options = dropdown.querySelectorAll('.dropdown-option');
    
    for (const option of options) {
        if (option.textContent === optionValue) {
            (option as HTMLElement).click();
            break;
        }
    }
});

Then('the object property value should update to {string}', async function(expectedValue: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(propertyElement.textContent).toBe(expectedValue);
});

// Scenario: Cancel editing with Escape
When('I press Escape', async function() {
    const event = new KeyboardEvent('keydown', { 
        key: 'Escape',
        bubbles: true 
    });
    propertyElement.dispatchEvent(event);
});

Then('the editing should be cancelled', async function() {
    expect(propertyElement.contentEditable).toBe('false');
    expect(propertyElement.classList.contains('is-editing')).toBe(false);
});

Then('the original value {string} should be restored', async function(originalValue: string) {
    expect(propertyElement.textContent).toBe(originalValue);
});

// Scenario: Validation error for invalid input
When('I enter an invalid value {string}', async function(invalidValue: string) {
    propertyElement.textContent = invalidValue;
    const event = new Event('input', { bubbles: true });
    propertyElement.dispatchEvent(event);
});

Then('I should see a validation error message', async function() {
    const errorElement = document.querySelector('.exocortex-property-error');
    expect(errorElement).toBeDefined();
    expect(errorElement.textContent).toContain('Invalid');
});

Then('the save should be prevented', async function() {
    // Try to save
    const event = new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true 
    });
    propertyElement.dispatchEvent(event);
    
    // Should still be in edit mode
    expect(propertyElement.contentEditable).toBe('true');
});

// Scenario: Handle empty value
When('I clear the value completely', async function() {
    propertyElement.textContent = '';
    const event = new Event('input', { bubbles: true });
    propertyElement.dispatchEvent(event);
});

Then('the property value should be set to empty', async function() {
    await new Promise(resolve => setTimeout(resolve, 100));
    const propertyKey = propertyElement.parentElement?.dataset.propertyKey;
    const savedValue = currentAsset.getProperty(propertyKey);
    expect(savedValue).toBe('');
});

// Scenario: Multiple properties edit
When('I edit multiple properties in sequence', async function(dataTable: any) {
    const edits = dataTable.hashes();
    
    for (const edit of edits) {
        const element = document.querySelector(`[data-property-key="${edit.Property}"] .exocortex-property-value`);
        element.click();
        element.textContent = edit['New Value'];
        
        const enterEvent = new KeyboardEvent('keydown', { 
            key: 'Enter',
            bubbles: true 
        });
        element.dispatchEvent(enterEvent);
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
});

Then('all properties should be updated correctly', async function(dataTable: any) {
    const expected = dataTable.hashes();
    
    for (const item of expected) {
        const value = currentAsset.getProperty(item.Property);
        expect(value).toBe(item.Value);
    }
});

// Helper functions
async function createTestVault() {
    return {
        cleanup: async () => {
            // Clean up DOM elements
            document.body.innerHTML = '';
        }
    };
}

async function loadPlugin(vault: any) {
    return {
        renderAssetView: async (container: HTMLElement, asset: Asset) => {
            // Mock render implementation
            const properties = asset.getProperties();
            properties.forEach((value, key) => {
                const propEl = document.createElement('div');
                propEl.className = 'exocortex-property';
                propEl.dataset.propertyKey = key;
                
                const valueEl = document.createElement('span');
                valueEl.className = 'exocortex-property-value';
                valueEl.textContent = value;
                
                propEl.appendChild(valueEl);
                container.appendChild(propEl);
            });
        }
    };
}