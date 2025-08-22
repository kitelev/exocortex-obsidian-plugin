import { expect } from "chai";
import { ObsidianAppPage } from "../pageobjects/ObsidianApp.page";
import { SparqlBlockPage } from "../pageobjects/SparqlBlock.page";
import { MarkdownEditorPage } from "../pageobjects/MarkdownEditor.page";

describe("Exocortex Plugin – SPARQL Processing", () => {
  let app: ObsidianAppPage;
  let sparql: SparqlBlockPage;
  let editor: MarkdownEditorPage;

  before(() => {
    app = new ObsidianAppPage();
    sparql = new SparqlBlockPage();
    editor = new MarkdownEditorPage();
  });

  beforeEach(async () => {
    await app.waitForWorkspaceReady();
    await app.enablePlugin("exocortex");
  });

  describe("Basic SPARQL Query Processing", () => {
    it("should render SPARQL block from existing file", async () => {
      // Open file with SPARQL query
      await app.openFile("Note - SPARQL Examples.md");

      // Switch to preview mode to see rendered SPARQL
      await app.switchToPreviewMode();

      // Wait for SPARQL results to render
      await sparql.waitForResults();

      // Verify container exists
      const containers = await sparql.resultContainers;
      expect(containers.length).to.be.greaterThan(0);

      // Verify title
      const title = await sparql.getResultTitle(0);
      expect(title).to.include("SPARQL Query Results");
    });

    it("should display query text in result container", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const queryText = await sparql.getQueryText(0);
      expect(queryText).to.include("SELECT * WHERE");
      expect(queryText).to.include("LIMIT 10");
    });

    it("should show results table with data", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // Check if table exists
      const hasTable = await sparql.hasResultsTable(0);
      expect(hasTable).to.be.true;

      // Check headers
      const headers = await sparql.getTableHeaders(0);
      expect(headers).to.include("subject");
      expect(headers).to.include("predicate");
      expect(headers).to.include("object");

      // Check if there are rows
      const rows = await sparql.getTableRows(0);
      expect(rows.length).to.be.greaterThan(0);
    });

    it("should display execution time", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const executionTime = await sparql.getExecutionTime(0);
      expect(executionTime).to.not.be.null;
      expect(executionTime).to.include("Executed in");
      expect(executionTime).to.match(/\d+ms/);
    });
  });

  describe("SPARQL Query Error Handling", () => {
    it("should display error for invalid SPARQL syntax", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // The third query in the file is invalid
      const hasError = await sparql.hasError(2);
      expect(hasError).to.be.true;

      const errorMessage = await sparql.getErrorMessage(2);
      expect(errorMessage).to.not.be.null;
      expect(errorMessage).to.include("SPARQL Error");
    });
  });

  describe("Dynamic SPARQL Query Creation", () => {
    it("should process newly created SPARQL blocks", async () => {
      // Create a new file
      await browser.executeObsidian(({ app }) => {
        app.vault.create("test-dynamic-sparql.md", "# Dynamic SPARQL Test\n\n");
      });

      // Open the new file
      await app.openFile("test-dynamic-sparql.md");
      await editor.waitForEditor();

      // Insert a SPARQL block
      await editor.insertSparqlBlock(
        "SELECT ?subject ?predicate ?object WHERE { } LIMIT 3",
      );

      // Switch to preview mode
      await app.switchToPreviewMode();

      // Wait for results
      await sparql.waitForResults();

      // Verify results appeared
      const hasTable = await sparql.hasResultsTable(0);
      expect(hasTable).to.be.true;

      const rows = await sparql.getTableRows(0);
      expect(rows.length).to.be.lessThanOrEqual(3);
    });

    it("should update results when query is modified", async () => {
      await app.openFile("test-dynamic-sparql.md");

      // Modify the query
      await app.switchToSourceMode();
      await editor.waitForEditor();

      const content = await editor.getContent();
      const newContent = content.replace("LIMIT 3", "LIMIT 5");
      await editor.setContent(newContent);

      // Switch back to preview
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // Verify updated results
      const queryText = await sparql.getQueryText(0);
      expect(queryText).to.include("LIMIT 5");
    });
  });

  describe("SPARQL Result Interactions", () => {
    it("should extract RDF triples from frontmatter", async () => {
      await app.openFile("Task 1 - Test SPARQL.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const rows = await sparql.getTableRows(0);

      // Should contain frontmatter data
      const hasTaskData = rows.some(
        (row) =>
          row.some((cell) => cell.includes("Test SPARQL")) ||
          row.some((cell) => cell.includes("ems__Task")),
      );

      expect(hasTaskData).to.be.true;
    });

    it("should handle multiple SPARQL blocks in one file", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const containers = await sparql.resultContainers;
      expect(containers.length).to.be.greaterThanOrEqual(2);

      // Check first query
      const firstQueryText = await sparql.getQueryText(0);
      expect(firstQueryText).to.include("SELECT * WHERE");

      // Check second query
      const secondQueryText = await sparql.getQueryText(1);
      expect(secondQueryText).to.include("SELECT ?subject ?predicate ?object");
    });

    it("should apply correct styling to containers", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const styling = await sparql.verifyContainerStyling(0);

      expect(styling.hasBorder).to.be.true;
      expect(styling.borderColor.toLowerCase()).to.equal("#4a90e2");
      expect(styling.backgroundColor.toLowerCase()).to.equal("#f8f9ff");
    });
  });

  describe("Performance and Limits", () => {
    it("should respect LIMIT clause in queries", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // First query has LIMIT 10
      const firstQueryRows = await sparql.getTableRows(0);
      expect(firstQueryRows.length).to.be.lessThanOrEqual(10);
    });

    it("should handle queries with no results gracefully", async () => {
      // Create a file with a query that returns no results
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-no-results.md",
          "```sparql\nSELECT ?nothing WHERE { }\nLIMIT 0\n```",
        );
      });

      await app.openFile("test-no-results.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const hasNoResults = await sparql.hasNoResultsMessage(0);
      expect(hasNoResults).to.be.true;
    });

    it("should execute queries efficiently", async () => {
      await app.openFile("Note - SPARQL Examples.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const executionTime = await sparql.getExecutionTime(0);

      // Extract milliseconds from execution time
      const match = executionTime?.match(/(\d+)ms/);
      if (match) {
        const ms = parseInt(match[1]);
        // Query should execute in reasonable time (< 1 second)
        expect(ms).to.be.lessThan(1000);
      }
    });
  });

  after(async () => {
    // Clean up test files
    await browser.executeObsidian(({ app }) => {
      const filesToDelete = ["test-dynamic-sparql.md", "test-no-results.md"];
      filesToDelete.forEach((fileName) => {
        const file = app.vault.getAbstractFileByPath(fileName);
        if (file) {
          app.vault.delete(file);
        }
      });
    });
  });
});
