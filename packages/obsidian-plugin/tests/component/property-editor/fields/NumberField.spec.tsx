import { test, expect } from "@playwright/experimental-ct-react";
import { NumberField } from "../../../../src/presentation/components/property-editor/fields/NumberField";
import type { PropertySchemaDefinition } from "../../../../src/domain/property-editor/PropertySchemas";

const createProperty = (
  overrides: Partial<PropertySchemaDefinition> = {},
): PropertySchemaDefinition => ({
  name: "testNumber",
  type: "number",
  required: false,
  label: "Test Number",
  ...overrides,
});

test.describe("NumberField Component", () => {
  test("should render number input with label", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
      />,
    );

    await expect(component).toBeVisible();

    // Check for number input
    const input = component.locator("input[type='number']");
    await expect(input).toBeVisible();

    // Check for label
    const label = component.locator("label.property-editor-label");
    await expect(label).toHaveText("Test Number");
  });

  test("should display numeric value correctly", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <NumberField
        property={property}
        value={42}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveValue("42");
  });

  test("should handle string value by parsing to number", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <NumberField
        property={property}
        value="123"
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveValue("123");
  });

  test("should call onChange with parsed number value", async ({ mount }) => {
    let changedValue: number | undefined;
    const onChange = (value: number) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={onChange}
      />,
    );

    const input = component.locator("input[type='number']");
    await input.fill("99");

    await expect.poll(() => changedValue).toBe(99);
  });

  test("should call onChange with 0 when input is cleared", async ({ mount }) => {
    let changedValue: number | undefined;
    const onChange = (value: number) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <NumberField
        property={property}
        value={42}
        onChange={onChange}
      />,
    );

    const input = component.locator("input[type='number']");
    await input.fill("");

    await expect.poll(() => changedValue).toBe(0);
  });

  test("should show required indicator when property is required", async ({ mount }) => {
    const property = createProperty({ required: true });
    const component = await mount(
      <NumberField
        property={property}
        value={0}
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
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).not.toBeVisible();
  });

  test("should show description when provided", async ({ mount }) => {
    const property = createProperty({ description: "Enter a number value" });
    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).toBeVisible();
    await expect(description).toHaveText("Enter a number value");
  });

  test("should NOT show description when not provided", async ({ mount }) => {
    const property = createProperty({ description: undefined });
    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).not.toBeVisible();
  });

  test("should show error message when error is provided", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
        error="Invalid number value"
      />,
    );

    const errorMessage = component.locator(".property-editor-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Invalid number value");
  });

  test("should apply has-error class when error is provided", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
        error="Error"
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveClass(/has-error/);
  });

  test("should disable input when property is readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: true });
    const component = await mount(
      <NumberField
        property={property}
        value={10}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toBeDisabled();
  });

  test("should enable input when property is not readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: false });
    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toBeEnabled();
  });

  test("should set min attribute when property has min", async ({ mount }) => {
    const property = createProperty({ min: 0 });
    const component = await mount(
      <NumberField
        property={property}
        value={5}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveAttribute("min", "0");
  });

  test("should set max attribute when property has max", async ({ mount }) => {
    const property = createProperty({ max: 100 });
    const component = await mount(
      <NumberField
        property={property}
        value={50}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveAttribute("max", "100");
  });

  test("should set both min and max attributes when both are provided", async ({ mount }) => {
    const property = createProperty({ min: 1, max: 10 });
    const component = await mount(
      <NumberField
        property={property}
        value={5}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveAttribute("min", "1");
    await expect(input).toHaveAttribute("max", "10");
  });

  test("should use label as placeholder", async ({ mount }) => {
    const property = createProperty({ label: "Priority Votes" });
    const component = await mount(
      <NumberField
        property={property}
        value={0}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveAttribute("placeholder", "Priority Votes");
  });

  test("should display empty when value is NaN", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <NumberField
        property={property}
        value="not-a-number"
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='number']");
    await expect(input).toHaveValue("");
  });
});
