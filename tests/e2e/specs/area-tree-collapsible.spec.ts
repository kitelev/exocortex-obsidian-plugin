import { test, expect } from '@playwright/test';
import { ObsidianLauncher } from '../utils/obsidian-launcher';

test.describe('Area Tree Collapsible Functionality', () => {
  let launcher: ObsidianLauncher;

  test.beforeAll(async () => {
    launcher = new ObsidianLauncher();
    await launcher.launch();
  });

  test.afterAll(async () => {
    if (launcher) {
      await launcher.close();
    }
  });

  test('should display only child areas, not the root area', async () => {
    await launcher.openNote('Areas/development.md');
    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-area-tree', 60000);

    const areaTree = await launcher.page.locator('.exocortex-area-tree');
    await expect(areaTree).toBeVisible();

    await expect(launcher.page.locator('text=Frontend')).toBeVisible();
    await expect(launcher.page.locator('text=Backend')).toBeVisible();
    await expect(launcher.page.locator('[data-area-path*="development.md"]')).not.toBeVisible();
  });

  test('should display toggle button for areas with children', async () => {
    await launcher.openNote('Areas/development.md');
    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-area-tree', 60000);

    const frontendRow = launcher.page.locator('[data-area-path*="frontend.md"]');
    const frontendToggle = frontendRow.locator('.area-tree-toggle');

    await expect(frontendToggle).toBeVisible();
    await expect(frontendToggle).toHaveText('▼');

    const backendRow = launcher.page.locator('[data-area-path*="backend.md"]');
    const backendToggle = backendRow.locator('.area-tree-toggle');

    await expect(backendToggle).not.toBeVisible();
  });

  test('should collapse children when toggle is clicked', async () => {
    await launcher.openNote('Areas/development.md');
    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-area-tree', 60000);

    const reactComponentsLink = launcher.page.locator('text=React Components');
    await expect(reactComponentsLink).toBeVisible();

    const frontendRow = launcher.page.locator('[data-area-path*="frontend.md"]');
    const frontendToggle = frontendRow.locator('.area-tree-toggle');

    await frontendToggle.click();

    await expect(frontendToggle).toHaveText('▶');
    await expect(reactComponentsLink).not.toBeVisible();
  });

  test('should expand children when toggle is clicked again', async () => {
    await launcher.openNote('Areas/development.md');
    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-area-tree', 60000);

    const frontendRow = launcher.page.locator('[data-area-path*="frontend.md"]');
    const frontendToggle = frontendRow.locator('.area-tree-toggle');

    await frontendToggle.click();
    await expect(frontendToggle).toHaveText('▶');

    const reactComponentsLink = launcher.page.locator('text=React Components');
    await expect(reactComponentsLink).not.toBeVisible();

    await frontendToggle.click();
    await expect(frontendToggle).toHaveText('▼');
    await expect(reactComponentsLink).toBeVisible();
  });

  test('should display correct hierarchy depth with collapsible nodes', async () => {
    await launcher.openNote('Areas/development.md');
    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-area-tree', 60000);

    const tableRows = launcher.page.locator('.exocortex-area-tree tbody tr');
    await expect(tableRows).toHaveCount(3);

    await expect(launcher.page.locator('text=Frontend')).toBeVisible();
    await expect(launcher.page.locator('text=Backend')).toBeVisible();
    await expect(launcher.page.locator('text=React Components')).toBeVisible();
  });

  test('should allow clicking on area links to navigate', async () => {
    await launcher.openNote('Areas/development.md');
    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-area-tree', 60000);

    const frontendLink = launcher.page.locator('[data-href*="frontend.md"]').first();
    await frontendLink.click();

    await launcher.waitForElement('.exocortex-area-tree', 60000);

    await expect(launcher.page.locator('text=React Components')).toBeVisible();
    await expect(launcher.page.locator('text=Backend')).not.toBeVisible();
  });
});
