import { expect } from 'chai';
import { ObsidianAppPage } from '../pageobjects/ObsidianApp.page';
import { SparqlBlockPage } from '../pageobjects/SparqlBlock.page';

describe('Exocortex Plugin – Basic SPARQL Tests', () => {
  let app: ObsidianAppPage;
  let sparql: SparqlBlockPage;

  before(() => {
    app = new ObsidianAppPage();
    sparql = new SparqlBlockPage();
  });

  beforeEach(async () => {
    await app.waitForWorkspaceReady();
    await app.enablePlugin('exocortex');
  });

  describe('SPARQL Container Rendering', () => {
    it('should render SPARQL container with correct class', async () => {
      // Create a simple test file with SPARQL query
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          'test-container.md',
          '```sparql\nSELECT * WHERE { ?s ?p ?o } LIMIT 5\n```'
        );
      });
      
      await app.openFile('test-container.md');
      await app.switchToPreviewMode();
      
      // Wait for container to appear
      await sparql.waitForResults();
      
      // Verify container exists
      const containers = await sparql.resultContainers;
      expect(containers).to.have.lengthOf.at.least(1);
      
      // Verify container has title
      const title = await sparql.getResultTitle(0);
      expect(title).to.equal('SPARQL Query Results');
      
      // Verify container has query text
      const queryText = await sparql.getQueryText(0);
      expect(queryText).to.include('SELECT * WHERE');
    });

    it('should display error for invalid query', async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          'test-error.md',
          '```sparql\nINVALID QUERY\n```'
        );
      });
      
      await app.openFile('test-error.md');
      await app.switchToPreviewMode();
      
      // Wait for container
      await sparql.waitForResults();
      
      // Check for error
      const hasError = await sparql.hasError(0);
      expect(hasError).to.be.true;
      
      const errorMessage = await sparql.getErrorMessage(0);
      expect(errorMessage).to.include('Error');
    });

    it('should display results table for valid query', async () => {
      await browser.executeObsidian(({ app }) => {
        // Create a test file with frontmatter
        app.vault.create(
          'test-data.md',
          `---
exo__Asset_uid: "test-001"
exo__Asset_label: "Test Asset"
---
# Test File`
        );
        
        // Create query file
        app.vault.create(
          'test-query.md',
          '```sparql\nSELECT * WHERE { ?s ?p ?o } LIMIT 10\n```'
        );
      });
      
      // Let plugin process the data file
      await browser.pause(1000);
      
      await app.openFile('test-query.md');
      await app.switchToPreviewMode();
      
      // Wait for results
      await sparql.waitForResults();
      
      // Verify table exists
      const hasTable = await sparql.hasResultsTable(0);
      expect(hasTable).to.be.true;
      
      // Check headers
      const headers = await sparql.getTableHeaders(0);
      expect(headers).to.include('s');
      expect(headers).to.include('p');
      expect(headers).to.include('o');
      
      // Check execution time is displayed
      const executionTime = await sparql.getExecutionTime(0);
      expect(executionTime).to.include('Executed in');
    });
  });
});