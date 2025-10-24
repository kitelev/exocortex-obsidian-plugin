import React, { useEffect, useRef, useState, useMemo } from "react";
import { App, TFile } from "obsidian";
import ForceGraph from "force-graph";
import type { ForceGraphInstance, ForceGraphNode } from "force-graph";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { GraphDataService } from "../../infrastructure/services/GraphDataService";
import type { GraphData } from "../../domain/models/GraphData";
import type { GraphNode } from "../../domain/models/GraphNode";

interface GraphCanvasProps {
  app: App;
  plugin: ExocortexPlugin;
}

interface GraphForceNode extends ForceGraphNode {
  id: string;
  label: string;
  assetClass?: string;
  path: string;
  isArchived?: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ app, plugin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphInstance | null>(null);
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
    if (!containerRef.current || filteredData.nodes.length === 0) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = "";

    const width = container.clientWidth;
    const height = container.clientHeight;

    const forceNodes: GraphForceNode[] = filteredData.nodes.map((node: GraphNode) => ({
      id: node.path,
      label: node.label,
      assetClass: node.assetClass,
      path: node.path,
      isArchived: node.isArchived,
    }));

    const forceLinks = filteredData.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const graph = ForceGraph()(container)
      .width(width)
      .height(height)
      .graphData({
        nodes: forceNodes,
        links: forceLinks,
      })
      .nodeId("id")
      .nodeLabel((node: ForceGraphNode) => (node as GraphForceNode).label)
      .nodeColor((node: ForceGraphNode) => getNodeColor((node as GraphForceNode).assetClass))
      .nodeRelSize(8)
      .nodeCanvasObject((node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const typedNode = node as GraphForceNode;
        const label = typedNode.label;
        const fontSize = 12 / globalScale;
        const nodeSize = 8;

        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, nodeSize, 0, 2 * Math.PI, false);
        ctx.fillStyle = getNodeColor(typedNode.assetClass);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();

        if (globalScale >= 0.5) {
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue("--text-normal") || "#000";
          ctx.fillText(label, (node.x ?? 0) + nodeSize + 4 / globalScale, (node.y ?? 0) + 4 / globalScale);
        }
      })
      .nodeCanvasObjectMode(() => "replace")
      .linkColor(() => "#999")
      .linkWidth(1)
      .onNodeClick((node: ForceGraphNode) => {
        const typedNode = node as GraphForceNode;
        const file = app.vault.getAbstractFileByPath(typedNode.path);
        if (file instanceof TFile) {
          app.workspace.getLeaf(false).openFile(file);
        }
      })
      .onNodeDragEnd((node: ForceGraphNode) => {
        node.fx = node.x;
        node.fy = node.y;
      })
      .d3AlphaDecay(0.0228)
      .d3VelocityDecay(0.4)
      .warmupTicks(0)
      .cooldownTime(0);

    graphRef.current = graph;

    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        graphRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (graphRef.current) {
        graphRef.current.pauseAnimation();
      }
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
      <div
        ref={containerRef}
        className="exocortex-graph-canvas"
        style={{ flex: 1, width: "100%", background: "var(--background-primary)" }}
      />
    </div>
  );
};
