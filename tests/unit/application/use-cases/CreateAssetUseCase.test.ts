import {
  CreateAssetUseCase,
  CreateAssetRequest,
  CreateAssetResponse,
} from "../../../../src/application/use-cases/CreateAssetUseCase";
import { Asset } from "../../../../src/domain/entities/Asset";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";
import { ClassName } from "../../../../src/domain/value-objects/ClassName";
import { OntologyPrefix } from "../../../../src/domain/value-objects/OntologyPrefix";
import { IAssetRepository } from "../../../../src/domain/repositories/IAssetRepository";
import { IOntologyRepository } from "../../../../src/domain/repositories/IOntologyRepository";
import { Ontology } from "../../../../src/domain/entities/Ontology";
import { Result } from "../../../../src/domain/core/Result";

describe("CreateAssetUseCase", () => {
  let useCase: CreateAssetUseCase;
  let mockAssetRepository: jest.Mocked<IAssetRepository>;
  let mockOntologyRepository: jest.Mocked<IOntologyRepository>;

  beforeEach(() => {
    // Setup mock repositories
    mockAssetRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByFilename: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      updateFrontmatterByPath: jest.fn(),
    };

    mockOntologyRepository = {
      save: jest.fn(),
      findByPrefix: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    useCase = new CreateAssetUseCase(
      mockAssetRepository,
      mockOntologyRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    test("should create useCase with repositories", () => {
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    test("should accept valid repositories in constructor", () => {
      const newUseCase = new CreateAssetUseCase(
        mockAssetRepository,
        mockOntologyRepository,
      );
      expect(newUseCase).toBeInstanceOf(CreateAssetUseCase);
    });
  });

  describe("Successful Asset Creation", () => {
    beforeEach(() => {
      // Mock successful ontology lookup
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
        getLabel: () => "Exocortex Core",
      } as Ontology;

      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
      mockAssetRepository.save.mockResolvedValue(undefined);
    });

    test("should create asset successfully with minimal data", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.assetId).toBeDefined();
      expect(response.message).toBe("Created asset: Test Asset");
      expect(mockOntologyRepository.findByPrefix).toHaveBeenCalled();
      expect(mockAssetRepository.save).toHaveBeenCalled();
    });

    test("should create asset with properties", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Task",
        ontologyPrefix: "exo",
        properties: {
          priority: "high",
          status: "active",
          description: "A test task",
        },
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.assetId).toBeDefined();
      expect(response.message).toBe("Created asset: Test Asset");
      expect(mockAssetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            properties: expect.any(Map),
          }),
        }),
      );

      // Verify the properties Map contains the expected values
      const savedAsset = mockAssetRepository.save.mock.calls[0][0];
      expect(savedAsset.props.properties.get("priority")).toBe("high");
      expect(savedAsset.props.properties.get("status")).toBe("active");
      expect(savedAsset.props.properties.get("description")).toBe(
        "A test task",
      );
    });

    test("should handle empty properties object", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: {},
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(mockAssetRepository.save).toHaveBeenCalled();
    });

    test("should handle null properties", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: undefined,
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(mockAssetRepository.save).toHaveBeenCalled();
    });

    test("should generate unique asset IDs", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      const response1 = await useCase.execute(request);
      const response2 = await useCase.execute(request);

      expect(response1.assetId).not.toBe(response2.assetId);
    });

    test("should preserve exact title in response", async () => {
      const specialTitle = "Asset with Special Chars: éñ中文!@#$%^&*()";
      const request: CreateAssetRequest = {
        title: specialTitle,
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      const response = await useCase.execute(request);

      expect(response.message).toBe(`Created asset: ${specialTitle}`);
    });

    test("should handle long titles", async () => {
      const longTitle = "A".repeat(1000);
      const request: CreateAssetRequest = {
        title: longTitle,
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.message).toBe(`Created asset: ${longTitle}`);
    });

    test("should handle complex property values", async () => {
      const request: CreateAssetRequest = {
        title: "Complex Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: {
          tags: ["tag1", "tag2", "tag3"],
          metadata: {
            nested: "value",
            count: 42,
          },
          isActive: true,
          score: 3.14,
          description: null,
          emptyArray: [],
          emptyObject: {},
        },
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(mockAssetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            properties: expect.any(Map),
          }),
        }),
      );

      // Verify the properties Map contains the expected complex values
      const savedAsset = mockAssetRepository.save.mock.calls[0][0];
      expect(savedAsset.props.properties.get("tags")).toEqual([
        "tag1",
        "tag2",
        "tag3",
      ]);
      expect(savedAsset.props.properties.get("metadata")).toEqual({
        nested: "value",
        count: 42,
      });
      expect(savedAsset.props.properties.get("isActive")).toBe(true);
      expect(savedAsset.props.properties.get("score")).toBe(3.14);
      expect(savedAsset.props.properties.get("description")).toBe(null);
      expect(savedAsset.props.properties.get("emptyArray")).toEqual([]);
      expect(savedAsset.props.properties.get("emptyObject")).toEqual({});
    });
  });

  describe("Request Validation", () => {
    beforeEach(() => {
      // Mock successful ontology lookup for valid cases
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
    });

    test("should throw error for empty title", async () => {
      const request: CreateAssetRequest = {
        title: "",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Asset title is required",
      );
    });

    test("should throw error for whitespace-only title", async () => {
      const request: CreateAssetRequest = {
        title: "   \t\n   ",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Asset title is required",
      );
    });

    test("should throw error for missing className", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Asset class is required",
      );
    });

    test("should throw error for null className", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: null as any,
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Asset class is required",
      );
    });

    test("should throw error for missing ontologyPrefix", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Ontology prefix is required",
      );
    });

    test("should throw error for null ontologyPrefix", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: null as any,
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Ontology prefix is required",
      );
    });

    test("should validate multiple fields at once", async () => {
      const request: CreateAssetRequest = {
        title: "",
        className: "",
        ontologyPrefix: "",
      };

      // Should fail on the first validation error (title)
      await expect(useCase.execute(request)).rejects.toThrow(
        "Asset title is required",
      );
    });

    test("should handle undefined request properties", async () => {
      const request = {
        title: "Test Asset",
        // Missing other required properties
      } as CreateAssetRequest;

      await expect(useCase.execute(request)).rejects.toThrow();
    });
  });

  describe("Value Object Creation", () => {
    beforeEach(() => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
    });

    test("should handle valid className creation", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__ValidClass",
        ontologyPrefix: "exo",
      };

      const response = await useCase.execute(request);
      expect(response.success).toBe(true);
    });

    test("should throw error for invalid className format", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "invalid-class-name!@#",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow();
    });

    test("should handle valid ontologyPrefix creation", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "valid",
      };

      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("valid").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);

      const response = await useCase.execute(request);
      expect(response.success).toBe(true);
    });

    test("should throw error for invalid ontologyPrefix format", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "invalid-prefix!@#",
      };

      await expect(useCase.execute(request)).rejects.toThrow();
    });

    test("should handle long but valid identifiers", async () => {
      const longButValidClass = "exo__" + "A".repeat(100);
      const longButValidPrefix = "a" + "b".repeat(50);

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: longButValidClass,
        ontologyPrefix: longButValidPrefix,
      };

      const mockOntology = {
        getPrefix: () => OntologyPrefix.create(longButValidPrefix).getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);

      const response = await useCase.execute(request);
      expect(response.success).toBe(true);
    });
  });

  describe("Ontology Repository Integration", () => {
    test("should verify ontology exists before creating asset", async () => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await useCase.execute(request);

      expect(mockOntologyRepository.findByPrefix).toHaveBeenCalledWith(
        expect.objectContaining({
          value: "exo",
        }),
      );
    });

    test("should throw error when ontology not found", async () => {
      mockOntologyRepository.findByPrefix.mockResolvedValue(null);

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "nonexistent",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Ontology nonexistent not found",
      );
    });

    test("should handle ontology repository errors", async () => {
      mockOntologyRepository.findByPrefix.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Database connection failed",
      );
    });

    test("should handle ontology with different prefix formats", async () => {
      const prefixes = ["exo", "rdfs", "owl", "foaf", "dc"];

      for (const prefix of prefixes) {
        const mockOntology = {
          getPrefix: () => OntologyPrefix.create(prefix).getValue(),
        } as Ontology;
        mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);

        const request: CreateAssetRequest = {
          title: "Test Asset",
          className: `${prefix}__Asset`,
          ontologyPrefix: prefix,
        };

        const response = await useCase.execute(request);
        expect(response.success).toBe(true);
      }
    });
  });

  describe("Asset Repository Integration", () => {
    beforeEach(() => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
    });

    test("should save asset to repository", async () => {
      mockAssetRepository.save.mockResolvedValue(undefined);

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await useCase.execute(request);

      expect(mockAssetRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAssetRepository.save).toHaveBeenCalledWith(expect.any(Asset));
    });

    test("should handle repository save errors", async () => {
      mockAssetRepository.save.mockRejectedValue(new Error("Save failed"));

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Save failed");
    });

    test("should save asset with correct properties", async () => {
      mockAssetRepository.save.mockResolvedValue(undefined);

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Task",
        ontologyPrefix: "exo",
        properties: {
          priority: "high",
          dueDate: "2024-12-31",
        },
      };

      await useCase.execute(request);

      expect(mockAssetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            label: "Test Asset",
            className: expect.objectContaining({
              value: "exo__Task",
            }),
            ontology: expect.objectContaining({
              value: "exo",
            }),
            properties: expect.any(Map),
          }),
        }),
      );
    });

    test("should handle concurrent repository operations", async () => {
      mockAssetRepository.save.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const requests = Array(5)
        .fill(null)
        .map((_, i) => ({
          title: `Test Asset ${i}`,
          className: "exo__Asset",
          ontologyPrefix: "exo",
        }));

      const promises = requests.map((req) => useCase.execute(req));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(5);
      responses.forEach((response) => {
        expect(response.success).toBe(true);
      });
      expect(mockAssetRepository.save).toHaveBeenCalledTimes(5);
    });
  });

  describe("Asset Creation Process", () => {
    beforeEach(() => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
    });

    test("should create asset with generated ID", async () => {
      let savedAsset: Asset;
      mockAssetRepository.save.mockImplementation(async (asset) => {
        savedAsset = asset;
      });

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await useCase.execute(request);

      expect(savedAsset!).toBeDefined();
      expect(savedAsset!.getId()).toBeInstanceOf(AssetId);
      expect(savedAsset!.getId().toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    test("should create asset with correct label", async () => {
      let savedAsset: Asset;
      mockAssetRepository.save.mockImplementation(async (asset) => {
        savedAsset = asset;
      });

      const request: CreateAssetRequest = {
        title: "My Special Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await useCase.execute(request);

      expect(savedAsset!.getTitle()).toBe("My Special Asset");
    });

    test("should create asset with correct class and ontology", async () => {
      let savedAsset: Asset;
      mockAssetRepository.save.mockImplementation(async (asset) => {
        savedAsset = asset;
      });

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Task",
        ontologyPrefix: "exo",
      };

      await useCase.execute(request);

      expect(savedAsset!.getClassName().value).toBe("exo__Task");
      expect(savedAsset!.getOntologyPrefix().value).toBe("exo");
    });

    test("should handle asset creation failure", async () => {
      // Mock Asset.create to return failure
      const originalCreate = Asset.create;
      Asset.create = jest
        .fn()
        .mockReturnValue(Result.fail<Asset>("Asset creation failed"));

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Asset creation failed",
      );

      // Restore original method
      Asset.create = originalCreate;
    });
  });

  describe("Response Generation", () => {
    beforeEach(() => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
      mockAssetRepository.save.mockResolvedValue(undefined);
    });

    test("should return correct response structure", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      const response = await useCase.execute(request);

      expect(response).toEqual({
        success: true,
        assetId: expect.any(String),
        message: "Created asset: Test Asset",
      });
    });

    test("should return valid UUID in assetId", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      const response = await useCase.execute(request);

      expect(response.assetId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    test("should include asset title in success message", async () => {
      const titles = [
        "Simple Asset",
        "Asset with Spaces",
        "Asset-with-Dashes",
        "Asset_with_Underscores",
        "Asset123",
        "Ässet with Ünicode",
      ];

      for (const title of titles) {
        const request: CreateAssetRequest = {
          title,
          className: "exo__Asset",
          ontologyPrefix: "exo",
        };

        const response = await useCase.execute(request);

        expect(response.message).toBe(`Created asset: ${title}`);
      }
    });
  });

  describe("Error Scenarios", () => {
    test("should handle repository timeout", async () => {
      mockOntologyRepository.findByPrefix.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Timeout");
    });

    test("should handle memory constraints", async () => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
      mockAssetRepository.save.mockRejectedValue(new Error("Out of memory"));

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Out of memory");
    });

    test("should handle network errors", async () => {
      mockOntologyRepository.findByPrefix.mockRejectedValue(
        new Error("Network unreachable"),
      );

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Network unreachable",
      );
    });

    test("should handle permission errors", async () => {
      mockAssetRepository.save.mockRejectedValue(
        new Error("Permission denied"),
      );

      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        "Permission denied",
      );
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
      mockAssetRepository.save.mockResolvedValue(undefined);
    });

    test("should handle extremely long property values", async () => {
      const longValue = "A".repeat(10000);
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: {
          longProperty: longValue,
        },
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });

    test("should handle deeply nested property objects", async () => {
      const deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 10; i++) {
        current.level = i;
        current.next = {};
        current = current.next;
      }

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: {
          deepObject,
        },
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });

    test("should handle large number of properties", async () => {
      const properties: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        properties[`prop${i}`] = `value${i}`;
      }

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties,
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });

    test("should handle special property names", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: {
          "": "empty key",
          " ": "space key",
          __proto__: "prototype key",
          constructor: "constructor key",
          toString: "toString key",
          "123": "numeric key",
          "key.with.dots": "dotted key",
          "key-with-dashes": "dashed key",
          key_with_underscores: "underscored key",
        },
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });

    test("should handle circular references in properties", async () => {
      const obj1: any = { name: "obj1" };
      const obj2: any = { name: "obj2", ref: obj1 };
      obj1.ref = obj2; // Create circular reference

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: {
          circular: obj1,
        },
      };

      // This should not throw an error but may serialize differently
      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });

    test("should handle null and undefined mixed properties", async () => {
      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
        properties: {
          nullValue: null,
          undefinedValue: undefined,
          emptyString: "",
          zero: 0,
          false: false,
          emptyArray: [],
          emptyObject: {},
        },
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });
  });

  describe("Performance Tests", () => {
    beforeEach(() => {
      const mockOntology = {
        getPrefix: () => OntologyPrefix.create("exo").getValue(),
      } as Ontology;
      mockOntologyRepository.findByPrefix.mockResolvedValue(mockOntology);
      mockAssetRepository.save.mockResolvedValue(undefined);
    });

    test("should complete within reasonable time", async () => {
      const startTime = Date.now();

      const request: CreateAssetRequest = {
        title: "Test Asset",
        className: "exo__Asset",
        ontologyPrefix: "exo",
      };

      await useCase.execute(request);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle batch operations efficiently", async () => {
      const startTime = Date.now();

      const requests = Array(100)
        .fill(null)
        .map((_, i) => ({
          title: `Test Asset ${i}`,
          className: "exo__Asset",
          ontologyPrefix: "exo",
        }));

      const promises = requests.map((req) => useCase.execute(req));
      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds for 100 operations
    });

    test("should not accumulate memory over multiple executions", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 50; i++) {
        const request: CreateAssetRequest = {
          title: `Test Asset ${i}`,
          className: "exo__Asset",
          ontologyPrefix: "exo",
        };

        await useCase.execute(request);
      }

      // Force garbage collection if possible
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
