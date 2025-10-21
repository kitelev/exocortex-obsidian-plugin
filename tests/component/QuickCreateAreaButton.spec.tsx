import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { QuickCreateAreaButton } from "../../src/presentation/components/QuickCreateAreaButton";
import { TFile } from "obsidian";

test.describe("QuickCreateAreaButton Component", () => {
  const mockFile = {
    basename: "Parent Area",
    path: "areas/parent-area.md",
    parent: { path: "areas" },
  } as TFile;

  const mockMetadata = {
    exo__Instance_class: "[[ems__Area]]",
    exo__Asset_isDefinedBy: "[[Ontology/EMS]]",
    exo__Asset_uid: "area-123",
  };

  test("should render button for Area asset with [[ems__Area]]", async ({ mount }) => {
    const component = await mount(
      <QuickCreateAreaButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onAreaCreate={async () => {}}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveText("⚡ Quick Create Area");
  });

  test("should render button for Area asset with ems__Area (no brackets)", async ({ mount }) => {
    const component = await mount(
      <QuickCreateAreaButton
        instanceClass="ems__Area"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onAreaCreate={async () => {}}
      />,
    );

    await expect(component).toBeVisible();
  });

  test("should NOT render button for Project asset", async ({ mount }) => {
    const component = await mount(
      <QuickCreateAreaButton
        instanceClass="[[ems__Project]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onAreaCreate={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Task asset", async ({ mount }) => {
    const component = await mount(
      <QuickCreateAreaButton
        instanceClass="[[ems__Task]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onAreaCreate={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should NOT render button when instanceClass is null", async ({ mount }) => {
    const component = await mount(
      <QuickCreateAreaButton
        instanceClass={null}
        metadata={mockMetadata}
        sourceFile={mockFile}
        onAreaCreate={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should call onAreaCreate when clicked", async ({ mount }) => {
    let wasClicked = false;

    const component = await mount(
      <QuickCreateAreaButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onAreaCreate={async () => {
          wasClicked = true;
        }}
      />,
    );

    await component.click();
    await component.page().waitForTimeout(100);

    expect(wasClicked).toBe(true);
  });

  test("should have title attribute for tooltip", async ({ mount }) => {
    const component = await mount(
      <QuickCreateAreaButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onAreaCreate={async () => {}}
      />,
    );

    await expect(component).toHaveAttribute("title", "Quick create child area");
  });
});
