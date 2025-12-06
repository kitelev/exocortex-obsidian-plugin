import { test, expect } from "@playwright/experimental-ct-react";
import { SelectField } from "../../../../src/presentation/components/property-editor/fields/SelectField";
import type { PropertySchemaDefinition } from "../../../../src/domain/property-editor/PropertySchemas";
import {
  EFFORT_STATUS_VALUES,
  TASK_SIZE_VALUES,
} from "../../../../src/domain/property-editor/PropertySchemas";

const createStatusProperty = (
  overrides: Partial<PropertySchemaDefinition> = {},
): PropertySchemaDefinition => ({
  name: "ems__Effort_status",
  type: "status-select",
  required: true,
  label: "Status",
  ...overrides,
});

const createSizeProperty = (
  overrides: Partial<PropertySchemaDefinition> = {},
): PropertySchemaDefinition => ({
  name: "ems__Task_size",
  type: "size-select",
  required: false,
  label: "Size",
  ...overrides,
});

test.describe("SelectField Component", () => {
  test("should render select with label", async ({ mount }) => {
    const property = createStatusProperty();
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    await expect(component).toBeVisible();

    // Check for select
    const select = component.locator("select");
    await expect(select).toBeVisible();

    // Check for label
    const label = component.locator("label.property-editor-label");
    await expect(label).toHaveText("Status*");
  });

  test("should have all status options for status-select type", async ({ mount }) => {
    const property = createStatusProperty();
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");

    // Verify all status options are present (options are attached even if not visible in closed dropdown)
    for (const status of EFFORT_STATUS_VALUES) {
      const option = select.locator(`option[value="${status.value}"]`);
      await expect(option).toBeAttached();
      await expect(option).toHaveText(status.label);
    }
  });

  test("should have all size options for size-select type", async ({ mount }) => {
    const property = createSizeProperty();
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");

    // Verify all size options are present (options are attached even if not visible in closed dropdown)
    for (const size of TASK_SIZE_VALUES) {
      const option = select.locator(`option[value="${size.value}"]`);
      await expect(option).toBeAttached();
      await expect(option).toHaveText(size.label);
    }
  });

  test("should display selected value correctly", async ({ mount }) => {
    const property = createStatusProperty();
    const component = await mount(
      <SelectField
        property={property}
        value="[[ems__EffortStatusDoing]]"
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");
    await expect(select).toHaveValue("[[ems__EffortStatusDoing]]");
  });

  test("should call onChange when selection changes", async ({ mount }) => {
    let changedValue: string | undefined;
    const onChange = (value: string) => {
      changedValue = value;
    };
    const property = createStatusProperty();

    const component = await mount(
      <SelectField
        property={property}
        value="[[ems__EffortStatusBacklog]]"
        onChange={onChange}
      />,
    );

    const select = component.locator("select");
    await select.selectOption("[[ems__EffortStatusDone]]");

    await expect.poll(() => changedValue).toBe("[[ems__EffortStatusDone]]");
  });

  test("should have 'Not specified' option when property is not required", async ({ mount }) => {
    const property = createSizeProperty({ required: false });
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");
    const notSpecifiedOption = select.locator("option[value='']");
    await expect(notSpecifiedOption).toBeAttached();
    await expect(notSpecifiedOption).toHaveText("Not specified");
  });

  test("should NOT have 'Not specified' option when property is required", async ({ mount }) => {
    const property = createStatusProperty({ required: true });
    const component = await mount(
      <SelectField
        property={property}
        value="[[ems__EffortStatusDraft]]"
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");
    const notSpecifiedOption = select.locator("option[value='']");
    await expect(notSpecifiedOption).toHaveCount(0);
  });

  test("should show required indicator when property is required", async ({ mount }) => {
    const property = createStatusProperty({ required: true });
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).toBeVisible();
    await expect(requiredIndicator).toHaveText("*");
  });

  test("should NOT show required indicator when property is not required", async ({ mount }) => {
    const property = createSizeProperty({ required: false });
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).not.toBeVisible();
  });

  test("should show description when provided", async ({ mount }) => {
    const property = createStatusProperty({ description: "Current workflow status" });
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).toBeVisible();
    await expect(description).toHaveText("Current workflow status");
  });

  test("should NOT show description when not provided", async ({ mount }) => {
    const property = createStatusProperty({ description: undefined });
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).not.toBeVisible();
  });

  test("should show error message when error is provided", async ({ mount }) => {
    const property = createStatusProperty();
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
        error="Status is required"
      />,
    );

    const errorMessage = component.locator(".property-editor-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Status is required");
  });

  test("should apply has-error class when error is provided", async ({ mount }) => {
    const property = createStatusProperty();
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
        error="Error"
      />,
    );

    const select = component.locator("select");
    await expect(select).toHaveClass(/has-error/);
  });

  test("should disable select when property is readOnly", async ({ mount }) => {
    const property = createStatusProperty({ readOnly: true });
    const component = await mount(
      <SelectField
        property={property}
        value="[[ems__EffortStatusDoing]]"
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");
    await expect(select).toBeDisabled();
  });

  test("should enable select when property is not readOnly", async ({ mount }) => {
    const property = createStatusProperty({ readOnly: false });
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");
    await expect(select).toBeEnabled();
  });

  test("should normalize value by removing quotes", async ({ mount }) => {
    const property = createStatusProperty();
    const component = await mount(
      <SelectField
        property={property}
        value='"[[ems__EffortStatusDoing]]"'
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");
    // The normalized value should match the option without quotes
    await expect(select).toHaveValue("[[ems__EffortStatusDoing]]");
  });

  test("should have dropdown class for styling", async ({ mount }) => {
    const property = createStatusProperty();
    const component = await mount(
      <SelectField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const select = component.locator("select");
    await expect(select).toHaveClass(/dropdown/);
  });
});
