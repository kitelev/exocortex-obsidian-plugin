/**
 * Visual Regression Tests for Property Field Components
 *
 * Tests visual appearance of the property editor field components
 * including text fields, boolean toggles, number inputs, and selects.
 *
 * Run with: npm run test:component
 * Update snapshots: npm run test:component -- --update-snapshots
 */
import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TextField } from "../../../src/presentation/components/property-editor/fields/TextField";
import { BooleanField } from "../../../src/presentation/components/property-editor/fields/BooleanField";
import { NumberField } from "../../../src/presentation/components/property-editor/fields/NumberField";
import { SelectField } from "../../../src/presentation/components/property-editor/fields/SelectField";
import type { PropertySchemaDefinition } from "../../../src/domain/property-editor/PropertySchemas";

// Helper to create property schema definitions for tests
const createTextProperty = (
  overrides?: Partial<PropertySchemaDefinition>,
): PropertySchemaDefinition => ({
  name: "test_property",
  type: "text",
  required: false,
  label: "Test Property",
  description: "A test property description",
  ...overrides,
});

const createBooleanProperty = (
  overrides?: Partial<PropertySchemaDefinition>,
): PropertySchemaDefinition => ({
  name: "test_boolean",
  type: "boolean",
  required: false,
  label: "Test Boolean",
  description: "A boolean property",
  ...overrides,
});

const createNumberProperty = (
  overrides?: Partial<PropertySchemaDefinition>,
): PropertySchemaDefinition => ({
  name: "test_number",
  type: "number",
  required: false,
  label: "Test Number",
  description: "A number property",
  ...overrides,
});

const createSelectProperty = (
  overrides?: Partial<PropertySchemaDefinition>,
): PropertySchemaDefinition => ({
  name: "ems__Effort_status",
  type: "status-select",
  required: false,
  label: "Status",
  description: "Select a status",
  ...overrides,
});

test.describe("TextField Visual Regression", () => {
  test("default state with value", async ({ mount }) => {
    const component = await mount(
      <TextField
        property={createTextProperty({ label: "Asset Label" })}
        value="Sample text value"
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("text-field-default.png");
  });

  test("empty with placeholder", async ({ mount }) => {
    const component = await mount(
      <TextField
        property={createTextProperty({ label: "Enter Description" })}
        value=""
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("text-field-empty.png");
  });

  test("required field", async ({ mount }) => {
    const component = await mount(
      <TextField
        property={createTextProperty({ label: "Required Field", required: true })}
        value=""
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("text-field-required.png");
  });

  test("with error", async ({ mount }) => {
    const component = await mount(
      <TextField
        property={createTextProperty({ label: "Field with Error" })}
        value=""
        onChange={() => {}}
        error="This field cannot be empty"
      />,
    );
    await expect(component).toHaveScreenshot("text-field-error.png");
  });

  test("read-only state", async ({ mount }) => {
    const component = await mount(
      <TextField
        property={createTextProperty({ label: "Read Only", readOnly: true })}
        value="Cannot edit this"
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("text-field-readonly.png");
  });

  test("focused state", async ({ mount, page }) => {
    const component = await mount(
      <TextField
        property={createTextProperty({ label: "Focus Test" })}
        value=""
        onChange={() => {}}
      />,
    );
    await component.locator("input").focus();
    await page.waitForTimeout(100);
    await expect(component).toHaveScreenshot("text-field-focused.png");
  });
});

test.describe("BooleanField Visual Regression", () => {
  test("checked state", async ({ mount }) => {
    const component = await mount(
      <BooleanField
        property={createBooleanProperty({ label: "Is Archived" })}
        value={true}
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("boolean-field-checked.png");
  });

  test("unchecked state", async ({ mount }) => {
    const component = await mount(
      <BooleanField
        property={createBooleanProperty({ label: "Is Active" })}
        value={false}
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("boolean-field-unchecked.png");
  });

  test("with description", async ({ mount }) => {
    const component = await mount(
      <BooleanField
        property={createBooleanProperty({
          label: "Enable Feature",
          description: "Enable this feature for advanced functionality",
        })}
        value={false}
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("boolean-field-description.png");
  });

  test("required field", async ({ mount }) => {
    const component = await mount(
      <BooleanField
        property={createBooleanProperty({ label: "Required", required: true })}
        value={false}
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("boolean-field-required.png");
  });

  test("with error", async ({ mount }) => {
    const component = await mount(
      <BooleanField
        property={createBooleanProperty({ label: "Accept Terms" })}
        value={false}
        onChange={() => {}}
        error="You must accept the terms"
      />,
    );
    await expect(component).toHaveScreenshot("boolean-field-error.png");
  });
});

test.describe("NumberField Visual Regression", () => {
  test("default state with value", async ({ mount }) => {
    const component = await mount(
      <NumberField
        property={createNumberProperty({ label: "Votes" })}
        value={42}
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("number-field-default.png");
  });

  test("empty state", async ({ mount }) => {
    const component = await mount(
      <NumberField
        property={createNumberProperty({ label: "Priority" })}
        value=""
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("number-field-empty.png");
  });

  test("with min/max constraints", async ({ mount }) => {
    const component = await mount(
      <NumberField
        property={createNumberProperty({
          label: "Rating",
          min: 1,
          max: 5,
          description: "Rate from 1 to 5",
        })}
        value={3}
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("number-field-minmax.png");
  });

  test("required field", async ({ mount }) => {
    const component = await mount(
      <NumberField
        property={createNumberProperty({ label: "Score", required: true })}
        value=""
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("number-field-required.png");
  });

  test("with error", async ({ mount }) => {
    const component = await mount(
      <NumberField
        property={createNumberProperty({ label: "Amount" })}
        value={-5}
        onChange={() => {}}
        error="Value cannot be negative"
      />,
    );
    await expect(component).toHaveScreenshot("number-field-error.png");
  });

  test("focused state", async ({ mount, page }) => {
    const component = await mount(
      <NumberField
        property={createNumberProperty({ label: "Count" })}
        value={100}
        onChange={() => {}}
      />,
    );
    await component.locator("input").focus();
    await page.waitForTimeout(100);
    await expect(component).toHaveScreenshot("number-field-focused.png");
  });
});

test.describe("SelectField Visual Regression", () => {
  test("status select with value", async ({ mount }) => {
    const component = await mount(
      <SelectField
        property={createSelectProperty({ label: "Status" })}
        value="[[ems__EffortStatusDoing]]"
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("select-field-status.png");
  });

  test("status select first option", async ({ mount }) => {
    const component = await mount(
      <SelectField
        property={createSelectProperty({ label: "Status" })}
        value="[[ems__EffortStatusDraft]]"
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("select-field-first.png");
  });

  test("required status select", async ({ mount }) => {
    const component = await mount(
      <SelectField
        property={createSelectProperty({ label: "Status", required: true })}
        value="[[ems__EffortStatusToDo]]"
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("select-field-required.png");
  });

  test("optional status select (not specified)", async ({ mount }) => {
    const component = await mount(
      <SelectField
        property={createSelectProperty({ label: "Status", required: false })}
        value=""
        onChange={() => {}}
      />,
    );
    await expect(component).toHaveScreenshot("select-field-optional.png");
  });

  test("with error", async ({ mount }) => {
    const component = await mount(
      <SelectField
        property={createSelectProperty({ label: "Status" })}
        value=""
        onChange={() => {}}
        error="Please select a status"
      />,
    );
    await expect(component).toHaveScreenshot("select-field-error.png");
  });

  test("focused state", async ({ mount, page }) => {
    const component = await mount(
      <SelectField
        property={createSelectProperty({ label: "Status" })}
        value="[[ems__EffortStatusBacklog]]"
        onChange={() => {}}
      />,
    );
    await component.locator("select").focus();
    await page.waitForTimeout(100);
    await expect(component).toHaveScreenshot("select-field-focused.png");
  });
});
