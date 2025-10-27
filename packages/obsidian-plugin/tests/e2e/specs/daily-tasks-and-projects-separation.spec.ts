import { test, expect } from "@playwright/test";
import { ObsidianLauncher } from "../utils/obsidian-launcher";
import * as path from "path";

test.describe("DailyNote Tasks and Projects Separation", () => {
  let launcher: ObsidianLauncher;

  test.beforeEach(async () => {
    const vaultPath = path.join(__dirname, "../test-vault");
    launcher = new ObsidianLauncher(vaultPath);
    await launcher.launch();
  });

  test.afterEach(async () => {
    await launcher.close();
  });

  test("should display separate tables for tasks and projects", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);

    await launcher.waitForElement(".exocortex-daily-tasks-section", 60000);
    await launcher.waitForElement(".exocortex-daily-projects-section", 60000);

    const tasksSection = window
      .locator(".exocortex-daily-tasks-section")
      .first();
    const projectsSection = window
      .locator(".exocortex-daily-projects-section")
      .first();

    await expect(tasksSection).toBeVisible({ timeout: 10000 });
    await expect(projectsSection).toBeVisible({ timeout: 10000 });

    const tasksSectionText = await tasksSection.textContent();
    const projectsSectionText = await projectsSection.textContent();

    expect(tasksSectionText).toContain("Tasks");
    expect(projectsSectionText).toContain("Projects");
  });

  test("should display only tasks in tasks table", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);

    await launcher.waitForElement(".exocortex-daily-tasks-section", 60000);

    const tasksTable = window
      .locator(".exocortex-daily-tasks-section table")
      .first();
    await expect(tasksTable).toBeVisible({ timeout: 10000 });

    const tasksTableContent = await tasksTable.textContent();

    expect(tasksTableContent).toContain("Morning standup");
    expect(tasksTableContent).toContain("Code review");

    expect(tasksTableContent).not.toContain("Website Redesign");
    expect(tasksTableContent).not.toContain("Mobile App Development");
  });

  test("should display only projects in projects table", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);

    await launcher.waitForElement(".exocortex-daily-projects-section", 60000);

    const projectsTable = window
      .locator(".exocortex-daily-projects-section table")
      .first();
    await expect(projectsTable).toBeVisible({ timeout: 10000 });

    const projectsTableContent = await projectsTable.textContent();

    expect(projectsTableContent).toContain("Website Redesign");
    expect(projectsTableContent).toContain("Mobile App Development");

    expect(projectsTableContent).not.toContain("Morning standup");
    expect(projectsTableContent).not.toContain("Code review");
  });

  test("should display projects with correct status and timestamps", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);

    await launcher.waitForElement(".exocortex-daily-projects-section", 60000);

    const projectsTable = window
      .locator(".exocortex-daily-projects-section table")
      .first();
    await expect(projectsTable).toBeVisible({ timeout: 10000 });

    const projectsTableContent = await projectsTable.textContent();

    expect(projectsTableContent).toContain("Doing");
    expect(projectsTableContent).toContain("ToDo");

    expect(projectsTableContent).toMatch(/10:00/);
    expect(projectsTableContent).toMatch(/14:00/);
  });

  test("should display correct row counts in both tables", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);

    await launcher.waitForElement(".exocortex-daily-tasks-section", 60000);
    await launcher.waitForElement(".exocortex-daily-projects-section", 60000);

    const tasksTable = window
      .locator(".exocortex-daily-tasks-section table")
      .first();
    const projectsTable = window
      .locator(".exocortex-daily-projects-section table")
      .first();

    await expect(tasksTable).toBeVisible({ timeout: 10000 });
    await expect(projectsTable).toBeVisible({ timeout: 10000 });

    const taskRows = tasksTable.locator("tbody tr");
    const projectRows = projectsTable.locator("tbody tr");

    await expect(taskRows.first()).toBeVisible({ timeout: 5000 });
    await expect(projectRows.first()).toBeVisible({ timeout: 5000 });

    const taskRowCount = await taskRows.count();
    const projectRowCount = await projectRows.count();

    expect(taskRowCount).toBe(2);
    expect(projectRowCount).toBe(2);
  });

  test("should display projects table after tasks table", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);

    await launcher.waitForElement(".exocortex-daily-tasks-section", 60000);
    await launcher.waitForElement(".exocortex-daily-projects-section", 60000);

    const tasksSection = window
      .locator(".exocortex-daily-tasks-section")
      .first();
    const projectsSection = window
      .locator(".exocortex-daily-projects-section")
      .first();

    const tasksSectionBox = await tasksSection.boundingBox();
    const projectsSectionBox = await projectsSection.boundingBox();

    expect(tasksSectionBox).not.toBeNull();
    expect(projectsSectionBox).not.toBeNull();

    if (tasksSectionBox && projectsSectionBox) {
      expect(projectsSectionBox.y).toBeGreaterThan(tasksSectionBox.y);
    }
  });
});
