declare module 'force-graph' {
  export interface ForceGraphNode {
    id: string | number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    [key: string]: any;
  }

  export interface ForceGraphLink {
    source: string | number | ForceGraphNode;
    target: string | number | ForceGraphNode;
    [key: string]: any;
  }

  export interface ForceGraphData {
    nodes: ForceGraphNode[];
    links: ForceGraphLink[];
  }

  export interface ForceGraphInstance {
    graphData(data: ForceGraphData): ForceGraphInstance;

    nodeId(accessor: string | ((node: ForceGraphNode) => string | number)): ForceGraphInstance;
    nodeLabel(accessor: string | ((node: ForceGraphNode) => string)): ForceGraphInstance;
    nodeColor(accessor: string | ((node: ForceGraphNode) => string)): ForceGraphInstance;
    nodeRelSize(size: number): ForceGraphInstance;
    nodeCanvasObject(fn: (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => void): ForceGraphInstance;
    nodeCanvasObjectMode(mode: string | ((node: ForceGraphNode) => string)): ForceGraphInstance;

    linkSource(accessor: string | ((link: ForceGraphLink) => string | number)): ForceGraphInstance;
    linkTarget(accessor: string | ((link: ForceGraphLink) => string | number)): ForceGraphInstance;
    linkColor(accessor: string | ((link: ForceGraphLink) => string)): ForceGraphInstance;
    linkWidth(accessor: number | ((link: ForceGraphLink) => number)): ForceGraphInstance;

    onNodeClick(callback: (node: ForceGraphNode, event: MouseEvent) => void): ForceGraphInstance;
    onNodeHover(callback: (node: ForceGraphNode | null, previousNode: ForceGraphNode | null) => void): ForceGraphInstance;
    onNodeDrag(callback: (node: ForceGraphNode, translate: { x: number, y: number }) => void): ForceGraphInstance;
    onNodeDragEnd(callback: (node: ForceGraphNode, translate: { x: number, y: number }) => void): ForceGraphInstance;

    d3Force(forceName: string): any;
    d3Force(forceName: string, force: any): ForceGraphInstance;

    d3AlphaDecay(decay: number): ForceGraphInstance;
    d3AlphaDecay(): number;
    d3VelocityDecay(decay: number): ForceGraphInstance;
    d3VelocityDecay(): number;

    warmupTicks(ticks: number): ForceGraphInstance;
    cooldownTicks(ticks: number): ForceGraphInstance;
    cooldownTime(time: number): ForceGraphInstance;

    zoom(scale: number, duration?: number): ForceGraphInstance;
    zoomToFit(duration?: number, padding?: number): ForceGraphInstance;

    centerAt(x?: number, y?: number, duration?: number): ForceGraphInstance;

    width(width: number): ForceGraphInstance;
    width(): number;
    height(height: number): ForceGraphInstance;
    height(): number;

    pauseAnimation(): ForceGraphInstance;
    resumeAnimation(): ForceGraphInstance;

    refresh(): ForceGraphInstance;
  }

  declare function ForceGraph(): (element: HTMLElement) => ForceGraphInstance;
  export default ForceGraph;
}
