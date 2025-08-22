import { CreateChildAreaUseCase } from "../../../../src/application/use-cases/CreateChildAreaUseCase";
import { CreateAssetUseCase } from "../../../../src/application/use-cases/CreateAssetUseCase";
import { IAssetRepository } from "../../../../src/domain/repositories/IAssetRepository";
import { Asset } from "../../../../src/domain/entities/Asset";
import { AssetId } from "../../../../src/domain/value-objects/AssetId";
import { ClassName } from "../../../../src/domain/value-objects/ClassName";
import { OntologyPrefix } from "../../../../src/domain/value-objects/OntologyPrefix";
import { Result } from "../../../../src/domain/core/Result";

describe("CreateChildAreaUseCase", () => {
  let useCase: CreateChildAreaUseCase;
  let mockAssetRepository: jest.Mocked<IAssetRepository>;
  let mockCreateAssetUseCase: jest.Mocked<CreateAssetUseCase>;
  let mockParentArea: Asset;

  beforeEach(() => {
    // Setup mock parent area
    const parentId = AssetId.create("parent-area-123").getValue();
    const parentClassName = ClassName.create("ems__Area").getValue();
    const parentOntology = OntologyPrefix.create("ems").getValue();

    mockParentArea = Asset.create({
      id: parentId,
      className: parentClassName,
      ontology: parentOntology,
      label: "Parent Area",
      description: "Test parent area",
      properties: {
        ems__Area_status: "Active"
      }
    }).getValue();

    // Setup mocks
    mockAssetRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByClass: jest.fn(),
      findByProperty: jest.fn(),
      search: jest.fn(),
      updateFrontmatter: jest.fn()
    };

    mockCreateAssetUseCase = {
      execute: jest.fn()
    } as any;

    useCase = new CreateChildAreaUseCase(
      mockAssetRepository,
      mockCreateAssetUseCase
    );
  });

  describe("execute", () => {
    it("should create a child area with parent relationship", async () => {
      // Arrange
      mockAssetRepository.findById.mockResolvedValue(mockParentArea);
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: true,
        assetId: "child-area-456",
        message: "Asset created successfully"
      });

      // Act
      const result = await useCase.execute({
        parentAreaId: "parent-area-123",
        areaTitle: "Child Area Test"
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.areaId).toBe("child-area-456");
      expect(result.message).toContain("Child area created successfully");
      expect(result.message).toContain("Parent Area");

      // Verify CreateAssetUseCase was called with correct parameters
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith({
        title: "Child Area Test",
        className: "ems__Area",
        ontologyPrefix: "ems",
        properties: expect.objectContaining({
          exo__Instance_class: ["[[ems__Area]]"],
          ems__Area_parent: "[[Parent Area]]",
          ems__Area_status: "Active"
        })
      });
    });

    it("should generate default title if not provided", async () => {
      // Arrange
      mockAssetRepository.findById.mockResolvedValue(mockParentArea);
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: true,
        assetId: "child-area-789",
        message: "Asset created successfully"
      });

      // Act
      const result = await useCase.execute({
        parentAreaId: "parent-area-123"
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/^Area - [a-f0-9]{8}$/)
        })
      );
    });

    it("should fail if parent area ID is invalid", async () => {
      // Act
      const result = await useCase.execute({
        parentAreaId: "",
        areaTitle: "Child Area"
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid parent area ID");
    });

    it("should fail if parent area is not found", async () => {
      // Arrange
      mockAssetRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({
        parentAreaId: "non-existent-area",
        areaTitle: "Child Area"
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Parent area not found");
    });

    it("should fail if parent asset is not an area", async () => {
      // Arrange
      const nonAreaAsset = Asset.create({
        id: AssetId.create("project-123").getValue(),
        className: ClassName.create("ems__Project").getValue(),
        ontology: OntologyPrefix.create("ems").getValue(),
        label: "Test Project",
        description: "Not an area",
        properties: {}
      }).getValue();

      mockAssetRepository.findById.mockResolvedValue(nonAreaAsset);

      // Act
      const result = await useCase.execute({
        parentAreaId: "project-123",
        areaTitle: "Child Area"
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Parent asset is not an area");
    });

    it("should propagate CreateAssetUseCase failure", async () => {
      // Arrange
      mockAssetRepository.findById.mockResolvedValue(mockParentArea);
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: false,
        message: "Failed to create asset: Disk full"
      });

      // Act
      const result = await useCase.execute({
        parentAreaId: "parent-area-123",
        areaTitle: "Child Area"
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to create asset: Disk full");
    });

    it("should handle exceptions gracefully", async () => {
      // Arrange
      mockAssetRepository.findById.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      const result = await useCase.execute({
        parentAreaId: "parent-area-123",
        areaTitle: "Child Area"
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to create child area");
      expect(result.message).toContain("Database connection failed");
    });

    it("should include correct properties in generated area", async () => {
      // Arrange
      const mockDate = new Date("2025-01-15T10:30:00");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);

      mockAssetRepository.findById.mockResolvedValue(mockParentArea);
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: true,
        assetId: "child-area-with-props",
        message: "Asset created successfully"
      });

      // Act
      await useCase.execute({
        parentAreaId: "parent-area-123",
        areaTitle: "Area with Properties"
      });

      // Assert
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith({
        title: "Area with Properties",
        className: "ems__Area",
        ontologyPrefix: "ems",
        properties: {
          exo__Asset_uid: expect.stringMatching(
            /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
          ),
          exo__Asset_label: "Area with Properties",
          exo__Asset_isDefinedBy: "[[!ems]]",
          exo__Asset_createdAt: "2025-01-15T10:30:00",
          exo__Instance_class: ["[[ems__Area]]"],
          ems__Area_parent: "[[Parent Area]]",
          ems__Area_status: "Active"
        }
      });

      // Cleanup
      jest.restoreAllMocks();
    });

    it("should pass context information to CreateAssetUseCase", async () => {
      // Arrange
      mockAssetRepository.findById.mockResolvedValue(mockParentArea);
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: true,
        assetId: "child-area-ctx",
        message: "Asset created successfully"
      });

      const context = {
        activeFile: "some-file.md",
        selection: "selected text"
      };

      // Act
      await useCase.execute({
        parentAreaId: "parent-area-123",
        areaTitle: "Area with Context",
        context
      });

      // Assert
      // Verify context is passed through but not used in properties
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Area with Context",
          className: "ems__Area"
        })
      );
    });
  });

  describe("property generation", () => {
    it("should use parent's ontology prefix", async () => {
      // Arrange
      const customOntologyArea = Asset.create({
        id: AssetId.create("custom-area").getValue(),
        className: ClassName.create("ems__Area").getValue(),
        ontology: OntologyPrefix.create("custom").getValue(),
        label: "Custom Ontology Area",
        description: "Area with custom ontology",
        properties: {}
      }).getValue();

      mockAssetRepository.findById.mockResolvedValue(customOntologyArea);
      mockCreateAssetUseCase.execute.mockResolvedValue({
        success: true,
        assetId: "child-custom",
        message: "Asset created successfully"
      });

      // Act
      await useCase.execute({
        parentAreaId: "custom-area",
        areaTitle: "Child of Custom"
      });

      // Assert
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ontologyPrefix: "custom",
          properties: expect.objectContaining({
            exo__Asset_isDefinedBy: "[[!custom]]"
          })
        })
      );
    });
  });
});