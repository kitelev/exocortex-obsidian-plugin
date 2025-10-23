import { test, expect } from "@playwright/test";

test.describe("Graph View E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:8080");
    await page.waitForSelector(".exocortex-buttons-section", { timeout: 60000 });
  });

  test("should open graph view via ribbon icon", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');

    await ribbonIcon.waitFor({ state: "visible", timeout: 10000 });
    await ribbonIcon.click();

    await page.waitForTimeout(1000);

    const graphView = page.locator(".exocortex-graph-view-container");
    await expect(graphView).toBeVisible({ timeout: 5000 });
  });

  test("should render graph canvas SVG element", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(1000);

    const svg = page.locator("svg.exocortex-graph-canvas");
    await expect(svg).toBeVisible({ timeout: 5000 });
  });

  test("should display graph controls section", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(1000);

    const controls = page.locator(".exocortex-graph-controls");
    await expect(controls).toBeVisible({ timeout: 5000 });

    await expect(page.locator("text=Filters:")).toBeVisible();
  });

  test("should display Show Archived checkbox", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(1000);

    await expect(page.locator("text=Show Archived")).toBeVisible({ timeout: 5000 });

    const archivedCheckbox = page.locator('label:has-text("Show Archived") input[type="checkbox"]');
    await expect(archivedCheckbox).toBeVisible();
  });

  test("should toggle Show Archived filter", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(1000);

    const archivedCheckbox = page.locator('label:has-text("Show Archived") input[type="checkbox"]');

    await expect(archivedCheckbox).not.toBeChecked();

    await archivedCheckbox.click();
    await page.waitForTimeout(300);

    await expect(archivedCheckbox).toBeChecked();
  });

  test("should display type filter checkboxes if vault has typed assets", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(2000);

    const typeFilters = page.locator('.exocortex-graph-controls label:has(input[type="checkbox"])');
    const count = await typeFilters.count();

    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should render graph with nodes after opening", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(3000);

    const svg = page.locator("svg.exocortex-graph-canvas");
    const circles = svg.locator("circle");

    const circleCount = await circles.count();
    expect(circleCount).toBeGreaterThan(0);
  });

  test("should open graph view via command palette", async ({ page }) => {
    await page.keyboard.press("Control+p");

    await page.waitForTimeout(500);

    await page.keyboard.type("Exocortex Graph");

    await page.waitForTimeout(500);

    await page.keyboard.press("Enter");

    await page.waitForTimeout(1000);

    const graphView = page.locator(".exocortex-graph-view-container");
    await expect(graphView).toBeVisible({ timeout: 5000 });
  });

  test("should display node labels in graph", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(3000);

    const svg = page.locator("svg.exocortex-graph-canvas");
    const textElements = svg.locator("text");

    const textCount = await textElements.count();
    expect(textCount).toBeGreaterThan(0);
  });

  test("should have proper container layout", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(1000);

    const container = page.locator(".exocortex-graph-container");
    await expect(container).toBeVisible();

    const containerBox = await container.boundingBox();
    expect(containerBox).toBeTruthy();
    expect(containerBox!.height).toBeGreaterThan(200);
    expect(containerBox!.width).toBeGreaterThan(200);
  });

  test("should close graph view when clicking close button", async ({ page }) => {
    const ribbonIcon = page.locator('.side-dock-ribbon-action[aria-label="Open Exocortex Graph"]');
    await ribbonIcon.click();

    await page.waitForTimeout(1000);

    const graphView = page.locator(".exocortex-graph-view-container");
    await expect(graphView).toBeVisible();

    const closeButton = page.locator('.workspace-leaf-header .workspace-leaf-header-icon[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
      await expect(graphView).not.toBeVisible();
    }
  });
});
