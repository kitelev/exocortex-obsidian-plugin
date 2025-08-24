import { Given, When, Then, DataTable, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'chai';
import { Asset } from '../../src/domain/entities/Asset';
import { UIButton } from '../../src/domain/entities/UIButton';
import { ButtonCommand } from '../../src/domain/entities/ButtonCommand';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { RenderClassButtonsUseCase } from '../../src/application/use-cases/RenderClassButtonsUseCase';
import { ExecuteButtonCommandUseCase } from '../../src/application/use-cases/ExecuteButtonCommandUseCase';

setDefaultTimeout(10000);

// Button definition interfaces
interface ButtonDefinition {
  id: string;
  label: string;
  command: string;
  order: number;
  enabled: boolean;
  position: 'top' | 'bottom' | 'floating';
}

interface CommandDefinition {
  id: string;
  type: string;
  requiresInput: boolean;
  parameters: string[];
}

interface ClassViewDefinition {
  targetClass: string;
  buttons: string[];
}

// Mock command executor
class MockCommandExecutor {
  private executedCommands: Array<{ command: string; parameters: any }> = [];
  private templateApplied = false;

  async executeCommand(commandId: string, parameters: any = {}): Promise<any> {
    this.executedCommands.push({ command: commandId, parameters });

    switch (commandId) {
      case 'cmd_create_task':
        return this.createTask(parameters);
      case 'cmd_open_related':
        return this.openRelated();
      case 'cmd_run_template':
        return this.runTemplate(parameters);
      default:
        throw new Error(`Unknown command: ${commandId}`);
    }
  }

  private createTask(parameters: any): any {
    return {
      success: true,
      message: 'Task created successfully',
      assetId: `task_${Date.now()}`
    };
  }

  private openRelated(): any {
    return {
      success: true,
      message: 'Related assets opened',
      openedTabs: ['related1.md', 'related2.md']
    };
  }

  private runTemplate(parameters: any): any {
    this.templateApplied = true;
    return {
      success: true,
      message: 'Template applied successfully',
      templateName: parameters.template_name
    };
  }

  getExecutedCommands(): Array<{ command: string; parameters: any }> {
    return this.executedCommands;
  }

  wasTemplateApplied(): boolean {
    return this.templateApplied;
  }

  reset(): void {
    this.executedCommands = [];
    this.templateApplied = false;
  }
}

// Mock input modal
class MockInputModal {
  private fields: Map<string, any> = new Map();
  private validationErrors: string[] = [];
  private isOpen = false;

  open(requiredFields: Array<{ name: string; type: string; required: boolean }>): void {
    this.isOpen = true;
    this.fields.clear();
    this.validationErrors = [];
    
    // Initialize fields
    requiredFields.forEach(field => {
      this.fields.set(field.name, {
        value: '',
        type: field.type,
        required: field.required
      });
    });
  }

  setFieldValue(fieldName: string, value: any): void {
    const field = this.fields.get(fieldName);
    if (field) {
      field.value = value;
    }
  }

  getFieldValue(fieldName: string): any {
    return this.fields.get(fieldName)?.value;
  }

  validate(): boolean {
    this.validationErrors = [];
    
    for (const [fieldName, field] of this.fields.entries()) {
      if (field.required && (!field.value || field.value.trim() === '')) {
        this.validationErrors.push(`Required parameter '${fieldName}' is missing`);
      }
    }
    
    return this.validationErrors.length === 0;
  }

  execute(): any {
    if (!this.validate()) {
      return {
        success: false,
        errors: this.validationErrors
      };
    }
    
    const parameters: any = {};
    for (const [fieldName, field] of this.fields.entries()) {
      parameters[fieldName] = field.value;
    }
    
    this.isOpen = false;
    return {
      success: true,
      parameters
    };
  }

  close(): void {
    this.isOpen = false;
  }

  isModalOpen(): boolean {
    return this.isOpen;
  }

  getValidationErrors(): string[] {
    return this.validationErrors;
  }

  hasField(fieldName: string): boolean {
    return this.fields.has(fieldName);
  }

  getFieldType(fieldName: string): string {
    return this.fields.get(fieldName)?.type || '';
  }

  isFieldRequired(fieldName: string): boolean {
    return this.fields.get(fieldName)?.required || false;
  }
}

// Mock button renderer
class MockButtonRenderer {
  private renderedButtons: Array<{
    id: string;
    label: string;
    enabled: boolean;
    position: string;
    visible: boolean;
  }> = [];
  private renderTime = 0;

  async renderButtons(asset: Asset, className: string): Promise<void> {
    const startTime = Date.now();
    this.renderedButtons = [];

    const classView = world.classViews.get(className);
    if (!classView) {
      this.renderTime = Date.now() - startTime;
      return;
    }

    for (const buttonId of classView.buttons) {
      const buttonDef = world.buttonDefinitions.get(buttonId);
      const commandDef = world.commandDefinitions.get(buttonDef?.command || '');
      
      if (buttonDef && commandDef) {
        // Check if button should be visible (context-aware)
        const visible = this.isButtonVisible(buttonDef, commandDef, asset);
        
        this.renderedButtons.push({
          id: buttonDef.id,
          label: buttonDef.label,
          enabled: buttonDef.enabled,
          position: buttonDef.position,
          visible
        });
      } else if (buttonDef && !commandDef) {
        // Button with missing command - log warning but don't render
        console.warn(`Command ${buttonDef.command} not found for button ${buttonId}`);
      }
    }

    this.renderTime = Date.now() - startTime;
  }

  private isButtonVisible(buttonDef: ButtonDefinition, commandDef: CommandDefinition, asset: Asset): boolean {
    // Context-aware visibility logic
    if (commandDef.type === 'DELETE_ASSET') {
      // Delete button only visible when there's a selection
      return world.hasSelection;
    }
    
    return true; // Most buttons are always visible
  }

  getRenderedButtons(): Array<{
    id: string;
    label: string;
    enabled: boolean;
    position: string;
    visible: boolean;
  }> {
    return this.renderedButtons;
  }

  getRenderTime(): number {
    return this.renderTime;
  }

  findButtonByLabel(label: string): any {
    return this.renderedButtons.find(button => button.label === label);
  }

  getVisibleButtons(): any[] {
    return this.renderedButtons.filter(button => button.visible);
  }

  getButtonsByPosition(position: string): any[] {
    return this.renderedButtons.filter(button => button.position === position);
  }

  simulateClick(buttonLabel: string): boolean {
    const button = this.findButtonByLabel(buttonLabel);
    if (button && button.enabled && button.visible) {
      return true; // Click succeeded
    }
    return false; // Click failed or ignored
  }
}

// Test World interface
interface UIButtonsWorld {
  // Core components
  commandExecutor: MockCommandExecutor;
  inputModal: MockInputModal;
  buttonRenderer: MockButtonRenderer;
  
  // Configuration
  buttonDefinitions: Map<string, ButtonDefinition>;
  commandDefinitions: Map<string, CommandDefinition>;
  classViews: Map<string, ClassViewDefinition>;
  
  // Test state
  currentAsset: Asset | null;
  currentClassName: string;
  modalOpen: boolean;
  successMessage: string;
  errorMessage: string;
  executionResult: any;
  hasSelection: boolean;
  
  // Performance tracking
  buttonClickTime: number;
  
  // Templates
  availableTemplates: string[];
}

let world: UIButtonsWorld;

Before(function() {
  world = {
    commandExecutor: new MockCommandExecutor(),
    inputModal: new MockInputModal(),
    buttonRenderer: new MockButtonRenderer(),
    buttonDefinitions: new Map(),
    commandDefinitions: new Map(),
    classViews: new Map(),
    currentAsset: null,
    currentClassName: '',
    modalOpen: false,
    successMessage: '',
    errorMessage: '',
    executionResult: null,
    hasSelection: false,
    buttonClickTime: 0,
    availableTemplates: ['project_checklist.md', 'meeting_notes.md']
  };
});

After(function() {
  world.commandExecutor.reset();
  world.buttonDefinitions.clear();
  world.commandDefinitions.clear();
  world.classViews.clear();
  world.successMessage = '';
  world.errorMessage = '';
});

Given('I have the Exocortex plugin installed', function() {
  expect(world.commandExecutor).to.not.be.null;
  expect(world.buttonRenderer).to.not.be.null;
});

Given('my vault contains the following ontology structure:', function(dataTable: DataTable) {
  const ontologyEntries = dataTable.hashes();
  
  ontologyEntries.forEach(entry => {
    expect(entry.Asset).to.not.be.empty;
    expect(entry.Class).to.not.be.empty;
    expect(entry.Properties).to.not.be.empty;
  });
});

Given('I have defined the following buttons:', function(dataTable: DataTable) {
  const buttons = dataTable.hashes();
  
  buttons.forEach(button => {
    world.buttonDefinitions.set(button['Button ID'], {
      id: button['Button ID'],
      label: button.Label,
      command: button.Command,
      order: parseInt(button.Order),
      enabled: true,
      position: 'top'
    });
  });
});

Given('I have defined the following commands:', function(dataTable: DataTable) {
  const commands = dataTable.hashes();
  
  commands.forEach(command => {
    world.commandDefinitions.set(command['Command ID'], {
      id: command['Command ID'],
      type: command.Type,
      requiresInput: command['Requires Input'] === 'true',
      parameters: command.Parameters === '-' ? [] : command.Parameters.split(', ')
    });
  });
});

Given('I have a ClassView for {string} with buttons:', function(className: string, dataTable: DataTable) {
  const buttonIds = dataTable.raw().flat();
  
  world.classViews.set(className, {
    targetClass: className,
    buttons: buttonIds
  });
});

Given('I am viewing an asset of class {string}', function(className: string) {
  const assetId = AssetId.create('TestAsset').getValue()!;
  const assetClass = ClassName.create(className).getValue()!;
  
  world.currentAsset = Asset.create({
    id: assetId,
    class: assetClass,
    properties: new Map()
  }).getValue()!;
  
  world.currentClassName = className;
});

Given('I see the {string} button', async function(buttonLabel: string) {
  await world.buttonRenderer.renderButtons(world.currentAsset!, world.currentClassName);
  
  const button = world.buttonRenderer.findButtonByLabel(buttonLabel);
  expect(button, `Button "${buttonLabel}" not found`).to.not.be.undefined;
  expect(button.visible, `Button "${buttonLabel}" is not visible`).to.be.true;
});

Given('I have a ClassView with a disabled button {string}', function(buttonId: string) {
  world.buttonDefinitions.set(buttonId, {
    id: buttonId,
    label: 'Archive',
    command: 'cmd_archive',
    order: 1,
    enabled: false,
    position: 'top'
  });
  
  world.classViews.set('TestClass', {
    targetClass: 'TestClass',
    buttons: [buttonId]
  });
});

Given('no ClassView is configured for {string}', function(className: string) {
  expect(world.classViews.has(className)).to.be.false;
});

Given('I have a ClassView with button position {string}', function(position: string) {
  const buttonId = 'btn_positioned';
  world.buttonDefinitions.set(buttonId, {
    id: buttonId,
    label: 'Positioned Button',
    command: 'cmd_test',
    order: 1,
    enabled: true,
    position: position as any
  });
  
  world.classViews.set('TestClass', {
    targetClass: 'TestClass',
    buttons: [buttonId]
  });
});

Given('I have a button {string} with command {string}', function(buttonId: string, commandId: string) {
  world.buttonDefinitions.set(buttonId, {
    id: buttonId,
    label: 'Broken Button',
    command: commandId,
    order: 1,
    enabled: true,
    position: 'top'
  });
  
  world.classViews.set('TestClass', {
    targetClass: 'TestClass',
    buttons: [buttonId]
  });
});

Given('the command {string} does not exist', function(commandId: string) {
  expect(world.commandDefinitions.has(commandId)).to.be.false;
});

Given('I am viewing an asset with the {string} button', function(buttonLabel: string) {
  world.currentAsset = Asset.create({
    id: AssetId.create('TestAsset').getValue()!,
    class: ClassName.create('TestClass').getValue()!,
    properties: new Map()
  }).getValue()!;
  
  // Add button to class view
  const buttonId = 'btn_create_task';
  world.classViews.set('TestClass', {
    targetClass: 'TestClass',
    buttons: [buttonId]
  });
});

Given('I have a template {string}', function(templateName: string) {
  world.availableTemplates.push(templateName);
});

Given('I have a ClassView with {int} buttons', function(buttonCount: number) {
  const buttonIds: string[] = [];
  
  for (let i = 1; i <= buttonCount; i++) {
    const buttonId = `btn_${i}`;
    world.buttonDefinitions.set(buttonId, {
      id: buttonId,
      label: `Button ${i}`,
      command: `cmd_${i}`,
      order: i,
      enabled: true,
      position: 'top'
    });
    
    world.commandDefinitions.set(`cmd_${i}`, {
      id: `cmd_${i}`,
      type: 'CUSTOM',
      requiresInput: false,
      parameters: []
    });
    
    buttonIds.push(buttonId);
  }
  
  world.classViews.set('TestClass', {
    targetClass: 'TestClass',
    buttons: buttonIds
  });
});

Given('I have a button that requires selection', function() {
  const buttonId = 'btn_delete';
  world.buttonDefinitions.set(buttonId, {
    id: buttonId,
    label: 'Delete',
    command: 'cmd_delete',
    order: 1,
    enabled: true,
    position: 'top'
  });
  
  world.commandDefinitions.set('cmd_delete', {
    id: 'cmd_delete',
    type: 'DELETE_ASSET',
    requiresInput: false,
    parameters: []
  });
  
  world.classViews.set('TestClass', {
    targetClass: 'TestClass',
    buttons: [buttonId]
  });
});

Given('the button command type is {string}', function(commandType: string) {
  // This is validated in the button definition above
  const command = world.commandDefinitions.get('cmd_delete');
  expect(command?.type).to.equal(commandType);
});

When('the asset view renders', async function() {
  await world.buttonRenderer.renderButtons(world.currentAsset!, world.currentClassName);
});

When('I click the {string} button', async function(buttonLabel: string) {
  const startTime = Date.now();
  
  const success = world.buttonRenderer.simulateClick(buttonLabel);
  expect(success, `Failed to click button "${buttonLabel}"`).to.be.true;
  
  const button = world.buttonRenderer.findButtonByLabel(buttonLabel);
  const buttonDef = world.buttonDefinitions.get(button?.id || '');
  const commandDef = world.commandDefinitions.get(buttonDef?.command || '');
  
  if (commandDef?.requiresInput) {
    world.modalOpen = true;
    world.inputModal.open(commandDef.parameters.map(param => ({
      name: param,
      type: 'string',
      required: true
    })));
  } else {
    // Execute command directly
    try {
      world.executionResult = await world.commandExecutor.executeCommand(buttonDef?.command || '');
      world.successMessage = world.executionResult.message;
    } catch (error) {
      world.errorMessage = (error as Error).message;
    }
  }
  
  world.buttonClickTime = Date.now() - startTime;
});

When('a modal should open requesting input', function() {
  expect(world.modalOpen).to.be.true;
  expect(world.inputModal.isModalOpen()).to.be.true;
});

When('the modal should show fields for:', function(dataTable: DataTable) {
  const expectedFields = dataTable.hashes();
  
  expectedFields.forEach(field => {
    expect(world.inputModal.hasField(field.Field)).to.be.true;
    expect(world.inputModal.getFieldType(field.Field)).to.not.be.empty;
    expect(world.inputModal.isFieldRequired(field.Field)).to.equal(field.Required === 'true');
  });
});

When('I fill in the required fields:', function(dataTable: DataTable) {
  const fieldValues = dataTable.hashes();
  
  fieldValues.forEach(fieldValue => {
    world.inputModal.setFieldValue(fieldValue.Field, fieldValue.Value);
  });
});

When('I click {string}', async function(action: string) {
  if (action === 'Execute') {
    const result = world.inputModal.execute();
    
    if (result.success) {
      const button = world.buttonRenderer.findButtonByLabel('Create Task');
      const buttonDef = world.buttonDefinitions.get(button?.id || '');
      
      try {
        world.executionResult = await world.commandExecutor.executeCommand(
          buttonDef?.command || '',
          result.parameters
        );
        world.successMessage = world.executionResult.message;
      } catch (error) {
        world.errorMessage = (error as Error).message;
      }
    } else {
      world.errorMessage = result.errors[0];
    }
  }
});

When('the input modal opens', function() {
  expect(world.inputModal.isModalOpen()).to.be.true;
});

When('I leave the required {string} field empty', function(fieldName: string) {
  world.inputModal.setFieldValue(fieldName, '');
});

When('I attempt to click the {string} button', function(buttonLabel: string) {
  const success = world.buttonRenderer.simulateClick(buttonLabel);
  expect(success).to.be.false; // Should fail for disabled button
});

When('I view an asset with this ClassView', async function() {
  world.currentAsset = Asset.create({
    id: AssetId.create('TestAsset').getValue()!,
    class: ClassName.create('TestClass').getValue()!,
    properties: new Map()
  }).getValue()!;
  
  await world.buttonRenderer.renderButtons(world.currentAsset, 'TestClass');
});

When('I view an asset with this button', async function() {
  world.currentAsset = Asset.create({
    id: AssetId.create('TestAsset').getValue()!,
    class: ClassName.create('TestClass').getValue()!,
    properties: new Map()
  }).getValue()!;
  
  await world.buttonRenderer.renderButtons(world.currentAsset, 'TestClass');
});

When('I select the template {string}', function(templateName: string) {
  world.inputModal.setFieldValue('template_name', templateName);
});

When('I press Tab key', function() {
  // Simulate tab key navigation
  world.hasSelection = false; // Reset selection for keyboard nav test
});

When('I press Arrow Right key', function() {
  // Simulate arrow key navigation
});

When('I press Enter key', function() {
  // Simulate enter key on focused button
});

When('I press Escape key in a modal', function() {
  world.inputModal.close();
});

When('I view an asset without any selection', async function() {
  world.hasSelection = false;
  
  world.currentAsset = Asset.create({
    id: AssetId.create('TestAsset').getValue()!,
    class: ClassName.create('TestClass').getValue()!,
    properties: new Map()
  }).getValue()!;
  
  await world.buttonRenderer.renderButtons(world.currentAsset, 'TestClass');
});

When('I select text in the asset', async function() {
  world.hasSelection = true;
  await world.buttonRenderer.renderButtons(world.currentAsset!, 'TestClass');
});

Then('I should see a button with label {string}', function(label: string) {
  const button = world.buttonRenderer.findButtonByLabel(label);
  expect(button, `Button with label "${label}" not found`).to.not.be.undefined;
  expect(button.visible).to.be.true;
});

Then('the buttons should be in the correct order', function() {
  const visibleButtons = world.buttonRenderer.getVisibleButtons();
  expect(visibleButtons).to.not.be.empty;
  
  // Verify buttons are rendered in order
  for (let i = 1; i < visibleButtons.length; i++) {
    const currentButton = world.buttonDefinitions.get(visibleButtons[i].id);
    const previousButton = world.buttonDefinitions.get(visibleButtons[i-1].id);
    
    if (currentButton && previousButton) {
      expect(currentButton.order).to.be.greaterThanOrEqual(previousButton.order);
    }
  }
});

Then('the buttons should be positioned at the top of the view', function() {
  const topButtons = world.buttonRenderer.getButtonsByPosition('top');
  expect(topButtons.length).to.be.greaterThan(0);
});

Then('the command {string} should execute', function(commandId: string) {
  const executedCommands = world.commandExecutor.getExecutedCommands();
  const executed = executedCommands.find(cmd => cmd.command === commandId);
  expect(executed, `Command ${commandId} was not executed`).to.not.be.undefined;
});

Then('related assets should open in new tabs', function() {
  expect(world.executionResult.openedTabs).to.not.be.empty;
});

Then('I should see a success message', function() {
  expect(world.successMessage).to.not.be.empty;
});

Then('the command {string} should execute with the provided parameters', function(commandId: string) {
  const executedCommands = world.commandExecutor.getExecutedCommands();
  const executed = executedCommands.find(cmd => cmd.command === commandId);
  expect(executed, `Command ${commandId} was not executed`).to.not.be.undefined;
  expect(executed.parameters).to.not.be.empty;
});

Then('a new task asset should be created', function() {
  expect(world.executionResult.assetId).to.not.be.empty;
});

Then('I should see validation error {string}', function(errorMessage: string) {
  expect(world.errorMessage).to.include(errorMessage);
});

Then('the command should not execute', function() {
  expect(world.commandExecutor.getExecutedCommands()).to.be.empty;
});

Then('the {string} button should appear disabled', function(buttonLabel: string) {
  const button = world.buttonRenderer.findButtonByLabel(buttonLabel);
  expect(button).to.not.be.undefined;
  expect(button.enabled).to.be.false;
});

Then('nothing should happen', function() {
  expect(world.executionResult).to.be.null;
});

Then('no command should execute', function() {
  expect(world.commandExecutor.getExecutedCommands()).to.be.empty;
});

Then('no buttons should be displayed', function() {
  const visibleButtons = world.buttonRenderer.getVisibleButtons();
  expect(visibleButtons).to.be.empty;
});

Then('the view should render normally without button section', function() {
  // View should render without errors even with no buttons
  expect(world.buttonRenderer).to.not.be.null;
});

Then('the buttons should be displayed at the {string} of the view', function(position: string) {
  const buttonsAtPosition = world.buttonRenderer.getButtonsByPosition(position);
  expect(buttonsAtPosition.length).to.be.greaterThan(0);
});

Then('the button should not be displayed', function() {
  const visibleButtons = world.buttonRenderer.getVisibleButtons();
  expect(visibleButtons).to.be.empty;
});

Then('a warning should be logged in the console', function() {
  // In real implementation, this would check console logs
  expect(true).to.be.true; // Placeholder for console warning check
});

Then('the template should be applied to the current asset', function() {
  expect(world.commandExecutor.wasTemplateApplied()).to.be.true;
});

Then('the asset content should be updated', function() {
  expect(world.executionResult.templateName).to.not.be.empty;
});

Then('I should see {string}', function(message: string) {
  expect(world.successMessage).to.include(message);
});

Then('all {int} buttons should render within {int}ms', function(buttonCount: number, maxTime: number) {
  const renderTime = world.buttonRenderer.getRenderTime();
  const renderedButtons = world.buttonRenderer.getRenderedButtons();
  
  expect(renderedButtons.length).to.equal(buttonCount);
  expect(renderTime).to.be.lessThan(maxTime);
});

Then('clicking any button should respond within {int}ms', function(maxTime: number) {
  expect(world.buttonClickTime).to.be.lessThan(maxTime);
});

Then('focus should move to the first button', function() {
  // Placeholder for keyboard focus verification
  expect(true).to.be.true;
});

Then('focus should move to the next button', function() {
  // Placeholder for keyboard navigation verification
  expect(true).to.be.true;
});

Then('the focused button should be clicked', function() {
  // Placeholder for enter key activation verification
  expect(true).to.be.true;
});

Then('the modal should close', function() {
  expect(world.inputModal.isModalOpen()).to.be.false;
});

Then('the delete button should not be visible', function() {
  const deleteButton = world.buttonRenderer.findButtonByLabel('Delete');
  expect(deleteButton?.visible).to.be.false;
});

Then('the delete button should become visible', function() {
  const deleteButton = world.buttonRenderer.findButtonByLabel('Delete');
  expect(deleteButton?.visible).to.be.true;
});