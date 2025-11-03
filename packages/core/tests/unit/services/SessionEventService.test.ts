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

      // Mock !kitelev asset location
      mockVault.getAllFiles.mockReturnValue([]);
      mockVault.create.mockResolvedValue(mockCreatedFile);

      const result = await service.createSessionStartEvent(areaName, null);

      expect(mockVault.create).toHaveBeenCalled();
      expect(result).toBe(mockCreatedFile);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath, fileContent] = createCall;

      expect(filePath).toMatch(/^Events\/.+\.md$/);
      expect(fileContent).toContain("exo__Asset_uid:");
      expect(fileContent).toContain('"[[!kitelev]]"');
      expect(fileContent).toContain(`"[[${AssetClass.SESSION_START_EVENT}]]"`);
      expect(fileContent).toContain('ems__Session_area: "[[Work]]"');
      expect(fileContent).toContain("ems__SessionEvent_timestamp:");
      expect(fileContent).not.toContain("exo__Asset_label");
      expect(fileContent).not.toContain("aliases");
    });

    it("should use correct timestamp format (ISO 8601)", async () => {
      const areaName = "Personal";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.getAllFiles.mockReturnValue([]);
      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionStartEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [, fileContent] = createCall;

      const timestampMatch = fileContent.match(
        /ems__SessionEvent_timestamp: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,
      );
      expect(timestampMatch).toBeTruthy();
    });

    it("should use !kitelev asset folder when found", async () => {
      const areaName = "Work";
      const mockKitelevFile: IFile = {
        path: "People/!kitelev.md",
        basename: "!kitelev",
        name: "!kitelev.md",
        parent: {
          path: "People",
          name: "People",
        } as any,
      };
      const mockCreatedFile: IFile = {
        path: "People/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.getAllFiles.mockReturnValue([mockKitelevFile]);
      mockVault.getFrontmatter.mockReturnValue({
        exo__Asset_uid: "!kitelev",
      });
      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionStartEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath] = createCall;

      expect(filePath).toMatch(/^People\/.+\.md$/);
    });

    it("should default to Events folder when !kitelev not found", async () => {
      const areaName = "Work";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.getAllFiles.mockReturnValue([]);
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

      mockVault.getAllFiles.mockReturnValue([]);
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

      mockVault.getAllFiles.mockReturnValue([]);
      mockVault.create.mockResolvedValue(mockCreatedFile);

      const result = await service.createSessionEndEvent(areaName, null);

      expect(mockVault.create).toHaveBeenCalled();
      expect(result).toBe(mockCreatedFile);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath, fileContent] = createCall;

      expect(filePath).toMatch(/^Events\/.+\.md$/);
      expect(fileContent).toContain("exo__Asset_uid:");
      expect(fileContent).toContain('"[[!kitelev]]"');
      expect(fileContent).toContain(`"[[${AssetClass.SESSION_END_EVENT}]]"`);
      expect(fileContent).toContain('ems__Session_area: "[[Work]]"');
      expect(fileContent).toContain("ems__SessionEvent_timestamp:");
      expect(fileContent).not.toContain("exo__Asset_label");
      expect(fileContent).not.toContain("aliases");
    });

    it("should use same timestamp format as start event", async () => {
      const areaName = "Personal";
      const mockCreatedFile: IFile = {
        path: "Events/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.getAllFiles.mockReturnValue([]);
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

      mockVault.getAllFiles.mockReturnValue([]);
      mockVault.create.mockResolvedValue(mockCreatedFile);

      await expect(
        service.createSessionEndEvent(areaName, null),
      ).resolves.toBe(mockCreatedFile);
    });

    it("should create files in !kitelev folder when found", async () => {
      const areaName = "Work";
      const mockKitelevFile: IFile = {
        path: "People/!kitelev.md",
        basename: "!kitelev",
        name: "!kitelev.md",
        parent: {
          path: "People",
          name: "People",
        } as any,
      };
      const mockCreatedFile: IFile = {
        path: "People/test-uid.md",
        basename: "test-uid",
        name: "test-uid.md",
        parent: null,
      };

      mockVault.getAllFiles.mockReturnValue([mockKitelevFile]);
      mockVault.getFrontmatter.mockReturnValue({
        exo__Asset_uid: "!kitelev",
      });
      mockVault.create.mockResolvedValue(mockCreatedFile);

      await service.createSessionEndEvent(areaName, null);

      const createCall = mockVault.create.mock.calls[0];
      const [filePath] = createCall;

      expect(filePath).toMatch(/^People\/.+\.md$/);
    });
  });
});
