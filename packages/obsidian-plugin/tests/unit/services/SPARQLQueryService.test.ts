import { SPARQLQueryService } from "../../../src/application/services/SPARQLQueryService";
import { VaultRDFIndexer } from "../../../src/infrastructure/VaultRDFIndexer";
import type { App, TFile } from "obsidian";

jest.mock("../../../src/infrastructure/VaultRDFIndexer");

describe("SPARQLQueryService", () => {
  let service: SPARQLQueryService;
  let mockApp: App;
  let mockIndexer: jest.Mocked<VaultRDFIndexer>;

  beforeEach(() => {
    jest.clearAllMocks();

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

    service = new SPARQLQueryService(mockApp);

    mockIndexer = (VaultRDFIndexer as jest.MockedClass<typeof VaultRDFIndexer>).mock.instances[0] as jest.Mocked<VaultRDFIndexer>;
  });

  describe("initialization", () => {
    it("should create SPARQLQueryService instance", () => {
      expect(service).toBeDefined();
    });

    it("should be an instance of SPARQLQueryService", () => {
      expect(service).toBeInstanceOf(SPARQLQueryService);
    });

    it("should create VaultRDFIndexer", () => {
      expect(VaultRDFIndexer).toHaveBeenCalledWith(mockApp);
    });
  });

  describe("public API", () => {
    it("should have initialize method", () => {
      expect(typeof service.initialize).toBe("function");
    });

    it("should have query method", () => {
      expect(typeof service.query).toBe("function");
    });

    it("should have refresh method", () => {
      expect(typeof service.refresh).toBe("function");
    });

    it("should have updateFile method", () => {
      expect(typeof service.updateFile).toBe("function");
    });

    it("should have dispose method", () => {
      expect(typeof service.dispose).toBe("function");
    });
  });

  describe("service methods", () => {
    it("should call initialize on indexer", async () => {
      await service.initialize();
      expect(mockIndexer.initialize).toHaveBeenCalled();
    });

    it("should call refresh on indexer", async () => {
      await service.refresh();
      expect(mockIndexer.refresh).toHaveBeenCalled();
    });

    it("should call updateFile on indexer", async () => {
      const mockFile = { path: "test.md" } as TFile;
      await service.updateFile(mockFile);
      expect(mockIndexer.updateFile).toHaveBeenCalledWith(mockFile);
    });

    it("should call dispose on indexer", async () => {
      await service.dispose();
      expect(mockIndexer.dispose).toHaveBeenCalled();
    });
  });
});
