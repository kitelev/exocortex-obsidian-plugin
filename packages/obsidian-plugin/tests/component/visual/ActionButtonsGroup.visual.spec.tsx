/**
 * Visual Regression Tests for ActionButtonsGroup Component
 *
 * Tests visual appearance of the ActionButtonsGroup component
 * including button variants, states, and responsive behavior.
 *
 * Run with: npm run test:component
 * Update snapshots: npm run test:component -- --update-snapshots
 */
import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  ActionButtonsGroup,
  ButtonGroup,
} from "../../../src/presentation/components/ActionButtonsGroup";

test.describe("ActionButtonsGroup Visual Regression", () => {
  test("default state with single group", async ({ mount }) => {
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
    await expect(component).toHaveScreenshot("buttons-single-group.png");
  });

  test("multiple groups with separators", async ({ mount }) => {
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
          {
            id: "create-project",
            label: "Create Project",
            variant: "secondary",
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
    await expect(component).toHaveScreenshot("buttons-multiple-groups.png");
  });

  test("all button variants", async ({ mount }) => {
    const groups: ButtonGroup[] = [
      {
        id: "all-variants",
        title: "Button Variants",
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
    await expect(component).toHaveScreenshot("buttons-all-variants.png");
  });

  test("three groups with multiple buttons", async ({ mount }) => {
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
          {
            id: "start-doing",
            label: "Start Doing",
            variant: "warning",
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
            variant: "secondary",
            visible: true,
            onClick: async () => {},
          },
          {
            id: "move-backlog",
            label: "Move to Backlog",
            variant: "danger",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);
    await expect(component).toHaveScreenshot("buttons-three-groups.png");
  });

  test("hover state on primary button", async ({ mount, page }) => {
    const groups: ButtonGroup[] = [
      {
        id: "test",
        title: "Test Group",
        buttons: [
          {
            id: "btn",
            label: "Hover Me",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);
    await component.locator("button").hover();
    // Wait for hover animation
    await page.waitForTimeout(100);
    await expect(component).toHaveScreenshot("buttons-hover-primary.png");
  });

  test("hover state on danger button", async ({ mount, page }) => {
    const groups: ButtonGroup[] = [
      {
        id: "test",
        title: "Test Group",
        buttons: [
          {
            id: "btn",
            label: "Danger Hover",
            variant: "danger",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);
    await component.locator("button").hover();
    await page.waitForTimeout(100);
    await expect(component).toHaveScreenshot("buttons-hover-danger.png");
  });

  test("focus state", async ({ mount, page }) => {
    const groups: ButtonGroup[] = [
      {
        id: "test",
        title: "Focus Test",
        buttons: [
          {
            id: "btn",
            label: "Focus Me",
            variant: "primary",
            visible: true,
            onClick: async () => {},
          },
        ],
      },
    ];

    const component = await mount(<ActionButtonsGroup groups={groups} />);
    await component.locator("button").focus();
    await page.waitForTimeout(100);
    await expect(component).toHaveScreenshot("buttons-focus-state.png");
  });
});
