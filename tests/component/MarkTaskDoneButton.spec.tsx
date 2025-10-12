import { test, expect } from "@playwright/experimental-ct-react";
import { MarkTaskDoneButton } from "../../src/presentation/components/MarkTaskDoneButton";
import { TFile } from "obsidian";

const mockFile = { path: "test-task.md", basename: "test-task" } as TFile;

test.describe("MarkTaskDoneButton Component", () => {
  test("should render button for Task without status", async ({ mount }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Task]]"
        currentStatus={null}
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Done");
  });

  test("should render button for Task with non-Done status", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusActive]]"
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).toBeVisible();
  });

  test("should NOT render button for Task with Done status", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button for non-Task asset (Area)", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Area]]"
        currentStatus={null}
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).not.toBeVisible();
  });

  test("should render button for Project without status", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Project]]"
        currentStatus={null}
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Done");
  });

  test("should render button for Project with non-Done status", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Project]]"
        currentStatus="[[ems__EffortStatusActive]]"
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).toBeVisible();
  });

  test("should NOT render button for Project with Done status", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Project]]"
        currentStatus="[[ems__EffortStatusDone]]"
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button when instanceClass is null", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass={null}
        currentStatus={null}
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).not.toBeVisible();
  });

  test("should handle Task class without brackets", async ({ mount }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="ems__Task"
        currentStatus={null}
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).toBeVisible();
  });

  test("should handle status without brackets", async ({ mount }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Task]]"
        currentStatus="ems__EffortStatusDone"
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).not.toBeVisible();
  });

  test("should call onMarkDone when clicked", async ({ mount }) => {
    let callbackCalled = false;
    const onMarkDone = async () => {
      callbackCalled = true;
    };

    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Task]]"
        currentStatus={null}
        sourceFile={mockFile}
        onMarkDone={onMarkDone}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await button.click();

    await expect.poll(() => callbackCalled).toBe(true);
  });

  test("should handle array of classes with Task", async ({ mount }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass={["[[ems__Task]]", "[[ems__Effort]]"]}
        currentStatus={null}
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).toBeVisible();
  });

  test("should handle array of statuses with Done", async ({ mount }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Task]]"
        currentStatus={["[[ems__EffortStatusDone]]"]}
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).not.toBeVisible();
  });

  test("should render button when status is empty string", async ({
    mount,
  }) => {
    const component = await mount(
      <MarkTaskDoneButton
        instanceClass="[[ems__Task]]"
        currentStatus=""
        sourceFile={mockFile}
        onMarkDone={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-mark-done-btn");
    await expect(button).toBeVisible();
  });
});
