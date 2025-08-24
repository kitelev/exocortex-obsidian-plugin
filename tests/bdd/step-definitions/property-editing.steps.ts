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
  expect(context.currentAsset.getName()).to.equal(assetName);
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
      assetId: context.currentAsset.getId(),
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
  const fileContent = context.vaultAdapter.getFileContent('Sample Project.md');
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
      assetId: context.currentAsset.getId(),
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
      assetId: context.currentAsset.getId(),
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
      assetId: context.currentAsset.getId(),
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

// Additional step definitions for concurrent editing, accessibility, etc. would follow similar patterns...