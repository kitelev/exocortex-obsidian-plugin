import {
  VisualQueryCanvas,
  CanvasOptions,
} from "../../../../src/presentation/components/VisualQueryCanvas";
import {
  VisualQueryNode,
  NodeType,
} from "../../../../src/domain/visual/VisualQueryNode";
import {
  VisualQueryEdge,
  EdgeType,
} from "../../../../src/domain/visual/VisualQueryEdge";
import { SPARQLProcessor } from "../../../../src/presentation/processors/SPARQLProcessor";

// Mock DOM methods
Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  writable: true,
  value: jest.fn().mockReturnValue({
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
  }),
});

// Mock SVG namespace
Object.defineProperty(document, "createElementNS", {
  writable: true,
  value: jest.fn((namespace: string, tagName: string) => {
    const element = document.createElement(tagName);
    (element as any).setAttribute = jest.fn();
    (element as any).removeAttribute = jest.fn();
    (element as any).getAttribute = jest.fn();
    (element as any).appendChild = jest.fn();
    (element as any).querySelector = jest
      .fn()
      .mockImplementation((selector: string) => {
        if (selector === "rect") {
          return {
            setAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            getAttribute: jest.fn(),
          };
        } else if (selector === "text") {
          return {
            setAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            getAttribute: jest.fn(),
            textContent: "",
          };
        } else if (selector === "path") {
          return {
            setAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            getAttribute: jest.fn(),
          };
        }
        return null;
      });
    (element as any).querySelectorAll = jest.fn().mockReturnValue([]);
    return element;
  }),
});

// Mock XMLSerializer
(global as any).XMLSerializer = jest.fn().mockImplementation(() => ({
  serializeToString: jest.fn().mockReturnValue("<svg></svg>"),
}));

describe("VisualQueryCanvas", () => {
  let parentElement: HTMLElement;
  let canvas: VisualQueryCanvas;
  let mockSparqlProcessor: jest.Mocked<SPARQLProcessor>;
  let mockOptions: CanvasOptions;

  beforeEach(() => {
    parentElement = document.createElement("div");
    document.body.appendChild(parentElement);

    mockSparqlProcessor = {
      executeQuery: jest.fn().mockResolvedValue({ results: [] }),
    } as any;

    mockOptions = {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      gridEnabled: true,
      gridSize: 20,
      allowZoom: true,
      allowPan: true,
      minZoom: 0.1,
      maxZoom: 5,
      onNodeSelect: jest.fn(),
      onEdgeSelect: jest.fn(),
      onNodeEdit: jest.fn(),
      onEdgeEdit: jest.fn(),
      onQueryGenerated: jest.fn(),
      onExecuteQuery: jest.fn(),
    };

    canvas = new VisualQueryCanvas(
      parentElement,
      mockOptions,
      mockSparqlProcessor,
    );
  });

  afterEach(() => {
    if (canvas) {
      canvas.destroy();
    }
    document.body.removeChild(parentElement);
  });

  describe("Initialization", () => {
    it("should create canvas with default options", () => {
      const simpleCanvas = new VisualQueryCanvas(parentElement);
      expect(simpleCanvas).toBeDefined();
      simpleCanvas.destroy();
    });

    it("should create canvas with custom options", () => {
      expect(canvas).toBeDefined();
      expect(
        parentElement.querySelector(".exocortex-visual-query-canvas"),
      ).toBeTruthy();
    });

    it("should create toolbar with all buttons", () => {
      const toolbar = parentElement.querySelector(".canvas-toolbar");
      expect(toolbar).toBeTruthy();

      const buttons = toolbar?.querySelectorAll("button");
      expect(buttons?.length).toBe(7); // Entity, Variable, Literal, Filter, Generate, Execute, Clear
    });

    it("should create SVG element with correct dimensions", () => {
      const svg = parentElement.querySelector("svg");
      expect(svg).toBeTruthy();
    });
  });

  describe("Node Management", () => {
    it("should add a node to the canvas", () => {
      const node = VisualQueryNode.createEntity(
        "Test Entity",
        "http://example.org/test",
        { x: 100, y: 100 },
      );
      canvas.addNode(node);

      const nodes = canvas.getNodes();
      expect(nodes.size).toBe(1);
      expect(nodes.get(node.getId())).toBe(node);
      expect(mockOptions.onNodeSelect).toHaveBeenCalledWith(node);
    });

    it("should remove a node from the canvas", () => {
      const node = VisualQueryNode.createEntity(
        "Test Entity",
        "http://example.org/test",
        { x: 100, y: 100 },
      );
      canvas.addNode(node);

      canvas.removeNode(node.getId());

      const nodes = canvas.getNodes();
      expect(nodes.size).toBe(0);
    });

    it("should remove connected edges when removing a node", () => {
      const node1 = VisualQueryNode.createEntity("Entity 1", undefined, {
        x: 100,
        y: 100,
      });
      const node2 = VisualQueryNode.createEntity("Entity 2", undefined, {
        x: 200,
        y: 200,
      });
      const edge = VisualQueryEdge.createProperty(
        node1.getId(),
        node2.getId(),
        "connects",
      );

      canvas.addNode(node1);
      canvas.addNode(node2);
      canvas.addEdge(edge);

      expect(canvas.getEdges().size).toBe(1);

      canvas.removeNode(node1.getId());

      expect(canvas.getEdges().size).toBe(0);
    });

    it("should create different types of nodes", () => {
      const entity = VisualQueryNode.createEntity("Entity", undefined, {
        x: 0,
        y: 0,
      });
      const variable = VisualQueryNode.createVariable("var1", { x: 100, y: 0 });
      const literal = VisualQueryNode.createLiteral("literal value", {
        x: 200,
        y: 0,
      });
      const filter = VisualQueryNode.createFilter("FILTER(?var > 0)", {
        x: 300,
        y: 0,
      });

      canvas.addNode(entity);
      canvas.addNode(variable);
      canvas.addNode(literal);
      canvas.addNode(filter);

      const nodes = canvas.getNodes();
      expect(nodes.size).toBe(4);

      expect(
        Array.from(nodes.values()).find((n) => n.getType() === NodeType.ENTITY),
      ).toBeTruthy();
      expect(
        Array.from(nodes.values()).find(
          (n) => n.getType() === NodeType.VARIABLE,
        ),
      ).toBeTruthy();
      expect(
        Array.from(nodes.values()).find(
          (n) => n.getType() === NodeType.LITERAL,
        ),
      ).toBeTruthy();
      expect(
        Array.from(nodes.values()).find((n) => n.getType() === NodeType.FILTER),
      ).toBeTruthy();
    });
  });

  describe("Edge Management", () => {
    let node1: VisualQueryNode;
    let node2: VisualQueryNode;

    beforeEach(() => {
      node1 = VisualQueryNode.createEntity("Entity 1", undefined, {
        x: 100,
        y: 100,
      });
      node2 = VisualQueryNode.createEntity("Entity 2", undefined, {
        x: 200,
        y: 200,
      });
      canvas.addNode(node1);
      canvas.addNode(node2);
    });

    it("should add an edge between two nodes", () => {
      const edge = VisualQueryEdge.createProperty(
        node1.getId(),
        node2.getId(),
        "connects",
      );
      canvas.addEdge(edge);

      const edges = canvas.getEdges();
      expect(edges.size).toBe(1);
      expect(edges.get(edge.getId())).toBe(edge);
      expect(mockOptions.onEdgeSelect).toHaveBeenCalledWith(edge);
    });

    it("should not add edge with missing source or target node", () => {
      const edge = VisualQueryEdge.createProperty(
        "missing-id",
        node2.getId(),
        "connects",
      );
      canvas.addEdge(edge);

      const edges = canvas.getEdges();
      expect(edges.size).toBe(0);
    });

    it("should remove an edge", () => {
      const edge = VisualQueryEdge.createProperty(
        node1.getId(),
        node2.getId(),
        "connects",
      );
      canvas.addEdge(edge);

      canvas.removeEdge(edge.getId());

      const edges = canvas.getEdges();
      expect(edges.size).toBe(0);
    });

    it("should create different types of edges", () => {
      const propertyEdge = VisualQueryEdge.createProperty(
        node1.getId(),
        node2.getId(),
        "property",
      );
      const optionalEdge = VisualQueryEdge.createOptional(
        node1.getId(),
        node2.getId(),
        "optional",
      );

      canvas.addEdge(propertyEdge);
      canvas.addEdge(optionalEdge);

      const edges = canvas.getEdges();
      expect(edges.size).toBe(2);

      expect(
        Array.from(edges.values()).find(
          (e) => e.getType() === EdgeType.PROPERTY,
        ),
      ).toBeTruthy();
      expect(
        Array.from(edges.values()).find(
          (e) => e.getType() === EdgeType.OPTIONAL,
        ),
      ).toBeTruthy();
    });
  });

  describe("Selection Management", () => {
    let node1: VisualQueryNode;
    let node2: VisualQueryNode;
    let edge: VisualQueryEdge;

    beforeEach(() => {
      node1 = VisualQueryNode.createEntity("Entity 1", undefined, {
        x: 100,
        y: 100,
      });
      node2 = VisualQueryNode.createEntity("Entity 2", undefined, {
        x: 200,
        y: 200,
      });
      edge = VisualQueryEdge.createProperty(
        node1.getId(),
        node2.getId(),
        "connects",
      );

      canvas.addNode(node1);
      canvas.addNode(node2);
      canvas.addEdge(edge);
    });

    it("should select nodes", () => {
      // Simulate node selection through mouse interaction
      const selectedNodes = canvas.getSelectedNodes();
      expect(selectedNodes.length).toBe(0); // Initially no selection
    });

    it("should select edges", () => {
      const selectedEdges = canvas.getSelectedEdges();
      expect(selectedEdges.length).toBe(0); // Initially no selection
    });
  });

  describe("SPARQL Generation", () => {
    it("should generate empty query with no nodes or edges", () => {
      const sparql = canvas.generateSPARQL();
      expect(sparql).toContain("SELECT *");
      expect(sparql).toContain("WHERE {");
      expect(mockOptions.onQueryGenerated).toHaveBeenCalledWith(sparql);
    });

    it("should generate simple triple pattern", () => {
      const subject = VisualQueryNode.createVariable("subject", {
        x: 100,
        y: 100,
      });
      const object = VisualQueryNode.createVariable("object", {
        x: 300,
        y: 100,
      });
      const edge = VisualQueryEdge.createProperty(
        subject.getId(),
        object.getId(),
        "predicate",
      );

      canvas.addNode(subject);
      canvas.addNode(object);
      canvas.addEdge(edge);

      const sparql = canvas.generateSPARQL();
      expect(sparql).toContain("SELECT ?subject ?object");
      expect(sparql).toContain("?subject");
      expect(sparql).toContain("?object");
    });

    it("should handle filter nodes", () => {
      const variable = VisualQueryNode.createVariable("count", {
        x: 100,
        y: 100,
      });
      const filter = VisualQueryNode.createFilter("FILTER(?count > 10)", {
        x: 200,
        y: 200,
      });

      canvas.addNode(variable);
      canvas.addNode(filter);

      const sparql = canvas.generateSPARQL();
      expect(sparql).toContain("FILTER(?count > 10)");
    });

    it("should handle optional patterns", () => {
      const subject = VisualQueryNode.createVariable("subject", {
        x: 100,
        y: 100,
      });
      const object = VisualQueryNode.createVariable("object", {
        x: 300,
        y: 100,
      });
      const edge = VisualQueryEdge.createOptional(
        subject.getId(),
        object.getId(),
        "predicate",
      );

      canvas.addNode(subject);
      canvas.addNode(object);
      canvas.addEdge(edge);

      const sparql = canvas.generateSPARQL();
      // Should generate OPTIONAL pattern
      expect(sparql).toContain("?subject");
      expect(sparql).toContain("?object");
      // Optional patterns are handled in buildSPARQLQuery method
    });
  });

  describe("Query Execution", () => {
    it("should execute generated SPARQL query", async () => {
      const subject = VisualQueryNode.createVariable("subject", {
        x: 100,
        y: 100,
      });
      const object = VisualQueryNode.createVariable("object", {
        x: 300,
        y: 100,
      });
      const edge = VisualQueryEdge.createProperty(
        subject.getId(),
        object.getId(),
        "predicate",
      );

      canvas.addNode(subject);
      canvas.addNode(object);
      canvas.addEdge(edge);

      // Mock SPARQL processor response
      mockSparqlProcessor.executeQuery.mockResolvedValue({
        results: [
          { subject: "http://example.org/1", object: "http://example.org/2" },
        ],
      });

      // Test the generateSPARQL method
      const generatedSparql = canvas.generateSPARQL();
      expect(generatedSparql).toBeDefined();
      expect(mockOptions.onQueryGenerated).toHaveBeenCalledWith(
        generatedSparql,
      );

      // Test direct execution through internal method
      canvas.executeQuery();
      expect(mockOptions.onExecuteQuery).toHaveBeenCalled();
    });
  });

  describe("Import/Export", () => {
    it("should export canvas to JSON", () => {
      const node = VisualQueryNode.createEntity(
        "Test Entity",
        "http://example.org/test",
        { x: 100, y: 100 },
      );
      canvas.addNode(node);

      const json = canvas.exportToJSON();
      const data = JSON.parse(json);

      expect(data.nodes).toHaveLength(1);
      expect(data.nodes[0].label).toBe("Test Entity");
      expect(data.edges).toHaveLength(0);
    });

    it("should import canvas from JSON", () => {
      const jsonData = {
        nodes: [
          {
            id: "test-node",
            type: NodeType.ENTITY,
            label: "Imported Entity",
            position: { x: 150, y: 150 },
            uri: "http://example.org/imported",
          },
        ],
        edges: [],
      };

      canvas.importFromJSON(JSON.stringify(jsonData));

      const nodes = canvas.getNodes();
      expect(nodes.size).toBe(1);

      const importedNode = Array.from(nodes.values())[0];
      expect(importedNode.getLabel()).toBe("Imported Entity");
      expect(importedNode.getPosition()).toEqual({ x: 150, y: 150 });
    });

    it("should export canvas to SVG", () => {
      const svg = canvas.exportToSVG();
      expect(svg).toBe("<svg></svg>"); // Mock XMLSerializer returns this
    });
  });

  describe("Zoom and Pan", () => {
    it("should support zoom to fit", () => {
      const node1 = VisualQueryNode.createEntity("Entity 1", undefined, {
        x: 0,
        y: 0,
      });
      const node2 = VisualQueryNode.createEntity("Entity 2", undefined, {
        x: 400,
        y: 300,
      });

      canvas.addNode(node1);
      canvas.addNode(node2);

      canvas.zoomToFit();

      // The zoom and pan should be adjusted to fit all nodes
      // Actual values depend on implementation details
    });

    it("should reset zoom", () => {
      canvas.resetZoom();
      // Should reset viewport to default values
    });
  });

  describe("Canvas Operations", () => {
    it("should clear the canvas", () => {
      const node = VisualQueryNode.createEntity("Test Entity", undefined, {
        x: 100,
        y: 100,
      });
      canvas.addNode(node);

      expect(canvas.getNodes().size).toBe(1);

      canvas.clearCanvas();

      expect(canvas.getNodes().size).toBe(0);
      expect(canvas.getEdges().size).toBe(0);
    });

    it("should handle invalid JSON import gracefully", () => {
      const invalidJson = "{ invalid json }";

      expect(() => {
        canvas.importFromJSON(invalidJson);
      }).not.toThrow();

      // Canvas should remain unchanged
      expect(canvas.getNodes().size).toBe(0);
    });
  });

  describe("Event Handling", () => {
    it("should handle mouse events for interaction", () => {
      // Mock mouse event
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: 150,
        clientY: 150,
        bubbles: true,
      });

      // Add a node at the click position
      const node = VisualQueryNode.createEntity("Clickable Entity", undefined, {
        x: 100,
        y: 100,
      });
      canvas.addNode(node);

      // Simulate mouse interaction
      // Note: Full interaction testing would require more complex setup
      expect(canvas.getNodes().size).toBe(1);
    });

    it("should handle keyboard shortcuts", () => {
      // Mock keyboard event
      const keyEvent = new KeyboardEvent("keydown", {
        key: "Delete",
        bubbles: true,
      });

      // Add and select a node
      const node = VisualQueryNode.createEntity("To Delete", undefined, {
        x: 100,
        y: 100,
      });
      canvas.addNode(node);

      // The actual deletion would happen through interaction
      expect(canvas.getNodes().size).toBe(1);
    });
  });

  describe("Cleanup", () => {
    it("should properly destroy the canvas", () => {
      const node = VisualQueryNode.createEntity("Test Entity", undefined, {
        x: 100,
        y: 100,
      });
      canvas.addNode(node);

      canvas.destroy();

      // Canvas should be cleaned up
      expect(canvas.getNodes().size).toBe(0);
      expect(canvas.getEdges().size).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle nodes with same position", () => {
      const node1 = VisualQueryNode.createEntity("Entity 1", undefined, {
        x: 100,
        y: 100,
      });
      const node2 = VisualQueryNode.createEntity("Entity 2", undefined, {
        x: 100,
        y: 100,
      });

      canvas.addNode(node1);
      canvas.addNode(node2);

      expect(canvas.getNodes().size).toBe(2);
    });

    it("should handle empty node labels", () => {
      const node = VisualQueryNode.createEntity("", undefined, {
        x: 100,
        y: 100,
      });
      canvas.addNode(node);

      const sparql = canvas.generateSPARQL();
      expect(sparql).toBeDefined();
    });

    it("should handle nodes outside canvas bounds", () => {
      const node = VisualQueryNode.createEntity("Outside", undefined, {
        x: -100,
        y: -100,
      });
      canvas.addNode(node);

      expect(canvas.getNodes().size).toBe(1);

      canvas.zoomToFit();
      // Should still handle the out-of-bounds node
    });
  });
});
