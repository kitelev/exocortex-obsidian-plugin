import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { SPARQLEmptyState } from "../../../src/presentation/components/sparql/SPARQLEmptyState";

test.describe("SPARQLEmptyState", () => {
  // Skipped: First test in file has Playwright CT bundling timing issue
  test.skip("should render empty state with icon", async ({ mount }) => {
    const component = await mount(<SPARQLEmptyState />);

    await expect(component.locator(".sparql-empty-state")).toBeVisible();
    await expect(component.locator(".sparql-empty-icon")).toHaveText("📭");
  });

  test("should display no results title", async ({ mount }) => {
    const component = await mount(<SPARQLEmptyState />);

    await expect(component.locator(".sparql-empty-title")).toHaveText(
      "no results found",
    );
  });

  test("should display generic message when no query provided", async ({
    mount,
  }) => {
    const component = await mount(<SPARQLEmptyState />);

    await expect(component.locator(".sparql-empty-message")).toContainText(
      "your query query returned no matching data",
    );
  });

  test("should display SELECT query type in message", async ({ mount }) => {
    const component = await mount(
      <SPARQLEmptyState queryString="SELECT ?task WHERE { ?task a <Task> }" />,
    );

    await expect(component.locator(".sparql-empty-message")).toContainText(
      "your SELECT query returned no matching data",
    );
  });

  test("should display CONSTRUCT query type in message", async ({ mount }) => {
    const component = await mount(
      <SPARQLEmptyState queryString="CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }" />,
    );

    await expect(component.locator(".sparql-empty-message")).toContainText(
      "your CONSTRUCT query returned no matching data",
    );
  });

  test("should display ASK query type in message", async ({ mount }) => {
    const component = await mount(
      <SPARQLEmptyState queryString="ASK WHERE { ?s ?p ?o }" />,
    );

    await expect(component.locator(".sparql-empty-message")).toContainText(
      "your ASK query returned no matching data",
    );
  });

  test("should display DESCRIBE query type in message", async ({ mount }) => {
    const component = await mount(
      <SPARQLEmptyState queryString="DESCRIBE <https://example.org/resource>" />,
    );

    await expect(component.locator(".sparql-empty-message")).toContainText(
      "your DESCRIBE query returned no matching data",
    );
  });

  test("should display suggestions list", async ({ mount }) => {
    const component = await mount(<SPARQLEmptyState />);

    await expect(component.locator(".sparql-empty-hints")).toBeVisible();
    await expect(component.locator(".sparql-empty-hints h4")).toHaveText(
      "suggestions:",
    );

    const suggestions = component.locator(".sparql-empty-hints li");
    await expect(suggestions).toHaveCount(4);
  });

  test("should display example query", async ({ mount }) => {
    const component = await mount(<SPARQLEmptyState />);

    await expect(component.locator(".sparql-empty-example")).toBeVisible();
    await expect(
      component.locator(".sparql-empty-example strong"),
    ).toHaveText("example query:");

    const preContent = await component.locator(".sparql-empty-example pre").textContent();
    expect(preContent).toContain("SELECT");
    expect(preContent).toContain("WHERE");
  });

  test("should handle lowercase query types", async ({ mount }) => {
    const component = await mount(
      <SPARQLEmptyState queryString="select ?task where { ?task a <Task> }" />,
    );

    await expect(component.locator(".sparql-empty-message")).toContainText(
      "your SELECT query returned no matching data",
    );
  });

  test("should handle query with leading whitespace", async ({ mount }) => {
    const component = await mount(
      <SPARQLEmptyState queryString="   SELECT ?task WHERE { ?task a <Task> }" />,
    );

    await expect(component.locator(".sparql-empty-message")).toContainText(
      "your SELECT query returned no matching data",
    );
  });
});
