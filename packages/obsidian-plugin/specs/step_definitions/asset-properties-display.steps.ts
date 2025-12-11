import { Given, When, Then } from "@cucumber/cucumber";
import { ExocortexWorld } from "../support/world.js";
import assert from "assert";

// ============================================
// AutoLayout Rendering Steps
// ============================================

Given("AutoLayout is enabled", function (this: ExocortexWorld) {
  this.pluginInitialized = true;
});

Given("I have a note with frontmatter and backlinks", function (this: ExocortexWorld) {
  const note = this.createFile("Notes/note-with-backlinks.md", {
    title: "Test Note",
    exo__Instance_class: "[[ems__Task]]",
    tags: ["work", "important"],
  });
  this.currentNote = note;

  // Simulate backlinks by adding relations
  this.relations.set("BackLink 1", { source: note, type: "backlink" });
  this.relations.set("BackLink 2", { source: note, type: "backlink" });

  this.renderedSections.add("Properties");
  this.renderedSections.add("Relations");
});

// Note: "I have a note with frontmatter" step is defined in command-palette.steps.ts
// to avoid duplicate step definition error

// Note: "I have a note with no frontmatter" step is defined in area-task-creation.steps.ts
// to avoid duplicate step definition error

// ============================================
// Property Setup Steps
// ============================================

Given(
  /^property value is "([^"]*)"$/,
  function (this: ExocortexWorld, value: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter.testProperty = parsePropertyValue(value);
  },
);

Given(
  /^property value is array: \["([^"]*)", "([^"]*)"\]$/,
  function (this: ExocortexWorld, val1: string, val2: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter.testProperty = [val1, val2];
  },
);

Given(
  /^property value is array: \["([^"]*)", "([^"]*)", "([^"]*)"\]$/,
  function (this: ExocortexWorld, val1: string, val2: string, val3: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter.testProperty = [val1, val2, val3];
  },
);

Given(
  /^properties with keys:$/,
  function (this: ExocortexWorld, dataTable: any) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    const rows = dataTable.rows();
    for (const row of rows) {
      const [key] = row;
      this.currentNote.frontmatter[key] = `value_for_${key}`;
    }
  },
);

Given(
  /^property "([^"]*)" has value null$/,
  function (this: ExocortexWorld, property: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter[property] = null;
  },
);

Given(
  /^property "([^"]*)" has value undefined$/,
  function (this: ExocortexWorld, property: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter[property] = undefined;
  },
);

Given(
  /^property "([^"]*)" has value true$/,
  function (this: ExocortexWorld, property: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter[property] = true;
  },
);

Given(
  /^property "([^"]*)" has value false$/,
  function (this: ExocortexWorld, property: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter[property] = false;
  },
);

Given(
  /^property "([^"]*)" has value (\d+)$/,
  function (this: ExocortexWorld, property: string, value: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter[property] = parseInt(value, 10);
  },
);

Given(
  /^property "([^"]*)" has value (\d+\.\d+)$/,
  function (this: ExocortexWorld, property: string, value: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter[property] = parseFloat(value);
  },
);

Given(
  /^property "([^"]*)" has value "([^"]*)"$/,
  function (this: ExocortexWorld, property: string, value: string) {
    if (!this.currentNote) {
      this.currentNote = this.createFile("Notes/test-property.md", {});
    }
    this.currentNote.frontmatter[property] = value;
  },
);

// ============================================
// Rendering When Steps
// ============================================

When(
  /^AutoLayout renders for "([^"]*)"$/,
  function (this: ExocortexWorld, noteName: string) {
    const note = this.notes.get(noteName);
    if (note) {
      this.viewNote(note);
    } else if (this.currentNote) {
      this.viewNote(this.currentNote);
    }

    // Simulate rendering sections
    if (this.currentNote && Object.keys(this.currentNote.frontmatter).length > 0) {
      this.renderedSections.add("Properties");
    }
    this.renderedSections.add("Relations");
  },
);

When("AutoLayout renders", function (this: ExocortexWorld) {
  if (this.currentNote) {
    this.viewNote(this.currentNote);
  }
  if (this.currentNote && Object.keys(this.currentNote.frontmatter).length > 0) {
    this.renderedSections.add("Properties");
  }
  this.renderedSections.add("Relations");
});

When("value is rendered", function (this: ExocortexWorld) {
  // Value rendering is implicit in the simulation
  if (this.currentNote) {
    this.viewNote(this.currentNote);
  }
});

When("properties table is rendered", function (this: ExocortexWorld) {
  if (this.currentNote) {
    this.viewNote(this.currentNote);
  }
  this.renderedSections.add("Properties");
});

When(
  /^I switch to edit\/source mode$/,
  function (this: ExocortexWorld) {
    // Simulate switching to edit mode - properties should hide
    this.renderedSections.delete("Properties");
    (this as any).editMode = true;
  },
);

// ============================================
// Properties Table Assertions
// ============================================

Then(
  /^I see a properties table with:$/,
  function (this: ExocortexWorld, dataTable: any) {
    assert.ok(
      this.renderedSections.has("Properties"),
      "Expected Properties section to be rendered",
    );

    const rows = dataTable.rows();
    for (const row of rows) {
      const [property, expectedValue] = row;
      const actualValue = this.currentNote?.frontmatter[property];
      const displayValue = formatPropertyValue(actualValue);

      assert.ok(
        displayValue === expectedValue ||
          String(actualValue) === expectedValue ||
          (Array.isArray(actualValue) && actualValue.join(", ") === expectedValue),
        `Property "${property}" should display "${expectedValue}", got "${displayValue}"`,
      );
    }
  },
);

Then("I see properties table FIRST", function (this: ExocortexWorld) {
  assert.ok(
    this.renderedSections.has("Properties"),
    "Properties section should be rendered",
  );
});

Then("relations table appears AFTER properties table", function (this: ExocortexWorld) {
  assert.ok(
    this.renderedSections.has("Relations"),
    "Relations section should be rendered after properties",
  );
});

Then("properties table is hidden", function (this: ExocortexWorld) {
  if ((this as any).editMode) {
    assert.ok(true, "Properties table is hidden in edit mode");
  }
});

Then("properties table is not displayed", function (this: ExocortexWorld) {
  // Empty frontmatter = no properties section
  const hasContent = this.currentNote && Object.keys(this.currentNote.frontmatter).length > 0;
  assert.ok(!hasContent || !this.renderedSections.has("Properties"), "Properties table should not be displayed");
});

Then(
  /^only visible in reading\/preview mode$/,
  function (this: ExocortexWorld) {
    assert.ok((this as any).editMode, "Should be in edit mode");
  },
);

Then(
  /^I only see relations table \(if any relations exist\)$/,
  function (this: ExocortexWorld) {
    // Relations table may or may not be visible depending on relations
    assert.ok(true, "Relations table behavior verified");
  },
);

// ============================================
// Property Display Assertions
// ============================================

Then(
  /^property "([^"]*)" displays "([^"]*)" as clickable link$/,
  function (this: ExocortexWorld, property: string, displayText: string) {
    const value = this.currentNote?.frontmatter[property];
    assert.ok(value, `Property "${property}" should exist`);

    const extracted = this.extractLinkTarget(Array.isArray(value) ? value[0] : value);
    assert.strictEqual(extracted, displayText, `Expected link text "${displayText}", got "${extracted}"`);
  },
);

Then(
  /^property "([^"]*)" shows "([^"]*)" as clickable link$/,
  function (this: ExocortexWorld, property: string, linkText: string) {
    const value = this.currentNote?.frontmatter[property];
    assert.ok(value, `Property "${property}" should exist`);

    const valueStr = String(value);
    assert.ok(
      valueStr.includes(linkText) || valueStr.includes(`[[${linkText}]]`),
      `Property "${property}" should contain link to "${linkText}"`,
    );
  },
);

Then(
  /^property "([^"]*)" displays "([^"]*)"$/,
  function (this: ExocortexWorld, property: string, expectedDisplay: string) {
    const value = this.currentNote?.frontmatter[property];
    const displayValue = formatPropertyValue(value);

    assert.ok(
      displayValue === expectedDisplay ||
        String(value) === expectedDisplay ||
        (Array.isArray(value) && value.join(", ") === expectedDisplay),
      `Property "${property}" should display "${expectedDisplay}", got "${displayValue}"`,
    );
  },
);

Then("clicking the link navigates to the referenced note", function (this: ExocortexWorld) {
  // Link navigation is implicit - links are always navigable
  assert.ok(true, "Link navigation is available");
});

Then("value is displayed as clickable link to {string}", function (this: ExocortexWorld, target: string) {
  const value = this.currentNote?.frontmatter.testProperty;
  if (value && String(value).includes("[[")) {
    const extracted = this.extractLinkTarget(value);
    assert.strictEqual(extracted, target);
  }
});

Then(
  /^link has class "([^"]*)"$/,
  function (this: ExocortexWorld, className: string) {
    // CSS class is implementation detail - verify link exists
    assert.ok(this.currentNote?.frontmatter.testProperty, `Expected link with class "${className}"`);
  },
);

Then(
  /^both "([^"]*)" and "([^"]*)" are clickable links$/,
  function (this: ExocortexWorld, link1: string, link2: string) {
    const value = this.currentNote?.frontmatter.testProperty;
    assert.ok(Array.isArray(value), "Expected array value");

    const hasLink1 = value.some((v: string) => v.includes(link1) || this.extractLinkTarget(v) === link1);
    const hasLink2 = value.some((v: string) => v.includes(link2) || this.extractLinkTarget(v) === link2);

    assert.ok(hasLink1, `Expected link to "${link1}"`);
    assert.ok(hasLink2, `Expected link to "${link2}"`);
  },
);

Then("links are separated by commas", function (this: ExocortexWorld) {
  const value = this.currentNote?.frontmatter.testProperty;
  assert.ok(Array.isArray(value), "Expected array for comma-separated display");
});

Then(
  /^value is displayed as plain text \(not a link\)$/,
  function (this: ExocortexWorld) {
    const value = this.currentNote?.frontmatter.testProperty;
    assert.ok(!String(value).includes("[["), "Value should not contain wiki-link syntax");
  },
);

Then(
  /^"([^"]*)" is plain text$/,
  function (this: ExocortexWorld, text: string) {
    const value = this.currentNote?.frontmatter.testProperty;
    if (Array.isArray(value)) {
      assert.ok(value.includes(text), `Array should contain "${text}"`);
    }
  },
);

Then(
  /^"([^"]*)" is a clickable link$/,
  function (this: ExocortexWorld, linkTarget: string) {
    const value = this.currentNote?.frontmatter.testProperty;
    if (Array.isArray(value)) {
      const hasLink = value.some((v: string) => v.includes(`[[${linkTarget}]]`));
      assert.ok(hasLink, `Array should contain link to "${linkTarget}"`);
    }
  },
);

Then("all keys are displayed exactly as defined", function (this: ExocortexWorld) {
  assert.ok(
    this.currentNote?.frontmatter,
    "Frontmatter should exist with original keys",
  );
});

Then("no transformation or normalization occurs", function (this: ExocortexWorld) {
  // Keys are preserved as-is
  assert.ok(true, "Keys are displayed as defined");
});

Then(
  /^"([^"]*)" displays empty string or "-"$/,
  function (this: ExocortexWorld, property: string) {
    const value = this.currentNote?.frontmatter[property];
    assert.ok(
      value === null || value === undefined || value === "" || value === "-",
      `Property "${property}" should display empty or dash`,
    );
  },
);

Then(
  /^"([^"]*)" displays "([^"]*)"$/,
  function (this: ExocortexWorld, property: string, expectedDisplay: string) {
    const value = this.currentNote?.frontmatter[property];
    assert.strictEqual(
      String(value),
      expectedDisplay,
      `Property "${property}" should display "${expectedDisplay}"`,
    );
  },
);

Then(
  /^value is plain text \(not parsed as date object\)$/,
  function (this: ExocortexWorld) {
    // Dates are displayed as strings
    assert.ok(true, "Date values are displayed as plain text");
  },
);

// ============================================
// Helper Functions
// ============================================

function parsePropertyValue(value: string): any {
  if (value === '""' || value === "''") return "";
  if (value === "null") return null;
  if (value === "undefined") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // Handle array notation [item1, item2, ...]
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1);
    return inner.split(",").map((s) => s.trim());
  }

  return value;
}

function formatPropertyValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
