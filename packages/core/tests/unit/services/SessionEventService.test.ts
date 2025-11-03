import { SessionEventService } from "../../../src/services/SessionEventService";
import { IVaultAdapter, IFile } from "../../../src/interfaces/IVaultAdapter";
import { AssetClass } from "../../../src/domain/constants/AssetClass";

describe("SessionEventService", () => {
  let service: SessionEventService;
  let mockVault: jest.Mocked<IVaultAdapter>;

  beforeEach(() => {
    mockVault = {
      getFrontmatter: jest.fn(),
      getAllFiles: jest.fn(),
      read: jest.fn(),
      create: jest.fn(),
      modify: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      updateFrontmatter: jest.fn(),
      rename: jest.fn(),
      createFolder: jest.fn(),
      getFirstLinkpathDest: jest.fn(),
      process: jest.fn(),
    } as jest.Mocked<IVaultAdapter>;

    service = new SessionEventService(mockVault);
  });

  describe("createSessionStartEvent", () => {
    it("should create start event with correct frontmatter", async () => {
      const areaName = "Work";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      const result = await service.createSessionStartEvent(areaName, null);

      expect(mockVault.create).toHaveBeenCalled();
      expect(result).toBe(mockCreatedFile);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath, fileContent] = createCall;

      expect(filePath).toMatch(/^Events\/.+\.md$/);
      expect(fileContent).toContain("exo__Asset_uid:");
      expect(fileContent).toContain("exo__Asset_label: Session Start - Work");
      expect(fileContent).toContain(`"[[${AssetClass.SESSION_START_EVENT}]]"`);
      expect(fileContent).toContain('ems__Session_area: "[[Work]]"');
      expect(fileContent).toContain("ems__SessionEvent_timestamp:");
    });

    it("should use correct timestamp format (ISO 8601)", async () => {
      const areaName = "Personal";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionStartEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [, fileContent] = createCall;

      const timestampMatch = fileContent.match(
        /ems__SessionEvent_timestamp: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,
      );
      expect(timestampMatch).toBeTruthy();
    });

    it("should use area parent folder when areaFile provided", async () => {
      const areaName = "Work";
      const mockAreaFile: IFile = {
        path: "Areas/Work.md",
        basename: "Work",
        name: "Work.md",
        parent: {
          path: "Areas",
          name: "Areas",
        } as any,
      };
      const mockCreatedFile: IFile = {
        path: "Areas/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionStartEvent(areaName, mockAreaFile);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath] = createCall;

      expect(filePath).toMatch(/^Areas\/.+\.md$/);
    });

    it("should default to Events folder when no areaFile", async () => {
      const areaName = "Work";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionStartEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath] = createCall;

      expect(filePath).toMatch(/^Events\/.+\.md$/);
    });

    it("should generate valid UUID for each event", async () => {
      const areaName = "Work";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionStartEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [, fileContent] = createCall;

      const uuidMatch = fileContent.match(
        /exo__Asset_uid: ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
      );
      expect(uuidMatch).toBeTruthy();
    });
  });

  describe("createSessionEndEvent", () => {
    it("should create end event with correct frontmatter", async () => {
      const areaName = "Work";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      const result = await service.createSessionEndEvent(areaName, null);

      expect(mockVault.create).toHaveBeenCalled();
      expect(result).toBe(mockCreatedFile);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath, fileContent] = createCall;

      expect(filePath).toMatch(/^Events\/.+\.md$/);
      expect(fileContent).toContain("exo__Asset_uid:");
      expect(fileContent).toContain("exo__Asset_label: Session End - Work");
      expect(fileContent).toContain(`"[[${AssetClass.SESSION_END_EVENT}]]"`);
      expect(fileContent).toContain('ems__Session_area: "[[Work]]"');
      expect(fileContent).toContain("ems__SessionEvent_timestamp:");
    });

    it("should use same timestamp format as start event", async () => {
      const areaName = "Personal";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionEndEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [, fileContent] = createCall;

      const timestampMatch = fileContent.match(
        /ems__SessionEvent_timestamp: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,
      );
      expect(timestampMatch).toBeTruthy();
    });

    it("should handle null areaFile gracefully", async () => {
      const areaName = "Work";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      await expect(
        service.createSessionEndEvent(areaName, null),
      ).resolves.toBe(mockCreatedFile);
    });

    it("should create files in correct folder path", async () => {
      const areaName = "Work";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionEndEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath] = createCall;

      expect(filePath).toMatch(/^Events\/.+\.md$/);
    });
  });
});
