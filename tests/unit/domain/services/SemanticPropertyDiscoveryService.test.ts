import { SemanticPropertyDiscoveryService } from "../../../../src/domain/services/SemanticPropertyDiscoveryService";
import { App, TFile } from "obsidian";

describe("SemanticPropertyDiscoveryService", () => {
  let service: SemanticPropertyDiscoveryService;
  let mockApp: App;

  beforeEach(() => {
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([]),
      },
      metadataCache: {
        getFileCache: jest.fn().mockReturnValue(null),
      },
    } as any;

    service = new SemanticPropertyDiscoveryService(mockApp);
  });

  describe("discoverPropertiesForClass", () => {
    it("should discover properties with matching domain", async () => {
      const mockFiles = [
        { basename: "exo__Asset_label", path: "props/exo__Asset_label.md" },
        { basename: "ems__Area_parent", path: "props/ems__Area_parent.md" },
        { basename: "exo__Property", path: "props/exo__Property.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => {
          if (file.basename === "exo__Asset_label") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                rdfs__domain: "exo__Asset",
                rdfs__label: "Label",
                rdfs__comment: "The label of the asset",
                rdf__type: "exo__DatatypeProperty",
                rdfs__range: "string",
                exo__Property_isRequired: true,
              },
            };
          } else if (file.basename === "ems__Area_parent") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                rdfs__domain: "ems__Area",
                rdfs__label: "Parent Area",
                rdf__type: "exo__ObjectProperty",
                rdfs__range: "[[ems__Area]]",
              },
            };
          }
          return null;
        },
      );

      const result = await service.discoverPropertiesForClass("exo__Asset");

      expect(result.isSuccess).toBe(true);
      const properties = result.getValue()!;

      // Should include core properties and exo__Asset_label
      expect(properties.length).toBeGreaterThan(0);

      const labelProp = properties.find((p) => p.name === "exo__Asset_label");
      expect(labelProp).toBeDefined();
      expect(labelProp?.label).toBe("Label");
      expect(labelProp?.type).toBe("DatatypeProperty");
      expect(labelProp?.isRequired).toBe(true);
    });

    it("should handle wikilink format domains", async () => {
      const mockFiles = [
        { basename: "test__prop", path: "props/test__prop.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[exo__Property]]",
          rdfs__domain: "[[test__Class]]",
          rdfs__label: "Test Property",
        },
      });

      const result = await service.discoverPropertiesForClass("test__Class");

      expect(result.isSuccess).toBe(true);
      const properties = result.getValue()!;
      const testProp = properties.find((p) => p.name === "test__prop");
      expect(testProp).toBeDefined();
    });

    it("should include superclass properties", async () => {
      const mockFiles = [
        { basename: "ems__Area", path: "classes/ems__Area.md" },
        { basename: "exo__Asset_label", path: "props/exo__Asset_label.md" },
        { basename: "ems__Area_parent", path: "props/ems__Area_parent.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => {
          if (file.basename === "ems__Area") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Class",
                rdfs__subClassOf: "exo__Asset",  // Legacy property for backward compatibility
              },
            };
          } else if (file.basename === "exo__Asset_label") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                rdfs__domain: "exo__Asset",  // Legacy property for backward compatibility
                rdfs__label: "Label",
              },
            };
          } else if (file.basename === "ems__Area_parent") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                rdfs__domain: "ems__Area",
                rdfs__label: "Parent Area",
              },
            };
          }
          return null;
        },
      );

      const result = await service.discoverPropertiesForClass("ems__Area");

      expect(result.isSuccess).toBe(true);
      const properties = result.getValue()!;

      // Should include both ems__Area properties and inherited exo__Asset properties
      const labelProp = properties.find((p) => p.name === "exo__Asset_label");
      const parentProp = properties.find((p) => p.name === "ems__Area_parent");

      expect(labelProp).toBeDefined();
      expect(parentProp).toBeDefined();
    });

    it("should prioritize modern exo__Class_superClass and exo__Property_domain", async () => {
      const mockFiles = [
        { basename: "ztlk__FleetingNote", path: "classes/ztlk__FleetingNote.md" },
        { basename: "ztlk__Note", path: "classes/ztlk__Note.md" },
        { basename: "exo__Asset", path: "classes/exo__Asset.md" },
        { basename: "ztlk__FleetingNote_type", path: "props/ztlk__FleetingNote_type.md" },
        { basename: "exo__Asset_label", path: "props/exo__Asset_label.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => {
          if (file.basename === "ztlk__FleetingNote") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Class",
                exo__Class_superClass: ["ztlk__Note"],  // Modern property
                rdfs__subClassOf: "ShouldNotUseThis",  // Legacy - should be ignored when modern exists
              },
            };
          } else if (file.basename === "ztlk__Note") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Class",
                exo__Class_superClass: "exo__Asset",  // Modern property
              },
            };
          } else if (file.basename === "exo__Asset") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Class",
                rdfs__label: "Asset",
              },
            };
          } else if (file.basename === "ztlk__FleetingNote_type") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                exo__Property_domain: "ztlk__FleetingNote",  // Modern property
                rdfs__domain: "ShouldNotUseThis",            // Legacy - should be ignored when modern exists
                rdfs__label: "Note Type",
                rdfs__range: "string",
                exo__Property_options: ["idea", "reference", "question", "task"],
              },
            };
          } else if (file.basename === "exo__Asset_label") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                exo__Property_domain: "exo__Asset",  // Modern property for inherited property
                rdfs__label: "Label",
                rdfs__range: "string",
              },
            };
          }
          return null;
        },
      );

      const result = await service.discoverPropertiesForClass("ztlk__FleetingNote");

      expect(result.isSuccess).toBe(true);
      const properties = result.getValue()!;

      // Should find both the class-specific property and inherited property
      const typeProp = properties.find((p) => p.name === "ztlk__FleetingNote_type");
      const labelProp = properties.find((p) => p.name === "exo__Asset_label");

      expect(typeProp).toBeDefined();
      expect(typeProp?.label).toBe("Note Type");
      expect(typeProp?.domain).toBe("ztlk__FleetingNote");
      expect(typeProp?.options).toEqual(["idea", "reference", "question", "task"]);

      expect(labelProp).toBeDefined();
      expect(labelProp?.label).toBe("Label");
      expect(labelProp?.domain).toBe("exo__Asset");

      // Should have at least these 2 properties
      expect(properties.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty properties when no properties match the domain", async () => {
      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue([]);

      const result = await service.discoverPropertiesForClass("test__Class");

      expect(result.isSuccess).toBe(true);
      const properties = result.getValue()!;

      // Should return empty array when no properties match the domain
      // Core properties are now handled automatically by the Asset entity and CreateAssetModal
      // They are not included in user-editable properties to prevent confusion
      expect(properties).toEqual([]);
    });

    it("should determine property type from rdf__type", async () => {
      const mockFiles = [
        { basename: "prop1", path: "prop1.md" },
        { basename: "prop2", path: "prop2.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => {
          if (file.basename === "prop1") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                rdfs__domain: "test__Class",
                rdf__type: "exo__ObjectProperty",
              },
            };
          } else if (file.basename === "prop2") {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                rdfs__domain: "test__Class",
                rdf__type: "exo__DatatypeProperty",
              },
            };
          }
          return null;
        },
      );

      const result = await service.discoverPropertiesForClass("test__Class");

      expect(result.isSuccess).toBe(true);
      const properties = result.getValue()!;

      const prop1 = properties.find((p) => p.name === "prop1");
      const prop2 = properties.find((p) => p.name === "prop2");

      expect(prop1?.type).toBe("ObjectProperty");
      expect(prop2?.type).toBe("DatatypeProperty");
    });
  });

  describe("getInstancesOfClass", () => {
    it("should find all instances of a class", async () => {
      const mockFiles = [
        { basename: "North Region", path: "areas/North Region.md" },
        { basename: "South Region", path: "areas/South Region.md" },
        { basename: "Other Asset", path: "other/Other Asset.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => {
          if (file.basename.includes("Region")) {
            return {
              frontmatter: {
                exo__Instance_class: "ems__Area",
                rdfs__label: file.basename,
              },
            };
          }
          return {
            frontmatter: {
              exo__Instance_class: "other__Class",
            },
          };
        },
      );

      const result = await service.getInstancesOfClass("ems__Area");

      expect(result.isSuccess).toBe(true);
      const instances = result.getValue()!;

      expect(instances.length).toBe(2);
      expect(instances[0].label).toBe("North Region");
      expect(instances[0].value).toBe("[[North Region]]");
      expect(instances[1].label).toBe("South Region");
      expect(instances[1].value).toBe("[[South Region]]");
    });

    it("should handle wikilink format in instance class", async () => {
      const mockFiles = [
        { basename: "Test Instance", path: "test/Test Instance.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          exo__Instance_class: "[[test__Class]]",
          rdfs__label: "Test Instance",
        },
      });

      const result = await service.getInstancesOfClass("test__Class");

      expect(result.isSuccess).toBe(true);
      const instances = result.getValue()!;
      expect(instances.length).toBe(1);
    });

    it("should sort instances alphabetically by label", async () => {
      const mockFiles = [
        { basename: "Charlie", path: "Charlie.md" },
        { basename: "Alice", path: "Alice.md" },
        { basename: "Bob", path: "Bob.md" },
      ] as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => ({
          frontmatter: {
            exo__Instance_class: "test__Class",
            rdfs__label: file.basename,
          },
        }),
      );

      const result = await service.getInstancesOfClass("test__Class");

      expect(result.isSuccess).toBe(true);
      const instances = result.getValue()!;

      expect(instances.length).toBe(3);
      expect(instances[0].label).toBe("Alice");
      expect(instances[1].label).toBe("Bob");
      expect(instances[2].label).toBe("Charlie");
    });
  });

  describe("performance", () => {
    it("should complete discovery within 500ms for large vaults", async () => {
      const mockFiles = Array.from({ length: 5000 }, (_, i) => ({
        basename: `prop${i}`,
        path: `props/prop${i}.md`,
      })) as TFile[];

      (mockApp.vault.getMarkdownFiles as jest.Mock).mockReturnValue(mockFiles);

      // 50 properties match the domain
      (mockApp.metadataCache.getFileCache as jest.Mock).mockImplementation(
        (file) => {
          const index = parseInt(file.basename.replace("prop", ""));
          if (index < 50) {
            return {
              frontmatter: {
                exo__Instance_class: "exo__Property",
                rdfs__domain: "test__Class",
                rdfs__label: `Property ${index}`,
              },
            };
          }
          return {
            frontmatter: {
              exo__Instance_class: "exo__Property",
              rdfs__domain: "other__Class",
            },
          };
        },
      );

      const startTime = Date.now();
      const result = await service.discoverPropertiesForClass("test__Class");
      const duration = Date.now() - startTime;

      expect(result.isSuccess).toBe(true);
      const properties = result.getValue()!;

      // Should find all 50 matching properties plus core properties
      expect(properties.length).toBeGreaterThanOrEqual(50);

      // Should complete within 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});
