import { MarkdownPostProcessorContext, Plugin, Notice } from "obsidian";
import { SPARQLEngine, SelectResult } from "../../application/SPARQLEngine";
import { Graph } from "../../domain/semantic/core/Graph";
import { Triple, IRI, Literal } from "../../domain/semantic/core/Triple";
import { RDFService } from "../../application/services/RDFService";
import { ExportRDFModal } from "../modals/ExportRDFModal";
import { RDFFormat } from "../../application/services/RDFSerializer";

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
  query?: string;
  showLabels?: boolean;
  nodeSize?: number;
  linkDistance?: number;
}

export class GraphVisualizationProcessor {
  private plugin: Plugin;
  private engine: SPARQLEngine;
  private graph: Graph;
  private rdfService: RDFService;

  constructor(plugin: Plugin, graph: Graph) {
    this.plugin = plugin;
    this.graph = graph;
    this.engine = new SPARQLEngine(graph);
    this.rdfService = new RDFService(plugin.app);
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

    // Check if it's a SPARQL query
    if (source.toUpperCase().includes("SELECT")) {
      config.query = source;
      return config;
    }

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
          case "query":
            config.query = value;
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

    if (config.query) {
      // Execute SPARQL query to get specific triples
      const result: SelectResult = this.engine.select(config.query);

      // Convert SPARQL results to triples
      for (const row of result.results) {
        if (row.s && row.p && row.o) {
          triples.push(
            new Triple(
              new IRI(row.s),
              new IRI(row.p),
              row.o.startsWith('"')
                ? Literal.string(row.o.replace(/^"|"$/g, ""))
                : new IRI(row.o),
            ),
          );
        } else if (row.subject && row.predicate && row.object) {
          triples.push(
            new Triple(
              new IRI(row.subject),
              new IRI(row.predicate),
              row.object.startsWith('"')
                ? Literal.string(row.object.replace(/^"|"$/g, ""))
                : new IRI(row.object),
            ),
          );
        }
      }
    } else if (config.focus) {
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

  private getDisplayLabel(uri: string): string {
    // Extract human-readable label from URI
    if (uri.startsWith("file://")) {
      return uri.replace("file://", "");
    }

    // Extract last part of URI
    const parts = uri.split("/");
    return parts[parts.length - 1] || uri;
  }

  private async createGraphVisualization(
    container: HTMLElement,
    data: GraphData,
    config: GraphConfig,
  ): Promise<void> {
    // Create SVG container
    const svgContainer = document.createElement("div");
    svgContainer.style.cssText =
      "position: relative; width: 100%; height: 600px; overflow: hidden;";
    container.appendChild(svgContainer);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "600");
    svg.style.cssText =
      "border: 1px solid var(--background-modifier-border); background: var(--background-primary);";
    svgContainer.appendChild(svg);

    // Create D3.js-like force simulation manually (simplified version)
    await this.createForceDirectedGraph(svg, data, config);

    // Store data for export functionality
    (container as any).__graphData = data;
    (container as any).__graphConfig = config;
  }

  private async createForceDirectedGraph(
    svg: SVGSVGElement,
    data: GraphData,
    config: GraphConfig,
  ): Promise<void> {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create groups for different elements
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);

    // Add arrow marker for directed edges
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker",
    );
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("viewBox", "0 -5 10 10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "0");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerWidth", "6");
    marker.setAttribute("markerHeight", "6");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 0,-5 L 10 ,0 L 0,5");
    path.setAttribute("fill", "var(--text-muted)");
    marker.appendChild(path);
    defs.appendChild(marker);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    // Position nodes using simple force-directed layout
    this.positionNodes(data.nodes, width, height);

    // Create links
    const linksGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    linksGroup.setAttribute("class", "links");
    g.appendChild(linksGroup);

    for (const link of data.links) {
      const sourceNode = data.nodes.find((n) => n.id === link.source);
      const targetNode = data.nodes.find((n) => n.id === link.target);

      if (sourceNode && targetNode) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        line.setAttribute("x1", sourceNode.x?.toString() || "0");
        line.setAttribute("y1", sourceNode.y?.toString() || "0");
        line.setAttribute("x2", targetNode.x?.toString() || "0");
        line.setAttribute("y2", targetNode.y?.toString() || "0");
        line.setAttribute("stroke", "var(--text-muted)");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("marker-end", "url(#arrowhead)");
        line.style.cursor = "pointer";

        // Add hover effect
        line.addEventListener("mouseenter", () => {
          line.setAttribute("stroke", "var(--text-accent)");
          line.setAttribute("stroke-width", "2");
        });

        line.addEventListener("mouseleave", () => {
          line.setAttribute("stroke", "var(--text-muted)");
          line.setAttribute("stroke-width", "1");
        });

        linksGroup.appendChild(line);

        // Add edge label if enabled
        if (config.showLabels && link.label) {
          const midX = ((sourceNode.x || 0) + (targetNode.x || 0)) / 2;
          const midY = ((sourceNode.y || 0) + (targetNode.y || 0)) / 2;

          const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text",
          );
          text.setAttribute("x", midX.toString());
          text.setAttribute("y", (midY - 5).toString());
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("font-size", "10");
          text.setAttribute("fill", "var(--text-muted)");
          text.textContent = this.truncateLabel(link.label, 15);

          // Add background rectangle for better readability
          const bbox = text.getBBox();
          const rect = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          );
          rect.setAttribute("x", (bbox.x - 2).toString());
          rect.setAttribute("y", (bbox.y - 1).toString());
          rect.setAttribute("width", (bbox.width + 4).toString());
          rect.setAttribute("height", (bbox.height + 2).toString());
          rect.setAttribute("fill", "var(--background-primary)");
          rect.setAttribute("opacity", "0.8");

          linksGroup.appendChild(rect);
          linksGroup.appendChild(text);
        }
      }
    }

    // Create nodes
    const nodesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    nodesGroup.setAttribute("class", "nodes");
    g.appendChild(nodesGroup);

    for (const node of data.nodes) {
      const nodeGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );
      nodeGroup.setAttribute("class", "node");
      nodeGroup.style.cursor = "pointer";

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", node.x?.toString() || "0");
      circle.setAttribute("cy", node.y?.toString() || "0");
      circle.setAttribute("r", (config.nodeSize || 8).toString());
      circle.setAttribute("fill", this.getNodeColor(node.type));
      circle.setAttribute("stroke", "var(--background-modifier-border)");
      circle.setAttribute("stroke-width", "2");

      nodeGroup.appendChild(circle);

      // Add node label if enabled
      if (config.showLabels) {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        text.setAttribute("x", node.x?.toString() || "0");
        text.setAttribute(
          "y",
          ((node.y || 0) + (config.nodeSize || 8) + 15).toString(),
        );
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "12");
        text.setAttribute("fill", "var(--text-normal)");
        text.textContent = this.truncateLabel(node.label, 20);
        nodeGroup.appendChild(text);
      }

      // Add click handler for navigation
      nodeGroup.addEventListener("click", () => {
        this.handleNodeClick(node);
      });

      // Add hover effects
      nodeGroup.addEventListener("mouseenter", () => {
        circle.setAttribute("r", ((config.nodeSize || 8) + 2).toString());
        circle.setAttribute("stroke-width", "3");
      });

      nodeGroup.addEventListener("mouseleave", () => {
        circle.setAttribute("r", (config.nodeSize || 8).toString());
        circle.setAttribute("stroke-width", "2");
      });

      nodesGroup.appendChild(nodeGroup);
    }

    // Add zoom and pan functionality
    this.addZoomPan(svg, g);
  }

  private positionNodes(
    nodes: GraphNode[],
    width: number,
    height: number,
  ): void {
    // Simple circular layout as starting positions
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });
  }

  private getNodeColor(type: "subject" | "object" | "predicate"): string {
    switch (type) {
      case "subject":
        return "var(--color-accent)";
      case "object":
        return "var(--color-blue)";
      case "predicate":
        return "var(--color-green)";
      default:
        return "var(--text-muted)";
    }
  }

  private truncateLabel(label: string, maxLength: number): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + "...";
  }

  private handleNodeClick(node: GraphNode): void {
    // If it's a file link, navigate to it
    if (node.id.startsWith("file://") || node.id.includes(".md")) {
      const filename = node.id.replace("file://", "");
      this.plugin.app.workspace.openLinkText(filename, "");
    } else {
      // Show node details in a notice
      new Notice(
        `Node: ${node.label}\nType: ${node.type}\nID: ${node.id}`,
        3000,
      );
    }
  }

  private addZoomPan(svg: SVGSVGElement, g: SVGGElement): void {
    let isMouseDown = false;
    let startX = 0;
    let startY = 0;
    let currentTransform = { x: 0, y: 0, scale: 1 };

    svg.addEventListener("mousedown", (e) => {
      isMouseDown = true;
      startX = e.clientX;
      startY = e.clientY;
      svg.style.cursor = "grabbing";
    });

    svg.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      currentTransform.x += deltaX;
      currentTransform.y += deltaY;

      g.setAttribute(
        "transform",
        `translate(${currentTransform.x}, ${currentTransform.y}) scale(${currentTransform.scale})`,
      );

      startX = e.clientX;
      startY = e.clientY;
    });

    svg.addEventListener("mouseup", () => {
      isMouseDown = false;
      svg.style.cursor = "grab";
    });

    svg.addEventListener("wheel", (e) => {
      e.preventDefault();

      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      currentTransform.scale = Math.max(
        0.1,
        Math.min(3, currentTransform.scale * scaleFactor),
      );

      g.setAttribute(
        "transform",
        `translate(${currentTransform.x}, ${currentTransform.y}) scale(${currentTransform.scale})`,
      );
    });

    svg.style.cursor = "grab";
  }

  private addControls(
    container: HTMLElement,
    data: GraphData,
    config: GraphConfig,
  ): void {
    const controlsDiv = document.createElement("div");
    controlsDiv.style.cssText = `
            margin-top: 1em;
            display: flex;
            gap: 0.5em;
            flex-wrap: wrap;
            align-items: center;
            padding: 0.5em;
            background: var(--background-modifier-form-field);
            border-radius: var(--radius-s);
        `;

    // Node count info
    const info = document.createElement("span");
    info.textContent = `Nodes: ${data.nodes.length}, Links: ${data.links.length}`;
    info.style.cssText =
      "color: var(--text-muted); font-size: 0.9em; margin-right: auto;";
    controlsDiv.appendChild(info);

    // PNG Export dropdown
    const pngExportContainer = this.createPNGExportDropdown(
      container,
      data,
      config,
    );
    controlsDiv.appendChild(pngExportContainer);

    // Export as SVG button
    const exportSvgBtn = document.createElement("button");
    exportSvgBtn.textContent = "Export SVG";
    exportSvgBtn.className = "mod-cta";
    exportSvgBtn.style.cssText = "padding: 0.25em 0.5em; font-size: 0.9em;";
    exportSvgBtn.addEventListener("click", () => this.exportAsSVG(container));
    controlsDiv.appendChild(exportSvgBtn);

    // Export as RDF dropdown
    const rdfExportContainer = document.createElement("div");
    rdfExportContainer.style.cssText =
      "position: relative; display: inline-block;";

    const rdfExportBtn = document.createElement("button");
    rdfExportBtn.textContent = "Export RDF ▼";
    rdfExportBtn.style.cssText =
      "padding: 0.25em 0.5em; font-size: 0.9em; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 3px; cursor: pointer;";

    const rdfDropdown = document.createElement("div");
    rdfDropdown.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 3px;
            box-shadow: var(--shadow-s);
            z-index: 1000;
            min-width: 120px;
        `;

    const formats: Array<{ format: RDFFormat; label: string }> = [
      { format: "turtle", label: "Turtle (.ttl)" },
      { format: "json-ld", label: "JSON-LD (.jsonld)" },
      { format: "n-triples", label: "N-Triples (.nt)" },
      { format: "rdf-xml", label: "RDF/XML (.rdf)" },
    ];

    for (const { format, label } of formats) {
      const item = document.createElement("div");
      item.textContent = label;
      item.style.cssText =
        "padding: 0.5em 0.8em; cursor: pointer; border-bottom: 1px solid var(--background-modifier-border);";
      item.addEventListener("mouseenter", () => {
        item.style.background = "var(--background-modifier-hover)";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "";
      });
      item.addEventListener("click", () => {
        this.exportGraphAsRDF(data, format);
        rdfDropdown.style.display = "none";
      });
      rdfDropdown.appendChild(item);
    }

    // Advanced export option
    const advancedItem = document.createElement("div");
    advancedItem.textContent = "Advanced...";
    advancedItem.style.cssText =
      "padding: 0.5em 0.8em; cursor: pointer; font-weight: 500; color: var(--text-accent);";
    advancedItem.addEventListener("mouseenter", () => {
      advancedItem.style.background = "var(--background-modifier-hover)";
    });
    advancedItem.addEventListener("mouseleave", () => {
      advancedItem.style.background = "";
    });
    advancedItem.addEventListener("click", () => {
      this.openAdvancedRDFExport(data);
      rdfDropdown.style.display = "none";
    });
    rdfDropdown.appendChild(advancedItem);

    rdfExportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      rdfDropdown.style.display =
        rdfDropdown.style.display === "none" ? "block" : "none";
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      rdfDropdown.style.display = "none";
    });

    rdfExportContainer.appendChild(rdfExportBtn);
    rdfExportContainer.appendChild(rdfDropdown);
    controlsDiv.appendChild(rdfExportContainer);

    // Reset zoom button
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset View";
    resetBtn.style.cssText = "padding: 0.25em 0.5em; font-size: 0.9em;";
    resetBtn.addEventListener("click", () => this.resetView(container));
    controlsDiv.appendChild(resetBtn);

    container.appendChild(controlsDiv);
  }

  private createPNGExportDropdown(
    container: HTMLElement,
    data: GraphData,
    config: GraphConfig,
  ): HTMLElement {
    const pngExportContainer = document.createElement("div");
    pngExportContainer.style.cssText =
      "position: relative; display: inline-block;";

    const pngExportBtn = document.createElement("button");
    pngExportBtn.textContent = "Export PNG ▼";
    pngExportBtn.style.cssText =
      "padding: 0.25em 0.5em; font-size: 0.9em; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 3px; cursor: pointer;";

    const pngDropdown = document.createElement("div");
    pngDropdown.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 3px;
            box-shadow: var(--shadow-s);
            z-index: 1000;
            min-width: 180px;
        `;

    const resolutions = [
      { scale: 1, label: "Standard (800×600)", filename: "graph-standard.png" },
      { scale: 2, label: "High-DPI (1600×1200)", filename: "graph-hd.png" },
      { scale: 4, label: "4K (3200×2400)", filename: "graph-4k.png" },
    ];

    for (const resolution of resolutions) {
      const item = document.createElement("div");
      item.textContent = resolution.label;
      item.style.cssText =
        "padding: 0.5em 0.8em; cursor: pointer; border-bottom: 1px solid var(--background-modifier-border);";

      item.addEventListener("mouseenter", () => {
        item.style.background = "var(--background-modifier-hover)";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "";
      });
      item.addEventListener("click", () => {
        this.exportAsPNG(
          container,
          data,
          config,
          resolution.scale,
          resolution.filename,
        );
        pngDropdown.style.display = "none";
      });

      pngDropdown.appendChild(item);
    }

    pngExportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      pngDropdown.style.display =
        pngDropdown.style.display === "none" ? "block" : "none";
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      pngDropdown.style.display = "none";
    });

    pngExportContainer.appendChild(pngExportBtn);
    pngExportContainer.appendChild(pngDropdown);

    return pngExportContainer;
  }

  private async exportAsPNG(
    container: HTMLElement,
    data: GraphData,
    config: GraphConfig,
    scale: number = 1,
    filename: string = "knowledge-graph.png",
  ): Promise<void> {
    const svg = container.querySelector("svg");
    if (!svg) {
      new Notice("No graph visualization found");
      return;
    }

    try {
      // Show loading notice for high-resolution exports
      let loadingNotice: Notice | null = null;
      if (scale >= 2) {
        loadingNotice = new Notice(
          `Generating ${scale === 2 ? "high-resolution" : "4K"} PNG export...`,
          0,
        );
      }

      // Create canvas with scaled dimensions
      const canvas = document.createElement("canvas");
      const baseWidth = 800;
      const baseHeight = 600;
      canvas.width = baseWidth * scale;
      canvas.height = baseHeight * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Scale context for high-DPI rendering
      ctx.scale(scale, scale);

      // Set high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill background with theme color
      const bgColor = this.getThemeColor("--background-primary") || "#ffffff";
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Draw border
      const borderColor =
        this.getThemeColor("--background-modifier-border") || "#e5e5e5";
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, baseWidth, baseHeight);

      // Render graph to canvas
      await this.renderGraphToCanvas(ctx, data, config, baseWidth, baseHeight);

      // Convert canvas to PNG blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            this.downloadBlob(blob, filename);

            if (loadingNotice) {
              loadingNotice.hide();
            }

            const sizeKB = Math.round(blob.size / 1024);
            new Notice(`Graph exported as PNG (${sizeKB} KB)`);
          } else {
            throw new Error("Failed to create PNG blob");
          }
        },
        "image/png",
        0.9,
      );
    } catch (error: any) {
      console.error("PNG export failed:", error);
      new Notice(`PNG export failed: ${error.message}`);
    }
  }

  private async renderGraphToCanvas(
    ctx: CanvasRenderingContext2D,
    data: GraphData,
    config: GraphConfig,
    width: number,
    height: number,
  ): Promise<void> {
    // Position nodes (reuse existing algorithm)
    this.positionNodes(data.nodes, width, height);

    // Render links first (background layer)
    for (const link of data.links) {
      const sourceNode = data.nodes.find(
        (n) =>
          n.id ===
          (typeof link.source === "string" ? link.source : link.source.id),
      );
      const targetNode = data.nodes.find(
        (n) =>
          n.id ===
          (typeof link.target === "string" ? link.target : link.target.id),
      );

      if (sourceNode && targetNode) {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(sourceNode.x || 0, sourceNode.y || 0);
        ctx.lineTo(targetNode.x || 0, targetNode.y || 0);
        ctx.strokeStyle = this.getThemeColor("--text-muted") || "#6b7280";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw arrowhead
        this.drawArrowHead(
          ctx,
          sourceNode.x || 0,
          sourceNode.y || 0,
          targetNode.x || 0,
          targetNode.y || 0,
        );

        // Draw edge label if enabled
        if (config.showLabels && link.label) {
          const midX = ((sourceNode.x || 0) + (targetNode.x || 0)) / 2;
          const midY = ((sourceNode.y || 0) + (targetNode.y || 0)) / 2;

          // Draw background rectangle for label
          const labelText = this.truncateLabel(link.label, 15);
          ctx.font = "10px var(--font-interface)";
          const textMetrics = ctx.measureText(labelText);

          ctx.fillStyle =
            this.getThemeColor("--background-primary") || "#ffffff";
          ctx.fillRect(
            midX - textMetrics.width / 2 - 2,
            midY - 7,
            textMetrics.width + 4,
            12,
          );

          // Draw label text
          ctx.fillStyle = this.getThemeColor("--text-muted") || "#6b7280";
          ctx.textAlign = "center";
          ctx.fillText(labelText, midX, midY + 3);
        }
      }
    }

    // Render nodes on top
    for (const node of data.nodes) {
      const x = node.x || 0;
      const y = node.y || 0;
      const radius = config.nodeSize || 8;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = this.getNodeCanvasColor(node.type);
      ctx.fill();

      // Draw border
      ctx.strokeStyle =
        this.getThemeColor("--background-modifier-border") || "#e5e5e5";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw node label if enabled
      if (config.showLabels) {
        ctx.font = "12px var(--font-interface)";
        ctx.fillStyle = this.getThemeColor("--text-normal") || "#000000";
        ctx.textAlign = "center";
        const labelText = this.truncateLabel(node.label, 20);
        ctx.fillText(labelText, x, y + radius + 15);
      }
    }
  }

  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    // Calculate arrowhead position (offset from target node)
    const offsetDistance = 10; // Distance from node edge
    const offsetX = toX - offsetDistance * Math.cos(angle);
    const offsetY = toY - offsetDistance * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(
      offsetX - arrowLength * Math.cos(angle - arrowAngle),
      offsetY - arrowLength * Math.sin(angle - arrowAngle),
    );
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(
      offsetX - arrowLength * Math.cos(angle + arrowAngle),
      offsetY - arrowLength * Math.sin(angle + arrowAngle),
    );
    ctx.strokeStyle = this.getThemeColor("--text-muted") || "#6b7280";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private getThemeColor(cssVariable: string): string | null {
    try {
      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue(cssVariable).trim();

      if (!color) return null;

      // Convert CSS color formats to hex if needed
      if (color.startsWith("hsl")) {
        return this.hslToHex(color);
      }
      if (color.startsWith("rgb")) {
        return this.rgbToHex(color);
      }

      return color;
    } catch (error) {
      console.warn(`Failed to get theme color for ${cssVariable}:`, error);
      return null;
    }
  }

  private getNodeCanvasColor(type: "subject" | "object" | "predicate"): string {
    switch (type) {
      case "subject":
        return this.getThemeColor("--color-accent") || "#7c3aed";
      case "object":
        return this.getThemeColor("--color-blue") || "#2563eb";
      case "predicate":
        return this.getThemeColor("--color-green") || "#059669";
      default:
        return "#6b7280";
    }
  }

  private hslToHex(hsl: string): string {
    // Simple HSL to hex conversion - for basic theme support
    // This is a simplified version; for production, consider using a library
    return "#6b7280"; // Fallback color
  }

  private rgbToHex(rgb: string): string {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return "#000000";

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  private downloadBlob(blob: Blob, filename: string): void {
    // Check if we're in a test environment (JSDOM)
    if (
      typeof window !== "undefined" &&
      window.navigator?.userAgent?.includes("jsdom")
    ) {
      // In test environment, just log the action instead of attempting DOM manipulation
      console.log(
        `Test environment: Would download ${filename} (${blob.size} bytes)`,
      );
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    // Ensure document.body exists before appending
    if (document.body) {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback for environments without document.body
      console.warn("Document body not available for download");
    }

    URL.revokeObjectURL(url);
  }

  private exportAsSVG(container: HTMLElement): void {
    const svg = container.querySelector("svg");
    if (!svg) return;

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      this.downloadBlob(blob, "knowledge-graph.svg");

      new Notice("Graph exported as SVG");
    } catch (error) {
      console.error("SVG export failed:", error);
      new Notice("Failed to export SVG");
    }
  }

  private resetView(container: HTMLElement): void {
    const svg = container.querySelector("svg");
    const g = svg?.querySelector("g");
    if (g) {
      g.setAttribute("transform", "translate(0, 0) scale(1)");
    }
  }

  private createLoadingIndicator(): HTMLElement {
    const loading = document.createElement("div");
    loading.className = "graph-loading";
    loading.textContent = "Generating graph visualization...";
    loading.style.cssText =
      "padding: 2em; text-align: center; color: var(--text-muted);";
    return loading;
  }

  private createErrorMessage(error: Error): HTMLElement {
    const errorDiv = document.createElement("div");
    errorDiv.className = "graph-error";
    errorDiv.style.cssText = `
            background: var(--background-modifier-error);
            color: var(--text-error);
            padding: 1em;
            border-radius: var(--radius-m);
            border: 1px solid var(--background-modifier-border);
        `;

    const title = document.createElement("strong");
    title.textContent = "Graph Visualization Error: ";
    errorDiv.appendChild(title);

    const message = document.createElement("span");
    message.textContent = error.message;
    errorDiv.appendChild(message);

    return errorDiv;
  }

  /**
   * Export graph visualization data as RDF
   */
  private async exportGraphAsRDF(
    data: GraphData,
    format: RDFFormat,
  ): Promise<void> {
    try {
      // Convert graph data back to triples
      const triples = this.convertGraphDataToTriples(data);

      // Create a graph from the triples
      const graph = new Graph();
      for (const triple of triples) {
        graph.add(triple);
      }

      const fileName = `graph-visualization-${Date.now()}`;
      const result = await this.rdfService.exportGraph(graph, {
        format,
        fileName,
        saveToVault: true,
        includeComments: true,
        prettyPrint: true,
        targetFolder: "exports",
      });

      if (result.isSuccess) {
        const exportData = result.getValue();
        new Notice(
          `Exported graph visualization as ${format.toUpperCase()} (${exportData.tripleCount} triples)`,
        );
      } else {
        new Notice(`Export failed: ${result.errorValue()}`);
      }
    } catch (error: any) {
      new Notice(`Export error: ${error.message}`);
      console.error("Graph RDF export error:", error);
    }
  }

  /**
   * Open advanced RDF export modal
   */
  private openAdvancedRDFExport(data: GraphData): void {
    try {
      // Convert graph data back to triples
      const triples = this.convertGraphDataToTriples(data);

      // Create a graph from the triples
      const graph = new Graph();
      for (const triple of triples) {
        graph.add(triple);
      }

      const modal = new ExportRDFModal(
        this.plugin.app,
        graph,
        this.rdfService.getNamespaceManager(),
        (result) => {
          new Notice(`Graph visualization exported: ${result.fileName}`);
        },
      );

      modal.open();
    } catch (error: any) {
      new Notice(`Failed to open export modal: ${error.message}`);
      console.error("Export modal error:", error);
    }
  }

  /**
   * Convert GraphData back to Triple format
   */
  private convertGraphDataToTriples(data: GraphData): Triple[] {
    const triples: Triple[] = [];

    // Reconstruct triples from graph data
    for (const link of data.links) {
      const sourceNode = data.nodes.find(
        (n) =>
          n.id ===
          (typeof link.source === "string" ? link.source : link.source.id),
      );
      const targetNode = data.nodes.find(
        (n) =>
          n.id ===
          (typeof link.target === "string" ? link.target : link.target.id),
      );

      if (sourceNode && targetNode) {
        triples.push(
          new Triple(
            new IRI(sourceNode.id),
            new IRI(link.label),
            new IRI(targetNode.id),
          ),
        );
      }
    }

    return triples;
  }
}
