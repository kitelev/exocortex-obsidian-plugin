import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { SPARQLResultViewer } from "../../../src/presentation/components/sparql/SPARQLResultViewer";

test.describe.skip("SPARQLResultViewer", () => {
  const mockApp: any = {
    loadLocalStorage: () => null,
    saveLocalStorage: () => {},
  };

  const mockSolutionMappings: any[] = [
    {
      get: (variable: string) => {
        const data: Record<string, any> = {
          task: { toString: () => "[[Task 1]]" },
          status: { toString: () => "Done" },
        };
        return data[variable];
      },
      getBindings: () => new Map([
        ["task", { toString: () => "[[Task 1]]" }],
        ["status", { toString: () => "Done" }],
      ]),
    },
    {
      get: (variable: string) => {
        const data: Record<string, any> = {
          task: { toString: () => "[[Task 2]]" },
          status: { toString: () => "In Progress" },
        };
        return data[variable];
      },
      getBindings: () => new Map([
        ["task", { toString: () => "[[Task 2]]" }],
        ["status", { toString: () => "In Progress" }],
      ]),
    },
  ];

  const mockTriples: any[] = [
    {
      subject: {
        toString: () => "<https://example.org/task1>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/label>",
      },
      object: {
        toString: () => '"Task 1"',
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/task2>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/label>",
      },
      object: {
        toString: () => '"Task 2"',
      },
    },
  ];

  const mockTriplesWithRelationships: any[] = [
    {
      subject: {
        toString: () => "<https://example.org/task1>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/relatesTo>",
      },
      object: {
        toString: () => "<https://example.org/task2>",
      },
      toString: () => "<https://example.org/task1> <https://example.org/predicate/relatesTo> <https://example.org/task2> .",
    },
    {
      subject: {
        toString: () => "<https://example.org/task2>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/relatesTo>",
      },
      object: {
        toString: () => "<https://example.org/task3>",
      },
      toString: () => "<https://example.org/task2> <https://example.org/predicate/relatesTo> <https://example.org/task3> .",
    },
  ];

  const selectQuery = "SELECT ?task ?status WHERE { ?task <status> ?status }";
  const constructQuery = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";

  test.beforeEach(({ page }) => {
    page.evaluate(() => {
      localStorage.clear();
    });
  });

  test("should render no results message when empty", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={[]}
        queryString={selectQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );
    await expect(component.locator(".sparql-no-results")).toBeVisible();
    await expect(component.locator(".sparql-no-results")).toHaveText("no results found");
  });

  test("should render table view for SELECT results", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockSolutionMappings}
        queryString={selectQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-table-view")).toBeVisible();
    await expect(component.locator(".sparql-results-table")).toBeVisible();
  });

  test("should show only view mode info for SELECT results (no mode selector)", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockSolutionMappings}
        queryString={selectQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-view-mode-info")).toHaveText("table view");
    await expect(component.locator(".sparql-view-mode-selector")).not.toBeVisible();
  });

  test("should render list view for CONSTRUCT results without relationships", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockTriples}
        queryString={constructQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-list-view")).toBeVisible();
  });

  test("should render graph view by default for CONSTRUCT results with relationships", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockTriplesWithRelationships}
        queryString={constructQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-graph-view")).toBeVisible();
  });

  test("should show view mode selector for CONSTRUCT results", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockTriplesWithRelationships}
        queryString={constructQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-view-mode-selector")).toBeVisible();
    await expect(component.locator(".sparql-view-mode-button")).toHaveCount(2);
  });

  test("should switch between list and graph views for CONSTRUCT results", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockTriplesWithRelationships}
        queryString={constructQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-graph-view")).toBeVisible();

    const listButton = component.locator(".sparql-view-mode-button").filter({ hasText: "list" });
    await listButton.click();

    await expect(component.locator(".sparql-list-view")).toBeVisible();
    await expect(component.locator(".sparql-graph-view")).not.toBeVisible();
  });

  test("should show export button", async ({ mount }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockSolutionMappings}
        queryString={selectQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-export-button")).toBeVisible();
    await expect(component.locator(".sparql-export-button")).toHaveText("⬇ export");
  });

  test("should persist view mode preference in localStorage for CONSTRUCT results", async ({ mount, page }) => {
    const component = await mount(
      <SPARQLResultViewer
        results={mockTriplesWithRelationships}
        queryString={constructQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    const listButton = component.locator(".sparql-view-mode-button").filter({ hasText: "list" });
    await listButton.click();

    const storedMode = await page.evaluate(() => {
      return localStorage.getItem("exocortex-sparql-view-mode");
    });

    expect(storedMode).toBe("list");
  });

  test("should restore view mode from localStorage on mount", async ({ mount, page }) => {
    await page.evaluate(() => {
      localStorage.setItem("exocortex-sparql-view-mode", "list");
    });

    const component = await mount(
      <SPARQLResultViewer
        results={mockTriplesWithRelationships}
        queryString={constructQuery}
        app={mockApp}
        onAssetClick={() => {}}
      />
    );

    await expect(component.locator(".sparql-list-view")).toBeVisible();
    await expect(component.locator(".sparql-graph-view")).not.toBeVisible();
  });

  test("should handle onAssetClick callback", async ({ mount }) => {
    let clickedPath = "";
    const handleAssetClick = (path: string) => {
      clickedPath = path;
    };

    const component = await mount(
      <SPARQLResultViewer
        results={mockSolutionMappings}
        queryString={selectQuery}
        app={mockApp}
        onAssetClick={handleAssetClick}
      />
    );

    const link = component.locator(".internal-link").first();
    await link.click();

    expect(clickedPath).toBe("Task 1");
  });
});
