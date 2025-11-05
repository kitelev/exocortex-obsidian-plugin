import { SPARQLQueryService } from "../../../src/application/services/SPARQLQueryService";
import type { App } from "obsidian";

describe("SPARQLQueryService", () => {
  let service: SPARQLQueryService;
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

    service = new SPARQLQueryService(mockApp);
  });

  describe("initialization", () => {
    it("should create SPARQLQueryService instance", () => {
      expect(service).toBeDefined();
    });

    it("should be an instance of SPARQLQueryService", () => {
      expect(service).toBeInstanceOf(SPARQLQueryService);
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
});
