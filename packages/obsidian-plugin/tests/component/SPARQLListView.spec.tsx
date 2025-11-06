import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { SPARQLListView } from "../../src/presentation/components/sparql/SPARQLListView";

test.describe.skip("SPARQLListView", () => {
  const mockTriples: any[] = [
    {
      subject: {
        toString: () => "<https://example.org/subject1>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/label>",
      },
      object: {
        toString: () => '"Subject 1 Label"',
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/subject1>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/type>",
      },
      object: {
        toString: () => "<https://example.org/class/Task>",
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/subject2>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/label>",
      },
      object: {
        toString: () => "[[Test Note]]",
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/subject2>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/status>",
      },
      object: {
        toString: () => '"Done"',
      },
    },
  ];

  test("should render no results message when empty", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={[]} />);
    await expect(component.locator(".sparql-no-results")).toBeVisible();
    await expect(component.locator(".sparql-no-results")).toHaveText("no results found");
  });

  test("should render view mode toggle buttons", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await expect(component.locator(".sparql-view-toggle").nth(0)).toHaveText("structured");
    await expect(component.locator(".sparql-view-toggle").nth(1)).toHaveText("raw turtle");
  });

  test("should render expand/collapse toggle in structured mode", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await expect(component.locator(".sparql-expand-toggle")).toBeVisible();
    await expect(component.locator(".sparql-expand-toggle")).toHaveText("expand all");
  });

  test("should render subject groups in structured mode", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    const subjectGroups = component.locator(".sparql-subject-group");
    await expect(subjectGroups).toHaveCount(2);
  });

  test("should render subject headers with collapse indicator", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    const firstSubjectHeader = component.locator(".sparql-subject-header").first();
    await expect(firstSubjectHeader).toBeVisible();
    await expect(firstSubjectHeader.locator(".sparql-expand-icon")).toHaveText("▶");
  });

  test("should expand subject when clicked", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    const firstSubjectHeader = component.locator(".sparql-subject-header").first();
    await firstSubjectHeader.click();

    await expect(firstSubjectHeader.locator(".sparql-expand-icon")).toHaveText("▼");
    await expect(component.locator(".sparql-predicates-list").first()).toBeVisible();
  });

  test("should render predicate-object pairs when expanded", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await component.locator(".sparql-subject-header").first().click();

    const predicateRows = component.locator(".sparql-predicate-row");
    await expect(predicateRows).toHaveCount(2);
  });

  test("should toggle all subjects when expand all clicked", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await component.locator(".sparql-expand-toggle").click();

    await expect(component.locator(".sparql-expand-toggle")).toHaveText("collapse all");

    const expandIcons = component.locator(".sparql-expand-icon");
    await expect(expandIcons.first()).toHaveText("▼");
    await expect(expandIcons.nth(1)).toHaveText("▼");
  });

  test("should switch to raw turtle mode", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await component.locator(".sparql-view-toggle").nth(1).click();

    await expect(component.locator(".sparql-list-raw")).toBeVisible();
    await expect(component.locator(".sparql-turtle-syntax")).toBeVisible();
  });

  test("should not show expand toggle in raw mode", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await component.locator(".sparql-view-toggle").nth(1).click();

    await expect(component.locator(".sparql-expand-toggle")).not.toBeVisible();
  });

  test("should render raw turtle syntax", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await component.locator(".sparql-view-toggle").nth(1).click();

    const turtleContent = await component.locator(".sparql-turtle-syntax").textContent();
    expect(turtleContent).toContain("https://example.org/subject1");
    expect(turtleContent).toContain("https://example.org/predicate/label");
  });

  test("should render wikilinks as clickable links", async ({ mount }) => {
    const onAssetClick = test.info().project.name === "chromium" ? () => {} : undefined;
    const component = await mount(
      <SPARQLListView triples={mockTriples} onAssetClick={onAssetClick} />
    );

    await component.locator(".sparql-subject-header").nth(1).click();

    const wikilink = component.locator(".internal-link");
    await expect(wikilink).toBeVisible();
    await expect(wikilink).toHaveText("Test Note");
  });

  test("should display triple count in footer", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    const infoText = await component.locator(".sparql-list-info small").textContent();
    expect(infoText).toContain("2 subjects");
    expect(infoText).toContain("4 triples");
  });

  test("should render formatted IRIs without angle brackets", async ({ mount }) => {
    const component = await mount(<SPARQLListView triples={mockTriples} />);

    await component.locator(".sparql-subject-header").first().click();

    const predicateName = component.locator(".sparql-predicate-name").first();
    const predicateText = await predicateName.textContent();

    expect(predicateText).not.toContain("<");
    expect(predicateText).not.toContain(">");
    expect(predicateText).toContain("label:");
  });
});
