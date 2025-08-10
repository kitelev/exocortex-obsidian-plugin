/**
 * Page Object for SPARQL code block interactions
 */
export class SparqlBlockPage {
  /**
   * Get all SPARQL result containers on the page
   */
  get resultContainers() {
    return $$('.exocortex-sparql-container');
  }

  /**
   * Get a specific SPARQL result container by index
   */
  async getResultContainer(index = 0) {
    const containers = await this.resultContainers;
    return containers[index];
  }

  /**
   * Wait for SPARQL results to appear
   */
  async waitForResults(timeout = 30000): Promise<void> {
    const isCI = process.env.CI === 'true';
    const actualTimeout = isCI ? Math.max(timeout, 30000) : timeout;
    
    console.log(`⏳ Waiting for SPARQL results (timeout: ${actualTimeout}ms, CI: ${isCI})...`);
    
    await (browser as any).waitUntil(
      async () => {
        try {
          const containers = await this.resultContainers;
          const count = await containers.length;
          if (count > 0) {
            console.log(`✅ Found ${count} SPARQL result container(s)`);
            return true;
          }
          return false;
        } catch (error: any) {
          console.warn('⏳ Still waiting for SPARQL results...', error.message);
          return false;
        }
      },
      {
        timeout: actualTimeout,
        interval: isCI ? 2000 : 1000,
        timeoutMsg: `SPARQL results container did not appear within ${actualTimeout}ms (CI: ${isCI})`
      }
    );
  }

  /**
   * Get the title text from a result container
   */
  async getResultTitle(containerIndex = 0): Promise<string> {
    const container = await this.getResultContainer(containerIndex);
    const title = await container.$('h3');
    return await title.getText();
  }

  /**
   * Get the query text from a result container
   */
  async getQueryText(containerIndex = 0): Promise<string> {
    const container = await this.getResultContainer(containerIndex);
    const queryPre = await container.$('pre');
    return await queryPre.getText();
  }

  /**
   * Check if results table exists
   */
  async hasResultsTable(containerIndex = 0): Promise<boolean> {
    const container = await this.getResultContainer(containerIndex);
    const table = await container.$('table');
    return await table.isExisting();
  }

  /**
   * Get table headers
   */
  async getTableHeaders(containerIndex = 0): Promise<string[]> {
    const container = await this.getResultContainer(containerIndex);
    const headers = await container.$$('thead th');
    const headerTexts: string[] = [];
    for (const header of headers) {
      headerTexts.push(await header.getText());
    }
    return headerTexts;
  }

  /**
   * Get all table rows data
   */
  async getTableRows(containerIndex = 0): Promise<string[][]> {
    const container = await this.getResultContainer(containerIndex);
    const rows = await container.$$('tbody tr');
    const rowData: string[][] = [];
    
    for (const row of rows) {
      const cells = await row.$$('td');
      const cellTexts: string[] = [];
      for (const cell of cells) {
        cellTexts.push(await cell.getText());
      }
      rowData.push(cellTexts);
    }
    
    return rowData;
  }

  /**
   * Get execution time text
   */
  async getExecutionTime(containerIndex = 0): Promise<string | null> {
    const container = await this.getResultContainer(containerIndex);
    const statsElements = await container.$$('div');
    
    for (const element of statsElements) {
      const text = await element.getText();
      if (text.includes('Executed in')) {
        return text;
      }
    }
    
    return null;
  }

  /**
   * Check if error message is displayed
   */
  async hasError(containerIndex = 0): Promise<boolean> {
    const container = await this.getResultContainer(containerIndex);
    const errorDiv = await container.$('div[style*="background: #ffebee"]');
    return await errorDiv.isExisting();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(containerIndex = 0): Promise<string | null> {
    const container = await this.getResultContainer(containerIndex);
    const errorDiv = await container.$('div[style*="background: #ffebee"]');
    
    if (await errorDiv.isExisting()) {
      return await errorDiv.getText();
    }
    
    return null;
  }

  /**
   * Check if "No results found" message is displayed
   */
  async hasNoResultsMessage(containerIndex = 0): Promise<boolean> {
    const container = await this.getResultContainer(containerIndex);
    const noResultsDiv = await container.$('div');
    const text = await noResultsDiv.getText();
    return text.includes('No results found');
  }

  /**
   * Click on a file link in results
   */
  async clickFileLink(fileName: string, containerIndex = 0): Promise<void> {
    const container = await this.getResultContainer(containerIndex);
    const links = await container.$$('a');
    
    for (const link of links) {
      const text = await link.getText();
      if (text.includes(fileName)) {
        await link.click();
        return;
      }
    }
    
    throw new Error(`File link "${fileName}" not found in results`);
  }

  /**
   * Get number of result rows
   */
  async getResultCount(containerIndex = 0): Promise<number> {
    const container = await this.getResultContainer(containerIndex);
    const rows = await container.$$('tbody tr');
    return rows.length;
  }

  /**
   * Verify container styling
   */
  async verifyContainerStyling(containerIndex = 0): Promise<{
    hasBorder: boolean;
    borderColor: string;
    backgroundColor: string;
  }> {
    const container = await this.getResultContainer(containerIndex);
    
    const style = await container.getAttribute('style');
    
    return {
      hasBorder: style?.includes('border:') || false,
      borderColor: style?.match(/border:.*?(#[0-9a-f]+)/i)?.[1] || '',
      backgroundColor: style?.match(/background:.*?(#[0-9a-f]+)/i)?.[1] || ''
    };
  }
}