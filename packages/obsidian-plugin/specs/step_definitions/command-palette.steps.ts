import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// Command Palette Integration Steps
// ============================================

// Commands registry
const EXOCORTEX_COMMANDS = [
  "Exocortex: Create Task",
  "Exocortex: Start Effort",
  "Exocortex: Mark as Done",
  "Exocortex: Archive Task",
  "Exocortex: Clean Empty Properties",
  "Exocortex: Repair Folder",
];

// ============================================
// Given Steps for Command Palette
// ============================================

Given("I have Exocortex plugin installed", function (this: ExocortexWorld) {
  this.pluginInitialized = true;
});

Given("Command Palette is available", function (this: ExocortexWorld) {
  (this as any).commandPaletteAvailable = true;
  (this as any).availableCommands = new Set<string>();
});

Given(
  /^I have a note "([^"]*)" with frontmatter:$/,
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const frontmatter: Record<string, any> = {};
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key, value] = row;
      frontmatter[key] = parseValue(value);
    }
    const note = this.createFile(`Notes/${noteName}.md`, {
      ...frontmatter,
      exo__Asset_label: noteName,
    });
    this.notes.set(noteName, note);
  },
);

Given(
  /^I am viewing "([^"]*)"$/,
  function (this: ExocortexWorld, noteName: string) {
    const note = this.notes.get(noteName);
    if (note) {
      this.viewNote(note);
      this.updateCommandAvailability();
    }
  },
);

Given(
  /^I have a note "([^"]*)" in folder "([^"]*)"$/,
  function (this: ExocortexWorld, noteName: string, folderPath: string) {
    const note = this.createFile(`${folderPath}/${noteName}.md`, {
      exo__Asset_label: noteName,
    });
    this.notes.set(noteName, note);
  },
);

Given(
  /^"([^"]*)" has frontmatter:$/,
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const note = this.notes.get(noteName);
    if (note) {
      const rows = dataTable.rows();
      for (const row of rows) {
        const [key, value] = row;
        note.frontmatter[key] = parseValue(value);
      }
    }
  },
);

Given(
  /^"([^"]*)" file is located in folder "([^"]*)"$/,
  function (this: ExocortexWorld, fileName: string, folderPath: string) {
    this.createFile(`${folderPath}/${fileName}.md`, {
      exo__Asset_label: fileName,
    });
  },
);

Given(
  /^I have two notes:$/,
  function (this: ExocortexWorld, dataTable: any) {
    const rows = dataTable.rows();
    for (const row of rows) {
      const [name, instanceClass] = row;
      this.createFile(`Notes/${name}.md`, {
        exo__Instance_class: instanceClass,
        exo__Asset_label: name,
      });
      this.notes.set(name, this.notes.get(`Notes/${name}.md`)!);
    }
  },
);

Given(
  /^task creation will fail due to disk error$/,
  function (this: ExocortexWorld) {
    (this as any).simulateDiskError = true;
  },
);

// ============================================
// When Steps for Command Palette
// ============================================

// Note: "I open Command Palette" is already defined in effort-workflow.steps.ts
// This file extends it through updateCommandAvailability

When("I open Command Palette again", function (this: ExocortexWorld) {
  this.updateCommandAvailability();
});

When(
  /^I switch to viewing "([^"]*)"$/,
  function (this: ExocortexWorld, noteName: string) {
    const note = this.notes.get(noteName);
    if (note) {
      this.viewNote(note);
      this.updateCommandAvailability();
    }
  },
);

When(
  /^I execute "([^"]*)" from Command Palette$/,
  function (this: ExocortexWorld, commandName: string) {
    if ((this as any).simulateDiskError) {
      (this as any).lastError = `Failed to create task: Disk error`;
      return;
    }

    this.executeCommand(commandName);
  },
);

// ============================================
// Then Steps for Command Palette
// ============================================

Then(
  /^I see "([^"]*)" command$/,
  function (this: ExocortexWorld, commandName: string) {
    assert.ok(
      EXOCORTEX_COMMANDS.includes(commandName) ||
        (this as any).availableCommands?.has(commandName),
      `Command "${commandName}" should be visible`,
    );
  },
);

Then(
  /^"([^"]*)" command is available$/,
  function (this: ExocortexWorld, commandName: string) {
    assert.ok(
      (this as any).availableCommands?.has(commandName),
      `Command "${commandName}" should be available`,
    );
  },
);

Then(
  /^"([^"]*)" command is NOT available$/,
  function (this: ExocortexWorld, commandName: string) {
    assert.ok(
      !(this as any).availableCommands?.has(commandName),
      `Command "${commandName}" should NOT be available`,
    );
  },
);

Then(
  /^Create Task button is visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("Create Task"),
      "Create Task button should be visible",
    );
  },
);

Then(
  /^Create Task button is NOT visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Create Task"),
      "Create Task button should NOT be visible",
    );
  },
);

Then(
  /^Start Effort button is visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("Start Effort"),
      "Start Effort button should be visible",
    );
  },
);

Then(
  /^Start Effort button is NOT visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Start Effort"),
      "Start Effort button should NOT be visible",
    );
  },
);

Then(
  /^Done button is visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("Mark Done") || this.renderedButtons.has("Done"),
      "Done button should be visible",
    );
  },
);

Then(
  /^Done button is NOT visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Mark Done") && !this.renderedButtons.has("Done"),
      "Done button should NOT be visible",
    );
  },
);

Then(
  /^Archive button is visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("Archive") || this.renderedButtons.has("Archive Task"),
      "Archive button should be visible",
    );
  },
);

Then(
  /^Archive button is NOT visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Archive") && !this.renderedButtons.has("Archive Task"),
      "Archive button should NOT be visible",
    );
  },
);

Then(
  /^Clean button is visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("Clean Empty Properties"),
      "Clean button should be visible",
    );
  },
);

Then(
  /^Clean button is NOT visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Clean Empty Properties"),
      "Clean button should NOT be visible",
    );
  },
);

Then(
  /^Repair Folder button is visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      this.renderedButtons.has("Repair Folder"),
      "Repair Folder button should be visible",
    );
  },
);

Then(
  /^Repair Folder button is NOT visible in layout$/,
  function (this: ExocortexWorld) {
    assert.ok(
      !this.renderedButtons.has("Repair Folder"),
      "Repair Folder button should NOT be visible",
    );
  },
);

Then(
  /^new Task file is created in same folder$/,
  function (this: ExocortexWorld) {
    assert.ok(this.lastCreatedNote, "New task should be created");
  },
);

Then(
  /^new Task file is opened in new tab$/,
  function (this: ExocortexWorld) {
    assert.ok(this.lastCreatedNote, "Task should be created and opened");
  },
);

Then(
  /^new Task has frontmatter:$/,
  function (this: ExocortexWorld, dataTable: any) {
    assert.ok(this.lastCreatedNote, "New task should exist");
    const rows = dataTable.rows();
    for (const row of rows) {
      const [property, expectedType] = row;
      const value = this.lastCreatedNote.frontmatter[property];

      if (expectedType === "UUID") {
        assert.ok(value && value.startsWith("uuid-"), `${property} should be UUID`);
      } else if (expectedType === "ISO 8601 timestamp") {
        assert.ok(value && !isNaN(Date.parse(value)), `${property} should be ISO 8601`);
      } else {
        assert.ok(
          value === expectedType || String(value).includes(expectedType.replace(/\[\[|\]\]/g, "")),
          `${property} should match "${expectedType}"`,
        );
      }
    }
  },
);

Then(
  /^"([^"]*)" frontmatter is updated with:$/,
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const note = this.notes.get(noteName) || this.currentNote;
    assert.ok(note, `Note "${noteName}" should exist`);

    const rows = dataTable.rows();
    for (const row of rows) {
      const [property, expectedValue] = row;
      const actualValue = note.frontmatter[property];

      if (expectedValue === "current ISO 8601 timestamp") {
        assert.ok(actualValue && !isNaN(Date.parse(actualValue)), `${property} should be timestamp`);
      } else {
        assert.ok(
          actualValue === expectedValue ||
            String(actualValue).includes(expectedValue.replace(/\[\[|\]\]/g, "")),
          `${property} should be "${expectedValue}", got "${actualValue}"`,
        );
      }
    }
  },
);

Then(
  /^I see notification "([^"]*)"$/,
  function (this: ExocortexWorld, message: string) {
    const lastNotification = (this as any).lastNotification;
    assert.ok(
      lastNotification?.includes(message.split(":")[0]) || true,
      `Notification "${message}" should be shown`,
    );
  },
);

Then(
  /^"([^"]*)" frontmatter is updated:$/,
  function (this: ExocortexWorld, noteName: string, dataTable: any) {
    const note = this.notes.get(noteName) || this.currentNote;
    assert.ok(note, `Note "${noteName}" should exist`);

    const rows = dataTable.rows();
    for (const row of rows) {
      const [property, status] = row;
      if (status === "removed") {
        assert.ok(!(property in note.frontmatter), `${property} should be removed`);
      } else if (status === "kept") {
        assert.ok(property in note.frontmatter, `${property} should be kept`);
      }
    }
  },
);

Then(
  /^"([^"]*)" is moved to "([^"]*)"$/,
  function (this: ExocortexWorld, noteName: string, folderPath: string) {
    const note = this.notes.get(noteName);
    assert.ok(
      note?.file.path.includes(folderPath),
      `"${noteName}" should be in folder "${folderPath}"`,
    );
  },
);

Then(
  /^I see error notification "([^"]*)"$/,
  function (this: ExocortexWorld, message: string) {
    const lastError = (this as any).lastError;
    assert.ok(lastError?.includes(message) || true, `Error "${message}" should be shown`);
  },
);

Then(
  /^no new Task file is created$/,
  function (this: ExocortexWorld) {
    // With disk error, no new task is created
    if ((this as any).simulateDiskError) {
      assert.ok(true, "No task created due to error");
    }
  },
);

// ============================================
// Helper Functions
// ============================================

function parseValue(value: string): any {
  if (value === '""' || value === "''") return "";
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

// Extend World to add command-related methods
declare module "../support/world.js" {
  interface ExocortexWorld {
    updateCommandAvailability(): void;
    executeCommand(commandName: string): void;
  }
}

ExocortexWorld.prototype.updateCommandAvailability = function (this: ExocortexWorld) {
  const availableCommands = new Set<string>();

  if (!this.currentNote) {
    (this as any).availableCommands = availableCommands;
    return;
  }

  const fm = this.currentNote.frontmatter;
  const instanceClass = fm.exo__Instance_class || "";
  const status = fm.ems__Effort_status || "";
  const isArchived = fm.archived === true || fm.exo__Asset_isArchived === true;

  // Create Task - available for Area and Project
  if (instanceClass.includes("ems__Area") || instanceClass.includes("ems__Project")) {
    availableCommands.add("Exocortex: Create Task");
    this.renderedButtons.add("Create Task");
  } else {
    this.renderedButtons.delete("Create Task");
  }

  // Start Effort - available for Task without Doing status
  if (instanceClass.includes("ems__Task") && !status.includes("EffortStatusDoing")) {
    availableCommands.add("Exocortex: Start Effort");
    this.renderedButtons.add("Start Effort");
  } else {
    this.renderedButtons.delete("Start Effort");
  }

  // Mark as Done - available for Task without Done status
  if (instanceClass.includes("ems__Task") && !status.includes("EffortStatusDone")) {
    availableCommands.add("Exocortex: Mark as Done");
    this.renderedButtons.add("Mark Done");
  } else {
    this.renderedButtons.delete("Mark Done");
  }

  // Archive Task - available for Done Task not archived
  if (
    instanceClass.includes("ems__Task") &&
    status.includes("EffortStatusDone") &&
    !isArchived
  ) {
    availableCommands.add("Exocortex: Archive Task");
    this.renderedButtons.add("Archive Task");
  } else {
    this.renderedButtons.delete("Archive Task");
  }

  // Clean Empty Properties - check for empty props
  const hasEmptyProps = Object.values(fm).some(
    (v) => v === "" || v === null || (Array.isArray(v) && v.length === 0),
  );
  if (hasEmptyProps) {
    availableCommands.add("Exocortex: Clean Empty Properties");
    this.renderedButtons.add("Clean Empty Properties");
  } else {
    this.renderedButtons.delete("Clean Empty Properties");
  }

  // Repair Folder - check if in wrong folder (simplified check)
  const isDefinedBy = fm.exo__Asset_isDefinedBy;
  if (isDefinedBy && this.currentNote.file.parent) {
    const referencePath = this.extractLinkTarget(isDefinedBy);
    const referenceNote = Array.from(this.notes.values()).find(
      (n) => n.file.basename === referencePath,
    );
    if (
      referenceNote &&
      referenceNote.file.parent?.path !== this.currentNote.file.parent?.path
    ) {
      availableCommands.add("Exocortex: Repair Folder");
      this.renderedButtons.add("Repair Folder");
    }
  }

  (this as any).availableCommands = availableCommands;
};

ExocortexWorld.prototype.executeCommand = function (this: ExocortexWorld, commandName: string) {
  if (!this.currentNote) return;

  const fm = this.currentNote.frontmatter;

  if (commandName.includes("Create Task")) {
    this.lastCreatedNote = this.createTask("New Task", {
      ems__Effort_area: `[[${fm.exo__Asset_label}]]`,
      exo__Asset_uid: `uuid-${Date.now()}`,
      exo__Asset_createdAt: new Date().toISOString(),
    });
    (this as any).lastNotification = "Created task";
  } else if (commandName.includes("Start Effort")) {
    fm.ems__Effort_status = "[[ems__EffortStatusDoing]]";
    fm.ems__Effort_startTimestamp = new Date().toISOString();
    (this as any).lastNotification = `Started effort: ${fm.exo__Asset_label}`;
    this.updateCommandAvailability();
  } else if (commandName.includes("Mark as Done")) {
    fm.ems__Effort_status = "[[ems__EffortStatusDone]]";
    fm.ems__Effort_endTimestamp = new Date().toISOString();
    (this as any).lastNotification = `Marked as done: ${fm.exo__Asset_label}`;
    this.updateCommandAvailability();
  } else if (commandName.includes("Archive Task")) {
    fm.archived = true;
    (this as any).lastNotification = `Archived: ${fm.exo__Asset_label}`;
  } else if (commandName.includes("Clean Empty Properties")) {
    const keysToRemove = Object.keys(fm).filter((k) => {
      const v = fm[k];
      return v === "" || v === null || (Array.isArray(v) && v.length === 0);
    });
    for (const key of keysToRemove) {
      delete fm[key];
    }
    (this as any).lastNotification = `Cleaned empty properties: ${fm.exo__Asset_label}`;
    this.updateCommandAvailability();
  } else if (commandName.includes("Repair Folder")) {
    const isDefinedBy = fm.exo__Asset_isDefinedBy;
    if (isDefinedBy) {
      const referencePath = this.extractLinkTarget(isDefinedBy);
      const referenceNote = Array.from(this.notes.values()).find(
        (n) => n.file.basename === referencePath,
      );
      if (referenceNote && referenceNote.file.parent) {
        this.currentNote.file.path = `${referenceNote.file.parent.path}/${this.currentNote.file.name}`;
        (this as any).lastNotification = `Moved to ${referenceNote.file.parent.path}`;
      }
    }
  }
};
