import { test, expect } from "@playwright/experimental-ct-react";
import { MoveToBacklogButton } from "../../src/presentation/components/MoveToBacklogButton";
import { TFile } from "obsidian";

const mockFile = { path: "test-task.md", basename: "test-task" } as TFile;

test.describe("MoveToBacklogButton Component", () => {
  test("should render button for Task with Draft status", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDraft]]"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveText("To Backlog");
  });

  test("should render button for Project with Draft status", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Project]]"
        currentStatus="[[ems__EffortStatusDraft]]"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toHaveText("To Backlog");
  });

  test("should NOT render button for Task with Backlog status", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusBacklog]]"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Task with Doing status", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDoing]]"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Task with Done status", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Task without status", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Task]]"
        currentStatus={null}
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for non-Task/Project asset (Area)", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Area]]"
        currentStatus="[[ems__EffortStatusDraft]]"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).not.toBeVisible();
  });

  test("should call onMoveToBacklog when clicked", async ({ mount }) => {
    let called = false;
    const onMoveToBacklog = async () => {
      called = true;
    };

    const component = await mount(
      <MoveToBacklogButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDraft]]"
        sourceFile={mockFile}
        onMoveToBacklog={onMoveToBacklog}
      />,
    );

    await component.click();
    await expect.poll(() => called).toBe(true);
  });

  test("should handle array of classes with Task", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass={["[[ems__Task]]", "[[SomeOtherClass]]"]}
        currentStatus="[[ems__EffortStatusDraft]]"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).toBeVisible();
  });

  test("should handle Task class without brackets", async ({ mount }) => {
    const component = await mount(
      <MoveToBacklogButton
        instanceClass="ems__Task"
        currentStatus="ems__EffortStatusDraft"
        sourceFile={mockFile}
        onMoveToBacklog={async () => {}}
      />,
    );

    await expect(component).toBeVisible();
  });
});
