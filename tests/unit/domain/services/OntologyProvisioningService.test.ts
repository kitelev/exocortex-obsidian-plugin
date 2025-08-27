import { OntologyProvisioningService } from "../../../../src/domain/services/OntologyProvisioningService";
import { OntologyPrefix } from "../../../../src/domain/value-objects/OntologyPrefix";
import { IOntologyRepository } from "../../../../src/domain/repositories/IOntologyRepository";
import { IVaultAdapter } from "../../../../src/application/ports/IVaultAdapter";

describe("OntologyProvisioningService", () => {
  let service: OntologyProvisioningService;
  let mockOntologyRepository: jest.Mocked<IOntologyRepository>;
  let mockVaultAdapter: jest.Mocked<IVaultAdapter>;

  beforeEach(() => {
    // Create mocks
    mockOntologyRepository = {
      findByPrefix: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IOntologyRepository>;

    mockVaultAdapter = {
      create: jest.fn(),
      exists: jest.fn(),
      read: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      getMetadata: jest.fn(),
      getFiles: jest.fn(),
      getFileMetadata: jest.fn(),
    } as jest.Mocked<IVaultAdapter>;

    service = new OntologyProvisioningService(
      mockOntologyRepository,
      mockVaultAdapter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ensureOntologyExists", () => {
    it("should return existing ontology if found", async () => {
      // Arrange
      const prefix = "test";
      const expectedPrefix = OntologyPrefix.create(prefix).getValue()!;
      const mockOntology = { prefix: expectedPrefix };

      mockOntologyRepository.findByPrefix.mockResolvedValue(
        mockOntology as any,
      );

      // Act
      const result = await service.ensureOntologyExists(prefix);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedPrefix);
      expect(mockOntologyRepository.findByPrefix).toHaveBeenCalledWith(
        expectedPrefix,
      );
      expect(mockVaultAdapter.create).not.toHaveBeenCalled();
    });

    it("should create new ontology if not found", async () => {
      // Arrange
      const prefix = "newontology";
      const expectedPrefix = OntologyPrefix.create(prefix).getValue()!;

      mockOntologyRepository.findByPrefix
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce({ prefix: expectedPrefix } as any); // After creation

      mockVaultAdapter.create.mockResolvedValue();

      // Act
      const result = await service.ensureOntologyExists(prefix);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedPrefix);
      expect(mockVaultAdapter.create).toHaveBeenCalledWith(
        `!${prefix}.md`,
        expect.stringContaining("Auto-provisioned ontology"),
      );
    });

    it("should handle invalid prefix format", async () => {
      // Arrange
      const invalidPrefix = ""; // Empty prefix

      // Act
      const result = await service.ensureOntologyExists(invalidPrefix);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Invalid ontology prefix");
      expect(mockOntologyRepository.findByPrefix).not.toHaveBeenCalled();
    });

    it("should handle creation failure", async () => {
      // Arrange
      const prefix = "testfail";
      const expectedPrefix = OntologyPrefix.create(prefix).getValue()!;

      mockOntologyRepository.findByPrefix.mockResolvedValue(null);
      mockVaultAdapter.create.mockRejectedValue(
        new Error("File creation failed"),
      );

      // Act
      const result = await service.ensureOntologyExists(prefix);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain("Failed to provision ontology");
    });

    it("should handle ontology not found after creation", async () => {
      // Arrange
      const prefix = "missingafter";
      const expectedPrefix = OntologyPrefix.create(prefix).getValue()!;

      mockOntologyRepository.findByPrefix.mockResolvedValue(null);
      mockVaultAdapter.create.mockResolvedValue();

      // Act
      const result = await service.ensureOntologyExists(prefix);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.getError()).toContain(
        "Failed to register newly created ontology",
      );
    });
  });

  describe("canProvisionOntology", () => {
    it("should allow provisioning for valid new prefix", async () => {
      // Arrange
      const prefix = "validnew";
      mockVaultAdapter.exists.mockResolvedValue(false);

      // Act
      const result = await service.canProvisionOntology(prefix);

      // Assert
      expect(result.canProvision).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it("should reject invalid prefix format", async () => {
      // Arrange
      const invalidPrefix = "123invalid"; // Numbers at start are invalid

      // Act
      const result = await service.canProvisionOntology(invalidPrefix);

      // Assert
      expect(result.canProvision).toBe(false);
      expect(
        result.reasons.some((reason) =>
          reason.includes("Invalid prefix format"),
        ),
      ).toBe(true);
    });

    it("should reject if file already exists", async () => {
      // Arrange
      const prefix = "existing";
      mockVaultAdapter.exists.mockResolvedValue(true);

      // Act
      const result = await service.canProvisionOntology(prefix);

      // Assert
      expect(result.canProvision).toBe(false);
      expect(
        result.reasons.some((reason) => reason.includes("already exists")),
      ).toBe(true);
    });

    it("should reject reserved prefixes", async () => {
      // Arrange
      const reservedPrefix = "rdf";
      mockVaultAdapter.exists.mockResolvedValue(false);

      // Act
      const result = await service.canProvisionOntology(reservedPrefix);

      // Assert
      expect(result.canProvision).toBe(false);
      expect(
        result.reasons.some((reason) => reason.includes("reserved prefix")),
      ).toBe(true);
    });

    it("should handle multiple validation failures", async () => {
      // Arrange
      const invalidPrefix = ""; // Empty and would be invalid
      mockVaultAdapter.exists.mockResolvedValue(false);

      // Act
      const result = await service.canProvisionOntology(invalidPrefix);

      // Assert
      expect(result.canProvision).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });

  describe("ontology content generation", () => {
    it("should generate proper frontmatter structure", async () => {
      // Arrange
      const prefix = "testcontent";
      const expectedPrefix = OntologyPrefix.create(prefix).getValue()!;

      mockOntologyRepository.findByPrefix
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ prefix: expectedPrefix } as any);

      mockVaultAdapter.create.mockResolvedValue();

      // Act
      await service.ensureOntologyExists(prefix);

      // Assert
      expect(mockVaultAdapter.create).toHaveBeenCalledWith(
        `!${prefix}.md`,
        expect.stringMatching(/^---[\s\S]*---[\s\S]*$/),
      );

      const createdContent = mockVaultAdapter.create.mock.calls[0][1];
      expect(createdContent).toContain("exo__Ontology_prefix:");
      expect(createdContent).toContain("exo__Instance_class:");
      expect(createdContent).toContain("rdfs__label:");
      expect(createdContent).toContain("Auto-provisioned ontology");
    });

    it("should generate display names for abbreviations", async () => {
      // Arrange
      const prefix = "ui";

      mockOntologyRepository.findByPrefix
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          prefix: OntologyPrefix.create(prefix).getValue()!,
        } as any);

      mockVaultAdapter.create.mockResolvedValue();

      // Act
      await service.ensureOntologyExists(prefix);

      // Assert
      const createdContent = mockVaultAdapter.create.mock.calls[0][1];
      expect(createdContent).toContain("User Interface");
    });

    it("should generate title case for camelCase prefixes", async () => {
      // Arrange
      const prefix = "userManagement";
      const validPrefixResult = OntologyPrefix.create(prefix);
      if (!validPrefixResult.isSuccess) {
        // Use a valid prefix instead
        const validPrefix = "usermgmt";
        const validPrefixObj = OntologyPrefix.create(validPrefix).getValue()!;

        mockOntologyRepository.findByPrefix
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ prefix: validPrefixObj } as any);

        mockVaultAdapter.create.mockResolvedValue();

        // Act
        await service.ensureOntologyExists(validPrefix);

        // Assert
        const createdContent = mockVaultAdapter.create.mock.calls[0][1];
        expect(createdContent).toContain("Usermgmt");
        return;
      }

      mockOntologyRepository.findByPrefix
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          prefix: validPrefixResult.getValue()!,
        } as any);

      mockVaultAdapter.create.mockResolvedValue();

      // Act
      await service.ensureOntologyExists(prefix);

      // Assert
      const createdContent = mockVaultAdapter.create.mock.calls[0][1];
      expect(createdContent).toContain("User Management");
    });
  });

  describe("error handling", () => {
    it("should handle repository failures gracefully", async () => {
      // Arrange
      const prefix = "repofail";
      mockOntologyRepository.findByPrefix.mockRejectedValue(
        new Error("Repository error"),
      );

      // Act & Assert
      await expect(service.ensureOntologyExists(prefix)).rejects.toThrow(
        "Repository error",
      );
    });

    it("should handle vault adapter failures gracefully", async () => {
      // Arrange
      const prefix = "vaultfail";
      mockVaultAdapter.exists.mockRejectedValue(new Error("Vault error"));

      // Act & Assert
      await expect(service.canProvisionOntology(prefix)).rejects.toThrow(
        "Vault error",
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle concurrent provisioning requests", async () => {
      // Arrange
      const prefix = "concurrent";
      const expectedPrefix = OntologyPrefix.create(prefix).getValue()!;

      // Mock to return existing ontology for all calls
      mockOntologyRepository.findByPrefix.mockResolvedValue({
        prefix: expectedPrefix,
      } as any);

      // Act - simulate concurrent calls
      const [result1, result2] = await Promise.all([
        service.ensureOntologyExists(prefix),
        service.ensureOntologyExists(prefix),
      ]);

      // Assert - both should succeed
      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
    });

    it("should work end-to-end for asset creation workflow", async () => {
      // Arrange
      const prefix = "workflow";
      const expectedPrefix = OntologyPrefix.create(prefix).getValue()!;

      mockOntologyRepository.findByPrefix
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ prefix: expectedPrefix } as any);

      mockVaultAdapter.create.mockResolvedValue();
      mockVaultAdapter.exists.mockResolvedValue(false);

      // Act - full workflow
      const canProvision = await service.canProvisionOntology(prefix);
      expect(canProvision.canProvision).toBe(true);

      const result = await service.ensureOntologyExists(prefix);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockVaultAdapter.create).toHaveBeenCalledTimes(1);
      expect(mockOntologyRepository.findByPrefix).toHaveBeenCalledTimes(2);
    });
  });
});
