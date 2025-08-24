import { MarkdownPostProcessorContext, Plugin, Notice } from "obsidian";
import { Graph } from "../../domain/semantic/core/Graph";
import { Triple, IRI, Literal } from "../../domain/semantic/core/Triple";
import { RDFService } from "../../application/services/RDFService";
import { ExportRDFModal } from "../modals/ExportRDFModal";
import { RDFFormat } from "../../application/services/RDFSerializer";
import { DIContainer } from "../../infrastructure/container/DIContainer";

interface GraphNode {
  id: string;
  label: string;
  type: "subject" | "object" | "predicate";
  group: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  id: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphConfig {
  focus?: string;
  depth?: number;
  limit?: number;
  showLabels?: boolean;
  nodeSize?: number;
  linkDistance?: number;
}

export class GraphVisualizationProcessor {
  private plugin: Plugin;
  private graph: Graph;
  private rdfService: RDFService;

  constructor(plugin: Plugin, graph: Graph) {
    this.plugin = plugin;
    this.graph = graph;
    // Get RDFService from DI container
    const container = DIContainer.getInstance();
    this.rdfService = container.resolve<RDFService>("RDFService");
  }

  /**
   * Main processor method called by Obsidian
   */
  async processCodeBlock(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): Promise<void> {
    el.empty();

    // Create main container
    const container = document.createElement("div");
    container.className = "exocortex-graph-container";
    container.style.cssText = `
            border: 1px solid var(--background-modifier-border);
            padding: 1em;
            margin: 1em 0;
            border-radius: var(--radius-m);
            background: var(--background-secondary);
            position: relative;
        `;
    el.appendChild(container);

    try {
      // Parse configuration
      const config = this.parseConfig(source.trim());

      // Show loading indicator
      const loadingEl = this.createLoadingIndicator();
      container.appendChild(loadingEl);

      // Get graph data
      const graphData = await this.getGraphData(config);

      // Remove loading indicator
      loadingEl.remove();

      if (graphData.nodes.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.textContent = "No graph data found";
        emptyMessage.style.cssText =
          "padding: 2em; text-align: center; color: var(--text-muted);";
        container.appendChild(emptyMessage);
        return;
      }

      // Create graph visualization
      await this.createGraphVisualization(container, graphData, config);

      // Add controls
      this.addControls(container, graphData, config);
    } catch (error: any) {
      container.innerHTML = "";
      const errorEl = this.createErrorMessage(error);
      container.appendChild(errorEl);
      console.error("Graph visualization error:", error);
    }
  }

  private parseConfig(source: string): GraphConfig {
    const config: GraphConfig = {
      limit: 100,
      showLabels: true,
      nodeSize: 8,
      linkDistance: 80,
      depth: 2,
    };

    const lines = source
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);

    // Parse configuration options
    for (const line of lines) {
      if (line.includes(":")) {
        const [key, value] = line.split(":").map((s) => s.trim());
        switch (key.toLowerCase()) {
          case "focus":
            config.focus = value.replace(/\[\[|\]\]/g, "");
            break;
          case "depth":
            config.depth = parseInt(value) || 2;
            break;
          case "limit":
            config.limit = parseInt(value) || 100;
            break;
          case "showlabels":
            config.showLabels = value.toLowerCase() === "true";
            break;
          case "nodesize":
            config.nodeSize = parseInt(value) || 8;
            break;
          case "linkdistance":
            config.linkDistance = parseInt(value) || 80;
            break;
        }
      }
    }

    return config;
  }

  private async getGraphData(config: GraphConfig): Promise<GraphData> {
    let triples: Triple[] = [];

    if (config.focus) {
      // Get triples centered around focus entity
      triples = this.getTriplesAroundFocus(config.focus, config.depth || 2);
    } else {
      // Get all triples (with limit)
      triples = this.graph.match(null, null, null);
    }

    // Apply limit
    if (config.limit && triples.length > config.limit) {
      triples = triples.slice(0, config.limit);
    }

    return this.convertTriplesToGraphData(triples);
  }

  private getTriplesAroundFocus(focus: string, depth: number): Triple[] {
    const visited = new Set<string>();
    const result: Triple[] = [];
    const queue: { entity: string; currentDepth: number }[] = [
      { entity: focus, currentDepth: 0 },
    ];

    while (queue.length > 0) {
      const { entity, currentDepth } = queue.shift()!;

      if (visited.has(entity) || currentDepth >= depth) {
        continue;
      }

      visited.add(entity);

      // Get triples where entity is subject
      const subjectTriples = this.graph.match(new IRI(entity), null, null);
      result.push(...subjectTriples);

      // Get triples where entity is object
      const objectTriples = this.graph.match(null, null, new IRI(entity));
      result.push(...objectTriples);

      // Add related entities to queue for next depth level
      if (currentDepth < depth - 1) {
        for (const triple of subjectTriples) {
          const objectStr = triple.getObject().toString();
          if (!visited.has(objectStr)) {
            queue.push({ entity: objectStr, currentDepth: currentDepth + 1 });
          }
        }
        for (const triple of objectTriples) {
          const subjectStr = triple.getSubject().toString();
          if (!visited.has(subjectStr)) {
            queue.push({ entity: subjectStr, currentDepth: currentDepth + 1 });
          }
        }
      }
    }

    return result;
  }

  private convertTriplesToGraphData(triples: Triple[]): GraphData {
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    for (const triple of triples) {
      const subjectStr = triple.getSubject().toString();
      const predicateStr = triple.getPredicate().toString();
      const objectStr = triple.getObject().toString();

      // Add subject node
      if (!nodesMap.has(subjectStr)) {
        nodesMap.set(subjectStr, {
          id: subjectStr,
          label: this.getDisplayLabel(subjectStr),
          type: "subject",
          group: 1,
        });
      }

      // Add object node
      if (!nodesMap.has(objectStr)) {
        nodesMap.set(objectStr, {
          id: objectStr,
          label: this.getDisplayLabel(objectStr),
          type: "object",
          group: 2,
        });
      }

      // Add link
      const linkId = `${subjectStr}-${predicateStr}-${objectStr}`;
      links.push({
        source: subjectStr,
        target: objectStr,
        label: predicateStr,
        id: linkId,
      });
    }

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }

  private getDisplayLabel(iri: string): string {
    // Remove protocol and namespace prefixes
    const cleanIri = iri.replace(/^.*[#/]/, "");
    // If it's a literal value, just return it
    if (iri.startsWith('"')) {
      return iri.replace(/^"|"$/g, "");
    }
    return cleanIri;
  }

  private createLoadingIndicator(): HTMLElement {
    const loading = document.createElement("div");
    loading.className = "exocortex-loading";
    loading.style.cssText = `
            text-align: center;
            padding: 2em;
            color: var(--text-muted);
        `;
    loading.textContent = "Loading graph data...";
    return loading;
  }

  private createErrorMessage(error: Error): HTMLElement {
    const errorDiv = document.createElement("div");
    errorDiv.className = "exocortex-error";
    errorDiv.style.cssText = `
            background: var(--background-modifier-error);
            color: var(--text-error);
            padding: 1em;
            border-radius: var(--radius-s);
        `;
    errorDiv.innerHTML = `
            <strong>Error rendering graph:</strong><br>
            ${error.message}
        `;
    return errorDiv;
  }

  private async createGraphVisualization(
    container: HTMLElement,
    data: GraphData,
    config: GraphConfig,
  ): Promise<void> {
    // Create SVG element
    const width = container.clientWidth || 800;
    const height = 400;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.style.cssText = "width: 100%; height: 400px; cursor: grab;";

    container.appendChild(svg);

    // Simple static visualization (without D3.js dependency)
    this.renderStaticGraph(svg, data, config, width, height);
  }

  private renderStaticGraph(
    svg: SVGElement,
    data: GraphData,
    config: GraphConfig,
    width: number,
    height: number,
  ): void {
    // Position nodes in a circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    data.nodes.forEach((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    // Create links
    const linksGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    linksGroup.setAttribute("class", "links");

    data.links.forEach((link) => {
      const sourceNode = data.nodes.find((n) => n.id === link.source);
      const targetNode = data.nodes.find((n) => n.id === link.target);

      if (sourceNode && targetNode) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        line.setAttribute("x1", sourceNode.x!.toString());
        line.setAttribute("y1", sourceNode.y!.toString());
        line.setAttribute("x2", targetNode.x!.toString());
        line.setAttribute("y2", targetNode.y!.toString());
        line.setAttribute("stroke", "var(--text-muted)");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("opacity", "0.6");
        linksGroup.appendChild(line);
      }
    });

    svg.appendChild(linksGroup);

    // Create nodes
    const nodesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    nodesGroup.setAttribute("class", "nodes");

    data.nodes.forEach((node) => {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", node.x!.toString());
      circle.setAttribute("cy", node.y!.toString());
      circle.setAttribute("r", (config.nodeSize || 8).toString());
      circle.setAttribute(
        "fill",
        node.type === "subject"
          ? "var(--interactive-accent)"
          : "var(--interactive-normal)",
      );
      circle.setAttribute("stroke", "var(--background-primary)");
      circle.setAttribute("stroke-width", "2");

      // Add tooltip
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title",
      );
      title.textContent = node.label;
      circle.appendChild(title);

      nodesGroup.appendChild(circle);

      // Add labels if enabled
      if (config.showLabels) {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        text.setAttribute("x", node.x!.toString());
        text.setAttribute("y", (node.y! + 20).toString());
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "var(--text-normal)");
        text.setAttribute("font-size", "12");
        text.textContent = node.label;
        nodesGroup.appendChild(text);
      }
    });

    svg.appendChild(nodesGroup);
  }

  private addControls(
    container: HTMLElement,
    data: GraphData,
    config: GraphConfig,
  ): void {
    const controls = document.createElement("div");
    controls.className = "exocortex-graph-controls";
    controls.style.cssText = `
            margin-top: 1em;
            padding-top: 1em;
            border-top: 1px solid var(--background-modifier-border);
            display: flex;
            gap: 0.5em;
            flex-wrap: wrap;
        `;

    // Export button
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export RDF";
    exportBtn.className = "mod-cta";
    exportBtn.addEventListener("click", () => {
      this.showExportModal(data);
    });
    controls.appendChild(exportBtn);

    // Stats
    const stats = document.createElement("div");
    stats.style.cssText = "margin-left: auto; color: var(--text-muted);";
    stats.textContent = `Nodes: ${data.nodes.length} | Links: ${data.links.length}`;
    controls.appendChild(stats);

    container.appendChild(controls);
  }

  private showExportModal(data: GraphData): void {
    // Convert graph data back to triples for export
    const triples: Triple[] = [];
    data.links.forEach((link) => {
      const sourceNode =
        typeof link.source === "string"
          ? link.source
          : (link.source as GraphNode).id;
      const targetNode =
        typeof link.target === "string"
          ? link.target
          : (link.target as GraphNode).id;

      triples.push(
        new Triple(
          new IRI(sourceNode),
          new IRI(link.label),
          new IRI(targetNode),
        ),
      );
    });

    // Add triples to graph and use ExportRDFModal
    triples.forEach((triple) => this.graph.addTriple(triple));
    new ExportRDFModal(this.plugin.app, this.graph).open();
  }
}
