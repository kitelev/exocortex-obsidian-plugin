import { test, expect } from "@playwright/experimental-ct-react";
import { DateTimePropertyField } from "../../../src/presentation/components/properties/DateTimePropertyField";

test.describe("DateTimePropertyField Component", () => {
  test("should render with calendar icon and display value", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value="2024-11-11T10:30:00.000Z"
        onChange={() => {}}
      />,
    );

    await expect(component).toBeVisible();

    // Check for calendar icon (SVG element)
    const svg = component.locator("svg");
    await expect(svg).toBeVisible();

    // Check for formatted display value
    const displayText = component.locator("span");
    await expect(displayText).toBeVisible();
  });

  test("should display Empty when value is null", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    const displayText = component.locator("span");
    await expect(displayText).toHaveText("Empty");
  });

  test("should open dropdown on single click", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    // Dropdown should not be visible initially
    const dropdown = component.locator(".exocortex-property-datetime-dropdown");
    await expect(dropdown).not.toBeVisible();

    // Single click on display area
    await component.click();

    // Dropdown should now be visible
    await expect(dropdown).toBeVisible();
  });

  test("should have pointer-events: none on SVG icon", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    const svg = component.locator("svg");
    await expect(svg).toHaveCSS("pointer-events", "none");
  });

  test("should close dropdown on outside click", async ({ mount, page }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    // Open dropdown
    await component.click();

    const dropdown = component.locator(".exocortex-property-datetime-dropdown");
    await expect(dropdown).toBeVisible();

    // Click outside (on page body)
    await page.locator("body").click({ position: { x: 0, y: 0 } });

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test("should call onChange when date is entered", async ({ mount }) => {
    let changedValue: string | null | undefined = undefined;
    const onChange = (value: string | null) => {
      changedValue = value;
    };

    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={onChange}
      />,
    );

    // Open dropdown
    await component.click();

    // Enter date in text input
    const dateInput = component.locator("input[type='text']");
    await dateInput.fill("2024-11-11");
    await dateInput.press("Enter");

    // onChange should be called with ISO string
    await expect.poll(() => changedValue).toBeTruthy();
    await expect.poll(() => typeof changedValue).toBe("string");
  });

  test("should call onChange with null when Clear button clicked", async ({ mount }) => {
    let changedValue: string | null | undefined = undefined;
    const onChange = (value: string | null) => {
      changedValue = value;
    };

    const component = await mount(
      <DateTimePropertyField
        value="2024-11-11T10:30:00.000Z"
        onChange={onChange}
      />,
    );

    // Open dropdown
    await component.click();

    // Click Clear button (wait for it to be visible first)
    const clearButton = component.locator("button:has-text('Clear')");
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // onChange should be called with null (with increased timeout)
    await expect.poll(() => changedValue, { timeout: 2000 }).toBeNull();
  });

  test("should close dropdown after Clear button clicked", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value="2024-11-11T10:30:00.000Z"
        onChange={() => {}}
      />,
    );

    // Open dropdown
    await component.click();

    const dropdown = component.locator(".exocortex-property-datetime-dropdown");
    await expect(dropdown).toBeVisible();

    // Click Clear button
    const clearButton = component.locator("button:has-text('Clear')");
    await clearButton.click();

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test("should call onBlur callback when provided", async ({ mount, page }) => {
    let onBlurCalled = false;
    const onBlur = () => {
      onBlurCalled = true;
    };

    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
        onBlur={onBlur}
      />,
    );

    // Open dropdown
    await component.click();

    // Click outside to close
    await page.locator("body").click({ position: { x: 0, y: 0 } });

    // onBlur should be called
    await expect.poll(() => onBlurCalled).toBe(true);
  });

  test("should format date without time correctly", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value="2024-11-11T00:00:00.000Z"
        onChange={() => {}}
      />,
    );

    const displayText = component.locator("span");
    const text = await displayText.textContent();

    // Should display date in localized format
    // Format depends on locale, but should contain date components
    expect(text).toBeTruthy();
    expect(text).not.toBe("Empty");

    // Date should be displayed (exact format varies by locale)
    // Just verify it's not empty and is a valid date representation
    expect(text?.length).toBeGreaterThan(0);
  });

  test("should format date with time correctly", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value="2024-11-11T15:30:00.000Z"
        onChange={() => {}}
      />,
    );

    const displayText = component.locator("span");
    const text = await displayText.textContent();

    // Should display date with time (e.g., "Nov 11, 2024, 15:30")
    expect(text).toContain("Nov");
    expect(text).toContain("11");
    expect(text).toContain("2024");
    expect(text).toContain(":");
  });

  test("should update display when prop value changes", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    let displayText = component.locator("span");
    await expect(displayText).toHaveText("Empty");

    // Update prop value (simulating external update)
    await component.update(
      <DateTimePropertyField
        value="2024-11-11T10:30:00.000Z"
        onChange={() => {}}
      />,
    );

    displayText = component.locator("span");
    const text = await displayText.textContent();
    expect(text).toContain("Nov");
  });

  test("should format time in 24h format (not AM/PM)", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value="2024-11-11T15:30:00.000Z"
        onChange={() => {}}
      />,
    );

    const displayText = component.locator("span");
    const text = await displayText.textContent();

    // Should NOT contain AM/PM indicators
    expect(text).not.toContain("AM");
    expect(text).not.toContain("PM");
    expect(text).not.toContain("am");
    expect(text).not.toContain("pm");
    // Should contain time with colon
    expect(text).toContain(":");
  });

  test("should parse 'tomorrow' natural language date", async ({ mount }) => {
    let changedValue: string | null | undefined = undefined;
    const onChange = (value: string | null) => {
      changedValue = value;
    };

    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={onChange}
      />,
    );

    // Open dropdown
    await component.click();

    // Enter natural language date
    const dateInput = component.locator("input[type='text']");
    await dateInput.fill("tomorrow");
    await dateInput.press("Enter");

    // onChange should be called with ISO string for tomorrow
    await expect.poll(() => changedValue).toBeTruthy();
    await expect.poll(() => typeof changedValue).toBe("string");

    // Verify it's a valid ISO date
    if (changedValue) {
      const parsedDate = new Date(changedValue);
      expect(parsedDate.getTime()).not.toBeNaN();
    }
  });

  test("should parse 'today' natural language date", async ({ mount }) => {
    let changedValue: string | null | undefined = undefined;
    const onChange = (value: string | null) => {
      changedValue = value;
    };

    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={onChange}
      />,
    );

    // Open dropdown
    await component.click();

    // Enter natural language date
    const dateInput = component.locator("input[type='text']");
    await dateInput.fill("today");
    await dateInput.press("Enter");

    // onChange should be called with ISO string
    await expect.poll(() => changedValue).toBeTruthy();
    await expect.poll(() => typeof changedValue).toBe("string");
  });

  test("should parse 'in 3 days' natural language date", async ({ mount }) => {
    let changedValue: string | null | undefined = undefined;
    const onChange = (value: string | null) => {
      changedValue = value;
    };

    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={onChange}
      />,
    );

    // Open dropdown
    await component.click();

    // Enter natural language date
    const dateInput = component.locator("input[type='text']");
    await dateInput.fill("in 3 days");
    await dateInput.press("Enter");

    // onChange should be called with ISO string
    await expect.poll(() => changedValue).toBeTruthy();
    await expect.poll(() => typeof changedValue).toBe("string");
  });

  test("should show error for invalid date format", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    // Open dropdown
    await component.click();

    // Enter invalid date
    const dateInput = component.locator("input[type='text']");
    await dateInput.fill("not a valid date");
    await dateInput.press("Enter");

    // Error message should be visible (use more specific selector)
    const errorMessage = component.locator("div").filter({ hasText: /^Invalid date format/ }).first();
    await expect(errorMessage).toBeVisible();
  });

  test("should close dropdown on Escape key", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    // Open dropdown
    await component.click();

    const dropdown = component.locator(".exocortex-property-datetime-dropdown");
    await expect(dropdown).toBeVisible();

    // Press Escape
    const dateInput = component.locator("input[type='text']");
    await dateInput.press("Escape");

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test("should show placeholder with examples", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    // Open dropdown
    await component.click();

    // Check for placeholder
    const dateInput = component.locator("input[type='text']");
    await expect(dateInput).toHaveAttribute("placeholder", "tomorrow, 2025-01-15, next week");
  });

  test("should show helpful examples text", async ({ mount }) => {
    const component = await mount(
      <DateTimePropertyField
        value={null}
        onChange={() => {}}
      />,
    );

    // Open dropdown
    await component.click();

    // Check for examples text (use more specific selector)
    const examplesText = component.locator("div").filter({ hasText: /^Examples: tomorrow/ }).first();
    await expect(examplesText).toBeVisible();
  });
});
