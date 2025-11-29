import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Property Cleanup Steps
// ============================================

Given(
  /^I have an Area "([^"]*)" with:$/,
  function (this: ExocortexWorld, areaName: string, dataTable: any) {
    const frontmatter: Record<string, any> = {};
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key, value] = row;
      frontmatter[key] = parseValue(value);
    }
    const note = this.createFile(`Areas/${areaName}.md`, frontmatter);
    this.notes.set(areaName, note);
  },
);

// Note: "I have a Task {string} with:" is already defined in effort-workflow.steps.ts

Given(
  /^I have a Project "([^"]*)" with:$/,
  function (this: ExocortexWorld, projectName: string, dataTable: any) {
    const frontmatter: Record<string, any> = {};
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key, value] = row;
      frontmatter[key] = parseValue(value);
    }
    const note = this.createFile(`Projects/${projectName}.md`, frontmatter);
    this.notes.set(projectName, note);
  },
);

Given(
  /^I have a note "([^"]*)" with:$/,
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const frontmatter: Record<string, any> = {};
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key, value] = row;
      frontmatter[key] = parseValue(value);
    }
    const note = this.createFile(`Notes/${noteName}.md`, frontmatter);
    this.notes.set(noteName, note);
  },
);

Given(
  /^I have a Task with:$/,
  function (this: ExocortexWorld, dataTable: any) {
    const frontmatter: Record<string, any> = {};
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key, value] = row;
      frontmatter[key] = parseValue(value);
    }
    const note = this.createFile("Tasks/generic-task.md", frontmatter);
    this.currentNote = note;
  },
);

Given(
  /^I have a Project with:$/,
  function (this: ExocortexWorld, dataTable: any) {
    const frontmatter: Record<string, any> = {};
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key, value] = row;
      frontmatter[key] = parseValue(value);
    }
    const note = this.createFile("Projects/generic-project.md", frontmatter);
    this.currentNote = note;
  },
);

Given(
  /^I have an Area with:$/,
  function (this: ExocortexWorld, dataTable: any) {
    const frontmatter: Record<string, any> = {};
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key, value] = row;
      frontmatter[key] = parseValue(value);
    }
    const note = this.createFile("Areas/generic-area.md", frontmatter);
    this.currentNote = note;
  },
);

Given(
  /^I have a note with property "([^"]*)" set to (.+)$/,
  function (this: ExocortexWorld, property: string, value: string) {
    const parsedValue = parseValue(value);
    const note = this.createFile("Notes/test-note.md", {
      [property]: parsedValue,
    });
    this.currentNote = note;
  },
);

// ============================================
// When Steps for Property Cleanup
// ============================================

When(
  /^I view "([^"]*)" with UniversalLayout$/,
  function (this: ExocortexWorld, noteName: string) {
    const note = this.notes.get(noteName);
    if (note) {
      this.viewNote(note);
    }
    this.updateCleanButtonVisibility();
  },
);

// Note: "I view the note with UniversalLayout" is defined in common.steps.ts
// We hook into the updateCleanButtonVisibility via hooks

// Note: "I click {string} button" is defined in effort-workflow.steps.ts
// This file adds cleanup-specific behavior through handleButtonAction

// ============================================
// Then Steps for Property Cleanup
// ============================================

Then(
  /^I see a "([^"]*)" button$/,
  function (this: ExocortexWorld, buttonName: string) {
    assert.ok(
      this.renderedButtons.has(buttonName),
      `Button "${buttonName}" should be visible`,
    );
  },
);

Then(
  /^I do NOT see "([^"]*)" button$/,
  function (this: ExocortexWorld, buttonName: string) {
    assert.ok(
      !this.renderedButtons.has(buttonName),
      `Button "${buttonName}" should NOT be visible`,
    );
  },
);

Then(
  /^properties "([^"]*)" and "([^"]*)" are removed$/,
  function (this: ExocortexWorld, prop1: string, prop2: string) {
    assert.ok(
      !(prop1 in this.currentNote!.frontmatter),
      `Property "${prop1}" should be removed`,
    );
    assert.ok(
      !(prop2 in this.currentNote!.frontmatter),
      `Property "${prop2}" should be removed`,
    );
  },
);

Then(
  /^property "([^"]*)" is preserved$/,
  function (this: ExocortexWorld, property: string) {
    assert.ok(
      property in this.currentNote!.frontmatter,
      `Property "${property}" should be preserved`,
    );
  },
);

Then(
  /^property "([^"]*)" is removed$/,
  function (this: ExocortexWorld, property: string) {
    assert.ok(
      !(property in this.currentNote!.frontmatter),
      `Property "${property}" should be removed`,
    );
  },
);

// Note: "{string} button disappears" is already defined in effort-workflow.steps.ts

Then(
  /^properties "([^"]*)", "([^"]*)", and "([^"]*)" are removed$/,
  function (this: ExocortexWorld, prop1: string, prop2: string, prop3: string) {
    assert.ok(
      !(prop1 in this.currentNote!.frontmatter),
      `Property "${prop1}" should be removed`,
    );
    assert.ok(
      !(prop2 in this.currentNote!.frontmatter),
      `Property "${prop2}" should be removed`,
    );
    assert.ok(
      !(prop3 in this.currentNote!.frontmatter),
      `Property "${prop3}" should be removed`,
    );
  },
);

Then(
  /^Clean button visibility is (visible|hidden)$/,
  function (this: ExocortexWorld, visibility: string) {
    if (visibility === "visible") {
      assert.ok(
        this.renderedButtons.has("Clean Empty Properties"),
        "Clean button should be visible",
      );
    } else {
      assert.ok(
        !this.renderedButtons.has("Clean Empty Properties"),
        "Clean button should be hidden",
      );
    }
  },
);

// ============================================
// Helper Functions
// ============================================

function parseValue(value: string): any {
  if (value === '""' || value === "''") return "";
  if (value === "null") return null;
  if (value === "undefined") return undefined;
  if (value === "[]") return [];
  if (value === "{}") return ({});
  if (value === '"   "' || value === "'   '") return "   ";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (value === "") return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
}

// Extend World to add cleanup button visibility
declare module "../support/world.js" {
  interface ExocortexWorld {
    updateCleanButtonVisibility(): void;
  }
}

ExocortexWorld.prototype.updateCleanButtonVisibility = function (this: ExocortexWorld) {
  if (!this.currentNote) return;

  const hasEmptyProps = Object.values(this.currentNote.frontmatter).some((value) =>
    isEmpty(value),
  );

  if (hasEmptyProps) {
    this.renderedButtons.add("Clean Empty Properties");
  } else {
    this.renderedButtons.delete("Clean Empty Properties");
  }
};
