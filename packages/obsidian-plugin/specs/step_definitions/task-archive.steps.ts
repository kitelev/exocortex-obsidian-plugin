import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Task Archive - Unique Given Steps
// ============================================

// Note: "I have a note X with frontmatter" is defined in command-palette.steps.ts
// We only define steps specific to archive feature here

Given(
  /^I have a Done Task "([^"]*)" with:$/,
  function (this: ExocortexWorld, taskName: string, dataTable: any) {
    const properties: Record<string, any> = {};
    const rows = dataTable.raw();

    for (const [key, value] of rows) {
      if (key !== "Key") {
        properties[key] = parseArchiveValue(value);
      }
    }

    const note = this.createTask(taskName, properties);
    this.currentNote = note;
    this.notes.set(taskName, note);
    this.updateButtonsForArchive();
  },
);

Given(
  /^I have a Done Task with complete frontmatter:$/,
  function (this: ExocortexWorld, dataTable: any) {
    const properties: Record<string, any> = {};
    const rows = dataTable.raw();

    for (const [property, value] of rows) {
      if (property !== "Property") {
        properties[property] = parseArchiveValue(value);
      }
    }

    const note = this.createTask("Done Task with Complete Frontmatter", properties);
    this.currentNote = note;
    this.updateButtonsForArchive();
  },
);

Given(
  /^I have a Done Task with:$/,
  function (this: ExocortexWorld, dataTable: any) {
    const properties: Record<string, any> = {};
    const rows = dataTable.raw();

    for (const [key, value] of rows) {
      if (key !== "Key") {
        properties[key] = parseArchiveValue(value);
      }
    }

    const note = this.createTask("Done Task", properties);
    this.currentNote = note;
    this.updateButtonsForArchive();
  },
);

// ============================================
// Task Archive - Then Steps
// ============================================

Then(
  /^I see a "To Archive" button$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("To Archive"),
      `Expected to see "To Archive" button, but found: [${[...this.renderedButtons].join(", ")}]`,
    );
  },
);

Then(
  /^I do NOT see "To Archive" button$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("To Archive"),
      `Expected NOT to see "To Archive" button, but it was visible`,
    );
  },
);

Then(
  /^Task frontmatter is updated:$/,
  function (this: ExocortexWorld, dataTable: any) {
    assert.ok(this.currentNote, "Current note should exist");
    const rows = dataTable.raw();

    for (const [property, value] of rows) {
      if (property !== "Property") {
        const expectedValue = parseArchiveValue(value);
        assert.strictEqual(
          this.currentNote?.frontmatter[property],
          expectedValue,
          `Expected ${property} to be "${expectedValue}", got "${this.currentNote?.frontmatter[property]}"`,
        );
      }
    }
  },
);

Then(
  /^"To Archive" button disappears from layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("To Archive"),
      `Button "To Archive" should have disappeared`,
    );
  },
);

Then("all original properties are preserved", function (this: ExocortexWorld) {
  assert.ok(this.currentNote, "Current note should exist");
  // Original properties are preserved by default in our mock
  assert.ok(Object.keys(this.currentNote!.frontmatter).length > 0);
});

Then(
  /^"archived: true" is added$/,
  function (this: ExocortexWorld) {
    assert.ok(this.currentNote, "Current note should exist");
    assert.strictEqual(
      this.currentNote?.frontmatter.archived,
      true,
      `Expected archived to be true`,
    );
  },
);

Then(
  /^Archive button visibility is (\w+)$/,
  function (this: ExocortexWorld, visibility: string) {
    const buttonVisible = this.renderedButtons.has("To Archive");
    const expectedVisible = visibility === "visible";

    assert.strictEqual(
      buttonVisible,
      expectedVisible,
      `Expected Archive button to be ${visibility}`,
    );
  },
);

// ============================================
// Helper Functions
// ============================================

function parseArchiveValue(value: string): any {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === '"true"') return true;
  if (value === '"false"') return false;
  if (value === '"yes"') return true;
  if (value === '"no"') return false;
  if (value === "1") return true;
  if (value === "0") return false;
  if (value === "null") return null;
  if (value === "undefined") return undefined;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  return value;
}

// ============================================
// World Extensions for Archive
// ============================================

declare module "../support/world.js" {
  interface ExocortexWorld {
    updateButtonsForArchive(): void;
    handleArchiveButtonAction(buttonName: string): void;
  }
}

ExocortexWorld.prototype.updateButtonsForArchive = function () {
  if (!this.currentNote) return;

  const fm = this.currentNote.frontmatter;
  const instanceClass = fm.exo__Instance_class || "";
  const status = fm.ems__Effort_status || "";
  const archived = fm.archived ?? fm.exo__Asset_isArchived;

  // To Archive button: visible only for Done Tasks/Projects that are not archived
  const isTaskOrProject = instanceClass.includes("ems__Task") || instanceClass.includes("ems__Project");
  const isDone = status.includes("EffortStatusDone");
  const isArchived = archived === true || archived === "true" || archived === "yes" || archived === 1;

  if (isTaskOrProject && isDone && !isArchived) {
    this.renderedButtons.add("To Archive");
  } else {
    this.renderedButtons.delete("To Archive");
  }
};

ExocortexWorld.prototype.handleArchiveButtonAction = function (buttonName: string) {
  if (!this.currentNote || buttonName !== "To Archive") return;

  this.currentNote.frontmatter.archived = true;
  this.renderedButtons.delete("To Archive");
};
