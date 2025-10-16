import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { ActionButtonsGroup, ButtonGroup } from "../../src/presentation/components/ActionButtonsGroup";

test.describe("ActionButtonsGroup Component", () => {
  test("should render a single group with visible buttons", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "creation",
        title: "Creation",
        buttons: [
          {
            id: "create-task",
            label: "Create Task",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    await expect(component).toBeVisible();
    await expect(component.locator(".exocortex-button-group-title")).toHaveText("Creation");
    await expect(component.locator("button")).toHaveText("Create Task");
    await expect(component.locator("button")).toHaveClass(/exocortex-action-button--primary/);
  });

  test("should render multiple groups with separators", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "creation",
        title: "Creation",
        buttons: [
          {
            id: "create-task",
            label: "Create Task",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
      {
        id: "status",
        title: "Status",
        buttons: [
          {
            id: "mark-done",
            label: "Mark Done",
            variant: "success",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    await expect(component).toBeVisible();

    // Check both groups are rendered
    const titles = component.locator(".exocortex-button-group-title");
    await expect(titles.nth(0)).toHaveText("Creation");
    await expect(titles.nth(1)).toHaveText("Status");

    // Check separator exists between groups
    const separators = component.locator(".exocortex-button-group-separator");
    await expect(separators).toHaveCount(1);

    // Check buttons
    const buttons = component.locator("button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveText("Create Task");
    await expect(buttons.nth(1)).toHaveText("Mark Done");
  });

  test("should filter out groups with no visible buttons", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "creation",
        title: "Creation",
        buttons: [
          {
            id: "create-task",
            label: "Create Task",
            variant: "primary",
            visible: false, // Not visible
            onClick: async () => {},
          },
        ],
      },
      {
        id: "status",
        title: "Status",
        buttons: [
          {
            id: "mark-done",
            label: "Mark Done",
            variant: "success",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    await expect(component).toBeVisible();

    // Only Status group should render
    const titles = component.locator(".exocortex-button-group-title");
    await expect(titles).toHaveCount(1);
    await expect(titles).toHaveText("Status");

    // Only Mark Done button should render
    const buttons = component.locator("button");
    await expect(buttons).toHaveCount(1);
    await expect(buttons).toHaveText("Mark Done");

    // No separator since only one group
    const separators = component.locator(".exocortex-button-group-separator");
    await expect(separators).toHaveCount(0);
  });

  test("should return null when all groups have no visible buttons", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "creation",
        title: "Creation",
        buttons: [
          {
            id: "create-task",
            label: "Create Task",
            variant: "primary",
            visible: false,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    // Component should not render when no visible buttons
    await expect(component).not.toBeVisible();
  });

  test("should return null when groups array is empty", async ({ mount }) => {
    const groups: ButtonGroup[] = [];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    // Component should not render when no groups
    await expect(component).not.toBeVisible();
  });

  test("should render all button variants correctly", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "all-variants",
        title: "All Variants",
        buttons: [
          {
            id: "btn-primary",
            label: "Primary",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
          {
            id: "btn-secondary",
            label: "Secondary",
            variant: "secondary",
            visible: true,
            onClick: async () => {},
          },
          {
            id: "btn-success",
            label: "Success",
            variant: "success",
            visible: true,
            onClick: async () => {},
          },
          {
            id: "btn-warning",
            label: "Warning",
            variant: "warning",
            visible: true,
            onClick: async () => {},
          },
          {
            id: "btn-danger",
            label: "Danger",
            variant: "danger",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    await expect(component).toBeVisible();

    const buttons = component.locator("button");
    await expect(buttons).toHaveCount(5);

    // Check each variant has correct class
    await expect(buttons.nth(0)).toHaveClass(/exocortex-action-button--primary/);
    await expect(buttons.nth(1)).toHaveClass(/exocortex-action-button--secondary/);
    await expect(buttons.nth(2)).toHaveClass(/exocortex-action-button--success/);
    await expect(buttons.nth(3)).toHaveClass(/exocortex-action-button--warning/);
    await expect(buttons.nth(4)).toHaveClass(/exocortex-action-button--danger/);
  });

  test("should default to secondary variant when variant not specified", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "default-variant",
        title: "Default Variant",
        buttons: [
          {
            id: "btn-default",
            label: "Default",
            visible: true,
            onClick: async () => {},
            // No variant specified
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    await expect(component).toBeVisible();

    const button = component.locator("button");
    await expect(button).toHaveClass(/exocortex-action-button--secondary/);
  });

  test("should call onClick handler when button is clicked", async ({ mount }) => {
    let wasClicked = false;

    const groups: ButtonGroup[] = [
      {
        id: "clickable",
        title: "Clickable",
        buttons: [
          {
            id: "btn-click",
            label: "Click Me",
            variant: "primary",
            visible: true,
            onClick: async () => {
              wasClicked = true;
            },
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    const button = component.locator("button");
    await button.click();

    // Wait for async click handler
    await component.page().waitForTimeout(100);

    expect(wasClicked).toBe(true);
  });

  test("should handle mixed visible/invisible buttons in same group", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "mixed",
        title: "Mixed Visibility",
        buttons: [
          {
            id: "btn-visible",
            label: "Visible",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
          {
            id: "btn-hidden",
            label: "Hidden",
            variant: "primary",
            visible: false,
            onClick: async () => {},
          },
          {
            id: "btn-visible-2",
            label: "Visible 2",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    await expect(component).toBeVisible();

    // Only visible buttons should render
    const buttons = component.locator("button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveText("Visible");
    await expect(buttons.nth(1)).toHaveText("Visible 2");
  });

  test("should render three groups with two separators", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "creation",
        title: "Creation",
        buttons: [
          {
            id: "create-task",
            label: "Create Task",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
      {
        id: "status",
        title: "Status",
        buttons: [
          {
            id: "mark-done",
            label: "Mark Done",
            variant: "success",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
      {
        id: "planning",
        title: "Planning",
        buttons: [
          {
            id: "plan-today",
            label: "Plan on Today",
            variant: "warning",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);

    await expect(component).toBeVisible();

    // Check all groups are rendered
    const titles = component.locator(".exocortex-button-group-title");
    await expect(titles).toHaveCount(3);

    // Check separators (n groups = n-1 separators)
    const separators = component.locator(".exocortex-button-group-separator");
    await expect(separators).toHaveCount(2);

    // Check buttons
    const buttons = component.locator("button");
    await expect(buttons).toHaveCount(3);
  });
});
