import { test, expect } from '@playwright/test';
import { ObsidianLauncher } from '../utils/obsidian-launcher';
import * as path from 'path';

test.describe('DailyNote Tasks Table', () => {
  let launcher: ObsidianLauncher;

  test.beforeEach(async () => {
    const vaultPath = path.join(__dirname, '../test-vault');
    launcher = new ObsidianLauncher(vaultPath);
    await launcher.launch();
  });

  test.afterEach(async () => {
    await launcher.close();
  });

  test('should display only tasks for the current day', async () => {
    await launcher.openFile('Daily Notes/2025-10-16.md');

    const window = await launcher.getWindow();

    await launcher.waitForElement('.exocortex-daily-tasks-section', 30000);

    const tasksTable = window.locator('.exocortex-daily-tasks-section table').first();
    await expect(tasksTable).toBeVisible({ timeout: 10000 });

    const rows = tasksTable.locator('tbody tr');
    const rowCount = await rows.count();

    expect(rowCount).toBe(2);

    const tableContent = await tasksTable.textContent();

    expect(tableContent).toContain('Morning standup');
    expect(tableContent).toContain('Code review');

    expect(tableContent).not.toContain('Different day task');
  });

  test('should display task status and timestamps correctly', async () => {
    await launcher.openFile('Daily Notes/2025-10-16.md');

    const window = await launcher.getWindow();

    await launcher.waitForElement('.exocortex-daily-tasks-section', 30000);

    const tasksTable = window.locator('.exocortex-daily-tasks-section table').first();
    await expect(tasksTable).toBeVisible({ timeout: 10000 });

    const tableContent = await tasksTable.textContent();

    expect(tableContent).toContain('Doing');
    expect(tableContent).toContain('Done');

    expect(tableContent).toMatch(/09:00|9:00/);
    expect(tableContent).toMatch(/15:00|3:00/);
  });

  test('should filter out archived tasks', async () => {
    await launcher.openFile('Daily Notes/2025-10-16.md');

    const window = await launcher.getWindow();

    await launcher.waitForElement('.exocortex-daily-tasks-section', 30000);

    const tasksTable = window.locator('.exocortex-daily-tasks-section table').first();
    await expect(tasksTable).toBeVisible({ timeout: 10000 });

    const rows = tasksTable.locator('tbody tr');
    const rowCount = await rows.count();

    expect(rowCount).toBeGreaterThan(0);

    const tableContent = await tasksTable.textContent();
    expect(tableContent).not.toContain('ARCHIVED');
    expect(tableContent).not.toContain('archived');
  });
});
