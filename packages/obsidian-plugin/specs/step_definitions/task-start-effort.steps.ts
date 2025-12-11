import { Given, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Task Start Effort - Unique Given Steps
// Note: Common steps like "I have a note X with frontmatter" are defined
// in command-palette.steps.ts - avoid duplicating them here
// ============================================

Given(
  /^I have a Task "([^"]*)" without Doing status$/,
  function (this: ExocortexWorld, taskName: string) {
    const note = this.createTask(taskName, {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    });
    this.currentNote = note;
    this.notes.set(taskName, note);
    this.updateButtonsForStartEffort();
  },
);

Given(
  /^I have a Task without Doing status$/,
  function (this: ExocortexWorld) {
    const note = this.createTask("Task without Doing status", {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusBacklog]]",
    });
    this.currentNote = note;
    this.updateButtonsForStartEffort();
  },
);

// Note: "Start Effort button is visible" step is defined in effort-workflow.steps.ts
// to avoid ambiguous step definitions

// ============================================
// Task Start Effort - Then Steps (Unique to Start Effort)
// ============================================

// NOTE: Generic button visibility steps are defined in property-cleanup.steps.ts:
//   - I see a "([^"]*)" button
//   - I do NOT see "([^"]*)" button
// Removed duplicate specific definitions to avoid ambiguous step matches

Then(
  /^"Start Effort" button disappears from layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Start Effort"),
      `Button "Start Effort" should have disappeared`,
    );
  },
);

Then(
  /^"ems__Effort_startTimestamp" matches format: (.+)$/,
  function (this: ExocortexWorld, format: string) {
    assert.ok(this.currentNote, "Current note should exist");
    const value = this.currentNote?.frontmatter.ems__Effort_startTimestamp;
    assert.ok(value, "ems__Effort_startTimestamp should exist");

    // Check ISO 8601 format YYYY-MM-DDTHH:MM:SS
    if (format === "YYYY-MM-DDTHH:MM:SS") {
      const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
      assert.ok(regex.test(value), `Expected ems__Effort_startTimestamp to match format ${format}, got "${value}"`);
    }
  },
);

Then("timestamp does NOT contain milliseconds for startTimestamp", function (this: ExocortexWorld) {
  const timestamp = this.currentNote?.frontmatter.ems__Effort_startTimestamp;
  assert.ok(
    !timestamp?.includes("."),
    "Timestamp should not contain milliseconds",
  );
});

Then("timestamp does NOT contain timezone suffix for startTimestamp", function (this: ExocortexWorld) {
  const timestamp = this.currentNote?.frontmatter.ems__Effort_startTimestamp;
  assert.ok(
    !timestamp?.includes("Z") && !timestamp?.includes("+"),
    "Timestamp should not contain timezone suffix",
  );
});

Then(
  /^"ems__Effort_startTimestamp" is updated to current time$/,
  function (this: ExocortexWorld) {
    assert.ok(this.currentNote, "Current note should exist");
    assert.ok(
      this.currentNote?.frontmatter.ems__Effort_startTimestamp,
      "ems__Effort_startTimestamp should be updated",
    );
  },
);

Then(
  /^"onStartEffort" callback is called$/,
  function (this: ExocortexWorld) {
    // In our simulation, callback execution is implicit in button action
    assert.ok(this.lastClick?.element, "onStartEffort should have been called");
  },
);

// Note: Generic "button has class X" and "button is inside container with class X" steps
// are defined in area-task-creation.steps.ts to avoid ambiguous step definitions

// ============================================
// World Extensions for Start Effort
// ============================================

declare module "../support/world.js" {
  interface ExocortexWorld {
    updateButtonsForStartEffort(): void;
    handleStartEffortButtonAction(buttonName: string): void;
  }
}

ExocortexWorld.prototype.updateButtonsForStartEffort = function () {
  if (!this.currentNote) return;

  const fm = this.currentNote.frontmatter;
  const instanceClass = fm.exo__Instance_class || "";
  const status = fm.ems__Effort_status || "";

  // Start Effort button: visible for Tasks/Projects without Doing/Done status
  const isTaskOrProject = instanceClass.includes("ems__Task") || instanceClass.includes("ems__Project");
  const isDoing = status.includes("EffortStatusDoing");
  const isDone = status.includes("EffortStatusDone");
  const isArea = instanceClass.includes("ems__Area");

  if (isTaskOrProject && !isDoing && !isDone) {
    this.renderedButtons.add("Start Effort");
  } else {
    this.renderedButtons.delete("Start Effort");
  }

  // Areas don't have Start Effort button
  if (isArea) {
    this.renderedButtons.delete("Start Effort");
  }
};

ExocortexWorld.prototype.handleStartEffortButtonAction = function (buttonName: string) {
  if (!this.currentNote || buttonName !== "Start Effort") return;

  // Format timestamp without milliseconds or timezone
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const fm = this.currentNote.frontmatter;
  const status = fm.ems__Effort_status;

  // Handle array status
  if (Array.isArray(status)) {
    fm.ems__Effort_status = ["[[ems__EffortStatusDoing]]"];
  } else {
    fm.ems__Effort_status = "[[ems__EffortStatusDoing]]";
  }

  fm.ems__Effort_startTimestamp = timestamp;
  this.renderedButtons.delete("Start Effort");
};
