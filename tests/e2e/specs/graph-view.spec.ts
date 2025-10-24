import { test, expect } from "@playwright/test";
import { ObsidianLauncher } from '../utils/obsidian-launcher';
import * as path from 'path';

test.describe("Graph View E2E Tests", () => {
  let launcher: ObsidianLauncher;

  test.beforeEach(async () => {
    const vaultPath = path.join(__dirname, '../test-vault');
    launcher = new ObsidianLauncher(vaultPath);
    await launcher.launch();
  });

  test.afterEach(async () => {
    await launcher.close();
  });

  test("should open graph view via ribbon icon", async () => {
    await launcher.openFile('Areas/development.md');
    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-buttons-section', 60000);

    const ribbonIcon = window.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');

    await ribbonIcon.waitFor({ state: "visible", timeout: 10000 });
    await ribbonIcon.click();

    await launcher.waitForElement('.exocortex-graph-view-container', 10000);

    const graphView = window.locator(".exocortex-graph-view-container");
    await expect(graphView).toBeVisible({ timeout: 5000 });
  });

  test("should render graph canvas SVG element", async () => {
    await launcher.openFile('Areas/development.md');
    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-buttons-section', 60000);

    const ribbonIcon = window.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await launcher.waitForElement('.exocortex-graph-view-container', 10000);

    const svg = window.locator("svg.exocortex-graph-canvas");
    await expect(svg).toBeVisible({ timeout: 5000 });
  });

  test("should display graph controls section", async () => {
    await launcher.openFile('Areas/development.md');
    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);
    await launcher.waitForElement('.exocortex-buttons-section', 60000);

    const ribbonIcon = window.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await launcher.waitForElement('.exocortex-graph-view-container', 10000);

    const controls = window.locator(".exocortex-graph-controls");
    await expect(controls).toBeVisible({ timeout: 5000 });

    await expect(window.locator("text=Filters:")).toBeVisible();
  });
});
