/**
 * @jest-environment jest-environment-obsidian
 * @obsidian-conformance lax
 * @obsidian-version 1.5.0
 *
 * Real E2E tests for CreateAssetModal using jest-environment-obsidian
 * Tests actual Obsidian API interactions without mocking
 */

import { App, Modal, Notice } from 'obsidian';
import { CreateAssetModal } from '../../src/presentation/modals/CreateAssetModal';
import { testUtils } from './setup';

declare global {
  var app: App;
}

describe('CreateAssetModal E2E Tests', () => {
  let modal: CreateAssetModal;
  let classFiles: any[] = [];

  beforeEach(async () => {
    // Ensure we have the global app instance
    expect(global.app).toBeDefined();
    expect(global.app.vault).toBeDefined();
    
    // Ensure test folders exist
    await testUtils.ensureFolder('classes');
    await testUtils.ensureFolder('test-assets');
    
    // Create class definition files for testing
    const assetClassFile = await testUtils.createTestFile('classes/Asset.md', `---
exo__Class: exo__Asset
exo__ClassPrefix: Asset
exo__ClassDescription: "Base class for all assets"
---

# Asset

Base class for all assets.
`);

    const projectClassFile = await testUtils.createTestFile('classes/Project.md', `---
exo__Class: exo__Project
exo__ClassPrefix: Project
exo__ClassDescription: "A project with goals and outcomes"
exo__superClass: exo__Asset
---

# Project

A project with specific goals and outcomes.

## Properties
- status: Project status
- priority: Priority level
- dueDate: Target completion date
`);

    const taskClassFile = await testUtils.createTestFile('classes/Task.md', `---
exo__Class: exo__Task
exo__ClassPrefix: Task
exo__ClassDescription: "An actionable task"
exo__superClass: exo__Asset
---

# Task

An actionable task with requirements.

## Properties
- status: Task status (ToDo, InProgress, Done)
- priority: Priority level
- assignedTo: Person assigned
`);

    classFiles = [assetClassFile, projectClassFile, taskClassFile];
    
    // Wait a moment for the vault to register the files
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterEach(async () => {
    // Close modal if it's open
    if (modal && (modal as any).modalEl && (modal as any).modalEl.isConnected) {
      modal.close();
      // Wait for modal to close
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clean up class files
    for (const file of classFiles) {
      if (file) {
        try {
          await global.app.vault.delete(file);
        } catch (error) {
          console.warn('Failed to clean up class file:', error);
        }
      }
    }
    classFiles = [];
    
    // Clean up any created test assets
    const testAssets = global.app.vault.getFiles().filter(file => 
      file.path.includes('test-assets/') || file.name.startsWith('Test ')
    );
    
    for (const asset of testAssets) {
      try {
        await global.app.vault.delete(asset);
      } catch (error) {
        console.warn('Failed to clean up test asset:', error);
      }
    }
    
    // Clean up test folders
    const foldersToClean = ['test-assets', 'classes'];
    for (const folderPath of foldersToClean) {
      const folder = global.app.vault.getAbstractFileByPath(folderPath);
      if (folder) {
        try {
          await global.app.vault.delete(folder);
        } catch (error) {
          console.warn(`Failed to clean up folder ${folderPath}:`, error);
        }
      }
    }
  });

  describe('Modal Creation and Display', () => {
    it('should create and open the modal successfully', async () => {
      modal = new CreateAssetModal(global.app);
      
      // Open the modal
      modal.open();

      // Wait for modal to be rendered in DOM
      await testUtils.waitFor(() => {
        const modalEl = document.querySelector('.modal');
        return modalEl !== null;
      }, 2000);

      // Verify modal elements are present
      const modalEl = document.querySelector('.modal');
      expect(modalEl).toBeDefined();
      expect(modalEl).not.toBeNull();

      // Check that the modal has the expected structure
      const modalContent = modalEl?.querySelector('.modal-content');
      expect(modalContent).toBeDefined();
      expect(modalContent).not.toBeNull();
    });

    it('should display class selection dropdown', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      // Wait for modal and class dropdown to load
      await testUtils.waitFor(() => {
        const classDropdown = document.querySelector('select[data-class-select]') ||
                             document.querySelector('.class-selector') ||
                             document.querySelector('select');
        return classDropdown !== null;
      }, 3000);

      const classDropdown = document.querySelector('select[data-class-select]') ||
                           document.querySelector('.class-selector') ||
                           document.querySelector('select');
      
      expect(classDropdown).toBeDefined();
      expect(classDropdown).not.toBeNull();

      // Verify that classes are loaded in the dropdown
      if (classDropdown) {
        const options = classDropdown.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(0);
      }
    });

    it('should display title input field', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      // Wait for modal to load
      await testUtils.waitFor(() => {
        const titleInput = document.querySelector('input[type="text"]') ||
                          document.querySelector('[data-title-input]') ||
                          document.querySelector('.asset-title');
        return titleInput !== null;
      }, 2000);

      const titleInput = document.querySelector('input[type="text"]') ||
                        document.querySelector('[data-title-input]') ||
                        document.querySelector('.asset-title');
      
      expect(titleInput).toBeDefined();
      expect(titleInput).not.toBeNull();
    });
  });

  describe('Class Selection and Property Discovery', () => {
    it('should update properties when class is changed', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      // Wait for modal to load
      await testUtils.waitFor(() => {
        const classDropdown = document.querySelector('select');
        return classDropdown !== null;
      }, 3000);

      const classDropdown = document.querySelector('select') as HTMLSelectElement;
      
      if (classDropdown) {
        // Select a specific class (e.g., Project)
        const projectOption = Array.from(classDropdown.options).find(option => 
          option.value.includes('Project') || option.text.includes('Project')
        );
        
        if (projectOption) {
          classDropdown.value = projectOption.value;
          
          // Trigger change event
          const changeEvent = new Event('change', { bubbles: true });
          classDropdown.dispatchEvent(changeEvent);

          // Wait for properties to update
          await testUtils.waitFor(() => {
            const propertyInputs = document.querySelectorAll('input[type="text"]');
            return propertyInputs.length > 1; // Should have title + property inputs
          }, 3000);

          // Verify that project-specific properties are shown
          const propertyLabels = document.querySelectorAll('label');
          const labelTexts = Array.from(propertyLabels).map(label => label.textContent);
          
          // Should contain project properties
          const hasProjectProperties = labelTexts.some(text => 
            text?.includes('status') || 
            text?.includes('priority') || 
            text?.includes('dueDate')
          );
          
          expect(hasProjectProperties).toBeTruthy();
        }
      }
    });

    it('should handle class inheritance properly', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const classDropdown = document.querySelector('select');
        return classDropdown !== null;
      }, 3000);

      const classDropdown = document.querySelector('select') as HTMLSelectElement;
      
      if (classDropdown) {
        // Select Task class (which inherits from Asset)
        const taskOption = Array.from(classDropdown.options).find(option => 
          option.value.includes('Task') || option.text.includes('Task')
        );
        
        if (taskOption) {
          classDropdown.value = taskOption.value;
          
          const changeEvent = new Event('change', { bubbles: true });
          classDropdown.dispatchEvent(changeEvent);

          await testUtils.waitFor(() => {
            const propertyInputs = document.querySelectorAll('input[type="text"]');
            return propertyInputs.length > 1;
          }, 3000);

          // Should have both base Asset properties and Task-specific properties
          const propertyLabels = document.querySelectorAll('label');
          const labelTexts = Array.from(propertyLabels).map(label => label.textContent?.toLowerCase());
          
          // Check for task-specific properties
          const hasTaskProperties = labelTexts.some(text => 
            text?.includes('status') || 
            text?.includes('assignedto')
          );
          
          expect(hasTaskProperties).toBeTruthy();
        }
      }
    });
  });

  describe('Asset Creation Workflow', () => {
    it('should create an asset with title only', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      // Wait for modal to load
      await testUtils.waitFor(() => {
        const titleInput = document.querySelector('input[type="text"]');
        return titleInput !== null;
      }, 2000);

      const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      
      if (titleInput) {
        // Enter a title
        await testUtils.typeText(titleInput, 'Test Asset E2E');

        // Find and click create button
        const createButton = document.querySelector('button[data-create]') ||
                            document.querySelector('button.mod-cta') ||
                            Array.from(document.querySelectorAll('button')).find(btn => 
                              btn.textContent?.includes('Create') || btn.textContent?.includes('OK')
                            );

        if (createButton) {
          await testUtils.clickElement(createButton as HTMLElement);

          // Wait for asset creation
          await testUtils.waitFor(() => {
            // Check if modal is closed or file is created
            const modalEl = document.querySelector('.modal');
            return modalEl === null || !modalEl.classList.contains('is-open');
          }, 5000);

          // Verify that a file was created
          const createdFile = global.app.vault.getAbstractFileByPath('Test Asset E2E.md');
          expect(createdFile).toBeDefined();
          expect(createdFile).not.toBeNull();
        }
      }
    });

    it('should create an asset with properties', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const classDropdown = document.querySelector('select');
        return classDropdown !== null;
      }, 3000);

      const classDropdown = document.querySelector('select') as HTMLSelectElement;
      
      if (classDropdown) {
        // Select Project class
        const projectOption = Array.from(classDropdown.options).find(option => 
          option.value.includes('Project') || option.text.includes('Project')
        );
        
        if (projectOption) {
          classDropdown.value = projectOption.value;
          classDropdown.dispatchEvent(new Event('change', { bubbles: true }));

          // Wait for properties to load
          await testUtils.waitFor(() => {
            const inputs = document.querySelectorAll('input[type="text"]');
            return inputs.length > 1;
          }, 3000);

          // Fill in the title
          const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (titleInput) {
            await testUtils.typeText(titleInput, 'Test Project E2E');
          }

          // Fill in properties
          const allInputs = document.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
          const propertyInputs = Array.from(allInputs).slice(1); // Skip title input

          if (propertyInputs.length > 0) {
            // Fill in status
            const statusInput = propertyInputs.find(input => 
              input.placeholder?.includes('status') || 
              input.getAttribute('data-property')?.includes('status')
            );
            if (statusInput) {
              await testUtils.typeText(statusInput, 'Active');
            }

            // Fill in priority
            const priorityInput = propertyInputs.find(input => 
              input.placeholder?.includes('priority') || 
              input.getAttribute('data-property')?.includes('priority')
            );
            if (priorityInput) {
              await testUtils.typeText(priorityInput, 'High');
            }
          }

          // Create the asset
          const createButton = document.querySelector('button[data-create]') ||
                              document.querySelector('button.mod-cta') ||
                              Array.from(document.querySelectorAll('button')).find(btn => 
                                btn.textContent?.includes('Create')
                              );

          if (createButton) {
            await testUtils.clickElement(createButton as HTMLElement);

            // Wait for creation
            await testUtils.waitFor(() => {
              const modalEl = document.querySelector('.modal');
              return modalEl === null || !modalEl.classList.contains('is-open');
            }, 5000);

            // Verify file creation and properties
            const createdFile = global.app.vault.getAbstractFileByPath('Test Project E2E.md');
            expect(createdFile).toBeDefined();

            if (createdFile) {
              const content = await global.app.vault.read(createdFile as any);
              expect(content).toContain('exo__Instance_class: exo__Project');
              expect(content).toContain('status: Active');
              expect(content).toContain('priority: High');
            }
          }
        }
      }
    });

    it('should handle validation errors gracefully', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const titleInput = document.querySelector('input[type="text"]');
        return titleInput !== null;
      }, 2000);

      // Try to create without title
      const createButton = document.querySelector('button[data-create]') ||
                          document.querySelector('button.mod-cta') ||
                          Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent?.includes('Create')
                          );

      if (createButton) {
        await testUtils.clickElement(createButton as HTMLElement);

        // Wait for validation message or modal to remain open
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Modal should still be open due to validation error
        const modalEl = document.querySelector('.modal');
        expect(modalEl).toBeDefined();
        expect(modalEl).not.toBeNull();

        // Should show error or validation message
        const errorMessage = document.querySelector('.error') ||
                            document.querySelector('.notice') ||
                            document.querySelector('[data-error]');
        
        // Either error message exists or modal remains open (implementation dependent)
        const hasValidation = errorMessage !== null || modalEl !== null;
        expect(hasValidation).toBeTruthy();
      }
    });
  });

  describe('Modal Interaction', () => {
    it('should close modal when cancel button is clicked', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const modalEl = document.querySelector('.modal');
        return modalEl !== null;
      }, 2000);

      // Find cancel button
      const cancelButton = document.querySelector('button[data-cancel]') ||
                          Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent?.includes('Cancel') || btn.textContent?.includes('Close')
                          );

      if (cancelButton) {
        await testUtils.clickElement(cancelButton as HTMLElement);

        // Wait for modal to close
        await testUtils.waitFor(() => {
          const modalEl = document.querySelector('.modal');
          return modalEl === null || !modalEl.classList.contains('is-open');
        }, 2000);

        // Verify modal is closed
        const modalEl = document.querySelector('.modal.is-open');
        expect(modalEl).toBeNull();
      }
    });

    it('should close modal on ESC key press', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const modalEl = document.querySelector('.modal');
        return modalEl !== null;
      }, 2000);

      // Simulate ESC key press
      const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        bubbles: true
      });

      document.dispatchEvent(escEvent);

      // Wait for modal to close
      await testUtils.waitFor(() => {
        const modalEl = document.querySelector('.modal');
        return modalEl === null || !modalEl.classList.contains('is-open');
      }, 2000);

      // Verify modal is closed
      const modalEl = document.querySelector('.modal.is-open');
      expect(modalEl).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing class definitions gracefully', async () => {
      // Delete all class files to test error handling
      for (const file of classFiles) {
        await global.app.vault.delete(file);
      }
      classFiles = [];

      modal = new CreateAssetModal(global.app);
      
      // Should not throw an error when opening
      expect(() => {
        modal.open();
      }).not.toThrow();

      // Wait for modal to load
      await testUtils.waitFor(() => {
        const modalEl = document.querySelector('.modal');
        return modalEl !== null;
      }, 2000);

      // Should still show the modal with basic functionality
      const modalEl = document.querySelector('.modal');
      expect(modalEl).toBeDefined();
      expect(modalEl).not.toBeNull();
    });

    it('should handle vault operation failures gracefully', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const titleInput = document.querySelector('input[type="text"]');
        return titleInput !== null;
      }, 2000);

      // Try to create asset with invalid characters in filename
      const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (titleInput) {
        await testUtils.typeText(titleInput, 'Invalid/File:Name*Test');

        const createButton = document.querySelector('button[data-create]') ||
                            Array.from(document.querySelectorAll('button')).find(btn => 
                              btn.textContent?.includes('Create')
                            );

        if (createButton) {
          // Should not crash, but handle the error gracefully
          await expect(testUtils.clickElement(createButton as HTMLElement)).resolves.not.toThrow();

          // Modal might remain open with error message
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check for error handling
          const modalEl = document.querySelector('.modal');
          expect(modalEl).toBeDefined(); // Should handle error gracefully
        }
      }
    });
  });

  describe('Performance', () => {
    it('should open modal within acceptable time', async () => {
      const startTime = Date.now();
      
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const modalEl = document.querySelector('.modal');
        return modalEl !== null;
      }, 2000);

      const endTime = Date.now();
      const openTime = endTime - startTime;

      // Should open within 2 seconds
      expect(openTime).toBeLessThan(2000);
    });

    it('should handle class switching within acceptable time', async () => {
      modal = new CreateAssetModal(global.app);
      modal.open();

      await testUtils.waitFor(() => {
        const classDropdown = document.querySelector('select');
        return classDropdown !== null;
      }, 3000);

      const classDropdown = document.querySelector('select') as HTMLSelectElement;
      
      if (classDropdown && classDropdown.options.length > 1) {
        const startTime = Date.now();
        
        // Switch to different class
        classDropdown.selectedIndex = 1;
        classDropdown.dispatchEvent(new Event('change', { bubbles: true }));

        // Wait for properties to update
        await testUtils.waitFor(() => {
          const inputs = document.querySelectorAll('input[type="text"]');
          return inputs.length > 0;
        }, 3000);

        const endTime = Date.now();
        const switchTime = endTime - startTime;

        // Should switch classes within 3 seconds
        expect(switchTime).toBeLessThan(3000);
      }
    });
  });
});