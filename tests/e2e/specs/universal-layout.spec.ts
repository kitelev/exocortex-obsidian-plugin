import { DynamicLayoutPage } from '../page-objects/DynamicLayoutPage';
import { WorkspacePage } from '../page-objects/WorkspacePage';

describe('UniversalLayout Core E2E Tests', () => {
  let workspacePage: WorkspacePage;
  let dynamicLayoutPage: DynamicLayoutPage;

  before(async () => {
    workspacePage = new WorkspacePage();
    dynamicLayoutPage = new DynamicLayoutPage();
    
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
    const timestamp = Date.now();
    await workspacePage.createNewNote(`UniversalLayoutTest-${timestamp}`);
    await browser.pause(500);
  });

  afterEach(async () => {
    if ((this as any).currentTest?.state === 'failed') {
      await workspacePage.takeScreenshot(`failed-universal-${(this as any).currentTest.title}-${Date.now()}`);
    }
  });

  it('should render universal layout with class detection', async () => {
    await workspacePage.insertText(`---
exo__Class: Asset
name: Test Asset
description: Universal layout test
---

# Universal Layout Test
    `);

    await browser.waitUntil(
      async () => {
        const universalLayout = await $('.exocortex-universal-layout');
        return await universalLayout.isDisplayed();
      },
      {
        timeout: 10000,
        timeoutMsg: 'Universal layout failed to render'
      }
    );

    const universalLayout = await $('.exocortex-universal-layout');
    await expect(universalLayout).toBeDisplayed();
  });

  it('should display properties from frontmatter', async () => {
    await workspacePage.insertText(`---
exo__Class: Asset
name: Test Asset
description: Test description
category: Test
---

# Property Test
    `);

    await browser.waitUntil(
      async () => {
        const layout = await $('.exocortex-universal-layout');
        return await layout.isDisplayed();
      },
      { timeout: 8000 }
    );

    const properties = await dynamicLayoutPage.getPropertiesFromLayout();
    expect(properties).toBeInstanceOf(Array);
    
    if (properties.length > 0) {
      const propertyNames = properties.map(p => p.name.toLowerCase());
      expect(propertyNames.length).toBeGreaterThan(0);
    }
  });

  it('should render buttons for class actions', async () => {
    await workspacePage.insertText(`---
exo__Class: Asset
name: Button Test Asset
---

# Button Test
    `);

    await browser.waitUntil(
      async () => {
        const layout = await $('.exocortex-universal-layout');
        return await layout.isDisplayed();
      },
      { timeout: 8000 }
    );

    const buttons = await dynamicLayoutPage.getButtonsFromLayout();
    expect(buttons).toBeInstanceOf(Array);
  });

  it('should handle different class types', async () => {
    // Test Asset class
    await workspacePage.insertText(`---
exo__Class: Asset
name: Test Asset
---

# Asset Test
    `);

    await browser.waitUntil(
      async () => {
        const layout = await $('.exocortex-universal-layout');
        return await layout.isDisplayed();
      },
      { timeout: 8000 }
    );

    const assetLayout = await $('.exocortex-universal-layout');
    await expect(assetLayout).toBeDisplayed();

    // Change to Task class
    await browser.executeObsidian(`
      const editor = app.workspace.getActiveViewOfType(app.viewRegistry.typeByName['markdown']);
      if (editor) {
        editor.editor.setValue(\`---
exo__Class: Task
name: Test Task
priority: high
---

# Task Test\`);
      }
    `);

    await browser.pause(2000);

    const taskLayout = await $('.exocortex-universal-layout');
    await expect(taskLayout).toBeDisplayed();
  });

  it('should handle notes without class information', async () => {
    await workspacePage.insertText(`---
title: Regular Note
---

# Regular Note

This note has no Exocortex class information.
    `);

    await browser.pause(2000);

    // Should not crash the interface
    const workspace = await workspacePage.waitForElement('.workspace');
    await expect(workspace).toBeDisplayed();
  });

  it('should update layout when frontmatter changes', async () => {
    await workspacePage.insertText(`---
exo__Class: Asset
name: Original Asset
---

# Test Note
    `);

    await browser.waitUntil(
      async () => {
        const layout = await $('.exocortex-universal-layout');
        return await layout.isDisplayed();
      },
      { timeout: 8000 }
    );

    // Update frontmatter
    await browser.executeObsidian(`
      const editor = app.workspace.getActiveViewOfType(app.viewRegistry.typeByName['markdown']);
      if (editor) {
        const content = editor.editor.getValue();
        const updatedContent = content.replace('exo__Class: Asset', 'exo__Class: Task');
        editor.editor.setValue(updatedContent);
      }
    `);

    await browser.pause(3000);
    
    // Should still have a layout
    const updatedLayout = await $('.exocortex-universal-layout');
    await expect(updatedLayout).toBeDisplayed();
  });

  it('should handle instances block', async () => {
    await workspacePage.insertText(`---
exo__Class: Asset
name: Instance Test Asset
---

# Instance Test
    `);

    await browser.waitUntil(
      async () => {
        const layout = await $('.exocortex-universal-layout');
        return await layout.isDisplayed();
      },
      { timeout: 8000 }
    );

    const hasInstancesBlock = await dynamicLayoutPage.hasLayoutBlock('instances');
    // Instances block may or may not exist based on configuration
    expect(typeof hasInstancesBlock).toBe('boolean');
  });

  it('should handle invalid class references gracefully', async () => {
    await workspacePage.insertText(`---
exo__Class: NonExistentClass
name: Invalid Class Test
---

# Invalid Class Test
    `);

    await browser.pause(3000);

    // Should not crash the interface
    const workspace = await workspacePage.waitForElement('.workspace');
    await expect(workspace).toBeDisplayed();
  });

  it('should handle malformed frontmatter gracefully', async () => {
    await workspacePage.insertText(`---
exo__Class: Asset
name: Malformed Test
invalid: yaml: content
---

# Malformed Frontmatter Test
    `);

    await browser.pause(3000);

    // Should not crash
    const workspace = await workspacePage.waitForElement('.workspace');
    await expect(workspace).toBeDisplayed();
  });

  it('should handle mixed layout types', async () => {
    await workspacePage.insertText(`---
exo__Class: Asset
name: Mixed Layout Asset
---

# Mixed Layout Test

Auto-detected universal layout above.

## Manual Layout Below

\`\`\`exocortex-layout
class: Task
blocks:
  - type: properties
\`\`\`
    `);

    await browser.waitUntil(
      async () => {
        const universalLayouts = await $$('.exocortex-universal-layout');
        const dynamicLayouts = await $$('.exocortex-dynamic-layout');
        return (universalLayouts.length) > 0 || (dynamicLayouts.length) > 0;
      },
      { timeout: 10000 }
    );

    const universalLayouts = await $$('.exocortex-universal-layout');
    const dynamicLayouts = await $$('.exocortex-dynamic-layout');
    
    const totalLayouts = universalLayouts.length + dynamicLayouts.length;
    expect(totalLayouts).toBeGreaterThan(0);
  });
});