import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { SPARQLErrorView, type SPARQLError } from "../../../src/presentation/components/sparql/SPARQLErrorView";

test.describe("SPARQLErrorView", () => {
  test("should render parser error with line and column", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Expected WHERE clause",
      line: 3,
      column: 15,
      queryString: "SELECT ?task\nWHERE {\n  ?task <status> ?status\n}",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(component.getByText(/syntax error/i)).toBeVisible();
    await expect(component.getByText(/Expected WHERE clause/)).toBeVisible();
    await expect(component.getByText(/at line 3, column 15/)).toBeVisible();
  });

  test("should render execution error without line/column", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Triple store not initialized",
      queryString: "SELECT ?task WHERE { ?task <status> ?status }",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(component.getByText(/query execution error/i)).toBeVisible();
    await expect(component.getByText(/Triple store not initialized/)).toBeVisible();
    await expect(component.getByText(/at line/)).not.toBeVisible();
  });

  test("should highlight error position in query string", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Unexpected token",
      line: 1,
      column: 8,
      queryString: "SELECT ?",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    const highlightedChar = component.locator(".sparql-error-highlight");
    await expect(highlightedChar).toBeVisible();
    await expect(highlightedChar).toHaveText("?");
  });

  test("should display error hint for parser errors", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Syntax error",
      line: 2,
      column: 10,
      queryString: "SELECT ?task\nWHERE { }",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(
      component.getByText(/check your SPARQL syntax/i)
    ).toBeVisible();
  });

  test("should display error hint for execution errors", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Query execution failed",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(
      component.getByText(/verify your query logic/i)
    ).toBeVisible();
  });

  test("should render without query string", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Unknown error occurred",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(component.getByText(/Unknown error occurred/)).toBeVisible();
    const codeBlock = component.locator(".sparql-error-code");
    await expect(codeBlock).not.toBeVisible();
  });

  test("should render error icon", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Test error",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    const icon = component.locator(".sparql-error-icon");
    await expect(icon).toBeVisible();
    await expect(icon).toHaveText("⚠️");
  });

  test("should handle multiline query with error on second line", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Invalid property",
      line: 2,
      column: 3,
      queryString: "SELECT ?task ?status\nWHERE {\n  ?task <invalid> ?status\n}",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(component.getByText(/at line 2, column 3/)).toBeVisible();
    const highlightedChar = component.locator(".sparql-error-highlight");
    await expect(highlightedChar).toBeVisible();
  });

  test("should handle error at end of query", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Unexpected end of input",
      line: 1,
      column: 13,
      queryString: "SELECT ?task",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(component.getByText(/at line 1, column 13/)).toBeVisible();
    const codeBlock = component.locator(".sparql-error-query");
    await expect(codeBlock).toBeVisible();
  });

  test("should handle invalid line number gracefully", async ({ mount }) => {
    const error: SPARQLError = {
      message: "Test error",
      line: 999,
      column: 1,
      queryString: "SELECT ?task",
    };

    const component = await mount(<SPARQLErrorView error={error} />);

    await expect(component.getByText(/at line 999, column 1/)).toBeVisible();
  });
});
