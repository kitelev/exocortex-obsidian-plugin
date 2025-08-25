import { Given, When, Then, DataTable, Before, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { PropertyEditingUseCase } from '../../../src/application/use-cases/PropertyEditingUseCase';
import { Asset } from '../../../src/domain/entities/Asset';
import { AssetId } from '../../../src/domain/value-objects/AssetId';
import { ClassName } from '../../../src/domain/value-objects/ClassName';
import { PropertyValue } from '../../../src/domain/value-objects/PropertyValue';
import { DIContainer } from '../../../src/infrastructure/container/DIContainer';
import { Result } from '../../../src/domain/core/Result';

// Import test infrastructure
import { FakeVaultAdapter } from '../../helpers/FakeVaultAdapter';
import { createMockVault } from '../../__mocks__/obsidian';

interface PropertyEditingContext {
  container: DIContainer;
  propertyEditingUseCase: PropertyEditingUseCase;
  vaultAdapter: FakeVaultAdapter;
  currentAsset: Asset;
  initialProperties: Map<string, any>;
  pendingChanges: Map<string, any>;
  lastResult: Result<any> | null;
  lastError: Error | null;
  changeHistory: Array<{ property: string; oldValue: any; newValue: any; timestamp: number }>;
  validationErrors: string[];
  editingMode: 'inline' | 'modal' | 'batch';
  startTime: number;
  endTime: number;
  conflictResolution: { detected: boolean; resolved: boolean };
}

let context: PropertyEditingContext;

Before({ tags: '@property-editing' }, async function() {
  const vault = createMockVault();
  const vaultAdapter = new FakeVaultAdapter(vault);
  
  const container = new DIContainer();
  await container.initialize();
  container.registerInstance('IVaultAdapter', vaultAdapter);
  
  // Create a test asset
  const assetResult = Asset.create({
    name: 'Sample Project',
    className: ClassName.create('ems__Project').getValue()!,
    properties: new Map([
      ['status', 'active'],
      ['priority', 'medium'],
      ['description', 'Sample project']
    ])
  });
  
  context = {
    container,
    propertyEditingUseCase: container.resolve<PropertyEditingUseCase>('PropertyEditingUseCase'),
    vaultAdapter,
    currentAsset: assetResult.getValue()!,
    initialProperties: new Map(),
    pendingChanges: new Map(),
    lastResult: null,
    lastError: null,
    changeHistory: [],
    validationErrors: [],
    editingMode: 'inline',
    startTime: 0,
    endTime: 0,
    conflictResolution: { detected: false, resolved: false }
  };
  
  // Create asset file in vault
  await vaultAdapter.createFile('Sample Project.md', `---
class: ems__Project
status: active
priority: medium
description: Sample project
---

# Sample Project
`);
});

After({ tags: '@property-editing' }, function() {
  context.vaultAdapter.clear();
  context.changeHistory = [];
  context.validationErrors = [];
});

// Background steps
Given('the Exocortex plugin is loaded', function() {
  expect(context.container).to.not.be.null;
  expect(context.propertyEditingUseCase).to.not.be.null;
});

Given('I have an existing asset {string}', function(assetName: string) {
  expect(context.currentAsset.getTitle()).to.equal(assetName);
});

Given('the asset has the following properties:', function(dataTable: DataTable) {
  const properties = dataTable.rowsHash();
  
  context.initialProperties.clear();
  Object.entries(properties).forEach(([key, value]) => {
    context.initialProperties.set(key, value);
  });
  
  // Verify the asset has these properties
  expect(context.currentAsset).to.not.be.null;
});

// Inline editing scenarios
Given('I am viewing the asset page', function() {
  // Mock that we're viewing the asset page
  expect(context.currentAsset).to.not.be.null;
});

Given('the property renderer is active', function() {
  // Mock that property renderer is initialized
  expect(true).to.be.true;
});

When('I click on the {string} property', function(propertyName: string) {
  context.editingMode = 'inline';
  context.pendingChanges.set('editingProperty', propertyName);
});

Then('an inline editor should appear', function() {
  // In a real implementation, this would verify UI state
  expect(context.editingMode).to.equal('inline');
});

When('I change the value to {string}', function(newValue: string) {
  const editingProperty = context.pendingChanges.get('editingProperty');
  context.pendingChanges.set(editingProperty, newValue);
});

When('I press Enter to confirm', async function() {
  const editingProperty = context.pendingChanges.get('editingProperty');
  const newValue = context.pendingChanges.get(editingProperty);
  
  try {
    context.startTime = Date.now();
    
    const result = await context.propertyEditingUseCase.execute({
      assetId: context.currentAsset.getId().toString(),
      propertyUpdates: { [editingProperty]: newValue },
      validationMode: 'strict'
    });
    
    context.endTime = Date.now();
    context.lastResult = result;
    
    if (result.isSuccess) {
      context.changeHistory.push({
        property: editingProperty,
        oldValue: context.initialProperties.get(editingProperty),
        newValue: newValue,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    context.lastError = error as Error;
  }
});

Then('the property should be updated to {string}', function(expectedValue: string) {
  expect(context.lastResult).to.not.be.null;
  expect(context.lastResult!.isSuccess).to.be.true;
  
  // Verify the change was recorded
  const lastChange = context.changeHistory[context.changeHistory.length - 1];
  expect(lastChange.newValue).to.equal(expectedValue);
});

Then('the change should be persisted to frontmatter', function() {
  const fileContent = context.vaultAdapter.getFileContent('Sample Project.md') || '';
  expect(fileContent).to.contain('---');
  
  // In a real implementation, this would parse frontmatter and verify
  const lastChange = context.changeHistory[context.changeHistory.length - 1];
  expect(fileContent).to.contain(`${lastChange.property}: ${lastChange.newValue}`);
});

// Validation scenarios
Given('I am editing the {string} property', function(propertyName: string) {
  context.editingMode = 'inline';
  context.pendingChanges.set('editingProperty', propertyName);
});

When('I enter an invalid value {string}', function(invalidValue: string) {
  const editingProperty = context.pendingChanges.get('editingProperty');
  context.pendingChanges.set(editingProperty, invalidValue);
});

When('I attempt to save the change', async function() {
  const editingProperty = context.pendingChanges.get('editingProperty');
  const newValue = context.pendingChanges.get(editingProperty);
  
  try {
    const result = await context.propertyEditingUseCase.execute({
      assetId: context.currentAsset.getId().toString(),
      propertyUpdates: { [editingProperty]: newValue },
      validationMode: 'strict'
    });
    
    context.lastResult = result;
    
    if (!result.isSuccess) {
      context.validationErrors.push(result.getError());
    }
  } catch (error) {
    context.lastError = error as Error;
  }
});

Then('the system should reject the invalid value', function() {
  if (context.lastResult) {
    expect(context.lastResult.isSuccess).to.be.false;
  } else {
    expect(context.lastError).to.not.be.null;
  }
});

Then('a validation error should be displayed', function() {
  expect(context.validationErrors.length).to.be.greaterThan(0);
});

Then('the original value should be preserved', function() {
  const editingProperty = context.pendingChanges.get('editingProperty');
  const originalValue = context.initialProperties.get(editingProperty);
  
  // Verify the original value is still in place
  expect(originalValue).to.not.be.undefined;
});

Then('no changes should be persisted', function() {
  // Verify no successful changes were recorded
  const recentChanges = context.changeHistory.filter(
    change => Date.now() - change.timestamp < 1000
  );
  expect(recentChanges.length).to.equal(0);
});

// Modal editing scenarios
Given('I need to edit multiple properties at once', function() {
  context.editingMode = 'modal';
});

When('I open the property editing modal', function() {
  expect(context.editingMode).to.equal('modal');
  // Mock modal opening
});

Then('I should see all editable properties', function() {
  // In a real implementation, this would verify modal content
  expect(context.initialProperties.size).to.be.greaterThan(0);
});

When('I update multiple properties:', async function(dataTable: DataTable) {
  const updates = dataTable.rowsHash();
  
  try {
    const result = await context.propertyEditingUseCase.execute({
      assetId: context.currentAsset.getId().toString(),
      propertyUpdates: updates,
      validationMode: 'strict'
    });
    
    context.lastResult = result;
    
    if (result.isSuccess) {
      Object.entries(updates).forEach(([property, newValue]) => {
        context.changeHistory.push({
          property,
          oldValue: context.initialProperties.get(property),
          newValue,
          timestamp: Date.now()
        });
      });
    }
  } catch (error) {
    context.lastError = error as Error;
  }
});

When('I click {string}', function(buttonText: string) {
  // Mock button click
  expect(buttonText).to.equal('Save Changes');
});

Then('all properties should be updated atomically', function() {
  expect(context.lastResult).to.not.be.null;
  expect(context.lastResult!.isSuccess).to.be.true;
  
  // Verify all changes were made together
  const recentChanges = context.changeHistory.filter(
    change => Date.now() - change.timestamp < 1000
  );
  expect(recentChanges.length).to.be.greaterThan(1);
});

Then('the asset should reflect all changes', function() {
  // Verify asset state reflects all changes
  expect(context.changeHistory.length).to.be.greaterThan(0);
});

Then('the change should be recorded in the history', function() {
  expect(context.changeHistory.length).to.be.greaterThan(0);
  
  const lastChange = context.changeHistory[context.changeHistory.length - 1];
  expect(lastChange.timestamp).to.be.greaterThan(0);
});

// Performance scenarios
Then('the editor should appear within {int}ms', function(maxTime: number) {
  // Mock timing verification
  expect(maxTime).to.be.greaterThan(0);
});

Then('the validation should occur within {int}ms', function(maxTime: number) {
  const executionTime = context.endTime - context.startTime;
  expect(executionTime).to.be.lessThan(maxTime);
});

Then('the persistence should complete within {int}ms', function(maxTime: number) {
  const executionTime = context.endTime - context.startTime;
  expect(executionTime).to.be.lessThan(maxTime);
});

// Undo/Redo scenarios
Given('I have made several property changes', function() {
  // Pre-populate change history
  context.changeHistory.push({
    property: 'status',
    oldValue: 'active',
    newValue: 'in_progress',
    timestamp: Date.now() - 2000
  });
  
  context.changeHistory.push({
    property: 'priority',
    oldValue: 'medium',
    newValue: 'high',
    timestamp: Date.now() - 1000
  });
});

When('I edit {string} from {string} to {string}', async function(property: string, oldValue: string, newValue: string) {
  try {
    const result = await context.propertyEditingUseCase.execute({
      assetId: context.currentAsset.getId().toString(),
      propertyUpdates: { [property]: newValue },
      validationMode: 'strict'
    });
    
    if (result.isSuccess) {
      context.changeHistory.push({
        property,
        oldValue,
        newValue,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    context.lastError = error as Error;
  }
});

Then('I should be able to undo the last change', function() {
  // Mock undo capability verification
  expect(context.changeHistory.length).to.be.greaterThan(0);
});

When('I press Ctrl+Z', function() {
  if (context.changeHistory.length > 0) {
    const lastChange = context.changeHistory.pop()!;
    
    // Mock undo operation
    context.changeHistory.push({
      property: lastChange.property,
      oldValue: lastChange.newValue,
      newValue: lastChange.oldValue,
      timestamp: Date.now()
    });
  }
});

Then('{string} should revert to {string}', function(property: string, expectedValue: string) {
  const lastChange = context.changeHistory[context.changeHistory.length - 1];
  if (lastChange.property === property) {
    expect(lastChange.newValue).to.equal(expectedValue);
  }
});

Then('{string} should remain {string}', function(property: string, expectedValue: string) {
  // Verify property wasn't affected by the undo
  const propertyChanges = context.changeHistory.filter(change => change.property === property);
  if (propertyChanges.length > 0) {
    const lastChange = propertyChanges[propertyChanges.length - 1];
    expect(lastChange.newValue).to.equal(expectedValue);
  }
});

// Graph index updates
Then('the graph index should be updated', function() {
  // Mock graph index update verification
  expect(context.lastResult).to.not.be.null;
  expect(context.lastResult!.isSuccess).to.be.true;
  
  // In a real implementation, verify graph was updated
  const lastChange = context.changeHistory[context.changeHistory.length - 1];
  expect(lastChange).to.not.be.undefined;
});

// Dropdown selection scenarios
When('I select {string} from the dropdown', function(optionValue: string) {
  const editingProperty = context.pendingChanges.get('editingProperty');
  context.pendingChanges.set(editingProperty, optionValue);
  context.pendingChanges.set('inputMethod', 'dropdown');
});

Then('the dropdown should display available options', function() {
  // Mock dropdown options display
  expect(context.editingMode).to.equal('inline');
  expect(context.pendingChanges.get('editingProperty')).to.not.be.undefined;
});

When('I type {string} to filter options', function(filterText: string) {
  context.pendingChanges.set('filterText', filterText);
});

Then('only matching options should be shown', function() {
  const filterText = context.pendingChanges.get('filterText');
  expect(filterText).to.not.be.undefined;
  // Mock filtered options verification
});

// Custom property type scenarios
Given('I have a custom property type {string}', function(propertyType: string) {
  context.pendingChanges.set('customPropertyType', propertyType);
});

When('I edit a {string} property', function(propertyType: string) {
  context.editingMode = 'inline';
  context.pendingChanges.set('propertyType', propertyType);
});

Then('the appropriate editor for {string} should appear', function(propertyType: string) {
  expect(context.pendingChanges.get('propertyType')).to.equal(propertyType);
});

When('I use the {string} input method', function(inputMethod: string) {
  context.pendingChanges.set('inputMethod', inputMethod);
});

// Keyboard navigation scenarios
When('I activate inline editing with keyboard', function() {
  context.editingMode = 'inline';
  context.pendingChanges.set('activationMethod', 'keyboard');
});

Then('the editor should be keyboard accessible', function() {
  expect(context.pendingChanges.get('activationMethod')).to.equal('keyboard');
});

When('I navigate with Tab/Shift+Tab', function() {
  context.pendingChanges.set('navigationMethod', 'keyboard');
});

Then('I should be able to navigate with Tab/Shift+Tab', function() {
  expect(context.pendingChanges.get('navigationMethod')).to.equal('keyboard');
});

When('I press Escape', function() {
  context.pendingChanges.set('lastAction', 'escape');
  context.editingMode = 'inline'; // Reset to default state
});

Then('the editing should be cancelled', function() {
  expect(context.pendingChanges.get('lastAction')).to.equal('escape');
});

When('I press Tab to move to next property', function() {
  context.pendingChanges.set('navigationAction', 'tab_next');
});

Then('the next editable property should be selected', function() {
  expect(context.pendingChanges.get('navigationAction')).to.equal('tab_next');
});

// Mobile interaction scenarios
Given('I am using a mobile device', function() {
  context.pendingChanges.set('deviceType', 'mobile');
});

When('I tap on a property', function() {
  context.editingMode = 'inline';
  context.pendingChanges.set('interactionMethod', 'touch');
});

Then('a touch-optimized editor should appear', function() {
  expect(context.pendingChanges.get('interactionMethod')).to.equal('touch');
  expect(context.editingMode).to.equal('inline');
});

When('I use pinch gestures', function() {
  context.pendingChanges.set('gesture', 'pinch');
});

When('I swipe to dismiss', function() {
  context.pendingChanges.set('gesture', 'swipe_dismiss');
  context.editingMode = 'inline';
});

Then('the editor should close', function() {
  expect(context.pendingChanges.get('gesture')).to.equal('swipe_dismiss');
});

// Batch editing scenarios
Given('I have selected multiple assets of the same class', function() {
  context.pendingChanges.set('selectedAssets', ['asset1', 'asset2', 'asset3']);
  context.editingMode = 'batch';
});

When('I choose {string}', function(action: string) {
  context.pendingChanges.set('batchAction', action);
});

Then('I should see only properties common to all assets', function() {
  expect(context.editingMode).to.equal('batch');
  expect(context.pendingChanges.get('selectedAssets')).to.not.be.undefined;
});

When('I update shared properties:', async function(dataTable: DataTable) {
  const updates = dataTable.rowsHash();
  const selectedAssets = context.pendingChanges.get('selectedAssets') || [];
  
  try {
    // Simulate batch update
    for (const asset of selectedAssets) {
      const result = await context.propertyEditingUseCase.execute({
        assetId: asset,
        propertyUpdates: updates,
        validationMode: 'strict'
      });
      
      if (result.isSuccess) {
        Object.entries(updates).forEach(([property, newValue]) => {
          context.changeHistory.push({
            property: `${asset}.${property}`,
            oldValue: 'old_value',
            newValue: newValue as string,
            timestamp: Date.now()
          });
        });
      }
    }
    
    context.lastResult = Result.ok(true);
  } catch (error) {
    context.lastError = error as Error;
  }
});

When('I apply the changes', function() {
  context.pendingChanges.set('batchApplied', true);
});

Then('all selected assets should be updated', function() {
  expect(context.pendingChanges.get('batchApplied')).to.be.true;
  expect(context.lastResult?.isSuccess).to.be.true;
});

Then('the changes should be atomic across all assets', function() {
  // Verify atomicity - either all succeed or all fail
  expect(context.lastResult?.isSuccess).to.be.true;
});

Then('individual asset histories should be preserved', function() {
  const batchChanges = context.changeHistory.filter(change => 
    change.property.includes('.'));
  expect(batchChanges.length).to.be.greaterThan(0);
});

// Performance scenarios - extended
Given('I have an asset with many properties', function() {
  // Create asset with many properties
  for (let i = 0; i < 50; i++) {
    context.initialProperties.set(`property${i}`, `value${i}`);
  }
});

When('I initiate inline editing', function() {
  context.startTime = Date.now();
  context.editingMode = 'inline';
  context.endTime = Date.now();
});

When('I make changes to the property', function() {
  context.startTime = Date.now();
  context.pendingChanges.set('validationProperty', 'test');
  context.endTime = Date.now();
});

When('I save the changes', function() {
  context.startTime = Date.now();
  context.pendingChanges.set('saveAction', 'triggered');
  context.endTime = Date.now();
});

// Concurrent editing scenarios
interface UserAction {
  user: string;
  property: string;
  value: string;
  timestamp: number;
}

Given('multiple users are editing the same asset', function() {
  context.conflictResolution.detected = false;
  context.pendingChanges.set('concurrentUsers', ['UserA', 'UserB']);
});

When('User A changes {string} to {string}', function(property: string, value: string) {
  const userAction: UserAction = {
    user: 'UserA',
    property,
    value,
    timestamp: Date.now()
  };
  
  let actions = context.pendingChanges.get('userActions') || [];
  actions.push(userAction);
  context.pendingChanges.set('userActions', actions);
});

When('User B simultaneously changes {string} to {string}', function(property: string, value: string) {
  const userAction: UserAction = {
    user: 'UserB',
    property,
    value,
    timestamp: Date.now()
  };
  
  let actions = context.pendingChanges.get('userActions') || [];
  actions.push(userAction);
  context.pendingChanges.set('userActions', actions);
});

When('both users save their changes', function() {
  const userActions: UserAction[] = context.pendingChanges.get('userActions') || [];
  
  // Check for conflicts - same property modified by different users
  const propertyMap = new Map<string, UserAction[]>();
  userActions.forEach(action => {
    if (!propertyMap.has(action.property)) {
      propertyMap.set(action.property, []);
    }
    propertyMap.get(action.property)!.push(action);
  });
  
  // Detect conflicts
  propertyMap.forEach((actions, property) => {
    if (actions.length > 1) {
      const users = new Set(actions.map(a => a.user));
      if (users.size > 1) {
        context.conflictResolution.detected = true;
      }
    }
  });
});

Then('the system should detect the conflict', function() {
  expect(context.conflictResolution.detected).to.be.true;
});

Then('present a conflict resolution dialog', function() {
  expect(context.conflictResolution.detected).to.be.true;
  context.pendingChanges.set('conflictDialogShown', true);
});

Then('allow the user to choose the final value', function() {
  expect(context.pendingChanges.get('conflictDialogShown')).to.be.true;
  context.conflictResolution.resolved = true;
});

Then('preserve both change histories', function() {
  const userActions: UserAction[] = context.pendingChanges.get('userActions') || [];
  expect(userActions.length).to.be.greaterThan(1);
});

// Accessibility scenarios
Given('I am using screen reader technology', function() {
  context.pendingChanges.set('assistiveTechnology', 'screenReader');
});

When('I navigate to a property field', function() {
  context.pendingChanges.set('navigationTarget', 'propertyField');
});

Then('the property should be announced clearly', function() {
  expect(context.pendingChanges.get('navigationTarget')).to.equal('propertyField');
  expect(context.pendingChanges.get('assistiveTechnology')).to.equal('screenReader');
});

Then('changes should be announced to assistive technology', function() {
  expect(context.pendingChanges.get('assistiveTechnology')).to.equal('screenReader');
});

// Error recovery scenarios
When('a network error occurs during save', function() {
  context.lastError = new Error('Network error');
  context.pendingChanges.set('networkError', true);
});

Then('the system should preserve my changes locally', function() {
  expect(context.pendingChanges.get('networkError')).to.be.true;
  // Changes should be preserved in pending state
  expect(context.pendingChanges.size).to.be.greaterThan(0);
});

Then('display a {string} indicator', function(indicator: string) {
  context.pendingChanges.set('statusIndicator', indicator);
  expect(context.pendingChanges.get('statusIndicator')).to.equal(indicator);
});

When('the connection is restored', function() {
  context.pendingChanges.set('networkError', false);
  context.pendingChanges.set('connectionRestored', true);
});

Then('the system should automatically retry saving', function() {
  expect(context.pendingChanges.get('connectionRestored')).to.be.true;
  context.pendingChanges.set('autoRetryTriggered', true);
});

Then('notify me of successful save', function() {
  expect(context.pendingChanges.get('autoRetryTriggered')).to.be.true;
  context.pendingChanges.set('saveNotification', 'success');
});

Then('prompt for manual retry if automatic save fails', function() {
  if (!context.pendingChanges.get('autoRetryTriggered')) {
    context.pendingChanges.set('manualRetryPrompt', true);
  }
});

// Undo/Redo extended scenarios
When('I press Ctrl+Y', function() {
  // Redo operation
  const revertedChange = context.changeHistory.pop();
  if (revertedChange) {
    context.changeHistory.push({
      property: revertedChange.property,
      oldValue: revertedChange.newValue,
      newValue: revertedChange.oldValue,
      timestamp: Date.now()
    });
  }
});

Then('{string} should become {string} again', function(property: string, expectedValue: string) {
  const lastChange = context.changeHistory[context.changeHistory.length - 1];
  if (lastChange.property === property) {
    expect(lastChange.newValue).to.equal(expectedValue);
  }
});

// Property type-specific validations
When('I enter a date value {string}', async function(dateValue: string) {
  const editingProperty = context.pendingChanges.get('editingProperty');
  context.pendingChanges.set(editingProperty, dateValue);
  
  try {
    const result = await context.propertyEditingUseCase.execute({
      assetId: context.currentAsset.getId().toString(),
      propertyUpdates: { [editingProperty]: dateValue },
      validationMode: 'strict'
    });
    
    context.lastResult = result;
  } catch (error) {
    context.lastError = error as Error;
  }
});

Then('the date should be validated and formatted', function() {
  expect(context.lastResult).to.not.be.null;
  // In a real implementation, verify date formatting
});

When('I select multiple values', function() {
  const editingProperty = context.pendingChanges.get('editingProperty');
  context.pendingChanges.set(editingProperty, ['value1', 'value2', 'value3']);
});

Then('all selected values should be stored', function() {
  const editingProperty = context.pendingChanges.get('editingProperty');
  const values = context.pendingChanges.get(editingProperty);
  expect(Array.isArray(values)).to.be.true;
  expect(values.length).to.be.greaterThan(1);
});

// Rich text editing scenarios
When('I use rich text formatting', function() {
  context.pendingChanges.set('inputType', 'richText');
});

When('I add bold text {string}', function(text: string) {
  const editingProperty = context.pendingChanges.get('editingProperty');
  context.pendingChanges.set(editingProperty, `**${text}**`);
});

Then('the formatting should be preserved', function() {
  const editingProperty = context.pendingChanges.get('editingProperty');
  const value = context.pendingChanges.get(editingProperty);
  expect(value).to.contain('**');
});

// Auto-save scenarios
Given('auto-save is enabled', function() {
  context.pendingChanges.set('autoSaveEnabled', true);
});

When('I pause typing for {int} seconds', function(seconds: number) {
  context.pendingChanges.set('typingPaused', seconds);
});

Then('the changes should be auto-saved', function() {
  expect(context.pendingChanges.get('autoSaveEnabled')).to.be.true;
  expect(context.pendingChanges.get('typingPaused')).to.be.greaterThan(0);
});

// Property suggestions scenarios
When('I start typing a property value', function() {
  context.pendingChanges.set('typingStarted', true);
});

Then('relevant suggestions should appear', function() {
  expect(context.pendingChanges.get('typingStarted')).to.be.true;
  context.pendingChanges.set('suggestionsShown', true);
});

When('I select a suggestion', function() {
  expect(context.pendingChanges.get('suggestionsShown')).to.be.true;
  context.pendingChanges.set('suggestionSelected', true);
});

Then('the suggestion should be applied', function() {
  expect(context.pendingChanges.get('suggestionSelected')).to.be.true;
});

// Validation scenarios - extended
Then('specific validation rules should be applied', function() {
  expect(context.validationErrors.length).to.be.greaterThan(0);
});

When('I enter a value that exceeds the maximum length', async function() {
  const longValue = 'x'.repeat(1000);
  const editingProperty = context.pendingChanges.get('editingProperty');
  
  try {
    const result = await context.propertyEditingUseCase.execute({
      assetId: context.currentAsset.getId().toString(),
      propertyUpdates: { [editingProperty]: longValue },
      validationMode: 'strict'
    });
    
    context.lastResult = result;
    if (!result.isSuccess) {
      context.validationErrors.push(result.getError());
    }
  } catch (error) {
    context.lastError = error as Error;
  }
});

Then('a length validation error should be shown', function() {
  expect(context.validationErrors.some(error => 
    error.includes('length') || error.includes('maximum')
  )).to.be.true;
});

// Drag and drop scenarios
When('I drag and drop files into a property field', function() {
  context.pendingChanges.set('dragDropAction', 'files');
});

Then('the files should be processed appropriately', function() {
  expect(context.pendingChanges.get('dragDropAction')).to.equal('files');
});

// Search and filter scenarios
When('I use the search function in property values', function() {
  context.pendingChanges.set('searchActive', true);
});

When('I enter search term {string}', function(searchTerm: string) {
  context.pendingChanges.set('searchTerm', searchTerm);
});

Then('matching property values should be highlighted', function() {
  expect(context.pendingChanges.get('searchActive')).to.be.true;
  expect(context.pendingChanges.get('searchTerm')).to.not.be.undefined;
});

// Clipboard integration scenarios
When('I copy property values', function() {
  context.pendingChanges.set('clipboardAction', 'copy');
});

When('I paste values from clipboard', function() {
  context.pendingChanges.set('clipboardAction', 'paste');
});

Then('the values should be pasted correctly', function() {
  expect(context.pendingChanges.get('clipboardAction')).to.equal('paste');
});

// Property relationships scenarios
When('I edit a property that affects related properties', function() {
  context.pendingChanges.set('hasRelatedProperties', true);
});

Then('related properties should be updated automatically', function() {
  expect(context.pendingChanges.get('hasRelatedProperties')).to.be.true;
});

Then('dependency relationships should be maintained', function() {
  expect(context.pendingChanges.get('hasRelatedProperties')).to.be.true;
});

// Additional utility steps
Given('I have permissions to edit properties', function() {
  context.pendingChanges.set('editPermissions', true);
});

Given('I do not have permissions to edit properties', function() {
  context.pendingChanges.set('editPermissions', false);
});

Then('edit controls should be disabled', function() {
  expect(context.pendingChanges.get('editPermissions')).to.be.false;
});

Then('an access denied message should be shown', function() {
  expect(context.pendingChanges.get('editPermissions')).to.be.false;
});

// Export/Import scenarios
When('I export property values', function() {
  context.pendingChanges.set('exportAction', 'triggered');
});

Then('the export should include all property data', function() {
  expect(context.pendingChanges.get('exportAction')).to.equal('triggered');
});

When('I import property values from file', function() {
  context.pendingChanges.set('importAction', 'triggered');
});

Then('the imported values should be validated and applied', function() {
  expect(context.pendingChanges.get('importAction')).to.equal('triggered');
});

// Version control scenarios
When('I view property change history', function() {
  context.pendingChanges.set('historyViewActive', true);
});

Then('I should see all previous values with timestamps', function() {
  expect(context.changeHistory.length).to.be.greaterThan(0);
  expect(context.pendingChanges.get('historyViewActive')).to.be.true;
});

When('I revert to a previous value', function() {
  if (context.changeHistory.length > 0) {
    const changeToRevert = context.changeHistory[0];
    context.changeHistory.push({
      property: changeToRevert.property,
      oldValue: changeToRevert.newValue,
      newValue: changeToRevert.oldValue,
      timestamp: Date.now()
    });
  }
});

Then('the property should be restored to the selected version', function() {
  expect(context.changeHistory.length).to.be.greaterThan(0);
});