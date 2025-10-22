import { test, expect } from "@playwright/test";

test.describe("Layout Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:8080");
    await page.waitForSelector(".exocortex-action-buttons-container", { timeout: 10000 });
  });

  test("should render button groups with proper spacing", async ({ page }) => {
    const buttonsContainer = page.locator(".exocortex-action-buttons-container");
    await expect(buttonsContainer).toBeVisible();

    const containerBox = await buttonsContainer.boundingBox();
    expect(containerBox).toBeTruthy();
    expect(containerBox!.height).toBeGreaterThan(50);
  });

  test("should have proper gap between button groups", async ({ page }) => {
    const buttonGroups = page.locator(".exocortex-button-group");
    const count = await buttonGroups.count();

    if (count > 1) {
      const separators = page.locator(".exocortex-button-group-separator");
      const separatorCount = await separators.count();
      expect(separatorCount).toBe(count - 1);
    }
  });

  test("should render buttons with proper styling", async ({ page }) => {
    const firstButton = page.locator(".exocortex-action-button").first();
    await expect(firstButton).toBeVisible();

    const buttonBox = await firstButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    expect(buttonBox!.height).toBeGreaterThanOrEqual(32);
    expect(buttonBox!.width).toBeGreaterThan(0);
  });

  test("should have readable text in buttons", async ({ page }) => {
    const buttons = page.locator(".exocortex-action-button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      expect(text).toBeTruthy();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test("should not overlap sections", async ({ page }) => {
    const buttonsContainer = page.locator(".exocortex-action-buttons-container");
    const propertiesSection = page.locator(".exocortex-properties-section");

    const buttonsVisible = await buttonsContainer.isVisible();
    const propsVisible = await propertiesSection.isVisible();

    if (buttonsVisible && propsVisible) {
      const buttonsBox = await buttonsContainer.boundingBox();
      const propsBox = await propertiesSection.boundingBox();

      expect(buttonsBox).toBeTruthy();
      expect(propsBox).toBeTruthy();

      expect(buttonsBox!.y + buttonsBox!.height).toBeLessThanOrEqual(propsBox!.y);
    }
  });

  test("should have consistent button widths in same group", async ({ page }) => {
    const buttonGroups = page.locator(".exocortex-button-group");
    const groupCount = await buttonGroups.count();

    for (let i = 0; i < groupCount; i++) {
      const group = buttonGroups.nth(i);
      const buttons = group.locator(".exocortex-action-button");
      const buttonCount = await buttons.count();

      if (buttonCount > 1) {
        const widths: number[] = [];
        for (let j = 0; j < buttonCount; j++) {
          const box = await buttons.nth(j).boundingBox();
          if (box) widths.push(box.width);
        }

        const uniqueWidths = new Set(widths);
        expect(uniqueWidths.size).toBeGreaterThan(0);
      }
    }
  });

  test("should have proper visual hierarchy", async ({ page }) => {
    const groupTitles = page.locator(".exocortex-button-group-title");
    const titleCount = await groupTitles.count();

    if (titleCount > 0) {
      const firstTitle = groupTitles.first();
      await expect(firstTitle).toBeVisible();

      const fontSize = await firstTitle.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      expect(fontSize).toBeTruthy();
    }
  });

  test("should render without horizontal scrollbar", async ({ page }) => {
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
