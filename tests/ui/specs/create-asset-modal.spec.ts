import { expect } from 'chai';
import { ObsidianAppPage } from '../pageobjects/ObsidianApp.page';

describe('Exocortex Plugin – Create Asset Modal with Dynamic Fields', () => {
  let app: ObsidianAppPage;

  before(async () => {
    app = new ObsidianAppPage();
    
    // Ensure workspace is ready
    await app.waitForWorkspaceReady();
    
    // Enable the plugin if not already enabled
    const isEnabled = await app.isPluginEnabled('exocortex');
    if (!isEnabled) {
      await app.enablePlugin('exocortex');
      // Wait for plugin to fully load
      await browser.pause(2000);
    }
    
    // Create test class and property files in the vault
    await setupTestOntology();
    
    // Wait for metadata cache to process the files
    await browser.pause(2000);
  });

  async function setupTestOntology() {
    // Create a custom class: ems__Task
    await browser.executeObsidian(({ app }) => {
      const taskClassContent = `---
exo__Instance_class: [[exo__Class]]
rdfs__label: Task
rdfs__subClassOf: [[exo__Asset]]
rdfs__comment: A task in the effort management system
---

# Task Class

Represents a task in the effort management system.`;

      app.vault.create('ems__Task.md', taskClassContent);
    });

    // Create properties for Task class
    await browser.executeObsidian(({ app }) => {
      const statusPropertyContent = `---
exo__Instance_class: [[exo__Property]]
rdfs__domain: [[ems__Task]]
rdfs__range: select
rdfs__label: Status
rdfs__comment: Current status of the task
exo__Property_options:
  - pending
  - in-progress
  - completed
  - cancelled
---

# Status Property`;

      app.vault.create('ems__status.md', statusPropertyContent);
    });

    await browser.executeObsidian(({ app }) => {
      const priorityPropertyContent = `---
exo__Instance_class: [[exo__Property]]
rdfs__domain: [[ems__Task]]
rdfs__range: select
rdfs__label: Priority
rdfs__comment: Priority level of the task
exo__Property_options:
  - low
  - medium
  - high
  - critical
---

# Priority Property`;

      app.vault.create('ems__priority.md', priorityPropertyContent);
    });

    await browser.executeObsidian(({ app }) => {
      const dueDatePropertyContent = `---
exo__Instance_class: [[exo__Property]]
rdfs__domain: [[ems__Task]]
rdfs__range: date
rdfs__label: Due Date
rdfs__comment: When the task is due
---

# Due Date Property`;

      app.vault.create('ems__dueDate.md', dueDatePropertyContent);
    });

    // Create a Person class for testing class switching
    await browser.executeObsidian(({ app }) => {
      const personClassContent = `---
exo__Instance_class: [[exo__Class]]
rdfs__label: Person
rdfs__subClassOf: [[exo__Asset]]
rdfs__comment: A person entity
---

# Person Class`;

      app.vault.create('exo__Person.md', personClassContent);
    });

    // Create properties for Person class
    await browser.executeObsidian(({ app }) => {
      const firstNamePropertyContent = `---
exo__Instance_class: [[exo__Property]]
rdfs__domain: [[exo__Person]]
rdfs__range: string
rdfs__label: First Name
rdfs__comment: Person's first name
---

# First Name Property`;

      app.vault.create('exo__firstName.md', firstNamePropertyContent);
    });

    await browser.executeObsidian(({ app }) => {
      const lastNamePropertyContent = `---
exo__Instance_class: [[exo__Property]]
rdfs__domain: [[exo__Person]]
rdfs__range: string
rdfs__label: Last Name
rdfs__comment: Person's last name
---

# Last Name Property`;

      app.vault.create('exo__lastName.md', lastNamePropertyContent);
    });
    
    // Wait for metadata cache to update
    await browser.pause(1000);
  }

  it.skip('should open Create Asset modal via command palette', async () => {
    // Open command palette
    await browser.keys(['Meta', 'p']); // Cmd+P on Mac
    await browser.pause(500);

    // Type command name
    const commandInput = await $('.prompt-input');
    await commandInput.setValue('Create new ExoAsset');
    await browser.pause(500);

    // Press Enter to execute command
    await browser.keys(['Enter']);
    await browser.pause(500);

    // Verify modal is open
    const modalExists = await browser.executeObsidian(() => {
      const modal = document.querySelector('.modal');
      const h2 = modal?.querySelector('h2');
      console.log('Modal h2 text:', h2?.textContent);
      return modal !== null && h2?.textContent === 'Create ExoAsset';
    });

    expect(modalExists).to.be.true;
  });

  it('should display title input field', async () => {
    const titleFieldExists = await browser.executeObsidian(() => {
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Title') {
          const input = setting.querySelector('input[type="text"]');
          return input !== null;
        }
      }
      return false;
    });

    expect(titleFieldExists).to.be.true;
  });

  it('should display class dropdown with available classes', async () => {
    const classOptions = await browser.executeObsidian(() => {
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Class') {
          const select = setting.querySelector('select');
          if (select) {
            const options = Array.from(select.options).map(opt => ({
              value: opt.value,
              text: opt.text
            }));
            return options;
          }
        }
      }
      return [];
    });

    expect(classOptions).to.be.an('array');
    expect(classOptions.length).to.be.greaterThan(0);
    
    // Should include our custom Task class
    const hasTaskClass = classOptions.some(opt => 
      opt.value === 'ems__Task' || opt.text === 'Task'
    );
    expect(hasTaskClass).to.be.true;
    
    // Should include Person class
    const hasPersonClass = classOptions.some(opt => 
      opt.value === 'exo__Person' || opt.text === 'Person'
    );
    expect(hasPersonClass).to.be.true;
  });

  it('should display properties section', async () => {
    const propertiesSectionExists = await browser.executeObsidian(() => {
      const headers = document.querySelectorAll('.modal h3');
      for (const header of headers) {
        if (header.textContent === 'Properties') {
          return true;
        }
      }
      return false;
    });

    expect(propertiesSectionExists).to.be.true;
  });

  it('should update properties dynamically when Task class is selected', async () => {
    // Select Task class
    await browser.executeObsidian(() => {
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Class') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) {
            select.value = 'ems__Task';
            select.dispatchEvent(new Event('change'));
          }
        }
      }
    });

    // Wait for properties to update
    await browser.pause(1000);

    // Check if Task properties are displayed
    const taskProperties = await browser.executeObsidian(() => {
      const propertyContainer = document.querySelector('.exocortex-properties-container');
      if (!propertyContainer) return [];
      
      const properties = [];
      const settings = propertyContainer.querySelectorAll('.setting-item');
      
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl) {
          properties.push(nameEl.textContent);
        }
      }
      
      return properties;
    });

    expect(taskProperties).to.include('Status');
    expect(taskProperties).to.include('Priority');
    expect(taskProperties).to.include('Due Date');
  });

  it('should show dropdown for Status property with correct options', async () => {
    const statusOptions = await browser.executeObsidian(() => {
      const propertyContainer = document.querySelector('.exocortex-properties-container');
      if (!propertyContainer) return [];
      
      const settings = propertyContainer.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Status') {
          const select = setting.querySelector('select');
          if (select) {
            return Array.from(select.options).map(opt => opt.value);
          }
        }
      }
      return [];
    });

    expect(statusOptions).to.include('pending');
    expect(statusOptions).to.include('in-progress');
    expect(statusOptions).to.include('completed');
    expect(statusOptions).to.include('cancelled');
  });

  it('should show date picker for Due Date property', async () => {
    const hasDatePicker = await browser.executeObsidian(() => {
      const propertyContainer = document.querySelector('.exocortex-properties-container');
      if (!propertyContainer) return false;
      
      const settings = propertyContainer.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Due Date') {
          const dateInput = setting.querySelector('input[type="date"]');
          return dateInput !== null;
        }
      }
      return false;
    });

    expect(hasDatePicker).to.be.true;
  });

  it('should switch properties when changing from Task to Person class', async () => {
    // Select Person class
    await browser.executeObsidian(() => {
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Class') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) {
            select.value = 'exo__Person';
            select.dispatchEvent(new Event('change'));
          }
        }
      }
    });

    // Wait for properties to update
    await browser.pause(1000);

    // Check if Person properties are displayed
    const personProperties = await browser.executeObsidian(() => {
      const propertyContainer = document.querySelector('.exocortex-properties-container');
      if (!propertyContainer) return [];
      
      const properties = [];
      const settings = propertyContainer.querySelectorAll('.setting-item');
      
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl) {
          properties.push(nameEl.textContent);
        }
      }
      
      return properties;
    });

    expect(personProperties).to.include('First Name');
    expect(personProperties).to.include('Last Name');
    
    // Should not have Task properties
    expect(personProperties).to.not.include('Status');
    expect(personProperties).to.not.include('Priority');
    expect(personProperties).to.not.include('Due Date');
  });

  it('should preserve input values when switching back to Task class', async () => {
    // First, set some values for Task
    await browser.executeObsidian(() => {
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Class') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) {
            select.value = 'ems__Task';
            select.dispatchEvent(new Event('change'));
          }
        }
      }
    });

    await browser.pause(500);

    // Set values for Task properties
    await browser.executeObsidian(() => {
      const propertyContainer = document.querySelector('.exocortex-properties-container');
      if (!propertyContainer) return;
      
      const settings = propertyContainer.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Status') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) select.value = 'in-progress';
        }
        if (nameEl?.textContent === 'Priority') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) select.value = 'high';
        }
      }
    });

    // Switch to Person
    await browser.executeObsidian(() => {
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Class') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) {
            select.value = 'exo__Person';
            select.dispatchEvent(new Event('change'));
          }
        }
      }
    });

    await browser.pause(500);

    // Switch back to Task
    await browser.executeObsidian(() => {
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Class') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) {
            select.value = 'ems__Task';
            select.dispatchEvent(new Event('change'));
          }
        }
      }
    });

    await browser.pause(500);

    // Check if values are preserved
    const preservedValues = await browser.executeObsidian(() => {
      const propertyContainer = document.querySelector('.exocortex-properties-container');
      if (!propertyContainer) return {};
      
      const values: Record<string, string> = {};
      const settings = propertyContainer.querySelectorAll('.setting-item');
      
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Status') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) values.status = select.value;
        }
        if (nameEl?.textContent === 'Priority') {
          const select = setting.querySelector('select') as HTMLSelectElement;
          if (select) values.priority = select.value;
        }
      }
      
      return values;
    });

    expect(preservedValues.status).to.equal('in-progress');
    expect(preservedValues.priority).to.equal('high');
  });

  it('should create asset with correct metadata when form is submitted', async () => {
    // Fill in the form
    await browser.executeObsidian(() => {
      // Set title
      const settings = document.querySelectorAll('.setting-item');
      for (const setting of settings) {
        const nameEl = setting.querySelector('.setting-item-name');
        if (nameEl?.textContent === 'Title') {
          const input = setting.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) input.value = 'Test Task Asset';
        }
      }
      
      // Set Task properties
      const propertyContainer = document.querySelector('.exocortex-properties-container');
      if (propertyContainer) {
        const propSettings = propertyContainer.querySelectorAll('.setting-item');
        for (const setting of propSettings) {
          const nameEl = setting.querySelector('.setting-item-name');
          if (nameEl?.textContent === 'Status') {
            const select = setting.querySelector('select') as HTMLSelectElement;
            if (select) select.value = 'pending';
          }
          if (nameEl?.textContent === 'Priority') {
            const select = setting.querySelector('select') as HTMLSelectElement;
            if (select) select.value = 'medium';
          }
          if (nameEl?.textContent === 'Due Date') {
            const input = setting.querySelector('input[type="date"]') as HTMLInputElement;
            if (input) input.value = '2025-12-31';
          }
        }
      }
    });

    // Click Create button
    await browser.executeObsidian(() => {
      const createButton = document.querySelector('.modal button.mod-cta');
      if (createButton) {
        (createButton as HTMLButtonElement).click();
      }
    });

    await browser.pause(1000);

    // Verify file was created with correct metadata
    const fileContent = await browser.executeObsidian(({ app }) => {
      const file = app.vault.getAbstractFileByPath('Test Task Asset.md');
      if (file && file instanceof app.vault.adapter.constructor) {
        return app.vault.read(file);
      }
      // Try to find the file
      const files = app.vault.getMarkdownFiles();
      const testFile = files.find((f: any) => f.basename === 'Test Task Asset');
      if (testFile) {
        return app.vault.read(testFile);
      }
      return null;
    });

    expect(fileContent).to.not.be.null;
    expect(fileContent).to.include('exo__Instance_class: [[ems__Task]]');
    expect(fileContent).to.include('ems__status: pending');
    expect(fileContent).to.include('ems__priority: medium');
    expect(fileContent).to.include('ems__dueDate: 2025-12-31');
  });

  after(async () => {
    // Clean up test files
    await browser.executeObsidian(({ app }) => {
      const filesToDelete = [
        'ems__Task.md',
        'ems__status.md',
        'ems__priority.md',
        'ems__dueDate.md',
        'exo__Person.md',
        'exo__firstName.md',
        'exo__lastName.md',
        'Test Task Asset.md'
      ];
      
      for (const fileName of filesToDelete) {
        const file = app.vault.getAbstractFileByPath(fileName);
        if (file) {
          app.vault.delete(file);
        }
      }
    });
  });
});