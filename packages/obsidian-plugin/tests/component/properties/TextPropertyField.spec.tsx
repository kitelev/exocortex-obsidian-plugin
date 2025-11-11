import { test, expect } from "@playwright/experimental-ct-react";
import { TextPropertyField } from "../../../src/presentation/components/properties/TextPropertyField";

test.describe("TextPropertyField Component", () => {
  test("should render input with full width style", async ({ mount }) => {
    const component = await mount(
      <TextPropertyField
        value="test value"
        onChange={() => {}}
      />,
    );

    await expect(component).toBeVisible();

    // Check that width: 100% is in the inline style attribute
    const styleAttr = await component.getAttribute("style");
    expect(styleAttr).toContain("width: 100%");
  });

  test("should render with initial value", async ({ mount }) => {
    const component = await mount(
      <TextPropertyField
        value="initial value"
        onChange={() => {}}
      />,
    );

    await expect(component).toHaveValue("initial value");
  });

  test("should update local value on input change", async ({ mount }) => {
    const component = await mount(
      <TextPropertyField
        value=""
        onChange={() => {}}
      />,
    );

    await component.fill("new value");
    await expect(component).toHaveValue("new value");
  });

  test("should call onChange on blur when value changed", async ({ mount }) => {
    let changedValue: string | null = null;
    const onChange = (value: string) => {
      changedValue = value;
    };

    const component = await mount(
      <TextPropertyField
        value="original"
        onChange={onChange}
      />,
    );

    await component.fill("modified");
    await component.blur();

    await expect.poll(() => changedValue).toBe("modified");
  });

  test("should NOT call onChange on blur when value unchanged", async ({ mount }) => {
    let onChangeCalled = false;
    const onChange = () => {
      onChangeCalled = true;
    };

    const component = await mount(
      <TextPropertyField
        value="unchanged"
        onChange={onChange}
      />,
    );

    await component.blur();

    await expect.poll(() => onChangeCalled).toBe(false);
  });

  test("should call onBlur callback when provided", async ({ mount, page }) => {
    let onBlurCalled = false;
    const onBlur = () => {
      onBlurCalled = true;
    };

    const component = await mount(
      <TextPropertyField
        value="test"
        onChange={() => {}}
        onBlur={onBlur}
      />,
    );

    // Focus the input first
    await component.focus();

    // Click outside to trigger blur
    await page.locator("body").click({ position: { x: 0, y: 0 } });

    await expect.poll(() => onBlurCalled).toBe(true);
  });

  test("should save on Enter key press", async ({ mount }) => {
    let savedValue: string | null = null;
    const onChange = (value: string) => {
      savedValue = value;
    };

    const component = await mount(
      <TextPropertyField
        value="original"
        onChange={onChange}
      />,
    );

    await component.fill("new value");
    await component.press("Enter");

    await expect.poll(() => savedValue).toBe("new value");
  });

  test("should revert changes on Escape key press", async ({ mount }) => {
    let changeCount = 0;
    const onChange = () => {
      changeCount++;
    };

    const component = await mount(
      <TextPropertyField
        value="original"
        onChange={onChange}
      />,
    );

    await component.fill("modified");
    await component.press("Escape");

    // Value should revert to original
    await expect(component).toHaveValue("original");

    // onChange should NOT have been called (changeCount should remain 0)
    // Note: The blur that happens after Escape will check if value changed,
    // but since it's reverted to original, onChange won't be called
    expect(changeCount).toBe(0);
  });

  test("should update local value when prop value changes", async ({ mount }) => {
    const component = await mount(
      <TextPropertyField
        value="initial"
        onChange={() => {}}
      />,
    );

    await expect(component).toHaveValue("initial");

    // Update prop value (simulating external update)
    await component.update(
      <TextPropertyField
        value="updated"
        onChange={() => {}}
      />,
    );

    await expect(component).toHaveValue("updated");
  });

  test("should render placeholder text", async ({ mount }) => {
    const component = await mount(
      <TextPropertyField
        value=""
        onChange={() => {}}
      />,
    );

    await expect(component).toHaveAttribute("placeholder", "Enter value...");
  });
});
