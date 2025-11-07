import { test, expect } from "@playwright/test";

test.describe("Show Archived Button in pn__DailyNote", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:8080");

    await page.waitForSelector(".exocortex-action-buttons-container", {
      timeout: 10000,
    });

    const dailyNoteLink = page.locator('a[href*="2025-10-18"]').first();
    if (await dailyNoteLink.isVisible()) {
      await dailyNoteLink.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should display Show Archived toggle button in relations section", async ({ page }) => {
    const relationsSection = page.locator(".exocortex-assets-relations");
    await expect(relationsSection).toBeVisible({ timeout: 10000 });

    const showArchivedButton = page.locator("button.exocortex-toggle-archived");
    await expect(showArchivedButton).toBeVisible();

    const buttonText = await showArchivedButton.textContent();
    expect(buttonText).toContain("Show Archived");
  });

  test("should hide archived assets by default", async ({ page }) => {
    const relationsSection = page.locator(".exocortex-assets-relations");
    await expect(relationsSection).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(1000);

    const archivedTaskRow = page.locator('text="Archived Task"');
    const isVisible = await archivedTaskRow.isVisible().catch(() => false);

    expect(isVisible).toBe(false);
  });

  test("should show archived assets when Show Archived button is clicked", async ({ page }) => {
    const relationsSection = page.locator(".exocortex-assets-relations");
    await expect(relationsSection).toBeVisible({ timeout: 10000 });

    const showArchivedButton = page.locator("button.exocortex-toggle-archived");
    await expect(showArchivedButton).toBeVisible();

    const rowsBeforeClick = await page.locator(".exocortex-relation-table tbody tr").count();

    await showArchivedButton.click();
    await page.waitForTimeout(500);

    const buttonTextAfter = await showArchivedButton.textContent();
    expect(buttonTextAfter).toContain("Hide Archived");

    const archivedTaskRow = page.locator('text="Archived Task"');
    await expect(archivedTaskRow).toBeVisible({ timeout: 5000 });

    const rowsAfterClick = await page.locator(".exocortex-relation-table tbody tr").count();
    expect(rowsAfterClick).toBeGreaterThan(rowsBeforeClick);
  });

  test("should hide archived assets again when Hide Archived button is clicked", async ({ page }) => {
    const relationsSection = page.locator(".exocortex-assets-relations");
    await expect(relationsSection).toBeVisible({ timeout: 10000 });

    const showArchivedButton = page.locator("button.exocortex-toggle-archived");
    await expect(showArchivedButton).toBeVisible();

    await showArchivedButton.click();
    await page.waitForTimeout(500);

    const archivedTaskRow = page.locator('text="Archived Task"');
    await expect(archivedTaskRow).toBeVisible({ timeout: 5000 });

    const rowsWithArchived = await page.locator(".exocortex-relation-table tbody tr").count();

    await showArchivedButton.click();
    await page.waitForTimeout(500);

    const buttonText = await showArchivedButton.textContent();
    expect(buttonText).toContain("Show Archived");

    const isVisible = await archivedTaskRow.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    const rowsWithoutArchived = await page.locator(".exocortex-relation-table tbody tr").count();
    expect(rowsWithoutArchived).toBeLessThan(rowsWithArchived);
  });

  test("should persist archived visibility state across page reloads", async ({ page }) => {
    const relationsSection = page.locator(".exocortex-assets-relations");
    await expect(relationsSection).toBeVisible({ timeout: 10000 });

    const showArchivedButton = page.locator("button.exocortex-toggle-archived");
    await expect(showArchivedButton).toBeVisible();

    await showArchivedButton.click();
    await page.waitForTimeout(500);

    const archivedTaskRow = page.locator('text="Archived Task"');
    await expect(archivedTaskRow).toBeVisible({ timeout: 5000 });

    await page.reload();
    await page.waitForSelector(".exocortex-assets-relations", { timeout: 10000 });
    await page.waitForTimeout(1000);

    const archivedTaskAfterReload = page.locator('text="Archived Task"');
    const isVisibleAfterReload = await archivedTaskAfterReload.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isVisibleAfterReload).toBe(true);

    const buttonTextAfterReload = await page.locator("button.exocortex-toggle-archived").textContent();
    expect(buttonTextAfterReload).toContain("Hide Archived");
  });

  test("should only filter archived assets, not other assets", async ({ page }) => {
    const relationsSection = page.locator(".exocortex-assets-relations");
    await expect(relationsSection).toBeVisible({ timeout: 10000 });

    const showArchivedButton = page.locator("button.exocortex-toggle-archived");
    await expect(showArchivedButton).toBeVisible();

    const nonArchivedRowsInitial = await page.locator(".exocortex-relation-table tbody tr").count();

    await showArchivedButton.click();
    await page.waitForTimeout(500);

    const allRowsAfterShow = await page.locator(".exocortex-relation-table tbody tr").count();

    const archivedCount = allRowsAfterShow - nonArchivedRowsInitial;
    expect(archivedCount).toBeGreaterThan(0);

    const regularTaskRows = page.locator('tbody tr').filter({ hasNotText: "Archived Task" });
    const regularCount = await regularTaskRows.count();
    expect(regularCount).toBe(nonArchivedRowsInitial);
  });
});
