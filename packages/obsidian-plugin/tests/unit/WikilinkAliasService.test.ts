import { WikilinkAliasService } from "../../src/application/services/WikilinkAliasService";
import { createMockApp, createMockTFile } from "./helpers/testHelpers";

describe("WikilinkAliasService", () => {
  let service: WikilinkAliasService;
  let mockApp: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    mockApp = createMockApp();
    service = new WikilinkAliasService(mockApp, mockApp.metadataCache);
  });

  describe("getAliases", () => {
    it("should return empty array when file has no frontmatter", () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue(null);

      const result = service.getAliases(mockFile);

      expect(result).toEqual([]);
    });

    it("should return empty array when frontmatter has no aliases", () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { title: "Test" },
      });

      const result = service.getAliases(mockFile);

      expect(result).toEqual([]);
    });

    it("should return single alias as array when aliases is a string", () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { aliases: "My Alias" },
      });

      const result = service.getAliases(mockFile);

      expect(result).toEqual(["My Alias"]);
    });

    it("should return aliases array when aliases is an array", () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { aliases: ["Alias One", "Alias Two"] },
      });

      const result = service.getAliases(mockFile);

      expect(result).toEqual(["Alias One", "Alias Two"]);
    });

    it("should filter out non-string values from aliases array", () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { aliases: ["Valid", 123, null, "Also Valid", undefined] },
      });

      const result = service.getAliases(mockFile);

      expect(result).toEqual(["Valid", "Also Valid"]);
    });
  });

  describe("addAlias", () => {
    it("should add alias to file without existing aliases", async () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { title: "Test" },
      });

      await service.addAlias(mockFile, "New Alias");

      expect(mockApp.fileManager.processFrontMatter).toHaveBeenCalledWith(
        mockFile,
        expect.any(Function),
      );

      // Simulate the callback to verify the changes
      const callback = mockApp.fileManager.processFrontMatter.mock.calls[0][1];
      const frontmatter: Record<string, unknown> = {};
      callback(frontmatter);

      expect(frontmatter.aliases).toEqual("New Alias");
    });

    it("should add alias to existing single alias (string)", async () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { aliases: "Existing Alias" },
      });

      await service.addAlias(mockFile, "New Alias");

      const callback = mockApp.fileManager.processFrontMatter.mock.calls[0][1];
      const frontmatter: Record<string, unknown> = {};
      callback(frontmatter);

      expect(frontmatter.aliases).toEqual(["Existing Alias", "New Alias"]);
    });

    it("should add alias to existing aliases array", async () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { aliases: ["Alias One", "Alias Two"] },
      });

      await service.addAlias(mockFile, "Alias Three");

      const callback = mockApp.fileManager.processFrontMatter.mock.calls[0][1];
      const frontmatter: Record<string, unknown> = {};
      callback(frontmatter);

      expect(frontmatter.aliases).toEqual(["Alias One", "Alias Two", "Alias Three"]);
    });

    it("should not add duplicate alias", async () => {
      const mockFile = createMockTFile("test.md");
      mockApp.metadataCache.getFileCache.mockReturnValue({
        frontmatter: { aliases: ["Already Here", "Other Alias"] },
      });

      await service.addAlias(mockFile, "Already Here");

      expect(mockApp.fileManager.processFrontMatter).not.toHaveBeenCalled();
    });
  });
});
