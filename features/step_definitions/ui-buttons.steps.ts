import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ExocortexPlugin } from '../../main';

let plugin: ExocortexPlugin;
let viewContainer: HTMLElement;
let buttonElement: HTMLElement;
let actionResult: any;
let modalElement: HTMLElement;

Before(async function() {
    this.testVault = await createTestVault();
    this.plugin = await loadPlugin(this.testVault);
    plugin = this.plugin;
    
    // Create view container
    viewContainer = document.createElement('div');
    viewContainer.className = 'exocortex-view-container';
    document.body.appendChild(viewContainer);
});

After(async function() {
    document.body.innerHTML = '';
    await this.testVault.cleanup();
});

// Scenario: Create action button in view
Given('I have a view with ExoAction metadata', async function() {
    // Set up a view with action metadata
    const metadata = {
        'exo__Action_type': 'button',
        'exo__Action_label': 'Click Me',
        'exo__Action_command': 'createAsset',
        'exo__Action_class': 'ems__Task'
    };
    
    await plugin.renderViewWithMetadata(viewContainer, metadata);
});

When('the view renders', async function() {
    // Wait for render to complete
    await new Promise(resolve => setTimeout(resolve, 50));
});

Then('I should see an action button with label {string}', async function(label: string) {
    buttonElement = viewContainer.querySelector('.exocortex-action-button');
    expect(buttonElement).toBeDefined();
    expect(buttonElement.textContent).toBe(label);
});

When('I click the action button', async function() {
    buttonElement = viewContainer.querySelector('.exocortex-action-button');
    buttonElement.click();
    
    // Wait for action to process
    await new Promise(resolve => setTimeout(resolve, 100));
});

Then('the {string} command should be executed', async function(command: string) {
    // Verify command was executed
    const lastCommand = plugin.getLastExecutedCommand();
    expect(lastCommand).toBe(command);
});

Then('a new asset modal should open for class {string}', async function(className: string) {
    modalElement = document.querySelector('.modal.exocortex-asset-modal');
    expect(modalElement).toBeDefined();
    
    const classInput = modalElement.querySelector('[data-field="class"]');
    expect(classInput?.value).toBe(className);
});

// Scenario: Multiple buttons with different actions
Given('I have a view with multiple action buttons', async function(dataTable: any) {
    const actions = dataTable.hashes();
    const metadata: any = {};
    
    actions.forEach((action: any, index: number) => {
        metadata[`exo__Action_${index}_type`] = 'button';
        metadata[`exo__Action_${index}_label`] = action.Label;
        metadata[`exo__Action_${index}_command`] = action.Command;
        metadata[`exo__Action_${index}_params`] = action.Params;
    });
    
    await plugin.renderViewWithMetadata(viewContainer, metadata);
});

Then('I should see {int} action buttons', async function(count: number) {
    const buttons = viewContainer.querySelectorAll('.exocortex-action-button');
    expect(buttons.length).toBe(count);
});

When('I click the button labeled {string}', async function(label: string) {
    const buttons = viewContainer.querySelectorAll('.exocortex-action-button');
    
    for (const button of buttons) {
        if (button.textContent === label) {
            (button as HTMLElement).click();
            break;
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
});

Then('the command {string} should execute with params {string}', async function(command: string, params: string) {
    const lastCommand = plugin.getLastExecutedCommand();
    const lastParams = plugin.getLastCommandParams();
    
    expect(lastCommand).toBe(command);
    expect(lastParams).toBe(params);
});

// Scenario: Button styling and states
Given('I have a button with custom styling', async function(dataTable: any) {
    const styles = dataTable.rowsHash();
    const metadata = {
        'exo__Action_type': 'button',
        'exo__Action_label': 'Styled Button',
        'exo__Action_style': styles.style,
        'exo__Action_variant': styles.variant,
        'exo__Action_icon': styles.icon
    };
    
    await plugin.renderViewWithMetadata(viewContainer, metadata);
});

Then('the button should have class {string}', async function(className: string) {
    buttonElement = viewContainer.querySelector('.exocortex-action-button');
    expect(buttonElement.classList.contains(className)).toBe(true);
});

Then('the button should display icon {string}', async function(iconName: string) {
    const icon = buttonElement.querySelector('.exocortex-icon');
    expect(icon).toBeDefined();
    expect(icon.dataset.icon).toBe(iconName);
});

// Scenario: Button with confirmation
Given('I have a button that requires confirmation', async function() {
    const metadata = {
        'exo__Action_type': 'button',
        'exo__Action_label': 'Delete',
        'exo__Action_command': 'deleteAsset',
        'exo__Action_confirm': 'true',
        'exo__Action_confirmMessage': 'Are you sure you want to delete this asset?'
    };
    
    await plugin.renderViewWithMetadata(viewContainer, metadata);
});

When('I click the delete button', async function() {
    buttonElement = viewContainer.querySelector('.exocortex-action-button');
    buttonElement.click();
});

Then('I should see a confirmation dialog', async function() {
    const confirmDialog = document.querySelector('.exocortex-confirm-dialog');
    expect(confirmDialog).toBeDefined();
});

Then('the dialog should show message {string}', async function(message: string) {
    const confirmDialog = document.querySelector('.exocortex-confirm-dialog');
    const messageElement = confirmDialog.querySelector('.confirm-message');
    expect(messageElement.textContent).toBe(message);
});

When('I click {string} in the confirmation dialog', async function(buttonText: string) {
    const confirmDialog = document.querySelector('.exocortex-confirm-dialog');
    const buttons = confirmDialog.querySelectorAll('button');
    
    for (const button of buttons) {
        if (button.textContent === buttonText) {
            (button as HTMLElement).click();
            break;
        }
    }
});

Then('the command should be executed', async function() {
    await new Promise(resolve => setTimeout(resolve, 100));
    const lastCommand = plugin.getLastExecutedCommand();
    expect(lastCommand).toBe('deleteAsset');
});

Then('the command should not be executed', async function() {
    const lastCommand = plugin.getLastExecutedCommand();
    expect(lastCommand).not.toBe('deleteAsset');
});

// Scenario: Disabled button
Given('I have a disabled action button', async function() {
    const metadata = {
        'exo__Action_type': 'button',
        'exo__Action_label': 'Disabled Button',
        'exo__Action_command': 'someCommand',
        'exo__Action_disabled': 'true',
        'exo__Action_disabledReason': 'Feature not available'
    };
    
    await plugin.renderViewWithMetadata(viewContainer, metadata);
});

Then('the button should be disabled', async function() {
    buttonElement = viewContainer.querySelector('.exocortex-action-button');
    expect(buttonElement.disabled).toBe(true);
});

When('I hover over the disabled button', async function() {
    const event = new MouseEvent('mouseenter', { bubbles: true });
    buttonElement.dispatchEvent(event);
});

Then('I should see a tooltip with {string}', async function(tooltipText: string) {
    const tooltip = document.querySelector('.exocortex-tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toBe(tooltipText);
});

When('I try to click the disabled button', async function() {
    buttonElement.click();
});

Then('nothing should happen', async function() {
    const lastCommand = plugin.getLastExecutedCommand();
    expect(lastCommand).toBeNull();
});

// Scenario: Button with dynamic visibility
Given('I have a button with conditional visibility', async function() {
    const metadata = {
        'exo__Action_type': 'button',
        'exo__Action_label': 'Conditional Button',
        'exo__Action_command': 'conditionalCommand',
        'exo__Action_showWhen': 'hasPermission',
        'exo__User_permissions': ['read', 'write']
    };
    
    await plugin.renderViewWithMetadata(viewContainer, metadata);
});

Then('the button should be visible when condition is met', async function() {
    buttonElement = viewContainer.querySelector('.exocortex-action-button');
    expect(buttonElement).toBeDefined();
    expect(buttonElement.style.display).not.toBe('none');
});

When('the condition changes to false', async function() {
    await plugin.updatePermissions([]);
    await plugin.refreshView(viewContainer);
});

Then('the button should be hidden', async function() {
    buttonElement = viewContainer.querySelector('.exocortex-action-button');
    expect(buttonElement).toBeNull();
});

// Helper functions
async function createTestVault() {
    return {
        cleanup: async () => {}
    };
}

async function loadPlugin(vault: any) {
    let lastCommand: string | null = null;
    let lastParams: any = null;
    
    return {
        renderViewWithMetadata: async (container: HTMLElement, metadata: any) => {
            // Mock render implementation
            Object.keys(metadata).forEach(key => {
                if (key.includes('Action') && metadata[key + '_type'] === 'button') {
                    const button = document.createElement('button');
                    button.className = 'exocortex-action-button';
                    button.textContent = metadata[key + '_label'];
                    
                    if (metadata[key + '_disabled'] === 'true') {
                        button.disabled = true;
                    }
                    
                    button.onclick = () => {
                        lastCommand = metadata[key + '_command'];
                        lastParams = metadata[key + '_params'];
                    };
                    
                    container.appendChild(button);
                }
            });
        },
        
        getLastExecutedCommand: () => lastCommand,
        getLastCommandParams: () => lastParams,
        
        updatePermissions: async (permissions: string[]) => {
            // Mock permission update
        },
        
        refreshView: async (container: HTMLElement) => {
            // Mock view refresh
        }
    };
}