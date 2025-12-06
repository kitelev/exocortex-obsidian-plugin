import { test, expect } from "@playwright/experimental-ct-react";
import { TextField } from "../../../../src/presentation/components/property-editor/fields/TextField";
import type { PropertySchemaDefinition } from "../../../../src/domain/property-editor/PropertySchemas";

const createProperty = (
  overrides: Partial<PropertySchemaDefinition> = {},
): PropertySchemaDefinition => ({
  name: "exo__Asset_label",
  type: "text",
  required: true,
  label: "Label",
  ...overrides,
});

test.describe("TextField Component", () => {
  test("should render text input with label", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    await expect(component).toBeVisible();

    // Check for text input
    const input = component.locator("input[type='text']");
    await expect(input).toBeVisible();

    // Check for label
    const label = component.locator("label.property-editor-label");
    await expect(label).toHaveText("Label*");
  });

  test("should display value correctly", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TextField
        property={property}
        value="Test Value"
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveValue("Test Value");
  });

  test("should display empty string when value is null or undefined", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TextField
        property={property}
        value={undefined as unknown as string}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveValue("");
  });

  test("should call onChange when input value changes", async ({ mount }) => {
    let changedValue: string | undefined;
    const onChange = (value: string) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={onChange}
      />,
    );

    const input = component.locator("input[type='text']");
    await input.fill("New Value");

    await expect.poll(() => changedValue).toBe("New Value");
  });

  test("should call onChange immediately on input (not on blur)", async ({ mount }) => {
    let changedValue: string | undefined;
    const onChange = (value: string) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={onChange}
      />,
    );

    const input = component.locator("input[type='text']");
    await input.fill("test");

    // onChange should be called immediately (not waiting for blur)
    await expect.poll(() => changedValue).toBe("test");
  });

  test("should show required indicator when property is required", async ({ mount }) => {
    const property = createProperty({ required: true });
    const component = await mount(
      <TextField
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
    const property = createProperty({ required: false });
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).not.toBeVisible();
  });

  test("should show description when provided", async ({ mount }) => {
    const property = createProperty({ description: "Display name for the asset" });
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).toBeVisible();
    await expect(description).toHaveText("Display name for the asset");
  });

  test("should NOT show description when not provided", async ({ mount }) => {
    const property = createProperty({ description: undefined });
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).not.toBeVisible();
  });

  test("should show error message when error is provided", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
        error="Label is required"
      />,
    );

    const errorMessage = component.locator(".property-editor-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Label is required");
  });

  test("should apply has-error class when error is provided", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
        error="Error"
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveClass(/has-error/);
  });

  test("should NOT apply has-error class when no error", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).not.toHaveClass(/has-error/);
  });

  test("should disable input when property is readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: true });
    const component = await mount(
      <TextField
        property={property}
        value="Read Only Value"
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toBeDisabled();
  });

  test("should enable input when property is not readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: false });
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toBeEnabled();
  });

  test("should use label as placeholder", async ({ mount }) => {
    const property = createProperty({ label: "Asset Name" });
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveAttribute("placeholder", "Asset Name");
  });

  test("should have property-editor-input class", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TextField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveClass(/property-editor-input/);
  });
});
