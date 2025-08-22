import { QueryTemplateUseCase } from "../../../../src/application/use-cases/QueryTemplateUseCase";
import { IQueryTemplateRepository } from "../../../../src/domain/repositories/IQueryTemplateRepository";
import {
  QueryTemplate,
  TemplateCategory,
  TemplateMetadata,
} from "../../../../src/domain/visual/QueryTemplate";
import { NodeType } from "../../../../src/domain/visual/VisualQueryNode";

// Mock repository
const mockTemplateRepository: jest.Mocked<IQueryTemplateRepository> = {
  findAll: jest.fn(),
  findByCriteria: jest.fn(),
  findById: jest.fn(),
  findByCategory: jest.fn(),
  findByTags: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  importTemplates: jest.fn(),
  exportTemplates: jest.fn(),
  getBuiltInTemplates: jest.fn(),
  getCustomTemplates: jest.fn(),
  getRecentlyUsed: jest.fn(),
  recordUsage: jest.fn(),
  getUsageStats: jest.fn(),
  refresh: jest.fn(),
};

describe("QueryTemplateUseCase", () => {
  let useCase: QueryTemplateUseCase;
  let mockTemplate: QueryTemplate;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new QueryTemplateUseCase(mockTemplateRepository);

    // Create a mock template
    const mockMetadata: TemplateMetadata = {
      name: "Test Template",
      description: "A test template",
      category: TemplateCategory.EXPLORATION,
      tags: ["test"],
      difficulty: "beginner",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
    };

    mockTemplate = new QueryTemplate({
      id: "test-template",
      metadata: mockMetadata,
      layout: {
        nodes: [
          {
            id: "node1",
            type: NodeType.ENTITY,
            label: "Test Entity",
            position: { x: 100, y: 100 },
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    });
  });

  describe("Template Retrieval", () => {
    it("should get all templates", async () => {
      const mockTemplates = [mockTemplate];
      mockTemplateRepository.findAll.mockResolvedValue(mockTemplates);

      const result = await useCase.getAllTemplates();

      expect(mockTemplateRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTemplates);
    });

    it("should get template by ID", async () => {
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      const result = await useCase.getTemplateById("test-template");

      expect(mockTemplateRepository.findById).toHaveBeenCalledWith(
        "test-template",
      );
      expect(result).toBe(mockTemplate);
    });

    it("should search templates with criteria", async () => {
      const criteria = { category: TemplateCategory.EXPLORATION };
      const mockTemplates = [mockTemplate];
      mockTemplateRepository.findByCriteria.mockResolvedValue(mockTemplates);

      const result = await useCase.searchTemplates(criteria);

      expect(mockTemplateRepository.findByCriteria).toHaveBeenCalledWith(
        criteria,
      );
      expect(result).toEqual(mockTemplates);
    });

    it("should get templates by category", async () => {
      const mockTemplates = [mockTemplate];
      mockTemplateRepository.findByCategory.mockResolvedValue(mockTemplates);

      const result = await useCase.getTemplatesByCategory(
        TemplateCategory.EXPLORATION,
      );

      expect(mockTemplateRepository.findByCategory).toHaveBeenCalledWith(
        TemplateCategory.EXPLORATION,
      );
      expect(result).toEqual(mockTemplates);
    });

    it("should get built-in templates", async () => {
      const mockTemplates = [mockTemplate];
      mockTemplateRepository.getBuiltInTemplates.mockResolvedValue(
        mockTemplates,
      );

      const result = await useCase.getBuiltInTemplates();

      expect(mockTemplateRepository.getBuiltInTemplates).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual(mockTemplates);
    });

    it("should get custom templates", async () => {
      const mockTemplates = [mockTemplate];
      mockTemplateRepository.getCustomTemplates.mockResolvedValue(
        mockTemplates,
      );

      const result = await useCase.getCustomTemplates();

      expect(mockTemplateRepository.getCustomTemplates).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual(mockTemplates);
    });

    it("should get recent templates", async () => {
      const mockTemplates = [mockTemplate];
      mockTemplateRepository.getRecentlyUsed.mockResolvedValue(mockTemplates);

      const result = await useCase.getRecentTemplates(5);

      expect(mockTemplateRepository.getRecentlyUsed).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockTemplates);
    });
  });

  describe("Template Management", () => {
    it("should save a template", async () => {
      mockTemplateRepository.save.mockResolvedValue(mockTemplate);

      const result = await useCase.saveTemplate(mockTemplate);

      expect(mockTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
      expect(result).toBe(mockTemplate);
    });

    it("should prevent saving built-in templates", async () => {
      const builtInTemplate = new QueryTemplate({
        id: "builtin-test",
        metadata: mockTemplate.getMetadata(),
        layout: mockTemplate.getLayout(),
        isBuiltIn: true,
      });

      await expect(useCase.saveTemplate(builtInTemplate)).rejects.toThrow(
        "Cannot save built-in templates",
      );
    });

    it("should create a custom template", async () => {
      const nodes = new Map();
      const edges = new Map();
      const viewport = { x: 0, y: 0, zoom: 1 };

      mockTemplateRepository.create.mockResolvedValue(mockTemplate);

      const result = await useCase.createCustomTemplate(
        nodes,
        edges,
        viewport,
        "Custom Template",
        "A custom template",
        TemplateCategory.CUSTOM,
        ["custom", "test"],
      );

      expect(mockTemplateRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockTemplate);
    });

    it("should clone a template", async () => {
      const clonedTemplate = mockTemplate.clone("cloned-id");

      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.create.mockResolvedValue(clonedTemplate);

      const result = await useCase.cloneTemplate(
        "test-template",
        "Cloned Template",
      );

      expect(mockTemplateRepository.findById).toHaveBeenCalledWith(
        "test-template",
      );
      expect(mockTemplateRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toBe(clonedTemplate);
    });

    it("should throw error when cloning non-existent template", async () => {
      mockTemplateRepository.findById.mockResolvedValue(undefined);

      await expect(useCase.cloneTemplate("nonexistent")).rejects.toThrow(
        "Template with ID nonexistent not found",
      );
    });

    it("should delete a template", async () => {
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.delete.mockResolvedValue(true);

      const result = await useCase.deleteTemplate("test-template");

      expect(mockTemplateRepository.findById).toHaveBeenCalledWith(
        "test-template",
      );
      expect(mockTemplateRepository.delete).toHaveBeenCalledWith(
        "test-template",
      );
      expect(result).toBe(true);
    });

    it("should prevent deleting built-in templates", async () => {
      const builtInTemplate = new QueryTemplate({
        id: "builtin-test",
        metadata: mockTemplate.getMetadata(),
        layout: mockTemplate.getLayout(),
        isBuiltIn: true,
      });

      mockTemplateRepository.findById.mockResolvedValue(builtInTemplate);

      await expect(useCase.deleteTemplate("builtin-test")).rejects.toThrow(
        "Cannot delete built-in templates",
      );
    });
  });

  describe("Template Instantiation", () => {
    it("should instantiate a template with valid parameters", async () => {
      // Mock a template with parameters
      const parameterizedTemplate = new QueryTemplate({
        id: "param-template",
        metadata: mockTemplate.getMetadata(),
        layout: mockTemplate.getLayout(),
        parameters: [
          {
            id: "param1",
            name: "Test Param",
            description: "A test parameter",
            type: "entity",
            required: true,
          },
        ],
      });

      parameterizedTemplate.setParameterValue("param1", "test-value");
      mockTemplateRepository.recordUsage.mockResolvedValue();

      const result = await useCase.instantiateTemplate(parameterizedTemplate);

      expect(mockTemplateRepository.recordUsage).toHaveBeenCalledWith(
        "param-template",
      );
      expect(result).toHaveProperty("nodes");
      expect(result).toHaveProperty("edges");
    });

    it("should throw error when instantiating template with invalid parameters", async () => {
      const parameterizedTemplate = new QueryTemplate({
        id: "param-template",
        metadata: mockTemplate.getMetadata(),
        layout: mockTemplate.getLayout(),
        parameters: [
          {
            id: "param1",
            name: "Test Param",
            description: "A test parameter",
            type: "entity",
            required: true,
          },
        ],
      });

      // Don't set the required parameter

      await expect(
        useCase.instantiateTemplate(parameterizedTemplate),
      ).rejects.toThrow("Template parameters are invalid");
    });
  });

  describe("Import/Export", () => {
    it("should export templates as JSON", async () => {
      const mockExportData = [{ id: "test", name: "Test" }];
      mockTemplateRepository.exportTemplates.mockResolvedValue(mockExportData);

      const result = await useCase.exportTemplates(["test-template"]);

      expect(mockTemplateRepository.exportTemplates).toHaveBeenCalledWith([
        "test-template",
      ]);
      expect(result).toBe(JSON.stringify(mockExportData, null, 2));
    });

    it("should import templates from JSON", async () => {
      const jsonData = JSON.stringify([{ id: "test", name: "Test" }]);
      const mockTemplates = [mockTemplate];
      mockTemplateRepository.importTemplates.mockResolvedValue(mockTemplates);

      const result = await useCase.importTemplates(jsonData);

      expect(mockTemplateRepository.importTemplates).toHaveBeenCalledWith([
        { id: "test", name: "Test" },
      ]);
      expect(result).toEqual(mockTemplates);
    });

    it("should throw error for invalid JSON in import", async () => {
      const invalidJson = "invalid json";

      await expect(useCase.importTemplates(invalidJson)).rejects.toThrow(
        "Failed to import templates",
      );
    });

    it("should throw error for non-array JSON in import", async () => {
      const nonArrayJson = JSON.stringify({ not: "array" });

      await expect(useCase.importTemplates(nonArrayJson)).rejects.toThrow(
        "Invalid JSON format: expected array of templates",
      );
    });
  });

  describe("Statistics and Analytics", () => {
    it("should get usage statistics", async () => {
      const mockStats = {
        usageCount: 5,
        lastUsed: new Date(),
        averageParametersFilled: 2.5,
      };
      mockTemplateRepository.getUsageStats.mockResolvedValue(mockStats);

      const result = await useCase.getUsageStatistics("test-template");

      expect(mockTemplateRepository.getUsageStats).toHaveBeenCalledWith(
        "test-template",
      );
      expect(result).toEqual(mockStats);
    });

    it("should get template preview information", async () => {
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      const result = await useCase.getTemplatePreview("test-template");

      expect(result).toHaveProperty("sparqlQuery");
      expect(result).toHaveProperty("nodeCount");
      expect(result).toHaveProperty("edgeCount");
      expect(result).toHaveProperty("parameterCount");
      expect(result).toHaveProperty("complexity");
      expect(result.nodeCount).toBe(1);
      expect(result.edgeCount).toBe(0);
      expect(result.parameterCount).toBe(0);
    });

    it("should throw error when previewing non-existent template", async () => {
      mockTemplateRepository.findById.mockResolvedValue(undefined);

      await expect(useCase.getTemplatePreview("nonexistent")).rejects.toThrow(
        "Template with ID nonexistent not found",
      );
    });
  });

  describe("Template Validation", () => {
    it("should validate template parameters comprehensively", async () => {
      const parameterizedTemplate = new QueryTemplate({
        id: "param-template",
        metadata: mockTemplate.getMetadata(),
        layout: mockTemplate.getLayout(),
        parameters: [
          {
            id: "required-param",
            name: "Required Parameter",
            description: "A required parameter",
            type: "entity",
            required: true,
          },
          {
            id: "optional-param",
            name: "Optional Parameter",
            description: "An optional parameter",
            type: "literal",
            required: false,
          },
        ],
      });

      const result = await useCase.validateTemplateParameters(
        parameterizedTemplate,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Parameter Required Parameter is required",
      );
      expect(result.missingParameters).toContain("Required Parameter");
      expect(result.invalidParameters).toHaveLength(0);
    });
  });

  describe("Cache Management", () => {
    it("should refresh template cache", async () => {
      mockTemplateRepository.refresh.mockResolvedValue();

      await useCase.refreshTemplateCache();

      expect(mockTemplateRepository.refresh).toHaveBeenCalledTimes(1);
    });
  });
});
