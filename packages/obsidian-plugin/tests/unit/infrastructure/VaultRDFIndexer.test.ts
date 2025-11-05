import { VaultRDFIndexer } from "../../../src/infrastructure/VaultRDFIndexer";
import type { App } from "obsidian";

describe("VaultRDFIndexer", () => {
  let indexer: VaultRDFIndexer;
  let mockApp: App;

  beforeEach(() => {
    mockApp = {
      vault: {
        on: jest.fn(),
        off: jest.fn(),
        offref: jest.fn(),
        getAllFiles: jest.fn().mockReturnValue([]),
      },
      metadataCache: {
        on: jest.fn(),
        off: jest.fn(),
      },
    } as unknown as App;

    indexer = new VaultRDFIndexer(mockApp);
  });

  describe("initialization", () => {
    it("should create VaultRDFIndexer instance", () => {
      expect(indexer).toBeDefined();
    });

    it("should be an instance of VaultRDFIndexer", () => {
      expect(indexer).toBeInstanceOf(VaultRDFIndexer);
    });
  });

  describe("public API", () => {
    it("should have initialize method", () => {
      expect(typeof indexer.initialize).toBe("function");
    });

    it("should have updateFile method", () => {
      expect(typeof indexer.updateFile).toBe("function");
    });

    it("should have removeFile method", () => {
      expect(typeof indexer.removeFile).toBe("function");
    });

    it("should have renameFile method", () => {
      expect(typeof indexer.renameFile).toBe("function");
    });

    it("should have refresh method", () => {
      expect(typeof indexer.refresh).toBe("function");
    });

    it("should have getTripleStore method", () => {
      expect(typeof indexer.getTripleStore).toBe("function");
    });

    it("should have dispose method", () => {
      expect(typeof indexer.dispose).toBe("function");
    });
  });
});
