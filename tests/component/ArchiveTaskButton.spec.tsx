import { test, expect } from "@playwright/experimental-ct-react";
import { ArchiveTaskButton } from "../../src/presentation/components/ArchiveTaskButton";
import { TFile } from "obsidian";

const mockFile = { path: "test-task.md", basename: "test-task" } as TFile;

test.describe("ArchiveTaskButton Component", () => {
  test("should render button for Done Task not archived", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("To Archive");
  });

  test("should NOT render button for Task without Done status", async ({
    mount,
  }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusActive]]"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button for already archived Task", async ({
    mount,
  }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={true}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button for non-Task asset (Area)", async ({
    mount,
  }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Area]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button for non-Task asset (Project)", async ({
    mount,
  }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Project]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button when instanceClass is null", async ({
    mount,
  }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass={null}
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should handle Task class without brackets", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="ems__Task"
        currentStatus="ems__EffortStatusDone"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).toBeVisible();
  });

  test("should recognize archived as string 'true'", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived="true"
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should recognize archived as string 'yes'", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived="yes"
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should recognize archived as number 1", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={1}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should show button when archived is false string", async ({
    mount,
  }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived="false"
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).toBeVisible();
  });

  test("should show button when archived is null", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={null}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).toBeVisible();
  });

  test("should call onArchive when clicked", async ({ mount }) => {
    let callbackCalled = false;
    const onArchive = async () => {
      callbackCalled = true;
    };

    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={onArchive}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await button.click();

    await expect.poll(() => callbackCalled).toBe(true);
  });

  test("should handle array of classes with Task", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass={["[[ems__Task]]", "[[ems__Effort]]"]}
        currentStatus="[[ems__EffortStatusDone]]"
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).toBeVisible();
  });

  test("should handle array of statuses with Done", async ({ mount }) => {
    const component = await mount(
      <ArchiveTaskButton
        instanceClass="[[ems__Task]]"
        currentStatus={["[[ems__EffortStatusDone]]"]}
        isArchived={false}
        sourceFile={mockFile}
        onArchive={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-archive-task-btn");
    await expect(button).toBeVisible();
  });
});
