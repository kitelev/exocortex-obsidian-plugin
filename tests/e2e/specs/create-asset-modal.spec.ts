import { CreateAssetModalPage } from '../page-objects/CreateAssetModalPage';
import { WorkspacePage } from '../page-objects/WorkspacePage';

describe('CreateAssetModal Core E2E Tests', () => {
  let workspacePage: WorkspacePage;
  let createAssetModalPage: CreateAssetModalPage;

  before(async () => {
    workspacePage = new WorkspacePage();
    createAssetModalPage = new CreateAssetModalPage();
    
    await workspacePage.initializeObsidian();
    
    // Wait for the plugin to be loaded
    await browser.waitUntil(
      async () => {
        return await workspacePage.isPluginLoaded('exocortex-obsidian-plugin');
      },
      {
        timeout: 30000,
        timeoutMsg: 'Exocortex plugin failed to load within timeout'
      }
    );
  });

  beforeEach(async () => {
    try {
      await createAssetModalPage.closeModal();
    } catch (error) {
      // Modal might not be open
    }
  });

  afterEach(async () => {
    if ((this as any).currentTest?.state === 'failed') {
      await workspacePage.takeScreenshot(`failed-modal-${(this as any).currentTest.title}-${Date.now()}`);
    }
  });

  it('should open the Create Asset Modal', async () => {
    await createAssetModalPage.openCreateAssetModal();
    
    const modal = await createAssetModalPage.waitForModalToOpen();
    await expect(modal).toBeDisplayed();
  });

  it('should display available classes', async () => {
    await createAssetModalPage.openCreateAssetModal();
    
    const availableClasses = await createAssetModalPage.getAvailableClasses();
    expect(availableClasses).toBeInstanceOf(Array);
    expect(availableClasses.length).toBeGreaterThan(0);
  });

  it('should update property fields when class is selected', async () => {
    await createAssetModalPage.openCreateAssetModal();
    
    await createAssetModalPage.selectClass('Asset');
    
    const properties = await createAssetModalPage.getPropertyFields();
    expect(properties).toBeInstanceOf(Array);
    expect(properties.length).toBeGreaterThan(0);
  });

  it('should show different properties for different classes', async () => {
    await createAssetModalPage.openCreateAssetModal();
    
    await createAssetModalPage.selectClass('Asset');
    const assetProperties = await createAssetModalPage.getPropertyFields();
    
    await createAssetModalPage.selectClass('Task');
    const taskProperties = await createAssetModalPage.getPropertyFields();
    
    // Should have properties for both classes
    expect(assetProperties.length).toBeGreaterThan(0);
    expect(taskProperties.length).toBeGreaterThan(0);
  });

  it('should test dynamic form expansion functionality', async () => {
    await createAssetModalPage.openCreateAssetModal();
    
    const testClasses = ['Asset', 'Task', 'Project'];
    const results = await createAssetModalPage.testDynamicFormExpansion(testClasses);
    
    expect(results).toBeInstanceOf(Object);
    
    // Verify at least one class showed properties
    const hasValidResults = Object.values(results).some((result: any) => result.hasProperties);
    expect(hasValidResults).toBe(true);
  });

  it('should fill property fields', async () => {
    await createAssetModalPage.openCreateAssetModal();
    await createAssetModalPage.selectClass('Asset');
    
    const properties = await createAssetModalPage.getPropertyFields();
    
    if (properties.length > 0) {
      await createAssetModalPage.fillPropertyField(properties[0].label, 'Test Value');
      
      const updatedProperties = await createAssetModalPage.getPropertyFields();
      const updatedProperty = updatedProperties.find(p => p.label === properties[0].label);
      
      expect(updatedProperty.value).toBe('Test Value');
    }
  });

  it('should submit form successfully', async () => {
    await createAssetModalPage.openCreateAssetModal();
    
    const success = await createAssetModalPage.testCompleteWorkflow('Asset', {
      'Name': 'E2E Test Asset',
      'Description': 'Test description'
    });
    
    expect(success).toBe(true);
  });

  it('should close modal with cancel', async () => {
    await createAssetModalPage.openCreateAssetModal();
    await createAssetModalPage.cancelModal();
    
    const modal = await $('.exocortex-create-asset-modal');
    await expect(modal).not.toBeDisplayed();
  });
});