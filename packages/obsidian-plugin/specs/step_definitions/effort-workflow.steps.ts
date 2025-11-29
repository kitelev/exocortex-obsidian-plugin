import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Effort Workflow State
// ============================================

Given("I have a Task without ems__Effort_status property", function (this: ExocortexWorld) {
  const note = this.createTask("New Task", {});
  delete note.frontmatter.ems__Effort_status;
  this.currentNote = note;
});

Given("I have a Task {string} with Draft status", function (this: ExocortexWorld, taskName: string) {
  const note = this.createTask(taskName, {
    ems__Effort_status: "[[ems__EffortStatusDraft]]",
  });
  this.currentNote = note;
});

Given("I have a Task {string} with:", function (this: ExocortexWorld, taskName: string, dataTable: any) {
  const properties: Record<string, string> = {};
  const rows = dataTable.raw();

  for (const [prop, value] of rows) {
    if (prop !== "Property") {
      // Skip header row
      properties[prop] = value;
    }
  }

  const note = this.createTask(taskName, properties);
  this.currentNote = note;
});

Given("I have an Area {string}", function (this: ExocortexWorld, areaName: string) {
  const note = this.createFile(`Areas/${areaName.toLowerCase()}.md`, {
    exo__Instance_class: "[[ems__Area]]",
    exo__Asset_label: areaName,
  });
  this.currentNote = note;
});

Given("I have a Project {string}", function (this: ExocortexWorld, projectName: string) {
  const note = this.createFile(`Projects/${projectName.toLowerCase().replace(/\s+/g, "-")}.md`, {
    exo__Instance_class: "[[ems__Project]]",
    exo__Asset_label: projectName,
  });
  this.currentNote = note;
});

Given("I have a TaskPrototype {string}", function (this: ExocortexWorld, prototypeName: string) {
  const note = this.createFile(`Prototypes/${prototypeName.toLowerCase().replace(/\s+/g, "-")}.md`, {
    exo__Instance_class: "[[ems__TaskPrototype]]",
    exo__Asset_label: prototypeName,
  });
  this.currentNote = note;
});

Given("I have a MeetingPrototype {string}", function (this: ExocortexWorld, prototypeName: string) {
  const note = this.createFile(`Prototypes/${prototypeName.toLowerCase().replace(/\s+/g, "-")}.md`, {
    exo__Instance_class: "[[ems__MeetingPrototype]]",
    exo__Asset_label: prototypeName,
  });
  this.currentNote = note;
});

// ============================================
// Viewing and Buttons
// ============================================

When("I view the Task", function (this: ExocortexWorld) {
  if (this.currentNote) {
    this.viewNote(this.currentNote);
    this.updateButtonsForCurrentNote();
  }
});

Then("I see {string} button", function (this: ExocortexWorld, buttonName: string) {
  assert.ok(
    this.renderedButtons.has(buttonName),
    `Expected button "${buttonName}" to be visible`,
  );
});

When("I click {string} button", function (this: ExocortexWorld, buttonName: string) {
  this.click(buttonName);
  this.handleButtonAction(buttonName);
});

Then("{string} button disappears", function (this: ExocortexWorld, buttonName: string) {
  assert.ok(
    !this.renderedButtons.has(buttonName),
    `Button "${buttonName}" should have disappeared`,
  );
});

Then("{string} button appears", function (this: ExocortexWorld, buttonName: string) {
  assert.ok(
    this.renderedButtons.has(buttonName),
    `Button "${buttonName}" should appear`,
  );
});

Then("Start Effort button is visible", function (this: ExocortexWorld) {
  assert.ok(
    this.renderedButtons.has("Start Effort"),
    "Start Effort button should be visible",
  );
});

Then(
  /^status is set to "([^"]*)"$/,
  function (this: ExocortexWorld, expectedStatus: string) {
    assert.ok(this.currentNote);
    assert.strictEqual(
      this.currentNote?.frontmatter.ems__Effort_status,
      expectedStatus,
      `Status should be "${expectedStatus}"`,
    );
  },
);

// ============================================
// Command Palette
// ============================================

When("I open Command Palette", function (this: ExocortexWorld) {
  this.lastAction = "command-palette-open";
  // Also update command availability if the method exists
  if (typeof (this as any).updateCommandAvailability === "function") {
    (this as any).updateCommandAvailability();
  }
});

When("I select {string}", function (this: ExocortexWorld, commandName: string) {
  this.lastAction = `execute-command:${commandName}`;
  this.handleCommand(commandName);
});

Then("Task status is set to Draft", function (this: ExocortexWorld) {
  assert.ok(this.currentNote);
  assert.strictEqual(
    this.currentNote?.frontmatter.ems__Effort_status,
    "[[ems__EffortStatusDraft]]",
  );
});

Then("command executes successfully", function (this: ExocortexWorld) {
  assert.ok(this.lastAction?.startsWith("execute-command:"));
});

// ============================================
// Task Creation
// ============================================

When("I enter label {string}", function (this: ExocortexWorld, label: string) {
  if (this.pendingCreation) {
    this.pendingCreation.frontmatter.exo__Asset_label = label;
  }
});

Then("a new Task is created", function (this: ExocortexWorld) {
  assert.ok(this.lastCreatedNote, "Expected a new task to be created");
  assert.ok(
    this.lastCreatedNote?.frontmatter.exo__Instance_class?.includes("ems__Task"),
    "Created note should be a Task",
  );
});

Then("a new Meeting is created", function (this: ExocortexWorld) {
  assert.ok(this.lastCreatedNote, "Expected a new meeting to be created");
  assert.ok(
    this.lastCreatedNote?.frontmatter.exo__Instance_class?.includes("ems__Meeting"),
    "Created note should be a Meeting",
  );
});

Then(
  "Task has property {string} = {string}",
  function (this: ExocortexWorld, property: string, value: string) {
    assert.ok(this.lastCreatedNote);
    assert.strictEqual(
      this.lastCreatedNote?.frontmatter[property],
      value,
      `Expected ${property} to be "${value}"`,
    );
  },
);

Then(
  "Task has property {string} with UUID value",
  function (this: ExocortexWorld, property: string) {
    assert.ok(this.lastCreatedNote);
    const value = this.lastCreatedNote?.frontmatter[property];
    assert.ok(value, `Expected ${property} to exist`);
    // UUID format check (simplified)
    assert.ok(
      typeof value === "string" && value.length > 10,
      `Expected ${property} to be a UUID-like value`,
    );
  },
);

Then(
  "Task has property {string} with timestamp",
  function (this: ExocortexWorld, property: string) {
    assert.ok(this.lastCreatedNote);
    const value = this.lastCreatedNote?.frontmatter[property];
    assert.ok(value, `Expected ${property} to exist`);
  },
);

Then(
  "Task property {string} is set to {string}",
  function (this: ExocortexWorld, property: string, value: string) {
    assert.ok(this.currentNote);
    assert.strictEqual(this.currentNote?.frontmatter[property], value);
  },
);

Then(
  "Task property {string} is updated to {string}",
  function (this: ExocortexWorld, property: string, value: string) {
    assert.ok(this.currentNote);
    assert.strictEqual(this.currentNote?.frontmatter[property], value);
  },
);

Then(
  "Meeting has property {string} = {string}",
  function (this: ExocortexWorld, property: string, value: string) {
    assert.ok(this.lastCreatedNote);
    assert.strictEqual(this.lastCreatedNote?.frontmatter[property], value);
  },
);
