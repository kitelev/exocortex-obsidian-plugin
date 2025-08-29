import { SemanticPropertyDiscoveryService } from "../../../../src/domain/services/SemanticPropertyDiscoveryService";
import { App, TFile } from "obsidian";

/**
 * Debug test to see what properties are being discovered
 */
describe("Debug Property Discovery", () => {
  let app: App;
  let propertyService: SemanticPropertyDiscoveryService;

  beforeEach(() => {
    // Create comprehensive mock files
    const mockFiles = [
      // Class file
      {
        name: "exo__Asset.md",
        basename: "exo__Asset",
        path: "exo__Asset.md",
        extension: "md",
      } as TFile,
      // Core property files that might exist
      {
        name: "exo__Asset_uid.md",
        basename: "exo__Asset_uid",
        path: "exo__Asset_uid.md",
        extension: "md",
      } as TFile,
      {
        name: "exo__Asset_isDefinedBy.md",
        basename: "exo__Asset_isDefinedBy",
        path: "exo__Asset_isDefinedBy.md",
        extension: "md",
      } as TFile,
      {
        name: "exo__Instance_class.md",
        basename: "exo__Instance_class",
        path: "exo__Instance_class.md",
        extension: "md",
      } as TFile,
    ];

    app = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue(mockFiles),
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          if (file.basename === "exo__Asset") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Class]]",
                rdfs__label: "Asset",
              },
            };
          }
          
          // Core properties that might be getting picked up
          if (file.basename === "exo__Asset_uid") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[exo__Asset]]",
                rdfs__label: "Unique ID",
                rdfs__range: "string",
                exo__Property_isRequired: true,
              },
            };
          }
          
          if (file.basename === "exo__Asset_isDefinedBy") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[exo__Asset]]",
                rdfs__label: "Defined By",
                rdfs__range: "[[exo__Ontology]]",
                exo__Property_isRequired: true,
              },
            };
          }
          
          if (file.basename === "exo__Instance_class") {
            return {
              frontmatter: {
                exo__Instance_class: "[[exo__Property]]",
                rdfs__domain: "[[exo__Asset]]",
                rdfs__label: "Instance Class",
                rdfs__range: "[[exo__Class]]",
                exo__Property_isRequired: true,
              },
            };
          }
          
          return { frontmatter: {} };
        }),
      },
    } as any;

    propertyService = new SemanticPropertyDiscoveryService(app);
  });

  it("should show what properties are discovered for exo__Asset", async () => {
    const result = await propertyService.discoverPropertiesForClass("exo__Asset");
    
    if (result.isSuccess) {
      const properties = result.getValue() || [];
      
      console.log("\n=== DISCOVERED PROPERTIES FOR exo__Asset ===");
      console.log(`Total properties found: ${properties.length}`);
      console.log("\nProperty details:");
      
      properties.forEach((prop, index) => {
        console.log(`\n${index + 1}. ${prop.label} (${prop.name})`);
        console.log(`   Type: ${prop.type}`);
        console.log(`   Domain: ${prop.domain}`);
        console.log(`   Range: ${prop.range}`);
        console.log(`   Required: ${prop.isRequired}`);
      });
      
      // Check for core properties
      const coreProperties = properties.filter(p => 
        p.name === "exo__Asset_uid" ||
        p.name === "exo__Asset_isDefinedBy" ||
        p.name === "exo__Instance_class"
      );
      
      if (coreProperties.length > 0) {
        console.log("\n⚠️ WARNING: Core properties found in discovered properties!");
        console.log("These should be filtered out in the modal:");
        coreProperties.forEach(p => {
          console.log(`  - ${p.label} (${p.name})`);
        });
      }
    }
  });
});