import { CreateAssetModal } from "../../../../src/presentation/modals/CreateAssetModal";
import { SemanticPropertyDiscoveryService } from "../../../../src/domain/services/SemanticPropertyDiscoveryService";
import { App, TFile, Plugin } from "obsidian";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";
import { Result } from "../../../../src/domain/core/Result";

/**
 * Test suite to detect and verify fix for field duplication bug in CreateAssetModal
 */
describe("CreateAssetModal Field Duplication Bug Detection", () => {
  let app: App;
  let plugin: Plugin;
  let modal: CreateAssetModal;
  let mockFiles: TFile[];
  let containerEl: HTMLElement;
  let propertyService: SemanticPropertyDiscoveryService;

  beforeEach(() => {
    // Create mock files for ems__Effort class
    mockFiles = [
      {
        name: "ems__Effort.md",
        basename: "ems__Effort",
        path: "ems__Effort.md",
        extension: "md",
      } as TFile,
      // Some properties for Effort
      {
        name: "ems__title.md",
        basename: "ems__title",
        path: "ems__title.md",
        extension: "md",
      } as TFile,
      {
        name: "ems__description.md",
        basename: "ems__description",
        path: "ems__description.md",
        extension: "md",
      } as TFile,
      {
        name: "ems__status.md",
        basename: "ems__status",
        path: "ems__status.md",
        extension: "md",
      } as TFile,
    ];

    // Mock app with metadata
    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue(mockFiles),
        getAbstractFileByPath: jest.fn(
          (path) => mockFiles.find((f) => f.path === path) || null,
        ),
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          if (file.basename === "ems__Effort") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Class]]",
                rdfs__label: "Effort",
              },
            };
          }
          
          // Properties for Effort
          if (file.basename === "ems__title") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[ems__Effort]]",
                rdfs__label: "Title",
                rdfs__range: "string",
                exo__Property_isRequired: true,
              },
            };
          }
          
          if (file.basename === "ems__description") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[ems__Effort]]",
                rdfs__label: "Description",
                rdfs__range: "text",
              },
            };
          }
          
          if (file.basename === "ems__status") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[ems__Effort]]",
                rdfs__label: "Status",
                rdfs__range: "string",
                exo__Property_options: ["Not Started", "In Progress", "Completed"],
              },
            };
          }
          
          return { frontmatter: {} };
        }),
      },
    } as any;

    // Create container element
    containerEl = document.createElement("div");
    (containerEl as any).empty = function () {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };

    // Initialize plugin and DIContainer
    plugin = new Plugin(app, {} as any);
    DIContainer.initialize(app, plugin);

    // Initialize property service
    propertyService = new SemanticPropertyDiscoveryService(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Field Duplication Detection", () => {
    it("should NOT include core properties in discovered properties", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;

      // Discover properties for ems__Effort
      const result = await propertyService.discoverPropertiesForClass("ems__Effort");
      expect(result.isSuccess).toBe(true);
      
      const properties = result.getValue() || [];
      
      // Core properties that should NOT be in the list
      const corePropertyNames = [
        "exo__Asset_uid",
        "exo__Asset_isDefinedBy", 
        "exo__Instance_class",
        "exo__Asset_createdAt",
        "exo__Asset_updatedAt",
        "exo__Asset_version",
        "exo__Asset_label"
      ];
      
      // Check that none of the core properties are in the discovered list
      for (const corePropName of corePropertyNames) {
        const hasCoreProperty = properties.some(p => p.name === corePropName);
        if (hasCoreProperty) {
          console.error(`DUPLICATION BUG: Core property "${corePropName}" should not be in discovered properties`);
        }
        expect(hasCoreProperty).toBe(false);
      }
      
      // Should only have class-specific properties
      const propertyNames = properties.map(p => p.name);
      console.log("Discovered properties:", propertyNames);
      
      // Should have the ems__Effort specific properties
      expect(propertyNames).toContain("ems__title");
      expect(propertyNames).toContain("ems__description");
      expect(propertyNames).toContain("ems__status");
    });

    it("should filter out core properties in CreateAssetModal", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;

      // Update properties for ems__Effort
      await modal["updatePropertiesForClass"]("ems__Effort");
      
      // Get the properties that will be rendered
      const modalProperties = modal["properties"];
      
      // Check that core properties are filtered out
      const hasInstanceClass = modalProperties.some((p: any) => 
        p.name === "exo__Instance_class" || p.label === "Instance Class"
      );
      const hasUniqueId = modalProperties.some((p: any) => 
        p.name === "exo__Asset_uid" || p.label === "Unique ID"
      );
      const hasDefinedBy = modalProperties.some((p: any) => 
        p.name === "exo__Asset_isDefinedBy" || p.label === "Defined By"
      );
      
      if (hasInstanceClass) {
        console.error("DUPLICATION BUG: Instance Class should not appear in properties");
      }
      if (hasUniqueId) {
        console.error("DUPLICATION BUG: Unique ID should not appear in properties");
      }
      if (hasDefinedBy) {
        console.error("DUPLICATION BUG: Defined By should not appear in properties");
      }
      
      expect(hasInstanceClass).toBe(false);
      expect(hasUniqueId).toBe(false);
      expect(hasDefinedBy).toBe(false);
      
      // Should only have user-editable properties
      const propertyLabels = modalProperties.map((p: any) => p.label);
      console.log("Modal properties:", propertyLabels);
      
      // Should have the class-specific properties
      expect(propertyLabels).toContain("Title");
      expect(propertyLabels).toContain("Description");
      expect(propertyLabels).toContain("Status");
    });

    it("should not create duplicate fields when rendering properties", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Mock the Setting class to track created fields
      const createdFields: { name: string; description: string }[] = [];
      
      jest.mock("obsidian", () => ({
        ...jest.requireActual("obsidian"),
        Setting: jest.fn().mockImplementation(() => ({
          setName: jest.fn(function(name: string) {
            createdFields.push({ name, description: "" });
            return this;
          }),
          setDesc: jest.fn(function(desc: string) {
            if (createdFields.length > 0) {
              createdFields[createdFields.length - 1].description = desc;
            }
            return this;
          }),
          addText: jest.fn().mockReturnThis(),
          addDropdown: jest.fn().mockReturnThis(),
          addToggle: jest.fn().mockReturnThis(),
          addTextArea: jest.fn().mockReturnThis(),
          settingEl: document.createElement("div"),
        })),
      }));
      
      await modal["updatePropertiesForClass"]("ems__Effort");
      
      // Check for duplicates in created fields
      const fieldNames = modal["properties"].map((p: any) => p.label);
      const uniqueNames = [...new Set(fieldNames)];
      
      if (fieldNames.length !== uniqueNames.length) {
        console.error(`DUPLICATION BUG: Found duplicate fields`);
        const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
        console.error("Duplicate fields:", duplicates);
      }
      
      expect(fieldNames.length).toBe(uniqueNames.length);
    });

    it("should have correct property count without core properties", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;

      await modal["updatePropertiesForClass"]("ems__Effort");
      
      const properties = modal["properties"];
      
      // Should have exactly 3 properties (title, description, status)
      // NOT 6+ properties (which would include core properties)
      expect(properties.length).toBe(3);
      
      if (properties.length > 3) {
        console.error(`DUPLICATION BUG: Expected 3 properties, but found ${properties.length}`);
        console.error("Properties:", properties.map((p: any) => p.name));
      }
    });
  });

  describe("Visual Verification", () => {
    it("should log property discovery details for debugging", async () => {
      const consoleSpy = jest.spyOn(console, "log");
      
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;

      await modal["updatePropertiesForClass"]("ems__Effort");
      
      // Check console logs for property discovery
      const logs = consoleSpy.mock.calls.map(call => call[0]);
      const discoveryLog = logs.find(log => log.includes("Discovered"));
      
      if (discoveryLog) {
        console.log("Property discovery log:", discoveryLog);
        
        // Should mention filtering if core properties were removed
        const filterLog = logs.find(log => log.includes("Filtered") || log.includes("core properties"));
        if (filterLog) {
          console.log("Filtering log:", filterLog);
        }
      }
      
      consoleSpy.mockRestore();
    });
  });
});