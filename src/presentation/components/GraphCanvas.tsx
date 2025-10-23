import React, { useEffect, useRef, useState, useMemo } from "react";
import { App, TFile } from "obsidian";
import * as d3 from "d3-force";
import { select } from "d3-selection";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { drag as d3Drag } from "d3-drag";
import type { D3DragEvent } from "d3-drag";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { GraphDataService } from "../../infrastructure/services/GraphDataService";
import type { GraphData } from "../../domain/models/GraphData";
import type { GraphNode } from "../../domain/models/GraphNode";
import type { GraphEdge } from "../../domain/models/GraphEdge";

interface GraphCanvasProps {
  app: App;
  plugin: ExocortexPlugin;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ app, plugin }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState<boolean>(false);

  useEffect(() => {
    const service = new GraphDataService(app, app.metadataCache);
    const data = service.buildGraphData();
    setGraphData(data);

    const allClasses = new Set(
      data.nodes
        .map((n) => n.assetClass)
        .filter((c): c is string => typeof c === "string")
    );
    setSelectedClasses(allClasses);
  }, [app]);

  const filteredData = useMemo(() => {
    const filteredNodes = graphData.nodes.filter((node) => {
      if (!showArchived && node.isArchived) {
        return false;
      }

      if (node.assetClass && !selectedClasses.has(node.assetClass)) {
        return false;
      }

      return true;
    });

    const nodePathSet = new Set(filteredNodes.map((n) => n.path));
    const filteredEdges = graphData.edges.filter(
      (edge) => nodePathSet.has(edge.source) && nodePathSet.has(edge.target)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [graphData, selectedClasses, showArchived]);

  useEffect(() => {
    if (!svgRef.current || filteredData.nodes.length === 0) {
      return;
    }

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append("g");

    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const simulation = d3
      .forceSimulation<GraphNode>(filteredData.nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(filteredData.edges)
          .id((d) => d.path)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const link = g
      .append("g")
      .selectAll("line")
      .data(filteredData.edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);

    const node = g
      .append("g")
      .selectAll("g")
      .data(filteredData.nodes)
      .join("g")
      .call(
        d3Drag<SVGGElement, GraphNode>()
          .on("start", (event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d) => getNodeColor(d.assetClass))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node
      .append("text")
      .text((d) => d.label)
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "12px")
      .attr("fill", "var(--text-normal)");

    node.on("click", (_event, d) => {
      const file = app.vault.getAbstractFileByPath(d.path);
      if (file instanceof TFile) {
        app.workspace.getLeaf(false).openFile(file);
      }
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => {
          const source = typeof d.source === "object" ? d.source : filteredData.nodes.find(n => n.path === d.source);
          return source?.x ?? 0;
        })
        .attr("y1", (d) => {
          const source = typeof d.source === "object" ? d.source : filteredData.nodes.find(n => n.path === d.source);
          return source?.y ?? 0;
        })
        .attr("x2", (d) => {
          const target = typeof d.target === "object" ? d.target : filteredData.nodes.find(n => n.path === d.target);
          return target?.x ?? 0;
        })
        .attr("y2", (d) => {
          const target = typeof d.target === "object" ? d.target : filteredData.nodes.find(n => n.path === d.target);
          return target?.y ?? 0;
        });

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    svg.call(zoomBehavior.transform as never, zoomIdentity);

    return () => {
      simulation.stop();
    };
  }, [filteredData, app]);

  const getNodeColor = (assetClass?: string): string => {
    const colorMap: Record<string, string> = {
      "ems__Area": "#4caf50",
      "ems__Effort": "#2196f3",
      "ems__Project": "#ff9800",
      "ems__Meeting": "#9c27b0",
      "ems__Person": "#f44336",
    };

    return assetClass ? colorMap[assetClass] || "#757575" : "#757575";
  };

  const availableClasses = useMemo(() => {
    return Array.from(
      new Set(
        graphData.nodes
          .map((n) => n.assetClass)
          .filter((c): c is string => typeof c === "string")
      )
    ).sort();
  }, [graphData]);

  const toggleClass = (assetClass: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(assetClass)) {
        next.delete(assetClass);
      } else {
        next.add(assetClass);
      }
      return next;
    });
  };

  return (
    <div className="exocortex-graph-container" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="exocortex-graph-controls" style={{ padding: "8px", borderBottom: "1px solid var(--background-modifier-border)" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontWeight: "bold" }}>Filters:</span>
          {availableClasses.map((assetClass) => (
            <label key={assetClass} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="checkbox"
                checked={selectedClasses.has(assetClass)}
                onChange={() => toggleClass(assetClass)}
              />
              <span>{assetClass.replace("ems__", "")}</span>
            </label>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <span>Show Archived</span>
          </label>
        </div>
      </div>
      <svg
        ref={svgRef}
        className="exocortex-graph-canvas"
        style={{ flex: 1, width: "100%", background: "var(--background-primary)" }}
      />
    </div>
  );
};
