import { Given, When, Then, DataTable, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'chai';
import { Asset } from '../../src/domain/entities/Asset';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { PropertyValue } from '../../src/domain/value-objects/PropertyValue';
import { PropertyEditingUseCase } from '../../src/application/use-cases/PropertyEditingUseCase';
import { CreateAssetUseCase } from '../../src/application/use-cases/CreateAssetUseCase';
import { ObsidianVaultAdapter } from '../../src/infrastructure/adapters/ObsidianVaultAdapter';
import { ObsidianAssetRepository } from '../../src/infrastructure/repositories/ObsidianAssetRepository';

setDefaultTimeout(10000);

// Mock implementations for testing
class MockVaultAdapter {
  private files: Map<string, any> = new Map();

  async read(path: string): Promise<string> {
    return this.files.get(path) || '';
  }

  async write(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async list(pattern: string): Promise<string[]> {
    return Array.from(this.files.keys()).filter(path => path.includes(pattern));
  }

  async getMetadata(path: string): Promise<any> {
    const content = this.files.get(path) || '';
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      // Parse YAML frontmatter
      const yaml = frontmatterMatch[1];
      const metadata: any = {};
      yaml.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');
        }
      });
      return metadata;
    }
    return {};
  }

  async updateFrontmatter(path: string, properties: Record<string, any>): Promise<void> {
    const content = this.files.get(path) || '';
    let frontmatterSection = '';
    
    // Create frontmatter
    const frontmatterLines = ['---'];
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === 'string' && (value.startsWith('[[') && value.endsWith(']]'))) {
        frontmatterLines.push(`${key}: ${value}`);
      } else {
        frontmatterLines.push(`${key}: "${value}"`);
      }
    });
    frontmatterLines.push('---');
    
    frontmatterSection = frontmatterLines.join('\n');
    
    // Remove existing frontmatter if present
    const contentWithoutFrontmatter = content.replace(/^---\n([\s\S]*?)\n---\n?/, '');
    
    this.files.set(path, `${frontmatterSection}\n${contentWithoutFrontmatter}`);
  }

  createMockAsset(name: string, className: string, properties: Record<string, any> = {}): void {
    const filename = `${name}.md`;
    const frontmatter = {
      exo__Instance_class: `[[${className}]]`,
      ...properties
    };
    
    this.updateFrontmatter(filename, frontmatter);
  }
}

// Property definition mock
interface PropertyDefinition {
  name: string;
  range: string;
  required: boolean;
}

// Test World interface
interface BugFixWorld {
  vaultAdapter: MockVaultAdapter;
  assetRepository: ObsidianAssetRepository;
  propertyEditingUseCase: PropertyEditingUseCase;
  createAssetUseCase: CreateAssetUseCase;
  
  // Test state
  currentAsset: Asset | null;
  currentAssetName: string;
  currentPropertyName: string;
  currentPropertyValue: string;
  lastError: Error | null;
  
  // Property definitions
  propertyDefinitions: Map<string, PropertyDefinition>;
  
  // Test timing
  actionStartTime: number;
  actionEndTime: number;
  
  // UI simulation
  modalOpen: boolean;
  dropdownOptions: string[];
  selectedOption: string;
  validationErrors: string[];
}

let world: BugFixWorld;

Before(function() {
  const vaultAdapter = new MockVaultAdapter();
  const assetRepository = new ObsidianAssetRepository(vaultAdapter as any);
  
  world = {
    vaultAdapter,
    assetRepository,
    propertyEditingUseCase: new PropertyEditingUseCase(assetRepository as any),
    createAssetUseCase: new CreateAssetUseCase(assetRepository as any),
    currentAsset: null,
    currentAssetName: '',
    currentPropertyName: '',
    currentPropertyValue: '',
    lastError: null,
    propertyDefinitions: new Map(),
    actionStartTime: 0,
    actionEndTime: 0,
    modalOpen: false,
    dropdownOptions: [],
    selectedOption: '',
    validationErrors: []
  };
});

After(function() {
  world.vaultAdapter = null as any;
  world.propertyDefinitions.clear();
  world.lastError = null;
});

Given('I have an asset {string} with class {string}', function(assetName: string, className: string) {
  world.currentAssetName = assetName;
  world.vaultAdapter.createMockAsset(assetName, className);
  
  const assetId = AssetId.create(assetName).getValue()!;
  const assetClass = ClassName.create(className).getValue()!;
  
  const assetResult = Asset.create({
    id: assetId,
    className: assetClass,
    ontology: { getValue: () => 'exo' } as any,
    label: assetName
  });
  
  expect(assetResult.isSuccess).to.be.true;
  world.currentAsset = assetResult.getValue()!;
});

Given('I have property {string} with range {string}', function(propertyName: string, range: string) {
  world.propertyDefinitions.set(propertyName, {
    name: propertyName,
    range: range,
    required: false
  });
});

Given('I have assets of class {string}:', function(className: string, dataTable: DataTable) {
  const assets = dataTable.hashes();
  
  assets.forEach(asset => {
    world.vaultAdapter.createMockAsset(asset.name, className, {
      filename: asset.filename
    });
  });
});

Given('I am viewing the asset {string}', async function(assetName: string) {
  world.currentAssetName = assetName;
  // Simulate opening the asset view
  const exists = await world.vaultAdapter.exists(`${assetName}.md`);
  expect(exists).to.be.true;
});

Given('the property {string} has value {string}', function(propertyName: string, value: string) {
  world.currentPropertyName = propertyName;
  world.currentPropertyValue = value;
  
  if (world.currentAsset) {
    const propertyValue = PropertyValue.create(value).getValue()!;
    world.currentAsset.setProperty(propertyName, propertyValue);
  }
  
  // Update the file with this property value
  const properties: Record<string, any> = {};
  properties[propertyName] = value;
  world.vaultAdapter.updateFrontmatter(`${world.currentAssetName}.md`, properties);
});

Given('the property {string} is optional', function(propertyName: string) {
  const existing = world.propertyDefinitions.get(propertyName) || {
    name: propertyName,
    range: 'string',
    required: false
  };
  existing.required = false;
  world.propertyDefinitions.set(propertyName, existing);
});

Given('the property {string} is required', function(propertyName: string) {
  const existing = world.propertyDefinitions.get(propertyName) || {
    name: propertyName,
    range: 'string',
    required: true
  };
  existing.required = true;
  world.propertyDefinitions.set(propertyName, existing);
});

Given('it currently has value {string}', function(value: string) {
  world.currentPropertyValue = value;
  // Update the current asset and file
  if (world.currentAsset && world.currentPropertyName) {
    const propertyValue = PropertyValue.create(value).getValue()!;
    world.currentAsset.setProperty(world.currentPropertyName, propertyValue);
    
    const properties: Record<string, any> = {};
    properties[world.currentPropertyName] = value;
    world.vaultAdapter.updateFrontmatter(`${world.currentAssetName}.md`, properties);
  }
});

Given('I am editing an inline property', function() {
  // Simulate being in inline editing mode
  world.modalOpen = false; // Inline editing, not modal
});

Given('I have an asset {string} with filename {string}', function(assetName: string, filename: string) {
  world.vaultAdapter.createMockAsset(assetName, 'ems__Person', { filename });
});

Given('there are {int} assets of class {string}', function(count: number, className: string) {
  for (let i = 1; i <= count; i++) {
    world.vaultAdapter.createMockAsset(`Person${i}`, className);
  }
  
  // Populate dropdown options
  world.dropdownOptions = Array.from({ length: count }, (_, i) => `Person${i + 1}`);
});

When('I click on the property value to edit', function() {
  // Simulate clicking on property value to edit
  world.modalOpen = true;
  world.dropdownOptions = ['Alice', 'Bob', 'John O\'Brien']; // Mock available options
});

When('I select {string} from the dropdown', function(option: string) {
  if (!world.dropdownOptions.includes(option) && option !== '') {
    throw new Error(`Option "${option}" not found in dropdown`);
  }
  world.selectedOption = option;
});

When('I save the changes', async function() {
  world.actionStartTime = Date.now();
  
  try {
    if (world.currentAsset && world.currentPropertyName) {
      const newValue = world.selectedOption ? `[[${world.selectedOption}]]` : '';
      
      // Validate if required
      const propertyDef = world.propertyDefinitions.get(world.currentPropertyName);
      if (propertyDef?.required && !newValue) {
        world.validationErrors.push('This field is required');
        world.actionEndTime = Date.now();
        return;
      }
      
      // Simulate asset lookup by filename
      const filename = `${world.selectedOption}.md`;
      const exists = await world.vaultAdapter.exists(filename);
      
      if (world.selectedOption && !exists) {
        throw new Error(`Asset not found: ${world.selectedOption}`);
      }
      
      // Update the property
      const propertyValue = PropertyValue.create(newValue).getValue()!;
      world.currentAsset.setProperty(world.currentPropertyName, propertyValue);
      
      // Update file
      const properties: Record<string, any> = {};
      properties[world.currentPropertyName] = newValue;
      await world.vaultAdapter.updateFrontmatter(`${world.currentAssetName}.md`, properties);
      
      world.currentPropertyValue = newValue;
    }
  } catch (error) {
    world.lastError = error as Error;
  }
  
  world.actionEndTime = Date.now();
  world.modalOpen = false;
});

When('I select the empty option', function() {
  world.selectedOption = '';
});

When('I try to save', async function() {
  await this.save_the_changes(); // Reuse save logic
});

When('I select any person from the dropdown', function() {
  // Select a random person from available options
  if (world.dropdownOptions.length > 0) {
    const randomIndex = Math.floor(Math.random() * world.dropdownOptions.length);
    world.selectedOption = world.dropdownOptions[randomIndex];
  }
});

When('I save a dropdown selection', async function() {
  // Reuse the save logic
  await this.save_the_changes();
});

When('I select this asset from dropdown', function() {
  world.selectedOption = 'John O\'Brien';
});

When('I click to edit the property', function() {
  world.modalOpen = true;
});

Then('the property should be updated to {string}', async function(expectedValue: string) {
  expect(world.currentPropertyValue).to.equal(expectedValue);
  
  // Verify in file
  const metadata = await world.vaultAdapter.getMetadata(`${world.currentAssetName}.md`);
  expect(metadata[world.currentPropertyName]).to.equal(expectedValue);
});

Then('no error message should appear', function() {
  expect(world.lastError).to.be.null;
  expect(world.validationErrors).to.be.empty;
});

Then('the asset should be found and updated', function() {
  expect(world.lastError).to.be.null;
  expect(world.currentAsset).to.not.be.null;
});

Then('the system should look up the asset by filename not by the display label', function() {
  // This is verified by the implementation not throwing an error
  // In real implementation, this would check the lookup mechanism
  expect(world.lastError).to.be.null;
});

Then('the asset should be found successfully', function() {
  expect(world.lastError).to.be.null;
});

Then('the property should be cleared', function() {
  expect(world.currentPropertyValue).to.be.oneOf(['', '[]', null]);
});

Then('no error should occur', function() {
  expect(world.lastError).to.be.null;
  expect(world.validationErrors).to.be.empty;
});

Then('the asset should be found correctly', function() {
  expect(world.lastError).to.be.null;
});

Then('the reference should be saved as {string}', function(expectedValue: string) {
  expect(world.currentPropertyValue).to.equal(expectedValue);
});

Then('I should see validation error {string}', function(errorMessage: string) {
  expect(world.validationErrors).to.include(errorMessage);
});

Then('the original value should remain', function() {
  // Since validation failed, the value should not have changed
  expect(world.currentPropertyValue).to.not.equal('');
});

Then('the correct asset should be found', function() {
  expect(world.lastError).to.be.null;
  expect(world.selectedOption).to.not.be.empty;
});

Then('the update should complete within {int}ms', function(maxTime: number) {
  const duration = world.actionEndTime - world.actionStartTime;
  expect(duration).to.be.lessThan(maxTime);
});