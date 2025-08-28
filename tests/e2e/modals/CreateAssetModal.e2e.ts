/**
 * End-to-End tests for CreateAssetModal property display functionality
 * Validates complete user workflow including property domain resolution
 * Uses Docker-based testing infrastructure for consistent environments
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { Browser, Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import path from 'path';
import fs from 'fs/promises';

const feature = loadFeature('./tests/e2e/modals/CreateAssetModal.feature');

interface TestContext {
  driver: WebDriver;
  testVault: string;
  obsidianInstance?: any;
  propertyElements: any[];
  selectedClass?: string;
}

defineFeature(feature, (test) => {
  let context: TestContext;

  beforeEach(async () => {
    // Setup Chrome with headless mode for Docker compatibility
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    
    context = {
      driver: await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(chromeOptions)
        .build(),
      testVault: path.join(__dirname, '../../../test-vault'),
      propertyElements: []
    };

    // Ensure test vault exists
    await fs.mkdir(context.testVault, { recursive: true });
  });

  afterEach(async () => {
    if (context.driver) {
      await context.driver.quit();
    }
  });

  test('Modal displays properties for selected class', ({ given, when, then }) => {
    given('I have a class "Person" with properties "name", "age", "email" via exo__Property_domain', async () => {
      // Create test class file
      const classFile = path.join(context.testVault, 'Person.md');
      await fs.writeFile(classFile, `---
exo__Instance_class: "[[exo__Class]]"
rdfs__label: "Person"
---

# Person Class

A person entity in the knowledge graph.`);

      // Create property files with proper domain relationships
      const properties = [
        {
          name: 'person_name',
          label: 'Full Name',
          domain: '[[Person]]',
          range: 'string',
          required: true
        },
        {
          name: 'person_age',
          label: 'Age',
          domain: '[[Person]]',
          range: 'integer',
          required: false
        },
        {
          name: 'person_email',
          label: 'Email Address', 
          domain: '[[Person]]',
          range: 'string',
          required: false
        }
      ];

      for (const prop of properties) {
        const propFile = path.join(context.testVault, `${prop.name}.md`);
        await fs.writeFile(propFile, `---
exo__Instance_class: "[[exo__Property]]"
rdfs__label: "${prop.label}"
exo__Property_domain: "${prop.domain}"
rdfs__range: "${prop.range}"
exo__Property_isRequired: ${prop.required}
---

# ${prop.label}

${prop.label} property for Person class.`);
      }

      // Setup Obsidian test environment with test vault
      await context.driver.get(`file://${path.join(__dirname, '../../../test-environments/obsidian-test.html')}`);
      
      // Wait for Obsidian to initialize
      await context.driver.wait(until.elementLocated(By.css('[data-test="obsidian-app"]')), 10000);
    });

    when('I open the asset creation modal', async () => {
      // Simulate opening the modal through command palette or button
      const openModalButton = await context.driver.findElement(By.css('[data-test="open-asset-modal"]'));
      await openModalButton.click();
      
      // Wait for modal to appear
      await context.driver.wait(until.elementLocated(By.css('[data-test="create-asset-modal"]')), 5000);
    });

    when('I select "Person" as the asset class', async () => {
      const classDropdown = await context.driver.findElement(By.css('[data-test="asset-class-dropdown"]'));
      await classDropdown.click();
      
      const personOption = await context.driver.findElement(By.css('option[value="Person"]'));
      await personOption.click();
      
      context.selectedClass = 'Person';
      
      // Wait for properties to load (using performance threshold)
      await context.driver.sleep(200); // Allow for property discovery
    });

    then('I should see property fields for "name", "age", and "email"', async () => {
      // Verify property fields are displayed
      const propertyContainer = await context.driver.findElement(By.css('[data-test="properties-container"]'));
      
      const nameField = await propertyContainer.findElement(By.css('[data-test="property-person_name"]'));
      const ageField = await propertyContainer.findElement(By.css('[data-test="property-person_age"]'));
      const emailField = await propertyContainer.findElement(By.css('[data-test="property-person_email"]'));
      
      expect(await nameField.isDisplayed()).toBe(true);
      expect(await ageField.isDisplayed()).toBe(true);
      expect(await emailField.isDisplayed()).toBe(true);
      
      context.propertyElements = [nameField, ageField, emailField];
    });

    then('each property should have appropriate input types', async () => {
      // Verify input types match property ranges
      const nameInput = await context.propertyElements[0].findElement(By.css('input'));
      const ageInput = await context.propertyElements[1].findElement(By.css('input'));
      const emailInput = await context.propertyElements[2].findElement(By.css('input'));
      
      expect(await nameInput.getAttribute('type')).toBe('text');
      expect(await ageInput.getAttribute('type')).toBe('number');
      expect(await emailInput.getAttribute('type')).toBe('text');
      
      // Verify required field indicators
      const nameLabel = await context.propertyElements[0].findElement(By.css('label'));
      expect(await nameLabel.getText()).toContain('*'); // Required field indicator
    });
  });

  test('Modal updates properties when class changes', ({ given, when, then }) => {
    given('I have classes "Person" and "Organization" with different properties', async () => {
      // Setup Person class (reuse from previous test)
      const personFile = path.join(context.testVault, 'Person.md');
      await fs.writeFile(personFile, `---
exo__Instance_class: "[[exo__Class]]"
rdfs__label: "Person"
---

# Person Class`);
      
      // Setup Organization class
      const orgFile = path.join(context.testVault, 'Organization.md');
      await fs.writeFile(orgFile, `---
exo__Instance_class: "[[exo__Class]]"
rdfs__label: "Organization"
---

# Organization Class`);
      
      // Person properties
      await fs.writeFile(path.join(context.testVault, 'person_name.md'), 
        `---
exo__Instance_class: "[[exo__Property]]"
rdfs__label: "Full Name"
exo__Property_domain: "[[Person]]"
rdfs__range: "string"
---`);
      
      // Organization properties
      await fs.writeFile(path.join(context.testVault, 'org_name.md'), 
        `---
exo__Instance_class: "[[exo__Property]]"
rdfs__label: "Organization Name"
exo__Property_domain: "[[Organization]]"
rdfs__range: "string"
---`);
        
      await fs.writeFile(path.join(context.testVault, 'org_industry.md'), 
        `---
exo__Instance_class: "[[exo__Property]]"
rdfs__label: "Industry"
exo__Property_domain: "[[Organization]]"
rdfs__range: "string"
---`);
      
      // Initialize Obsidian test environment
      await context.driver.get(`file://${path.join(__dirname, '../../../test-environments/obsidian-test.html')}`);
      await context.driver.wait(until.elementLocated(By.css('[data-test="obsidian-app"]')), 10000);
    });

    when('I open the asset creation modal', async () => {
      const openModalButton = await context.driver.findElement(By.css('[data-test="open-asset-modal"]'));
      await openModalButton.click();
      await context.driver.wait(until.elementLocated(By.css('[data-test="create-asset-modal"]')), 5000);
    });

    when('I initially select "Person" class', async () => {
      const classDropdown = await context.driver.findElement(By.css('[data-test="asset-class-dropdown"]'));
      await classDropdown.click();
      
      const personOption = await context.driver.findElement(By.css('option[value="Person"]'));
      await personOption.click();
      
      await context.driver.sleep(200); // Allow property loading
      
      // Verify Person property is visible
      const propertyContainer = await context.driver.findElement(By.css('[data-test="properties-container"]'));
      const personNameField = await propertyContainer.findElement(By.css('[data-test="property-person_name"]'));
      expect(await personNameField.isDisplayed()).toBe(true);
    });

    when('I change to "Organization" class', async () => {
      const classDropdown = await context.driver.findElement(By.css('[data-test="asset-class-dropdown"]'));
      await classDropdown.click();
      
      const orgOption = await context.driver.findElement(By.css('option[value="Organization"]'));
      await orgOption.click();
      
      context.selectedClass = 'Organization';
      
      await context.driver.sleep(200); // Allow property loading
    });

    then('the property fields should update to show Organization properties', async () => {
      const propertyContainer = await context.driver.findElement(By.css('[data-test="properties-container"]'));
      
      // Verify Organization properties are visible
      const orgNameField = await propertyContainer.findElement(By.css('[data-test="property-org_name"]'));
      const industryField = await propertyContainer.findElement(By.css('[data-test="property-org_industry"]'));
      
      expect(await orgNameField.isDisplayed()).toBe(true);
      expect(await industryField.isDisplayed()).toBe(true);
    });

    then('Person properties should no longer be visible', async () => {
      // Verify Person properties are no longer in DOM or hidden
      try {
        const propertyContainer = await context.driver.findElement(By.css('[data-test="properties-container"]'));
        const personNameFields = await propertyContainer.findElements(By.css('[data-test="property-person_name"]'));
        
        // Should either not exist or not be displayed
        if (personNameFields.length > 0) {
          expect(await personNameFields[0].isDisplayed()).toBe(false);
        }
      } catch (error) {
        // Element not found is expected (property was properly removed)
        expect(error.name).toBe('NoSuchElementError');
      }
    });
  });

  test('Modal handles class without properties', ({ given, when, then }) => {
    given('I have a class "EmptyClass" with no exo__Property_domain relationships', async () => {
      const emptyClassFile = path.join(context.testVault, 'EmptyClass.md');
      await fs.writeFile(emptyClassFile, `---
exo__Instance_class: "[[exo__Class]]"
rdfs__label: "Empty Class"
---

# Empty Class

A class with no properties.`);
      
      // Initialize Obsidian environment
      await context.driver.get(`file://${path.join(__dirname, '../../../test-environments/obsidian-test.html')}`);
      await context.driver.wait(until.elementLocated(By.css('[data-test="obsidian-app"]')), 10000);
    });

    when('I open the asset creation modal', async () => {
      const openModalButton = await context.driver.findElement(By.css('[data-test="open-asset-modal"]'));
      await openModalButton.click();
      await context.driver.wait(until.elementLocated(By.css('[data-test="create-asset-modal"]')), 5000);
    });

    when('I select "EmptyClass"', async () => {
      const classDropdown = await context.driver.findElement(By.css('[data-test="asset-class-dropdown"]'));
      await classDropdown.click();
      
      const emptyClassOption = await context.driver.findElement(By.css('option[value="EmptyClass"]'));
      await emptyClassOption.click();
      
      await context.driver.sleep(200); // Allow property resolution
    });

    then('I should see a message indicating no properties are available', async () => {
      const propertyContainer = await context.driver.findElement(By.css('[data-test="properties-container"]'));
      const noPropsMessage = await propertyContainer.findElement(By.css('[data-test="no-properties-message"]'));
      
      expect(await noPropsMessage.isDisplayed()).toBe(true);
      expect(await noPropsMessage.getText()).toContain('No specific properties for this class');
    });

    then('the create button should still be functional', async () => {
      const createButton = await context.driver.findElement(By.css('[data-test="create-asset-button"]'));
      expect(await createButton.isEnabled()).toBe(true);
    });
  });

  test('Modal handles property domain resolution failures', ({ given, when, then }) => {
    given('I have a class with malformed property domain relationships', async () => {
      const problematicClassFile = path.join(context.testVault, 'ProblematicClass.md');
      await fs.writeFile(problematicClassFile, `---
exo__Instance_class: "[[exo__Class]]"
rdfs__label: "Problematic Class"
---

# Problematic Class`);
      
      // Create property with malformed domain
      const malformedPropFile = path.join(context.testVault, 'malformed_prop.md');
      await fs.writeFile(malformedPropFile, `---
exo__Instance_class: "[[exo__Property]]"
rdfs__label: "Malformed Property"
exo__Property_domain: "[[NonExistentClass]]"
rdfs__range: "string"
---

# Malformed Property`);
      
      // Initialize environment
      await context.driver.get(`file://${path.join(__dirname, '../../../test-environments/obsidian-test.html')}`);
      await context.driver.wait(until.elementLocated(By.css('[data-test="obsidian-app"]')), 10000);
    });

    when('I open the asset creation modal', async () => {
      const openModalButton = await context.driver.findElement(By.css('[data-test="open-asset-modal"]'));
      await openModalButton.click();
      await context.driver.wait(until.elementLocated(By.css('[data-test="create-asset-modal"]')), 5000);
    });

    when('I select the problematic class', async () => {
      const classDropdown = await context.driver.findElement(By.css('[data-test="asset-class-dropdown"]'));
      await classDropdown.click();
      
      const problematicOption = await context.driver.findElement(By.css('option[value="ProblematicClass"]'));
      await problematicOption.click();
      
      await context.driver.sleep(200); // Allow property resolution attempt
    });

    then('I should see an error message about property loading', async () => {
      // Check for error notification or message
      const errorContainer = await context.driver.wait(
        until.elementLocated(By.css('[data-test="property-error-message"]')), 
        3000
      );
      
      expect(await errorContainer.isDisplayed()).toBe(true);
      const errorText = await errorContainer.getText();
      expect(errorText).toMatch(/property.*loading|failed.*discover/i);
    });

    then('the modal should remain functional for other operations', async () => {
      // Verify modal is still responsive
      const titleField = await context.driver.findElement(By.css('[data-test="asset-title-input"]'));
      await titleField.sendKeys('Test Asset');
      
      const createButton = await context.driver.findElement(By.css('[data-test="create-asset-button"]'));
      expect(await createButton.isEnabled()).toBe(true);
    });
  });

  test('Docker E2E validates complete modal workflow', ({ given, when, then }) => {
    given('a clean Obsidian environment in Docker container', async () => {
      // This test validates the Docker environment setup
      expect(process.env.CI).toBe('true'); // Should be running in CI/Docker
      expect(process.env.HEADLESS).toBe('true'); // Should be headless
      
      // Verify Docker-specific Chrome options are working
      const capabilities = await context.driver.getCapabilities();
      expect(capabilities.get('chrome.chromedriverVersion')).toBeDefined();
    });

    when('I navigate to asset creation through UI', async () => {
      // Full UI navigation test
      await context.driver.get(`file://${path.join(__dirname, '../../../test-environments/obsidian-test.html')}`);
      await context.driver.wait(until.elementLocated(By.css('[data-test="obsidian-app"]')), 10000);
      
      // Navigate through command palette
      const commandPalette = await context.driver.findElement(By.css('[data-test="command-palette"]'));
      await commandPalette.click();
      
      const createAssetCommand = await context.driver.findElement(By.css('[data-command="create-asset"]'));
      await createAssetCommand.click();
    });

    when('I interact with the modal through real browser automation', async () => {
      // Real browser interaction simulation
      const modal = await context.driver.wait(until.elementLocated(By.css('[data-test="create-asset-modal"]')), 5000);
      
      // Fill title field
      const titleField = await modal.findElement(By.css('[data-test="asset-title-input"]'));
      await titleField.clear();
      await titleField.sendKeys('E2E Test Asset');
      
      // Select class
      const classDropdown = await modal.findElement(By.css('[data-test="asset-class-dropdown"]'));
      await classDropdown.click();
      await context.driver.sleep(100); // Allow dropdown animation
    });

    then('property display should work end-to-end', async () => {
      // Verify complete property display workflow
      const propertyContainer = await context.driver.findElement(By.css('[data-test="properties-container"]'));
      expect(await propertyContainer.isDisplayed()).toBe(true);
      
      // Test that properties load within performance threshold
      const startTime = Date.now();
      await context.driver.wait(until.elementLocated(By.css('[data-test-starts-with="property-"]')), 2000);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000); // Performance requirement
    });

    then('asset creation should persist correct semantic relationships', async () => {
      // Complete asset creation workflow
      const createButton = await context.driver.findElement(By.css('[data-test="create-asset-button"]'));
      await createButton.click();
      
      // Wait for success notification
      const notification = await context.driver.wait(
        until.elementLocated(By.css('[data-test="success-notification"]')), 
        5000
      );
      
      const notificationText = await notification.getText();
      expect(notificationText).toMatch(/created.*successfully|asset.*created/i);
    });
  });

  test('Docker E2E validates performance requirements', ({ given, when, then }) => {
    given('a Docker environment with performance monitoring', async () => {
      // Setup performance monitoring
      await context.driver.executeScript(`
        window.performanceMetrics = {
          propertyLoadStart: null,
          propertyLoadEnd: null,
          memoryUsage: null
        };
        
        // Monitor memory usage
        if (performance.memory) {
          window.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
      `);
    });

    when('I open the modal and select the property-rich class', async () => {
      // Create class with many properties for performance testing
      const richClassFile = path.join(context.testVault, 'RichClass.md');
      await fs.writeFile(richClassFile, `---
exo__Instance_class: "[[exo__Class]]"
rdfs__label: "Rich Class"
---

# Rich Class`);
      
      // Create 25 properties
      for (let i = 1; i <= 25; i++) {
        const propFile = path.join(context.testVault, `rich_prop_${i}.md`);
        await fs.writeFile(propFile, `---
exo__Instance_class: "[[exo__Property]]"
rdfs__label: "Property ${i}"
exo__Property_domain: "[[RichClass]]"
rdfs__range: "string"
---

# Property ${i}`);
      }
      
      // Initialize and open modal
      await context.driver.get(`file://${path.join(__dirname, '../../../test-environments/obsidian-test.html')}`);
      await context.driver.wait(until.elementLocated(By.css('[data-test="obsidian-app"]')), 10000);
      
      const openModalButton = await context.driver.findElement(By.css('[data-test="open-asset-modal"]'));
      await openModalButton.click();
      
      // Start performance monitoring
      await context.driver.executeScript('window.performanceMetrics.propertyLoadStart = Date.now();');
      
      const classDropdown = await context.driver.findElement(By.css('[data-test="asset-class-dropdown"]'));
      await classDropdown.click();
      
      const richClassOption = await context.driver.findElement(By.css('option[value="RichClass"]'));
      await richClassOption.click();
    });

    then('property loading should complete within 2 seconds', async () => {
      // Wait for all properties to load
      await context.driver.wait(
        until.elementsLocated(By.css('[data-test-starts-with="property-rich_prop_"]')), 
        2000
      );
      
      // End performance monitoring
      await context.driver.executeScript('window.performanceMetrics.propertyLoadEnd = Date.now();');
      
      // Get load time
      const loadTime = await context.driver.executeScript(`
        return window.performanceMetrics.propertyLoadEnd - window.performanceMetrics.propertyLoadStart;
      `);
      
      expect(loadTime).toBeLessThan(2000); // 2 second requirement
    });

    then('memory usage should remain under performance thresholds', async () => {
      // Check memory usage after property loading
      const currentMemory = await context.driver.executeScript(`
        return performance.memory ? performance.memory.usedJSHeapSize : null;
      `);
      
      const initialMemory = await context.driver.executeScript('return window.performanceMetrics.memoryUsage;');
      
      if (currentMemory && initialMemory) {
        const memoryIncrease = currentMemory - initialMemory;
        const memoryIncreaseInMB = memoryIncrease / (1024 * 1024);
        
        expect(memoryIncreaseInMB).toBeLessThan(25); // 25MB threshold
      }
    });
  });
});
