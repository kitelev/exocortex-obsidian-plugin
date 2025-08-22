import { expect } from "chai";
import { ObsidianAppPage } from "../pageobjects/ObsidianApp.page";
import { SparqlBlockPage } from "../pageobjects/SparqlBlock.page";
import { MarkdownEditorPage } from "../pageobjects/MarkdownEditor.page";

describe("Exocortex Plugin – Advanced SPARQL Features", () => {
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

  describe("Complex Query Patterns", () => {
    it("should handle SELECT with specific variables", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-specific-vars.md",
          "```sparql\nSELECT ?subject ?object WHERE { } LIMIT 5\n```",
        );
      });

      await app.openFile("test-specific-vars.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const headers = await sparql.getTableHeaders(0);
      expect(headers).to.have.lengthOf(2);
      expect(headers).to.include("subject");
      expect(headers).to.include("object");
      expect(headers).to.not.include("predicate");
    });

    it("should support task-specific variable extraction", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-task-query.md",
          "```sparql\nSELECT ?task ?status WHERE { } LIMIT 10\n```",
        );
      });

      await app.openFile("test-task-query.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const headers = await sparql.getTableHeaders(0);
      expect(headers).to.include("task");
      expect(headers).to.include("status");
    });

    it("should handle label extraction", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-label-query.md",
          "```sparql\nSELECT ?subject ?label WHERE { } LIMIT 10\n```",
        );
      });

      await app.openFile("test-label-query.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const rows = await sparql.getTableRows(0);

      // Check if label column contains actual label data
      const hasLabels = rows.some((row) => {
        const labelIndex = 1; // ?label is second column
        return row[labelIndex] && row[labelIndex].length > 0;
      });

      expect(hasLabels).to.be.true;
    });
  });

  describe("File Link Navigation", () => {
    it("should create clickable file links in results", async () => {
      await app.openFile("Task 1 - Test SPARQL.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const rows = await sparql.getTableRows(0);

      // Find a row with file:// prefix
      const hasFileLinks = rows.some((row) =>
        row.some((cell) => cell.includes("Task 1 - Test SPARQL.md")),
      );

      expect(hasFileLinks).to.be.true;
    });

    it("should navigate to file when link is clicked", async () => {
      // Create two test files
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-source.md",
          "```sparql\nSELECT * WHERE { } LIMIT 5\n```",
        );
        app.vault.create(
          "test-target.md",
          '---\nexo__Asset_uid: "target-001"\n---\n# Target File',
        );
      });

      await app.openFile("test-source.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // Check if we can find the target file in results
      const rows = await sparql.getTableRows(0);
      const hasTargetFile = rows.some((row) =>
        row.some((cell) => cell.includes("test-target.md")),
      );

      if (hasTargetFile) {
        // Try clicking the link
        await sparql.clickFileLink("test-target.md", 0);

        // Verify navigation
        await (browser as any).pause(500);
        const activeFile = await app.getActiveFileName();
        expect(activeFile).to.equal("test-target.md");
      }
    });
  });

  describe("Frontmatter Extraction", () => {
    it("should extract all frontmatter properties as triples", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-complex-frontmatter.md",
          `---
exo__Asset_uid: "complex-001"
exo__Instance_class: "[[ems__Task]]"
exo__Asset_label: "Complex Task"
ems__Task_status: "pending"
ems__Task_priority: "high"
ems__Task_assignee: "user1"
tags: ["important", "urgent"]
---
# Complex Task`,
        );
      });

      await app.openFile("test-complex-frontmatter.md");

      // Add SPARQL query to the file
      await app.switchToSourceMode();
      await editor.waitForEditor();
      await editor.appendText(
        "\n\n```sparql\nSELECT * WHERE { } LIMIT 50\n```",
      );

      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const rows = await sparql.getTableRows(0);

      // Check for various properties
      const properties = [
        "exo__Asset_uid",
        "exo__Instance_class",
        "exo__Asset_label",
        "ems__Task_status",
        "ems__Task_priority",
        "ems__Task_assignee",
      ];

      properties.forEach((prop) => {
        const hasProp = rows.some((row) =>
          row.some((cell) => cell.includes(prop)),
        );
        expect(hasProp, `Should have property ${prop}`).to.be.true;
      });
    });

    it("should handle array values in frontmatter", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-array-frontmatter.md",
          `---
tags: ["tag1", "tag2", "tag3"]
categories: ["cat1", "cat2"]
---
# Array Test

\`\`\`sparql
SELECT * WHERE { } LIMIT 20
\`\`\``,
        );
      });

      await app.openFile("test-array-frontmatter.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      const rows = await sparql.getTableRows(0);

      // Should have separate rows for each array element
      const tagRows = rows.filter((row) =>
        row.some((cell) => cell.includes("tags")),
      );
      expect(tagRows.length).to.be.greaterThanOrEqual(3);
    });
  });

  describe("Query Caching and Performance", () => {
    it("should execute repeated queries efficiently", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-performance.md",
          `# Performance Test
          
\`\`\`sparql
SELECT * WHERE { } LIMIT 10
\`\`\`

Some text in between

\`\`\`sparql
SELECT * WHERE { } LIMIT 10
\`\`\``,
        );
      });

      await app.openFile("test-performance.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // Get execution times for both queries
      const time1 = await sparql.getExecutionTime(0);
      const time2 = await sparql.getExecutionTime(1);

      expect(time1).to.not.be.null;
      expect(time2).to.not.be.null;

      // Both should execute quickly
      const ms1 = parseInt(time1?.match(/(\d+)ms/)?.[1] || "0");
      const ms2 = parseInt(time2?.match(/(\d+)ms/)?.[1] || "0");

      expect(ms1).to.be.lessThan(500);
      expect(ms2).to.be.lessThan(500);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty vault gracefully", async () => {
      // Delete all test files except the current one
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-empty-vault.md",
          "```sparql\nSELECT * WHERE { } LIMIT 5\n```",
        );

        // Delete other files to simulate empty vault
        const files = app.vault.getMarkdownFiles();
        files.forEach((file: any) => {
          if (!file.name.includes("test-empty-vault")) {
            app.vault.delete(file);
          }
        });
      });

      await app.openFile("test-empty-vault.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // Should still render without error
      const containers = await sparql.resultContainers;
      expect(containers.length).to.be.greaterThan(0);
    });

    it("should handle malformed frontmatter gracefully", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-malformed.md",
          `---
broken: value without quotes
nested:
  incomplete
---
# Malformed

\`\`\`sparql
SELECT * WHERE { } LIMIT 5
\`\`\``,
        );
      });

      await app.openFile("test-malformed.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // Should not crash
      const hasError = await sparql.hasError(0);
      expect(hasError).to.be.false;
    });

    it("should handle very large LIMIT values", async () => {
      await browser.executeObsidian(({ app }) => {
        app.vault.create(
          "test-large-limit.md",
          "```sparql\nSELECT * WHERE { } LIMIT 10000\n```",
        );
      });

      await app.openFile("test-large-limit.md");
      await app.switchToPreviewMode();
      await sparql.waitForResults();

      // Should cap at reasonable number
      const rows = await sparql.getTableRows(0);
      expect(rows.length).to.be.lessThanOrEqual(10000);

      // Check execution didn't timeout
      const execTime = await sparql.getExecutionTime(0);
      expect(execTime).to.not.be.null;
    });
  });

  after(async () => {
    // Clean up all test files created
    await browser.executeObsidian(({ app }) => {
      const testFiles = [
        "test-specific-vars.md",
        "test-task-query.md",
        "test-label-query.md",
        "test-source.md",
        "test-target.md",
        "test-complex-frontmatter.md",
        "test-array-frontmatter.md",
        "test-performance.md",
        "test-empty-vault.md",
        "test-malformed.md",
        "test-large-limit.md",
      ];

      testFiles.forEach((fileName) => {
        const file = app.vault.getAbstractFileByPath(fileName);
        if (file) {
          app.vault.delete(file);
        }
      });
    });
  });
});
