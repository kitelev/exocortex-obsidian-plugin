import { test, expect } from "@playwright/experimental-ct-react";
import { WikiLinkField } from "../../../../src/presentation/components/property-editor/fields/WikiLinkField";
import type { PropertySchemaDefinition } from "../../../../src/domain/property-editor/PropertySchemas";

const createProperty = (
  overrides: Partial<PropertySchemaDefinition> = {},
): PropertySchemaDefinition => ({
  name: "ems__Effort_area",
  type: "wikilink",
  required: false,
  label: "Area",
  ...overrides,
});

test.describe("WikiLinkField Component", () => {
  test("should render input with label and wikilink brackets", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    await expect(component).toBeVisible();

    // Check for input
    const input = component.locator("input[type='text']");
    await expect(input).toBeVisible();

    // Check for label
    const label = component.locator("label.property-editor-label");
    await expect(label).toHaveText("Area");

    // Check for wikilink brackets
    const prefix = component.locator(".wikilink-prefix");
    await expect(prefix).toHaveText("[[");

    const suffix = component.locator(".wikilink-suffix");
    await expect(suffix).toHaveText("]]");
  });

  test("should display value without wikilink brackets", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <WikiLinkField
        property={property}
        value="[[ems__Area/Work]]"
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveValue("ems__Area/Work");
  });

  test("should strip quotes from value after removing brackets", async ({ mount }) => {
    const property = createProperty();
    // The regex in the component removes [[ and ]] first, then quotes
    // For value "[[value]]" with outer quotes: first regex removes [[ and ]] -> "value"
    // Then second regex removes outer quotes -> value
    const component = await mount(
      <WikiLinkField
        property={property}
        value={'"ems__Area/Personal"'}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    // After removing brackets (none) and quotes, we get: ems__Area/Personal
    await expect(input).toHaveValue("ems__Area/Personal");
  });

  test("should call onChange with wikilink-wrapped value", async ({ mount }) => {
    let changedValue: string | undefined;
    const onChange = (value: string) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={onChange}
      />,
    );

    const input = component.locator("input[type='text']");
    await input.fill("NewArea");

    await expect.poll(() => changedValue).toBe("[[NewArea]]");
  });

  test("should NOT double-wrap if value already starts with [[", async ({ mount }) => {
    let changedValue: string | undefined;
    const onChange = (value: string) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={onChange}
      />,
    );

    const input = component.locator("input[type='text']");
    await input.fill("[[AlreadyWrapped]]");

    await expect.poll(() => changedValue).toBe("[[AlreadyWrapped]]");
  });

  test("should allow empty value", async ({ mount }) => {
    let changedValue: string | undefined;
    const onChange = (value: string) => {
      changedValue = value;
    };
    const property = createProperty();

    const component = await mount(
      <WikiLinkField
        property={property}
        value="[[SomeValue]]"
        onChange={onChange}
      />,
    );

    const input = component.locator("input[type='text']");
    await input.clear();

    // Empty value should be passed through
    await expect.poll(() => changedValue).toBe("");
  });

  test("should show required indicator when property is required", async ({ mount }) => {
    const property = createProperty({ required: true });
    const component = await mount(
      <WikiLinkField
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
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).not.toBeVisible();
  });

  test("should show description when provided", async ({ mount }) => {
    const property = createProperty({ description: "Parent area" });
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).toBeVisible();
    await expect(description).toHaveText("Parent area");
  });

  test("should NOT show description when not provided", async ({ mount }) => {
    const property = createProperty({ description: undefined });
    const component = await mount(
      <WikiLinkField
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
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
        error="Invalid link reference"
      />,
    );

    const errorMessage = component.locator(".property-editor-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Invalid link reference");
  });

  test("should apply has-error class when error is provided", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
        error="Error"
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveClass(/has-error/);
  });

  test("should disable input when property is readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: true });
    const component = await mount(
      <WikiLinkField
        property={property}
        value="[[SomeArea]]"
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toBeDisabled();
  });

  test("should enable input when property is not readOnly", async ({ mount }) => {
    const property = createProperty({ readOnly: false });
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toBeEnabled();
  });

  test("should show filter hint when filter is provided", async ({ mount }) => {
    const property = createProperty({ filter: ["ems__Area"] });
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const hint = component.locator(".property-editor-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText("Accepts: ems__Area");
  });

  test("should show multiple filters in hint", async ({ mount }) => {
    const property = createProperty({ filter: ["ems__Project", "ems__Initiative"] });
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const hint = component.locator(".property-editor-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText("Accepts: ems__Project, ems__Initiative");
  });

  test("should NOT show filter hint when filter is empty", async ({ mount }) => {
    const property = createProperty({ filter: [] });
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const hint = component.locator(".property-editor-hint");
    await expect(hint).not.toBeVisible();
  });

  test("should NOT show filter hint when filter is not provided", async ({ mount }) => {
    const property = createProperty({ filter: undefined });
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const hint = component.locator(".property-editor-hint");
    await expect(hint).not.toBeVisible();
  });

  test("should use lowercase label as placeholder", async ({ mount }) => {
    const property = createProperty({ label: "Parent Area" });
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveAttribute("placeholder", "Enter parent area");
  });

  test("should have wikilink-input class on input", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <WikiLinkField
        property={property}
        value=""
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveClass(/wikilink-input/);
  });

  test("should display empty when value is null", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <WikiLinkField
        property={property}
        value={null as unknown as string}
        onChange={() => {}}
      />,
    );

    const input = component.locator("input[type='text']");
    await expect(input).toHaveValue("");
  });
});
