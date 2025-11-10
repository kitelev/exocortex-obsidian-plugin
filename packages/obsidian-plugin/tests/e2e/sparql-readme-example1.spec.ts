import { test, expect } from "@playwright/test";

test.describe("SPARQL README Example 1", () => {
  test("should execute Example 1 query and return at least 10 results", async ({
    page,
  }) => {
    await page.goto("http://localhost:8080/sparql-example1");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const codeBlock = page.locator(".sparql-code-block");
    const isVisible = await codeBlock.isVisible().catch(() => false);

    if (!isVisible) {
      throw new Error("SPARQL code block not found on page");
    }

    await expect(codeBlock).toBeVisible();

    const resultsTable = page.locator(".sparql-results-table");
    const hasResults = await resultsTable
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasResults) {
      const hasError = await codeBlock
        .locator(".sparql-error")
        .isVisible()
        .catch(() => false);
      if (hasError) {
        const errorText = await codeBlock.locator(".sparql-error").textContent();
        throw new Error(`Query failed with error: ${errorText}`);
      }
      throw new Error("Query did not return results or error");
    }

    await expect(resultsTable).toBeVisible();

    const rows = resultsTable.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(10);

    const meta = page.locator(".sparql-meta");
    const metaText = await meta.textContent();
    expect(metaText).toMatch(/\d+ result\(s\)/);
  });

  test("should display correct column headers (asset, label)", async ({
    page,
  }) => {
    await page.goto("http://localhost:8080/sparql-example1");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const resultsTable = page.locator(".sparql-results-table");
    const isVisible = await resultsTable
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      const headers = resultsTable.locator("thead th");
      const headerCount = await headers.count();
      expect(headerCount).toBe(2);

      const header1Text = await headers.nth(0).textContent();
      const header2Text = await headers.nth(1).textContent();

      expect(header1Text).toBe("asset");
      expect(header2Text).toBe("label");
    }
  });

  test("should use correct namespace URI in query", async ({ page }) => {
    await page.goto("http://localhost:8080/sparql-example1");

    await page.waitForSelector(".markdown-preview-view", { timeout: 10000 });

    const codeBlock = page.locator(".sparql-code-block");
    const isVisible = await codeBlock.isVisible().catch(() => false);

    if (!isVisible) {
      throw new Error("SPARQL code block not found");
    }

    const codeContent = await codeBlock.locator("pre code").textContent();

    expect(codeContent).toContain("https://exocortex.my/ontology/exo#");
    expect(codeContent).toContain("PREFIX exo:");
    expect(codeContent).toContain("exo:Asset_label");
  });
});
