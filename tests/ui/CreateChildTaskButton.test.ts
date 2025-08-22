import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

/**
 * UI Tests for Create Child Task Button
 * These tests ensure the button appears and functions correctly in ems__Project views
 */

test.describe("Create Child Task Button UI Tests", () => {
  let page: Page;
  const vaultPath = "/Users/kitelev/vault-2025";
  const projectFilePath = "01 Inbox/Project - Антифрод-триггеры.md";

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Initialize Obsidian with the test vault
    await page.goto(`obsidian://open?vault=${encodeURIComponent(vaultPath)}`);
    await page.waitForTimeout(3000); // Wait for Obsidian to load
  });

  test("Button should be visible in ems__Project asset view", async () => {
    // Open the project file
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);

    // Wait for ExoUIRender to complete
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Check that the buttons block is rendered
    const buttonsBlock = await page.locator(".exocortex-buttons-block");
    await expect(buttonsBlock).toBeVisible();

    // Check that the Create Child Task button exists
    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );
    await expect(createTaskButton).toBeVisible();

    // Verify button has correct styling
    await expect(createTaskButton).toHaveClass(/exocortex-layout-button/);
    await expect(createTaskButton).toHaveClass(/exocortex-button-primary/);
  });

  test("Button should have correct tooltip", async () => {
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );

    // Hover to show tooltip
    await createTaskButton.hover();
    await page.waitForTimeout(500);

    // Check tooltip content
    const tooltip = await page.locator(".tooltip:visible");
    await expect(tooltip).toContainText("Create a new task for this project");
  });

  test("Button click should create a new task", async () => {
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Click the Create Child Task button
    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );
    await createTaskButton.click();

    // Wait for task creation
    await page.waitForTimeout(2000);

    // Check for success notification
    const notice = await page.locator(
      '.notice:has-text("Task created successfully")',
    );
    await expect(notice).toBeVisible({ timeout: 5000 });

    // Verify new task file was opened
    const activeFile = await page.evaluate(() => {
      const app = (window as any).app;
      return app?.workspace?.getActiveFile()?.path;
    });

    // New task file should be opened
    expect(activeFile).toBeTruthy();
    expect(activeFile).not.toBe(projectFilePath);
  });

  test("Layout should load from correct folder path", async () => {
    // Verify layout file exists in the correct location
    const layoutPath = path.join(
      process.cwd(),
      "layouts",
      "Layout - ems__Project.md",
    );
    expect(fs.existsSync(layoutPath)).toBeTruthy();

    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);

    // Check that custom layout is loaded (not default)
    const customLayout = await page.locator(
      '.exocortex-layout-container[data-layout="custom"]',
    );
    await expect(customLayout).toBeVisible();

    // Verify specific blocks from the custom layout
    const projectActionsBlock = await page.locator(
      '.exocortex-block-title:has-text("🚀 Project Actions")',
    );
    await expect(projectActionsBlock).toBeVisible();

    const projectInfoBlock = await page.locator(
      '.exocortex-block-title:has-text("📋 Project Information")',
    );
    await expect(projectInfoBlock).toBeVisible();

    const activeTasksBlock = await page.locator(
      '.exocortex-block-title:has-text("📝 Active Tasks")',
    );
    await expect(activeTasksBlock).toBeVisible();
  });

  test("Button should work with different ontologies", async () => {
    // Create a test project with different ontology
    const testProjectContent = `---
exo__Asset_isDefinedBy: "[[!ems]]"
exo__Asset_uid: test-project-001
exo__Instance_class:
  - "[[ems__Project]]"
---
\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
`;

    // Create test file
    await page.evaluate(async (content) => {
      const app = (window as any).app;
      await app.vault.create("test-project.md", content);
    }, testProjectContent);

    // Open the test project
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=test-project.md`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Button should still appear
    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );
    await expect(createTaskButton).toBeVisible();
  });

  test("Created task should have correct parent reference", async () => {
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Click the Create Child Task button
    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );
    await createTaskButton.click();
    await page.waitForTimeout(2000);

    // Get the created task content
    const taskContent = await page.evaluate(() => {
      const app = (window as any).app;
      const activeFile = app?.workspace?.getActiveFile();
      if (activeFile) {
        return app.vault.read(activeFile);
      }
      return null;
    });

    expect(taskContent).toBeTruthy();

    // Verify task has correct properties
    expect(taskContent).toContain("exo__Instance_class");
    expect(taskContent).toContain("[[ems__Task]]");
    expect(taskContent).toContain("exo__Effort_parent");
    expect(taskContent).toContain("Project - Антифрод-триггеры");
    expect(taskContent).toContain("exo__Asset_isDefinedBy");
    expect(taskContent).toContain("[[!toos]]"); // Same ontology as parent
  });

  test("Button should not appear for non-project assets", async () => {
    // Create a test task (not project)
    const testTaskContent = `---
exo__Asset_isDefinedBy: "[[!ems]]"
exo__Asset_uid: test-task-001
exo__Instance_class:
  - "[[ems__Task]]"
---
\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
`;

    await page.evaluate(async (content) => {
      const app = (window as any).app;
      await app.vault.create("test-task.md", content);
    }, testTaskContent);

    // Open the test task
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=test-task.md`,
    );
    await page.waitForTimeout(2000);

    // Button should NOT appear for tasks
    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );
    await expect(createTaskButton).not.toBeVisible();
  });

  test("Multiple button clicks should create multiple tasks", async () => {
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );

    // Create first task
    await createTaskButton.click();
    await page.waitForTimeout(2000);

    // Navigate back to project
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Create second task
    await createTaskButton.click();
    await page.waitForTimeout(2000);

    // Both tasks should have unique IDs
    const files = await page.evaluate(() => {
      const app = (window as any).app;
      return app.vault
        .getFiles()
        .filter((f: any) => f.path.includes("exo__Asset_uid"))
        .map((f: any) => f.basename);
    });

    // Should have at least 2 unique task files
    const uniqueFiles = new Set(files);
    expect(uniqueFiles.size).toBeGreaterThanOrEqual(2);
  });

  test("Layout changes should reflect immediately", async () => {
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(projectFilePath)}`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Modify the layout file to change button text
    const modifiedLayout = await page.evaluate(async () => {
      const app = (window as any).app;
      const layoutFile = app.vault.getAbstractFileByPath(
        "layouts/Layout - ems__Project.md",
      );
      if (layoutFile) {
        let content = await app.vault.read(layoutFile);
        content = content.replace("➕ Create Child Task", "🆕 New Task");
        await app.vault.modify(layoutFile, content);
        return true;
      }
      return false;
    });

    expect(modifiedLayout).toBeTruthy();

    // Reload the view
    await page.reload();
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Check for updated button text
    const updatedButton = await page.locator('button:has-text("🆕 New Task")');
    await expect(updatedButton).toBeVisible();
  });

  test.afterEach(async () => {
    // Clean up test files
    await page.evaluate(async () => {
      const app = (window as any).app;
      const testFiles = ["test-project.md", "test-task.md"];
      for (const fileName of testFiles) {
        const file = app.vault.getAbstractFileByPath(fileName);
        if (file) {
          await app.vault.delete(file);
        }
      }
    });
  });
});

test.describe("Error Handling and Edge Cases", () => {
  let page: Page;

  test("Should handle missing layout file gracefully", async ({ page }) => {
    // Temporarily rename layout file
    const layoutPath = path.join(
      process.cwd(),
      "layouts",
      "Layout - ems__Project.md",
    );
    const backupPath = layoutPath + ".backup";

    if (fs.existsSync(layoutPath)) {
      fs.renameSync(layoutPath, backupPath);
    }

    try {
      await page.goto(
        `obsidian://open?vault=${encodeURIComponent("/Users/kitelev/vault-2025")}&file=${encodeURIComponent("01 Inbox/Project - Антифрод-триггеры.md")}`,
      );
      await page.waitForTimeout(2000);

      // Should fall back to default layout
      const defaultLayout = await page.locator(".exocortex-default-layout");
      await expect(defaultLayout).toBeVisible();

      // Button should not appear in default layout
      const createTaskButton = await page.locator(
        'button:has-text("Create Child Task")',
      );
      await expect(createTaskButton).not.toBeVisible();
    } finally {
      // Restore layout file
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, layoutPath);
      }
    }
  });

  test("Should handle malformed frontmatter gracefully", async ({ page }) => {
    const malformedContent = `---
exo__Asset_isDefinedBy: [[!ems]]
exo__Instance_class: ems__Project
---
\`\`\`dataviewjs
await window.ExoUIRender(dv, this);
\`\`\`
`;

    await page.evaluate(async (content) => {
      const app = (window as any).app;
      await app.vault.create("malformed-project.md", content);
    }, malformedContent);

    await page.goto(
      `obsidian://open?vault=${encodeURIComponent("/Users/kitelev/vault-2025")}&file=malformed-project.md`,
    );
    await page.waitForTimeout(2000);

    // Should handle gracefully without crashing
    const container = await page.locator(
      ".exocortex-layout-container, .exocortex-default-layout, .exocortex-error",
    );
    await expect(container).toBeVisible();
  });

  test("Should handle network/permission errors during task creation", async ({
    page,
  }) => {
    await page.goto(
      `obsidian://open?vault=${encodeURIComponent("/Users/kitelev/vault-2025")}&file=${encodeURIComponent("01 Inbox/Project - Антифрод-триггеры.md")}`,
    );
    await page.waitForTimeout(2000);
    await page.waitForSelector(".exocortex-layout-container", {
      timeout: 10000,
    });

    // Mock a failure in task creation
    await page.evaluate(() => {
      const originalCreate = (window as any).app.vault.create;
      (window as any).app.vault.create = () => {
        throw new Error("Permission denied");
      };
      // Store original for restoration
      (window as any).originalVaultCreate = originalCreate;
    });

    const createTaskButton = await page.locator(
      'button:has-text("Create Child Task")',
    );
    await createTaskButton.click();
    await page.waitForTimeout(1000);

    // Should show error notification
    const errorNotice = await page.locator(
      '.notice:has-text("Error"), .notice:has-text("Failed")',
    );
    await expect(errorNotice).toBeVisible();

    // Restore original function
    await page.evaluate(() => {
      if ((window as any).originalVaultCreate) {
        (window as any).app.vault.create = (window as any).originalVaultCreate;
      }
    });
  });
});
