import { WorkspacePage } from './WorkspacePage';

/**
 * Page Object for DynamicLayout component testing
 * Simplified for core functionality using browser.executeObsidian
 */
export class DynamicLayoutPage extends WorkspacePage {
  // Extended selectors specific to DynamicLayout
  private dynamicLayoutSelectors = {
    dynamicLayout: '.exocortex-dynamic-layout',
    layoutBlock: '.exocortex-layout-block',
    propertyBlock: '.exocortex-property-block',
    buttonBlock: '.exocortex-button-block',
    queryBlock: '.exocortex-query-block',
    backlinksBlock: '.exocortex-backlinks-block',
    instancesBlock: '.exocortex-instances-block',
    childrenBlock: '.exocortex-children-block',
    relationBlock: '.exocortex-relation-block',
    loadingSpinner: '.exocortex-loading',
    errorMessage: '.exocortex-error'
  };

  /**
   * Wait for dynamic layout to render
   */
  async waitForDynamicLayout(): Promise<WebdriverIO.Element> {
    const layout = await this.waitForElement(this.dynamicLayoutSelectors.dynamicLayout, 10000);
    await browser.pause(1000); // Allow layout to stabilize
    return layout;
  }

  /**
   * Get layout blocks info
   */
  async getLayoutBlocksInfo(): Promise<any[]> {
    return await browser.executeObsidian(() => {
      return Array.from(document.querySelectorAll('.exocortex-layout-block')).map(block => ({
        type: block.getAttribute('data-block-type'),
        visible: !block.hidden && block.offsetParent !== null,
        hasContent: block.children.length > 0
      }));
    }) || [];
  }

  /**
   * Get layout block by type
   */
  async getLayoutBlockByType(blockType: string): Promise<WebdriverIO.Element | null> {
    const blocks = await this.getLayoutBlocks();
    
    for (const block of blocks) {
      const type = await block.getAttribute('data-block-type');
      if (type === blockType) {
        return block;
      }
    }
    
    return null;
  }

  /**
   * Check if specific layout block exists and is visible
   */
  async hasLayoutBlock(blockType: string): Promise<boolean> {
    return await browser.executeObsidian((_, blockType) => {
      const block = document.querySelector(`[data-block-type="${blockType}"]`);
      return block && !block.hidden && block.offsetParent !== null;
    }, blockType) || false;
  }

  /**
   * Get properties from layout
   */
  async getPropertiesFromLayout(): Promise<any[]> {
    return await browser.executeObsidian(() => {
      return Array.from(document.querySelectorAll('.exocortex-property-item')).map(prop => ({
        name: prop.querySelector('.property-name')?.textContent?.trim() || '',
        value: prop.querySelector('.property-value')?.textContent?.trim() || '',
        type: prop.getAttribute('data-property-type') || 'text'
      }));
    }) || [];
  }

  /**
   * Get buttons from layout
   */
  async getButtonsFromLayout(): Promise<any[]> {
    return await browser.executeObsidian(() => {
      return Array.from(document.querySelectorAll('.exocortex-button')).map(btn => ({
        text: btn.textContent?.trim() || '',
        command: btn.getAttribute('data-command') || '',
        enabled: !(btn as HTMLButtonElement).disabled
      }));
    }) || [];
  }

  /**
   * Click button in layout
   */
  async clickLayoutButton(buttonText: string): Promise<void> {
    const clicked = await browser.executeObsidian((_, buttonText) => {
      const button = Array.from(document.querySelectorAll('.exocortex-button'))
        .find(btn => btn.textContent?.trim() === buttonText);
      if (button) {
        (button as HTMLElement).click();
        return true;
      }
      return false;
    }, buttonText);
    
    if (!clicked) {
      throw new Error(`Button with text "${buttonText}" not found`);
    }
  }

  /**
   * Get query block results
   */
  async getQueryBlockResults(): Promise<any[]> {
    const queryBlock = await this.getLayoutBlockByType('query');
    if (!queryBlock) {
      return []; // Query block is optional
    }

    const results = await queryBlock.$$('.exocortex-query-result');
    const resultData = [];

    for (const result of results) {
      const title = await result.$('.result-title').getText();
      const link = await result.$('.result-link').getAttribute('href');
      
      resultData.push({ title, link });
    }

    return resultData;
  }

  /**
   * Get backlinks from layout
   */
  async getBacklinksFromLayout(): Promise<any[]> {
    const backlinksBlock = await this.getLayoutBlockByType('backlinks');
    if (!backlinksBlock) {
      return []; // Backlinks block might not exist
    }

    const backlinks = await backlinksBlock.$$('.exocortex-backlink');
    const backlinkData = [];

    for (const backlink of backlinks) {
      const title = await backlink.$('.backlink-title').getText();
      const path = await backlink.getAttribute('data-path');
      
      backlinkData.push({ title, path });
    }

    return backlinkData;
  }

  /**
   * Verify core layout structure
   */
  async verifyLayoutStructure(expectedBlocks: string[]): Promise<boolean> {
    const blocks = await this.getLayoutBlocksInfo();
    const actualTypes = blocks.filter(b => b.visible).map(b => b.type);
    
    return expectedBlocks.every(expected => actualTypes.includes(expected));
  }

  /**
   * Wait for layout to finish loading
   */
  async waitForLayoutToLoad(): Promise<void> {
    await browser.waitUntil(
      async () => {
        const isLoading = await browser.executeObsidian(
          () => document.querySelector(".exocortex-loading")?.offsetParent !== null
        );
        return !isLoading;
      },
      {
        timeout: 10000,
        timeoutMsg: 'Layout is still loading after timeout'
      }
    );
  }

  /**
   * Check for layout errors
   */
  async hasLayoutErrors(): Promise<boolean> {
    const errorMessages = await $$(this.dynamicLayoutSelectors.errorMessage);
    
    for (const error of errorMessages) {
      if (await error.isDisplayed()) {
        const errorText = await error.getText();
        console.log(`Layout error found: ${errorText}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get basic layout metrics
   */
  async getLayoutMetrics(): Promise<any> {
    return await browser.executeObsidian(() => {
      const blocks = document.querySelectorAll('.exocortex-layout-block');
      return {
        totalBlocks: blocks.length,
        visibleBlocks: Array.from(blocks).filter(b => b.offsetParent !== null).length,
        hasContent: blocks.length > 0
      };
    }) || { totalBlocks: 0, visibleBlocks: 0, hasContent: false };
  }

  /**
   * Simple layout refresh
   */
  async refreshLayout(): Promise<void> {
    await browser.executeObsidian(
      ({app}) => {
        const plugin = app.plugins.plugins["exocortex-obsidian-plugin"];
        return plugin?.layoutRenderer?.refresh();
      }
    );
    await this.waitForLayoutToLoad();
  }

  /**
   * Get rendered layout configuration
   */
  async getLayoutConfiguration(): Promise<any> {
    return await browser.executeObsidian(({app}) => {
      const plugin = app.plugins.plugins['exocortex-obsidian-plugin'];
      if (!plugin || !plugin.currentLayoutConfig) {
        return null;
      }
      
      return plugin.currentLayoutConfig;
    });
  }
}