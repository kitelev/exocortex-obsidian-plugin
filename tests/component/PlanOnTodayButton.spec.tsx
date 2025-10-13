import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { PlanOnTodayButton } from "../../src/presentation/components/PlanOnTodayButton";

test.describe("PlanOnTodayButton Component", () => {
  test("should render button for Task without ems__Effort_day", async ({
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

    await expect(component.getByRole("button")).toBeVisible();
    await expect(component.getByRole("button")).toHaveText("Plan on today");
  });

  test("should render button for Project without ems__Effort_day", async ({
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

    await expect(component.getByRole("button")).toBeVisible();
    await expect(component.getByRole("button")).toHaveText("Plan on today");
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

    await expect(component.getByRole("button")).not.toBeVisible();
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

    await expect(component.getByRole("button")).not.toBeVisible();
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

    await expect(component.getByRole("button")).toBeVisible();
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

    await component.getByRole("button").click();

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

    await expect(component.getByRole("button")).toBeVisible();
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

    await expect(component.getByRole("button")).toBeVisible();
  });

  test("should render button even if ems__Effort_day is already set", async ({
    mount,
  }) => {
    const mockFile = {
      parent: { path: "test/folder" },
    } as any;

    const component = await mount(
      <PlanOnTodayButton
        instanceClass="[[ems__Task]]"
        metadata={{ ems__Effort_day: '"[[2025-10-12]]"' }}
        sourceFile={mockFile}
        onPlanOnToday={async () => {}}
      />,
    );

    await expect(component.getByRole("button")).toBeVisible();
  });
});
