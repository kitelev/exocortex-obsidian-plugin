import { test, expect } from "@playwright/experimental-ct-react";
import { CleanEmptyPropertiesButton } from "../../src/presentation/components/CleanEmptyPropertiesButton";
import { TFile } from "obsidian";

const mockFile = { path: "test-note.md", basename: "test-note" } as TFile;

test.describe("CleanEmptyPropertiesButton Component", () => {
  test("should render button when metadata has empty string property", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Area]]",
          emptyProp: "",
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
    await expect(component).toHaveText("Clean Empty Properties");
  });

  test("should render button when metadata has null property", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Task]]",
          nullProp: null,
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should render button when metadata has undefined property", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Project]]",
          undefinedProp: undefined,
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should render button when metadata has empty array property", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Area]]",
          emptyArray: [],
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should render button when metadata has empty object property", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Task]]",
          emptyObject: {},
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should NOT render button when metadata has no empty properties", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Area]]",
          exo__Asset_uid: "area-123",
          ems__Effort_status: "[[ems__EffortStatusActive]]",
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button when metadata is empty", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{}}
        onCleanup={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should call onCleanup when clicked", async ({ mount }) => {
    let callbackCalled = false;
    const onCleanup = async () => {
      callbackCalled = true;
    };

    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Area]]",
          emptyProp: "",
        }}
        onCleanup={onCleanup}
      />,
    );

    // Component IS the button (no wrapper div)
    await component.click();

    await expect.poll(() => callbackCalled).toBe(true);
  });

  test("should handle mixed empty and non-empty properties", async ({
    mount,
  }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Task]]",
          validProp: "some value",
          emptyProp: "",
          anotherValidProp: "another value",
          nullProp: null,
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should handle whitespace-only strings as empty", async ({ mount }) => {
    const component = await mount(
      <CleanEmptyPropertiesButton
        sourceFile={mockFile}
        metadata={{
          exo__Instance_class: "[[ems__Project]]",
          whitespaceProp: "   ",
        }}
        onCleanup={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });
});
