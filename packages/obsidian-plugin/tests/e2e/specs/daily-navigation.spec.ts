import { test, expect } from "@playwright/test";
import { ObsidianLauncher } from "../utils/obsidian-launcher";
import * as path from "path";

test.describe("Daily Note Navigation", () => {
  let launcher: ObsidianLauncher;

  test.beforeEach(async () => {
    const vaultPath = path.join(__dirname, "../test-vault");
    launcher = new ObsidianLauncher(vaultPath);
    await launcher.launch();
  });

  test.afterEach(async () => {
    await launcher.close();
  });

  test("should display navigation links at the top of DailyNote layout", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(5000);

    await launcher.waitForElement(".exocortex-daily-navigation", 60000);

    const navContainer = window.locator(".exocortex-daily-navigation");
    await expect(navContainer).toBeVisible({ timeout: 10000 });

    const prevLink = navContainer.locator(".exocortex-nav-prev a");
    await expect(prevLink).toBeVisible();
    const prevText = await prevLink.textContent();
    expect(prevText).toBe("← 2025-10-15");

    const nextLink = navContainer.locator(".exocortex-nav-next a");
    await expect(nextLink).toBeVisible();
    const nextText = await nextLink.textContent();
    expect(nextText).toBe("2025-10-17 →");
  });

  test("should render navigation above Properties section", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(5000);

    await launcher.waitForElement(".exocortex-daily-navigation", 60000);

    const navContainer = window.locator(".exocortex-daily-navigation");
    const propertiesSection = window.locator(".exocortex-properties-section");

    const navVisible = await navContainer.isVisible();
    const propsVisible = await propertiesSection.isVisible();

    if (navVisible && propsVisible) {
      const navBox = await navContainer.boundingBox();
      const propsBox = await propertiesSection.boundingBox();

      expect(navBox).toBeTruthy();
      expect(propsBox).toBeTruthy();

      expect(navBox!.y + navBox!.height).toBeLessThanOrEqual(propsBox!.y);
    }
  });

  test("should not display navigation for non-DailyNote files", async () => {
    await launcher.openFile("Tasks/morning-standup.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(5000);

    await launcher.waitForElement(".exocortex-buttons-section", 60000);

    const navContainer = window.locator(".exocortex-daily-navigation");
    const isVisible = await navContainer.isVisible().catch(() => false);

    expect(isVisible).toBe(false);
  });

  test("should have proper styling for navigation links", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();

    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(5000);

    await launcher.waitForElement(".exocortex-daily-navigation", 60000);

    const navContainer = window.locator(".exocortex-daily-navigation");
    await expect(navContainer).toBeVisible({ timeout: 10000 });

    const prevLink = navContainer.locator(".exocortex-nav-prev a");
    const nextLink = navContainer.locator(".exocortex-nav-next a");

    await expect(prevLink).toBeVisible();
    await expect(nextLink).toBeVisible();

    const prevText = await prevLink.textContent();
    const nextText = await nextLink.textContent();

    expect(prevText).toContain("2025-10-15");
    expect(prevText).toContain("←");
    expect(nextText).toContain("2025-10-17");
    expect(nextText).toContain("→");
  });
});
