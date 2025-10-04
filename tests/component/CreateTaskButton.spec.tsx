import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { CreateTaskButton } from "../../src/presentation/components/CreateTaskButton";
import { TFile } from "obsidian";

test.describe("CreateTaskButton Component", () => {
  const mockFile = {
    basename: "My Area",
    path: "areas/my-area.md",
    parent: { path: "areas" },
  } as TFile;

  const mockMetadata = {
    exo__Instance_class: "[[ems__Area]]",
    exo__Asset_isDefinedBy: "[[Ontology/EMS]]",
    exo__Asset_uid: "area-123",
  };

  test("should render button for Area asset with [[ems__Area]]", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Create Task");
  });

  test("should render button for Area asset with ems__Area (no brackets)", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass="ems__Area"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).toBeVisible();
  });

  test("should NOT render button for non-Area asset (ems__Task)", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Task]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button when instanceClass is null", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass={null}
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should call onTaskCreate when clicked", async ({ mount }) => {
    let wasClicked = false;

    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {
          wasClicked = true;
        }}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await button.click();

    // Wait for async click handler
    await component.page().waitForTimeout(100);

    // Verify callback was called
    expect(wasClicked).toBe(true);
  });

});
