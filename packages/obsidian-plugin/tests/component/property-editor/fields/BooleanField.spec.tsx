import { test, expect } from "@playwright/experimental-ct-react";
import { BooleanField } from "../../../../src/presentation/components/property-editor/fields/BooleanField";
import type { PropertySchemaDefinition } from "../../../../src/domain/property-editor/PropertySchemas";

const createProperty = (
  overrides: Partial<PropertySchemaDefinition> = {},
): PropertySchemaDefinition => ({
  name: "testBoolean",
  type: "boolean",
  required: false,
  label: "Test Boolean",
  ...overrides,
});

test.describe("BooleanField Component", () => {
  test("should render checkbox with label", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    await expect(component).toBeVisible();

    // Check for checkbox
    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).toBeVisible();

    // Check for label
    const label = component.locator("label.property-editor-label");
    await expect(label).toHaveText("Test Boolean");
  });

  test("should show checked state when value is true", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <BooleanField
        property={property}
        value={true}
        onChange={() => {}}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).toBeChecked();
  });

  test("should show unchecked state when value is false", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).not.toBeChecked();
  });

  test("should treat string 'true' as checked", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <BooleanField
        property={property}
        value="true"
        onChange={() => {}}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).toBeChecked();
  });

  test("should treat string 'yes' as checked", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <BooleanField
        property={property}
        value="yes"
        onChange={() => {}}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).toBeChecked();
  });

  test("should call onChange with true when clicking unchecked checkbox", async ({ mount }) => {
    let changedValue: boolean | undefined;
    const onChange = (value: boolean) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={onChange}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    // Use click() instead of check() - click always triggers the event
    await checkbox.click();

    await expect.poll(() => changedValue).toBe(true);
  });

  test("should call onChange with false when clicking checked checkbox", async ({ mount }) => {
    let changedValue: boolean | undefined;
    const onChange = (value: boolean) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <BooleanField
        property={property}
        value={true}
        onChange={onChange}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    // Use click() instead of uncheck() - click always triggers the event
    await checkbox.click();

    await expect.poll(() => changedValue).toBe(false);
  });

  test("should show required indicator when property is required", async ({ mount }) => {
    const property = createProperty({ required: true });
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).toBeVisible();
    await expect(requiredIndicator).toHaveText("*");
  });

  test("should NOT show required indicator when property is not required", async ({ mount }) => {
    const property = createProperty({ required: false });
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).not.toBeVisible();
  });

  test("should show description when provided", async ({ mount }) => {
    const property = createProperty({ description: "This is a test description" });
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).toBeVisible();
    await expect(description).toHaveText("This is a test description");
  });

  test("should NOT show description when not provided", async ({ mount }) => {
    const property = createProperty({ description: undefined });
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).not.toBeVisible();
  });

  test("should show error message when error is provided", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
        error="This field has an error"
      />,
    );

    const errorMessage = component.locator(".property-editor-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("This field has an error");
  });

  test("should apply has-error class when error is provided", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
        error="Error"
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).toHaveClass(/has-error/);
  });

  test("should disable checkbox when property is readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: true });
    const component = await mount(
      <BooleanField
        property={property}
        value={true}
        onChange={() => {}}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).toBeDisabled();
  });

  test("should enable checkbox when property is not readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: false });
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    await expect(checkbox).toBeEnabled();
  });

  test("should have correct id linking checkbox and label", async ({ mount }) => {
    const property = createProperty({ name: "exo__Asset_isArchived" });
    const component = await mount(
      <BooleanField
        property={property}
        value={false}
        onChange={() => {}}
      />,
    );

    const checkbox = component.locator("input[type='checkbox']");
    const label = component.locator("label.property-editor-label");

    const checkboxId = await checkbox.getAttribute("id");
    const labelFor = await label.getAttribute("for");

    expect(checkboxId).toBe("property-exo__Asset_isArchived");
    expect(labelFor).toBe(checkboxId);
  });
});
