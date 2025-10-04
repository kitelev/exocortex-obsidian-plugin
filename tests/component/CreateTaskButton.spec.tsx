import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { CreateTaskButton } from "../../src/presentation/components/CreateTaskButton";
import { TFile } from "obsidian";

test.describe("CreateTaskButton Component", () => {
  const mockFile = {
    basename: "My Area",
    path: "areas/my-area.md",
    parent: { path: "areas" },
  } as TFile;

  const mockMetadata = {
    exo__Instance_class: "[[ems__Area]]",
    exo__Asset_isDefinedBy: "[[Ontology/EMS]]",
    exo__Asset_uid: "area-123",
  };

  test("should render button for Area asset with [[ems__Area]]", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Create Task");
  });

  test("should render button for Area asset with ems__Area (no brackets)", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass="ems__Area"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).toBeVisible();
  });

  test("should NOT render button for non-Area asset (ems__Task)", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Task]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should NOT render button when instanceClass is null", async ({ mount }) => {
    const component = await mount(
      <CreateTaskButton
        instanceClass={null}
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async () => {}}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await expect(button).not.toBeVisible();
  });

  test("should call onTaskCreate with correct parameters when clicked", async ({ mount }) => {
    let capturedFileName = "";
    let capturedFrontmatter: Record<string, any> = {};

    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={mockFile}
        onTaskCreate={async (fileName, frontmatter) => {
          capturedFileName = fileName;
          capturedFrontmatter = frontmatter;
        }}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await button.click();

    // Wait for async click handler
    await component.page().waitForTimeout(100);

    // Verify fileName format: Task-YYYY-MM-DDTHH-MM-SS.md
    expect(capturedFileName).toMatch(/^Task-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/);

    // Verify frontmatter structure
    expect(capturedFrontmatter.exo__Instance_class).toBe("[[ems__Task]]");
    expect(capturedFrontmatter.exo__Asset_isDefinedBy).toBe("[[Ontology/EMS]]");
    expect(capturedFrontmatter.exo__Effort_area).toBe("[[My Area]]");

    // Verify UUID format (UUIDv4)
    expect(capturedFrontmatter.exo__Asset_uid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );

    // Verify timestamp format (ISO 8601 without milliseconds)
    expect(capturedFrontmatter.exo__Asset_createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
    );
  });

  test("should copy exo__Asset_isDefinedBy from source metadata", async ({ mount }) => {
    let capturedFrontmatter: Record<string, any> = {};

    const customMetadata = {
      exo__Instance_class: "[[ems__Area]]",
      exo__Asset_isDefinedBy: "[[Custom/Ontology]]",
    };

    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Area]]"
        metadata={customMetadata}
        sourceFile={mockFile}
        onTaskCreate={async (fileName, frontmatter) => {
          capturedFrontmatter = frontmatter;
        }}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await button.click();
    await component.page().waitForTimeout(100);

    expect(capturedFrontmatter.exo__Asset_isDefinedBy).toBe("[[Custom/Ontology]]");
  });

  test("should handle missing exo__Asset_isDefinedBy gracefully", async ({ mount }) => {
    let capturedFrontmatter: Record<string, any> = {};

    const incompleteMetadata = {
      exo__Instance_class: "[[ems__Area]]",
      // exo__Asset_isDefinedBy is missing
    };

    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Area]]"
        metadata={incompleteMetadata}
        sourceFile={mockFile}
        onTaskCreate={async (fileName, frontmatter) => {
          capturedFrontmatter = frontmatter;
        }}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await button.click();
    await component.page().waitForTimeout(100);

    // Should default to empty string
    expect(capturedFrontmatter.exo__Asset_isDefinedBy).toBe("");
  });

  test("should create link to source Area in exo__Effort_area", async ({ mount }) => {
    let capturedFrontmatter: Record<string, any> = {};

    const fileWithDifferentName = {
      basename: "Sprint Planning Area",
      path: "projects/sprint.md",
    } as TFile;

    const component = await mount(
      <CreateTaskButton
        instanceClass="[[ems__Area]]"
        metadata={mockMetadata}
        sourceFile={fileWithDifferentName}
        onTaskCreate={async (fileName, frontmatter) => {
          capturedFrontmatter = frontmatter;
        }}
      />,
    );

    const button = component.locator("button.exocortex-create-task-btn");
    await button.click();
    await component.page().waitForTimeout(100);

    expect(capturedFrontmatter.exo__Effort_area).toBe("[[Sprint Planning Area]]");
  });
});
