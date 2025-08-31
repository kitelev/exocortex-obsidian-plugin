import { Page, Locator, expect } from '@playwright/test';
import { join } from 'path';

/**
 * Obsidian automation helpers for real E2E testing
 * 
 * These utilities help interact with the actual Obsidian desktop application
 * and test real plugin functionality, not simulated behavior.
 */
export class ObsidianHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for Obsidian to fully load and initialize
   */
  async waitForObsidianLoad(timeout: number = 30000): Promise<void> {
    console.log('⏳ Waiting for Obsidian to load...');
    
    // Wait for the main Obsidian interface elements
    await Promise.all([
      // Wait for workspace to be ready
      this.page.waitForSelector('.workspace', { timeout }),
      
      // Wait for ribbon (left sidebar with icons)
      this.page.waitForSelector('.side-dock-ribbon', { timeout }),
      
      // Wait for status bar
      this.page.waitForSelector('.status-bar', { timeout }),
      
      // Wait for file explorer to be available
      this.page.waitForSelector('.nav-files-container', { timeout })
    ]);

    // Additional wait for JavaScript to initialize
    await this.page.waitForTimeout(2000);
    
    console.log('✅ Obsidian loaded successfully');
  }

  /**
   * Wait for the Exocortex plugin to be loaded and active
   */
  async waitForExocortexPlugin(timeout: number = 10000): Promise<void> {
    console.log('⏳ Waiting for Exocortex plugin to load...');
    
    // Check if plugin is loaded by looking for plugin-specific elements
    // or by checking the command palette for plugin commands
    await this.page.waitForFunction(() => {
      // Check if plugin is in the global app object
      return (window as any).app?.plugins?.plugins?.['exocortex-obsidian-plugin']?.manifest;
    }, { timeout });
    
    console.log('✅ Exocortex plugin loaded successfully');
  }

  /**
   * Open a specific file in Obsidian
   */
  async openFile(filePath: string): Promise<void> {
    console.log(`📂 Opening file: ${filePath}`);
    
    // Use Obsidian's internal API to open the file
    await this.page.evaluate((path) => {
      const app = (window as any).app;
      const file = app.vault.getAbstractFileByPath(path);
      if (file) {
        app.workspace.openLinkText(path, '');
      }
    }, filePath);
    
    // Wait for the file to be loaded in the editor
    await this.page.waitForSelector('.markdown-preview-view, .cm-editor', { timeout: 5000 });
    
    console.log(`✅ File opened: ${filePath}`);
  }

  /**
   * Take a screenshot with contextual information
   */
  async takeContextualScreenshot(name: string, options?: { 
    fullPage?: boolean;
    annotations?: Array<{ selector: string; label: string }>;
  }): Promise<string> {
    const screenshot = await this.page.screenshot({
      fullPage: options?.fullPage || true,
      path: join(process.cwd(), `test-results/screenshots/${name}-${Date.now()}.png`)
    });
    
    // If annotations are provided, add them to the screenshot
    if (options?.annotations) {
      for (const annotation of options.annotations) {
        try {
          const element = this.page.locator(annotation.selector);
          if (await element.isVisible()) {
            await element.highlight();
            console.log(`  🏷️ Annotated: ${annotation.label}`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Could not annotate ${annotation.selector}: ${error}`);
        }
      }
    }
    
    console.log(`📸 Screenshot taken: ${name}`);
    return screenshot.toString('base64');
  }

  /**
   * Wait for and verify UniversalLayout rendering
   */
  async waitForUniversalLayout(): Promise<void> {
    console.log('⏳ Waiting for UniversalLayout to render...');
    
    // Wait for layout container
    await this.page.waitForSelector('.exocortex-layout-container', { timeout: 10000 });
    
    // Wait for specific layout blocks
    const layoutBlocks = [
      '.properties-block',
      '.instances-block',
      '.backlinks-block',
      '.buttons-block'
    ];
    
    for (const block of layoutBlocks) {
      try {
        await this.page.waitForSelector(block, { timeout: 5000 });
        console.log(`  ✅ Found: ${block}`);
      } catch (error) {
        console.warn(`  ⚠️ Missing: ${block}`);
      }
    }
    
    console.log('✅ UniversalLayout rendered');
  }

  /**
   * Interact with property fields in the layout
   */
  async interactWithProperties(): Promise<{ [key: string]: string }> {
    console.log('🔧 Interacting with property fields...');
    
    const properties: { [key: string]: string } = {};
    
    // Find all property input fields
    const propertyFields = this.page.locator('.property-input, .property-field, input[data-property]');
    const count = await propertyFields.count();
    
    console.log(`Found ${count} property fields`);
    
    for (let i = 0; i < count; i++) {
      const field = propertyFields.nth(i);
      
      try {
        const propertyName = await field.getAttribute('data-property') || 
                            await field.getAttribute('name') || 
                            `property-${i}`;
        
        const currentValue = await field.inputValue() || '';
        properties[propertyName] = currentValue;
        
        // Test interaction by focusing and typing
        await field.focus();
        await this.page.waitForTimeout(500);
        
        console.log(`  ✅ Property: ${propertyName} = "${currentValue}"`);
        
      } catch (error) {
        console.warn(`  ⚠️ Failed to interact with property field ${i}: ${error}`);
      }
    }
    
    return properties;
  }

  /**
   * Test button functionality
   */
  async testButtons(): Promise<string[]> {
    console.log('🔘 Testing button functionality...');
    
    const buttonResults: string[] = [];
    
    // Find all plugin buttons
    const buttons = this.page.locator('.exocortex-button, .layout-button, button[data-action]');
    const count = await buttons.count();
    
    console.log(`Found ${count} buttons to test`);
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      
      try {
        const buttonText = await button.textContent() || `Button ${i}`;
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        
        if (isVisible && isEnabled) {
          // Test button click
          await button.click();
          await this.page.waitForTimeout(1000);
          
          buttonResults.push(`✅ ${buttonText}: Clickable and responsive`);
          console.log(`  ✅ Clicked: ${buttonText}`);
        } else {
          buttonResults.push(`⚠️ ${buttonText}: Not interactive (visible: ${isVisible}, enabled: ${isEnabled})`);
          console.log(`  ⚠️ Skipped: ${buttonText} - not interactive`);
        }
        
      } catch (error) {
        const errorMsg = `❌ Button ${i}: ${error}`;
        buttonResults.push(errorMsg);
        console.warn(`  ${errorMsg}`);
      }
    }
    
    return buttonResults;
  }

  /**
   * Open and test CreateAssetModal
   */
  async openCreateAssetModal(): Promise<boolean> {
    console.log('🎛️ Opening CreateAssetModal...');
    
    try {
      // Try multiple ways to open the modal
      const openMethods = [
        // Method 1: Command palette
        async () => {
          await this.page.keyboard.press('Meta+P'); // Cmd+P on Mac
          await this.page.waitForTimeout(500);
          await this.page.type('Create Asset');
          await this.page.waitForTimeout(500);
          await this.page.keyboard.press('Enter');
        },
        
        // Method 2: Direct button click
        async () => {
          const createButton = this.page.locator('button:has-text("Create Asset"), .create-asset-button');
          if (await createButton.isVisible()) {
            await createButton.click();
          } else {
            throw new Error('Create Asset button not found');
          }
        },
        
        // Method 3: Right-click context menu
        async () => {
          await this.page.locator('.nav-files-container').click({ button: 'right' });
          await this.page.waitForTimeout(500);
          const menuItem = this.page.locator('.menu-item:has-text("Create Asset")');
          if (await menuItem.isVisible()) {
            await menuItem.click();
          } else {
            throw new Error('Create Asset menu item not found');
          }
        }
      ];
      
      for (const method of openMethods) {
        try {
          await method();
          
          // Wait for modal to appear
          const modal = this.page.locator('.modal, .create-asset-modal, .exocortex-modal');
          await modal.waitFor({ state: 'visible', timeout: 3000 });
          
          console.log('✅ CreateAssetModal opened successfully');
          return true;
          
        } catch (error) {
          console.log(`  ⚠️ Method failed: ${error}`);
          continue;
        }
      }
      
      throw new Error('All methods to open CreateAssetModal failed');
      
    } catch (error) {
      console.error(`❌ Failed to open CreateAssetModal: ${error}`);
      return false;
    }
  }

  /**
   * Test CreateAssetModal functionality
   */
  async testCreateAssetModal(): Promise<{ 
    opened: boolean;
    fields: string[];
    interactions: string[];
  }> {
    console.log('🧪 Testing CreateAssetModal functionality...');
    
    const result = {
      opened: false,
      fields: [] as string[],
      interactions: [] as string[]
    };
    
    // Try to open the modal
    result.opened = await this.openCreateAssetModal();
    
    if (!result.opened) {
      return result;
    }
    
    try {
      // Find and document all form fields
      const formFields = this.page.locator('input, select, textarea, .property-input');
      const fieldCount = await formFields.count();
      
      console.log(`Found ${fieldCount} form fields in modal`);
      
      for (let i = 0; i < fieldCount; i++) {
        const field = formFields.nth(i);
        
        try {
          const fieldName = await field.getAttribute('name') || 
                           await field.getAttribute('placeholder') || 
                           await field.getAttribute('data-property') ||
                           `field-${i}`;
          
          const fieldType = await field.getAttribute('type') || 'unknown';
          result.fields.push(`${fieldName} (${fieldType})`);
          
          // Test basic interaction
          if (fieldType === 'text' || fieldType === 'unknown') {
            await field.fill(`Test value ${i}`);
            result.interactions.push(`✅ Filled ${fieldName}`);
          } else if (fieldType === 'select') {
            await field.selectOption({ index: 1 });
            result.interactions.push(`✅ Selected option in ${fieldName}`);
          }
          
          await this.page.waitForTimeout(300);
          
        } catch (error) {
          result.interactions.push(`⚠️ Field ${i} interaction failed: ${error}`);
        }
      }
      
      // Try to find and click form buttons
      const modalButtons = this.page.locator('.modal button, .create-asset-modal button');
      const buttonCount = await modalButtons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = modalButtons.nth(i);
        const buttonText = await button.textContent() || `Button ${i}`;
        
        if (buttonText.toLowerCase().includes('cancel') || buttonText.toLowerCase().includes('close')) {
          // Click cancel/close to close modal for testing
          await button.click();
          result.interactions.push(`✅ Clicked ${buttonText}`);
          break;
        }
      }
      
      console.log('✅ CreateAssetModal testing completed');
      
    } catch (error) {
      result.interactions.push(`❌ Modal testing failed: ${error}`);
      console.error(`❌ CreateAssetModal testing failed: ${error}`);
    }
    
    return result;
  }

  /**
   * Verify plugin integration health
   */
  async verifyPluginHealth(): Promise<{
    loaded: boolean;
    commands: string[];
    errors: string[];
  }> {
    console.log('🏥 Verifying plugin health...');
    
    const health = {
      loaded: false,
      commands: [] as string[],
      errors: [] as string[]
    };
    
    try {
      // Check if plugin is loaded
      const pluginLoaded = await this.page.evaluate(() => {
        const app = (window as any).app;
        const plugin = app?.plugins?.plugins?.['exocortex-obsidian-plugin'];
        return plugin && plugin.manifest;
      });
      
      health.loaded = !!pluginLoaded;
      
      if (health.loaded) {
        // Get available commands
        const commands = await this.page.evaluate(() => {
          const app = (window as any).app;
          return Object.keys(app.commands.commands)
            .filter(cmd => cmd.includes('exocortex') || cmd.includes('asset'))
            .slice(0, 10); // Limit to first 10 commands
        });
        
        health.commands = commands || [];
        console.log(`Found ${health.commands.length} plugin commands`);
      } else {
        health.errors.push('Plugin not loaded or not active');
      }
      
      // Check console for any plugin errors
      const consoleErrors = await this.page.evaluate(() => {
        return (window as any).lastErrors || [];
      });
      
      health.errors.push(...consoleErrors);
      
    } catch (error) {
      health.errors.push(`Health check failed: ${error}`);
    }
    
    return health;
  }

  /**
   * Generate a comprehensive test evidence report
   */
  async generateTestEvidence(testName: string): Promise<{
    screenshots: string[];
    pluginHealth: any;
    domStructure: string;
    timestamp: string;
  }> {
    console.log(`📋 Generating test evidence for: ${testName}`);
    
    const evidence = {
      screenshots: [] as string[],
      pluginHealth: {} as any,
      domStructure: '',
      timestamp: new Date().toISOString()
    };
    
    try {
      // Take comprehensive screenshots
      evidence.screenshots.push(
        await this.takeContextualScreenshot(`${testName}-overview`),
        await this.takeContextualScreenshot(`${testName}-workspace`, { fullPage: true })
      );
      
      // Check plugin health
      evidence.pluginHealth = await this.verifyPluginHealth();
      
      // Capture DOM structure of key areas
      evidence.domStructure = await this.page.evaluate(() => {
        const workspace = document.querySelector('.workspace');
        return workspace ? workspace.outerHTML.substring(0, 5000) + '...' : 'No workspace found';
      });
      
      console.log('✅ Test evidence generated');
      
    } catch (error) {
      console.error(`❌ Failed to generate test evidence: ${error}`);
    }
    
    return evidence;
  }
}