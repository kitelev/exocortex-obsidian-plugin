import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { PlanOnTodayButton } from "../../src/presentation/components/PlanOnTodayButton";

test.describe("PlanOnTodayButton Component", () => {
  test("should render button for Task without ems__Effort_plannedStartTimestamp", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
    await expect(component).toHaveText("Plan on today");
  });

  test("should render button for Project without ems__Effort_plannedStartTimestamp", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Project]]"
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
    await expect(component).toHaveText("Plan on today");
  });

  test("should NOT render button for non-Task/Project asset (Area)", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Area]]"
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button when instanceClass is null", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass={null}
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should handle Task class without brackets", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="ems__Task"
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should call onPlanOnToday when clicked", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    let callbackCalled = false;
    const mockCallback = async () => {
      callbackCalled = true;
    };

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Task]]"
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={mockCallback}
      />,
    );

    // Component IS the button (no wrapper div)
    await component.click();

    // Wait a bit for the async callback to complete
    await component.page().waitForTimeout(100);

    expect(callbackCalled).toBe(true);
  });

  test("should handle array of classes with Task", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass={["[[ems__Task]]", "[[SomeOtherClass]]"]}
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should handle array of classes with Project", async ({ mount }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass={["[[ems__Project]]", "[[SomeOtherClass]]"]}
        metadata={{}}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should render button when ems__Effort_plannedStartTimestamp is set to different date", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_plannedStartTimestamp: "2025-10-12T00:00:00" }}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should NOT render button when ems__Effort_plannedStartTimestamp is set to today", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayString = `${year}-${month}-${day}`;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_plannedStartTimestamp: `${todayString}T00:00:00` }}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button when ems__Effort_plannedStartTimestamp is set to today at different time", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayString = `${year}-${month}-${day}`;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_plannedStartTimestamp: `${todayString}T19:00:00` }}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should render button when ems__Effort_plannedStartTimestamp is set to yesterday", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");
    const yesterdayString = `${year}-${month}-${day}`;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_plannedStartTimestamp: `${yesterdayString}T00:00:00` }}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });
});
