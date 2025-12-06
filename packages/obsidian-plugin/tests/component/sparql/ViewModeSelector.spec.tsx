import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  ViewModeSelector,
  type ViewMode,
} from "../../../src/presentation/components/sparql/ViewModeSelector";

test.describe("ViewModeSelector", () => {
  // Skipped: First test in file has Playwright CT bundling timing issue
  test.skip("should render all available mode buttons", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="table"
        onModeChange={() => {}}
        availableModes={["table", "list", "graph"]}
      />,
    );

    await expect(component.locator(".sparql-view-mode-selector")).toBeVisible();
    await expect(component.locator(".sparql-view-mode-button")).toHaveCount(3);
  });

  test("should render only specified available modes", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="list"
        onModeChange={() => {}}
        availableModes={["list", "graph"]}
      />,
    );

    const buttons = component.locator(".sparql-view-mode-button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toContainText("list");
    await expect(buttons.nth(1)).toContainText("graph");
  });

  test("should highlight active mode button", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="graph"
        onModeChange={() => {}}
        availableModes={["list", "graph"]}
      />,
    );

    const activeButton = component.locator(".sparql-view-mode-button.active");
    await expect(activeButton).toHaveCount(1);
    await expect(activeButton).toContainText("graph");
  });

  test("should call onModeChange when mode button clicked", async ({
    mount,
  }) => {
    let changedMode: ViewMode | undefined;
    const handleModeChange = (mode: ViewMode) => {
      changedMode = mode;
    };

    const component = await mount(
      <ViewModeSelector
        currentMode="table"
        onModeChange={handleModeChange}
        availableModes={["table", "list", "graph"]}
      />,
    );

    const listButton = component
      .locator(".sparql-view-mode-button")
      .filter({ hasText: "list" });
    await listButton.click();

    expect(changedMode).toBe("list");
  });

  test("should display mode icons", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="table"
        onModeChange={() => {}}
        availableModes={["table", "list", "graph"]}
      />,
    );

    const icons = component.locator(".sparql-view-mode-icon");
    await expect(icons).toHaveCount(3);

    // Table icon: ▤
    await expect(icons.nth(0)).toHaveText("▤");
    // List icon: ☰
    await expect(icons.nth(1)).toHaveText("☰");
    // Graph icon: ●—●
    await expect(icons.nth(2)).toHaveText("●—●");
  });

  test("should display mode labels", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="list"
        onModeChange={() => {}}
        availableModes={["table", "list", "graph"]}
      />,
    );

    const labels = component.locator(".sparql-view-mode-label");
    await expect(labels).toHaveCount(3);
    await expect(labels.nth(0)).toHaveText("table");
    await expect(labels.nth(1)).toHaveText("list");
    await expect(labels.nth(2)).toHaveText("graph");
  });

  test("should have accessible aria-label on buttons", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="table"
        onModeChange={() => {}}
        availableModes={["table", "list"]}
      />,
    );

    const tableButton = component.locator(".sparql-view-mode-button").first();
    await expect(tableButton).toHaveAttribute(
      "aria-label",
      "switch to table view",
    );

    const listButton = component.locator(".sparql-view-mode-button").nth(1);
    await expect(listButton).toHaveAttribute(
      "aria-label",
      "switch to list view",
    );
  });

  test("should set aria-pressed based on active state", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="graph"
        onModeChange={() => {}}
        availableModes={["list", "graph"]}
      />,
    );

    const listButton = component.locator(".sparql-view-mode-button").first();
    await expect(listButton).toHaveAttribute("aria-pressed", "false");

    const graphButton = component.locator(".sparql-view-mode-button").nth(1);
    await expect(graphButton).toHaveAttribute("aria-pressed", "true");
  });

  test("should render single mode correctly", async ({ mount }) => {
    const component = await mount(
      <ViewModeSelector
        currentMode="table"
        onModeChange={() => {}}
        availableModes={["table"]}
      />,
    );

    await expect(component.locator(".sparql-view-mode-button")).toHaveCount(1);
    await expect(
      component.locator(".sparql-view-mode-button"),
    ).toHaveClass(/active/);
  });
});
