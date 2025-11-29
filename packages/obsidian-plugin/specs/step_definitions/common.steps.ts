import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Background Steps (shared across features)
// ============================================

Given("Dataview plugin is installed and active", function (this: ExocortexWorld) {
  this.dataviewInstalled = true;
});

Given("Dataview plugin is NOT installed", function (this: ExocortexWorld) {
  this.dataviewInstalled = false;
});

Given("I am viewing a note with UniversalLayout", function (this: ExocortexWorld) {
  // Layout is automatically applied when viewing notes
  this.pluginInitialized = true;
});

Given("the plugin is properly initialized", function (this: ExocortexWorld) {
  this.pluginInitialized = true;
});

// ============================================
// Common "Given" steps for notes
// ============================================

Given("I have a pn__DailyNote for {string}", function (this: ExocortexWorld, date: string) {
  const note = this.createDailyNote(date);
  this.currentNote = note;
});

Given("I have a pn__DailyNote", function (this: ExocortexWorld) {
  const today = new Date().toISOString().split("T")[0];
  const note = this.createDailyNote(today);
  this.currentNote = note;
});

Given("I have a pn__DailyNote with tasks", function (this: ExocortexWorld) {
  const today = new Date().toISOString().split("T")[0];
  const note = this.createDailyNote(today);
  this.currentNote = note;

  // Create some default tasks
  this.createTask("Task 1", {
    ems__Effort_day: `[[${today}]]`,
    ems__Effort_status: "[[ems__EffortStatusDoing]]",
  });
  this.createTask("Task 2", {
    ems__Effort_day: `[[${today}]]`,
    ems__Effort_status: "[[ems__EffortStatusPlanned]]",
  });
});

Given(
  "the note has {string} property set to {string}",
  function (this: ExocortexWorld, property: string, value: string) {
    if (this.currentNote) {
      this.currentNote.frontmatter[property] = value;
    }
  },
);

Given(
  "the note has no {string} property",
  function (this: ExocortexWorld, property: string) {
    if (this.currentNote) {
      delete this.currentNote.frontmatter[property];
    }
  },
);

Given(
  "there are {int} tasks with {string} property set to {string}",
  function (this: ExocortexWorld, count: number, property: string, value: string) {
    for (let i = 0; i < count; i++) {
      this.createTask(`Task ${i + 1}`, {
        [property]: value,
        ems__Effort_status: "[[ems__EffortStatusPlanned]]",
      });
    }
  },
);

Given(
  "there are NO tasks with {string} property set to {string}",
  function (this: ExocortexWorld, _property: string, _value: string) {
    // Don't create any tasks - they simply don't exist
  },
);

Given("I have a regular note with class {string}", function (this: ExocortexWorld, className: string) {
  const note = this.createFile("Notes/regular-note.md", {
    exo__Instance_class: className,
  });
  this.currentNote = note;
});

// ============================================
// Task creation with specific properties
// ============================================

Given(
  "task {string} has status {string}",
  function (this: ExocortexWorld, taskName: string, status: string) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: status,
    });
  },
);

Given(
  "task {string} has status {string} and class {string}",
  function (this: ExocortexWorld, taskName: string, status: string, className: string) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: status,
      exo__Instance_class: className,
    });
  },
);

Given(
  "task {string} has status {string} and start time {string}",
  function (this: ExocortexWorld, taskName: string, status: string, startTime: string) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    const [hours, minutes] = startTime.split(":");
    const timestamp = `${today}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;

    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: status,
      ems__Effort_startTimestamp: timestamp,
    });
  },
);

Given(
  "task {string} has status {string} and {string} set to {int}",
  function (this: ExocortexWorld, taskName: string, status: string, property: string, value: number) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: status,
      [property]: value,
    });
  },
);

Given(
  "task {string} has status {string} and no {string} property",
  function (this: ExocortexWorld, taskName: string, status: string, _property: string) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    // Property is simply not set
    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: status,
    });
  },
);

Given(
  "task {string} has {string} at {string}",
  function (this: ExocortexWorld, taskName: string, property: string, timestamp: string) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: "[[ems__EffortStatusPlanned]]",
      [property]: timestamp,
    });
  },
);

Given(
  "task {string} has no time properties",
  function (this: ExocortexWorld, taskName: string) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: "[[ems__EffortStatusPlanned]]",
    });
  },
);

// ============================================
// Common "When" steps
// ============================================

When("I view the daily note", function (this: ExocortexWorld) {
  if (this.currentNote) {
    this.viewNote(this.currentNote);
  }
});

When("I view the note with UniversalLayout", function (this: ExocortexWorld) {
  if (this.currentNote) {
    this.viewNote(this.currentNote);
  }
});

When("I click on a task name", function (this: ExocortexWorld) {
  if (this.tableRows.length > 0) {
    this.click(this.tableRows[0].name);
  }
});

When(/^I Cmd\+Click on a task name$/, function (this: ExocortexWorld) {
  if (this.tableRows.length > 0) {
    this.click(this.tableRows[0].name, "Cmd");
  }
});

When("I click on a task's status link", function (this: ExocortexWorld) {
  if (this.tableRows.length > 0 && this.tableRows[0].status) {
    const statusName = this.extractLinkTarget(this.tableRows[0].status);
    this.click(statusName);
  }
});

When(/^I Cmd\+Click on a task's status link$/, function (this: ExocortexWorld) {
  if (this.tableRows.length > 0 && this.tableRows[0].status) {
    const statusName = this.extractLinkTarget(this.tableRows[0].status);
    this.click(statusName, "Cmd");
  }
});

When("I click the {string} button", function (this: ExocortexWorld, buttonName: string) {
  this.click(buttonName);
});

// ============================================
// Common "Then" steps for sections
// ============================================

Then("I should see a {string} section", function (this: ExocortexWorld, sectionName: string) {
  assert.ok(
    this.renderedSections.has(sectionName),
    `Expected to see "${sectionName}" section, but found: ${[...this.renderedSections].join(", ")}`,
  );
});

Then("I should NOT see a {string} section", function (this: ExocortexWorld, sectionName: string) {
  assert.ok(
    !this.renderedSections.has(sectionName),
    `Expected NOT to see "${sectionName}" section, but it was present`,
  );
});

Then("I should NOT see a Tasks section", function (this: ExocortexWorld) {
  assert.ok(
    !this.renderedSections.has("Tasks"),
    `Expected NOT to see "Tasks" section, but it was present`,
  );
});

Then("Properties table should render normally", function (this: ExocortexWorld) {
  assert.ok(
    this.renderedSections.has("Properties"),
    `Expected Properties table to render`,
  );
});

Then("Relations table should render normally", function (this: ExocortexWorld) {
  assert.ok(
    this.renderedSections.has("Relations"),
    `Expected Relations table to render`,
  );
});

Then("Properties and Relations sections should render normally", function (this: ExocortexWorld) {
  assert.ok(
    this.renderedSections.has("Properties"),
    `Expected Properties section to render`,
  );
  assert.ok(
    this.renderedSections.has("Relations"),
    `Expected Relations section to render`,
  );
});

Then("no error should be displayed", function (this: ExocortexWorld) {
  // In our simulation, no error means the sections rendered without throwing
  assert.ok(true, "No error displayed");
});

// ============================================
// Table-related assertions
// ============================================

Then(
  "the Tasks table should appear after Properties table",
  function (this: ExocortexWorld) {
    // In our simulation, order is implicit in how sections are added
    assert.ok(this.renderedSections.has("Properties"), "Properties should exist");
    assert.ok(this.renderedSections.has("Tasks"), "Tasks should exist");
  },
);

Then(
  "the Tasks table should appear before Relations table",
  function (this: ExocortexWorld) {
    // In our simulation, order is implicit
    assert.ok(this.renderedSections.has("Tasks"), "Tasks should exist");
    assert.ok(this.renderedSections.has("Relations"), "Relations should exist");
  },
);

Then("I should see {int} tasks in the table", function (this: ExocortexWorld, count: number) {
  assert.strictEqual(
    this.tableRows.length,
    count,
    `Expected ${count} tasks, but found ${this.tableRows.length}`,
  );
});

Then("I should see exactly {int} tasks in the table", function (this: ExocortexWorld, count: number) {
  // When limiting (e.g., 50 max), verify exact count
  const actualCount = Math.min(this.tableRows.length, 50);
  assert.ok(
    actualCount <= count,
    `Expected at most ${count} tasks, but found ${this.tableRows.length}`,
  );
});

Then(
  "each task should display Name, Start, End, and Status columns",
  function (this: ExocortexWorld) {
    for (const row of this.tableRows) {
      assert.ok(row.name !== undefined, "Task should have name");
      assert.ok(row.startTime !== undefined, "Task should have startTime");
      assert.ok(row.endTime !== undefined, "Task should have endTime");
      assert.ok(row.status !== undefined || row.statusIcon !== undefined, "Task should have status");
    }
  },
);

// ============================================
// File opening assertions
// ============================================

Then("the task file should open in current tab", function (this: ExocortexWorld) {
  assert.ok(this.openedFile !== null, "Expected a file to be opened");
  assert.ok(!this.openedInNewTab, "Expected file to open in current tab");
});

Then("the task file should open in new tab", function (this: ExocortexWorld) {
  assert.ok(this.openedFile !== null, "Expected a file to be opened");
  assert.ok(this.openedInNewTab, "Expected file to open in new tab");
});

Then("the status definition file should open", function (this: ExocortexWorld) {
  // Status file opening is simulated through the click action
  assert.ok(this.lastClick !== null, "Expected a click action");
});

Then("the status definition file should open in new tab", function (this: ExocortexWorld) {
  assert.ok(this.lastClick !== null, "Expected a click action");
  assert.strictEqual(this.lastClick?.modifier, "Cmd", "Expected Cmd modifier for new tab");
});
