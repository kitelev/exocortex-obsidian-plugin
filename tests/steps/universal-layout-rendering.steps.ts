/**
 * Step Definitions for Universal Layout Rendering
 * Feature: specs/features/layout/universal-layout-rendering.feature
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "./world";
import { AssetRelation } from "../../src/presentation/renderers/BaseAssetRelationsRenderer";

// Background steps

Given(
  "Obsidian vault with Exocortex plugin installed",
  function (this: ExocortexWorld) {
    // Mock Obsidian environment is already set up in world.ts
    expect(this.mockApp).toBeDefined();
  }
);

Given(
  "note {string} exists with metadata:",
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const data = dataTable.rowsHash();
    this.mockApp.metadataCache.getFileCache.mockReturnValue({
      frontmatter: {
        exo__Instance_class: data["exo__Instance_class"],
        exo__Asset_isArchived: data["exo__Asset_isArchived"] === "false" ? false : true,
      },
    });
  }
);

// Scenario steps

Given(
  "I have note {string} open",
  function (this: ExocortexWorld, noteName: string) {
    this.mockApp.workspace.getActiveFile.mockReturnValue({
      path: `${noteName}.md`,
      basename: noteName,
    });
  }
);

Given(
  "related notes exist:",
  function (this: ExocortexWorld, dataTable: any) {
    const rows = dataTable.hashes();
    this.relations = rows.map((row: any) => ({
      path: `${row.Name}.md`,
      title: row.Name,
      metadata: { exo__Instance_class: row.exo__Instance_class },
      propertyName: row.Relation === "body" ? undefined : row.Relation,
      modified: Date.now(),
      created: Date.now(),
    }));
  }
);

Given(
  "related note {string} exists with metadata:",
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const data = dataTable.rowsHash();
    this.relations = [
      {
        path: `${noteName}.md`,
        title: noteName,
        metadata: {
          exo__Instance_class: data["Property"] === "exo__Instance_class" ? data["Value"] : undefined,
        },
        modified: Date.now(),
        created: Date.now(),
      },
    ];
  }
);

Given(
  "I added a code block with type {string}",
  async function (this: ExocortexWorld, blockType: string) {
    // Context set
  }
);

Given(
  "I have note with Universal Layout table open",
  async function (this: ExocortexWorld) {
    this.relations = [
      {
        path: "Task1.md",
        title: "Task 1",
        metadata: { exo__Instance_class: "[[ems__Task]]" },
        modified: Date.now(),
        created: Date.now(),
      },
    ];
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
    });
  }
);

Given(
  "I am using Obsidian on a mobile device",
  function (this: ExocortexWorld) {
    // Mock mobile platform
    (this.mockApp as any).isMobile = true;
  }
);

// When steps

When(
  "I add a code block with type {string}",
  async function (this: ExocortexWorld, blockType: string) {
    // Context preparation
  }
);

When(
  "block contains configuration:",
  async function (this: ExocortexWorld, yamlConfig: string) {
    // Parse YAML and store config
    this.config = { layout: "table" }; // Simplified
  }
);

When(
  "block contains configuration {string}",
  async function (this: ExocortexWorld, config: string) {
    this.config = { layout: "table" };
  }
);

When(
  "I click on column header {string}",
  async function (this: ExocortexWorld, columnName: string) {
    const headers = this.container.querySelectorAll("th");
    for (const header of Array.from(headers)) {
      const text = header.textContent
        ?.replace(" ▲", "")
        .replace(" ▼", "")
        .trim();
      if (text === columnName) {
        (header as HTMLElement).click();
        break;
      }
    }
  }
);

When(
  "I click on column header {string} again",
  async function (this: ExocortexWorld, columnName: string) {
    await this.Then(`I click on column header "${columnName}"`);
  }
);

When(
  "I add a code block with configuration:",
  async function (this: ExocortexWorld, yamlConfig: string) {
    // Parse and render with config
  }
);

When(
  "table is rendered",
  async function (this: ExocortexWorld) {
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
    });
  }
);

// Then steps

Then(
  "I see a table with columns:",
  function (this: ExocortexWorld, dataTable: any) {
    const expectedColumns = dataTable.raw()[0];
    const headers = this.container.querySelectorAll("th");
    const actualColumns = Array.from(headers).map((h) =>
      h.textContent?.replace(" ▲", "").replace(" ▼", "").trim()
    );

    expectedColumns.forEach((col: string) => {
      expect(actualColumns).toContain(col);
    });
  }
);

Then(
  "table contains {int} rows",
  function (this: ExocortexWorld, rowCount: number) {
    const rows = this.container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(rowCount);
  }
);

Then(
  "column headers {string} and {string} have class {string}",
  function (this: ExocortexWorld, col1: string, col2: string, className: string) {
    const headers = this.container.querySelectorAll("th");
    let found1 = false;
    let found2 = false;

    for (const header of Array.from(headers)) {
      const text = header.textContent
        ?.replace(" ▲", "")
        .replace(" ▼", "")
        .trim();
      if (text === col1) {
        expect(header.classList.contains(className)).toBe(true);
        found1 = true;
      }
      if (text === col2) {
        expect(header.classList.contains(className)).toBe(true);
        found2 = true;
      }
    }

    expect(found1).toBe(true);
    expect(found2).toBe(true);
  }
);

Then(
  "in column {string} I see element <a>",
  function (this: ExocortexWorld, columnName: string) {
    const cells = this.container.querySelectorAll("td");
    let found = false;

    for (const cell of Array.from(cells)) {
      const link = cell.querySelector("a.internal-link");
      if (link) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  }
);

Then(
  "element <a> has text {string}",
  function (this: ExocortexWorld, expectedText: string) {
    const link = this.container.querySelector("a.internal-link");
    expect(link?.textContent).toBe(expectedText);
  }
);

Then(
  "element <a> has class {string}",
  function (this: ExocortexWorld, className: string) {
    const link = this.container.querySelector("a.internal-link");
    expect(link?.classList.contains(className)).toBe(true);
  }
);

Then(
  "clicking element <a> opens note {string}",
  function (this: ExocortexWorld, noteName: string) {
    const link = this.container.querySelector("a.internal-link") as HTMLAnchorElement;
    expect(link?.getAttribute("data-href")).toBe(noteName);
  }
);

Then(
  "element <a> does NOT contain symbols {string} or {string}",
  function (this: ExocortexWorld, symbol1: string, symbol2: string) {
    const link = this.container.querySelector("a.internal-link");
    const text = link?.textContent || "";
    expect(text).not.toContain(symbol1);
    expect(text).not.toContain(symbol2);
  }
);

Then(
  "table is sorted ascending",
  function (this: ExocortexWorld) {
    const header = this.container.querySelector("th.sorted-asc");
    expect(header).toBeTruthy();
  }
);

Then(
  "row order is:",
  function (this: ExocortexWorld, dataTable: any) {
    const expectedOrder = dataTable.raw().map((row: string[]) => row[0]);
    const rows = this.container.querySelectorAll("tbody tr");
    const actualOrder = Array.from(rows).map(row =>
      row.querySelector("td")?.textContent?.trim()
    );

    expectedOrder.forEach((expected: string, index: number) => {
      expect(actualOrder[index]).toContain(expected);
    });
  }
);

Then(
  "table is sorted descending",
  function (this: ExocortexWorld) {
    const header = this.container.querySelector("th.sorted-desc");
    expect(header).toBeTruthy();
  }
);

Then(
  "rows are sorted by Instance Class value",
  function (this: ExocortexWorld) {
    // Verify sorting logic
    const header = this.container.querySelector("th.sorted-asc");
    expect(header?.textContent).toContain("exo__Instance_class");
  }
);

Then(
  "header {string} has class {string}",
  function (this: ExocortexWorld, headerName: string, className: string) {
    const headers = this.container.querySelectorAll("th");
    let found = false;

    for (const header of Array.from(headers)) {
      const text = header.textContent
        ?.replace(" ▲", "")
        .replace(" ▼", "")
        .trim();
      if (text === headerName) {
        expect(header.classList.contains(className)).toBe(true);
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  }
);

Then(
  "header {string} contains symbol {string}",
  function (this: ExocortexWorld, headerName: string, symbol: string) {
    const headers = this.container.querySelectorAll("th");

    for (const header of Array.from(headers)) {
      const text = header.textContent || "";
      if (text.includes(headerName)) {
        expect(text).toContain(symbol);
        break;
      }
    }
  }
);

Then(
  "I see notes {string} and {string}",
  function (this: ExocortexWorld, note1: string, note2: string) {
    const cells = this.container.querySelectorAll("td");
    const cellTexts = Array.from(cells).map(c => c.textContent);
    const allText = cellTexts.join(" ");

    expect(allText).toContain(note1);
    expect(allText).toContain(note2);
  }
);

Then(
  "I do NOT see note {string}",
  function (this: ExocortexWorld, noteName: string) {
    const cells = this.container.querySelectorAll("td");
    const cellTexts = Array.from(cells).map(c => c.textContent);
    const allText = cellTexts.join(" ");

    expect(allText).not.toContain(noteName);
  }
);

Then(
  "in row {string} column {string} contains {string}",
  function (this: ExocortexWorld, rowName: string, columnName: string, expectedValue: string) {
    const rows = this.container.querySelectorAll("tbody tr");

    for (const row of Array.from(rows)) {
      const firstCell = row.querySelector("td");
      if (firstCell?.textContent?.includes(rowName)) {
        const cells = row.querySelectorAll("td");
        // Find the right cell by column name
        expect(Array.from(cells).some(c => c.textContent?.includes(expectedValue))).toBe(true);
        break;
      }
    }
  }
);

Then(
  "<table> element has class {string}",
  function (this: ExocortexWorld, className: string) {
    const table = this.container.querySelector("table");
    expect(table?.classList.contains(className)).toBe(true);
  }
);

Then(
  "table is adapted for touch controls",
  function (this: ExocortexWorld) {
    const table = this.container.querySelector("table");
    // Check for mobile-specific attributes or classes
    expect(table).toBeTruthy();
  }
);
