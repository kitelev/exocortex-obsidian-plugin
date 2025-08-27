import { EnhancedCreateAssetModal } from "../../../../src/presentation/modals/EnhancedCreateAssetModal";
import { App, Notice } from "obsidian";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";

jest.mock("obsidian", () => ({
  ...jest.requireActual("../../../__mocks__/obsidian"),
  Modal: class {
    app: any;
    contentEl: any;
    constructor(app: any) {
      this.app = app;
      this.contentEl = {
        createEl: jest.fn().mockReturnValue({
          createDiv: jest.fn().mockReturnValue({
            createEl: jest.fn(),
            empty: jest.fn(),
          }),
          createEl: jest.fn(),
        }),
        empty: jest.fn(),
      };
    }
    open() {}
    close() {}
  },
  Notice: jest.fn(),
  Setting: jest.fn().mockReturnValue({
    setName: jest.fn().mockReturnThis(),
    setDesc: jest.fn().mockReturnThis(),
    addText: jest.fn().mockReturnThis(),
    addDropdown: jest.fn().mockReturnThis(),
    addToggle: jest.fn().mockReturnThis(),
    addTextArea: jest.fn().mockReturnThis(),
    addButton: jest.fn().mockReturnThis(),
  }),
}));

describe("EnhancedCreateAssetModal", () => {
  let modal: EnhancedCreateAssetModal;
  let mockApp: App;
  let container: DIContainer;

  beforeEach(() => {
    // Reset DIContainer singleton
    (DIContainer as any).instance = null;

    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
        getAbstractFileByPath: jest.fn(),
        create: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue(null),
      },
      workspace: {
        getActiveFile: jest.fn(),
      },
    } as any;

    container = DIContainer.getInstance();

    // Mock required services
    const mockCreateAssetUseCase = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        message: "Asset created successfully",
        assetPath: "test-asset.md",
      }),
    };

    const mockCircuitBreaker = {
      execute: jest.fn().mockImplementation((_, fn) => fn()),
    };

    container.register("CreateAssetUseCase", () => mockCreateAssetUseCase);
    container.register("CircuitBreakerService", () => mockCircuitBreaker);

    modal = new EnhancedCreateAssetModal(mockApp, "test__Class");
  });

  describe("initialization", () => {
    it("should initialize with the provided class name", () => {
      expect((modal as any).assetClass).toBe("test__Class");
    });

    it("should create property discovery service", () => {
      expect((modal as any).propertyDiscovery).toBeDefined();
    });
  });

  describe("onOpen", () => {
    it("should set modal title based on class label", async () => {
      const mockClassFile = {
        basename: "test__Class",
        path: "classes/test__Class.md",
      };

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([
        mockClassFile,
      ]);
      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          rdfs__label: "Test Class",
        },
      });

      await modal.onOpen();

      expect(modal.contentEl.createEl).toHaveBeenCalledWith(
        "h2",
        expect.objectContaining({ text: "Create Test Class" }),
      );
    });

    it("should use default title when class not found", async () => {
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([]);

      await modal.onOpen();

      expect(modal.contentEl.createEl).toHaveBeenCalledWith(
        "h2",
        expect.objectContaining({ text: "Create Asset" }),
      );
    });
  });

  describe("property discovery", () => {
    it("should discover properties for the class", async () => {
      const mockProperties = [
        {
          name: "test__prop1",
          label: "Property 1",
          type: "DatatypeProperty",
          domain: "test__Class",
          range: "string",
          isRequired: true,
        },
        {
          name: "test__prop2",
          label: "Property 2",
          type: "ObjectProperty",
          domain: "test__Class",
          range: "other__Class",
          isRequired: false,
        },
      ];

      // Mock property discovery
      (modal as any).propertyDiscovery.discoverPropertiesForClass = jest
        .fn()
        .mockResolvedValue({
          isSuccess: true,
          getValue: () => mockProperties,
        });

      await modal.onOpen();

      expect((modal as any).properties).toEqual(mockProperties);
    });

    it("should show error message when property discovery fails", async () => {
      (modal as any).propertyDiscovery.discoverPropertiesForClass = jest
        .fn()
        .mockResolvedValue({
          isSuccess: false,
          getError: () => "Discovery failed",
        });

      await modal.onOpen();

      const container = (modal as any).propertiesContainer;
      expect(container.createEl).toHaveBeenCalledWith(
        "p",
        expect.objectContaining({
          text: "Error discovering properties: Discovery failed",
          cls: "exocortex-error-message",
        }),
      );
    });
  });

  describe("createAsset", () => {
    beforeEach(() => {
      // Setup modal with test data
      (modal as any).assetTitle = "Test Asset";
      (modal as any).assetOntology = "test";
      (modal as any).properties = [
        {
          name: "test__required",
          label: "Required Field",
          isRequired: true,
        },
      ];
      (modal as any).propertyValues.set("test__required", "value");
    });

    it("should validate required fields", async () => {
      (modal as any).assetTitle = "";

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith("Title is required", 5000);
    });

    it("should create asset successfully", async () => {
      await (modal as any).createAsset();

      const createAssetUseCase = container.resolve("CreateAssetUseCase");
      expect(createAssetUseCase.execute).toHaveBeenCalledWith({
        title: "Test Asset",
        className: "test__Class",
        ontologyPrefix: "test",
        properties: expect.objectContaining({
          test__required: "value",
          exo__Instance_class: "[[test__Class]]",
        }),
      });

      expect(Notice).toHaveBeenCalledWith("Asset created successfully");
      expect(modal.close).toHaveBeenCalled();
    });

    it("should handle creation errors gracefully", async () => {
      const createAssetUseCase = container.resolve("CreateAssetUseCase");
      (createAssetUseCase.execute as jest.Mock).mockResolvedValue({
        success: false,
        error: "Creation failed",
      });

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith("Error: Creation failed", 5000);
    });

    it("should handle circuit breaker errors", async () => {
      const circuitBreaker = container.resolve("CircuitBreakerService");
      (circuitBreaker.execute as jest.Mock).mockRejectedValue(
        new Error("Circuit breaker open"),
      );

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith(
        "Asset creation is temporarily unavailable. Please try again in a moment.",
        5000,
      );
    });
  });

  describe("field creation", () => {
    it("should create ObjectProperty dropdown with instances", async () => {
      const mockProperty = {
        name: "test__ref",
        label: "Reference",
        type: "ObjectProperty",
        range: "other__Class",
        isRequired: false,
      };

      const mockInstances = [
        { label: "Instance 1", value: "[[Instance 1]]", file: {} as any },
        { label: "Instance 2", value: "[[Instance 2]]", file: {} as any },
      ];

      (modal as any).propertyDiscovery.getInstancesOfClass = jest
        .fn()
        .mockResolvedValue({
          isSuccess: true,
          getValue: () => mockInstances,
        });

      const mockSetting = {
        setName: jest.fn().mockReturnThis(),
        setDesc: jest.fn().mockReturnThis(),
        addDropdown: jest.fn((callback) => {
          const mockDropdown = {
            addOption: jest.fn(),
            onChange: jest.fn(),
            setValue: jest.fn(),
          };
          callback(mockDropdown);
          return mockSetting;
        }),
      };

      await (modal as any).createObjectPropertyField(mockSetting, mockProperty);

      const dropdown = mockSetting.addDropdown.mock.calls[0][0]({
        addOption: jest.fn(),
        onChange: jest.fn(),
        setValue: jest.fn(),
      });

      expect(dropdown.addOption).toHaveBeenCalledWith("", "-- Select --");
      expect(dropdown.addOption).toHaveBeenCalledWith(
        "[[Instance 1]]",
        "Instance 1",
      );
      expect(dropdown.addOption).toHaveBeenCalledWith(
        "[[Instance 2]]",
        "Instance 2",
      );
    });

    it("should create appropriate input for DatatypeProperty", () => {
      const testCases = [
        { range: "boolean", expectedMethod: "createBooleanField" },
        { range: "date", expectedMethod: "createDateField" },
        { range: "integer", expectedMethod: "createNumberField" },
        { range: "text", expectedMethod: "createTextAreaField" },
        { range: "string", expectedMethod: "createTextField" },
      ];

      testCases.forEach(({ range, expectedMethod }) => {
        const mockProperty = {
          name: "test__prop",
          label: "Test Property",
          type: "DatatypeProperty",
          range,
          isRequired: false,
        };

        const mockSetting = {};

        // Mock the specific method
        (modal as any)[expectedMethod] = jest.fn();

        (modal as any).createDatatypePropertyField(mockSetting, mockProperty);

        expect((modal as any)[expectedMethod]).toHaveBeenCalledWith(
          mockSetting,
          mockProperty,
        );
      });
    });

    it("should handle enum fields with options", () => {
      const mockProperty = {
        name: "test__enum",
        label: "Enum Field",
        type: "DatatypeProperty",
        range: "string",
        options: ["Option 1", "Option 2", "Option 3"],
        isRequired: false,
      };

      const mockSetting = {};
      (modal as any).createEnumField = jest.fn();

      (modal as any).createDatatypePropertyField(mockSetting, mockProperty);

      expect((modal as any).createEnumField).toHaveBeenCalledWith(
        mockSetting,
        mockProperty,
      );
    });
  });

  describe("ontology detection", () => {
    it("should auto-detect ontology from class prefix", async () => {
      modal = new EnhancedCreateAssetModal(mockApp, "ems__Area");

      const mockOntologies = [
        { name: "!ems", basename: "!ems", path: "!ems.md" },
        { name: "!exo", basename: "!exo", path: "!exo.md" },
      ];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(
        mockOntologies,
      );
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => ({
          frontmatter: {
            exo__Ontology_prefix: file.basename.substring(1),
          },
        }),
      );

      await modal.onOpen();

      // Should default to "ems" based on class prefix
      expect((modal as any).assetOntology).toBe("ems");
    });
  });
});
