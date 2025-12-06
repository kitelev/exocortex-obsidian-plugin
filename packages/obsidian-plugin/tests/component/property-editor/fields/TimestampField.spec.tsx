import { test, expect } from "@playwright/experimental-ct-react";
import { TimestampField } from "../../../../src/presentation/components/property-editor/fields/TimestampField";
import type { PropertySchemaDefinition } from "../../../../src/domain/property-editor/PropertySchemas";

const createProperty = (
  overrides: Partial<PropertySchemaDefinition> = {},
): PropertySchemaDefinition => ({
  name: "exo__Asset_createdAt",
  type: "timestamp",
  required: true,
  label: "Created at",
  readOnly: true,
  ...overrides,
});

test.describe("TimestampField Component", () => {
  test("should render timestamp display with label", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    await expect(component).toBeVisible();

    // Check for timestamp display
    const display = component.locator(".timestamp-display");
    await expect(display).toBeVisible();

    // Check for label
    const label = component.locator("label.property-editor-label");
    await expect(label).toHaveText("Created at*");
  });

  test("should display 'Not set' when value is empty", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value=""
      />,
    );

    const display = component.locator(".timestamp-display");
    await expect(display).toHaveText("Not set");
  });

  test("should display 'Not set' when value is undefined", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value={undefined as unknown as string}
      />,
    );

    const display = component.locator(".timestamp-display");
    await expect(display).toHaveText("Not set");
  });

  test("should format valid timestamp to locale string", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    const display = component.locator(".timestamp-display");
    const text = await display.textContent();

    // Should contain date and time components
    expect(text).toContain("2024");
    expect(text).toContain("11");
    // The exact format depends on locale, but should have time components
    expect(text?.length).toBeGreaterThan(0);
    expect(text).not.toBe("Not set");
  });

  test("should display 'Invalid Date' when timestamp is invalid", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value="invalid-timestamp"
      />,
    );

    const display = component.locator(".timestamp-display");
    // new Date("invalid-timestamp").toLocaleString() returns "Invalid Date"
    await expect(display).toHaveText("Invalid Date");
  });

  test("should show required indicator when property is required", async ({ mount }) => {
    const property = createProperty({ required: true });
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).toBeVisible();
    await expect(requiredIndicator).toHaveText("*");
  });

  test("should NOT show required indicator when property is not required", async ({ mount }) => {
    const property = createProperty({ required: false });
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    const requiredIndicator = component.locator(".required-indicator");
    await expect(requiredIndicator).not.toBeVisible();
  });

  test("should show description when provided", async ({ mount }) => {
    const property = createProperty({ description: "Creation timestamp" });
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).toBeVisible();
    await expect(description).toHaveText("Creation timestamp");
  });

  test("should NOT show description when not provided", async ({ mount }) => {
    const property = createProperty({ description: undefined });
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    const description = component.locator(".property-editor-description");
    await expect(description).not.toBeVisible();
  });

  test("should have property-editor-timestamp-field class", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    await expect(component).toHaveClass(/property-editor-timestamp-field/);
  });

  test("should format date-only timestamp correctly", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-01-15T00:00:00.000Z"
      />,
    );

    const display = component.locator(".timestamp-display");
    const text = await display.textContent();

    // Should contain date components
    expect(text).toContain("2024");
    expect(text).not.toBe("Not set");
  });

  test("should handle ISO date without time", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-06-15"
      />,
    );

    const display = component.locator(".timestamp-display");
    const text = await display.textContent();

    // Should parse and display the date
    expect(text).toContain("2024");
    expect(text).not.toBe("Not set");
  });

  test("should be read-only display (no input elements)", async ({ mount }) => {
    const property = createProperty();
    const component = await mount(
      <TimestampField
        property={property}
        value="2024-11-11T10:30:00.000Z"
      />,
    );

    // TimestampField is read-only, so no input elements should exist
    const input = component.locator("input");
    await expect(input).not.toBeVisible();

    const select = component.locator("select");
    await expect(select).not.toBeVisible();
  });
});
