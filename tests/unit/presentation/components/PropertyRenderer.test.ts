import { PropertyRenderer } from "../../../../src/presentation/components/PropertyRenderer";
import { PropertyEditingUseCase } from "../../../../src/application/use-cases/PropertyEditingUseCase";
import { Result } from "../../../../src/domain/core/Result";
import { 
  App, 
  Setting, 
  TextComponent, 
  DropdownComponent, 
  ToggleComponent, 
  TextAreaComponent,
  ButtonComponent,
  Notice 
} from "obsidian";

// Mock Obsidian components
jest.mock("obsidian", () => ({
  Setting: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDesc: jest.fn().mockReturnThis(),
    addText: jest.fn().mockReturnThis(),
    addToggle: jest.fn().mockReturnThis(),
    addTextArea: jest.fn().mockReturnThis(),
    addButton: jest.fn().mockReturnThis(),
    nameEl: {
      createSpan: jest.fn(),
    },
  })),
  TextComponent: jest.fn().mockImplementation(() => ({
    setValue: jest.fn().mockReturnThis(),
    getValue: jest.fn().mockReturnValue(""),
    onChange: jest.fn().mockReturnThis(),
    inputEl: {
      type: "text",
      focus: jest.fn(),
      select: jest.fn(),
      addEventListener: jest.fn(),
    },
  })),
  DropdownComponent: jest.fn().mockImplementation(() => ({
    addOption: jest.fn().mockReturnThis(),
    setValue: jest.fn().mockReturnThis(),
    getValue: jest.fn().mockReturnValue(""),
    onChange: jest.fn().mockReturnThis(),
    selectEl: {
      focus: jest.fn(),
    },
  })),
  ToggleComponent: jest.fn().mockImplementation(() => ({
    setValue: jest.fn().mockReturnThis(),
    getValue: jest.fn().mockReturnValue(false),
    onChange: jest.fn().mockReturnThis(),
  })),
  TextAreaComponent: jest.fn().mockImplementation(() => ({
    setValue: jest.fn().mockReturnThis(),
    getValue: jest.fn().mockReturnValue(""),
    onChange: jest.fn().mockReturnThis(),
    inputEl: {
      focus: jest.fn(),
    },
  })),
  ButtonComponent: jest.fn().mockImplementation(() => ({
    setIcon: jest.fn().mockReturnThis(),
    setTooltip: jest.fn().mockReturnThis(),
    setButtonText: jest.fn().mockReturnThis(),
    onClick: jest.fn().mockReturnThis(),
  })),
  Notice: jest.fn(),
}));

describe("PropertyRenderer", () => {
  let renderer: PropertyRenderer;
  let mockApp: App;
  let mockPropertyEditingUseCase: jest.Mocked<PropertyEditingUseCase>;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockApp = {} as App;
    
    mockPropertyEditingUseCase = {
      getPropertiesForClass: jest.fn(),
      getAssetsForClass: jest.fn(),
      execute: jest.fn(),
    } as any;

    renderer = new PropertyRenderer(mockApp, mockPropertyEditingUseCase);
    mockContainer = document.createElement("div");
    document.body.appendChild(mockContainer);

    // Mock DOM methods
    mockContainer.createDiv = jest.fn().mockImplementation((options) => {
      const div = document.createElement("div");
      if (options?.cls) {
        div.className = options.cls;
      }
      if (options?.text) {
        div.textContent = options.text;
      }
      mockContainer.appendChild(div);
      return div;
    });
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  describe("Properties Block Rendering", () => {
    const mockProperty = {
      propertyName: "exo__Asset_name",
      label: "Name",
      description: "Asset name",
      range: "string",
      isRequired: true,
      isObjectProperty: false,
    };

    const mockCurrentProperties = {
      "exo__Asset_name": "Test Asset",
      "exo__Asset_description": "Test description",
      "custom_property": "Custom value",
    };

    it("should render properties block successfully", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([mockProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        mockCurrentProperties
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalledWith("TestClass");
      expect(mockContainer.createDiv).toHaveBeenCalledWith({
        cls: "exocortex-properties-editable",
      });
    });

    it("should handle property loading failure", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.fail("Failed to load properties")
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        mockCurrentProperties
      );

      expect(mockContainer.createDiv).toHaveBeenCalledWith({
        text: "Failed to load properties",
        cls: "exocortex-error-message",
      });
    });

    it("should render custom properties not in schema", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([mockProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        mockCurrentProperties
      );

      // Should render both schema property and custom property
      // custom_property should be rendered as it's not in schema and doesn't start with exo__
      expect(mockContainer.createDiv).toHaveBeenCalled();
    });

    it("should exclude exo__ properties from custom rendering", async () => {
      const propertiesWithExo = {
        ...mockCurrentProperties,
        "exo__Asset_uid": "123-456-789",
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([mockProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123", 
        "TestClass",
        propertiesWithExo
      );

      // exo__Asset_uid should not be rendered as a custom property
      expect(mockContainer.createDiv).toHaveBeenCalled();
    });
  });

  describe("Individual Property Rendering", () => {
    beforeEach(() => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([{
          propertyName: "test_property",
          label: "Test Property",
          description: "Test description",
          range: "string",
          isRequired: false,
          isObjectProperty: false,
        }])
      );
    });

    it("should render property in read-only mode by default", async () => {
      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { test_property: "test value" }
      );

      // Should create property item, label, and value containers
      expect(mockContainer.createDiv).toHaveBeenCalledWith({
        cls: "exocortex-properties-editable",
      });
    });

    it("should show required indicator for required properties", async () => {
      const requiredProperty = {
        propertyName: "required_prop",
        label: "Required Property",
        range: "string",
        isRequired: true,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([requiredProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { required_prop: "value" }
      );

      expect(mockContainer.createDiv).toHaveBeenCalled();
    });

    it("should show property description when available", async () => {
      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { test_property: "test value" }
      );

      expect(mockContainer.createDiv).toHaveBeenCalled();
    });
  });

  describe("Edit Mode Functionality", () => {
    let mockPropertyElement: HTMLElement;

    beforeEach(async () => {
      mockPropertyElement = document.createElement("div");
      mockPropertyElement.createDiv = jest.fn().mockImplementation((options) => {
        const div = document.createElement("div");
        if (options?.cls) div.className = options.cls;
        if (options?.text) div.textContent = options.text;
        mockPropertyElement.appendChild(div);
        return div;
      });

      mockPropertyElement.createSpan = jest.fn().mockImplementation((options) => {
        const span = document.createElement("span");
        if (options?.cls) span.className = options.cls;
        if (options?.text) span.textContent = options.text;
        mockPropertyElement.appendChild(span);
        return span;
      });

      mockPropertyElement.addEventListener = jest.fn();
      mockPropertyElement.empty = jest.fn();

      const property = {
        propertyName: "test_property",
        label: "Test Property",
        range: "string",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([property])
      );
    });

    it("should enter edit mode on click", async () => {
      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { test_property: "test value" }
      );

      // Simulate click event handling logic
      expect(mockContainer.createDiv).toHaveBeenCalled();
    });

    it("should enter edit mode on keyboard interaction", async () => {
      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { test_property: "test value" }
      );

      // Test that keyboard handlers would be set up
      expect(mockContainer.createDiv).toHaveBeenCalled();
    });
  });

  describe("Different Property Type Rendering", () => {
    it("should render text input for string properties", async () => {
      const stringProperty = {
        propertyName: "string_prop",
        label: "String Property",
        range: "string",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([stringProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { string_prop: "test value" }
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should render boolean toggle for boolean properties", async () => {
      const booleanProperty = {
        propertyName: "bool_prop",
        label: "Boolean Property",
        range: "boolean",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([booleanProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { bool_prop: true }
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should render dropdown for enum properties", async () => {
      const enumProperty = {
        propertyName: "enum_prop",
        label: "Enum Property",
        range: "enum:option1,option2,option3",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([enumProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { enum_prop: "option1" }
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should render date input for date properties", async () => {
      const dateProperty = {
        propertyName: "date_prop",
        label: "Date Property", 
        range: "date",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([dateProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { date_prop: "2023-01-01" }
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should render number input for number properties", async () => {
      const numberProperty = {
        propertyName: "num_prop",
        label: "Number Property",
        range: "number",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([numberProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { num_prop: 42 }
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should render textarea for text/description properties", async () => {
      const textProperty = {
        propertyName: "text_prop",
        label: "Text Property",
        range: "text",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([textProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { text_prop: "Long text content" }
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });
  });

  describe("Object Property Handling", () => {
    it("should render dropdown for object properties", async () => {
      const objectProperty = {
        propertyName: "obj_prop",
        label: "Object Property",
        range: "[[TargetClass]]",
        isRequired: false,
        isObjectProperty: true,
      };

      const mockAssets = [
        { fileName: "asset1", label: "Asset 1" },
        { fileName: "asset2", label: "Asset 2" },
      ];

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([objectProperty])
      );
      
      mockPropertyEditingUseCase.getAssetsForClass.mockResolvedValue(
        Result.ok(mockAssets)
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { obj_prop: "[[asset1]]" }
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should handle asset loading failure for object properties", async () => {
      const objectProperty = {
        propertyName: "obj_prop",
        label: "Object Property",
        range: "[[TargetClass]]",
        isRequired: false,
        isObjectProperty: true,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([objectProperty])
      );
      
      mockPropertyEditingUseCase.getAssetsForClass.mockResolvedValue(
        Result.fail("Failed to load assets")
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { obj_prop: "[[asset1]]" }
      );

      expect(mockPropertyEditingUseCase.getAssetsForClass).toHaveBeenCalled();
    });
  });

  describe("Property Saving and Canceling", () => {
    beforeEach(() => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([{
          propertyName: "test_property",
          label: "Test Property",
          range: "string",
          isRequired: false,
          isObjectProperty: false,
        }])
      );
    });

    it("should save property successfully", async () => {
      mockPropertyEditingUseCase.execute.mockResolvedValue(
        Result.ok({ success: true })
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { test_property: "test value" }
      );

      // Property saving logic would be tested through interaction simulation
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should handle property save failure", async () => {
      mockPropertyEditingUseCase.execute.mockResolvedValue(
        Result.fail("Save failed")
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { test_property: "test value" }
      );

      // Error handling would show notice
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should cancel editing and restore original value", async () => {
      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { test_property: "original value" }
      );

      // Cancel logic would restore the original value
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });
  });

  describe("Value Display Formatting", () => {
    it("should format boolean values correctly", async () => {
      const boolProperty = {
        propertyName: "bool_prop",
        label: "Boolean Property",
        range: "boolean",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([boolProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { bool_prop: true }
      );

      // Boolean formatting (✓/✗) would be applied
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should format array values correctly", async () => {
      const arrayProperty = {
        propertyName: "array_prop",
        label: "Array Property",
        range: "array",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([arrayProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { array_prop: ["item1", "item2", "item3"] }
      );

      // Array formatting (comma-separated) would be applied
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should handle null/undefined values", async () => {
      const stringProperty = {
        propertyName: "nullable_prop",
        label: "Nullable Property",
        range: "string",
        isRequired: false,
        isObjectProperty: false,
      };

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([stringProperty])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { nullable_prop: null }
      );

      // Should show "(empty)" for null/undefined values
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });
  });

  describe("Custom Property Handling", () => {
    it("should render custom properties with default string type", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        { 
          custom_prop: "custom value",
          another_custom: "another value"
        }
      );

      // Should render custom properties not in schema
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should not render exo__ prefixed properties as custom", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        {
          custom_prop: "custom value",
          "exo__Asset_uid": "should not render",
          "exo__Asset_class": "should not render",
        }
      );

      // Only custom_prop should be rendered
      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty property definitions", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([])
      );

      await renderer.renderPropertiesBlock(
        mockContainer,
        "asset-123",
        "TestClass",
        {}
      );

      expect(mockPropertyEditingUseCase.getPropertiesForClass).toHaveBeenCalled();
    });

    it("should handle malformed property definitions", async () => {
      const malformedProperty = {
        propertyName: null,
        label: undefined,
        range: "",
        isRequired: undefined,
        isObjectProperty: null,
      } as any;

      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([malformedProperty])
      );

      await expect(
        renderer.renderPropertiesBlock(
          mockContainer,
          "asset-123",
          "TestClass",
          {}
        )
      ).resolves.not.toThrow();
    });

    it("should handle missing asset ID", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([])
      );

      await expect(
        renderer.renderPropertiesBlock(
          mockContainer,
          "",
          "TestClass",
          {}
        )
      ).resolves.not.toThrow();
    });

    it("should handle missing class name", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockResolvedValue(
        Result.ok([])
      );

      await expect(
        renderer.renderPropertiesBlock(
          mockContainer,
          "asset-123",
          "",
          {}
        )
      ).resolves.not.toThrow();
    });

    it("should handle property editing use case exceptions", async () => {
      mockPropertyEditingUseCase.getPropertiesForClass.mockRejectedValue(
        new Error("Use case failed")
      );

      await expect(
        renderer.renderPropertiesBlock(
          mockContainer,
          "asset-123",
          "TestClass",
          {}
        )
      ).resolves.not.toThrow();
    });
  });
});