import { test, expect } from "@playwright/experimental-ct-react";
import { StartEffortButton } from "../../src/presentation/components/StartEffortButton";
import { TFile } from "obsidian";

const mockFile = { path: "test-task.md", basename: "test-task" } as TFile;

test.describe("StartEffortButton Component", () => {
  test("should render button for Task with Backlog status", async ({ mount }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusBacklog]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
    await expect(component).toHaveText("Start Effort");
  });

  test("should NOT render button for Task without status", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus={null}
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Task with Doing status", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDoing]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Task with Done status", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusDone]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for non-Task/Project asset (Area)", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Area]]"
        currentStatus={null}
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should render button for Project with Backlog status", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Project]]"
        currentStatus="[[ems__EffortStatusBacklog]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
    await expect(component).toHaveText("Start Effort");
  });

  test("should NOT render button for Project without status", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Project]]"
        currentStatus={null}
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Project with Doing status", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Project]]"
        currentStatus="[[ems__EffortStatusDoing]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button for Project with Done status", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Project]]"
        currentStatus="[[ems__EffortStatusDone]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button when instanceClass is null", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass={null}
        currentStatus={null}
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should handle Task class without brackets", async ({ mount }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="ems__Task"
        currentStatus="[[ems__EffortStatusBacklog]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should handle status without brackets", async ({ mount }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus="ems__EffortStatusDoing"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should call onStartEffort when clicked", async ({ mount }) => {
    let called = false;
    const onStartEffort = async () => {
      called = true;
    };

    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus="[[ems__EffortStatusBacklog]]"
        sourceFile={mockFile}
        onStartEffort={onStartEffort}
      />,
    );

    // Component IS the button (no wrapper div)
    await component.click();

    await expect.poll(() => called).toBe(true);
  });

  test("should handle array of classes with Task", async ({ mount }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass={["[[ems__Task]]", "[[SomeOtherClass]]"]}
        currentStatus="[[ems__EffortStatusBacklog]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should handle array of classes with Project", async ({ mount }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass={["[[SomeOtherClass]]", "[[ems__Project]]"]}
        currentStatus="[[ems__EffortStatusBacklog]]"
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component IS the button (no wrapper div)
    await expect(component).toBeVisible();
  });

  test("should handle array of statuses with Doing", async ({ mount }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus={[
          "[[ems__EffortStatusActive]]",
          "[[ems__EffortStatusDoing]]",
        ]}
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should handle array of statuses with Done", async ({ mount }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus={[
          "[[ems__EffortStatusActive]]",
          "[[ems__EffortStatusDone]]",
        ]}
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });

  test("should NOT render button when status is empty string", async ({
    mount,
  }) => {
    const component = await mount(
      <StartEffortButton
        instanceClass="[[ems__Task]]"
        currentStatus=""
        sourceFile={mockFile}
        onStartEffort={async () => {}}
      />,
    );

    // Component returns null when button should not render
    await expect(component).not.toBeVisible();
  });
});
