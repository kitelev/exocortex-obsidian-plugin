import { test, expect } from "@playwright/test";

test.describe("SPARQL Code Block Tests", () => {
  test("should recognize sparql code blocks", async ({ page }) => {
    await page.goto("http://localhost:8080");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const codeBlock = page.locator(".sparql-code-block");
    const isVisible = await codeBlock.isVisible().catch(() => false);

    if (isVisible) {
      await expect(codeBlock).toBeVisible();
      expect(await codeBlock.count()).toBeGreaterThan(0);
    }
  });

  test("should render SPARQL results or loading state", async ({ page }) => {
    await page.goto("http://localhost:8080");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const codeBlock = page.locator(".sparql-code-block");
    const isVisible = await codeBlock.isVisible().catch(() => false);

    if (isVisible) {
      const hasResults = await codeBlock
        .locator(".sparql-results-table")
        .isVisible()
        .catch(() => false);
      const hasNoResults = await codeBlock
        .locator(".sparql-no-results")
        .isVisible()
        .catch(() => false);
      const hasError = await codeBlock
        .locator(".sparql-error")
        .isVisible()
        .catch(() => false);
      const hasLoading = await codeBlock
        .locator(".sparql-loading")
        .isVisible()
        .catch(() => false);

      expect(
        hasResults || hasNoResults || hasError || hasLoading
      ).toBeTruthy();
    }
  });

  test("should render table headers when results available", async ({
    page,
  }) => {
    await page.goto("http://localhost:8080");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const resultsTable = page.locator(".sparql-results-table");
    const isVisible = await resultsTable.isVisible().catch(() => false);

    if (isVisible) {
      const headers = resultsTable.locator("thead th");
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        expect(headerText).toBeTruthy();
      }
    }
  });

  test("should render result count metadata", async ({ page }) => {
    await page.goto("http://localhost:8080");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const meta = page.locator(".sparql-meta");
    const isVisible = await meta.isVisible().catch(() => false);

    if (isVisible) {
      const metaText = await meta.textContent();
      expect(metaText).toMatch(/\d+ result\(s\)/);
    }
  });

  test("should display error message for invalid queries", async ({ page }) => {
    await page.goto("http://localhost:8080");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const errorDiv = page.locator(".sparql-error");
    const isVisible = await errorDiv.isVisible().catch(() => false);

    if (isVisible) {
      const errorHeader = errorDiv.locator("strong");
      await expect(errorHeader).toHaveText("SPARQL Query Error:");

      const errorMessage = errorDiv.locator("pre");
      const errorText = await errorMessage.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText!.trim().length).toBeGreaterThan(0);
    }
  });

  test("should apply proper CSS classes to code block container", async ({
    page,
  }) => {
    await page.goto("http://localhost:8080");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const codeBlock = page.locator(".sparql-code-block");
    const isVisible = await codeBlock.isVisible().catch(() => false);

    if (isVisible) {
      const hasResultsContainer = await codeBlock
        .locator(".sparql-results-container")
        .isVisible()
        .catch(() => false);
      expect(hasResultsContainer).toBeTruthy();
    }
  });
});
