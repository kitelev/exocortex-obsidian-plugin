import { test, expect } from "@playwright/experimental-ct-react";
import { RepairFolderButton } from "../../src/presentation/components/RepairFolderButton";
import { TFile } from "obsidian";

test.describe("RepairFolderButton", () => {
  const mockFile = {
    path: "path/to/file.md",
    basename: "file",
    name: "file.md",
  } as TFile;

  test("should not render when expectedFolder is null", async ({ mount }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder={null}
        onRepair={async () => {}}
      />,
    );

    await expect(component).toBeEmpty();
  });

  test("should not render when current folder matches expected folder", async ({
    mount,
  }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder="path/to"
        onRepair={async () => {}}
      />,
    );

    await expect(component).toBeEmpty();
  });

  test("should render button when folders do not match", async ({ mount }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder="other/path"
        onRepair={async () => {}}
      />,
    );

    const button = component.locator("button");
    await expect(button).toBeVisible();
    await expect(button).toContainText("Repair Folder");
  });

  test("should show expected folder in title attribute", async ({ mount }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder="other/path"
        onRepair={async () => {}}
      />,
    );

    const button = component.locator("button");
    await expect(button).toHaveAttribute("title", "Move to other/path");
  });

  test("should call onRepair when button is clicked", async ({ mount }) => {
    let repairCalled = false;

    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder="other/path"
        onRepair={async () => {
          repairCalled = true;
        }}
      />,
    );

    const button = component.locator("button");
    await button.click();

    expect(repairCalled).toBe(true);
  });

  test("should normalize paths by removing trailing slashes", async ({
    mount,
  }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to/"
        expectedFolder="path/to"
        onRepair={async () => {}}
      />,
    );

    await expect(component).toBeEmpty();
  });

  test("should detect mismatch when current has trailing slash", async ({
    mount,
  }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to/"
        expectedFolder="other/path"
        onRepair={async () => {}}
      />,
    );

    const button = component.locator("button");
    await expect(button).toBeVisible();
  });

  test("should detect mismatch when expected has trailing slash", async ({
    mount,
  }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder="other/path/"
        onRepair={async () => {}}
      />,
    );

    const button = component.locator("button");
    await expect(button).toBeVisible();
  });

  test("should handle empty current folder path", async ({ mount }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder=""
        expectedFolder="path/to"
        onRepair={async () => {}}
      />,
    );

    const button = component.locator("button");
    await expect(button).toBeVisible();
  });

  test("should NOT render when expected folder is empty string", async ({ mount }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder=""
        onRepair={async () => {}}
      />,
    );

    await expect(component).toBeEmpty();
  });

  test("should prevent default event when button is clicked", async ({
    mount,
  }) => {
    const component = await mount(
      <RepairFolderButton
        sourceFile={mockFile}
        currentFolder="path/to"
        expectedFolder="other/path"
        onRepair={async () => {}}
      />,
    );

    const button = component.locator("button");

    // The button should have type="button" which prevents form submission
    await expect(button).toHaveAttribute("type", "button");
  });
});
