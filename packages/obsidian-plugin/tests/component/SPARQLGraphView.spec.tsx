import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { SPARQLGraphView } from "../../src/presentation/components/sparql/SPARQLGraphView";

test.describe.skip("SPARQLGraphView", () => {
  const mockTriples: any[] = [
    {
      subject: {
        toString: () => "<https://example.org/note1>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/relatesTo>",
      },
      object: {
        toString: () => "<https://example.org/note2>",
        constructor: { name: "IRI" },
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/note2>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<https://example.org/predicate/links>",
      },
      object: {
        toString: () => "<https://example.org/note3>",
        constructor: { name: "IRI" },
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/note1>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<http://www.w3.org/2000/01/rdf-schema#label>",
      },
      object: {
        toString: () => '"Note 1"',
        constructor: { name: "Literal" },
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/note2>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<http://www.w3.org/2000/01/rdf-schema#label>",
      },
      object: {
        toString: () => '"Note 2"',
        constructor: { name: "Literal" },
      },
    },
    {
      subject: {
        toString: () => "<https://example.org/note3>",
        constructor: { name: "IRI" },
      },
      predicate: {
        toString: () => "<http://www.w3.org/2000/01/rdf-schema#label>",
      },
      object: {
        toString: () => '"Note 3"',
        constructor: { name: "Literal" },
      },
    },
  ];

  test("should render SVG container when triples provided", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    await expect(component.locator(".sparql-graph-view")).toBeVisible();
    await expect(component.locator("svg")).toBeVisible();
  });

  test("should render graph nodes", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    const nodes = component.locator(".sparql-graph-node");
    await expect(nodes).toHaveCount(3);
  });

  test("should render graph edges", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    const edges = component.locator(".sparql-graph-link");
    await expect(edges).toHaveCount(2);
  });

  test("should render node labels", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    const labels = component.locator(".sparql-graph-node-label");
    await expect(labels).toHaveCount(3);

    await expect(labels.nth(0)).toContainText("Note");
    await expect(labels.nth(1)).toContainText("Note");
    await expect(labels.nth(2)).toContainText("Note");
  });

  test("should render edge labels", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    const edgeLabels = component.locator(".sparql-graph-link-label");
    await expect(edgeLabels).toHaveCount(2);
  });

  test("should call onAssetClick when node is clicked", async ({ mount }) => {
    let clickedPath = "";
    const onAssetClick = (path: string) => {
      clickedPath = path;
    };
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    const nodes = component.locator(".sparql-graph-node");
    await nodes.first().click();

    expect(clickedPath).toContain("example.org/note");
  });

  test("should handle empty triples array", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={[]} onAssetClick={onAssetClick} />);

    await expect(component.locator(".sparql-graph-view")).toBeVisible();

    const nodes = component.locator(".sparql-graph-node");
    await expect(nodes).toHaveCount(0);

    const edges = component.locator(".sparql-graph-link");
    await expect(edges).toHaveCount(0);
  });

  test("should apply hover effects to nodes", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    const node = component.locator(".sparql-graph-node").first();
    await node.hover();

    await expect(node).toHaveCSS("cursor", "pointer");
  });

  test("should support zoom and pan on SVG", async ({ mount }) => {
    const onAssetClick = () => {};
    const component = await mount(<SPARQLGraphView triples={mockTriples} onAssetClick={onAssetClick} />);

    const svg = component.locator("svg");
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute("viewBox");
  });
});
