import { TaskStatusService } from "../../src/infrastructure/services/TaskStatusService";
import { TFile, Vault } from "obsidian";

describe("TaskStatusService", () => {
  let service: TaskStatusService;
  let mockVault: jest.Mocked<Vault>;

  beforeEach(() => {
    mockVault = {
      read: jest.fn(),
      modify: jest.fn(),
    } as unknown as jest.Mocked<Vault>;

    service = new TaskStatusService(mockVault);
  });

  describe("markTaskAsDone", () => {
    it("should add status and timestamp to file without frontmatter", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = "Task content";

      mockVault.read.mockResolvedValue(originalContent);

      await service.markTaskAsDone(mockFile);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining('ems__Effort_status: "[[ems__EffortStatusDone]]"'),
      );
      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("ems__Effort_endTimestamp:"),
      );
      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("Task content"),
      );
    });

    it("should update existing status in frontmatter", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
ems__Effort_status: "[[ems__EffortStatusActive]]"
exo__Asset_uid: test-uuid
---
Task content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.markTaskAsDone(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];

      expect(modifiedContent).toContain(
        'ems__Effort_status: "[[ems__EffortStatusDone]]"',
      );
      expect(modifiedContent).not.toContain("ems__EffortStatusActive");
      expect(modifiedContent).toContain("ems__Effort_endTimestamp:");
    });

    it("should add timestamp when status already exists", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
ems__Effort_status: "[[ems__EffortStatusActive]]"
---
Task content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.markTaskAsDone(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];

      expect(modifiedContent).toContain("ems__Effort_endTimestamp:");
      expect(modifiedContent).toMatch(/ems__Effort_endTimestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should update existing timestamp", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
ems__Effort_status: "[[ems__EffortStatusActive]]"
ems__Effort_endTimestamp: 2025-01-01T10:00:00
---
Task content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.markTaskAsDone(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];

      expect(modifiedContent).toContain("ems__Effort_endTimestamp:");
      expect(modifiedContent).not.toContain("2025-01-01T10:00:00");
      expect(modifiedContent).toMatch(/ems__Effort_endTimestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should preserve other frontmatter properties", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
exo__Asset_uid: test-uuid-123
exo__Asset_isDefinedBy: "[[Ontology/EMS]]"
ems__Effort_area: "[[Development]]"
---
Task content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.markTaskAsDone(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];

      expect(modifiedContent).toContain("exo__Asset_uid: test-uuid-123");
      expect(modifiedContent).toContain('exo__Asset_isDefinedBy: "[[Ontology/EMS]]"');
      expect(modifiedContent).toContain('ems__Effort_area: "[[Development]]"');
    });

    it("should generate timestamp in ISO 8601 format without milliseconds", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = `---
ems__Effort_status: "[[ems__EffortStatusActive]]"
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.markTaskAsDone(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];

      const timestampMatch = modifiedContent.match(
        /ems__Effort_endTimestamp: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,
      );
      expect(timestampMatch).toBeTruthy();

      const timestamp = timestampMatch![1];
      expect(timestamp).not.toContain(".");
      expect(timestamp.split("T")[0]).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(timestamp.split("T")[1]).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("archiveTask", () => {
    it("should add archived property to file without frontmatter", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = "Task content";

      mockVault.read.mockResolvedValue(originalContent);

      await service.archiveTask(mockFile);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("archived: true"),
      );
      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("Task content"),
      );
    });

    it("should update existing archived property", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
archived: false
---
Task content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.archiveTask(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];

      expect(modifiedContent).toContain("archived: true");
      expect(modifiedContent).not.toContain("archived: false");
    });

    it("should preserve other frontmatter properties when archiving", async () => {
      const mockFile = { path: "test-task.md" } as TFile;
      const originalContent = `---
exo__Instance_class:
  - "[[ems__Task]]"
ems__Effort_status: "[[ems__EffortStatusDone]]"
ems__Effort_endTimestamp: 2025-10-12T14:30:00
exo__Asset_uid: task-123
---
Content`;

      mockVault.read.mockResolvedValue(originalContent);

      await service.archiveTask(mockFile);

      const modifiedContent = (mockVault.modify as jest.Mock).mock.calls[0][1];

      expect(modifiedContent).toContain(
        'ems__Effort_status: "[[ems__EffortStatusDone]]"',
      );
      expect(modifiedContent).toContain(
        "ems__Effort_endTimestamp: 2025-10-12T14:30:00",
      );
      expect(modifiedContent).toContain("exo__Asset_uid: task-123");
      expect(modifiedContent).toContain("archived: true");
    });
  });
});
