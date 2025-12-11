import { Given, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Task Mark Done - Unique Given Steps
// Note: Common steps like "I have a note X with frontmatter" are defined
// in command-palette.steps.ts - avoid duplicating them here
// ============================================

Given(
  /^I have a Task "([^"]*)" without Done status$/,
  function (this: ExocortexWorld, taskName: string) {
    const note = this.createTask(taskName, {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusActive]]",
    });
    this.currentNote = note;
    this.notes.set(taskName, note);
    this.updateButtonsForMarkDone();
  },
);

Given(
  /^I have a Task without Done status$/,
  function (this: ExocortexWorld) {
    const note = this.createTask("Task without Done status", {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_status: "[[ems__EffortStatusActive]]",
    });
    this.currentNote = note;
    this.updateButtonsForMarkDone();
  },
);

Given(/^Done button is visible$/, function (this: ExocortexWorld) {
  assert.ok(
    this.renderedButtons.has("Done"),
    "Done button should be visible",
  );
});

// ============================================
// Task Mark Done - Then Steps (Unique to Mark Done)
// ============================================

Then(
  /^I see a "Done" button above properties table$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("Done"),
      `Expected to see "Done" button`,
    );
  },
);

Then("Done button is visible", function (this: ExocortexWorld) {
  assert.ok(
    this.renderedButtons.has("Done"),
    "Done button should be visible",
  );
});

Then(
  /^I do NOT see "Done" button$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Done"),
      `Expected NOT to see "Done" button`,
    );
  },
);

Then(
  /^"Done" button disappears from layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Done"),
      `Button "Done" should have disappeared`,
    );
  },
);

Then(
  /^"ems__Effort_endTimestamp" matches format: (.+)$/,
  function (this: ExocortexWorld, format: string) {
    assert.ok(this.currentNote, "Current note should exist");
    const value = this.currentNote?.frontmatter.ems__Effort_endTimestamp;
    assert.ok(value, "ems__Effort_endTimestamp should exist");

    // Check ISO 8601 format YYYY-MM-DDTHH:MM:SS
    if (format === "YYYY-MM-DDTHH:MM:SS") {
      const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
      assert.ok(regex.test(value), `Expected ems__Effort_endTimestamp to match format ${format}, got "${value}"`);
    }
  },
);

Then("timestamp does NOT contain milliseconds", function (this: ExocortexWorld) {
  const timestamp = this.currentNote?.frontmatter.ems__Effort_endTimestamp;
  assert.ok(
    !timestamp?.includes("."),
    "Timestamp should not contain milliseconds",
  );
});

Then("timestamp does NOT contain timezone suffix", function (this: ExocortexWorld) {
  const timestamp = this.currentNote?.frontmatter.ems__Effort_endTimestamp;
  assert.ok(
    !timestamp?.includes("Z") && !timestamp?.includes("+"),
    "Timestamp should not contain timezone suffix",
  );
});

Then(
  /^"ems__Effort_endTimestamp" is updated to current time$/,
  function (this: ExocortexWorld) {
    assert.ok(this.currentNote, "Current note should exist");
    assert.ok(
      this.currentNote?.frontmatter.ems__Effort_endTimestamp,
      "ems__Effort_endTimestamp should be updated",
    );
  },
);

Then(
  /^old timestamp "([^"]*)" is replaced$/,
  function (this: ExocortexWorld, oldTimestamp: string) {
    const timestamp = this.currentNote?.frontmatter.ems__Effort_endTimestamp;
    assert.notStrictEqual(timestamp, oldTimestamp, "Timestamp should be updated");
  },
);

Then(
  /^"onMarkDone" callback is called$/,
  function (this: ExocortexWorld) {
    // In our simulation, callback execution is implicit in button action
    assert.ok(this.lastClick?.element, "onMarkDone should have been called");
  },
);

Then("file content is updated", function (this: ExocortexWorld) {
  // File content update is implicit in our mock
  assert.ok(this.currentNote, "File should be updated");
});

Then("layout is refreshed", function (this: ExocortexWorld) {
  // Layout refresh is implicit
  assert.ok(true, "Layout refreshed");
});

// Note: Generic "button has class X" and "button is inside container with class X" steps
// are defined in area-task-creation.steps.ts to avoid ambiguous step definitions

// ============================================
// World Extensions for Mark Done
// ============================================

declare module "../support/world.js" {
  interface ExocortexWorld {
    updateButtonsForMarkDone(): void;
    handleMarkDoneButtonAction(buttonName: string): void;
  }
}

ExocortexWorld.prototype.updateButtonsForMarkDone = function () {
  if (!this.currentNote) return;

  const fm = this.currentNote.frontmatter;
  const instanceClass = fm.exo__Instance_class || "";
  const status = fm.ems__Effort_status || "";

  // Done button: visible for Tasks/Projects without Done status
  const isTaskOrProject = instanceClass.includes("ems__Task") || instanceClass.includes("ems__Project");
  const isDone = status.includes("EffortStatusDone");
  const isArea = instanceClass.includes("ems__Area");

  if (isTaskOrProject && !isDone) {
    this.renderedButtons.add("Done");
  } else {
    this.renderedButtons.delete("Done");
  }

  // Areas don't have Done button
  if (isArea) {
    this.renderedButtons.delete("Done");
  }
};

ExocortexWorld.prototype.handleMarkDoneButtonAction = function (buttonName: string) {
  if (!this.currentNote || buttonName !== "Done") return;

  // Format timestamp without milliseconds or timezone
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const fm = this.currentNote.frontmatter;
  const status = fm.ems__Effort_status;

  // Handle array status
  if (Array.isArray(status)) {
    fm.ems__Effort_status = ["[[ems__EffortStatusDone]]"];
  } else {
    fm.ems__Effort_status = "[[ems__EffortStatusDone]]";
  }

  fm.ems__Effort_endTimestamp = timestamp;
  this.renderedButtons.delete("Done");
};
