import { test, expect } from "@playwright/test";

/**
 * E2E tests for verifying table column alignment in DailyTasksTable.
 *
 * Issue #594: Headers are misaligned with data columns when virtualization
 * creates separate header and body tables.
 *
 * This test suite verifies that:
 * 1. Header column X positions match data column X positions
 * 2. Column widths are consistent between header and body
 * 3. The Name column has non-zero width (doesn't collapse)
 */
test.describe("Table Column Alignment (#594)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto("http://localhost:8080");

    // Wait for initial render
    await page.waitForSelector(".exocortex-action-buttons-container", {
      timeout: 15000,
    });

    // Navigate to a Daily Note that has tasks
    const dailyNoteLink = page.locator('a[href*="2025-10-18"]').first();
    if (await dailyNoteLink.isVisible()) {
      await dailyNoteLink.click();
      await page.waitForTimeout(2000);
    }
  });

  test("should align header columns with data columns", async ({ page }) => {
    // Wait for tasks section or relations section to appear
    const tasksSection = page.locator(".exocortex-daily-tasks-section");
    const relationsSection = page.locator(".exocortex-assets-relations");

    // Log what sections are visible for debugging
    const tasksSectionVisible = await tasksSection.isVisible().catch(() => false);
    const relationsSectionVisible = await relationsSection.isVisible().catch(() => false);
    console.log(`Tasks section visible: ${tasksSectionVisible}`);
    console.log(`Relations section visible: ${relationsSectionVisible}`);

    // Get the tasks table (try both possible class names)
    let tasksTable = page.locator(".exocortex-tasks-table").first();
    let isVisible = await tasksTable.isVisible().catch(() => false);

    // Fallback to relation-table if tasks-table not found
    if (!isVisible) {
      tasksTable = page.locator(".exocortex-relation-table").first();
      isVisible = await tasksTable.isVisible().catch(() => false);
      console.log(`Using relation-table fallback: ${isVisible}`);
    }

    if (!isVisible) {
      console.log("No table found - skipping test");
      test.skip();
      return;
    }

    // Get header cells
    const headerCells = tasksTable.locator("thead th");
    const headerCount = await headerCells.count();

    if (headerCount === 0) {
      test.skip();
      return;
    }

    // Get first data row cells
    const dataCells = tasksTable.locator("tbody tr:first-child td");
    const dataCount = await dataCells.count();

    // Header and data should have same number of columns
    expect(headerCount).toBe(dataCount);

    // Compare X positions and widths of each column
    for (let i = 0; i < headerCount; i++) {
      const headerCell = headerCells.nth(i);
      const dataCell = dataCells.nth(i);

      const headerBox = await headerCell.boundingBox();
      const dataBox = await dataCell.boundingBox();

      expect(headerBox).toBeTruthy();
      expect(dataBox).toBeTruthy();

      if (headerBox && dataBox) {
        // X positions should match (within 2px tolerance for rounding)
        expect(Math.abs(headerBox.x - dataBox.x)).toBeLessThanOrEqual(2);

        // Widths should match (within 2px tolerance)
        expect(Math.abs(headerBox.width - dataBox.width)).toBeLessThanOrEqual(
          2,
        );

        // Log for debugging
        console.log(
          `Column ${i}: Header X=${headerBox.x.toFixed(1)}, Data X=${dataBox.x.toFixed(1)}, ` +
            `Header W=${headerBox.width.toFixed(1)}, Data W=${dataBox.width.toFixed(1)}`,
        );
      }
    }
  });

  test("should have non-zero width for Name column", async ({ page }) => {
    const tasksTable = page.locator(".exocortex-tasks-table").first();
    const isVisible = await tasksTable.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Name column should be the first column
    const nameHeader = tasksTable.locator("thead th").first();
    const nameData = tasksTable.locator("tbody tr:first-child td").first();

    const nameHeaderBox = await nameHeader.boundingBox();
    const nameDataBox = await nameData.boundingBox();

    // Name column should have substantial width (at least 50px)
    if (nameHeaderBox) {
      expect(nameHeaderBox.width).toBeGreaterThan(50);
      console.log(`Name header width: ${nameHeaderBox.width}px`);
    }

    if (nameDataBox) {
      expect(nameDataBox.width).toBeGreaterThan(50);
      console.log(`Name data width: ${nameDataBox.width}px`);
    }
  });

  test("should maintain alignment with virtualized tables (separate header/body)", async ({
    page,
  }) => {
    // This test specifically checks the virtualized table scenario
    // where header and body are separate <table> elements

    const headerTable = page.locator(
      ".exocortex-tasks-table-header-container table",
    );
    const bodyTable = page.locator(
      ".exocortex-tasks-table-body-container table",
    );

    const headerVisible = await headerTable.isVisible().catch(() => false);
    const bodyVisible = await bodyTable.isVisible().catch(() => false);

    // If not using virtualized tables, skip this test
    if (!headerVisible || !bodyVisible) {
      // Check for single table scenario
      const singleTable = page.locator(".exocortex-tasks-table");
      const singleTableVisible = await singleTable
        .isVisible()
        .catch(() => false);

      if (singleTableVisible) {
        console.log(
          "Single table mode - virtualization not active, skipping separate table test",
        );
        test.skip();
        return;
      }
    }

    // Get colgroup from both tables
    const headerColgroup = headerTable.locator("colgroup col");
    const bodyColgroup = bodyTable.locator("colgroup col");

    const headerColCount = await headerColgroup.count();
    const bodyColCount = await bodyColgroup.count();

    // Both tables should have same number of columns
    expect(headerColCount).toBe(bodyColCount);

    // Compare column widths between header and body tables
    for (let i = 0; i < headerColCount; i++) {
      const headerCol = headerColgroup.nth(i);
      const bodyCol = bodyColgroup.nth(i);

      const headerWidth = await headerCol.evaluate(
        (el) => window.getComputedStyle(el).width,
      );
      const bodyWidth = await bodyCol.evaluate(
        (el) => window.getComputedStyle(el).width,
      );

      console.log(`Col ${i}: Header=${headerWidth}, Body=${bodyWidth}`);

      // Widths should match
      expect(headerWidth).toBe(bodyWidth);
    }
  });

  test("should have consistent column order: Name, Start, End, Status, [optional]", async ({
    page,
  }) => {
    const tasksTable = page.locator(".exocortex-tasks-table").first();
    const isVisible = await tasksTable.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Get header text content
    const headerCells = tasksTable.locator("thead th");
    const headerCount = await headerCells.count();

    const headerTexts: string[] = [];
    for (let i = 0; i < headerCount; i++) {
      const text = await headerCells.nth(i).textContent();
      headerTexts.push(text?.trim() || "");
    }

    console.log("Header columns:", headerTexts);

    // First 4 columns should be: Name, Start, End, Status
    // (may have sort indicators like ▲/▼)
    expect(headerTexts[0]).toContain("Name");
    expect(headerTexts[1]).toContain("Start");
    expect(headerTexts[2]).toContain("End");
    expect(headerTexts[3]).toContain("Status");
  });

  test("should NOT have data shifted left relative to headers", async ({
    page,
  }) => {
    // This is the exact issue from #594 - data appears to the LEFT of headers
    const tasksTable = page.locator(".exocortex-tasks-table").first();
    const isVisible = await tasksTable.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Get header Name column position
    const nameHeader = tasksTable.locator("thead th.task-name-header");
    const nameData = tasksTable.locator("tbody td.task-name").first();

    const headerExists = (await nameHeader.count()) > 0;
    const dataExists = (await nameData.count()) > 0;

    if (!headerExists || !dataExists) {
      test.skip();
      return;
    }

    const headerBox = await nameHeader.boundingBox();
    const dataBox = await nameData.boundingBox();

    if (headerBox && dataBox) {
      // Data column X should NOT be significantly less than header X
      // (if data is shifted left, dataBox.x would be much smaller than headerBox.x)
      const shift = headerBox.x - dataBox.x;
      console.log(
        `Name column shift: ${shift}px (positive = data shifted left)`,
      );

      // Allow max 5px shift (for normal rendering variations)
      expect(shift).toBeLessThanOrEqual(5);

      // Also check that data is not shifted right too much
      expect(shift).toBeGreaterThanOrEqual(-5);
    }
  });

  test("should have task names visible in Name column (not collapsed)", async ({
    page,
  }) => {
    const tasksTable = page.locator(".exocortex-tasks-table").first();
    const isVisible = await tasksTable.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Get first task name cell
    const nameCell = tasksTable.locator("tbody td.task-name").first();
    const nameCellExists = (await nameCell.count()) > 0;

    if (!nameCellExists) {
      test.skip();
      return;
    }

    // Get the link inside the name cell (task names are links)
    const nameLink = nameCell.locator("a.internal-link");
    const linkExists = (await nameLink.count()) > 0;

    if (linkExists) {
      const linkText = await nameLink.textContent();
      console.log(`Task name: "${linkText}"`);

      // Task name should not be empty
      expect(linkText?.trim().length).toBeGreaterThan(0);

      // Link should be visible (not hidden due to column collapse)
      const linkBox = await nameLink.boundingBox();
      expect(linkBox).toBeTruthy();
      if (linkBox) {
        expect(linkBox.width).toBeGreaterThan(10);
      }
    }
  });
});
