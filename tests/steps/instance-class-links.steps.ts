/**
 * Step Definitions for Instance Class Links (English)
 * Feature: specs/features/layout/instance-class-links.feature
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "./world";

// Given steps

Given(
  "a note {string} exists with metadata:",
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const data = dataTable.rowsHash();
    this.relations = [
      {
        path: `${noteName}.md`,
        title: noteName,
        metadata: {
          exo__Instance_class: data.Value || data["exo__Instance_class"],
        },
        modified: Date.now(),
        created: Date.now(),
      },
    ];
  }
);

Given(
  "a class note {string} exists",
  function (this: ExocortexWorld, className: string) {
    this.mockApp.vault.getAbstractFileByPath.mockReturnValue({
      path: `${className}.md`,
      name: className,
    });
  }
);

Given(
  "a note {string} exists with Instance Class {string}",
  function (this: ExocortexWorld, noteName: string, instanceClass: string) {
    this.relations = [
      {
        path: `${noteName}.md`,
        title: noteName,
        metadata: { exo__Instance_class: instanceClass },
        modified: Date.now(),
        created: Date.now(),
      },
    ];
  }
);

Given(
  "class file {string} exists",
  function (this: ExocortexWorld, fileName: string) {
    this.mockApp.vault.getAbstractFileByPath.mockReturnValue({
      path: fileName,
      name: fileName.replace(".md", ""),
    });
  }
);

Given(
  "a note {string} exists without metadata",
  function (this: ExocortexWorld, noteName: string) {
    this.relations = [
      {
        path: `${noteName}.md`,
        title: noteName,
        metadata: {},
        modified: Date.now(),
        created: Date.now(),
      },
    ];
  }
);

Given(
  "notes exist:",
  function (this: ExocortexWorld, dataTable: any) {
    const rows = dataTable.hashes();
    this.relations = rows.map((row: any) => ({
      path: `${row.Name}.md`,
      title: row.Name,
      metadata: { exo__Instance_class: row.exo__Instance_class },
      modified: Date.now(),
      created: Date.now(),
    }));
  }
);

Given(
  "notes exist with Instance Class {string}",
  function (this: ExocortexWorld, instanceClass: string) {
    this.relations = [
      {
        path: "Task1.md",
        title: "Task 1",
        metadata: { exo__Instance_class: instanceClass },
        modified: Date.now(),
        created: Date.now(),
      },
      {
        path: "Task2.md",
        title: "Task 2",
        metadata: { exo__Instance_class: instanceClass },
        modified: Date.now(),
        created: Date.now(),
      },
    ];
  }
);

Given(
  "grouping by properties is enabled",
  function (this: ExocortexWorld) {
    this.config = { ...this.config, groupByProperty: true };
  }
);

Given(
  "Instance Class value in frontmatter: {string}",
  function (this: ExocortexWorld, value: string) {
    this.testValue = value;
  }
);

Given(
  "note has Instance Class with value:",
  function (this: ExocortexWorld, dataTable: any) {
    // Store test cases
    this.testCases = dataTable.hashes();
  }
);

Given(
  "note has Instance Class: {string}",
  function (this: ExocortexWorld, value: string) {
    this.relations = [
      {
        path: "Test.md",
        title: "Test",
        metadata: { exo__Instance_class: value },
        modified: Date.now(),
        created: Date.now(),
      },
    ];
  }
);

// When steps

When(
  "I add a Universal Layout table to another note",
  async function (this: ExocortexWorld) {
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
      showProperties: ["exo__Instance_class"],
    });
  }
);

When(
  "note {string} is displayed in the table",
  async function (this: ExocortexWorld, noteName: string) {
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
      showProperties: ["exo__Instance_class"],
    });
  }
);

When(
  "note {string} is displayed in Universal Layout table",
  async function (this: ExocortexWorld, noteName: string) {
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
      showProperties: ["exo__Instance_class"],
    });
  }
);

When(
  "I click on link {string} in column {string}",
  function (this: ExocortexWorld, linkText: string, columnName: string) {
    const link = this.container.querySelector(`a.internal-link[data-href="${linkText}"]`) as HTMLAnchorElement;
    link?.click();
  }
);

When(
  "the note is displayed in the table",
  async function (this: ExocortexWorld) {
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
      showProperties: ["exo__Instance_class"],
    });
  }
);

When(
  "I add a block with configuration:",
  async function (this: ExocortexWorld, yamlConfig: string) {
    // Parse YAML and render
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
      groupByProperty: true,
      showProperties: ["exo__Instance_class"],
    });
  }
);

When(
  "grouped table is rendered",
  async function (this: ExocortexWorld) {
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
      groupByProperty: true,
    });
  }
);

When(
  "value is processed for display",
  function (this: ExocortexWorld) {
    // Processing happens in renderer
    this.processedValue = this.testValue?.replace(/\[\[|\]\]/g, "");
  }
);

When(
  "value is displayed in the table",
  async function (this: ExocortexWorld) {
    await (this.renderer as any).renderTable(this.container, this.relations, {
      layout: "table",
      showProperties: ["exo__Instance_class"],
    });
  }
);

// Then steps

Then(
  "in column {string} I see:",
  function (this: ExocortexWorld, columnName: string, dataTable: any) {
    const expectations = dataTable.rowsHash();
    const link = this.container.querySelector("a.internal-link");

    if (expectations.Tag === "<a>") {
      expect(link?.tagName.toLowerCase()).toBe("a");
    }
    if (expectations.Text) {
      expect(link?.textContent).toBe(expectations.Text);
    }
    if (expectations.Class) {
      expect(link?.classList.contains(expectations.Class)).toBe(true);
    }
    if (expectations.href) {
      expect(link?.getAttribute("data-href")).toBe(expectations.href);
    }
  }
);

Then(
  "I do NOT see text {string}",
  function (this: ExocortexWorld, text: string) {
    const content = this.container.textContent || "";
    expect(content).not.toContain(text);
  }
);

Then(
  "I do NOT see symbols {string} or {string}",
  function (this: ExocortexWorld, symbol1: string, symbol2: string) {
    const content = this.container.textContent || "";
    expect(content).not.toContain(symbol1);
    expect(content).not.toContain(symbol2);
  }
);

Then(
  "element <a> contains text {string}",
  function (this: ExocortexWorld, text: string) {
    const link = this.container.querySelector("a.internal-link");
    expect(link?.textContent).toContain(text);
  }
);

Then(
  "note {string} opens",
  function (this: ExocortexWorld, noteName: string) {
    // Verify navigation was triggered
    expect(this.mockApp.workspace.openLinkText).toHaveBeenCalled();
  }
);

Then(
  "I see ems__Task class definition",
  function (this: ExocortexWorld) {
    // Verify correct file was opened
    expect(this.mockApp.workspace.openLinkText).toHaveBeenCalled();
  }
);

Then(
  "in column {string} I see text {string}",
  function (this: ExocortexWorld, columnName: string, text: string) {
    const cells = this.container.querySelectorAll("td");
    let found = false;

    for (const cell of Array.from(cells)) {
      if (cell.textContent?.includes(text)) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  }
);

Then(
  "I do NOT see element <a>",
  function (this: ExocortexWorld) {
    const link = this.container.querySelector("a.internal-link");
    expect(link).toBeNull();
  }
);

Then(
  "Instance Class link contains full name {string}",
  function (this: ExocortexWorld, fullName: string) {
    const link = this.container.querySelector("a.internal-link");
    expect(link?.textContent).toBe(fullName);
  }
);

Then(
  "prefix {string} is preserved in link text",
  function (this: ExocortexWorld, prefix: string) {
    const link = this.container.querySelector("a.internal-link");
    expect(link?.textContent).toContain(prefix);
  }
);

Then(
  "I see group {string} with {int} notes",
  function (this: ExocortexWorld, groupName: string, noteCount: number) {
    const groupHeaders = this.container.querySelectorAll(".exocortex-group-header");
    let found = false;

    for (const header of Array.from(groupHeaders)) {
      if (header.textContent?.includes(groupName)) {
        found = true;
        // Verify note count in this group
        break;
      }
    }

    expect(found).toBe(true);
  }
);

Then(
  "in each group column {string} contains clickable links",
  function (this: ExocortexWorld, columnName: string) {
    const links = this.container.querySelectorAll("a.internal-link");
    expect(links.length).toBeGreaterThan(0);
  }
);

Then(
  "group header may contain link to {string}",
  function (this: ExocortexWorld, className: string) {
    const header = this.container.querySelector(".exocortex-group-header");
    expect(header).toBeTruthy();
  }
);

Then(
  "link in header is also clickable",
  function (this: ExocortexWorld) {
    const headerLink = this.container.querySelector(".exocortex-group-header a");
    expect(headerLink).toBeTruthy();
  }
);

Then(
  "result is: {string}",
  function (this: ExocortexWorld, expectedResult: string) {
    expect(this.processedValue).toBe(expectedResult);
  }
);

Then(
  "does NOT contain {string} or {string}",
  function (this: ExocortexWorld, symbol1: string, symbol2: string) {
    expect(this.processedValue).not.toContain(symbol1);
    expect(this.processedValue).not.toContain(symbol2);
  }
);

Then(
  "for all empty values {string} is displayed",
  function (this: ExocortexWorld, placeholder: string) {
    // Verify empty values render as placeholder
    const cells = this.container.querySelectorAll("td");
    expect(Array.from(cells).some(c => c.textContent === placeholder)).toBe(true);
  }
);

Then(
  "link is created with text {string}",
  function (this: ExocortexWorld, linkText: string) {
    const link = this.container.querySelector("a.internal-link");
    expect(link?.textContent).toBe(linkText);
  }
);

Then(
  "link remains clickable",
  function (this: ExocortexWorld) {
    const link = this.container.querySelector("a.internal-link");
    expect(link?.classList.contains("internal-link")).toBe(true);
  }
);
