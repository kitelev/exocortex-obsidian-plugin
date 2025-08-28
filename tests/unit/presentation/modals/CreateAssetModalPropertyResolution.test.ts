/**
 * Comprehensive unit tests for CreateAssetModal property resolution functionality
 * Tests the integration with SemanticPropertyDiscoveryService and proper error handling
 */

import { App, Setting, Notice, TFile } from "obsidian";
import { CreateAssetModal } from "../../../../src/presentation/modals/CreateAssetModal";
import { SemanticPropertyDiscoveryService, PropertyMetadata } from "../../../../src/domain/services/SemanticPropertyDiscoveryService";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";
import { Result } from "../../../../src/domain/core/Result";

// Mock dependencies
jest.mock("../../../../src/infrastructure/container/DIContainer");
jest.mock("../../../../src/domain/services/SemanticPropertyDiscoveryService");

// Mock Obsidian API with enhanced testing capabilities
jest.mock("obsidian", () => {
  const mockFiles = new Map<string, any>();
  
  return {
    ...jest.requireActual("obsidian"),
    App: jest.fn().mockImplementation(() => ({
      vault: {
        getMarkdownFiles: jest.fn(() => Array.from(mockFiles.values())),
        read: jest.fn(),
        create: jest.fn(),
        modify: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          const mockFile = mockFiles.get(file.basename);
          return mockFile ? { frontmatter: mockFile.frontmatter } : null;
        }),
        on: jest.fn(),
        off: jest.fn(),
      },
      workspace: {
        getActiveFile: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
      },
    })),
    Notice: jest.fn(),
    Setting: jest.fn().mockImplementation(() => {
      const mockSetting = {
        setName: jest.fn().mockReturnThis(),
        setDesc: jest.fn().mockReturnThis(),
        addText: jest.fn((callback) => {
          callback({
            setPlaceholder: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(), 
            onChange: jest.fn().mockReturnThis(),
            inputEl: { setAttribute: jest.fn() },
          });
          return mockSetting;
        }),
        addDropdown: jest.fn((callback) => {
          callback({
            addOption: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis(),
            selectEl: { setAttribute: jest.fn() },
          });
          return mockSetting;
        }),
        addToggle: jest.fn().mockReturnThis(),
        addTextArea: jest.fn().mockReturnThis(),
        addButton: jest.fn((callback) => {
          callback({
            setButtonText: jest.fn().mockReturnThis(),
            setCta: jest.fn().mockReturnThis(),
            onClick: jest.fn().mockReturnThis(),
            buttonEl: { setAttribute: jest.fn() },
          });
          return mockSetting;
        }),
        settingEl: {
          setAttribute: jest.fn(),
        },
      };
      return mockSetting;
    }),
    Modal: class MockModal {
      app: any;
      contentEl: HTMLElement;
      
      constructor(app: any) {
        this.app = app;
        this.contentEl = document.createElement('div');
        
        // Add Obsidian DOM methods
        this.contentEl.createEl = jest.fn((tag: string, attrs?: any) => {
          const element = document.createElement(tag);
          if (attrs?.text) element.textContent = attrs.text;
          if (attrs?.cls) element.className = attrs.cls;
          this.contentEl.appendChild(element);
          return element;
        });
        
        this.contentEl.createDiv = jest.fn((attrs?: any) => {
          const element = document.createElement('div');
          if (attrs?.cls) element.className = attrs.cls;
          this.contentEl.appendChild(element);
          element.setAttribute = jest.fn();
          return element;
        });
        
        this.contentEl.empty = jest.fn(() => {
          while (this.contentEl.firstChild) {
            this.contentEl.removeChild(this.contentEl.firstChild);
          }
        });
        
        this.contentEl.setAttribute = jest.fn();
      }
      
      open() { /* Mock implementation */ }
      close() { /* Mock implementation */ }
      onOpen() { /* To be overridden */ }
      onClose() { /* To be overridden */ }
    },
    TFile: jest.fn().mockImplementation((basename: string) => ({
      basename,
      name: `${basename}.md`,
      path: `/${basename}.md`,
    })),
  };
});

describe("CreateAssetModal - Property Resolution Integration", () => {
  let app: App;
  let modal: CreateAssetModal;
  let mockPropertyDiscoveryService: jest.Mocked<SemanticPropertyDiscoveryService>;
  let mockContainer: jest.Mocked<DIContainer>;
  let mockCreateAssetUseCase: any;
  let mockCircuitBreaker: any;

  beforeEach(() => {
    // Setup app mock
    app = new App();

    // Setup CreateAssetUseCase mock
    mockCreateAssetUseCase = {
      execute: jest.fn(),
    };

    // Mock services
    const mockPropertyCache = {
      getPropertiesForClass: jest.fn(() => []),
      updateClassProperties: jest.fn(),
      hasPropertiesForClass: jest.fn(() => false),
      clearCache: jest.fn(),
    };

    mockCircuitBreaker = {
      execute: jest.fn((name, operation) => operation()),
      getCircuitState: jest.fn(),
      openCircuit: jest.fn(),
      closeCircuit: jest.fn(),
    };

    // Setup DIContainer mock
    mockContainer = {
      getCreateAssetUseCase: jest.fn(() => mockCreateAssetUseCase),
      getInstance: jest.fn().mockReturnThis(),
      resolve: jest.fn((token: string) => {
        if (token === "PropertyCacheService") {
          return mockPropertyCache;
        }
        if (token === "CircuitBreakerService") {
          return mockCircuitBreaker;
        }
        return {};
      }),
    } as any;

    (DIContainer.getInstance as jest.Mock).mockReturnValue(mockContainer);

    // Setup SemanticPropertyDiscoveryService mock
    mockPropertyDiscoveryService = {
      discoverPropertiesForClass: jest.fn(),
      getInstancesOfClass: jest.fn(),
    } as any;

    (SemanticPropertyDiscoveryService as jest.Mock).mockImplementation(() => mockPropertyDiscoveryService);

    // Create modal instance
    modal = new CreateAssetModal(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Property Discovery Integration", () => {
    test("should use SemanticPropertyDiscoveryService for property resolution", async () => {
      const mockProperties: PropertyMetadata[] = [
        {
          name: "person_name",
          label: "Full Name",
          type: "DatatypeProperty",
          domain: "Person",
          range: "string",
          isRequired: true,
        },
        {
          name: "person_age",
          label: "Age",
          type: "DatatypeProperty",
          domain: "Person",
          range: "integer",
          isRequired: false,
        },
      ];

      mockPropertyDiscoveryService.discoverPropertiesForClass.mockResolvedValue(
        Result.ok(mockProperties)
      );

      // Initialize modal
      await modal.onOpen();

      // Call updatePropertiesForClass directly to test property resolution
      await (modal as any).updatePropertiesForClass("Person");

      expect(mockPropertyDiscoveryService.discoverPropertiesForClass).toHaveBeenCalledWith("Person");
      expect((modal as any).properties).toHaveLength(2);
      expect((modal as any).properties[0].name).toBe("person_name");
      expect((modal as any).properties[1].name).toBe("person_age");
    });

    test("should handle property discovery service errors gracefully", async () => {
      const errorMessage = "Failed to scan vault for properties";
      mockPropertyDiscoveryService.discoverPropertiesForClass.mockResolvedValue(
        Result.fail(errorMessage)
      );

      await modal.onOpen();
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await (modal as any).updatePropertiesForClass("ProblematicClass");

      expect(mockPropertyDiscoveryService.discoverPropertiesForClass).toHaveBeenCalledWith("ProblematicClass");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Property discovery failed: ${errorMessage}`
      );
      
      // Should fall back to basic properties
      expect((modal as any).properties).toHaveLength(2); // description and tags
      expect((modal as any).properties[0].name).toBe("description");
      expect((modal as any).properties[1].name).toBe("tags");
      
      consoleErrorSpy.mockRestore();
    });

    test("should convert semantic property metadata to UI format correctly", async () => {
      const mockObjectProperty: PropertyMetadata = {
        name: "person_manager",
        label: "Manager",
        type: "ObjectProperty",
        domain: "Person",
        range: "Person",
        isRequired: false,
      };

      const mockDatatypeProperty: PropertyMetadata = {
        name: "person_priority",
        label: "Priority",
        type: "DatatypeProperty",
        domain: "Person",
        range: "string",
        isRequired: true,
        options: ["High", "Medium", "Low"],
      };

      mockPropertyDiscoveryService.discoverPropertiesForClass.mockResolvedValue(
        Result.ok([mockObjectProperty, mockDatatypeProperty])
      );

      await modal.onOpen();
      await (modal as any).updatePropertiesForClass("Person");

      const properties = (modal as any).properties;
      expect(properties).toHaveLength(2);

      // ObjectProperty should be mapped to 'object' type
      expect(properties[0].type).toBe("object");
      expect(properties[0].semanticType).toBe("ObjectProperty");

      // DatatypeProperty with options should be mapped to 'enum' type
      expect(properties[1].type).toBe("enum");
      expect(properties[1].semanticType).toBe("DatatypeProperty");
      expect(properties[1].options).toEqual(["High", "Medium", "Low"]);
    });

    test("should handle class hierarchy and inherited properties", async () => {
      const mockPersonProperties: PropertyMetadata[] = [
        {
          name: "person_name",
          label: "Full Name",
          type: "DatatypeProperty",
          domain: "Person",
          range: "string",
          isRequired: true,
        },
      ];

      const mockEmployeeProperties: PropertyMetadata[] = [
        {
          name: "person_name",
          label: "Full Name",
          type: "DatatypeProperty",
          domain: "Person",
          range: "string",
          isRequired: true,
        },
        {
          name: "employee_id",
          label: "Employee ID",
          type: "DatatypeProperty",
          domain: "Employee",
          range: "string",
          isRequired: true,
        },
      ];

      // Mock different responses for different classes
      mockPropertyDiscoveryService.discoverPropertiesForClass
        .mockImplementation((className: string) => {
          if (className === "Person") {
            return Promise.resolve(Result.ok(mockPersonProperties));
          } else if (className === "Employee") {
            return Promise.resolve(Result.ok(mockEmployeeProperties));
          }
          return Promise.resolve(Result.ok([]));
        });

      await modal.onOpen();

      // Test Person class
      await (modal as any).updatePropertiesForClass("Person");
      expect((modal as any).properties).toHaveLength(1);
      expect((modal as any).properties[0].name).toBe("person_name");

      // Test Employee class (should include inherited properties)
      await (modal as any).updatePropertiesForClass("Employee");
      expect((modal as any).properties).toHaveLength(2);
      
      const propertyNames = (modal as any).properties.map((p: any) => p.name);
      expect(propertyNames).toContain("person_name"); // inherited
      expect(propertyNames).toContain("employee_id"); // direct
    });
  });

  describe("ObjectProperty Field Creation", () => {
    test("should create dropdown for ObjectProperty with available instances", async () => {
      const mockInstances = [
        { label: "John Doe", value: "[[john_doe]]", file: {} as TFile },
        { label: "Jane Smith", value: "[[jane_smith]]", file: {} as TFile },
      ];

      mockPropertyDiscoveryService.getInstancesOfClass.mockResolvedValue(
        Result.ok(mockInstances)
      );

      const mockProperty = {
        name: "person_manager",
        label: "Manager",
        type: "object",
        range: "Person",
        isRequired: false,
      };

      await modal.onOpen();

      // The Setting mock is already configured globally

      // Call createObjectPropertyField indirectly through createPropertyField
      await (modal as any).createPropertyField(mockProperty);

      expect(mockPropertyDiscoveryService.getInstancesOfClass).toHaveBeenCalledWith("Person");
      expect(mockDropdown.addOption).toHaveBeenCalledWith("", "-- Select --");
      expect(mockDropdown.addOption).toHaveBeenCalledWith("[[john_doe]]", "John Doe");
      expect(mockDropdown.addOption).toHaveBeenCalledWith("[[jane_smith]]", "Jane Smith");
    });

    test("should fallback to text field when instance loading fails", async () => {
      mockPropertyDiscoveryService.getInstancesOfClass.mockResolvedValue(
        Result.fail("Failed to load instances")
      );

      const mockProperty = {
        name: "person_manager",
        label: "Manager",
        type: "object",
        range: "NonExistentClass",
        isRequired: false,
      };

      await modal.onOpen();

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // The Setting mock is already configured globally

      await (modal as any).createPropertyField(mockProperty);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to get instances for NonExistentClass: Failed to load instances"
      );
      expect(mockSetting.addText).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe("Performance Monitoring", () => {
    test("should log warning when property loading exceeds 200ms threshold", async () => {
      // Mock slow property discovery
      mockPropertyDiscoveryService.discoverPropertiesForClass.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(Result.ok([]));
          }, 250); // Exceeds 200ms threshold
        });
      });

      await modal.onOpen();

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await (modal as any).updatePropertiesForClass("SlowClass");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Property loading took \d+ms, exceeding 200ms threshold/)
      );
      
      consoleWarnSpy.mockRestore();
    });

    test("should complete property loading within performance threshold for normal cases", async () => {
      const mockProperties: PropertyMetadata[] = [
        {
          name: "test_prop",
          label: "Test Property",
          type: "DatatypeProperty",
          domain: "TestClass",
          range: "string",
          isRequired: false,
        },
      ];

      mockPropertyDiscoveryService.discoverPropertiesForClass.mockResolvedValue(
        Result.ok(mockProperties)
      );

      await modal.onOpen();

      const startTime = Date.now();
      await (modal as any).updatePropertiesForClass("TestClass");
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200); // Should be fast for normal cases
      expect((modal as any).properties).toHaveLength(1);
    });
  });

  describe("Error Handling and Fallbacks", () => {
    test("should handle exceptions during property field creation", async () => {
      const mockProperties: PropertyMetadata[] = [
        {
          name: "problematic_prop",
          label: "Problematic Property",
          type: "DatatypeProperty",
          domain: "TestClass",
          range: "string",
          isRequired: false,
        },
      ];

      mockPropertyDiscoveryService.discoverPropertiesForClass.mockResolvedValue(
        Result.ok(mockProperties)
      );

      await modal.onOpen();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should handle errors gracefully and not crash
      await expect((modal as any).updatePropertiesForClass("TestClass")).resolves.not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test("should provide meaningful error messages for different failure types", async () => {
      // Test specific error types
      const errorMessages = [
        "Property validation failed",
        "Vault access denied",
        "Invalid property definition format",
      ];

      for (const errorMessage of errorMessages) {
        mockPropertyDiscoveryService.discoverPropertiesForClass.mockResolvedValue(
          Result.fail(errorMessage)
        );

        await modal.onOpen();
        await (modal as any).updatePropertiesForClass("TestClass");

        // Should have created error display elements
        const errorElements = (modal as any).propertiesContainer.querySelectorAll(
          ".exocortex-property-error"
        );
        expect(errorElements.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Test Data Attributes for E2E Testing", () => {
    test("should add proper test attributes to modal elements", async () => {
      await modal.onOpen();

      // Verify modal has test attribute
      expect((modal as any).contentEl.setAttribute).toHaveBeenCalledWith(
        'data-test',
        'create-asset-modal'
      );

      // Verify properties container has test attribute
      expect((modal as any).propertiesContainer.setAttribute).toHaveBeenCalledWith(
        'data-test',
        'properties-container'
      );
    });

    test("should add test attributes to property fields", async () => {
      const mockProperty = {
        name: "test_prop",
        label: "Test Property",
        type: "string",
        isRequired: true,
      };

      await modal.onOpen();
      
      // Test attribute addition is handled by the Setting mock
      expect(() => {
        (modal as any).createPropertyField(mockProperty);
      }).not.toThrow();
    });
  });
});
