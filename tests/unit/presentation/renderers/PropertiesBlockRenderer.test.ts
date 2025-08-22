import { PropertiesBlockRenderer } from "../../../../src/presentation/renderers/PropertiesBlockRenderer";
import { Vault, App } from "../../../__mocks__/obsidian";

describe("PropertiesBlockRenderer", () => {
  let renderer: PropertiesBlockRenderer;
  let mockVault: Vault;
  let mockApp: App;

  beforeEach(() => {
    mockVault = new Vault();
    mockApp = new App();
    const mockPropertyRenderer = {
      renderPropertiesBlock: jest.fn(),
    };
    renderer = new PropertiesBlockRenderer(
      mockApp as any,
      mockPropertyRenderer as any,
    );
  });

  describe("renderPropertiesBlock", () => {
    it("should render empty properties list", () => {
      const container = document.createElement("div");
      const properties: any[] = [];

      renderer.renderPropertiesBlock(properties, container);

      expect(container.children.length).toBe(0);
    });

    it("should render basic properties", () => {
      const container = document.createElement("div");
      const properties = [
        { name: "title", value: "Test Title", type: "string" },
        { name: "count", value: 42, type: "number" },
        { name: "active", value: true, type: "boolean" },
      ];

      renderer.renderPropertiesBlock(properties, container);

      expect(container.children.length).toBe(3);
      expect(container.textContent).toContain("title");
      expect(container.textContent).toContain("Test Title");
      expect(container.textContent).toContain("count");
      expect(container.textContent).toContain("42");
      expect(container.textContent).toContain("active");
    });

    it("should handle different property types", () => {
      const container = document.createElement("div");
      const properties = [
        { name: "text", value: "Sample text", type: "string" },
        { name: "date", value: "2024-01-15", type: "date" },
        { name: "url", value: "https://example.com", type: "url" },
        { name: "tags", value: ["tag1", "tag2"], type: "array" },
      ];

      renderer.renderPropertiesBlock(properties, container);

      expect(container.children.length).toBe(4);
      expect(container.textContent).toContain("Sample text");
      expect(container.textContent).toContain("2024-01-15");
      expect(container.textContent).toContain("https://example.com");
      expect(container.textContent).toContain("tag1");
    });

    it("should handle null and undefined values", () => {
      const container = document.createElement("div");
      const properties = [
        { name: "nullProp", value: null, type: "string" },
        { name: "undefinedProp", value: undefined, type: "string" },
        { name: "emptyProp", value: "", type: "string" },
      ];

      renderer.renderPropertiesBlock(properties, container);

      expect(container.children.length).toBe(3);
      const propertyElements = container.querySelectorAll(".property-item");
      expect(propertyElements.length).toBe(3);
    });

    it("should handle complex nested values", () => {
      const container = document.createElement("div");
      const properties = [
        {
          name: "metadata",
          value: {
            created: "2024-01-01",
            modified: "2024-01-15",
            tags: ["important", "project"],
          },
          type: "object",
        },
      ];

      renderer.renderPropertiesBlock(properties, container);

      expect(container.children.length).toBe(1);
      expect(container.textContent).toContain("metadata");
    });

    it("should apply correct CSS classes", () => {
      const container = document.createElement("div");
      const properties = [{ name: "status", value: "active", type: "status" }];

      renderer.renderPropertiesBlock(properties, container);

      const propertyElement = container.querySelector(".property-item");
      expect(propertyElement).toBeTruthy();
      expect(propertyElement?.classList.contains("property-item")).toBe(true);
    });

    it("should handle editable properties", () => {
      const container = document.createElement("div");
      const properties = [
        {
          name: "editableField",
          value: "Edit me",
          type: "string",
          editable: true,
        },
      ];

      renderer.renderPropertiesBlock(properties, container);

      const input = container.querySelector("input, textarea");
      expect(input).toBeTruthy();
    });

    it("should handle readonly properties", () => {
      const container = document.createElement("div");
      const properties = [
        {
          name: "readonlyField",
          value: "Cannot edit",
          type: "string",
          readonly: true,
        },
      ];

      renderer.renderPropertiesBlock(properties, container);

      const valueElement = container.querySelector(".property-value");
      expect(valueElement).toBeTruthy();
      expect(valueElement?.textContent).toContain("Cannot edit");
    });
  });

  describe("property formatting", () => {
    it("should format dates correctly", () => {
      const container = document.createElement("div");
      const properties = [
        { name: "created", value: "2024-01-15T10:30:00Z", type: "date" },
      ];

      renderer.renderPropertiesBlock(properties, container);

      const dateElement = container.querySelector(".property-value");
      expect(dateElement).toBeTruthy();
    });

    it("should format numbers correctly", () => {
      const container = document.createElement("div");
      const properties = [
        { name: "price", value: 1234.56, type: "currency" },
        { name: "percentage", value: 0.85, type: "percentage" },
      ];

      renderer.renderPropertiesBlock(properties, container);

      expect(container.textContent).toContain("1234.56");
      expect(container.textContent).toContain("0.85");
    });

    it("should format arrays as lists", () => {
      const container = document.createElement("div");
      const properties = [
        {
          name: "tags",
          value: ["web", "development", "javascript"],
          type: "tags",
        },
      ];

      renderer.renderPropertiesBlock(properties, container);

      const tagElements = container.querySelectorAll(".tag");
      expect(tagElements.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("should handle null container", () => {
      const properties = [{ name: "test", value: "value", type: "string" }];

      expect(() => {
        renderer.renderPropertiesBlock(properties, null as any);
      }).not.toThrow();
    });

    it("should handle malformed property objects", () => {
      const container = document.createElement("div");
      const properties = [
        null,
        undefined,
        { name: "incomplete" }, // missing value and type
        { value: "orphaned" }, // missing name and type
        "invalid" as any,
      ];

      expect(() => {
        renderer.renderPropertiesBlock(properties, container);
      }).not.toThrow();
    });

    it("should handle invalid property types", () => {
      const container = document.createElement("div");
      const properties = [
        { name: "test", value: "value", type: "nonexistent-type" },
      ];

      expect(() => {
        renderer.renderPropertiesBlock(properties, container);
      }).not.toThrow();
    });
  });
});
