import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { PathResolver } from "../../../src/utils/PathResolver";
import fs from "fs-extra";

describe("PathResolver", () => {
  const mockVaultRoot = "/test/vault";
  let resolver: PathResolver;
  let existsSyncSpy: jest.SpiedFunction<typeof fs.existsSync>;
  let statSyncSpy: jest.SpiedFunction<typeof fs.statSync>;

  beforeEach(() => {
    resolver = new PathResolver(mockVaultRoot);
    existsSyncSpy = jest.spyOn(fs, "existsSync");
    statSyncSpy = jest.spyOn(fs, "statSync");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("resolve()", () => {
    it("should resolve relative path to vault root", () => {
      const result = resolver.resolve("03 Knowledge/tasks/task.md");
      expect(result).toBe("/test/vault/03 Knowledge/tasks/task.md");
    });

    it("should handle paths with spaces", () => {
      const result = resolver.resolve("My Folder/My File.md");
      expect(result).toBe("/test/vault/My Folder/My File.md");
    });

    it("should accept absolute path within vault", () => {
      const result = resolver.resolve("/test/vault/03 Knowledge/task.md");
      expect(result).toBe("/test/vault/03 Knowledge/task.md");
    });

    it("should throw error for absolute path outside vault", () => {
      expect(() => resolver.resolve("/other/path/task.md")).toThrow(
        "outside vault root",
      );
    });

    it("should normalize paths correctly", () => {
      const result = resolver.resolve("./nested/../file.md");
      expect(result).toContain("file.md");
      expect(result).not.toContain("..");
    });
  });

  describe("validate()", () => {
    it("should pass validation for existing markdown file", () => {
      existsSyncSpy.mockReturnValue(true);
      statSyncSpy.mockReturnValue({ isFile: () => true } as fs.Stats);

      expect(() => resolver.validate("/test/vault/file.md")).not.toThrow();
    });

    it("should throw error if file does not exist", () => {
      existsSyncSpy.mockReturnValue(false);

      expect(() => resolver.validate("/test/vault/missing.md")).toThrow(
        "File not found",
      );
    });

    it("should throw error if path is not a file", () => {
      existsSyncSpy.mockReturnValue(true);
      statSyncSpy.mockReturnValue({ isFile: () => false } as fs.Stats);

      expect(() => resolver.validate("/test/vault/directory")).toThrow(
        "Not a file",
      );
    });

    it("should throw error if file is not markdown", () => {
      existsSyncSpy.mockReturnValue(true);
      statSyncSpy.mockReturnValue({ isFile: () => true } as fs.Stats);

      expect(() => resolver.validate("/test/vault/file.txt")).toThrow(
        "Not a Markdown file",
      );
    });
  });

  describe("getVaultRoot()", () => {
    it("should return vault root path", () => {
      expect(resolver.getVaultRoot()).toBe(mockVaultRoot);
    });
  });
});
