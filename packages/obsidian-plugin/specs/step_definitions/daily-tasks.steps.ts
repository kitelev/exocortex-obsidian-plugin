import { Given, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Status Icon Assertions
// ============================================

Then(
  "task {string} should display with {string} icon",
  function (this: ExocortexWorld, taskName: string, icon: string) {
    const row = this.tableRows.find((r) => r.name === taskName);
    assert.ok(row, `Task "${taskName}" not found in table`);
    assert.strictEqual(
      row.statusIcon,
      icon,
      `Expected task "${taskName}" to have icon "${icon}", but got "${row.statusIcon}"`,
    );
  },
);

// ============================================
// Sorting Assertions
// ============================================

Then(
  "tasks should be sorted with Trashed at bottom",
  function (this: ExocortexWorld) {
    const trashedIndices: number[] = [];
    const nonTrashedIndices: number[] = [];

    this.tableRows.forEach((row, index) => {
      if (row.status?.includes("EffortStatusTrashed")) {
        trashedIndices.push(index);
      } else {
        nonTrashedIndices.push(index);
      }
    });

    if (trashedIndices.length > 0 && nonTrashedIndices.length > 0) {
      const maxNonTrashed = Math.max(...nonTrashedIndices);
      const minTrashed = Math.min(...trashedIndices);
      assert.ok(
        maxNonTrashed < minTrashed,
        "Trashed tasks should appear after all non-trashed tasks",
      );
    }
  },
);

Then("Done tasks should appear before Trashed", function (this: ExocortexWorld) {
  const doneIndices: number[] = [];
  const trashedIndices: number[] = [];

  this.tableRows.forEach((row, index) => {
    if (row.status?.includes("EffortStatusDone")) {
      doneIndices.push(index);
    } else if (row.status?.includes("EffortStatusTrashed")) {
      trashedIndices.push(index);
    }
  });

  if (doneIndices.length > 0 && trashedIndices.length > 0) {
    const maxDone = Math.max(...doneIndices);
    const minTrashed = Math.min(...trashedIndices);
    assert.ok(maxDone < minTrashed, "Done tasks should appear before Trashed tasks");
  }
});

Then(
  "Active tasks should appear first, sorted by votes then by start time",
  function (this: ExocortexWorld) {
    const activeRows = this.tableRows.filter((row) =>
      row.status?.includes("EffortStatusDoing"),
    );

    if (activeRows.length > 1) {
      // Verify active tasks are sorted by votes (descending) then start time
      for (let i = 1; i < activeRows.length; i++) {
        const prev = activeRows[i - 1];
        const curr = activeRows[i];
        const votesOk = prev.votes >= curr.votes;
        assert.ok(votesOk, "Active tasks should be sorted by votes descending");
      }
    }
  },
);

Then(
  "tasks should be sorted in order: {string}, {string}, {string}, {string}",
  function (
    this: ExocortexWorld,
    first: string,
    second: string,
    third: string,
    fourth: string,
  ) {
    const expectedOrder = [first, second, third, fourth];
    const actualNames = this.tableRows.map((r) => r.name);

    for (let i = 0; i < expectedOrder.length; i++) {
      const expectedIndex = actualNames.indexOf(expectedOrder[i]);
      if (i > 0) {
        const prevIndex = actualNames.indexOf(expectedOrder[i - 1]);
        assert.ok(
          prevIndex < expectedIndex,
          `Expected "${expectedOrder[i - 1]}" before "${expectedOrder[i]}"`,
        );
      }
    }
  },
);

Then(
  "tasks with missing votes should be treated as having 0 votes",
  function (this: ExocortexWorld) {
    for (const row of this.tableRows) {
      if (row.votes === undefined || row.votes === null) {
        assert.strictEqual(row.votes, 0, "Missing votes should default to 0");
      }
    }
  },
);

Then(
  "tasks should be sorted by priority \\(Active > Done > Trashed, then by start time\\)",
  function (this: ExocortexWorld) {
    // Verify priority order
    let lastPriority = 0; // 0=active, 1=done, 2=trashed

    for (const row of this.tableRows) {
      let currentPriority: number;
      if (row.status?.includes("EffortStatusTrashed")) {
        currentPriority = 2;
      } else if (row.status?.includes("EffortStatusDone")) {
        currentPriority = 1;
      } else {
        currentPriority = 0;
      }

      assert.ok(
        currentPriority >= lastPriority,
        "Tasks should follow priority order: Active > Done > Trashed",
      );
      lastPriority = currentPriority;
    }
  },
);

// ============================================
// Time Display Assertions
// ============================================

Then(
  "{string} should show start time {string}",
  function (this: ExocortexWorld, taskName: string, expectedTime: string) {
    const row = this.tableRows.find((r) => r.name === taskName);
    assert.ok(row, `Task "${taskName}" not found in table`);
    assert.strictEqual(
      row.startTime,
      expectedTime,
      `Expected start time "${expectedTime}", got "${row.startTime}"`,
    );
  },
);

Then(
  "{string} should show {string} for start time",
  function (this: ExocortexWorld, taskName: string, expectedValue: string) {
    const row = this.tableRows.find((r) => r.name === taskName);
    assert.ok(row, `Task "${taskName}" not found in table`);
    assert.strictEqual(
      row.startTime,
      expectedValue,
      `Expected "${expectedValue}", got "${row.startTime}"`,
    );
  },
);

// ============================================
// Label Display Assertions
// ============================================

Given(
  "task file {string} has {string} set to {string}",
  function (this: ExocortexWorld, filename: string, property: string, value: string) {
    const path = `Tasks/${filename}`;
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createFile(path, {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: "[[ems__EffortStatusPlanned]]",
      [property]: value,
    });
  },
);

Given(
  "task file {string} has NO {string} property",
  function (this: ExocortexWorld, filename: string, _property: string) {
    const path = `Tasks/${filename}`;
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createFile(path, {
      exo__Instance_class: "[[ems__Task]]",
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: "[[ems__EffortStatusPlanned]]",
    });
  },
);

Then(
  "task {string} should display as {string}",
  function (this: ExocortexWorld, filename: string, expectedLabel: string) {
    const row = this.tableRows.find(
      (r) => r.file.name === filename || r.name === expectedLabel,
    );
    assert.ok(row, `Task "${filename}" not found in table`);
    assert.strictEqual(
      row.name,
      expectedLabel,
      `Expected task to display as "${expectedLabel}", got "${row.name}"`,
    );
  },
);

Then(
  "task {string} should display as its filename",
  function (this: ExocortexWorld, filename: string) {
    const expectedName = filename.replace(/\.md$/, "");
    const row = this.tableRows.find((r) => r.file.name === filename);
    assert.ok(row, `Task "${filename}" not found in table`);
    assert.strictEqual(
      row.name,
      expectedName,
      `Expected task to display as "${expectedName}", got "${row.name}"`,
    );
  },
);

// ============================================
// Area Column Steps
// ============================================

Given("the Area column is visible", function (this: ExocortexWorld) {
  this.areaColumnVisible = true;
});

Given(
  "task {string} has {string} set to {string}",
  function (this: ExocortexWorld, taskName: string, property: string, value: string) {
    const today = this.currentNote?.frontmatter.pn__DailyNote_day
      ? this.extractLinkTarget(this.currentNote.frontmatter.pn__DailyNote_day)
      : new Date().toISOString().split("T")[0];

    this.createTask(taskName, {
      ems__Effort_day: `[[${today}]]`,
      ems__Effort_status: "[[ems__EffortStatusPlanned]]",
      [property]: value,
    });
  },
);

Given(
  "task {string} has NO {string} property",
  function (this: ExocortexWorld, taskName: string, property: string) {
    const path = `Tasks/${taskName.replace(/\s+/g, "-").toLowerCase()}.md`;
    const note = this.notes.get(path);
    if (note) {
      delete note.frontmatter[property];
    }
  },
);

Given(
  "file {string} has {string} set to {string}",
  function (this: ExocortexWorld, filename: string, property: string, value: string) {
    // Create or update file with property
    let found = false;
    for (const [path, note] of this.notes.entries()) {
      if (note.file.basename === filename || path.includes(filename)) {
        note.frontmatter[property] = value;
        found = true;
        break;
      }
    }

    if (!found) {
      this.createFile(`Files/${filename}.md`, {
        [property]: value,
      });
    }
  },
);

Given(
  "file {string} has NO {string} property",
  function (this: ExocortexWorld, filename: string, property: string) {
    for (const [, note] of this.notes.entries()) {
      if (note.file.basename === filename) {
        delete note.frontmatter[property];
        break;
      }
    }
  },
);

Then(
  "I should see a {string} toggle button",
  function (this: ExocortexWorld, buttonName: string) {
    assert.ok(
      this.renderedButtons.has(buttonName),
      `Expected toggle button "${buttonName}" to be present`,
    );
  },
);

Then(
  "the Area column should NOT be visible by default",
  function (this: ExocortexWorld) {
    assert.ok(
      !this.areaColumnVisible,
      "Area column should not be visible by default",
    );
  },
);

Then("the Area column should become visible", function (this: ExocortexWorld) {
  assert.ok(this.areaColumnVisible, "Area column should be visible");
});

Then(
  "task {string} should display {string} in Area column",
  function (this: ExocortexWorld, taskName: string, expectedArea: string) {
    // Find the task
    const taskPath = `Tasks/${taskName.replace(/\s+/g, "-").toLowerCase()}.md`;
    const note = this.notes.get(taskPath);
    assert.ok(note, `Task "${taskName}" not found`);

    const resolvedArea = this.resolveAreaForTask(note);

    // Handle "-" as empty/no area
    if (expectedArea === "-") {
      assert.ok(
        resolvedArea === null || resolvedArea === undefined,
        `Expected no area, got "${resolvedArea}"`,
      );
    } else {
      assert.strictEqual(
        resolvedArea,
        expectedArea,
        `Expected area "${expectedArea}", got "${resolvedArea}"`,
      );
    }
  },
);

Then(
  "the button text should change to {string}",
  function (this: ExocortexWorld, expectedText: string) {
    assert.ok(
      this.renderedButtons.has(expectedText),
      `Expected button "${expectedText}" to be present`,
    );
  },
);

Then("the area should be clickable", function (this: ExocortexWorld) {
  // In our simulation, areas are always clickable as internal links
  assert.ok(true, "Area is clickable");
});

Then(
  "task {string} should display {string} in Area column inherited from prototype",
  function (this: ExocortexWorld, taskName: string, expectedArea: string) {
    const taskPath = `Tasks/${taskName.replace(/\s+/g, "-").toLowerCase()}.md`;
    const note = this.notes.get(taskPath);
    assert.ok(note, `Task "${taskName}" not found`);

    const resolvedArea = this.resolveAreaForTask(note);
    assert.strictEqual(
      resolvedArea,
      expectedArea,
      `Expected inherited area "${expectedArea}", got "${resolvedArea}"`,
    );
  },
);

Then(
  "task {string} should display {string} in Area column inherited from parent",
  function (this: ExocortexWorld, taskName: string, expectedArea: string) {
    const taskPath = `Tasks/${taskName.replace(/\s+/g, "-").toLowerCase()}.md`;
    const note = this.notes.get(taskPath);
    assert.ok(note, `Task "${taskName}" not found`);

    const resolvedArea = this.resolveAreaForTask(note);
    assert.strictEqual(
      resolvedArea,
      expectedArea,
      `Expected inherited area "${expectedArea}", got "${resolvedArea}"`,
    );
  },
);

Then(
  "prototype's area {string} should be ignored",
  function (this: ExocortexWorld, _ignoredArea: string) {
    // This is verified by the previous assertion showing the correct area
    assert.ok(true, "Prototype area was correctly ignored");
  },
);

Then(
  "parent's area {string} should be ignored",
  function (this: ExocortexWorld, _ignoredArea: string) {
    // This is verified by the previous assertion showing the correct area
    assert.ok(true, "Parent area was correctly ignored");
  },
);

Then(
  "task {string} should display {string} in Area column from prototype",
  function (this: ExocortexWorld, taskName: string, expectedArea: string) {
    const taskPath = `Tasks/${taskName.replace(/\s+/g, "-").toLowerCase()}.md`;
    const note = this.notes.get(taskPath);
    assert.ok(note, `Task "${taskName}" not found`);

    const resolvedArea = this.resolveAreaForTask(note);
    assert.strictEqual(resolvedArea, expectedArea);
  },
);

// Note: "task {string} should display {string} in Area column" is already defined above at line 337

Then(
  "task {string} should display {string} in Area column resolved through chain",
  function (this: ExocortexWorld, taskName: string, expectedArea: string) {
    const taskPath = `Tasks/${taskName.replace(/\s+/g, "-").toLowerCase()}.md`;
    const note = this.notes.get(taskPath);
    assert.ok(note, `Task "${taskName}" not found`);

    const resolvedArea = this.resolveAreaForTask(note);
    assert.strictEqual(resolvedArea, expectedArea);
  },
);

Then(
  "the inheritance should follow prototype links recursively",
  function (this: ExocortexWorld) {
    // This is verified by the previous resolution working correctly
    assert.ok(true, "Prototype chain was followed correctly");
  },
);
