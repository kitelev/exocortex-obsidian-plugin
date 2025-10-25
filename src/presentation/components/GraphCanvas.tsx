import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { App, TFile } from "obsidian";
import ForceGraph from "force-graph";
import type { ForceGraphInstance, ForceGraphNode, ForceGraphLink } from "force-graph";
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
  title: string;
  label: string;
  assetClass?: string;
  path: string;
  isArchived: boolean;
  neighbors?: Set<string>;
  links?: Set<string>;
}

interface GraphGroup {
  id: string;
  query: string;
  color: string;
}

interface GraphSettings {
  filters: {
    search: string;
    showTags: boolean;
    showAttachments: boolean;
    existingFilesOnly: boolean;
    showOrphans: boolean;
  };
  groups: GraphGroup[];
  display: {
    showArrows: boolean;
    textFadeThreshold: number;
    nodeSize: number;
    linkThickness: number;
    animate: boolean;
  };
  forces: {
    centerForce: number;
    repelForce: number;
    linkForce: number;
    linkDistance: number;
  };
}

const DEFAULT_SETTINGS: GraphSettings = {
  filters: {
    search: "",
    showTags: true,
    showAttachments: false,
    existingFilesOnly: true,
    showOrphans: true,
  },
  groups: [],
  display: {
    showArrows: true,
    textFadeThreshold: 1.5,
    nodeSize: 8,
    linkThickness: 1,
    animate: false,
  },
  forces: {
    centerForce: 0.3,
    repelForce: -300,
    linkForce: 0.5,
    linkDistance: 30,
  },
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ app, plugin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphInstance | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [settings, setSettings] = useState<GraphSettings>(DEFAULT_SETTINGS);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showGroups, setShowGroups] = useState(true);
  const [showDisplay, setShowDisplay] = useState(true);
  const [showForces, setShowForces] = useState(true);

  useEffect(() => {
    const service = new GraphDataService(app, app.metadataCache);
    const data = service.buildGraphData();
    setGraphData(data);
  }, [app]);

  const updateSettings = useCallback((updater: (prev: GraphSettings) => GraphSettings) => {
    setSettings(updater);
  }, []);

  const matchesSearch = useCallback((node: GraphNode, query: string): boolean => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return (
      node.label.toLowerCase().includes(lowerQuery) ||
      node.title.toLowerCase().includes(lowerQuery) ||
      node.path.toLowerCase().includes(lowerQuery)
    );
  }, []);

  const matchesGroup = useCallback((node: GraphNode, group: GraphGroup): boolean => {
    return matchesSearch(node, group.query);
  }, [matchesSearch]);

  const getNodeGroup = useCallback((node: GraphNode): GraphGroup | undefined => {
    return settings.groups.find((group) => matchesGroup(node, group));
  }, [settings.groups, matchesGroup]);

  const filteredData = useMemo(() => {
    const filteredNodes = graphData.nodes.filter((node) => {
      if (!settings.filters.existingFilesOnly) {
        return true;
      }

      if (!settings.filters.showOrphans) {
        const hasConnections = graphData.edges.some(
          (edge) => edge.source === node.path || edge.target === node.path
        );
        if (!hasConnections) return false;
      }

      if (node.isArchived && !settings.filters.showAttachments) {
        return true;
      }

      if (settings.filters.search && !matchesSearch(node, settings.filters.search)) {
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
  }, [graphData, settings.filters, matchesSearch]);

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
      title: node.title,
      label: node.label,
      assetClass: node.assetClass,
      path: node.path,
      isArchived: node.isArchived,
      neighbors: new Set<string>(),
      links: new Set<string>(),
    }));

    const forceLinks = filteredData.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const nodeMap = new Map<string, GraphForceNode>();
    forceNodes.forEach((node) => nodeMap.set(node.id, node));

    forceLinks.forEach((link) => {
      const sourceNode = nodeMap.get(typeof link.source === "string" ? link.source : (link.source as any).id);
      const targetNode = nodeMap.get(typeof link.target === "string" ? link.target : (link.target as any).id);

      if (sourceNode && targetNode) {
        sourceNode.neighbors?.add(targetNode.id);
        targetNode.neighbors?.add(sourceNode.id);
        sourceNode.links?.add(`${sourceNode.id}-${targetNode.id}`);
        targetNode.links?.add(`${sourceNode.id}-${targetNode.id}`);
      }
    });

    const graph = ForceGraph()(container)
      .width(width)
      .height(height)
      .graphData({
        nodes: forceNodes,
        links: forceLinks,
      })
      .nodeId("id")
      .nodeLabel((node: ForceGraphNode) => (node as GraphForceNode).label)
      .nodeRelSize(settings.display.nodeSize)
      .nodeCanvasObject((node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const typedNode = node as GraphForceNode;
        const label = typedNode.label;
        const fontSize = 12 / globalScale;
        const nodeSize = settings.display.nodeSize;

        const isHighlighted = hoveredNode === typedNode.id ||
                             (hoveredNode && typedNode.neighbors?.has(hoveredNode));
        const isDimmed = hoveredNode && !isHighlighted;

        ctx.save();

        if (isDimmed) {
          ctx.globalAlpha = 0.15;
        } else if (isHighlighted && hoveredNode !== typedNode.id) {
          ctx.globalAlpha = 1.0;
        } else {
          ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, nodeSize, 0, 2 * Math.PI, false);

        const group = getNodeGroup(typedNode);
        const nodeColor = group ? group.color : getNodeColor(typedNode.assetClass);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        if (isHighlighted) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 3 / globalScale;
        } else {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5 / globalScale;
        }
        ctx.stroke();

        if (globalScale >= settings.display.textFadeThreshold) {
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue("--text-normal") || "#000";
          ctx.fillText(label, (node.x ?? 0) + nodeSize + 4 / globalScale, (node.y ?? 0));
        }

        ctx.restore();
      })
      .nodeCanvasObjectMode(() => "replace")
      .linkColor((link: ForceGraphLink) => {
        const sourceNode = nodeMap.get(typeof link.source === "string" ? link.source : (link.source as any).id);
        const targetNode = nodeMap.get(typeof link.target === "string" ? link.target : (link.target as any).id);

        if (!sourceNode || !targetNode) return "#999";

        const isHighlighted = hoveredNode === sourceNode.id ||
                             hoveredNode === targetNode.id;
        const isDimmed = hoveredNode && !isHighlighted;

        if (isDimmed) {
          return "rgba(153, 153, 153, 0.15)";
        } else if (isHighlighted) {
          return "rgba(153, 153, 153, 1.0)";
        }
        return "#999";
      })
      .linkWidth((link: ForceGraphLink) => {
        const sourceNode = nodeMap.get(typeof link.source === "string" ? link.source : (link.source as any).id);
        const targetNode = nodeMap.get(typeof link.target === "string" ? link.target : (link.target as any).id);

        const isHighlighted = hoveredNode === sourceNode?.id ||
                             hoveredNode === targetNode?.id;

        return isHighlighted ? settings.display.linkThickness * 2 : settings.display.linkThickness;
      })
      .onNodeClick((node: ForceGraphNode) => {
        const typedNode = node as GraphForceNode;
        const file = app.vault.getAbstractFileByPath(typedNode.path);
        if (file instanceof TFile) {
          app.workspace.getLeaf(false).openFile(file);
        }
      })
      .onNodeHover((node: ForceGraphNode | null) => {
        setHoveredNode(node ? (node as GraphForceNode).id : null);
        if (containerRef.current) {
          containerRef.current.style.cursor = node ? "pointer" : "default";
        }
      })
      .onNodeDragEnd((node: ForceGraphNode) => {
        node.fx = node.x;
        node.fy = node.y;
      })
      .d3Force("charge", null)
      .d3Force("link", null)
      .d3Force("center", null);

    const d3 = graph.d3Force as any;
    if (d3) {
      const d3ForceLink = d3("link");
      const d3ForceManyBody = d3("charge");
      const d3ForceCenter = d3("center");

      if (d3ForceLink) {
        graph.d3Force("link", d3ForceLink
          .distance(settings.forces.linkDistance)
          .strength(settings.forces.linkForce)
        );
      }

      if (d3ForceManyBody) {
        graph.d3Force("charge", d3ForceManyBody
          .strength(settings.forces.repelForce)
        );
      }

      if (d3ForceCenter) {
        graph.d3Force("center", d3ForceCenter
          .strength(settings.forces.centerForce)
        );
      }
    }

    (graph as any)
      .linkDirectionalArrowLength(settings.display.showArrows ? 3.5 : 0)
      .linkDirectionalArrowRelPos(1)
      .d3AlphaDecay(0.0228)
      .d3VelocityDecay(0.4)
      .warmupTicks(0)
      .cooldownTime(settings.display.animate ? 0 : 15000);

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
  }, [filteredData, app, settings, hoveredNode, getNodeGroup]);

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

  const addGroup = () => {
    const newGroup: GraphGroup = {
      id: `group-${Date.now()}`,
      query: "",
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
    updateSettings((prev) => ({
      ...prev,
      groups: [...prev.groups, newGroup],
    }));
  };

  const removeGroup = (groupId: string) => {
    updateSettings((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
    }));
  };

  const updateGroup = (groupId: string, updates: Partial<GraphGroup>) => {
    updateSettings((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    }));
  };

  const resetForces = () => {
    updateSettings((prev) => ({
      ...prev,
      forces: DEFAULT_SETTINGS.forces,
    }));
  };

  return (
    <div className="exocortex-graph-container" style={{
      height: "100%",
      display: "flex",
      flexDirection: "row",
      background: "var(--background-primary)"
    }}>
      <div className="exocortex-graph-sidebar exocortex-graph-controls" style={{
        width: "280px",
        padding: "16px",
        borderRight: "1px solid var(--background-modifier-border)",
        overflowY: "auto",
        background: "var(--background-secondary)"
      }}>
        <div className="exocortex-graph-section" style={{ marginBottom: "16px" }}>
          <div
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text-normal)"
            }}
          >
            <span>Filters:</span>
            <span style={{ fontSize: "12px" }}>{showFilters ? "▼" : "▶"}</span>
          </div>
          {showFilters && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <input
                type="text"
                placeholder="Search files..."
                value={settings.filters.search}
                onChange={(e) => updateSettings((prev) => ({
                  ...prev,
                  filters: { ...prev.filters, search: e.target.value }
                }))}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "4px",
                  background: "var(--background-primary)",
                  color: "var(--text-normal)"
                }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.filters.showTags}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, showTags: e.target.checked }
                  }))}
                />
                <span>Tags</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.filters.showAttachments}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, showAttachments: e.target.checked }
                  }))}
                />
                <span>Attachments</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.filters.existingFilesOnly}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, existingFilesOnly: e.target.checked }
                  }))}
                />
                <span>Existing files only</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.filters.showOrphans}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, showOrphans: e.target.checked }
                  }))}
                />
                <span>Orphans</span>
              </label>
            </div>
          )}
        </div>

        <div className="exocortex-graph-section" style={{ marginBottom: "16px" }}>
          <div
            onClick={() => setShowGroups(!showGroups)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text-normal)"
            }}
          >
            <span>Groups</span>
            <span style={{ fontSize: "12px" }}>{showGroups ? "▼" : "▶"}</span>
          </div>
          {showGroups && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              {settings.groups.map((group) => (
                <div key={group.id} style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "8px",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "4px",
                  background: "var(--background-primary)"
                }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="color"
                      value={group.color}
                      onChange={(e) => updateGroup(group.id, { color: e.target.value })}
                      style={{ width: "30px", height: "30px", cursor: "pointer", border: "none" }}
                    />
                    <input
                      type="text"
                      placeholder="Search query..."
                      value={group.query}
                      onChange={(e) => updateGroup(group.id, { query: e.target.value })}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        border: "1px solid var(--background-modifier-border)",
                        borderRadius: "4px",
                        background: "var(--background-secondary)",
                        color: "var(--text-normal)",
                        fontSize: "12px"
                      }}
                    />
                    <button
                      onClick={() => removeGroup(group.id)}
                      style={{
                        padding: "4px 8px",
                        background: "var(--interactive-accent)",
                        color: "var(--text-on-accent)",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addGroup}
                style={{
                  padding: "8px 12px",
                  background: "var(--interactive-accent)",
                  color: "var(--text-on-accent)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                New group
              </button>
            </div>
          )}
        </div>

        <div className="exocortex-graph-section" style={{ marginBottom: "16px" }}>
          <div
            onClick={() => setShowDisplay(!showDisplay)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text-normal)"
            }}
          >
            <span>Display</span>
            <span style={{ fontSize: "12px" }}>{showDisplay ? "▼" : "▶"}</span>
          </div>
          {showDisplay && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.display.showArrows}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, showArrows: e.target.checked }
                  }))}
                />
                <span>Arrows</span>
              </label>

              <div>
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Text fade threshold: {settings.display.textFadeThreshold.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.display.textFadeThreshold}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, textFadeThreshold: parseFloat(e.target.value) }
                  }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Node size: {settings.display.nodeSize}
                </label>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={settings.display.nodeSize}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, nodeSize: parseInt(e.target.value) }
                  }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Link thickness: {settings.display.linkThickness}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={settings.display.linkThickness}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, linkThickness: parseFloat(e.target.value) }
                  }))}
                  style={{ width: "100%" }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.display.animate}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, animate: e.target.checked }
                  }))}
                />
                <span>Animate</span>
              </label>
            </div>
          )}
        </div>

        <div className="exocortex-graph-section" style={{ marginBottom: "16px" }}>
          <div
            onClick={() => setShowForces(!showForces)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontWeight: "600",
              marginBottom: "8px",
              color: "var(--text-normal)"
            }}
          >
            <span>Forces</span>
            <span style={{ fontSize: "12px" }}>{showForces ? "▼" : "▶"}</span>
          </div>
          {showForces && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Center force: {settings.forces.centerForce.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.forces.centerForce}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    forces: { ...prev.forces, centerForce: parseFloat(e.target.value) }
                  }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Repel force: {settings.forces.repelForce}
                </label>
                <input
                  type="range"
                  min="-1000"
                  max="-50"
                  step="10"
                  value={settings.forces.repelForce}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    forces: { ...prev.forces, repelForce: parseInt(e.target.value) }
                  }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Link force: {settings.forces.linkForce.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.forces.linkForce}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    forces: { ...prev.forces, linkForce: parseFloat(e.target.value) }
                  }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Link distance: {settings.forces.linkDistance}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={settings.forces.linkDistance}
                  onChange={(e) => updateSettings((prev) => ({
                    ...prev,
                    forces: { ...prev.forces, linkDistance: parseInt(e.target.value) }
                  }))}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                onClick={resetForces}
                style={{
                  padding: "8px 12px",
                  background: "var(--interactive-accent)",
                  color: "var(--text-on-accent)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Restore defaults
              </button>
            </div>
          )}
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
