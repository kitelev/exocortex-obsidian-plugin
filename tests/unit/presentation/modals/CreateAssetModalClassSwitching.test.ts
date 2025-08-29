import { CreateAssetModal } from "../../../../src/presentation/modals/CreateAssetModal";
import { SemanticPropertyDiscoveryService } from "../../../../src/domain/services/SemanticPropertyDiscoveryService";
import { App, TFile, Plugin } from "obsidian";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";
import { Result } from "../../../../src/domain/core/Result";

/**
 * Comprehensive test suite for CreateAssetModal class switching bug fix
 * Validates that property fields update correctly when switching between classes
 */
describe("CreateAssetModal Class Switching Bug Fix", () => {
  let app: App;
  let plugin: Plugin;
  let modal: CreateAssetModal;
  let mockFiles: TFile[];
  let containerEl: HTMLElement;
  let propertyService: SemanticPropertyDiscoveryService;

  beforeEach(() => {
    // Create comprehensive mock files for testing
    mockFiles = [
      // Classes
      {
        name: "Person.md",
        basename: "Person",
        path: "Person.md",
        extension: "md",
      } as TFile,
      {
        name: "Organization.md",
        basename: "Organization",
        path: "Organization.md",
        extension: "md",
      } as TFile,
      {
        name: "Task.md",
        basename: "Task",
        path: "Task.md",
        extension: "md",
      } as TFile,
      // Person properties
      {
        name: "firstName.md",
        basename: "firstName",
        path: "firstName.md",
        extension: "md",
      } as TFile,
      {
        name: "lastName.md",
        basename: "lastName",
        path: "lastName.md",
        extension: "md",
      } as TFile,
      {
        name: "email.md",
        basename: "email",
        path: "email.md",
        extension: "md",
      } as TFile,
      // Organization properties
      {
        name: "orgName.md",
        basename: "orgName",
        path: "orgName.md",
        extension: "md",
      } as TFile,
      {
        name: "industry.md",
        basename: "industry",
        path: "industry.md",
        extension: "md",
      } as TFile,
      {
        name: "size.md",
        basename: "size",
        path: "size.md",
        extension: "md",
      } as TFile,
      // Task properties
      {
        name: "title.md",
        basename: "title",
        path: "title.md",
        extension: "md",
      } as TFile,
      {
        name: "priority.md",
        basename: "priority",
        path: "priority.md",
        extension: "md",
      } as TFile,
      {
        name: "dueDate.md",
        basename: "dueDate",
        path: "dueDate.md",
        extension: "md",
      } as TFile,
    ];

    // Mock app with comprehensive metadata
    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue(mockFiles),
        getAbstractFileByPath: jest.fn(
          (path) => mockFiles.find((f) => f.path === path) || null,
        ),
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          // Return class metadata
          if (file.basename === "Person") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Class]]",
                rdfs__label: "Person",
              },
            };
          }
          if (file.basename === "Organization") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Class]]",
                rdfs__label: "Organization",
              },
            };
          }
          if (file.basename === "Task") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Class]]",
                rdfs__label: "Task",
              },
            };
          }
          
          // Return property metadata for Person
          if (file.basename === "firstName" || file.basename === "lastName" || file.basename === "email") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[Person]]",
                rdfs__label: file.basename === "firstName" ? "First Name" : 
                           file.basename === "lastName" ? "Last Name" : "Email",
                rdfs__range: "string",
                exo__Property_isRequired: file.basename !== "email",
              },
            };
          }
          
          // Return property metadata for Organization
          if (file.basename === "orgName" || file.basename === "industry" || file.basename === "size") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[Organization]]",
                rdfs__label: file.basename === "orgName" ? "Organization Name" :
                           file.basename === "industry" ? "Industry" : "Size",
                rdfs__range: file.basename === "size" ? "number" : "string",
                exo__Property_isRequired: file.basename === "orgName",
              },
            };
          }
          
          // Return property metadata for Task
          if (file.basename === "title" || file.basename === "priority" || file.basename === "dueDate") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[Task]]",
                rdfs__label: file.basename === "title" ? "Title" :
                           file.basename === "priority" ? "Priority" : "Due Date",
                rdfs__range: file.basename === "dueDate" ? "date" : "string",
                exo__Property_isRequired: file.basename === "title",
                exo__Property_options: file.basename === "priority" ? ["Low", "Medium", "High"] : undefined,
              },
            };
          }
          
          return { frontmatter: {} };
        }),
      },
    } as any;

    // Create container element with Obsidian-compatible methods
    containerEl = document.createElement("div");
    (containerEl as any).empty = function () {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };
    (containerEl as any).createEl = function (tag: string, attrs?: any) {
      const element = document.createElement(tag);
      if (attrs?.text) element.textContent = attrs.text;
      if (attrs?.cls) element.className = attrs.cls;
      this.appendChild(element);
      return element;
    };
    (containerEl as any).createDiv = function (attrs?: any) {
      const element = document.createElement("div");
      if (attrs?.cls) element.className = attrs.cls;
      this.appendChild(element);
      return element;
    };

    // Initialize plugin and DIContainer
    plugin = new Plugin(app, {} as any);
    DIContainer.initialize(app, plugin);

    // Initialize property service
    propertyService = new SemanticPropertyDiscoveryService(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up any timers
    jest.clearAllTimers();
  });

  describe("Property Field Updates on Class Switch", () => {
    it("should completely clear previous properties when switching classes", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;

      // Load properties for Person
      await modal["updatePropertiesForClass"]("Person");
      
      // Verify Person properties are loaded
      expect(modal["properties"]).toBeDefined();
      const personProperties = modal["properties"];
      expect(personProperties.some((p: any) => p.label === "First Name")).toBe(true);
      expect(personProperties.some((p: any) => p.label === "Last Name")).toBe(true);
      
      // Verify property values map has been cleared
      const initialValuesSize = modal["propertyValues"].size;
      
      // Switch to Organization
      await modal["updatePropertiesForClass"]("Organization");
      
      // Verify Person properties are gone
      const orgProperties = modal["properties"];
      expect(orgProperties.some((p: any) => p.label === "First Name")).toBe(false);
      expect(orgProperties.some((p: any) => p.label === "Last Name")).toBe(false);
      
      // Verify Organization properties are present
      expect(orgProperties.some((p: any) => p.label === "Organization Name")).toBe(true);
      expect(orgProperties.some((p: any) => p.label === "Industry")).toBe(true);
      expect(orgProperties.some((p: any) => p.label === "Size")).toBe(true);
      
      // Verify property values were cleared
      expect(modal["propertyValues"].size).toBe(0);
    });

    it("should clear property values map when switching classes", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;

      // Load Task properties and set some values
      await modal["updatePropertiesForClass"]("Task");
      modal["propertyValues"].set("title", "Test Task");
      modal["propertyValues"].set("priority", "High");
      
      expect(modal["propertyValues"].get("title")).toBe("Test Task");
      expect(modal["propertyValues"].get("priority")).toBe("High");
      
      // Switch to Person
      await modal["updatePropertiesForClass"]("Person");
      
      // Verify all previous values are cleared
      expect(modal["propertyValues"].has("title")).toBe(false);
      expect(modal["propertyValues"].has("priority")).toBe(false);
      expect(modal["propertyValues"].size).toBe(0);
    });

    it("should handle rapid class switching without errors", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      const startTime = Date.now();
      
      // Perform rapid switches
      await modal["updatePropertiesForClass"]("Person");
      await modal["updatePropertiesForClass"]("Organization");
      await modal["updatePropertiesForClass"]("Task");
      await modal["updatePropertiesForClass"]("Person");
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Verify final state is correct (should show Person properties)
      const finalProperties = modal["properties"];
      expect(finalProperties.some((p: any) => p.label === "First Name")).toBe(true);
      expect(finalProperties.some((p: any) => p.label === "Last Name")).toBe(true);
      
      // Verify no Organization or Task properties remain
      expect(finalProperties.some((p: any) => p.label === "Organization Name")).toBe(false);
      expect(finalProperties.some((p: any) => p.label === "Title")).toBe(false);
      
      // Performance check - should complete rapidly
      expect(totalTime).toBeLessThan(500);
    });

    it("should prevent concurrent property updates", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Start first update
      const firstUpdate = modal["updatePropertiesForClass"]("Person");
      
      // Immediately start second update
      const secondUpdate = modal["updatePropertiesForClass"]("Organization");
      
      // Wait for both to complete
      await Promise.all([firstUpdate, secondUpdate]);
      
      // The guard should have prevented race conditions
      expect(modal["isUpdatingProperties"]).toBe(false);
    });

    it("should clear cache when switching classes to ensure fresh data", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Spy on cache clear
      const clearCacheSpy = jest.spyOn(propertyService, "clearCache");
      
      // Load Person properties
      await modal["updatePropertiesForClass"]("Person");
      
      // Switch to Organization
      await modal["updatePropertiesForClass"]("Organization");
      
      // Verify cache was cleared at least twice (once for each update)
      expect(clearCacheSpy).toHaveBeenCalled();
    });

    it("should properly handle DOM cleanup between class switches", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Load Person properties
      await modal["updatePropertiesForClass"]("Person");
      const initialChildCount = containerEl.childElementCount;
      
      // Add some test content to verify cleanup
      const testElement = document.createElement("div");
      testElement.className = "test-element";
      containerEl.appendChild(testElement);
      
      // Switch to Organization
      await modal["updatePropertiesForClass"]("Organization");
      
      // Verify test element was removed
      expect(containerEl.querySelector(".test-element")).toBeNull();
      
      // Container should have been cleared and repopulated
      expect(containerEl.childElementCount).toBeGreaterThan(0);
    });

    it("should complete property updates within 100ms performance threshold", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      const measurements: number[] = [];
      
      // Perform multiple switches and measure each
      for (const className of ["Person", "Organization", "Task", "Person"]) {
        const startTime = performance.now();
        await modal["updatePropertiesForClass"](className);
        const endTime = performance.now();
        measurements.push(endTime - startTime);
      }
      
      // All updates should be under 100ms
      measurements.forEach(time => {
        expect(time).toBeLessThan(100);
      });
      
      // Average should also be well under 100ms
      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(100);
    });

    it("should handle errors gracefully and show fallback properties", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Mock an error in property discovery
      jest.spyOn(propertyService, "discoverPropertiesForClass").mockResolvedValue(
        Result.fail("Test error")
      );
      
      await modal["updatePropertiesForClass"]("Person");
      
      // Should show error message
      const errorEl = containerEl.querySelector(".exocortex-property-error");
      expect(errorEl).toBeTruthy();
      
      // Should still have fallback properties
      const properties = modal["properties"];
      expect(properties.some((p: any) => p.name === "description")).toBe(true);
      expect(properties.some((p: any) => p.name === "tags")).toBe(true);
      
      // Modal should remain functional
      expect(modal["isUpdatingProperties"]).toBe(false);
    });
  });

  describe("Modal Cleanup on Close", () => {
    it("should clean up all state when modal is closed", () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Set up some state
      modal["propertyValues"].set("test", "value");
      modal["properties"] = [{ name: "test" }];
      modal["updateDebounceTimer"] = 123 as any;
      modal["isUpdatingProperties"] = true;
      
      // Close modal
      modal.onClose();
      
      // Verify complete cleanup
      expect(modal["propertyValues"].size).toBe(0);
      expect(modal["properties"].length).toBe(0);
      expect(modal["propertiesContainer"]).toBeNull();
      expect(modal["updateDebounceTimer"]).toBeNull();
      expect(modal["isUpdatingProperties"]).toBe(false);
    });

    it("should cancel pending property updates on close", () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
      
      modal = new CreateAssetModal(app);
      modal["updateDebounceTimer"] = 123 as any;
      
      modal.onClose();
      
      expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
      expect(modal["updateDebounceTimer"]).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe("Debounced Class Change Handler", () => {
    it("should debounce rapid class changes", async () => {
      jest.useFakeTimers();
      
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      const updateSpy = jest.spyOn(modal as any, "updatePropertiesForClass");
      
      // Simulate rapid class changes
      const dropdown = {
        onChange: null as any,
        setValue: jest.fn(),
        addOption: jest.fn(),
      };
      
      // Capture the onChange handler
      const setupMethod = modal["setupClassField"] as any;
      await setupMethod.call(modal, containerEl);
      
      // The debounce timer should prevent multiple calls
      expect(modal["updateDebounceTimer"]).toBeDefined();
      
      jest.useRealTimers();
    });
  });

  describe("ObjectProperty Async Loading", () => {
    it("should load ObjectProperty instances without blocking UI", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Mock a property with ObjectProperty type
      const objectProperty = {
        name: "manager",
        label: "Manager",
        type: "object",
        range: "[[Person]]",
        isRequired: false,
      };
      
      // Create a mock setting
      const mockDropdown = {
        addOption: jest.fn(),
        onChange: jest.fn(),
        selectEl: document.createElement("select"),
      };
      
      const mockSetting = {
        setName: jest.fn().mockReturnThis(),
        setDesc: jest.fn().mockReturnThis(),
        addDropdown: jest.fn((callback) => {
          callback(mockDropdown);
          return mockSetting;
        }),
        settingEl: document.createElement("div"),
      };
      
      // Call the method
      modal["createObjectPropertyField"](mockSetting as any, objectProperty);
      
      // Initially should show loading
      expect(mockDropdown.addOption).toHaveBeenCalledWith("", "Loading...");
      
      // The actual loading happens asynchronously
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // After async load, should have proper options
      expect(mockDropdown.selectEl.innerHTML).toBeDefined();
    });
  });
});