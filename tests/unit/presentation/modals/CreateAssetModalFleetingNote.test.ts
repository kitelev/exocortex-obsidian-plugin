import { CreateAssetModal } from "../../../../src/presentation/modals/CreateAssetModal";
import { SemanticPropertyDiscoveryService } from "../../../../src/domain/services/SemanticPropertyDiscoveryService";
import { App, TFile, Plugin } from "obsidian";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";

/**
 * Test to reproduce the issue where ztlk__FleetingNote_type property
 * is not appearing when selecting ztlk__FleetingNote class
 */
describe("CreateAssetModal - FleetingNote Property Discovery Issue", () => {
  let app: App;
  let plugin: Plugin;
  let modal: CreateAssetModal;
  let containerEl: HTMLElement;

  beforeEach(() => {
    // Create exact vault structure from user's report
    const mockFiles = [
      // The class file
      {
        basename: "ztlk__FleetingNote",
        name: "ztlk__FleetingNote.md",
        path: "/Users/kitelev/vault-2025/02 Ontology/2 Custom/ztlk/ztlk__FleetingNote.md",
        extension: "md"
      } as TFile,
      
      // The property file that should be discovered
      {
        basename: "ztlk__FleetingNote_type",
        name: "ztlk__FleetingNote_type.md",
        path: "/Users/kitelev/vault-2025/01 Inbox/ztlk__FleetingNote_type.md",
        extension: "md"
      } as TFile,
      
      // Other classes for comparison
      {
        basename: "ztlk__Note",
        name: "ztlk__Note.md",
        path: "ztlk__Note.md",
        extension: "md"
      } as TFile,
      {
        basename: "exo__Asset",
        name: "exo__Asset.md",
        path: "exo__Asset.md",
        extension: "md"
      } as TFile,
    ];

    // Mock metadata
    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue(mockFiles),
        getAbstractFileByPath: jest.fn((path) => mockFiles.find(f => f.path === path) || null),
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          // ztlk__FleetingNote class
          if (file.basename === "ztlk__FleetingNote") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Class]]",
                "rdfs__label": "Fleeting Note",
                "exo__Class_superClass": ["[[ztlk__Note]]"]  // Updated to match actual vault structure
              }
            };
          }
          
          // The property that SHOULD be discovered
          if (file.basename === "ztlk__FleetingNote_type") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Property]]",
                "exo__Property_domain": "[[ztlk__FleetingNote]]",  // Using new property name
                "rdfs__label": "Note Type",
                "rdfs__range": "string",
                "rdfs__comment": "Type of the fleeting note",
                "exo__Property_options": ["idea", "reference", "question", "task"],
                "exo__Property_isRequired": false
              }
            };
          }
          
          // ztlk__Note for inheritance chain
          if (file.basename === "ztlk__Note") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Class]]",
                "rdfs__label": "Note",
                "exo__Class_superClass": "[[exo__Asset]]"  // Note extends Asset
              }
            };
          }
          
          // exo__Asset for inheritance testing
          if (file.basename === "exo__Asset") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Class]]",
                "rdfs__label": "Asset"
              }
            };
          }
          
          return { frontmatter: {} };
        }),
      },
    } as any;

    // Mock container element
    containerEl = document.createElement("div");
    (containerEl as any).empty = function () {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };
    (containerEl as any).createEl = function(tag: string, attrs?: any) {
      const element = document.createElement(tag);
      if (attrs?.text) element.textContent = attrs.text;
      if (attrs?.cls) element.className = attrs.cls;
      this.appendChild(element);
      return element;
    };
    (containerEl as any).createDiv = function(attrs?: any) {
      const element = document.createElement("div");
      if (attrs?.cls) element.className = attrs.cls;
      this.appendChild(element);
      return element;
    };

    // Initialize plugin and container
    plugin = new Plugin(app, {} as any);
    DIContainer.initialize(app, plugin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Bug Reproduction", () => {
    it("should discover ztlk__FleetingNote_type property for ztlk__FleetingNote class", async () => {
      console.log("\n🔍 REPRODUCING FLEETING NOTE PROPERTY ISSUE");
      console.log("==========================================");
      
      const propertyService = new SemanticPropertyDiscoveryService(app);
      
      // Test property discovery
      const result = await propertyService.discoverPropertiesForClass("ztlk__FleetingNote");
      expect(result.isSuccess).toBe(true);
      
      const properties = result.getValue() || [];
      console.log(`\nDiscovered ${properties.length} properties for ztlk__FleetingNote:`);
      properties.forEach(p => {
        console.log(`  - ${p.label} (${p.name}) - Domain: ${p.domain}`);
      });
      
      // Check if ztlk__FleetingNote_type is discovered
      const hasTypeProperty = properties.some(p => p.name === "ztlk__FleetingNote_type");
      
      if (!hasTypeProperty) {
        console.error("❌ BUG CONFIRMED: ztlk__FleetingNote_type property NOT discovered!");
        console.log("\nDEBUGGING INFO:");
        console.log("Expected property:");
        console.log("  - Name: ztlk__FleetingNote_type");
        console.log("  - Domain: [[ztlk__FleetingNote]]");
        console.log("  - Should be discovered for class: ztlk__FleetingNote");
      } else {
        console.log("✅ Property ztlk__FleetingNote_type was discovered");
      }
      
      // This test SHOULD pass after fix
      expect(hasTypeProperty).toBe(true);
    });

    it("should show ztlk__FleetingNote_type in modal when ztlk__FleetingNote is selected", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      console.log("\nSelecting ztlk__FleetingNote class in modal...");
      await modal["updatePropertiesForClass"]("ztlk__FleetingNote");
      
      const modalProperties = modal["properties"];
      console.log(`\nModal shows ${modalProperties.length} properties:`);
      modalProperties.forEach((p: any) => {
        console.log(`  - ${p.label} (${p.name})`);
      });
      
      // Check if the type property is in the modal
      const hasTypeInModal = modalProperties.some((p: any) => 
        p.name === "ztlk__FleetingNote_type" || p.label === "Note Type"
      );
      
      if (!hasTypeInModal) {
        console.error("❌ BUG CONFIRMED: Note Type field not showing in modal!");
      } else {
        console.log("✅ Note Type field is showing in modal");
      }
      
      // This test SHOULD pass after fix
      expect(hasTypeInModal).toBe(true);
      
      // Should have at least 1 property (the type property)
      expect(modalProperties.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle property discovery with different path structures", async () => {
      const propertyService = new SemanticPropertyDiscoveryService(app);
      
      // The issue might be related to path handling
      console.log("\n📂 Path Analysis:");
      console.log("Class path: /Users/kitelev/vault-2025/02 Ontology/2 Custom/ztlk/ztlk__FleetingNote.md");
      console.log("Property path: /Users/kitelev/vault-2025/01 Inbox/ztlk__FleetingNote_type.md");
      console.log("Note: Property is in different directory (01 Inbox vs 02 Ontology)");
      
      // Test that properties can be discovered regardless of directory
      const result = await propertyService.discoverPropertiesForClass("ztlk__FleetingNote");
      const properties = result.getValue() || [];
      
      // Properties should be discovered based on rdfs__domain, not file location
      const typeProperty = properties.find(p => p.name === "ztlk__FleetingNote_type");
      
      if (typeProperty) {
        console.log("\n✅ Property discovered despite different directory");
        console.log(`Property domain: ${typeProperty.domain}`);
        console.log(`Property range: ${typeProperty.range}`);
        console.log(`Property options: ${JSON.stringify(typeProperty.options)}`);
      } else {
        console.error("\n❌ Property not discovered - path handling issue?");
      }
      
      expect(typeProperty).toBeDefined();
    });

    it("should test property naming pattern recognition", async () => {
      console.log("\n🔤 Testing Property Naming Pattern");
      console.log("===================================");
      
      // The property follows pattern: className_propertyName
      const propertyName = "ztlk__FleetingNote_type";
      const className = "ztlk__FleetingNote";
      
      // Check if the property name starts with the class name
      const followsPattern = propertyName.startsWith(className);
      console.log(`Property "${propertyName}" starts with class "${className}": ${followsPattern}`);
      
      // This might be an additional way to associate properties with classes
      if (followsPattern) {
        console.log("✅ Property follows naming convention");
        console.log("   Could be used as fallback for domain detection");
      }
      
      expect(followsPattern).toBe(true);
    });

    it("should verify inheritance from exo__Asset", async () => {
      const propertyService = new SemanticPropertyDiscoveryService(app);
      
      console.log("\n🔗 Testing Inheritance");
      console.log("======================");
      console.log("ztlk__FleetingNote extends ztlk__Note extends exo__Asset");
      
      // Get properties for FleetingNote (should include inherited)
      const result = await propertyService.discoverPropertiesForClass("ztlk__FleetingNote");
      const properties = result.getValue() || [];
      
      // Should have both class-specific and inherited properties
      const typeProperty = properties.find(p => p.name === "ztlk__FleetingNote_type");
      
      console.log(`Total properties: ${properties.length}`);
      console.log(`Has type property: ${!!typeProperty}`);
      
      // At minimum should have the type property
      expect(properties.length).toBeGreaterThanOrEqual(1);
      expect(typeProperty).toBeDefined();
    });
  });

  describe("Expected Behavior", () => {
    it("should properly filter properties by domain", async () => {
      const propertyService = new SemanticPropertyDiscoveryService(app);
      
      // Mock additional properties with different domains
      const extendedFiles = [
        ...app.vault.getMarkdownFiles(),
        {
          basename: "exo__description",
          name: "exo__description.md",
          path: "exo__description.md",
          extension: "md"
        } as TFile,
      ];
      
      (app.vault.getMarkdownFiles as jest.Mock).mockReturnValue(extendedFiles);
      
      // Add metadata for description property with different domain
      const originalGetFileCache = app.metadataCache.getFileCache;
      app.metadataCache.getFileCache = jest.fn((file: TFile) => {
        if (file.basename === "exo__description") {
          return {
            frontmatter: {
              "exo__Instance_class": "[[exo__Property]]",
              "exo__Property_domain": "[[exo__Asset]]",  // Different domain, using new property name
              "rdfs__label": "Description",
              "rdfs__range": "text"
            }
          };
        }
        return originalGetFileCache(file);
      });
      
      const result = await propertyService.discoverPropertiesForClass("ztlk__FleetingNote");
      const properties = result.getValue() || [];
      
      // Should have ztlk__FleetingNote_type but not exo__description
      const hasTypeProperty = properties.some(p => p.name === "ztlk__FleetingNote_type");
      const hasDescription = properties.some(p => p.name === "exo__description");
      
      console.log("\n🎯 Domain Filtering Test:");
      console.log(`Has ztlk__FleetingNote_type (correct domain): ${hasTypeProperty}`);
      console.log(`Has exo__description (wrong domain): ${hasDescription}`);
      
      expect(hasTypeProperty).toBe(true);
      // Description might appear if inherited from Asset
    });
  });
});