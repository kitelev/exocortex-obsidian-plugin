import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { CreateInstanceButton } from "../../src/presentation/components/CreateInstanceButton";

test.describe("CreateInstanceButton", () => {
  test("should render button for ems__TaskPrototype", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <CreateInstanceButton
        instanceClass="[[ems__TaskPrototype]]"
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
    await expect(component).toHaveText("Create Instance");
  });

  test("should not render for ems__Task", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <CreateInstanceButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should not render for ems__Area", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <CreateInstanceButton
        instanceClass="[[ems__Area]]"
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should not render when instanceClass is null", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <CreateInstanceButton
        instanceClass={null}
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should call onInstanceCreate when clicked", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    let callbackCalled = false;
    const mockCallback = async () => {
      callbackCalled = true;
    };

    const component = await mount(
      <CreateInstanceButton
        instanceClass="[[ems__TaskPrototype]]"
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={mockCallback}
      />,
    );

    // Component IS the button (no wrapper div)
    await component.click();

    // Wait a bit for the async callback to complete
    await component.page().waitForTimeout(100);

    expect(callbackCalled).toBe(true);
  });

  test("should render for array with ems__TaskPrototype", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <CreateInstanceButton
        instanceClass={["[[ems__TaskPrototype]]", "[[SomeOtherClass]]"]}
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
    await expect(component).toHaveText("Create Instance");
  });

  test("should have correct CSS class", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <CreateInstanceButton
        instanceClass="[[ems__TaskPrototype]]"
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toHaveClass(/exocortex-create-instance-btn/);
  });

  test("should prevent default event behavior on click", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <CreateInstanceButton
        instanceClass="[[ems__TaskPrototype]]"
        metadata={{}}
        sourceFile={mockFile}
        onInstanceCreate={async () => {}}
      />,
    );

    // Click the button - if preventDefault works correctly, no errors should occur
    // Component IS the button (no wrapper div)
    await component.click();

    // Button should still be visible after click
    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });
});
