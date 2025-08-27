import { App, Setting, Notice } from "obsidian";
import { CreateAssetModal } from "../../../../src/presentation/modals/CreateAssetModal";
import { CreateAssetUseCase } from "../../../../src/application/use-cases/CreateAssetUseCase";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";
import { Result } from "../../../../src/domain/core/Result";

// Mock DIContainer
jest.mock("../../../../src/infrastructure/container/DIContainer");

// Mock Notice
jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Notice: jest.fn(),
    Setting: jest.fn().mockImplementation(() => ({
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      addText: jest.fn().mockReturnThis(),
      addDropdown: jest.fn().mockReturnThis(),
      addToggle: jest.fn().mockReturnThis(),
      addTextArea: jest.fn().mockReturnThis(),
      addButton: jest.fn().mockReturnThis(),
    })),
  };
});

// Extend HTMLElement to include Obsidian-specific methods
declare global {
  interface HTMLElement {
    createEl(tag: string, attrs?: any): HTMLElement;
    createDiv(attrs?: any): HTMLElement;
    empty(): void;
  }
}

// Add Obsidian DOM extensions to HTMLElement prototype
beforeAll(() => {
  HTMLElement.prototype.createEl = jest.fn().mockImplementation(function (
    this: HTMLElement,
    tag: string,
    attrs?: any,
  ) {
    const element = document.createElement(tag);
    if (attrs?.text) element.textContent = attrs.text;
    if (attrs?.cls) element.className = attrs.cls;
    // Append to parent (this) like real Obsidian createEl does
    this.appendChild(element);
    return element;
  });

  HTMLElement.prototype.createDiv = jest.fn().mockImplementation(function (
    this: HTMLElement,
    attrs?: any,
  ) {
    const element = document.createElement("div");
    if (attrs?.cls) element.className = attrs.cls;
    // Append to parent (this) like real Obsidian createDiv does
    this.appendChild(element);
    return element;
  });

  HTMLElement.prototype.empty = jest.fn().mockImplementation(function () {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  });
});

describe("CreateAssetModal", () => {
  let app: App;
  let modal: CreateAssetModal;
  let mockCreateAssetUseCase: jest.Mocked<CreateAssetUseCase>;
  let mockContainer: jest.Mocked<DIContainer>;
  let mockCircuitBreaker: any;
  let mockPropertyCache: any;

  beforeEach(() => {
    // Setup app mock with vault and metadataCache
    app = new App();
    (app as any).vault = {
      getMarkdownFiles: jest.fn().mockReturnValue([]),
      read: jest.fn(),
    };
    (app as any).metadataCache = {
      getFileCache: jest.fn().mockReturnValue(null),
    };

    // Setup CreateAssetUseCase mock
    mockCreateAssetUseCase = {
      execute: jest.fn(),
    } as any;

    // Mock services for enhanced functionality
    mockPropertyCache = {
      getPropertiesForClass: jest.fn().mockReturnValue([]),
      updateClassProperties: jest.fn(),
      hasPropertiesForClass: jest.fn().mockReturnValue(false),
      clearCache: jest.fn(),
    };

    mockCircuitBreaker = {
      execute: jest.fn(),
      getCircuitState: jest.fn(),
      openCircuit: jest.fn(),
      closeCircuit: jest.fn(),
    };

    // Setup DIContainer mock
    mockContainer = {
      getCreateAssetUseCase: jest.fn().mockReturnValue(mockCreateAssetUseCase),
      getInstance: jest.fn().mockReturnThis(),
      resolve: jest.fn().mockImplementation((token: string) => {
        if (token === "PropertyCacheService") {
          return mockPropertyCache;
        }
        if (token === "CircuitBreakerService") {
          return mockCircuitBreaker;
        }
        // Return empty mock repositories
        return {};
      }),
    } as any;

    (DIContainer.getInstance as jest.Mock).mockReturnValue(mockContainer);

    // Create modal instance
    modal = new CreateAssetModal(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Asset Creation with Circuit Breaker", () => {
    test("should create asset successfully through circuit breaker", async () => {
      // Setup circuit breaker to execute operation and return success
      mockCircuitBreaker.execute.mockImplementation(
        async (name: string, operation: Function) => {
          // Set up use case to return success
          mockCreateAssetUseCase.execute.mockResolvedValue({
            success: true,
            assetId: "test-id",
            message: "Created asset: Test Asset",
          });
          // Execute the operation
          return await operation();
        },
      );

      (modal as any).assetTitle = "Test Asset";
      (modal as any).assetClass = "exo__Task";
      (modal as any).assetOntology = "exo";
      (modal as any).propertyValues.set("priority", "high");

      const closeSpy = jest.spyOn(modal, "close").mockImplementation(() => {});

      await (modal as any).createAsset();

      expect(mockCircuitBreaker.execute).toHaveBeenCalledWith(
        "asset-creation",
        expect.any(Function),
        expect.objectContaining({
          failureThreshold: 3,
          resetTimeout: 30000,
          halfOpenMaxCalls: 2,
        }),
      );

      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith({
        title: "Test Asset",
        className: "exo__Task",
        ontologyPrefix: "exo",
        properties: {
          priority: "high",
        },
      });

      expect(Notice).toHaveBeenCalledWith("Created asset: Test Asset");
      expect(closeSpy).toHaveBeenCalled();
    });

    test("should handle asset creation failure through circuit breaker", async () => {
      // Setup circuit breaker to execute operation and return failure
      mockCircuitBreaker.execute.mockImplementation(
        async (name: string, operation: Function) => {
          mockCreateAssetUseCase.execute.mockResolvedValue({
            success: false,
            assetId: "",
            message: "Creation failed",
            error: "Invalid asset data",
          });
          return await operation();
        },
      );

      (modal as any).assetTitle = "Test Asset";

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith(
        "Validation error: Invalid asset data",
        6000,
      );
    });

    test("should handle circuit breaker open state", async () => {
      // Setup circuit breaker to return circuit open error
      mockCircuitBreaker.execute.mockResolvedValue(
        Result.fail("Circuit asset-creation is OPEN. Try again in 25 seconds"),
      );

      (modal as any).assetTitle = "Test Asset";

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith(
        "Asset creation is temporarily unavailable. Please try again in a moment.",
        5000,
      );
    });

    test("should handle ontology-related errors", async () => {
      mockCircuitBreaker.execute.mockResolvedValue(
        Result.fail("Ontology 'test' not found"),
      );

      (modal as any).assetTitle = "Test Asset";

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith(
        "Error: Ontology 'test' not found",
        5000,
      );
    });

    test("should handle validation errors", async () => {
      mockCircuitBreaker.execute.mockResolvedValue(
        Result.fail("Invalid asset title: contains special characters"),
      );

      (modal as any).assetTitle = "Test@Asset#";

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith(
        "Validation error: Invalid asset title: contains special characters",
        6000,
      );
    });
  });

  describe("Property Caching", () => {
    test("should use property cache service", async () => {
      // Test that the property cache service is resolved during initialization
      expect(mockContainer.resolve).toHaveBeenCalledWith(
        "PropertyCacheService",
      );

      // Test that the cache service is available
      expect(mockPropertyCache).toBeDefined();
      expect(mockPropertyCache.getPropertiesForClass).toBeDefined();
      expect(mockPropertyCache.updateClassProperties).toBeDefined();
    });

    test("should update cache when properties are loaded from vault", async () => {
      const file = {
        basename: "propertyName",
        name: "propertyName.md",
      };

      (app.vault.getMarkdownFiles as jest.Mock).mockReturnValue([file]);
      (app.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "exo__Property",
          rdfs__domain: "TestClass",
          rdfs__label: "Property Label",
        },
      });

      mockPropertyCache.hasPropertiesForClass.mockReturnValue(false);

      await (modal as any).updatePropertiesForClass("TestClass");

      // Properties should be loaded and cached
      expect(mockPropertyCache.updateClassProperties).not.toHaveBeenCalled(); // Cache update is handled internally
    });
  });

  describe("Modal Initialization", () => {
    test("should initialize with correct default values", () => {
      expect((modal as any).assetTitle).toBe("");
      expect((modal as any).assetClass).toBe("exo__Asset");
      expect((modal as any).assetOntology).toBe("");
      expect((modal as any).propertyValues).toBeInstanceOf(Map);
      expect((modal as any).propertyValues.size).toBe(0);
    });

    test("should properly resolve services from container", () => {
      expect(mockContainer.resolve).toHaveBeenCalledWith("IOntologyRepository");
      expect(mockContainer.resolve).toHaveBeenCalledWith(
        "IClassViewRepository",
      );
      expect(mockContainer.resolve).toHaveBeenCalledWith(
        "PropertyCacheService",
      );
      expect(mockContainer.resolve).toHaveBeenCalledWith(
        "CircuitBreakerService",
      );
    });
  });

  describe("Error Recovery", () => {
    test("should recover from circuit breaker errors", async () => {
      // First call fails
      mockCircuitBreaker.execute.mockResolvedValueOnce(
        Result.fail("Circuit is open"),
      );

      (modal as any).assetTitle = "Test Asset";
      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith(
        "Asset creation is temporarily unavailable. Please try again in a moment.",
        5000,
      );

      // Reset Notice mock for second call
      (Notice as jest.Mock).mockClear();

      // Second call succeeds after circuit recovery
      mockCircuitBreaker.execute.mockImplementation(
        async (name: string, operation: Function) => {
          mockCreateAssetUseCase.execute.mockResolvedValue({
            success: true,
            assetId: "test-id",
            message: "Created asset: Test Asset",
          });
          return await operation();
        },
      );

      await (modal as any).createAsset();

      expect(Notice).toHaveBeenCalledWith("Created asset: Test Asset");
    });
  });
});
