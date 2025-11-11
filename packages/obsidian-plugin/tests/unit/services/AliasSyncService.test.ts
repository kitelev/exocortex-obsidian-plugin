import { AliasSyncService } from "../../../src/application/services/AliasSyncService";
import { TFile } from "obsidian";
import { createMockTFile, createMockApp } from "../helpers/testHelpers";

describe("AliasSyncService", () => {
  let service: AliasSyncService;
  let mockApp: any;
  let mockFile: TFile;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = createMockApp();
    mockApp.fileManager = {
      processFrontMatter: jest.fn(),
    };

    service = new AliasSyncService(
      mockApp.vault,
      mockApp.metadataCache,
      mockApp
    );

    mockFile = createMockTFile("test.md");
  });

  describe("initialization", () => {
    it("should create AliasSyncService instance", () => {
      expect(service).toBeDefined();
    });

    it("should be an instance of AliasSyncService", () => {
      expect(service).toBeInstanceOf(AliasSyncService);
    });
  });

  describe("syncAliases", () => {
    describe("Scenario 1: Single alias matching label", () => {
      it("should replace matching alias with new label", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: oldLabel,
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter = {
              exo__Asset_label: newLabel,
              aliases: oldLabel,
            };
            fn(frontmatter);
            expect(frontmatter.aliases).toBe(newLabel);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).toHaveBeenCalled();
      });

      it("should handle single alias in array format", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: [oldLabel],
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter = {
              exo__Asset_label: newLabel,
              aliases: [oldLabel],
            };
            fn(frontmatter);
            expect(frontmatter.aliases).toBe(newLabel);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).toHaveBeenCalled();
      });
    });

    describe("Scenario 2: Multiple aliases, one matching label", () => {
      it("should replace only matching alias", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: ["First Alias", oldLabel, "Third Alias"],
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter = {
              exo__Asset_label: newLabel,
              aliases: ["First Alias", oldLabel, "Third Alias"],
            };
            fn(frontmatter);
            expect(frontmatter.aliases).toEqual([
              "First Alias",
              newLabel,
              "Third Alias",
            ]);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).toHaveBeenCalled();
      });

      it("should preserve other aliases unchanged", async () => {
        const oldLabel = "Project Alpha";
        const newLabel = "Project Beta";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: ["Alpha", "Project Alpha", "PA"],
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter = {
              exo__Asset_label: newLabel,
              aliases: ["Alpha", "Project Alpha", "PA"],
            };
            fn(frontmatter);
            expect(frontmatter.aliases).toEqual([
              "Alpha",
              newLabel,
              "PA",
            ]);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).toHaveBeenCalled();
      });
    });

    describe("Scenario 3: Aliases present but none match label", () => {
      it("should not modify aliases when no match", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: ["Different", "Aliases", "Here"],
          },
        });

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });

      it("should not modify single string alias when no match", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: "Different Alias",
          },
        });

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });
    });

    describe("Edge Cases", () => {
      it("should not modify aliases when oldLabel is null", async () => {
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: newLabel,
            aliases: ["Some", "Aliases"],
          },
        });

        await service.syncAliases(mockFile, null, newLabel);

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });

      it("should not process when frontmatter is missing", async () => {
        mockApp.metadataCache.getFileCache.mockReturnValue(null);

        await service.syncAliases(mockFile, "Old", "New");

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });

      it("should not process when file cache is missing", async () => {
        mockApp.metadataCache.getFileCache.mockReturnValue({});

        await service.syncAliases(mockFile, "Old", "New");

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });

      it("should handle empty aliases array", async () => {
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: "Label",
            aliases: [],
          },
        });

        await service.syncAliases(mockFile, "Old", "New");

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });

      it("should handle aliases field being undefined", async () => {
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: "Label",
          },
        });

        await service.syncAliases(mockFile, "Old", "New");

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });

      it("should handle aliases field being null", async () => {
        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: "Label",
            aliases: null,
          },
        });

        await service.syncAliases(mockFile, "Old", "New");

        expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
      });

      it("should handle mixed type aliases (filter non-strings)", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: ["First", oldLabel, 123, null, "Last"],
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter = {
              exo__Asset_label: newLabel,
              aliases: ["First", oldLabel, 123, null, "Last"],
            };
            fn(frontmatter);
            expect(frontmatter.aliases).toEqual([
              "First",
              newLabel,
              "Last",
            ]);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).toHaveBeenCalled();
      });

      it("should handle case-sensitive matching", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: ["old label", "OLD LABEL", "Old Label"],
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter = {
              exo__Asset_label: newLabel,
              aliases: ["old label", "OLD LABEL", "Old Label"],
            };
            fn(frontmatter);
            expect(frontmatter.aliases).toEqual([
              "old label",
              "OLD LABEL",
              newLabel,
            ]);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(mockApp.fileManager.processFrontMatter).toHaveBeenCalled();
      });
    });

    describe("Format Preservation", () => {
      it("should convert single-element array to string", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: [oldLabel],
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter: any = {
              exo__Asset_label: newLabel,
              aliases: [oldLabel],
            };
            fn(frontmatter);
            expect(typeof frontmatter.aliases).toBe("string");
            expect(frontmatter.aliases).toBe(newLabel);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);
      });

      it("should preserve array format for multiple aliases", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: ["First", oldLabel],
          },
        });

        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter: any = {
              exo__Asset_label: newLabel,
              aliases: ["First", oldLabel],
            };
            fn(frontmatter);
            expect(Array.isArray(frontmatter.aliases)).toBe(true);
            expect(frontmatter.aliases).toEqual(["First", newLabel]);
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);
      });

      it("should handle single-element array to string conversion properly", async () => {
        const oldLabel = "Old Label";
        const newLabel = "New Label";

        mockApp.metadataCache.getFileCache.mockReturnValue({
          frontmatter: {
            exo__Asset_label: oldLabel,
            aliases: [oldLabel],
          },
        });

        let capturedAliases: any;
        mockApp.fileManager.processFrontMatter.mockImplementation(
          async (file: TFile, fn: (frontmatter: any) => void) => {
            const frontmatter: any = {
              exo__Asset_label: newLabel,
              aliases: [oldLabel],
            };
            fn(frontmatter);
            capturedAliases = frontmatter.aliases;
          }
        );

        await service.syncAliases(mockFile, oldLabel, newLabel);

        expect(capturedAliases).toBe(newLabel);
        expect(typeof capturedAliases).toBe("string");
      });
    });
  });
});
