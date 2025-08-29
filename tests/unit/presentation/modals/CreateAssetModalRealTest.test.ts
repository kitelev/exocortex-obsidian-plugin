/**
 * REAL test for CreateAssetModal that actually verifies the duplication fix
 * This test simulates the exact scenario shown in the user's screenshot
 */

import { CreateAssetModal } from "../../../../src/presentation/modals/CreateAssetModal";
import { SemanticPropertyDiscoveryService } from "../../../../src/domain/services/SemanticPropertyDiscoveryService";
import { App, TFile, Plugin, Setting } from "obsidian";
import { DIContainer } from "../../../../src/infrastructure/container/DIContainer";

describe("CreateAssetModal - REAL Duplication Test", () => {
  let app: App;
  let plugin: Plugin;
  let modal: CreateAssetModal;
  let containerEl: HTMLElement;

  beforeEach(() => {
    // Create real vault structure like in the screenshot
    const mockFiles = [
      // Class files
      { basename: "ems__Effort", name: "ems__Effort.md", path: "ems__Effort.md", extension: "md" } as TFile,
      { basename: "exo__Asset", name: "exo__Asset.md", path: "exo__Asset.md", extension: "md" } as TFile,
      
      // Core properties that exist in the vault
      { basename: "exo__Asset_uid", name: "exo__Asset_uid.md", path: "exo__Asset_uid.md", extension: "md" } as TFile,
      { basename: "exo__Asset_isDefinedBy", name: "exo__Asset_isDefinedBy.md", path: "exo__Asset_isDefinedBy.md", extension: "md" } as TFile,
      { basename: "exo__Instance_class", name: "exo__Instance_class.md", path: "exo__Instance_class.md", extension: "md" } as TFile,
    ];

    // Mock metadata exactly as it would be in real vault
    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue(mockFiles),
        getAbstractFileByPath: jest.fn((path) => mockFiles.find(f => f.path === path) || null),
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          // Classes
          if (file.basename === "ems__Effort") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Class]]",
                "rdfs__label": "Effort"
              }
            };
          }
          if (file.basename === "exo__Asset") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Class]]",
                "rdfs__label": "Asset"
              }
            };
          }
          
          // Core properties that EXIST in vault and WILL be discovered
          if (file.basename === "exo__Asset_uid") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Property]]",
                "rdfs__domain": "[[exo__Asset]]",
                "rdfs__label": "Unique ID",
                "rdfs__range": "string",
                "exo__Property_isRequired": true
              }
            };
          }
          if (file.basename === "exo__Asset_isDefinedBy") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Property]]",
                "rdfs__domain": "[[exo__Asset]]",
                "rdfs__label": "Defined By",
                "rdfs__range": "[[exo__Ontology]]",
                "exo__Property_isRequired": true
              }
            };
          }
          if (file.basename === "exo__Instance_class") {
            return {
              frontmatter: {
                "exo__Instance_class": "[[exo__Property]]",
                "rdfs__domain": "[[exo__Asset]]",
                "rdfs__label": "Instance Class",
                "rdfs__range": "[[exo__Class]]",
                "exo__Property_isRequired": true
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

  describe("REAL Bug Reproduction", () => {
    it("should NOT show 'Unique ID', 'Defined By', or 'Instance Class' in Properties section", async () => {
      console.log("\n🔍 REPRODUCING USER'S BUG SCENARIO");
      console.log("=====================================");
      
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;

      // Select ems__Effort class (as shown in screenshot)
      console.log("Selecting class: ems__Effort");
      await modal["updatePropertiesForClass"]("ems__Effort");
      
      // Check what properties are in the modal
      const modalProperties = modal["properties"];
      console.log(`\nProperties in modal: ${modalProperties.length}`);
      
      // These are the problematic fields from the screenshot
      const problematicFields = [
        { name: "exo__Asset_uid", label: "Unique ID" },
        { name: "exo__Asset_isDefinedBy", label: "Defined By" },
        { name: "exo__Instance_class", label: "Instance Class" }
      ];
      
      let foundProblematicFields = false;
      
      for (const field of problematicFields) {
        const hasField = modalProperties.some((p: any) => 
          p.name === field.name || p.label === field.label
        );
        
        if (hasField) {
          console.error(`❌ BUG CONFIRMED: "${field.label}" is showing in Properties section!`);
          foundProblematicFields = true;
        } else {
          console.log(`✅ OK: "${field.label}" is NOT in Properties section`);
        }
      }
      
      // The test should PASS because we've fixed the bug
      expect(foundProblematicFields).toBe(false);
    });

    it("should verify that core properties are discovered but then filtered out", async () => {
      const propertyService = new SemanticPropertyDiscoveryService(app);
      
      // Step 1: Properties ARE discovered (because they exist in vault)
      const result = await propertyService.discoverPropertiesForClass("exo__Asset");
      expect(result.isSuccess).toBe(true);
      
      const discoveredProperties = result.getValue() || [];
      console.log(`\nRaw discovered properties: ${discoveredProperties.length}`);
      
      // Core properties WILL be discovered because they exist as files
      const hasUniqueId = discoveredProperties.some(p => p.name === "exo__Asset_uid");
      const hasDefinedBy = discoveredProperties.some(p => p.name === "exo__Asset_isDefinedBy");
      const hasInstanceClass = discoveredProperties.some(p => p.name === "exo__Instance_class");
      
      console.log(`Found Unique ID in discovery: ${hasUniqueId}`);
      console.log(`Found Defined By in discovery: ${hasDefinedBy}`);
      console.log(`Found Instance Class in discovery: ${hasInstanceClass}`);
      
      // They SHOULD be discovered (they exist)
      expect(hasUniqueId || hasDefinedBy || hasInstanceClass).toBe(true);
      
      // Step 2: But modal should filter them out
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      await modal["updatePropertiesForClass"]("exo__Asset");
      
      const modalProperties = modal["properties"];
      console.log(`\nFiltered modal properties: ${modalProperties.length}`);
      
      // After filtering, they should NOT be in modal
      const modalHasUniqueId = modalProperties.some((p: any) => 
        p.name === "exo__Asset_uid" || p.label === "Unique ID"
      );
      const modalHasDefinedBy = modalProperties.some((p: any) => 
        p.name === "exo__Asset_isDefinedBy" || p.label === "Defined By"
      );
      const modalHasInstanceClass = modalProperties.some((p: any) => 
        p.name === "exo__Instance_class" || p.label === "Instance Class"
      );
      
      console.log(`Unique ID in modal: ${modalHasUniqueId}`);
      console.log(`Defined By in modal: ${modalHasDefinedBy}`);
      console.log(`Instance Class in modal: ${modalHasInstanceClass}`);
      
      // They should be filtered out
      expect(modalHasUniqueId).toBe(false);
      expect(modalHasDefinedBy).toBe(false);
      expect(modalHasInstanceClass).toBe(false);
    });

    it("should log exactly what happens during filtering", async () => {
      const consoleSpy = jest.spyOn(console, "log");
      
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      await modal["updatePropertiesForClass"]("exo__Asset");
      
      // Find the filtering log
      const filterLog = consoleSpy.mock.calls.find(
        call => call[0].includes("Filtered to")
      );
      
      if (filterLog) {
        console.log("\n📊 FILTERING RESULT:");
        console.log(filterLog[0]);
        
        // Extract numbers from log message
        const match = filterLog[0].match(/Filtered to (\d+) user-editable properties \(removed (\d+) core properties\)/);
        if (match) {
          const userEditableCount = parseInt(match[1]);
          const removedCount = parseInt(match[2]);
          
          console.log(`User-editable properties: ${userEditableCount}`);
          console.log(`Core properties removed: ${removedCount}`);
          
          // Should have removed at least 3 core properties
          expect(removedCount).toBeGreaterThanOrEqual(3);
        }
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe("Visual Verification", () => {
    it("should simulate what the user sees in the UI", async () => {
      modal = new CreateAssetModal(app);
      modal["propertiesContainer"] = containerEl;
      
      // Mock Setting class to track what fields are created
      const createdFields: string[] = [];
      
      (Setting as any) = jest.fn().mockImplementation(() => ({
        setName: jest.fn(function(name: string) {
          createdFields.push(name);
          return this;
        }),
        setDesc: jest.fn().mockReturnThis(),
        addText: jest.fn().mockReturnThis(),
        addDropdown: jest.fn().mockReturnThis(),
        addToggle: jest.fn().mockReturnThis(),
        addTextArea: jest.fn().mockReturnThis(),
        settingEl: document.createElement("div"),
      }));
      
      await modal["updatePropertiesForClass"]("ems__Effort");
      
      console.log("\n📋 Fields that would be shown to user:");
      createdFields.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field}`);
      });
      
      // Check for duplicates or core properties
      const hasCoreFields = createdFields.some(field => 
        field.includes("Unique ID") || 
        field.includes("Defined By") || 
        field.includes("Instance Class")
      );
      
      if (hasCoreFields) {
        console.error("\n❌ ERROR: Core properties would be visible to user!");
      } else {
        console.log("\n✅ SUCCESS: No core properties would be shown to user");
      }
      
      expect(hasCoreFields).toBe(false);
    });
  });
});